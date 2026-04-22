import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminEmail } from "@/lib/auth/adminEmails";

export default async function DashboardPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const admin = supabaseAdmin();

  const { data: membership } = await admin
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const orgId = membership?.org_id as string | undefined;
  if (!orgId) redirect("/login?error=no_org");

  const { data: org } = await admin
    .from("orgs")
    .select("plan, plan_status, trial_ends_at, stripe_customer_id, localizer_enabled, tourrouter_enabled")
    .eq("id", orgId)
    .maybeSingle();

  if (!org) redirect("/login?error=no_org");

  const isPaid = !!org.stripe_customer_id && org.plan_status === "active";
  const trialActive = org.trial_ends_at ? new Date(org.trial_ends_at) > new Date() : false;
  const isAdmin = isAdminEmail(user.email);
  const hasAccess = isPaid || trialActive || isAdmin;

  return (
    <div style={{ padding: 40, fontFamily: "monospace", fontSize: 14 }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>BISECT DEBUG</h1>
      <pre style={{ background: "#f0f0f0", padding: 16, overflow: "auto" }}>{JSON.stringify({
        email: user.email,
        orgId,
        org,
        isPaid,
        trialActive,
        isAdmin,
        hasAccess,
      }, null, 2)}</pre>
    </div>
  );
}
