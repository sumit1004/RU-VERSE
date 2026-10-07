import { prisma } from '../config/database.js';

/**
 * Audit Logging Service
 * Records system actions and audit trails immutably
 */
export const createAuditLog = async ({
  actorUserId = null,
  action,
  entityType = null,
  entityId = null,
  eventId = null,
  metadata = null,
  req = null,
}) => {
  try {
    let ipAddress = null;
    let userAgent = null;

    if (req) {
      ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || req.ip;
      userAgent = req.headers['user-agent']?.slice(0, 255) || null;
    }

    return await prisma.auditLog.create({
      data: {
        actorUserId: actorUserId || null,
        action,
        entityType: entityType ? String(entityType).toUpperCase() : null,
        entityId: entityId ? String(entityId) : null,
        eventId: eventId ? parseInt(eventId, 10) || null : null,
        metadataJson: metadata || null,
        ipAddress: ipAddress ? String(ipAddress).slice(0, 100) : null,
        userAgent,
      },
    });
  } catch (err) {
    // Non-blocking log failure protection
    console.error('[Audit Log Error]: Failed to persist audit log:', err.message);
    return null;
  }
};

/**
 * Get paginated audit logs for admin review
 */
export const getAuditLogs = async ({
  actorUserId,
  action,
  entityType,
  eventId,
  from,
  to,
  search,
  page = 1,
  limit = 25,
} = {}) => {
  const whereClause = {};

  if (actorUserId) {
    const uid = parseInt(actorUserId, 10);
    if (!isNaN(uid)) whereClause.actorUserId = uid;
  }

  if (action) {
    whereClause.action = action;
  }

  if (entityType) {
    whereClause.entityType = String(entityType).toUpperCase();
  }

  if (eventId) {
    const eid = parseInt(eventId, 10);
    if (!isNaN(eid)) whereClause.eventId = eid;
  }

  if (from || to) {
    whereClause.createdAt = {};
    if (from) whereClause.createdAt.gte = new Date(from);
    if (to) whereClause.createdAt.lte = new Date(to);
  }

  if (search && search.trim()) {
    const term = search.trim();
    whereClause.OR = [
      { action: { contains: term } },
      { entityType: { contains: term } },
      { entityId: { contains: term } },
      { ipAddress: { contains: term } },
      { actor: { name: { contains: term } } },
      { actor: { email: { contains: term } } },
    ];
  }

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 25));
  const skip = (parsedPage - 1) * parsedLimit;

  const [total, items] = await Promise.all([
    prisma.auditLog.count({ where: whereClause }),
    prisma.auditLog.findMany({
      where: whereClause,
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: { select: { name: true, slug: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parsedLimit,
    }),
  ]);

  return {
    items,
    pagination: {
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};
