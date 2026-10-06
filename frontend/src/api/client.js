/**
 * Axios API HTTP Client Configuration and Interceptors.
 * Automatically resolves production Render backend with resilient auto-retry on cold-starts.
 */
import axios from 'axios';

export const getApiBaseURL = () => {
  // 1. Explicit Vite environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. Runtime browser detection
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;

    // Desktop/Local machine
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000/api/v1';
    }

    // Phone / Tablet connected to local Wi-Fi / LAN
    if (/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname)) {
      return `http://${hostname}:8000/api/v1`;
    }

    // Production cloud deployment (Vercel, custom domain)
    return 'https://pennyflow-api.onrender.com/api/v1';
  }

  return 'http://localhost:8000/api/v1';
};

const apiClient = axios.create({
  baseURL: getApiBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 90000, // 90 seconds to allow smooth cold-start transitions
});

// Request Interceptor: Attach JWT Bearer Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pennyflow_token') || localStorage.getItem('financeflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Automatic Retry for Render Cold Starts & Global Error Handling
apiClient.interceptors.response.use(
  (response) => {
    // Check if proxy returned HTML error page unexpectedly
    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
      const error = new Error('Received unexpected HTML response instead of JSON.');
      error.code = 'ERR_HTML_RESPONSE';
      return Promise.reject(error);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Automatic retry for Render cold starts or brief network blips (502, 503, 504, ERR_NETWORK, timeout)
    const isRetryable =
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_HTML_RESPONSE' ||
      (error.response && [502, 503, 504].includes(error.response.status));

    if (originalRequest && isRetryable) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      if (originalRequest._retryCount <= 10) {
        const delay = Math.min(originalRequest._retryCount * 1200, 3500);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return apiClient(originalRequest);
      }
    }

    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      // Only clear credentials and redirect if the user was on an authenticated protected route,
      // not when simply submitting an incorrect password on the login page
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
        localStorage.removeItem('pennyflow_token');
        localStorage.removeItem('pennyflow_user');
        localStorage.removeItem('financeflow_token');
        localStorage.removeItem('financeflow_user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
