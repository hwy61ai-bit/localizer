"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Props = {
  artistId: string;
  artistName: string;
  tourCount: number;
  imageUrl: string | null;
};

export default function ArtistTile({ artistId, artistName, tourCount, imageUrl }: Props) {
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
      const path = `artist-images/${artistId}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("localizer-assets").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("localizer-assets").getPublicUrl(path);
      await supabase.from("artists").update({ image_url: urlData.publicUrl }).eq("id", artistId);
      setCurrentImage(urlData.publicUrl);
    } catch (err) { console.error(err); alert("Upload failed."); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm("Delete this artist and all their tours?")) return;
    setDeleting(true);
    try {
      const { data: tours } = await supabase.from("tours").select("id").eq("artist_id", artistId);
      if (tours && tours.length > 0) {
        await supabase.from("events").delete().in("tour_id", tours.map((t) => t.id));
        await supabase.from("tours").delete().eq("artist_id", artistId);
      }
      await supabase.from("artists").delete().eq("id", artistId);
      window.location.href = "/dashboard";
    } catch (err) { console.error(err); alert("Delete failed."); setDeleting(false); }
  }

  return (
    <div style={{ position: "relative", cursor: "pointer" }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />
      <div
        onClick={() => router.push(`/dashboard/artists/${artistId}`)}
        style={{
          background: currentImage ? "transparent" : "var(--hw-bg-surface)",
          border: "3px solid var(--hw-border-strong)", borderRadius: 0, padding: 20, aspectRatio: "1 / 1",
          display: "flex", flexDirection: "column", justifyContent: "space-between",
          overflow: "hidden", position: "relative", opacity: deleting ? 0.4 : 1,
          boxShadow: hovered ? "0 8px 24px rgba(0,0,0,0.09)" : "none",
          transform: hovered ? "translateY(-2px)" : "none", transition: "box-shadow 0.15s, transform 0.15s",
        }}
      >
        {currentImage && (
          <>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${currentImage})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 100%)" }} />
          </>
        )}
        <div style={{ position: "relative", zIndex: 1, fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", color: currentImage ? "rgba(255,255,255,0.6)" : "var(--hw-blue)" }}>Artist</div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, fontWeight: 800, color: currentImage ? "var(--hw-text-invert)" : "var(--hw-text)", marginBottom: 8, lineHeight: 1.2 }}>{artistName}</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, fontWeight: 700, color: currentImage ? "rgba(255,255,255,0.6)" : "var(--hw-text-muted)" }}>{tourCount} tour{tourCount !== 1 ? "s" : ""}</span>
            <span style={{ fontSize: 16, color: currentImage ? "rgba(255,255,255,0.5)" : "var(--hw-border)" }}>&#8594;</span>
          </div>
        </div>
      </div>
      {mounted && hovered && (
        <button onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }} style={{ position: "absolute", top: 10, right: 10, zIndex: 10, padding: "5px 10px", borderRadius: 0, border: "3px solid rgba(255,255,255,0.4)", background: "rgba(0,0,0,0.55)", color: "#fff", fontFamily: "var(--hw-font-display)", fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", cursor: "pointer" }}>
          {uploading ? "Uploading..." : currentImage ? "Change photo" : "+ Photo"}
        </button>
      )}
      {mounted && hovered && (
        <button onClick={handleDelete} style={{ position: "absolute", bottom: 10, left: 10, zIndex: 10, padding: "5px 10px", borderRadius: 0, border: "3px solid rgba(255,0,0,0.3)", background: "rgba(0,0,0,0.55)", color: "rgba(255,100,100,0.9)", fontFamily: "var(--hw-font-display)", fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", cursor: "pointer" }}>
          {deleting ? "Deleting..." : "Delete"}
        </button>
      )}
    </div>
  );
}
