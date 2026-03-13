"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const FORMATS = [
  { id: "ig_post",     label: "IG Post",        w: 1080, h: 1080, aspect: "1 / 1",     section: "photo" },
  { id: "ig_story",    label: "IG Story",        w: 1080, h: 1920, aspect: "9 / 16",    section: "photo" },
  { id: "facebook",    label: "Facebook Cover",  w: 820,  h: 312,  aspect: "820 / 312", section: "photo" },
  { id: "tour_poster", label: "Full Tour Poster", w: 1080, h: 1920, aspect: "9 / 16",   section: "photo" },
  { id: "tiktok",      label: "TikTok / Reels",  w: 1080, h: 1920, aspect: "9 / 16",   section: "video" },
  { id: "yt_shorts",   label: "YouTube Shorts",  w: 1080, h: 1920, aspect: "9 / 16",   section: "video" },
];

export default function AssetsPage() {
  const params = useParams();
  const tourId = params.tourId as string;
  const [assets, setAssets] = useState<{ formatId: string; url: string }[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  useEffect(() => {
    async function loadExisting() {
      const { data } = await supabase
        .from("tours")
        .select("image_url")
        .eq("id", tourId)
        .single();
      if (data?.image_url) {
        // Build the Cloudinary URL from public_id
        const url = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${data.image_url}`;
        setAssets([{ formatId: "tour_poster", url }]);
      }
    }
    loadExisting();
  }, [tourId]);

  async function handleUpload(formatId: string, file: File) {
    if (file.size > 20 * 1024 * 1024) {
      alert("File is too large. Please upload an image under 20MB.");
      return;
    }
    setUploading(formatId);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `tour-assets/${tourId}/${formatId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("localizer-assets")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("localizer-assets").getPublicUrl(path);
      setAssets((prev) => [...prev.filter((a) => a.formatId !== formatId), { formatId, url: data.publicUrl }]);
      if (formatId === "tour_poster") {
        // Upload to Cloudinary and store public_id for rendering
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`/api/tours/${tourId}/upload-image`, {
          method: "POST",
          body: fd,
        });
        const result = await res.json();
        if (result.url) {
          // Use the fresh Cloudinary URL
          setAssets((prev) => [...prev.filter((a) => a.formatId !== formatId), { formatId, url: result.url }]);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
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
          <div style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555", marginBottom: 10 }}>
            {fmt.label}
            <span style={{ marginLeft: 8, fontWeight: 400, color: "#383838" }}>{fmt.w}x{fmt.h}</span>
          </div>
          <input
            ref={(el) => { fileRefs.current[fmt.id] = el; }}
            type="file" accept={accept} style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(fmt.id, f); }}
          />
          <div
            onClick={() => !asset && fileRefs.current[fmt.id]?.click()}
            style={{
              aspectRatio: (fmt.id === "tour_poster" && asset) ? undefined : fmt.aspect, background: "#1a1a1a",
              border: asset ? "none" : "1.5px dashed #2a2a2a",
              borderRadius: 12, overflow: (fmt.id === "tour_poster" && asset) ? "visible" : "hidden", position: "relative",
              cursor: asset ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)", transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => { if (!asset) (e.currentTarget as HTMLDivElement).style.borderColor = "#444"; }}
            onMouseLeave={(e) => { if (!asset) (e.currentTarget as HTMLDivElement).style.borderColor = "#2a2a2a"; }}
          >
            {asset ? (
              <>
                <img src={asset.url} alt={fmt.label} style={{ width: "100%", height: "auto", display: "block" }} />
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, opacity: 0, transition: "opacity 0.15s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}>
                  <button onClick={() => alert("Text editor coming soon!")}
                    style={{ padding: "9px 18px", borderRadius: 8, border: "none", background: "#fff", color: "#111", fontWeight: 900, fontSize: 12, cursor: "pointer" }}>
                    Edit Text
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); fileRefs.current[fmt.id]?.click(); }}
                    style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid #444", background: "transparent", color: "#aaa", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                    Replace
                  </button>
                </div>
              </>
            ) : isUploading ? (
              <div style={{ fontSize: 12, color: "#555", fontWeight: 700, textTransform: "uppercase" }}>Uploading...</div>
            ) : (
              <div style={{ textAlign: "center", pointerEvents: "none" }}>
                <div style={{ fontSize: 22, color: "#333", marginBottom: 8 }}>&#8593;</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#333", textTransform: "uppercase", letterSpacing: "0.08em" }}>Upload</div>
              </div>
            )}
          </div>
        </div>
      );
    });
  }

  return (
    <div style={{ background: "#111", minHeight: "100vh", color: "#fff" }}>
      <div style={{ padding: "14px 28px", borderBottom: "1px solid #222", background: "#111" }}>
        <Link href={`/dashboard/tours/${tourId}`} style={{ fontSize: 13, fontWeight: 700, color: "#555", textDecoration: "none" }}>Back to Tour</Link>
        <div style={{ textAlign: "center", marginTop: 24, marginBottom: 8 }}>
          <div className="brand-title" style={{ fontSize: 72, color: "#fff", lineHeight: 1 }}>LOCALIZER</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", marginTop: 10, letterSpacing: -0.5 }}>Import Assets</div>
        </div>
      </div>
      <div style={{ padding: "36px 28px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ fontSize: 13, color: "#555", marginBottom: 32, fontWeight: 600 }}>
          Upload one master photo per format. Click an uploaded image to open the text editor.
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", color: "#fff", marginBottom: 16 }}>Photos</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 28, marginBottom: 48 }}>
          {renderFormatGrid("photo", "image/*")}
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.12em", color: "#fff", marginBottom: 16 }}>Video</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 28 }}>
          {renderFormatGrid("video", "video/*,image/*")}
        </div>
      </div>
    </div>
  );
}