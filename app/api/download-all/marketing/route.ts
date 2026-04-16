import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getLocalizerAccessLevel } from "@/lib/localizer/billingGate";
import JSZip from "jszip";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const eventId = req.nextUrl.searchParams.get("eventId");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 });

  const supabase = supabaseAdmin();

  // 1. Validate marketing token (tour-scoped)
  const { data: marketingToken } = await supabase
    .from("marketing_tokens")
    .select("tour_id, org_id, expires_at, revoked_at")
    .eq("token", token)
    .maybeSingle();

  if (!marketingToken) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (marketingToken.revoked_at) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (marketingToken.expires_at && new Date(marketingToken.expires_at) <= new Date())
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 2. Load event and verify tour_id match
  const { data: event } = await supabase
    .from("events")
    .select("id, tour_id, venue, date_iso, city")
    .eq("id", eventId)
    .single();

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (event.tour_id !== marketingToken.tour_id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 3. Fetch venue_links by event_id for render URLs
  const { data: link } = await supabase
    .from("venue_links")
    .select("render_square_url, render_story_url, render_landscape_url, render_poster_url, render_tiktok_url, render_yt_shorts_url")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 4. Paid gate by token owner org
  const level = await getLocalizerAccessLevel(marketingToken.org_id);
  if (level !== "paid") {
    return NextResponse.json(
      {
        error: "download_requires_paid",
        message: "Downloading assets requires a paid Localizer subscription.",
      },
      { status: 402 },
    );
  }

  // 5. Tour lookup for naming
  const { data: tour } = await supabase
    .from("tours")
    .select("band_name, name")
    .eq("id", event.tour_id)
    .single();

  const bandName = (tour?.band_name ?? tour?.name ?? "Artist").replace(/[^a-zA-Z0-9_-]/g, "_");
  const cleanVenue = event.venue?.replace(/[^a-zA-Z0-9_-]/g, "_") ?? "Venue";
  const cleanDate = event.date_iso?.replace(/[^a-zA-Z0-9_-]/g, "_") ?? "";
  const cleanCity = event.city?.replace(/[^a-zA-Z0-9_-]/g, "_") ?? "";
  const slug = [bandName, cleanDate, cleanCity].filter(Boolean).join("_");
  const filePrefix = [bandName, cleanDate, cleanCity].filter(Boolean).join("_");
  const rootFolder = slug + "/";

  const imageAssets: { filename: string; url: string }[] = [
    { filename: rootFolder + `Social/${filePrefix}_IG_Post.jpg`,   url: link.render_square_url },
    { filename: rootFolder + `Social/${filePrefix}_IG_Story.jpg`,  url: link.render_story_url },
    { filename: rootFolder + `Social/${filePrefix}_FB_Cover.jpg`,  url: link.render_landscape_url },
    { filename: rootFolder + `Social/${filePrefix}_Tour_Poster.jpg`, url: link.render_poster_url },
  ].filter((a) => !!a.url) as { filename: string; url: string }[];

  const videoAssets: { filename: string; url: string }[] = [
    { filename: rootFolder + `Video/${filePrefix}_TikTok_Reels.mp4`,   url: link.render_tiktok_url },
    { filename: rootFolder + `Video/${filePrefix}_Square.mp4`, url: link.render_yt_shorts_url },
  ].filter((a) => !!a.url) as { filename: string; url: string }[];

  const allAssets = [...imageAssets, ...videoAssets];

  if (!allAssets.length) return NextResponse.json({ error: "No assets available" }, { status: 404 });

  // 6. Update last_used_at on the marketing token
  await supabase
    .from("marketing_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token", token)
    .select()
    .maybeSingle();

  const zip = new JSZip();
  await Promise.all(
    allAssets.map(async (asset) => {
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
      "Content-Disposition": `attachment; filename="${slug}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
