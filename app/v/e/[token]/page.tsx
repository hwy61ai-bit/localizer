import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

const PHOTO_ASSETS = [
  { label: "IG Post", dims: "1080 × 1080", aspect: "1/1", tag: "ig_post" },
  { label: "IG Stories", dims: "1080 × 1920", aspect: "9/16", tag: "ig_story" },
  { label: "FB Event Cover", dims: "1920 × 1080", aspect: "16/9", tag: "fb_cover" },
  { label: "Poster", dims: '11" × 17"', aspect: "11/17", tag: "poster" },
  { label: "Twitter / X", dims: "1600 × 900", aspect: "16/9", tag: "twitter" },
  { label: "Email Header", dims: "600 × 200", aspect: "3/1", tag: "email_header" },
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

  if (linkError || !link || !link.is_active) {
    notFound();
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, tour_id, date_iso, city, state, venue, venue_name, venue_city, venue_state")
    .eq("id", link.event_id)
    .single();

  if (eventError || !event) {
    notFound();
  }

  const { data: tour, error: tourError } = await supabase
    .from("tours")
    .select("name, band_tour_label")
    .eq("id", event.tour_id)
    .single();

  if (tourError || !tour) {
    notFound();
  }

  const bandName = tour.band_tour_label ?? tour.name ?? "Artist";
  const venueName = event.venue_name ?? event.venue ?? "";
  const city = event.venue_city ?? event.city ?? "";
  const state = event.venue_state ?? event.state ?? "";
  const dateStr = event.date_iso ?? "";

  let formattedDate = dateStr;
  if (dateStr) {
    try {
      const d = new Date(dateStr + "T12:00:00");
      formattedDate = d.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {}
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; color: #f0ede8; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
        .page-wrap { max-width: 1080px; margin: 0 auto; padding: 0 24px 80px; }
        .topbar { border-bottom: 1px solid #222; padding: 20px 0; display: flex; align-items: center; justify-content: space-between; margin-bottom: 64px; }
        .topbar-brand { font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 0.18em; color: #666; }
        .topbar-badge { font-size: 11px; font-weight: 600; letter-spacing: 0.12em; color: #555; text-transform: uppercase; }
        .hero { margin-bottom: 72px; }
        .hero-eyebrow { font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: #c8a96e; margin-bottom: 16px; }
        .hero-band { font-family: 'Bebas Neue', sans-serif; font-size: clamp(64px, 10vw, 128px); line-height: 0.9; letter-spacing: -0.01em; color: #f0ede8; margin-bottom: 28px; }
        .hero-meta { display: flex; flex-wrap: wrap; gap: 24px; }
        .hero-meta-item { display: flex; flex-direction: column; gap: 4px; }
        .hero-meta-label { font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #555; }
        .hero-meta-value { font-size: 15px; font-weight: 400; color: #c8c4bc; }
        .section-header { display: flex; align-items: baseline; gap: 16px; margin-bottom: 32px; padding-bottom: 14px; border-bottom: 1px solid #1e1e1e; }
        .section-title { font-family: 'Bebas Neue', sans-serif; font-size: 36px; letter-spacing: 0.08em; color: #f0ede8; }
        .section-count { font-size: 12px; color: #444; font-weight: 500; }
        .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-bottom: 72px; }
        .asset-card { background: #111; border: 1px solid #1e1e1e; border-radius: 12px; overflow: hidden; transition: border-color 0.2s, transform 0.2s; cursor: pointer; }
        .asset-card:hover { border-color: #c8a96e; transform: translateY(-2px); }
        .asset-preview { background: #161616; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
        .asset-preview-inner { width: 100%; position: relative; }
        .asset-placeholder { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }
        .asset-placeholder-icon { width: 36px; height: 36px; opacity: 0.15; }
        .asset-placeholder-text { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #444; font-weight: 600; }
        .asset-coming-soon { position: absolute; top: 12px; right: 12px; background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 20px; padding: 4px 10px; font-size: 9px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #444; }
        .asset-info { padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .asset-label-group { display: flex; flex-direction: column; gap: 2px; }
        .asset-label { font-size: 13px; font-weight: 600; color: #d4d0c8; }
        .asset-dims { font-size: 11px; color: #444; font-weight: 400; }
        .asset-dl-btn { width: 32px; height: 32px; border-radius: 50%; border: 1px solid #2a2a2a; background: transparent; display: flex; align-items: center; justify-content: center; cursor: not-allowed; opacity: 0.35; flex-shrink: 0; }
        .video-section { margin-bottom: 40px; }
        .video-coming-soon-card { background: #111; border: 1px dashed #222; border-radius: 16px; padding: 48px 32px; text-align: center; }
        .video-coming-soon-icon { font-size: 32px; margin-bottom: 16px; opacity: 0.4; }
        .video-coming-soon-title { font-family: 'Bebas Neue', sans-serif; font-size: 24px; letter-spacing: 0.1em; color: #333; margin-bottom: 8px; }
        .video-coming-soon-sub { font-size: 13px; color: #333; font-weight: 400; max-width: 360px; margin: 0 auto; line-height: 1.6; }
        .video-format-list { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 20px; }
        .video-format-tag { padding: 5px 12px; border: 1px solid #1e1e1e; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; color: #333; text-transform: uppercase; }
        .page-footer { border-top: 1px solid #161616; padding-top: 24px; display: flex; align-items: center; justify-content: space-between; }
        .footer-brand { font-family: 'Bebas Neue', sans-serif; font-size: 14px; letter-spacing: 0.2em; color: #2a2a2a; }
        .footer-note { font-size: 11px; color: #2a2a2a; font-weight: 400; }
      `}</style>

      <div className="page-wrap">
        <div className="topbar">
          <span className="topbar-brand">LOCALIZER</span>
          <span className="topbar-badge">Official Asset Kit</span>
        </div>

        <div className="hero">
          <div className="hero-eyebrow">Show Assets</div>
          <div className="hero-band">{bandName}</div>
          <div className="hero-meta">
            {formattedDate && (
              <div className="hero-meta-item">
                <span className="hero-meta-label">Date</span>
                <span className="hero-meta-value">{formattedDate}</span>
              </div>
            )}
            {venueName && (
              <div className="hero-meta-item">
                <span className="hero-meta-label">Venue</span>
                <span className="hero-meta-value">{venueName}</span>
              </div>
            )}
            {(city || state) && (
              <div className="hero-meta-item">
                <span className="hero-meta-label">Location</span>
                <span className="hero-meta-value">{[city, state].filter(Boolean).join(", ")}</span>
              </div>
            )}
          </div>
        </div>

        <div className="section-header">
          <span className="section-title">ASSETS</span>
          <span className="section-count">{PHOTO_ASSETS.length} formats</span>
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
                    <div className="asset-placeholder">
                      <svg className="asset-placeholder-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span className="asset-placeholder-text">Rendering soon</span>
                    </div>
                    <span className="asset-coming-soon">Not ready</span>
                  </div>
                </div>
                <div className="asset-info">
                  <div className="asset-label-group">
                    <span className="asset-label">{asset.label}</span>
                    <span className="asset-dims">{asset.dims}</span>
                  </div>
                  <div className="asset-dl-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </div>
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
            <div className="video-coming-soon-icon">▶</div>
            <div className="video-coming-soon-title">Video Assets Coming Soon</div>
            <div className="video-coming-soon-sub">Optimized video files for every platform will appear here once rendered.</div>
            <div className="video-format-list">
              {["YouTube", "Instagram Reels", "TikTok", "Facebook", "Twitter / X"].map((f) => (
                <span className="video-format-tag" key={f}>{f}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="page-footer">
          <span className="footer-brand">LOCALIZER</span>
          <span className="footer-note">Tour dates in. Show graphics out.</span>
        </div>
      </div>
    </>
  );
}