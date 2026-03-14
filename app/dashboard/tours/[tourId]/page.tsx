import { redirect } from "next/navigation";
import Link from "next/link";
import { randomUUID } from "crypto";
import { supabaseServer } from "@/lib/supabaseServer";
import { createVenueLink } from "./events/actions";
import OpenAssetsButton from "./components/OpenAssetsButton";
import EventsTable from "./components/EventsTable";

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
};

export default async function TourPage({ params, searchParams }: { params: Promise<{ tourId: string }>; searchParams?: { saved?: string } }) {
  const { tourId } = await params;
  const justSaved = searchParams?.saved === "1";
  const supabase = await supabaseServer();

  const { data: tour, error: tourError } = await supabase
    .from("tours").select("id, org_id, name, band_tour_label, band_name, spotify_url, artist_id, created_at, last_opened_at, overlay_config, image_url, image_square_id, image_story_id, image_landscape_id")
    .eq("id", tourId).single<TourRow>();
  if (tourError || !tour) throw new Error(tourError?.message ?? "Tour not found");

  const orgId = tour.org_id;
  const tourName = tour.name;
  const bandTourLabel = tour.band_tour_label;
  const bandName = tour.band_name;
  const spotifyUrl = tour.spotify_url;

  await supabase.from("tours").update({ last_opened_at: new Date().toISOString() }).eq("id", tourId);

  const { data: toursData, error: toursError } = await supabase
    .from("tours").select("id, org_id, name, band_tour_label, created_at, last_opened_at")
    .eq("org_id", orgId).order("last_opened_at", { ascending: false }).order("created_at", { ascending: false });
  if (toursError) throw new Error(toursError.message);

  const tours = (toursData ?? []) as TourRow[];
  const pinnedTabs = tours.slice(0, 4);

  const { data: eventsData, error: eventsError } = await supabase
    .from("events").select("id, tour_id, date_iso, day, city, state, venue, promoter_email, manager_email, sent_at, event_index, render_status")
    .eq("tour_id", tourId).order("date_iso", { ascending: true });
  if (eventsError) throw new Error(eventsError.message);

  const eventRows = (eventsData ?? []) as EventRow[];

  async function createTour() {
    "use server";
    const supabase = await supabaseServer();
    const newTourId = randomUUID();
    const { error } = await supabase.from("tours").insert({ id: newTourId, org_id: orgId, name: "New Tour" });
    if (error) throw new Error(error.message);
    redirect(`/dashboard/tours/${newTourId}`);
  }

  async function saveBandTourLabel(formData: FormData) {
    "use server";
    const band = String(formData.get("band_name") ?? "").trim();
    const tour_label = String(formData.get("band_tour_label") ?? "").trim();
    const spotify = String(formData.get("spotify_url") ?? "").trim();
    const supabase = await supabaseServer();
    const { error } = await supabase.from("tours").update({
      band_name: band.length ? band : null,
      band_tour_label: tour_label.length ? tour_label : null,
      spotify_url: spotify.length ? spotify : null,
    }).eq("id", tourId);
    if (error) throw new Error(error.message);
    redirect(`/dashboard/tours/${tourId}?saved=1`);
  }



  return (
    <div style={{ padding: 32, background: "#EEEEEE", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid #ddd" }}>
          <Link href={tour.artist_id ? `/dashboard/artists/${tour.artist_id}` : "/dashboard"} style={{ fontSize: 13, fontWeight: 700, color: "#888", textDecoration: "none", display: "inline-block", marginBottom: 8 }}>← Back</Link>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1 className="brand-title" style={{ margin: 0 }}>LOCALIZER</h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#fff", border: "1px solid #ddd", borderRadius: 12, padding: "6px 8px" }}>
              <Link href={`/dashboard/tours/${tourId}/import`} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", color: "#111", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>↑ Import Schedule</Link>
              <Link href={`/dashboard/tours/${tourId}/assets`} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", textDecoration: "none", fontWeight: 900, fontSize: 13 }}>↑ Import Assets</Link>
              <Link href={`/dashboard/tours/${tourId}/template`} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", color: "#111", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>Poster Template</Link>
              <form action={createTour} style={{ margin: 0 }}>
                <button style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>+ New Tour</button>
              </form>
            </div>
          </div>
        </div>


        <div style={{ padding: 18, border: "1px solid #e6e6e6", borderRadius: 16, background: "#fff", marginBottom: 18 }}>
          <form action={saveBandTourLabel} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Band</div>
              <input name="band_name" defaultValue={bandName ?? ""} placeholder="Band name" style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", border: "1px solid #ddd", borderRadius: 12, fontSize: 18, fontWeight: 800, outline: "none" }} />
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>Tour</div>
              <input name="band_tour_label" defaultValue={bandTourLabel ?? ""} placeholder="Tour name" style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", border: "1px solid #ddd", borderRadius: 12, fontSize: 16, fontWeight: 600, outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input name="spotify_url" defaultValue={spotifyUrl ?? ""} placeholder="Spotify Artist or Playlist URL (optional)" style={{ flex: 1, padding: "10px 14px", border: "1px solid #ddd", borderRadius: 12, fontSize: 13, outline: "none", color: "#555" }} />
              <button type="submit" style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #111", background: justSaved ? "#1a7f4b" : "#111", color: "#fff", fontWeight: 900, cursor: "pointer", transition: "background 0.3s" }}>{justSaved ? "Saved ✓" : "Save"}</button>
            </div>
          </form>
        </div>

        <div style={{ border: "1px solid #e0e0e0", borderRadius: 16, overflow: "hidden", background: "#fff" }}>
          <div style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #eee" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.3px" }}>Events</div>
            </div>
            <Link href={`/dashboard/tours/${tourId}/events/new`} style={{ padding: "10px 18px", border: "1px solid #111", borderRadius: 10, background: "#111", color: "#fff", textDecoration: "none", fontWeight: 900, fontSize: 13 }}>+ New Event</Link>
          </div>

          <EventsTable events={eventRows} tourId={tourId} orgId={orgId}  />
          
        </div>
      </div>
    </div>
  );
}
