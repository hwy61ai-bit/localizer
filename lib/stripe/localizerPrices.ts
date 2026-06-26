/**
 * Localizer pricing — single source of truth for Stripe price IDs.
 * Captured from Stripe live mode on June 26, 2026 per Tim's pricing
 * decision, replacing the May 23 set. See
 * docs/LOCALIZER_PRICING_DECISION_2026-05-23.md for the prior context.
 * Outer keys ("solo"/"pro"/"agency") remain unchanged; the entry tier
 * is now displayed as "Indie" externally — internal rename is a
 * separate follow-up.
 */

export const LOCALIZER_PRICE_MAP = {
  solo: {
    monthly: "price_1TmcFfC5CrGA8Ee0L4YFfEF7",
    annual: "price_1TmcFsC5CrGA8Ee0O66rJ4ID",
  },
  pro: {
    monthly: "price_1TmcGVC5CrGA8Ee0pzBN9411",
    annual: "price_1TmcGfC5CrGA8Ee0N81fIcd6",
  },
  agency: {
    monthly: "price_1TmcH1C5CrGA8Ee01z9xrgJC",
    annual: "price_1TmcHFC5CrGA8Ee0zZhVxp0n",
  },
} as const;

export type LocalizerTier = "solo" | "pro" | "agency";
export type BillingPeriod = "monthly" | "annual";

/**
 * Returns true if priceId is a known Localizer price.
 * Used by checkout to validate the requested price.
 */
export function isLocalizerPriceId(priceId: string): boolean {
  for (const tier of Object.values(LOCALIZER_PRICE_MAP)) {
    for (const id of Object.values(tier)) {
      if (id === priceId) return true;
    }
  }
  return false;
}

/**
 * Given a Stripe price ID, return the tier name ("solo"|"pro"|"agency")
 * or null if unknown. For Day 2 webhook handler use.
 */
export function tierFromPriceId(priceId: string): LocalizerTier | null {
  for (const [tier, periods] of Object.entries(LOCALIZER_PRICE_MAP)) {
    for (const id of Object.values(periods)) {
      if (id === priceId) return tier as LocalizerTier;
    }
  }
  return null;
}
