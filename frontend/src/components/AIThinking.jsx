import React from 'react';
import { Loader2, Bot } from 'lucide-react';

export default function AIThinking({ pipelineSteps, message = "Executing agentic pipeline..." }) {
  const getStepStatus = (keys) => {
    const matchSteps = pipelineSteps.filter(s => keys.includes(s.key));
    if (matchSteps.some(s => s.status === 'active')) return 'active';
    if (matchSteps.every(s => s.status === 'completed')) return 'completed';
    return 'pending';
  };

  const agents = [
    { name: "OCR Agent", status: getStepStatus(['ocr']) },
    { name: "Validation Agent", status: getStepStatus(['validate', 'verification']) },
    { name: "Feature Engineering Agent", status: getStepStatus(['policy', 'analysis']) },
    { name: "CatBoost Prediction Agent", status: getStepStatus(['ml']) },
    { name: "Similar Case Retrieval Agent", status: getStepStatus(['rag']) },
    { name: "Gemini Explanation Agent", status: getStepStatus(['explain']) },
    { name: "Recommendation Agent", status: getStepStatus(['calc']) },
    { name: "Report Generation Agent", status: getStepStatus(['pdf']) }
  ];

  const completedCount = pipelineSteps.filter(s => s.status === 'completed').length;
  const progressPercent = Math.min(100, Math.round((completedCount / pipelineSteps.length) * 100));
  const estimatedTime = Math.max(1, Math.round((pipelineSteps.length - completedCount) * 0.5));

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '2rem', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-title)', margin: '0 0 1rem 0' }}>
        <Bot size={22} style={{ color: 'var(--primary)' }} />
        🤖 Master AI Agent
      </h3>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', paddingBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {agents.map((agent, idx) => {
          let statusText = "Pending";
          let color = "var(--text-muted)";
          let icon = <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--border)', display: 'inline-flex' }}></div>;
          
          if (agent.status === 'completed') {
            statusText = "Completed";
            color = "var(--risk-low)";
            icon = <span style={{ color: 'var(--risk-low)', fontWeight: 'bold' }}>✓</span>;
          } else if (agent.status === 'active') {
            statusText = "Running";
            color = "var(--primary)";
            icon = <Loader2 className="animate-spin" size={14} style={{ color: 'var(--primary)', animation: 'spin 1.5s linear infinite' }} />;
          }

          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.50rem' }}>
                <span style={{ display: 'inline-flex', width: '16px', justifyContent: 'center' }}>{icon}</span>
                <span style={{ color: agent.status === 'active' ? 'var(--text-title)' : 'var(--text-main)', fontWeight: agent.status === 'active' ? 700 : 500 }}>{agent.name}</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color }}>{statusText}</span>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <span>Overall Progress</span>
          <b style={{ color: 'var(--text-title)' }}>{progressPercent}%</b>
        </div>
        <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: 'var(--primary)', transition: 'width 0.4s ease' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          <span>Estimated Time Remaining</span>
          <b style={{ color: 'var(--text-title)' }}>{estimatedTime} seconds</b>
        </div>
      </div>
    </div>
  );
}
