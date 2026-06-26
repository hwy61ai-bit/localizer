import type { LocalizerTier } from "@/lib/stripe/localizerPrices";

/**
 * Per-tier tour-count limits. Single source of truth.
 * null = unlimited.
 * Trial users get the Indie limit.
 */
export const TOUR_LIMITS: Record<LocalizerTier, number | null> = {
  indie: 5,
  pro: null,
  agency: null,
};

export const TRIAL_TOUR_LIMIT = TOUR_LIMITS.indie; // trial = Indie (5)

/**
 * Resolve the tour limit for an org given its Localizer plan.
 * Returns null for unlimited tiers; returns a number for capped tiers.
 */
export function tourLimitForPlan(localizerPlan: string | null | undefined): number | null {
  if (localizerPlan && localizerPlan in TOUR_LIMITS) {
    return TOUR_LIMITS[localizerPlan as LocalizerTier];
  }
  return TRIAL_TOUR_LIMIT;
}
