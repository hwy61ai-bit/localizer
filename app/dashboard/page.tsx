import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

export default async function DashboardPage() {
  const supabase = await supabaseServer();

  // 1) Make sure user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2) Find the user's org (via org_members)
  const { data: membership, error: membershipError } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  let orgId = membership?.org_id as string | undefined;

  // 3) If no org, create one + add org_member owner
  if (!orgId) {
    const newOrgId = randomUUID();

const { error: orgError } = await supabase
  .from("orgs")
  .insert({ id: newOrgId, name: "My Workspace" });

if (orgError) throw new Error(orgError.message);

orgId = newOrgId;

    const { error: memberError } = await supabase.from("org_members").insert({
      org_id: orgId,
      user_id: user.id,
      role: "owner",
    });

    if (memberError) throw new Error(memberError.message);
  }

  // 4) Ensure at least one tour exists for this org
  const { data: tour, error: tourError } = await supabase
    .from("tours")
    .select("id")
    .eq("org_id", orgId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (tourError) throw new Error(tourError.message);

  let tourId = tour?.id as string | undefined;

  if (!tourId) {
    const { data: newTour, error: newTourError } = await supabase
      .from("tours")
      .insert({ org_id: orgId, name: "New Tour" })
      .select("id")
      .single();

    if (newTourError) throw new Error(newTourError.message);

    tourId = newTour.id;
  }

  // 5) Redirect into the tour
  redirect(`/dashboard/tours/${tourId}`);
}