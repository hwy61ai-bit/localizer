import Link from "next/link";
import { createEventAction } from "./actions";

export default async function NewEventPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const { tourId } = await params;

  return (
    <div style={{ padding: 40, maxWidth: 640 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ margin: 0 }}>New Event</h1>
        <Link
          href={`/dashboard/tours/${tourId}`}
          style={{ padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8 }}
        >
          ← Back
        </Link>
      </div>

      <div style={{ marginTop: 8, opacity: 0.7, fontSize: 13 }}>
        This creates a manual event. Later, AI imports will create events in the same shape.
      </div>

      <form action={createEventAction.bind(null, tourId)} style={{ marginTop: 20 }}>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Title *
            </div>
            <input
              name="title"
              required
              placeholder="Band Name — Live"
              style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
            />
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Event date
            </div>
            <input
              name="event_date"
              type="date"
              style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
            />
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Venue name
            </div>
            <input
              name="venue_name"
              placeholder="The Fillmore"
              style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                City
              </div>
              <input
                name="city"
                placeholder="Detroit"
                style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
              />
            </div>

            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
                State
              </div>
              <input
                name="state"
                placeholder="MI"
                style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
              />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Ticket URL
            </div>
            <input
              name="ticket_url"
              type="url"
              placeholder="https://tickets.example.com/..."
              style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 10 }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Create Event
          </button>
        </div>
      </form>
    </div>
  );
}