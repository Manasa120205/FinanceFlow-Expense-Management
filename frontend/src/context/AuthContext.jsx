/**
 * Authentication Context and Provider.
 * Handles user state, JWT tokens, login, register, logout, and profile updates.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export const parseApiError = (err, defaultMessage = 'An unexpected error occurred.') => {
  if (!err) return defaultMessage;

  // 1. Timeout
  if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
    return 'The server took too long to respond. Please try again.';
  }

  // 2. Network offline or server unreachable
  if (err.code === 'ERR_NETWORK' || !err.response) {
    return 'Could not connect to the PennyFlow server. The server is currently unreachable. Please verify your connection or try again in a moment.';
  }

  const status = err.response?.status;
  const data = err.response?.data;
  const detail = data?.detail;

  // 3. Status-specific messages
  if (status === 401) {
    return detail || 'Invalid email or password. Please try again.';
  }
  if (status === 409) {
    return detail || 'An account with this email address already exists. Please log in or use another email.';
  }
  if (status === 400) {
    return detail || 'Please check the information you entered.';
  }
  if (status === 422) {
    if (data?.errors && Array.isArray(data.errors)) {
      return data.errors.map((e) => e.message).join(' ');
    }
    return detail || 'Please check your inputs for validity.';
  }
  if (status === 500) {
    return 'Something went wrong on our server. Please try again later.';
  }
  if (status === 502 || status === 503 || status === 504) {
    return 'The PennyFlow server is temporarily unavailable. Please try again in a few moments.';
  }

  return detail || defaultMessage;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('pennyflow_user') || localStorage.getItem('financeflow_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('pennyflow_token') || localStorage.getItem('financeflow_token') || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Validate existing token with /auth/me on mount
  useEffect(() => {
    async function verifyAuth() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await apiClient.get('/auth/me');
        setUser(res.data);
        localStorage.setItem('pennyflow_user', JSON.stringify(res.data));
      } catch (err) {
        // ONLY log out if 401 Unauthorized (token is definitely expired or invalid)
        if (err.response && err.response.status === 401) {
          console.warn('Session verification failed (401), logging out.');
          logout();
        } else {
          // If network error, timeout, or server unavailable, DO NOT logout
          // Keep cached credentials so user session survives temporary hiccups
          console.warn('Network or server issue during session check. Preserving cached session.');
        }
      } finally {
        setLoading(false);
      }
    }
    verifyAuth();
  }, [token]);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      const { access_token, user: userData } = res.data;

      setToken(access_token);
      setUser(userData);
      localStorage.setItem('pennyflow_token', access_token);
      localStorage.setItem('pennyflow_user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      const message = parseApiError(err, 'Invalid email or password. Please try again.');
      setError(message);
      throw new Error(message);
    }
  };

  const register = async (name, email, password, confirm_password) => {
    setError(null);
    try {
      const res = await apiClient.post('/auth/register', {
        name,
        email,
        password,
        confirm_password,
      });
      const { access_token, user: userData } = res.data;

      setToken(access_token);
      setUser(userData);
      localStorage.setItem('pennyflow_token', access_token);
      localStorage.setItem('pennyflow_user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      const message = parseApiError(err, 'Registration failed. Please check your information.');
      setError(message);
      throw new Error(message);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('pennyflow_token');
    localStorage.removeItem('pennyflow_user');
    localStorage.removeItem('financeflow_token');
    localStorage.removeItem('financeflow_user');
  };

  const updateProfile = async (newName) => {
    setError(null);
    try {
      const res = await apiClient.put('/profile', { name: newName });
      setUser(res.data);
      localStorage.setItem('pennyflow_user', JSON.stringify(res.data));
      return res.data;
    } catch (err) {
      const message = parseApiError(err, 'Failed to update profile name.');
      setError(message);
      throw new Error(message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
