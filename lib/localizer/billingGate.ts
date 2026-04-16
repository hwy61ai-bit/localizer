import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminEmail } from "@/lib/auth/adminEmails";

export type LocalizerAccessLevel = "none" | "free" | "paid";

/**
 * Three-state Localizer access for the free-tier rollout.
 *  - 'paid': admin email, OR localizer_plan_status ∈ {active, past_due},
 *            OR bundle_plan_status ∈ {active, past_due}
 *  - 'free': signed-in user (or resolved org) exists but has no active subscription
 *  - 'none': defensive — missing orgId or org row not readable (RLS silent read)
 *
 * Mirrors lib/tourrouter/billingGate.ts#getTourRouterAccessLevel. Both products
 * check their own plan status OR the shared bundle_plan_status column, so a
 * bundle customer automatically has paid access to both.
 */
export async function getLocalizerAccessLevel(
  orgId: string,
  userEmail?: string | null,
): Promise<LocalizerAccessLevel> {
  if (!orgId) return "none";

  // Note: this admin bypass only fires when a userEmail is passed through.
  // Venue-facing download routes (app/api/download, app/api/download-all)
  // deliberately omit the userEmail argument so admin-owned venue shares
  // are treated the same as any other org for the public download gate.
  if (isAdminEmail(userEmail)) {
    return "paid";
  }

  const supabase = supabaseAdmin();
  const { data: org } = await supabase
    .from("orgs")
    .select("localizer_plan_status, bundle_plan_status")
    .eq("id", orgId)
    .maybeSingle();

  // Null return = row not found OR RLS silent read. Treat as 'none' defensively.
  if (!org) return "none";

  const paidStatuses = new Set(["active", "past_due"]);
  if (
    paidStatuses.has((org.localizer_plan_status as string | null) ?? "") ||
    paidStatuses.has((org.bundle_plan_status as string | null) ?? "")
  ) {
    return "paid";
  }

  return "free";
}
