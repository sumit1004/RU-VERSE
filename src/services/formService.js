import { request } from './api';

export const formService = {
  async getForm(eventId) {
    const res = await request(`/admin/events/${eventId}/form`, {
      method: 'GET',
    });
    return res.data || null;
  },

  async updateFormSettings(eventId, data) {
    const res = await request(`/admin/events/${eventId}/form`, {
      method: 'PUT',
      body: data,
    });
    return res.data?.form || null;
  },

  async addField(eventId, fieldData) {
    const res = await request(`/admin/events/${eventId}/form/fields`, {
      method: 'POST',
      body: fieldData,
    });
    return res.data?.field || null;
  },

  async updateField(eventId, fieldId, fieldData) {
    const res = await request(`/admin/events/${eventId}/form/fields/${fieldId}`, {
      method: 'PUT',
      body: fieldData,
    });
    return res.data?.field || null;
  },

  async deleteField(eventId, fieldId) {
    const res = await request(`/admin/events/${eventId}/form/fields/${fieldId}`, {
      method: 'DELETE',
    });
    return res;
  },

  async reorderFields(eventId, fieldOrders) {
    const res = await request(`/admin/events/${eventId}/form/fields/reorder`, {
      method: 'PATCH',
      body: { fieldOrders },
    });
    return res.data?.fields || [];
  },

  async publishForm(eventId) {
    const res = await request(`/admin/events/${eventId}/form/publish`, {
      method: 'PATCH',
    });
    return res.data?.form || null;
  },
};

export default formService;
