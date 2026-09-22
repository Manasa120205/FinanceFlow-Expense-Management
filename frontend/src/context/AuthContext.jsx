/**
 * Authentication Context and Provider.
 * Handles user state, JWT tokens, login, register, logout, and profile updates.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('financeflow_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('financeflow_token') || null);
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
        localStorage.setItem('financeflow_user', JSON.stringify(res.data));
      } catch (err) {
        console.warn('Session verification failed, logging out.');
        logout();
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
      localStorage.setItem('financeflow_token', access_token);
      localStorage.setItem('financeflow_user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      let message = 'Invalid email or password. Please try again.';
      if (err.response?.data?.detail) {
        message = err.response.data.detail;
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        message = 'Unable to connect to the FinanceFlow server. Please check your internet connection or server availability.';
      }
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
      localStorage.setItem('financeflow_token', access_token);
      localStorage.setItem('financeflow_user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      let message = 'Registration failed. Please check your information.';
      if (err.response?.data?.detail) {
        message = err.response.data.detail;
      } else if (err.response?.data?.errors) {
        message = err.response.data.errors.map((e) => e.message).join(' ');
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        message = 'Unable to connect to the FinanceFlow server. Please check your internet connection or server availability.';
      }
      setError(message);
      throw new Error(message);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('financeflow_token');
    localStorage.removeItem('financeflow_user');
  };

  const updateProfile = async (newName) => {
    setError(null);
    try {
      const res = await apiClient.put('/profile', { name: newName });
      setUser(res.data);
      localStorage.setItem('financeflow_user', JSON.stringify(res.data));
      return res.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to update profile name.';
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
