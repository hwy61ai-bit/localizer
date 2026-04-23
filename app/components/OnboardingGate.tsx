'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import OnboardingWizard from './OnboardingWizard';

interface OnboardingGateProps {
  artistCount: number;
  children: React.ReactNode;
  hasTourRouter?: boolean;
}

export default function OnboardingGate({ artistCount, hasTourRouter = true, children }: OnboardingGateProps) {
  const searchParams = useSearchParams();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const forceOnboarding = searchParams.get('onboarding') === 'true';
    const dismissed = localStorage.getItem('onboarding_dismissed') === 'true';
    if (forceOnboarding || (artistCount === 0 && !dismissed)) {
      setShowOnboarding(true);
    }
    setChecked(true);
  }, [artistCount, searchParams]);

  // Don't render anything until we've checked localStorage to avoid flash
  if (!checked) return null;

  if (showOnboarding) {
    return (
      <OnboardingWizard
        onStartWizard={() => setShowOnboarding(false)}
        onDemoTour={() => {}}
        onSkip={() => setShowOnboarding(false)}
        hasTourRouter={hasTourRouter}
      />
    );
  }

  return <>{children}</>;
}
