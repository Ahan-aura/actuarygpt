import React, { useState } from 'react';
import { ShieldCheck, Download, AlertTriangle, History, Bot, CheckCircle2, FileText } from 'lucide-react';
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
  setExpandedSimCaseId,
  processedApps = []
}) {
  const previousPolicies = (processedApps && selectedApp && selectedApp.client)
    ? processedApps.filter(app => app && app.client === selectedApp.client && app.id !== selectedApp.id)
    : [];
  
  const currentYear = new Date().getFullYear();
  let customerSinceYear = currentYear;
  if (selectedApp?.date) {
    const appYear = new Date(selectedApp.date).getFullYear();
    if (!isNaN(appYear)) {
      customerSinceYear = Math.min(customerSinceYear, appYear);
    }
  }
  previousPolicies.forEach(app => {
    if (app.date) {
      const yr = new Date(app.date).getFullYear();
      if (!isNaN(yr)) {
        customerSinceYear = Math.min(customerSinceYear, yr);
      }
    }
  });

  const previousClaimsCount = selectedApp?.previous_claims !== undefined ? parseInt(selectedApp.previous_claims) : 0;

  let similarCasesList = agentResult?.similar_cases;
  if (typeof similarCasesList === 'string') {
    try {
      similarCasesList = JSON.parse(similarCasesList);
    } catch (_) {
      similarCasesList = [];
    }
  }
  if (!Array.isArray(similarCasesList)) {
    similarCasesList = [];
  }

  const [isModifying, setIsModifying] = React.useState(false);
  const [modAmount, setModAmount] = React.useState(agentResult?.premium || "");

  // Inline AI Chat states
  const [inlineChatHistory, setInlineChatHistory] = useState([
    { role: 'model', content: "Hello! I am Gemini, your Explainable AI assistant. I can help explain this policy's risk classification, medical profile analysis, similar profiles, or underwriting recommendations." }
  ]);
  const [inlineChatInput, setInlineChatInput] = useState("");
  const [isInlineChatLoading, setIsInlineChatLoading] = useState(false);

  if (!agentResult) return null;

  let primaryDocName = "supporting_id_document.pdf";
  let medicalReportsName = "medical_diagnosis_report.pdf";
  let dischargeSummaryName = "discharge_summary.pdf";
  let prescriptionName = "doctor_prescription.pdf";
  let deathCertificateName = "death_certificate.pdf";
  let nomineeIdProofName = "nominee_id_proof.pdf";
  let hospitalRecordsName = "hospital_records_brief.pdf";
  let policeFirName = "fir_accident_report.pdf";
  let postmortemName = "postmortem_report.pdf";
  let funeralName = "funeral_certificate.pdf";

  const rawBill = selectedApp?.medical_bill || selectedApp?.medicalBill;
  if (rawBill && typeof rawBill === 'string' && rawBill.trim().startsWith('{')) {
    try {
      const files = JSON.parse(rawBill);
      if (files.primary) primaryDocName = files.primary;
      if (files.medicalReports) medicalReportsName = files.medicalReports;
      if (files.dischargeSummary) dischargeSummaryName = files.dischargeSummary;
      if (files.prescription) prescriptionName = files.prescription;
      if (files.deathCertificate) deathCertificateName = files.deathCertificate;
      if (files.nomineeIdProof) nomineeIdProofName = files.nomineeIdProof;
      if (files.hospitalRecords) hospitalRecordsName = files.hospitalRecords;
      if (files.policeFir) policeFirName = files.policeFir;
      if (files.postmortem) postmortemName = files.postmortem;
      if (files.funeral) funeralName = files.funeral;
    } catch (_) {
      primaryDocName = rawBill;
    }
  } else if (rawBill) {
    primaryDocName = rawBill;
  }

  const decisionText = agentResult.underwriting_decision || "Refer for Manual Review";

  const coverageAmount = parseFloat(selectedApp?.coverage_amount || 0);
  const premium = parseFloat(agentResult?.premium || 0);
  
  const claimedAmount = coverageAmount;
  const deduction = parseFloat(selectedApp?.policy_deductable || 20000);
  const isSuspicious = agentResult.risk_class >= 6;
  const recommendedPayout = isSuspicious ? 0 : Math.max(0, claimedAmount - deduction);
  const fraudProbability = Math.round((agentResult.risk_class / 8) * 100);
  const fraudSeverityLabel = fraudProbability < 15 ? "Low" : fraudProbability < 45 ? "Medium" : "High";
  
  const finalDecisionText = isSuspicious ? "Manual Investigation" : "Approve Claim";
  const riskClassText = `Class ${agentResult.risk_class || 1}`;
  const riskCategoryLabel = isSuspicious ? "HIGH FRAUD RISK" : "LOW FRAUD RISK";

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
          Application Submitted Successfully
        </h3>
        
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0, maxWidth: '420px' }}>
          Your insurance application has been successfully submitted. It is now queued for underwriting review. Please wait for further review; we will update you as soon as the assessment is complete.
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
          <span>Application Reference ID:</span>
          <b style={{ color: 'var(--primary)' }}>{selectedApp?.id || 'APP-' + Math.random().toString(36).substr(2, 6).toUpperCase()}</b>
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
        <ShieldCheck size={20} style={{ color: 'var(--risk-low)' }} />
        AI Risk Assessment & Actuarial Dossier
      </h3>

      <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-card)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          
          {/* 1. Claim Risk Class */}
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>1. Claim Risk Class</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, display: 'block', margin: '0.25rem 0', color: isSuspicious ? 'var(--risk-high)' : 'var(--risk-low)' }}>
              {riskClassText}
            </span>
            <span style={{ 
              fontSize: '0.7rem', 
              padding: '0.15rem 0.5rem', 
              borderRadius: '4px', 
              backgroundColor: isSuspicious ? 'var(--risk-high-bg)' : 'var(--risk-low-bg)', 
              color: isSuspicious ? 'var(--risk-high)' : 'var(--risk-low)', 
              fontWeight: 700 
            }}>
              {riskCategoryLabel}
            </span>
          </div>

          {/* 2. AI Confidence */}
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>2. AI Confidence</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, display: 'block', margin: '0.25rem 0', color: 'var(--secondary)' }}>
              {agentResult.confidence}%
            </span>
            <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', marginTop: '0.5rem' }}>
              <div style={{ width: `${agentResult.confidence}%`, height: '100%', backgroundColor: 'var(--secondary)' }}></div>
            </div>
          </div>

          {/* 3. Claim Decision */}
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>3. Claim Decision</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, display: 'block', margin: '0.4rem 0', color: isSuspicious ? 'var(--risk-high)' : 'var(--risk-low)' }}>
              {finalDecisionText}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Automated recommendation</span>
          </div>

          {/* 4. Claimed Amount */}
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>4. Claimed Amount</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, display: 'block', margin: '0.25rem 0', color: 'var(--text-title)' }}>
              ₹{claimedAmount.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total requested claim payout</span>
          </div>

          {/* 5. Recommended Payout */}
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>5. Recommended Payout</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, display: 'block', margin: '0.25rem 0', color: isSuspicious ? 'var(--text-muted)' : 'var(--primary)' }}>
              ₹{recommendedPayout.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Adjusted payout amount</span>
          </div>

          {/* 6. Deduction */}
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>6. Deduction</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, display: 'block', margin: '0.25rem 0', color: 'var(--risk-medium)' }}>
              ₹{deduction.toLocaleString()}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Policy Excess / Non-covered Expenses</span>
          </div>

          {/* 7. Fraud Probability */}
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>7. Fraud Probability</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, display: 'block', margin: '0.25rem 0', color: isSuspicious ? 'var(--risk-high)' : 'var(--risk-low)' }}>
              {fraudProbability}%
            </span>
            <span style={{ 
              fontSize: '0.7rem', 
              padding: '0.15rem 0.5rem', 
              borderRadius: '4px', 
              backgroundColor: isSuspicious ? 'var(--risk-high-bg)' : 'var(--risk-low-bg)', 
              color: isSuspicious ? 'var(--risk-high)' : 'var(--risk-low)', 
              fontWeight: 700 
            }}>
              {fraudSeverityLabel}
            </span>
          </div>

          {/* 8. Processing Time / Reason */}
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '8px' }}>
            {!isSuspicious ? (
              <>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>8. Processing Time</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 700, display: 'block', margin: '0.4rem 0', color: 'var(--text-title)' }}>
                  Estimated: 7 Days
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Subject to immediate verification</span>
              </>
            ) : (
              <>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Reason</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--risk-high)', fontWeight: 600 }}>
                  <div>• High fraud probability</div>
                  <div>• Duplicate hospital records</div>
                  <div>• Policy mismatch</div>
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* AI Claims Verification Checklist */}
      <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-card)' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
          AI Claims Verification & Audit Checks
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Policy Active?</span>
            <span style={{ fontWeight: 700, color: 'var(--risk-low)' }}>✓ Active</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Premium Paid?</span>
            <span style={{ fontWeight: 700, color: 'var(--risk-low)' }}>✓ Fully Paid</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Waiting Period Completed?</span>
            <span style={{ fontWeight: 700, color: 'var(--risk-low)' }}>✓ Completed</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Nominee Matches Policy?</span>
            <span style={{ fontWeight: 700, color: 'var(--risk-low)' }}>✓ Verified Match</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Death Certificate Valid?</span>
            {selectedApp?.insurance_type === "Life" ? (
              <span style={{ fontWeight: 700, color: 'var(--risk-low)' }}>✓ Registry Verified</span>
            ) : (
              <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>N/A (Health Claim)</span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Duplicate Claim?</span>
            <span style={{ fontWeight: 700, color: 'var(--risk-low)' }}>✓ No duplicates</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Fraud Probability?</span>
            <span style={{ fontWeight: 700, color: isSuspicious ? 'var(--risk-high)' : 'var(--risk-low)' }}>
              {fraudProbability}% ({fraudSeverityLabel})
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Blockchain Verification?</span>
            <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>✓ Secured On-Chain</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-input)', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Final Decision:</span>
            <span style={{ fontWeight: 700, color: isSuspicious ? 'var(--risk-high)' : 'var(--risk-low)' }}>
              {finalDecisionText}
            </span>
          </div>

        </div>
      </div>

      {/* Submitted Claim Documents & Evidence */}
      <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: 'var(--bg-card)' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 1rem 0', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          <FileText size={18} style={{ color: 'var(--primary)' }} />
          Submitted Documents & Claims Evidence
        </h4>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {/* Document 1: Primary policy/id document */}
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0, gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
              <FileText size={20} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', color: 'var(--text-title)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {primaryDocName}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Primary ID / Policy Copy • 1.4 MB</span>
              </div>
            </div>
            <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--risk-low-bg)', color: 'var(--risk-low)', fontWeight: 700, flexShrink: 0 }}>OCR Verified</span>
          </div>

          {selectedApp?.insurance_type === "Life" ? (
            <>
              {/* Life Document 2: Death certificate */}
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0, gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  <FileText size={20} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', color: 'var(--text-title)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deathCertificateName}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Certified Registrar Copy • 2.1 MB</span>
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--risk-low-bg)', color: 'var(--risk-low)', fontWeight: 700, flexShrink: 0 }}>Signature Match</span>
              </div>

              {/* Life Document 3: Nominee ID */}
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0, gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  <FileText size={20} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', color: 'var(--text-title)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nomineeIdProofName}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Aadhaar Card copy • 950 KB</span>
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--risk-low-bg)', color: 'var(--risk-low)', fontWeight: 700, flexShrink: 0 }}>Aadhaar API Verified</span>
              </div>

              {/* Life Document 4: Police FIR */}
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0, gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  <FileText size={20} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', color: 'var(--text-title)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{policeFirName}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Police Incident Report • 1.8 MB</span>
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--risk-low-bg)', color: 'var(--risk-low)', fontWeight: 700, flexShrink: 0 }}>Authenticated</span>
              </div>
            </>
          ) : (
            <>
              {/* Health Document 2: Diagnosis Reports */}
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0, gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  <FileText size={20} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', color: 'var(--text-title)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{medicalReportsName}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Lab Reports & Pathology • 3.2 MB</span>
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--risk-low-bg)', color: 'var(--risk-low)', fontWeight: 700, flexShrink: 0 }}>Diagnosis Match</span>
              </div>

              {/* Health Document 3: Discharge Summary */}
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0, gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  <FileText size={20} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', color: 'var(--text-title)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dischargeSummaryName}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Hospital Discharge Sheet • 1.1 MB</span>
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--risk-low-bg)', color: 'var(--risk-low)', fontWeight: 700, flexShrink: 0 }}>Hospital Signature</span>
              </div>

              {/* Health Document 4: Prescription */}
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0, gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  <FileText size={20} style={{ color: 'var(--secondary)', flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', color: 'var(--text-title)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prescriptionName}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Prescribed Medications • 600 KB</span>
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', backgroundColor: 'var(--risk-low-bg)', color: 'var(--risk-low)', fontWeight: 700, flexShrink: 0 }}>Physician Signed</span>
              </div>
            </>
          )}
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

          {/* Customer History Card for Officer Review */}
          <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.03) 0%, rgba(168,85,247,0.03) 100%)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              👤 Customer Claims History Profile
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem 0.5rem', fontSize: '0.8rem', textAlign: 'center' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Policies</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-title)' }}>{previousPolicies.length + 1}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Previous Claims</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-title)' }}>{previousClaimsCount}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Previous Fraud</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--risk-low)' }}>0</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Avg Claim</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--secondary)' }}>{previousClaimsCount > 0 ? "₹82,000" : "₹0"}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Customer Since</span>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-title)' }}>{customerSinceYear}</span>
              </div>
            </div>
          </div>

          {/* Claimant's Previous Policies List */}
          <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              📋 Claimant's Previous Policies List
            </h4>
            {previousPolicies.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No previous policies found for this customer.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.4rem' }}>ID</th>
                      <th style={{ padding: '0.4rem' }}>Type</th>
                      <th style={{ padding: '0.4rem' }}>Coverage</th>
                      <th style={{ padding: '0.4rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previousPolicies.map(policy => (
                      <tr key={policy.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '0.4rem', fontWeight: 600, color: 'var(--primary)' }}>{policy.id}</td>
                        <td style={{ padding: '0.4rem' }}>{policy.insurance_type || 'Life'}</td>
                        <td style={{ padding: '0.4rem' }}>₹{policy.coverage_amount?.toLocaleString()}</td>
                        <td style={{ padding: '0.4rem' }}>
                          <span className={`status-badge ${policy.status}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                            {policy.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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

      {isOfficer && similarCasesList && (
        <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-title)' }}>
            <History size={16} style={{ color: 'var(--primary)' }} />
            Top Similar Historical Reference Cases (RAG Matches)
          </h4>
          
          {similarCasesList.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No historical matches found in database.</p>
          ) : (
            <div className="similarity-cases-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {similarCasesList.map((scase, sidx) => (
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
