import React from 'react';
import { FolderOpen } from 'lucide-react';

export default function EmptyState({
  icon: Icon = FolderOpen,
  title = 'No records found',
  description = 'Get started by adding your first transaction or budget.',
  actionLabel,
  onAction,
}) {
  return (
    <div
      style={{
        padding: '3rem 1.5rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'var(--border-subtle)',
          color: 'var(--text-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}
      >
        <Icon size={32} />
      </div>
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-main)' }}>
        {title}
      </h3>
      <p
        style={{
          fontSize: '0.875rem',
          color: 'var(--text-muted)',
          maxWidth: '380px',
          marginTop: '0.375rem',
          marginBottom: actionLabel ? '1.25rem' : '0',
        }}
      >
        {description}
      </p>
      {actionLabel && onAction && (
        <button type="button" className="btn btn-primary" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
