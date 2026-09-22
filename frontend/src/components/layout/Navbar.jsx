import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, LogOut, User, Wallet } from 'lucide-react';
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

        <Link
          to="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--text-main)',
            fontWeight: 700,
            fontSize: '1.2rem',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'var(--primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Wallet size={18} />
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
              gap: '0.5rem',
              color: 'var(--text-main)',
              fontSize: '0.875rem',
              padding: '6px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
            }}
          >
            <User size={16} color="var(--primary)" />
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
