import { supabaseServer } from "@/lib/supabaseServer";

// Admin emails that always have access (dev bypass)
const ADMIN_EMAILS = ["hwy61ai@gmail.com", "tentenpm@gmail.com"];

export type TourRouterAccessLevel = "none" | "free" | "paid";

export type BillingAccess = {
  allowed: boolean;
  plan: string | null;
  reason?: string;
};

/**
 * Three-state TourRouter access for the free-tier rollout.
 *  - 'paid': admin email, OR tourrouter_plan_status ∈ {active, past_due},
 *            OR bundle_plan_status ∈ {active, past_due}
 *  - 'free': signed-in user whose org exists but has no active subscription
 *  - 'none': defensive — missing orgId or org row not readable (RLS silent read)
 */
export async function getTourRouterAccessLevel(
  orgId: string,
  userEmail?: string | null,
): Promise<TourRouterAccessLevel> {
  if (!orgId) return "none";

  // Admin bypass
  if (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
    return "paid";
  }

  const supabase = await supabaseServer();
  const { data: org } = await supabase
    .from("orgs")
    .select("tourrouter_plan_status, bundle_plan_status")
    .eq("id", orgId)
    .maybeSingle();

  // Null return = row not found OR RLS silent read. Treat as 'none' defensively.
  if (!org) return "none";

  const paidStatuses = new Set(["active", "past_due"]);
  if (
    paidStatuses.has((org.tourrouter_plan_status as string | null) ?? "") ||
    paidStatuses.has((org.bundle_plan_status as string | null) ?? "")
  ) {
    return "paid";
  }

  return "free";
}

/**
 * @deprecated Use getTourRouterAccessLevel() instead. This wrapper exists for
 * backward compatibility during the free-tier rollout and will be removed once
 * all call sites are migrated. Body delegates to getTourRouterAccessLevel so
 * the bundle_plan_status check is automatically honored and the two functions
 * cannot drift.
 */
export async function checkTourRouterAccess(orgId: string, userEmail?: string | null): Promise<BillingAccess> {
  const level = await getTourRouterAccessLevel(orgId, userEmail);
  if (level === "paid") {
    const isAdmin = !!userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase());
    return { allowed: true, plan: isAdmin ? "admin" : "basic" };
  }
  if (level === "none") {
    return { allowed: false, plan: null, reason: "Org not found" };
  }
  // level === "free"
  return { allowed: false, plan: null, reason: "No TourRouter subscription" };
}
