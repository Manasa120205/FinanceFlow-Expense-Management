import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  const hasToken =
    typeof window !== 'undefined' &&
    !!(localStorage.getItem('pennyflow_token') || localStorage.getItem('financeflow_token'));

  if (loading && !hasToken) {
    return <LoadingSpinner fullPage text="Loading dashboard..." />;
  }

  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
