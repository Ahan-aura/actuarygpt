import React from 'react';
import { CheckCircle2, Bot } from 'lucide-react';

export default function AIThinking({ pipelineSteps, message = "Executing the agentic underwriting pipeline:" }) {
  const isAllCompleted = pipelineSteps.length > 0 && pipelineSteps.every(step => step.status === 'completed');

  return (
    <div className="pipeline-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-title)', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
        <Bot size={20} style={{ color: 'var(--primary)' }} />
        🤖 ActuaryGPT Agent
      </h3>
      
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{message}</p>
      
      <div className="pipeline-steps" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {pipelineSteps.map(step => (
          <div 
            key={step.key} 
            className={`pipeline-step ${step.status}`}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              fontSize: '0.9rem', 
              color: step.status === 'completed' ? 'var(--text-title)' : step.status === 'active' ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: step.status === 'active' ? '600' : '400'
            }}
          >
            {step.status === 'active' && (
              <div className="spinner" style={{ 
                width: '16px', 
                height: '16px', 
                border: '2px solid rgba(99, 102, 241, 0.1)', 
                borderTop: '2px solid var(--primary)', 
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }}></div>
            )}
            {step.status === 'completed' && <CheckCircle2 size={16} style={{ color: 'var(--risk-low)' }} />}
            {step.status === 'pending' && <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid var(--border)' }}></div>}
            <span>{step.label}</span>
          </div>
        ))}
      </div>

      {isAllCompleted && (
        <div 
          className="animate-fade-in" 
          style={{ 
            marginTop: '1.25rem', 
            padding: '0.6rem 1rem', 
            backgroundColor: 'var(--risk-low-bg)', 
            border: '1px solid var(--risk-low-border)', 
            borderRadius: '6px', 
            textAlign: 'center',
            color: 'var(--risk-low)',
            fontWeight: 700,
            fontSize: '0.9rem'
          }}
        >
          ✔ Completed
        </div>
      )}
    </div>
  );
}
