import { redirect } from "next/navigation";
import Link from "next/link";
import { randomUUID } from "crypto";
import { supabaseServer } from "@/lib/supabaseServer";
import { createVenueLink } from "./events/actions";
import OpenAssetsButton from "./components/OpenAssetsButton";

type TourRow = {
  id: string; org_id: string; name: string;
  band_tour_label: string | null; created_at: string; last_opened_at: string | null;
};
type EventRow = {
  id: string; tour_id: string; date_iso: string; day: string | null;
  city: string; state: string | null; venue: string;
  promoter_email: string | null; manager_email: string | null;
  sent_at: string | null; event_index: number | null;
};

export default async function TourPage({ params }: { params: Promise<{ tourId: string }> }) {
  const { tourId } = await params;
  const supabase = await supabaseServer();

  const { data: tour, error: tourError } = await supabase
    .from("tours").select("id, org_id, name, band_tour_label, created_at, last_opened_at")
    .eq("id", tourId).single<TourRow>();
  if (tourError || !tour) throw new Error(tourError?.message ?? "Tour not found");

  const orgId = tour.org_id;
  const tourName = tour.name;
  const bandTourLabel = tour.band_tour_label;

  await supabase.from("tours").update({ last_opened_at: new Date().toISOString() }).eq("id", tourId);

  const { data: toursData, error: toursError } = await supabase
    .from("tours").select("id, org_id, name, band_tour_label, created_at, last_opened_at")
    .eq("org_id", orgId).order("last_opened_at", { ascending: false }).order("created_at", { ascending: false });
  if (toursError) throw new Error(toursError.message);

  const tours = (toursData ?? []) as TourRow[];
  const pinnedTabs = tours.slice(0, 4);

  const { data: eventsData, error: eventsError } = await supabase
    .from("events").select("id, tour_id, date_iso, day, city, state, venue, promoter_email, manager_email, sent_at, event_index")
    .eq("tour_id", tourId).order("event_index", { ascending: true }).order("date_iso", { ascending: true });
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
    const value = String(formData.get("band_tour_label") ?? "").trim();
    const supabase = await supabaseServer();
    const { error } = await supabase.from("tours").update({ band_tour_label: value.length ? value : null }).eq("id", tourId);
    if (error) throw new Error(error.message);
    redirect(`/dashboard/tours/${tourId}`);
  }

  async function markEventSent(formData: FormData) {
    "use server";
    const eventId = String(formData.get("eventId") ?? "");
    if (!eventId) return;
    const supabase = await supabaseServer();
    const { error } = await supabase.from("events").update({ sent_at: new Date().toISOString() }).eq("id", eventId);
    if (error) throw new Error(error.message);
    redirect(`/dashboard/tours/${tourId}`);
  }

  const COLS = "90px 100px 160px 200px 200px 200px 100px 100px 90px";

  return (
    <div style={{ padding: 32, background: "#fafafa", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 18 }}>
          <Link href="/dashboard" style={{ fontSize: 13, fontWeight: 700, color: "#888", textDecoration: "none", display: "inline-block", marginBottom: 8 }}>← Back</Link>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1 className="brand-title" style={{ margin: 0 }}>LOCALIZER</h1>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <Link href={`/dashboard/tours/${tourId}/assets`} style={{ padding: "12px 24px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", textDecoration: "none", fontWeight: 900, fontSize: 15 }}>Import Assets</Link>
              <Link href={`/dashboard/tours/${tourId}/import`} style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", color: "#111", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>↑ Import Schedule</Link>
              <form action={createTour} style={{ margin: 0 }}>
                <button style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>+ New Tour</button>
              </form>
            </div>
          </div>
        </div>


        <div style={{ padding: 18, border: "1px solid #e6e6e6", borderRadius: 16, background: "#fff", boxShadow: "0 12px 30px rgba(0,0,0,0.05)", marginBottom: 18 }}>
          <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>Band / Tour</div>
          <form action={saveBandTourLabel} style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input name="band_tour_label" defaultValue={bandTourLabel ?? ""} placeholder="Band/Tour" style={{ flex: 1, padding: "12px 14px", border: "1px solid #ddd", borderRadius: 12, fontSize: 18, fontWeight: 800, outline: "none" }} />
            <button type="submit" style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 900, cursor: "pointer" }}>Save</button>
          </form>
        </div>

        <div style={{ border: "1px solid #e6e6e6", borderRadius: 16, overflow: "hidden", background: "#fff" }}>
          <div style={{ padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #eee" }}>
            <div>
              <div style={{ fontSize: 21, fontWeight: 900 }}>Events</div>
            </div>
            <Link href={`/dashboard/tours/${tourId}/events/new`} style={{ padding: "10px 12px", border: "1px solid #111", borderRadius: 12, background: "#111", color: "#fff", textDecoration: "none", fontWeight: 900, fontSize: 13 }}>+ New Event</Link>
          </div>

          <div style={{ overflowX: "auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: COLS, minWidth: 1470, gap: 0, padding: "10px 16px", background: "#fafafa", fontSize: 12, fontWeight: 900, borderBottom: "1px solid #eee" }}>
              <div>Date</div><div>Day</div><div>City, ST</div><div>Venue</div>
              <div>Promoter Email</div><div>Manager Email</div>
              <div>Assets</div><div>Status</div><div>Link</div>
            </div>

            {eventRows.length === 0 ? (
              <div style={{ padding: 16, opacity: 0.7 }}>No events yet. Click <b>+ New Event</b> to create one.</div>
            ) : (
              eventRows.map((e) => (
                <div key={e.id} style={{ display: "grid", gridTemplateColumns: COLS, minWidth: 1470, padding: "12px 16px", borderTop: "1px solid #f0f0f0", alignItems: "center", fontSize: 14 }}>
                  <div>{e.date_iso ? new Date(e.date_iso + "T12:00:00").toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" }) : ""}</div>
                  <div>{e.day ?? ""}</div>
                  <div>{e.city}{e.state ? `, ${e.state}` : ""}</div>
                  <div>{e.venue}</div>
                  <div style={{ opacity: 0.7 }}>{e.promoter_email ?? ""}</div>
                  <div style={{ opacity: 0.7 }}>{e.manager_email ?? ""}</div>
                  <div>
                    <OpenAssetsButton event={{ id: e.id, date_iso: e.date_iso, city: e.city, state: e.state, venue: e.venue }} />
                  </div>
                  <div>
                    {e.sent_at ? (
                      <span style={{ display: "inline-block", padding: "6px 10px", borderRadius: 999, border: "1px solid #ddd", background: "#e9f7ef", fontWeight: 900, fontSize: 12 }}>SENT</span>
                    ) : (
                      <form action={markEventSent}>
                        <input type="hidden" name="eventId" value={e.id} />
                        <button type="submit" style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid #ddd", background: "#ffecec", cursor: "pointer", fontWeight: 900, fontSize: 12 }}>SEND</button>
                      </form>
                    )}
                  </div>
                  <div>
                    <form action={createVenueLink}>
                      <input type="hidden" name="orgId" value={orgId} />
                      <input type="hidden" name="eventId" value={e.id} />
                      <button type="submit" style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: 900, fontSize: 12 }}>LINK</button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </div>
          <div style={{ padding: 14, opacity: 0.7, fontSize: 12 }}>Next: thumbnails + email sending (SEND → SENT stays simple for now).</div>
        </div>
      </div>
    </div>
  );
}
