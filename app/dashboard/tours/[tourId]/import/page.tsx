"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

type ParsedEvent = {
  date_iso: string | null;
  day: string | null;
  venue_name: string | null;
  city: string | null;
  state: string | null;
  promoter_email: string | null;
  manager_email: string | null;
  notes: string | null;
};

export default function ImportPage() {
  const params = useParams();
  const router = useRouter();
  const tourId = params.tourId as string;

  const [rawText, setRawText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<ParsedEvent[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Handle file upload (PDF, DOCX, image, CSV, txt)
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    const textTypes = ["txt", "csv", "md"];

    if (textTypes.includes(ext ?? "")) {
      const text = await file.text();
      setRawText(text);
      return;
    }

    // For PDF, DOCX, images — read as base64 and extract text via a second AI call
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      setRawText(`[File uploaded: ${file.name}]\n\nExtracting text...`);

      try {
        const res = await fetch("/api/import/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base64,
            filename: file.name,
            mimeType: file.type,
          }),
        });
        const data = await res.json();
        if (data.text) {
          setRawText(data.text);
        } else {
          setRawText("");
          setError(data.error ?? "Could not extract text from file.");
        }
      } catch {
        setError("Failed to extract file content.");
        setRawText("");
      }
    };
    reader.readAsDataURL(file);
  }

  // ── Parse the schedule
  async function handleParse() {
    if (!rawText.trim()) return;
    setError(null);
    setEvents(null);
    setWarnings([]);
    setParsing(true);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? "Parsing failed.");
        return;
      }

      setEvents(data.events ?? []);
      setWarnings(data.warnings ?? []);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setParsing(false);
    }
  }

  // ── Save confirmed events to DB
  async function handleSave() {
    if (!events || events.length === 0) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/import/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tourId, events }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? "Failed to save events.");
        setSaving(false);
        return;
      }

      router.push(`/dashboard/tours/${tourId}`);
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  const s = styles;

  return (
    <div style={s.page}>
      <div style={s.wrap}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <div style={s.eyebrow}>AI Tour Import</div>
            <h1 style={s.title}>Import Schedule</h1>
            <div style={s.subtitle}>
              Paste a tour schedule or upload a file. The AI will extract every
              date, venue, city, and email automatically.
            </div>
          </div>
          <button
            style={s.backBtn}
            onClick={() => router.push(`/dashboard/tours/${tourId}`)}
          >
            ← Back
          </button>
        </div>

        {/* Input card — hide after parse */}
        {!events && (
          <div style={s.card}>
            {/* File upload row */}
            <div style={s.uploadRow}>
              <div style={s.uploadLabel}>Upload a file</div>
              <div style={s.uploadFormats}>
                PDF · DOCX · CSV · TXT · JPG · PNG
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.csv,.txt,.jpg,.jpeg,.png,.gif,.webp"
                style={{ display: "none" }}
                onChange={handleFile}
              />
              <button
                style={s.uploadBtn}
                onClick={() => fileRef.current?.click()}
              >
                Choose file
              </button>
            </div>

            <div style={s.divider}>
              <span style={s.dividerText}>or paste text below</span>
            </div>

            {/* Text area */}
            <textarea
              style={s.textarea}
              placeholder={`Paste your tour schedule here. Any format works — itinerary emails, spreadsheet copy/paste, Google Doc text, routing sheets, etc.\n\nExample:\nMay 1 — Detroit, MI — The Fillmore — promo@example.com\nMay 3 — Chicago, IL — Metro — buyer@metro.com`}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={14}
            />

            {error && <div style={s.errorBox}>{error}</div>}

            <button
              style={{
                ...s.parseBtn,
                opacity: !rawText.trim() || parsing ? 0.5 : 1,
                cursor: !rawText.trim() || parsing ? "not-allowed" : "pointer",
              }}
              disabled={!rawText.trim() || parsing}
              onClick={handleParse}
            >
              {parsing ? "Parsing with AI…" : "Parse Schedule →"}
            </button>

            {parsing && (
              <div style={s.parsingNote}>
                This usually takes 5–15 seconds depending on schedule length.
              </div>
            )}
          </div>
        )}

        {/* Preview table */}
        {events && (
          <>
            <div style={s.previewHeader}>
              <div>
                <div style={s.previewTitle}>
                  {events.length} event{events.length !== 1 ? "s" : ""} found
                </div>
                <div style={s.previewSub}>
                  Review below. If everything looks right, click Confirm Import.
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  style={s.retryBtn}
                  onClick={() => {
                    setEvents(null);
                    setWarnings([]);
                    setError(null);
                  }}
                >
                  ← Try again
                </button>
                <button
                  style={{
                    ...s.confirmBtn,
                    opacity: saving ? 0.6 : 1,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                  disabled={saving}
                  onClick={handleSave}
                >
                  {saving ? "Saving…" : `Confirm Import (${events.length})`}
                </button>
              </div>
            </div>

            {warnings.length > 0 && (
              <div style={s.warningsBox}>
                <div style={s.warningsTitle}>⚠ AI noticed some issues:</div>
                {warnings.map((w, i) => (
                  <div key={i} style={s.warningItem}>
                    · {w}
                  </div>
                ))}
              </div>
            )}

            {error && <div style={s.errorBox}>{error}</div>}

            <div style={s.tableWrap}>
              {/* Table header */}
              <div style={s.tableHead}>
                <div style={s.col.date}>Date</div>
                <div style={s.col.day}>Day</div>
                <div style={s.col.venue}>Venue</div>
                <div style={s.col.city}>City, ST</div>
                <div style={s.col.email}>Promoter Email</div>
                <div style={s.col.email}>Manager Email</div>
                <div style={s.col.notes}>Notes</div>
              </div>

              {events.map((e, i) => (
                <div
                  key={i}
                  style={{
                    ...s.tableRow,
                    background: i % 2 === 0 ? "#fff" : "#fafafa",
                  }}
                >
                  <div style={s.col.date}>{e.date_iso ?? "—"}</div>
                  <div style={s.col.day}>{e.day ?? "—"}</div>
                  <div style={s.col.venue}>{e.venue_name ?? "—"}</div>
                  <div style={s.col.city}>
                    {[e.city, e.state].filter(Boolean).join(", ") || "—"}
                  </div>
                  <div style={{ ...s.col.email, opacity: 0.7 }}>
                    {e.promoter_email ?? "—"}
                  </div>
                  <div style={{ ...s.col.email, opacity: 0.7 }}>
                    {e.manager_email ?? "—"}
                  </div>
                  <div style={{ ...s.col.notes, opacity: 0.6 }}>
                    {e.notes ?? ""}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Styles
const col = {
  date: { width: 110, flexShrink: 0, fontSize: 13 },
  day: { width: 80, flexShrink: 0, fontSize: 13 },
  venue: { width: 180, flexShrink: 0, fontSize: 13 },
  city: { width: 140, flexShrink: 0, fontSize: 13 },
  email: { width: 220, flexShrink: 0, fontSize: 12 },
  notes: { flex: 1, fontSize: 12 },
};

const styles = {
  page: {
    minHeight: "100vh",
    background: "#EEEEEE",
    padding: "32px 24px 80px",
  },
  wrap: {
    maxWidth: 1100,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 28,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "#888",
    marginBottom: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: 900,
    margin: 0,
    letterSpacing: -0.5,
    color: "#111",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
    color: "#666",
    maxWidth: 520,
    lineHeight: 1.6,
  },
  backBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
    flexShrink: 0,
    marginTop: 4,
  },
  card: {
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 16,
    padding: 24,
  },
  uploadRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap" as const,
  },
  uploadLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#111",
  },
  uploadFormats: {
    fontSize: 12,
    color: "#999",
    flex: 1,
  },
  uploadBtn: {
    padding: "8px 14px",
    borderRadius: 10,
    border: "1px solid #ddd",
    background: "#f5f5f5",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
  },
  divider: {
    margin: "18px 0",
    borderTop: "1px solid #eee",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative" as const,
  },
  dividerText: {
    background: "#fff",
    padding: "0 12px",
    fontSize: 12,
    color: "#aaa",
    position: "relative" as const,
    top: -1,
  },
  textarea: {
    width: "100%",
    padding: "14px",
    border: "1px solid #ddd",
    borderRadius: 12,
    fontSize: 13,
    lineHeight: 1.7,
    resize: "vertical" as const,
    outline: "none",
    fontFamily: "monospace",
    color: "#111",
    background: "#fafafa",
  },
  errorBox: {
    marginTop: 14,
    padding: "12px 14px",
    borderRadius: 10,
    background: "#fff0f0",
    border: "1px solid #fcc",
    fontSize: 13,
    color: "#B00020",
  },
  parseBtn: {
    marginTop: 16,
    width: "100%",
    padding: "14px",
    borderRadius: 12,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 900,
    fontSize: 15,
    transition: "opacity 0.2s",
  },
  parsingNote: {
    marginTop: 10,
    fontSize: 12,
    color: "#999",
    textAlign: "center" as const,
  },
  previewHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 16,
    flexWrap: "wrap" as const,
  },
  previewTitle: {
    fontSize: 22,
    fontWeight: 900,
    color: "#111",
  },
  previewSub: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  retryBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 13,
  },
  confirmBtn: {
    padding: "10px 18px",
    borderRadius: 10,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 900,
    fontSize: 13,
    transition: "opacity 0.2s",
  },
  warningsBox: {
    marginBottom: 16,
    padding: "14px 16px",
    borderRadius: 12,
    background: "#fffbf0",
    border: "1px solid #f0d080",
    fontSize: 13,
  },
  warningsTitle: {
    fontWeight: 700,
    marginBottom: 6,
    color: "#7a5c00",
  },
  warningItem: {
    color: "#7a5c00",
    marginTop: 4,
  },
  tableWrap: {
    border: "1px solid #ddd",
    borderRadius: 14,
    overflow: "hidden",
    background: "#fff",
    overflowX: "auto" as const,
  },
  tableHead: {
    display: "flex",
    gap: 0,
    padding: "10px 16px",
    background: "#f5f5f5",
    borderBottom: "1px solid #eee",
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    minWidth: 1050,
    color: "#555",
  },
  tableRow: {
    display: "flex",
    padding: "11px 16px",
    borderTop: "1px solid #f0f0f0",
    alignItems: "center",
    minWidth: 1050,
  },
  col,
} as const;
