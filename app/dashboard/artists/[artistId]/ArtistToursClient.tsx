"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import posthog from "posthog-js";

type Tour = {
  id: string;
  name: string;
  artist_id: string | null;
  created_at: string;
  updated_at: string;
  image_url: string | null;
  artists: { name: string; image_url: string | null } | null;
  localizer_tour_id: string | null;
};

export default function ArtistToursClient({
  artistId,
  artistName,
}: {
  artistId: string;
  artistName: string;
}) {
  const router = useRouter();
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTours();
  }, [artistId]);

  async function fetchTours() {
    const resp = await fetch("/api/tourrouter/tours");
    if (resp.ok) {
      const data = await resp.json();
      setTours((data.tours || []).filter((t: Tour) => t.artist_id === artistId));
    }
    setLoading(false);
  }

  async function createTour() {
    if (!newName.trim()) return;
    setCreating(true);
    const resp = await fetch("/api/tourrouter/tours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), artist_id: artistId }),
    });
    if (resp.ok) {
      const data = await resp.json();
      posthog.capture("tour_created");
      router.push(`/dashboard/routing/${data.tour.id}`);
    }
    setCreating(false);
  }

  async function deleteTour(tourId: string, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm("Delete this tour and all its shows? This cannot be undone.")) return;
    const resp = await fetch(`/api/tourrouter/tours/${tourId}`, { method: "DELETE" });
    if (resp.ok) {
      setTours((prev) => prev.filter((t) => t.id !== tourId));
    }
  }

  return (
    <div style={{ padding: "32px 24px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888", marginBottom: 6 }}>
            {artistName}
          </div>
          <div style={{ fontSize: 13, color: "#888" }}>
            {loading ? "Loading..." : `${tours.length} tour${tours.length !== 1 ? "s" : ""}`}
          </div>
        </div>

        {!loading && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {tours.map((tour) => (
              <TourTile key={tour.id} tour={tour} onDelete={deleteTour} />
            ))}

            <button
              onClick={() => setShowModal(true)}
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                background: "transparent",
                border: "1.5px dashed #CCCCCC",
                borderRadius: 14,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
                padding: 20,
              }}
            >
              <span style={{ fontSize: 140, fontWeight: 900, color: "#111", lineHeight: 1 }}>+</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#aaa", letterSpacing: "0.04em" }}>New Tour</span>
            </button>
          </div>
        )}
      </div>

      {/* Create Tour Modal */}
      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{ background: "#fff", borderRadius: 14, padding: 32, width: 420, maxWidth: "90vw", border: "1px solid #DDDDDD" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6, letterSpacing: "-0.3px" }}>New Tour</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 20 }}>for {artistName}</div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#888", display: "block", marginBottom: 6 }}>Tour Name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !creating && createTour()}
                placeholder="e.g. Summer 2026 US Run"
                autoFocus
                style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", border: "1px solid #DDDDDD", borderRadius: 10, fontSize: 15, fontWeight: 600, outline: "none" }}
              />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #DDDDDD", background: "#fff", color: "#111", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
              >Cancel</button>
              <button
                onClick={createTour}
                disabled={creating || !newName.trim()}
                style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 900, fontSize: 13, cursor: "pointer", opacity: creating || !newName.trim() ? 0.5 : 1 }}
              >{creating ? "Creating..." : "Create Tour"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tour Tile ────────────────────────────────────────────────

function TourTile({ tour, onDelete }: { tour: Tour; onDelete: (id: string, e: React.MouseEvent) => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [hovered, setHovered] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const imageUrl = tour.image_url || tour.artists?.image_url || null;
  const [currentImage, setCurrentImage] = useState<string | null>(imageUrl);

  useEffect(() => { setMounted(true); }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `tourrouter-images/${tour.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("localizer-assets")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("localizer-assets")
        .getPublicUrl(path);
      await fetch(`/api/tourrouter/tours/${tour.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: urlData.publicUrl }),
      });
      setCurrentImage(urlData.publicUrl);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
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
        onClick={() => router.push(`/dashboard/routing/${tour.id}`)}
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
        }}
      >
        {currentImage && (
          <>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${currentImage})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 100%)" }} />
          </>
        )}

        <div style={{ position: "relative", zIndex: 1 }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.3px", color: currentImage ? "#fff" : "#111", marginBottom: 8 }}>
            {tour.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: currentImage ? "rgba(255,255,255,0.6)" : "#aaa" }}>
              {new Date(tour.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {tour.localizer_tour_id && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: currentImage ? "rgba(26,107,60,0.8)" : "#e8f5e9", color: currentImage ? "#fff" : "#1a6b3c" }}>Localizer</span>
              )}
              <span style={{ fontSize: 16, color: currentImage ? "rgba(255,255,255,0.5)" : "#ccc" }}>&rarr;</span>
            </div>
          </div>
        </div>
      </div>

      {mounted && hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
          style={{ position: "absolute", top: 10, right: 10, zIndex: 10, padding: "5px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.4)", background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", backdropFilter: "blur(4px)", letterSpacing: "0.04em" }}
        >
          {uploading ? "Uploading\u2026" : currentImage ? "Change photo" : "+ Photo"}
        </button>
      )}

      {mounted && hovered && (
        <button
          onClick={(e) => onDelete(tour.id, e)}
          style={{ position: "absolute", bottom: 10, left: 10, zIndex: 10, padding: "5px 10px", borderRadius: 20, border: "1px solid rgba(255,0,0,0.3)", background: "rgba(0,0,0,0.55)", color: "rgba(255,100,100,0.9)", fontSize: 11, fontWeight: 700, cursor: "pointer", backdropFilter: "blur(4px)", letterSpacing: "0.04em" }}
        >
          Delete
        </button>
      )}
    </div>
  );
}
