"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/app/components/Toast";
import { createTourForArtist } from "./actions";

type Tour = { id: string; name: string; band_tour_label: string | null; image_url: string | null; };

export default function ArtistDetailClient({ artistId }: { artistId: string }) {
  const router = useRouter();
  const toast = useToast();

  const [tours, setTours] = useState<Tour[]>([]);
  const [artistName, setArtistName] = useState("");
  const [creatingTour, setCreatingTour] = useState(false);
  const [deletingTourId, setDeletingTourId] = useState<string | null>(null);
  const [hoveredTourId, setHoveredTourId] = useState<string | null>(null);
  const [artistImageUrl, setArtistImageUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: a } = await supabase.from("artists").select("name, image_url").eq("id", artistId).single();
      if (!a) { router.push("/dashboard"); return; }
      setArtistName(a.name ?? "");
      setArtistImageUrl(a.image_url ?? null);
      const { data: t } = await supabase.from("tours").select("id, name, band_tour_label, image_url").eq("artist_id", artistId).order("created_at", { ascending: false });
      setTours(t ?? []);
    }
    load();
  }, [artistId, router]);

  async function handleCreateTour() {
    setCreatingTour(true);
    const result = await createTourForArtist(artistId, artistName);
    if (!result.ok) {
      if (result.error === "tour_limit") {
        toast.error("Your plan includes 5 tours — upgrade for unlimited.");
      } else if (result.error === "unauthenticated") {
        toast.error("Not logged in.");
      } else if (result.error === "no_org") {
        toast.error("Could not find org.");
      } else {
        toast.error("Failed to create tour.");
      }
      setCreatingTour(false);
      return;
    }
    router.push("/dashboard/tours/" + result.tourId + "/import");
  }

  async function handleDeleteTour(e: React.MouseEvent, tourId: string) {
    e.stopPropagation();
    if (!window.confirm("Delete this tour and all its events? This cannot be undone.")) return;
    setDeletingTourId(tourId);
    try {
      await supabase.from("events").delete().eq("tour_id", tourId);
      await supabase.from("tours").delete().eq("id", tourId);
      setTours(prev => prev.filter(t => t.id !== tourId));
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Delete failed. Please try again.");
    } finally {
      setDeletingTourId(null);
    }
  }

  return (
    <div className="fade-in" style={{ padding: "32px 24px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontFamily: "var(--hw-font-display)", fontSize: 36, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text)", margin: 0 }}>TOURS</h2>
          <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text-muted)", marginTop: 4 }}>{tours.length} tour{tours.length !== 1 ? "s" : ""}</div>
        </div>

        {tours.length === 0 && !creatingTour && (
          <div style={{ border: "3px dashed var(--hw-border-light)", padding: 48, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 24, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text)", marginBottom: 8 }}>NO TOURS YET</div>
            <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-text-muted)", marginBottom: 20 }}>Create your first tour to start generating show assets.</div>
            <button onClick={handleCreateTour} disabled={creatingTour} style={{ padding: "14px 28px", border: "3px solid var(--hw-action-primary)", background: "var(--hw-action-primary)", color: "#fff", fontFamily: "var(--hw-font-display)", fontSize: 16, letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer" }}>
              {creatingTour ? "CREATING..." : "CREATE TOUR"}
            </button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
          {tours.map((tour) => (
            <div key={tour.id} style={{ position: "relative" }}
              onMouseEnter={() => setHoveredTourId(tour.id)}
              onMouseLeave={() => setHoveredTourId(null)}>
              <div onClick={() => router.push("/dashboard/tours/" + tour.id)} style={{ background: (tour.image_url ?? artistImageUrl) ? "transparent" : "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 20, aspectRatio: "1 / 1", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden", position: "relative", cursor: "pointer", opacity: deletingTourId === tour.id ? 0.4 : 1, boxShadow: hoveredTourId === tour.id ? "var(--hw-shadow-lg)" : "none", transform: hoveredTourId === tour.id ? "translateY(-4px)" : "none", transition: "var(--hw-ease)" }}>
                {(tour.image_url ?? artistImageUrl) && (
                  <>
                    <div style={{ position: "absolute", inset: 0, backgroundImage: "url(" + (tour.image_url ? (tour.image_url.startsWith("http") ? tour.image_url.replace("/image/upload/", "/image/upload/w_400,q_auto/") : `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_400,q_auto/${tour.image_url}`) : (artistImageUrl ? artistImageUrl.replace("/image/upload/", "/image/upload/w_400,q_auto/") : "")) + ")", backgroundSize: "cover", backgroundPosition: "center", border: "3px solid var(--hw-border-strong)" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 100%)" }} />
                  </>
                )}
                <div style={{ position: "relative", zIndex: 1, fontFamily: "var(--hw-font-mono)", fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", color: (tour.image_url ?? artistImageUrl) ? "rgba(255,255,255,0.7)" : "var(--hw-text-muted)" }}>TOUR</div>
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, letterSpacing: "2px", textTransform: "uppercase", color: (tour.image_url ?? artistImageUrl) ? "#fff" : "var(--hw-text)", marginBottom: 8 }}>{tour.band_tour_label ?? tour.name}</div>
                  <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 18, color: (tour.image_url ?? artistImageUrl) ? "rgba(255,255,255,0.5)" : "var(--hw-border-light)", textAlign: "right" }}>&rarr;</div>
                </div>
              </div>
              {hoveredTourId === tour.id && (
                <button onClick={(e) => handleDeleteTour(e, tour.id)}
                  style={{ position: "absolute", bottom: 10, left: 10, zIndex: 10, padding: "5px 12px", border: "2px solid var(--hw-crimson)", background: "rgba(0,0,0,0.6)", color: "var(--hw-crimson)", fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" }}>
                  {deletingTourId === tour.id ? "DELETING\u2026" : "DELETE"}
                </button>
              )}
            </div>
          ))}
          {tours.length > 0 && (
            <button onClick={handleCreateTour} disabled={creatingTour} style={{ width: "100%", aspectRatio: "1 / 1", background: "var(--hw-bg-surface)", border: "3px dashed var(--hw-border-light)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", padding: 20, transition: "var(--hw-ease)" }}>
              <span style={{ fontFamily: "var(--hw-font-display)", fontSize: 120, fontWeight: 400, color: "var(--hw-text)", lineHeight: 1 }}>+</span>
              <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text-muted)" }}>{creatingTour ? "CREATING..." : "NEW TOUR"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
