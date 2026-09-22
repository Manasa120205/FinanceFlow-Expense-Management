import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'var(--border-subtle)',
          color: 'var(--text-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <HelpCircle size={40} />
      </div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
        404 - Page Not Found
      </h1>
      <p
        style={{
          color: 'var(--text-muted)',
          maxWidth: '440px',
          marginTop: '0.5rem',
          marginBottom: '1.5rem',
          lineHeight: 1.5,
        }}
      >
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link to="/dashboard" className="btn btn-primary">
        <ArrowLeft size={16} /> Return to Dashboard
      </Link>
    </div>
  );
}
