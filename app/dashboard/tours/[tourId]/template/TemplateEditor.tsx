"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const FONTS = [
  { label: "Oswald", value: "Oswald" },
  { label: "Anton", value: "Anton" },
  { label: "Barlow Condensed", value: "Barlow Condensed" },
  { label: "Teko", value: "Teko" },
  { label: "Russo One", value: "Russo One" },
];

type FieldKey = "date" | "venue" | "city";
type FormatKey = "square" | "story" | "landscape" | "tiktok" | "yt_shorts";
type Align = "left" | "center" | "right";

type FieldConfig = { x: number; y: number; size: number; align?: Align };

type FormatConfig = {
  fontFamily: string;
  textColor: string;
  showBandName: boolean;
  bandSize: number;
  shortDate?: boolean;
  allCaps?: boolean;
  band?: FieldConfig;
  date: FieldConfig;
  venue: FieldConfig;
  city: FieldConfig;
};

const DEFAULT_FORMAT: FormatConfig = {
  fontFamily: "Oswald",
  textColor: "ffffff",
  showBandName: false,
  bandSize: 48,
  shortDate: false,
  allCaps: false,
  date:  { x: 0.5, y: 0.84, size: 28, align: "center" },
  venue: { x: 0.5, y: 0.76, size: 36, align: "center" },
  city:  { x: 0.5, y: 0.91, size: 28, align: "center" },
};

const FORMATS: { key: FormatKey; label: string; w: number; h: number }[] = [
  { key: "square",    label: "IG Square",     w: 1080, h: 1080 },
  { key: "story",     label: "IG Story",      w: 1080, h: 1350 },
  { key: "landscape", label: "FB Cover",      w: 1920, h: 1080 },
  { key: "tiktok",    label: "TikTok/Reels",  w: 1080, h: 1920 },
  { key: "yt_shorts", label: "YT Shorts",     w: 1080, h: 1920 },
];

const FIELD_LABELS: Record<FieldKey, string> = {
  venue: "Venue",
  date:  "Date",
  city:  "City & State",
};

const SAMPLE_TEXT: Record<FieldKey, string> = {
  venue: "Stubbs Waller Creek Amphitheater",
  date:  "April 25 2026",
  city:  "Little Rock, AR",
};

const BAND_DEFAULT: FieldConfig = { x: 0.5, y: 0.65, size: 80, align: "center" };

type Tour = {
  id: string;
  name: string;
  band_name: string | null;
  band_tour_label: string | null;
  image_url: string | null;
  image_square_id: string | null;
  image_story_id: string | null;
  image_landscape_id: string | null;
  video_tiktok_id: string | null;
  video_yt_shorts_id: string | null;
  overlay_config: Record<FormatKey, FormatConfig> | null;
};

function getTransform(align: Align): string {
  if (align === "left")  return "translate(0, -50%)";
  if (align === "right") return "translate(-100%, -50%)";
  return "translate(-50%, -50%)";
}

function buildPreviewUrl(publicId: string, cloudName: string, cfg: FormatConfig, format: FormatKey, bandNameStr?: string, fe?: { venue: string; date_iso: string; city: string; state: string | null } | null): string {
  const fmtDims = {
    square:    { w: 1080, h: 1080 },
    story:     { w: 1080, h: 1350 },
    landscape: { w: 1920, h: 1080 },
    tiktok:    { w: 1080, h: 1920 },
    yt_shorts: { w: 1080, h: 1920 },
  }[format];
  const font = cfg.fontFamily.replace(/ /g, "%20");
  const color = cfg.textColor;
  const san = (t: string) => { const clean = t.replace(/[/?&#%]/g, "").trim(); return clean.split(",").map(part => encodeURIComponent(part.trim())).join("%252C%20"); };

  function toLayerParams(field: FieldConfig): { gravity: string; xPx: number; yPx: number } {
    const align = field.align ?? "center";
    const yPx = Math.round((field.y - 0.5) * fmtDims.h);
    if (align === "left") {
      return { gravity: "west", xPx: Math.round(field.x * fmtDims.w), yPx };
    } else if (align === "right") {
      return { gravity: "east", xPx: Math.round((1 - field.x) * fmtDims.w), yPx };
    }
    return { gravity: "center", xPx: Math.round((field.x - 0.5) * fmtDims.w), yPx };
  }

  const vp = toLayerParams(cfg.venue);
  const dp = toLayerParams(cfg.date);
  const cp = toLayerParams(cfg.city);

  const va = cfg.venue.align ?? "center";
  const da = cfg.date.align ?? "center";
  const ca = cfg.city.align ?? "center";

  const bandField = cfg.band ?? { x: 0.5, y: 0.65, size: 80, align: "center" as Align };
  const bp = toLayerParams(bandField);
  const ba = bandField.align ?? "center";

  const layers = [
    `c_fill,g_center,h_${fmtDims.h},w_${fmtDims.w}`,
    ...(cfg.showBandName ? [`l_text:${font}_${cfg.bandSize}_bold_${ba}:${san(bandNameStr ?? "Band Name")},co_rgb:${color}/fl_layer_apply,g_${bp.gravity},x_${bp.xPx},y_${bp.yPx}`] : []),
    `l_text:${font}_${cfg.venue.size}_bold_${va}:${san(fe?.venue ?? "Stubbs Waller Creek Amphitheater")},co_rgb:${color}/fl_layer_apply,g_${vp.gravity},x_${vp.xPx},y_${vp.yPx}`,
    `l_text:${font}_${cfg.date.size}_bold_${da}:${san(fe ? (() => { try { const d = new Date(fe.date_iso + "T12:00:00"); if (cfg.shortDate) { const ord = (n: number) => n >= 11 && n <= 13 ? "TH" : (["","ST","ND","RD"][n%10] || "TH"); return `${d.toLocaleDateString("en-US",{weekday:"short"}).toUpperCase()}. ${d.toLocaleDateString("en-US",{month:"short"}).toUpperCase()} ${d.getDate()}${ord(d.getDate())}`; } return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); } catch { return fe.date_iso; } })() : (cfg.shortDate ? "SAT. APR 26TH" : "April 25 2026"))},co_rgb:${color}/fl_layer_apply,g_${dp.gravity},x_${dp.xPx},y_${dp.yPx}`,
    `l_text:${font}_${cfg.city.size}_bold_${ca}:${san(fe ? [fe.city, fe.state].filter(Boolean).join(", ") : "Little Rock AR")},co_rgb:${color}/fl_layer_apply,g_${cp.gravity},x_${cp.xPx},y_${cp.yPx}`,
  ];

  return `https://res.cloudinary.com/${cloudName}/image/upload/${layers.join("/")}/${publicId}`;
}

type FirstEvent = { date_iso: string; city: string; state: string | null; venue: string } | null;

export default function TemplateEditor({ tour, tourId, firstEvent, allEvents }: { tour: Tour; tourId: string; firstEvent: FirstEvent; allEvents: NonNullable<FirstEvent>[] }) {
  const saved0 = (tour.overlay_config ?? {}) as Partial<Record<FormatKey, FormatConfig>>;

  const longestVenue = allEvents.reduce((max, e) => e.venue.length > max.length ? e.venue : max, firstEvent?.venue ?? "");
  const longestCity = allEvents.reduce((max, e) => {
    const cs = [e.city, e.state].filter(Boolean).join(", ");
    return cs.length > max.length ? cs : max;
  }, firstEvent ? [firstEvent.city, firstEvent.state].filter(Boolean).join(", ") : "");

  function availableWidthForField(field: FieldConfig, canvasW: number): number {
    const align = field.align ?? "center";
    const margin = 0.90;
    if (align === "left")  return (1 - field.x) * canvasW * margin;
    if (align === "right") return field.x * canvasW * margin;
    // Center: constrained by whichever edge is closer
    return Math.min(field.x, 1 - field.x) * 2 * canvasW * margin;
  }

  function maxCharsForField(field: FieldConfig, canvasW: number): number {
    return Math.floor(availableWidthForField(field, canvasW) / (field.size * 0.55));
  }

  function isOverflow(text: string, field: FieldConfig, canvasW: number): boolean {
    return text.length > maxCharsForField(field, canvasW);
  }

  function suggestedSize(text: string, field: FieldConfig, canvasW: number): number {
    const avail = availableWidthForField(field, canvasW);
    for (let size = 72; size >= 12; size -= 2) {
      if (text.length <= Math.floor(avail / (size * 0.55))) return size;
    }
    return 12;
  }

  const [activeFormat, setActiveFormat] = useState<FormatKey>("square");
  const [configs, setConfigs] = useState<Record<FormatKey, FormatConfig>>({
    square:    { ...DEFAULT_FORMAT, ...saved0.square },
    story:     { ...DEFAULT_FORMAT, ...saved0.story },
    landscape: { ...DEFAULT_FORMAT, ...saved0.landscape },
    tiktok:    { ...DEFAULT_FORMAT, ...saved0.tiktok },
    yt_shorts: { ...DEFAULT_FORMAT, ...saved0.yt_shorts },
  });
  const [dragging, setDragging] = useState<FieldKey | "band" | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [containerWidth, setContainerWidth] = useState(700);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const SNAP = 0.04;  // ~4% snap zone for center alignment

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
  const bandName = tour.band_name ?? tour.name ?? "Artist";

  const formatImageIds: Record<FormatKey, string | null> = {
    square:    tour.image_square_id,
    story:     tour.image_story_id ?? tour.image_square_id,
    landscape: tour.image_landscape_id ?? tour.image_square_id,
    tiktok:    tour.video_tiktok_id ?? tour.image_story_id ?? tour.image_square_id,
    yt_shorts: tour.video_yt_shorts_id ?? tour.image_story_id ?? tour.image_square_id,
  };

  const cfg = configs[activeFormat];
  const publicId = formatImageIds[activeFormat];
  const fmtDims = FORMATS.find(f => f.key === activeFormat)!;
  const isVideoFormat = activeFormat === "tiktok" || activeFormat === "yt_shorts";
  const imageUrl = publicId
    ? isVideoFormat
      ? `https://res.cloudinary.com/${cloudName}/video/upload/c_fill,g_center,w_${fmtDims.w},h_${fmtDims.h},so_0/${publicId}.jpg`
      : `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,g_center,w_${fmtDims.w},h_${fmtDims.h}/${publicId}`
    : null;
  const maxPreviewH = 600;
  const scaleByW = containerWidth / fmtDims.w;
  const scaleByH = maxPreviewH / fmtDims.h;
  const previewScale = Math.min(scaleByW, scaleByH);

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

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging || !containerRef.current) return;
      const el = imgRef.current ?? containerRef.current;
      const rect = el.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / rect.width;
      const mouseY = (e.clientY - rect.top) / rect.height;
      let x = Math.max(0.05, Math.min(0.95, mouseX - dragOffset.x));
      const y = Math.max(0.02, Math.min(0.98, mouseY - dragOffset.y));
      if (Math.abs(x - 0.5) < SNAP) x = 0.5;
      if (dragging === "band") {
        setConfigs(prev => ({
          ...prev,
          [activeFormat]: {
            ...prev[activeFormat],
            band: { ...(prev[activeFormat].band ?? BAND_DEFAULT), x, y },
          },
        }));
      } else {
        setConfigs(prev => ({
          ...prev,
          [activeFormat]: {
            ...prev[activeFormat],
            [dragging]: { ...prev[activeFormat][dragging], x, y },
          },
        }));
      }
      setSaved(false);
    }
    function onMouseUp() { setDragging(null); }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging, activeFormat, dragOffset]);

  function updateField(field: FieldKey, key: keyof FieldConfig, value: number | string) {
    setConfigs(prev => ({
      ...prev,
      [activeFormat]: {
        ...prev[activeFormat],
        [field]: { ...prev[activeFormat][field], [key]: value },
      },
    }));
    setSaved(false);
  }

  function updateCfg(key: keyof FormatConfig, value: any) {
    setConfigs(prev => ({
      ...prev,
      [activeFormat]: { ...prev[activeFormat], [key]: value },
    }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/tours/${tourId}/overlay-config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overlay_config: configs }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        alert("Save failed — please try again before generating.");
      } else {
        setSaved(true);
      }
    } catch {
      alert("Save failed — network error.");
    } finally {
      setSaving(false);
    }
  }

  function AlignButtons({ field }: { field: FieldKey | "band" }) {
    const fc = field === "band" ? (cfg.band ?? BAND_DEFAULT) : cfg[field];
    const current = fc.align ?? "center";
    const handleClick = (a: Align) => {
      if (field === "band") {
        setConfigs(prev => ({
          ...prev,
          [activeFormat]: {
            ...prev[activeFormat],
            band: { ...(prev[activeFormat].band ?? BAND_DEFAULT), align: a },
          },
        }));
        setSaved(false);
      } else {
        updateField(field, "align", a);
      }
    };
    return (
      <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
        {(["left", "center", "right"] as Align[]).map(a => (
          <button key={a} onClick={() => handleClick(a)}
            style={{ flex: 1, padding: "4px 0", borderRadius: 6, border: "1px solid", borderColor: current === a ? "#111" : "#ddd", background: current === a ? "#111" : "#fff", color: current === a ? "#fff" : "#888", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            {a === "left" ? "⬅" : a === "center" ? "↔" : "➡"}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ background: "#F7F7F5", minHeight: "100vh", padding: 32 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid #ddd" }}>
          <Link href={`/dashboard/tours/${tourId}`} style={{ fontSize: 13, fontWeight: 700, color: "#888", textDecoration: "none", display: "inline-block", marginBottom: 8 }}>← Back to Tour</Link>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1 className="brand-title" style={{ margin: 0 }}>LOCALIZER</h1>
            <div style={{ display: "flex", gap: 8 }}>
              {!isVideoFormat && (
                <button
                  onClick={() => {
                    const pid = formatImageIds[activeFormat];
                    if (!pid) { alert("No image uploaded for this format."); return; }
                    window.open(buildPreviewUrl(pid, cloudName, cfg, activeFormat, bandName, firstEvent), "_blank");
                  }}
                  style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", color: "#111", fontWeight: 900, fontSize: 13, cursor: "pointer" }}
                >Preview Render</button>
              )}
              <button onClick={save} disabled={saving}
                style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #111", background: saved ? "#1a7f4b" : "#111", color: "#fff", fontWeight: 900, fontSize: 13, cursor: "pointer" }}>
                {saving ? "Saving..." : saved ? "Saved ✓" : "Save Template"}
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {FORMATS.map(f => (
            <button key={f.key} onClick={() => { setActiveFormat(f.key); setSaved(false); }}
              style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid", borderColor: activeFormat === f.key ? "#111" : "#ddd", background: activeFormat === f.key ? "#111" : "#fff", color: activeFormat === f.key ? "#fff" : "#111", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start" }}>

          <div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 8, fontWeight: 600 }}>DRAG TEXT TO POSITION — snaps to center</div>
            <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #ddd", overflow: "hidden" }}>
              {imageUrl ? (
                <div ref={containerRef} style={{ position: "relative", userSelect: "none", cursor: dragging ? "grabbing" : "default", width: `${Math.round(fmtDims.w * previewScale)}px`, margin: "0 auto" }}>
                  <img ref={imgRef} src={imageUrl} alt="Base" style={{ width: "100%", display: "block" }} />

                  {dragging && (
                    <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 0, borderLeft: "1px dashed rgba(255,255,255,0.9)", pointerEvents: "none", zIndex: 20 }} />
                  )}
                  {(["venue", "date", "city"] as FieldKey[]).flatMap(a =>
                    (["venue", "date", "city"] as FieldKey[]).filter(b => b !== a && Math.abs(cfg[a].y - cfg[b].y) < 0.025).map(b => (
                      <div key={a + b} style={{ position: "absolute", top: `${cfg[a].y * 100}%`, left: 0, right: 0, height: 0, borderTop: "1px dashed rgba(255,220,0,0.8)", pointerEvents: "none", zIndex: 19 }} />
                    ))
                  )}

                  {cfg.showBandName && (() => {
                    const fc = cfg.band ?? BAND_DEFAULT;
                    const align = fc.align ?? "center";
                    return (
                      <div key="band" onMouseDown={(e) => { 
                        e.preventDefault(); 
                        const rect = (imgRef.current ?? containerRef.current)!.getBoundingClientRect();
                        const mouseX = (e.clientX - rect.left) / rect.width;
                        const mouseY = (e.clientY - rect.top) / rect.height;
                        setDragOffset({ x: mouseX - fc.x, y: mouseY - fc.y });
                        setDragging("band"); 
                      }}
                        style={{ position: "absolute", left: `${fc.x * 100}%`, top: `${fc.y * 100}%`, transform: getTransform(align), cursor: "grab", fontFamily: cfg.fontFamily, fontSize: `${Math.round(cfg.bandSize * previewScale)}px`, fontWeight: 700, color: `#${cfg.textColor}`, whiteSpace: "nowrap", textShadow: "0 1px 4px rgba(0,0,0,0.9)", outline: dragging === "band" ? "2px solid rgba(255,220,0,0.9)" : "none", outlineOffset: 4, padding: "2px 6px", borderRadius: 3, zIndex: dragging === "band" ? 10 : 5 }}>
                        {bandName.toUpperCase()}
                      </div>
                    );
                  })()}

                  {(["venue", "date", "city"] as FieldKey[]).map(field => {
                    const fc = cfg[field];
                    const align = fc.align ?? "center";
                    const isActive = dragging === field;
                    return (
                      <div key={field} onMouseDown={(e) => { 
                        e.preventDefault(); 
                        const rect = (imgRef.current ?? containerRef.current)!.getBoundingClientRect();
                        const mouseX = (e.clientX - rect.left) / rect.width;
                        const mouseY = (e.clientY - rect.top) / rect.height;
                        setDragOffset({ x: mouseX - fc.x, y: mouseY - fc.y });
                        setDragging(field); 
                      }}
                        style={{ position: "absolute", left: `${fc.x * 100}%`, top: `${fc.y * 100}%`, transform: getTransform(align), cursor: "grab", fontFamily: cfg.fontFamily, fontSize: `${Math.round(fc.size * previewScale)}px`, fontWeight: 700, color: `#${cfg.textColor}`, whiteSpace: "nowrap", textShadow: "0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)", outline: isActive ? "2px solid rgba(255,220,0,0.9)" : "none", outlineOffset: 4, padding: "2px 6px", borderRadius: 3, zIndex: isActive ? 10 : 5, pointerEvents: "all" }}>
                        {firstEvent ? (
                          field === "venue" ? (cfg.allCaps ? firstEvent.venue.toUpperCase() : firstEvent.venue) :
                          field === "date" ? (() => { try { const d = new Date(firstEvent.date_iso + "T12:00:00"); if (cfg.shortDate) { const ord = (n: number) => n >= 11 && n <= 13 ? "TH" : [,"ST","ND","RD"][n%10] || "TH"; return `${d.toLocaleDateString("en-US",{weekday:"short"}).toUpperCase()}. ${d.toLocaleDateString("en-US",{month:"short"}).toUpperCase()} ${d.getDate()}${ord(d.getDate())}`; } return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); } catch { return firstEvent.date_iso; } })() :
                          cfg.allCaps ? [firstEvent.city, firstEvent.state].filter(Boolean).join(", ").toUpperCase() : [firstEvent.city, firstEvent.state].filter(Boolean).join(", ")
                        ) : SAMPLE_TEXT[field]}
                        {field === "venue" && isOverflow(longestVenue, cfg.venue, fmtDims.w) && (
                          <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, marginTop: 4, lineHeight: 1.4 }}>
                            ⚠️ "{longestVenue}" ({longestVenue.length} chars) may overflow — try {suggestedSize(longestVenue, cfg.venue, fmtDims.w)}px max
                          </div>
                        )}
                        {field === "city" && isOverflow(longestCity, cfg.city, fmtDims.w) && (
                          <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700, marginTop: 4, lineHeight: 1.4 }}>
                            ⚠️ "{longestCity}" ({longestCity.length} chars) may overflow — try {suggestedSize(longestCity, cfg.city, fmtDims.w)}px max
                          </div>
                        )}
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

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

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

            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ddd", padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#555", marginBottom: 12 }}>TEXT SIZES & ALIGNMENT</div>
              {(["venue", "date", "city"] as FieldKey[]).map(field => (
                <div key={field} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{FIELD_LABELS[field]}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#555" }}>{cfg[field].size}px</span>
                  </div>
                  <input type="range" min={16} max={120} step={2}
                    value={cfg[field].size}
                    onChange={(e) => updateField(field, "size", parseInt(e.target.value))}
                    style={{ width: "100%", cursor: "pointer" }}
                  />
                  <AlignButtons field={field} />
                </div>
              ))}
            </div>

            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ddd", padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: cfg.showBandName ? 12 : 0 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#555" }}>BAND NAME</div>
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
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Size</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#555" }}>{cfg.bandSize}px</span>
                  </div>
                  <input type="range" min={20} max={200} step={2} value={cfg.bandSize}
                    onChange={(e) => updateCfg("bandSize", parseInt(e.target.value))}
                    style={{ width: "100%", cursor: "pointer" }}
                  />
                  <div style={{ marginTop: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Alignment</span>
                    <AlignButtons field="band" />
                  </div>
                </div>
              )}
            </div>

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

            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ddd", padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>Short date format</div>
                  <div style={{ fontSize: 11, color: "#888" }}>e.g. SAT. JUN 26TH</div>
                </div>
                <button onClick={() => updateCfg("shortDate", !cfg.shortDate)}
                  style={{ width: 40, height: 22, borderRadius: 999, border: "none", cursor: "pointer", background: cfg.shortDate ? "#111" : "#ddd", position: "relative", flexShrink: 0 }}>
                  <span style={{ position: "absolute", top: 2, left: cfg.shortDate ? 19 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </button>
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ddd", padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>All caps</div>
                  <div style={{ fontSize: 11, color: "#888" }}>Venue, city & state in uppercase</div>
                </div>
                <button onClick={() => updateCfg("allCaps", !cfg.allCaps)}
                  style={{ width: 40, height: 22, borderRadius: 999, border: "none", cursor: "pointer", background: cfg.allCaps ? "#111" : "#ddd", position: "relative", flexShrink: 0 }}>
                  <span style={{ position: "absolute", top: 2, left: cfg.allCaps ? 19 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
