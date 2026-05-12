import Link from "next/link";
import { createEventAction } from "../actions";

export default async function NewEventPage({
  params,
}: {
  params: Promise<{ tourId: string }>;
}) {
  const { tourId } = await params;

  return (
    <div style={{ padding: 40, maxWidth: 640, minHeight: "100vh", background: "transparent" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontFamily: "var(--hw-font-display)", fontWeight: 900, letterSpacing: "2px", textTransform: "uppercase" }}>New Event</h1>
        <Link href={`/dashboard/tours/${tourId}`} style={{ fontSize: 13, fontFamily: "var(--hw-font-mono)", fontWeight: 700, color: "var(--hw-text-muted)", textDecoration: "none", letterSpacing: "1px", textTransform: "uppercase" }}>← Back</Link>
      </div>

      <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", borderRadius: 0, padding: 24 }}>
        <form action={createEventAction.bind(null, tourId)}>
          <div style={{ display: "grid", gap: 16 }}>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, fontFamily: "var(--hw-font-mono)", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--hw-text-muted)" }}>Date</div>
                <input name="event_date" type="date" style={{ width: "100%", padding: "10px 12px", border: "3px solid var(--hw-border-strong)", borderRadius: 0, fontSize: 14, fontFamily: "var(--hw-font-body)", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontFamily: "var(--hw-font-mono)", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--hw-text-muted)" }}>Day</div>
                <select name="day" style={{ width: "100%", padding: "10px 12px", border: "3px solid var(--hw-border-strong)", borderRadius: 0, fontSize: 14, fontFamily: "var(--hw-font-body)", background: "var(--hw-bg-surface)", boxSizing: "border-box" }}>
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
                <div style={{ fontSize: 12, fontFamily: "var(--hw-font-mono)", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--hw-text-muted)" }}>City</div>
                <input name="city" placeholder="Memphis" style={{ width: "100%", padding: "10px 12px", border: "3px solid var(--hw-border-strong)", borderRadius: 0, fontSize: 14, fontFamily: "var(--hw-font-body)", boxSizing: "border-box" }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontFamily: "var(--hw-font-mono)", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--hw-text-muted)" }}>State</div>
                <input name="state" placeholder="TN" style={{ width: "100%", padding: "10px 12px", border: "3px solid var(--hw-border-strong)", borderRadius: 0, fontSize: 14, fontFamily: "var(--hw-font-body)", boxSizing: "border-box" }} />
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, fontFamily: "var(--hw-font-mono)", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--hw-text-muted)" }}>Venue</div>
              <input name="venue_name" placeholder="The Fillmore" style={{ width: "100%", padding: "10px 12px", border: "3px solid var(--hw-border-strong)", borderRadius: 0, fontSize: 14, fontFamily: "var(--hw-font-body)", boxSizing: "border-box" }} />
            </div>

            <div>
              <div style={{ fontSize: 12, fontFamily: "var(--hw-font-mono)", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--hw-text-muted)" }}>Promoter Email</div>
              <input name="promoter_email" type="email" placeholder="promoter@example.com" style={{ width: "100%", padding: "10px 12px", border: "3px solid var(--hw-border-strong)", borderRadius: 0, fontSize: 14, fontFamily: "var(--hw-font-body)", boxSizing: "border-box" }} />
            </div>

            <div>
              <div style={{ fontSize: 12, fontFamily: "var(--hw-font-mono)", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--hw-text-muted)" }}>Manager Email</div>
              <input name="manager_email" type="email" placeholder="manager@example.com" style={{ width: "100%", padding: "10px 12px", border: "3px solid var(--hw-border-strong)", borderRadius: 0, fontSize: 14, fontFamily: "var(--hw-font-body)", boxSizing: "border-box" }} />
            </div>

            <button type="submit" style={{ marginTop: 4, padding: "12px 24px", borderRadius: 0, border: "3px solid var(--hw-crimson)", background: "var(--hw-crimson)", color: "#fff", fontFamily: "var(--hw-font-display)", fontWeight: 900, fontSize: 14, letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer" }}>
              Create Event
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}
