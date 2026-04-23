"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import VehicleManager from "@/app/components/tourrouter/VehicleManager";

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
  tour_manager_name: string | null;
  tour_manager_email: string | null;
  tour_manager_phone: string | null;
  booking_agent_name: string | null;
  booking_agent_email: string | null;
  booking_agent_phone: string | null;
  publicist_name: string | null;
  publicist_email: string | null;
  publicist_phone: string | null;
  adv_stage_plot_url: string | null;
  adv_hospitality_url: string | null;
  adv_foh_url: string | null;
  adv_w9_url: string | null;
  adv_custom_materials: Array<{ id: string; label: string; url: string }> | null;
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
  { key: "tour_manager", label: "Tour Manager" },
  { key: "booking_agent", label: "Booking Agent" },
  { key: "publicist", label: "Publicist" },
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
  const [w9DragOver, setW9DragOver] = useState(false);
  const [w9Importing, setW9Importing] = useState(false);
  const [w9ImportMsg, setW9ImportMsg] = useState<string | null>(null);

  function showW9Msg(msg: string) {
    setW9ImportMsg(msg);
    setTimeout(() => setW9ImportMsg(null), 4000);
  }

  async function handleW9Drop(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const allowed = ['pdf', 'jpg', 'jpeg', 'png', 'heic'];
    if (!allowed.includes(ext)) {
      showW9Msg("Drop a W-9 PDF or image");
      return;
    }

    setW9Importing(true);
    setW9ImportMsg(`Reading W-9...`);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          resolve(dataUrl.split(',')[1] || '');
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });

      const resp = await fetch('/api/import/parse-w9', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, filename: file.name, mimeType: file.type }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        showW9Msg(data.error || "Couldn't parse that W-9");
        return;
      }

      const parsed = data.fields as { legalName: string | null; dba: string | null; entityType: string | null; address: string | null; ein: string | null };
      const current = (artist?.business_entity as Record<string, unknown> | null) || {};
      const updates: Record<string, unknown> = { ...current };
      let filledCount = 0;

      if (parsed.legalName) { updates.legalName = parsed.legalName; filledCount++; }
      if (parsed.dba) { updates.dba = parsed.dba; filledCount++; }
      if (parsed.entityType) { updates.entityType = parsed.entityType; filledCount++; }
      if (parsed.ein) { updates.ein = parsed.ein; filledCount++; }
      if (parsed.address) {
        updates.businessAddress = parsed.address;
        filledCount++;
        if (!current.mailingAddress) {
          updates.mailingAddress = parsed.address;
        }
      }

      if (filledCount === 0) {
        showW9Msg("No fields could be extracted from that W-9");
        return;
      }

      saveJsonColumn("business_entity", updates);
      showW9Msg(`Filled ${filledCount} field${filledCount > 1 ? 's' : ''} from W-9 (${file.name})`);
    } catch (e) {
      console.error('[W-9 import] Error:', e);
      showW9Msg("Couldn't parse that W-9");
    } finally {
      setW9Importing(false);
    }
  }

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
  const pendingUpdatesRef = useRef<Record<string, unknown>>({});

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
      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };
      saveTimerRef.current = setTimeout(async () => {
        const toSave = pendingUpdatesRef.current;
        pendingUpdatesRef.current = {};
        setSaving(true);
        try {
          // Save flat columns via Supabase directly
          const { data: saved, error: saveErr } = await supabase
            .from("artists")
            .update(toSave)
            .eq("id", artistId)
            .select()
            .maybeSingle();
          if (saveErr || !saved) {
            console.error("Save failed — RLS or validation rejected write:", saveErr, { toSave });
            throw saveErr || new Error("Write returned no row");
          }

          // Also sync to key_contacts JSON if a team field changed
          const teamKeys = TEAM_ROLES.flatMap((r) => [`${r.key}_name`, `${r.key}_email`, `${r.key}_phone`]);
          const touchedTeam = Object.keys(toSave).some((k) => teamKeys.includes(k));
          if (touchedTeam) {
            const fresh = { ...artist, ...toSave };
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
            const res = await fetch(`/api/tourrouter/artists/${artistId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key_contacts: contacts }),
            });
            if (!res.ok) {
              console.error("key_contacts PUT failed:", res.status, await res.text().catch(() => ""));
              throw new Error(`key_contacts PUT failed: ${res.status}`);
            }
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

  // ── Team Import ─────────────────────────────────────────────
  const [teamDragOver, setTeamDragOver] = useState(false);
  const [teamImportMsg, setTeamImportMsg] = useState<string | null>(null);

  function showTeamMsg(msg: string) {
    setTeamImportMsg(msg);
    setTimeout(() => setTeamImportMsg(null), 4000);
  }

  function handleTeamFileDrop(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      showTeamMsg("Unsupported file type — drop a .csv or .xlsx");
      return;
    }

    const ROLE_ALIASES: Record<string, string[]> = {
      manager: ['manager', 'mgmt', 'management', 'personal manager'],
      booking_agent: ['booking agent', 'booking', 'booker', 'day to day', 'day-to-day'],
      publicist: ['publicist', 'press', 'publicity', 'public relations'],
      agent: ['agent', 'talent agent', 'responsible agent'],
    };
    const FIELD_ALIASES: Record<string, string[]> = {
      name: ['name', 'contact', 'contact name', 'full name'],
      email: ['email', 'e-mail', 'email address'],
      phone: ['phone', 'cell', 'mobile', 'phone number', 'telephone'],
      role: ['role', 'position', 'title', 'type'],
    };

    function matchAlias(header: string, aliases: string[]): boolean {
      const h = header.toLowerCase().trim();
      if (aliases.some(a => h === a)) return true;
      return aliases.filter(a => a.length > 3).some(a => h.includes(a));
    }

    function findCol(hdrs: string[], field: string, usedCols: Set<string>): string {
      const aliases = FIELD_ALIASES[field] || [field];
      for (const alias of aliases) {
        const idx = hdrs.findIndex(h => h.toLowerCase().trim() === alias && !usedCols.has(h));
        if (idx >= 0) return hdrs[idx];
      }
      for (const alias of aliases) {
        if (alias.length <= 3) continue;
        const idx = hdrs.findIndex(h => h.toLowerCase().trim().includes(alias) && !usedCols.has(h));
        if (idx >= 0) return hdrs[idx];
      }
      return '';
    }

    function matchRole(cell: string): string | null {
      const norm = cell.toLowerCase().trim();
      for (const [role, aliases] of Object.entries(ROLE_ALIASES)) {
        if (aliases.some(a => norm === a)) return role;
        if (aliases.filter(a => a.length > 3).some(a => norm.includes(a))) return role;
      }
      return null;
    }

    setTeamImportMsg(`Reading ${file.name}...`);

    function processRows(allRows: string[][]) {
      if (allRows.length < 2) { showTeamMsg("No data rows found"); return; }

      // Stringify all cells
      const rows = allRows.map(r => r.map(c => String(c ?? '')));

      // Find header row
      let headerIdx = 0;
      for (let i = 0; i < Math.min(rows.length, 10); i++) {
        const cells = rows[i].map(c => c.toLowerCase().trim());
        const hasName = cells.some(c => /\bname\b|\bcontact\b/.test(c));
        const hasRole = cells.some(c => /\brole\b|\bposition\b|\btitle\b|\btype\b/.test(c));
        if (hasName && hasRole) { headerIdx = i; break; }
        // Also detect wide format: "manager name" or "booking agent email" style headers
        if (cells.some(c => /manager|booking|publicist|agent/.test(c) && /name|email|phone/.test(c))) { headerIdx = i; break; }
      }

      const hdrs = rows[headerIdx];
      const dataRows = rows.slice(headerIdx + 1);

      // Detect format: long (has a role column) vs wide (role-prefixed columns)
      const usedCols = new Set<string>();
      const roleCol = findCol(hdrs, 'role', usedCols);

      const updates: Record<string, string> = {};

      if (roleCol) {
        // LONG FORMAT: one row per role
        const nameCol = findCol(hdrs, 'name', usedCols);
        const emailCol = findCol(hdrs, 'email', usedCols);
        const phoneCol = findCol(hdrs, 'phone', usedCols);

        for (const row of dataRows) {
          const rowObj: Record<string, string> = {};
          hdrs.forEach((h, i) => { rowObj[h] = row[i]?.trim() || ''; });

          const roleVal = rowObj[roleCol];
          if (!roleVal) continue;
          const role = matchRole(roleVal);
          if (!role) continue;

          if (nameCol && rowObj[nameCol]) updates[`${role}_name`] = rowObj[nameCol];
          if (emailCol && rowObj[emailCol]) updates[`${role}_email`] = rowObj[emailCol];
          if (phoneCol && rowObj[phoneCol]) updates[`${role}_phone`] = rowObj[phoneCol];
        }
      } else {
        // WIDE FORMAT: role-prefixed columns like "Manager Name", "Booking Agent Email"
        const rolePrefixes: Record<string, string> = {
          manager: 'manager',
          'booking agent': 'booking_agent',
          booker: 'booking_agent',
          publicist: 'publicist',
          agent: 'agent',
        };

        for (const [prefix, roleKey] of Object.entries(rolePrefixes)) {
          for (const h of hdrs) {
            const hLow = h.toLowerCase().trim();
            if (!hLow.startsWith(prefix)) continue;
            const suffix = hLow.slice(prefix.length).trim();
            const colIdx = hdrs.indexOf(h);
            if (colIdx < 0) continue;

            let field: string | null = null;
            if (matchAlias(suffix, FIELD_ALIASES.name) || suffix === '' || suffix === 'name') field = 'name';
            else if (matchAlias(suffix, FIELD_ALIASES.email)) field = 'email';
            else if (matchAlias(suffix, FIELD_ALIASES.phone)) field = 'phone';
            if (!field) continue;

            // Read from first data row
            const val = dataRows[0]?.[colIdx]?.trim();
            if (val) updates[`${roleKey}_${field}`] = val;
          }
        }
      }

      const filledRoles = new Set(Object.keys(updates).map(k => k.replace(/_(name|email|phone)$/, '')));
      if (filledRoles.size === 0) {
        showTeamMsg("No matching team roles found in that file");
        return;
      }

      // Save all updates at once
      saveFields(updates);
      showTeamMsg(`Updated team from ${file.name} (${filledRoles.size} role${filledRoles.size > 1 ? 's' : ''} filled)`);
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
            console.error('[Team import] XLSX parse error:', e);
            showTeamMsg("Couldn't read that file");
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
            console.error('[Team import] CSV parse error:', e);
            showTeamMsg("Couldn't read that file");
          }
        };
        reader.readAsText(file);
      }
    } catch (e) {
      console.error('[Team import] File read error:', e);
      showTeamMsg("Couldn't read that file");
    }
  }

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

  // ── Custom Advance Materials ─────────────────────────────────

  async function saveCustomMaterials(arr: Array<{ id: string; label: string; url: string }>) {
    setArtist((prev) => prev ? { ...prev, adv_custom_materials: arr } : prev);
    await supabase.from("artists").update({ adv_custom_materials: arr }).eq("id", artistId);
  }

  async function handleCustomAdvUpload(customId: string, file: File) {
    setAdvUploading(`custom_${customId}`);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const path = `artist-assets/${artistId}/advance/custom_${customId}.${ext}`;
      const { error } = await supabase.storage.from("localizer-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("localizer-assets").getPublicUrl(path);
      const url = data.publicUrl + "?t=" + Date.now();
      const current = (artist?.adv_custom_materials as Array<{ id: string; label: string; url: string }> | null) || [];
      const newArr = current.map((m) => m.id === customId ? { ...m, url } : m);
      await saveCustomMaterials(newArr);
    } catch (e) {
      console.error("Custom adv upload failed:", e);
    } finally {
      setAdvUploading(null);
    }
  }

  function addCustomMaterial() {
    const label = window.prompt("Label for this material (e.g. 'Insurance COI', 'Tour Manager Bio'):");
    if (!label?.trim()) return;
    const current = (artist?.adv_custom_materials as Array<{ id: string; label: string; url: string }> | null) || [];
    const newEntry = { id: crypto.randomUUID(), label: label.trim(), url: "" };
    saveCustomMaterials([...current, newEntry]);
  }

  function renameCustomMaterial(customId: string) {
    const current = (artist?.adv_custom_materials as Array<{ id: string; label: string; url: string }> | null) || [];
    const target = current.find((m) => m.id === customId);
    if (!target) return;
    const newLabel = window.prompt("New label:", target.label);
    if (!newLabel?.trim() || newLabel.trim() === target.label) return;
    saveCustomMaterials(current.map((m) => m.id === customId ? { ...m, label: newLabel.trim() } : m));
  }

  async function removeCustomMaterial(customId: string) {
    if (!confirm("Delete this material?")) return;
    const current = (artist?.adv_custom_materials as Array<{ id: string; label: string; url: string }> | null) || [];
    const target = current.find((m) => m.id === customId);
    await saveCustomMaterials(current.filter((m) => m.id !== customId));
    // Best-effort storage cleanup
    if (target?.url) {
      const match = target.url.match(/\/storage\/v1\/object\/public\/localizer-assets\/(.+?)(\?|$)/);
      if (match) {
        await supabase.storage.from("localizer-assets").remove([match[1]]).catch(() => {});
      }
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
                color: "var(--hw-text)", padding: 0,
                animation: "fadeSlideUp 0.5s ease-out both",
              }}
            />
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={nameHovered ? "var(--hw-crimson)" : "var(--hw-text-muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transition: "stroke 0.2s" }}>
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
                  width: 141, height: 141,
                  background: photoDragOver ? "var(--hw-crimson-ghost)" : "var(--hw-bg)",
                  border: photoDragOver ? "3px dashed var(--hw-crimson)" : artist.image_url ? "3px solid var(--hw-border-strong)" : "3px dashed var(--hw-border-light)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", overflow: "hidden", position: "relative",
                  flexShrink: 0, transition: "var(--hw-ease)",
                }}
              >
                {uploadingPhoto ? (
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 14, color: "var(--hw-text-muted)", fontWeight: 700 }}>...</div>
                ) : artist.image_url ? (
                  <>
                    <img src={artist.image_url} alt="Band photo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {photoHovered && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 14, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#fff" }}>REPLACE</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 30, color: "var(--hw-text-muted)" }}>+</div>
                    <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, color: "var(--hw-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>PHOTO</div>
                  </div>
                )}
              </div>
              <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, color: "var(--hw-text-muted)", marginTop: 9, textAlign: "center", maxWidth: 141, letterSpacing: "0.5px", textTransform: "uppercase" }}>
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
                  width: 141, height: 141,
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
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>
                        <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 14, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#fff" }}>OPEN</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" /></svg>
                    <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, color: "var(--hw-text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginTop: 6 }}>SPOTIFY</div>
                  </div>
                )}
              </div>
              <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, color: "var(--hw-text-muted)", marginTop: 9, textAlign: "center", maxWidth: 141, letterSpacing: "0.5px", textTransform: "uppercase" }}>
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
                  width: 141, height: 141,
                  background: logoDragOver ? "var(--hw-crimson-ghost)" : "var(--hw-bg)",
                  border: logoDragOver ? "3px dashed var(--hw-crimson)" : artist.logo_url ? "3px solid var(--hw-border-strong)" : "3px dashed var(--hw-border-light)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", overflow: "hidden", position: "relative",
                  flexShrink: 0, transition: "var(--hw-ease)",
                }}
              >
                {uploadingLogo ? (
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 14, color: "var(--hw-text-muted)", fontWeight: 700 }}>...</div>
                ) : artist.logo_url ? (
                  <>
                    <img src={artist.logo_url} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {logoHovered && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 14, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "#fff" }}>REPLACE</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 30, color: "var(--hw-text-muted)" }}>+</div>
                    <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, color: "var(--hw-text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>LOGO</div>
                    <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 9, color: "var(--hw-text-muted)", letterSpacing: "0.5px", marginTop: 3 }}>transparent .png</div>
                  </div>
                )}
              </div>
              <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, color: "var(--hw-text-muted)", marginTop: 9, textAlign: "center", maxWidth: 141, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Band Logo (upload transparent png)
              </div>
            </div>

            {/* Static "autosaves / drag & drop" illustration card */}
            <div style={{
              width: 250,
              flexShrink: 0,
              padding: "18px 18px",
              background: "var(--hw-bg-surface)",
              border: "3px solid var(--hw-border-strong)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: 20,
            }}>
              {/* Headline */}
              <div>
                <div style={{
                  fontFamily: "var(--hw-font-display)",
                  fontSize: 18,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: "var(--hw-text)",
                  lineHeight: 1.15,
                }}>
                  Everything Autosaves.
                </div>
                <div style={{
                  fontFamily: "var(--hw-font-display)",
                  fontSize: 18,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: "var(--hw-text)",
                  lineHeight: 1.15,
                }}>
                  Everything Drag &amp; Drop.
                </div>
              </div>

              {/* Miniature drop-zone tableau */}
              <div style={{
                position: "relative",
                height: 150,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
              }}>
                {/* Dashed crimson drop target */}
                <div style={{
                  width: "100%",
                  height: 105,
                  border: "2px dashed var(--hw-crimson)",
                  background: "var(--hw-crimson-ghost)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--hw-font-mono)",
                  fontSize: 8,
                  letterSpacing: "1px",
                  color: "var(--hw-crimson)",
                  textTransform: "uppercase",
                }}>
                  Drop any touring document
                </div>

                {/* Floating document card, mid-drop (tilted, offset shadow) */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%) rotate(-3deg)",
                  background: "var(--hw-bg-surface)",
                  border: "3px solid var(--hw-border-strong)",
                  boxShadow: "6px 6px 0 rgba(0,0,0,0.15)",
                  padding: "7px 10px",
                  minWidth: 150,
                }}>
                  <div style={{
                    fontFamily: "var(--hw-font-mono)",
                    fontSize: 8,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: "var(--hw-crimson)",
                    marginBottom: 3,
                  }}>
                    Hospitality
                  </div>
                  <div style={{
                    fontFamily: "var(--hw-font-body)",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--hw-text)",
                    marginBottom: 2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}>
                    hospitality_rider_SF.jpg
                  </div>
                  <div style={{
                    fontFamily: "var(--hw-font-mono)",
                    fontSize: 9,
                    color: "var(--hw-text-secondary)",
                  }}>
                    JPEG &middot; 2.4 MB
                  </div>
                </div>
              </div>

              {/* Parsed pill */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                alignSelf: "flex-start",
                padding: "4px 10px",
                background: "var(--hw-green-ghost)",
                border: "2px solid var(--hw-green-border)",
              }}>
                <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7L5.5 10.5L12 3.5" stroke="var(--hw-green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{
                  fontFamily: "var(--hw-font-mono)",
                  fontSize: 9,
                  letterSpacing: "0.5px",
                  color: "var(--hw-green)",
                  textTransform: "uppercase",
                }}>
                  Parsed &middot; 14 fields extracted
                </span>
              </div>
            </div>
          </div>

          {/* Spotify URL input */}
          <div style={{ maxWidth: 141 * 3 + 16 * 2 }}>
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
        <div
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setTeamDragOver(true); }}
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDragLeave={(e) => { e.preventDefault(); setTeamDragOver(false); }}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setTeamDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleTeamFileDrop(f); }}
          style={{
            background: teamDragOver ? "var(--hw-crimson-ghost)" : "var(--hw-bg-surface)",
            border: teamDragOver ? "3px dashed var(--hw-crimson)" : "3px solid var(--hw-border-strong)",
            padding: 28, marginBottom: 20, transition: "var(--hw-ease)",
          }}
        >
          <SectionLabel>Team</SectionLabel>
          {teamImportMsg && (
            <div style={{ marginBottom: 10, padding: "8px 14px", background: teamImportMsg.startsWith("Updated") ? "var(--hw-green-ghost)" : teamImportMsg.startsWith("Reading") ? "var(--hw-bg)" : "var(--hw-red-ghost)", border: teamImportMsg.startsWith("Updated") ? "2px solid var(--hw-green-border)" : teamImportMsg.startsWith("Reading") ? "2px solid var(--hw-border-strong)" : "2px solid var(--hw-crimson)", fontFamily: "var(--hw-font-mono)", fontSize: 12, letterSpacing: "1px", color: teamImportMsg.startsWith("Updated") ? "var(--hw-green)" : teamImportMsg.startsWith("Reading") ? "var(--hw-text-muted)" : "var(--hw-crimson)" }}>
              {teamImportMsg}
            </div>
          )}
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
            {(artist.adv_custom_materials || []).map((custom) => {
              const fieldKey = `custom_${custom.id}`;
              const isUploading = advUploading === fieldKey;
              const url = custom.url || null;
              return (
                <div key={fieldKey} style={{ position: "relative" }}>
                  <input
                    ref={(el) => { advFileRefs.current[fieldKey] = el; }}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
                    style={{ display: "none" }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCustomAdvUpload(custom.id, f); }}
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeCustomMaterial(custom.id); }}
                    style={{ position: "absolute", top: 6, right: 6, zIndex: 2, background: "var(--hw-bg-surface)", border: "2px solid var(--hw-border-strong)", color: "var(--hw-text-muted)", fontSize: 12, lineHeight: 1, width: 20, height: 20, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--hw-crimson)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--hw-crimson)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--hw-text-muted)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--hw-border-strong)"; }}
                    title="Delete this material"
                  >
                    &times;
                  </button>
                  <div
                    onClick={() => advFileRefs.current[fieldKey]?.click()}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setAdvDragOver(fieldKey); }}
                    onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDragLeave={() => setAdvDragOver(null)}
                    onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setAdvDragOver(null); const f = e.dataTransfer.files?.[0]; if (f) handleCustomAdvUpload(custom.id, f); }}
                    style={{
                      padding: "16px 18px",
                      background: advDragOver === fieldKey ? "var(--hw-crimson-ghost)" : url ? "var(--hw-green-ghost)" : "var(--hw-bg-surface)",
                      border: advDragOver === fieldKey ? "3px dashed var(--hw-crimson)" : url ? "3px solid var(--hw-green-border)" : "3px solid var(--hw-border-strong)",
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      transition: "var(--hw-ease)",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        onClick={(e) => { e.stopPropagation(); renameCustomMaterial(custom.id); }}
                        style={{ fontFamily: "var(--hw-font-display)", fontSize: 16, fontWeight: 400, letterSpacing: "2px", textTransform: "uppercase" as const, color: "var(--hw-text)", marginBottom: 2, marginRight: 24, display: "inline-flex", alignItems: "center", gap: 6, cursor: "text" }}
                        title="Click to rename"
                      >
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{custom.label}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--hw-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
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
                          FILE
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
          <button
            onClick={addCustomMaterial}
            style={{
              width: "100%", padding: "12px", marginTop: 12,
              border: "3px dashed var(--hw-border-light)", background: "transparent",
              fontFamily: "var(--hw-font-display)", fontSize: 14, fontWeight: 400, letterSpacing: "2px", textTransform: "uppercase" as const, color: "var(--hw-text-muted)", cursor: "pointer",
            }}
          >
            + ADD CUSTOM MATERIAL
          </button>
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

        {/* ══════ 2. Lodging ══════ */}
        <Accordion
          title="Lodging"
          badge={(() => {
            const ld = (artist.lodging_defaults as any) || {};
            const rooms = (ld.rooms as any[] || []);
            const total = rooms.reduce((sum: number, r: any) => sum + (r.count || 1), 0);
            return total ? `${total} room${total !== 1 ? "s" : ""}` : "Not set";
          })()}
          badgeColor={(() => {
            const ld = (artist.lodging_defaults as any) || {};
            const rooms = (ld.rooms as any[] || []);
            const total = rooms.reduce((sum: number, r: any) => sum + (r.count || 1), 0);
            return total > 0 ? "green" : "gray";
          })()}
        >
          <LodgingSection
            lodging={(artist.lodging_defaults as any) || {}}
            onUpdate={(v) => saveJsonColumn("lodging_defaults", v)}
          />
        </Accordion>

        {/* ══════ 3. Vehicles & Equipment ══════ */}
        <Accordion
          title="Vehicles & Equipment"
          badge={(() => {
            const ve = (artist.vehicles_equipment as any) || {};
            const count = (ve.vehicles as any[] || []).length;
            return count ? String(count) : "0";
          })()}
          badgeColor="gray"
        >
          <VehicleManager
            vehicles={((artist.vehicles_equipment as any)?.vehicles || []) as never[]}
            defaultFuelPrice={4.00}
            onSave={async (updated) => {
              const current = (artist.vehicles_equipment as any) || {};
              const next = { ...current, vehicles: updated };
              saveJsonColumn("vehicles_equipment", next);
            }}
          />
          <div style={{ borderTop: "2px solid var(--hw-border)", marginTop: 16, paddingTop: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10, padding: "6px 0" }}>
              <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: "var(--hw-text-secondary)", fontWeight: 400 }}>Storage Location</label>
              <input
                style={rowInputStyle}
                value={(artist.vehicles_equipment as any)?.storageLocation || ""}
                onChange={(e) => {
                  const current = (artist.vehicles_equipment as any) || {};
                  saveJsonColumn("vehicles_equipment", { ...current, storageLocation: e.target.value || null });
                }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10, padding: "6px 0" }}>
              <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: "var(--hw-text-secondary)", fontWeight: 400 }}>Notes</label>
              <textarea
                style={rowTextareaStyle}
                value={(artist.vehicles_equipment as any)?.notes || ""}
                placeholder="Trailers, major equipment, etc."
                onChange={(e) => {
                  const current = (artist.vehicles_equipment as any) || {};
                  saveJsonColumn("vehicles_equipment", { ...current, notes: e.target.value || null });
                }}
              />
            </div>
          </div>
        </Accordion>

        {/* ══════ 4. Hospitality ══════ */}
        <Accordion
          title="Hospitality"
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

        {/* ══════ 5. Promo & Marketing ══════ */}
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

        {/* ══════ 6. Business Entity ══════ */}
        <div
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (!w9Importing) setW9DragOver(true); }}
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDragLeave={(e) => { e.preventDefault(); setW9DragOver(false); }}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setW9DragOver(false); if (!w9Importing) { const f = e.dataTransfer.files?.[0]; if (f) handleW9Drop(f); } }}
          style={{
            border: w9DragOver ? "3px dashed var(--hw-crimson)" : "3px solid transparent",
            background: w9DragOver ? "var(--hw-crimson-ghost)" : "transparent",
            transition: "var(--hw-ease)",
          }}
        >
          <Accordion title="Business Entity" badge="" badgeColor="gray">
            {w9ImportMsg ? (
              <div style={{ marginBottom: 10, padding: "8px 14px", background: w9ImportMsg.startsWith("Filled") ? "var(--hw-green-ghost)" : w9ImportMsg.startsWith("Reading") ? "var(--hw-bg)" : "var(--hw-red-ghost)", border: w9ImportMsg.startsWith("Filled") ? "2px solid var(--hw-green-border)" : w9ImportMsg.startsWith("Reading") ? "2px solid var(--hw-border-strong)" : "2px solid var(--hw-crimson)", fontFamily: "var(--hw-font-mono)", fontSize: 12, letterSpacing: "1px", color: w9ImportMsg.startsWith("Filled") ? "var(--hw-green)" : w9ImportMsg.startsWith("Reading") ? "var(--hw-text-muted)" : "var(--hw-crimson)" }}>
                {w9ImportMsg}
              </div>
            ) : (
              <div style={{ marginBottom: 10, fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: "1px", color: "var(--hw-text-muted)" }}>
                Drop a W-9 PDF here to autofill
              </div>
            )}
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
        </div>

        {/* ══════ 9. Technical Production ══════ */}
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
      marginBottom: 10,
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
      {!rosterDragOver && (
        <div style={{
          marginTop: 8,
          fontFamily: "var(--hw-font-mono)",
          fontSize: 10,
          fontWeight: 400,
          letterSpacing: "1px",
          color: "var(--hw-text-muted)",
          textAlign: "center" as const,
        }}>
          Drag and drop your roster and pay here
        </div>
      )}
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

// ── Lodging Section ────────────────────────────────────────────

interface LodgingRoom {
  type: string;
  bed_config: string;
  count: number;
}

interface LodgingDefaults {
  rooms: LodgingRoom[];
  star_minimum: number;
  nightly_budget_override?: number | null;
}

function LodgingSection({
  lodging,
  onUpdate,
}: {
  lodging: Partial<LodgingDefaults>;
  onUpdate: (v: LodgingDefaults) => void;
}) {
  const rooms: LodgingRoom[] = lodging.rooms || [];
  const starMinimum = lodging.star_minimum || 3;
  const budgetOverride = lodging.nightly_budget_override || null;

  function save(updated: Partial<LodgingDefaults>) {
    onUpdate({
      rooms: updated.rooms ?? rooms,
      star_minimum: updated.star_minimum ?? starMinimum,
      nightly_budget_override: updated.nightly_budget_override !== undefined ? updated.nightly_budget_override : budgetOverride,
    });
  }

  function addRoom() {
    save({ rooms: [...rooms, { type: "double", bed_config: "2 queens", count: 1 }] });
  }

  function updateRoom(idx: number, field: keyof LodgingRoom, value: string | number) {
    const updated = rooms.map((r, i) => i === idx ? { ...r, [field]: value } : r);
    save({ rooms: updated });
  }

  function removeRoom(idx: number) {
    save({ rooms: rooms.filter((_, i) => i !== idx) });
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--hw-font-mono)",
    fontSize: 11,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    color: "var(--hw-text-secondary)",
    fontWeight: 400,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "6px 8px",
    border: "2px solid var(--hw-border)",
    fontFamily: "var(--hw-font-body)",
    fontSize: 13,
    background: "var(--hw-bg-surface)",
    color: "var(--hw-text)",
    outline: "none",
  };

  return (
    <div>
      {/* Star rating + budget override */}
      <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 160px 1fr", gap: 10, marginBottom: 16, padding: "6px 0" }}>
        <label style={labelStyle}>Min Star Rating</label>
        <select
          value={starMinimum}
          onChange={(e) => save({ star_minimum: Number(e.target.value) })}
          style={inputStyle}
        >
          <option value={2}>2-Star (Budget)</option>
          <option value={3}>3-Star (Standard)</option>
          <option value={4}>4-Star (Upscale)</option>
          <option value={5}>5-Star (Luxury)</option>
        </select>
        <label style={labelStyle}>Nightly Budget Override</label>
        <input
          type="number"
          placeholder="Leave blank to use market rates"
          value={budgetOverride ?? ""}
          onChange={(e) => save({ nightly_budget_override: e.target.value ? Number(e.target.value) : null })}
          style={inputStyle}
        />
      </div>

      {/* Room list */}
      <div style={{ borderTop: "2px solid var(--hw-border)", paddingTop: 12, marginBottom: 8 }}>
        <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-secondary)", marginBottom: 8 }}>
          Room Breakdown
        </div>
        {rooms.length === 0 && (
          <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 13, color: "var(--hw-text-muted)", marginBottom: 8 }}>
            No rooms added yet. Add rooms to enable hotel cost projections.
          </div>
        )}
        {rooms.map((room, idx) => (
          <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 40px", gap: 8, marginBottom: 6, alignItems: "center" }}>
            <input
              placeholder="Room type (e.g. TM Single, Band Double)"
              value={room.type}
              onChange={(e) => updateRoom(idx, "type", e.target.value)}
              style={inputStyle}
            />
            <input
              placeholder="Bed config (e.g. 1 king, 2 queens)"
              value={room.bed_config}
              onChange={(e) => updateRoom(idx, "bed_config", e.target.value)}
              style={inputStyle}
            />
            <input
              type="number"
              min={1}
              placeholder="Qty"
              value={room.count}
              onChange={(e) => updateRoom(idx, "count", Number(e.target.value) || 1)}
              style={inputStyle}
            />
            <button
              onClick={() => removeRoom(idx)}
              style={{ padding: "4px 8px", border: "2px solid var(--hw-crimson)", background: "transparent", color: "var(--hw-crimson)", fontFamily: "var(--hw-font-mono)", fontSize: 11, cursor: "pointer" }}
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={addRoom}
          style={{ marginTop: 4, padding: "6px 14px", border: "2px solid var(--hw-border-strong)", background: "transparent", color: "var(--hw-text)", fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", cursor: "pointer" }}
        >
          + Add Room
        </button>
      </div>
    </div>
  );
}
