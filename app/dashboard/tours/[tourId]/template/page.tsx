import { supabaseServer } from "@/lib/supabaseServer";
import { notFound } from "next/navigation";
import TemplateEditor from "./TemplateEditor";

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const { tourId } = await params;
  const supabase = await supabaseServer();

  const { data: tour, error } = await supabase
    .from("tours")
    .select("id, name, band_name, band_tour_label, image_url, image_square_id, image_story_id, image_landscape_id, overlay_config")
    .eq("id", tourId)
    .single();

  if (error || !tour) notFound();

  return <TemplateEditor tour={tour} tourId={tourId} />;
}
