"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import posthog from "posthog-js";
import { HwBadge, HwButton, HwEmptyState, HwInput, HwModal } from "@/app/components/hw";

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
      router.push(`/dashboard/routing/${data.tour.id}/import`);
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
          <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text-muted)", marginBottom: 6 }}>
            {artistName}
          </div>
          <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-muted)" }}>
            {loading ? "Loading..." : `${tours.length} tour${tours.length !== 1 ? "s" : ""}`}
          </div>
        </div>

        {!loading && tours.length === 0 && (
          <HwEmptyState
            title="NO TOURS YET"
            description="Create your first tour to start routing shows and managing dates."
            actionLabel="CREATE TOUR"
            onAction={() => setShowModal(true)}
          />
        )}

        {!loading && tours.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {tours.map((tour) => (
              <TourTile key={tour.id} tour={tour} onDelete={deleteTour} />
            ))}

            <button
              onClick={() => setShowModal(true)}
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                background: "var(--hw-bg-surface)",
                border: "3px dashed var(--hw-border-light)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
                padding: 20,
                transition: "var(--hw-ease)",
              }}
            >
              <span style={{ fontFamily: "var(--hw-font-display)", fontSize: 120, fontWeight: 400, color: "var(--hw-text)", lineHeight: 1 }}>+</span>
              <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text-muted)" }}>NEW TOUR</span>
            </button>
          </div>
        )}
      </div>

      {/* Create Tour Modal */}
      <HwModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="NEW TOUR"
        footer={
          <>
            <HwButton variant="secondary" size="small" onClick={() => setShowModal(false)}>CANCEL</HwButton>
            <HwButton size="small" onClick={createTour} disabled={creating || !newName.trim()}>
              {creating ? "CREATING..." : "CREATE TOUR"}
            </HwButton>
          </>
        }
      >
        <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-muted)", marginBottom: 20 }}>
          for {artistName}
        </div>
        <HwInput
          label="Tour Name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="e.g. Summer 2026 US Run"
        />
        {/* Hidden handler for Enter key */}
        <input
          type="text"
          style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }}
          onKeyDown={(e) => e.key === "Enter" && !creating && createTour()}
        />
      </HwModal>
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
        }}
      >
        {currentImage && (
          <>
            <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${currentImage})`, backgroundSize: "cover", backgroundPosition: "center", border: "3px solid var(--hw-border-strong)" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 100%)" }} />
          </>
        )}

        <div style={{ position: "relative", zIndex: 1 }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, letterSpacing: "2px", textTransform: "uppercase", color: currentImage ? "#fff" : "var(--hw-text)", marginBottom: 8 }}>
            {tour.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: currentImage ? "rgba(255,255,255,0.7)" : "var(--hw-text-muted)" }}>
              {new Date(tour.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {tour.localizer_tour_id && (
                <HwBadge variant="confirmed">LOCALIZER</HwBadge>
              )}
              <span style={{ fontFamily: "var(--hw-font-display)", fontSize: 18, color: currentImage ? "rgba(255,255,255,0.5)" : "var(--hw-border-light)" }}>&rarr;</span>
            </div>
          </div>
        </div>
      </div>

      {mounted && hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
          style={{ position: "absolute", top: 10, right: 10, zIndex: 10, padding: "5px 12px", border: "2px solid rgba(255,255,255,0.3)", background: "rgba(0,0,0,0.6)", color: "#fff", fontFamily: "var(--hw-font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" }}
        >
          {uploading ? "Uploading\u2026" : currentImage ? "Change photo" : "+ Photo"}
        </button>
      )}

      {mounted && hovered && (
        <button
          onClick={(e) => onDelete(tour.id, e)}
          style={{ position: "absolute", bottom: 10, left: 10, zIndex: 10, padding: "5px 12px", border: "2px solid var(--hw-crimson)", background: "rgba(0,0,0,0.6)", color: "var(--hw-crimson)", fontFamily: "var(--hw-font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" }}
        >
          Delete
        </button>
      )}
    </div>
  );
}
