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
  type?: "artist" | "tour";
};

export default function TourTile({
  tourId,
  bandName,
  dateRange,
  eventCount,
  imageUrl,
  href,
  type = "tour",
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
    const msg = type === "artist"
      ? "Delete this artist and all its tours? This cannot be undone."
      : "Delete this tour and all its events? This cannot be undone.";
    if (!window.confirm(msg)) return;
    setDeleting(true);
    try {
      if (type === "artist") {
        // 1. Delete tours_routing children (TourRouter tours for this artist)
        const { data: routingTours } = await supabase.from("tours_routing").select("id").eq("artist_id", tourId);
        const routingTourIds = (routingTours ?? []).map(t => t.id);
        if (routingTourIds.length > 0) {
          // Get all show IDs for guest list + advance email cleanup
          const { data: shows } = await supabase.from("tour_shows").select("id").in("tour_id", routingTourIds);
          const showIds = (shows ?? []).map(s => s.id);
          if (showIds.length > 0) {
            const { error: glErr } = await supabase.from("tour_guest_list").delete().in("show_id", showIds);
            if (glErr) console.error("tour_guest_list delete:", glErr.message);
            const { error: aeErr } = await supabase.from("advance_emails").delete().in("show_id", showIds);
            if (aeErr) console.error("advance_emails delete:", aeErr.message);
          }
          // Delete tour_shows
          const { error: tsErr } = await supabase.from("tour_shows").delete().in("tour_id", routingTourIds);
          if (tsErr) console.error("tour_shows delete:", tsErr.message);
          // Delete tour_expenses
          const { error: teErr } = await supabase.from("tour_expenses").delete().in("tour_id", routingTourIds);
          if (teErr) console.error("tour_expenses delete:", teErr.message);
          // Delete intake_documents
          const { error: idErr } = await supabase.from("intake_documents").delete().in("tour_id", routingTourIds);
          if (idErr) console.error("intake_documents delete:", idErr.message);
          // Delete tours_routing
          const { error: trErr } = await supabase.from("tours_routing").delete().in("id", routingTourIds);
          if (trErr) throw trErr;
        }

        // 2. Delete Localizer tours children
        const { data: tours } = await supabase.from("tours").select("id").eq("artist_id", tourId);
        const tourIds = (tours ?? []).map(t => t.id);
        if (tourIds.length > 0) {
          const { data: events } = await supabase.from("events").select("id").in("tour_id", tourIds);
          const eventIds = (events ?? []).map(ev => ev.id);
          if (eventIds.length > 0) {
            const { error: vlErr } = await supabase.from("venue_links").delete().in("event_id", eventIds);
            if (vlErr) throw vlErr;
          }
          const { error: evErr } = await supabase.from("events").delete().in("tour_id", tourIds);
          if (evErr) throw evErr;
          const { error: trErr } = await supabase.from("tours").delete().in("id", tourIds);
          if (trErr) throw trErr;
        }

        // 3. Delete the artist
        const { error } = await supabase.from("artists").delete().eq("id", tourId);
        if (error) throw error;
      } else {
        const { data: evts } = await supabase.from("events").select("id").eq("tour_id", tourId);
        const eventIds = (evts ?? []).map(ev => ev.id);
        if (eventIds.length > 0) {
          const { error: vlErr } = await supabase.from("venue_links").delete().in("event_id", eventIds);
          if (vlErr) throw vlErr;
        }
        const { error: evErr } = await supabase.from("events").delete().eq("tour_id", tourId);
        if (evErr) throw evErr;
        const { error } = await supabase.from("tours").delete().eq("id", tourId);
        if (error) throw error;
      }
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
          background: currentImage ? "transparent" : "var(--hw-bg-surface)",
          border: "3px solid var(--hw-border-strong)",
          padding: 20,
          aspectRatio: "1 / 1",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
          position: "relative",
          boxShadow: hovered ? "var(--hw-shadow-lg)" : "none",
          transform: hovered ? "translateY(-4px)" : "none",
          transition: "var(--hw-ease)",
          opacity: deleting ? 0.4 : 1,
        }}
      >
        {currentImage && (
          <>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${currentImage})`, backgroundSize: "cover", backgroundPosition: "center", border: "3px solid var(--hw-border-strong)" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 100%)" }} />
          </>
        )}
        <div style={{ position: "relative", zIndex: 1 }}>
          {bandName && (
            <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, letterSpacing: "2px", textTransform: "uppercase", color: currentImage ? "rgba(255,255,255,0.9)" : "var(--hw-text)", marginBottom: 6 }}>
              {bandName}
            </div>
          )}
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          {dateRange && (
            <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: currentImage ? "rgba(255,255,255,0.7)" : "var(--hw-text-muted)", marginBottom: 8 }}>
              {dateRange}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: currentImage ? "rgba(255,255,255,0.7)" : "var(--hw-text-muted)" }}>
              {eventCount} tour{eventCount !== 1 ? "s" : ""}
            </span>
            <span style={{ fontFamily: "var(--hw-font-display)", fontSize: 18, color: currentImage ? "rgba(255,255,255,0.5)" : "var(--hw-border-light)" }}>→</span>
          </div>
        </div>
      </div>

      {mounted && hovered && type === "artist" && (
        <a
          href={`/dashboard/artists/${tourId}/profile`}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "absolute", top: 10, right: 10, zIndex: 10,
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32,
            background: "rgba(0,0,0,0.6)", border: "3px solid rgba(255,255,255,0.2)",
            color: "var(--hw-text-invert)", textDecoration: "none",
            transition: "var(--hw-ease)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </a>
      )}

      {mounted && hovered && type !== "artist" && (
        <button
          onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
          style={{ position: "absolute", top: 10, right: 10, zIndex: 10, padding: "5px 12px", border: "3px solid rgba(255,255,255,0.3)", background: "rgba(0,0,0,0.6)", color: "var(--hw-text-invert)", fontFamily: "var(--hw-font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" }}
        >
          {uploading ? "Uploading…" : currentImage ? "Change photo" : "+ Photo"}
        </button>
      )}

      {mounted && hovered && (
        <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, zIndex: 10, display: "flex", justifyContent: "space-between", padding: "0 10px" }}>
          <button
            onClick={handleDelete}
            style={{ padding: "5px 12px", border: "3px solid var(--hw-crimson)", background: "rgba(0,0,0,0.6)", color: "var(--hw-crimson)", fontFamily: "var(--hw-font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" }}
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
            style={{ padding: "5px 12px", border: "3px solid rgba(255,255,255,0.3)", background: "rgba(0,0,0,0.6)", color: "var(--hw-text-invert)", fontFamily: "var(--hw-font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" }}
          >
            {uploading ? "Uploading…" : currentImage ? "Change photo" : "+ Photo"}
          </button>
        </div>
      )}
    </div>
  );
}
