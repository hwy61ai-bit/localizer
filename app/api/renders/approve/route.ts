import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { generatePublicToken } from "@/lib/tokens";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function formatDateForOverlay(iso: string): string {
  try {
    const d = new Date(iso + "T12:00:00");
    const month = d.toLocaleDateString("en-US", { month: "long" });
    const day = d.getDate();
    const year = d.getFullYear();
    return `${month} ${day} ${year}`;
  } catch {
    return iso;
  }
}

export async function POST(req: NextRequest) {
  const { eventId, orgId } = await req.json();
  if (!eventId || !orgId) {
    return NextResponse.json({ error: "Missing eventId or orgId" }, { status: 400 });
  }

  const supabase = await supabaseServer();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, tour_id, org_id, date_iso, city, state, venue, venue_name, venue_city, venue_state, promoter_email")
    .eq("id", eventId)
    .eq("org_id", orgId)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const { data: tour, error: tourError } = await supabase
    .from("tours")
    .select("id, name, band_tour_label")
    .eq("id", event.tour_id)
    .single();

  if (tourError || !tour) {
    return NextResponse.json({ error: "Tour not found" }, { status: 404 });
  }

  const bandName = (tour as any).band_tour_label ?? (tour as any).name ?? "Artist";
  const dateFormatted = formatDateForOverlay(event.date_iso);
  const venueName = event.venue_name ?? event.venue ?? "";
  const cityState = [event.venue_city ?? event.city, event.venue_state ?? event.state]
    .filter(Boolean).join(", ");

  const { data: existing } = await supabase
    .from("venue_links")
    .select("id, token")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .maybeSingle();

  let token: string;

  if (existing?.token) {
    token = existing.token;
  } else {
    token = generatePublicToken();
    await supabase.from("venue_links").insert({
      org_id: orgId,
      event_id: eventId,
      token,
      is_active: true,
    });
  }

  const now = new Date().toISOString();
  await supabase
    .from("events")
    .update({ render_status: "ready", sent_at: now })
    .eq("id", eventId);

  const venueLink = `${process.env.NEXT_PUBLIC_APP_URL}/v/e/${token}`;

  if (event.promoter_email) {
    await resend.emails.send({
      from: "noreply@hwy61.ai",
      to: event.promoter_email,
      subject: `Show assets ready — ${bandName} @ ${venueName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="font-size: 24px; font-weight: 900; margin-bottom: 8px;">Show assets are ready.</h2>
          <p style="color: #555; margin-bottom: 24px;">
            ${bandName} — ${dateFormatted}<br/>
            ${venueName}, ${cityState}
          </p>
          <a href="${venueLink}" style="display: inline-block; padding: 14px 28px; background: #111; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 900; font-size: 15px;">
            View & Download Assets →
          </a>
          <p style="margin-top: 32px; font-size: 12px; color: #999;">
            Powered by Localizer — Tour dates in. Show graphics out.
          </p>
        </div>
      `,
    });
  }

  return NextResponse.json({ ok: true, token });
}
