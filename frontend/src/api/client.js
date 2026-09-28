/**
 * Axios API HTTP Client Configuration and Interceptors.
 * Automatically resolves backend endpoint across localhost, local WiFi/LAN, and cloud tunnels.
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

    // Production cloud deployment (Vercel, custom domain):
    // Use same-origin /api/v1 for 24/7 serverless cloud backend
    return '/api/v1';
  }

  return 'http://localhost:8000/api/v1';
};

const apiClient = axios.create({
  baseURL: getApiBaseURL(),
  headers: {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
    'Bypass-Tunnel-Reminder': 'true',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Bearer Token and Localtunnel bypass headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pennyflow_token') || localStorage.getItem('financeflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Ensure Localtunnel doesn't intercept with a friendly reminder page
    config.headers['bypass-tunnel-reminder'] = 'true';
    config.headers['Bypass-Tunnel-Reminder'] = 'true';
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global Error and Fallback Handling
apiClient.interceptors.response.use(
  (response) => {
    // Check if a tunnel or proxy returned HTML unexpectedly
    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
      const error = new Error('Received HTML instead of JSON from API endpoint.');
      error.code = 'ERR_HTML_RESPONSE';
      return Promise.reject(error);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    // Resilient fallback: If cloud /api/v1 is building or unreachable, retry via active bridge
    if (
      originalRequest &&
      !originalRequest._retry &&
      (error.code === 'ERR_NETWORK' ||
        error.code === 'ERR_HTML_RESPONSE' ||
        (error.response && [404, 405, 502, 503].includes(error.response.status))) &&
      typeof window !== 'undefined' &&
      window.location.hostname.includes('vercel.app') &&
      (!originalRequest.baseURL || originalRequest.baseURL === '/api/v1')
    ) {
      originalRequest._retry = true;
      originalRequest.baseURL = 'https://pennyflow-api.loca.lt/api/v1';
      try {
        return await axios(originalRequest);
      } catch (fallbackError) {
        return Promise.reject(fallbackError);
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

