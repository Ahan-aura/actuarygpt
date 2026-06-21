import React from 'react';
import { 
  FileSpreadsheet, 
  DollarSign, 
  Activity, 
  UserCheck, 
  Database, 
  ClipboardList, 
  CheckCircle2, 
  ShieldAlert 
} from 'lucide-react';

export default function Dashboard({ 
  totalPolicies, 
  totalPremiums, 
  avgRiskClass, 
  triageApprovalRate, 
  pendingApps, 
  pendingVehicleApps = [], 
  vehicleClaimCount = 0,
  vehicleFraudRate = 0.0,
  setOfficerTab 
}) {
  return (
    <div className="officer-dashboard-view animate-fade-in">
      <div className="welcome-banner">
        <h2>Underwriter Control Center</h2>
        <p>Real-time machine learning risk models and RAG case comparison database.</p>
      </div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
            <ClipboardList size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Today's Claims</span>
            <span className="stat-value">152</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--risk-low)' }}>
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--risk-low)' }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Approved</span>
            <span className="stat-value">126</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--risk-medium)' }}>
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--risk-medium)' }}>
            <Activity size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Manual Review</span>
            <span className="stat-value">18</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--risk-high)' }}>
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--risk-high)' }}>
            <ShieldAlert size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Rejected</span>
            <span className="stat-value">8</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--secondary)' }}>
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: 'var(--secondary)' }}>
            <Activity size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Fraud Rate</span>
            <span className="stat-value">6%</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>
            <DollarSign size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Average Claim</span>
            <span className="stat-value">₹84,000</span>
          </div>
        </div>
      </div>

      <div className="dashboard-double-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        {/* System Health */}
        <div className="glass-card">
          <h3 className="card-title">
            <div className="card-title-left">
              <Database size={18} style={{ color: 'var(--primary)' }} />
              Actuarial System Status
            </div>
          </h3>
          <div className="system-status-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div className="status-item" style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <span>FastAPI Backend Server</span>
              <span className="status-indicator online" style={{ color: 'var(--risk-low)', fontWeight: 600 }}>Online (Port 8000)</span>
            </div>
            <div className="status-item" style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <span>SQLite Reference Database</span>
              <span className="status-indicator online" style={{ color: 'var(--risk-low)', fontWeight: 600 }}>Connected (actuary_gpt.db)</span>
            </div>
            <div className="status-item" style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <span>Gemini LLM Orchestrator</span>
              <span className="status-indicator online" style={{ color: 'var(--risk-low)', fontWeight: 600 }}>Ready (gemini-2.5-flash)</span>
            </div>
            <div className="status-item" style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
              <span>CatBoost ML Life Predictor</span>
              <span className="status-indicator online" style={{ color: 'var(--risk-low)', fontWeight: 600 }}>Loaded (risk_model.pkl)</span>
            </div>
            <div className="status-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>CatBoost ML Vehicle Predictor</span>
              <span className="status-indicator online" style={{ color: 'var(--risk-low)', fontWeight: 600 }}>Loaded (vehicle_claim_model.pkl)</span>
            </div>
          </div>
        </div>

        {/* Quick Triage queue summary */}
        <div className="glass-card">
          <h3 className="card-title">
            <div className="card-title-left">
              <ClipboardList size={18} style={{ color: 'var(--primary)' }} />
              Awaiting Evaluation ({pendingApps.length + pendingVehicleApps.length} submissions)
            </div>
          </h3>
          {pendingApps.length === 0 && pendingVehicleApps.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>All applications reviewed!</p>
          ) : (
            <div className="quick-queue-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {pendingApps.slice(0, 2).map(app => (
                <div 
                  key={app.id} 
                  className="quick-queue-item" 
                  onClick={() => setOfficerTab('triage')}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--text-title)' }}>{app.client}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Life Cover • Requested: ₹{app.coverage_amount?.toLocaleString()}</p>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>Evaluate →</span>
                </div>
              ))}
              
              {pendingVehicleApps.slice(0, 2).map(app => (
                <div 
                  key={app.id} 
                  className="quick-queue-item" 
                  onClick={() => setOfficerTab('triage')}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--text-title)' }}>{app.client}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vehicle Claim • Amount: ₹{app.total_claim_amount?.toLocaleString()}</p>
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: 600 }}>Evaluate →</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
