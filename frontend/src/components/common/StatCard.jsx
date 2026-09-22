import React from 'react';

export default function StatCard({
  title,
  value,
  icon: Icon,
  subtext,
  variant = 'primary', // 'primary' | 'success' | 'danger' | 'warning'
  badge,
}) {
  const variantStyles = {
    primary: {
      bg: 'rgba(79, 70, 229, 0.1)',
      color: '#4f46e5',
      border: '#c7d2fe',
    },
    success: {
      bg: 'rgba(16, 185, 129, 0.1)',
      color: '#10b981',
      border: '#a7f3d0',
    },
    danger: {
      bg: 'rgba(239, 68, 68, 0.1)',
      color: '#ef4444',
      border: '#fecaca',
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.1)',
      color: '#f59e0b',
      border: '#fde68a',
    },
  };

  const style = variantStyles[variant] || variantStyles.primary;

  return (
    <div className="stat-card">
      <div
        className="stat-icon"
        style={{ backgroundColor: style.bg, color: style.color }}
      >
        {Icon && <Icon size={24} />}
      </div>
      <div className="stat-content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="stat-label">{title}</div>
          {badge && (
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '999px',
                backgroundColor: style.bg,
                color: style.color,
                border: `1px solid ${style.border}`,
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <div className="stat-value">{value}</div>
        {subtext && <div className="stat-subtext">{subtext}</div>}
      </div>
    </div>
  );
}
