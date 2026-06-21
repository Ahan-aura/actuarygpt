import React from 'react';
import { Shield, Activity, Car, Bot } from 'lucide-react';

export default function Landing({ setTab, setWizardStep, setWizardResult }) {
  const cards = [
    {
      id: 'life',
      title: 'Life & Health Insurance',
      desc: 'Submit your health information, biometric profiles, and apply for life coverage policies.',
      icon: Activity,
      color: 'var(--primary)',
      bg: 'rgba(15, 118, 110, 0.1)',
      border: 'rgba(15, 118, 110, 0.2)'
    },
    {
      id: 'vehicle',
      title: 'Vehicle Claim',
      desc: 'Submit new vehicle claims, input details of incident, and upload required documents for claims review.',
      icon: Car,
      color: 'var(--secondary)',
      bg: 'rgba(56, 189, 248, 0.1)',
      border: 'rgba(56, 189, 248, 0.2)'
    },
    {
      id: 'chatbot',
      title: 'AI Support Assistant',
      desc: 'Chat with our AI helper regarding general policy terms, document guidelines, and support details.',
      icon: Bot,
      color: 'var(--primary)',
      bg: 'rgba(99, 102, 241, 0.1)',
      border: 'rgba(99, 102, 241, 0.2)'
    }
  ];

  return (
    <div className="landing-container animate-fade-in" style={{ maxWidth: '900px', margin: '3rem auto', textAlign: 'center', padding: '0 1rem' }}>
      <div className="landing-header" style={{ marginBottom: '3.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', backgroundColor: 'var(--primary-glow)', marginBottom: '1.5rem', color: 'var(--primary)' }}>
          <Shield size={36} />
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 850, color: 'var(--text-title)', letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>
          ACTUARYGPT
        </h1>
        <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>
          Client Support Portal & Claims Center
        </p>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
          Helping you manage policies and file claims quickly
        </p>
      </div>

      <div className="landing-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className="glass-card clickable-card"
              onClick={() => {
                setTab(card.id);
                setWizardStep(1);
                setWizardResult(null);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                textAlign: 'left',
                padding: '2rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                border: `1px solid ${card.border}`,
                backgroundColor: 'var(--bg-card)'
              }}
            >
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '44px', 
                  height: '44px', 
                  borderRadius: '10px', 
                  backgroundColor: card.bg, 
                  color: card.color, 
                  marginBottom: '1.25rem' 
                }}
              >
                <Icon size={22} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-title)', marginBottom: '0.5rem' }}>
                {card.title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {card.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
