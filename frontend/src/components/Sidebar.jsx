import { 
  Shield, 
  LayoutDashboard, 
  PlusCircle, 
  Car,
  ClipboardList, 
  History as HistoryIcon, 
  TrendingUp, 
  MessageSquare, 
  Settings, 
  LogOut,
  Cpu
} from 'lucide-react';

export default function Sidebar({ 
  user, 
  officerTab, 
  setOfficerTab, 
  pendingAppsCount, 
  onLogoutClick 
}) {
  const links = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new_life_app', label: 'New Life Application', icon: PlusCircle },
    { id: 'new_vehicle_claim', label: 'New Vehicle Claim', icon: Car },
    { id: 'triage', label: 'Applications', icon: ClipboardList, badge: pendingAppsCount },
    { id: 'history', label: 'History', icon: HistoryIcon },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'ai_monitoring', label: 'AI Monitoring', icon: Cpu },
    { id: 'assistant', label: 'AI Assistant', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="officer-sidebar" style={{ width: '260px', backgroundColor: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', padding: '1.5rem 1rem' }}>
      <div className="sidebar-brand" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield size={26} className="sidebar-brand-icon" style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-title)', letterSpacing: '-0.025em', margin: 0 }}>ActuaryGPT</h2>
          <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--primary-glow)', color: 'var(--primary)', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>HUB</span>
        </div>
        <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', margin: '0.5rem 0 0.1rem 0', lineHeight: '1.2' }}>Agentic AI Underwriting & Claims Intelligence Platform</p>
        <p style={{ fontSize: '0.65rem', color: 'var(--primary)', margin: 0, fontWeight: 500 }}>Analyze • Detect Fraud • Explain • Recommend</p>
      </div>

      <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = officerTab === link.id;
          return (
            <button
              key={link.id}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => setOfficerTab(link.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '0.75rem 1rem',
                border: 'none',
                background: 'none',
                borderRadius: '8px',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                backgroundColor: isActive ? 'var(--primary-glow)' : 'transparent',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Icon size={18} />
                <span>{link.label}</span>
              </div>
              {link.badge > 0 && (
                <span className="sidebar-badge" style={{ backgroundColor: 'var(--primary)', color: '#fff', fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: 700 }}>
                  {link.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="sidebar-user" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="sidebar-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700 }}>
            {user?.name?.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="user-name" style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-title)' }}>{user?.name}</p>
            <p className="user-role" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Actuary Officer</p>
          </div>
        </div>
        
        <button 
          className="sidebar-logout-btn" 
          onClick={onLogoutClick}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem 1rem', border: '1px solid var(--border)', background: 'none', borderRadius: '6px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', justifyContent: 'center' }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
