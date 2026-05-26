"use client";

import { useState, useEffect } from "react";
import posthog from "posthog-js";
import Link from "next/link";
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
    <div className="pricing-page">
      <style dangerouslySetInnerHTML={{ __html: `
        /* NAV — mirrors landing page */
        .pricing-page nav { background: var(--hw-bg-invert); padding: 16px 0; position: sticky; top: 0; z-index: 1000; }
        .pricing-page .nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 32px; display: flex; align-items: center; justify-content: space-between; }
        .pricing-page .logo { font-family: var(--hw-font-display); font-size: 28px; letter-spacing: 3px; color: var(--hw-text-invert); text-decoration: none; }
        .pricing-page .logo span { color: var(--hw-crimson); }
        .pricing-page .nav-links { display: flex; gap: 28px; align-items: center; list-style: none; padding: 0; margin: 0; }
        .pricing-page .nav-links a { font-family: var(--hw-font-mono); font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--hw-gray); text-decoration: none; transition: color 0.15s ease; }
        .pricing-page .nav-links a:hover { color: var(--hw-text-invert); }
        .pricing-page .nav-cta { font-family: var(--hw-font-display); font-size: 14px; letter-spacing: 3px; text-transform: uppercase; background: var(--hw-crimson); color: white; padding: 10px 24px; border: 3px solid var(--hw-crimson); border-radius: 0; transition: all 0.15s ease; }
        .pricing-page .nav-cta:hover { background: var(--hw-crimson-dark); transform: translateY(-2px); box-shadow: 4px 4px 0 var(--hw-border-strong); }

        /* Back link */
        .pricing-page .back-link { display: inline-block; margin: 24px 0 0 0; font-family: var(--hw-font-mono); font-size: 13px; font-weight: 700; color: var(--hw-text); text-decoration: none; letter-spacing: 1px; }
        .pricing-page .back-link:hover { color: var(--hw-crimson); }

        /* Trial banner */
        .pricing-page .pricing-trial-banner { background: var(--hw-bg-invert); color: #fff; border: 3px solid var(--hw-border-strong); border-radius: 0; padding: 16px 24px; margin: 32px 0; text-align: center; font-family: var(--hw-font-body); font-size: 14px; font-weight: 700; }

        /* Header */
        .pricing-page .pricing-header { text-align: center; margin: 32px 0 48px; }
        .pricing-page .brand-title { font-family: var(--hw-font-display); font-size: 28px; letter-spacing: 4px; text-transform: uppercase; color: var(--hw-text); margin: 0 0 12px 0; }
        .pricing-page .pricing-headline { font-family: var(--hw-font-display); font-size: 36px; font-weight: 400; color: var(--hw-text); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px; }
        .pricing-page .pricing-subline { font-family: var(--hw-font-body); font-size: 15px; color: var(--hw-text-secondary); margin-bottom: 28px; }

        /* Monthly/Annual toggle */
        .pricing-page .pricing-toggle { display: inline-flex; align-items: center; background: var(--hw-bg-surface); border: 3px solid var(--hw-border-strong); border-radius: 0; }
        .pricing-page .pricing-toggle button { padding: 10px 22px; border: none; background: transparent; color: var(--hw-border-strong); font-family: var(--hw-font-display); font-size: 14px; text-transform: uppercase; letter-spacing: 2px; cursor: pointer; border-radius: 0; }
        .pricing-page .pricing-toggle button:first-child { border-right: 3px solid var(--hw-border-strong); }
        .pricing-page .pricing-toggle button.active { background: var(--hw-border-strong); color: white; }
        .pricing-page .pricing-toggle .save-badge { margin-left: 8px; font-family: var(--hw-font-mono); font-size: 9px; font-weight: 700; letter-spacing: 1px; opacity: 0.7; }

        /* Pricing grid */
        .pricing-page .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 40px; }
        .pricing-page .pricing-card { background: var(--hw-bg-surface); border: 3px solid var(--hw-border-strong); padding: 40px 32px; text-align: center; transition: all 0.15s ease; border-radius: 0; position: relative; display: flex; flex-direction: column; }
        .pricing-page .pricing-card.featured { border-color: var(--hw-crimson); transform: translateY(-8px); box-shadow: 6px 6px 0 var(--hw-crimson); }
        .pricing-page .featured-badge { position: absolute; top: -14px; left: 50%; transform: translateX(-50%); background: var(--hw-crimson); border: 3px solid var(--hw-border-strong); color: #fff; font-family: var(--hw-font-mono); font-size: 9px; font-weight: 700; letter-spacing: 2px; padding: 4px 14px; border-radius: 0; text-transform: uppercase; }

        /* Plan content */
        .pricing-page .plan-name { font-family: var(--hw-font-mono); font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: var(--hw-blue); margin-bottom: 8px; }
        .pricing-page .pricing-card.featured .plan-name { color: var(--hw-crimson); }
        .pricing-page .plan-price { font-family: var(--hw-font-display); font-size: 52px; letter-spacing: 1px; line-height: 1; margin-bottom: 4px; color: var(--hw-text); }
        .pricing-page .plan-period { font-family: var(--hw-font-mono); font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--hw-text-muted); margin-bottom: 20px; }
        .pricing-page .plan-desc { font-size: 14px; color: var(--hw-text-secondary); margin-bottom: 24px; line-height: 1.6; }
        .pricing-page .plan-features { display: grid; gap: 8px; margin-bottom: 28px; text-align: left; }
        .pricing-page .plan-feature { display: flex; align-items: center; gap: 8px; font-family: var(--hw-font-body); font-size: 14px; font-weight: 300; color: var(--hw-text); }
        .pricing-page .plan-feature::before { content: "✓"; color: var(--hw-crimson); font-size: 16px; font-weight: 700; flex-shrink: 0; }

        /* CTA */
        .pricing-page .pricing-cta { width: 100%; display: block; margin-top: auto; padding: 14px; font-family: var(--hw-font-display); font-size: 15px; letter-spacing: 3px; text-transform: uppercase; background: var(--hw-bg-surface); color: var(--hw-border-strong); border: 3px solid var(--hw-border-strong); border-radius: 0; cursor: pointer; transition: all 0.15s ease; }
        .pricing-page .pricing-cta:hover { background: var(--hw-bg-invert); color: var(--hw-text-invert); transform: translateY(-2px); box-shadow: 4px 4px 0 var(--hw-crimson); }
        .pricing-page .pricing-cta:disabled { cursor: not-allowed; opacity: 0.6; }
        .pricing-page .pricing-card.featured .pricing-cta { background: var(--hw-crimson); color: white; border-color: var(--hw-crimson); }
        .pricing-page .pricing-card.featured .pricing-cta:hover { background: var(--hw-crimson-dark); border-color: var(--hw-crimson-dark); color: white; }
      ` }} />

      {/* NAV */}
      <nav>
        <div className="nav-inner">
          <Link href="/" className="logo">HWY<span>61</span> Labs</Link>
          <ul className="nav-links">
            <li><Link href="/pricing">Pricing</Link></li>
            <li><Link href="/login">Sign in</Link></li>
            <li><a href="#plans" className="nav-cta">Start your free trial</a></li>
          </ul>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 24px 80px" }}>
        <Link href="/" className="back-link">← Back</Link>

        {trialExpired && (
          <div className="pricing-trial-banner">
            Your 7-day trial has ended. Choose a plan to keep access to your tours and assets.
          </div>
        )}

        <div className="pricing-header">
          <h1 className="brand-title">LOCALIZER</h1>
          <div className="pricing-headline">Simple, transparent pricing</div>
          <div className="pricing-subline">Tour dates in. Tour Assets out.</div>

          <div className="pricing-toggle">
            <button type="button" onClick={() => setAnnual(false)} className={!annual ? "active" : ""}>
              Monthly
            </button>
            <button type="button" onClick={() => setAnnual(true)} className={annual ? "active" : ""}>
              Annual
              <span className="save-badge">SAVE ~17%</span>
            </button>
          </div>
        </div>

        <div id="plans" className="pricing-grid">
          {PLANS.map((plan) => {
            const priceId = annual ? plan.annualPriceId : plan.monthlyPriceId;
            const price = annual ? plan.annualPrice : plan.monthlyPrice;
            const isLoading = loading === plan.name;
            return (
              <div key={plan.name} className={`pricing-card${plan.highlight ? " featured" : ""}`}>
                {plan.highlight && <div className="featured-badge">Most Popular</div>}
                <div className="plan-name">{plan.name}</div>
                <div className="plan-price">${price}</div>
                <div className="plan-period">{annual ? "Per Year" : "Per Month"}</div>
                <div className="plan-desc">{plan.desc}</div>
                <div className="plan-features">
                  {plan.features.map((f) => (
                    <div key={f} className="plan-feature">{f}</div>
                  ))}
                </div>
                <button
                  className="pricing-cta"
                  onClick={() => handleCheckout(priceId, plan.name)}
                  disabled={isLoading}
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
