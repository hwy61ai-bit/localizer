"use server";
import { generatePublicToken } from "@/lib/tokens";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

function optionalString(formData: FormData, key: string) {
  const v = formData.get(key);
  if (!v || typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

export async function createEventAction(tourId: string, formData: FormData) {
  const supabase = await supabaseServer();

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("Not authenticated");

  const { data: tour, error: tourErr } = await supabase
    .from("tours").select("id, org_id").eq("id", tourId).single();
  if (tourErr || !tour) throw new Error("Tour not found");

  const eventDate = optionalString(formData, "event_date");
  const day = optionalString(formData, "day");
  const venueName = optionalString(formData, "venue_name");
  const city = optionalString(formData, "city");
  const state = optionalString(formData, "state");
  const promoterEmail = optionalString(formData, "promoter_email");
  const managerEmail = optionalString(formData, "manager_email");

  const { data: created, error: insErr } = await supabase.from("events").insert({
    org_id: tour.org_id,
    tour_id: tourId,
    date_iso: eventDate,
    day: day,
    city: city ?? "",
    state: state,
    venue: venueName ?? "",
    promoter_email: promoterEmail,
    manager_email: managerEmail,
    source: "manual",
    status: "ready",
    event_index: 0,
  }).select("id").maybeSingle();

  if (insErr) throw new Error(insErr.message);
  if (!created) throw new Error("Event creation failed — no row returned (possible permissions issue)");

  redirect(`/dashboard/tours/${tourId}`);
}

export async function createVenueLink(formData: FormData) {
  const orgId = String(formData.get("orgId"));
  const eventId = String(formData.get("eventId"));

  const supabase = await supabaseServer();

  const { data: existing } = await supabase
    .from("venue_links").select("token")
    .eq("event_id", eventId).eq("is_active", true).maybeSingle();

  if (existing?.token) {
    redirect(`/v/e/${existing.token}`);
  }

  const token = generatePublicToken();

  const { error } = await supabase.from("venue_links").insert({
    org_id: orgId,
    event_id: eventId,
    token,
    is_active: true,
  });

  if (error) throw new Error(error.message);

  redirect(`/v/e/${token}`);
}

export async function saveBandTourInfo(
  tourId: string,
  bandName: string | null,
  tourLabel: string | null,
): Promise<{ ok: true; flagged: boolean } | { ok: false; error: string }> {
  const supabase = await supabaseServer();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { ok: false, error: "unauthorized" };

  const { data: tour, error: tourErr } = await supabase
    .from("tours")
    .select("id, org_id, band_name, band_tour_label")
    .eq("id", tourId)
    .maybeSingle();
  if (tourErr || !tour) return { ok: false, error: "tour_not_found" };

  const { data: membership } = await supabase
    .from("org_members")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("org_id", tour.org_id)
    .maybeSingle();
  if (!membership) return { ok: false, error: "forbidden" };

  const bandChanged = (tour.band_name ?? null) !== bandName;
  const tourChanged = (tour.band_tour_label ?? null) !== tourLabel;
  if (!bandChanged && !tourChanged) return { ok: true, flagged: false };

  const { data: updated, error: updateErr } = await supabase
    .from("tours")
    .update({ band_name: bandName, band_tour_label: tourLabel })
    .eq("id", tourId)
    .select("id")
    .maybeSingle();
  if (updateErr || !updated) {
    console.error("[saveBandTourInfo] tours update failed", { tourId, error: updateErr?.message });
    return { ok: false, error: "save_failed" };
  }

  // Band/tour text is baked into every rendered poster — flag all currently-rendered
  // events on this tour as stale. Only fires when a value actually changed.
  const { error: flagErr } = await supabase
    .from("events")
    .update({ needs_rerender: true })
    .eq("tour_id", tourId)
    .in("render_status", ["ready"])
    .select("id");
  if (flagErr) {
    console.error("[saveBandTourInfo] staleness flag write failed (non-fatal)", { tourId, error: flagErr.message });
  }

  return { ok: true, flagged: true };
}
