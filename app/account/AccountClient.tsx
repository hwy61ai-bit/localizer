"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  email: string;
  orgName: string;
  localizerPlan: string | null;
  localizerPlanStatus: string | null;
  trialEndsAt: string | null;
  hasStripe: boolean;
  artistsUsed: number;
  artistLimit: number;
};

const PLAN_LABELS: Record<string, string> = {
  solo: "Solo",
  pro: "Pro",
  agency: "Agency",
};

export default function AccountClient({
  email, orgName, localizerPlan, localizerPlanStatus, trialEndsAt,
  hasStripe, artistsUsed, artistLimit,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Something went wrong.");
      }
    } catch {
      setError("Failed to open billing portal.");
    } finally {
      setLoading(false);
    }
  }

  // Trial = no paid localizer_plan AND trial_ends_at in the future.
  const trialActive = !localizerPlan && trialEndsAt ? new Date(trialEndsAt) > new Date() : false;
  let trialDaysLeft = 0;
  let trialEndStr = "";
  if (trialActive && trialEndsAt) {
    const end = new Date(trialEndsAt);
    trialDaysLeft = Math.max(0, Math.ceil((end.getTime() - Date.now()) / 86400000));
    trialEndStr = end.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  const planLabel = localizerPlan ? (PLAN_LABELS[localizerPlan] ?? localizerPlan) : "Trial";
  const overLimit = artistsUsed > artistLimit;
  const usagePct = Math.min(100, Math.round((artistsUsed / artistLimit) * 100));

  const mono4 = { fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 400, letterSpacing: "4px", textTransform: "uppercase" as const, color: "var(--hw-blue)", marginBottom: 16 };

  return (
    <div style={{ minHeight: "100vh", background: "transparent", padding: "32px 24px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        <div style={{ marginBottom: 24 }}>
          <Link href="/dashboard" style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 400, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-muted)", textDecoration: "none" }}>
            &larr; BACK TO DASHBOARD
          </Link>
        </div>

        <h1 style={{ fontFamily: "var(--hw-font-display)", fontSize: 48, fontWeight: 400, letterSpacing: "3px", textTransform: "uppercase", color: "var(--hw-text)", margin: "0 0 32px" }}>
          ACCOUNT
        </h1>

        {/* Workspace */}
        <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 28, marginBottom: 16 }}>
          <div style={mono4}>WORKSPACE</div>
          <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 28, fontWeight: 400, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text)", marginBottom: 4 }}>{orgName}</div>
          <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-text-secondary)" }}>{email}</div>
        </div>

        {/* Plan */}
        <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 28, marginBottom: 16 }}>
          <div style={mono4}>PLAN</div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ display: "inline-block", padding: "4px 10px", background: "var(--hw-crimson)", color: "#fff", fontFamily: "var(--hw-font-mono)", fontWeight: 700, fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", border: "2px solid var(--hw-crimson)" }}>
                {planLabel}
              </span>
              {trialActive && (
                <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-crimson)" }}>
                  {trialDaysLeft} {trialDaysLeft === 1 ? "DAY" : "DAYS"} LEFT
                </span>
              )}
              {!trialActive && localizerPlanStatus && localizerPlanStatus !== "active" && (
                <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-crimson)" }}>
                  {localizerPlanStatus}
                </span>
              )}
            </div>
            <Link href="/pricing" style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 400, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-secondary)", textDecoration: "none" }}>
              VIEW ALL PLANS &rarr;
            </Link>
          </div>

          {trialActive && (
            <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-text-secondary)", marginBottom: 20 }}>
              Your free trial ends {trialEndStr}. Choose a plan to keep your assets flowing.
            </div>
          )}

          {/* Artist meter */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, fontWeight: 400, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text-muted)" }}>
                ARTISTS
              </span>
              <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 400, color: overLimit ? "var(--hw-crimson)" : "var(--hw-text)" }}>
                {artistsUsed} / {artistLimit}
              </span>
            </div>
            <div style={{ height: 8, background: "var(--hw-border)", border: "1px solid var(--hw-border-light)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${usagePct}%`, background: "var(--hw-crimson)", transition: "width 0.3s" }} />
            </div>
            {overLimit && (
              <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, color: "var(--hw-crimson)", marginTop: 8, letterSpacing: "1px" }}>
                Over your plan&rsquo;s artist limit. Upgrade to add more.
              </div>
            )}
          </div>
        </div>

        {/* Billing */}
        <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 28, marginBottom: 16 }}>
          <div style={mono4}>BILLING</div>

          {error && (
            <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 400, color: "var(--hw-crimson)", marginBottom: 12 }}>{error}</div>
          )}

          {hasStripe ? (
            <button
              onClick={openPortal}
              disabled={loading}
              style={{ padding: "14px 28px", border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", color: "var(--hw-text)", fontFamily: "var(--hw-font-display)", fontWeight: 400, fontSize: 16, letterSpacing: "3px", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.4 : 1, transition: "var(--hw-ease)" }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "var(--hw-bg-invert)"; e.currentTarget.style.color = "#fff"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--hw-bg-surface)"; e.currentTarget.style.color = "var(--hw-text)"; }}
            >
              {loading ? "OPENING..." : "MANAGE BILLING & INVOICES"}
            </button>
          ) : (
            <div>
              <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-text-secondary)", marginBottom: 16 }}>
                {trialActive ? "You're on a free trial. Choose a plan when you're ready — no charge until you do." : "No billing account yet. Choose a plan to get started."}
              </div>
              <Link href="/pricing" style={{ display: "inline-block", padding: "14px 28px", border: "3px solid var(--hw-crimson)", background: "var(--hw-crimson)", color: "#fff", fontFamily: "var(--hw-font-display)", fontWeight: 400, fontSize: 16, letterSpacing: "3px", textTransform: "uppercase", textDecoration: "none", transition: "var(--hw-ease)" }}>
                VIEW PLANS
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
