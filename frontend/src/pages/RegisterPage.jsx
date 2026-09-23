import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wallet, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  // Password strength checks
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumberOrSpecial = /[^a-zA-Z]/.test(password);
  const isPasswordStrong = hasMinLength && hasLetter && hasNumberOrSpecial;

  const validate = () => {
    const errors = {};
    if (!name.trim() || name.trim().length < 2) {
      errors.name = 'Enter your name (at least 2 characters).';
    }

    if (!email.trim()) {
      errors.email = 'Enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Enter a password.';
    } else if (!isPasswordStrong) {
      errors.password = 'Password must meet the security requirements.';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm your password.';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
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
      await register(name, email, password, confirmPassword);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
      <div style={{ maxWidth: '460px', width: '100%' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
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
            <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>PennyFlow</span>
          </Link>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Create your account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Start managing your personal income, expenses, and monthly budgets.
          </p>
        </div>

        {/* Card Form */}
        <div className="card" style={{ padding: '2rem' }}>
          {serverError && (
            <div className="alert alert-danger" role="alert">
              <AlertCircle size={18} />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                className={`form-input ${fieldErrors.name ? 'error' : ''}`}
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                }}
                placeholder="e.g. Alex Sharma"
                autoComplete="name"
                disabled={isSubmitting}
              />
              {fieldErrors.name && (
                <div className="form-error" role="alert">
                  <AlertCircle size={14} /> {fieldErrors.name}
                </div>
              )}
            </div>

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
                placeholder="alex@example.com"
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
                placeholder="At least 8 characters"
                autoComplete="new-password"
                disabled={isSubmitting}
              />
              {fieldErrors.password && (
                <div className="form-error" role="alert">
                  <AlertCircle size={14} /> {fieldErrors.password}
                </div>
              )}

              {/* Password checklist */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    color: hasMinLength ? 'var(--success)' : 'var(--text-subtle)',
                  }}
                >
                  <CheckCircle2 size={13} /> At least 8 characters
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    color:
                      hasLetter && hasNumberOrSpecial
                        ? 'var(--success)'
                        : 'var(--text-subtle)',
                  }}
                >
                  <CheckCircle2 size={13} /> Contains letters and numbers or symbols
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                className={`form-input ${fieldErrors.confirmPassword ? 'error' : ''}`}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword)
                    setFieldErrors({ ...fieldErrors, confirmPassword: '' });
                }}
                placeholder="Re-enter password"
                autoComplete="new-password"
                disabled={isSubmitting}
              />
              {fieldErrors.confirmPassword && (
                <div className="form-error" role="alert">
                  <AlertCircle size={14} /> {fieldErrors.confirmPassword}
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
                'Creating account...'
              ) : (
                <>
                  <UserPlus size={18} /> Create Account
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Already have an account? </span>
          <Link to="/login" style={{ fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
