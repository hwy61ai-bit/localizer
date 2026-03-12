import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

const PHOTO_ASSETS = [
  { label: "IG Post", dims: "1080 x 1080", aspect: "1/1", tag: "ig_post" },
  { label: "IG Stories", dims: "1080 x 1920", aspect: "9/16", tag: "ig_story" },
  { label: "FB Event Cover", dims: "1920 x 1080", aspect: "16/9", tag: "fb_cover" },
  { label: "Full Tour Poster", dims: "1080 x 1920", aspect: "9/16", tag: "tour_poster" },
  { label: "Email Header", dims: "600 x 200", aspect: "3/1", tag: "email_header" },
];

export default async function VenuePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await supabaseServer();

  const { data: link, error: linkError } = await supabase
    .from("venue_links")
    .select("event_id, org_id, is_active")
    .eq("token", token)
    .maybeSingle();

  if (linkError || !link || !link.is_active) notFound();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, tour_id, date_iso, city, state, venue, venue_name, venue_city, venue_state")
    .eq("id", link!.event_id)
    .single();

  if (eventError || !event) notFound();

  const { data: tour, error: tourError } = await supabase
    .from("tours")
    .select("name, band_tour_label, spotify_url, artist_id, tour_poster_url")
    .eq("id", event!.tour_id)
    .single();

  if (tourError || !tour) notFound();

  const t = tour as any;
  const tourPosterUrl: string | null = t.tour_poster_url ?? null;
  const bandName = t.band_tour_label ?? t.name ?? "Artist";
  const spotifyUrl: string | null = t.spotify_url ?? null;
  const spotifyEmbedUrl = spotifyUrl
    ? spotifyUrl.replace("open.spotify.com/", "open.spotify.com/embed/")
    : null;

  const { data: artistData } = t.artist_id
    ? await supabase.from("artists").select("adv_stage_plot_url, adv_hospitality_url, adv_foh_url, adv_w9_url").eq("id", t.artist_id).single()
    : { data: null };
  const advSrc = artistData ?? t;
  const advMaterials: { label: string; url: string }[] = [
    { label: "Stage Plot", url: advSrc.adv_stage_plot_url },
    { label: "Hospitality Rider", url: advSrc.adv_hospitality_url },
    { label: "FOH Requirements", url: advSrc.adv_foh_url },
    { label: "W-9", url: advSrc.adv_w9_url },
  ].filter((m) => m.url && typeof m.url === "string" && m.url.length > 0) as { label: string; url: string }[];

  const venueName = event!.venue_name ?? event!.venue ?? "";
  const city = event!.venue_city ?? event!.city ?? "";
  const state = event!.venue_state ?? event!.state ?? "";
  const dateStr = event!.date_iso ?? "";

  let formattedDate = dateStr;
  if (dateStr) {
    try {
      const d = new Date(dateStr + "T12:00:00");
      formattedDate = d.toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
      });
    } catch {}
  }

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh" }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" />
      <div className="page-wrap">
        <div className="topbar">
          <span className="topbar-brand">LOCALIZER</span>
          <span className="topbar-badge">Official Asset Kit</span>
        </div>
        <div className="hero">
          <div className="hero-eyebrow">Show Assets</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginBottom: 28 }}>
            <div className="hero-band">{bandName}</div>
          </div>
          <hr style={{ border: "none", borderTop: "1px solid #ffffff", marginBottom: 28, marginTop: 0 }} />
          <div className="hero-meta">
            {formattedDate && (
              <div className="hero-meta-item">
                <span className="hero-meta-label">Date</span>
                <span className="hero-meta-value" style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 36, letterSpacing: "0.08em", color: "#f0ede8" }}>{formattedDate}</span>
              </div>
            )}
            {venueName && (
              <div className="hero-meta-item">
                <span className="hero-meta-label">Venue</span>
                <span className="hero-meta-value" style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 36, letterSpacing: "0.08em", color: "#f0ede8" }}>{venueName}</span>
              </div>
            )}
            {(city || state) && (
              <div className="hero-meta-item">
                <span className="hero-meta-label">Location</span>
                <span className="hero-meta-value" style={{ fontFamily: "Bebas Neue, sans-serif", fontSize: 36, letterSpacing: "0.08em", color: "#f0ede8" }}>{[city, state].filter(Boolean).join(", ")}</span>
              </div>
            )}
          </div>
        </div>
        <div className="section-header" style={{ marginBottom: 32 }}>
          <span className="section-title">PHOTOS</span>
        </div>
        <div className="photo-grid">
          {PHOTO_ASSETS.map((asset) => {
            const paddingMap: Record<string, string> = {
              "1/1": "100%", "9/16": "177.78%", "16/9": "56.25%",
              "11/17": "154.55%", "3/1": "33.33%",
            };
            const pt = paddingMap[asset.aspect] ?? "100%";
            return (
              <div className="asset-card" key={asset.tag}>
                <div className="asset-preview">
                  <div className="asset-preview-inner" style={{ paddingTop: pt }}>
                    {asset.tag === "tour_poster" && tourPosterUrl ? (
                      <img src={tourPosterUrl} alt="Full Tour Poster" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <>
                        <div className="asset-placeholder">
                          <svg className="asset-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          <span className="asset-placeholder-text">Rendering soon</span>
                        </div>
                        <span className="asset-coming-soon">Not ready</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="asset-info">
                  <div className="asset-label-group">
                    <span className="asset-label">{asset.label}</span>
                    <span className="asset-dims">{asset.dims}</span>
                  </div>
                  {asset.tag === "tour_poster" && tourPosterUrl ? (
                    <a href={tourPosterUrl} target="_blank" rel="noopener noreferrer" style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #2a2a2a", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, textDecoration: "none", color: "#c8a96e", fontSize: 16 }}>DL</a>
                  ) : (
                    <div className="asset-dl-btn">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="video-section">
          <div className="section-header">
            <span className="section-title">VIDEO</span>
          </div>
          <div className="video-coming-soon-card">
            <div className="video-coming-soon-icon">play</div>
            <div className="video-coming-soon-title">Video Assets Coming Soon</div>
            <div className="video-coming-soon-sub">Optimized video files for every platform will appear here once rendered.</div>
            <div className="video-format-list">
              {["YouTube", "Instagram Reels", "TikTok", "Facebook", "Twitter / X"].map((f) => (
                <span className="video-format-tag" key={f}>{f}</span>
              ))}
            </div>
          </div>
        </div>
        {spotifyEmbedUrl && (
          <div style={{ marginBottom: 48 }}>
            <div className="section-header">
              <span className="section-title">LISTEN</span>
            </div>
            <iframe
              src={spotifyEmbedUrl}
              width="100%"
              height="352"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style={{ borderRadius: 16 }}
            />
          </div>
        )}
        {advMaterials.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <div className="section-header">
              <span className="section-title">ADVANCE MATERIALS</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {advMaterials.map((mat) => (
                <a
                  key={mat.label}
                  href={mat.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "16px 20px",
                    background: "#111",
                    border: "1px solid #1e1e1e",
                    borderRadius: 12,
                    textDecoration: "none",
                    color: "#d4d0c8",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  
                  <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: "#d4d0c8" }}>{mat.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "#c8a96e", textTransform: "uppercase", flexShrink: 0 }}>Download</span>
                </a>
              ))}
            </div>
          </div>
        )}
        <div className="page-footer">
          <span className="footer-brand">LOCALIZER</span>
          <span className="footer-note">Tour dates in. Show graphics out.</span>
        </div>
      </div>
    </div>
  );
}
