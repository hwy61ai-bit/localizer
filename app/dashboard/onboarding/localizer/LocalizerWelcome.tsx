"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  HwCard,
  HwCardTitle,
  HwCardDesc,
  HwButton,
  HwAlert,
} from "@/app/components/hw";

// TODO: Drew will record an onboarding video and upload to Cloudinary
// (or YouTube/Vimeo). Set ONBOARDING_VIDEO_URL when ready.
// Empty string hides the video section gracefully so the page still
// renders cleanly before the video exists.
const ONBOARDING_VIDEO_URL = "";

interface LocalizerWelcomeProps {
  orgId: string;
  orgName: string;
  userId: string;
}

// orgId/orgName/userId are accepted for symmetry with the existing wizard
// component shape — none are used right now, but they give us room to add
// server-side cross-checks later (matching the /api/onboarding/step pattern).
export default function LocalizerWelcome(_props: LocalizerWelcomeProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGetStarted() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/localizer/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "complete" }),
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Could not finalize onboarding.");
      router.push("/dashboard/artists");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

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
          <HwCardTitle>Welcome to Localizer</HwCardTitle>
          <HwCardDesc>
            Generate professional venue assets for every show on your tour.
            Import your schedule once, upload your tour art, and share
            venue-specific download links — all in minutes.
          </HwCardDesc>

          {ONBOARDING_VIDEO_URL && (
            <div style={{ marginTop: 20 }}>
              <video
                src={ONBOARDING_VIDEO_URL}
                controls
                style={{ width: "100%" }}
              />
            </div>
          )}

          {error && (
            <div style={{ marginTop: 12 }}>
              <HwAlert variant="error">{error}</HwAlert>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
            <HwButton onClick={handleGetStarted} disabled={submitting}>
              {submitting ? "STARTING..." : "GET STARTED"}
            </HwButton>
          </div>
        </HwCard>
      </div>
    </div>
  );
}
