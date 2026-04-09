'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HwCard, HwCardTitle, HwCardDesc, HwButton } from '@/app/components/hw';

interface OnboardingWizardProps {
  onStartWizard: () => void;
  onDemoTour: () => void;
  onSkip: () => void;
}

export default function OnboardingWizard({ onStartWizard, onDemoTour, onSkip }: OnboardingWizardProps) {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  async function handleDemoTour() {
    if (isLoadingDemo) return;
    setIsLoadingDemo(true);
    try {
      const res = await fetch('/api/tourrouter/demo-seed', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setToastMsg(data.error || 'Failed to create demo tour');
        setTimeout(() => setToastMsg(null), 4000);
        onDemoTour();
        return;
      }
      router.push(`/dashboard/routing/${data.tour_id}`);
    } catch (err) {
      setToastMsg('Network error — please try again');
      setTimeout(() => setToastMsg(null), 4000);
    } finally {
      setIsLoadingDemo(false);
    }
  }

  function handleSkip() {
    localStorage.setItem('onboarding_dismissed', 'true');
    onSkip();
  }

  function handleWizard() {
    router.push('/dashboard/onboarding/tour');
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
        @media (max-width: 900px) {
          .hw-onboard-grid { flex-direction: column !important; align-items: center !important; }
          .hw-onboard-card { max-width: 100% !important; flex: 1 1 auto !important; }
        }
      `}</style>

      <div style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px',
        animation: 'fadeSlideUp 0.5s ease-out both',
      }}>
        <div style={{ maxWidth: 860, width: '100%', textAlign: 'center' }}>
          <h1 style={{
            fontFamily: 'var(--hw-font-display)', fontSize: 72, letterSpacing: '3px',
            textTransform: 'uppercase', color: 'var(--hw-text)',
            margin: '0 0 8px 0', lineHeight: 1,
          }}>
            WELCOME TO HWY61
          </h1>
          <p style={{
            fontFamily: 'var(--hw-font-body)', fontSize: 16, fontWeight: 300,
            color: 'var(--hw-text-secondary)', margin: '8px 0 48px 0',
          }}>
            How would you like to get started?
          </p>

          <div className="hw-onboard-grid" style={{
            display: 'flex', gap: 24, justifyContent: 'center',
          }}>
            {/* Get Started */}
            <div className="hw-onboard-card" style={{ flex: '1 1 240px', maxWidth: 260 }}>
              <HwCard variant="accent" onClick={handleWizard}>
                <div style={{ marginBottom: 16, opacity: 0.6, color: 'var(--hw-crimson)' }}>{cards[0].icon}</div>
                <HwCardTitle>{cards[0].title}</HwCardTitle>
                <HwCardDesc>{cards[0].description}</HwCardDesc>
                <div style={{ marginTop: 20 }}>
                  <HwButton size="small" fullWidth>GET STARTED</HwButton>
                </div>
              </HwCard>
            </div>

            {/* Demo Tour */}
            <div className="hw-onboard-card" style={{ flex: '1 1 240px', maxWidth: 260, opacity: isLoadingDemo ? 0.6 : 1 }}>
              <HwCard variant="standard" onClick={isLoadingDemo ? undefined : handleDemoTour}>
                <div style={{ marginBottom: 16, opacity: 0.4 }}>{cards[1].icon}</div>
                <HwCardTitle>{isLoadingDemo ? 'Creating demo tour...' : cards[1].title}</HwCardTitle>
                <HwCardDesc>{isLoadingDemo ? 'Setting up 18 shows, hotels, settlements, and more' : cards[1].description}</HwCardDesc>
                <div style={{ marginTop: 20 }}>
                  <HwButton variant="secondary" size="small" fullWidth disabled={isLoadingDemo}>
                    {isLoadingDemo ? 'LOADING...' : 'EXPLORE DEMO'}
                  </HwButton>
                </div>
              </HwCard>
            </div>

            {/* Skip */}
            <div className="hw-onboard-card" style={{ flex: '1 1 240px', maxWidth: 260 }}>
              <HwCard variant="standard" onClick={handleSkip}>
                <div style={{ marginBottom: 16, opacity: 0.4 }}>{cards[2].icon}</div>
                <HwCardTitle>{cards[2].title}</HwCardTitle>
                <HwCardDesc>{cards[2].description}</HwCardDesc>
                <div style={{ marginTop: 20 }}>
                  <HwButton variant="ghost" size="small" fullWidth>SKIP</HwButton>
                </div>
              </HwCard>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toastMsg && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--hw-bg-invert)', color: 'var(--hw-text-invert)',
          padding: '12px 20px', border: '3px solid var(--hw-border-strong)',
          boxShadow: 'var(--hw-shadow-lg)',
          fontFamily: 'var(--hw-font-mono)', fontSize: 11, fontWeight: 700,
          letterSpacing: '1.5px', textTransform: 'uppercase',
          animation: 'fadeSlideUp 0.3s ease-out both',
        }}>
          {toastMsg}
        </div>
      )}
    </>
  );
}
