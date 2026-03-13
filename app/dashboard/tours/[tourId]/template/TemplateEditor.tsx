"use client";

import { useState, useRef } from "react";
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

export type OverlayConfig = {
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
  xOffset: number;
  showGradient: boolean;
  showBandName: boolean;
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
  xOffset: 0,
  showGradient: false,
  showBandName: false,
};

type FormatKey = "square" | "story" | "landscape";

const FORMATS: { key: FormatKey; label: string; w: number; h: number }[] = [
  { key: "square",    label: "IG Square",  w: 1080, h: 1080 },
  { key: "story",     label: "IG Story",   w: 1080, h: 1350 },
  { key: "landscape", label: "FB Cover",   w: 1920, h: 1080 },
];

type Tour = {
  id: string;
  name: string;
  band_tour_label: string | null;
  image_url: string | null;
  image_square_id: string | null;
  image_story_id: string | null;
  image_landscape_id: string | null;
  overlay_config: Record<FormatKey, OverlayConfig> | null;
};

function buildPreviewUrl(
  publicId: string,
  cloudName: string,
  cfg: OverlayConfig,
  bandName: string,
  format: FormatKey
): string {
  const dims = { square: { w: 1080, h: 1080 }, story: { w: 1080, h: 1350 }, landscape: { w: 1920, h: 1080 } };
  const { w, h } = dims[format];
  const font = cfg.fontFamily.replace(/ /g, "%20");
  const maxW = Math.round(w * 0.85);
  const scale = format === "landscape" ? 0.75 : 1;
  const dateSize  = Math.round(cfg.dateSize  * scale);
  const venueSize = Math.round(cfg.venueSize * scale);
  const citySize  = Math.round(cfg.citySize  * scale);
  const bandSize  = Math.round(cfg.bandSize  * scale);
  const sanitize = (t: string) => t.replace(/,/g, " ").replace(/[/?&#%]/g, "").trim();

  const layers: string[] = [
    `c_fill,g_center,h_${h},w_${w}`,
    ...(cfg.showGradient ? ["e_gradient_fade:symmetric_pad,y_-0.5"] : []),
    ...(cfg.showBandName ? [`c_fit,co_rgb:${cfg.bandColor},fl_layer_apply,g_south,l_text:${font}_${bandSize}_bold:${encodeURIComponent(sanitize(bandName))},w_${maxW},x_${cfg.xOffset},y_${cfg.yOffset + dateSize + venueSize + citySize + 24}`] : []),
    `c_fit,co_rgb:${cfg.dateColor},fl_layer_apply,g_south,l_text:${font}_${dateSize}:Saturday%20April%2025%202026,w_${maxW},x_${cfg.xOffset},y_${cfg.yOffset + venueSize + citySize + 12}`,
    `c_fit,co_rgb:${cfg.venueColor},fl_layer_apply,g_south,l_text:${font}_${venueSize}_bold:White%20Water%20Tavern,w_${maxW},x_${cfg.xOffset},y_${cfg.yOffset + citySize + 6}`,
    `c_fit,co_rgb:${cfg.cityColor},fl_layer_apply,g_south,l_text:${font}_${citySize}:Little%20Rock%20AR,w_${maxW},x_${cfg.xOffset},y_${cfg.yOffset}`,
  ];

  return `https://res.cloudinary.com/${cloudName}/image/upload/${layers.join("/")}/${publicId}`;
}

export default function TemplateEditor({ tour, tourId }: { tour: Tour; tourId: string }) {
  const savedConfigs = tour.overlay_config ?? {} as Record<FormatKey, OverlayConfig>;

  const [activeFormat, setActiveFormat] = useState<FormatKey>("square");
  const [configs, setConfigs] = useState<Record<FormatKey, OverlayConfig>>({
    square:    savedConfigs.square    ?? DEFAULT_CONFIG,
    story:     savedConfigs.story     ?? DEFAULT_CONFIG,
    landscape: savedConfigs.landscape ?? DEFAULT_CONFIG,
  });
  const [debouncedConfigs, setDebouncedConfigs] = useState(configs);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
  const bandName = tour.band_tour_label ?? tour.name ?? "Artist";

  const formatImageIds: Record<FormatKey, string | null> = {
    square:    tour.image_square_id,
    story:     tour.image_story_id ?? tour.image_square_id,
    landscape: tour.image_landscape_id ?? tour.image_square_id,
  };

  const cfg = configs[activeFormat];
  const dCfg = debouncedConfigs[activeFormat];
  const publicId = formatImageIds[activeFormat];
  const previewUrl = publicId ? buildPreviewUrl(publicId, cloudName, dCfg, bandName, activeFormat) : null;

  function update(key: keyof OverlayConfig, value: string | number | boolean) {
    setConfigs((prev) => {
      const next = { ...prev, [activeFormat]: { ...prev[activeFormat], [key]: value } };
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => setDebouncedConfigs(next), 400);
      return next;
    });
    setSaved(false);
  }

  function updateDebounced(key: keyof OverlayConfig, value: number) {
    setConfigs((prev) => {
      const next = { ...prev, [activeFormat]: { ...prev[activeFormat], [key]: value } };
      setDebouncedConfigs(next);
      return next;
    });
  }

  async function save() {
    setSaving(true);
    await fetch(`/api/tours/${tourId}/overlay-config`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overlay_config: configs }),
    });
    setSaving(false);
    setSaved(true);
  }

  const Toggle = ({ cfgKey, label, desc }: { cfgKey: keyof OverlayConfig; label: string; desc: string }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 12, color: "#888" }}>{desc}</div>
      </div>
      <button
        onClick={() => update(cfgKey, !cfg[cfgKey])}
        style={{ width: 44, height: 24, borderRadius: 999, border: "none", cursor: "pointer", background: cfg[cfgKey] ? "#111" : "#ddd", position: "relative", flexShrink: 0 }}
      >
        <span style={{ position: "absolute", top: 2, left: cfg[cfgKey] ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
      </button>
    </div>
  );

  const Slider = ({ cfgKey, label, min, max, step }: { cfgKey: keyof OverlayConfig; label: string; min: number; max: number; step: number }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>{cfg[cfgKey]}px</span>
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={cfg[cfgKey] as number}
        onChange={(e) => update(cfgKey, parseInt(e.target.value))}
        onMouseUp={(e) => updateDebounced(cfgKey, parseInt((e.target as HTMLInputElement).value))}
        onTouchEnd={(e) => updateDebounced(cfgKey, parseInt((e.target as HTMLInputElement).value))}
        style={{ width: "100%", cursor: "pointer" }}
      />
    </div>
  );

  return (
    <div style={{ background: "#EEEEEE", minHeight: "100vh", padding: 32 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid #ddd" }}>
          <Link href={`/dashboard/tours/${tourId}`} style={{ fontSize: 13, fontWeight: 700, color: "#888", textDecoration: "none", display: "inline-block", marginBottom: 8 }}>← Back to Tour</Link>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1 className="brand-title" style={{ margin: 0 }}>LOCALIZER</h1>
            <button onClick={save} disabled={saving} style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #111", background: saved ? "#1a7f4b" : "#111", color: "#fff", fontWeight: 900, fontSize: 13, cursor: "pointer" }}>
              {saving ? "Saving..." : saved ? "Saved ✓" : "Save Template"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {FORMATS.map((f) => (
            <button key={f.key} onClick={() => setActiveFormat(f.key)} style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid", borderColor: activeFormat === f.key ? "#111" : "#ddd", background: activeFormat === f.key ? "#111" : "#fff", color: activeFormat === f.key ? "#fff" : "#111", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24, alignItems: "start" }}>
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ddd", overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee", fontSize: 12, fontWeight: 900, color: "#555" }}>
              PREVIEW — {FORMATS.find(f => f.key === activeFormat)?.label}
            </div>
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" style={{ width: "100%", height: "auto", maxHeight: "70vh", objectFit: "contain", display: "block" }} />
            ) : (
              <div style={{ padding: 48, textAlign: "center", color: "#999", fontSize: 14 }}>
                No image uploaded for this format yet.<br /><br />
                <Link href={`/dashboard/tours/${tourId}/assets`} style={{ color: "#111", fontWeight: 700 }}>→ Import Assets</Link>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ddd", padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#555", marginBottom: 10 }}>FONT</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {FONTS.map((f) => (
                  <button key={f.value} onClick={() => update("fontFamily", f.value)} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid", borderColor: cfg.fontFamily === f.value ? "#111" : "#ddd", background: cfg.fontFamily === f.value ? "#111" : "#fff", color: cfg.fontFamily === f.value ? "#fff" : "#111", fontWeight: 700, fontSize: 13, cursor: "pointer", textAlign: "left" }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ddd", padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#555", marginBottom: 12 }}>TEXT SIZES</div>
              <Slider cfgKey="dateSize"  label="Date"         min={20} max={120} step={2} />
              <Slider cfgKey="venueSize" label="Venue"        min={20} max={120} step={2} />
              <Slider cfgKey="citySize"  label="City / State" min={20} max={120} step={2} />
            </div>

            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ddd", padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#555", marginBottom: 12 }}>TEXT POSITION</div>
              <Slider cfgKey="yOffset" label="Distance from bottom" min={20}   max={600} step={10} />
              <Slider cfgKey="xOffset" label="Horizontal position"  min={-400} max={400} step={10} />
            </div>

            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ddd", padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#555", marginBottom: 10 }}>TEXT COLORS</div>
              {([
                { label: "Date",         key: "dateColor" },
                { label: "Venue",        key: "venueColor" },
                { label: "City / State", key: "cityColor" },
              ] as { label: string; key: keyof OverlayConfig }[]).map(({ label, key }) => (
                <div key={key as string} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
                  <input type="color" value={`#${cfg[key]}`} onChange={(e) => update(key, e.target.value.replace("#", ""))} style={{ width: 36, height: 28, borderRadius: 6, border: "1px solid #ddd", cursor: "pointer", padding: 2 }} />
                </div>
              ))}
            </div>

            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ddd", padding: 16 }}>
              <Toggle cfgKey="showBandName" label="Show band name" desc="Enable if your image doesnt have it baked in" />
              {cfg.showBandName && (
                <div style={{ marginTop: 12 }}>
                  <Slider cfgKey="bandSize" label="Band Name Size" min={20} max={200} step={2} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Band Name Color</span>
                    <input type="color" value={`#${cfg.bandColor}`} onChange={(e) => update("bandColor", e.target.value.replace("#", ""))} style={{ width: 36, height: 28, borderRadius: 6, border: "1px solid #ddd", cursor: "pointer", padding: 2 }} />
                  </div>
                </div>
              )}
            </div>

            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ddd", padding: 16 }}>
              <Toggle cfgKey="showGradient" label="Dark gradient" desc="Improves text legibility over light images" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
