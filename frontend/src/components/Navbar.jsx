import React from 'react';
import { Shield, User, LogOut } from 'lucide-react';

export default function Navbar({ user, onLogoutClick }) {
  return (
    <header className="navbar">
      <div className="nav-brand">
        <Shield size={24} className="icon" style={{ color: 'var(--primary)' }} />
        <h1>ActuaryGPT</h1>
        <span className="brand-badge">Client Portal</span>
      </div>
      <div className="nav-user-info">
        <div className="user-badge">
          <User size={12} style={{ marginRight: '0.25rem', verticalAlign: 'middle', display: 'inline' }} />
          {user?.name} (Policyholder)
        </div>
        <button className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }} onClick={onLogoutClick}>
          <LogOut size={14} style={{ marginRight: '0.25rem' }} />
          Exit
        </button>
      </div>
    </header>
  );
}
