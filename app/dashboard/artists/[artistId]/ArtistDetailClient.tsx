"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/app/components/Toast";

type Tour = { id: string; name: string; band_tour_label: string | null; image_url: string | null; };

const ADV_FIELDS = [
  { id: "adv_stage_plot_url", label: "Stage Plot" },
  { id: "adv_hospitality_url", label: "Hospitality Rider" },
  { id: "adv_foh_url", label: "FOH Requirements" },
  { id: "adv_w9_url", label: "W-9" },
];

export default function ArtistDetailClient({ artistId }: { artistId: string }) {
  const router = useRouter();
  const toast = useToast();

  const [tours, setTours] = useState<Tour[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [creatingTour, setCreatingTour] = useState(false);
  const [deletingTourId, setDeletingTourId] = useState<string | null>(null);
  const [hoveredTourId, setHoveredTourId] = useState<string | null>(null);
  const [advMaterials, setAdvMaterials] = useState<{ [key: string]: string }>({});
  const [advUploading, setAdvUploading] = useState<string | null>(null);
  const fileRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [artistImageUrl, setArtistImageUrl] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ name: "", bio: "", manager_name: "", manager_email: "", booking_agent_name: "", booking_agent_email: "", publicist_name: "", publicist_email: "", agent_name: "", agent_email: "", spotify_url: "" });

  useEffect(() => {
    async function load() {
      const { data: a } = await supabase.from("artists").select("*").eq("id", artistId).single();
      if (!a) { router.push("/dashboard"); return; }
      setForm({ name: a.name ?? "", bio: a.bio ?? "", manager_name: a.manager_name ?? "", manager_email: a.manager_email ?? "", booking_agent_name: a.booking_agent_name ?? "", booking_agent_email: a.booking_agent_email ?? "", publicist_name: a.publicist_name ?? "", publicist_email: a.publicist_email ?? "", agent_name: a.agent_name ?? "", agent_email: a.agent_email ?? "", spotify_url: a.spotify_url ?? "" });
      setArtistImageUrl(a.image_url ?? null);
      setLogoUrl(a.logo_url && a.logo_url.startsWith("http") ? a.logo_url : null);
      setAdvMaterials({ adv_stage_plot_url: a.adv_stage_plot_url ?? "", adv_hospitality_url: a.adv_hospitality_url ?? "", adv_foh_url: a.adv_foh_url ?? "", adv_w9_url: a.adv_w9_url ?? "" });
      const { data: t } = await supabase.from("tours").select("id, name, band_tour_label, image_url").eq("artist_id", artistId).order("created_at", { ascending: false });
      setTours(t ?? []);

    }
    load();
  }, [artistId, router]);

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.from("artists").update(form).eq("id", artistId);
    setSaving(false);
    if (error) {
      console.error("Save failed:", error);
      toast.error(`Save failed: ${error.message}`);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleCreateTour() {
    setCreatingTour(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Not logged in."); setCreatingTour(false); return; }
    const { data: memberData } = await supabase.from("org_members").select("org_id").eq("user_id", user.id).maybeSingle();
    if (!memberData?.org_id) { toast.error("Could not find org."); setCreatingTour(false); return; }
    const { data, error } = await supabase.from("tours").insert({ name: "New Tour", artist_id: artistId, band_name: form.name, org_id: memberData.org_id }).select("id").single();
    if (error || !data) { toast.error("Failed to create tour."); setCreatingTour(false); return; }
    router.push("/dashboard/tours/" + data.id + "/import");
  }

  async function handleAdvUpload(fieldId: string, file: File) {
    setAdvUploading(fieldId);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const path = "artist-assets/" + artistId + "/advance/" + fieldId + "." + ext;
      const { error: uploadError } = await supabase.storage.from("localizer-assets").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("localizer-assets").getPublicUrl(path);
      await supabase.from("artists").update({ [fieldId]: data.publicUrl }).eq("id", artistId);
      setAdvMaterials((prev) => ({ ...prev, [fieldId]: data.publicUrl }));
    } catch (err) { console.error(err); toast.error("Upload failed."); }
    finally { setAdvUploading(null); }
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

  async function handleLogoUpload(file: File) {
    if (!file.type.startsWith("image/png")) {
      toast.error("Please upload a .png file (transparent background recommended)");
      return;
    }
    setUploadingLogo(true);
    try {
      const path = "artist-assets/" + artistId + "/logo.png";
      const { error: uploadError } = await supabase.storage.from("localizer-assets").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("localizer-assets").getPublicUrl(path);
      const urlWithBust = data.publicUrl + "?t=" + Date.now();
      await supabase.from("artists").update({ logo_url: urlWithBust }).eq("id", artistId);
      setLogoUrl(urlWithBust);
    } catch (err: any) {
      console.error(err);
      toast.error("Logo upload failed: " + err.message);
    } finally {
      setUploadingLogo(false);
    }
  }

  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 14, background: "#fff", color: "#111", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#999", marginBottom: 6, display: "block" };

  return (
    <div className="fade-in" style={{ minHeight: "100vh", background: "#F7F7F5", padding: "32px 24px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#888", marginBottom: 16, padding: 0 }}>Back</button>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <h1 className="brand-title" style={{ margin: 0, marginBottom: 4, paddingBottom: 8, borderBottom: "2px solid #111111" }}>LOCALIZER</h1>
              <h2 className="brand-title" style={{ margin: 0, fontSize: "400%", marginBottom: 0 }}>{form.name || "ARTIST"}</h2>
              <div style={{ borderBottom: "2px solid #111111", marginTop: 6, marginBottom: 6 }} />
              <div className="brand-title" style={{ margin: 0, fontSize: "360%" }}>Advance Materials / Tours</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => router.push(`/dashboard/artists/${artistId}/profile`)} style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #DDDDDD", background: "#fff", color: "#111", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Profile</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: saved ? "#1a7f4b" : "#111", color: "#fff", fontSize: 13, fontWeight: 900, cursor: "pointer", transition: "background 0.3s" }}>
                {saved ? "Saved" : saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: 28, marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#999", marginBottom: 20 }}>Artist Info</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 16, marginBottom: 16 }}>
            <div><label style={labelStyle}>Artist / Band Name</label><input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label style={labelStyle}>Spotify URL</label><input style={inputStyle} value={form.spotify_url} onChange={(e) => setForm({ ...form, spotify_url: e.target.value })} placeholder="https://open.spotify.com/artist/..." /></div>
            <div>
              <label style={labelStyle}>Band Logo</label>
              <input ref={logoFileRef} type="file" accept=".png" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }} />
              <div onMouseEnter={() => setLogoHovered(true)} onMouseLeave={() => setLogoHovered(false)} onClick={() => !logoUrl && logoFileRef.current?.click()} style={{ width: 88, height: 88, background: "#FAFAFA", border: logoUrl ? "1.5px solid #22c55e" : "1.5px dashed #DDDDDD", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: logoUrl ? "default" : "pointer", overflow: "hidden", position: "relative" }}>
                {uploadingLogo ? (
                  <div style={{ fontSize: 11, color: "#aaa", fontWeight: 700 }}>Uploading...</div>
                ) : logoUrl ? (
                  <>
                    <img src={logoUrl} alt="Logo" style={{ maxWidth: "80%", maxHeight: "80%", objectFit: "contain" }} />
                    {logoHovered && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <button onClick={(e) => { e.stopPropagation(); logoFileRef.current?.click(); }} style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "#fff", color: "#111", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>Replace</button>
                        <button onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm("Delete band logo?")) return;
                          try {
                            const path = "artist-assets/" + artistId + "/logo.png";
                            await supabase.storage.from("localizer-assets").remove([path]);
                            await supabase.from("artists").update({ logo_url: null }).eq("id", artistId);
                            setLogoUrl(null);
                          } catch (err: any) { toast.error("Delete failed: " + err.message); }
                        }} style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "#c00", color: "#fff", fontSize: 9, fontWeight: 700, cursor: "pointer" }}>Delete</button>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 20, color: "#CCC" }}>&#8593;</div>
                    <div style={{ fontSize: 8, fontWeight: 800, color: "#BBB", textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.4 }}>Upload<br/>Transparent .png</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Bio</label>
            <textarea style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Artist biography..." />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 }}>
            <div><label style={labelStyle}>Manager Name</label><input style={inputStyle} value={form.manager_name} onChange={(e) => setForm({ ...form, manager_name: e.target.value })} /></div>
            <div><label style={labelStyle}>Manager Email</label><input style={inputStyle} value={form.manager_email} onChange={(e) => setForm({ ...form, manager_email: e.target.value })} /></div>
            <div><label style={labelStyle}>Booking Agent</label><input style={inputStyle} value={form.booking_agent_name} onChange={(e) => setForm({ ...form, booking_agent_name: e.target.value })} /></div>
            <div><label style={labelStyle}>Booking Agent Email</label><input style={inputStyle} value={form.booking_agent_email} onChange={(e) => setForm({ ...form, booking_agent_email: e.target.value })} /></div>
            <div><label style={labelStyle}>Publicist Name</label><input style={inputStyle} value={form.publicist_name} onChange={(e) => setForm({ ...form, publicist_name: e.target.value })} /></div>
            <div><label style={labelStyle}>Publicist Email</label><input style={inputStyle} value={form.publicist_email} onChange={(e) => setForm({ ...form, publicist_email: e.target.value })} /></div>
            <div><label style={labelStyle}>Agent Name</label><input style={inputStyle} value={form.agent_name} onChange={(e) => setForm({ ...form, agent_name: e.target.value })} /></div>
            <div><label style={labelStyle}>Agent Email</label><input style={inputStyle} value={form.agent_email} onChange={(e) => setForm({ ...form, agent_email: e.target.value })} /></div>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: 28, marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#999", marginBottom: 20 }}>Advance Materials</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {ADV_FIELDS.map((field) => {
              const url = advMaterials[field.id];
              const isUploading = advUploading === field.id;
              return (
                <div key={field.id}>
                  <label style={labelStyle}>{field.label}</label>
                  <input ref={(el) => { fileRefs.current[field.id] = el; }} type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAdvUpload(field.id, f); }} />
                  <div onClick={() => !url && fileRefs.current[field.id]?.click()} style={{ padding: "20px 16px", background: "#FAFAFA", border: url ? "1.5px solid #22c55e" : "1.5px dashed #DDDDDD", borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: url ? "default" : "pointer", minHeight: 90 }}>
                    {isUploading ? (
                      <div style={{ fontSize: 12, color: "#aaa", fontWeight: 700 }}>Uploading...</div>
                    ) : url ? (
                      <>
                        <div style={{ fontSize: 20 }}>&#10003;</div>
                        <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Uploaded</div>
                        <button onClick={(e) => { e.stopPropagation(); fileRefs.current[field.id]?.click(); }} style={{ marginTop: 4, padding: "4px 10px", borderRadius: 6, border: "1px solid #DDD", background: "transparent", color: "#888", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>Replace</button>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 20, color: "#CCC" }}>&#8593;</div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#CCC", textTransform: "uppercase", letterSpacing: "0.08em" }}>Upload</div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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
                  {deletingTourId === tour.id ? "Deleting…" : "Delete"}
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
