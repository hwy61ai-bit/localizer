"use client";

import { useState } from "react";
import Link from "next/link";

const FONTS = [
  { label: "Oswald", value: "Oswald" },
  { label: "Anton", value: "Anton" },
  { label: "Barlow Condensed", value: "Barlow Condensed" },
  { label: "Teko", value: "Teko" },
  { label: "Russo One", value: "Russo One" },
  { label: "Rajdhani", value: "Rajdhani" },
  { label: "Saira Condensed", value: "Saira Condensed" },
];

type OverlayConfig = {
  fontFamily: string;
  bandColor: string;
  dateColor: string;
  venueColor: string;
  cityColor: string;
  bandSize: number;
  dateSize: number;
  venueSize: number;
  citySize: number;
  yOffset: number;
  showGradient: boolean;
};

const DEFAULT_CONFIG: OverlayConfig = {
  fontFamily: "Oswald",
  bandColor: "ffffff",
  dateColor: "cccccc",
  venueColor: "ffffff",
  cityColor: "cccccc",
  bandSize: 80,
  dateSize: 40,
  venueSize: 52,
  citySize: 40,
  yOffset: 120,
  showGradient: false,
};

type Tour = {
  id: string;
  name: string;
  band_tour_label: string | null;
  image_url: string | null;
  overlay_config: OverlayConfig | null;
};

function buildPreviewUrl(
  publicId: string,
  cloudName: string,
  cfg: OverlayConfig,
  bandName: string
): string {
  const font = cfg.fontFamily.replace(/ /g, "_");
  const maxW = 918;
  const sanitize = (t: string) => t.replace(/,/g, " ").replace(/[/?&#%]/g, "").trim();

  const layers = [
    `c_fill,g_center,h_1920,w_1080`,
    ...(cfg.showGradient ? [`e_gradient_fade:symmetric_pad,y_-0.5`] : []),
    `c_fit,co_rgb:${cfg.bandColor},fl_layer_apply,g_south,l_text:${font}_${cfg.bandSize}_bold:${encodeURIComponent(sanitize(bandName))},w_${maxW},y_${cfg.yOffset + cfg.dateSize + cfg.venueSize + cfg.citySize + 24}`,
    `c_fit,co_rgb:${cfg.dateColor},fl_layer_apply,g_south,l_text:${font}_${cfg.dateSize}:Saturday%20April%2025%202026,w_${maxW},y_${cfg.yOffset + cfg.venueSize + cfg.citySize + 12}`,
    `c_fit,co_rgb:${cfg.venueColor},fl_layer_apply,g_south,l_text:${font}_${cfg.venueSize}_bold:White%20Water%20Tavern,w_${maxW},y_${cfg.yOffset + cfg.citySize + 6}`,
    `c_fit,co_rgb:${cfg.cityColor},fl_layer_apply,g_south,l_text:${font}_${cfg.citySize}:Little%20Rock%20AR,w_${maxW},y_${cfg.yOffset}`,
  ];

  return `https://res.cloudinary.com/${cloudName}/image/upload/${layers.join("/")}/${publicId}`;
}

export default function TemplateEditor({ tour, tourId }: { tour: Tour; tourId: string }) {
  const [cfg, setCfg] = useState<OverlayConfig>(tour.overlay_config ?? DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
  const bandName = tour.band_tour_label ?? tour.name ?? "Artist";
  const hasImage = !!tour.image_url;
  const previewUrl = hasImage ? buildPreviewUrl(tour.image_url!, cloudName, cfg, bandName) : null;

  function update(key: keyof OverlayConfig, value: string | number | boolean) {
    setCfg((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await fetch(`/api/tours/${tourId}/advance`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overlay_config: cfg }),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div style={{ background: "#EEEEEE", minHeight: "100vh", padding: 32 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid #ddd" }}>
          <Link href={`/dashboard/tours/${tourId}`} style={{ fontSize: 13, fontWeight: 700, color: "#888", textDecoration: "none", display: "inline-block", marginBottom: 8 }}>← Back to Tour</Link>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1 className="brand-title" style={{ margin: 0 }}>LOCALIZER</h1>
            <button
              onClick={save}
              disabled={saving}
              style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #111", background: saved ? "#1a7f4b" : "#111", color: "#fff", fontWeight: 900, fontSize: 13, cursor: "pointer" }}
            >{saving ? "Saving..." : saved ? "Saved ✓" : "Save Template"}</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>

          {/* Preview */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ddd", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee", fontSize: 12, fontWeight: 900, color: "#555" }}>PREVIEW — Poster Format</div>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Template preview"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            ) : (
              <div style={{ padding: 48, textAlign: "center", color: "#999", fontSize: 14 }}>
                Upload a tour poster image first to preview the template.
                <br /><br />
                <Link href={`/dashboard/tours/${tourId}/assets`} style={{ color: "#111", fontWeight: 700 }}>→ Import Assets</Link>
              </div>
            )}
          </div>

          {/* Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Font */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ddd", padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#555", marginBottom: 10 }}>FONT</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {FONTS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => update("fontFamily", f.value)}
                    style={{
                      padding: "10px 14px", borderRadius: 8, border: "1px solid",
                      borderColor: cfg.fontFamily === f.value ? "#111" : "#ddd",
                      background: cfg.fontFamily === f.value ? "#111" : "#fff",
                      color: cfg.fontFamily === f.value ? "#fff" : "#111",
                      fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left",
                    }}
                  >{f.label}</button>
                ))}
              </div>
            </div>

            {/* Text sizes */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ddd", padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#555", marginBottom: 10 }}>TEXT SIZES</div>
              {[
                { label: "Band Name", key: "bandSize" },
                { label: "Date", key: "dateSize" },
                { label: "Venue", key: "venueSize" },
                { label: "City / State", key: "citySize" },
              ].map(({ label, key }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <button onClick={() => update(key as keyof OverlayConfig, Math.max(20, (cfg[key as keyof OverlayConfig] as number) - 4))} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: 900 }}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 700, width: 30, textAlign: "center" }}>{cfg[key as keyof OverlayConfig]}</span>
                    <button onClick={() => update(key as keyof OverlayConfig, Math.min(200, (cfg[key as keyof OverlayConfig] as number) + 4))} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: 900 }}>+</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Y Offset */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ddd", padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#555", marginBottom: 10 }}>TEXT POSITION</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Distance from bottom</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={() => update("yOffset", Math.max(20, cfg.yOffset - 10))} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: 900 }}>−</button>
                  <span style={{ fontSize: 13, fontWeight: 700, width: 40, textAlign: "center" }}>{cfg.yOffset}px</span>
                  <button onClick={() => update("yOffset", Math.min(600, cfg.yOffset + 10))} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: 900 }}>+</button>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ddd", padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#555", marginBottom: 10 }}>TEXT COLORS</div>
              {[
                { label: "Band Name", key: "bandColor" },
                { label: "Date", key: "dateColor" },
                { label: "Venue", key: "venueColor" },
                { label: "City / State", key: "cityColor" },
              ].map(({ label, key }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
                  <input
                    type="color"
                    value={`#${cfg[key as keyof OverlayConfig]}`}
                    onChange={(e) => update(key as keyof OverlayConfig, e.target.value.replace("#", ""))}
                    style={{ width: 36, height: 28, borderRadius: 6, border: "1px solid #ddd", cursor: "pointer", padding: 2 }}
                  />
                </div>
              ))}
            </div>

            {/* Gradient toggle */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ddd", padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>Dark gradient</div>
                  <div style={{ fontSize: 12, color: "#888" }}>Improves text legibility over light images</div>
                </div>
                <button
                  onClick={() => update("showGradient", !cfg.showGradient)}
                  style={{
                    width: 44, height: 24, borderRadius: 999, border: "none", cursor: "pointer",
                    background: cfg.showGradient ? "#111" : "#ddd", transition: "background 0.2s",
                    position: "relative",
                  }}
                >
                  <span style={{
                    position: "absolute", top: 2, left: cfg.showGradient ? 22 : 2,
                    width: 20, height: 20, borderRadius: "50%", background: "#fff",
                    transition: "left 0.2s",
                  }} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
