import Link from "next/link";
import { createEventAction } from "../actions";

export default async function NewEventPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const { tourId } = await params;

  return (
    <div style={{ padding: 40, maxWidth: 640, minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>New Event</h1>
        <Link href={`/dashboard/tours/${tourId}`} style={{ fontSize: 13, fontWeight: 700, color: "#888", textDecoration: "none" }}>← Back</Link>
      </div>

      <div style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 14, padding: 24 }}>
        <form action={createEventAction.bind(null, tourId)}>
          <div style={{ display: "grid", gap: 16 }}>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", color: "#999" }}>Date</div>
                <input name="event_date" type="date" style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", color: "#999" }}>Day</div>
                <select name="day" style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 10, fontSize: 14, background: "#fff", boxSizing: "border-box" }}>
                  <option value="">—</option>
                  <option>Monday</option>
                  <option>Tuesday</option>
                  <option>Wednesday</option>
                  <option>Thursday</option>
                  <option>Friday</option>
                  <option>Saturday</option>
                  <option>Sunday</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", color: "#999" }}>City</div>
                <input name="city" placeholder="Memphis" style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", color: "#999" }}>State</div>
                <input name="state" placeholder="TN" style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", color: "#999" }}>Venue</div>
              <input name="venue_name" placeholder="The Fillmore" style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", color: "#999" }}>Promoter Email</div>
              <input name="promoter_email" type="email" placeholder="promoter@example.com" style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em", color: "#999" }}>Manager Email</div>
              <input name="manager_email" type="email" placeholder="manager@example.com" style={{ width: "100%", padding: "10px 12px", border: "1px solid #ddd", borderRadius: 10, fontSize: 14, boxSizing: "border-box" }} />
            </div>

            <button type="submit" style={{ marginTop: 4, padding: "12px 24px", borderRadius: 10, border: "none", background: "#111", color: "#fff", fontWeight: 900, fontSize: 14, cursor: "pointer" }}>
              Create Event
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}
