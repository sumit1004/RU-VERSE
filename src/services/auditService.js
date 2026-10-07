import { request } from './api.js';

export const auditService = {
  getAuditLogs: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.action) query.append('action', params.action);
    if (params.entityType) query.append('entityType', params.entityType);
    if (params.eventId) query.append('eventId', params.eventId);
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const qs = query.toString();
    const res = await request(`/admin/audit-logs${qs ? `?${qs}` : ''}`);
    return res.data;
  },
};

export default auditService;
