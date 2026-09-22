import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, LogOut, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          style={{ display: 'flex', alignItems: 'center', padding: '6px' }}
        >
          <Menu size={20} />
        </button>

        {/* Desktop Breadcrumb context */}
        <div className="navbar-breadcrumb">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Platform</span>
          <span style={{ color: '#cbd5e1' }}>/</span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>Overview</span>
        </div>

        {/* Mobile Brand (only visible on small screens when sidebar is hidden) */}
        <Link
          to="/dashboard"
          className="navbar-mobile-brand"
          style={{
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-main)',
            fontWeight: 700,
            fontSize: '1.15rem',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Wallet size={16} />
          </div>
          <span>FinanceFlow</span>
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {user && (
          <Link
            to="/profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              color: 'var(--text-main)',
              fontSize: '0.875rem',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              textDecoration: 'none',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontWeight: 600 }}>{user.name}</span>
          </Link>
        )}

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleLogout}
          title="Sign out of your account"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
