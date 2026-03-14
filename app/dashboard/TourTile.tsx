"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  tourId: string;
  tourName: string;
  bandName: string | null;
  dateRange: string | null;
  eventCount: number;
  imageUrl: string | null;
  href?: string;
};

export default function TourTile({
  tourId,
  bandName,
  dateRange,
  eventCount,
  imageUrl,
  href,
}: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [hovered, setHovered] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(imageUrl);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `artist-images/${tourId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("localizer-assets")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("localizer-assets")
        .getPublicUrl(path);
      const { error: updateError } = await supabase
        .from("artists")
        .update({ image_url: urlData.publicUrl })
        .eq("id", tourId);
      if (updateError) throw updateError;
      setCurrentImage(urlData.publicUrl);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm("Delete this tour and all its events? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await supabase.from("venue_links").delete().in("event_id", 
        (await supabase.from("events").select("id").eq("tour_id", tourId)).data?.map(e => e.id) ?? []
      );
      await supabase.from("events").delete().eq("tour_id", tourId);
      const { error } = await supabase.from("tours").delete().eq("id", tourId);
      if (error) throw error;
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div
      style={{ position: "relative", cursor: "pointer" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />

      <div
        onClick={() => router.push(href ?? `/dashboard/tours/${tourId}`)}
        style={{
          background: currentImage ? "transparent" : "#fff",
          border: "1px solid #DDDDDD",
          borderRadius: 14,
          padding: 20,
          aspectRatio: "1 / 1",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
          position: "relative",
          boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.09)" : "none",
          transform: hovered ? "translateY(-2px)" : "none",
          transition: "box-shadow 0.15s, transform 0.15s",
          opacity: deleting ? 0.4 : 1,
        }}
      >
        {currentImage && (
          <>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${currentImage})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 100%)" }} />
          </>
        )}
        <div style={{ position: "relative", zIndex: 1 }}>
          {bandName && (
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: currentImage ? "rgba(255,255,255,0.7)" : "#999", marginBottom: 6 }}>
              {bandName}
            </div>
          )}
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          {dateRange && (
            <div style={{ fontSize: 12, color: currentImage ? "rgba(255,255,255,0.7)" : "#666", marginBottom: 8 }}>
              {dateRange}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: currentImage ? "rgba(255,255,255,0.6)" : "#aaa" }}>
              {eventCount} event{eventCount !== 1 ? "s" : ""}
            </span>
            <span style={{ fontSize: 16, color: currentImage ? "rgba(255,255,255,0.5)" : "#ccc" }}>→</span>
          </div>
        </div>
      </div>

      {mounted && hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
          style={{ position: "absolute", top: 10, right: 10, zIndex: 10, padding: "5px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.4)", background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", backdropFilter: "blur(4px)", letterSpacing: "0.04em" }}
        >
          {uploading ? "Uploading…" : currentImage ? "Change photo" : "+ Photo"}
        </button>
      )}

      {mounted && hovered && (
        <button
          onClick={handleDelete}
          style={{ position: "absolute", bottom: 10, left: 10, zIndex: 10, padding: "5px 10px", borderRadius: 20, border: "1px solid rgba(255,0,0,0.3)", background: "rgba(0,0,0,0.55)", color: "rgba(255,100,100,0.9)", fontSize: 11, fontWeight: 700, cursor: "pointer", backdropFilter: "blur(4px)", letterSpacing: "0.04em" }}
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      )}
    </div>
  );
}
