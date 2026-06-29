import { FORMATS, type FormatKey } from "@/lib/localizer/formats";
import { type LocalizerTier } from "@/lib/stripe/localizerPrices";

/**
 * Feature-gate tier resolution for Localizer. Answers two questions:
 *   1. What tier should the FEATURE gates treat this org as?
 *      (effectiveTierForFeatures)
 *   2. Can this tier use this format / custom fonts?
 *      (isFormatAllowedForTier, isCustomFontAllowedForTier)
 *
 * IMPORTANT — the trial semantic split:
 *
 *   For FEATURE gating (this file), an active trial = full access = "pro".
 *   A trial user must be able to generate/download video, print, and use
 *   custom fonts so they see exactly what they'd be buying.
 *
 *   For COUNT gating (lib/localizer/artistLimits.ts, lib/localizer/tourLimits.ts),
 *   an active trial = Indie's count caps (1 artist, 5 tours).
 *
 *   These two truths intentionally disagree about trial. Do not collapse
 *   them. If you "fix" the apparent inconsistency, you'll either give
 *   trial users Indie-tier feature locks (they won't see what they're
 *   buying) or give Indie-tier paid users unlimited counts (they'll
 *   bypass artist/tour caps). Both are wrong.
 *
 * Mirrors lib/localizer/billingGate.ts's field-reading and date-comparison
 * idiom so the two resolvers stay consistent. NOTE: this helper does not
 * consider bundle_plan_status; a bundle customer with localizer_plan = null
 * will currently resolve to "none" unless an unexpired trial is present.
 * If bundle access should grant Pro-equivalent features here too, extend
 * this function alongside billingGate's bundle check.
 *
 * Admin bypass is intentionally NOT baked in — keep this helper pure.
 * Call sites that need admin bypass (e.g. /api/fonts/upload,
 * /api/renders/generate) check isAdminEmail separately, matching the
 * pattern already in use.
 */

export type FeatureTier = LocalizerTier | "none";

export function effectiveTierForFeatures(org: {
  localizer_plan: string | null;
  localizer_plan_status: string | null;
  trial_ends_at: string | null;
}): FeatureTier {
  const paidStatuses = new Set(["active", "past_due"]);
  const status = (org.localizer_plan_status as string | null) ?? "";
  const plan = (org.localizer_plan as string | null) ?? "";

  // Real paid subscriber — return their actual tier.
  if (paidStatuses.has(status) && (plan === "indie" || plan === "pro" || plan === "agency")) {
    return plan as LocalizerTier;
  }

  // Active trial — grant full feature access so prospects see what they'd buy.
  const trialEndsAt = org.trial_ends_at as string | null;
  if (trialEndsAt && new Date(trialEndsAt) > new Date()) {
    return "pro";
  }

  // No paid plan, no live trial — no feature access.
  return "none";
}

/**
 * Returns true if the given tier is allowed to render/download the format.
 * - "indie" — static formats only (3 social JPEGs).
 * - "pro", "agency" — all formats (static + rich).
 * - "none" — blocked from all formats. Download gates also catch "none"
 *   via the existing paid/free check; this is defense-in-depth.
 */
export function isFormatAllowedForTier(formatKey: FormatKey, tier: FeatureTier): boolean {
  if (tier === "none") return false;
  if (tier === "pro" || tier === "agency") return true;
  // tier === "indie"
  return FORMATS[formatKey].category === "static";
}

/**
 * Custom-font access. Fonts are a "rich" feature gated by tier (not a format,
 * so this lives separately from isFormatAllowedForTier).
 */
export function isCustomFontAllowedForTier(tier: FeatureTier): boolean {
  return tier === "pro" || tier === "agency";
}
