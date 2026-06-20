import React from 'react';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="glass-card officer-settings-view animate-fade-in">
      <h3 className="card-title">
        <div className="card-title-left" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Settings size={18} style={{ color: 'var(--primary)' }} />
          ActuaryGPT Control Configurations
        </div>
      </h3>

      <div className="settings-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.25rem' }}>
        <h4 style={{ color: 'var(--text-title)', fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Model Orchestrator</h4>
        <div className="settings-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Active LLM Model</span>
          <select className="form-select settings-select" style={{ width: '250px' }} disabled>
            <option>Gemini 2.5 Flash (Default)</option>
            <option>Gemini 2.5 Pro (Enterprise)</option>
          </select>
        </div>
        <div className="settings-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Classifier Confidence Threshold</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input type="range" className="settings-slider" min="50" max="95" value="85" style={{ width: '150px' }} disabled />
            <span>85%</span>
          </div>
        </div>
      </div>

      <div className="settings-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '2.5rem' }}>
        <h4 style={{ color: 'var(--text-title)', fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Underwriting Risk Thresholds</h4>
        <div className="threshold-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem' }}>
          <div className="threshold-box" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span className="lbl green" style={{ color: 'var(--risk-low)', fontWeight: 700, fontSize: '0.9rem' }}>Low Risk</span>
            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Class 1 - 2</span>
            <span className="desc" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automatic Premium / Preferred Issue Approval</span>
          </div>
          <div className="threshold-box" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span className="lbl amber" style={{ color: 'var(--risk-medium)', fontWeight: 700, fontSize: '0.9rem' }}>Medium Risk</span>
            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Class 3 - 5</span>
            <span className="desc" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rules-based standard pricing adjustment</span>
          </div>
          <div className="threshold-box" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span className="lbl red" style={{ color: 'var(--risk-high)', fontWeight: 700, fontSize: '0.9rem' }}>High Risk</span>
            <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Class 6 - 8</span>
            <span className="desc" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mandatory Manual Underwriting Referral</span>
          </div>
        </div>
      </div>

      <div className="settings-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '2.5rem' }}>
        <h4 style={{ color: 'var(--text-title)', fontSize: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Database Configuration</h4>
        <div className="settings-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Database File Path</span>
          <code style={{ fontSize: '0.8rem', backgroundColor: 'var(--bg-input)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}>ActuaryGPT/backend/app/actuary_gpt.db</code>
        </div>
        <div className="settings-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Local Storage Path</span>
          <code style={{ fontSize: '0.8rem', backgroundColor: 'var(--bg-input)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}>ActuaryGPT/backend/app/static/reports/</code>
        </div>
      </div>
    </div>
  );
}
