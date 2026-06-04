import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import { artistLimitForPlan } from "@/lib/localizer/artistLimits";
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
    .select("id, name, localizer_plan, localizer_plan_status, trial_ends_at, stripe_customer_id")
    .eq("id", membership.org_id)
    .single();

  const { count: artistCount } = await supabase
    .from("artists")
    .select("id", { count: "exact", head: true })
    .eq("org_id", membership.org_id)
    .not("name", "is", null)
    .neq("name", "");

  const localizerPlan = org?.localizer_plan ?? null;
  const localizerPlanStatus = org?.localizer_plan_status ?? null;
  const trialEndsAt = org?.trial_ends_at ?? null;
  const artistLimit = artistLimitForPlan(localizerPlan);
  const artistsUsed = artistCount ?? 0;

  return (
    <AccountClient
      email={user.email ?? ""}
      orgName={org?.name ?? "My Workspace"}
      localizerPlan={localizerPlan}
      localizerPlanStatus={localizerPlanStatus}
      trialEndsAt={trialEndsAt}
      hasStripe={!!org?.stripe_customer_id}
      artistsUsed={artistsUsed}
      artistLimit={artistLimit}
    />
  );
}
