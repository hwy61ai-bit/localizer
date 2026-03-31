"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/app/components/Toast";
import { renderPoster, formatDateForRender } from "@/lib/clientRender";
import "./template-editor.css";

const FONTS = [
  { label: "Oswald", value: "Oswald" },
  { label: "Anton", value: "Anton" },
  { label: "Barlow Condensed", value: "Barlow Condensed" },
  { label: "Teko", value: "Teko" },
  { label: "Russo One", value: "Russo One" },
  { label: "Roboto", value: "Roboto" },
  { label: "Montserrat", value: "Montserrat" },
  { label: "Poppins", value: "Poppins" },
  { label: "Lato", value: "Lato" },
  { label: "Open Sans", value: "Open Sans" },
  { label: "Fjalla One", value: "Fjalla One" },
  { label: "Work Sans", value: "Work Sans" },
  { label: "Raleway", value: "Raleway" },
  { label: "Bungee", value: "Bungee" },
  { label: "Righteous", value: "Righteous" },
  { label: "Permanent Marker", value: "Permanent Marker" },
];

type FieldKey = "date" | "venue" | "city";
type FormatKey = "square" | "story" | "landscape" | "print" | "tiktok" | "yt_shorts";
type Align = "left" | "center" | "right";

type FieldConfig = { x: number; y: number; size: number; align?: Align };

type FormatConfig = {
  fontFamily: string;
  textColor: string;
  showBandName: boolean;
  bandSize: number;
  shortDate?: boolean;
  allCaps?: boolean;
  showLogo?: boolean;
  logo?: FieldConfig;
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
  { key: "landscape", label: "FB Cover",      w: 820,  h: 312 },
  { key: "print",     label: "LOCAL POSTER FOR PRINT", w: 3300, h: 5100 },
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
  image_print_id: string | null;
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
    print:     { w: 3300, h: 5100 },
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

  const caps = cfg.allCaps ?? false;
  const layers = [
    `c_fill,g_center,h_${fmtDims.h},w_${fmtDims.w}`,
    ...(cfg.showBandName ? [`l_text:${font}_${cfg.bandSize}_bold:${san(caps ? (bandNameStr ?? "Band Name").toUpperCase() : (bandNameStr ?? "Band Name"))},co_rgb:${color}/fl_layer_apply,g_${bp.gravity},x_${bp.xPx},y_${bp.yPx}`] : []),
    `l_text:${font}_${cfg.venue.size}_bold:${san(caps ? (fe?.venue ?? "Stubbs Waller Creek Amphitheater").toUpperCase() : (fe?.venue ?? "Stubbs Waller Creek Amphitheater"))},co_rgb:${color}/fl_layer_apply,g_${vp.gravity},x_${vp.xPx},y_${vp.yPx}`,
    `l_text:${font}_${cfg.date.size}_bold:${san(fe ? (() => { try { const d = new Date(fe.date_iso + "T12:00:00"); if (cfg.shortDate) { const ord = (n: number) => n >= 11 && n <= 13 ? "TH" : (["","ST","ND","RD"][n%10] || "TH"); return `${d.toLocaleDateString("en-US",{weekday:"short"}).toUpperCase()}. ${["JAN","FEB","MARCH","APRIL","MAY","JUNE","JULY","AUG","SEPT","OCT","NOV","DEC"][d.getMonth()]} ${d.getDate()}${ord(d.getDate())}`; } return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); } catch { return fe.date_iso; } })() : (cfg.shortDate ? "SAT. APR 26TH" : "April 25 2026"))},co_rgb:${color}/fl_layer_apply,g_${dp.gravity},x_${dp.xPx},y_${dp.yPx}`,
    `l_text:${font}_${cfg.city.size}_bold:${san(caps ? (fe ? [fe.city, fe.state].filter(Boolean).join(", ") : "Little Rock AR").toUpperCase() : (fe ? [fe.city, fe.state].filter(Boolean).join(", ") : "Little Rock AR"))},co_rgb:${color}/fl_layer_apply,g_${cp.gravity},x_${cp.xPx},y_${cp.yPx}`,
  ];

  return `https://res.cloudinary.com/${cloudName}/image/upload/${layers.join("/")}/${publicId}`;
}

type FirstEvent = { date_iso: string; city: string; state: string | null; venue: string } | null;

export default function TemplateEditor({ tour, tourId, firstEvent, allEvents, orgId }: { tour: Tour; tourId: string; firstEvent: FirstEvent; allEvents: NonNullable<FirstEvent>[]; orgId: string }) {
  const saved0 = (tour.overlay_config ?? {}) as Partial<Record<FormatKey, FormatConfig>>;

  const longestVenue = allEvents.reduce((max, e) => e.venue.length > max.length ? e.venue : max, firstEvent?.venue ?? "");
  const longestDateEvent = allEvents.reduce((longest, e) => {
    return e.venue.length > (longest?.venue.length ?? 0) ? e : longest;
  }, allEvents[0] ?? null);

  const longestCity = allEvents.reduce((max, e) => {
    const cs = [e.city, e.state].filter(Boolean).join(", ");
    return cs.length > max.length ? cs : max;
  }, firstEvent ? [firstEvent.city, firstEvent.state].filter(Boolean).join(", ") : "");

  function availableWidthForField(field: FieldConfig, canvasW: number): number {
    const align = field.align ?? "center";
    const margin = 0.95;
    if (align === "left")  return (1 - field.x) * canvasW * margin;
    if (align === "right") return field.x * canvasW * margin;
    return Math.min(field.x, 1 - field.x) * 2 * canvasW * margin;
  }

  function measureTextWidth(text: string, size: number, fontFamily: string): number {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    ctx.font = "bold " + size + "px '" + fontFamily + "', sans-serif";
    return ctx.measureText(text).width;
  }

  function isOverflow(text: string, field: FieldConfig, canvasW: number): boolean {
    const avail = availableWidthForField(field, canvasW);
    const width = measureTextWidth(text, field.size, cfg.fontFamily);
    return width > avail;
  }

  function suggestedSize(text: string, field: FieldConfig, canvasW: number): number {
    const avail = availableWidthForField(field, canvasW);
    for (let size = field.size; size >= 12; size -= 2) {
      if (measureTextWidth(text, size, cfg.fontFamily) <= avail) return size;
    }
    return 12;
  }

  const [activeFormat, setActiveFormat] = useState<FormatKey>("square");
  const [configs, setConfigs] = useState<Record<FormatKey, FormatConfig>>({
    square:    { ...DEFAULT_FORMAT, ...saved0.square },
    story:     { ...DEFAULT_FORMAT, ...saved0.story },
    landscape: { ...DEFAULT_FORMAT, ...saved0.landscape },
    print:     { ...DEFAULT_FORMAT, ...saved0.print },
    tiktok:    { ...DEFAULT_FORMAT, ...saved0.tiktok },
    yt_shorts: { ...DEFAULT_FORMAT, ...saved0.yt_shorts },
  });
  const [previewLongest, setPreviewLongest] = useState(false);
  const [dragging, setDragging] = useState<FieldKey | "band" | "logo" | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [containerWidth, setContainerWidth] = useState(700);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [savedFormats, setSavedFormats] = useState<Set<string>>(new Set());
  const [dirtyFormats, setDirtyFormats] = useState<Set<string>>(new Set());
  const [customFonts, setCustomFonts] = useState<{ label: string; value: string }[]>([]);
  const [uploadingFont, setUploadingFont] = useState(false);
  const savingRef = useRef(false);
  const fontFileRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const SNAP = 0.04;  // ~4% snap zone for center alignment

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const toast = useToast();
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";

  // Load artist logo
  useEffect(() => {
    async function loadLogo() {
      try {
        const res = await fetch("/api/artists/logo?orgId=" + orgId + "&tourId=" + tourId);
        if (res.ok) {
          const data = await res.json();
          setLogoUrl(data.logoUrl ?? null);
        }
      } catch {}
    }
    loadLogo();
  }, [orgId, tourId]);

  // Load custom fonts from DB on mount
  useEffect(() => {
    async function loadCustomFonts() {
      try {
        const res = await fetch("/api/fonts/list?orgId=" + orgId);
        if (!res.ok) return;
        const { fonts } = await res.json();
        const loaded: { label: string; value: string }[] = [];
        for (const f of fonts) {
          loaded.push({ label: f.font_name, value: f.font_name });
          if (f.storage_url) {
            const face = new FontFace(f.font_name, "url(" + f.storage_url + ")");
            try {
              const l = await face.load();
              document.fonts.add(l);
            } catch (e) {
              console.warn("Failed to load font:", f.font_name, e);
            }
          }
        }
        if (loaded.length > 0) setCustomFonts(loaded);
      } catch {}
    }
    loadCustomFonts();
  }, [orgId]);
  const bandName = tour.band_name ?? tour.name ?? "Artist";

  const formatImageIds: Record<FormatKey, string | null> = {
    square:    tour.image_square_id,
    story:     tour.image_story_id ?? tour.image_square_id,
    landscape: tour.image_landscape_id ?? tour.image_square_id,
    print:     tour.image_print_id,
    tiktok:    tour.video_tiktok_id ?? null,
    yt_shorts: tour.video_yt_shorts_id ?? null,
  };

  const cfg = configs[activeFormat];
  const publicId = formatImageIds[activeFormat];
  const fmtDims = FORMATS.find(f => f.key === activeFormat)!;
  const isVideoFormat = activeFormat === "tiktok" || activeFormat === "yt_shorts";
  const isPrintFormat = activeFormat === "print";
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
      if (dragging === "logo") {
        setDirtyFormats(prev => new Set([...prev, activeFormat]));
        setConfigs(prev => ({
          ...prev,
          [activeFormat]: {
            ...prev[activeFormat],
            logo: { ...(prev[activeFormat].logo ?? { x: 0.5, y: 0.15, size: 80, align: "center" }), x, y },
          },
        }));
      } else if (dragging === "band") {
        setDirtyFormats(prev => new Set([...prev, activeFormat]));
        setConfigs(prev => ({
          ...prev,
          [activeFormat]: {
            ...prev[activeFormat],
            band: { ...(prev[activeFormat].band ?? BAND_DEFAULT), x, y },
          },
        }));
      } else {
        setDirtyFormats(prev => new Set([...prev, activeFormat]));
        setConfigs(prev => ({
          ...prev,
          [activeFormat]: {
            ...prev[activeFormat],
            [dragging]: { ...prev[activeFormat][dragging], x, y },
          },
        }));
      }

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
    setDirtyFormats(prev => new Set([...prev, activeFormat]));
    setConfigs(prev => ({
      ...prev,
      [activeFormat]: {
        ...prev[activeFormat],
        [field]: { ...prev[activeFormat][field], [key]: value },
      },
    }));
  }

  function updateCfg(key: keyof FormatConfig, value: any) {
    setDirtyFormats(prev => new Set([...prev, activeFormat]));
    setConfigs(prev => ({
      ...prev,
      [activeFormat]: { ...prev[activeFormat], [key]: value },
    }));
  }

  async function save() {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const res = await fetch(`/api/tours/${tourId}/overlay-config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overlay_config: configs }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error("Save failed — please try again before generating.");
      } else {
        setSavedFormats(prev => new Set([...prev, activeFormat]));
        setDirtyFormats(prev => { const next = new Set(prev); next.delete(activeFormat); return next; });
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 700);
      }
    } catch {
      toast.error("Save failed — network error.");
    } finally {
      savingRef.current = false;
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

  async function handleFontUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith(".ttf") && !file.name.endsWith(".otf")) {
      toast.error("Only .ttf and .otf font files are supported");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Font file must be under 5MB");
      return;
    }

    const confirmed = window.confirm(
      "FONT LICENSE AGREEMENT\n\n" +
      "By uploading this font, you confirm that:\n\n" +
      "• You own the font or have a valid license to use it\n" +
      "• You have the right to use this font for commercial purposes\n" +
      "• You will comply with all font licensing terms\n\n" +
      "Uploading unlicensed fonts may violate copyright law.\n\n" +
      "Do you want to continue?"
    );
    
    if (!confirmed) {
      if (fontFileRef.current) fontFileRef.current.value = "";
      return;
    }

    setUploadingFont(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("orgId", orgId);

      const res = await fetch("/api/fonts/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error);
      }

      const data = await res.json();
      const fontName = data.fontName;
      setCustomFonts(prev => [...prev, { label: fontName, value: fontName }]);
      // Load font into browser immediately
      if (data.storageUrl) {
        const face = new FontFace(fontName, "url(" + data.storageUrl + ")");
        try {
          const loaded = await face.load();
          document.fonts.add(loaded);
        } catch (e) {
          console.warn("Font loaded to server but browser preview may not work:", e);
        }
      }
      toast.success(`Font "${fontName}" uploaded`);
    } catch (err: any) {
      console.error("Font upload failed:", err);
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploadingFont(false);
      if (fontFileRef.current) fontFileRef.current.value = "";
    }
  }

  return (
    <>
    <div className="template-mobile-gate">
      <div className="template-mobile-gate-inner">
        <div className="template-mobile-gate-icon">&#9000;</div>
        <div className="template-mobile-gate-title">Template Editor is best experienced on a desktop or tablet.</div>
        <div className="template-mobile-gate-msg">Please switch to a larger screen to use the template editor.</div>
      </div>
    </div>
    <div className="fade-in template-editor-content" style={{ background: "#F7F7F5", minHeight: "100vh", padding: 32 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid #ddd" }}>
          <Link href={`/dashboard/tours/${tourId}`} style={{ fontSize: 13, fontWeight: 700, color: "#888", textDecoration: "none", display: "inline-block", marginBottom: 8 }}>← Back to Tour</Link>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "inline-block" }}>
                <div className="brand-title" style={{ fontSize: 72, lineHeight: 1, marginBottom: 4, paddingBottom: 8 }}>LOCALIZER</div>
                <div style={{ borderBottom: "2px solid #111", marginBottom: 6 }} />
              </div>
              <div className="brand-title" style={{ fontSize: "360%" }}>Template For Shows</div>
            </div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "#fff", border: "1px solid #ddd", borderRadius: 12, padding: "8px" }}>
              <Link href={`/dashboard/tours/${tourId}/import`} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", color: "#111", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>1. ↑ Import Schedule</Link>
              <Link href={`/dashboard/tours/${tourId}/assets`} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", color: "#111", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>2. ↑ Import Assets</Link>
              <Link href={`/dashboard/tours/${tourId}/template`} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", textDecoration: "none", fontWeight: 900, fontSize: 13 }}>3. Template For Shows</Link>
              <Link href={`/dashboard/tours/${tourId}`} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", color: "#111", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>4. Gigs</Link>
            </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {FORMATS.map(f => (
              <button key={f.key} onClick={() => { setActiveFormat(f.key); }}
                style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid", borderColor: activeFormat === f.key ? "#111" : "#ddd", background: activeFormat === f.key ? "#111" : "#fff", color: activeFormat === f.key ? "#fff" : "#111", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {isPrintFormat && <div style={{ fontSize: 11, color: "#888", fontWeight: 600, padding: "10px 0" }}>Print poster generates as PDF from the venue download page.</div>}
            {!isVideoFormat && !isPrintFormat && <button
                onClick={async () => {
                  const pid = formatImageIds[activeFormat];
                  if (!pid) { toast.error('No image uploaded for this format.'); return; }
                  const fd: Record<string, { w: number; h: number }> = {
                    square: { w: 1080, h: 1080 }, story: { w: 1080, h: 1350 },
                    landscape: { w: 820, h: 312 }, tiktok: { w: 1080, h: 1920 }, yt_shorts: { w: 1080, h: 1920 },
                  };
                  const dims = fd[activeFormat] ?? fd.square;
                  const baseUrl = 'https://res.cloudinary.com/' + cloudName + '/image/upload/c_fill,g_center,w_' + dims.w + ',h_' + dims.h + '/' + pid;
                  const shortDate = cfg.shortDate ?? false;
                  const ed = firstEvent ? {
                    bandName: bandName,
                    dateFormatted: formatDateForRender(firstEvent.date_iso, shortDate),
                    venueName: firstEvent.venue,
                    cityState: [firstEvent.city, firstEvent.state].filter(Boolean).join(', '),
                  } : {
                    bandName: bandName,
                    dateFormatted: shortDate ? 'SAT. APR 26TH' : 'April 25 2026',
                    venueName: 'Stubbs Waller Creek Amphitheater',
                    cityState: 'Little Rock, AR',
                  };
                  try {
                    const blob = await renderPoster(baseUrl, cfg, activeFormat, ed, logoUrl);
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                  } catch (err: any) {
                    toast.error('Render failed: ' + err.message);
                    console.error(err);
                  }
                }}
                style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", color: "#111", fontWeight: 900, fontSize: 13, cursor: "pointer" }}
              >Preview Render</button>}
              <button onClick={save} disabled={saving}
              className={justSaved ? "save-pulse" : ""} style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #111", background: (savedFormats.has(activeFormat) && !dirtyFormats.has(activeFormat)) ? "#1a7f4b" : "#111", color: "#fff", fontWeight: 900, fontSize: 13, cursor: "pointer" }}>
              {saving ? "Saving..." : (savedFormats.has(activeFormat) && !dirtyFormats.has(activeFormat)) ? "Saved ✓" : "Save Template"}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start" }}>

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>DRAG TEXT TO POSITION — snaps to center</div>
              <button onClick={() => setPreviewLongest(!previewLongest)}
                style={{ fontSize: 12, fontWeight: 900, padding: "8px 16px", borderRadius: 10, border: "2px solid", borderColor: previewLongest ? "#c00" : "#111", background: previewLongest ? "#fff0f0" : "#111", color: previewLongest ? "#c00" : "#fff", cursor: "pointer", letterSpacing: "0.03em", transition: "all 0.2s ease-out" }}>
                {previewLongest ? "⚠ Showing longest names" : "Preview longest names"}
              </button>
            </div>
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
                        style={{ position: "absolute", left: `${fc.x * 100}%`, top: `${fc.y * 100}%`, transform: getTransform(align), cursor: "grab", fontFamily: "'" + cfg.fontFamily + "', sans-serif", fontSize: `${Math.round(cfg.bandSize * previewScale)}px`, fontWeight: 700, color: `#${cfg.textColor}`, whiteSpace: "nowrap", outline: dragging === "band" ? "2px solid rgba(255,220,0,0.9)" : "none", outlineOffset: 4, padding: "2px 6px", borderRadius: 3, zIndex: dragging === "band" ? 10 : 5 }}>
                        {(fc.x < 0.4 && align !== "left") && (
                          <div style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)", fontSize: 11, color: "#f59e0b", fontWeight: 700, marginBottom: 8, whiteSpace: "nowrap", background: "rgba(0,0,0,0.8)", padding: "4px 8px", borderRadius: 6 }}>
                            ⚠️ Use left align
                          </div>
                        )}
                        {(fc.x > 0.6 && align !== "right") && (
                          <div style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)", fontSize: 11, color: "#f59e0b", fontWeight: 700, marginBottom: 8, whiteSpace: "nowrap", background: "rgba(0,0,0,0.8)", padding: "4px 8px", borderRadius: 6 }}>
                            ⚠️ Use right align
                          </div>
                        )}
                        {bandName.toUpperCase()}
                      </div>
                    );
                  })()}

                  {cfg.showLogo && logoUrl && (() => {
                    const lc = cfg.logo ?? { x: 0.5, y: 0.15, size: 80, align: "center" as Align };
                    return (
                      <div key="logo" onMouseDown={(e) => {
                        e.preventDefault();
                        const rect = (imgRef.current ?? containerRef.current)!.getBoundingClientRect();
                        const mouseX = (e.clientX - rect.left) / rect.width;
                        const mouseY = (e.clientY - rect.top) / rect.height;
                        setDragOffset({ x: mouseX - lc.x, y: mouseY - lc.y });
                        setDragging("logo");
                      }}
                        style={{ position: "absolute", left: lc.x * 100 + "%", top: lc.y * 100 + "%", transform: "translate(-50%, -50%)", cursor: "grab", zIndex: 6 }}>
                        <div style={{ height: Math.round(lc.size * previewScale) + "px", width: Math.round(lc.size * previewScale * 2) + "px", backgroundColor: "#" + cfg.textColor, WebkitMaskImage: "url(" + logoUrl + ")", WebkitMaskSize: "contain", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "center", maskImage: "url(" + logoUrl + ")", maskSize: "contain", maskRepeat: "no-repeat", maskPosition: "center", opacity: 0.9, pointerEvents: "none" }} />
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
                        style={{ position: "absolute", left: `${fc.x * 100}%`, top: `${fc.y * 100}%`, transform: getTransform(align), cursor: "grab", fontFamily: "'" + cfg.fontFamily + "', sans-serif", fontSize: `${Math.round(fc.size * previewScale)}px`, fontWeight: 700, color: `#${cfg.textColor}`, whiteSpace: "nowrap", textAlign: "center", outline: isActive ? "2px solid rgba(255,220,0,0.9)" : "none", outlineOffset: 4, padding: "2px 6px", borderRadius: 3, zIndex: isActive ? 10 : 5, pointerEvents: "all" }}>
                        {firstEvent ? (
                          field === "venue" ? (() => {
                            const raw = previewLongest ? longestVenue : firstEvent.venue;
                            const text = cfg.allCaps ? raw.toUpperCase() : raw;
                            if (text.includes("|")) {
                              const parts = text.split("|").map((p: string) => p.trim());
                              return <div style={{ display: "flex", flexDirection: "column", alignItems: "center", whiteSpace: "normal", width: "max-content" }}>{parts.map((part: string, i: number) => <div key={i} style={{ textAlign: "center" }}>{part}</div>)}</div>;
                            }
                            return text;
                          })() :
                          field === "date" ? (() => { try { const d = new Date(firstEvent.date_iso + "T12:00:00"); if (cfg.shortDate) { const ord = (n: number) => n >= 11 && n <= 13 ? "TH" : [,"ST","ND","RD"][n%10] || "TH"; return `${d.toLocaleDateString("en-US",{weekday:"short"}).toUpperCase()}. ${["JAN","FEB","MARCH","APRIL","MAY","JUNE","JULY","AUG","SEPT","OCT","NOV","DEC"][d.getMonth()]} ${d.getDate()}${ord(d.getDate())}`; } return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); } catch { return firstEvent.date_iso; } })() :
                          cfg.allCaps ? (previewLongest ? longestCity : [firstEvent.city, firstEvent.state].filter(Boolean).join(", ")).toUpperCase() : (previewLongest ? longestCity : [firstEvent.city, firstEvent.state].filter(Boolean).join(", "))
                        ) : SAMPLE_TEXT[field]}

                        {(fc.x < 0.4 && align !== "left") && (
                          <div style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)", fontSize: 11, color: "#f59e0b", fontWeight: 700, marginBottom: 8, whiteSpace: "nowrap", background: "rgba(0,0,0,0.8)", padding: "4px 8px", borderRadius: 6 }}>
                            ⚠️ Use left align
                          </div>
                        )}
                        {(fc.x > 0.6 && align !== "right") && (
                          <div style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)", fontSize: 11, color: "#f59e0b", fontWeight: 700, marginBottom: 8, whiteSpace: "nowrap", background: "rgba(0,0,0,0.8)", padding: "4px 8px", borderRadius: 6 }}>
                            ⚠️ Use right align
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
                  {isVideoFormat ? (
                    <>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#bbb", marginBottom: 12 }}>Not Uploaded Yet</div>
                      <div style={{ marginBottom: 16 }}>Upload a {activeFormat === "tiktok" ? "TikTok/Reels" : "YouTube Shorts"} video to configure this format.</div>
                      <Link href={`/dashboard/tours/${tourId}/assets`} style={{ color: "#111", fontWeight: 700 }}>→ Import Assets</Link>
                    </>
                  ) : (
                    <>
                      No image uploaded for this format yet.<br /><br />
                      <Link href={`/dashboard/tours/${tourId}/assets`} style={{ color: "#111", fontWeight: 700 }}>→ Import Assets</Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ddd", padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#555", marginBottom: 10 }}>FONT</div>
              <input
                ref={fontFileRef}
                type="file"
                accept=".ttf,.otf"
                style={{ display: "none" }}
                onChange={handleFontUpload}
              />
              <button
                onClick={() => fontFileRef.current?.click()}
                disabled={uploadingFont}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px dashed #888",
                  background: "#fff",
                  color: "#111",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: uploadingFont ? "not-allowed" : "pointer",
                  textAlign: "center",
                  letterSpacing: "0.05em",
                  marginBottom: 8,
                }}
              >
                {uploadingFont ? "Uploading..." : "+ Upload Custom Font (.ttf / .otf)"}
              </button>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 240, overflowY: "auto" }}>
                {customFonts.length > 0 && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#999", letterSpacing: "0.05em" }}>CUSTOM FONTS</div>
                    </div>
                    {customFonts.map(f => (
                      <div key={f.value} style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => updateCfg("fontFamily", f.value)}
                          style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid", borderColor: cfg.fontFamily === f.value ? "#111" : "#ddd", background: cfg.fontFamily === f.value ? "#111" : "#fff", color: cfg.fontFamily === f.value ? "#fff" : "#111", fontWeight: 700, fontSize: 12, cursor: "pointer", textAlign: "left" }}>
                          {f.label}
                        </button>
                        <button onClick={async () => {
                          if (!confirm("Delete font \"" + f.label + "\"?")) return;
                          try {
                            const res = await fetch("/api/fonts/delete", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ fontName: f.value, orgId }),
                            });
                            if (res.ok) {
                              setCustomFonts(prev => prev.filter(x => x.value !== f.value));
                              if (cfg.fontFamily === f.value) updateCfg("fontFamily", "Oswald");
                            } else {
                              const d = await res.json();
                              toast.error("Delete failed: " + (d.error ?? "Unknown error"));
                            }
                          } catch (err: any) { toast.error("Delete failed: " + err.message); }
                        }}
                          style={{ padding: "8px 8px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", color: "#c00", fontWeight: 700, fontSize: 11, cursor: "pointer", flexShrink: 0 }}>
                          ✕
                        </button>
                      </div>
                    ))}
                    <div style={{ borderBottom: "1px solid #eee", marginTop: 4, marginBottom: 4 }} />
                  </>
                )}
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
              {(["venue", "date", "city"] as FieldKey[]).map(field => {
                const textMax = isPrintFormat ? 400 : 120;
                return (
                <div key={field} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{FIELD_LABELS[field]}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <input
                        type="number"
                        min={16}
                        max={textMax}
                        value={cfg[field].size}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= 999) updateField(field, "size", val);
                        }}
                        style={{ width: 42, fontSize: 11, fontWeight: 700, color: "#555", border: "1px solid #ddd", borderRadius: 4, padding: "2px 4px", textAlign: "right", outline: "none" }}
                      />
                      <span style={{ fontSize: 11, color: "#999" }}>px</span>
                    </div>
                  </div>
                  <input type="range" min={16} max={textMax} step={2}
                    value={cfg[field].size}
                    onChange={(e) => updateField(field, "size", parseInt(e.target.value))}
                    style={{ width: "100%", cursor: "pointer" }}
                  />
                  <AlignButtons field={field} />
                </div>
                );
              })}
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Size</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <input
                        type="number"
                        min={20}
                        max={isPrintFormat ? 600 : 200}
                        value={cfg.bandSize}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= 999) updateCfg("bandSize", val);
                        }}
                        style={{ width: 42, fontSize: 11, fontWeight: 700, color: "#555", border: "1px solid #ddd", borderRadius: 4, padding: "2px 4px", textAlign: "right", outline: "none" }}
                      />
                      <span style={{ fontSize: 11, color: "#999" }}>px</span>
                    </div>
                  </div>
                  <input type="range" min={20} max={isPrintFormat ? 600 : 200} step={2} value={cfg.bandSize}
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: cfg.showLogo ? 12 : 0 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: "#555" }}>BAND LOGO</div>
                  <div style={{ fontSize: 11, color: "#888" }}>{logoUrl ? "Tinted to text color" : "Upload on artist page"}</div>
                </div>
                <button onClick={() => updateCfg("showLogo", !cfg.showLogo)} disabled={!logoUrl}
                  style={{ width: 40, height: 22, borderRadius: 999, border: "none", cursor: logoUrl ? "pointer" : "not-allowed", background: cfg.showLogo ? "#111" : "#ddd", position: "relative", flexShrink: 0, opacity: logoUrl ? 1 : 0.4 }}>
                  <span style={{ position: "absolute", top: 2, left: cfg.showLogo ? 19 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </button>
              </div>
              {cfg.showLogo && logoUrl && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Size</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <input
                        type="number"
                        min={20}
                        max={isPrintFormat ? 1800 : 600}
                        value={cfg.logo?.size ?? 80}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          if (!isNaN(val) && val >= 1 && val <= 999) setConfigs(prev => ({
                            ...prev,
                            [activeFormat]: {
                              ...prev[activeFormat],
                              logo: { ...(prev[activeFormat].logo ?? { x: 0.5, y: 0.15, size: 80, align: "center" }), size: val },
                            },
                          }));
                        }}
                        style={{ width: 42, fontSize: 11, fontWeight: 700, color: "#555", border: "1px solid #ddd", borderRadius: 4, padding: "2px 4px", textAlign: "right", outline: "none" }}
                      />
                      <span style={{ fontSize: 11, color: "#999" }}>px</span>
                    </div>
                  </div>
                  <input type="range" min={20} max={isPrintFormat ? 1800 : 600} step={2} value={cfg.logo?.size ?? 80}
                    onChange={(e) => setConfigs(prev => ({
                      ...prev,
                      [activeFormat]: {
                        ...prev[activeFormat],
                        logo: { ...(prev[activeFormat].logo ?? { x: 0.5, y: 0.15, size: 80, align: "center" }), size: parseInt(e.target.value) },
                      },
                    }))}
                    style={{ width: "100%", cursor: "pointer" }}
                  />
                </div>
              )}
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
    </>
  );
}
