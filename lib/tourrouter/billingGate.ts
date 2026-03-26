import { supabaseServer } from "@/lib/supabaseServer";

// Admin emails that always have access (dev bypass)
const ADMIN_EMAILS = ["hwy61ai@gmail.com", "hwy61regan@gmail.com"];

export type BillingAccess = {
  allowed: boolean;
  plan: string | null;
  reason?: string;
};

/**
 * Check if an org has active TourRouter access.
 * Admin emails always pass. Otherwise, checks tourrouter_plan_status on the orgs table.
 */
export async function checkTourRouterAccess(orgId: string, userEmail?: string | null): Promise<BillingAccess> {
  // Admin bypass
  if (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
    return { allowed: true, plan: "admin" };
  }

  const supabase = await supabaseServer();

  const { data: org } = await supabase
    .from("orgs")
    .select("tourrouter_plan, tourrouter_plan_status, tourrouter_current_period_end, stripe_customer_id, stripe_subscription_id")
    .eq("id", orgId)
    .single();

  if (!org) {
    return { allowed: false, plan: null, reason: "Org not found" };
  }

  // No subscription at all
  if (!org.stripe_subscription_id && !org.tourrouter_plan_status) {
    return { allowed: false, plan: null, reason: "No TourRouter subscription" };
  }

  // Check plan status
  if (org.tourrouter_plan_status === "active") {
    return { allowed: true, plan: org.tourrouter_plan || "basic" };
  }

  // Check if subscription expired but within grace period (e.g. payment retry)
  if (org.tourrouter_plan_status === "past_due") {
    return { allowed: true, plan: org.tourrouter_plan || "basic", reason: "Payment past due" };
  }

  return {
    allowed: false,
    plan: org.tourrouter_plan || null,
    reason: org.tourrouter_plan_status === "canceled"
      ? "Subscription canceled"
      : "Subscription inactive",
  };
}
