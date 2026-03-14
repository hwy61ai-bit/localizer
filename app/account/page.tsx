import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import AccountClient from "./AccountClient";

export default async function AccountPage() {
  const supabase = await supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.org_id) redirect("/dashboard");

  const { data: org } = await supabase
    .from("orgs")
    .select("id, name, plan, plan_status, stripe_customer_id")
    .eq("id", membership.org_id)
    .single();

  const { data: usage } = await supabase
    .from("usage_monthly")
    .select("renders_count")
    .eq("org_id", membership.org_id)
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle();

  const PLAN_LIMITS: Record<string, number> = {
    starter: 100,
    pro: 1000,
    agency: 10000,
  };

  const plan = (org?.plan ?? "starter").toLowerCase();
  const planLimit = PLAN_LIMITS[plan] ?? 100;
  const rendersUsed = usage?.renders_count ?? 0;

  return (
    <AccountClient
      email={user.email ?? ""}
      orgName={org?.name ?? "My Workspace"}
      plan={plan}
      planStatus={org?.plan_status ?? "active"}
      hasStripe={!!org?.stripe_customer_id}
      rendersUsed={rendersUsed}
      planLimit={planLimit}
    />
  );
}
