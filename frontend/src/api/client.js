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

    // Production cloud deployment (Vercel, Netlify, custom domain)
    return 'https://twelve-bikes-obey.loca.lt/api/v1';
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
    const token = localStorage.getItem('financeflow_token');
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

// Response Interceptor: Global 401 Session Expiry Handling
apiClient.interceptors.response.use(
  (response) => {
    // Check if a tunnel or proxy returned HTML unexpectedly
    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
      const error = new Error('Tunnel received HTML instead of JSON. Retrying with bypass headers.');
      error.code = 'ERR_TUNNEL_REMINDER';
      return Promise.reject(error);
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear expired or invalid credentials
      localStorage.removeItem('financeflow_token');
      localStorage.removeItem('financeflow_user');

      // If not already on login or register, redirect to login
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

