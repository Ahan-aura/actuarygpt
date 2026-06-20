import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function AIThinking({ pipelineSteps, message = "Executing the agentic underwriting pipeline:" }) {
  return (
    <div className="pipeline-card">
      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{message}</p>
      <div className="pipeline-steps">
        {pipelineSteps.map(step => (
          <div key={step.key} className={`pipeline-step ${step.status}`}>
            {step.status === 'active' && <div className="spinner"></div>}
            {step.status === 'completed' && <CheckCircle2 size={16} />}
            {step.status === 'pending' && <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid var(--border)' }}></div>}
            <span>{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
