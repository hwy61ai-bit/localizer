"use client";

import { useState, useRef } from "react";
import type React from "react";
import OpenAssetsButton from "./OpenAssetsButton";

type EventRow = {
  id: string; tour_id: string; date_iso: string; day: string | null;
  city: string; state: string | null; venue: string;
  promoter_email: string | null; manager_email: string | null;
  sent_at: string | null; event_index: number | null;
};

type Props = { events: EventRow[]; tourId: string; orgId: string };

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
  onDraftChange: (val: string) => void;
  onCommit: () => void;
  onKey: (e: React.KeyboardEvent) => void;
};

function CityStateCell({ event, editing, saving, drafts, inputRef, onStartEdit, onDraftChange, onCommit, onKey }: CityStateCellProps) {
  const isCityEditing = editing?.id === event.id && editing?.field === "city";
  const isStateEditing = editing?.id === event.id && editing?.field === "state";
  const isEditing = isCityEditing || isStateEditing;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        border: isEditing ? "1.5px solid #111" : "1.5px solid transparent",
        borderRadius: 6,
        padding: "2px 4px",
        background: isEditing ? "#fff" : "transparent",
        transition: "border 0.1s",
      }}
      onMouseEnter={e => { if (!isEditing) (e.currentTarget as HTMLDivElement).style.borderColor = "#ddd"; }}
      onMouseLeave={e => { if (!isEditing) (e.currentTarget as HTMLDivElement).style.borderColor = "transparent"; }}
    >
      {isCityEditing ? (
        <input
          ref={inputRef}
          value={drafts.city}
          onChange={e => onDraftChange(e.target.value)}
          onBlur={onCommit}
          onKeyDown={onKey}
          style={{ border: "none", outline: "none", width: 110, fontSize: 14, background: "transparent", padding: 0 }}
        />
      ) : (
        <span onClick={() => onStartEdit(event, "city")} style={{ fontSize: 14, cursor: "text" }}>{event.city || <span style={{ color: "#ccc" }}>City</span>}</span>
      )}
      <span style={{ fontSize: 14, color: "#999" }}>,</span>
      {isStateEditing ? (
        <input
          value={drafts.state}
          onChange={e => onDraftChange(e.target.value)}
          onBlur={onCommit}
          onKeyDown={onKey}
          style={{ border: "none", outline: "none", width: 30, fontSize: 14, background: "transparent", padding: 0 }}
        />
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
    <div
      onClick={() => onStartEdit(event, field)}
      title="Click to edit"
      style={{
        cursor: "text",
        minHeight: 24,
        padding: "2px 4px",
        borderRadius: 6,
        border: isEditing ? "1.5px solid #111" : "1.5px solid transparent",
        background: isEditing ? "#fff" : "transparent",
        opacity: isSaving ? 0.4 : 1,
        transition: "border 0.1s, background 0.1s",
        position: "relative",
      }}
      onMouseEnter={e => { if (!isEditing) (e.currentTarget as HTMLDivElement).style.borderColor = "#ddd"; }}
      onMouseLeave={e => { if (!isEditing) (e.currentTarget as HTMLDivElement).style.borderColor = "transparent"; }}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => onDraftChange(e.target.value)}
          onBlur={onCommit}
          onKeyDown={onKey}
          style={{ border: "none", outline: "none", width: "100%", fontSize: 14, background: "transparent", padding: 0 }}
        />
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
          <div
            key={e.id}
            onMouseEnter={() => setHoveredRow(e.id)}
            onMouseLeave={() => { setHoveredRow(null); setConfirmDelete(null); }}
            style={{ display: "grid", gridTemplateColumns: COLS + " 80px", minWidth: 1470, padding: "10px 16px", borderTop: "1px solid #f0f0f0", alignItems: "center", background: i % 2 === 0 ? "#fff" : "#fafafa", position: "relative" }}>
            <Cell event={e} field="date_iso" display={e.date_iso ? formatDate(e.date_iso) : ""} editing={editing} saving={saving} draft={draft} inputRef={inputRef} onStartEdit={startEdit} onDraftChange={setDraft} onCommit={commitEdit} onKey={handleKey} />
            <Cell event={e} field="day" display={e.day ?? ""} editing={editing} saving={saving} draft={draft} inputRef={inputRef} onStartEdit={startEdit} onDraftChange={setDraft} onCommit={commitEdit} onKey={handleKey} />
            <CityStateCell event={e} editing={editing} saving={saving} drafts={drafts} inputRef={inputRef} onStartEdit={startEdit} onDraftChange={setDraft} onCommit={commitEdit} onKey={handleKey} />
            <Cell event={e} field="venue" display={e.venue} editing={editing} saving={saving} draft={draft} inputRef={inputRef} onStartEdit={startEdit} onDraftChange={setDraft} onCommit={commitEdit} onKey={handleKey} />
            <div style={{ opacity: 0.8 }}><Cell event={e} field="promoter_email" display={e.promoter_email ?? ""} editing={editing} saving={saving} draft={draft} inputRef={inputRef} onStartEdit={startEdit} onDraftChange={setDraft} onCommit={commitEdit} onKey={handleKey} /></div>
            <div style={{ opacity: 0.8 }}><Cell event={e} field="manager_email" display={e.manager_email ?? ""} editing={editing} saving={saving} draft={draft} inputRef={inputRef} onStartEdit={startEdit} onDraftChange={setDraft} onCommit={commitEdit} onKey={handleKey} /></div>
            <div>
              <OpenAssetsButton event={{ id: e.id, date_iso: e.date_iso, city: e.city, state: e.state, venue: e.venue }} />
            </div>
            <div>
              {e.sent_at ? (
                <span style={{ display: "inline-block", padding: "6px 10px", borderRadius: 999, border: "1px solid #ddd", background: "#e9f7ef", fontWeight: 900, fontSize: 12 }}>SENT</span>
              ) : (
                <form action={async (fd) => {
                  const eventId = fd.get("eventId") as string;
                  await fetch(`/api/events/${eventId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sent_at: new Date().toISOString() }) });
                  setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, sent_at: new Date().toISOString() } : ev));
                }}>
                  <input type="hidden" name="eventId" value={e.id} />
                  <button type="submit" style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid #ddd", background: "#ffecec", cursor: "pointer", fontWeight: 900, fontSize: 12 }}>SEND</button>
                </form>
              )}
            </div>
            <div>
              <button
                onClick={async () => {
                  const res = await fetch("/api/venue-link", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orgId, eventId: e.id }),
                  });
                  const data = await res.json();
                  if (data.token) window.open(`/v/e/${data.token}`, "_blank");
                }}
                style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid #ddd", background: "#fff", cursor: "pointer", fontWeight: 900, fontSize: 12 }}
              >LINK</button>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
              {confirmDelete === e.id ? (
                <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <button onClick={() => deleteEvent(e.id)} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #e00", background: "#fff0f0", color: "#c00", fontWeight: 900, fontSize: 11, cursor: "pointer" }}>Yes</button>
                  <button onClick={() => setConfirmDelete(null)} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", fontWeight: 900, fontSize: 11, cursor: "pointer" }}>No</button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirmDelete(e.id)}
                  style={{ opacity: hoveredRow === e.id ? 1 : 0, transition: "opacity 0.15s", background: "none", border: "none", cursor: "pointer", fontSize: 15, padding: "2px 4px", color: "#999" }}
                >🗑</button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
