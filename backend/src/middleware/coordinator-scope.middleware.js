import { prisma } from '../config/database.js';
import { sendError } from '../utils/response.js';

/**
 * Middleware: Verify if the authenticated user has access to a specific event
 *
 * Architecture Flow:
 * Coordinator Login
 *        ↓
 * Authenticated User
 *        ↓
 * Role = COORDINATOR
 *        ↓
 * Check Permission (Handled by requirePermission)
 *        ↓
 * Check Assigned Event (Handled here)
 *        ↓
 * Allow / Deny
 */
export const requireEventAccess = (paramName = 'eventId', paramType = 'event') => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return sendError(res, 'Authentication required.', 401);
      }

      // 1. If Admin role, bypass event-level scoping (full festival admin)
      if (user.role?.slug === 'admin') {
        return next();
      }

      // 2. If Coordinator role, check assigned event
      let eventId = null;
      const isRegistrationIdParam =
        paramType === 'registration' ||
        (req.baseUrl === '/api/admin/registrations' && (paramName === 'id' || req.params.id !== undefined));

      if (isRegistrationIdParam) {
        const rawId = req.params[paramName] || req.params.id;
        const regId = parseInt(rawId, 10);
        if (!isNaN(regId)) {
          const reg = await prisma.registration.findUnique({
            where: { id: regId },
            select: { eventId: true },
          });
          if (reg) {
            eventId = reg.eventId;
          }
        }
      } else {
        eventId = req.params[paramName] || req.params.eventId || req.query.eventId || req.body.eventId;
      }

      const parsedEventId = parseInt(eventId, 10);
      if (!parsedEventId || isNaN(parsedEventId)) {
        return sendError(res, 'A valid event identifier is required for coordinator authorization.', 400);
      }

      // Check assignment in event_coordinators table
      const assignment = await prisma.eventCoordinator.findUnique({
        where: {
          eventId_userId: {
            eventId: parsedEventId,
            userId: user.id,
          },
        },
      });

      if (!assignment) {
        return sendError(res, 'Access denied: You are not assigned as a coordinator for this event.', 403);
      }

      req.assignedEventId = parsedEventId;
      next();
    } catch (err) {
      next(err);
    }
  };
};
