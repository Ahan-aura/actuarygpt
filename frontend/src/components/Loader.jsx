import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function Loader({ message = "Processing..." }) {
  return (
    <div className="loader-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '1rem', color: 'var(--text-muted)' }}>
      <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--primary)' }} />
      <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{message}</p>
    </div>
  );
}
