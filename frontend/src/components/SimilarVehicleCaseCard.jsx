import React from 'react';

const getMatchingFeatures = (app, ref) => {
  if (!app || !ref) return "general claim parameters";
  const matches = [];
  if (app.auto_make === ref.auto_make && app.auto_model === ref.auto_model) {
    matches.push(`Vehicle Model (${app.auto_make} ${app.auto_model})`);
  }
  if (app.incident_severity === ref.incident_severity) {
    matches.push(`Severity (${app.incident_severity})`);
  }
  if (app.collision_type === ref.collision_type) {
    matches.push(`Collision Type (${app.collision_type})`);
  }
  if (app.total_claim_amount && ref.total_claim_amount && Math.abs(app.total_claim_amount - ref.total_claim_amount) < 10000) {
    matches.push("Claim Range");
  }
  if (app.age && ref.age && Math.abs(app.age - ref.age) < 5) {
    matches.push(`Age proximity`);
  }
  return matches.length > 0 ? matches.join(", ") : "general claim parameters";
};

export default function SimilarVehicleCaseCard({ 
  scase, 
  selectedApp, 
  expandedSimCaseId, 
  setExpandedSimCaseId 
}) {
  const isExpanded = expandedSimCaseId === scase.id;

  // Safe checks for rendering
  const getVal = (val, fallback = "N/A") => val !== undefined && val !== null ? val : fallback;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'rgba(255, 255, 255, 0.01)' }}>
      <div 
        className="similarity-case-row" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '0.75rem 0.9rem', 
          backgroundColor: isExpanded ? 'var(--bg-card-hover)' : 'var(--bg-input)', 
          cursor: 'pointer', 
          fontSize: '0.85rem',
          transition: 'background-color 0.2s ease'
        }}
        onClick={() => setExpandedSimCaseId(isExpanded ? null : scase.id)}
      >
        <div className="sim-case-meta" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {isExpanded ? '▼' : '▶'}
          </span>
          <span className="sim-case-id" style={{ fontWeight: 600, color: 'var(--secondary)' }}>
            {scase.id ? (scase.id.toString().startsWith('VEH-') ? scase.id : `Claim ${scase.id}`) : 'VEH-N/A'}
          </span>
          <span className="sim-case-client" style={{ fontWeight: 500 }}>{getVal(scase.client)}</span>
          <span className="sim-case-vehicle" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
            {scase.auto_make ? `${scase.auto_make} ${scase.auto_model || ''}` : 'Vehicle info N/A'}
          </span>
        </div>
        <div className="sim-case-metrics" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className="sim-percent" style={{ fontWeight: 600, color: 'var(--risk-low)' }}>
            {getVal(scase.similarity, 90)}% Match
          </span>
          
          {scase.status === 'approved' || scase.status === 'Approved' ? (
            <span style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: 600, border: '1px solid var(--risk-low-border)', backgroundColor: 'var(--risk-low-bg)', color: 'var(--risk-low)', borderRadius: '4px' }}>Approved</span>
          ) : scase.status === 'rejected' || scase.status === 'Rejected' || scase.fraud_reported === 'Y' ? (
            <span style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: 600, border: '1px solid var(--risk-high-border)', backgroundColor: 'var(--risk-high-bg)', color: 'var(--risk-high)', borderRadius: '4px' }}>Flagged Fraud</span>
          ) : (
            <span style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '4px' }}>{scase.status || 'Pending'}</span>
          )}

          <span className="sim-amount" style={{ fontWeight: 600 }}>
            ₹{parseFloat(scase.total_claim_amount || 0).toLocaleString()}
          </span>
        </div>
      </div>

      {isExpanded && selectedApp && (
        <div className="sim-case-details animate-fade-in" style={{ padding: '1rem', borderTop: '1px solid var(--border)', backgroundColor: 'rgba(0, 0, 0, 0.25)', fontSize: '0.8rem' }}>
          <div style={{ marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <strong>Key Match Parity:</strong> Shared similarities on <em>{getMatchingFeatures(selectedApp, scase)}</em>.
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>Parameter</div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem', fontWeight: 600, color: 'var(--text-title)' }}>Current Claim</div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem', fontWeight: 600, color: 'var(--secondary)' }}>Historical Ref ({scase.id})</div>

            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>Vehicle Model</div>
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>{selectedApp.auto_make} {selectedApp.auto_model} ({getVal(selectedApp.auto_year)})</div>
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem', color: (selectedApp.auto_make === scase.auto_make && selectedApp.auto_model === scase.auto_model) ? 'var(--risk-low)' : 'var(--text-main)' }}>
              {scase.auto_make ? `${scase.auto_make} ${scase.auto_model || ''} (${scase.auto_year || 'N/A'})` : 'N/A'}
            </div>

            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>Incident Severity</div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>{selectedApp.incident_severity}</div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem', color: selectedApp.incident_severity === scase.incident_severity ? 'var(--risk-low)' : 'var(--text-main)' }}>{getVal(scase.incident_severity)}</div>

            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>Collision Type</div>
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>{selectedApp.collision_type}</div>
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem', color: selectedApp.collision_type === scase.collision_type ? 'var(--risk-low)' : 'var(--text-main)' }}>{getVal(scase.collision_type)}</div>

            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>Total Claim Amount</div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>₹{parseFloat(selectedApp.total_claim_amount || 0).toLocaleString()}</div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem', color: Math.abs((selectedApp.total_claim_amount || 0) - (scase.total_claim_amount || 0)) < 10000 ? 'var(--risk-low)' : 'var(--text-main)' }}>
              ₹{parseFloat(scase.total_claim_amount || 0).toLocaleString()}
            </div>

            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>Insured Customer Age</div>
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>{selectedApp.age} years</div>
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem', color: Math.abs((selectedApp.age || 0) - (scase.age || 0)) < 5 ? 'var(--risk-low)' : 'var(--text-main)' }}>{getVal(scase.age)} years</div>

            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>Months as Customer</div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>{selectedApp.months_as_customer} months</div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>{getVal(scase.months_as_customer)} months</div>

            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>Policy Premium (Annual)</div>
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>₹{parseFloat(selectedApp.policy_annual_premium || 0).toLocaleString()}</div>
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>₹{parseFloat(scase.policy_annual_premium || 0).toLocaleString()}</div>

            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>Fraud Reported</div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>{selectedApp.fraud_reported || 'N'}</div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem', color: scase.fraud_reported === 'Y' ? 'var(--risk-high)' : 'var(--risk-low)' }}>{getVal(scase.fraud_reported)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
