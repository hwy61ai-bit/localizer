"use client";

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

const EDITABLE_FIELDS = ["date_iso","day","city","state","venue","promoter_email","manager_email"] as const;
type EditableField = typeof EDITABLE_FIELDS[number];

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!m || !d) return iso;
  return `${m}/${d}/${y}`;
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

export default function EventsTable({ events: initial, tourId, orgId }: Props) {
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

  async function generateAll() {
    setGenerating(true);
    setGenerateError(null);
    setEvents(prev => prev.map(e => ({ ...e, render_status: "rendering" })));
    try {
      const res = await fetch("/api/renders/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tourId, orgId }),
      });
      const data = await res.json();
      if (data.ok) {
        setEvents(prev => prev.map(e => ({ ...e, render_status: "ready" })));
      } else {
        const failedVenues = (data.errors ?? []).map((err: string) => err.split(":")[0]);
        setEvents(prev => prev.map(e =>
          failedVenues.some((v: string) => e.venue.includes(v))
            ? { ...e, render_status: "error" }
            : { ...e, render_status: "ready" }
        ));
        setGenerateError(data.errors[0] ?? "Render failed");
      }
    } catch {
      setGenerateError("Generate failed. Check your network and try again.");
      setEvents(prev => prev.map(e => ({ ...e, render_status: "error" })));
    } finally {
      setGenerating(false);
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

  const COLS = "90px 100px 180px 200px 200px 200px 100px 140px 80px";
  const allReady = events.length > 0 && events.every(e => e.render_status === "ready" || !!e.sent_at);
  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "#fafafa" }}>
          <div style={{ fontSize: 13, color: "#888" }}>
            {events.length === 0 ? "No events yet." : `${events.length} event${events.length !== 1 ? "s" : ""} · ${events.filter(e => !!e.sent_at).length} sent`}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {generateError && (
              <span style={{ fontSize: 12, color: "#c00", fontWeight: 700 }}>{generateError}</span>
            )}
            <button
              onClick={generateAll}
              disabled={generating || events.length === 0}
              style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: generating ? "#888" : "#111", color: "#fff", fontWeight: 900, fontSize: 13, cursor: generating || events.length === 0 ? "not-allowed" : "pointer", opacity: events.length === 0 ? 0.4 : 1, transition: "background 0.2s" }}
            >
              {generating ? "Generating..." : allReady ? "4. Re-Generate All" : "4. Generate All"}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: COLS, minWidth: 1200, gap: 0, padding: "10px 16px", background: "#fafafa", fontSize: 12, fontWeight: 900, borderBottom: "1px solid #eee" }}>
          <div>Date</div><div>Day</div><div>City, ST</div><div>Venue</div>
          <div>Promoter Email</div><div>Manager Email</div>
          <div>Status</div><div>Link</div>
        </div>

        {events.length === 0 ? (
          <div style={{ padding: 16, opacity: 0.7 }}>No events yet. Click <b>+ New Event</b> to create one.</div>
        ) : (
          events.map((e, i) => (
            <div key={e.id}
              onMouseEnter={() => setHoveredRow(e.id)}
              onMouseLeave={() => { setHoveredRow(null); setConfirmDelete(null); }}
              style={{ display: "grid", gridTemplateColumns: COLS + " 80px", minWidth: 1200, padding: "10px 16px", borderTop: "1px solid #f0f0f0", alignItems: "center", background: i % 2 === 0 ? "#fff" : "#fafafa", position: "relative" }}>
              <Cell event={e} field="date_iso" display={e.date_iso ? formatDate(e.date_iso) : ""} editing={editing} saving={saving} draft={draft} inputRef={inputRef} onStartEdit={startEdit} onDraftChange={setDraft} onCommit={commitEdit} onKey={handleKey} />
              <Cell event={e} field="day" display={e.day ?? ""} editing={editing} saving={saving} draft={draft} inputRef={inputRef} onStartEdit={startEdit} onDraftChange={setDraft} onCommit={commitEdit} onKey={handleKey} />
              <CityStateCell event={e} editing={editing} saving={saving} drafts={drafts} inputRef={inputRef} onStartEdit={startEdit} onCityChange={val => setDrafts(d => ({ ...d, city: val }))} onStateChange={val => setDrafts(d => ({ ...d, state: val }))} onCommit={commitEdit} onKey={handleKey} />
              <Cell event={e} field="venue" display={e.venue} editing={editing} saving={saving} draft={draft} inputRef={inputRef} onStartEdit={startEdit} onDraftChange={setDraft} onCommit={commitEdit} onKey={handleKey} />
              <div style={{ opacity: 0.8 }}><Cell event={e} field="promoter_email" display={e.promoter_email ?? ""} editing={editing} saving={saving} draft={draft} inputRef={inputRef} onStartEdit={startEdit} onDraftChange={setDraft} onCommit={commitEdit} onKey={handleKey} /></div>
              <div style={{ opacity: 0.8 }}><Cell event={e} field="manager_email" display={e.manager_email ?? ""} editing={editing} saving={saving} draft={draft} inputRef={inputRef} onStartEdit={startEdit} onDraftChange={setDraft} onCommit={commitEdit} onKey={handleKey} /></div>
                            <div>
                {e.sent_at ? (
                  <span style={{ display: "inline-block", padding: "6px 10px", borderRadius: 999, border: "1px solid #ddd", background: "#e9f7ef", fontWeight: 900, fontSize: 12 }}>SENT</span>
                ) : e.render_status === "rendering" ? (
                  <span style={{ display: "inline-block", padding: "6px 10px", borderRadius: 999, border: "1px solid #ddd", background: "#fff8e1", fontWeight: 900, fontSize: 12 }}>Rendering...</span>
                ) : e.render_status === "ready" ? (
                  <button onClick={() => sendEvent(e.id)} style={{ padding: "6px 14px", borderRadius: 10, border: "none", background: "#111", color: "#fff", cursor: "pointer", fontWeight: 900, fontSize: 12 }}>Send</button>
                ) : e.render_status === "error" ? (
                  <button onClick={() => reRenderEvent(e.id)} style={{ padding: "6px 14px", borderRadius: 10, border: "1px solid #e00", background: "#fff", cursor: "pointer", fontWeight: 900, fontSize: 12, color: "#c00" }}>Retry</button>
                ) : (
                  <span style={{ display: "inline-block", padding: "6px 10px", borderRadius: 999, border: "1px solid #ddd", background: "#f5f5f5", fontWeight: 900, fontSize: 12, color: "#999" }}>Not ready</span>
                )}
              </div>
              <div>
                <button onClick={async () => {
                  const res = await fetch("/api/venue-link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orgId, eventId: e.id }) });
                  const data = await res.json();
                  if (data.token) window.open(`/v/e/${data.token}`, "_blank");
                }} style={{ padding: "6px 14px", borderRadius: 10, border: "1px solid #111", background: "#fff", color: "#111", cursor: "pointer", fontWeight: 900, fontSize: 12 }}>Link / Preview</button>
              </div>
              {hoveredRow === e.id && (
                <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}>
                  {confirmDelete === e.id ? (
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => deleteEvent(e.id)} style={{ padding: "6px 12px", borderRadius: 10, border: "1px solid #e00", background: "#fff", color: "#c00", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>Delete</button>
                      <button onClick={() => setConfirmDelete(null)} style={{ padding: "6px 12px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(e.id)} style={{ padding: "6px 12px", borderRadius: 10, border: "1px solid #ddd", background: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer", opacity: 0.6 }}>x</button>
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
