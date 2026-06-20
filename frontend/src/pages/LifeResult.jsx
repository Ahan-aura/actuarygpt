import React from 'react';
import { ShieldCheck, Download, AlertTriangle, History } from 'lucide-react';
import SimilarCaseCard from '../components/SimilarCaseCard';

export default function LifeResult({
  agentResult,
  selectedApp,
  API_BASE,
  isOfficer = false,
  onApprove,
  onReject,
  onManualReview,
  expandedSimCaseId,
  setExpandedSimCaseId
}) {
  const [isModifying, setIsModifying] = React.useState(false);
  const [modAmount, setModAmount] = React.useState(agentResult?.premium || "");
  if (!agentResult) return null;

  return (
    <div className="result-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ShieldCheck size={20} style={{ color: 'var(--risk-low)' }} />
        AI Risk Assessment & Actuarial Dossier
      </h3>

      <div className="metrics-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="metric-box" style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <span className="metric-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Predicted Risk Class</span>
          <span className="metric-value" style={{ fontSize: '1.75rem', fontWeight: 700, display: 'block', margin: '0.25rem 0', color: 'var(--text-title)' }}>
            Class {agentResult.risk_class}
          </span>
          <span className={`risk-badge class-${agentResult.risk_class}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: '4px', backgroundColor: agentResult.risk_class <= 2 ? 'var(--risk-low-bg)' : agentResult.risk_class <= 5 ? 'var(--risk-medium-bg)' : 'var(--risk-high-bg)', color: agentResult.risk_class <= 2 ? 'var(--risk-low)' : agentResult.risk_class <= 5 ? 'var(--risk-medium)' : 'var(--risk-high)', fontWeight: 600 }}>
            {agentResult.risk_category}
          </span>
        </div>
        
        <div className="metric-box" style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <span className="metric-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Inference Confidence</span>
          <span className="metric-value" style={{ fontSize: '1.75rem', fontWeight: 700, display: 'block', margin: '0.25rem 0', color: 'var(--secondary)' }}>
            {agentResult.confidence}%
          </span>
          <div className="confidence-bar-bg" style={{ width: '100%', height: '5px', backgroundColor: 'var(--border)', borderRadius: '2.5px', overflow: 'hidden', marginTop: '0.5rem' }}>
            <div className="confidence-bar-fg" style={{ width: `${agentResult.confidence}%`, height: '100%', backgroundColor: 'var(--secondary)' }}></div>
          </div>
        </div>

        <div className="metric-box" style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <span className="metric-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Recommended Annual Premium</span>
          <span className="metric-value" style={{ fontSize: '1.75rem', fontWeight: 700, display: 'block', margin: '0.25rem 0', color: 'var(--primary)' }}>
            ₹{agentResult.premium?.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-calculated actuarial rate</span>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>AI Underwriting Recommendation</span>
        <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-title)', margin: 0 }}>
          {agentResult.underwriting_decision}
        </p>
      </div>

      <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <span className="metric-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Actuarial Report & Risk Justification</span>
        <div className="report-content" style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-main)', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem', whiteSpace: 'pre-line' }}>
          {agentResult.report}
        </div>
      </div>

      {isOfficer && agentResult.similar_cases && (
        <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-title)' }}>
            <History size={16} style={{ color: 'var(--primary)' }} />
            Top Similar Historical Reference Cases (RAG Matches)
          </h4>
          
          {agentResult.similar_cases.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No historical matches found in database.</p>
          ) : (
            <div className="similarity-cases-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {agentResult.similar_cases.map((scase, sidx) => (
                <SimilarCaseCard
                  key={scase.id || sidx}
                  scase={scase}
                  selectedApp={selectedApp}
                  expandedSimCaseId={expandedSimCaseId}
                  setExpandedSimCaseId={setExpandedSimCaseId}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {agentResult.pdf_url ? (
            <a 
              href={`${API_BASE}${agentResult.pdf_url}`} 
              target="_blank" 
              rel="noreferrer"
              className="btn-secondary"
              style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', fontWeight: 600 }}
            >
              <Download size={16} />
              Download PDF Report
            </a>
          ) : <div />}

          {isOfficer && (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button 
                className="btn-primary" 
                onClick={() => onApprove(null)}
                style={{ backgroundColor: 'var(--risk-low)', borderColor: 'var(--risk-low)', color: '#fff', padding: '0.6rem 1.2rem', fontWeight: 600 }}
              >
                Approve
              </button>
              <button 
                className="btn-primary" 
                onClick={() => setIsModifying(!isModifying)}
                style={{ backgroundColor: 'var(--secondary)', borderColor: 'var(--secondary)', color: '#fff', padding: '0.6rem 1.2rem', fontWeight: 600 }}
              >
                Approve with Modified Amount
              </button>
              <button 
                className="btn-secondary" 
                onClick={onManualReview}
                style={{ borderColor: 'var(--border)', color: 'var(--text-title)', padding: '0.6rem 1.2rem', fontWeight: 600 }}
              >
                Manual Review
              </button>
              <button 
                className="btn-primary" 
                onClick={onReject}
                style={{ backgroundColor: 'var(--risk-high)', borderColor: 'var(--risk-high)', color: '#fff', padding: '0.6rem 1.2rem', fontWeight: 600 }}
              >
                Reject
              </button>
            </div>
          )}
        </div>

        {isModifying && (
          <div className="animate-slide-in" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--bg-input)', display: 'flex', gap: '1rem', alignItems: 'center', maxWidth: '400px', alignSelf: 'flex-end', marginTop: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Modified Annual Premium (INR/USD)</label>
              <input 
                type="number" 
                className="form-input" 
                value={modAmount} 
                onChange={(e) => setModAmount(e.target.value)} 
                style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
              <button 
                className="btn-primary" 
                onClick={() => {
                  if (modAmount) {
                    onApprove(parseFloat(modAmount));
                    setIsModifying(false);
                  }
                }}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', backgroundColor: 'var(--risk-low)', borderColor: 'var(--risk-low)' }}
              >
                Confirm
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => setIsModifying(false)}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
