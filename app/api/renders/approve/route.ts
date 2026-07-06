import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { generatePublicToken } from "@/lib/tokens";
import { Resend } from "resend";
import { LOCALIZER_FROM } from "@/lib/email/sender";
import { checkRateLimit } from "@/lib/rateLimit";

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

  const rl = await checkRateLimit(`approve:${orgId}`);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: rl.reset
          ? { "Retry-After": String(Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000))) }
          : undefined,
      }
    );
  }

  if (!event.promoter_email || event.promoter_email.trim() === "") {
    return NextResponse.json({ error: "no_promoter_email" }, { status: 400 });
  }

  const { data: tour, error: tourError } = await supabase
    .from("tours")
    .select("id, name, band_name, band_tour_label")
    .eq("id", event.tour_id)
    .single();

  if (tourError || !tour) {
    return NextResponse.json({ error: "Tour not found" }, { status: 404 });
  }

  const bandName = (tour as any).band_name ?? (tour as any).band_tour_label ?? (tour as any).name ?? "Artist";
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
  const { data: updatedEvent, error: updateErr } = await supabase
    .from("events")
    .update({ render_status: "ready", sent_at: now })
    .eq("id", eventId)
    .select()
    .maybeSingle();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  if (!updatedEvent) {
    console.error("[renders/approve] events update returned no row BEFORE email send — aborting to prevent orphaned email, check RLS policy on events.render_status/sent_at", { eventId, orgId });
    return NextResponse.json({ error: "event_update_failed" }, { status: 500 });
  }

  const venueLink = `${process.env.NEXT_PUBLIC_APP_URL}/v/e/${token}`;

  if (event.promoter_email) {
    const toEmails = event.promoter_email.split(",").map((e: string) => e.trim()).filter(Boolean);
    await resend.emails.send({
      from: LOCALIZER_FROM,
      to: toEmails,
      subject: `Show assets ready — ${bandName} @ ${venueName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; padding: 40px 32px; border-radius: 12px;">
          <p style="font-family: sans-serif; font-size: 11px; font-weight: 700; color: #ffffff; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 16px 0;">Show Assets Ready</p>
          <h1 style="font-family: 'Bebas Neue', Impact, sans-serif; font-size: 64px; font-weight: 400; color: #ffffff; margin: 0 0 8px 0; line-height: 1; letter-spacing: 2px;">${bandName.toUpperCase()} / ASSETS</h1>
          <div style="border-top: 1px solid #222; margin: 20px 0;"></div>
          <p style="font-family: sans-serif; color: #ffffff; font-size: 14px; margin: 0 0 4px 0;">${dateFormatted}</p>
          <p style="font-family: sans-serif; color: #ffffff; font-size: 14px; margin: 0 0 32px 0;">${venueName}${cityState ? ", " + cityState : ""}</p>
          <a href="${venueLink}" style="display: inline-block; padding: 14px 28px; background: #ffffff; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 900; font-size: 14px; letter-spacing: 0.05em;">
            VIEW & DOWNLOAD ASSETS →
          </a>
          <p style="margin-top: 40px; font-size: 11px; color: #ffffff; font-family: sans-serif;">
            Powered by Localizer — Tour dates in. Tour Assets out.
          </p>
        </div>
      `,
    });
  }

  return NextResponse.json({ ok: true, token });
}
