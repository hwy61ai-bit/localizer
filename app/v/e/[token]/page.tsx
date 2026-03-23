import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";

export default async function VenuePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await supabaseServer();

  const { data: link } = await supabase
    .from("venue_links")
    .select("event_id, org_id, is_active, render_square_url, render_story_url, render_landscape_url, render_poster_url, render_tiktok_url, render_yt_shorts_url")
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
    .select("name, band_name, band_tour_label, image_url, artist_id")
    .eq("id", event.tour_id)
    .single();

  if (!tour) notFound();

  const { data: artist } = await supabase
    .from("artists")
    .select("adv_stage_plot_url, adv_hospitality_url, adv_foh_url, adv_w9_url, spotify_url")
    .eq("id", (tour as any).artist_id)
    .single();

  const t = tour as any;
  const bandName = t.band_name ?? t.band_tour_label ?? t.name ?? "Artist";
  const spotifyUrl: string | null = (artist as any)?.spotify_url ?? null;
  const spotifyEmbedUrl = spotifyUrl
    ? spotifyUrl.replace("open.spotify.com/", "open.spotify.com/embed/")
    : null;

  const a = artist as any;
  const advMaterials: { label: string; url: string | null }[] = [
    { label: "Stage Plot", url: a?.adv_stage_plot_url ?? null },
    { label: "Hospitality Rider", url: a?.adv_hospitality_url ?? null },
    { label: "FOH Requirements", url: a?.adv_foh_url ?? null },
    { label: "W-9", url: a?.adv_w9_url ?? null },
  ];

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

  const photoAssets = [
    { label: "Instagram Post / Facebook Post", dims: "1080 × 1080", aspect: "1/1", url: link.render_square_url },
    { label: "Instagram Story / Reels / Facebook Story", dims: "1080 × 1350", aspect: "4/5", url: link.render_story_url },
    { label: "Facebook Cover Image", dims: "820 × 312", aspect: "820/312", url: link.render_landscape_url },
  ];

  const posterUrl: string | null = link.render_poster_url ?? (t.image_url ? `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${t.image_url}` : null);

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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, letterSpacing: 2, lineHeight: 1 }}>{bandName}</div>
            <a href={`/api/download-all?token=${token}`} download style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 8, background: "#fff", color: "#000", fontWeight: 900, fontSize: 12, letterSpacing: "0.08em", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0 }}>↓ DOWNLOAD ALL ASSETS</a>
          </div>
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

        {/* Photos */}
        {photoAssets.some(a => a.url) && (
          <>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>Photos</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20, marginBottom: 48 }}>
          {photoAssets.map((asset) => (
            <div key={asset.label} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ background: "#1a1a1a" }}>
                {asset.url ? (
                  <img src={asset.url} alt={asset.label} style={{ width: "100%", display: "block" }} />
                ) : (
                  <div style={{ aspectRatio: asset.aspect, display: "flex", alignItems: "center", justifyContent: "center", color: "#333", fontSize: 13 }}>
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
                  <a href={`/api/download?url=${encodeURIComponent(asset.url)}&filename=${encodeURIComponent(asset.label.replace(/ /g,"_") + ".jpg")}`} download
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, background: "#1e1e1e", color: "#fff", textDecoration: "none", fontSize: 16 }}>
                    ↓
                  </a>
                )}
              </div>
            </div>
          ))}
            </div>
          </>
        )}

        {/* Tour Poster */}
        {posterUrl && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>Local Poster For Print</div>
            <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, overflow: "hidden", maxWidth: 400 }}>
              <img src={posterUrl} alt="Tour Poster" style={{ width: "100%", display: "block" }} />
              <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Local Poster For Print</div>
                  <div style={{ fontSize: 11, color: "#555" }}>Print quality</div>
                </div>
                <a href={`/api/download?url=${encodeURIComponent(posterUrl)}&filename=tour_poster.jpg`} download
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, background: "#1e1e1e", color: "#fff", textDecoration: "none", fontSize: 16 }}>
                  ↓
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Video */}
        {((link as any).render_tiktok_url || (link as any).render_yt_shorts_url) && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>Video</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
              {[
                { label: "TikTok / Reels", dims: "1080 × 1920", url: (link as any).render_tiktok_url },
                { label: "YouTube Shorts", dims: "1080 × 1920", url: (link as any).render_yt_shorts_url },
              ].filter(v => !!v.url).map((video) => (
                <div key={video.label} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ background: "#1a1a1a" }}>
                    <video src={video.url} controls playsInline style={{ width: "100%", display: "block" }} />
                  </div>
                  <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>{video.label}</div>
                      <div style={{ fontSize: 11, color: "#555" }}>{video.dims}</div>
                    </div>
                    <a href={`/api/download?url=${encodeURIComponent(video.url)}&filename=${encodeURIComponent(video.label.replace(/ /g,"_") + ".mp4")}`} download
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 8, background: "#1e1e1e", color: "#fff", textDecoration: "none", fontSize: 16 }}>
                      ↓
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advance Materials - Always show */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#555", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>Advance Materials</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {advMaterials.map((mat) => (
              mat.url ? (
                <a key={mat.label} href={mat.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 24px", background: "#0d2b1a", border: "1px solid #1a4d2e", borderRadius: 12, textDecoration: "none", color: "#4ade80", fontWeight: 700, fontSize: 15 }}>
                  <span style={{ fontSize: 20 }}>↓</span>
                  {mat.label}
                </a>
              ) : (
                <div key={mat.label}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 24px", background: "#111", border: "1px solid #1e1e1e", borderRadius: 12, color: "#555", fontWeight: 700, fontSize: 15, cursor: "not-allowed" }}>
                  <span style={{ fontSize: 20, opacity: 0.3 }}>↓</span>
                  <div>
                    <div>{mat.label}</div>
                    <div style={{ fontSize: 11, fontWeight: 400, fontStyle: "italic", marginTop: 2 }}>Not uploaded yet</div>
                  </div>
                </div>
              )
            ))}
          </div>
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
          <span style={{ fontSize: 11, color: "#333" }}>Tour dates in. Tour Assets out.</span>
        </div>
      </div>
    </div>
  );
}
