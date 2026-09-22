import React, { useState } from 'react';
import { User, Mail, Calendar, ShieldCheck, CheckCircle2, AlertCircle, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/currency';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Name must be at least 2 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile(name.trim());
      setSuccessMessage('Profile name updated successfully.');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Account Profile</h1>
          <p className="page-subtitle">
            Manage your personal profile details and view security credentials.
          </p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Profile Details & Edit Form */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Personal Information</h3>

          {successMessage && (
            <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
              <CheckCircle2 size={18} />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="profileEmail">
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="profileEmail"
                  type="email"
                  className="form-input"
                  value={user?.email || ''}
                  disabled
                  style={{ backgroundColor: '#f1f5f9', color: '#64748b', cursor: 'not-allowed' }}
                />
              </div>
              <div className="form-hint">
                Email is your unique account identifier and cannot be changed.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profileName">
                Display Name *
              </label>
              <input
                id="profileName"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                minLength={2}
                maxLength={100}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Member Since</label>
              <div
                style={{
                  padding: '0.625rem 0.875rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Calendar size={16} />
                <span>
                  {user?.created_at
                    ? formatDate(user.created_at.split('T')[0])
                    : 'Active member'}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || name.trim() === user?.name}
              style={{ marginTop: '0.5rem' }}
            >
              <Save size={16} /> {isSubmitting ? 'Updating...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Security & Data Isolation Card */}
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="var(--primary)" /> Security & Privacy Posture
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-light)',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Strict User Data Isolation
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                Your transactions, budgets, and dashboard statistics are tied exclusively to your
                account ID at the database query level. Other accounts cannot view, query, or modify
                your records.
              </p>
            </div>

            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-light)',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Password Cryptography
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                Passwords are never stored in plaintext. They are salted and securely hashed using
                the industry-standard bcrypt algorithm with 12 computational cost rounds.
              </p>
            </div>

            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-light)',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Stateless JWT Authentication
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
                API endpoints are guarded by signed cryptographic JSON Web Tokens with automated
                client-side invalidation upon expiration or logout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
