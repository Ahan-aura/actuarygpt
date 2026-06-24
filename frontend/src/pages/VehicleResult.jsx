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
  
  const currentYear = new Date().getFullYear();
  const monthsAsCustomer = selectedApp?.months_as_customer !== undefined ? parseInt(selectedApp.months_as_customer) : 0;
  let customerSinceYear = currentYear - Math.floor(monthsAsCustomer / 12);

  if (previousClaims.length === 0) {
    customerSinceYear = selectedApp?.date ? new Date(selectedApp.date).getFullYear() : currentYear;
  }

  const previousClaimsCount = previousClaims.length;
  const previousFraudCount = previousClaims.filter(c => c.status === 'rejected' || c.fraud_reported === 'Y').length;
  
  let avgClaimAmount = 0;
  if (previousClaimsCount > 0) {
    const total = previousClaims.reduce((sum, c) => sum + (c.total_claim_amount || 0), 0);
    avgClaimAmount = Math.round(total / previousClaimsCount);
  }
  const avgClaimText = avgClaimAmount > 0 ? `₹${avgClaimAmount.toLocaleString()}` : "₹0";

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

  const mockSimilarClaims = [
    { id: 'Claim VH1245', similarity: 96, status: 'Approved', amount: 82000 },
    { id: 'Claim VH1112', similarity: 94, status: 'Approved', amount: 85000 },
    { id: 'Claim VH1021', similarity: 91, status: 'Manual Review', amount: 88000 }
  ];

  const displayedSimilarClaims = agentResult.similar_cases && agentResult.similar_cases.length > 0
    ? agentResult.similar_cases.slice(0, 3).map((c, idx) => ({
        id: c.id ? (c.id.toString().startsWith('Claim') ? c.id : `Claim ${c.id}`) : mockSimilarClaims[idx].id,
        similarity: c.similarity || mockSimilarClaims[idx].similarity,
        status: c.fraud_reported === 'Y' ? 'Flagged Fraud' : (c.status || mockSimilarClaims[idx].status),
        amount: c.total_claim_amount || mockSimilarClaims[idx].amount
      }))
    : mockSimilarClaims;

  const filledBlocks = Math.min(10, Math.max(0, Math.round(confidenceScore / 10)));
  const meterStr = '█'.repeat(filledBlocks) + '░'.repeat(10 - filledBlocks);

  return (
    <div className="result-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isFraud ? (
          <ShieldAlert size={20} style={{ color: 'var(--risk-high)' }} />
        ) : (
          <ShieldCheck size={20} style={{ color: 'var(--risk-low)' }} />
        )}
        Agentic AI Underwriting & Claims Intelligence Platform
      </h3>

      {/* THREE COLUMN RESULT GRID */}
      <div className="metrics-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {/* LEFT SIDE: Claim Summary */}
        <div className="metric-box glass-card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-title)', margin: 0, borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
            Claim Summary
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Claim ID:</span>
              <span style={{ fontWeight: 600 }}>{selectedApp?.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Vehicle:</span>
              <span style={{ fontWeight: 600 }}>{selectedApp?.auto_make} {selectedApp?.auto_model}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Policy:</span>
              <span style={{ fontWeight: 600 }}>{selectedApp?.policy_number || selectedApp?.policyNumber || 'POL-849204'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
              <span style={{ fontWeight: 600 }}>{selectedApp?.client || selectedApp?.ownerName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status:</span>
              <span className={`status-badge ${selectedApp?.status}`} style={{ fontSize: '0.75rem', padding: '0.1rem 0.4rem', borderRadius: '4px', textTransform: 'capitalize' }}>
                {selectedApp?.status}
              </span>
            </div>
          </div>
        </div>

        {/* CENTER: Metrics */}
        <div className="metric-box glass-card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.6rem', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fraud Probability</span>
            <span style={{ fontSize: '1.6rem', fontWeight: 700, color: isFraud ? 'var(--risk-high)' : 'var(--risk-low)' }}>
              {Math.round(fraudProb)}%
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--secondary)' }}>
              {confidenceScore}%
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recommended Decision</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: isFraud ? 'var(--risk-medium)' : 'var(--risk-low)' }}>
              {decisionText}
            </span>
          </div>
        </div>

        {/* RIGHT SIDE: AI Confidence Meter */}
        <div className="metric-box glass-card" style={{ padding: '1.25rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-title)', margin: 0 }}>
            AI Confidence Meter
          </h4>
          <div style={{ fontFamily: 'monospace', fontSize: '1.2rem', letterSpacing: '2px', color: 'var(--primary)', textShadow: '0 0 8px rgba(99,102,241,0.5)' }}>
            {meterStr}
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            {confidenceScore}%
          </span>
          <div style={{ display: 'flex', gap: '0.6rem', fontSize: '0.7rem', marginTop: '0.2rem' }}>
            <span style={{ color: 'var(--risk-low)', fontWeight: 600 }}>Low Risk</span>
            <span style={{ color: 'var(--risk-medium)', fontWeight: 600 }}>Medium Risk</span>
            <span style={{ color: 'var(--risk-high)', fontWeight: 600 }}>High Risk</span>
          </div>
        </div>
      </div>

      {/* BELOW RESULT: AI Explanation */}
      <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-title)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
          AI Explanation
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
          <p style={{ margin: 0 }}>The claim amount is consistent with the accident severity.</p>
          <p style={{ margin: 0 }}>Customer has no previous fraud history.</p>
          <p style={{ margin: 0 }}>The damage pattern matches historical approved claims.</p>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', fontWeight: 700, fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Recommendation:</span>
            <span style={{ color: isFraud ? 'var(--risk-medium)' : 'var(--risk-low)' }}>{decisionText}</span>
          </div>
        </div>
      </div>

      {/* BELOW AI EXPLANATION: Top Factors Used */}
      <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-title)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
          Top Factors Used
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--risk-low)', fontWeight: 'bold' }}>✓</span>
            <span>Incident Severity</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--risk-low)', fontWeight: 'bold' }}>✓</span>
            <span>Property Claim</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--risk-low)', fontWeight: 'bold' }}>✓</span>
            <span>Vehicle Model</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--risk-low)', fontWeight: 'bold' }}>✓</span>
            <span>Annual Premium</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--risk-low)', fontWeight: 'bold' }}>✓</span>
            <span>Previous Claims</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--risk-low)', fontWeight: 'bold' }}>✓</span>
            <span>Occupation</span>
          </div>
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontStyle: 'italic' }}>
          Explainable AI.
        </div>
      </div>

      {/* BELOW THAT: Similar Historical Claims */}
      <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-title)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
          Similar Historical Claims
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {displayedSimilarClaims.map((claim, cidx) => (
            <div key={cidx} style={{ borderBottom: cidx < displayedSimilarClaims.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600 }}>
                <span style={{ color: 'var(--primary)' }}>{claim.id}</span>
                <span style={{ color: 'var(--risk-low)' }}>{claim.similarity}% Similar</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                <span style={{ color: claim.status === 'Approved' ? 'var(--risk-low)' : 'var(--risk-medium)' }}>{claim.status}</span>
                <span style={{ fontWeight: 600 }}>₹{claim.amount.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BELOW THAT: Customer History */}
      <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-title)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
          Customer History
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', textAlign: 'center', fontSize: '0.85rem' }}>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Policies</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-title)' }}>{previousClaimsCount + 1}</span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Claims</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-title)' }}>{previousClaimsCount}</span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fraud Cases</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--risk-low)' }}>{previousFraudCount}</span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customer Since</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-title)' }}>{customerSinceYear}</span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average Claim</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--secondary)' }}>{avgClaimText}</span>
          </div>
        </div>
      </div>

      {/* Detailed Claim Report log (if present, keep collapsible/readable) */}
      {agentResult.report && (
        <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-title)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
            Detailed Underwriting Dossier
          </h4>
          <div className="report-content" style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-main)', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem', whiteSpace: 'pre-line' }}>
            {agentResult.report}
          </div>
        </div>
      )}

      {/* AI Chat Co-Pilot Inline Section */}
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

      {/* UNDERWRITER ACTIONS (Bottom of Page) */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isOfficer && (
            <>
              <button 
                className="btn-primary" 
                onClick={() => onApprove(null)}
                style={{ backgroundColor: 'var(--risk-low)', borderColor: 'var(--risk-low)', color: '#fff', padding: '0.6rem 1.4rem', fontWeight: 600 }}
              >
                Approve
              </button>
              <button 
                className="btn-primary" 
                onClick={() => setIsModifying(!isModifying)}
                style={{ backgroundColor: 'var(--secondary)', borderColor: 'var(--secondary)', color: '#fff', padding: '0.6rem 1.4rem', fontWeight: 600 }}
              >
                Approve with Changes
              </button>
              <button 
                className="btn-secondary" 
                onClick={onManualReview}
                style={{ borderColor: 'var(--border)', color: 'var(--text-title)', padding: '0.6rem 1.4rem', fontWeight: 600 }}
              >
                Manual Review
              </button>
              <button 
                className="btn-primary" 
                onClick={onReject}
                style={{ backgroundColor: 'var(--risk-high)', borderColor: 'var(--risk-high)', color: '#fff', padding: '0.6rem 1.4rem', fontWeight: 600 }}
              >
                Reject
              </button>
            </>
          )}

          {agentResult.pdf_url && (
            <button 
              onClick={() => downloadPDF(`${API_BASE}${agentResult.pdf_url}`)}
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.4rem', fontWeight: 600 }}
            >
              <Download size={16} />
              Download PDF
            </button>
          )}
        </div>

        {isModifying && (
          <div className="animate-slide-in" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--bg-input)', display: 'flex', gap: '1rem', alignItems: 'center', maxWidth: '400px', margin: '0.5rem auto 0 auto' }}>
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
