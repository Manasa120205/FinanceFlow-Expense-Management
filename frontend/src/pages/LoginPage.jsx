import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Wallet, LogIn, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if session expired banner should show
  const params = new URLSearchParams(location.search);
  const isExpired = params.get('expired') === 'true';

  const validate = () => {
    const errors = {};
    if (!email.trim()) {
      errors.email = 'Enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Enter your password.';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('demo.user@financeflow.app');
    setPassword('DemoPass123!');
    setFieldErrors({});
    setServerError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div style={{ maxWidth: '440px', width: '100%' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: 'var(--text-main)',
              textDecoration: 'none',
              marginBottom: '0.75rem',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wallet size={22} />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>FinanceFlow</span>
          </Link>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Welcome back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Log in to manage your income, expenses, and budgets.
          </p>
        </div>

        {/* Card Form */}
        <div className="card" style={{ padding: '2rem' }}>
          {isExpired && (
            <div className="alert alert-warning">
              <AlertCircle size={18} />
              <span>Your session has expired. Please log in again.</span>
            </div>
          )}

          {serverError && (
            <div className="alert alert-danger" role="alert">
              <AlertCircle size={18} />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className={`form-input ${fieldErrors.email ? 'error' : ''}`}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                }}
                placeholder="name@example.com"
                autoComplete="email"
                disabled={isSubmitting}
              />
              {fieldErrors.email && (
                <div className="form-error" role="alert">
                  <AlertCircle size={14} /> {fieldErrors.email}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                className={`form-input ${fieldErrors.password ? 'error' : ''}`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' });
                }}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isSubmitting}
              />
              {fieldErrors.password && (
                <div className="form-error" role="alert">
                  <AlertCircle size={14} /> {fieldErrors.password}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                'Signing in...'
              ) : (
                <>
                  <LogIn size={18} /> Sign In
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div
            style={{
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-light)',
              textAlign: 'center',
            }}
          >
            <button
              type="button"
              onClick={handleFillDemo}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.825rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <Sparkles size={14} /> Quick-fill Sample Credentials
            </button>
          </div>
        </div>

        {/* Footer links */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Don't have an account? </span>
          <Link to="/register" style={{ fontWeight: 600 }}>
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
