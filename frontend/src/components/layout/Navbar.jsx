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

      <div className="navbar-actions">
        {user && (
          <Link
            to="/profile"
            className="navbar-user-link"
            title={`View profile for ${user.name}`}
          >
            <div className="navbar-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="navbar-user-name">{user.name}</span>
          </Link>
        )}

        <button
          type="button"
          className="btn btn-secondary btn-sm navbar-logout-btn"
          onClick={handleLogout}
          title="Sign out of your account"
        >
          <LogOut size={16} />
          <span className="navbar-logout-text">Logout</span>
        </button>
      </div>
    </header>
  );
}
