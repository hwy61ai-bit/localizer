import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 256, height: 256 };
export const contentType = "image/png";

export default async function Icon() {
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
        <div style={{ display: "flex", fontSize: 92, lineHeight: 0.9, color: "#1A1A1A" }}>HWY</div>
        <div style={{ display: "flex", fontSize: 120, lineHeight: 0.9, color: "#c5535b" }}>61</div>
      </div>
    ),
    { ...size }
  );
}
