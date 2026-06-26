import type { LocalizerTier } from "@/lib/stripe/localizerPrices";

/**
 * Artist-count limits per Localizer tier. Single source of truth.
 * Tiers gate on artist count (Tim's pricing decision, v5 master context).
 * Trial users (localizer_plan null, trial active) get the Indie limit.
 */
export const ARTIST_LIMITS: Record<LocalizerTier, number> = {
  indie: 1,
  pro: 5,
  agency: 15,
};

export const TRIAL_ARTIST_LIMIT = ARTIST_LIMITS.indie; // trial = Indie (1)

/**
 * Resolve the artist limit for an org given its Localizer plan.
 * - Paid tier set -> that tier's limit
 * - Otherwise (trial / null plan) -> trial limit (Indie)
 */
export function artistLimitForPlan(localizerPlan: string | null | undefined): number {
  if (localizerPlan && localizerPlan in ARTIST_LIMITS) {
    return ARTIST_LIMITS[localizerPlan as LocalizerTier];
  }
  return TRIAL_ARTIST_LIMIT;
}
