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

// Response Interceptor: Centralized error handling preserving status & code
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const errorData = error.response?.data;
    const backendMessage = errorData?.message || errorData?.error?.message;
    const backendCode = errorData?.error?.code || errorData?.code;
    
    const err = new Error(backendMessage || error.message || 'An error occurred');
    err.status = status;
    err.code = backendCode;
    err.data = errorData;
    err.isNetworkError = !error.response;
    
    return Promise.reject(err);
  }
);

export default api;
