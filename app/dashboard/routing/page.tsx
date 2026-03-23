"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type RoutingTour = {
  id: string;
  name: string;
  artist_id: string | null;
  created_at: string;
  updated_at: string;
  artists: { name: string } | null;
};

export default function RoutingListPage() {
  const router = useRouter();
  const [tours, setTours] = useState<RoutingTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [artistId, setArtistId] = useState("");
  const [artists, setArtists] = useState<{ id: string; name: string }[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTours();
    fetchArtists();
  }, []);

  async function fetchTours() {
    const resp = await fetch("/api/tourrouter/tours");
    if (resp.ok) {
      const data = await resp.json();
      setTours(data.tours);
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

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="fade-in" style={{ minHeight: "100vh", background: "#EEEEEE", padding: "32px 24px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32 }}>
          <div>
            <Link href="/dashboard/artists" style={{ fontSize: 13, fontWeight: 700, color: "#888", textDecoration: "none", display: "inline-block", marginBottom: 8 }}>&larr; Back to Artists</Link>
            <h1 className="brand-title" style={{ margin: 0, marginBottom: 4, paddingBottom: 8, borderBottom: "2px solid #111111" }}>TOURROUTER.</h1>
            <h2 className="brand-title" style={{ margin: 0, marginBottom: 6, fontSize: "400%" }}>YOUR TOURS</h2>
            <div style={{ fontSize: 13, color: "#888" }}>{tours.length} tour{tours.length !== 1 ? "s" : ""}</div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#888" }}>Loading...</div>
        ) : (
          <div className="stagger" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
            {tours.map((tour) => (
              <Link
                key={tour.id}
                href={`/dashboard/routing/${tour.id}`}
                className="card-hover stagger-item"
                style={{
                  display: "block",
                  background: "#fff",
                  border: "1px solid #DDDDDD",
                  borderRadius: 14,
                  padding: 24,
                  textDecoration: "none",
                  color: "#111",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.3px" }}>{tour.name}</div>
                {tour.artists?.name && (
                  <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>{tour.artists.name}</div>
                )}
                <div style={{ fontSize: 12, color: "#aaa" }}>Created {formatDate(tour.created_at)}</div>
              </Link>
            ))}

            <button
              onClick={() => setShowModal(true)}
              className="btn-hover"
              style={{
                background: "transparent",
                border: "1.5px dashed #CCCCCC",
                borderRadius: 14,
                padding: 40,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
                minHeight: 140,
              }}
            >
              <span style={{ fontSize: 48, fontWeight: 900, color: "#111", lineHeight: 1 }}>+</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#aaa", letterSpacing: "0.04em" }}>New Tour</span>
            </button>
          </div>
        )}
      </div>

      {/* New Tour Modal */}
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
