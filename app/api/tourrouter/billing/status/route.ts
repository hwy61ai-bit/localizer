import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

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

  const { data: org } = await supabase
    .from("orgs")
    .select("stripe_customer_id, plan, plan_status, tourrouter_plan, tourrouter_plan_status, tourrouter_current_period_end")
    .eq("id", membership.org_id)
    .single();

  if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

  const active = org.tourrouter_plan_status === "active";
  const plan = org.tourrouter_plan || null;

  return NextResponse.json({
    active,
    plan,
    currentPeriodEnd: org.tourrouter_current_period_end || null,
    hasLocalizerSubscription: org.plan_status === "active",
  });
}
