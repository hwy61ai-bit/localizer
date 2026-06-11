"use server";

import { supabaseServer } from "@/lib/supabaseServer";
import { isAdminEmail } from "@/lib/auth/adminEmails";
import { tourLimitForPlan } from "@/lib/localizer/tourLimits";

type Result =
  | { ok: true; tourId: string }
  | { ok: false; error: "unauthenticated" | "no_org" | "tour_limit" | "insert_failed" };

export async function createTourForArtist(
  artistId: string,
  artistName: string,
): Promise<Result> {
  const supabase = await supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthenticated" };

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership?.org_id) return { ok: false, error: "no_org" };
  const orgId = membership.org_id;

  if (!isAdminEmail(user.email)) {
    const { data: org } = await supabase
      .from("orgs")
      .select("localizer_plan")
      .eq("id", orgId)
      .maybeSingle();
    const limit = tourLimitForPlan(org?.localizer_plan ?? null);
    if (limit !== null) {
      const { count } = await supabase
        .from("tours")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId);
      if ((count ?? 0) >= limit) return { ok: false, error: "tour_limit" };
    }
  }

  const { data, error } = await supabase
    .from("tours")
    .insert({ name: "New Tour", artist_id: artistId, band_name: artistName, org_id: orgId })
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false, error: "insert_failed" };

  return { ok: true, tourId: data.id };
}
