import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "HWY61 Labs / Localizer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Google Fonts serves .ttf only when the User-Agent looks ancient/bare.
// Same trick as PDF font loading (CLAUDE.md rule 16). Satori needs ttf or woff,
// not woff2 — the regex below only matches .ttf URLs to be safe.
async function loadBebas(): Promise<ArrayBuffer | null> {
  try {
    const cssRes = await fetch(
      "https://fonts.googleapis.com/css2?family=Bebas+Neue",
      { headers: { "User-Agent": "Mozilla/5.0" } }
    );
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    const match = css.match(/url\(([^)]+\.ttf)\)/);
    const fontUrl = match?.[1];
    if (!fontUrl) return null;
    const fontRes = await fetch(fontUrl);
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function Image() {
  const bebas = await loadBebas();
  const fontFamily = bebas ? "Bebas Neue" : "system-ui, -apple-system, sans-serif";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F5F0E8",
          backgroundImage:
            "radial-gradient(circle, rgba(26,26,26,0.12) 1.4px, transparent 1.6px)",
          backgroundSize: "16px 16px",
          fontFamily,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: "12px",
            color: "#6B6661",
            textTransform: "uppercase",
            marginBottom: 36,
          }}
        >
          Official Asset Kit
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 168,
            letterSpacing: "0.02em",
            lineHeight: 0.9,
            textTransform: "uppercase",
          }}
        >
          <span style={{ color: "#c5535b" }}>HWY61</span>
          <span style={{ color: "#1A1A1A" }}>&nbsp;LABS</span>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 220,
            letterSpacing: "0.04em",
            lineHeight: 0.9,
            color: "#c5535b",
            textTransform: "uppercase",
            marginTop: 16,
          }}
        >
          LOCALIZER
        </div>
      </div>
    ),
    {
      ...size,
      fonts: bebas
        ? [{ name: "Bebas Neue", data: bebas, weight: 400, style: "normal" }]
        : undefined,
    }
  );
}
