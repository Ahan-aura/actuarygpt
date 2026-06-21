import React, { useEffect, useState } from 'react';
import { Loader2, Bot } from 'lucide-react';

const AGENTS = [
  "Uploading claim documents",
  "Checking file integrity",
  "Running character recognition (OCR)",
  "Extracting claim parameters",
  "Checking policy details",
  "Verifying vehicle records",
  "Assembling submission packet",
  "Queueing for manual review"
];

export default function ClaimProcessingScreen({ onComplete }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIdx(prev => {
        if (prev < AGENTS.length) {
          const next = prev + 1;
          setProgress(Math.round((next / AGENTS.length) * 100));
          return next;
        }
        clearInterval(interval);
        return prev;
      });
    }, 450);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (currentIdx === AGENTS.length) {
      const timer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentIdx, onComplete]);

  const estimatedTime = Math.max(0, 4 - Math.round((progress / 100) * 4));

  return (
    <div className="glass-card animate-fade-in" style={{ maxWidth: '550px', margin: '3rem auto', padding: '2rem', border: '1px solid var(--border)', borderRadius: '12px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-lg)' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-title)', margin: '0 0 1rem 0' }}>
        <Bot size={22} style={{ color: 'var(--primary)' }} />
        🤖 Master AI Agent
      </h3>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', paddingBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {AGENTS.map((name, idx) => {
          let statusText = "Pending";
          let color = "var(--text-muted)";
          let icon = <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid var(--border)', display: 'inline-flex' }}></div>;
          
          if (idx < currentIdx) {
            statusText = "Completed";
            color = "var(--risk-low)";
            icon = <span style={{ color: 'var(--risk-low)', fontWeight: 'bold' }}>✓</span>;
          } else if (idx === currentIdx) {
            statusText = "Running";
            color = "var(--primary)";
            icon = <Loader2 className="animate-spin" size={14} style={{ color: 'var(--primary)', animation: 'spin 1.5s linear infinite' }} />;
          }

          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.50rem' }}>
                <span style={{ display: 'inline-flex', width: '16px', justifyContent: 'center' }}>{icon}</span>
                <span style={{ color: idx === currentIdx ? 'var(--text-title)' : 'var(--text-main)', fontWeight: idx === currentIdx ? 700 : 500 }}>{name}</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color }}>{statusText}</span>
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <span>Overall Progress</span>
          <b style={{ color: 'var(--text-title)' }}>{progress}%</b>
        </div>
        <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--primary)', transition: 'width 0.4s ease' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          <span>Estimated Time Remaining</span>
          <b style={{ color: 'var(--text-title)' }}>{estimatedTime} seconds</b>
        </div>
      </div>
    </div>
  );
}
