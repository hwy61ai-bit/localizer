'use client';

import { useState } from 'react';

interface OnboardingWizardProps {
  onStartWizard: () => void;
  onDemoTour: () => void;
  onSkip: () => void;
}

export default function OnboardingWizard({ onStartWizard, onDemoTour, onSkip }: OnboardingWizardProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  function handleDemoTour() {
    setToastMsg('Demo tour coming soon');
    setTimeout(() => setToastMsg(null), 3000);
    onDemoTour();
  }

  function handleSkip() {
    localStorage.setItem('onboarding_dismissed', 'true');
    onSkip();
  }

  function handleWizard() {
    console.log('wizard selected');
    onStartWizard();
  }

  const cards = [
    {
      id: 'wizard',
      title: 'Get Started',
      description: 'Step-by-step guided setup',
      onClick: handleWizard,
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      ),
    },
    {
      id: 'demo',
      title: 'Explore a Demo Tour',
      description: 'See a pre-built tour with sample data',
      onClick: handleDemoTour,
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6" />
          <line x1="9" y1="3" x2="9" y2="18" />
          <line x1="15" y1="6" x2="15" y2="21" />
        </svg>
      ),
    },
    {
      id: 'skip',
      title: "Skip — I'll start fresh",
      description: 'Jump straight to the empty dashboard',
      onClick: handleSkip,
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{
        minHeight: '100vh', background: '#EEEEEE',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px',
        animation: 'fadeSlideUp 0.5s ease-out both',
      }}>
        <div style={{ maxWidth: 700, width: '100%', textAlign: 'center' }}>
          <h1 style={{
            fontWeight: 900, fontSize: 36, letterSpacing: '-1px',
            textTransform: 'uppercase', color: '#111',
            margin: '0 0 8px 0',
          }}>
            HWY61 LABS
          </h1>
          <p style={{ fontSize: 15, color: '#888', margin: '0 0 40px 0' }}>
            Welcome — how would you like to get started?
          </p>

          <div style={{
            display: 'flex', gap: 16, justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            {cards.map((card) => (
              <div
                key={card.id}
                onClick={card.onClick}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  flex: '1 1 180px', maxWidth: 220,
                  background: '#fff',
                  border: '1px solid #DDD',
                  borderRadius: 14,
                  padding: '32px 20px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  transform: hoveredCard === card.id ? 'translateY(-3px)' : 'translateY(0)',
                  boxShadow: hoveredCard === card.id ? '0 6px 20px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <div style={{ marginBottom: 16 }}>{card.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 6 }}>
                  {card.title}
                </div>
                <div style={{ fontSize: 12, color: '#888', lineHeight: 1.4 }}>
                  {card.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: '#111', color: '#fff', padding: '10px 20px',
          borderRadius: 10, fontSize: 13, fontWeight: 600,
          animation: 'fadeSlideUp 0.3s ease-out both',
        }}>
          {toastMsg}
        </div>
      )}
    </>
  );
}
