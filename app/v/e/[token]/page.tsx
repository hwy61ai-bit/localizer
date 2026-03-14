import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

export default async function VenuePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await supabaseServer();

  const { data: link } = await supabase
    .from("venue_links")
    .select("event_id, org_id, is_active, render_square_url, render_story_url, render_landscape_url, render_poster_url")
    .eq("token", token)
    .maybeSingle();

  if (!link || !link.is_active) notFound();

  const { data: event } = await supabase
    .from("events")
    .select("id, tour_id, date_iso, city, state, venue, venue_name, venue_city, venue_state")
    .eq("id", link.event_id)
    .single();

  if (!event) notFound();

  const { data: tour } = await supabase
    .from("tours")
    .select("name, band_tour_label, spotify_url")
    .eq("id", event.tour_id)
    .single();

  if (!tour) notFound();

  const t = tour as any;
  const bandName = t.band_tour_label ?? t.name ?? "Artist";
  const spotifyUrl: string | null = t.spotify_url ?? null;
  const spotifyEmbedUrl = spotifyUrl
    ? spotifyUrl.replace("open.spotify.com/", "open.spotify.com/embed/")
    : null;

  const venueName = event.venue_name ?? event.venue ?? "";
  const city = event.venue_city ?? event.city ?? "";
  const state = event.venue_state ?? event.state ?? "";
  const dateStr = event.date_iso ?? "";

  let formattedDate = dateStr;
  if (dateStr) {
    try {
      const d = new Date(dateStr + "T12:00:00");
      formattedDate = d.toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
      });
    } catch {}
  }

  const assets = [
    { label: "IG Post", dims: "1080 × 1080", aspect: "1/1", url: link.render_square_url },
    { label: "IG Stories", dims: "1080 × 1350", aspect: "4/5", url: link.render_story_url },
    { label: "FB Event Cover", dims: "1920 × 1080", aspect: "16/9", url: link.render_landscape_url },
  ];

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" />
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 64px" }}>

        {/* Header */}
        <div style={{ padding: "24px 0 20px", borderBottom: "1px solid #1e1e1e", marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 2, color: "#fff" }}>LOCALIZER</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: "0.1em", textTransform: "uppercase" }}>Official Asset Kit</span>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Show Assets</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, letterSpacing: 2, lineHeight: 1, marginBottom: 20 }}>{bandName}</div>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {formattedDate && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Date</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#d4d0c8" }}>{formattedDate}</div>
              </div>
            )}
            {venueName && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Venue</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#d4d0c8" }}>{venueName}</div>
              </div>
            )}
            {(city || state) && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#555", marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.08em" }}>Location</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#d4d0c8" }}>{[city, state].filter(Boolean).join(", ")}</div>
              </div>
            )}
          </div>
        </div>

        {/* Assets */}
        <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>Photos</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20, marginBottom: 64 }}>
          {assets.map((asset) => (
            <div key={asset.label} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ background: "#1a1a1a" }}>
                {asset.url ? (
                  <img src={asset.url} alt={asset.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#333", fontSize: 13 }}>
                    Rendering soon
                  </div>
                )}
              </div>
              <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{asset.label}</div>
                  <div style={{ fontSize: 11, color: "#555" }}>{asset.dims}</div>
                </div>
                {asset.url && (
                  <a href={asset.url} download target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, background: "#1e1e1e", color: "#fff", textDecoration: "none", fontSize: 16 }}>
                    ↓
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Spotify */}
        {spotifyEmbedUrl && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>Listen</div>
            <iframe src={spotifyEmbedUrl} width="100%" height="352" frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy" style={{ borderRadius: 16 }} />
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 2, color: "#333" }}>LOCALIZER</span>
          <span style={{ fontSize: 11, color: "#333" }}>Tour dates in. Show graphics out.</span>
        </div>
      </div>
    </div>
  );
}
