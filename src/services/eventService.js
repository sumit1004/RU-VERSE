import { request } from './api';

export const eventService = {
  // Public APIs
  async getPublicEvents(params = {}) {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.search) query.append('search', params.search);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request(`/events${qs}`, { method: 'GET' });
    return res.data?.events || [];
  },

  async getPublicEventBySlug(slug) {
    const res = await request(`/events/${slug}`, { method: 'GET' });
    return res.data?.event || null;
  },

  // Admin APIs
  async getAdminEvents(filters = {}) {
    const query = new URLSearchParams();
    if (filters.search) query.append('search', filters.search);
    if (filters.categoryId) query.append('categoryId', filters.categoryId);
    if (filters.status) query.append('status', filters.status);
    if (filters.registrationType) query.append('registrationType', filters.registrationType);
    if (filters.isFeatured !== undefined) query.append('isFeatured', filters.isFeatured);
    if (filters.isOpenForAll !== undefined) query.append('isOpenForAll', filters.isOpenForAll);
    if (filters.includeArchived) query.append('includeArchived', 'true');
    if (filters.limit) query.append('limit', filters.limit);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const res = await request(`/admin/events${qs}`, { method: 'GET' });
    return res.data?.events || [];
  },

  async getAdminEventById(id) {
    const res = await request(`/admin/events/${id}`, { method: 'GET' });
    return res.data?.event || null;
  },

  async getAdminEvent(id) {
    return this.getAdminEventById(id);
  },

  async createEvent(data) {
    const res = await request('/admin/events', {
      method: 'POST',
      body: data,
    });
    return res.data?.event || null;
  },

  async updateEvent(id, data) {
    const res = await request(`/admin/events/${id}`, {
      method: 'PUT',
      body: data,
    });
    return res.data?.event || null;
  },

  async patchPublish(id, isPublished) {
    const res = await request(`/admin/events/${id}/publish`, {
      method: 'PATCH',
      body: { isPublished },
    });
    return res.data?.event || null;
  },

  async patchEventPublish(id, isPublished) {
    return this.patchPublish(id, isPublished);
  },

  async patchStatus(id, isActive) {
    const res = await request(`/admin/events/${id}/status`, {
      method: 'PATCH',
      body: { isActive },
    });
    return res.data?.event || null;
  },

  async patchEventStatus(id, isActive) {
    return this.patchStatus(id, isActive);
  },

  async patchFeatured(id, isFeatured) {
    const res = await request(`/admin/events/${id}/featured`, {
      method: 'PATCH',
      body: { isFeatured },
    });
    return res.data?.event || null;
  },

  async patchEventFeatured(id, isFeatured) {
    return this.patchFeatured(id, isFeatured);
  },

  async patchOpenForAll(id, isOpenForAll) {
    const res = await request(`/admin/events/${id}/open-for-all`, {
      method: 'PATCH',
      body: { isOpenForAll },
    });
    return res.data?.event || null;
  },

  async patchEventOpenForAll(id, isOpenForAll) {
    return this.patchOpenForAll(id, isOpenForAll);
  },

  async patchArchive(id, archive = true) {
    const res = await request(`/admin/events/${id}/archive`, {
      method: 'PATCH',
      body: { archive },
    });
    return res.data?.event || null;
  },

  async patchEventArchive(id, archive = true) {
    return this.patchArchive(id, archive);
  },

  async deleteEvent(id) {
    const res = await request(`/admin/events/${id}`, {
      method: 'DELETE',
    });
    return res;
  },
};

export default eventService;
