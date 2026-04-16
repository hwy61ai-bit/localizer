import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import PrintDownloadButton from "./PrintDownloadButton";

export default async function VenuePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = supabaseAdmin();

  const { data: link } = await supabase
    .from("venue_links")
    .select("event_id, org_id, is_active, render_square_url, render_story_url, render_landscape_url, render_tiktok_url, render_yt_shorts_url")
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
    .select("name, band_name, band_tour_label, image_url, image_print_id, overlay_config, artist_id")
    .eq("id", event.tour_id)
    .single();

  if (!tour) notFound();

  const { data: artist } = await supabase
    .from("artists")
    .select("adv_stage_plot_url, adv_hospitality_url, adv_foh_url, adv_w9_url, adv_custom_materials, spotify_url")
    .eq("id", (tour as any).artist_id)
    .single();

  const t = tour as any;
  const bandName = t.band_name ?? t.band_tour_label ?? t.name ?? "Artist";
  const spotifyUrl: string | null = (artist as any)?.spotify_url ?? null;
  const spotifyEmbedUrl = spotifyUrl
    ? spotifyUrl.replace("open.spotify.com/", "open.spotify.com/embed/")
    : null;

  const a = artist as any;
  const customMaterials = (a?.adv_custom_materials as Array<{ id: string; label: string; url: string }> | null) || [];
  const advMaterials: { label: string; url: string | null }[] = [
    { label: "Stage Plot", url: a?.adv_stage_plot_url ?? null },
    { label: "Hospitality Rider", url: a?.adv_hospitality_url ?? null },
    { label: "FOH Requirements", url: a?.adv_foh_url ?? null },
    { label: "W-9", url: a?.adv_w9_url ?? null },
    ...customMaterials.filter((c) => c.url).map((c) => ({ label: c.label, url: c.url })),
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

  const filenameSlug = [
    bandName.replace(/[^a-zA-Z0-9_-]/g, "_"),
    venueName.replace(/[^a-zA-Z0-9_-]/g, "_"),
    (dateStr || "").replace(/[^a-zA-Z0-9_-]/g, "_"),
  ].filter(Boolean).join("+");

  const photoAssets = [
    { label: "Instagram Post / Facebook Post", dims: "1080 × 1080", aspect: "1/1", url: link.render_square_url },
    { label: "Instagram Story / Reels / Facebook Story", dims: "1080 × 1350", aspect: "4/5", url: link.render_story_url },
    { label: "Facebook Cover Image", dims: "820 × 312", aspect: "820/312", url: link.render_landscape_url },
  ];

  const overlayConfig = t.overlay_config as Record<string, any> | null;
  const hasPrintPoster = !!(t.image_print_id && overlayConfig?.print);

  return (
    <div style={{ minHeight: "100vh", color: "var(--hw-text)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 64px" }}>

        {/* Header */}
        <div style={{ padding: "24px 0 20px", borderBottom: "3px solid var(--hw-border-strong)", marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--hw-font-display)", fontSize: 28, letterSpacing: "4px" }}><span style={{ color: "var(--hw-crimson)" }}>HWY61</span><span style={{ color: "#111111" }}> LABS</span></span>
          <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, color: "var(--hw-text-muted)", letterSpacing: "4px", textTransform: "uppercase" }}>Official Asset Kit</span>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: 48, border: "3px solid var(--hw-border-strong)", padding: 28, background: "var(--hw-bg-surface)" }}>
          <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, color: "var(--hw-blue)", letterSpacing: "4px", textTransform: "uppercase", marginBottom: 8 }}>Show Assets</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 52, letterSpacing: "2px", lineHeight: 1, textTransform: "uppercase" }}>{bandName}</div>
            <a href={`/api/download-all?token=${token}`} download style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", color: "var(--hw-text)", fontFamily: "var(--hw-font-display)", fontSize: 14, letterSpacing: "3px", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0, textTransform: "uppercase", transition: "var(--hw-ease)" }}>↓ DOWNLOAD ALL</a>
          </div>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {formattedDate && (
              <div>
                <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, color: "var(--hw-text-muted)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "1.5px" }}>Date</div>
                <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 15, fontWeight: 400, color: "var(--hw-text-secondary)" }}>{formattedDate}</div>
              </div>
            )}
            {venueName && (
              <div>
                <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, color: "var(--hw-text-muted)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "1.5px" }}>Venue</div>
                <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 15, fontWeight: 400, color: "var(--hw-text-secondary)" }}>{venueName}</div>
              </div>
            )}
            {(city || state) && (
              <div>
                <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, color: "var(--hw-text-muted)", marginBottom: 3, textTransform: "uppercase", letterSpacing: "1.5px" }}>Location</div>
                <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 15, fontWeight: 400, color: "var(--hw-text-secondary)" }}>{[city, state].filter(Boolean).join(", ")}</div>
              </div>
            )}
          </div>
        </div>

        {/* Photos */}
        {photoAssets.some(a => a.url) && (
          <>
            <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, color: "var(--hw-blue)", letterSpacing: "4px", textTransform: "uppercase", marginBottom: 20 }}>Photos</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20, marginBottom: 48 }}>
          {photoAssets.map((asset) => (
            <div key={asset.label} style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {asset.url ? (
                  <img src={asset.url} alt={asset.label} style={{ width: "100%", display: "block" }} />
                ) : (
                  <div style={{ aspectRatio: asset.aspect, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--hw-font-mono)", color: "var(--hw-text-muted)", fontSize: 11, letterSpacing: "1px", textTransform: "uppercase" }}>
                    Not provided
                  </div>
                )}
              </div>
              <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "3px solid var(--hw-border-strong)", marginTop: "auto" }}>
                <div>
                  <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 13, fontWeight: 500, color: "var(--hw-text)", marginBottom: 2 }}>{asset.label}</div>
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "1px", color: "var(--hw-text-muted)" }}>{asset.dims}</div>
                </div>
                {asset.url && (
                  <a href={`/api/download?url=${encodeURIComponent(asset.url)}&filename=${encodeURIComponent(filenameSlug + "+" + asset.label.replace(/ /g,"_") + ".jpg")}&token=${token}`} download
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, border: "2px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", color: "var(--hw-text)", textDecoration: "none", fontFamily: "var(--hw-font-display)", fontSize: 16 }}>
                    ↓
                  </a>
                )}
              </div>
            </div>
          ))}
            </div>
          </>
        )}

        {/* Print Poster PDF */}
        {hasPrintPoster && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, color: "var(--hw-blue)", letterSpacing: "4px", textTransform: "uppercase", marginBottom: 20 }}>Print Poster (PDF)</div>
            <PrintDownloadButton eventId={event.id} venueName={venueName} />
          </div>
        )}

        {/* Video */}
        {((link as any).render_tiktok_url || (link as any).render_yt_shorts_url) && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, color: "var(--hw-blue)", letterSpacing: "4px", textTransform: "uppercase", marginBottom: 20 }}>Video</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
              {[
                { label: "TikTok, IG Reels, FB Stories, YouTube Shorts", dims: "1080 × 1920", url: (link as any).render_tiktok_url },
                { label: "Square", dims: "1080 × 1080", url: (link as any).render_yt_shorts_url },
              ].filter(v => !!v.url).map((video) => (
                <div key={video.label} style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    <video src={video.url} controls playsInline style={{ width: "100%", display: "block" }} />
                  </div>
                  <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "3px solid var(--hw-border-strong)", marginTop: "auto" }}>
                    <div>
                      <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 13, fontWeight: 500, color: "var(--hw-text)", marginBottom: 2 }}>{video.label}</div>
                      <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "1px", color: "var(--hw-text-muted)" }}>{video.dims}</div>
                    </div>
                    <a href={`/api/download?url=${encodeURIComponent(video.url)}&filename=${encodeURIComponent(filenameSlug + "+" + video.label.replace(/ /g,"_") + ".mp4")}&token=${token}`} download
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, border: "2px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", color: "var(--hw-text)", textDecoration: "none", fontFamily: "var(--hw-font-display)", fontSize: 16 }}>
                      ↓
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Advance Materials */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, color: "var(--hw-blue)", letterSpacing: "4px", textTransform: "uppercase", marginBottom: 20 }}>Advance Materials</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {advMaterials.map((mat) => (
              mat.url ? (
                <a key={mat.label} href={mat.url} target="_blank" rel="noopener noreferrer"
                  style={{ aspectRatio: "1 / 1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 16, background: "var(--hw-green-ghost)", border: "3px solid var(--hw-border-strong)", textDecoration: "none", textAlign: "center" }}>
                  <span style={{ fontFamily: "var(--hw-font-display)", fontSize: 24, color: "var(--hw-green)" }}>↓</span>
                  <span style={{ fontFamily: "var(--hw-font-display)", fontSize: 15, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-green)", lineHeight: 1.2 }}>{mat.label}</span>
                </a>
              ) : (
                <div key={mat.label}
                  style={{ aspectRatio: "1 / 1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", cursor: "not-allowed", textAlign: "center" }}>
                  <span style={{ fontFamily: "var(--hw-font-display)", fontSize: 24, opacity: 0.3, color: "var(--hw-text-muted)" }}>↓</span>
                  <span style={{ fontFamily: "var(--hw-font-display)", fontSize: 15, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text-muted)", lineHeight: 1.2 }}>{mat.label}</span>
                  <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 9, fontWeight: 400, fontStyle: "italic", letterSpacing: "1px", color: "var(--hw-text-muted)" }}>Not uploaded yet</span>
                </div>
              )
            ))}
          </div>
        </div>

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
          <span style={{ fontFamily: "var(--hw-font-display)", fontSize: 18, letterSpacing: "3px" }}><span style={{ color: "var(--hw-crimson)" }}>HWY61</span><span style={{ color: "#111111" }}> LABS</span></span>
          <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text-muted)" }}>POWERED BY HWY61 LABS</span>
        </div>
      </div>
    </div>
  );
}
