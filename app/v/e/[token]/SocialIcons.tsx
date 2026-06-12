// Glyph paths from simple-icons (CC0) — https://simpleicons.org
// To pull brand updates: `npm update simple-icons`.
import {
  siFacebook,
  siInstagram,
  siTiktok,
  siX,
  siThreads,
  siYoutube,
} from "simple-icons";

type Props = {
  label: string;
  facebook?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  x?: string | null;
  threads?: string | null;
  youtube?: string | null;
};

// URL guard: accept only absolute http(s) URLs. Anything else (bare hosts,
// javascript:, mailto:, relative paths) is silently skipped — better to drop
// an icon than emit a broken or unsafe link on a public viewer page.
function isHttpUrl(s: string | null | undefined): s is string {
  if (!s) return false;
  return /^https?:\/\//i.test(s.trim());
}

const ICON_SIZE = 88;

export function ArtistSocialLinks(props: Props) {
  const items = [
    { url: props.facebook,  label: "Facebook",  path: siFacebook.path  },
    { url: props.instagram, label: "Instagram", path: siInstagram.path },
    { url: props.tiktok,    label: "TikTok",    path: siTiktok.path    },
    { url: props.x,         label: "X",         path: siX.path         },
    { url: props.threads,   label: "Threads",   path: siThreads.path   },
    { url: props.youtube,   label: "YouTube",   path: siYoutube.path   },
  ].filter((item) => isHttpUrl(item.url));

  if (items.length === 0) return null;

  return (
    <div style={{ marginBottom: 48 }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .artist-social-icon { transition: color 0.15s ease; }
        .artist-social-icon:hover { color: var(--hw-crimson); }
      ` }} />
      <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 400, color: "var(--hw-blue)", letterSpacing: "4px", textTransform: "uppercase", marginBottom: 20 }}>
        {props.label}
      </div>
      <div style={{ display: "flex", gap: 32, alignItems: "center", justifyContent: "center" }}>
        {items.map(({ url, label, path }) => (
          <a
            key={label}
            href={url!}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="artist-social-icon"
            style={{ display: "inline-flex", color: "var(--hw-text)", textDecoration: "none" }}
          >
            <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d={path} />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}
