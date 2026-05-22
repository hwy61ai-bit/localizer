import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import LocalizerWelcome from "./LocalizerWelcome";

// Force dynamic rendering — server component reads auth cookies and per-user
// org state, must never be statically cached. This is the Next.js 14 equivalent
// of cache: "no-store" at the page level (supabase.from().select() does not
// expose a per-query cache option the way raw fetch does).
export const dynamic = "force-dynamic";

export default async function LocalizerOnboardingPage() {
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
  if (!membership?.org_id) redirect("/dashboard");

  const { data: org } = await supabase
    .from("orgs")
    .select(
      "id, name, localizer_onboarding_step, localizer_onboarding_completed, localizer_plan_status, bundle_plan_status"
    )
    .eq("id", membership.org_id)
    .maybeSingle();

  if (!org) redirect("/dashboard");

  // Eligibility gate: org must have a Localizer plan or a bundle plan.
  // Anything else means this user shouldn't see the Localizer wizard.
  if (org.localizer_plan_status === null && org.bundle_plan_status === null) {
    redirect("/dashboard");
  }

  if (org.localizer_onboarding_completed) {
    redirect("/dashboard");
  }

  return (
    <LocalizerWelcome
      orgId={org.id}
      orgName={org.name ?? ""}
      userId={user.id}
    />
  );
}
