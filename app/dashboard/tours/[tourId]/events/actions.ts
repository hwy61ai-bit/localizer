"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

function requiredString(formData: FormData, key: string) {
  const v = formData.get(key);
  if (!v || typeof v !== "string" || v.trim().length === 0) {
    throw new Error(`${key} is required`);
  }
  return v.trim();
}

function optionalString(formData: FormData, key: string) {
  const v = formData.get(key);
  if (!v || typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

export async function createEventAction(tourId: string, formData: FormData) {
  const supabase = await supabaseServer();

  // 1) Must be logged in
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) throw new Error("Not authenticated");

  // 2) Load tour to get org_id (and implicitly ensure the tour exists)
  const { data: tour, error: tourErr } = await supabase
    .from("tours")
    .select("id, org_id")
    .eq("id", tourId)
    .single();

  if (tourErr || !tour) throw new Error("Tour not found");

  const orgId = tour.org_id as string;

  // 3) Read form values
  const title = requiredString(formData, "title");
  const eventDate = optionalString(formData, "event_date"); // YYYY-MM-DD
  const venueName = optionalString(formData, "venue_name");
  const city = optionalString(formData, "city");
  const state = optionalString(formData, "state");
  const ticketUrl = optionalString(formData, "ticket_url");

  // 4) Insert into events
  // NOTE: your table currently does NOT have a "title" column yet.
  // So for now we store the title in "venue" OR we add a title column next.
  // Best: add title column. But to avoid breaking flow today, we’ll store it in venue if venue is empty.
  const venueLegacy = venueName ?? title;

  const { data: inserted, error: insErr } = await supabase
    .from("events")
    .insert({
      org_id: orgId,
      tour_id: tourId,

      title: title,
      source: "manual",
      event_date: eventDate,
      venue_name: venueName,
      venue_city: city,
      venue_state: state,
      ticket_url: ticketUrl,

      // existing columns your UI already displays
      date_iso: eventDate,
      city: city ?? "",
      state: state,
      venue: venueLegacy,
      status: "ready",
    })
    .select("id")
    .single();

  if (insErr) throw new Error(insErr.message);

  // 5) Back to tour page
  redirect(`/dashboard/tours/${tourId}`);
}
export async function createVenueLink(formData: FormData) {
  const orgId = String(formData.get("orgId"));
  const eventId = String(formData.get("eventId"));

  const supabase = await supabaseServer();

  const { data: existing } = await supabase
    .from("venue_links")
    .select("token")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .maybeSingle();

  if (existing?.token) {
    redirect(`/v/e/${existing.token}`);
  }

  const token = generatePublicToken();

  const { error } = await supabase
    .from("venue_links")
    .insert({
      org_id: orgId,
      event_id: eventId,
      token,
      is_active: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  redirect(`/v/e/${token}`);
}
import { generatePublicToken } from "@/lib/tokens";