import { supabaseServer } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";
import TemplateEditor from "./TemplateEditor";
import { effectiveTierForFeatures } from "@/lib/localizer/tierGate";

export const dynamic = "force-dynamic";

export default async function TemplatePage({ params }: { params: Promise<{ tourId: string }> }) {
  const { tourId } = await params;
  const supabase = await supabaseServer();

  const { data: tour, error } = await supabase
    .from("tours")
    .select("id, org_id, name, band_name, band_tour_label, image_url, image_print_id, image_square_id, image_story_id, image_landscape_id, video_tiktok_id, video_yt_shorts_id, overlay_config, crop_config, custom_text_1, custom_text_2, band_font_family")
    .eq("id", tourId)
    .single();

  if (error || !tour) notFound();

  const { data: orgRow } = await supabase
    .from("orgs")
    .select("localizer_plan, localizer_plan_status, trial_ends_at")
    .eq("id", tour.org_id)
    .maybeSingle();
  const tier = effectiveTierForFeatures({
    localizer_plan: orgRow?.localizer_plan ?? null,
    localizer_plan_status: orgRow?.localizer_plan_status ?? null,
    trial_ends_at: orgRow?.trial_ends_at ?? null,
  });

  const { data: events } = await supabase
    .from("events")
    .select("date_iso, city, state, venue")
    .eq("tour_id", tourId)
    .order("date_iso", { ascending: true });

  const allEvents = events ?? [];
  const firstEvent = allEvents[0] ?? null;

  return <TemplateEditor tour={tour} tourId={tourId} firstEvent={firstEvent} allEvents={allEvents} orgId={tour.org_id} tier={tier} />;
}
