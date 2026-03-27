"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/app/components/Toast";

const FORMATS = [
  { id: "ig_post",     label: "Instagram Post / Facebook Post",        w: 1080, h: 1080, aspect: "1 / 1",     section: "photo", sub: "SQUARE" },
  { id: "ig_story",    label: "Instagram Story / Reels / Facebook Story",        w: 1080, h: 1350, aspect: "4 / 5",     section: "photo", sub: "PORTRAIT" },
  { id: "facebook",    label: "Facebook Cover Image",  w: 820,  h: 312,  aspect: "820 / 312", section: "photo", sub: "LANDSCAPE" },
  { id: "print", label: "Local Poster For Print (PDF)", w: 3300, h: 5100, aspect: "3300 / 5100", section: "photo", sub: "11×17 / 300 DPI" },
  { id: "tiktok",      label: "Instagram Reels / TikTok",  w: 1080, h: 1920, aspect: "9 / 16",   section: "video", sub: "VERTICAL" },
  { id: "yt_shorts",   label: "YouTube Shorts / FB Stories",  w: 1080, h: 1920, aspect: "9 / 16",   section: "video", sub: "VERTICAL" },
];

export default function AssetsPage() {
  const params = useParams();
  const tourId = params.tourId as string;
  const toast = useToast();
  const [assets, setAssets] = useState<{ formatId: string; url: string }[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const initialLoadDone = useRef(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

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

  async function handleDeleteAsset(formatId: string) {
    if (!confirm("Delete this asset?")) return;
    try {
      const col = FORMAT_DB_COLS[formatId];
      if (!col) return;
      await supabase.from("tours").update({ [col]: null }).eq("id", tourId);
      setAssets(prev => prev.filter(a => a.formatId !== formatId));
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
      // All photo formats upload directly to Cloudinary
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const isVideo = formatId === "tiktok" || formatId === "yt_shorts";
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", "localizer_tours");
      fd.append("public_id", `tour_${tourId}_${formatId}_${Date.now()}`);
      const resourceType = isVideo ? "video" : "image";
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
        method: "POST",
        body: fd,
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error.message);
      // Save public_id to DB
      await fetch(`/api/tours/${tourId}/upload-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id: result.public_id, formatId }),
      });
      setAssets((prev) => [...prev.filter((a) => a.formatId !== formatId), { formatId, url: result.secure_url }]);
    } catch (err) {
      console.error(err);
      toast.error("Upload failed.");
    } finally {
      setUploading(null);
    }
  }

  function renderFormatGrid(section: string, accept: string) {
    return FORMATS.filter((f) => f.section === section).map((fmt) => {
      const asset = assets.find((a) => a.formatId === fmt.id);
      const isUploading = uploading === fmt.id;
      return (
        <div key={fmt.id}>
          <div style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "#888", marginBottom: 10 }}>
            {fmt.label}
            <div style={{ fontSize: 9, fontWeight: 700, color: "#999", marginTop: 3, letterSpacing: "0.1em" }}>{(fmt as any).sub} {fmt.w} × {fmt.h}</div>
            {fmt.id === "print" && <div style={{ fontSize: 9, fontWeight: 600, color: "#b08000", marginTop: 3 }}>Recommended: 3300×5100px or higher resolution</div>}
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
              aspectRatio: fmt.aspect, background: "#f5f5f5",
              border: dragOverId === fmt.id ? "2px dashed #111" : asset ? "none" : "1.5px dashed #ccc",
              borderRadius: 12, overflow: "hidden", position: "relative",
              cursor: asset ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)", transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => { if (!asset) (e.currentTarget as HTMLDivElement).style.borderColor = "#999"; }}
            onMouseLeave={(e) => { if (!asset) (e.currentTarget as HTMLDivElement).style.borderColor = "#ccc"; setDragOverId(null); }}
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
                      style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #555", background: "transparent", color: "#ddd", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                      Replace
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteAsset(fmt.id); }}
                      style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #661111", background: "transparent", color: "#c55", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                      Delete
                    </button>
                  </div>
                </div>
              </>
            ) : isUploading ? (
              <div style={{ fontSize: 12, color: "#888", fontWeight: 700, textTransform: "uppercase" }}>Uploading...</div>
            ) : (
              <div style={{ textAlign: "center", pointerEvents: "none" }}>
                <div style={{ fontSize: 22, color: "#aaa", marginBottom: 8 }}>&#8593;</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#999", textTransform: "uppercase", letterSpacing: "0.08em" }}>Upload</div>
                <div style={{ fontSize: 9, color: "#aaa", marginTop: 4 }}>or drag and drop</div>
              </div>
            )}
          </div>
        </div>
      );
    });
  }

  return (
    <div className="fade-in" style={{ background: "#EEEEEE", minHeight: "100vh", color: "#111" }}>
      <div style={{ padding: "24px 28px", borderBottom: "1px solid #ddd", background: "#EEEEEE", maxWidth: 1100, margin: "0 auto" }}>
        <Link href={`/dashboard/tours/${tourId}`} style={{ fontSize: 13, fontWeight: 700, color: "#888", textDecoration: "none", display: "inline-block", marginBottom: 8 }}>← Back to Tour</Link>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "inline-block" }}>
              <div className="brand-title" style={{ fontSize: 72, color: "#111", lineHeight: 1, marginBottom: 4, paddingBottom: 8 }}>LOCALIZER</div>
              <div style={{ borderBottom: "2px solid #111", marginBottom: 6 }} />
            </div>
            <div className="brand-title" style={{ fontSize: "360%", color: "#111" }}>Import Assets</div>
          </div>
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "#fff", border: "1px solid #ddd", borderRadius: 12, padding: "8px" }}>
              <Link href={`/dashboard/tours/${tourId}/import`} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", color: "#111", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>1. ↑ Import Schedule</Link>
              <Link href={`/dashboard/tours/${tourId}/assets`} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", textDecoration: "none", fontWeight: 900, fontSize: 13 }}>2. ↑ Import Assets</Link>
              <Link href={`/dashboard/tours/${tourId}/template`} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", color: "#111", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>3. Template For Shows</Link>
              <Link href={`/dashboard/tours/${tourId}`} style={{ padding: "10px 18px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", color: "#111", textDecoration: "none", fontWeight: 700, fontSize: 13 }}>4. Gigs</Link>
            </div>
          </div>
        </div>
      </div>
      <div style={{ padding: "36px 28px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontSize: 14, color: "#888", marginBottom: 16, fontWeight: 600 }}>
          Upload one master photo per format. Click an uploaded image to open the text editor.
        </div>
        <div style={{ marginBottom: 32, padding: "16px 20px", background: "#fff", border: "1px solid #ddd", borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: "#888", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Upload Tips</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 4 }}>Match Dimensions</div>
              <div style={{ fontSize: 11, color: "#888", lineHeight: 1.6 }}>Upload at the exact size shown below each format for best results.</div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 4 }}>Aspect Ratio</div>
              <div style={{ fontSize: 11, color: "#888", lineHeight: 1.6 }}>Images are cropped to fit. Matching the aspect ratio avoids unexpected cropping.</div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#555", marginBottom: 4 }}>High Resolution</div>
              <div style={{ fontSize: 11, color: "#888", lineHeight: 1.6 }}>Use files at least 1080px wide for sharp, professional output.</div>
            </div>
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", color: "#111", marginBottom: 16 }}>Photos</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 28, marginBottom: 48 }}>
          {renderFormatGrid("photo", "image/*")}
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", color: "#111", marginBottom: 16 }}>Video</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 28 }}>
          {renderFormatGrid("video", "video/*,image/*")}
        </div>
      </div>
    </div>
  );
}