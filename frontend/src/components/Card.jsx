import React from 'react';

export default function Card({ title, icon, children, style }) {
  return (
    <div className="glass-card" style={style}>
      {title && (
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text-title)' }}>
          {icon}
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
