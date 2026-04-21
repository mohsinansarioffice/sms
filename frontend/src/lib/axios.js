import axios from 'axios';
import { getAccessToken } from './sessionTokens';
import { refreshSessionTokens, clearAllAuth } from './authRefresh';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add access token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - unwrap body, refresh on 401
axiosInstance.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Something went wrong';

    if (status === 401 && originalRequest && !originalRequest._retry) {
      const url = String(originalRequest.url || '');
      if (url.includes('/auth/refresh') || url.includes('/auth/login')) {
        await clearAllAuth();
        const err = new Error(message);
        err.response = error.response;
        return Promise.reject(err);
      }
      originalRequest._retry = true;
      try {
        await refreshSessionTokens();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${getAccessToken()}`;
        return axiosInstance(originalRequest);
      } catch {
        await clearAllAuth();
        const err = new Error(message);
        err.response = error.response;
        return Promise.reject(err);
      }
    }

    if (status === 401) {
      await clearAllAuth();
    }

    const err = new Error(message);
    err.response = error.response;
    return Promise.reject(err);
  }
);

export default axiosInstance;
