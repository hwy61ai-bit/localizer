"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/app/components/Toast";
import { renderPoster, formatDateForRender } from "@/lib/clientRender";
import "./template-editor.css";
import CropModal from "./CropModal";

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

type FieldKey = "date" | "venue" | "city" | "customText1" | "customText2";
type BaseFieldKey = "date" | "venue" | "city";
type FormatKey = "square" | "story" | "landscape" | "print" | "tiktok" | "yt_shorts";
type CropFormatKey = "square" | "story" | "landscape" | "print";
type Align = "left" | "center" | "right";

type FieldConfig = { x: number; y: number; size: number; align?: Align };

type FormatConfig = {
  fontFamily: string;
  textColor: string;
  bandTextColor?: string | null;
  showBandName: boolean;
  showVenue?: boolean;
  showCity?: boolean;
  showDate?: boolean;
  bandSize: number;
  shortDate?: boolean;
  allCaps?: boolean;
  showLogo?: boolean;
  logo?: FieldConfig;
  showSponsorLogo1?: boolean;
  sponsorLogo1?: FieldConfig;
  showSponsorLogo2?: boolean;
  sponsorLogo2?: FieldConfig;
  band?: FieldConfig;
  date: FieldConfig;
  venue: FieldConfig;
  city: FieldConfig;
  showCustomText1?: boolean;
  customText1?: FieldConfig;
  showCustomText2?: boolean;
  customText2?: FieldConfig;
};

type CropRegion = { x: number; y: number; w: number; h: number };
type CropConfig = Record<CropFormatKey, CropRegion>;

function isValidCropRegion(r: any): r is CropRegion {
  if (!r || typeof r !== "object") return false;
  const { x, y, w, h } = r;
  if (![x, y, w, h].every((n) => typeof n === "number" && Number.isFinite(n))) return false;
  if (w <= 0 || h <= 0 || x < 0 || y < 0) return false;
  if (x + w > 1.0001 || y + h > 1.0001) return false;
  return true;
}

function formatFraction(n: number): string {
  return n.toFixed(4);
}

function getFormatCrop(crop: CropConfig | null | undefined, format: FormatKey): CropRegion | null {
  if (!crop) return null;
  if (format === "tiktok" || format === "yt_shorts") return null;
  return crop[format] ?? null;
}

const DEFAULT_FORMAT: FormatConfig = {
  fontFamily: "Oswald",
  textColor: "ffffff",
  showBandName: false,
  showVenue: true,
  showCity: true,
  showDate: true,
  bandSize: 48,
  shortDate: true,
  allCaps: true,
  date:  { x: 0.5, y: 0.91, size: 28, align: "center" },
  venue: { x: 0.5, y: 0.76, size: 36, align: "center" },
  city:  { x: 0.5, y: 0.84, size: 28, align: "center" },
};

const PRINT_DEFAULTS: Partial<FormatConfig> = {
  showVenue: false,
  showCity: false,
  showDate: false,
};

function defaultShowField(formatKey: FormatKey): boolean {
  return formatKey !== "print";
}

const FORMATS: { key: FormatKey; label: string; w: number; h: number }[] = [
  { key: "square",    label: "IG Square",     w: 1080, h: 1080 },
  { key: "story",     label: "IG Story",      w: 1080, h: 1350 },
  { key: "landscape", label: "FB Cover",      w: 820,  h: 312 },
  { key: "print",     label: "LOCAL POSTER FOR PRINT", w: 3300, h: 5100 },
  { key: "tiktok",    label: "TikTok, IG Reels, FB Stories,\nYouTube Shorts",  w: 1080, h: 1920 },
  { key: "yt_shorts", label: "Square Video", w: 1080, h: 1080 },
];

const FIELD_LABELS: Record<FieldKey, string> = {
  venue: "Venue",
  date:  "Date",
  city:  "City",
  customText1: "Custom Text 1",
  customText2: "Custom Text 2",
};

const SAMPLE_TEXT: Record<FieldKey, string> = {
  venue: "Stubbs Waller Creek Amphitheater",
  date:  "April 25 2026",
  city:  "Little Rock, AR",
  customText1: "Your text here",
  customText2: "Your text here",
};

const BAND_DEFAULT: FieldConfig = { x: 0.5, y: 0.65, size: 80, align: "center" };
const SPONSOR_1_DEFAULT: FieldConfig = { x: 0.35, y: 0.88, size: 60, align: "center" };
const SPONSOR_2_DEFAULT: FieldConfig = { x: 0.65, y: 0.88, size: 60, align: "center" };
const CUSTOM_TEXT_1_DEFAULT: FieldConfig = { x: 0.5, y: 0.08, size: 48, align: "center" };
const CUSTOM_TEXT_2_DEFAULT: FieldConfig = { x: 0.5, y: 0.92, size: 48, align: "center" };

type Tour = {
  id: string;
  name: string;
  band_name: string | null;
  band_tour_label: string | null;
  band_font_family: string | null;
  image_url: string | null;
  image_print_id: string | null;
  image_square_id: string | null;
  image_story_id: string | null;
  image_landscape_id: string | null;
  video_tiktok_id: string | null;
  video_yt_shorts_id: string | null;
  overlay_config: Record<FormatKey, FormatConfig> | null;
  crop_config: CropConfig | null;
  custom_text_1?: string | null;
  custom_text_2?: string | null;
};

function getTransform(align: Align): string {
  if (align === "left")  return "translate(0, -50%)";
  if (align === "right") return "translate(-100%, -50%)";
  return "translate(-50%, -50%)";
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
    if (typeof document === "undefined") return 0;
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

  const router = useRouter();

  const [activeFormat, setActiveFormat] = useState<FormatKey>("square");
  const [configs, setConfigs] = useState<Record<FormatKey, FormatConfig>>({
    square:    { ...DEFAULT_FORMAT, ...saved0.square },
    story:     { ...DEFAULT_FORMAT, ...saved0.story },
    landscape: { ...DEFAULT_FORMAT, ...saved0.landscape },
    print:     { ...DEFAULT_FORMAT, ...PRINT_DEFAULTS, ...saved0.print },
    tiktok:    { ...DEFAULT_FORMAT, ...saved0.tiktok },
    yt_shorts: { ...DEFAULT_FORMAT, ...saved0.yt_shorts },
  });
  const [cropConfig, setCropConfig] = useState<CropConfig | null>(tour.crop_config);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropModalFormat, setCropModalFormat] = useState<CropFormatKey>("square");
  const [previewLongest, setPreviewLongest] = useState(false);
  const [dragging, setDragging] = useState<FieldKey | "band" | "logo" | "sponsorLogo1" | "sponsorLogo2" | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [containerWidth, setContainerWidth] = useState(700);
  const [customFonts, setCustomFonts] = useState<{ label: string; value: string }[]>([]);
  const [uploadingFont, setUploadingFont] = useState(false);
  const [isDraggingFont, setIsDraggingFont] = useState(false);
  const fontFileRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const SNAP = 0.04;  // ~4% snap zone for center alignment

  const [customText1, setCustomText1] = useState<string>(tour.custom_text_1 ?? "");
  const [customText2, setCustomText2] = useState<string>(tour.custom_text_2 ?? "");
  const customText1MountRef = useRef(true);
  const customText2MountRef = useRef(true);
  const [bandFontFamily, setBandFontFamily] = useState<string | null>(tour.band_font_family);
  const bandFontFamilyMountRef = useRef(true);
  const configsMountRef = useRef(true);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const toast = useToast();
  const { error: toastError } = toast;
  const [sponsorLogo1Url, setSponsorLogo1Url] = useState<string | null>(null);
  const [sponsorLogo2Url, setSponsorLogo2Url] = useState<string | null>(null);
  const [uploadingSponsor1, setUploadingSponsor1] = useState(false);
  const [uploadingSponsor2, setUploadingSponsor2] = useState(false);
  const sponsor1FileRef = useRef<HTMLInputElement>(null);
  const sponsor2FileRef = useRef<HTMLInputElement>(null);
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
      try {
        const sRes = await fetch(`/api/tours/${tourId}/sponsor-logo`);
        if (sRes.ok) {
          const sData = await sRes.json();
          setSponsorLogo1Url(sData.sponsorLogo1Url ?? null);
          setSponsorLogo2Url(sData.sponsorLogo2Url ?? null);
        }
      } catch (e) { console.error(e); }
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

  useEffect(() => {
    if (customText1MountRef.current) {
      customText1MountRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/tours/${tourId}/overlay-config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_text_1: customText1 || null }),
      })
        .then(res => { if (!res.ok) toastError("Custom text 1 save failed."); })
        .catch(() => toastError("Custom text 1 save failed — network error."));
    }, 500);
    return () => clearTimeout(timer);
  }, [customText1, tourId, toastError]);

  useEffect(() => {
    if (customText2MountRef.current) {
      customText2MountRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/tours/${tourId}/overlay-config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_text_2: customText2 || null }),
      })
        .then(res => { if (!res.ok) toastError("Custom text 2 save failed."); })
        .catch(() => toastError("Custom text 2 save failed — network error."));
    }, 500);
    return () => clearTimeout(timer);
  }, [customText2, tourId, toastError]);

  useEffect(() => {
    if (bandFontFamilyMountRef.current) {
      bandFontFamilyMountRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/tours/${tourId}/overlay-config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ band_font_family: bandFontFamily }),
      })
        .then(res => { if (!res.ok) toastError("Band font save failed."); })
        .catch(() => toastError("Band font save failed — network error."));
    }, 500);
    return () => clearTimeout(timer);
  }, [bandFontFamily, tourId, toastError]);

  useEffect(() => {
    if (configsMountRef.current) {
      configsMountRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/tours/${tourId}/overlay-config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ overlay_config: configs }),
      })
        .then(res => { if (!res.ok) toastError("Layout save failed."); })
        .catch(() => toastError("Layout save failed — network error."));
    }, 500);
    return () => clearTimeout(timer);
  }, [configs, tourId, toastError]);

  const bandName = tour.band_name ?? tour.name ?? "Artist";

  const [formatImageIds, setFormatImageIds] = useState<Record<FormatKey, string | null>>({
    square:    tour.image_square_id,
    story:     tour.image_story_id,
    landscape: tour.image_landscape_id,
    print:     tour.image_print_id,
    tiktok:    tour.video_tiktok_id ?? null,
    yt_shorts: tour.video_yt_shorts_id ?? null,
  });

  useEffect(() => {
    let cancelled = false;
    async function refetchImageIds() {
      const { data } = await supabase
        .from("tours")
        .select("image_square_id, image_story_id, image_landscape_id, image_print_id, video_tiktok_id, video_yt_shorts_id")
        .eq("id", tourId)
        .maybeSingle();
      if (cancelled || !data) return;
      setFormatImageIds({
        square:    data.image_square_id,
        story:     data.image_story_id,
        landscape: data.image_landscape_id,
        print:     data.image_print_id,
        tiktok:    data.video_tiktok_id ?? null,
        yt_shorts: data.video_yt_shorts_id ?? null,
      });
    }
    refetchImageIds();
    function onVisible() {
      if (document.visibilityState === "visible") refetchImageIds();
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [tourId]);

  const cfg = configs[activeFormat];
  const publicId = formatImageIds[activeFormat];
  const fmtDims = FORMATS.find(f => f.key === activeFormat)!;
  const isVideoFormat = activeFormat === "tiktok" || activeFormat === "yt_shorts";
  const isPrintFormat = activeFormat === "print";
  const previewCrop = getFormatCrop(cropConfig, activeFormat);
  const previewBaseLayer = isValidCropRegion(previewCrop)
    ? `c_crop,x_${formatFraction(previewCrop.x)},y_${formatFraction(previewCrop.y)},w_${formatFraction(previewCrop.w)},h_${formatFraction(previewCrop.h)}/c_fill,w_${fmtDims.w},h_${fmtDims.h}`
    : `c_fill,g_center,w_${fmtDims.w},h_${fmtDims.h}`;
  const imageUrl = publicId
    ? isVideoFormat
      ? `https://res.cloudinary.com/${cloudName}/video/upload/c_fill,g_center,w_${fmtDims.w},h_${fmtDims.h},so_0/${publicId}.jpg`
      : `https://res.cloudinary.com/${cloudName}/image/upload/${previewBaseLayer}/${publicId}`
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
    if (!bandFontFamily) return;
    // Don't re-add the link if this font is already a custom font (loaded via document.fonts)
    if (customFonts.some(f => f.value === bandFontFamily)) return;
    const fontName = bandFontFamily.replace(/ /g, "+");
    const id = `gfont-${fontName}`;
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${fontName}:wght@400;700&display=swap`;
      document.head.appendChild(link);
    }
  }, [bandFontFamily, customFonts]);

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
        setConfigs(prev => ({
          ...prev,
          [activeFormat]: {
            ...prev[activeFormat],
            logo: { ...(prev[activeFormat].logo ?? { x: 0.5, y: 0.15, size: 80, align: "center" }), x, y },
          },
        }));
      } else if (dragging === "sponsorLogo1") {
        setConfigs(prev => ({
          ...prev,
          [activeFormat]: {
            ...prev[activeFormat],
            sponsorLogo1: { ...(prev[activeFormat].sponsorLogo1 ?? SPONSOR_1_DEFAULT), x, y },
          },
        }));
      } else if (dragging === "sponsorLogo2") {
        setConfigs(prev => ({
          ...prev,
          [activeFormat]: {
            ...prev[activeFormat],
            sponsorLogo2: { ...(prev[activeFormat].sponsorLogo2 ?? SPONSOR_2_DEFAULT), x, y },
          },
        }));
      } else if (dragging === "band") {
        setConfigs(prev => ({
          ...prev,
          [activeFormat]: {
            ...prev[activeFormat],
            band: { ...(prev[activeFormat].band ?? BAND_DEFAULT), x, y },
          },
        }));
      } else if (dragging === "customText1") {
        setConfigs(prev => ({
          ...prev,
          [activeFormat]: {
            ...prev[activeFormat],
            customText1: { ...(prev[activeFormat].customText1 ?? CUSTOM_TEXT_1_DEFAULT), x, y },
          },
        }));
      } else if (dragging === "customText2") {
        setConfigs(prev => ({
          ...prev,
          [activeFormat]: {
            ...prev[activeFormat],
            customText2: { ...(prev[activeFormat].customText2 ?? CUSTOM_TEXT_2_DEFAULT), x, y },
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
  }

  function updateCfg(key: keyof FormatConfig, value: any) {
    setConfigs(prev => ({
      ...prev,
      [activeFormat]: { ...prev[activeFormat], [key]: value },
    }));
  }

  async function handleCropSave(region: CropRegion) {
    const next = { ...(cropConfig ?? {}), [cropModalFormat]: region } as CropConfig;
    const res = await fetch(`/api/tours/${tourId}/overlay-config`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ crop_config: next }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error ?? "Failed to save crop");
    }
    setCropConfig(next);
    router.refresh();
  }

  async function handleCropReset() {
    const next = { ...(cropConfig ?? {}) } as Partial<Record<CropFormatKey, CropRegion>>;
    delete next[cropModalFormat];
    const isEmpty = Object.keys(next).length === 0;
    const body = isEmpty ? { crop_config: null } : { crop_config: next };
    const res = await fetch(`/api/tours/${tourId}/overlay-config`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error ?? "Failed to reset crop");
    }
    setCropConfig(isEmpty ? null : (next as CropConfig));
    router.refresh();
  }

  function AlignButtons({ field }: { field: BaseFieldKey | "band" | "customText1" | "customText2" }) {
    const fc = field === "band"
      ? (cfg.band ?? BAND_DEFAULT)
      : field === "customText1"
        ? (cfg.customText1 ?? CUSTOM_TEXT_1_DEFAULT)
        : field === "customText2"
          ? (cfg.customText2 ?? CUSTOM_TEXT_2_DEFAULT)
          : cfg[field];
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
      } else if (field === "customText1") {
        setConfigs(prev => ({
          ...prev,
          [activeFormat]: {
            ...prev[activeFormat],
            customText1: { ...(prev[activeFormat].customText1 ?? CUSTOM_TEXT_1_DEFAULT), align: a },
          },
        }));
      } else if (field === "customText2") {
        setConfigs(prev => ({
          ...prev,
          [activeFormat]: {
            ...prev[activeFormat],
            customText2: { ...(prev[activeFormat].customText2 ?? CUSTOM_TEXT_2_DEFAULT), align: a },
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
            style={{ flex: 1, padding: "4px 0", borderRadius: 0, border: "3px solid", borderColor: current === a ? "var(--hw-border-strong)" : "var(--hw-border)", background: current === a ? "var(--hw-bg-invert)" : "var(--hw-bg-surface)", color: current === a ? "#fff" : "var(--hw-text-muted)", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
            {a === "left" ? "⬅" : a === "center" ? "↔" : "➡"}
          </button>
        ))}
      </div>
    );
  }

  async function processFontFile(file: File) {
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

    if (!confirmed) return;

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
    }
  }

  async function handleFontUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await processFontFile(file);
    } finally {
      if (fontFileRef.current) fontFileRef.current.value = "";
    }
  }

  async function handleFontDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDraggingFont(false);
    if (uploadingFont) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFontFile(file);
  }

  async function handleSponsorLogoUpload(slot: 1 | 2, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".png")) {
      toast.error("Custom graphic must be a PNG file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Custom graphic must be under 5MB");
      return;
    }
    const setUploading = slot === 1 ? setUploadingSponsor1 : setUploadingSponsor2;
    const setUrl = slot === 1 ? setSponsorLogo1Url : setSponsorLogo2Url;
    const fileRef = slot === 1 ? sponsor1FileRef : sponsor2FileRef;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/tours/${tourId}/sponsor-logo?slot=${slot}`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error);
      }
      const data = await res.json();
      setUrl(data.url);
      updateCfg(slot === 1 ? "showSponsorLogo1" : "showSponsorLogo2", true);
      toast.success(`Custom graphic ${slot} uploaded`);
    } catch (err: any) {
      console.error("Sponsor logo upload failed:", err);
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSponsorLogoDelete(slot: 1 | 2) {
    if (!window.confirm(`Remove custom graphic ${slot}? It will be deleted from all formats.`)) return;
    const setUrl = slot === 1 ? setSponsorLogo1Url : setSponsorLogo2Url;
    try {
      const res = await fetch(`/api/tours/${tourId}/sponsor-logo?slot=${slot}`, { method: "DELETE" });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error);
      }
      setUrl(null);
      updateCfg(slot === 1 ? "showSponsorLogo1" : "showSponsorLogo2", false);
      toast.success(`Custom graphic ${slot} removed`);
    } catch (err: any) {
      console.error("Sponsor logo delete failed:", err);
      toast.error(`Delete failed: ${err.message}`);
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
    <div className="fade-in template-editor-content" style={{ minHeight: "100vh", padding: 32 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "3px solid var(--hw-border-strong)" }}>
          <Link href={`/dashboard/tours/${tourId}`} style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-muted)", textDecoration: "none", display: "inline-block", marginBottom: 8 }}>&larr; BACK TO TOUR</Link>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "inline-block" }}>
                <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 28, letterSpacing: "4px", color: "var(--hw-crimson)", lineHeight: 1, marginBottom: 4, paddingBottom: 8 }}>LOCALIZER</div>
                <div style={{ borderBottom: "3px solid var(--hw-border-strong)", marginBottom: 6 }} />
              </div>
              <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 48, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text)" }}>DESIGN TEMPLATE</div>
            </div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 8 }}>
              <Link href={`/dashboard/tours/${tourId}/import`} style={{ padding: "10px 18px", border: "3px solid transparent", background: "var(--hw-bg-surface)", color: "var(--hw-text)", textDecoration: "none", fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, letterSpacing: "1.5px", textTransform: "uppercase" }}>1. IMPORT SCHEDULE</Link>
              <Link href={`/dashboard/tours/${tourId}/assets`} style={{ padding: "10px 18px", border: "3px solid transparent", background: "var(--hw-bg-surface)", color: "var(--hw-text)", textDecoration: "none", fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, letterSpacing: "1.5px", textTransform: "uppercase" }}>2. IMPORT ASSETS</Link>
              <Link href={`/dashboard/tours/${tourId}/template`} style={{ padding: "10px 18px", border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-invert)", color: "#fff", textDecoration: "none", fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" }}>3. DESIGN TEMPLATE</Link>
              <Link href={`/dashboard/tours/${tourId}`} style={{ padding: "10px 18px", border: "3px solid transparent", background: "var(--hw-bg-surface)", color: "var(--hw-text)", textDecoration: "none", fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, letterSpacing: "1.5px", textTransform: "uppercase" }}>4. GIGS</Link>
            </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {FORMATS.map(f => (
              <button key={f.key} onClick={() => { setActiveFormat(f.key); }}
                style={{ padding: "8px 16px", whiteSpace: "pre-line", border: activeFormat === f.key ? "3px solid var(--hw-border-strong)" : "3px solid var(--hw-border)", background: activeFormat === f.key ? "var(--hw-bg-invert)" : "var(--hw-bg-surface)", color: activeFormat === f.key ? "#fff" : "var(--hw-text)", fontFamily: "var(--hw-font-mono)", fontWeight: activeFormat === f.key ? 700 : 400, fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", cursor: "pointer", transition: "var(--hw-ease)" }}>
                {f.label}
                {getFormatCrop(cropConfig, f.key) ? <span style={{ color: "var(--hw-crimson)", marginLeft: 6 }}>•</span> : null}
              </button>
            ))}
          </div>
          {activeFormat === "square" && (
            <button
              onClick={() => {
                const confirmed = window.confirm(
                  "The feature helps you maintain the same fonts and color schemes for your other photo and video assets.\n\n" +
                  "Apply Square's settings to all other formats?\n\n" +
                  "This will overwrite each format's current band, venue, city, date, and custom text — sizes, positions, alignments, fonts, and colors — with Square's settings.\n\n" +
                  "Sizes will scale proportionally to each format's canvas height. Show/hide toggles and image-format-specific settings will not be affected.\n\n" +
                  "This cannot be undone."
                );
                if (!confirmed) return;
                const sourceCfg = configs.square;
                const sourceH = 1080; // Square is 1080×1080
                setConfigs(prev => {
                  const updated: typeof prev = { ...prev };
                  const targets: FormatKey[] = ["story", "landscape", "print", "tiktok", "yt_shorts"];
                  for (const fmt of targets) {
                    const targetH = FORMATS.find(f => f.key === fmt)!.h;
                    const scale = targetH / sourceH;
                    const scaleSize = (n: number) => Math.max(12, Math.round(n * scale));
                    const scaleField = (f: typeof sourceCfg.venue) => ({ ...f, size: scaleSize(f.size) });
                    const merged: typeof prev[FormatKey] = {
                      ...prev[fmt],
                      // Copy format-wide styling
                      fontFamily: sourceCfg.fontFamily,
                      textColor: sourceCfg.textColor,
                      bandTextColor: sourceCfg.bandTextColor ?? null,
                      allCaps: sourceCfg.allCaps,
                      shortDate: sourceCfg.shortDate,
                      bandSize: scaleSize(sourceCfg.bandSize),
                      // Copy positioned text fields with proportional sizing
                      venue: scaleField(sourceCfg.venue),
                      city: scaleField(sourceCfg.city),
                      date: scaleField(sourceCfg.date),
                    };
                    if (sourceCfg.band) merged.band = scaleField(sourceCfg.band);
                    if (sourceCfg.customText1) merged.customText1 = scaleField(sourceCfg.customText1);
                    if (sourceCfg.customText2) merged.customText2 = scaleField(sourceCfg.customText2);
                    updated[fmt] = merged;
                  }
                  return updated;
                });
                toast.success("Square layout applied to 5 formats.");
              }}
              style={{
                padding: "8px 16px",
                marginRight: 96,
                border: "3px solid var(--hw-crimson)",
                background: "var(--hw-bg-surface)",
                color: "var(--hw-crimson)",
                fontFamily: "var(--hw-font-mono)",
                fontWeight: 700,
                fontSize: 10,
                letterSpacing: "1.5px",
                textTransform: "uppercase" as const,
                cursor: "pointer",
                transition: "var(--hw-ease)",
                lineHeight: 1.3,
                textAlign: "left" as const,
              }}
            >
              SET ALL FORMATS TO MATCH SQUARE
              <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 9, fontWeight: 400, color: "var(--hw-text-muted)", letterSpacing: "0.5px", textTransform: "none" as const, marginTop: 2 }}>
                Overwrites layout, fonts, and colors
              </div>
            </button>
          )}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <div style={{ fontSize: 22, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-crimson)", fontFamily: "var(--hw-font-display)", border: "3px solid var(--hw-crimson)", padding: "6px 12px" }}>
              Everything autosaves.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {isPrintFormat && <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "1px", color: "var(--hw-text-muted)", padding: "10px 0" }}>PRINT POSTER GENERATES AS PDF FROM THE VENUE DOWNLOAD PAGE.</div>}
              {!isVideoFormat && !isPrintFormat && <button
                  onClick={async () => {
                    const pid = formatImageIds[activeFormat];
                    if (!pid) { toast.error('No image uploaded for this format.'); return; }
                    const fd: Record<string, { w: number; h: number }> = {
                      square: { w: 1080, h: 1080 }, story: { w: 1080, h: 1350 },
                      landscape: { w: 820, h: 312 }, tiktok: { w: 1080, h: 1920 }, yt_shorts: { w: 1080, h: 1080 },
                    };
                    const dims = fd[activeFormat] ?? fd.square;
                    const renderCrop = getFormatCrop(cropConfig, activeFormat);
                    const renderBaseLayer = isValidCropRegion(renderCrop)
                      ? 'c_crop,x_' + formatFraction(renderCrop.x) + ',y_' + formatFraction(renderCrop.y) + ',w_' + formatFraction(renderCrop.w) + ',h_' + formatFraction(renderCrop.h) + '/c_fill,w_' + dims.w + ',h_' + dims.h
                      : 'c_fill,g_center,w_' + dims.w + ',h_' + dims.h;
                    const baseUrl = 'https://res.cloudinary.com/' + cloudName + '/image/upload/' + renderBaseLayer + '/' + pid;
                    const shortDate = cfg.shortDate ?? false;
                    const ed = firstEvent ? {
                      bandName: bandName,
                      dateFormatted: formatDateForRender(firstEvent.date_iso, shortDate),
                      venueName: firstEvent.venue,
                      cityState: [firstEvent.city, firstEvent.state].filter(Boolean).join(', '),
                      customText1: customText1 || null,
                      customText2: customText2 || null,
                    } : {
                      bandName: bandName,
                      dateFormatted: shortDate ? 'APR 26TH' : 'April 25 2026',
                      venueName: 'Stubbs Waller Creek Amphitheater',
                      cityState: 'Little Rock, AR',
                      customText1: customText1 || null,
                      customText2: customText2 || null,
                    };
                    try {
                      const blob = await renderPoster(baseUrl, cfg, activeFormat, ed, logoUrl, sponsorLogo1Url, sponsorLogo2Url, bandFontFamily);
                      const url = URL.createObjectURL(blob);
                      window.open(url, '_blank');
                    } catch (err: any) {
                      toast.error('Render failed: ' + err.message);
                      console.error(err);
                    }
                  }}
                  style={{ padding: "8px 20px", border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", color: "var(--hw-text)", fontFamily: "var(--hw-font-display)", fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer", transition: "var(--hw-ease)" }}
                >PREVIEW RENDER</button>}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24, alignItems: "start" }}>

          <div style={{ position: "sticky", top: 16, alignSelf: "start", maxHeight: "calc(100vh - 32px)", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
              <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text-muted)" }}>DRAG TEXT TO POSITION — SNAPS TO CENTER</div>
              <button onClick={() => setPreviewLongest(!previewLongest)}
                style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", padding: "8px 16px", border: previewLongest ? "2px solid var(--hw-crimson)" : "2px solid var(--hw-border-strong)", background: previewLongest ? "var(--hw-red-ghost)" : "var(--hw-bg-invert)", color: previewLongest ? "var(--hw-crimson)" : "#fff", cursor: "pointer", transition: "var(--hw-ease)" }}>
                {previewLongest ? "SHOWING LONGEST NAMES" : "PREVIEW LONGEST NAMES"}
              </button>
              {activeFormat !== "tiktok" && activeFormat !== "yt_shorts" && (() => {
                const activeCrop = getFormatCrop(cropConfig, activeFormat);
                const hasCrop = !!activeCrop;
                const hasImage = !!formatImageIds[activeFormat];
                return (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, marginLeft: "auto" }}>
                    <button
                      onClick={() => {
                        if (!hasImage) return;
                        setCropModalFormat(activeFormat as CropFormatKey);
                        setCropModalOpen(true);
                      }}
                      disabled={!hasImage}
                      style={{ padding: "8px 16px", border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", color: hasImage ? "var(--hw-text)" : "var(--hw-text-muted)", fontFamily: "var(--hw-font-mono)", fontWeight: 700, fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", cursor: hasImage ? "pointer" : "not-allowed", opacity: hasImage ? 1 : 0.5, transition: "var(--hw-ease)" }}
                    >
                      Crop Image
                    </button>
                    <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: hasCrop ? "var(--hw-crimson)" : "var(--hw-text-muted)", fontWeight: hasCrop ? 700 : 400 }}>
                      {hasCrop ? "✓ Custom crop" : "Default center"}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", overflow: "hidden" }}>
              {imageUrl ? (
                <>
                <div ref={containerRef} style={{ position: "relative", userSelect: "none", cursor: dragging ? "grabbing" : "default", width: `${Math.round(fmtDims.w * previewScale)}px`, margin: "0 auto" }}>
                  <img ref={imgRef} src={imageUrl} alt="Base" style={{ width: "100%", display: "block" }} />

                  {dragging && (
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 18 }}
                    >
                      {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95].map((p) => (
                        <line
                          key={`v${p}`}
                          x1={p}
                          y1={0}
                          x2={p}
                          y2={100}
                          stroke="rgba(220,60,60,0.9)"
                          strokeWidth={0.5}
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}
                      {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95].map((p) => (
                        <line
                          key={`h${p}`}
                          x1={0}
                          y1={p}
                          x2={100}
                          y2={p}
                          stroke="rgba(220,60,60,0.9)"
                          strokeWidth={0.5}
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}
                    </svg>
                  )}
                  {dragging && (
                    <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 0, borderLeft: "1px dashed rgba(255,255,255,0.9)", pointerEvents: "none", zIndex: 20 }} />
                  )}
                  {(["venue", "city", "date"] as BaseFieldKey[]).flatMap(a =>
                    (["venue", "city", "date"] as BaseFieldKey[]).filter(b => b !== a && Math.abs(cfg[a].y - cfg[b].y) < 0.025).map(b => (
                      <div key={a + b} style={{ position: "absolute", top: `${cfg[a].y * 100}%`, left: 0, right: 0, height: 0, borderTop: "1px dashed rgba(255,220,0,0.8)", pointerEvents: "none", zIndex: 19 }} />
                    ))
                  )}

                  {activeFormat === "tiktok" && (
                    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2 }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "15%", background: "repeating-linear-gradient(45deg, var(--hw-amber-ghost) 0px, var(--hw-amber-ghost) 8px, transparent 8px, transparent 16px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "var(--hw-amber)", fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>Social UI overlay zone</span>
                      </div>
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "25%", background: "repeating-linear-gradient(45deg, var(--hw-amber-ghost) 0px, var(--hw-amber-ghost) 8px, transparent 8px, transparent 16px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ color: "var(--hw-amber)", fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>Social UI overlay zone</span>
                      </div>
                    </div>
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
                        style={{ position: "absolute", left: `${fc.x * 100}%`, top: `${fc.y * 100}%`, transform: getTransform(align), cursor: "grab", fontFamily: "'" + (bandFontFamily ?? cfg.fontFamily) + "', sans-serif", fontSize: `${Math.round(cfg.bandSize * previewScale)}px`, fontWeight: 700, color: `#${cfg.bandTextColor ?? cfg.textColor}`, whiteSpace: "nowrap", outline: dragging === "band" ? "2px solid rgba(255,220,0,0.9)" : "none", outlineOffset: 4, padding: "2px 6px", borderRadius: 3, zIndex: dragging === "band" ? 10 : 5 }}>
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

                  {!isPrintFormat && cfg.showLogo && logoUrl && (() => {
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

                  {!isPrintFormat && (cfg.showSponsorLogo1 ?? false) && sponsorLogo1Url && (() => {
                    const sc = cfg.sponsorLogo1 ?? SPONSOR_1_DEFAULT;
                    return (
                      <div key="sponsorLogo1"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const rect = (imgRef.current ?? containerRef.current)!.getBoundingClientRect();
                          const mouseX = (e.clientX - rect.left) / rect.width;
                          const mouseY = (e.clientY - rect.top) / rect.height;
                          setDragOffset({ x: mouseX - sc.x, y: mouseY - sc.y });
                          setDragging("sponsorLogo1");
                        }}
                        style={{ position: "absolute", left: `${sc.x * 100}%`, top: `${sc.y * 100}%`, transform: "translate(-50%, -50%)", width: `${Math.round(sc.size * previewScale)}px`, cursor: "move", pointerEvents: "auto", userSelect: "none", zIndex: 7 }}>
                        {isVideoFormat ? (
                          <img src={sponsorLogo1Url} style={{ width: "100%", height: "auto", display: "block", pointerEvents: "none" }} alt="" />
                        ) : (
                          <>
                            <img src={sponsorLogo1Url} style={{ width: "100%", height: "auto", display: "block", visibility: "hidden" }} alt="" />
                            <div style={{ position: "absolute", inset: 0, backgroundColor: `#${cfg.textColor}`, WebkitMaskImage: `url(${sponsorLogo1Url})`, WebkitMaskSize: "contain", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "center", maskImage: `url(${sponsorLogo1Url})`, maskSize: "contain", maskRepeat: "no-repeat", maskPosition: "center", pointerEvents: "none" }} />
                          </>
                        )}
                      </div>
                    );
                  })()}

                  {!isPrintFormat && (cfg.showSponsorLogo2 ?? false) && sponsorLogo2Url && (() => {
                    const sc = cfg.sponsorLogo2 ?? SPONSOR_2_DEFAULT;
                    return (
                      <div key="sponsorLogo2"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const rect = (imgRef.current ?? containerRef.current)!.getBoundingClientRect();
                          const mouseX = (e.clientX - rect.left) / rect.width;
                          const mouseY = (e.clientY - rect.top) / rect.height;
                          setDragOffset({ x: mouseX - sc.x, y: mouseY - sc.y });
                          setDragging("sponsorLogo2");
                        }}
                        style={{ position: "absolute", left: `${sc.x * 100}%`, top: `${sc.y * 100}%`, transform: "translate(-50%, -50%)", width: `${Math.round(sc.size * previewScale)}px`, cursor: "move", pointerEvents: "auto", userSelect: "none", zIndex: 7 }}>
                        {isVideoFormat ? (
                          <img src={sponsorLogo2Url} style={{ width: "100%", height: "auto", display: "block", pointerEvents: "none" }} alt="" />
                        ) : (
                          <>
                            <img src={sponsorLogo2Url} style={{ width: "100%", height: "auto", display: "block", visibility: "hidden" }} alt="" />
                            <div style={{ position: "absolute", inset: 0, backgroundColor: `#${cfg.textColor}`, WebkitMaskImage: `url(${sponsorLogo2Url})`, WebkitMaskSize: "contain", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "center", maskImage: `url(${sponsorLogo2Url})`, maskSize: "contain", maskRepeat: "no-repeat", maskPosition: "center", pointerEvents: "none" }} />
                          </>
                        )}
                      </div>
                    );
                  })()}

                  {(["venue", "city", "date"] as BaseFieldKey[]).map(field => {
                    const fc = cfg[field];
                    const align = fc.align ?? "center";
                    const isActive = dragging === field;
                    const visKey = `show${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof FormatConfig;
                    if ((cfg[visKey] ?? true) === false) return null;

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
                          field === "date" ? (() => { try { const d = new Date(firstEvent.date_iso + "T12:00:00"); if (cfg.shortDate) { const ord = (n: number) => n >= 11 && n <= 13 ? "TH" : [,"ST","ND","RD"][n%10] || "TH"; return `${["JAN","FEB","MARCH","APRIL","MAY","JUNE","JULY","AUG","SEPT","OCT","NOV","DEC"][d.getMonth()]} ${d.getDate()}${ord(d.getDate())}`; } return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); } catch { return firstEvent.date_iso; } })() :
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
                  {!isPrintFormat && (cfg.showCustomText1 ?? false) && (() => {
                    const fc = cfg.customText1 ?? CUSTOM_TEXT_1_DEFAULT;
                    const align = fc.align ?? "center";
                    const isActive = dragging === "customText1";
                    return (
                      <div key="customText1" onMouseDown={(e) => {
                        e.preventDefault();
                        const rect = (imgRef.current ?? containerRef.current)!.getBoundingClientRect();
                        const mouseX = (e.clientX - rect.left) / rect.width;
                        const mouseY = (e.clientY - rect.top) / rect.height;
                        setDragOffset({ x: mouseX - fc.x, y: mouseY - fc.y });
                        setDragging("customText1");
                      }}
                        style={{ position: "absolute", left: `${fc.x * 100}%`, top: `${fc.y * 100}%`, transform: getTransform(align), cursor: "grab", fontFamily: "'" + cfg.fontFamily + "', sans-serif", fontSize: `${Math.round(fc.size * previewScale)}px`, fontWeight: 700, color: `#${cfg.textColor}`, whiteSpace: "nowrap", textAlign: "center", outline: isActive ? "2px solid rgba(255,220,0,0.9)" : "none", outlineOffset: 4, padding: "2px 6px", borderRadius: 3, zIndex: isActive ? 10 : 5, pointerEvents: "all" }}>
                        {customText1 || SAMPLE_TEXT.customText1}
                      </div>
                    );
                  })()}
                  {!isPrintFormat && (cfg.showCustomText2 ?? false) && (() => {
                    const fc = cfg.customText2 ?? CUSTOM_TEXT_2_DEFAULT;
                    const align = fc.align ?? "center";
                    const isActive = dragging === "customText2";
                    return (
                      <div key="customText2" onMouseDown={(e) => {
                        e.preventDefault();
                        const rect = (imgRef.current ?? containerRef.current)!.getBoundingClientRect();
                        const mouseX = (e.clientX - rect.left) / rect.width;
                        const mouseY = (e.clientY - rect.top) / rect.height;
                        setDragOffset({ x: mouseX - fc.x, y: mouseY - fc.y });
                        setDragging("customText2");
                      }}
                        style={{ position: "absolute", left: `${fc.x * 100}%`, top: `${fc.y * 100}%`, transform: getTransform(align), cursor: "grab", fontFamily: "'" + cfg.fontFamily + "', sans-serif", fontSize: `${Math.round(fc.size * previewScale)}px`, fontWeight: 700, color: `#${cfg.textColor}`, whiteSpace: "nowrap", textAlign: "center", outline: isActive ? "2px solid rgba(255,220,0,0.9)" : "none", outlineOffset: 4, padding: "2px 6px", borderRadius: 3, zIndex: isActive ? 10 : 5, pointerEvents: "all" }}>
                        {customText2 || SAMPLE_TEXT.customText2}
                      </div>
                    );
                  })()}
                </div>
                {activeFormat === "tiktok" && (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: "var(--hw-amber-ghost)", border: "1px solid var(--hw-amber)", borderRadius: 0, fontSize: 12, lineHeight: 1.4, color: "var(--hw-text)" }}>
                    Social apps often overlay their UI in these zones. Keep important content in the center 60% for best results.
                  </div>
                )}
                </>
              ) : (
                <div style={{ padding: 48, textAlign: "center" }}>
                  {isVideoFormat ? (
                    <>
                      <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text)", marginBottom: 12 }}>NOT UPLOADED YET</div>
                      <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-text-muted)", marginBottom: 16 }}>Upload a {activeFormat === "tiktok" ? "TikTok/Reels" : "YouTube Shorts"} video to configure this format.</div>
                      <Link href={`/dashboard/tours/${tourId}/assets`} style={{ color: "var(--hw-crimson)", fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 700 }}>→ IMPORT ASSETS</Link>
                    </>
                  ) : (
                    <>
                      <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-text-muted)", marginBottom: 12 }}>No image uploaded for this format yet.</div>
                      <Link href={`/dashboard/tours/${tourId}/assets`} style={{ color: "var(--hw-crimson)", fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: 700 }}>→ IMPORT ASSETS</Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 16 }}>
              <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" as const, color: "var(--hw-text-muted)", marginBottom: 10 }}>FONT</div>
              <input
                ref={fontFileRef}
                type="file"
                accept=".ttf,.otf"
                style={{ display: "none" }}
                onChange={handleFontUpload}
              />
              <button
                onClick={() => fontFileRef.current?.click()}
                onDragEnter={(e) => { e.preventDefault(); if (!uploadingFont) setIsDraggingFont(true); }}
                onDragOver={(e) => { e.preventDefault(); }}
                onDragLeave={() => setIsDraggingFont(false)}
                onDrop={handleFontDrop}
                disabled={uploadingFont}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: isDraggingFont ? "2px dashed var(--hw-crimson)" : "2px dashed var(--hw-border-light)",
                  background: "var(--hw-bg-surface)",
                  color: "var(--hw-crimson)",
                  fontFamily: "var(--hw-font-mono)",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase" as const,
                  cursor: uploadingFont ? "not-allowed" : "pointer",
                  textAlign: "center" as const,
                  marginBottom: 8,
                }}
              >
                {uploadingFont ? "Uploading..." : isDraggingFont ? "Drop font here" : "+ Upload Custom Font (.ttf / .otf)"}
              </button>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 240, overflowY: "auto" }}>
                {customFonts.length > 0 && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" as const, color: "var(--hw-text)" }}>CUSTOM FONTS</div>
                    </div>
                    {customFonts.map(f => (
                      <div key={f.value} style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => updateCfg("fontFamily", f.value)}
                          style={{ flex: 1, padding: "8px 12px", border: cfg.fontFamily === f.value ? "2px solid var(--hw-border-strong)" : "2px solid var(--hw-border)", background: cfg.fontFamily === f.value ? "var(--hw-bg-invert)" : "var(--hw-bg-surface)", color: cfg.fontFamily === f.value ? "#fff" : "var(--hw-text)", fontFamily: "var(--hw-font-body)", fontWeight: 500, fontSize: 12, cursor: "pointer", textAlign: "left" }}>
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
                          style={{ padding: "8px 8px", border: "2px solid var(--hw-crimson)", background: "var(--hw-bg-surface)", color: "var(--hw-crimson)", fontWeight: 700, fontSize: 11, cursor: "pointer", flexShrink: 0 }}>
                          ✕
                        </button>
                      </div>
                    ))}
                    <div style={{ borderBottom: "2px solid var(--hw-border)", marginTop: 4, marginBottom: 4 }} />
                  </>
                )}
                {FONTS.map(f => (
                  <button key={f.value} onClick={() => updateCfg("fontFamily", f.value)}
                    style={{ padding: "8px 12px", border: cfg.fontFamily === f.value ? "2px solid var(--hw-border-strong)" : "2px solid var(--hw-border)", background: cfg.fontFamily === f.value ? "var(--hw-bg-invert)" : "var(--hw-bg-surface)", color: cfg.fontFamily === f.value ? "#fff" : "var(--hw-text)", fontFamily: "var(--hw-font-body)", fontWeight: 500, fontSize: 12, cursor: "pointer", textAlign: "left" }}>
                    {f.label}
                  </button>
                ))}


              </div>
            </div>

            <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 16 }}>
              <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" as const, color: "var(--hw-text-muted)", marginBottom: 12 }}>TEXT SIZES & ALIGNMENT</div>
              {(["venue", "city", "date"] as BaseFieldKey[]).map(field => {
                const textMax = isPrintFormat ? 400 : 120;
                return (
                <div key={field} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "1px", color: "var(--hw-text)" }}>{FIELD_LABELS[field]}</span>
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
                        style={{ width: 44, fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, color: "var(--hw-text)", border: "2px solid var(--hw-border-strong)", padding: "2px 4px", textAlign: "right" as const, outline: "none" }}
                      />
                      <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, color: "var(--hw-text-muted)" }}>px</span>
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

            <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: cfg.showBandName ? 12 : 0 }}>
                <span onClick={() => updateCfg("showBandName", !cfg.showBandName)} style={{ width: 16, height: 16, border: "2px solid var(--hw-border-strong)", background: cfg.showBandName ? "var(--hw-crimson)" : "var(--hw-bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                  {cfg.showBandName && <svg width="10" height="8" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2.5" strokeLinecap="square" /></svg>}
                </span>
                <div>
                  <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", color: "var(--hw-text)" }}>Band Name</div>
                  <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 11, fontWeight: 300, color: "var(--hw-text-muted)" }}>If not baked into image</div>
                </div>
              </label>
              {cfg.showBandName && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "1px", color: "var(--hw-text)" }}>Size</span>
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
                        style={{ width: 44, fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, color: "var(--hw-text)", border: "2px solid var(--hw-border-strong)", padding: "2px 4px", textAlign: "right" as const, outline: "none" }}
                      />
                      <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, color: "var(--hw-text-muted)" }}>px</span>
                    </div>
                  </div>
                  <input type="range" min={20} max={isPrintFormat ? 600 : 200} step={2} value={cfg.bandSize}
                    onChange={(e) => updateCfg("bandSize", parseInt(e.target.value))}
                    style={{ width: "100%", cursor: "pointer" }}
                  />
                  <div style={{ marginTop: 10 }}>
                    <span style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "1px", color: "var(--hw-text)" }}>Alignment</span>
                    <AlignButtons field="band" />
                  </div>

                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "2px solid var(--hw-border-light)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "1px", color: "var(--hw-text)" }}>Font</span>
                      {bandFontFamily && (
                        <button
                          onClick={() => setBandFontFamily(null)}
                          style={{ fontFamily: "var(--hw-font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "1px", color: "var(--hw-text-muted)", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
                        >
                          RESET
                        </button>
                      )}
                    </div>
                    <select
                      value={bandFontFamily ?? ""}
                      onChange={(e) => setBandFontFamily(e.target.value || null)}
                      style={{ width: "100%", padding: "8px 10px", border: "2px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", color: "var(--hw-text)", fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, cursor: "pointer", outline: "none" }}
                    >
                      <option value="">(Use format font: {cfg.fontFamily})</option>
                      <optgroup label="Standard">
                        {FONTS.map(f => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </optgroup>
                      {customFonts.length > 0 && (
                        <optgroup label="Custom">
                          {customFonts.map(f => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "1px", color: "var(--hw-text)" }}>Color</span>
                      {cfg.bandTextColor && (
                        <button
                          onClick={() => {
                            setConfigs(prev => ({ ...prev, [activeFormat]: { ...prev[activeFormat], bandTextColor: null } }));
                          }}
                          style={{ fontFamily: "var(--hw-font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "1px", color: "var(--hw-text-muted)", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
                        >
                          RESET
                        </button>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input
                        type="color"
                        value={`#${cfg.bandTextColor ?? cfg.textColor}`}
                        onChange={(e) => {
                          const next = e.target.value.replace("#", "");
                          setConfigs(prev => ({ ...prev, [activeFormat]: { ...prev[activeFormat], bandTextColor: next } }));
                        }}
                        style={{ width: 40, height: 32, borderRadius: 0, border: "3px solid var(--hw-border-strong)", cursor: "pointer", padding: 2 }}
                      />
                      <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, color: "var(--hw-text-muted)" }}>
                        {cfg.bandTextColor ? `#${cfg.bandTextColor}` : `(Format color: #${cfg.textColor})`}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <span onClick={() => updateCfg("showVenue", !(cfg.showVenue ?? defaultShowField(activeFormat)))} style={{ width: 16, height: 16, border: "2px solid var(--hw-border-strong)", background: (cfg.showVenue ?? defaultShowField(activeFormat)) ? "var(--hw-crimson)" : "var(--hw-bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                  {(cfg.showVenue ?? defaultShowField(activeFormat)) && <svg width="10" height="8" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2.5" strokeLinecap="square" /></svg>}
                </span>
                <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", color: "var(--hw-text)" }}>Venue</div>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <span onClick={() => updateCfg("showCity", !(cfg.showCity ?? defaultShowField(activeFormat)))} style={{ width: 16, height: 16, border: "2px solid var(--hw-border-strong)", background: (cfg.showCity ?? defaultShowField(activeFormat)) ? "var(--hw-crimson)" : "var(--hw-bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                  {(cfg.showCity ?? defaultShowField(activeFormat)) && <svg width="10" height="8" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2.5" strokeLinecap="square" /></svg>}
                </span>
                <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", color: "var(--hw-text)" }}>City</div>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <span onClick={() => updateCfg("showDate", !(cfg.showDate ?? defaultShowField(activeFormat)))} style={{ width: 16, height: 16, border: "2px solid var(--hw-border-strong)", background: (cfg.showDate ?? defaultShowField(activeFormat)) ? "var(--hw-crimson)" : "var(--hw-bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                  {(cfg.showDate ?? defaultShowField(activeFormat)) && <svg width="10" height="8" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2.5" strokeLinecap="square" /></svg>}
                </span>
                <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", color: "var(--hw-text)" }}>Date</div>
              </label>
            </div>

            <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" as const, color: "var(--hw-text)" }}>TEXT COLOR</div>
                  <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 11, fontWeight: 300, color: "var(--hw-text-muted)" }}>Applies to all fields</div>
                </div>
                <input type="color" value={`#${cfg.textColor}`}
                  onChange={(e) => updateCfg("textColor", e.target.value.replace("#", ""))}
                  style={{ width: 40, height: 32, borderRadius: 0, border: "3px solid var(--hw-border-strong)", cursor: "pointer", padding: 2 }}
                />
              </div>
            </div>

            {!isPrintFormat && (
              <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: logoUrl ? "pointer" : "not-allowed", opacity: logoUrl ? 1 : 0.4, marginBottom: cfg.showLogo ? 12 : 0 }}>
                  <span onClick={() => logoUrl && updateCfg("showLogo", !cfg.showLogo)} style={{ width: 16, height: 16, border: "2px solid var(--hw-border-strong)", background: cfg.showLogo ? "var(--hw-crimson)" : "var(--hw-bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: logoUrl ? "pointer" : "not-allowed" }}>
                    {cfg.showLogo && <svg width="10" height="8" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2.5" strokeLinecap="square" /></svg>}
                  </span>
                  <div>
                    <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", color: "var(--hw-text)" }}>Band Logo</div>
                    <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 11, fontWeight: 300, color: "var(--hw-text-muted)" }}>{logoUrl ? "Tinted to text color" : "Upload on artist page"}</div>
                  </div>
                </label>
                {cfg.showLogo && logoUrl && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <span style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "1px", color: "var(--hw-text)" }}>Size</span>
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
                          style={{ width: 44, fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, color: "var(--hw-text)", border: "2px solid var(--hw-border-strong)", padding: "2px 4px", textAlign: "right" as const, outline: "none" }}
                        />
                        <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, color: "var(--hw-text-muted)" }}>px</span>
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
            )}

            {!isPrintFormat && (
              <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 16 }}>
                <input ref={sponsor1FileRef} type="file" accept=".png" style={{ display: "none" }} onChange={(e) => handleSponsorLogoUpload(1, e)} />
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: (cfg.showSponsorLogo1 ?? false) && sponsorLogo1Url ? 12 : 0 }}>
                  <span onClick={() => {
                    if (!sponsorLogo1Url) { sponsor1FileRef.current?.click(); return; }
                    updateCfg("showSponsorLogo1", !(cfg.showSponsorLogo1 ?? false));
                  }} style={{ width: 16, height: 16, border: "2px solid var(--hw-border-strong)", background: (cfg.showSponsorLogo1 ?? false) ? "var(--hw-crimson)" : "var(--hw-bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                    {(cfg.showSponsorLogo1 ?? false) && <svg width="10" height="8" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2.5" strokeLinecap="square" /></svg>}
                  </span>
                  <div>
                    <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", color: "var(--hw-text)" }}>Custom Graphic 1</div>
                    <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 11, fontWeight: 300, color: "var(--hw-text-muted)" }}>{sponsorLogo1Url ? "Renders in text color on all assets. On the Local Poster PDF, renders in the graphic's uploaded color." : uploadingSponsor1 ? "Uploading..." : "Click to upload a .png"}</div>
                  </div>
                </label>
                {(cfg.showSponsorLogo1 ?? false) && sponsorLogo1Url && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <img src={sponsorLogo1Url} alt="Custom Graphic 1" style={{ width: 60, height: 60, objectFit: "contain", background: "repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 12px 12px", border: "2px solid var(--hw-border)" }} />
                      <button onClick={() => sponsor1FileRef.current?.click()} style={{ padding: "6px 10px", border: "2px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", color: "var(--hw-text)", fontFamily: "var(--hw-font-body)", fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, cursor: "pointer" }}>REPLACE</button>
                      <button onClick={() => handleSponsorLogoDelete(1)} style={{ padding: "6px 10px", border: "2px solid var(--hw-crimson)", background: "var(--hw-bg-surface)", color: "var(--hw-crimson)", fontFamily: "var(--hw-font-body)", fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, cursor: "pointer" }}>DELETE</button>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                        <span style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "1px", color: "var(--hw-text)" }}>Size</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <input type="number" min={20} max={isPrintFormat ? 1800 : 400} value={cfg.sponsorLogo1?.size ?? 60}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val >= 1 && val <= 9999) setConfigs(prev => ({
                                ...prev,
                                [activeFormat]: {
                                  ...prev[activeFormat],
                                  sponsorLogo1: { ...(prev[activeFormat].sponsorLogo1 ?? SPONSOR_1_DEFAULT), size: val },
                                },
                              }));
                            }}
                            style={{ width: 44, fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, color: "var(--hw-text)", border: "2px solid var(--hw-border-strong)", padding: "2px 4px", textAlign: "right" as const, outline: "none" }}
                          />
                          <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, color: "var(--hw-text-muted)" }}>px</span>
                        </div>
                      </div>
                      <input type="range" min={20} max={isPrintFormat ? 1800 : 400} step={2} value={cfg.sponsorLogo1?.size ?? 60}
                        onChange={(e) => setConfigs(prev => ({
                          ...prev,
                          [activeFormat]: {
                            ...prev[activeFormat],
                            sponsorLogo1: { ...(prev[activeFormat].sponsorLogo1 ?? SPONSOR_1_DEFAULT), size: parseInt(e.target.value) },
                          },
                        }))}
                        style={{ width: "100%", cursor: "pointer" }}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {!isPrintFormat && (
              <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 16 }}>
                <input ref={sponsor2FileRef} type="file" accept=".png" style={{ display: "none" }} onChange={(e) => handleSponsorLogoUpload(2, e)} />
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: (cfg.showSponsorLogo2 ?? false) && sponsorLogo2Url ? 12 : 0 }}>
                  <span onClick={() => {
                    if (!sponsorLogo2Url) { sponsor2FileRef.current?.click(); return; }
                    updateCfg("showSponsorLogo2", !(cfg.showSponsorLogo2 ?? false));
                  }} style={{ width: 16, height: 16, border: "2px solid var(--hw-border-strong)", background: (cfg.showSponsorLogo2 ?? false) ? "var(--hw-crimson)" : "var(--hw-bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                    {(cfg.showSponsorLogo2 ?? false) && <svg width="10" height="8" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2.5" strokeLinecap="square" /></svg>}
                  </span>
                  <div>
                    <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", color: "var(--hw-text)" }}>Custom Graphic 2</div>
                    <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 11, fontWeight: 300, color: "var(--hw-text-muted)" }}>{sponsorLogo2Url ? "Renders in text color on all assets. On the Local Poster PDF, renders in the graphic's uploaded color." : uploadingSponsor2 ? "Uploading..." : "Click to upload a .png"}</div>
                  </div>
                </label>
                {(cfg.showSponsorLogo2 ?? false) && sponsorLogo2Url && (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <img src={sponsorLogo2Url} alt="Custom Graphic 2" style={{ width: 60, height: 60, objectFit: "contain", background: "repeating-conic-gradient(#808080 0% 25%, transparent 0% 50%) 50% / 12px 12px", border: "2px solid var(--hw-border)" }} />
                      <button onClick={() => sponsor2FileRef.current?.click()} style={{ padding: "6px 10px", border: "2px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", color: "var(--hw-text)", fontFamily: "var(--hw-font-body)", fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, cursor: "pointer" }}>REPLACE</button>
                      <button onClick={() => handleSponsorLogoDelete(2)} style={{ padding: "6px 10px", border: "2px solid var(--hw-crimson)", background: "var(--hw-bg-surface)", color: "var(--hw-crimson)", fontFamily: "var(--hw-font-body)", fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, cursor: "pointer" }}>DELETE</button>
                    </div>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                        <span style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "1px", color: "var(--hw-text)" }}>Size</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                          <input type="number" min={20} max={isPrintFormat ? 1800 : 400} value={cfg.sponsorLogo2?.size ?? 60}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val >= 1 && val <= 9999) setConfigs(prev => ({
                                ...prev,
                                [activeFormat]: {
                                  ...prev[activeFormat],
                                  sponsorLogo2: { ...(prev[activeFormat].sponsorLogo2 ?? SPONSOR_2_DEFAULT), size: val },
                                },
                              }));
                            }}
                            style={{ width: 44, fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, color: "var(--hw-text)", border: "2px solid var(--hw-border-strong)", padding: "2px 4px", textAlign: "right" as const, outline: "none" }}
                          />
                          <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, color: "var(--hw-text-muted)" }}>px</span>
                        </div>
                      </div>
                      <input type="range" min={20} max={isPrintFormat ? 1800 : 400} step={2} value={cfg.sponsorLogo2?.size ?? 60}
                        onChange={(e) => setConfigs(prev => ({
                          ...prev,
                          [activeFormat]: {
                            ...prev[activeFormat],
                            sponsorLogo2: { ...(prev[activeFormat].sponsorLogo2 ?? SPONSOR_2_DEFAULT), size: parseInt(e.target.value) },
                          },
                        }))}
                        style={{ width: "100%", cursor: "pointer" }}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {!isPrintFormat && (
              <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: (cfg.showCustomText1 ?? false) ? 12 : 0 }}>
                  <span onClick={() => updateCfg("showCustomText1", !(cfg.showCustomText1 ?? false))} style={{ width: 16, height: 16, border: "2px solid var(--hw-border-strong)", background: (cfg.showCustomText1 ?? false) ? "var(--hw-crimson)" : "var(--hw-bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                    {(cfg.showCustomText1 ?? false) && <svg width="10" height="8" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2.5" strokeLinecap="square" /></svg>}
                  </span>
                  <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", color: "var(--hw-text)" }}>Custom Text 1</div>
                </label>
                {(cfg.showCustomText1 ?? false) && (
                  <>
                    <input
                      type="text"
                      maxLength={60}
                      placeholder="Your text here..."
                      value={customText1}
                      onChange={(e) => setCustomText1(e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "3px solid var(--hw-border-strong)", fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 500, outline: "none", marginBottom: 12 }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <span style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "1px", color: "var(--hw-text)" }}>Size</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <input
                          type="number"
                          min={16}
                          max={isPrintFormat ? 400 : 120}
                          value={cfg.customText1?.size ?? CUSTOM_TEXT_1_DEFAULT.size}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val >= 1 && val <= 999) {
                              setConfigs(prev => ({
                                ...prev,
                                [activeFormat]: {
                                  ...prev[activeFormat],
                                  customText1: { ...(prev[activeFormat].customText1 ?? CUSTOM_TEXT_1_DEFAULT), size: val },
                                },
                              }));
                            }
                          }}
                          style={{ width: 44, fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, color: "var(--hw-text)", border: "2px solid var(--hw-border-strong)", padding: "2px 4px", textAlign: "right" as const, outline: "none" }}
                        />
                        <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, color: "var(--hw-text-muted)" }}>px</span>
                      </div>
                    </div>
                    <input type="range" min={16} max={isPrintFormat ? 400 : 120} step={2}
                      value={cfg.customText1?.size ?? CUSTOM_TEXT_1_DEFAULT.size}
                      onChange={(e) => {
                        setConfigs(prev => ({
                          ...prev,
                          [activeFormat]: {
                            ...prev[activeFormat],
                            customText1: { ...(prev[activeFormat].customText1 ?? CUSTOM_TEXT_1_DEFAULT), size: parseInt(e.target.value) },
                          },
                        }));
                      }}
                      style={{ width: "100%", cursor: "pointer" }}
                    />
                    <AlignButtons field="customText1" />
                  </>
                )}
              </div>
            )}

            {!isPrintFormat && (
              <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: (cfg.showCustomText2 ?? false) ? 12 : 0 }}>
                  <span onClick={() => updateCfg("showCustomText2", !(cfg.showCustomText2 ?? false))} style={{ width: 16, height: 16, border: "2px solid var(--hw-border-strong)", background: (cfg.showCustomText2 ?? false) ? "var(--hw-crimson)" : "var(--hw-bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                    {(cfg.showCustomText2 ?? false) && <svg width="10" height="8" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2.5" strokeLinecap="square" /></svg>}
                  </span>
                  <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", color: "var(--hw-text)" }}>Custom Text 2</div>
                </label>
                {(cfg.showCustomText2 ?? false) && (
                  <>
                    <input
                      type="text"
                      maxLength={60}
                      placeholder="Your text here..."
                      value={customText2}
                      onChange={(e) => setCustomText2(e.target.value)}
                      style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "3px solid var(--hw-border-strong)", fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 500, outline: "none", marginBottom: 12 }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                      <span style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: "1px", color: "var(--hw-text)" }}>Size</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <input
                          type="number"
                          min={16}
                          max={isPrintFormat ? 400 : 120}
                          value={cfg.customText2?.size ?? CUSTOM_TEXT_2_DEFAULT.size}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val >= 1 && val <= 999) {
                              setConfigs(prev => ({
                                ...prev,
                                [activeFormat]: {
                                  ...prev[activeFormat],
                                  customText2: { ...(prev[activeFormat].customText2 ?? CUSTOM_TEXT_2_DEFAULT), size: val },
                                },
                              }));
                            }
                          }}
                          style={{ width: 44, fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, color: "var(--hw-text)", border: "2px solid var(--hw-border-strong)", padding: "2px 4px", textAlign: "right" as const, outline: "none" }}
                        />
                        <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, color: "var(--hw-text-muted)" }}>px</span>
                      </div>
                    </div>
                    <input type="range" min={16} max={isPrintFormat ? 400 : 120} step={2}
                      value={cfg.customText2?.size ?? CUSTOM_TEXT_2_DEFAULT.size}
                      onChange={(e) => {
                        setConfigs(prev => ({
                          ...prev,
                          [activeFormat]: {
                            ...prev[activeFormat],
                            customText2: { ...(prev[activeFormat].customText2 ?? CUSTOM_TEXT_2_DEFAULT), size: parseInt(e.target.value) },
                          },
                        }));
                      }}
                      style={{ width: "100%", cursor: "pointer" }}
                    />
                    <AlignButtons field="customText2" />
                  </>
                )}
              </div>
            )}

            <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <span onClick={() => updateCfg("shortDate", !cfg.shortDate)} style={{ width: 16, height: 16, border: "2px solid var(--hw-border-strong)", background: cfg.shortDate ? "var(--hw-crimson)" : "var(--hw-bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                  {cfg.shortDate && <svg width="10" height="8" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2.5" strokeLinecap="square" /></svg>}
                </span>
                <div>
                  <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", color: "var(--hw-text)" }}>Short Date Format</div>
                  <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 11, fontWeight: 300, color: "var(--hw-text-muted)" }}>e.g. JUN 26TH</div>
                </div>
              </label>
            </div>

            <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                <span onClick={() => updateCfg("allCaps", !cfg.allCaps)} style={{ width: 16, height: 16, border: "2px solid var(--hw-border-strong)", background: cfg.allCaps ? "var(--hw-crimson)" : "var(--hw-bg-surface)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                  {cfg.allCaps && <svg width="10" height="8" viewBox="0 0 12 10" fill="none"><path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2.5" strokeLinecap="square" /></svg>}
                </span>
                <div>
                  <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", color: "var(--hw-text)" }}>All Caps</div>
                  <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 11, fontWeight: 300, color: "var(--hw-text-muted)" }}>Venue, city &amp; state in uppercase</div>
                </div>
              </label>
            </div>

          </div>
        </div>
      </div>
    </div>
    <CropModal
      isOpen={cropModalOpen}
      onClose={() => setCropModalOpen(false)}
      imageUrl={formatImageIds[cropModalFormat] ? `https://res.cloudinary.com/${cloudName}/image/upload/${formatImageIds[cropModalFormat]}` : ""}
      format={cropModalFormat}
      formatLabel={(() => {
        const f = FORMATS.find(x => x.key === cropModalFormat)!;
        return `${f.label} (${f.w}×${f.h})`;
      })()}
      aspect={(() => {
        const f = FORMATS.find(x => x.key === cropModalFormat)!;
        return f.w / f.h;
      })()}
      initialCrop={getFormatCrop(cropConfig, cropModalFormat)}
      onSave={handleCropSave}
      onReset={handleCropReset}
    />
    </>
  );
}
