import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 256, height: 256 };
export const contentType = "image/png";

// Same Bebas fetch as opengraph-image.tsx. CLAUDE.md rule 16 — User-Agent spoof
// makes Google Fonts return .ttf instead of .woff2 (Satori cannot decode woff2).
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

export default async function Icon() {
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
          fontFamily,
        }}
      >
        <div style={{ display: "flex", fontSize: 130, lineHeight: 0.9, color: "#1A1A1A", letterSpacing: "0.02em" }}>HWY</div>
        <div style={{ display: "flex", fontSize: 160, lineHeight: 0.9, color: "#c5535b", letterSpacing: "0.02em" }}>61</div>
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
