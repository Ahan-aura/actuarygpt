import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

const STEPS = [
  "Customer validated",
  "Policy verified",
  "Vehicle information checked",
  "Incident details processed",
  "Feature vector generated",
  "Running CatBoost Model",
  "Fraud probability calculated",
  "Searching historical claims",
  "Found 3 similar claims",
  "Gemini generating explanation",
  "Creating recommendation",
  "Saving to database"
];

export default function ClaimProcessingScreen({ onComplete }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  useEffect(() => {
    if (currentIdx < STEPS.length) {
      const interval = setTimeout(() => {
        setCompletedSteps(prev => [...prev, currentIdx]);
        setCurrentIdx(prev => prev + 1);
      }, 300); // 12 steps * 300ms = 3.6s total animation
      return () => clearTimeout(interval);
    } else {
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentIdx, onComplete]);

  return (
    <div className="glass-card animate-fade-in" style={{ maxWidth: '600px', margin: '2rem auto', padding: '2.5rem', textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <Loader2 className="animate-spin" size={24} style={{ color: 'var(--primary)', animation: 'spin 2s linear infinite' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-title)' }}>🤖 ActuaryGPT Agent</h2>
      </div>
      
      <p style={{ fontWeight: 600, color: 'var(--text-title)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
        {currentIdx < STEPS.length ? "Analyzing Claim..." : "Analysis Completed"}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {STEPS.map((step, idx) => {
          const isCompleted = completedSteps.includes(idx);
          const isActive = idx === currentIdx;
          
          let color = 'var(--text-muted)';
          let fontWeight = 400;
          if (isActive) {
            color = 'var(--primary)';
            fontWeight = 600;
          } else if (isCompleted) {
            color = 'var(--risk-low)';
            fontWeight = 500;
          }

          return (
            <div 
              key={idx} 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                fontSize: '0.9rem', 
                color, 
                fontWeight, 
                transition: 'color 0.2s ease' 
              }}
            >
              {isCompleted ? (
                <CheckCircle2 size={16} style={{ color: 'var(--risk-low)' }} />
              ) : isActive ? (
                <Loader2 className="animate-spin" size={16} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
              ) : (
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid var(--border)' }} />
              )}
              <span>{isCompleted ? "✓ " : ""}{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
