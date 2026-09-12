import axios from 'axios';

/**
 * GreenSync Centralized API Client
 * Note: This is the ONLY place axios is configured in the frontend.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach authentication token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Centralized response envelope unboxing & error handling
api.interceptors.response.use(
  (response) => {
    // If backend uses standard envelope { success, data, message }, unwrap data
    if (response.data && response.data.success !== undefined && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    // Expired token (401 on a protected call) -> Clear credentials per Section 28
    if (error.response?.status === 401) {
      const pathname = window.location.pathname;
      const isAuthRoute = pathname.includes('sign-in') || pathname.includes('login') ||
                          pathname.includes('sign-up') || pathname.includes('register');
      if (!isAuthRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('cached_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
