import React from 'react';

const getMatchingFeatures = (app, ref) => {
  if (!app || !ref) return "general profile features";
  const matches = [];
  if (app.smoker === ref.smoker) matches.push("Smoking Status (" + (app.smoker ? "Smoker" : "Non-smoker") + ")");
  if (app.bmi && ref.bmi && Math.abs(app.bmi - ref.bmi) < 2.0) matches.push(`BMI parity (diff < 2)`);
  if (app.previous_claims === ref.previous_claims) matches.push(`Claims History (${app.previous_claims} claims)`);
  if (app.family_history === ref.family_history) matches.push("Family History (" + (app.family_history ? "Yes" : "No") + ")");
  if (app.insurance_type === ref.insurance_type) matches.push(`Insurance Type (${app.insurance_type})`);
  if (app.age && ref.age && Math.abs(app.age - ref.age) < 0.1) matches.push(`Age bracket`);
  return matches.length > 0 ? matches.join(", ") : "general profile parameters";
};

export default function SimilarCaseCard({ 
  scase, 
  selectedApp, 
  expandedSimCaseId, 
  setExpandedSimCaseId 
}) {
  const isExpanded = expandedSimCaseId === scase.id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
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
          <span className="sim-case-id" style={{ fontWeight: 600, color: 'var(--primary)' }}>{scase.id}</span>
          <span className="sim-case-client" style={{ fontWeight: 500 }}>{scase.client}</span>
          <span className="sim-case-type" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{scase.insurance_type}</span>
        </div>
        <div className="sim-case-metrics" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className="sim-percent" style={{ fontWeight: 600, color: 'var(--risk-low)' }}>{scase.similarity}% Match</span>
          
          {scase.status === 'approved' ? (
            <span style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: 600, border: '1px solid var(--risk-low-border)', backgroundColor: 'var(--risk-low-bg)', color: 'var(--risk-low)', borderRadius: '4px' }}>Approved</span>
          ) : scase.status === 'rejected' ? (
            <span style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: 600, border: '1px solid var(--risk-high-border)', backgroundColor: 'var(--risk-high-bg)', color: 'var(--risk-high)', borderRadius: '4px' }}>Rejected</span>
          ) : (
            <span style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '4px' }}>{scase.status || 'Unknown'}</span>
          )}

          <span className="sim-premium" style={{ fontWeight: 600 }}>₹{scase.premium?.toLocaleString()}</span>
          <span className={`risk-badge class-${scase.risk_class}`} style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem', backgroundColor: scase.risk_class <= 2 ? 'var(--risk-low-bg)' : scase.risk_class <= 5 ? 'var(--risk-medium-bg)' : 'var(--risk-high-bg)', color: scase.risk_class <= 2 ? 'var(--risk-low)' : scase.risk_class <= 5 ? 'var(--risk-medium)' : 'var(--risk-high)', border: '1px solid transparent', borderRadius: '4px' }}>Class {scase.risk_class}</span>
        </div>
      </div>

      {isExpanded && selectedApp && (
        <div className="sim-case-details animate-fade-in" style={{ padding: '1rem', borderTop: '1px solid var(--border)', backgroundColor: 'rgba(0, 0, 0, 0.25)', fontSize: '0.8rem' }}>
          <div style={{ marginBottom: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <strong>Key Match Parity:</strong> Shared similarities on <em>{getMatchingFeatures(selectedApp, scase)}</em>.
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1px', backgroundColor: 'var(--border)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>Parameter</div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem', fontWeight: 600, color: 'var(--text-title)' }}>Current Application</div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem', fontWeight: 600, color: 'var(--primary)' }}>Historical Ref ({scase.id})</div>

            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>Age Index</div>
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>{selectedApp.age}</div>
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem', color: Math.abs(selectedApp.age - scase.age) < 0.1 ? 'var(--risk-low)' : 'var(--text-main)' }}>{scase.age}</div>

            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>BMI Rating</div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>{selectedApp.bmi}</div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem', color: Math.abs(selectedApp.bmi - scase.bmi) < 2 ? 'var(--risk-low)' : 'var(--text-main)' }}>{scase.bmi}</div>

            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>Height / Weight</div>
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>{selectedApp.height}cm / {selectedApp.weight}kg</div>
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>{scase.height}cm / {scase.weight}kg</div>

            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>Smoking Indicator</div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>{selectedApp.smoker ? 'Yes (Smoker)' : 'No (Non-smoker)'}</div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem', color: selectedApp.smoker === scase.smoker ? 'var(--risk-low)' : 'var(--risk-high)' }}>{scase.smoker ? 'Yes (Smoker)' : 'No (Non-smoker)'}</div>

            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>Claims History</div>
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>{selectedApp.previous_claims} claims</div>
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem', color: selectedApp.previous_claims === scase.previous_claims ? 'var(--risk-low)' : 'var(--text-main)' }}>{scase.previous_claims} claims</div>

            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>Family Medical History</div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>{selectedApp.family_history ? 'Yes (High Risk)' : 'No (Standard)'}</div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem', color: selectedApp.family_history === scase.family_history ? 'var(--risk-low)' : 'var(--text-main)' }}>{scase.family_history ? 'Yes (High Risk)' : 'No (Standard)'}</div>

            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>Exercise / Alcohol</div>
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>Ex: {selectedApp.exercise} | Alc: {selectedApp.alcohol}</div>
            <div style={{ backgroundColor: 'var(--bg-input)', padding: '0.4rem 0.5rem' }}>Ex: {scase.exercise} | Alc: {scase.alcohol}</div>

            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>Annual Income</div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>₹{selectedApp.income?.toLocaleString()}</div>
            <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.4rem 0.5rem' }}>₹{scase.income?.toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
