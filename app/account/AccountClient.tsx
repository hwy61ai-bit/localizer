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

const PLAN_COLORS: Record<string, string> = {
  starter: "#888",
  pro: "#6366f1",
  agency: "#f59e0b",
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
  const planColor = PLAN_COLORS[plan] ?? "#888";
  const planLabel = PLAN_LABELS[plan] ?? plan;

  return (
    <div style={{ minHeight: "100vh", background: "#F7F7F5", padding: "32px 24px" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        <div style={{ marginBottom: 24 }}>
          <Link href="/dashboard" style={{ fontSize: 13, fontWeight: 700, color: "#888", textDecoration: "none" }}>← Back to Dashboard</Link>
        </div>

        <h1 className="brand-title" style={{ margin: "0 0 32px" }}>ACCOUNT</h1>

        {/* Workspace */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ddd", padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: "#888", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Workspace</div>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{orgName}</div>
          <div style={{ fontSize: 13, color: "#888" }}>{email}</div>
        </div>

        {/* Plan */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ddd", padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: "#888", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Plan</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 999, background: planColor, color: "#fff", fontWeight: 900, fontSize: 13 }}>{planLabel}</span>
              {planStatus !== "active" && (
                <span style={{ fontSize: 12, color: "#e00", fontWeight: 700 }}>{planStatus}</span>
              )}
            </div>
            <Link href="/pricing" style={{ fontSize: 13, fontWeight: 700, color: "#111", textDecoration: "none" }}>View all plans →</Link>
          </div>

          {/* Usage bar */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>Renders this month</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>{rendersUsed} / {planLimit}</span>
            </div>
            <div style={{ height: 6, background: "#eee", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${usagePct}%`, background: usagePct > 90 ? "#e00" : planColor, borderRadius: 999, transition: "width 0.3s" }} />
            </div>
          </div>
        </div>

        {/* Billing */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ddd", padding: 24, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: "#888", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Billing</div>
          {error && <div style={{ fontSize: 13, color: "#e00", marginBottom: 12, fontWeight: 700 }}>{error}</div>}
          {hasStripe ? (
            <button
              onClick={openPortal}
              disabled={loading}
              style={{ padding: "12px 24px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 900, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Opening…" : "Manage Billing & Invoices →"}
            </button>
          ) : (
            <div>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>No billing account yet. Upgrade to a paid plan to get started.</div>
              <Link href="/pricing" style={{ display: "inline-block", padding: "12px 24px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 900, fontSize: 14, textDecoration: "none" }}>
                View Plans →
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
