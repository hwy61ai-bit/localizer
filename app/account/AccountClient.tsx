"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  email: string;
  orgName: string;
  plan: string;
  planStatus: string;
  hasStripe: boolean;
  rendersUsed: number;
  planLimit: number;
};

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  pro: "Pro",
  agency: "Agency",
};

export default function AccountClient({ email, orgName, plan, planStatus, hasStripe, rendersUsed, planLimit }: Props) {
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

  const usagePct = Math.min(100, Math.round((rendersUsed / planLimit) * 100));
  const planLabel = PLAN_LABELS[plan] ?? plan;

  return (
    <div style={{ minHeight: "100vh", background: "transparent", padding: "32px 24px" }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        {/* Back link */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/dashboard" style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 400, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-muted)", textDecoration: "none" }}>
            &larr; BACK TO DASHBOARD
          </Link>
        </div>

        {/* Page title */}
        <h1 style={{
          fontFamily: "var(--hw-font-display)", fontSize: 48, fontWeight: 400,
          letterSpacing: "3px", textTransform: "uppercase",
          color: "var(--hw-text)", margin: "0 0 32px",
        }}>
          ACCOUNT
        </h1>

        {/* ── Workspace ── */}
        <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 28, marginBottom: 16 }}>
          <div style={{
            fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 400,
            letterSpacing: "4px", textTransform: "uppercase",
            color: "var(--hw-blue)", marginBottom: 16,
          }}>
            WORKSPACE
          </div>
          <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 28, fontWeight: 400, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text)", marginBottom: 4 }}>
            {orgName}
          </div>
          <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-text-secondary)" }}>
            {email}
          </div>
        </div>

        {/* ── Plan ── */}
        <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 28, marginBottom: 16 }}>
          <div style={{
            fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 400,
            letterSpacing: "4px", textTransform: "uppercase",
            color: "var(--hw-blue)", marginBottom: 16,
          }}>
            PLAN
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                display: "inline-block", padding: "4px 10px",
                background: "var(--hw-crimson)", color: "#fff",
                fontFamily: "var(--hw-font-mono)", fontWeight: 700, fontSize: 11,
                letterSpacing: "2px", textTransform: "uppercase",
                border: "2px solid var(--hw-crimson)",
              }}>
                {planLabel}
              </span>
              {planStatus !== "active" && (
                <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-crimson)" }}>
                  {planStatus}
                </span>
              )}
            </div>
            <Link href="/pricing" style={{
              fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 400,
              letterSpacing: "1.5px", textTransform: "uppercase",
              color: "var(--hw-text-secondary)", textDecoration: "none",
            }}>
              VIEW ALL PLANS &rarr;
            </Link>
          </div>

          {/* Usage bar */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, fontWeight: 400, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text-muted)" }}>
                RENDERS THIS MONTH
              </span>
              <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 400, color: "var(--hw-text)" }}>
                {rendersUsed} / {planLimit}
              </span>
            </div>
            <div style={{ height: 8, background: "var(--hw-border)", border: "1px solid var(--hw-border-light)", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${usagePct}%`,
                background: usagePct > 90 ? "var(--hw-crimson)" : "var(--hw-crimson)",
                transition: "width 0.3s",
              }} />
            </div>
          </div>
        </div>

        {/* ── Billing ── */}
        <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 28, marginBottom: 16 }}>
          <div style={{
            fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 400,
            letterSpacing: "4px", textTransform: "uppercase",
            color: "var(--hw-blue)", marginBottom: 16,
          }}>
            BILLING
          </div>

          {error && (
            <div style={{
              fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 400,
              color: "var(--hw-crimson)", marginBottom: 12,
            }}>
              {error}
            </div>
          )}

          {hasStripe ? (
            <button
              onClick={openPortal}
              disabled={loading}
              style={{
                padding: "14px 28px",
                border: "3px solid var(--hw-border-strong)",
                background: "var(--hw-bg-surface)", color: "var(--hw-text)",
                fontFamily: "var(--hw-font-display)", fontWeight: 400, fontSize: 16,
                letterSpacing: "3px", textTransform: "uppercase",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.4 : 1,
                transition: "var(--hw-ease)",
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "var(--hw-bg-invert)"; e.currentTarget.style.color = "#fff"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--hw-bg-surface)"; e.currentTarget.style.color = "var(--hw-text)"; }}
            >
              {loading ? "OPENING..." : "MANAGE BILLING & INVOICES"}
            </button>
          ) : (
            <div>
              <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-text-secondary)", marginBottom: 16 }}>
                No billing account yet. Upgrade to a paid plan to get started.
              </div>
              <Link href="/pricing" style={{
                display: "inline-block", padding: "14px 28px",
                border: "3px solid var(--hw-crimson)",
                background: "var(--hw-crimson)", color: "#fff",
                fontFamily: "var(--hw-font-display)", fontWeight: 400, fontSize: 16,
                letterSpacing: "3px", textTransform: "uppercase",
                textDecoration: "none",
                transition: "var(--hw-ease)",
              }}>
                VIEW PLANS
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
