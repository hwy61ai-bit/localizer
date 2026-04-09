"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  HwCard,
  HwCardTitle,
  HwCardDesc,
  HwCardMeta,
  HwButton,
  HwInput,
  HwSelect,
  HwAlert,
} from "@/app/components/hw";
import { ONBOARDING_ROLES } from "@/lib/onboarding/roles";

// Role options sourced from the shared source of truth in lib/onboarding/roles.ts
// so the client dropdown and the server validator can never drift. Value === label
// intentionally — the API stores the literal string, no translation layer.
const ROLE_OPTIONS = ONBOARDING_ROLES.map((role) => ({
  value: role,
  label: role,
}));

interface WelcomeWizardProps {
  initialStep: 1 | 2 | 3;
  orgId: string;
  orgName: string;
  userId: string;
  initialFullName: string;
}

export default function WelcomeWizard({
  initialStep,
  orgId,
  orgName: initialOrgName,
  userId,
  initialFullName,
}: WelcomeWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(initialStep);
  const [orgName, setOrgName] = useState(initialOrgName);
  const [fullName, setFullName] = useState(initialFullName);
  const [userRole, setUserRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitStep(currentStep: 1 | 2 | 3, data: Record<string, string>) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // orgId + userId are passed so the API can cross-check against the
        // server-derived session — defense-in-depth, not the source of truth.
        body: JSON.stringify({ step: currentStep, data, orgId, userId }),
        cache: "no-store",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        setError(body?.message || "Something went wrong. Please try again.");
        return;
      }
      if (currentStep === 3) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setStep((currentStep + 1) as 1 | 2 | 3);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function goBack(target: 1 | 2) {
    setError(null);
    setStep(target);
  }

  // Each step uses a <form> so pressing Enter in the input triggers the
  // Continue/Finish button. When the submit button is disabled, HTML implicit
  // form submission is suppressed, so Enter does nothing — but we also
  // re-check the same condition in the handler as belt-and-suspenders.

  function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgName.trim() || submitting) return;
    submitStep(1, { name: orgName.trim() });
  }

  function handleStep2Submit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || submitting) return;
    submitStep(2, { full_name: fullName.trim() });
  }

  function handleStep3Submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userRole || submitting) return;
    submitStep(3, { user_role: userRole });
  }

  const skipLink = (
    <Link
      href="/dashboard"
      style={{
        display: "inline-block",
        marginTop: 16,
        fontFamily: "var(--hw-font-mono)",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color: "var(--hw-text-secondary)",
        textDecoration: "underline",
      }}
    >
      Skip for now
    </Link>
  );

  const errorBlock = error && (
    <div style={{ marginTop: 12 }}>
      <HwAlert variant="error">{error}</HwAlert>
    </div>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 24px",
      }}
    >
      <div style={{ maxWidth: 520, width: "100%" }}>
        <HwCard variant="standard" hoverable={false}>
          <HwCardMeta>{`STEP ${step} OF 3`}</HwCardMeta>

          {step === 1 && (
            <form onSubmit={handleStep1Submit}>
              <HwCardTitle>What&apos;s your company or project name?</HwCardTitle>
              <HwCardDesc>
                This is how your workspace will be labeled across HWY61.
              </HwCardDesc>
              <div style={{ marginTop: 20 }}>
                <HwInput
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme Touring Co."
                />
              </div>
              {errorBlock}
              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <HwButton type="submit" disabled={!orgName.trim() || submitting}>
                  {submitting ? "SAVING..." : "CONTINUE"}
                </HwButton>
              </div>
              {skipLink}
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2Submit}>
              <HwCardTitle>What&apos;s your name?</HwCardTitle>
              <HwCardDesc>
                We&apos;ll use this to personalize your experience.
              </HwCardDesc>
              <div style={{ marginTop: 20 }}>
                <HwInput
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              {errorBlock}
              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <HwButton
                  variant="secondary"
                  onClick={() => goBack(1)}
                  disabled={submitting}
                >
                  BACK
                </HwButton>
                <HwButton type="submit" disabled={!fullName.trim() || submitting}>
                  {submitting ? "SAVING..." : "CONTINUE"}
                </HwButton>
              </div>
              {skipLink}
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleStep3Submit}>
              <HwCardTitle>What&apos;s your role?</HwCardTitle>
              <HwCardDesc>
                Helps us highlight the features you&apos;ll use most.
              </HwCardDesc>
              <div style={{ marginTop: 20 }}>
                <HwSelect
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  options={ROLE_OPTIONS}
                  placeholder="Select your role"
                />
              </div>
              {errorBlock}
              <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                <HwButton
                  variant="secondary"
                  onClick={() => goBack(2)}
                  disabled={submitting}
                >
                  BACK
                </HwButton>
                <HwButton type="submit" disabled={!userRole || submitting}>
                  {submitting ? "SAVING..." : "FINISH"}
                </HwButton>
              </div>
              {skipLink}
            </form>
          )}
        </HwCard>
      </div>
    </div>
  );
}
