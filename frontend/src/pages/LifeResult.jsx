import React, { useState } from 'react';
import { ShieldCheck, Download, AlertTriangle, History, Bot, CheckCircle2 } from 'lucide-react';
import SimilarCaseCard from '../components/SimilarCaseCard';
import { downloadPDF } from '../utils/download';

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

  // Inline AI Chat states
  const [inlineChatHistory, setInlineChatHistory] = useState([
    { role: 'model', content: "Hello! I am Gemini, your Explainable AI assistant. I can help explain this policy's risk classification, medical profile analysis, similar profiles, or underwriting recommendations." }
  ]);
  const [inlineChatInput, setInlineChatInput] = useState("");
  const [isInlineChatLoading, setIsInlineChatLoading] = useState(false);

  if (!agentResult) return null;

  const decisionText = agentResult.underwriting_decision || "Refer for Manual Review";

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
        <ShieldCheck size={20} style={{ color: 'var(--risk-low)' }} />
        AI Risk Assessment & Actuarial Dossier
      </h3>

      <div className="metrics-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {/* Predicted Risk Class */}
        <div className="metric-box" style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <span className="metric-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Predicted Risk Class</span>
          <span className="metric-value" style={{ fontSize: '1.75rem', fontWeight: 700, display: 'block', margin: '0.25rem 0', color: 'var(--text-title)' }}>
            Class {agentResult.risk_class}
          </span>
          <span className={`risk-badge class-${agentResult.risk_class}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem', borderRadius: '4px', backgroundColor: agentResult.risk_class <= 2 ? 'var(--risk-low-bg)' : agentResult.risk_class <= 5 ? 'var(--risk-medium-bg)' : 'var(--risk-high-bg)', color: agentResult.risk_class <= 2 ? 'var(--risk-low)' : agentResult.risk_class <= 5 ? 'var(--risk-medium)' : 'var(--risk-high)', fontWeight: 600 }}>
            {agentResult.risk_category}
          </span>
        </div>
        
        {/* Inference Confidence */}
        <div className="metric-box" style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <span className="metric-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Inference Confidence</span>
          <span className="metric-value" style={{ fontSize: '1.75rem', fontWeight: 700, display: 'block', margin: '0.25rem 0', color: 'var(--secondary)' }}>
            {agentResult.confidence}%
          </span>
          <div className="confidence-bar-bg" style={{ width: '100%', height: '5px', backgroundColor: 'var(--border)', borderRadius: '2.5px', overflow: 'hidden', marginTop: '0.5rem' }}>
            <div className="confidence-bar-fg" style={{ width: `${agentResult.confidence}%`, height: '100%', backgroundColor: 'var(--secondary)' }}></div>
          </div>
        </div>

        {/* Decision */}
        <div className="metric-box" style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <span className="metric-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Decision</span>
          <span className="metric-value" style={{ fontSize: '1.05rem', fontWeight: 700, display: 'block', margin: '0.35rem 0', color: 'var(--primary)' }}>
            {decisionText}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AI Underwriting recommendation</span>
        </div>

        {/* Annual Premium */}
        <div className="metric-box" style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <span className="metric-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Recommended Annual Premium</span>
          <span className="metric-value" style={{ fontSize: '1.75rem', fontWeight: 700, display: 'block', margin: '0.25rem 0', color: 'var(--primary)' }}>
            ₹{agentResult.premium?.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-calculated actuarial rate</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '2rem' }}>
        {/* Left Column: Top Factors and Medical Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Explainable AI: Top Factors */}
          <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <CheckCircle2 size={16} style={{ color: 'var(--risk-low)' }} />
              Top Factors (Explainable AI)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--risk-low)', fontWeight: 'bold' }}>✔</span>
                <span>Smoker Status: <b style={{ color: 'var(--text-title)' }}>{selectedApp?.smoker === 1 ? 'Smoker (High Risk)' : 'Non-Smoker'}</b></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--risk-low)', fontWeight: 'bold' }}>✔</span>
                <span>Medical History: <b style={{ color: 'var(--text-title)' }}>{selectedApp?.medicalConditions || 'No existing conditions'}</b></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--risk-low)', fontWeight: 'bold' }}>✔</span>
                <span>BMI Index: <b style={{ color: 'var(--text-title)' }}>{selectedApp?.weight && selectedApp?.height ? (selectedApp.weight / ((selectedApp.height / 100) ** 2)).toFixed(1) : '24.5'} (Normal)</b></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--risk-low)', fontWeight: 'bold' }}>✔</span>
                <span>Occupation Risk: <b style={{ color: 'var(--text-title)' }}>{selectedApp?.occupation || 'Professional'}</b></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--risk-low)', fontWeight: 'bold' }}>✔</span>
                <span>Coverage Amount: <b style={{ color: 'var(--text-title)' }}>₹{selectedApp?.coverage_amount?.toLocaleString() || '₹10,00,000'}</b></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--risk-low)', fontWeight: 'bold' }}>✔</span>
                <span>Age Factor: <b style={{ color: 'var(--text-title)' }}>{selectedApp?.age || '35'} years</b></span>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <span className="metric-label" style={{ display: 'block', fontWeight: 600 }}>Application Overview</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-main)' }}>
              <p>Applicant: <b>{selectedApp?.client || 'N/A'}</b></p>
              <p>Policy Type: <b>{selectedApp?.insurance_type || 'Life'}</b></p>
              <p>Income: <b>₹{selectedApp?.income?.toLocaleString() || 'N/A'}</b></p>
              <p>Nominee Age: <b>{selectedApp?.nomineeAge || 'N/A'} years</b></p>
            </div>
          </div>
        </div>

        {/* Right Column: AI Risk Justification */}
        <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', height: '100%' }}>
          <span className="metric-label" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Actuarial Report & Risk Justification</span>
          <div className="report-content" style={{ fontSize: '0.85rem', lineHeight: '1.6', color: 'var(--text-main)', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.5rem', whiteSpace: 'pre-line' }}>
            {agentResult.report}
          </div>
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

      {/* AI Inline Chat Section */}
      <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          <Bot size={18} style={{ color: 'var(--secondary)' }} />
          Ask ActuaryGPT AI about this Policy
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
            "Why was this risk class assigned?",
            "Explain medical conditions impact.",
            "Show similar approved profiles.",
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
            placeholder="Ask Gemini a question about this profile..."
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
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Modified Annual Premium (INR)</label>
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
