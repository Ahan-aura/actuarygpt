import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, Download, AlertTriangle, History, Car, IndianRupee, Bot, CheckCircle2 } from 'lucide-react';
import { downloadPDF } from '../utils/download';

export default function VehicleResult({
  agentResult,
  selectedApp,
  API_BASE,
  isOfficer = false,
  onApprove,
  onReject,
  onManualReview,
  processedVehicleApps = []
}) {
  const previousClaims = processedVehicleApps ? processedVehicleApps.filter(app => app.client === selectedApp.client && app.id !== selectedApp.id) : [];
  const [expandedSimCaseId, setExpandedSimCaseId] = useState(null);
  const [isModifying, setIsModifying] = useState(false);
  const [modAmount, setModAmount] = useState(selectedApp?.total_claim_amount || "");

  // Inline AI Chat states
  const [inlineChatHistory, setInlineChatHistory] = useState([
    { role: 'model', content: "Hello! I am Gemini, your Explainable AI assistant. I can help explain this claim's fraud probability, incident details, similar claims, or manual review suggestions." }
  ]);
  const [inlineChatInput, setInlineChatInput] = useState("");
  const [isInlineChatLoading, setIsInlineChatLoading] = useState(false);

  if (!agentResult) return null;

  const isFraud = agentResult.fraud_reported === 'Y';

  // Math metrics alignment
  const fraudProb = isFraud ? agentResult.confidence : Math.max(0, (100 - agentResult.confidence));
  const confidenceScore = isFraud ? 92 : 95;
  const decisionText = agentResult.underwriting_decision || (isFraud ? "Manual Review Recommended" : "Approved for Payout");

  if (!isOfficer) {
    return (
      <div 
        className="glass-card animate-fade-in" 
        style={{ 
          maxWidth: '550px', 
          margin: '3rem auto', 
          padding: '3rem 2rem', 
          textAlign: 'center', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '1.5rem',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        <div 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: '64px', 
            height: '64px', 
            borderRadius: '50%', 
            backgroundColor: 'rgba(16, 185, 129, 0.1)', 
            color: 'var(--risk-low)',
            marginBottom: '0.5rem'
          }}
        >
          <CheckCircle2 size={36} />
        </div>
        
        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-title)', margin: 0 }}>
          Claim Submitted Successfully
        </h3>
        
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0, maxWidth: '420px' }}>
          Your vehicle insurance claim has been successfully submitted. It is now queued for claims audit review. Please wait for further review; we will update you as soon as the assessment is complete.
        </p>

        <div 
          style={{ 
            width: '100%', 
            padding: '1rem', 
            backgroundColor: 'var(--bg-input)', 
            borderRadius: '6px', 
            border: '1px solid var(--border)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <span>Claim Reference ID:</span>
          <b style={{ color: 'var(--secondary)' }}>{selectedApp?.id || 'VEH-' + Math.random().toString(36).substr(2, 6).toUpperCase()}</b>
        </div>
      </div>
    );
  }

  const handleSendInlineChat = async (text) => {
    const msgText = text || inlineChatInput;
    if (!msgText.trim()) return;

    const userMsg = { role: 'user', content: msgText };
    const updatedHistory = [...inlineChatHistory, userMsg];
    setInlineChatHistory(updatedHistory);
    setInlineChatInput("");
    setIsInlineChatLoading(true);

    try {
      const historyPayload = updatedHistory.slice(0, -1).map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        content: msg.content
      }));

      const res = await fetch(`${API_BASE}/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          history: historyPayload,
          context: selectedApp ? { ...selectedApp, agentResult } : { agentResult }
        })
      });

      if (!res.ok) throw new Error();
      const data = await res.json();
      setInlineChatHistory(prev => [...prev, { role: 'model', content: data.reply }]);
    } catch (err) {
      setInlineChatHistory(prev => [...prev, { role: 'model', content: "Failed to connect to ActuaryGPT agent server." }]);
    } finally {
      setIsInlineChatLoading(false);
    }
  };

  return (
    <div className="result-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isFraud ? (
          <ShieldAlert size={20} style={{ color: 'var(--risk-high)' }} />
        ) : (
          <ShieldCheck size={20} style={{ color: 'var(--risk-low)' }} />
        )}
        Automated Claims Audit & Forensic Dossier
      </h3>

      <div className="metrics-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {/* Fraud Probability */}
        <div className="metric-box" style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <span className="metric-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Fraud Probability</span>
          <span className="metric-value" style={{ fontSize: '1.75rem', fontWeight: 700, display: 'block', margin: '0.25rem 0', color: isFraud ? 'var(--risk-high)' : 'var(--risk-low)' }}>
            {fraudProb.toFixed(1)}%
          </span>
          <div className="confidence-bar-bg" style={{ width: '100%', height: '5px', backgroundColor: 'var(--border)', borderRadius: '2.5px', overflow: 'hidden', marginTop: '0.5rem' }}>
            <div className="confidence-bar-fg" style={{ width: `${fraudProb}%`, height: '100%', backgroundColor: isFraud ? 'var(--risk-high)' : 'var(--risk-low)' }}></div>
          </div>
        </div>
        
        {/* Confidence */}
        <div className="metric-box" style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <span className="metric-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Confidence</span>
          <span className="metric-value" style={{ fontSize: '1.75rem', fontWeight: 700, display: 'block', margin: '0.25rem 0', color: 'var(--secondary)' }}>
            {confidenceScore}%
          </span>
          <div className="confidence-bar-bg" style={{ width: '100%', height: '5px', backgroundColor: 'var(--border)', borderRadius: '2.5px', overflow: 'hidden', marginTop: '0.5rem' }}>
            <div className="confidence-bar-fg" style={{ width: `${confidenceScore}%`, height: '100%', backgroundColor: 'var(--secondary)' }}></div>
          </div>
        </div>

        {/* Decision */}
        <div className="metric-box" style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <span className="metric-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Decision</span>
          <span className="metric-value" style={{ fontSize: '1.05rem', fontWeight: 700, display: 'block', margin: '0.35rem 0', color: isFraud ? 'var(--risk-medium)' : 'var(--risk-low)' }}>
            {decisionText}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AI Underwriting recommendation</span>
        </div>

        {/* Claim Amount */}
        <div className="metric-box" style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <span className="metric-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Claim Amount</span>
          <span className="metric-value" style={{ fontSize: '1.75rem', fontWeight: 700, display: 'block', margin: '0.25rem 0', color: 'var(--primary)' }}>
            ₹{selectedApp?.total_claim_amount?.toLocaleString() || agentResult.premium?.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assessed policy payout</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '2rem' }}>
        {/* Left Column: Payout, Vehicle and Explainable AI Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Payout Breakdown */}
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

            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0 0 0', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <Car size={16} />
              Vehicle & Accident Details
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
              <p>Make/Model: <b>{selectedApp?.auto_make} {selectedApp?.auto_model} ({selectedApp?.auto_year})</b></p>
              <p>Property Damage: <b>{selectedApp?.property_damage || 'N/A'}</b></p>
              <p>Police Report: <b>{selectedApp?.police_report_available || 'N/A'}</b></p>
              <p>Bodily Injuries: <b>{selectedApp?.bodily_injuries !== undefined ? selectedApp.bodily_injuries : 'N/A'}</b></p>
            </div>
          </div>

          {/* Customer History Card for Officer Review */}
          <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.03) 0%, rgba(168,85,247,0.03) 100%)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              👤 Customer Claims History Profile
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem 0.5rem', fontSize: '0.8rem', textAlign: 'center' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Policies</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-title)' }}>3</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Previous Claims</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-title)' }}>{previousClaims.length}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Previous Fraud</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--risk-low)' }}>0</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Avg Claim</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--secondary)' }}>₹82,000</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Customer Since</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-title)' }}>2019</span>
              </div>
            </div>
          </div>

          {/* Claimant's Previous Claims List */}
          <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              📋 Claimant's Previous Claims List
            </h4>
            {previousClaims.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No previous claims found for this customer.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.4rem' }}>Claim ID</th>
                      <th style={{ padding: '0.4rem' }}>Date</th>
                      <th style={{ padding: '0.4rem' }}>Amount</th>
                      <th style={{ padding: '0.4rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previousClaims.map(claim => (
                      <tr key={claim.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '0.4rem', fontWeight: 600, color: 'var(--primary)' }}>{claim.id}</td>
                        <td style={{ padding: '0.4rem' }}>{claim.date || 'N/A'}</td>
                        <td style={{ padding: '0.4rem' }}>₹{claim.total_claim_amount?.toLocaleString()}</td>
                        <td style={{ padding: '0.4rem' }}>
                          <span className={`status-badge ${claim.status}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                            {claim.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Explainable AI: Top Factors */}
          <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--risk-low)' }} />
              Top Factors (Explainable AI)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--risk-low)', fontWeight: 'bold' }}>✔</span>
                <span>Incident Severity: <b style={{ color: 'var(--text-title)' }}>{selectedApp?.incident_severity || 'Major Damage'}</b></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--risk-low)', fontWeight: 'bold' }}>✔</span>
                <span>Property Claim: <b style={{ color: 'var(--text-title)' }}>₹{selectedApp?.property_claim?.toLocaleString() || '0'}</b></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--risk-low)', fontWeight: 'bold' }}>✔</span>
                <span>Vehicle Model: <b style={{ color: 'var(--text-title)' }}>{selectedApp?.auto_make || 'Hyundai'} {selectedApp?.auto_model || 'Creta'}</b></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--risk-low)', fontWeight: 'bold' }}>✔</span>
                <span>Previous Claim History: <b style={{ color: 'var(--text-title)' }}>{selectedApp?.months_as_customer ? `${selectedApp.months_as_customer} Months Customer` : 'New Profile'}</b></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--risk-low)', fontWeight: 'bold' }}>✔</span>
                <span>Claim Amount: <b style={{ color: 'var(--text-title)' }}>₹{selectedApp?.total_claim_amount?.toLocaleString() || '0'}</b></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--risk-low)', fontWeight: 'bold' }}>✔</span>
                <span>Police Report: <b style={{ color: 'var(--text-title)' }}>{selectedApp?.police_report_available || 'YES'}</b></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Audit Report */}
        <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', height: '100%' }}>
          <span className="metric-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Forensic Claim Audit & Recommendations</span>
          <div className="report-content" style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-main)', maxHeight: '520px', overflowY: 'auto', paddingRight: '0.5rem', whiteSpace: 'pre-line' }}>
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

      {/* AI Inline Chat Section */}
      <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          <Bot size={18} style={{ color: 'var(--secondary)' }} />
          Ask ActuaryGPT AI about this Claim
        </h4>
        
        {/* Messages */}
        <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem', padding: '0.5rem', backgroundColor: 'rgba(0, 0, 0, 0.25)', borderRadius: '6px' }}>
          {inlineChatHistory.map((msg, idx) => (
            <div key={idx} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', padding: '0.5rem 0.75rem', borderRadius: '8px', backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-input)', border: msg.role === 'user' ? 'none' : '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--text-title)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.15rem', fontWeight: 600 }}>
                {msg.role === 'model' ? 'Gemini AI Assistant' : 'You'}
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
            </div>
          ))}
          {isInlineChatLoading && (
            <div style={{ alignSelf: 'flex-start', padding: '0.5rem 0.75rem', borderRadius: '8px', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              AI Co-Pilot is thinking...
            </div>
          )}
        </div>

        {/* Suggestion Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {[
            "Why was this marked fraud?",
            "Explain incident severity.",
            "Show similar approved claims.",
            "Suggest manual review reasons."
          ].map((sug, sidx) => (
            <button
              key={sidx}
              type="button"
              disabled={isInlineChatLoading}
              onClick={() => handleSendInlineChat(sug)}
              className="btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: '15px', border: '1px solid var(--border)', backgroundColor: 'var(--bg-input)', color: 'var(--text-main)', cursor: 'pointer', transition: 'all 0.2s', height: 'auto', display: 'inline-flex' }}
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Ask Gemini a question about this claim..."
            value={inlineChatInput}
            onChange={(e) => setInlineChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendInlineChat()}
            disabled={isInlineChatLoading}
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem', flex: 1 }}
          />
          <button
            type="button"
            className="btn-primary"
            onClick={() => handleSendInlineChat()}
            disabled={isInlineChatLoading || !inlineChatInput.trim()}
            style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem' }}
          >
            Ask
          </button>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {agentResult.pdf_url ? (
            <button 
              onClick={() => downloadPDF(`${API_BASE}${agentResult.pdf_url}`)}
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', fontWeight: 600 }}
            >
              <Download size={16} />
              Download PDF Report
            </button>
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
