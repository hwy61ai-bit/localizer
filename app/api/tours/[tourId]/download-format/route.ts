import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getLocalizerAccessLevel } from "@/lib/localizer/billingGate";
import JSZip from "jszip";

export const dynamic = "force-dynamic";

// Maps the ?format= query value to its venue_links column and a friendly
// filename label. Print poster (render_poster_url) is deliberately excluded —
// it renders via a separate pdf-lib path and is not offered for bulk download.
const FORMAT_MAP: Record<string, { column: string; label: string; ext: string }> = {
  square:    { column: "render_square_url",    label: "IG_Post",      ext: "jpg" },
  story:     { column: "render_story_url",     label: "IG_Story",     ext: "jpg" },
  landscape: { column: "render_landscape_url", label: "FB_Cover",     ext: "jpg" },
  tiktok:    { column: "render_tiktok_url",    label: "TikTok_Reels", ext: "mp4" },
  yt_shorts: { column: "render_yt_shorts_url", label: "Square_Video", ext: "mp4" },
};

export async function GET(
  req: NextRequest,
  { params }: { params: { tourId: string } }
) {
  const { tourId } = params;
  const format = req.nextUrl.searchParams.get("format");

  if (!format || !(format in FORMAT_MAP)) {
    return NextResponse.json({ error: "invalid_format" }, { status: 400 });
  }
  const { column, label, ext } = FORMAT_MAP[format];

  const supabase = await supabaseServer();

  // --- Auth: verify the signed-in user is a member of the tour's org ---
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const { data: tour, error: tourError } = await supabase
    .from("tours")
    .select("org_id, band_name, name")
    .eq("id", tourId)
    .maybeSingle();
  if (tourError) return NextResponse.json({ error: tourError.message }, { status: 500 });
  if (!tour) return NextResponse.json({ error: "tour_not_found" }, { status: 404 });

  const { data: membership, error: memberError } = await supabase
    .from("org_members")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("org_id", tour.org_id)
    .maybeSingle();
  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 });
  if (!membership) return NextResponse.json({ error: "not_org_member" }, { status: 403 });

  // --- Paid gate: mirror the billing model used by the venue download routes ---
  const level = await getLocalizerAccessLevel(tour.org_id, user.email);
  if (level !== "paid") {
    return NextResponse.json(
      { error: "download_requires_paid", message: "Downloading assets requires an active Localizer plan." },
      { status: 402 },
    );
  }

  // --- Gather: all events for this tour, then their venue_links render URLs ---
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id, venue, date_iso, city")
    .eq("tour_id", tourId)
    .order("date_iso", { ascending: true });
  if (eventsError) return NextResponse.json({ error: eventsError.message }, { status: 500 });
  if (!events || events.length === 0) {
    return NextResponse.json({ error: "no_events" }, { status: 404 });
  }

  const eventIds = events.map((e) => e.id);
  const { data: links, error: linksError } = await supabase
    .from("venue_links")
    .select(`event_id, ${column}`)
    .in("event_id", eventIds);
  if (linksError) return NextResponse.json({ error: linksError.message }, { status: 500 });

  // Build a map of event_id -> render URL for the requested format (skip nulls).
  const urlByEvent = new Map<string, string>();
  for (const link of (links ?? [])) {
    const url = (link as Record<string, any>)[column];
    if (url) urlByEvent.set((link as Record<string, any>).event_id, url);
  }

  const bandName = (tour.band_name ?? tour.name ?? "Artist").replace(/[^a-zA-Z0-9_-]/g, "_");
  const rootFolder = `${bandName}_${label}/`;

  const assets: { filename: string; url: string }[] = [];
  for (const ev of events) {
    const url = urlByEvent.get(ev.id);
    if (!url) continue; // un-rendered show — skipped (expected partial-count behavior)
    const cleanDate = (ev.date_iso ?? "").replace(/[^a-zA-Z0-9_-]/g, "_");
    const cleanCity = (ev.city ?? "").replace(/[^a-zA-Z0-9_-]/g, "_");
    const namePart = [bandName, cleanDate, cleanCity].filter(Boolean).join("_");
    assets.push({ filename: `${rootFolder}${namePart}_${label}.${ext}`, url });
  }

  if (assets.length === 0) {
    return NextResponse.json({ error: "no_rendered_assets" }, { status: 404 });
  }

  // --- Zip + stream (reused from download-all/route.ts) ---
  const zip = new JSZip();
  await Promise.all(
    assets.map(async (asset) => {
      try {
        const res = await fetch(asset.url);
        if (res.ok) {
          const buffer = await res.arrayBuffer();
          zip.file(asset.filename, buffer);
        }
      } catch (err) {
        console.error("Failed to fetch asset:", asset.filename, err);
      }
    })
  );

  const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

  return new NextResponse(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${bandName}_${label}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
