import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import JSZip from "jszip";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const supabase = await supabaseServer();

  const { data: link } = await supabase
    .from("venue_links")
    .select("render_square_url, render_story_url, render_landscape_url, render_poster_url, event_id, org_id")
    .eq("token", token)
    .maybeSingle();

  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: event } = await supabase
    .from("events")
    .select("venue, date_iso, tour_id")
    .eq("id", link.event_id)
    .single();

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const { data: tour } = await supabase
    .from("tours")
    .select("artist_id, band_name, name")
    .eq("id", event.tour_id)
    .single();

  const { data: artist } = tour?.artist_id ? await supabase
    .from("artists")
    .select("adv_stage_plot_url, adv_hospitality_url, adv_foh_url, adv_w9_url")
    .eq("id", tour.artist_id)
    .single() : { data: null };

  const bandName = (tour?.band_name ?? tour?.name ?? "Artist").replace(/[^a-zA-Z0-9_-]/g, "_");
  const cleanVenue = event.venue?.replace(/[^a-zA-Z0-9_-]/g, "_") ?? "Venue";
  const cleanDate = event.date_iso?.replace(/[^a-zA-Z0-9_-]/g, "_") ?? "";
  const slug = [bandName, cleanVenue, cleanDate].filter(Boolean).join("+");
  const rootFolder = slug + "/";

  const imageAssets: { filename: string; url: string }[] = [
    { filename: rootFolder + "Social/IG_Post.jpg",     url: link.render_square_url },
    { filename: rootFolder + "Social/IG_Story.jpg",    url: link.render_story_url },
    { filename: rootFolder + "Social/FB_Cover.jpg",    url: link.render_landscape_url },
    { filename: rootFolder + "Social/Tour_Poster.jpg", url: link.render_poster_url },
  ].filter((a) => !!a.url) as { filename: string; url: string }[];

  const advAssets: { filename: string; url: string }[] = [
    { filename: rootFolder + `Advance/${bandName}+Stage_Plot.pdf`,        url: artist?.adv_stage_plot_url },
    { filename: rootFolder + `Advance/${bandName}+Hospitality_Rider.pdf`, url: artist?.adv_hospitality_url },
    { filename: rootFolder + `Advance/${bandName}+FOH_Requirements.pdf`,  url: artist?.adv_foh_url },
    { filename: rootFolder + `Advance/${bandName}+W-9.pdf`,                url: artist?.adv_w9_url },
  ].filter((a) => !!a.url) as { filename: string; url: string }[];

  const allAssets = [...imageAssets, ...advAssets];

  if (!allAssets.length) return NextResponse.json({ error: "No assets available" }, { status: 404 });

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
