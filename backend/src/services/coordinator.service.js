import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { createAuditLog } from './audit.service.js';

/**
 * Get paginated list of coordinators
 */
export const getCoordinators = async ({
  search,
  status,
  page = 1,
  limit = 25,
} = {}) => {
  const coordinatorRole = await prisma.role.findUnique({
    where: { slug: 'coordinator' },
  });

  if (!coordinatorRole) {
    return { items: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } };
  }

  const whereClause = {
    roleId: coordinatorRole.id,
  };

  if (status && status !== 'ALL') {
    whereClause.status = status;
  }

  if (search && search.trim()) {
    const term = search.trim();
    whereClause.OR = [
      { name: { contains: term } },
      { email: { contains: term } },
    ];
  }

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
  const skip = (parsedPage - 1) * parsedLimit;

  const [total, items] = await Promise.all([
    prisma.user.count({ where: whereClause }),
    prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        role: { select: { id: true, name: true, slug: true } },
        userPermissions: {
          include: {
            permission: { select: { id: true, name: true, slug: true, module: true } },
          },
        },
        coordinatorEvents: {
          include: {
            event: { select: { id: true, title: true, slug: true, isPublished: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parsedLimit,
    }),
  ]);

  return {
    items: items.map((u) => ({
      ...u,
      permissions: u.userPermissions.map((up) => up.permission),
      assignedEvents: u.coordinatorEvents.map((ce) => ce.event),
    })),
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

/**
 * Get detailed coordinator by ID
 */
export const getCoordinatorById = async (id) => {
  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    const error = new Error('Invalid coordinator ID.');
    error.statusCode = 400;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      role: { select: { id: true, name: true, slug: true } },
      userPermissions: {
        include: {
          permission: { select: { id: true, name: true, slug: true, module: true, description: true } },
        },
      },
      coordinatorEvents: {
        include: {
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              venue: true,
              startDateTime: true,
              isPublished: true,
              isActive: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!user || user.role.slug !== 'coordinator') {
    const error = new Error('Coordinator not found.');
    error.statusCode = 404;
    throw error;
  }

  return {
    ...user,
    permissions: user.userPermissions.map((up) => up.permission),
    assignedEvents: user.coordinatorEvents.map((ce) => ce.event),
  };
};

/**
 * Create a new coordinator account
 */
export const createCoordinator = async (data, adminUserId, req = null) => {
  const existing = await prisma.user.findUnique({
    where: { email: data.email.trim().toLowerCase() },
  });

  if (existing) {
    const error = new Error('A user account with this email address already exists.');
    error.statusCode = 409;
    throw error;
  }

  const coordinatorRole = await prisma.role.findUnique({
    where: { slug: 'coordinator' },
  });

  if (!coordinatorRole) {
    const error = new Error('Coordinator role is not configured in the database.');
    error.statusCode = 500;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const newCoordinator = await prisma.$transaction(async (tx) => {
    // 1. Create User
    const user = await tx.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: hashedPassword,
        roleId: coordinatorRole.id,
        status: data.status || 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });

    // 2. Assign Default or Specified Permissions
    const requestedPermissions = Array.isArray(data.permissions) && data.permissions.length > 0
      ? data.permissions
      : ['dashboard.view', 'events.view', 'forms.view', 'registrations.view'];

    const perms = await tx.permission.findMany({
      where: { slug: { in: requestedPermissions } },
    });

    for (const perm of perms) {
      await tx.userPermission.create({
        data: {
          userId: user.id,
          permissionId: perm.id,
        },
      });
    }

    // 3. Assign Events if provided
    if (Array.isArray(data.eventIds) && data.eventIds.length > 0) {
      for (const eid of data.eventIds) {
        await tx.eventCoordinator.create({
          data: {
            eventId: eid,
            userId: user.id,
          },
        });
      }
    }

    return user;
  });

  // Create Audit Log
  await createAuditLog({
    actorUserId: adminUserId,
    action: 'COORDINATOR_CREATED',
    entityType: 'COORDINATOR',
    entityId: newCoordinator.id,
    metadata: {
      name: newCoordinator.name,
      email: newCoordinator.email,
      status: newCoordinator.status,
    },
    req,
  });

  return newCoordinator;
};

/**
 * Update coordinator basic information or status
 */
export const updateCoordinator = async (id, data, adminUserId, req = null) => {
  const coordinator = await getCoordinatorById(id);

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.status !== undefined) {
    updateData.status = data.status;
  } else if (data.isActive !== undefined) {
    updateData.status = data.isActive ? 'ACTIVE' : 'INACTIVE';
  }

  const updated = await prisma.user.update({
    where: { id: coordinator.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      updatedAt: true,
    },
  });

  await createAuditLog({
    actorUserId: adminUserId,
    action: data.status === 'INACTIVE' ? 'COORDINATOR_DEACTIVATED' : 'COORDINATOR_UPDATED',
    entityType: 'COORDINATOR',
    entityId: coordinator.id,
    metadata: {
      previousStatus: coordinator.status,
      newStatus: updated.status,
      name: updated.name,
    },
    req,
  });

  return updated;
};

/**
 * Reset coordinator password
 */
export const resetCoordinatorPassword = async (id, newPassword, adminUserId, req = null) => {
  const coordinator = await getCoordinatorById(id);

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { id: coordinator.id },
    data: { password: hashedPassword },
  });

  await createAuditLog({
    actorUserId: adminUserId,
    action: 'COORDINATOR_PASSWORD_RESET',
    entityType: 'COORDINATOR',
    entityId: coordinator.id,
    metadata: { email: coordinator.email },
    req,
  });

  return { success: true, message: 'Password has been reset successfully.' };
};

/**
 * Get all permissions matrix for a coordinator
 */
export const getCoordinatorPermissions = async (id) => {
  const coordinator = await getCoordinatorById(id);

  const allPermissions = await prisma.permission.findMany({
    orderBy: [{ module: 'asc' }, { name: 'asc' }],
  });

  const assignedSlugs = coordinator.permissions.map((p) => p.slug);

  return {
    allPermissions,
    assignedSlugs,
  };
};

/**
 * Update coordinator permissions
 */
export const updateCoordinatorPermissions = async (id, permissionSlugs, adminUserId, req = null) => {
  const coordinator = await getCoordinatorById(id);

  const validPerms = await prisma.permission.findMany({
    where: { slug: { in: permissionSlugs } },
  });

  await prisma.$transaction(async (tx) => {
    await tx.userPermission.deleteMany({
      where: { userId: coordinator.id },
    });

    for (const perm of validPerms) {
      await tx.userPermission.create({
        data: {
          userId: coordinator.id,
          permissionId: perm.id,
        },
      });
    }
  });

  await createAuditLog({
    actorUserId: adminUserId,
    action: 'COORDINATOR_PERMISSIONS_UPDATED',
    entityType: 'COORDINATOR',
    entityId: coordinator.id,
    metadata: {
      assignedSlugs: validPerms.map((p) => p.slug),
    },
    req,
  });

  return {
    success: true,
    assignedPermissions: validPerms,
  };
};

/**
 * Get all events matrix for coordinator assignment
 */
export const getCoordinatorEvents = async (id) => {
  const coordinator = await getCoordinatorById(id);

  const allEvents = await prisma.event.findMany({
    where: { archivedAt: null },
    select: {
      id: true,
      title: true,
      slug: true,
      venue: true,
      startDateTime: true,
      isPublished: true,
      category: { select: { id: true, name: true } },
    },
    orderBy: { startDateTime: 'asc' },
  });

  const assignedEventIds = coordinator.assignedEvents.map((ev) => ev.id);

  return {
    allEvents,
    assignedEventIds,
  };
};

/**
 * Update coordinator event assignments
 */
export const updateCoordinatorEvents = async (id, eventIds, adminUserId, req = null) => {
  const coordinator = await getCoordinatorById(id);

  const validEvents = await prisma.event.findMany({
    where: { id: { in: eventIds }, archivedAt: null },
    select: { id: true, title: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.eventCoordinator.deleteMany({
      where: { userId: coordinator.id },
    });

    for (const ev of validEvents) {
      await tx.eventCoordinator.create({
        data: {
          userId: coordinator.id,
          eventId: ev.id,
        },
      });
    }
  });

  await createAuditLog({
    actorUserId: adminUserId,
    action: 'COORDINATOR_EVENTS_UPDATED',
    entityType: 'COORDINATOR',
    entityId: coordinator.id,
    metadata: {
      assignedEventIds: validEvents.map((e) => e.id),
      assignedEventTitles: validEvents.map((e) => e.title),
    },
    req,
  });

  return {
    success: true,
    assignedEvents: validEvents,
  };
};
