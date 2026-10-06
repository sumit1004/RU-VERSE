import { request } from './api';

export const authService = {
  async login(email, password) {
    const res = await request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    return res.data?.user || null;
  },

  async logout() {
    const res = await request('/auth/logout', {
      method: 'POST',
    });
    return res;
  },

  async getMe() {
    const res = await request('/auth/me', {
      method: 'GET',
    });
    return res.data?.user || null;
  },
};

export default authService;
