import { redirect } from "next/navigation";
import Link from "next/link";
import { randomUUID } from "crypto";
import { supabaseServer } from "@/lib/supabaseServer";
import { createVenueLink } from "./events/actions";

type TourRow = {
  id: string;
  org_id: string;
  name: string;
  band_tour_label: string | null;
  created_at: string;
  last_opened_at: string | null;
};

type EventRow = {
  id: string;
  tour_id: string;
  date_iso: string;
  day: string | null;
  city: string;
  state: string | null;
  venue: string;
  promoter_email: string | null;
  manager_email: string | null;
  sent_at: string | null;
  event_index: number | null;
};

export default async function TourPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const { tourId } = await params;
  const supabase = await supabaseServer();

  // 1) Load current tour
  const { data: tour, error: tourError } = await supabase
    .from("tours")
    .select("id, org_id, name, band_tour_label, created_at, last_opened_at")
    .eq("id", tourId)
    .single<TourRow>();

  if (tourError || !tour) {
    throw new Error(tourError?.message ?? "Tour not found");
  }

  const orgId = tour.org_id;
  const tourName = tour.name;
  const bandTourLabel = tour.band_tour_label;

  // 2) Update last_opened_at (best-effort)
  await supabase
    .from("tours")
    .update({ last_opened_at: new Date().toISOString() })
    .eq("id", tourId);

  // 3) Fetch tours for switcher
  const { data: toursData, error: toursError } = await supabase
    .from("tours")
    .select("id, org_id, name, band_tour_label, created_at, last_opened_at")
    .eq("org_id", orgId)
    .order("last_opened_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (toursError) throw new Error(toursError.message);

  const tours = (toursData ?? []) as TourRow[];
  const pinnedTabs = tours.slice(0, 4);

  // 4) Fetch events for this tour
  const { data: eventsData, error: eventsError } = await supabase
    .from("events")
    .select(
      "id, tour_id, date_iso, day, city, state, venue, promoter_email, manager_email, sent_at, event_index"
    )
    .eq("tour_id", tourId)
    .order("event_index", { ascending: true })
    .order("date_iso", { ascending: true });

  if (eventsError) throw new Error(eventsError.message);

  const eventRows = (eventsData ?? []) as EventRow[];

  // Server action: create new tour
  async function createTour() {
    "use server";

    const supabase = await supabaseServer();
    const newTourId = randomUUID();

    const { error } = await supabase.from("tours").insert({
      id: newTourId,
      org_id: orgId,
      name: "New Tour",
    });

    if (error) throw new Error(error.message);

    redirect(`/dashboard/tours/${newTourId}`);
  }

  // Server action: save Band/Tour label
  async function saveBandTourLabel(formData: FormData) {
    "use server";

    const value = String(formData.get("band_tour_label") ?? "").trim();
    const supabase = await supabaseServer();

    const { error } = await supabase
      .from("tours")
      .update({ band_tour_label: value.length ? value : null })
      .eq("id", tourId);

    if (error) throw new Error(error.message);

    redirect(`/dashboard/tours/${tourId}`);
  }

  // Server action: mark event as sent (sets sent_at)
  async function markEventSent(formData: FormData) {
    "use server";

    const eventId = String(formData.get("eventId") ?? "");
    if (!eventId) return;

    const supabase = await supabaseServer();

    const { error } = await supabase
      .from("events")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", eventId);

    if (error) throw new Error(error.message);

    redirect(`/dashboard/tours/${tourId}`);
  }

  return (
  <div
    style={{
      padding: 32,
      background: "#fafafa",
      minHeight: "100vh",
    }}
  >
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 8 }}>
  DEBUG: LINK-COLUMN v1
</div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 18,
        }}
      >
        <div>
         <h1 className="brand-title" style={{ margin: 0 }}>LOCALIZER</h1>
          <h1 style={{ margin: 0, fontSize: 28, letterSpacing: -0.3 }}>
            {tourName}
          </h1>
          <div style={{ opacity: 0.7, marginTop: 6, fontSize: 13 }}>
            Tour ID: {tourId}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <form action={createTour}>
            <button
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid #ddd",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              + New Tour
            </button>
          </form>

          <button
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            EDIT TOUR LAYOUT
          </button>
        </div>
      </div>

      {/* Tour switcher */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {pinnedTabs.map((t) => {
            const isActive = t.id === tourId;
            return (
              <Link
                key={t.id}
                href={`/dashboard/tours/${t.id}`}
                style={{
                  padding: "8px 10px",
                  border: "1px solid #ddd",
                  borderRadius: 999,
                  textDecoration: "none",
                  background: isActive ? "#111" : "#fff",
                  color: isActive ? "#fff" : "#111",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {t.name}
              </Link>
            );
          })}

          <details style={{ marginLeft: 6 }}>
            <summary
              style={{
                cursor: "pointer",
                padding: "8px 10px",
                border: "1px solid #ddd",
                borderRadius: 999,
                listStyle: "none",
                display: "inline-block",
                background: "#fff",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              All tours
            </summary>

            <div
              style={{
                marginTop: 10,
                border: "1px solid #ddd",
                borderRadius: 14,
                padding: 10,
                minWidth: 280,
                background: "#fff",
                boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
                Switch tour
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                {tours.map((t) => (
                  <Link
                    key={t.id}
                    href={`/dashboard/tours/${t.id}`}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      textDecoration: "none",
                      background: t.id === tourId ? "#f2f2f2" : "transparent",
                      color: "#111",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {t.name}
                  </Link>
                ))}
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* Band/Tour hero */}
      <div
        style={{
          padding: 18,
          border: "1px solid #e6e6e6",
          borderRadius: 16,
          background: "#fff",
          boxShadow: "0 12px 30px rgba(0,0,0,0.05)",
          marginBottom: 18,
        }}
      >
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 10 }}>
          Band / Tour
        </div>

        <form
          action={saveBandTourLabel}
          style={{ display: "flex", gap: 10, alignItems: "center" }}
        >
          <input
            name="band_tour_label"
            defaultValue={bandTourLabel ?? ""}
            placeholder="Band/Tour"
            style={{
              flex: 1,
              padding: "12px 14px",
              border: "1px solid #ddd",
              borderRadius: 12,
              fontSize: 18,
              fontWeight: 800,
              outline: "none",
            }}
          />

          <button
            type="submit"
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            Save
          </button>
        </form>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
          Example: <b>Led Zeppelin/Spring &amp; Summer 2026</b>
        </div>
      </div>

      {/* Events card */}
      <div
        style={{
          border: "1px solid #e6e6e6",
          borderRadius: 16,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <div
          style={{
            padding: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #eee",
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>Events</div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
              Create events manually now; AI imports plug in later.
            </div>
          </div>

          <Link
            href={`/dashboard/tours/${tourId}/events/new`}
            style={{
              padding: "10px 12px",
              border: "1px solid #111",
              borderRadius: 12,
              background: "#111",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 900,
              fontSize: 13,
            }}
          >
            + New Event
          </Link>
        </div>

        <div
  style={{
    display: "grid",
    gridTemplateColumns: "140px 80px 180px 220px 260px 260px 110px 120px",
    gap: 0,
    padding: "10px 16px",
    background: "#fafafa",
    fontSize: 12,
    fontWeight: 900,
    borderBottom: "1px solid #eee",
  }}
>
  <div>Date</div>
  <div>Day</div>
  <div>City, ST</div>
  <div>Venue</div>
  <div>Promoter Email</div>
  <div>Manager Email</div>
  <div>Status</div>
  <div>Link</div>
</div>

        {eventRows.length === 0 ? (
          <div style={{ padding: 16, opacity: 0.7 }}>
            No events yet. Click <b>+ New Event</b> to create one.
          </div>
        ) : (
          eventRows.map((e) => (
            <div
              key={e.id}
              style={{
                display: "grid",
                gridTemplateColumns: "140px 80px 180px 220px 260px 260px 110px 120px",
                padding: "12px 16px",
                borderTop: "1px solid #f0f0f0",
                alignItems: "center",
                fontSize: 14,
              }}
            >
              <div>{e.date_iso}</div>
              <div>{e.day ?? ""}</div>
              <div>
                {e.city}
                {e.state ? `, ${e.state}` : ""}
              </div>
              <div>{e.venue}</div>
              <div style={{ opacity: 0.7 }}>{e.promoter_email ?? ""}</div>
              <div style={{ opacity: 0.7 }}>{e.manager_email ?? ""}</div>

              <div>
                {e.sent_at ? (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "6px 10px",
                      borderRadius: 999,
                      border: "1px solid #ddd",
                      background: "#e9f7ef",
                      fontWeight: 900,
                      fontSize: 12,
                    }}
                  >
                    SENT
                  </span>
                ) : (
                  <form action={markEventSent}>
                    <input type="hidden" name="eventId" value={e.id} />
                    <button
                      type="submit"
                      style={{
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: "1px solid #ddd",
                        background: "#ffecec",
                        cursor: "pointer",
                        fontWeight: 900,
                        fontSize: 12,
                      }}
                    >
                      SEND
                    </button>
                    </form>
                )}
              </div>
              <div>
  <form action={createVenueLink}>
    <input type="hidden" name="orgId" value={orgId} />
    <input type="hidden" name="eventId" value={e.id} />
    <button
  type="submit"
  style={{
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 900,
    fontSize: 12,
  }}
>
  LINK
</button>
  </form>
</div>
            </div>
            
          ))
        )}

        <div style={{ padding: 14, opacity: 0.7, fontSize: 12 }}>
          Next: thumbnails + email sending (SEND → SENT stays simple for now).
        </div>
      </div>
    </div>
  </div>
);
}
