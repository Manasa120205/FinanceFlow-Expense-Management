import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({
  text = 'Loading data...',
  size = 28,
  fullPage = false,
}) {
  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: fullPage ? '0' : '2.5rem 1rem',
        gap: '0.75rem',
        color: 'var(--text-muted)',
      }}
    >
      <Loader2
        size={size}
        style={{
          animation: 'spin 1s linear infinite',
          color: 'var(--primary)',
        }}
      />
      {text && <span style={{ fontSize: '0.875rem' }}>{text}</span>}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (fullPage) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}
