"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [events, setEvents] = useState<ParsedEvent[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const parseIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const parseStartRef = useRef<number>(0);

  const startParseProgress = useCallback(() => {
    setParseProgress(0);
    parseStartRef.current = Date.now();
    if (parseIntervalRef.current) clearInterval(parseIntervalRef.current);
    parseIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - parseStartRef.current) / 1000;
      let pct: number;
      if (elapsed < 5) {
        pct = (elapsed / 5) * 70; // 0-70% in first 5s
      } else if (elapsed < 15) {
        pct = 70 + ((elapsed - 5) / 10) * 20; // 70-90% over next 10s
      } else {
        pct = 90; // cap at 90%
      }
      setParseProgress(Math.min(Math.round(pct), 90));
    }, 100);
  }, []);

  const stopParseProgress = useCallback(() => {
    if (parseIntervalRef.current) clearInterval(parseIntervalRef.current);
    parseIntervalRef.current = null;
    setParseProgress(100);
    setTimeout(() => setParseProgress(0), 500);
  }, []);

  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

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
    setExtracting(true);
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
          setExtracting(false);
        } else {
          setRawText("");
          setError(data.error ?? "Could not extract text from file.");
          setExtracting(false);
        }
      } catch {
        setError("Failed to extract file content.");
        setRawText("");
      }
    };
    reader.readAsDataURL(file);
  }

  // ── Handle file drop
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    // Reuse the same logic as file input
    const input = fileRef.current;
    if (input) {
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  // ── Parse the schedule
  async function handleParse() {
    if (!rawText.trim()) return;
    setError(null);
    setEvents(null);
    setWarnings([]);
    setParsing(true);
    startParseProgress();

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
      stopParseProgress();
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


  function formatDate(iso: string | null) {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    if (!m || !d) return iso;
    return `${m}/${d}/${y}`;
  }

  const s = styles;

  return (
    <div className="fade-in" style={s.page}>
      <div style={s.wrap}>

        {/* Header */}
        <div style={{ marginBottom: 28, paddingBottom: 18, borderBottom: "3px solid var(--hw-border-strong)" }}>
          <Link href={`/dashboard/tours/${tourId}`} style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-muted)", textDecoration: "none", display: "inline-block", marginBottom: 8 }}>&larr; BACK TO TOUR</Link>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "inline-block" }}>
                <h1 style={{ fontFamily: "var(--hw-font-display)", fontSize: 28, letterSpacing: "4px", color: "var(--hw-crimson)", margin: 0, marginBottom: 4, paddingBottom: 8 }}>LOCALIZER</h1>
                <div style={{ borderBottom: "3px solid var(--hw-border-strong)", marginBottom: 6 }} />
              </div>
              <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 48, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text)", margin: 0 }}>IMPORT SCHEDULE</div>
              <div style={{ marginTop: 8, fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-text-secondary)", maxWidth: 520, lineHeight: 1.6 }}>
                Paste a tour schedule or upload a file. HWY61 Labs will extract every
                date, venue, city, and email automatically.
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 8 }}>
                <Link href={`/dashboard/tours/${tourId}/import`} style={{ padding: "10px 18px", border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-invert)", color: "#fff", textDecoration: "none", fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" }}>1. IMPORT SCHEDULE</Link>
                <Link href={`/dashboard/tours/${tourId}/assets`} style={{ padding: "10px 18px", border: "3px solid transparent", background: "var(--hw-bg-surface)", color: "var(--hw-text)", textDecoration: "none", fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, letterSpacing: "1.5px", textTransform: "uppercase" }}>2. IMPORT ASSETS</Link>
                <Link href={`/dashboard/tours/${tourId}/template`} style={{ padding: "10px 18px", border: "3px solid transparent", background: "var(--hw-bg-surface)", color: "var(--hw-text)", textDecoration: "none", fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, letterSpacing: "1.5px", textTransform: "uppercase" }}>3. DESIGN TEMPLATE</Link>
                <Link href={`/dashboard/tours/${tourId}`} style={{ padding: "10px 18px", border: "3px solid transparent", background: "var(--hw-bg-surface)", color: "var(--hw-text)", textDecoration: "none", fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, letterSpacing: "1.5px", textTransform: "uppercase" }}>4. GIGS</Link>
              </div>
            </div>
          </div>
        </div>

        {/* Input card — hide after parse */}
        {!events && (
          <div style={{ ...s.card, border: dragOver ? "3px solid var(--hw-crimson)" : "3px solid var(--hw-border-strong)", transition: "var(--hw-ease)" }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}>
            {/* File upload row */}
            <div style={s.uploadRow}>
              <div style={s.uploadLabel}>Upload a file</div>
              <div style={s.uploadFormats}>
                PDF · DOCX · XLSX · CSV · TXT · JPG · PNG
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.csv,.txt,.jpg,.jpeg,.png,.gif,.webp,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
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
                background: parsing
                  ? `linear-gradient(to right, var(--hw-green) ${parseProgress}%, var(--hw-bg-invert) ${parseProgress}%)`
                  : "var(--hw-bg-invert)",
                opacity: !rawText.trim() || extracting ? 0.5 : 1,
                cursor: !rawText.trim() || parsing || extracting ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
              disabled={!rawText.trim() || parsing || extracting}
              onClick={handleParse}
            >
              {extracting ? "Extracting file\u2026" : parsing ? `Parsing... ${parseProgress}%` : "Parse Schedule \u2192"}
            </button>
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
                    background: "var(--hw-bg-surface)",
                  }}
                >
                  <div style={s.col.date}>{formatDate(e.date_iso)}</div>
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
  date: { width: 110, flexShrink: 0, fontFamily: "var(--hw-font-mono)", fontSize: 12, fontWeight: 500 as const },
  day: { width: 80, flexShrink: 0, fontSize: 13 },
  venue: { width: 180, flexShrink: 0, fontSize: 14, fontWeight: 500 as const, color: "var(--hw-text)" },
  city: { width: 140, flexShrink: 0, fontSize: 14 },
  email: { width: 220, flexShrink: 0, fontFamily: "var(--hw-font-mono)", fontSize: 11 },
  notes: { flex: 1, fontSize: 12, color: "var(--hw-text-muted)" },
};

const styles = {
  page: {
    minHeight: "100vh",
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
    fontFamily: "var(--hw-font-mono)",
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: "2px",
    textTransform: "uppercase" as const,
    color: "var(--hw-text-muted)",
    marginBottom: 6,
  },
  title: {
    fontFamily: "var(--hw-font-display)",
    fontSize: 32,
    fontWeight: 400,
    margin: 0,
    letterSpacing: "2px",
    textTransform: "uppercase" as const,
    color: "var(--hw-text)",
  },
  subtitle: {
    marginTop: 8,
    fontFamily: "var(--hw-font-body)",
    fontSize: 14,
    fontWeight: 300,
    color: "var(--hw-text-secondary)",
    maxWidth: 520,
    lineHeight: 1.6,
  },
  backBtn: {
    padding: "8px 14px",
    border: "3px solid var(--hw-border-strong)",
    background: "var(--hw-bg-surface)",
    cursor: "pointer",
    fontFamily: "var(--hw-font-display)",
    fontWeight: 400,
    fontSize: 12,
    letterSpacing: "2px",
    textTransform: "uppercase" as const,
    flexShrink: 0,
    marginTop: 4,
  },
  card: {
    background: "var(--hw-bg-surface)",
    border: "3px solid var(--hw-border-strong)",
    padding: 24,
  },
  uploadRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap" as const,
  },
  uploadLabel: {
    fontFamily: "var(--hw-font-body)",
    fontSize: 14,
    fontWeight: 500,
    color: "var(--hw-text)",
  },
  uploadFormats: {
    fontFamily: "var(--hw-font-mono)",
    fontSize: 12,
    letterSpacing: "1px",
    color: "var(--hw-text-muted)",
    flex: 1,
  },
  uploadBtn: {
    padding: "8px 14px",
    border: "3px solid var(--hw-border-strong)",
    background: "var(--hw-bg-surface)",
    cursor: "pointer",
    fontFamily: "var(--hw-font-display)",
    fontWeight: 400,
    fontSize: 12,
    letterSpacing: "2px",
    textTransform: "uppercase" as const,
  },
  divider: {
    margin: "18px 0",
    borderTop: "2px solid var(--hw-border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative" as const,
  },
  dividerText: {
    background: "var(--hw-bg-surface)",
    padding: "0 12px",
    fontFamily: "var(--hw-font-mono)",
    fontSize: 11,
    letterSpacing: "2px",
    textTransform: "uppercase" as const,
    color: "var(--hw-text-muted)",
    position: "relative" as const,
    top: -1,
  },
  textarea: {
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "14px",
    border: "3px solid var(--hw-border-strong)",
    fontFamily: "var(--hw-font-mono)",
    fontSize: 13,
    lineHeight: 1.7,
    resize: "vertical" as const,
    outline: "none",
    color: "var(--hw-text)",
    background: "var(--hw-bg-surface)",
  },
  errorBox: {
    marginTop: 14,
    padding: "12px 14px",
    background: "var(--hw-red-ghost)",
    border: "3px solid var(--hw-crimson)",
    fontFamily: "var(--hw-font-mono)",
    fontSize: 11,
    color: "var(--hw-crimson)",
  },
  parseBtn: {
    marginTop: 16,
    width: "100%",
    padding: "14px",
    border: "3px solid var(--hw-action-primary)",
    background: "var(--hw-action-primary)",
    color: "#fff",
    fontFamily: "var(--hw-font-display)",
    fontWeight: 400,
    fontSize: 18,
    letterSpacing: "3px",
    textTransform: "uppercase" as const,
    transition: "var(--hw-ease)",
  },
  parsingNote: {
    marginTop: 10,
    fontFamily: "var(--hw-font-mono)",
    fontSize: 11,
    letterSpacing: "1px",
    color: "var(--hw-text-muted)",
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
    fontFamily: "var(--hw-font-display)",
    fontSize: 28,
    letterSpacing: "2px",
    textTransform: "uppercase" as const,
    color: "var(--hw-text)",
  },
  previewSub: {
    fontFamily: "var(--hw-font-body)",
    fontSize: 14,
    fontWeight: 300,
    color: "var(--hw-text-secondary)",
    marginTop: 4,
  },
  retryBtn: {
    padding: "8px 14px",
    border: "3px solid var(--hw-border-strong)",
    background: "var(--hw-bg-surface)",
    cursor: "pointer",
    fontFamily: "var(--hw-font-display)",
    fontWeight: 400,
    fontSize: 12,
    letterSpacing: "2px",
    textTransform: "uppercase" as const,
  },
  confirmBtn: {
    padding: "10px 18px",
    border: "3px solid var(--hw-action-primary)",
    background: "var(--hw-action-primary)",
    color: "#fff",
    fontFamily: "var(--hw-font-display)",
    fontWeight: 400,
    fontSize: 14,
    letterSpacing: "3px",
    textTransform: "uppercase" as const,
    transition: "var(--hw-ease)",
  },
  warningsBox: {
    marginBottom: 16,
    padding: "14px 16px",
    background: "var(--hw-amber-ghost)",
    border: "3px solid var(--hw-amber)",
    fontFamily: "var(--hw-font-body)",
    fontSize: 13,
    fontWeight: 300,
  },
  warningsTitle: {
    fontFamily: "var(--hw-font-mono)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "1.5px",
    textTransform: "uppercase" as const,
    marginBottom: 6,
    color: "var(--hw-amber)",
  },
  warningItem: {
    color: "var(--hw-amber)",
    marginTop: 4,
  },
  tableWrap: {
    border: "3px solid var(--hw-border-strong)",
    overflow: "hidden",
    background: "var(--hw-bg-surface)",
    overflowX: "auto" as const,
  },
  tableHead: {
    display: "flex",
    gap: 0,
    padding: "12px 16px",
    background: "var(--hw-bg-invert)",
    fontFamily: "var(--hw-font-mono)",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "2px",
    textTransform: "uppercase" as const,
    minWidth: 1050,
    color: "#fff",
  },
  tableRow: {
    display: "flex",
    padding: "11px 16px",
    borderTop: "2px solid var(--hw-border)",
    alignItems: "center",
    minWidth: 1050,
    fontFamily: "var(--hw-font-body)",
    fontSize: 14,
    fontWeight: 300,
    color: "var(--hw-text-secondary)",
    transition: "var(--hw-ease)",
  },
  col,
} as const;
