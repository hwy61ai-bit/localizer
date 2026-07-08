import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";
import { createVenueLink } from "./events/actions";
import EventsTable from "./components/EventsTable";
import ShareWithMarketingButton from "./components/ShareWithMarketingButton";
import { TourPageNav } from "./TourPageNav";
import { effectiveTierForFeatures } from "@/lib/localizer/tierGate";

type TourRow = {
  id: string; org_id: string; name: string;
  band_tour_label: string | null; band_name: string | null; spotify_url: string | null; artist_id: string | null; created_at: string; last_opened_at: string | null;
};
type EventRow = {
  id: string; tour_id: string; date_iso: string; day: string | null;
  city: string; state: string | null; venue: string;
  promoter_email: string | null; manager_email: string | null;
  sent_at: string | null; event_index: number | null;
  render_status: string | null;
  opener: string | null;
  needs_rerender: boolean | null;
};

export default async function TourPage({ params, searchParams }: { params: Promise<{ tourId: string }>; searchParams?: { saved?: string } }) {
  const { tourId } = await params;
  const justSaved = searchParams?.saved === "1";
  const supabase = await supabaseServer();

  const { data: tour, error: tourError } = await supabase
    .from("tours").select("id, org_id, name, band_tour_label, band_name, artist_id, created_at, last_opened_at, overlay_config, image_url, image_square_id, image_story_id, image_landscape_id")
    .eq("id", tourId).single<TourRow>();
  if (tourError || !tour) throw new Error(tourError?.message ?? "Tour not found");

  const orgId = tour.org_id;
  const tourName = tour.name;
  const bandTourLabel = tour.band_tour_label;
  const bandName = tour.band_name;

  await supabase.from("tours").update({ last_opened_at: new Date().toISOString() }).eq("id", tourId);

  const { data: toursData, error: toursError } = await supabase
    .from("tours").select("id, org_id, name, band_tour_label, created_at, last_opened_at")
    .eq("org_id", orgId).order("last_opened_at", { ascending: false }).order("created_at", { ascending: false });
  if (toursError) throw new Error(toursError.message);

  const tours = (toursData ?? []) as TourRow[];
  const pinnedTabs = tours.slice(0, 4);

  const { data: orgRow } = await supabase
    .from("orgs")
    .select("localizer_plan, localizer_plan_status, trial_ends_at")
    .eq("id", orgId)
    .maybeSingle();
  const tier = effectiveTierForFeatures({
    localizer_plan: orgRow?.localizer_plan ?? null,
    localizer_plan_status: orgRow?.localizer_plan_status ?? null,
    trial_ends_at: orgRow?.trial_ends_at ?? null,
  });

  const { data: eventsData, error: eventsError } = await supabase
    .from("events").select("id, tour_id, date_iso, day, city, state, venue, promoter_email, manager_email, sent_at, event_index, render_status, opener, needs_rerender")
    .eq("tour_id", tourId).order("date_iso", { ascending: true });
  if (eventsError) throw new Error(eventsError.message);

  const eventRows = (eventsData ?? []) as EventRow[];

  async function saveBandTourLabel(formData: FormData) {
    "use server";
    const band = String(formData.get("band_name") ?? "").trim();
    const tour_label = String(formData.get("band_tour_label") ?? "").trim();
    const supabase = await supabaseServer();
    const { error } = await supabase.from("tours").update({
      band_name: band.length ? band : null,
      band_tour_label: tour_label.length ? tour_label : null,
    }).eq("id", tourId);
    if (error) throw new Error(error.message);
    redirect(`/dashboard/tours/${tourId}?saved=1`);
  }



  return (
    <div className="fade-in" style={{ padding: 32, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "3px solid var(--hw-border-strong)" }}>
          <Link href={tour.artist_id ? `/dashboard/artists/${tour.artist_id}?tab=localizer` : "/dashboard"} style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-muted)", textDecoration: "none", display: "inline-block", marginBottom: 8 }}>&larr; BACK</Link>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontFamily: "var(--hw-font-display)", fontSize: 28, letterSpacing: "4px", color: "var(--hw-crimson)", margin: 0, marginBottom: 4, paddingBottom: 8 }}>LOCALIZER</h1>
              <div style={{ borderBottom: "3px solid var(--hw-border-strong)", marginBottom: 6 }} />
              <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 48, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text)", margin: 0 }}>GIGS</div>
            </div>
            <TourPageNav tourId={tourId} active="gigs" />
          </div>
        </div>

        <div style={{ padding: 18, border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", marginBottom: 18 }}>
          <form action={saveBandTourLabel} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-secondary)", marginBottom: 6 }}>BAND</div>
              <input name="band_name" defaultValue={bandName ?? ""} placeholder="Band name" style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", border: "3px solid var(--hw-border-strong)", fontFamily: "var(--hw-font-body)", fontSize: 18, fontWeight: 500, outline: "none" }} />
            </div>
            <div>
              <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-secondary)", marginBottom: 6 }}>TOUR</div>
              <input name="band_tour_label" defaultValue={bandTourLabel ?? ""} placeholder="Tour name" style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", border: "3px solid var(--hw-border-strong)", fontFamily: "var(--hw-font-body)", fontSize: 16, fontWeight: 400, outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button type="submit" style={{ padding: "10px 24px", border: `3px solid ${justSaved ? "var(--hw-green)" : "var(--hw-crimson)"}`, background: justSaved ? "var(--hw-green)" : "var(--hw-crimson)", color: "#fff", fontFamily: "var(--hw-font-display)", fontSize: 14, letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer", transition: "var(--hw-ease)" }}>{justSaved ? "SAVED ✓" : "SAVE"}</button>
            </div>
          </form>
        </div>

        <div style={{ border: "3px solid var(--hw-border-strong)", overflow: "hidden", background: "var(--hw-bg-surface)" }}>
          <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12, borderBottom: "3px solid var(--hw-border-strong)" }}>
            <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, letterSpacing: "2px", textTransform: "uppercase" }}>EVENTS</div>
            <ShareWithMarketingButton tourId={tourId} tier={tier} />
            <div />
          </div>

          <EventsTable events={eventRows} tourId={tourId} orgId={orgId} tier={tier} />

        </div>
      </div>
    </div>
  );
}
