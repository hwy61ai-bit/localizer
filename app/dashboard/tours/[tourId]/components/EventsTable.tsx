"use client";

import { useState, useRef } from "react";
import type React from "react";
import OpenAssetsButton from "./OpenAssetsButton";

type EventRow = {
  id: string; tour_id: string; date_iso: string; day: string | null;
  city: string; state: string | null; venue: string;
  promoter_email: string | null; manager_email: string | null;
  sent_at: string | null; event_index: number | null;
  render_status: string | null;
};

type FieldConfig = { x: number; y: number; size: number };
type FormatConfig = {
  fontFamily: string;
  textColor: string;
  showBandName: boolean;
  bandSize: number;
  band?: FieldConfig;
  date: FieldConfig;
  venue: FieldConfig;
  city: FieldConfig;
};
type OverlayConfig = {
  square?: FormatConfig;
  story?: FormatConfig;
  landscape?: FormatConfig;
};

const DEFAULT_FIELD: Record<string, FieldConfig> = {
  date:  { x: 0.5, y: 0.84, size: 40 },
  venue: { x: 0.5, y: 0.76, size: 52 },
  city:  { x: 0.5, y: 0.91, size: 40 },
};

const DEFAULT_FORMAT: FormatConfig = {
  fontFamily: "Oswald",
  textColor: "ffffff",
  showBandName: false,
  bandSize: 80,
  date:  DEFAULT_FIELD.date,
  venue: DEFAULT_FIELD.venue,
  city:  DEFAULT_FIELD.city,
};

type Props = {
  events: EventRow[];
  tourId: string;
  orgId: string;
  overlayConfig: OverlayConfig | null;
  imageSquareId: string | null;
  imageStoryId: string | null;
  imageLandscapeId: string | null;
  cloudName: string;
};

const EDITABLE_FIELDS = ["date_iso","day","city","state","venue","promoter_email","manager_email"] as const;
type EditableField = typeof EDITABLE_FIELDS[number];

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!m || !d) return iso;
  return `${m}/${d}/${y}`;
}

function formatDateLong(iso: string, day: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = day ?? date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "long" });
  return `${weekday} ${month} ${d} ${y}`;
}

function sanitize(t: string) {
  return encodeURIComponent(t.replace(/,/g, " ").replace(/[/?&#%()'"]/g, "").replace(/\s+/g, " ").trim());
}

function buildUrl(publicId: string, cloudName: string, cfg: FormatConfig, event: EventRow, w: number, h: number): string {
  const font = cfg.fontFamily.replace(/ /g, "%20");
  const maxW = Math.round(w * 0.85);
  const color = cfg.textColor;
  const scale = w === 1920 ? 0.75 : 1;

  function toPixel(field: FieldConfig) {
    return {
      xPx: Math.round((field.x - 0.5) * w),
      yPx: Math.round((field.y - 0.5) * h),
    };
  }

  const vp = toPixel(cfg.venue);
  const dp = toPixel(cfg.date);
  const cp = toPixel(cfg.city);
  const dateStr = sanitize(formatDateLong(event.date_iso, event.day));
  const venueName = sanitize(event.venue);
  const cityState = sanitize(`${event.city}${event.state ? " " + event.state : ""}`);

  const layers = [
    `c_fill,g_center,h_${h},w_${w}`,
    `c_fit,co_rgb:${color},fl_layer_apply.fl_no_overflow,g_center,l_text:${font}_${Math.round(cfg.venue.size * scale)}_bold:${venueName},w_${maxW},x_${vp.xPx},y_${vp.yPx}`,
    `c_fit,co_rgb:${color},fl_layer_apply.fl_no_overflow,g_center,l_text:${font}_${Math.round(cfg.date.size * scale)}:${dateStr},w_${maxW},x_${dp.xPx},y_${dp.yPx}`,
    `c_fit,co_rgb:${color},fl_layer_apply.fl_no_overflow,g_center,l_text:${font}_${Math.round(cfg.city.size * scale)}:${cityState},w_${maxW},x_${cp.xPx},y_${cp.yPx}`,
  ];

  return `https://res.cloudinary.com/${cloudName}/image/upload/${layers.join("/")}/${publicId}`;
}

type PreviewFormat = { key: string; label: string; publicId: string | null; w: number; h: number; cfg: FormatConfig };

function PreviewLightbox({ events, overlayConfig, imageSquareId, imageStoryId, imageLandscapeId, cloudName, onClose }: {
  events: EventRow[];
  overlayConfig: OverlayConfig | null;
  imageSquareId: string | null;
  imageStoryId: string | null;
  imageLandscapeId: string | null;
  cloudName: string;
  onClose: () => void;
}) {
  const [eventIndex, setEventIndex] = useState(0);
  const [formatIndex, setFormatIndex] = useState(0);

  const oc = overlayConfig ?? {};
  console.log('overlayConfig in lightbox:', JSON.stringify(overlayConfig));
  const squareCfg  = oc.square    ?? DEFAULT_FORMAT;
  const storyCfg   = oc.story     ?? DEFAULT_FORMAT;
  const landscapeCfg = oc.landscape ?? DEFAULT_FORMAT;

  const squarePid    = imageSquareId;
  const storyPid     = imageStoryId ?? imageSquareId;
  const landscapePid = imageLandscapeId ?? imageSquareId;

  const formats: PreviewFormat[] = [
    { key: "square",    label: "IG Square",  publicId: squarePid,    w: 1080, h: 1080, cfg: squareCfg },
    { key: "story",     label: "IG Story",   publicId: storyPid,     w: 1080, h: 1350, cfg: storyCfg },
    { key: "landscape", label: "FB Cover",   publicId: landscapePid, w: 1920, h: 1080, cfg: landscapeCfg },
  ];

  const event = events[eventIndex];
  const fmt = formats[formatIndex];
  const previewUrl = fmt.publicId ? buildUrl(fmt.publicId, cloudName, fmt.cfg, event, fmt.w, fmt.h) : null;
  console.log("publicId:", fmt.publicId, "previewUrl:", previewUrl);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      {/* Header */}
      <div style={{ width: "100%", maxWidth: 900, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px 12px" }}>
        <div style={{ color: "#fff", fontWeight: 900, fontSize: 16 }}>
          {event.day ? `${event.day} ` : ""}{formatDate(event.date_iso)} — {event.venue}, {event.city}{event.state ? `, ${event.state}` : ""}
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", lineHeight: 1 }}>✕</button>
      </div>

      {/* Format tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {formats.map((f, i) => (
          <button key={f.key} onClick={() => setFormatIndex(i)}
            style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid", borderColor: formatIndex === i ? "#fff" : "rgba(255,255,255,0.3)", background: formatIndex === i ? "#fff" : "transparent", color: formatIndex === i ? "#111" : "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Image */}
      {(() => {
        const aspectRatio = fmt.h / fmt.w;
        const maxW = fmt.key === "landscape" ? 800 : fmt.key === "story" ? 400 : 500;
        return (
          <div style={{ position: "relative", maxWidth: maxW, width: "100%" }}>
            <div style={{ paddingBottom: `${aspectRatio * 100}%`, position: "relative", borderRadius: 12, overflow: "hidden", background: "#222" }}>
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#888" }}>No image uploaded for this format</div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Event navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16 }}>
        <button onClick={() => setEventIndex(i => Math.max(0, i - 1))} disabled={eventIndex === 0}
          style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "#fff", fontWeight: 700, fontSize: 14, cursor: eventIndex === 0 ? "not-allowed" : "pointer", opacity: eventIndex === 0 ? 0.3 : 1 }}>
          ← Prev
        </button>
        <span style={{ color: "#aaa", fontSize: 13 }}>{eventIndex + 1} / {events.length}</span>
        <button onClick={() => setEventIndex(i => Math.min(events.length - 1, i + 1))} disabled={eventIndex === events.length - 1}
          style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "#fff", fontWeight: 700, fontSize: 14, cursor: eventIndex === events.length - 1 ? "not-allowed" : "pointer", opacity: eventIndex === events.length - 1 ? 0.3 : 1 }}>
          Next →
        </button>
      </div>
    </div>
  );
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
    <div style={{ display: "flex", alignItems: "center", gap: 2, border: isEditing ? "1.5px solid #111" : "1.5px solid transparent", borderRadius: 6, padding: "2px 4px", background: isEditing ? "#fff" : "transparent", transition: "border 0.1s" }}
      onMouseEnter={e => { if (!isEditing) (e.currentTarget as HTMLDivElement).style.borderColor = "#ddd"; }}
      onMouseLeave={e => { if (!isEditing) (e.currentTarget as HTMLDivElement).style.borderColor = "transparent"; }}>
      {isCityEditing ? (
        <input ref={inputRef} value={drafts.city} onChange={e => onCityChange(e.target.value)} onBlur={onCommit} onKeyDown={onKey} style={{ border: "none", outline: "none", width: 110, fontSize: 14, background: "transparent", padding: 0 }} />
      ) : (
        <span onClick={() => onStartEdit(event, "city")} style={{ fontSize: 14, cursor: "text" }}>{event.city || <span style={{ color: "#ccc" }}>City</span>}</span>
      )}
      <span style={{ fontSize: 14, color: "#999" }}>,</span>
      {isStateEditing ? (
        <input ref={inputRef} value={drafts.state} onChange={e => onStateChange(e.target.value)} onBlur={onCommit} onKeyDown={onKey} style={{ border: "none", outline: "none", width: 30, fontSize: 14, background: "transparent", padding: 0 }} />
      ) : (
        <span onClick={() => onStartEdit(event, "state")} style={{ fontSize: 14, cursor: "text" }}>{event.state || <span style={{ color: "#ccc" }}>ST</span>}</span>
      )}
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
      style={{ cursor: "text", minHeight: 24, padding: "2px 4px", borderRadius: 6, border: isEditing ? "1.5px solid #111" : "1.5px solid transparent", background: isEditing ? "#fff" : "transparent", opacity: isSaving ? 0.4 : 1, transition: "border 0.1s, background 0.1s", position: "relative" }}
      onMouseEnter={e => { if (!isEditing) (e.currentTarget as HTMLDivElement).style.borderColor = "#ddd"; }}
      onMouseLeave={e => { if (!isEditing) (e.currentTarget as HTMLDivElement).style.borderColor = "transparent"; }}>
      {isEditing ? (
        <input ref={inputRef} value={draft} onChange={e => onDraftChange(e.target.value)} onBlur={onCommit} onKeyDown={onKey} style={{ border: "none", outline: "none", width: "100%", fontSize: 14, background: "transparent", padding: 0 }} />
      ) : (
        <span style={{ fontSize: 14 }}>{display || <span style={{ color: "#ccc" }}>—</span>}</span>
      )}
    </div>
  );
}

export default function EventsTable({ events: initial, tourId, orgId, overlayConfig, imageSquareId, imageStoryId, imageLandscapeId, cloudName }: Props) {
  const [events, setEvents] = useState<EventRow[]>(initial);
  const [editing, setEditing] = useState<{ id: string; field: EditableField } | null>(null);
  const [draft, setDraft] = useState("");
  const [drafts, setDrafts] = useState<{ city: string; state: string }>({ city: "", state: "" });
  const [saving, setSaving] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
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

  const COLS = "90px 100px 180px 200px 200px 200px 100px 100px 80px";

  return (
    <>
      {showPreview && (
        <PreviewLightbox
          events={events}
          overlayConfig={overlayConfig}
          imageSquareId={imageSquareId}
          imageStoryId={imageStoryId}
          imageLandscapeId={imageLandscapeId}
          cloudName={cloudName}
          onClose={() => setShowPreview(false)}
        />
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button
          onClick={() => setShowPreview(true)}
          disabled={events.length === 0}
          style={{ padding: "10px 20px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", fontWeight: 700, fontSize: 13, cursor: events.length === 0 ? "not-allowed" : "pointer", opacity: events.length === 0 ? 0.4 : 1 }}
        >👁 Preview All</button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: COLS, minWidth: 1470, gap: 0, padding: "10px 16px", background: "#fafafa", fontSize: 12, fontWeight: 900, borderBottom: "1px solid #eee" }}>
          <div>Date</div><div>Day</div><div>City, ST</div><div>Venue</div>
          <div>Promoter Email</div><div>Manager Email</div>
          <div>Assets</div><div>Status</div><div>Link</div><div></div>
        </div>

        {events.length === 0 ? (
          <div style={{ padding: 16, opacity: 0.7 }}>No events yet. Click <b>+ New Event</b> to create one.</div>
        ) : (
          events.map((e, i) => (
            <div key={e.id}
              onMouseEnter={() => setHoveredRow(e.id)}
              onMouseLeave={() => { setHoveredRow(null); setConfirmDelete(null); }}
              style={{ display: "grid", gridTemplateColumns: COLS + " 80px", minWidth: 1470, padding: "10px 16px", borderTop: "1px solid #f0f0f0", alignItems: "center", background: i % 2 === 0 ? "#fff" : "#fafafa", position: "relative" }}>
              <Cell event={e} field="date_iso" display={e.date_iso ? formatDate(e.date_iso) : ""} editing={editing} saving={saving} draft={draft} inputRef={inputRef} onStartEdit={startEdit} onDraftChange={setDraft} onCommit={commitEdit} onKey={handleKey} />
              <Cell event={e} field="day" display={e.day ?? ""} editing={editing} saving={saving} draft={draft} inputRef={inputRef} onStartEdit={startEdit} onDraftChange={setDraft} onCommit={commitEdit} onKey={handleKey} />
              <CityStateCell event={e} editing={editing} saving={saving} drafts={drafts} inputRef={inputRef} onStartEdit={startEdit} onCityChange={val => setDrafts(d => ({ ...d, city: val }))} onStateChange={val => setDrafts(d => ({ ...d, state: val }))} onCommit={commitEdit} onKey={handleKey} />
              <Cell event={e} field="venue" display={e.venue} editing={editing} saving={saving} draft={draft} inputRef={inputRef} onStartEdit={startEdit} onDraftChange={setDraft} onCommit={commitEdit} onKey={handleKey} />
              <div style={{ opacity: 0.8 }}><Cell event={e} field="promoter_email" display={e.promoter_email ?? ""} editing={editing} saving={saving} draft={draft} inputRef={inputRef} onStartEdit={startEdit} onDraftChange={setDraft} onCommit={commitEdit} onKey={handleKey} /></div>
              <div style={{ opacity: 0.8 }}><Cell event={e} field="manager_email" display={e.manager_email ?? ""} editing={editing} saving={saving} draft={draft} inputRef={inputRef} onStartEdit={startEdit} onDraftChange={setDraft} onCommit={commitEdit} onKey={handleKey} /></div>
              <div><OpenAssetsButton event={{ id: e.id, date_iso: e.date_iso, city: e.city, state: e.state, venue: e.venue }} /></div>
              <div>
                {e.sent_at ? (
                  <span style={{ display: "inline-block", padding: "6px 10px", borderRadius: 999, border: "1px solid #ddd", background: "#e9f7ef", fontWeight: 900, fontSize: 12 }}>✓ SENT</span>
                ) : e.render_status === "rendering" ? (
                  <span style={{ display: "inline-block", padding: "6px 10px", borderRadius: 999, border: "1px solid #ddd", background: "#fff8e1", fontWeight: 900, fontSize: 12 }}>⏳ RENDERING</span>
                ) : e.render_status === "error" ? (
                  <button onClick={async () => {
                    setEvents(prev => prev.map(ev => ev.id === e.id ? { ...ev, render_status: "rendering" } : ev));
                    const res = await fetch("/api/renders/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: e.id, orgId }) });
                    const data = await res.json();
                    setEvents(prev => prev.map(ev => ev.id === e.id ? { ...ev, render_status: data.ok ? "ready" : "error", sent_at: data.ok ? new Date().toISOString() : null } : ev));
                  }} style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid #e00", background: "#fff0f0", cursor: "pointer", fontWeight: 900, fontSize: 12, color: "#c00" }}>↺ RETRY</button>
                ) : (
                  <button onClick={async () => {
                    setEvents(prev => prev.map(ev => ev.id === e.id ? { ...ev, render_status: "rendering" } : ev));
                    const res = await fetch("/api/renders/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ eventId: e.id, orgId }) });
                    const data = await res.json();
                    setEvents(prev => prev.map(ev => ev.id === e.id ? { ...ev, render_status: data.ok ? "ready" : "error", sent_at: data.ok ? new Date().toISOString() : null } : ev));
                  }} style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid #111", background: "#111", color: "#fff", cursor: "pointer", fontWeight: 900, fontSize: 12 }}>▶ APPROVE & SEND</button>
                )}
              </div>
              <div>
                <button onClick={async () => {
                  const res = await fetch("/api/venue-link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orgId, eventId: e.id }) });
                  const data = await res.json();
                  if (data.token) window.open(`/v/e/${data.token}`, "_blank");
                }} style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: 900, fontSize: 12 }}>🔗</button>
              </div>
              {hoveredRow === e.id && (
                <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}>
                  {confirmDelete === e.id ? (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => deleteEvent(e.id)} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #e00", background: "#fff0f0", color: "#c00", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>Delete</button>
                      <button onClick={() => setConfirmDelete(null)} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(e.id)} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer", opacity: 0.6 }}>✕</button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}
