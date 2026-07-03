import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getLocalizerAccessLevel } from "@/lib/localizer/billingGate";
import JSZip from "jszip";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const supabase = supabaseAdmin();

  const { data: link } = await supabase
    .from("venue_links")
    .select("render_square_url, render_story_url, render_landscape_url, render_poster_url, render_tiktok_url, render_yt_shorts_url, event_id, org_id")
    .eq("token", token)
    .maybeSingle();

  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Paid gate by link owner (public venue-facing route — viewer is not
  // authenticated, so we check the org that created the share link). No
  // userEmail passed: admin bypass is deliberately off for venue downloads.
  const level = await getLocalizerAccessLevel(link.org_id);
  if (level !== "paid") {
    return NextResponse.json(
      {
        error: "download_requires_paid",
        message: "Downloading assets requires a paid Localizer subscription.",
      },
      { status: 402 },
    );
  }

  const { data: event } = await supabase
    .from("events")
    .select("venue, date_iso, city, tour_id")
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
    .select("adv_stage_plot_url, adv_hospitality_url, adv_foh_url, adv_w9_url, adv_custom_materials, venue_show_advance_docs, venue_show_w9")
    .eq("id", tour.artist_id)
    .single() : { data: null };

  const bandName = (tour?.band_name ?? tour?.name ?? "Artist").replace(/[^a-zA-Z0-9_-]/g, "_");
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

  const customMaterials = ((artist as { adv_custom_materials?: Array<{ id: string; label: string; url: string }> } | null)?.adv_custom_materials) || [];

  // Fixed advance docs may be legacy public URLs (pre-B4) or private advance-docs paths (post-B2).
  // Custom materials remain public.
  const fixedAdvSources = [
    { name: "Stage_Plot",         value: artist?.adv_stage_plot_url },
    { name: "Hospitality_Rider",  value: artist?.adv_hospitality_url },
    { name: "FOH_Requirements",   value: artist?.adv_foh_url },
    { name: "W-9",                value: artist?.adv_w9_url },
  ];
  // Visibility gates (default on; null/undefined treated as true) — mirrors
  // the venue page's server-side gate so the zip stays consistent with what
  // the promoter can see.
  const showAdvanceDocs = artist?.venue_show_advance_docs !== false;
  const showW9 = artist?.venue_show_w9 !== false;
  const fixedAdvUrl: { filename: string; url: string }[] = [];
  const fixedAdvPrivate: { filename: string; path: string }[] = [];
  if (showAdvanceDocs) {
    for (const s of fixedAdvSources) {
      if (!s.value) continue;
      if (!showW9 && s.name === "W-9") continue;
      const filename = rootFolder + `Advance/${filePrefix}_${s.name}.pdf`;
      if (s.value.startsWith("http")) {
        fixedAdvUrl.push({ filename, url: s.value });
      } else {
        fixedAdvPrivate.push({ filename, path: s.value });
      }
    }
  }

  const advAssets: { filename: string; url: string }[] = [
    ...fixedAdvUrl,
    ...customMaterials.filter((c) => c.url).map((c) => {
      const safeLabel = c.label.replace(/[^a-zA-Z0-9_.-]/g, "_");
      const cleanUrl = c.url.split("?")[0];
      const ext = cleanUrl.split(".").pop() || "pdf";
      return { filename: rootFolder + `Advance/${filePrefix}_${safeLabel}.${ext}`, url: c.url };
    }),
  ];

  const allAssets = [...imageAssets, ...videoAssets, ...advAssets];

  if (!allAssets.length && !fixedAdvPrivate.length) return NextResponse.json({ error: "No assets available" }, { status: 404 });

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

  // Private advance-docs (post-B2): download via admin storage client.
  await Promise.all(
    fixedAdvPrivate.map(async (doc) => {
      try {
        const { data, error } = await supabase.storage
          .from("advance-docs")
          .download(doc.path);
        if (error || !data) {
          console.warn("[download-all] advance-doc private download failed:", doc.path, error?.message);
          return;
        }
        const buffer = await data.arrayBuffer();
        zip.file(doc.filename, buffer);
      } catch (err) {
        console.warn("[download-all] advance-doc private download threw:", doc.filename, err);
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