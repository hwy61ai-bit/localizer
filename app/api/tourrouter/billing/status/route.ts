import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { checkTourRouterAccess } from "@/lib/tourrouter/billingGate";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";

export async function GET() {
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);

  const supabase = await supabaseServer();
  const access = await checkTourRouterAccess(result.orgId, result.userEmail);

  const { data: org } = await supabase
    .from("orgs")
    .select("plan, plan_status, tourrouter_plan, tourrouter_plan_status, tourrouter_current_period_end")
    .eq("id", result.orgId)
    .single();

  return NextResponse.json({
    active: access.allowed,
    plan: access.plan,
    reason: access.reason || null,
    currentPeriodEnd: org?.tourrouter_current_period_end || null,
    hasLocalizerSubscription: org?.plan_status === "active",
  });
}
