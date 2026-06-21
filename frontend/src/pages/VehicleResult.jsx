import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Download, AlertTriangle, History, Car, IndianRupee } from 'lucide-react';

export default function VehicleResult({
  agentResult,
  selectedApp,
  API_BASE,
  isOfficer = false,
  onApprove,
  onReject,
  onManualReview
}) {
  const [expandedSimCaseId, setExpandedSimCaseId] = useState(null);
  const [isModifying, setIsModifying] = useState(false);
  const [modAmount, setModAmount] = useState(selectedApp?.total_claim_amount || "");

  if (!agentResult) return null;

  const isFraud = agentResult.fraud_reported === 'Y';

  return (
    <div className="result-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isFraud ? (
          <ShieldAlert size={20} style={{ color: 'var(--risk-high)' }} />
        ) : (
          <ShieldCheck size={20} style={{ color: 'var(--risk-low)' }} />
        )}
        Automated Claims Audit & Forensic dossier
      </h3>

      <div className="metrics-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="metric-box" style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <span className="metric-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Fraud Classification</span>
          <span className="metric-value" style={{ fontSize: '1.5rem', fontWeight: 700, display: 'block', margin: '0.25rem 0', color: isFraud ? 'var(--risk-high)' : 'var(--risk-low)' }}>
            {isFraud ? 'Potential Fraud' : 'Verified Claim'}
          </span>
          <span className="risk-badge" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '4px', backgroundColor: isFraud ? 'var(--risk-high-bg)' : 'var(--risk-low-bg)', color: isFraud ? 'var(--risk-high)' : 'var(--risk-low)', fontWeight: 600 }}>
            {isFraud ? 'FLAGGED HIGH RISK' : 'LOW RISK TIER'}
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
          <span className="metric-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Claim Amount</span>
          <span className="metric-value" style={{ fontSize: '1.75rem', fontWeight: 700, display: 'block', margin: '0.25rem 0', color: 'var(--primary)' }}>
            ₹{selectedApp?.total_claim_amount?.toLocaleString() || agentResult.premium?.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assessed policy payout</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Claim Items Breakdown */}
        <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            <IndianRupee size={16} />
            Payout Breakdown
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Injury Claim:</span>
              <span style={{ fontWeight: 600 }}>₹{selectedApp?.injury_claim?.toLocaleString() || '0'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Property Claim:</span>
              <span style={{ fontWeight: 600 }}>₹{selectedApp?.property_claim?.toLocaleString() || '0'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Vehicle Claim:</span>
              <span style={{ fontWeight: 600 }}>₹{selectedApp?.vehicle_claim?.toLocaleString() || '0'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', fontWeight: 700, fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-title)' }}>Total:</span>
              <span style={{ color: 'var(--primary)' }}>₹{selectedApp?.total_claim_amount?.toLocaleString() || '0'}</span>
            </div>
          </div>

          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0 0 0', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            <Car size={16} />
            Vehicle Details
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
            <p>Make: <b>{selectedApp?.auto_make}</b></p>
            <p>Model: <b>{selectedApp?.auto_model}</b></p>
            <p>Year: <b>{selectedApp?.auto_year}</b></p>
          </div>
        </div>

        {/* AI Audit Report */}
        <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <span className="metric-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Forensic Claim Audit & Recommendations</span>
          <div className="report-content" style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-main)', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem', whiteSpace: 'pre-line' }}>
            {agentResult.report}
          </div>
        </div>
      </div>

      {isOfficer && agentResult.similar_cases && (
        <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-title)' }}>
            <History size={16} style={{ color: 'var(--primary)' }} />
            Top Similar Claims (RAG Reference Cases)
          </h4>
          
          {agentResult.similar_cases.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No historical claims matches in database.</p>
          ) : (
            <div className="similarity-cases-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {agentResult.similar_cases.map((scase, sidx) => (
                <div key={scase.id || sidx} style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div 
                    className="similarity-case-row" 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '0.75rem 0.9rem', 
                      backgroundColor: expandedSimCaseId === scase.id ? 'var(--bg-card-hover)' : 'var(--bg-input)', 
                      cursor: 'pointer', 
                      fontSize: '0.85rem'
                    }}
                    onClick={() => setExpandedSimCaseId(expandedSimCaseId === scase.id ? null : scase.id)}
                  >
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{expandedSimCaseId === scase.id ? '▼' : '▶'}</span>
                      <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{scase.id}</span>
                      <span style={{ fontWeight: 500 }}>{scase.client}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Claim Type: {scase.incident_type}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--risk-low)' }}>{scase.similarity}% Match</span>
                      <span style={{ padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: 600, borderRadius: '4px', backgroundColor: scase.fraud_reported === 'Y' ? 'var(--risk-high-bg)' : 'var(--risk-low-bg)', color: scase.fraud_reported === 'Y' ? 'var(--risk-high)' : 'var(--risk-low)' }}>
                        {scase.fraud_reported === 'Y' ? 'Flagged Fraud' : 'Verified'}
                      </span>
                      <span style={{ fontWeight: 600 }}>₹{scase.total_claim_amount?.toLocaleString()}</span>
                    </div>
                  </div>

                  {expandedSimCaseId === scase.id && (
                    <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', backgroundColor: 'rgba(0, 0, 0, 0.25)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <p><b>Incident Severity:</b> {scase.incident_severity}</p>
                      <p><b>Incident State/City:</b> {scase.incident_state} / {scase.incident_city}</p>
                      <p><b>Property Damage Flag:</b> {scase.property_damage}</p>
                      <p><b>Vehicle Make/Model/Year:</b> {scase.auto_make} {scase.auto_model} ({scase.auto_year})</p>
                      <p><b>Claim Payout Decision Status:</b> <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{scase.status}</span></p>
                    </div>
                  )}
                </div>
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
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Modified Claim Payout (INR)</label>
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
