import { supabaseServer } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";
import TemplateEditor from "./TemplateEditor";

export default async function TemplatePage({ params }: { params: Promise<{ tourId: string }> }) {
  const { tourId } = await params;
  const supabase = await supabaseServer();

  const { data: tour, error } = await supabase
    .from("tours")
    .select("id, name, band_name, band_tour_label, image_url, image_square_id, image_story_id, image_landscape_id, video_tiktok_id, video_yt_shorts_id, overlay_config")
    .eq("id", tourId)
    .single();

  if (error || !tour) notFound();

  const { data: events } = await supabase
    .from("events")
    .select("date_iso, city, state, venue")
    .eq("tour_id", tourId)
    .order("date_iso", { ascending: true });

  const allEvents = events ?? [];
  const firstEvent = allEvents[0] ?? null;

  return <TemplateEditor tour={tour} tourId={tourId} firstEvent={firstEvent} allEvents={allEvents} orgId={tour.org_id} />;
}
