import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export default async function TourMarketingHubPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = supabaseAdmin();

  // 1. Validate marketing token (tour-scoped)
  const { data: marketingToken } = await supabase
    .from("marketing_tokens")
    .select("tour_id, org_id, expires_at, revoked_at")
    .eq("token", token)
    .maybeSingle();

  if (!marketingToken) notFound();
  if (marketingToken.revoked_at) notFound();
  if (marketingToken.expires_at && new Date(marketingToken.expires_at) <= new Date()) notFound();

  // 2. Tour lookup
  const { data: tour } = await supabase
    .from("tours")
    .select("id, name, band_name, band_tour_label, image_url, artist_id")
    .eq("id", marketingToken.tour_id)
    .single();

  if (!tour) notFound();

  // 3. Artist lookup — only spotify_url
  const t = tour as any;
  const { data: artist } = t.artist_id
    ? await supabase
        .from("artists")
        .select("spotify_url")
        .eq("id", t.artist_id)
        .single()
    : { data: null };

  // 4. Events for the tour
  const { data: events } = await supabase
    .from("events")
    .select("id, date_iso, day, city, state, venue, venue_name, venue_city, venue_state, render_status")
    .eq("tour_id", tour.id)
    .order("date_iso", { ascending: true });

  const eventList = events ?? [];

  // 5. Update last_used_at
  await supabase
    .from("marketing_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token", token)
    .select()
    .maybeSingle();

  // Derived values
  const bandName = t.band_name ?? t.band_tour_label ?? t.name ?? "Artist";
  const showCount = eventList.length;

  const spotifyUrl: string | null = (artist as any)?.spotify_url ?? null;
  const spotifyEmbedUrl = spotifyUrl
    ? spotifyUrl.replace("open.spotify.com/", "open.spotify.com/embed/")
    : null;

  // Date range
  let dateRange = "";
  if (eventList.length === 1 && eventList[0].date_iso) {
    const d = new Date(eventList[0].date_iso + "T12:00:00");
    dateRange = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  } else if (eventList.length > 1) {
    const first = eventList[0].date_iso ? new Date(eventList[0].date_iso + "T12:00:00") : null;
    const last = eventList[eventList.length - 1].date_iso ? new Date(eventList[eventList.length - 1].date_iso + "T12:00:00") : null;
    if (first && last) {
      const firstStr = first.toLocaleDateString("en-US", { month: "long", day: "numeric" });
      const firstYear = first.getFullYear();
      const lastYear = last.getFullYear();
      if (firstYear === lastYear) {
        const lastStr = last.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
        dateRange = `${firstStr} — ${lastStr}`;
      } else {
        const firstWithYear = first.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
        const lastWithYear = last.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
        dateRange = `${firstWithYear} — ${lastWithYear}`;
      }
    }
  }

  return (
    <div style={{ background: "var(--hw-bg)", minHeight: "100vh", color: "var(--hw-text)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 64px" }}>

        {/* Header */}
        <div style={{ padding: "24px 0 20px", borderBottom: "3px solid var(--hw-border-strong)", marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--hw-font-display)", fontSize: 28, letterSpacing: "4px", color: "var(--hw-crimson)" }}>HWY61</span>
          <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, color: "var(--hw-text-muted)", letterSpacing: "4px", textTransform: "uppercase" }}>Tour Marketing Kit</span>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: 48, border: "3px solid var(--hw-border-strong)", padding: 28, background: "var(--hw-bg-surface)" }}>
          <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, color: "var(--hw-blue)", letterSpacing: "4px", textTransform: "uppercase", marginBottom: 8 }}>Tour Marketing Kit</div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 52, letterSpacing: "2px", lineHeight: 1, textTransform: "uppercase" }}>{bandName}</div>
          </div>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {dateRange && (
              <div>
                <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, color: "var(--hw-text-muted)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "1.5px" }}>Date Range</div>
                <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 15, fontWeight: 400, color: "var(--hw-text-secondary)" }}>{dateRange}</div>
              </div>
            )}
            <div>
              <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, color: "var(--hw-text-muted)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "1.5px" }}>Shows</div>
              <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 15, fontWeight: 400, color: "var(--hw-text-secondary)" }}>{showCount} {showCount === 1 ? "show" : "shows"}</div>
            </div>
          </div>
        </div>

        {/* Shows */}
        <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, color: "var(--hw-blue)", letterSpacing: "4px", textTransform: "uppercase", marginBottom: 20 }}>Shows</div>
        {eventList.length === 0 ? (
          <div style={{ border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", padding: 40, textAlign: "center", marginBottom: 48 }}>
            <span style={{ fontFamily: "var(--hw-font-mono)", color: "var(--hw-text-muted)", fontSize: 13, letterSpacing: "1px" }}>No shows yet</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 48 }}>
            {eventList.map((ev) => {
              const evVenue = ev.venue_name ?? ev.venue ?? "";
              const evCity = ev.venue_city ?? ev.city ?? "";
              const evState = ev.venue_state ?? ev.state ?? "";
              const isReady = ev.render_status === "ready";

              let shortDate = "";
              if (ev.date_iso) {
                try {
                  const d = new Date(ev.date_iso + "T12:00:00");
                  shortDate = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                } catch {}
              }

              const cardStyle: React.CSSProperties = {
                border: "3px solid var(--hw-border-strong)",
                background: "var(--hw-bg-surface)",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 20,
                ...(isReady ? {} : { opacity: 0.6 }),
              };

              const cardContent = (
                <>
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 14, color: "var(--hw-text)", whiteSpace: "nowrap" }}>{shortDate}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 15, color: "var(--hw-text)", marginBottom: 2 }}>{evVenue}</div>
                    {(evCity || evState) && (
                      <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, color: "var(--hw-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>{[evCity, evState].filter(Boolean).join(", ")}</div>
                    )}
                  </div>
                  {isReady ? (
                    <span style={{ background: "#2d7a3d", color: "#fff", fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", padding: "6px 12px", border: "2px solid var(--hw-border-strong)", whiteSpace: "nowrap" }}>Ready</span>
                  ) : (
                    <span style={{ background: "#888", color: "#fff", fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", padding: "6px 12px", border: "2px solid var(--hw-border-strong)", whiteSpace: "nowrap" }}>Rendering</span>
                  )}
                </>
              );

              return isReady ? (
                <a key={ev.id} href={`/v/m/${token}?eventId=${ev.id}`} style={{ ...cardStyle, textDecoration: "none", color: "inherit" }}>
                  {cardContent}
                </a>
              ) : (
                <div key={ev.id} style={cardStyle}>
                  {cardContent}
                </div>
              );
            })}
          </div>
        )}

        {/* Spotify */}
        {spotifyEmbedUrl && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, color: "var(--hw-blue)", letterSpacing: "4px", textTransform: "uppercase", marginBottom: 20 }}>Listen</div>
            <iframe src={spotifyEmbedUrl} width="100%" height="352" frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy" style={{ border: "3px solid var(--hw-border-strong)" }} />
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: "3px solid var(--hw-border-strong)", paddingTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--hw-font-display)", fontSize: 18, letterSpacing: "3px", color: "var(--hw-crimson)" }}>HWY61</span>
          <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text-muted)" }}>POWERED BY HWY61</span>
        </div>
      </div>
    </div>
  );
}
