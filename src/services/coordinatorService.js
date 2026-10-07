import { request } from './api.js';

export const coordinatorService = {
  getCoordinators: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const qs = query.toString();
    const res = await request(`/admin/coordinators${qs ? `?${qs}` : ''}`);
    return res.data;
  },

  getCoordinator: async (id) => {
    const res = await request(`/admin/coordinators/${id}`);
    return res.data;
  },

  createCoordinator: async (data) => {
    const res = await request('/admin/coordinators', {
      method: 'POST',
      body: data,
    });
    return res.data;
  },

  updateCoordinator: async (id, data) => {
    const res = await request(`/admin/coordinators/${id}`, {
      method: 'PUT',
      body: data,
    });
    return res.data;
  },

  resetPassword: async (id, newPassword) => {
    const res = await request(`/admin/coordinators/${id}/password`, {
      method: 'PATCH',
      body: { newPassword },
    });
    return res.data;
  },

  getPermissions: async (id) => {
    const res = await request(`/admin/coordinators/${id}/permissions`);
    return res.data;
  },

  updatePermissions: async (id, permissions) => {
    const res = await request(`/admin/coordinators/${id}/permissions`, {
      method: 'PATCH',
      body: { permissions },
    });
    return res.data;
  },

  getEvents: async (id) => {
    const res = await request(`/admin/coordinators/${id}/events`);
    return res.data;
  },

  updateEvents: async (id, eventIds) => {
    const res = await request(`/admin/coordinators/${id}/events`, {
      method: 'PATCH',
      body: { eventIds },
    });
    return res.data;
  },
};

export default coordinatorService;
