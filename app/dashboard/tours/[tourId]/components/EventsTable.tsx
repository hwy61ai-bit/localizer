"use client";

import { renderPoster, formatDateForRender } from "@/lib/clientRender";
import { useToast } from "@/app/components/Toast";

import { useState, useRef } from "react";
import type React from "react";

type EventRow = {
  id: string; tour_id: string; date_iso: string; day: string | null;
  city: string; state: string | null; venue: string;
  promoter_email: string | null; manager_email: string | null;
  sent_at: string | null; event_index: number | null;
  render_status: string | null;
};

type Props = {
  events: EventRow[];
  tourId: string;
  orgId: string;
};

const EDITABLE_FIELDS = ["date_iso","day","city","state","venue","promoter_email"] as const;
type EditableField = typeof EDITABLE_FIELDS[number];

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!m || !d) return iso;
  return `${m}/${d}/${y}`;
}

type CropRegion = { x: number; y: number; w: number; h: number };

function isValidCropRegion(r: any): r is CropRegion {
  if (!r || typeof r !== "object") return false;
  const { x, y, w, h } = r;
  if (![x, y, w, h].every((n) => typeof n === "number" && Number.isFinite(n))) return false;
  if (w <= 0 || h <= 0 || x < 0 || y < 0) return false;
  if (x + w > 1.0001 || y + h > 1.0001) return false;
  return true;
}

function formatFraction(n: number): string {
  return n.toFixed(4);
}

type CityStateCellProps = {
  event: EventRow;
  editing: { id: string; field: EditableField } | null;
  saving: string | null;
  drafts: { city: string; state: string };
  inputRef: React.RefObject<HTMLInputElement | null>;
  onStartEdit: (e: EventRow, field: EditableField) => void;
  onCityChange: (val: string) => void;
  onStateChange: (val: string) => void;
  onCommit: () => void;
  onKey: (e: React.KeyboardEvent) => void;
};

function CityStateCell({ event, editing, saving, drafts, inputRef, onStartEdit, onCityChange, onStateChange, onCommit, onKey }: CityStateCellProps) {
  const isCityEditing = editing?.id === event.id && editing?.field === "city";
  const isStateEditing = editing?.id === event.id && editing?.field === "state";
  const isEditing = isCityEditing || isStateEditing;
  return (
    <div style={{ cursor: "text", minHeight: 24, padding: "2px 4px", borderRadius: 0, border: isEditing ? "2px solid var(--hw-border-strong)" : "2px solid transparent", background: isEditing ? "var(--hw-bg-surface)" : "transparent", transition: "border 0.1s, background 0.1s", position: "relative" }}
      onMouseEnter={e => { if (!isEditing) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--hw-border)"; }}
      onMouseLeave={e => { if (!isEditing) (e.currentTarget as HTMLDivElement).style.borderColor = "transparent"; }}>
      <span style={{ fontSize: 14 }}>
        {isCityEditing ? (
          <input ref={inputRef} value={drafts.city} onChange={e => onCityChange(e.target.value)} onBlur={onCommit} onKeyDown={onKey} style={{ border: "none", outline: "none", width: 90, fontSize: 14, background: "transparent", padding: 0 }} />
        ) : (
          <span onClick={() => onStartEdit(event, "city")} style={{ cursor: "text" }}>{event.city || <span style={{ color: "var(--hw-text-muted)" }}>City</span>}</span>
        )}
        <span style={{ color: "var(--hw-text-muted)" }}>, </span>
        {isStateEditing ? (
          <input ref={inputRef} value={drafts.state} onChange={e => onStateChange(e.target.value)} onBlur={onCommit} onKeyDown={onKey} style={{ border: "none", outline: "none", width: 28, fontSize: 14, background: "transparent", padding: 0 }} />
        ) : (
          <span onClick={() => onStartEdit(event, "state")} style={{ cursor: "text" }}>{event.state || <span style={{ color: "var(--hw-text-muted)" }}>ST</span>}</span>
        )}
      </span>
    </div>
  );
}


type CellProps = {
  event: EventRow;
  field: EditableField;
  display: string;
  editing: { id: string; field: EditableField } | null;
  saving: string | null;
  draft: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onStartEdit: (e: EventRow, field: EditableField) => void;
  onDraftChange: (val: string) => void;
  onCommit: () => void;
  onKey: (e: React.KeyboardEvent) => void;
};

function Cell({ event, field, display, editing, saving, draft, inputRef, onStartEdit, onDraftChange, onCommit, onKey }: CellProps) {
  const isEditing = editing?.id === event.id && editing?.field === field;
  const isSaving = saving === event.id + field;
  return (
    <div onClick={() => onStartEdit(event, field)} title="Click to edit"
      style={{ cursor: "text", minHeight: 24, padding: "2px 4px", borderRadius: 0, border: isEditing ? "2px solid var(--hw-border-strong)" : "2px solid transparent", background: isEditing ? "var(--hw-bg-surface)" : "transparent", opacity: isSaving ? 0.4 : 1, transition: "border 0.1s, background 0.1s", position: "relative" }}
      onMouseEnter={e => { if (!isEditing) (e.currentTarget as HTMLDivElement).style.borderColor = "var(--hw-border)"; }}
      onMouseLeave={e => { if (!isEditing) (e.currentTarget as HTMLDivElement).style.borderColor = "transparent"; }}>
      {isEditing ? (
        <input ref={inputRef} value={draft} onChange={e => onDraftChange(e.target.value)} onBlur={onCommit} onKeyDown={onKey} style={{ border: "none", outline: "none", width: "100%", fontSize: 14, background: "transparent", padding: 0 }} />
      ) : (
        <span style={{ fontSize: 14 }}>{display || <span style={{ color: "var(--hw-text-muted)" }}>—</span>}</span>
      )}
    </div>
  );
}

export default function EventsTable({ events: initial, tourId, orgId }: Props) {
  const toast = useToast();
  const [events, setEvents] = useState<EventRow[]>(initial);
  const [editing, setEditing] = useState<{ id: string; field: EditableField } | null>(null);
  const [draft, setDraft] = useState("");
  const [drafts, setDrafts] = useState<{ city: string; state: string }>({ city: "", state: "" });
  const [saving, setSaving] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit(e: EventRow, field: EditableField) {
    setEditing({ id: e.id, field });
    setDraft((e[field] ?? "") as string);
    if (field === "city" || field === "state") {
      setDrafts({ city: e.city ?? "", state: e.state ?? "" });
    }
    setTimeout(() => inputRef.current?.focus(), 30);
  }

  async function commitEdit() {
    if (!editing) return;
    const { id, field } = editing;
    const isCityState = field === "city" || field === "state";
    const value = isCityState ? (field === "city" ? drafts.city : drafts.state) : draft;
    const original = events.find(e => e.id === id)?.[field] ?? "";
    if (value === (original ?? "")) { setEditing(null); return; }
    setSaving(id + field);
    setEditing(null);
    setEvents(prev => prev.map(e => e.id === id ? { ...e, [field]: value || null } : e));
    await fetch(`/api/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value || null }),
    });
    setSaving(null);
  }

  async function deleteEvent(id: string) {
    setEvents(prev => prev.filter(e => e.id !== id));
    setConfirmDelete(null);
    await fetch(`/api/events/${id}`, { method: "DELETE" });
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") setEditing(null);
  }

  const [renderProgress, setRenderProgress] = useState<{ done: number; total: number } | null>(null);
  const [longVenues, setLongVenues] = useState<{ eventId: string; venue: string; edited: string }[] | null>(null);

  function measureVenueWidth(text: string, fontSize: number, fontFamily: string): number {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    ctx.font = "bold " + fontSize + "px '" + fontFamily + "', sans-serif";
    return ctx.measureText(text).width;
  }

  async function preCheckVenues() {
    // Fetch tour data to get overlay config
    const dataRes = await fetch("/api/renders/tour-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tourId, orgId }),
    });
    if (!dataRes.ok) return null;
    const tourData = await dataRes.json();
    const overlayConfig = tourData.tour.overlay_config ?? {};

    // Load font
    const formats = ["square", "story", "landscape"];
    const formatDims: Record<string, { w: number; h: number }> = {
      square: { w: 1080, h: 1080 }, story: { w: 1080, h: 1350 }, landscape: { w: 820, h: 312 },
    };

    const flagged: { eventId: string; venue: string; edited: string }[] = [];

    for (const event of tourData.events) {
      const venueName = event.venue_name ?? event.venue ?? "";
      if (!venueName || venueName.includes("|")) continue;

      // Check against the widest format (most likely to overflow)
      let worstRatio = 1;
      for (const fmt of formats) {
        const cfg = overlayConfig[fmt] ?? {};
        const fontFamily = cfg.fontFamily ?? "Oswald";
        const venueSize = cfg.venue?.size ?? 36;
        const caps = cfg.allCaps ?? false;
        const text = caps ? venueName.toUpperCase() : venueName;
        const venueX = cfg.venue?.x ?? 0.5;
        const venueAlign = cfg.venue?.align ?? "center";
        const dims = formatDims[fmt];
        const margin = 0.95;
        let avail: number;
        if (venueAlign === "left") avail = (1 - venueX) * dims.w * margin;
        else if (venueAlign === "right") avail = venueX * dims.w * margin;
        else avail = Math.min(venueX, 1 - venueX) * 2 * dims.w * margin;

        // Load font if needed
        const fontLink = document.getElementById("gfont-" + fontFamily.replace(/ /g, "+"));
        if (!fontLink) {
          const link = document.createElement("link");
          link.id = "gfont-" + fontFamily.replace(/ /g, "+");
          link.rel = "stylesheet";
          link.href = "https://fonts.googleapis.com/css2?family=" + fontFamily.replace(/ /g, "+") + ":wght@400;700&display=swap";
          document.head.appendChild(link);
          await new Promise(r => setTimeout(r, 300));
          await document.fonts.ready;
        }

        const textWidth = measureVenueWidth(text, venueSize, fontFamily);
        const ratio = avail / textWidth;
        if (ratio < worstRatio) worstRatio = ratio;
      }

      // If text would need to shrink below 70%, flag it
      if (worstRatio < 0.7) {
        flagged.push({ eventId: event.id, venue: venueName, edited: venueName });
      }
    }

    return flagged.length > 0 ? flagged : null;
  }

  async function generateAll() {
    // If we haven't done the venue check yet, do it now
    if (!longVenues) {
      setGenerating(true);
      const flagged = await preCheckVenues();
      setGenerating(false);
      if (flagged) {
        setLongVenues(flagged);
        return; // Show modal, user will re-trigger after editing
      }
    }
    setLongVenues(null);

    setGenerating(true);
    setGenerateError(null);
    setEvents(prev => prev.map(e => ({ ...e, render_status: "rendering" })));

    try {
      // Fetch tour data for rendering
      const dataRes = await fetch("/api/renders/tour-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tourId, orgId }),
      });
      const tourData = await dataRes.json();
      if (!dataRes.ok) throw new Error(tourData.error ?? "Failed to load tour data");

      const { tour, events: serverEvents, customFonts, logoUrl, sponsorLogo1Url, sponsorLogo2Url } = tourData;
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
      const overlayConfig = tour.overlay_config ?? {};
      const bandName = tour.band_name ?? tour.band_tour_label ?? tour.name ?? "Artist";

      // Load custom fonts into browser
      for (const cf of customFonts) {
        if (cf.url) {
          const face = new FontFace(cf.fontName, "url(" + cf.url + ")");
          try {
            const loaded = await face.load();
            document.fonts.add(loaded);
          } catch (e) {
            console.warn("Failed to load custom font:", cf.fontName, e);
          }
        }
      }

      const imageIds: Record<string, string | null> = {
        square: tour.image_square_id,
        story: tour.image_story_id,
        landscape: tour.image_landscape_id,
      };

      const formatDims: Record<string, { w: number; h: number }> = {
        square: { w: 1080, h: 1080 },
        story: { w: 1080, h: 1350 },
        landscape: { w: 820, h: 312 },
      };

      const formats = ["square", "story", "landscape"];
      const total = serverEvents.length * formats.length;
      let done = 0;
      setRenderProgress({ done: 0, total });

      const errors: string[] = [];

      for (const event of serverEvents) {
        const renderUrls: Record<string, string | null> = {};

        for (const fmt of formats) {
          const pid = imageIds[fmt];
          if (!pid) {
            renderUrls["render_" + fmt + "_url"] = null;
            done++;
            setRenderProgress({ done, total });
            continue;
          }

          const dims = formatDims[fmt];
          const cfg = overlayConfig[fmt] ?? {};
          const shortDate = cfg.shortDate ?? false;

          const cropRegion = (tour as any).crop_config?.[fmt] ?? null;
          const baseLayer = isValidCropRegion(cropRegion)
            ? "c_crop,x_" + formatFraction(cropRegion.x) + ",y_" + formatFraction(cropRegion.y) + ",w_" + formatFraction(cropRegion.w) + ",h_" + formatFraction(cropRegion.h) + "/c_fill,w_" + dims.w + ",h_" + dims.h
            : "c_fill,g_center,w_" + dims.w + ",h_" + dims.h;
          const baseUrl = "https://res.cloudinary.com/" + cloudName + "/image/upload/" + baseLayer + "/" + pid;

          const venueName = event.venue_name ?? event.venue ?? "";
          const city = event.venue_city ?? event.city ?? "";
          const state = event.venue_state ?? event.state ?? "";

          const eventData = {
            bandName,
            dateFormatted: formatDateForRender(event.date_iso, shortDate),
            venueName,
            cityState: [city, state].filter(Boolean).join(", "),
            customText1: tour.custom_text_1 ?? null,
            customText2: tour.custom_text_2 ?? null,
          };

          try {
            // Load Google Font if needed
            const fontFamily = cfg.fontFamily ?? "Oswald";
            const fontLink = document.getElementById("gfont-" + fontFamily.replace(/ /g, "+"));
            if (!fontLink) {
              const link = document.createElement("link");
              link.id = "gfont-" + fontFamily.replace(/ /g, "+");
              link.rel = "stylesheet";
              link.href = "https://fonts.googleapis.com/css2?family=" + fontFamily.replace(/ /g, "+") + ":wght@400;700&display=swap";
              document.head.appendChild(link);
              // Give font time to load
              await new Promise(r => setTimeout(r, 500));
              await document.fonts.ready;
            }

            const blob = await renderPoster(baseUrl, cfg, fmt, eventData, logoUrl, sponsorLogo1Url, sponsorLogo2Url, tour.band_font_family);

            // Upload to Cloudinary
            const fd = new FormData();
            fd.append("file", blob, "poster.jpg");
            fd.append("upload_preset", "localizer_tours");
            const uploadRes = await fetch(
              "https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload",
              { method: "POST", body: fd }
            );
            if (!uploadRes.ok) throw new Error("Upload failed");
            const uploadData = await uploadRes.json();
            renderUrls["render_" + fmt + "_url"] = uploadData.secure_url;
          } catch (err: any) {
            errors.push(event.venue + " " + fmt + ": " + (err?.message ?? String(err)));
          }

          done++;
          setRenderProgress({ done, total });
        }

        // Save URLs to venue_links
        if (Object.keys(renderUrls).length > 0) {
          try {
            await fetch("/api/renders/save-urls", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ eventId: event.id, orgId, renderUrls }),
            });
          } catch (err: any) {
            errors.push(event.venue + " save: " + (err?.message ?? String(err)));
          }
        }
      }

      if (errors.length > 0) {
        setGenerateError(errors[0]);
        setEvents(prev => prev.map(e => ({ ...e, render_status: "ready" })));
      } else {
        setEvents(prev => prev.map(e => ({ ...e, render_status: "ready" })));
      }

      // Generate video render URLs via server-side Cloudinary (non-blocking).
      // Runs after all image renders and venue_links writes have completed so
      // the videosOnly upsert only touches video columns on existing rows.
      try {
        await fetch("/api/renders/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tourId, orgId, videosOnly: true }),
        });
      } catch (e) {
        console.warn("Video render pass failed (non-blocking):", e);
      }

    } catch (err: any) {
      setGenerateError(err?.message ?? "Generate failed");
      setEvents(prev => prev.map(e => ({ ...e, render_status: "error" })));
    } finally {
      setGenerating(false);
      setRenderProgress(null);
    }
  }

  async function sendEvent(eventId: string) {
    setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, render_status: "rendering" } : ev));
    const res = await fetch("/api/renders/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, orgId }),
    });
    const data = await res.json();
    setEvents(prev => prev.map(ev => ev.id === eventId
      ? { ...ev, render_status: data.ok ? "ready" : "error", sent_at: data.ok ? new Date().toISOString() : null }
      : ev
    ));
  }

  async function reRenderEvent(eventId: string) {
    setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, render_status: "rendering" } : ev));
    const res = await fetch("/api/renders/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, orgId }),
    });
    const data = await res.json();
    setEvents(prev => prev.map(ev => ev.id === eventId
      ? { ...ev, render_status: data.ok ? "ready" : "error" }
      : ev
    ));
  }

  const COLS = "100px 50px 150px 200px 250px 100px 130px";
  const allReady = events.length > 0 && events.every(e => e.render_status === "ready" || !!e.sent_at);
  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <div style={{ padding: "12px 16px", borderBottom: "3px solid var(--hw-border-strong)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-muted)" }}>
            {events.length === 0 ? "NO EVENTS YET" : `${events.length} EVENT${events.length !== 1 ? "S" : ""} · ${events.filter(e => !!e.sent_at).length} SENT`}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {renderProgress && (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 120, height: 8, background: "var(--hw-border)", overflow: "hidden", border: "1px solid var(--hw-border-light)" }}>
                  <div style={{ width: (renderProgress.done / renderProgress.total * 100) + "%", height: "100%", background: "var(--hw-crimson)", transition: "width 0.3s" }} />
                </div>
                <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, color: "var(--hw-text-muted)", fontWeight: 700 }}>{renderProgress.done}/{renderProgress.total}</span>
              </div>
            )}
            {generateError && (
              <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, color: "var(--hw-crimson)", fontWeight: 700 }}>{generateError}</span>
            )}
            <button
              onClick={generateAll}
              disabled={generating || events.length === 0}
              style={{ padding: "10px 20px", border: "3px solid var(--hw-crimson)", background: generating ? "var(--hw-text-muted)" : "var(--hw-crimson)", color: "#fff", fontFamily: "var(--hw-font-display)", fontSize: 14, letterSpacing: "3px", textTransform: "uppercase", cursor: generating || events.length === 0 ? "not-allowed" : "pointer", opacity: events.length === 0 ? 0.4 : 1, transition: "var(--hw-ease)" }}
            >
              {generating ? "GENERATING..." : allReady ? "RE-GENERATE ALL" : "GENERATE ALL"}
            </button>
            <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 10, fontWeight: 300, color: "var(--hw-text-secondary)", marginTop: 4, textAlign: "right" }}>Hit Generate to create all localized assets.</div>
          </div>
        </div>

        <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 12, fontWeight: 300, color: "var(--hw-text-secondary)", padding: "8px 0 4px 16px" }}>All info can be edited below.</div>

        <div style={{ display: "grid", gridTemplateColumns: COLS + " 80px", gap: 0, padding: "12px 16px", background: "var(--hw-bg-invert)", fontFamily: "var(--hw-font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "#fff" }}>
          <div>DATE</div><div>DAY</div><div>CITY, ST</div><div>VENUE</div>
          <div>PROMOTER EMAIL</div>
          <div>STATUS</div><div>LINK</div>
        </div>

        {events.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 24, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text)", marginBottom: 8 }}>NO EVENTS YET</div>
            <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-text-muted)" }}>Click <b>+ New Event</b> to create one.</div>
          </div>
        ) : (
          events.map((e, i) => (
            <div key={e.id}
              onMouseEnter={() => setHoveredRow(e.id)}
              onMouseLeave={() => { setHoveredRow(null); setConfirmDelete(null); }}
              style={{ display: "grid", gridTemplateColumns: COLS + " 80px", padding: "12px 16px", borderTop: "2px solid var(--hw-border)", alignItems: "center", background: "var(--hw-bg-surface)", position: "relative", transition: "var(--hw-ease)" }}
              onMouseOver={(ev) => (ev.currentTarget.style.background = "var(--hw-crimson-ghost)")}
              onMouseOut={(ev) => (ev.currentTarget.style.background = "var(--hw-bg-surface)")}>
              <Cell event={e} field="date_iso" display={e.date_iso ? formatDate(e.date_iso) : ""} editing={editing} saving={saving} draft={draft} inputRef={inputRef} onStartEdit={startEdit} onDraftChange={setDraft} onCommit={commitEdit} onKey={handleKey} />
              <Cell event={e} field="day" display={e.day ? e.day.slice(0,3) : ""} editing={editing} saving={saving} draft={draft} inputRef={inputRef} onStartEdit={startEdit} onDraftChange={setDraft} onCommit={commitEdit} onKey={handleKey} />
              <CityStateCell event={e} editing={editing} saving={saving} drafts={drafts} inputRef={inputRef} onStartEdit={startEdit} onCityChange={val => setDrafts(d => ({ ...d, city: val }))} onStateChange={val => setDrafts(d => ({ ...d, state: val }))} onCommit={commitEdit} onKey={handleKey} />
              <Cell event={e} field="venue" display={e.venue} editing={editing} saving={saving} draft={draft} inputRef={inputRef} onStartEdit={startEdit} onDraftChange={setDraft} onCommit={commitEdit} onKey={handleKey} />
              <div style={{ opacity: 0.8, display: "flex", alignItems: "center", gap: 4 }}>
                <button onClick={() => { const current = e.promoter_email ?? ""; startEdit(e, "promoter_email"); setTimeout(() => { setDraft(current ? current + ", " : ""); inputRef.current?.focus(); }, 50); }} title="Hit + to add another email address" style={{ width: 22, height: 22, borderRadius: 0, border: "2px solid var(--hw-border)", background: "var(--hw-bg-surface)", color: "var(--hw-text-muted)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, lineHeight: 1 }}>+</button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editing?.id === e.id && editing?.field === "promoter_email" ? (
                    <>
                      <div style={{ padding: "2px 4px", borderRadius: 0, border: "2px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)" }}>
                        <input ref={inputRef} value={draft} onChange={ev => setDraft(ev.target.value)} onBlur={commitEdit} onKeyDown={handleKey} style={{ border: "none", outline: "none", width: "100%", fontSize: 14, background: "transparent", padding: 0 }} />
                      </div>
                      <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 10, color: "var(--hw-text-secondary)", marginTop: 3, paddingLeft: 2 }}>Hit + to add another email address</div>
                    </>
                  ) : (() => {
                    const emails = (e.promoter_email ?? "").split(",").map(x => x.trim()).filter(Boolean);
                    if (emails.length === 0) return <div onClick={() => startEdit(e, "promoter_email")} style={{ cursor: "text", padding: "2px 4px", borderRadius: 0, border: "2px solid transparent", minHeight: 24 }} onMouseEnter={ev => (ev.currentTarget.style.borderColor = "var(--hw-border)")} onMouseLeave={ev => (ev.currentTarget.style.borderColor = "transparent")}><span style={{ fontSize: 14, color: "var(--hw-text-muted)" }}>&mdash;</span></div>;
                    return (
                      <div onClick={() => startEdit(e, "promoter_email")} style={{ cursor: "text", padding: "2px 4px", borderRadius: 0, border: "2px solid transparent" }} onMouseEnter={ev => (ev.currentTarget.style.borderColor = "var(--hw-border)")} onMouseLeave={ev => (ev.currentTarget.style.borderColor = "transparent")}>
                        <div style={{ fontSize: 14, lineHeight: 1.4 }}>{emails[0]}</div>
                        {emails.length === 2 && <div style={{ fontSize: 14, lineHeight: 1.4 }}>{emails[1]}</div>}
                        {emails.length > 2 && <div style={{ fontSize: 11, fontWeight: 700, color: "var(--hw-text-muted)", marginTop: 2 }}>+{emails.length - 1} more</div>}
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div>
                {e.sent_at ? (
                  <span style={{ display: "inline-block", padding: "4px 10px", border: "2px solid var(--hw-green-border)", background: "var(--hw-green-ghost)", fontFamily: "var(--hw-font-mono)", fontWeight: 700, fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-green)" }}>SENT</span>
                ) : e.render_status === "rendering" ? (
                  <span style={{ display: "inline-block", padding: "4px 10px", border: "2px solid var(--hw-amber)", background: "var(--hw-amber-ghost)", fontFamily: "var(--hw-font-mono)", fontWeight: 700, fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-amber)" }}>RENDERING...</span>
                ) : e.render_status === "ready" ? (
                  <button onClick={() => sendEvent(e.id)} style={{ padding: "4px 12px", border: "2px solid var(--hw-border-strong)", background: "var(--hw-bg-invert)", color: "#fff", cursor: "pointer", fontFamily: "var(--hw-font-mono)", fontWeight: 700, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase" }}>SEND</button>
                ) : e.render_status === "error" ? (
                  <button onClick={() => reRenderEvent(e.id)} style={{ padding: "4px 12px", border: "2px solid var(--hw-crimson)", background: "var(--hw-bg-surface)", cursor: "pointer", fontFamily: "var(--hw-font-mono)", fontWeight: 700, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-crimson)" }}>RETRY</button>
                ) : (
                  <span style={{ display: "inline-block", padding: "4px 10px", border: "2px solid var(--hw-border)", background: "var(--hw-bg-surface)", fontFamily: "var(--hw-font-mono)", fontWeight: 700, fontSize: 9, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text-muted)" }}>NOT READY</span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <button onClick={async () => {
                  const res = await fetch("/api/venue-link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orgId, eventId: e.id }) });
                  const data = await res.json();
                  if (data.token) window.open(`/v/e/${data.token}`, "_blank");
                }} style={{ padding: "4px 12px", border: "2px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", color: "var(--hw-text)", cursor: "pointer", fontFamily: "var(--hw-font-mono)", fontWeight: 700, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase" }}>LINK</button>
                <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 9, fontWeight: 300, color: "var(--hw-text-secondary)", marginTop: 3, textAlign: "center" }}>Preview assets</div>
              </div>
              {hoveredRow === e.id && (
                <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}>
                  {confirmDelete === e.id ? (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => deleteEvent(e.id)} style={{ padding: "4px 10px", border: "2px solid var(--hw-crimson)", background: "var(--hw-bg-surface)", color: "var(--hw-crimson)", fontFamily: "var(--hw-font-mono)", fontWeight: 700, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", cursor: "pointer" }}>DELETE</button>
                      <button onClick={() => setConfirmDelete(null)} style={{ padding: "4px 10px", border: "2px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", fontFamily: "var(--hw-font-mono)", fontWeight: 700, fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", cursor: "pointer" }}>CANCEL</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(e.id)} style={{ padding: "4px 10px", border: "2px solid var(--hw-border)", background: "var(--hw-bg-surface)", fontFamily: "var(--hw-font-mono)", fontWeight: 700, fontSize: 9, cursor: "pointer", color: "var(--hw-text-muted)" }}>x</button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {longVenues && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
          <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", boxShadow: "var(--hw-shadow-xl)", maxWidth: 600, width: "90%", maxHeight: "80vh", overflow: "auto" }}>
            <div style={{ padding: "20px 24px", borderBottom: "3px solid var(--hw-border-strong)" }}>
              <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 4 }}>LONG VENUE NAMES</div>
              <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-text-secondary)" }}>These venues are too long for one line. Add a <b>|</b> where you want the line break, or shorten the name.</div>
            </div>
            <div style={{ padding: "16px 24px" }}>
              {longVenues.map((lv, i) => (
                <div key={lv.eventId} style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-muted)", marginBottom: 4 }}>ORIGINAL: {lv.venue}</div>
                  <input
                    value={lv.edited}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLongVenues(prev => prev!.map((v, j) => j === i ? { ...v, edited: val } : v));
                    }}
                    style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "3px solid var(--hw-border-strong)", fontFamily: "var(--hw-font-body)", fontSize: 15, fontWeight: 500, outline: "none" }}
                    placeholder="Add | for line break"
                  />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, padding: "16px 24px", borderTop: "3px solid var(--hw-border-strong)", background: "var(--hw-bg)" }}>
              <button
                onClick={async () => {
                  for (const lv of longVenues!) {
                    if (lv.edited !== lv.venue) {
                      await fetch("/api/events/" + lv.eventId, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ venue: lv.edited, venue_name: lv.edited }),
                      });
                      setEvents(prev => prev.map(e => e.id === lv.eventId ? { ...e, venue: lv.edited } : e));
                    }
                  }
                  generateAll();
                }}
                style={{ flex: 1, padding: "12px 20px", border: "3px solid var(--hw-crimson)", background: "var(--hw-crimson)", color: "#fff", fontFamily: "var(--hw-font-display)", fontSize: 14, letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer" }}
              >SAVE & GENERATE</button>
              <button
                onClick={() => setLongVenues(null)}
                style={{ padding: "12px 20px", border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", color: "var(--hw-text-secondary)", fontFamily: "var(--hw-font-display)", fontSize: 14, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" }}
              >CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
