"use client";

import { useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const FORMATS = [
  { id: "ig_post",   label: "IG Post",       w: 1080, h: 1080, aspect: "1 / 1" },
  { id: "ig_story",  label: "IG Story",      w: 1080, h: 1920, aspect: "9 / 16" },
  { id: "facebook",  label: "Facebook Cover", w: 820,  h: 312,  aspect: "820 / 312" },
  { id: "twitter",   label: "Twitter / X",   w: 1600, h: 900,  aspect: "16 / 9" },
];

export default function AssetsPage() {
  const params = useParams();
  const tourId = params.tourId as string;
  const [assets, setAssets] = useState<{formatId: string; url: string}[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const fileRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  async function handleUpload(formatId: string, file: File) {
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
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setUploading(null);
    }
  }

  return (
    <div style={{ padding: 40, maxWidth: 1000, margin: "0 auto", background: "#EEEEEE", minHeight: "100vh" }}>
      <Link href={`/dashboard/tours/${tourId}`} style={{ fontSize: 13, fontWeight: 700, color: "#888", textDecoration: "none" }}>← Back</Link>
      <h1 className="brand-title" style={{ margin: "16px 0 4px" }}>LOCALIZER</h1>
      <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Import Assets</div>
      <div style={{ fontSize: 13, color: "#888", marginBottom: 32 }}>Upload one photo per format. Hover the image to edit text or replace.</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 24 }}>
        {FORMATS.map((fmt) => {
          const asset = assets.find((a) => a.formatId === fmt.id);
          const isUploading = uploading === fmt.id;
          return (
            <div key={fmt.id}>
              <div style={{ fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#666", marginBottom: 8 }}>
                {fmt.label} <span style={{ fontWeight: 400, color: "#aaa" }}>{fmt.w}×{fmt.h}</span>
              </div>
              <input ref={(el) => { fileRefs.current[fmt.id] = el; }} type="file" accept="image/*" style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(fmt.id, f); }} />
              <div onClick={() => !asset && fileRefs.current[fmt.id]?.click()}
                style={{ aspectRatio: fmt.aspect, background: asset ? "transparent" : "#fff", border: asset ? "none" : "2px dashed #ddd",
                  borderRadius: 12, overflow: "hidden", position: "relative", cursor: asset ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                {asset ? (
                  <>
                    <img src={asset.url} alt={fmt.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <div className="hover-overlay" style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
                      opacity: 0, transition: "opacity 0.15s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}>
                      <button onClick={() => alert("Text editor — next step!")}
                        style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: "#fff", color: "#111", fontWeight: 900, fontSize: 12, cursor: "pointer" }}>
                        Edit Text
                      </button>
                      <button onClick={() => fileRefs.current[fmt.id]?.click()}
                        style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.4)", background: "transparent", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                        Replace
                      </button>
                    </div>
                  </>
                ) : isUploading ? (
                  <div style={{ fontSize: 12, color: "#aaa", fontWeight: 700 }}>Uploading…</div>
                ) : (
                  <div style={{ textAlign: "center", pointerEvents: "none" }}>
                    <div style={{ fontSize: 24, color: "#ccc", marginBottom: 6 }}>↑</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#bbb" }}>Upload photo</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
