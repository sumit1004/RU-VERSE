import * as auditService from '../services/audit.service.js';
import { sendSuccess } from '../utils/response.js';

export const getAuditLogs = async (req, res, next) => {
  try {
    const {
      actorUserId,
      action,
      entityType,
      eventId,
      from,
      to,
      search,
      page,
      limit,
    } = req.query;

    const data = await auditService.getAuditLogs({
      actorUserId,
      action,
      entityType,
      eventId,
      from,
      to,
      search,
      page,
      limit,
    });

    return sendSuccess(res, 'Audit logs retrieved successfully.', data);
  } catch (err) {
    next(err);
  }
};
