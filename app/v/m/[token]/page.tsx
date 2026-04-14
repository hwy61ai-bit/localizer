import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabaseServer";
import PrintDownloadButton from "@/app/v/e/[token]/PrintDownloadButton";

export default async function MarketingPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ eventId?: string }>;
}) {
  const { token } = await params;
  const { eventId } = await searchParams;
  const supabase = await supabaseServer();

  // 1. Look up marketing token (tour-scoped)
  const { data: marketingToken } = await supabase
    .from("marketing_tokens")
    .select("tour_id, org_id, expires_at, revoked_at")
    .eq("token", token)
    .maybeSingle();

  if (!marketingToken) notFound();
  if (marketingToken.revoked_at) notFound();
  if (marketingToken.expires_at && new Date(marketingToken.expires_at) <= new Date()) notFound();

  // 2. Validate eventId query param
  if (!eventId) notFound();

  // 3. Load event and verify tour_id match
  const { data: event } = await supabase
    .from("events")
    .select("id, tour_id, date_iso, city, state, venue, venue_name, venue_city, venue_state")
    .eq("id", eventId)
    .single();

  if (!event) notFound();
  if (event.tour_id !== marketingToken.tour_id) notFound();

  // 4. Fetch venue_links by event_id for render URLs
  const { data: link } = await supabase
    .from("venue_links")
    .select("render_square_url, render_story_url, render_landscape_url, render_tiktok_url, render_yt_shorts_url")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!link) notFound();

  const { data: tour } = await supabase
    .from("tours")
    .select("name, band_name, band_tour_label, image_url, image_print_id, overlay_config, artist_id")
    .eq("id", event.tour_id)
    .single();

  if (!tour) notFound();

  // Only select spotify_url — no advance materials
  const { data: artist } = await supabase
    .from("artists")
    .select("spotify_url")
    .eq("id", (tour as any).artist_id)
    .single();

  const t = tour as any;
  const bandName = t.band_name ?? t.band_tour_label ?? t.name ?? "Artist";
  const spotifyUrl: string | null = (artist as any)?.spotify_url ?? null;
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

  // 6. Update last_used_at on the marketing token
  await supabase
    .from("marketing_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token", token)
    .select()
    .maybeSingle();

  return (
    <div style={{ background: "var(--hw-bg)", minHeight: "100vh", color: "var(--hw-text)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px 64px" }}>

        {/* Header */}
        <div style={{ padding: "24px 0 20px", borderBottom: "3px solid var(--hw-border-strong)", marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "var(--hw-font-display)", fontSize: 28, letterSpacing: "4px", color: "var(--hw-crimson)" }}>HWY61</span>
          <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, color: "var(--hw-text-muted)", letterSpacing: "4px", textTransform: "uppercase" }}>Official Asset Kit</span>
        </div>

        {/* Hero */}
        <div style={{ marginBottom: 48, border: "3px solid var(--hw-border-strong)", padding: 28, background: "var(--hw-bg-surface)" }}>
          <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, color: "var(--hw-blue)", letterSpacing: "4px", textTransform: "uppercase", marginBottom: 8 }}>Show Assets</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 52, letterSpacing: "2px", lineHeight: 1, textTransform: "uppercase" }}>{bandName}</div>
            <a href={`/api/download-all/marketing?token=${token}&eventId=${event.id}`} download style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", color: "var(--hw-text)", fontFamily: "var(--hw-font-display)", fontSize: 14, letterSpacing: "3px", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0, textTransform: "uppercase", transition: "var(--hw-ease)" }}>↓ DOWNLOAD ALL</a>
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
                    Rendering soon
                  </div>
                )}
              </div>
              <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "3px solid var(--hw-border-strong)", marginTop: "auto" }}>
                <div>
                  <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 13, fontWeight: 500, color: "var(--hw-text)", marginBottom: 2 }}>{asset.label}</div>
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "1px", color: "var(--hw-text-muted)" }}>{asset.dims}</div>
                </div>
                {asset.url && (
                  <a href={`/api/download/marketing?url=${encodeURIComponent(asset.url)}&filename=${encodeURIComponent(filenameSlug + "+" + asset.label.replace(/ /g,"_") + ".jpg")}&token=${token}&eventId=${event.id}`} download
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
        {(link.render_tiktok_url || link.render_yt_shorts_url) && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, color: "var(--hw-blue)", letterSpacing: "4px", textTransform: "uppercase", marginBottom: 20 }}>Video</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
              {[
                { label: "TikTok, IG Reels, FB Stories, YouTube Shorts", dims: "1080 × 1920", url: link.render_tiktok_url },
                { label: "Square", dims: "1080 × 1080", url: link.render_yt_shorts_url },
              ].filter(v => !!v.url).map((video) => (
                <div key={video.label} style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    <video src={video.url!} controls playsInline style={{ width: "100%", display: "block" }} />
                  </div>
                  <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "3px solid var(--hw-border-strong)", marginTop: "auto" }}>
                    <div>
                      <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 13, fontWeight: 500, color: "var(--hw-text)", marginBottom: 2 }}>{video.label}</div>
                      <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "1px", color: "var(--hw-text-muted)" }}>{video.dims}</div>
                    </div>
                    <a href={`/api/download/marketing?url=${encodeURIComponent(video.url!)}&filename=${encodeURIComponent(filenameSlug + "+" + video.label.replace(/ /g,"_") + ".mp4")}&token=${token}&eventId=${event.id}`} download
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, border: "2px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", color: "var(--hw-text)", textDecoration: "none", fontFamily: "var(--hw-font-display)", fontSize: 16 }}>
                      ↓
                    </a>
                  </div>
                </div>
              ))}
            </div>
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
