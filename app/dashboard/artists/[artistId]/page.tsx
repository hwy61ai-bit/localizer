import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import ArtistHubClient from "./ArtistHubClient";
import { getLocalizerAccessLevel } from "@/lib/localizer/billingGate";

export default async function ArtistDetailPage({
  params,
}: {
  params: Promise<{ artistId: string }>;
}) {
  const { artistId } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership?.org_id) redirect("/login");

  const { data: artist } = await supabase
    .from("artists")
    .select("name")
    .eq("id", artistId)
    .single();

  // Same rule as every other Localizer gate (trial, localizer/bundle plan
  // status, admin). The old client-side check read the stale orgs.plan_status.
  const accessLevel = await getLocalizerAccessLevel(membership.org_id, user.email);

  return (
    <ArtistHubClient
      artistId={artistId}
      artistName={artist?.name ?? "Artist"}
      hasLocalizer={accessLevel === "paid"}
    />
  );
}