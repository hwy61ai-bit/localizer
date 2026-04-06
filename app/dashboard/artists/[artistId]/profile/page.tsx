"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Papa from "papaparse";
import * as XLSX from "xlsx";

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

  // Photo
  const photoFileRef = useRef<HTMLInputElement>(null);
  const [photoHovered, setPhotoHovered] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Spotify thumbnail
  const [spotifyThumb, setSpotifyThumb] = useState<string | null>(null);
  const [spotifyHovered, setSpotifyHovered] = useState(false);
  const spotifyDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Advance materials
  const advFileRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [advUploading, setAdvUploading] = useState<string | null>(null);
  const [advDragOver, setAdvDragOver] = useState<string | null>(null);
  const [photoDragOver, setPhotoDragOver] = useState(false);
  const [logoDragOver, setLogoDragOver] = useState(false);
  const [nameHovered, setNameHovered] = useState(false);
  const [bioDragOver, setBioDragOver] = useState(false);
  const [bioImportMsg, setBioImportMsg] = useState<string | null>(null);
  const [bioImporting, setBioImporting] = useState(false);

  function showBioMsg(msg: string) {
    setBioImportMsg(msg);
    setTimeout(() => setBioImportMsg(null), 4000);
  }

  async function handleBioFileDrop(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const allowed = ['txt', 'md', 'docx', 'pdf'];
    if (!allowed.includes(ext)) {
      showBioMsg("Unsupported file type — drop a .txt, .md, .docx, or .pdf");
      return;
    }

    setBioImporting(true);
    setBioImportMsg(`Reading ${file.name}...`);

    try {
      if (ext === 'txt' || ext === 'md') {
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsText(file);
        });
        updateField("bio", text.trim());
        showBioMsg(`Loaded bio from ${file.name}`);
      } else {
        // .docx or .pdf — base64 encode and send to server
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            resolve(dataUrl.split(',')[1] || '');
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
        const resp = await fetch('/api/import/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ base64, filename: file.name, mimeType: file.type }),
        });
        const data = await resp.json();
        if (!resp.ok || data.error) {
          showBioMsg(data.error || "Couldn't read that file");
          return;
        }
        updateField("bio", (data.text || '').trim());
        showBioMsg(`Loaded bio from ${file.name}`);
      }
    } catch (e) {
      console.error('[Bio import] Error:', e);
      showBioMsg("Couldn't read that file");
    } finally {
      setBioImporting(false);
    }
  }

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

  async function handlePhotoUpload(file: File) {
    setUploadingPhoto(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `artist-assets/${artistId}/photo.${ext}`;
      const { error } = await supabase.storage.from("localizer-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("localizer-assets").getPublicUrl(path);
      const url = data.publicUrl + "?t=" + Date.now();
      await supabase.from("artists").update({ image_url: url }).eq("id", artistId);
      setArtist((prev) => prev ? { ...prev, image_url: url } : prev);
    } catch (e) {
      console.error("Photo upload failed:", e);
    } finally {
      setUploadingPhoto(false);
    }
  }

  function fetchSpotifyThumb(url: string) {
    if (spotifyDebounceRef.current) clearTimeout(spotifyDebounceRef.current);
    if (!url.includes("open.spotify.com/artist/")) {
      setSpotifyThumb(null);
      return;
    }
    spotifyDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`);
        if (!res.ok) { setSpotifyThumb(null); return; }
        const data = await res.json();
        if (data.thumbnail_url) setSpotifyThumb(data.thumbnail_url);
        else setSpotifyThumb(null);
      } catch {
        setSpotifyThumb(null);
      }
    }, 300);
  }

  // Fetch thumb on mount if spotify_url exists
  useEffect(() => {
    if (artist?.spotify_url) fetchSpotifyThumb(artist.spotify_url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artist?.spotify_url ? "has" : "none"]);

  // ── Advance Upload ───────────────────────────────────────────

  async function handleAdvUpload(fieldId: string, file: File) {
    setAdvUploading(fieldId);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const path = `artist-assets/${artistId}/advance/${fieldId}.${ext}`;
      const { error } = await supabase.storage.from("localizer-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("localizer-assets").getPublicUrl(path);
      const url = data.publicUrl + "?t=" + Date.now();
      await supabase.from("artists").update({ [fieldId]: url }).eq("id", artistId);
      setArtist((prev) => prev ? { ...prev, [fieldId]: url } : prev);
    } catch (e) {
      console.error("Upload failed:", e);
    } finally {
      setAdvUploading(null);
    }
  }

  // ── Loading ──────────────────────────────────────────────────

  if (loading || !artist) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text-muted)" }}>LOADING...</div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────

  const showSaved = savedAt && Date.now() - savedAt < 1500;

  return (
    <div style={{ minHeight: "100vh", padding: "24px 24px 80px", background: "transparent" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Back + save indicator */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <button
            onClick={() => router.back()}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-muted)", padding: 0 }}
          >
            &larr; BACK
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={() => router.push(`/dashboard/artists/${artistId}`)}
              style={{ padding: "6px 14px", border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-muted)", cursor: "pointer" }}
            >
              VIEW TOURS &rarr;
            </button>
            <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: saving ? "var(--hw-text-muted)" : showSaved ? "var(--hw-green)" : "transparent", transition: "color 0.2s" }}>
              {saving ? "SAVING..." : showSaved ? "SAVED" : "."}
            </div>
          </div>
        </div>

        <style>{`
          @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* ══════ Header ══════ */}
        <div style={{
          background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)",
          padding: 28, marginBottom: 20,
        }}>
          {/* Artist Name — full width */}
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}
            onMouseEnter={() => setNameHovered(true)}
            onMouseLeave={() => setNameHovered(false)}
          >
            <input
              value={artist.name || ""}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Click to add band name"
              style={{
                fontFamily: "var(--hw-font-display)", fontSize: 48, fontWeight: 400,
                letterSpacing: "2px", textTransform: "uppercase" as const,
                border: "none", outline: "none", background: "transparent",
                color: "var(--hw-text)", flex: 1, padding: 0,
                animation: "fadeSlideUp 0.5s ease-out both",
              }}
            />
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={nameHovered ? "var(--hw-crimson)" : "var(--hw-text-muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: "stroke 0.2s" }}>
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
          </div>

          {/* Three squares row */}
          <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
            {/* Square 1 — Band Photo */}
            <div>
              <input
                ref={photoFileRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }}
              />
              <div
                onMouseEnter={() => setPhotoHovered(true)}
                onMouseLeave={() => { setPhotoHovered(false); setPhotoDragOver(false); }}
                onClick={() => photoFileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setPhotoDragOver(true); }}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDragLeave={() => setPhotoDragOver(false)}
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setPhotoDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handlePhotoUpload(f); }}
                style={{
                  width: 94, height: 94,
                  background: photoDragOver ? "var(--hw-crimson-ghost)" : "var(--hw-bg)",
                  border: photoDragOver ? "3px dashed var(--hw-crimson)" : artist.image_url ? "3px solid var(--hw-border-strong)" : "3px dashed var(--hw-border-light)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", overflow: "hidden", position: "relative",
                  flexShrink: 0, transition: "var(--hw-ease)",
                }}
              >
                {uploadingPhoto ? (
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 9, color: "var(--hw-text-muted)", fontWeight: 700 }}>...</div>
                ) : artist.image_url ? (
                  <>
                    <img src={artist.image_url} alt="Band photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {photoHovered && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#fff" }}>REPLACE</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 20, color: "var(--hw-text-muted)" }}>+</div>
                    <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 7, fontWeight: 700, color: "var(--hw-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>PHOTO</div>
                  </div>
                )}
              </div>
              <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 8, color: "var(--hw-text-muted)", marginTop: 6, textAlign: "center", maxWidth: 94, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                PHOTO
              </div>
            </div>

            {/* Square 2 — Spotify Thumbnail */}
            <div>
              <div
                onMouseEnter={() => setSpotifyHovered(true)}
                onMouseLeave={() => setSpotifyHovered(false)}
                onClick={() => { if (artist.spotify_url) window.open(artist.spotify_url, "_blank"); }}
                style={{
                  width: 94, height: 94,
                  background: "var(--hw-bg)",
                  border: spotifyThumb ? "3px solid var(--hw-border-strong)" : "3px dashed var(--hw-border-light)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: spotifyThumb ? "pointer" : "default", overflow: "hidden", position: "relative",
                  flexShrink: 0, transition: "var(--hw-ease)",
                }}
              >
                {spotifyThumb ? (
                  <>
                    <img src={spotifyThumb} alt="Spotify" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {spotifyHovered && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>
                        <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#fff" }}>OPEN</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>
                    <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 7, fontWeight: 700, color: "var(--hw-text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginTop: 4 }}>SPOTIFY</div>
                  </div>
                )}
              </div>
              <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 8, color: "var(--hw-text-muted)", marginTop: 6, textAlign: "center", maxWidth: 94, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                SPOTIFY
              </div>
            </div>

            {/* Square 3 — Logo */}
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
                onMouseLeave={() => { setLogoHovered(false); setLogoDragOver(false); }}
                onClick={() => logoFileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setLogoDragOver(true); }}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDragLeave={() => setLogoDragOver(false)}
                onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setLogoDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleLogoUpload(f); }}
                style={{
                  width: 94, height: 94,
                  background: logoDragOver ? "var(--hw-crimson-ghost)" : "var(--hw-bg)",
                  border: logoDragOver ? "3px dashed var(--hw-crimson)" : artist.logo_url ? "3px solid var(--hw-border-strong)" : "3px dashed var(--hw-border-light)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", overflow: "hidden", position: "relative",
                  flexShrink: 0, transition: "var(--hw-ease)",
                }}
              >
                {uploadingLogo ? (
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 9, color: "var(--hw-text-muted)", fontWeight: 700 }}>...</div>
                ) : artist.logo_url ? (
                  <>
                    <img src={artist.logo_url} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {logoHovered && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#fff" }}>REPLACE</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 20, color: "var(--hw-text-muted)" }}>+</div>
                    <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 7, fontWeight: 700, color: "var(--hw-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>LOGO</div>
                    <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 6, color: "var(--hw-text-muted)", letterSpacing: "0.5px", marginTop: 2 }}>transparent .png</div>
                  </div>
                )}
              </div>
              <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 8, color: "var(--hw-text-muted)", marginTop: 6, textAlign: "center", maxWidth: 94, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                LOGO (TRANSPARENT .PNG)
              </div>
            </div>
          </div>

          {/* Spotify URL input */}
          <div style={{ maxWidth: 94 * 3 + 16 * 2 }}>
            <input
              value={artist.spotify_url || ""}
              onChange={(e) => {
                updateField("spotify_url", e.target.value);
                fetchSpotifyThumb(e.target.value);
              }}
              placeholder="Paste Spotify artist URL"
              style={{
                fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: "0.5px",
                color: "var(--hw-text-secondary)", width: "100%", padding: "8px 0",
                border: "none", borderBottom: "1px solid var(--hw-border)", outline: "none",
                background: "transparent",
              }}
            />
          </div>
        </div>

        {/* ══════ Bio ══════ */}
        <div
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!bioImporting) setBioDragOver(true); }}
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDragLeave={(e) => { e.preventDefault(); setBioDragOver(false); }}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setBioDragOver(false); if (!bioImporting) { const f = e.dataTransfer.files?.[0]; if (f) handleBioFileDrop(f); } }}
          style={{
            background: bioDragOver ? "var(--hw-crimson-ghost)" : "var(--hw-bg-surface)",
            border: bioDragOver ? "3px dashed var(--hw-crimson)" : "3px solid var(--hw-border-strong)",
            padding: 28, marginBottom: 20, transition: "var(--hw-ease)",
          }}
        >
          <SectionLabel>Bio</SectionLabel>
          {bioImportMsg && (
            <div style={{ marginBottom: 10, padding: "8px 14px", background: bioImportMsg.startsWith("Loaded") ? "var(--hw-green-ghost)" : bioImportMsg.startsWith("Reading") ? "var(--hw-bg)" : "var(--hw-red-ghost)", border: bioImportMsg.startsWith("Loaded") ? "2px solid var(--hw-green-border)" : bioImportMsg.startsWith("Reading") ? "2px solid var(--hw-border-strong)" : "2px solid var(--hw-crimson)", fontFamily: "var(--hw-font-mono)", fontSize: 12, letterSpacing: "1px", color: bioImportMsg.startsWith("Loaded") ? "var(--hw-green)" : bioImportMsg.startsWith("Reading") ? "var(--hw-text-muted)" : "var(--hw-crimson)" }}>
              {bioImportMsg}
            </div>
          )}
          <textarea
            value={artist.bio || ""}
            onChange={(e) => updateField("bio", e.target.value)}
            placeholder={bioDragOver ? "Drop .txt, .md, .docx, or .pdf here..." : "Artist biography..."}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "12px 16px", border: "3px solid var(--hw-border-strong)",
              fontFamily: "var(--hw-font-body)", fontSize: 15, color: "var(--hw-text)",
              lineHeight: 1.7, background: "var(--hw-bg-surface)",
              outline: "none", resize: "vertical", minHeight: 100,
            }}
          />
        </div>

        {/* ══════ Team ══════ */}
        <div style={{
          background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)",
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
          background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)",
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
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setAdvDragOver(field.id); }}
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDragLeave={() => setAdvDragOver(null)}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setAdvDragOver(null); const f = e.dataTransfer.files?.[0]; if (f) handleAdvUpload(field.id, f); }}
                    style={{
                      padding: "16px 18px",
                      background: advDragOver === field.id ? "var(--hw-crimson-ghost)" : url ? "var(--hw-green-ghost)" : "var(--hw-bg-surface)",
                      border: advDragOver === field.id ? "3px dashed var(--hw-crimson)" : url ? "3px solid var(--hw-green-border)" : "3px solid var(--hw-border-strong)",
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      transition: "var(--hw-ease)",
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 16, fontWeight: 400, letterSpacing: "2px", textTransform: "uppercase" as const, color: "var(--hw-text)", marginBottom: 2 }}>
                        {field.label}
                      </div>
                      <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase" as const, color: url ? "var(--hw-green)" : "var(--hw-text-muted)" }}>
                        {isUploading ? "Uploading..." : url ? "Uploaded" : "Not uploaded"}
                      </div>
                    </div>
                    <div>
                      {url ? (
                        <span style={{
                          fontFamily: "var(--hw-font-mono)", fontSize: 9, fontWeight: 700, color: "var(--hw-green)",
                          background: "var(--hw-green-ghost)", padding: "4px 10px", border: "2px solid var(--hw-green-border)",
                          textTransform: "uppercase" as const, letterSpacing: "2px",
                        }}>
                          PDF
                        </span>
                      ) : (
                        <span style={{ fontFamily: "var(--hw-font-display)", fontSize: 18, color: "var(--hw-text-muted)" }}>&#8593;</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ══════ Divider ══════ */}
        <div style={{ borderTop: "3px solid var(--hw-border-strong)", margin: "2rem 0" }} />

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
            const fields = ["websiteUrl", "spotifyUrl", "instagramUrl", "tiktokUrl", "youtubeUrl", "facebookUrl", "twitterUrl", "appleMusicUrl", "bandcampUrl", "epkUrl"];
            const filled = fields.filter((f) => p[f]).length;
            return `${filled} of ${fields.length}`;
          })()}
          badgeColor={(() => {
            const p = (artist.promo_marketing as any) || {};
            const fields = ["websiteUrl", "spotifyUrl", "instagramUrl", "tiktokUrl", "youtubeUrl", "facebookUrl", "twitterUrl", "appleMusicUrl", "bandcampUrl", "epkUrl"];
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
      fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400,
      textTransform: "uppercase" as const, letterSpacing: "4px",
      color: "var(--hw-blue)",
      borderBottom: "3px solid var(--hw-border-strong)", paddingBottom: 8, marginBottom: 16,
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
    padding: "8px 10px", border: "3px solid var(--hw-border-strong)",
    fontFamily: "var(--hw-font-body)", fontSize: 13, color: "var(--hw-text)",
    background: "var(--hw-bg-surface)", outline: "none",
  };

  return (
    <div style={{
      padding: "14px 16px", background: "var(--hw-bg-surface)",
      border: "3px solid var(--hw-border-strong)",
    }}>
      <div style={{
        fontFamily: "var(--hw-font-mono)", fontSize: 10, fontWeight: 700,
        textTransform: "uppercase" as const, letterSpacing: "1.5px",
        color: "var(--hw-text-muted)", marginBottom: 10,
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
    green: { bg: "var(--hw-green-ghost)", text: "var(--hw-green)", border: "var(--hw-green-border)" },
    amber: { bg: "var(--hw-amber-ghost)", text: "var(--hw-amber)", border: "var(--hw-amber)" },
    gray: { bg: "rgba(0,0,0,0.04)", text: "var(--hw-text-muted)", border: "var(--hw-border)" },
  };
  const bc = colors[badgeColor];

  return (
    <div style={{
      background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)",
      marginBottom: 10, overflow: "hidden",
    }}>
      <div
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 24px", cursor: "pointer", userSelect: "none" as const,
          background: hovered ? "var(--hw-crimson-ghost)" : "var(--hw-bg-surface)",
          transition: "var(--hw-ease)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "var(--hw-font-display)", fontSize: 18, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text)" }}>{title}</span>
          {badge && (
            <span style={{
              fontFamily: "var(--hw-font-mono)", fontSize: 9, fontWeight: 700,
              letterSpacing: "2px", textTransform: "uppercase",
              padding: "3px 10px", border: `2px solid ${bc.border}`,
              background: bc.bg, color: bc.text,
            }}>
              {badge}
            </span>
          )}
        </div>
        <span style={{
          fontSize: 12, color: "var(--hw-text-muted)",
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
  padding: "7px 10px", border: "3px solid var(--hw-border-strong)",
  fontFamily: "var(--hw-font-body)", fontSize: 13, color: "var(--hw-text)",
  background: "var(--hw-bg-surface)", outline: "none",
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
            padding: "8px 0", borderBottom: "2px solid var(--hw-border)",
          }}>
            <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: "var(--hw-text-secondary)", fontWeight: 400, paddingTop: f.type === "textarea" ? 6 : 0 }}>
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

const ROSTER_FIELD_ALIASES: Record<string, string[]> = {
  legalName: ['name', 'full name', 'legal name', 'member name', 'crew name'],
  preferredName: ['preferred name', 'nickname', 'goes by'],
  role: ['role', 'position', 'title', 'job', 'function'],
  email: ['email', 'e-mail', 'email address'],
  phone: ['phone', 'cell', 'mobile', 'phone number', 'cell phone', 'mobile phone'],
  showDayRate: ['show day rate', 'show rate', 'day rate', 'show day'],
  offDayRate: ['off day rate', 'off rate', 'off day'],
  travelDayRate: ['travel day rate', 'travel rate', 'travel day'],
  perDiemRate: ['per diem', 'perdiem', 'per diem rate'],
  dateOfBirth: ['dob', 'date of birth', 'birthday', 'birth date'],
  passportNumber: ['passport', 'passport number', 'passport #'],
};

function rosterBestGuess(field: string, hdrs: string[], usedCols: Set<string>): string {
  const aliases = ROSTER_FIELD_ALIASES[field] || [field];
  for (const alias of aliases) {
    const idx = hdrs.findIndex(h => h.toLowerCase().trim() === alias.toLowerCase() && !usedCols.has(h));
    if (idx >= 0) return hdrs[idx];
  }
  for (const alias of aliases) {
    if (alias.length <= 3) continue;
    const idx = hdrs.findIndex(h => h.toLowerCase().trim().includes(alias.toLowerCase()) && !usedCols.has(h));
    if (idx >= 0) return hdrs[idx];
  }
  return '';
}

function parseRosterNumber(val: string | undefined): number | null {
  if (!val) return null;
  const cleaned = val.replace(/[$,\s]/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function RosterSection({
  roster, onUpdate,
}: {
  roster: any[];
  onUpdate: (v: any[]) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rosterDragOver, setRosterDragOver] = useState(false);
  const [rosterImportMsg, setRosterImportMsg] = useState<string | null>(null);

  function showImportMsg(msg: string) {
    setRosterImportMsg(msg);
    setTimeout(() => setRosterImportMsg(null), 4000);
  }

  function handleRosterFileDrop(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

    function processRows(allRows: string[][]) {
      if (allRows.length < 2) { showImportMsg("No data rows found"); return; }

      // Find header row: first row with both a name-like and role-like header
      let headerIdx = 0;
      for (let i = 0; i < Math.min(allRows.length, 10); i++) {
        const cells = allRows[i].map(c => String(c ?? '').toLowerCase().trim());
        const hasName = cells.some(c => /\bname\b/.test(c));
        const hasRole = cells.some(c => /\brole\b|\bposition\b|\btitle\b|\bjob\b|\bfunction\b/.test(c));
        if (hasName && hasRole) { headerIdx = i; break; }
      }

      const hdrs = allRows[headerIdx].map(c => String(c ?? ''));
      const dataRows = allRows.slice(headerIdx + 1);

      // Map columns
      const usedCols = new Set<string>();
      const mapping: Record<string, string> = {};
      for (const field of Object.keys(ROSTER_FIELD_ALIASES)) {
        const col = rosterBestGuess(field, hdrs, usedCols);
        mapping[field] = col;
        if (col) usedCols.add(col);
      }

      const nameCol = mapping.legalName;
      if (!nameCol) { showImportMsg("Could not find a Name column"); return; }

      const numFields = new Set(['showDayRate', 'offDayRate', 'travelDayRate', 'perDiemRate']);
      const newMembers: any[] = [];

      for (const row of dataRows) {
        const rowObj: Record<string, string> = {};
        hdrs.forEach((h, i) => { rowObj[h] = String(row[i] ?? '').trim(); });

        const nameVal = rowObj[nameCol]?.trim();
        if (!nameVal) continue;
        if (/^totals?$/i.test(nameVal)) continue;

        const member: Record<string, unknown> = {
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

        for (const [field, col] of Object.entries(mapping)) {
          if (!col) continue;
          const raw = rowObj[col]?.trim();
          if (!raw) continue;
          if (numFields.has(field)) {
            member[field] = parseRosterNumber(raw);
          } else {
            member[field] = raw;
          }
        }

        newMembers.push(member);
      }

      if (newMembers.length === 0) { showImportMsg("No valid crew rows found"); return; }

      onUpdate([...roster, ...newMembers]);
      showImportMsg(`Added ${newMembers.length} crew member${newMembers.length > 1 ? 's' : ''} from ${file.name}`);
    }

    try {
      if (ext === 'xlsx' || ext === 'xls') {
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = new Uint8Array(ev.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array', raw: true, cellDates: true });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
            processRows(rows);
          } catch (e) {
            console.error('[Roster import] XLSX parse error:', e);
            showImportMsg("Failed to parse spreadsheet");
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const text = ev.target?.result as string;
            const result = Papa.parse(text, { header: false, skipEmptyLines: true });
            processRows(result.data as string[][]);
          } catch (e) {
            console.error('[Roster import] CSV parse error:', e);
            showImportMsg("Failed to parse CSV");
          }
        };
        reader.readAsText(file);
      }
    } catch (e) {
      console.error('[Roster import] File read error:', e);
      showImportMsg("Failed to read file");
    }
  }

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
    <div
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setRosterDragOver(true); }}
      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDragLeave={(e) => { e.preventDefault(); setRosterDragOver(false); }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setRosterDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleRosterFileDrop(f); }}
    >
      {rosterImportMsg && (
        <div style={{ marginBottom: 10, padding: "8px 14px", background: rosterImportMsg.startsWith("Added") ? "var(--hw-green-ghost)" : "var(--hw-red-ghost)", border: rosterImportMsg.startsWith("Added") ? "2px solid var(--hw-green-border)" : "2px solid var(--hw-crimson)", fontFamily: "var(--hw-font-mono)", fontSize: 12, letterSpacing: "1px", color: rosterImportMsg.startsWith("Added") ? "var(--hw-green)" : "var(--hw-crimson)" }}>
          {rosterImportMsg}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        {roster.map((member) => {
          const isOpen = expandedId === member.id;
          return (
            <div key={member.id} style={{
              border: "3px solid var(--hw-border-strong)", overflow: "hidden",
              gridColumn: isOpen ? "1 / -1" : undefined,
            }}>
              <div
                onClick={() => setExpandedId(isOpen ? null : member.id)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 16px", cursor: "pointer",
                  background: isOpen ? "var(--hw-bg)" : "var(--hw-bg-surface)",
                  transition: "var(--hw-ease)",
                }}
              >
                <div>
                  <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 16, fontWeight: 400, letterSpacing: "2px", textTransform: "uppercase" as const, color: "var(--hw-text)" }}>
                    {member.legalName || "Unnamed"}
                  </div>
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase" as const, color: "var(--hw-text-muted)" }}>
                    {member.role || "No role"}{member.showDayRate ? ` \u00b7 $${member.showDayRate}/show` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeMember(member.id); }}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--hw-text-muted)", padding: "2px 4px", lineHeight: 1 }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--hw-crimson)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--hw-text-muted)"; }}
                  >
                    &times;
                  </button>
                  <span style={{ fontSize: 11, color: "var(--hw-text-muted)", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "inline-block" }}>&#9656;</span>
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
                      style={{ padding: "8px 16px", border: "3px solid var(--hw-crimson)", background: "var(--hw-bg-surface)", color: "var(--hw-crimson)", fontFamily: "var(--hw-font-display)", fontSize: 12, fontWeight: 400, letterSpacing: "2px", textTransform: "uppercase" as const, cursor: "pointer" }}
                    >
                      REMOVE
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
          width: "100%", padding: "12px",
          border: rosterDragOver ? "3px dashed var(--hw-crimson)" : "3px dashed var(--hw-border-light)",
          background: rosterDragOver ? "var(--hw-crimson-ghost)" : "transparent",
          fontFamily: "var(--hw-font-display)", fontSize: 14, fontWeight: 400, letterSpacing: "2px", textTransform: "uppercase" as const,
          color: rosterDragOver ? "var(--hw-crimson)" : "var(--hw-text-muted)", cursor: "pointer",
          transition: "var(--hw-ease)",
        }}
      >
        {rosterDragOver ? "DROP CSV / XLSX TO IMPORT CREW" : "+ ADD CREW MEMBER"}
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
          <div key={v.id} style={{ padding: "14px 16px", border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <input
                value={v.name || ""}
                onChange={(e) => updateVehicle(v.id, "name", e.target.value || null)}
                placeholder="Vehicle name"
                style={{ ...rowInputStyle, fontFamily: "var(--hw-font-display)", fontWeight: 400, fontSize: 16, letterSpacing: "2px", textTransform: "uppercase" as const }}
              />
              <button onClick={() => removeVehicle(v.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--hw-text-muted)", fontSize: 14, marginLeft: 8 }}>&times;</button>
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
          width: "100%", padding: "12px",
          border: "3px dashed var(--hw-border-light)", background: "transparent",
          fontFamily: "var(--hw-font-display)", fontSize: 14, fontWeight: 400, letterSpacing: "2px", textTransform: "uppercase" as const, color: "var(--hw-text-muted)", cursor: "pointer", marginBottom: 16,
        }}
      >
        + ADD VEHICLE
      </button>

      <div style={{ borderTop: "2px solid var(--hw-border)", paddingTop: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10, padding: "6px 0" }}>
          <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: "var(--hw-text-secondary)", fontWeight: 400 }}>Storage Location</label>
          <input style={rowInputStyle} value={data.storageLocation || ""} onChange={(e) => onUpdate({ ...data, storageLocation: e.target.value || null })} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10, padding: "6px 0" }}>
          <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: "var(--hw-text-secondary)", fontWeight: 400 }}>Notes</label>
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
        <div key={p.id} style={{ border: "3px solid var(--hw-border-strong)", padding: 14, marginBottom: 8 }}>
          <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 1fr 32px", gap: 8, marginBottom: 8 }}>
            <select style={rowInputStyle} value={p.type} onChange={(e) => updatePolicy(p.id, "type", e.target.value)}>
              {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input style={rowInputStyle} value={p.carrier || ""} placeholder="Carrier" onChange={(e) => updatePolicy(p.id, "carrier", e.target.value || null)} />
            <input style={rowInputStyle} value={p.policyNumber || ""} placeholder="Policy #" onChange={(e) => updatePolicy(p.id, "policyNumber", e.target.value || null)} />
            <button onClick={() => removePolicy(p.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--hw-text-muted)", fontSize: 14 }}>&times;</button>
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
          width: "100%", padding: "12px",
          border: "3px dashed var(--hw-border-light)", background: "transparent",
          fontFamily: "var(--hw-font-display)", fontSize: 14, fontWeight: 400, letterSpacing: "2px", textTransform: "uppercase" as const, color: "var(--hw-text-muted)", cursor: "pointer",
        }}
      >
        + ADD POLICY
      </button>
    </div>
  );
}

// ── Roster Sub-Components (defined outside RosterSection to prevent remounting) ──

function RosterSubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, fontWeight: 700, color: "var(--hw-blue)", textTransform: "uppercase" as const, letterSpacing: "2px", marginTop: 14, marginBottom: 6, borderBottom: "2px solid var(--hw-border)", paddingBottom: 4 }}>
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
      <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: "var(--hw-text-secondary)", fontWeight: 400 }}>{label}</label>
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
