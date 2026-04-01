"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/app/components/Toast";

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not logged in."); setCreatingTour(false); return; }
    const { data: memberData } = await supabase.from("org_members").select("org_id").eq("user_id", user.id).maybeSingle();
    if (!memberData?.org_id) { toast.error("Could not find org."); setCreatingTour(false); return; }
    const { data, error } = await supabase.from("tours").insert({ name: "New Tour", artist_id: artistId, band_name: artistName, org_id: memberData.org_id }).select("id").single();
    if (error || !data) { toast.error("Failed to create tour."); setCreatingTour(false); return; }
    router.push("/dashboard/tours/" + data.id + "/import");
  }

  async function handleDeleteTour(e: React.MouseEvent, tourId: string) {
    e.stopPropagation();
    if (!window.confirm("Delete this tour and all its events? This cannot be undone.")) return;
    setDeletingTourId(tourId);
    try {
      const { data: events } = await supabase.from("events").select("id").eq("tour_id", tourId);
      if (events?.length) {
        await supabase.from("venue_links").delete().in("event_id", events.map(e => e.id));
        await supabase.from("events").delete().eq("tour_id", tourId);
      }
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
          <h2 className="brand-title" style={{ margin: 0, fontSize: "250%" }}>TOURS</h2>
          <div style={{ fontSize: 13, color: "#888", marginTop: 2 }}>{tours.length} tour{tours.length !== 1 ? "s" : ""}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {tours.map((tour, idx) => (
            <div key={tour.id} className="card-hover" style={{ position: "relative", animation: `fadeInUp 0.4s ease-out ${idx * 0.1}s both` }}
              onMouseEnter={() => setHoveredTourId(tour.id)}
              onMouseLeave={() => setHoveredTourId(null)}>
              <div onClick={() => router.push("/dashboard/tours/" + tour.id)} style={{ background: (tour.image_url ?? artistImageUrl) ? "transparent" : "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: 20, aspectRatio: "1 / 1", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden", position: "relative", cursor: "pointer", opacity: deletingTourId === tour.id ? 0.4 : 1 }}>
                {(tour.image_url ?? artistImageUrl) && (
                  <>
                    <div style={{ position: "absolute", inset: 0, backgroundImage: "url(" + (tour.image_url ? (tour.image_url.startsWith("http") ? tour.image_url.replace("/image/upload/", "/image/upload/w_400,q_auto/") : `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_400,q_auto/${tour.image_url}`) : (artistImageUrl ? artistImageUrl.replace("/image/upload/", "/image/upload/w_400,q_auto/") : "")) + ")", backgroundSize: "cover", backgroundPosition: "center" }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 100%)" }} />
                  </>
                )}
                <div style={{ position: "relative", zIndex: 1, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: (tour.image_url ?? artistImageUrl) ? "rgba(255,255,255,0.6)" : "#999" }}>Tour</div>
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: (tour.image_url ?? artistImageUrl) ? "#fff" : "#111", marginBottom: 8 }}>{tour.band_tour_label ?? tour.name}</div>
                  <div style={{ fontSize: 16, color: (tour.image_url ?? artistImageUrl) ? "rgba(255,255,255,0.5)" : "#ccc", textAlign: "right" }}>&#8594;</div>
                </div>
              </div>
              {hoveredTourId === tour.id && (
                <button onClick={(e) => handleDeleteTour(e, tour.id)}
                  style={{ position: "absolute", bottom: 10, left: 10, zIndex: 10, padding: "5px 10px", borderRadius: 20, border: "1px solid rgba(255,0,0,0.3)", background: "rgba(0,0,0,0.55)", color: "rgba(255,100,100,0.9)", fontSize: 11, fontWeight: 700, cursor: "pointer", backdropFilter: "blur(4px)" }}>
                  {deletingTourId === tour.id ? "Deleting\u2026" : "Delete"}
                </button>
              )}
            </div>
          ))}
          <button onClick={handleCreateTour} disabled={creatingTour} style={{ width: "100%", aspectRatio: "1 / 1", background: "transparent", border: "1.5px dashed #CCCCCC", borderRadius: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", padding: 20 }}>
            <span style={{ fontSize: 140, fontWeight: 900, color: "#111", lineHeight: 1 }}>+</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#aaa", letterSpacing: "0.04em" }}>{creatingTour ? "Creating..." : "Add New Tour"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
