"use client";

import { useState, useEffect } from "react";
import posthog from "posthog-js";
import { useRouter } from "next/navigation";
import { LOCALIZER_PRICE_MAP } from "@/lib/stripe/localizerPrices";
import "./pricing.css";

const PLANS = [
  {
    name: "Solo",
    desc: "Perfect for a single artist or band.",
    monthlyPrice: 29,
    annualPrice: 290,
    monthlyPriceId: LOCALIZER_PRICE_MAP.solo.monthly,
    annualPriceId: LOCALIZER_PRICE_MAP.solo.annual,
    features: ["1 band", "3 tours", "AI import parser", "Venue share links", "All asset formats"],
    highlight: false,
  },
  {
    name: "Pro",
    desc: "For managers handling multiple artists.",
    monthlyPrice: 59,
    annualPrice: 590,
    monthlyPriceId: LOCALIZER_PRICE_MAP.pro.monthly,
    annualPriceId: LOCALIZER_PRICE_MAP.pro.annual,
    features: ["3 bands", "Unlimited tours", "AI import parser", "Venue share links", "All asset formats", "Priority support"],
    highlight: true,
  },
  {
    name: "Agency",
    desc: "For agencies and large rosters.",
    monthlyPrice: 129,
    annualPrice: 1290,
    monthlyPriceId: LOCALIZER_PRICE_MAP.agency.monthly,
    annualPriceId: LOCALIZER_PRICE_MAP.agency.annual,
    features: ["Unlimited bands", "Unlimited tours", "AI import parser", "Venue share links", "All asset formats", "Priority support", "Dedicated onboarding"],
    highlight: false,
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const [trialExpired, setTrialExpired] = useState(false);
  useEffect(() => {
    setTrialExpired(new URLSearchParams(window.location.search).get("reason") === "trial_expired");
  }, []);

  async function handleCheckout(priceId: string, planName: string) {
    setLoading(planName);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        posthog.capture("upgrade_clicked", { plan: planName });
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Something went wrong.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="pricing-page" style={{ minHeight: "100vh", background: "transparent", padding: "48px 24px 80px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        <div style={{ marginBottom: 24 }}>
          <a href="/" style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 700, color: "var(--hw-border-strong)", textDecoration: "none", letterSpacing: 1 }}>← Back</a>
        </div>

        {trialExpired && (
          <div className="pricing-trial-banner" style={{ background: "var(--hw-bg-invert)", color: "#fff", borderRadius: 0, border: "3px solid var(--hw-border-strong)", padding: "16px 24px", marginBottom: 32, textAlign: "center", fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 700 }}>
            Your 7-day trial has ended. Choose a plan to keep access to your tours and assets.
          </div>
        )}

        {/* Header */}
        <div className="pricing-header" style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 className="brand-title" style={{ margin: 0, marginBottom: 12, fontFamily: "var(--hw-font-display)" }}>LOCALIZER</h1>
          <div className="pricing-headline" style={{ fontFamily: "var(--hw-font-display)", fontSize: 36, fontWeight: 400, color: "var(--hw-border-strong)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 2 }}>
            Simple, transparent pricing
          </div>
          <div className="pricing-subline" style={{ fontFamily: "var(--hw-font-body)", fontSize: 15, color: "var(--hw-border-strong)", marginBottom: 28, opacity: 0.6 }}>
            Tour dates in. Tour Assets out.
          </div>

          {/* Toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 0, background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", borderRadius: 0, padding: 0 }}>
            <button
              onClick={() => setAnnual(false)}
              style={{
                padding: "10px 22px",
                borderRadius: 0,
                border: "none",
                borderRight: "3px solid var(--hw-border-strong)",
                background: !annual ? "var(--hw-border-strong)" : "transparent",
                color: !annual ? "#fff" : "var(--hw-border-strong)",
                fontFamily: "var(--hw-font-display)",
                fontWeight: 400,
                fontSize: 14,
                textTransform: "uppercase",
                letterSpacing: 2,
                cursor: "pointer",
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              style={{
                padding: "10px 22px",
                borderRadius: 0,
                border: "none",
                background: annual ? "var(--hw-border-strong)" : "transparent",
                color: annual ? "#fff" : "var(--hw-border-strong)",
                fontFamily: "var(--hw-font-display)",
                fontWeight: 400,
                fontSize: 14,
                textTransform: "uppercase",
                letterSpacing: 2,
                cursor: "pointer",
              }}
            >
              Annual
              <span style={{ marginLeft: 8, fontFamily: "var(--hw-font-mono)", fontSize: 9, color: annual ? "rgba(255,255,255,0.6)" : "var(--hw-border-strong)", fontWeight: 700, letterSpacing: 1, opacity: 0.7 }}>
                SAVE ~17%
              </span>
            </button>
          </div>
        </div>

        {/* Plans grid */}
        <div className="pricing-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {PLANS.map((plan) => {
            const priceId = annual ? plan.annualPriceId : plan.monthlyPriceId;
            const price = annual ? plan.annualPrice : plan.monthlyPrice;
            const isLoading = loading === plan.name;

            return (
              <div
                key={plan.name}
                className="pricing-card"
                style={{
                  background: "var(--hw-bg-surface)",
                  border: "3px solid var(--hw-border-strong)",
                  borderRadius: 0,
                  padding: 32,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                }}
              >
                {plan.highlight && (
                  <div style={{
                    position: "absolute",
                    top: -14,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "var(--hw-crimson)",
                    border: "3px solid var(--hw-border-strong)",
                    color: "#fff",
                    fontFamily: "var(--hw-font-mono)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: 2,
                    padding: "4px 14px",
                    borderRadius: 0,
                    textTransform: "uppercase",
                  }}>
                    Most Popular
                  </div>
                )}

                <div>
                  <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, fontWeight: 400, letterSpacing: 3, textTransform: "uppercase", color: "var(--hw-border-strong)", marginBottom: 8 }}>
                    {plan.name}
                  </div>
                  <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-border-strong)", marginBottom: 20, lineHeight: 1.5, opacity: 0.6 }}>
                    {plan.desc}
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <span className="pricing-price" style={{ fontFamily: "var(--hw-font-display)", fontSize: 50, fontWeight: 400, color: "var(--hw-border-strong)", letterSpacing: -1 }}>
                      ${price}
                    </span>
                    <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, color: "var(--hw-border-strong)", marginLeft: 4, opacity: 0.5 }}>
                      /{annual ? "year" : "mo"}
                    </span>
                  </div>

                  <div style={{ display: "grid", gap: 8, marginBottom: 28 }}>
                    {plan.features.map((f) => (
                      <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-border-strong)" }}>
                        <span style={{ color: "var(--hw-crimson)", fontSize: 16 }}>✓</span>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  className="pricing-cta"
                  onClick={() => handleCheckout(priceId, plan.name)}
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: "13px",
                    borderRadius: 0,
                    border: plan.highlight ? "3px solid var(--hw-crimson)" : "3px solid var(--hw-border-strong)",
                    background: plan.highlight ? "var(--hw-crimson)" : "var(--hw-bg-surface)",
                    color: plan.highlight ? "#fff" : "var(--hw-border-strong)",
                    fontFamily: "var(--hw-font-display)",
                    fontWeight: 400,
                    fontSize: 15,
                    textTransform: "uppercase",
                    letterSpacing: 3,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  {isLoading ? "Loading…" : `Get ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>



      </div>
    </div>
  );
}
