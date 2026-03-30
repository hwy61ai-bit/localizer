"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useProductBranding } from "@/lib/tourrouter/ProductBrandingContext";

type RoutingTour = {
  id: string;
  name: string;
  artist_id: string | null;
  created_at: string;
  updated_at: string;
  image_url: string | null;
  artists: { name: string; image_url: string | null } | null;
  localizer_tour_id: string | null;
};

export default function RoutingListPage() {
  return (
    <Suspense fallback={null}>
      <RoutingListInner />
    </Suspense>
  );
}

function RoutingListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const branding = useProductBranding();
  const [tours, setTours] = useState<RoutingTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [artistId, setArtistId] = useState("");
  const [billingToast, setBillingToast] = useState<string | null>(null);
  const [artists, setArtists] = useState<{ id: string; name: string }[]>([]);
  const [creating, setCreating] = useState(false);
  const [needsSubscription, setNeedsSubscription] = useState(false);

  useEffect(() => {
    fetchTours();
    fetchArtists();
    const billing = searchParams.get("billing");
    if (billing === "success") {
      setBillingToast("Subscription activated!");
      window.history.replaceState({}, "", "/dashboard/routing");
    } else if (billing === "cancelled") {
      setBillingToast("Checkout cancelled");
      window.history.replaceState({}, "", "/dashboard/routing");
    }
  }, [searchParams]);

  async function openBillingPortal() {
    const resp = await fetch("/api/tourrouter/billing/portal", { method: "POST" });
    if (resp.ok) {
      const data = await resp.json();
      window.location.href = data.url;
    }
  }

  async function fetchTours() {
    const resp = await fetch("/api/tourrouter/tours");
    if (resp.ok) {
      const data = await resp.json();
      setTours(data.tours);
    } else if (resp.status === 403) {
      const data = await resp.json();
      if (data.error === "subscription_required") {
        setNeedsSubscription(true);
      }
    }
    setLoading(false);
  }

  async function fetchArtists() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: membership } = await supabase.from("org_members").select("org_id").eq("user_id", user.id).maybeSingle();
    if (!membership?.org_id) return;
    const { data } = await supabase.from("artists").select("id, name").eq("org_id", membership.org_id).order("name");
    setArtists(data ?? []);
  }

  async function createTour() {
    if (!newName.trim()) return;
    setCreating(true);
    const resp = await fetch("/api/tourrouter/tours", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), artist_id: artistId || null }),
    });
    if (resp.ok) {
      const data = await resp.json();
      router.push(`/dashboard/routing/${data.tour.id}`);
    }
    setCreating(false);
  }

  async function deleteTour(tourId: string, e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm("Delete this routing tour and all its shows? This cannot be undone.")) return;
    const resp = await fetch(`/api/tourrouter/tours/${tourId}`, { method: "DELETE" });
    if (resp.ok) {
      setTours((prev) => prev.filter((t) => t.id !== tourId));
    }
  }

  return (
    <div className="fade-in" style={{ minHeight: "100vh", background: "#EEEEEE", padding: "32px 24px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            {!branding.isDiy && <Link href="/dashboard" style={{ fontSize: 13, fontWeight: 700, color: "#888", textDecoration: "none", display: "inline-block", marginBottom: 8 }}>&larr; Localizer</Link>}
            <h1 className="brand-title" style={{ margin: 0, marginBottom: 4, paddingBottom: 8, borderBottom: "2px solid #111111" }}>{branding.name}</h1>
            <h2 className="brand-title" style={{ margin: 0, marginBottom: 6, fontSize: "400%" }}>YOUR TOURS</h2>
            <div style={{ fontSize: 13, color: "#888" }}>{tours.length} tour{tours.length !== 1 ? "s" : ""}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <button onClick={openBillingPortal} style={{ fontSize: 12, color: "#888", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Manage Subscription</button>
          </div>
        </div>

        {billingToast && (
          <div style={{
            background: billingToast.includes("activated") ? "#e8f5e9" : "#fff3e0",
            border: billingToast.includes("activated") ? "1px solid #c8e6c9" : "1px solid #ffe0b2",
            borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13,
            color: billingToast.includes("activated") ? "#1a6b3c" : "#b35c00",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>{billingToast}</span>
            <button onClick={() => setBillingToast(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#888" }}>&times;</button>
          </div>
        )}

        {needsSubscription ? (
          <div style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>{branding.name} requires a subscription</div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 20, maxWidth: 400, margin: "0 auto 20px" }}>
              Subscribe to {branding.name} to create and manage tour routing, financials, and advancing.
            </div>
            <button
              onClick={async () => {
                const resp = await fetch("/api/tourrouter/billing/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ plan: "standalone" }),
                });
                if (resp.ok) {
                  const data = await resp.json();
                  window.location.href = data.url;
                }
              }}
              style={{ padding: "12px 28px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 900, fontSize: 14, cursor: "pointer" }}
            >Subscribe</button>
          </div>
        ) : loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#888" }}>Loading...</div>
        ) : (
          <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {tours.map((tour) => (
              <RoutingTourTile
                key={tour.id}
                tour={tour}
                onDelete={deleteTour}
              />
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

      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="fade-in"
            style={{ background: "#fff", borderRadius: 14, padding: 32, width: 420, maxWidth: "90vw", border: "1px solid #DDDDDD" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, letterSpacing: "-0.3px" }}>New Routing Tour</div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#888", display: "block", marginBottom: 6 }}>Tour Name</label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Summer 2026 US Run"
                autoFocus
                style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", border: "1px solid #DDDDDD", borderRadius: 10, fontSize: 15, fontWeight: 600, outline: "none" }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#888", display: "block", marginBottom: 6 }}>Artist (optional)</label>
              <select
                value={artistId}
                onChange={(e) => setArtistId(e.target.value)}
                style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", border: "1px solid #DDDDDD", borderRadius: 10, fontSize: 14, background: "#fff", outline: "none" }}
              >
                <option value="">No artist</option>
                {artists.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
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

// ── Tour Tile (matches Localizer TourTile pattern) ───────────

function RoutingTourTile({ tour, onDelete }: { tour: RoutingTour; onDelete: (id: string, e: React.MouseEvent) => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [hovered, setHovered] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Use artist image as background if available
  const imageUrl = tour.image_url || tour.artists?.image_url || null;
  const [currentImage, setCurrentImage] = useState<string | null>(imageUrl);
  const artistName = tour.artists?.name || null;

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
      // Save to tours_routing if the column exists, otherwise just display
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
      className="stagger-item"
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

        {/* Top: artist name */}
        <div style={{ position: "relative", zIndex: 1 }}>
          {artistName && (
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: currentImage ? "rgba(255,255,255,0.7)" : "#999", marginBottom: 6 }}>
              {artistName}
            </div>
          )}
        </div>

        {/* Bottom: tour name + meta */}
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

      {/* Hover: upload photo */}
      {mounted && hovered && (
        <button
          onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
          style={{ position: "absolute", top: 10, right: 10, zIndex: 10, padding: "5px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.4)", background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", backdropFilter: "blur(4px)", letterSpacing: "0.04em" }}
        >
          {uploading ? "Uploading\u2026" : currentImage ? "Change photo" : "+ Photo"}
        </button>
      )}

      {/* Hover: delete */}
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
