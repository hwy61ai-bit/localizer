"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// ── Types ────────────────────────────────────────────────────

type ArtistData = {
  id: string;
  name: string;
  bio: string | null;
  spotify_url: string | null;
  logo_url: string | null;
  image_url: string | null;
  manager_name: string | null;
  manager_email: string | null;
  manager_phone: string | null;
  booking_agent_name: string | null;
  booking_agent_email: string | null;
  booking_agent_phone: string | null;
  publicist_name: string | null;
  publicist_email: string | null;
  publicist_phone: string | null;
  agent_name: string | null;
  agent_email: string | null;
  agent_phone: string | null;
  adv_stage_plot_url: string | null;
  adv_hospitality_url: string | null;
  adv_foh_url: string | null;
  adv_w9_url: string | null;
  key_contacts: unknown[] | null;
  [key: string]: unknown;
};

const ADV_FIELDS = [
  { id: "adv_stage_plot_url", label: "Stage Plot" },
  { id: "adv_hospitality_url", label: "Hospitality Rider" },
  { id: "adv_foh_url", label: "FOH Requirements" },
  { id: "adv_w9_url", label: "W-9" },
];

const TEAM_ROLES = [
  { key: "manager", label: "Manager" },
  { key: "booking_agent", label: "Booking Agent" },
  { key: "publicist", label: "Publicist" },
  { key: "agent", label: "Agent" },
] as const;

// ── Component ────────────────────────────────────────────────

export default function ArtistProfilePage() {
  const params = useParams();
  const router = useRouter();
  const artistId = params?.artistId as string;

  const [artist, setArtist] = useState<ArtistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Logo
  const logoFileRef = useRef<HTMLInputElement>(null);
  const [logoHovered, setLogoHovered] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Advance materials
  const advFileRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [advUploading, setAdvUploading] = useState<string | null>(null);

  // Debounced save
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Fetch ────────────────────────────────────────────────────

  useEffect(() => {
    if (!artistId) return;
    async function load() {
      const { data } = await supabase.from("artists").select("*").eq("id", artistId).single();
      if (!data) { router.push("/dashboard"); return; }
      setArtist(data as ArtistData);
      setLoading(false);
    }
    load();
  }, [artistId, router]);

  // ── Save (debounced) ─────────────────────────────────────────

  const saveFields = useCallback(
    (updates: Record<string, unknown>) => {
      if (!artist) return;
      // Optimistic local update
      setArtist((prev) => prev ? { ...prev, ...updates } : prev);

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          // Save flat columns via Supabase directly
          await supabase.from("artists").update(updates).eq("id", artistId);

          // Also sync to key_contacts JSON if a team field changed
          const teamKeys = TEAM_ROLES.flatMap((r) => [`${r.key}_name`, `${r.key}_email`, `${r.key}_phone`]);
          const touchedTeam = Object.keys(updates).some((k) => teamKeys.includes(k));
          if (touchedTeam) {
            const fresh = { ...artist, ...updates };
            const contacts = TEAM_ROLES.map((role) => ({
              id: role.key,
              name: (fresh as any)[`${role.key}_name`] || "",
              email: (fresh as any)[`${role.key}_email`] || null,
              phone: (fresh as any)[`${role.key}_phone`] || null,
              role: role.key,
              company: null,
              commissionPct: null,
              commissionType: null,
              contractStart: null,
              contractEnd: null,
              notes: null,
              roleLabel: role.label,
            })).filter((c) => c.name);
            await fetch(`/api/tourrouter/artists/${artistId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key_contacts: contacts }),
            });
          }

          setSavedAt(Date.now());
          setTimeout(() => setSavedAt(null), 1500);
        } catch (e) {
          console.error("Save failed:", e);
        } finally {
          setSaving(false);
        }
      }, 600);
    },
    [artist, artistId]
  );

  function updateField(field: string, value: string) {
    saveFields({ [field]: value || null });
  }

  // Save JSON columns via API route (debounced)
  const jsonTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveJsonColumn = useCallback(
    (column: string, value: unknown) => {
      setArtist((prev) => prev ? { ...prev, [column]: value } : prev);
      if (jsonTimerRef.current) clearTimeout(jsonTimerRef.current);
      jsonTimerRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          await fetch(`/api/tourrouter/artists/${artistId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ [column]: value }),
          });
          setSavedAt(Date.now());
          setTimeout(() => setSavedAt(null), 1500);
        } catch (e) {
          console.error("Save failed:", e);
        } finally {
          setSaving(false);
        }
      }, 600);
    },
    [artistId]
  );

  function updateJsonPath(column: string, path: string, value: unknown) {
    const current = (artist as any)?.[column] || {};
    saveJsonColumn(column, { ...current, [path]: value });
  }

  // ── Logo Upload ──────────────────────────────────────────────

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true);
    try {
      const path = `artist-assets/${artistId}/logo.png`;
      const { error } = await supabase.storage.from("localizer-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("localizer-assets").getPublicUrl(path);
      const url = data.publicUrl + "?t=" + Date.now();
      await supabase.from("artists").update({ logo_url: url }).eq("id", artistId);
      setArtist((prev) => prev ? { ...prev, logo_url: url } : prev);
    } catch (e) {
      console.error("Logo upload failed:", e);
    } finally {
      setUploadingLogo(false);
    }
  }

  // ── Advance Upload ───────────────────────────────────────────

  async function handleAdvUpload(fieldId: string, file: File) {
    setAdvUploading(fieldId);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const path = `artist-assets/${artistId}/advance/${fieldId}.${ext}`;
      const { error } = await supabase.storage.from("localizer-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("localizer-assets").getPublicUrl(path);
      await supabase.from("artists").update({ [fieldId]: data.publicUrl }).eq("id", artistId);
      setArtist((prev) => prev ? { ...prev, [fieldId]: data.publicUrl } : prev);
    } catch (e) {
      console.error("Upload failed:", e);
    } finally {
      setAdvUploading(null);
    }
  }

  // ── Loading ──────────────────────────────────────────────────

  if (loading || !artist) {
    return (
      <div style={{ minHeight: "100vh", background: "#F7F7F5", display: "grid", placeItems: "center" }}>
        <div style={{ fontSize: 13, color: "#888" }}>Loading...</div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────

  const showSaved = savedAt && Date.now() - savedAt < 1500;

  return (
    <div style={{ minHeight: "100vh", background: "#F7F7F5", padding: "24px 24px 80px" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Back + save indicator */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <button
            onClick={() => router.back()}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#888", padding: 0 }}
          >
            &larr; Back
          </button>
          <div style={{ fontSize: 11, color: saving ? "#888" : showSaved ? "#1a6b3c" : "transparent", transition: "color 0.2s" }}>
            {saving ? "Saving..." : showSaved ? "Saved" : "."}
          </div>
        </div>

        <style>{`
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes underlineDraw {
            from { width: 0; }
            to { width: 100%; }
          }
        `}</style>

        {/* ══════ Header ══════ */}
        <div style={{
          background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14,
          padding: 28, marginBottom: 20,
        }}>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            {/* Logo */}
            <div>
              <input
                ref={logoFileRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); }}
              />
              <div
                onMouseEnter={() => setLogoHovered(true)}
                onMouseLeave={() => setLogoHovered(false)}
                onClick={() => logoFileRef.current?.click()}
                style={{
                  width: 72, height: 72, borderRadius: 12,
                  background: "#f5f5f5",
                  border: artist.logo_url ? "2px solid #DDDDDD" : "2px dashed #ccc",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", overflow: "hidden", position: "relative",
                  flexShrink: 0,
                }}
              >
                {uploadingLogo ? (
                  <div style={{ fontSize: 9, color: "#888", fontWeight: 700 }}>...</div>
                ) : artist.logo_url ? (
                  <>
                    <img
                      src={artist.logo_url}
                      alt="Logo"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    {logoHovered && (
                      <div style={{
                        position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        borderRadius: 12,
                      }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#fff" }}>Replace</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 16, color: "#bbb" }}>+</div>
                    <div style={{ fontSize: 7, fontWeight: 700, color: "#bbb", textTransform: "uppercase" }}>Logo</div>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 9, color: "#999", marginTop: 6, textAlign: "center", maxWidth: 72 }}>
                Upload a transparent .PNG for best results
              </div>
            </div>

            {/* Name + Spotify */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <input
                value={artist.name || ""}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Artist Name"
                style={{
                  fontSize: 36, fontWeight: 900, letterSpacing: "0.07em",
                  textTransform: "uppercase" as const,
                  border: "none", outline: "none",
                  background: "linear-gradient(90deg, #1a1a2e, #3b82f6)",
                  WebkitBackgroundClip: "text", backgroundClip: "text",
                  color: "transparent",
                  width: "100%", padding: 0, marginBottom: 4,
                  animation: "fadeSlideUp 0.5s ease-out both",
                }}
              />
              <div style={{
                height: 2,
                background: "linear-gradient(90deg, #1a1a2e, #3b82f6)",
                animation: "underlineDraw 0.4s ease-out 0.4s both",
                marginBottom: 8,
              }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "#999", flexShrink: 0 }}>Spotify</span>
                <input
                  value={artist.spotify_url || ""}
                  onChange={(e) => updateField("spotify_url", e.target.value)}
                  placeholder="https://open.spotify.com/artist/..."
                  style={{
                    fontSize: 12, color: "#555", border: "none", outline: "none",
                    background: "transparent", flex: 1, padding: 0,
                  }}
                />
                {artist.spotify_url && (
                  <a
                    href={artist.spotify_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 11, color: "#1a6b3c", textDecoration: "none", fontWeight: 600, flexShrink: 0 }}
                  >
                    Open &rarr;
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ══════ Bio ══════ */}
        <div style={{
          background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14,
          padding: 28, marginBottom: 20,
        }}>
          <SectionLabel>Bio</SectionLabel>
          <textarea
            value={artist.bio || ""}
            onChange={(e) => updateField("bio", e.target.value)}
            placeholder="Artist biography..."
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "10px 12px", border: "1px solid #eee", borderRadius: 8,
              fontSize: 13, color: "#333", lineHeight: 1.7, background: "#fafaf8",
              outline: "none", resize: "vertical", minHeight: 100,
            }}
          />
        </div>

        {/* ══════ Team ══════ */}
        <div style={{
          background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14,
          padding: 28, marginBottom: 20,
        }}>
          <SectionLabel>Team</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {TEAM_ROLES.map((role) => (
              <TeamCard
                key={role.key}
                label={role.label}
                name={(artist as any)[`${role.key}_name`] || ""}
                email={(artist as any)[`${role.key}_email`] || ""}
                phone={(artist as any)[`${role.key}_phone`] || ""}
                onChangeName={(v) => updateField(`${role.key}_name`, v)}
                onChangeEmail={(v) => updateField(`${role.key}_email`, v)}
                onChangePhone={(v) => updateField(`${role.key}_phone`, v)}
              />
            ))}
          </div>
        </div>

        {/* ══════ Advance Materials ══════ */}
        <div style={{
          background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14,
          padding: 28, marginBottom: 20,
        }}>
          <SectionLabel>Advance Materials</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {ADV_FIELDS.map((field) => {
              const url = (artist as any)[field.id] as string | null;
              const isUploading = advUploading === field.id;
              return (
                <div key={field.id}>
                  <input
                    ref={(el) => { advFileRefs.current[field.id] = el; }}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                    style={{ display: "none" }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAdvUpload(field.id, f); }}
                  />
                  <div
                    onClick={() => advFileRefs.current[field.id]?.click()}
                    style={{
                      padding: "16px 18px",
                      background: url ? "#f0faf4" : "#fafaf8",
                      border: url ? "1px solid #c8e6c9" : "1px solid #eee",
                      borderRadius: 10, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      transition: "border-color 0.15s",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 2 }}>
                        {field.label}
                      </div>
                      <div style={{ fontSize: 11, color: url ? "#1a6b3c" : "#aaa" }}>
                        {isUploading ? "Uploading..." : url ? "Uploaded" : "Not uploaded"}
                      </div>
                    </div>
                    <div>
                      {url ? (
                        <span style={{
                          fontSize: 9, fontWeight: 800, color: "#1a6b3c",
                          background: "#e8f5e9", padding: "3px 8px", borderRadius: 4,
                          textTransform: "uppercase", letterSpacing: "0.06em",
                        }}>
                          PDF
                        </span>
                      ) : (
                        <span style={{ fontSize: 16, color: "#ccc" }}>&#8593;</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══════ Divider ══════ */}
        <div style={{ borderTop: "1px solid #eee", margin: "2rem 0" }} />

        {/* ══════ 1. Roster ══════ */}
        <Accordion
          title="Roster"
          badge={String((artist.default_roster as any[] || []).length)}
          badgeColor="gray"
        >
          <RosterSection
            roster={(artist.default_roster as any[]) || []}
            onUpdate={(v) => saveJsonColumn("default_roster", v)}
          />
        </Accordion>

        {/* ══════ 2. Vehicles & Equipment ══════ */}
        <Accordion
          title="Vehicles & Equipment"
          badge={(() => {
            const ve = (artist.vehicles_equipment as any) || {};
            const count = (ve.vehicles as any[] || []).length;
            return count ? String(count) : "0";
          })()}
          badgeColor="gray"
        >
          <VehiclesSection
            data={(artist.vehicles_equipment as any) || {}}
            onUpdate={(v) => saveJsonColumn("vehicles_equipment", v)}
          />
        </Accordion>

        {/* ══════ 3. Hospitality & Rider ══════ */}
        <Accordion
          title="Hospitality & Rider"
          badge={(() => {
            const h = (artist.hospitality_rider as any) || {};
            const fields = ["dressingRoomRequirements", "cateringRequirements", "hospitalityRequirements", "dietaryNotes", "alcoholPreferences", "buyoutAmount", "towelCount", "greenRoomRequirements"];
            const filled = fields.filter((f) => h[f]).length;
            return filled === fields.length ? "Complete" : `${filled} of ${fields.length}`;
          })()}
          badgeColor={(() => {
            const h = (artist.hospitality_rider as any) || {};
            const fields = ["dressingRoomRequirements", "cateringRequirements", "hospitalityRequirements", "dietaryNotes", "alcoholPreferences", "buyoutAmount", "towelCount", "greenRoomRequirements"];
            const filled = fields.filter((f) => h[f]).length;
            return filled === fields.length ? "green" : filled > 0 ? "amber" : "gray";
          })()}
        >
          <JsonFieldRows column="hospitality_rider" artist={artist} onUpdate={(p, v) => updateJsonPath("hospitality_rider", p, v)} fields={[
            { path: "dressingRoomRequirements", label: "Dressing Room", type: "textarea" },
            { path: "cateringRequirements", label: "Catering", type: "textarea" },
            { path: "hospitalityRequirements", label: "Hospitality", type: "textarea" },
            { path: "greenRoomRequirements", label: "Green Room", type: "textarea" },
            { path: "buyoutAmount", label: "Buyout Amount", type: "number" },
            { path: "buyoutCurrency", label: "Buyout Currency" },
            { path: "towelCount", label: "Towels", type: "number" },
            { path: "dietaryNotes", label: "Dietary Notes", type: "textarea" },
            { path: "alcoholPreferences", label: "Alcohol Preferences", type: "textarea" },
            { path: "notes", label: "Notes", type: "textarea" },
          ]} />
        </Accordion>

        {/* ══════ 4. Promo & Marketing ══════ */}
        <Accordion
          title="Promo & Marketing"
          badge={(() => {
            const p = (artist.promo_marketing as any) || {};
            const fields = ["websiteUrl", "spotifyUrl", "instagramUrl", "tiktokUrl", "youtubeUrl", "facebookUrl", "twitterUrl", "appleMusicUrl", "bandcampUrl", "epkUrl", "bioShort", "bioLong"];
            const filled = fields.filter((f) => p[f]).length;
            return `${filled} of ${fields.length}`;
          })()}
          badgeColor={(() => {
            const p = (artist.promo_marketing as any) || {};
            const fields = ["websiteUrl", "spotifyUrl", "instagramUrl", "tiktokUrl", "youtubeUrl", "facebookUrl", "twitterUrl", "appleMusicUrl", "bandcampUrl", "epkUrl", "bioShort", "bioLong"];
            const filled = fields.filter((f) => p[f]).length;
            return filled >= 6 ? "green" : filled > 0 ? "amber" : "gray";
          })()}
        >
          <JsonFieldRows column="promo_marketing" artist={artist} onUpdate={(p, v) => updateJsonPath("promo_marketing", p, v)} fields={[
            { path: "websiteUrl", label: "Website", placeholder: "https://" },
            { path: "spotifyUrl", label: "Spotify" },
            { path: "instagramUrl", label: "Instagram" },
            { path: "tiktokUrl", label: "TikTok" },
            { path: "youtubeUrl", label: "YouTube" },
            { path: "facebookUrl", label: "Facebook" },
            { path: "twitterUrl", label: "Twitter / X" },
            { path: "appleMusicUrl", label: "Apple Music" },
            { path: "bandcampUrl", label: "Bandcamp" },
            { path: "epkUrl", label: "EPK URL" },
            { path: "bioShort", label: "Short Bio", type: "textarea", placeholder: "1-2 sentences" },
            { path: "bioLong", label: "Full Bio", type: "textarea" },
            { path: "notes", label: "Notes", type: "textarea" },
          ]} />
        </Accordion>

        {/* ══════ 5. Business Entity ══════ */}
        <Accordion title="Business Entity" badge="" badgeColor="gray">
          <JsonFieldRows column="business_entity" artist={artist} onUpdate={(p, v) => updateJsonPath("business_entity", p, v)} fields={[
            { path: "legalName", label: "Legal Name", placeholder: "As registered" },
            { path: "dba", label: "DBA / Artist Name" },
            { path: "entityType", label: "Entity Type", placeholder: "LLC, S-Corp, etc." },
            { path: "ein", label: "EIN / Tax ID", placeholder: "XX-XXXXXXX" },
            { path: "stateOfFormation", label: "State of Formation" },
            { path: "countryOfFormation", label: "Country" },
            { path: "businessAddress", label: "Business Address" },
            { path: "mailingAddress", label: "Mailing Address" },
            { path: "businessPhone", label: "Phone" },
            { path: "businessEmail", label: "Email" },
            { path: "yearFormed", label: "Year Formed", type: "number" },
            { path: "registeredAgent", label: "Registered Agent" },
          ]} />
        </Accordion>

        {/* ══════ 6. Tax & Compliance ══════ */}
        <Accordion
          title="Tax & Compliance"
          badge={(() => {
            const t = (artist.tax_compliance as any) || {};
            const fields = ["taxClassification", "vatNumber", "vatCountry", "defaultWithholdingPct"];
            const filled = fields.filter((f) => t[f]).length;
            return `${filled} of ${fields.length}`;
          })()}
          badgeColor={(() => {
            const t = (artist.tax_compliance as any) || {};
            const fields = ["taxClassification", "vatNumber", "vatCountry", "defaultWithholdingPct"];
            const filled = fields.filter((f) => t[f]).length;
            return filled === fields.length ? "green" : filled > 0 ? "amber" : "gray";
          })()}
        >
          <JsonFieldRows column="tax_compliance" artist={artist} onUpdate={(p, v) => updateJsonPath("tax_compliance", p, v)} fields={[
            { path: "taxClassification", label: "Tax Classification" },
            { path: "vatNumber", label: "VAT Number" },
            { path: "vatCountry", label: "VAT Country" },
            { path: "defaultWithholdingPct", label: "Default Withholding %", type: "number" },
            { path: "notes", label: "Notes", type: "textarea" },
          ]} />
        </Accordion>

        {/* ══════ 7. Insurance ══════ */}
        <Accordion
          title="Insurance"
          badge={String(((artist.insurance as any)?.policies || []).length)}
          badgeColor="gray"
        >
          <InsuranceSection
            data={(artist.insurance as any) || { policies: [], notes: null }}
            onUpdate={(v) => saveJsonColumn("insurance", v)}
          />
        </Accordion>

        {/* ══════ 8. Technical Production ══════ */}
        <Accordion
          title="Technical Production"
          badge={(() => {
            const t = (artist.technical_production as any) || {};
            const fields = ["fohConsolePreference", "monitorConsolePreference", "iemSystem", "backlineRequirements", "lightingRequirements", "powerRequirements", "stageMinWidth", "stageMinDepth", "setLength", "changeover"];
            const filled = fields.filter((f) => t[f]).length;
            return `${filled} of ${fields.length}`;
          })()}
          badgeColor={(() => {
            const t = (artist.technical_production as any) || {};
            const fields = ["fohConsolePreference", "monitorConsolePreference", "iemSystem", "backlineRequirements", "lightingRequirements", "powerRequirements", "stageMinWidth", "stageMinDepth", "setLength", "changeover"];
            const filled = fields.filter((f) => t[f]).length;
            return filled >= 5 ? "green" : filled > 0 ? "amber" : "gray";
          })()}
        >
          <JsonFieldRows column="technical_production" artist={artist} onUpdate={(p, v) => updateJsonPath("technical_production", p, v)} fields={[
            { path: "fohConsolePreference", label: "FOH Console", placeholder: "e.g. Avid S6L" },
            { path: "monitorConsolePreference", label: "Monitor Console" },
            { path: "iemSystem", label: "IEM System" },
            { path: "backlineRequirements", label: "Backline", type: "textarea" },
            { path: "lightingRequirements", label: "Lighting", type: "textarea" },
            { path: "videoRequirements", label: "Video", type: "textarea" },
            { path: "powerRequirements", label: "Power" },
            { path: "stageMinWidth", label: "Min Stage Width" },
            { path: "stageMinDepth", label: "Min Stage Depth" },
            { path: "riggingNeeds", label: "Rigging" },
            { path: "sfxNeeds", label: "SFX" },
            { path: "setLength", label: "Set Length (min)", type: "number" },
            { path: "changeover", label: "Changeover (min)", type: "number" },
            { path: "notes", label: "Notes", type: "textarea" },
          ]} />
        </Accordion>

      </div>
    </div>
  );
}

// ── Sub-Components ──────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 500, textTransform: "uppercase" as const,
      letterSpacing: 1.2, color: "#999",
      borderBottom: "1px solid #eee", paddingBottom: 8, marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

function TeamCard({
  label, name, email, phone,
  onChangeName, onChangeEmail, onChangePhone,
}: {
  label: string;
  name: string;
  email: string;
  phone: string;
  onChangeName: (v: string) => void;
  onChangeEmail: (v: string) => void;
  onChangePhone: (v: string) => void;
}) {
  const fieldStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    padding: "6px 10px", border: "1px solid #eee", borderRadius: 6,
    fontSize: 12, color: "#333", background: "#fafaf8", outline: "none",
  };

  return (
    <div style={{
      padding: "14px 16px", background: "#fafaf8",
      border: "1px solid #eee", borderRadius: 10,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const,
        letterSpacing: "0.1em", color: "#999", marginBottom: 10,
      }}>
        {label}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <input
          style={fieldStyle}
          value={name}
          onChange={(e) => onChangeName(e.target.value)}
          placeholder="Name"
        />
        <input
          style={fieldStyle}
          value={email}
          onChange={(e) => onChangeEmail(e.target.value)}
          placeholder="Email"
          type="email"
        />
        <input
          style={fieldStyle}
          value={phone}
          onChange={(e) => onChangePhone(e.target.value)}
          placeholder="Phone"
          type="tel"
        />
      </div>
    </div>
  );
}

// ── Accordion ──────────────────────────────────────────────────

function Accordion({
  title, badge, badgeColor, children,
}: {
  title: string;
  badge: string;
  badgeColor: "green" | "amber" | "gray";
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);

  const colors = {
    green: { bg: "#e8f5e9", text: "#1a6b3c" },
    amber: { bg: "#fff3e0", text: "#b35c00" },
    gray: { bg: "#f0f0f0", text: "#888" },
  };
  const bc = colors[badgeColor];

  return (
    <div style={{
      background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14,
      marginBottom: 10, overflow: "hidden",
    }}>
      <div
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 24px", cursor: "pointer", userSelect: "none" as const,
          background: hovered ? "#fafaf8" : "#fff",
          transition: "background 0.1s",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{title}</span>
          {badge && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
              background: bc.bg, color: bc.text,
            }}>
              {badge}
            </span>
          )}
        </div>
        <span style={{
          fontSize: 12, color: "#999",
          transform: open ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 0.2s",
          display: "inline-block",
        }}>
          &#9656;
        </span>
      </div>
      {open && (
        <div style={{ padding: "0 24px 24px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── JsonFieldRows (reusable for simple label/value sections) ──

const rowInputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  padding: "7px 10px", border: "1px solid #eee", borderRadius: 6,
  fontSize: 13, color: "#333", background: "#fafaf8", outline: "none",
};

const rowTextareaStyle: React.CSSProperties = {
  ...rowInputStyle, minHeight: 64, resize: "vertical" as const, lineHeight: 1.6,
};

function JsonFieldRows({
  column, artist, onUpdate, fields,
}: {
  column: string;
  artist: ArtistData;
  onUpdate: (path: string, value: unknown) => void;
  fields: Array<{ path: string; label: string; type?: string; placeholder?: string }>;
}) {
  const data = (artist as any)[column] || {};
  return (
    <div style={{ display: "grid", gap: 0 }}>
      {fields.map((f) => {
        const val = data[f.path] ?? "";
        return (
          <div key={f.path} style={{
            display: "grid", gridTemplateColumns: "160px 1fr", gap: 10,
            alignItems: f.type === "textarea" ? "flex-start" : "center",
            padding: "8px 0", borderBottom: "1px solid #f5f5f5",
          }}>
            <label style={{ fontSize: 12, color: "#888", fontWeight: 500, paddingTop: f.type === "textarea" ? 6 : 0 }}>
              {f.label}
            </label>
            {f.type === "textarea" ? (
              <textarea
                style={rowTextareaStyle}
                value={val}
                placeholder={f.placeholder}
                onChange={(e) => onUpdate(f.path, e.target.value || null)}
              />
            ) : (
              <input
                style={rowInputStyle}
                type={f.type || "text"}
                value={val}
                placeholder={f.placeholder}
                onChange={(e) => {
                  const v = f.type === "number" ? (e.target.value ? parseFloat(e.target.value) : null) : (e.target.value || null);
                  onUpdate(f.path, v);
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Roster Section ─────────────────────────────────────────────

function RosterSection({
  roster, onUpdate,
}: {
  roster: any[];
  onUpdate: (v: any[]) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function addMember() {
    const member = {
      id: crypto.randomUUID(),
      legalName: "", preferredName: null, role: "",
      email: null, phone: null, secondaryPhone: null,
      emergencyContactName: null, emergencyRelationship: null, emergencyPhone: null,
      dateOfBirth: null, passportNumber: null, passportCountry: null, passportExpiration: null,
      knownTravelerNumber: null, preferredHomeAirport: null,
      seatPreference: null, bunkPreference: null,
      mealNotes: null, nonFoodAllergies: null,
      tshirtSize: null, shoeSize: null,
      showDayRate: null, offDayRate: null, travelDayRate: null, perDiemRate: null,
    };
    onUpdate([...roster, member]);
    setExpandedId(member.id);
  }

  const updateMemberRef = useRef((id: string, field: string, value: unknown) => {
    onUpdate(roster.map((m) => m.id === id ? { ...m, [field]: value } : m));
  });
  updateMemberRef.current = (id: string, field: string, value: unknown) => {
    onUpdate(roster.map((m) => m.id === id ? { ...m, [field]: value } : m));
  };

  function removeMember(id: string) {
    if (!confirm("Remove this crew member?")) return;
    onUpdate(roster.filter((m) => m.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        {roster.map((member) => {
          const isOpen = expandedId === member.id;
          return (
            <div key={member.id} style={{
              border: "1px solid #eee", borderRadius: 10, overflow: "hidden",
              gridColumn: isOpen ? "1 / -1" : undefined,
            }}>
              <div
                onClick={() => setExpandedId(isOpen ? null : member.id)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 16px", cursor: "pointer",
                  background: isOpen ? "#fafaf8" : "#fff",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>
                    {member.legalName || "Unnamed"}
                  </div>
                  <div style={{ fontSize: 11, color: "#888" }}>
                    {member.role || "No role"}{member.showDayRate ? ` \u00b7 $${member.showDayRate}/show` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeMember(member.id); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#ccc", padding: "2px 4px", lineHeight: 1 }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#c0392b"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#ccc"; }}
                  >
                    &times;
                  </button>
                  <span style={{ fontSize: 11, color: "#ccc", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "inline-block" }}>&#9656;</span>
                </div>
              </div>
              {isOpen && (
                <div style={{ padding: "0 16px 16px" }} onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                  <RosterSubLabel>Identity</RosterSubLabel>
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="legalName" label="Legal Name" />
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="preferredName" label="Preferred Name" />
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="role" label="Role" />
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="dateOfBirth" label="Date of Birth" type="date" />

                  <RosterSubLabel>Contact</RosterSubLabel>
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="email" label="Email" />
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="phone" label="Phone" />
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="secondaryPhone" label="Secondary Phone" />

                  <RosterSubLabel>Emergency Contact</RosterSubLabel>
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="emergencyContactName" label="Name" />
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="emergencyRelationship" label="Relationship" />
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="emergencyPhone" label="Phone" />

                  <RosterSubLabel>Travel Documents</RosterSubLabel>
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="passportNumber" label="Passport #" />
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="passportCountry" label="Country" />
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="passportExpiration" label="Expiration" type="date" />
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="knownTravelerNumber" label="Known Traveler #" />
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="preferredHomeAirport" label="Home Airport" placeholder="e.g. ATX" />

                  <RosterSubLabel>Travel Preferences</RosterSubLabel>
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="seatPreference" label="Seat Pref" placeholder="aisle / window" />
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="bunkPreference" label="Bunk Pref" placeholder="top / bottom" />

                  <RosterSubLabel>Dietary & Health</RosterSubLabel>
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="mealNotes" label="Meal Notes" />
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="nonFoodAllergies" label="Allergies" />

                  <RosterSubLabel>Apparel</RosterSubLabel>
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="tshirtSize" label="T-Shirt" placeholder="S/M/L/XL/XXL" />
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="shoeSize" label="Shoe Size" />

                  <RosterSubLabel>Pay & Financial</RosterSubLabel>
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="showDayRate" label="Show Day Rate" type="number" />
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="offDayRate" label="Off Day Rate" type="number" />
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="travelDayRate" label="Travel Day Rate" type="number" />
                  <RosterMemberField member={member} updateRef={updateMemberRef} field="perDiemRate" label="Per Diem" type="number" />

                  <div style={{ marginTop: 16, textAlign: "right" as const }}>
                    <button
                      onClick={() => removeMember(member.id)}
                      style={{ padding: "5px 14px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", color: "#c0392b", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={addMember}
        style={{
          width: "100%", padding: "12px", borderRadius: 10,
          border: "1.5px dashed #ccc", background: "transparent",
          fontSize: 12, fontWeight: 700, color: "#888", cursor: "pointer",
        }}
      >
        + Add crew member
      </button>
    </div>
  );
}

// ── Vehicles Section ───────────────────────────────────────────

function VehiclesSection({
  data, onUpdate,
}: {
  data: any;
  onUpdate: (v: any) => void;
}) {
  const vehicles = data.vehicles || [];

  function addVehicle() {
    const vehicle = { id: crypto.randomUUID(), name: "", type: "", mpg: null, notes: "" };
    onUpdate({ ...data, vehicles: [...vehicles, vehicle] });
  }

  function updateVehicle(id: string, field: string, value: unknown) {
    onUpdate({ ...data, vehicles: vehicles.map((v: any) => v.id === id ? { ...v, [field]: value } : v) });
  }

  function removeVehicle(id: string) {
    onUpdate({ ...data, vehicles: vehicles.filter((v: any) => v.id !== id) });
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        {vehicles.map((v: any) => (
          <div key={v.id} style={{ padding: "14px 16px", border: "1px solid #eee", borderRadius: 10, background: "#fafaf8" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <input
                value={v.name || ""}
                onChange={(e) => updateVehicle(v.id, "name", e.target.value || null)}
                placeholder="Vehicle name"
                style={{ ...rowInputStyle, fontWeight: 700, fontSize: 13 }}
              />
              <button onClick={() => removeVehicle(v.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 14, marginLeft: 8 }}>&times;</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              <input value={v.type || ""} onChange={(e) => updateVehicle(v.id, "type", e.target.value || null)} placeholder="Type / purpose" style={rowInputStyle} />
              <input value={v.mpg ?? ""} onChange={(e) => updateVehicle(v.id, "mpg", e.target.value ? parseFloat(e.target.value) : null)} placeholder="MPG" type="number" style={rowInputStyle} />
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={addVehicle}
        style={{
          width: "100%", padding: "12px", borderRadius: 10,
          border: "1.5px dashed #ccc", background: "transparent",
          fontSize: 12, fontWeight: 700, color: "#888", cursor: "pointer", marginBottom: 16,
        }}
      >
        + Add vehicle
      </button>

      <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10, padding: "6px 0" }}>
          <label style={{ fontSize: 12, color: "#888" }}>Storage Location</label>
          <input style={rowInputStyle} value={data.storageLocation || ""} onChange={(e) => onUpdate({ ...data, storageLocation: e.target.value || null })} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10, padding: "6px 0" }}>
          <label style={{ fontSize: 12, color: "#888" }}>Notes</label>
          <textarea style={rowTextareaStyle} value={data.notes || ""} placeholder="Trailers, major equipment, etc." onChange={(e) => onUpdate({ ...data, notes: e.target.value || null })} />
        </div>
      </div>
    </div>
  );
}

// ── Insurance Section ──────────────────────────────────────────

function InsuranceSection({
  data, onUpdate,
}: {
  data: any;
  onUpdate: (v: any) => void;
}) {
  const policies = data.policies || [];
  const typeOptions = [
    { value: "general_liability", label: "General Liability" },
    { value: "workers_comp", label: "Workers' Comp" },
    { value: "equipment", label: "Equipment" },
    { value: "vehicle", label: "Vehicle" },
    { value: "cancellation", label: "Cancellation" },
    { value: "other", label: "Other" },
  ];

  function addPolicy() {
    const policy = {
      id: crypto.randomUUID(), type: "general_liability",
      carrier: null, policyNumber: null, coverageAmount: null,
      deductible: null, effectiveDate: null, expirationDate: null, notes: null,
    };
    onUpdate({ ...data, policies: [...policies, policy] });
  }

  function updatePolicy(id: string, field: string, value: unknown) {
    onUpdate({ ...data, policies: policies.map((p: any) => p.id === id ? { ...p, [field]: value } : p) });
  }

  function removePolicy(id: string) {
    onUpdate({ ...data, policies: policies.filter((p: any) => p.id !== id) });
  }

  return (
    <div>
      {policies.map((p: any) => (
        <div key={p.id} style={{ border: "1px solid #eee", borderRadius: 10, padding: 14, marginBottom: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 1fr 32px", gap: 8, marginBottom: 8 }}>
            <select style={rowInputStyle} value={p.type} onChange={(e) => updatePolicy(p.id, "type", e.target.value)}>
              {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input style={rowInputStyle} value={p.carrier || ""} placeholder="Carrier" onChange={(e) => updatePolicy(p.id, "carrier", e.target.value || null)} />
            <input style={rowInputStyle} value={p.policyNumber || ""} placeholder="Policy #" onChange={(e) => updatePolicy(p.id, "policyNumber", e.target.value || null)} />
            <button onClick={() => removePolicy(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 14 }}>&times;</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
            <input style={rowInputStyle} value={p.coverageAmount ?? ""} placeholder="Coverage $" type="number" onChange={(e) => updatePolicy(p.id, "coverageAmount", e.target.value ? parseFloat(e.target.value) : null)} />
            <input style={rowInputStyle} value={p.deductible ?? ""} placeholder="Deductible $" type="number" onChange={(e) => updatePolicy(p.id, "deductible", e.target.value ? parseFloat(e.target.value) : null)} />
            <input style={rowInputStyle} value={p.effectiveDate || ""} placeholder="Effective" type="date" onChange={(e) => updatePolicy(p.id, "effectiveDate", e.target.value || null)} />
            <input style={rowInputStyle} value={p.expirationDate || ""} placeholder="Expires" type="date" onChange={(e) => updatePolicy(p.id, "expirationDate", e.target.value || null)} />
          </div>
        </div>
      ))}
      <button
        onClick={addPolicy}
        style={{
          width: "100%", padding: "12px", borderRadius: 10,
          border: "1.5px dashed #ccc", background: "transparent",
          fontSize: 12, fontWeight: 700, color: "#888", cursor: "pointer",
        }}
      >
        + Add policy
      </button>
    </div>
  );
}

// ── Roster Sub-Components (defined outside RosterSection to prevent remounting) ──

function RosterSubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: "#999", textTransform: "uppercase" as const, letterSpacing: "0.06em", marginTop: 14, marginBottom: 6, borderBottom: "1px solid #f0f0f0", paddingBottom: 4 }}>
      {children}
    </div>
  );
}

function RosterMemberField({
  member, updateRef, field, label, type, placeholder,
}: {
  member: any;
  updateRef: React.RefObject<(id: string, field: string, value: unknown) => void>;
  field: string;
  label: string;
  type?: string;
  placeholder?: string;
}) {
  const [local, setLocal] = useState(String(member[field] ?? ""));
  const prevRef = useRef(member[field]);

  useEffect(() => {
    if (member[field] !== prevRef.current) {
      setLocal(String(member[field] ?? ""));
      prevRef.current = member[field];
    }
  }, [member[field]]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 8, alignItems: "center", padding: "4px 0" }}>
      <label style={{ fontSize: 11, color: "#888" }}>{label}</label>
      <input
        style={rowInputStyle}
        type={type || "text"}
        value={local}
        placeholder={placeholder}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => (e.target as HTMLInputElement).focus()}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          const v = type === "number" ? (local ? parseFloat(local) : null) : (local || null);
          updateRef.current(member.id, field, v);
        }}
      />
    </div>
  );
}
