"use client";

import { useState, useRef, useEffect } from "react";
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

type FieldKey = "date" | "venue" | "city";
type FormatKey = "square" | "story" | "landscape";

type FieldConfig = { x: number; y: number; size: number };

type FormatConfig = {
  fontFamily: string;
  textColor: string;
  showGradient: boolean;
  showBandName: boolean;
  bandSize: number;
  band?: FieldConfig;
  date: FieldConfig;
  venue: FieldConfig;
  city: FieldConfig;
};

const DEFAULT_FORMAT: FormatConfig = {
  fontFamily: "Oswald",
  textColor: "ffffff",
  showGradient: false,
  showBandName: false,
  bandSize: 80,
  date:  { x: 0.5, y: 0.84, size: 40 },
  venue: { x: 0.5, y: 0.76, size: 52 },
  city:  { x: 0.5, y: 0.91, size: 40 },
};

const FORMATS: { key: FormatKey; label: string; w: number; h: number }[] = [
  { key: "square",    label: "IG Square", w: 1080, h: 1080 },
  { key: "story",     label: "IG Story",  w: 1080, h: 1350 },
  { key: "landscape", label: "FB Cover",  w: 1920, h: 1080 },
];

const FIELD_LABELS: Record<FieldKey, string> = {
  venue: "Venue",
  date:  "Date",
  city:  "City & State",
};

const SAMPLE_TEXT: Record<FieldKey, string> = {
  venue: "White Water Tavern",
  date:  "Saturday, April 25, 2026",
  city:  "Little Rock, AR",
};

const BAND_DEFAULT: FieldConfig = { x: 0.5, y: 0.65, size: 80 };

type Tour = {
  id: string;
  name: string;
  band_tour_label: string | null;
  image_url: string | null;
  image_square_id: string | null;
  image_story_id: string | null;
  image_landscape_id: string | null;
  overlay_config: Record<FormatKey, FormatConfig> | null;
};

function buildPreviewUrl(publicId: string, cloudName: string, cfg: FormatConfig, format: FormatKey): string {
  const fmtDims = {
    square:    { w: 1080, h: 1080 },
    story:     { w: 1080, h: 1350 },
    landscape: { w: 1920, h: 1080 },
  }[format];
  const font = cfg.fontFamily.replace(/ /g, "%20");
  const maxW = Math.round(fmtDims.w * 0.85);
  const color = cfg.textColor;
  const san = (t: string) => encodeURIComponent(t.replace(/,/g, " ").replace(/[/?&#%]/g, "").trim());

  function toPixel(field: FieldConfig) {
    return {
      xPx: Math.round((field.x - 0.5) * fmtDims.w),
      yPx: Math.round((field.y - 0.5) * fmtDims.h),
    };
  }

  const vp = toPixel(cfg.venue);
  const dp = toPixel(cfg.date);
  const cp = toPixel(cfg.city);

  const layers = [
    `c_fill,g_center,h_${fmtDims.h},w_${fmtDims.w}`,
    ...(cfg.showGradient ? ["e_gradient_fade:symmetric_pad,y_-0.5"] : []),
    `c_fit,co_rgb:${color},fl_layer_apply,g_center,l_text:${font}_${cfg.venue.size}_bold:${san("White Water Tavern")},w_${maxW},x_${vp.xPx},y_${vp.yPx}`,
    `c_fit,co_rgb:${color},fl_layer_apply,g_center,l_text:${font}_${cfg.date.size}:${san("Saturday April 25 2026")},w_${maxW},x_${dp.xPx},y_${dp.yPx}`,
    `c_fit,co_rgb:${color},fl_layer_apply,g_center,l_text:${font}_${cfg.city.size}:${san("Little Rock AR")},w_${maxW},x_${cp.xPx},y_${cp.yPx}`,
  ];

  return `https://res.cloudinary.com/${cloudName}/image/upload/${layers.join("/")}/${publicId}`;
}

export default function TemplateEditor({ tour, tourId }: { tour: Tour; tourId: string }) {
  const saved0 = (tour.overlay_config ?? {}) as Partial<Record<FormatKey, FormatConfig>>;

  const [activeFormat, setActiveFormat] = useState<FormatKey>("square");
  const [configs, setConfigs] = useState<Record<FormatKey, FormatConfig>>({
    square:    { ...DEFAULT_FORMAT, ...saved0.square },
    story:     { ...DEFAULT_FORMAT, ...saved0.story },
    landscape: { ...DEFAULT_FORMAT, ...saved0.landscape },
  });
  const [dragging, setDragging] = useState<FieldKey | "band" | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(700);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const SNAP = 0.025;

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
  const bandName = tour.band_tour_label ?? tour.name ?? "Artist";

  const formatImageIds: Record<FormatKey, string | null> = {
    square:    tour.image_square_id,
    story:     tour.image_story_id ?? tour.image_square_id,
    landscape: tour.image_landscape_id ?? tour.image_square_id,
  };

  const cfg = configs[activeFormat];
  const publicId = formatImageIds[activeFormat];
  const fmtDims = FORMATS.find(f => f.key === activeFormat)!;
  const imageUrl = publicId ? `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,g_center,w_${fmtDims.w},h_${fmtDims.h}/${publicId}` : null;
  const previewScale = containerWidth / fmtDims.w;

  // Load Google Font
  useEffect(() => {
    const fontName = cfg.fontFamily.replace(/ /g, "+");
    const id = `gfont-${fontName}`;
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;700&display=swap`;
      document.head.appendChild(link);
    }
  }, [cfg.fontFamily]);

  // Track container width for accurate font scaling
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Drag handlers
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let x = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
      const y = Math.max(0.02, Math.min(0.98, (e.clientY - rect.top) / rect.height));
      if (Math.abs(x - 0.5) < SNAP) x = 0.5;
      setConfigs(prev => ({
        ...prev,
        [activeFormat]: {
          ...prev[activeFormat],
          [dragging]: { ...prev[activeFormat][dragging], x, y },
        },
      }));
      setSaved(false);
      setPreviewUrl(null);
    }
    function onMouseUp() { setDragging(null); }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, activeFormat]);

  function updateField(field: FieldKey, key: keyof FieldConfig, value: number) {
    setConfigs(prev => ({
      ...prev,
      [activeFormat]: {
        ...prev[activeFormat],
        [field]: { ...prev[activeFormat][field], [key]: value },
      },
    }));
    setSaved(false);
    setPreviewUrl(null);
  }

  function updateCfg(key: keyof FormatConfig, value: any) {
    setConfigs(prev => ({
      ...prev,
      [activeFormat]: { ...prev[activeFormat], [key]: value },
    }));
    setSaved(false);
    setPreviewUrl(null);
  }

  function generatePreview() {
    if (!publicId) return;
    setPreviewUrl(buildPreviewUrl(publicId, cloudName, cfg, activeFormat));
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

  return (
    <div style={{ background: "#EEEEEE", minHeight: "100vh", padding: 32 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid #ddd" }}>
          <Link href={`/dashboard/tours/${tourId}`} style={{ fontSize: 13, fontWeight: 700, color: "#888", textDecoration: "none", display: "inline-block", marginBottom: 8 }}>← Back to Tour</Link>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1 className="brand-title" style={{ margin: 0 }}>LOCALIZER</h1>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={generatePreview}
                disabled={!publicId}
                style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", color: "#111", fontWeight: 700, fontSize: 13, cursor: publicId ? "pointer" : "not-allowed", opacity: publicId ? 1 : 0.5 }}
              >Generate Preview</button>
              <button
                onClick={save}
                disabled={saving}
                style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #111", background: saved ? "#1a7f4b" : "#111", color: "#fff", fontWeight: 900, fontSize: 13, cursor: "pointer" }}
              >{saving ? "Saving..." : saved ? "Saved ✓" : "Save Template"}</button>
            </div>
          </div>
        </div>

        {/* Format tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {FORMATS.map(f => (
            <button key={f.key} onClick={() => { setActiveFormat(f.key); setPreviewUrl(null); }}
              style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid", borderColor: activeFormat === f.key ? "#111" : "#ddd", background: activeFormat === f.key ? "#111" : "#fff", color: activeFormat === f.key ? "#fff" : "#111", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start" }}>

          {/* Canvas */}
          <div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 8, fontWeight: 600 }}>DRAG TEXT TO POSITION — snaps to center</div>
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ddd", overflow: "hidden" }}>
              {previewUrl ? (
                <div style={{ position: "relative" }}>
                  <img src={previewUrl} alt="Preview" style={{ width: "100%", display: "block" }} />
                  <button onClick={() => setPreviewUrl(null)}
                    style={{ position: "absolute", top: 12, right: 12, padding: "6px 12px", borderRadius: 8, border: "none", background: "rgba(0,0,0,0.6)", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                    ← Back to Editor
                  </button>
                </div>
              ) : imageUrl ? (
                <div ref={containerRef} style={{ position: "relative", userSelect: "none", cursor: dragging ? "grabbing" : "default" }}>
                  <img src={imageUrl} alt="Base" style={{ width: "100%", display: "block" }} />

                  {/* Center vertical guide */}
                  {dragging && (
                    <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 0, borderLeft: "1px dashed rgba(255,255,255,0.9)", pointerEvents: "none", zIndex: 20 }} />
                  )}
                  {/* Horizontal alignment guides — shows when any 2 fields share same y */}
                  {(["venue", "date", "city"] as FieldKey[]).flatMap(a =>
                    (["venue", "date", "city"] as FieldKey[]).filter(b => b !== a && Math.abs(cfg[a].y - cfg[b].y) < 0.025).map(b => (
                      <div key={a + b} style={{ position: "absolute", top: `${cfg[a].y * 100}%`, left: 0, right: 0, height: 0, borderTop: "1px dashed rgba(255,220,0,0.8)", pointerEvents: "none", zIndex: 19 }} />
                    ))
                  )}

                  {/* Draggable labels */}
                  {cfg.showBandName && (() => {
                    const fc = cfg.band ?? BAND_DEFAULT;
                    return (
                      <div
                        key="band"
                        onMouseDown={(e) => { e.preventDefault(); setDragging("band"); }}
                        style={{
                          position: "absolute",
                          left: `${fc.x * 100}%`,
                          top: `${fc.y * 100}%`,
                          transform: "translate(-50%, -50%)",
                          cursor: "grab",
                          fontFamily: cfg.fontFamily,
                          fontSize: `${Math.round(fc.size * previewScale)}px`,
                          fontWeight: 700,
                          color: `#${cfg.textColor}`,
                          whiteSpace: "nowrap",
                          textShadow: "0 1px 4px rgba(0,0,0,0.9)",
                          outline: dragging === "band" ? "2px solid rgba(255,220,0,0.9)" : "1px dashed rgba(255,255,255,0.6)",
                          outlineOffset: 4,
                          padding: "2px 6px",
                          borderRadius: 3,
                          zIndex: dragging === "band" ? 10 : 5,
                        }}
                      >
                        {bandName.toUpperCase()}
                      </div>
                    );
                  })()}
                  {(["venue", "date", "city"] as FieldKey[]).map(field => {
                    const fc = cfg[field];
                    const isActive = dragging === field;
                    return (
                      <div
                        key={field}
                        onMouseDown={(e) => { e.preventDefault(); setDragging(field); }}
                        style={{
                          position: "absolute",
                          left: `${fc.x * 100}%`,
                          top: `${fc.y * 100}%`,
                          transform: "translate(-50%, -50%)",
                          cursor: "grab",
                          fontFamily: cfg.fontFamily,
                          fontSize: `${Math.round(fc.size * previewScale)}px`,
                          fontWeight: field === "venue" ? 700 : 400,
                          color: `#${cfg.textColor}`,
                          whiteSpace: "nowrap",
                          textShadow: "0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)",
                          outline: isActive ? "2px solid rgba(255,220,0,0.9)" : "1px dashed rgba(255,255,255,0.6)",
                          outlineOffset: 4,
                          padding: "2px 6px",
                          borderRadius: 3,
                          zIndex: isActive ? 10 : 5,
                          pointerEvents: "all",
                        }}
                      >
                        {SAMPLE_TEXT[field]}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: 48, textAlign: "center", color: "#999", fontSize: 14 }}>
                  No image uploaded for this format yet.<br /><br />
                  <Link href={`/dashboard/tours/${tourId}/assets`} style={{ color: "#111", fontWeight: 700 }}>→ Import Assets</Link>
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Font */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ddd", padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#555", marginBottom: 10 }}>FONT</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {FONTS.map(f => (
                  <button key={f.value} onClick={() => updateCfg("fontFamily", f.value)}
                    style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid", borderColor: cfg.fontFamily === f.value ? "#111" : "#ddd", background: cfg.fontFamily === f.value ? "#111" : "#fff", color: cfg.fontFamily === f.value ? "#fff" : "#111", fontWeight: 700, fontSize: 12, cursor: "pointer", textAlign: "left" }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text sizes */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ddd", padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#555", marginBottom: 12 }}>TEXT SIZES</div>
              {(["venue", "date", "city"] as FieldKey[]).map(field => (
                <div key={field} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{FIELD_LABELS[field]}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#555" }}>{cfg[field].size}px</span>
                  </div>
                  <input type="range" min={16} max={120} step={2}
                    value={cfg[field].size}
                    onChange={(e) => updateField(field, "size", parseInt(e.target.value))}
                    style={{ width: "100%", cursor: "pointer" }}
                  />
                </div>
              ))}
            </div>

            {/* Text color */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ddd", padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#555" }}>TEXT COLOR</div>
                  <div style={{ fontSize: 11, color: "#888" }}>Applies to all fields</div>
                </div>
                <input type="color" value={`#${cfg.textColor}`}
                  onChange={(e) => updateCfg("textColor", e.target.value.replace("#", ""))}
                  style={{ width: 40, height: 32, borderRadius: 6, border: "1px solid #ddd", cursor: "pointer", padding: 2 }}
                />
              </div>
            </div>

            {/* Band name */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ddd", padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: cfg.showBandName ? 12 : 0 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>Show band name</div>
                  <div style={{ fontSize: 11, color: "#888" }}>If not baked into image</div>
                </div>
                <button onClick={() => updateCfg("showBandName", !cfg.showBandName)}
                  style={{ width: 40, height: 22, borderRadius: 999, border: "none", cursor: "pointer", background: cfg.showBandName ? "#111" : "#ddd", position: "relative", flexShrink: 0 }}>
                  <span style={{ position: "absolute", top: 2, left: cfg.showBandName ? 19 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </button>
              </div>
              {cfg.showBandName && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Band Name Size</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#555" }}>{cfg.bandSize}px</span>
                  </div>
                  <input type="range" min={20} max={200} step={2} value={cfg.bandSize}
                    onChange={(e) => updateCfg("bandSize", parseInt(e.target.value))}
                    style={{ width: "100%", cursor: "pointer" }}
                  />
                </div>
              )}
            </div>

            {/* Gradient */}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ddd", padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>Dark gradient</div>
                  <div style={{ fontSize: 11, color: "#888" }}>Helps legibility over light images</div>
                </div>
                <button onClick={() => updateCfg("showGradient", !cfg.showGradient)}
                  style={{ width: 40, height: 22, borderRadius: 999, border: "none", cursor: "pointer", background: cfg.showGradient ? "#111" : "#ddd", position: "relative", flexShrink: 0, transition: "background 0.2s" }}>
                  <span style={{ position: "absolute", top: 2, left: cfg.showGradient ? 19 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
