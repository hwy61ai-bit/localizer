"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { TourPageNav } from "../TourPageNav";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/app/components/Toast";
import "@/app/dashboard/assets.css";

const FORMATS = [
  { id: "ig_post",     label: "Instagram Post / Facebook Post",        w: 1080, h: 1080, aspect: "1 / 1",     section: "photo", sub: "SQUARE" },
  { id: "ig_story",    label: "Instagram Story / Reels / Facebook Story",        w: 1080, h: 1350, aspect: "4 / 5",     section: "photo", sub: "VERTICAL" },
  { id: "facebook",    label: "Facebook Cover Image",  w: 820,  h: 312,  aspect: "820 / 312", section: "photo", sub: "LANDSCAPE" },
  { id: "print", label: "Local Poster For Print (PDF)", w: 3300, h: 5100, aspect: "3300 / 5100", section: "photo", sub: "11×17 / 300 DPI" },
  { id: "yt_shorts",   label: "Square Video — 1080 × 1080",  w: 1080, h: 1080, aspect: "1 / 1",   section: "video", sub: "SQUARE VIDEO" },
  { id: "tiktok",      label: "TikTok, IG Reels, FB Stories, YouTube Shorts — 1080 × 1920",  w: 1080, h: 1920, aspect: "9 / 16",   section: "video", sub: "VERTICAL VIDEO" },
];

export default function AssetsPage() {
  const params = useParams();
  const tourId = params.tourId as string;
  const router = useRouter();
  const toast = useToast();
  const [assets, setAssets] = useState<{ formatId: string; url: string }[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState<{ [key: string]: number }>({});
  const fileRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const initialLoadDone = useRef(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [tipsDismissed, setTipsDismissed] = useState(false);

  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  useEffect(() => {
    if (localStorage.getItem("hw61.uploadTipsDismissed")) {
      setTipsDismissed(true);
    }
  }, []);

  const dismissTips = () => {
    localStorage.setItem("hw61.uploadTipsDismissed", "true");
    setTipsDismissed(true);
  };

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    async function loadExisting() {
      const { data } = await supabase
        .from("tours")
        .select("image_url, image_square_id, image_story_id, image_landscape_id, image_print_id, video_tiktok_id, video_yt_shorts_id")
        .eq("id", tourId)
        .single();
      if (!data) return;
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const base = `https://res.cloudinary.com/${cloudName}/image/upload/`;
      const loaded: { formatId: string; url: string }[] = [];
      if (data.image_square_id) loaded.push({ formatId: "ig_post", url: `${base}${data.image_square_id}` });
      if (data.image_story_id) loaded.push({ formatId: "ig_story", url: `${base}${data.image_story_id}` });
      if (data.image_landscape_id) loaded.push({ formatId: "facebook", url: `${base}${data.image_landscape_id}` });
      if (data.image_print_id) loaded.push({ formatId: "print", url: `${base}${data.image_print_id}` });
      const videoBase = `https://res.cloudinary.com/${cloudName}/video/upload/`;
      if (data.video_tiktok_id) loaded.push({ formatId: "tiktok", url: `${videoBase}${data.video_tiktok_id}` });
      if (data.video_yt_shorts_id) loaded.push({ formatId: "yt_shorts", url: `${videoBase}${data.video_yt_shorts_id}` });
      if (loaded.length) setAssets(loaded);
    }
    loadExisting();
  }, [tourId]);

  const FORMAT_DB_COLS: Record<string, string> = {
    ig_post: "image_square_id",
    ig_story: "image_story_id",
    facebook: "image_landscape_id",
    print: "image_print_id",
    tiktok: "video_tiktok_id",
    yt_shorts: "video_yt_shorts_id",
  };

  const FORMAT_CROP_KEY: Record<string, "square" | "story" | "landscape" | "print" | null> = {
    ig_post: "square",
    ig_story: "story",
    facebook: "landscape",
    print: "print",
    tiktok: null,
    yt_shorts: null,
  };

  async function clearCropForFormat(formatId: string) {
    const cropKey = FORMAT_CROP_KEY[formatId];
    if (!cropKey) return;
    try {
      const { data, error } = await supabase
        .from("tours")
        .select("crop_config")
        .eq("id", tourId)
        .single();
      if (error || !data?.crop_config) return;
      const current = data.crop_config as Record<string, unknown>;
      if (!(cropKey in current)) return;
      const next = { ...current };
      delete next[cropKey];
      const isEmpty = Object.keys(next).length === 0;
      const body = isEmpty ? { crop_config: null } : { crop_config: next };
      const res = await fetch(`/api/tours/${tourId}/overlay-config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        console.error("Failed to clear crop_config for", cropKey, json?.error);
      }
    } catch (err) {
      console.error("Error clearing crop_config for", cropKey, err);
    }
  }

  async function handleDeleteAsset(formatId: string) {
    if (!confirm("Delete this asset?")) return;
    try {
      const col = FORMAT_DB_COLS[formatId];
      if (!col) return;
      await supabase.from("tours").update({ [col]: null }).eq("id", tourId);
      router.refresh();
      setAssets(prev => prev.filter(a => a.formatId !== formatId));
      void clearCropForFormat(formatId);
    } catch (err: any) {
      console.error(err);
      toast.error("Delete failed: " + err.message);
    }
  }

  async function handleUpload(formatId: string, file: File) {
    const maxSize = formatId.startsWith("tiktok") || formatId.startsWith("yt") ? 100 : 20;
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File is too large. Max ${maxSize}MB.`);
      return;
    }
    setUploading(formatId);
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const isVideo = formatId === "tiktok" || formatId === "yt_shorts";
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", "localizer_tours");
      fd.append("public_id", `tour_${tourId}_${formatId}_${Date.now()}`);

      let result: any;

      if (isVideo) {
        result = await new Promise<any>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`);
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setVideoProgress(prev => ({ ...prev, [formatId]: percent }));
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(JSON.parse(xhr.responseText));
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.onabort = () => reject(new Error("Upload aborted"));
          xhr.send(fd);
        });
      } else {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: fd,
        });
        result = await res.json();
      }

      if (result.error) throw new Error(result.error.message);
      // Save public_id to DB
      await fetch(`/api/tours/${tourId}/upload-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id: result.public_id, formatId }),
      });
      setAssets((prev) => [...prev.filter((a) => a.formatId !== formatId), { formatId, url: result.secure_url }]);
      void clearCropForFormat(formatId);
    } catch (err) {
      console.error(err);
      toast.error("Upload failed.");
    } finally {
      setUploading(null);
      setVideoProgress(prev => { const next = { ...prev }; delete next[formatId]; return next; });
    }
  }

  function renderFormatGrid(section: "photo" | "video", accept: string, hint?: string) {
    return FORMATS.filter((f) => f.section === section).map((fmt) => {
      const asset = assets.find((a) => a.formatId === fmt.id);
      const isUploading = uploading === fmt.id;
      return (
        <div key={fmt.id}>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px", color: "var(--hw-text)" }}>{(fmt as any).sub} {fmt.w} × {fmt.h}</div>
            <div style={{ height: 1, background: "var(--hw-border-strong)", margin: "6px 0" }} />
            <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, color: "var(--hw-text-muted)", marginTop: 3, letterSpacing: "1.5px", textTransform: "uppercase" }}>{fmt.label}</div>
            {fmt.id === "print" && <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, color: "var(--hw-amber)", marginTop: 3 }}>Recommended: 3300×5100px or higher resolution</div>}
          </div>
          <input
            ref={(el) => { fileRefs.current[fmt.id] = el; }}
            type="file" accept={accept} style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(fmt.id, f); }}
          />
          <div
            onClick={() => !asset && fileRefs.current[fmt.id]?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverId(fmt.id); }}
            onDragLeave={() => setDragOverId(null)}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOverId(null);
              const file = e.dataTransfer.files?.[0];
              if (file) handleUpload(fmt.id, file);
            }}
            style={{
              aspectRatio: fmt.aspect, background: "var(--hw-bg-surface)",
              border: dragOverId === fmt.id ? "3px solid var(--hw-crimson)" : asset ? "3px solid var(--hw-border-strong)" : "3px dashed var(--hw-border-light)",
              overflow: "hidden", position: "relative",
              cursor: asset ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "var(--hw-ease)",
            }}
            onMouseEnter={(e) => { if (!asset) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--hw-border-strong)"; }}
            onMouseLeave={(e) => { if (!asset) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--hw-border-light)"; setDragOverId(null); }}
          >
            {asset ? (
              <>
                {(fmt.id === "tiktok" || fmt.id === "yt_shorts") ? (
                  <video src={asset.url} controls style={{ width: "100%", height: "auto", display: "block" }} />
                ) : (
                  <img src={asset.url} alt={fmt.label} style={{ width: "100%", height: "auto", display: "block" }} />
                )}
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, opacity: 0, transition: "opacity 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={(e) => { e.stopPropagation(); fileRefs.current[fmt.id]?.click(); }}
                      style={{ padding: "5px 12px", border: "2px solid rgba(255,255,255,0.3)", background: "transparent", color: "#fff", fontFamily: "var(--hw-font-mono)", fontWeight: 700, fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", cursor: "pointer" }}>
                      REPLACE
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteAsset(fmt.id); }}
                      style={{ padding: "5px 12px", border: "2px solid var(--hw-crimson)", background: "transparent", color: "var(--hw-crimson)", fontFamily: "var(--hw-font-mono)", fontWeight: 700, fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", cursor: "pointer" }}>
                      DELETE
                    </button>
                  </div>
                </div>
              </>
            ) : isUploading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", pointerEvents: "none" }}>
                {(fmt.id === "tiktok" || fmt.id === "yt_shorts") ? (() => {
                  const percent = videoProgress[fmt.id] ?? 0;
                  return (
                    <>
                      <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, color: "var(--hw-text-muted)", letterSpacing: "1.5px", textTransform: "uppercase" }}>UPLOADING</div>
                      <div style={{ width: "70%", height: 24, border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", position: "relative", overflow: "hidden" }}>
                        <div style={{ position: "absolute", inset: 0, width: `${percent}%`, background: "var(--hw-crimson)", transition: "width 0.15s linear" }} />
                      </div>
                      <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 700, color: "var(--hw-text-muted)", marginTop: 8 }}>{percent}%</div>
                    </>
                  );
                })() : (
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-text-muted)", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" }}>UPLOADING...</div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", pointerEvents: "none" }}>
                <div style={{ fontSize: 22, color: "var(--hw-text-muted)", marginBottom: 8, opacity: 0.4 }}>&#8593;</div>
                <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, fontWeight: 700, color: "var(--hw-text-muted)", textTransform: "uppercase", letterSpacing: "1.5px" }}>UPLOAD</div>
                <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, color: "var(--hw-text-muted)", marginTop: 4, letterSpacing: "1px" }}>or drag and drop</div>
                {hint && (() => {
                  const [formats, ...rest] = hint.split(" · ");
                  const sizeLimit = rest.join(" · ");
                  return (
                    <>
                      <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, color: "var(--hw-text-muted)", marginTop: 6, opacity: 0.8 }}>{formats}</div>
                      {sizeLimit && (
                        <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 700, color: "var(--hw-text-muted)", marginTop: 4, letterSpacing: "0.5px" }}>{sizeLimit}</div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      );
    });
  }

  return (
    <div className="fade-in" style={{ minHeight: "100vh", color: "var(--hw-text)" }}>
      <div className="assets-page-header" style={{ padding: "24px 28px", borderBottom: "3px solid var(--hw-border-strong)", maxWidth: 1100, margin: "0 auto" }}>
        <Link href={`/dashboard/tours/${tourId}`} style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-muted)", textDecoration: "none", display: "inline-block", marginBottom: 8 }}>&larr; BACK TO TOUR</Link>
        <div className="assets-page-header-inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "inline-block" }}>
              <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 28, letterSpacing: "4px", color: "var(--hw-crimson)", lineHeight: 1, marginBottom: 4, paddingBottom: 8 }}>LOCALIZER</div>
              <div style={{ borderBottom: "3px solid var(--hw-border-strong)", marginBottom: 6 }} />
            </div>
            <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 48, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text)" }}>IMPORT ASSETS</div>
          </div>
          <TourPageNav tourId={tourId} active="assets" />
        </div>
      </div>
      <div className="assets-page-body" style={{ padding: "36px 28px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-text-secondary)", marginBottom: 16 }}>
          Upload one master photo per format.
        </div>
        {!tipsDismissed && (
          <div style={{ marginBottom: 32, padding: "16px 20px", background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 400, color: "var(--hw-blue)", letterSpacing: "4px", textTransform: "uppercase" }}>UPLOAD TIPS</div>
              <button onClick={dismissTips} style={{ background: "none", border: "none", padding: "4px 8px", color: "var(--hw-text-muted)", cursor: "pointer", fontFamily: "var(--hw-font-display)", fontSize: 18, lineHeight: 1 }} aria-label="Dismiss tips">×</button>
            </div>
            <div className="assets-tips-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, color: "var(--hw-text)", marginBottom: 4 }}>Match Dimensions</div>
                <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 13, fontWeight: 300, color: "var(--hw-text-muted)", lineHeight: 1.6 }}>Upload at the exact size shown below each format for best results.</div>
              </div>
              <div>
                <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, color: "var(--hw-text)", marginBottom: 4 }}>Aspect Ratio</div>
                <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 13, fontWeight: 300, color: "var(--hw-text-muted)", lineHeight: 1.6 }}>Images are cropped to fit. Matching the aspect ratio avoids unexpected cropping.</div>
              </div>
              <div>
                <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 500, color: "var(--hw-text)", marginBottom: 4 }}>High Resolution</div>
                <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 13, fontWeight: 300, color: "var(--hw-text-muted)", lineHeight: 1.6 }}>Use files at least 1080px wide for sharp, professional output.</div>
              </div>
            </div>
          </div>
        )}
        <div className="assets-section-label" style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text)", marginBottom: 16 }}>PHOTOS</div>
        <div className="assets-format-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 28, marginBottom: 48 }}>
          {renderFormatGrid("photo", "image/*", "PNG, JPG, WEBP · up to 20MB")}
        </div>
        <div className="assets-section-label" style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text)", marginBottom: 16 }}>VIDEO</div>
        <div className="assets-format-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 28 }}>
          {renderFormatGrid("video", "video/*,image/*", "MP4, MOV, WEBM · up to 100MB")}
        </div>
      </div>
    </div>
  );
}