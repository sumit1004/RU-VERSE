import { request } from './api.js';

export const registrationService = {
  // Public APIs
  getRegistrationForm: async (slug) => {
    const res = await request(`/events/${slug}/registration`);
    return res.data;
  },

  submitRegistration: async (slug, payload) => {
    const res = await request(`/events/${slug}/registrations`, {
      method: 'POST',
      body: payload,
    });
    return res.data;
  },

  // Admin APIs
  getRegistrations: async (params = {}) => {
    const query = new URLSearchParams();
    if (params.eventId) query.append('eventId', params.eventId);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.registrationType && params.registrationType !== 'ALL') query.append('registrationType', params.registrationType);
    if (params.search) query.append('search', params.search);
    if (params.from) query.append('from', params.from);
    if (params.to) query.append('to', params.to);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);

    const queryString = query.toString();
    const endpoint = `/admin/registrations${queryString ? `?${queryString}` : ''}`;
    const res = await request(endpoint);
    return res.data;
  },

  getRegistration: async (id) => {
    const res = await request(`/admin/registrations/${id}`);
    return res.data;
  },

  updateRegistrationStatus: async (id, status, notes = null) => {
    const res = await request(`/admin/registrations/${id}/status`, {
      method: 'PATCH',
      body: { status, notes },
    });
    return res.data;
  },

  cancelRegistration: async (id, notes = null) => {
    const res = await request(`/admin/registrations/${id}/cancel`, {
      method: 'PATCH',
      body: { notes },
    });
    return res.data;
  },

  getEventRegistrations: async (eventId, params = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.registrationType && params.registrationType !== 'ALL') query.append('registrationType', params.registrationType);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const queryString = query.toString();
    const endpoint = `/admin/events/${eventId}/registrations${queryString ? `?${queryString}` : ''}`;
    const res = await request(endpoint);
    return res.data;
  },

  getEventRegistrationSummary: async (eventId) => {
    const res = await request(`/admin/events/${eventId}/registration-summary`);
    return res.data;
  },
};

export default registrationService;
