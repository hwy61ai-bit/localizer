import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "HWY61 Labs / Localizer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
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
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontWeight: 900,
          letterSpacing: "-0.02em",
        }}
      >
        <div style={{ display: "flex", fontSize: 192, lineHeight: 0.9, color: "#1A1A1A" }}>HWY</div>
        <div style={{ display: "flex", fontSize: 248, lineHeight: 0.9, color: "#c5535b" }}>61</div>
      </div>
    ),
    { ...size }
  );
}
