import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import WelcomeWizard from "./WelcomeWizard";

// Force dynamic rendering — server component reads auth cookies and per-user
// org state, must never be statically cached. This is the Next.js 14 equivalent
// of cache: "no-store" at the page level (supabase.from().select() does not
// expose a per-query cache option the way raw fetch does).
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Known simplification: if a user belongs to multiple orgs, .maybeSingle()
  // returns an arbitrary one. Fine for onboarding because users in this flow
  // typically have exactly one org; revisit if/when multi-org joins become
  // common before onboarding completes.
  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  // Edge case: authenticated user with no org membership.
  // Mirrors app/account/page.tsx — redirect to /dashboard, which has its
  // own handling for the empty-state case.
  if (!membership?.org_id) redirect("/dashboard");

  const { data: org } = await supabase
    .from("orgs")
    .select("id, name, onboarding_step, onboarding_completed")
    .eq("id", membership.org_id)
    .maybeSingle();

  if (!org) redirect("/dashboard");

  // Treat step >= 4 as completed even if the boolean is out of sync,
  // to defend against partial writes.
  if (org.onboarding_completed || (org.onboarding_step ?? 0) >= 4) {
    redirect("/dashboard");
  }

  // Clamp to the three valid wizard screens: 1 = org name, 2 = user name, 3 = role.
  const rawStep = org.onboarding_step ?? 0;
  const initialStep = Math.min(Math.max(rawStep || 1, 1), 3) as 1 | 2 | 3;

  const initialFullName =
    (user.user_metadata?.full_name as string | undefined) ?? "";

  return (
    <WelcomeWizard
      initialStep={initialStep}
      orgId={org.id}
      orgName={org.name ?? ""}
      userId={user.id}
      initialFullName={initialFullName}
    />
  );
}
