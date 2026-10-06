import { request } from './api';

export const categoryService = {
  // Public
  async getPublicCategories() {
    const res = await request('/categories', { method: 'GET' });
    return res.data?.categories || [];
  },

  // Admin
  async getAdminCategories() {
    const res = await request('/admin/categories', { method: 'GET' });
    return res.data?.categories || [];
  },

  async getCategory(id) {
    const res = await request(`/admin/categories/${id}`, { method: 'GET' });
    return res.data?.category || null;
  },

  async createCategory(data) {
    const res = await request('/admin/categories', {
      method: 'POST',
      body: data,
    });
    return res.data?.category || null;
  },

  async updateCategory(id, data) {
    const res = await request(`/admin/categories/${id}`, {
      method: 'PUT',
      body: data,
    });
    return res.data?.category || null;
  },

  async patchCategoryStatus(id, isActive) {
    const res = await request(`/admin/categories/${id}/status`, {
      method: 'PATCH',
      body: { isActive },
    });
    return res.data?.category || null;
  },

  async deleteCategory(id) {
    const res = await request(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
    return res;
  },
};

export default categoryService;
