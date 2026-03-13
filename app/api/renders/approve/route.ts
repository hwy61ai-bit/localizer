import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { buildRenderUrl } from "@/lib/cloudinary/buildRenderUrl";
import type { RenderFormat, EventData } from "@/lib/cloudinary/buildRenderUrl";
import { generatePublicToken } from "@/lib/tokens";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FORMATS: RenderFormat[] = ["poster", "square", "story", "landscape"];

function formatDateForOverlay(iso: string): string {
  try {
    const d = new Date(iso + "T12:00:00");
    // No commas — Cloudinary chokes on them even after encoding
    const weekday = d.toLocaleDateString("en-US", { weekday: "long" });
    const month = d.toLocaleDateString("en-US", { month: "long" });
    const day = d.getDate();
    const year = d.getFullYear();
    return `${weekday} ${month} ${day} ${year}`;
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

  // 1. Fetch event — verify it belongs to this org
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, tour_id, org_id, date_iso, city, state, venue, venue_name, venue_city, venue_state, promoter_email")
    .eq("id", eventId)
    .eq("org_id", orgId)
    .single();

  if (eventError || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // 2. Fetch tour for image public_id and overlay config
  const { data: tour, error: tourError } = await supabase
    .from("tours")
    .select("id, name, band_tour_label, image_url, image_square_id, image_story_id, image_landscape_id, overlay_config")
    .eq("id", event.tour_id)
    .single();

  if (tourError || !tour) {
    return NextResponse.json({ error: "Tour not found" }, { status: 404 });
  }

  const t = tour as any;
  if (!t.image_url && !t.image_square_id && !t.image_story_id && !t.image_landscape_id) {
    return NextResponse.json({ error: "Tour has no images. Upload images before sending." }, { status: 400 });
  }

  // 3. Mark as rendering
  await supabase
    .from("events")
    .update({ render_status: "rendering" })
    .eq("id", eventId);

  // 4. Build event data for overlays
  const eventData: EventData = {
    bandName: (tour as any).band_tour_label ?? (tour as any).name ?? "Artist",
    dateFormatted: formatDateForOverlay(event.date_iso),
    venueName: event.venue_name ?? event.venue ?? "",
    cityState: [event.venue_city ?? event.city, event.venue_state ?? event.state]
      .filter(Boolean).join(", "),
  };

  // Per-format overlay configs — tours.overlay_config is now { square: {...}, story: {...}, landscape: {...} }
  const allConfigs = t.overlay_config ?? {};

  // 5. Build 4 render URLs using per-format public_ids and per-format configs
  const formatPublicIds: Record<string, string | null> = {
    poster: t.image_url ?? null,
    square: t.image_square_id ?? null,
    story: t.image_story_id ?? t.image_square_id ?? null,
    landscape: t.image_landscape_id ?? t.image_square_id ?? null,
  };

  const renderUrls: Record<string, string> = {};
  for (const format of FORMATS) {
    const pid = formatPublicIds[format];
    if (pid) {
      const formatConfig = allConfigs[format] ?? allConfigs ?? undefined;
      renderUrls[`render_${format}_url`] = buildRenderUrl(pid, eventData, format as any, formatConfig);
    }
  }

  // 6. Upsert venue_link with render URLs
  const { data: existing } = await supabase
    .from("venue_links")
    .select("id, token")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .maybeSingle();

  let token: string;

  if (existing?.token) {
    token = existing.token;
    await supabase
      .from("venue_links")
      .update({ ...renderUrls })
      .eq("id", existing.id);
  } else {
    token = generatePublicToken();
    await supabase.from("venue_links").insert({
      org_id: orgId,
      event_id: eventId,
      token,
      is_active: true,
      ...renderUrls,
    });
  }

  // 7. Mark as ready + set sent_at
  const now = new Date().toISOString();
  await supabase
    .from("events")
    .update({ render_status: "ready", sent_at: now })
    .eq("id", eventId);

  // 8. Send email to promoter
  const promoterEmail = event.promoter_email;
  const venueLink = `${process.env.NEXT_PUBLIC_APP_URL}/v/e/${token}`;

  if (promoterEmail) {
    await resend.emails.send({
      from: "noreply@hwy61.ai",
      to: promoterEmail,
      subject: `Show assets ready — ${eventData.bandName} @ ${eventData.venueName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="font-size: 24px; font-weight: 900; margin-bottom: 8px;">Show assets are ready.</h2>
          <p style="color: #555; margin-bottom: 24px;">
            ${eventData.bandName} — ${eventData.dateFormatted}<br/>
            ${eventData.venueName}, ${eventData.cityState}
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
