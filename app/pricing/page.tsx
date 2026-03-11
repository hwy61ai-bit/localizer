"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    name: "Basic",
    desc: "Perfect for a single artist or band.",
    monthlyPrice: 29,
    annualPrice: 290,
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_MONTHLY!,
    annualPriceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_ANNUAL!,
    features: ["1 band", "3 tours", "AI import parser", "Venue share links", "All asset formats"],
    highlight: false,
  },
  {
    name: "Pro",
    desc: "For managers handling multiple artists.",
    monthlyPrice: 59,
    annualPrice: 590,
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY!,
    annualPriceId: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL!,
    features: ["3 bands", "Unlimited tours", "AI import parser", "Venue share links", "All asset formats", "Priority support"],
    highlight: true,
  },
  {
    name: "Agency",
    desc: "For agencies and large rosters.",
    monthlyPrice: 129,
    annualPrice: 1290,
    monthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_AGENCY_MONTHLY!,
    annualPriceId: process.env.NEXT_PUBLIC_STRIPE_AGENCY_ANNUAL!,
    features: ["Unlimited bands", "Unlimited tours", "AI import parser", "Venue share links", "All asset formats", "Priority support", "Dedicated onboarding"],
    highlight: false,
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

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
    <div style={{ minHeight: "100vh", background: "#EEEEEE", padding: "48px 24px 80px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        <div style={{ marginBottom: 24 }}>
          <a href="/" style={{ fontSize: 13, fontWeight: 700, color: "#888", textDecoration: "none" }}>← Back</a>
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 className="brand-title" style={{ margin: 0, marginBottom: 12 }}>LOCALIZER</h1>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#111", marginBottom: 8 }}>
            Simple, transparent pricing
          </div>
          <div style={{ fontSize: 15, color: "#666", marginBottom: 28 }}>
            Tour dates in. Show graphics out.
          </div>

          {/* Toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#fff", border: "1px solid #ddd", borderRadius: 999, padding: "6px 8px" }}>
            <button
              onClick={() => setAnnual(false)}
              style={{
                padding: "7px 18px",
                borderRadius: 999,
                border: "none",
                background: !annual ? "#111" : "transparent",
                color: !annual ? "#fff" : "#666",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              style={{
                padding: "7px 18px",
                borderRadius: 999,
                border: "none",
                background: annual ? "#111" : "transparent",
                color: annual ? "#fff" : "#666",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Annual
              <span style={{ marginLeft: 6, fontSize: 11, color: annual ? "#aaa" : "#999", fontWeight: 600 }}>
                save ~17%
              </span>
            </button>
          </div>
        </div>

        {/* Plans grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {PLANS.map((plan) => {
            const priceId = annual ? plan.annualPriceId : plan.monthlyPriceId;
            const price = annual ? plan.annualPrice : plan.monthlyPrice;
            const isLoading = loading === plan.name;

            return (
              <div
                key={plan.name}
                style={{
                  background: plan.highlight ? "#111" : "#fff",
                  border: plan.highlight ? "1px solid #111" : "1px solid #ddd",
                  borderRadius: 16,
                  padding: 28,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  position: "relative",
                }}
              >
                {plan.highlight && (
                  <div style={{
                    position: "absolute",
                    top: -12,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "#111",
                    border: "1px solid #444",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.14em",
                    padding: "4px 12px",
                    borderRadius: 999,
                    textTransform: "uppercase",
                  }}>
                    Most Popular
                  </div>
                )}

                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: plan.highlight ? "#aaa" : "#999", marginBottom: 8 }}>
                    {plan.name}
                  </div>
                  <div style={{ fontSize: 13, color: plan.highlight ? "#aaa" : "#666", marginBottom: 20, lineHeight: 1.5 }}>
                    {plan.desc}
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <span style={{ fontSize: 42, fontWeight: 900, color: plan.highlight ? "#fff" : "#111", letterSpacing: -1 }}>
                      ${price}
                    </span>
                    <span style={{ fontSize: 13, color: plan.highlight ? "#888" : "#999", marginLeft: 4 }}>
                      /{annual ? "year" : "mo"}
                    </span>
                  </div>

                  <div style={{ display: "grid", gap: 8, marginBottom: 28 }}>
                    {plan.features.map((f) => (
                      <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: plan.highlight ? "#ccc" : "#444" }}>
                        <span style={{ color: plan.highlight ? "#888" : "#bbb", fontSize: 16 }}>✓</span>
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleCheckout(priceId, plan.name)}
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: "13px",
                    borderRadius: 12,
                    border: plan.highlight ? "1px solid #444" : "1px solid #111",
                    background: plan.highlight ? "#fff" : "#111",
                    color: plan.highlight ? "#111" : "#fff",
                    fontWeight: 900,
                    fontSize: 14,
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

        <div style={{ textAlign: "center", marginTop: 32, fontSize: 12, color: "#aaa" }}>
          All plans include a 14-day free trial. No credit card required to start.
        </div>

      </div>
    </div>
  );
}
