// Server component — mirrors SocialIcons.tsx structure.
// Spotify glyph path from simple-icons (CC0) — https://simpleicons.org
// To pull brand updates: `npm update simple-icons`.
import { siSpotify } from "simple-icons";

type PressPlaylistItem = { id: string; label: string; url: string };

type Props = {
  label: string;
  items: PressPlaylistItem[] | null | undefined;
};

// URL guard: accept only absolute http(s) URLs. Anything else (bare hosts,
// javascript:, mailto:, relative paths) is silently skipped — better to drop
// an item than emit a broken or unsafe link on a public viewer page.
// Mirrors SocialIcons.tsx#isHttpUrl.
function isHttpUrl(s: string | null | undefined): s is string {
  if (!s) return false;
  return /^https?:\/\//i.test(s.trim());
}

function isSpotifyUrl(url: string): boolean {
  return /^https?:\/\/open\.spotify\.com\//i.test(url);
}

function toSpotifyEmbed(url: string): string {
  return url.replace("open.spotify.com/", "open.spotify.com/embed/");
}

export function PressPlaylists(props: Props) {
  const valid = (props.items ?? []).filter((it) => isHttpUrl(it.url));
  if (valid.length === 0) return null;

  return (
    <div style={{ marginBottom: 48 }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .press-playlist-pill { transition: color 0.15s ease, border-color 0.15s ease; }
        .press-playlist-pill:hover { color: var(--hw-crimson); border-color: var(--hw-crimson); }
      ` }} />
      <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 16, fontWeight: 400, color: "var(--hw-blue)", letterSpacing: "4px", textTransform: "uppercase", marginBottom: 20 }}>
        {props.label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {valid.map((item) =>
          isSpotifyUrl(item.url) ? (
            <div key={item.id}>
              {item.label && (
                <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, fontWeight: 700, letterSpacing: "1.5px", color: "var(--hw-text-muted)", textTransform: "uppercase", marginBottom: 8 }}>
                  {item.label}
                </div>
              )}
              <iframe
                src={toSpotifyEmbed(item.url)}
                width="100%"
                height="352"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                style={{ border: "3px solid var(--hw-border-strong)", display: "block" }}
              />
            </div>
          ) : (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="press-playlist-pill"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 20px",
                background: "var(--hw-bg-surface)",
                border: "3px solid var(--hw-border-strong)",
                color: "var(--hw-text)",
                textDecoration: "none",
                fontFamily: "var(--hw-font-display)",
                fontSize: 18,
                letterSpacing: "2px",
                textTransform: "uppercase",
              }}
            >
              <span style={{ display: "inline-flex", flexShrink: 0 }}>
                {/^https?:\/\/(open\.|www\.)?spotify\.com\//i.test(item.url) ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d={siSpotify.path} />
                  </svg>
                ) : (
                  <span style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, lineHeight: 1 }} aria-hidden="true">↗</span>
                )}
              </span>
              <span>{item.label || "Link"}</span>
            </a>
          )
        )}
      </div>
    </div>
  );
}
