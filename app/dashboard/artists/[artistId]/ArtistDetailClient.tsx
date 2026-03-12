"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type Tour = { id: string; name: string; band_tour_label: string | null; image_url: string | null; };

const ADV_FIELDS = [
  { id: "adv_stage_plot_url", label: "Stage Plot" },
  { id: "adv_hospitality_url", label: "Hospitality Rider" },
  { id: "adv_foh_url", label: "FOH Requirements" },
  { id: "adv_w9_url", label: "W-9" },
];

export default function ArtistDetailClient({ artistId }: { artistId: string }) {
  const router = useRouter();
  const [tours, setTours] = useState<Tour[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [creatingTour, setCreatingTour] = useState(false);
  const [advMaterials, setAdvMaterials] = useState<{ [key: string]: string }>({});
  const [advUploading, setAdvUploading] = useState<string | null>(null);
  const fileRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [form, setForm] = useState({ name: "", bio: "", manager_name: "", manager_email: "", booking_agent_name: "", booking_agent_email: "", spotify_url: "" });

  useEffect(() => {
    async function load() {
      const { data: a } = await supabase.from("artists").select("*").eq("id", artistId).single();
      if (!a) { router.push("/dashboard"); return; }
      setForm({ name: a.name ?? "", bio: a.bio ?? "", manager_name: a.manager_name ?? "", manager_email: a.manager_email ?? "", booking_agent_name: a.booking_agent_name ?? "", booking_agent_email: a.booking_agent_email ?? "", spotify_url: a.spotify_url ?? "" });
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
    if (!error) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  }

  async function handleCreateTour() {
    setCreatingTour(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert("Not logged in."); setCreatingTour(false); return; }
    const { data: memberData } = await supabase.from("org_members").select("org_id").eq("user_id", user.id).maybeSingle();
    if (!memberData?.org_id) { alert("Could not find org."); setCreatingTour(false); return; }
    const { data, error } = await supabase.from("tours").insert({ name: "New Tour", artist_id: artistId, band_tour_label: form.name, org_id: memberData.org_id }).select("id").single();
    if (error || !data) { alert("Failed to create tour."); setCreatingTour(false); return; }
    router.push("/dashboard/tours/" + data.id);
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
    } catch (err) { console.error(err); alert("Upload failed."); }
    finally { setAdvUploading(null); }
  }

  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 14, background: "#fff", color: "#111", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#999", marginBottom: 6, display: "block" };

  return (
    <div style={{ minHeight: "100vh", background: "#EEEEEE", padding: "32px 24px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#888", marginBottom: 16, padding: 0 }}>Back</button>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <h1 className="brand-title" style={{ margin: 0, marginBottom: 4, paddingBottom: 8, borderBottom: "2px solid #111111" }}>LOCALIZER</h1>
              <h2 className="brand-title" style={{ margin: 0, fontSize: "400%", marginBottom: 0 }}>{form.name || "ARTIST"}</h2>
            </div>
            <button onClick={handleSave} disabled={saving} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: saved ? "#22c55e" : "#111", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {saved ? "Saved" : saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: 28, marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#999", marginBottom: 20 }}>Artist Info</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div><label style={labelStyle}>Artist / Band Name</label><input style={inputStyle} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label style={labelStyle}>Spotify URL</label><input style={inputStyle} value={form.spotify_url} onChange={(e) => setForm({ ...form, spotify_url: e.target.value })} placeholder="https://open.spotify.com/artist/..." /></div>
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
          {tours.map((tour) => (
            <div key={tour.id} onClick={() => router.push("/dashboard/tours/" + tour.id)} style={{ background: tour.image_url ? "transparent" : "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: 20, aspectRatio: "1 / 1", display: "flex", flexDirection: "column", justifyContent: "space-between", overflow: "hidden", position: "relative", cursor: "pointer" }}>
              {tour.image_url && (
                <>
                  <div style={{ position: "absolute", inset: 0, backgroundImage: "url(" + tour.image_url + ")", backgroundSize: "cover", backgroundPosition: "center" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 100%)" }} />
                </>
              )}
              <div style={{ position: "relative", zIndex: 1, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: tour.image_url ? "rgba(255,255,255,0.6)" : "#999" }}>Tour</div>
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: tour.image_url ? "#fff" : "#111", marginBottom: 8 }}>{tour.band_tour_label ?? tour.name}</div>
                <div style={{ fontSize: 16, color: tour.image_url ? "rgba(255,255,255,0.5)" : "#ccc", textAlign: "right" }}>&#8594;</div>
              </div>
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
