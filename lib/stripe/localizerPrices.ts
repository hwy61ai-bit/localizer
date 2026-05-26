/**
 * Localizer pricing — single source of truth for Stripe price IDs.
 * Captured from Stripe live mode on May 23, 2026 per Tim's pricing
 * decision. See docs/LOCALIZER_PRICING_DECISION_2026-05-23.md.
 */

export const LOCALIZER_PRICE_MAP = {
  solo: {
    monthly: "price_1TbMyZC5CrGA8Ee0KcQmeIcH",
    annual: "price_1TbN25C5CrGA8Ee0HidMfeeX",
  },
  pro: {
    monthly: "price_1TbN3XC5CrGA8Ee08uNktCgE",
    annual: "price_1TbN3vC5CrGA8Ee08DBzDCHd",
  },
  agency: {
    monthly: "price_1TbN52C5CrGA8Ee0J7geA9d6",
    annual: "price_1TbN5RC5CrGA8Ee05RpKSBk5",
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
