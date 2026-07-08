import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  const { tourId, orgId } = await req.json();
  if (!tourId || !orgId) return NextResponse.json({ error: "Missing tourId or orgId" }, { status: 400 });

  const supabase = await supabaseServer();

  const { data: tour, error: tourError } = await supabase
    .from("tours")
    .select("id, org_id, name, band_name, band_tour_label, image_url, image_print_id, image_square_id, image_story_id, image_landscape_id, video_tiktok_id, video_yt_shorts_id, overlay_config, crop_config, sponsor_logo_1_url, sponsor_logo_2_url, custom_text_1, custom_text_2, band_font_family")
    .eq("id", tourId)
    .eq("org_id", orgId)
    .single();

  if (tourError || !tour) return NextResponse.json({ error: "Tour not found" }, { status: 404 });
  const hasAnyAsset =
    tour.image_square_id ||
    tour.image_story_id ||
    tour.image_landscape_id ||
    tour.image_print_id ||
    tour.video_tiktok_id ||
    tour.video_yt_shorts_id;
  if (!hasAnyAsset) return NextResponse.json({ error: "No assets uploaded" }, { status: 400 });

  const { data: events } = await supabase
    .from("events")
    .select("id, date_iso, city, state, venue, venue_name, venue_city, venue_state, opener")
    .eq("tour_id", tourId)
    .order("date_iso");

  // Load custom fonts for this org (for browser @font-face loading)
  const { data: fonts } = await supabase
    .from("custom_fonts")
    .select("font_name, storage_url")
    .eq("org_id", orgId);

  // Get artist logo if tour has artist_id
  let logoUrl: string | null = null;
  const { data: tourFull } = await supabase
    .from("tours")
    .select("artist_id")
    .eq("id", tourId)
    .single();
  if (tourFull?.artist_id) {
    const { data: artist } = await supabase
      .from("artists")
      .select("logo_url")
      .eq("id", tourFull.artist_id)
      .single();
    logoUrl = artist?.logo_url ?? null;
  }

  return NextResponse.json({
    tour: {
      band_name: tour.band_name,
      band_tour_label: tour.band_tour_label,
      band_font_family: tour.band_font_family,
      name: tour.name,
      image_url: tour.image_url,
      image_print_id: tour.image_print_id,
      image_square_id: tour.image_square_id,
      image_story_id: tour.image_story_id,
      image_landscape_id: tour.image_landscape_id,
      overlay_config: tour.overlay_config,
      crop_config: tour.crop_config,
      custom_text_1: tour.custom_text_1 ?? null,
      custom_text_2: tour.custom_text_2 ?? null,
    },
    events: events ?? [],
    customFonts: (fonts ?? []).map(f => ({ fontName: f.font_name, url: f.storage_url })),
    logoUrl,
    sponsorLogo1Url: tour.sponsor_logo_1_url ?? null,
    sponsorLogo2Url: tour.sponsor_logo_2_url ?? null,
  });
}
