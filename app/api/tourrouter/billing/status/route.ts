import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { checkTourRouterAccess } from "@/lib/tourrouter/billingGate";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership?.org_id) return NextResponse.json({ error: "No org found" }, { status: 404 });

  const access = await checkTourRouterAccess(membership.org_id, user.email);

  const { data: org } = await supabase
    .from("orgs")
    .select("plan, plan_status, tourrouter_plan, tourrouter_plan_status, tourrouter_current_period_end")
    .eq("id", membership.org_id)
    .single();

  return NextResponse.json({
    active: access.allowed,
    plan: access.plan,
    reason: access.reason || null,
    currentPeriodEnd: org?.tourrouter_current_period_end || null,
    hasLocalizerSubscription: org?.plan_status === "active",
  });
}
