/**
 * Centralized API Client for RUVERSE Frontend
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(message, status = 500, errors = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

export async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
    credentials: 'include', // Include HTTP-only authentication cookies
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(url, config);
    let data;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = { message: await res.text() };
    }

    if (!res.ok || data.success === false) {
      throw new ApiError(
        data.message || `Request failed with status ${res.status}`,
        res.status,
        data.errors || null
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error.message || 'Network connection failed. Please ensure backend server is running.',
      0
    );
  }
}

export default { request };
