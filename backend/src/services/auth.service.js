import { prisma } from '../config/database.js';
import { comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';
import { createAuditLog } from './audit.service.js';

export const loginUser = async ({ email, password }, req = null) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
      userPermissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  if (!user) {
    await createAuditLog({
      action: 'LOGIN_FAILED',
      entityType: 'USER',
      metadata: { email: normalizedEmail, reason: 'User not found' },
      req,
    });
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  if (user.status !== 'ACTIVE') {
    await createAuditLog({
      actorUserId: user.id,
      action: 'LOGIN_FAILED',
      entityType: 'USER',
      entityId: user.id,
      metadata: { email: normalizedEmail, reason: 'Account deactivated' },
      req,
    });
    const error = new Error('Account is deactivated. Please contact the administrator.');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    await createAuditLog({
      actorUserId: user.id,
      action: 'LOGIN_FAILED',
      entityType: 'USER',
      entityId: user.id,
      metadata: { email: normalizedEmail, reason: 'Wrong password' },
      req,
    });
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  // Update last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Aggregate permissions
  const permissionsSet = new Set();
  if (user.role?.rolePermissions) {
    user.role.rolePermissions.forEach((rp) => {
      if (rp.permission?.slug) permissionsSet.add(rp.permission.slug);
    });
  }
  if (user.userPermissions) {
    user.userPermissions.forEach((up) => {
      if (up.permission?.slug) permissionsSet.add(up.permission.slug);
    });
  }

  const permissions = Array.from(permissionsSet);

  const token = generateToken({
    userId: user.id,
    email: user.email,
    roleId: user.roleId,
  });

  await createAuditLog({
    actorUserId: user.id,
    action: 'LOGIN_SUCCESS',
    entityType: 'USER',
    entityId: user.id,
    metadata: { email: user.email, role: user.role.slug },
    req,
  });

  const userData = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: {
      id: user.role.id,
      name: user.role.name,
      slug: user.role.slug,
    },
    permissions,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };

  return { token, user: userData };
};

export const getUserById = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      },
      userPermissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  if (!user || user.status !== 'ACTIVE') {
    return null;
  }

  const permissionsSet = new Set();
  if (user.role?.rolePermissions) {
    user.role.rolePermissions.forEach((rp) => {
      if (rp.permission?.slug) permissionsSet.add(rp.permission.slug);
    });
  }
  if (user.userPermissions) {
    user.userPermissions.forEach((up) => {
      if (up.permission?.slug) permissionsSet.add(up.permission.slug);
    });
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: {
      id: user.role.id,
      name: user.role.name,
      slug: user.role.slug,
    },
    permissions: Array.from(permissionsSet),
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
};
