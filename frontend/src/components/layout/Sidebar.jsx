import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  BarChart3,
  User,
  LogOut,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { label: 'Budgets', path: '/budgets', icon: PieChart },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            zIndex: 35,
          }}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div
          style={{
            padding: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Wallet size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
                FinanceFlow
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                Expense Management
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: isOpen ? 'block' : 'none',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, padding: '1.5rem 1rem' }}>
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: '#64748b',
              letterSpacing: '0.05em',
              marginBottom: '0.75rem',
              paddingLeft: '0.75rem',
            }}
          >
            Menu
          </div>

          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth <= 768) onClose();
                    }}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.625rem 0.875rem',
                      borderRadius: 'var(--radius-md)',
                      color: isActive ? '#ffffff' : '#94a3b8',
                      backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                      fontWeight: isActive ? 600 : 500,
                      fontSize: '0.9rem',
                      transition: 'all 0.15s ease',
                      textDecoration: 'none',
                    })}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Footer Profile */}
        <div
          style={{
            padding: '1.25rem 1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
          }}
        >
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-dark)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user.name}
                </div>
                <div
                  style={{
                    color: '#94a3b8',
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user.email}
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'transparent',
              color: '#f87171',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
