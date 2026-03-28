"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  MAPPER_FIELDS,
  autoMapHeaders,
  parseDate,
  parseOffer,
  cellStr,
  normalizeCountry,
  detectCountry,
} from "@/lib/tourrouter";

type TourData = { id: string; name: string };
type RawRow = Record<string, string>;

type ParsedShow = {
  date_iso: string | null;
  event: string;
  city: string;
  country: string;
  country_norm: string;
  venue: string;
  offer_display: string;
  offer_amount: number;
  offer_currency: string;
  capacity: number;
  status: string;
  is_off: boolean;
  doors: string;
  showtime: string;
  merch: string;
  backend: string;
  promoter: string;
  notes: string;
};

export default function ImportPage() {
  const { tourId } = useParams<{ tourId: string }>();
  const router = useRouter();
  const [tour, setTour] = useState<TourData | null>(null);

  // Step state: 1=source, 2=mapper, 3=review
  const [step, setStep] = useState(1);

  // Parsed raw data
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<RawRow[]>([]);

  // Column mapping
  const [mapping, setMapping] = useState<Record<string, string>>({});

  // Built shows
  const [shows, setShows] = useState<ParsedShow[]>([]);

  // UI state
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [resolving, setResolving] = useState(false);

  const [dragOverSpreadsheet, setDragOverSpreadsheet] = useState(false);
  const [dragOverPdf, setDragOverPdf] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Prevent browser from opening dropped files
  useEffect(() => {
    const prevent = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  useEffect(() => {
    fetch(`/api/tourrouter/tours/${tourId}`)
      .then((r) => r.json())
      .then((data) => setTour(data.tour))
      .catch(() => {});
  }, [tourId]);

  // ── Handle file drops ────────────────────────────────────────
  function handleSpreadsheetDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOverSpreadsheet(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const input = fileInputRef.current;
    if (input) {
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function handlePdfDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOverPdf(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const input = pdfInputRef.current;
    if (input) {
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  // ── STEP 1: Parse sources ──────────────────────────────────

  async function onDataParsed(hdrs: string[], rows: RawRow[]) {
    setHeaders(hdrs);
    setRawRows(rows);
    setStep(2);
    setError("");

    // Try alias library first, fall back to built-in autoMapHeaders
    const builtinGuesses = autoMapHeaders(hdrs);
    setMapping(builtinGuesses);

    // Async: resolve via alias library + Claude (enhances mapping)
    setResolving(true);
    try {
      const resp = await fetch("/api/tourrouter/aliases/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ headers: hdrs, sampleRows: rows.slice(0, 3) }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const resolved = data.mappings as Record<string, { field: string; confidence: number }>;
        // Merge: alias library results override builtin when confidence is higher
        const merged = { ...builtinGuesses };
        const usedFields = new Set(Object.values(merged).filter(Boolean));
        for (const [header, match] of Object.entries(resolved)) {
          if (match.field && match.confidence >= 0.7 && !usedFields.has(header)) {
            // Find if this field is already mapped to a different header
            const existingHeader = Object.entries(merged).find(([, f]) => f === match.field)?.[0];
            if (!existingHeader || !builtinGuesses[existingHeader]) {
              // Only override if the builtin didn't have a confident match
              merged[match.field] = header;
            }
          }
        }
        setMapping(merged);
      }
    } catch { /* alias resolve failed, keep builtin */ }
    setResolving(false);
  }

  function handlePasteSubmit() {
    if (!pasteText.trim()) return;
    Papa.parse(pasteText, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as string[][];
        if (!data || data.length < 2) { setError("Pasted data appears empty."); return; }
        const hdrs = data[0].map((h) => String(h).trim());
        const rows = data.slice(1).map((row) => {
          const obj: RawRow = {};
          hdrs.forEach((h, i) => (obj[h] = String(row[i] || "").trim()));
          return obj;
        });
        onDataParsed(hdrs, rows);
      },
    });
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as string[][];
          if (!data || data.length < 2) { setError("CSV appears empty."); return; }
          const hdrs = data[0].map((h) => String(h).trim());
          const rows = data.slice(1).map((row) => {
            const obj: RawRow = {};
            hdrs.forEach((h, i) => (obj[h] = String(row[i] || "").trim()));
            return obj;
          });
          onDataParsed(hdrs, rows);
        },
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = new Uint8Array(ev.target!.result as ArrayBuffer);
        // CRITICAL: raw:true, cellDates:true — NEVER raw:false
        const wb = XLSX.read(data, { type: "array", raw: true, cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const allRows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
          header: 1,
          raw: true,
          dateNF: "yyyy-mm-dd",
          defval: "",
        });

        // Find real header row (scan first 10)
        let headerIdx = 0;
        for (let i = 0; i < Math.min(10, allRows.length); i++) {
          const row = allRows[i] as unknown[];
          const nonEmpty = row.filter((c) => c !== "").length;
          if (nonEmpty >= 3) { headerIdx = i; break; }
        }

        const hdrs = (allRows[headerIdx] as unknown[]).map((h) => String(h).trim()).filter((h) => h);
        const rows: RawRow[] = [];
        let prevRow: RawRow = {};

        for (let i = headerIdx + 1; i < allRows.length; i++) {
          const rawRow = allRows[i] as unknown[];
          const firstCell = cellStr(rawRow[0]);
          // Skip total rows
          if (/^(TOTAL|AVERAGE|SUM)/i.test(firstCell)) continue;
          // CRITICAL: declare obj INSIDE the loop
          const obj: RawRow = {};
          hdrs.forEach((h, idx) => {
            let val = cellStr(rawRow[idx]);
            // Handle ^ ditto marks
            if (val === "^") val = prevRow[h] || "";
            obj[h] = val;
          });
          const hasData = Object.values(obj).some((v) => v !== "");
          if (hasData) {
            rows.push(obj);
            prevRow = obj;
          }
        }
        onDataParsed(hdrs, rows);
      };
      reader.readAsArrayBuffer(file);
    } else {
      setError("Unsupported file type. Upload .csv, .xlsx, or .xls");
    }
  }

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfLoading(true);
    setError("");

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const arrayBuf = ev.target!.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuf);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      try {
        const resp = await fetch("/api/tourrouter/import/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pdf_base64: base64 }),
        });
        if (!resp.ok) {
          const err = await resp.json();
          setError(err.error || "PDF parse failed");
          setPdfLoading(false);
          return;
        }
        const data = await resp.json();
        // PDF returns pre-parsed shows — go straight to review
        const parsed: ParsedShow[] = (data.shows || []).map((s: Record<string, unknown>) => {
          const offerParsed = parseOffer(s.offer as string, s.country as string);
          const dateObj = parseDate(s.date as string);
          return {
            date_iso: dateObj ? dateObj.toISOString().split("T")[0] : null,
            event: String(s.event || "").trim(),
            city: String(s.city || "").trim(),
            country: String(s.country || "").trim(),
            country_norm: normalizeCountry(String(s.country || "")),
            venue: String(s.venue || "").trim(),
            offer_display: String(s.offer || ""),
            offer_amount: offerParsed.amount,
            offer_currency: offerParsed.currency,
            capacity: parseInt(String(s.capacity || "0")) || 0,
            status: String(s.status || "").trim(),
            is_off: false,
            doors: String(s.doors || "").trim(),
            showtime: String(s.showtime || "").trim(),
            merch: String(s.merch || "").trim(),
            backend: String(s.backend || "").trim(),
            promoter: String(s.promoter || "").trim(),
            notes: String(s.notes || "").trim(),
          };
        });
        setShows(parsed);
        setStep(3);
      } catch {
        setError("Failed to parse PDF");
      }
      setPdfLoading(false);
    };
    reader.readAsArrayBuffer(file);
  }

  // ── STEP 2: Column mapping ─────────────────────────────────

  function updateMapping(field: string, col: string) {
    setMapping((prev) => ({ ...prev, [field]: col }));
  }

  function applyMapping() {
    const required = ["date", "city"];
    const missing = required.filter((f) => !mapping[f]);
    if (missing.length > 0) {
      setError(`Map required fields: ${missing.join(", ")}`);
      return;
    }
    // Save confirmed mappings as aliases (fire-and-forget)
    for (const [field, header] of Object.entries(mapping)) {
      if (header) {
        fetch("/api/tourrouter/aliases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ header, field }),
        }).catch(() => {});
      }
    }

    const countryMapped = !!mapping.country;
    // CRITICAL: buildShows — declare row={} INSIDE the loop
    const built: ParsedShow[] = [];
    for (const rawRow of rawRows) {
      // CRITICAL: row declared inside loop body
      const row: Record<string, string> = {};
      for (const [field, col] of Object.entries(mapping)) {
        if (col) row[field] = rawRow[col] || "";
      }

      // Skip total/average rows
      if (/^(TOTAL|AVERAGE|SUM)/i.test(String(row.date || row.event || ""))) continue;

      // CRITICAL: parseDate uses new Date(year, month-1, day) — NEVER new Date(string)
      const dateObj = parseDate(row.date);
      if (!dateObj) {
        if (typeof window !== "undefined") {
          console.warn("[Import] Row rejected — parseDate returned null for:", JSON.stringify(row.date), "type:", typeof row.date, "row:", JSON.stringify(row));
        }
        continue;
      }

      const eventStr = String(row.event || "").trim();
      const isOff = /\bOFF\b|OFF DAY|DAY OFF/i.test(eventStr) || /\bOFF\b|OFF DAY|DAY OFF/i.test(String(row.city || ""));
      const cityStr = String(row.city || "").trim();
      const countryRaw = countryMapped
        ? String(row.country || "").trim()
        : detectCountry(cityStr);
      const offerParsed = parseOffer(row.offer, countryRaw);

      built.push({
        date_iso: `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`,
        event: eventStr,
        city: cityStr,
        country: countryRaw,
        country_norm: normalizeCountry(countryRaw),
        venue: String(row.venue || "").trim(),
        offer_display: String(row.offer || "").trim(),
        offer_amount: offerParsed.amount,
        offer_currency: offerParsed.currency,
        capacity: parseInt(row.capacity) || 0,
        status: String(row.status || "").trim(),
        is_off: isOff,
        doors: String(row.doors || "").trim(),
        showtime: String(row.showtime || "").trim(),
        merch: String(row.merch || "").trim(),
        backend: String(row.backend || "").trim(),
        promoter: String(row.promoter || "").trim(),
        notes: String(row.notes || "").trim(),
      });
    }

    // Sort by date
    built.sort((a, b) => (a.date_iso || "").localeCompare(b.date_iso || ""));
    setShows(built);
    setStep(3);
    setError("");
  }

  // ── STEP 3: Save ───────────────────────────────────────────

  async function saveShows() {
    setSaving(true);
    setError("");
    try {
      const resp = await fetch(`/api/tourrouter/tours/${tourId}/shows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shows }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        setError([err.error, err.details, err.hint].filter(Boolean).join(" — ") || "Save failed");
        setSaving(false);
        return;
      }
      router.push(`/dashboard/routing/${tourId}`);
    } catch {
      setError("Failed to save shows");
      setSaving(false);
    }
  }

  // ── NAV ────────────────────────────────────────────────────

  const navItems = [
    { num: 1, label: "Import", href: `/dashboard/routing/${tourId}/import`, active: true },
    { num: 2, label: "Route", href: `/dashboard/routing/${tourId}`, active: false },
    { num: 3, label: "Financials", href: `/dashboard/routing/${tourId}/financials`, active: false },
    { num: 4, label: "Export", href: `/dashboard/routing/${tourId}/export`, active: false },
  ];

  // ── RENDER ─────────────────────────────────────────────────

  return (
    <div className="fade-in" style={{ minHeight: "100vh", background: "#EEEEEE", padding: "32px 24px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid #DDDDDD" }}>
          <Link href="/dashboard/routing" style={{ fontSize: 13, fontWeight: 700, color: "#888", textDecoration: "none", display: "inline-block", marginBottom: 8 }}>&larr; Back to Tours</Link>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 className="brand-title" style={{ margin: 0, marginBottom: 4, paddingBottom: 8 }}>TOURROUTER.</h1>
              <div style={{ borderBottom: "2px solid #111111", marginBottom: 6 }} />
              <div className="brand-title" style={{ margin: 0, fontSize: "360%" }}>{tour?.name?.toUpperCase() || "TOUR"}</div>
            </div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "#fff", border: "1px solid #DDDDDD", borderRadius: 12, padding: 8 }}>
                {navItems.map((item) => (
                  <Link
                    key={item.num}
                    href={item.href}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 10,
                      border: item.active ? "1px solid #111" : "1px solid #DDDDDD",
                      background: item.active ? "#111" : "#fff",
                      color: item.active ? "#fff" : "#111",
                      textDecoration: "none",
                      fontWeight: item.active ? 900 : 700,
                      fontSize: 13,
                    }}
                  >{item.num}. {item.label}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{
              padding: "6px 16px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              background: step === s ? "#111" : "#fff",
              color: step === s ? "#fff" : "#888",
              border: "1px solid #DDDDDD",
            }}>
              {s === 1 ? "1. Source" : s === 2 ? "2. Map Columns" : "3. Review & Save"}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#fff0f0", border: "1px solid #ffcccc", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#c00" }}>
            {error}
          </div>
        )}

        {/* ══════ STEP 1: Source Selection ══════ */}
        {step === 1 && !pasteMode && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <div
              onClick={() => setPasteMode(true)}
              className="card-hover"
              style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: 32, textAlign: "center", cursor: "pointer" }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>{"\u{1F4CB}"}</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Paste Text / CSV</div>
              <div style={{ fontSize: 13, color: "#888", lineHeight: 1.5 }}>Paste comma or tab-separated text directly from a spreadsheet</div>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOverSpreadsheet(true); }}
              onDragLeave={() => setDragOverSpreadsheet(false)}
              onDrop={handleSpreadsheetDrop}
              className="card-hover"
              style={{ background: "#fff", border: dragOverSpreadsheet ? "2px dashed #fff" : "1px solid #DDDDDD", borderRadius: 14, padding: 32, textAlign: "center", cursor: "pointer", transition: "border 0.2s" }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>{"\u{1F4CA}"}</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Upload Spreadsheet</div>
              <div style={{ fontSize: 13, color: "#888", lineHeight: 1.5 }}>Upload a .csv, .xlsx, or .xls file with your tour schedule</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 10 }}>or drag and drop</div>
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={handleFileUpload} />
            </div>

            <div
              onClick={() => pdfInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOverPdf(true); }}
              onDragLeave={() => setDragOverPdf(false)}
              onDrop={handlePdfDrop}
              className="card-hover"
              style={{ background: "#fff", border: dragOverPdf ? "2px dashed #fff" : "1px solid #DDDDDD", borderRadius: 14, padding: 32, textAlign: "center", cursor: pdfLoading ? "wait" : "pointer", opacity: pdfLoading ? 0.6 : 1, transition: "border 0.2s" }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>{pdfLoading ? "\u23F3" : "\u{1F4C4}"}</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>{pdfLoading ? "Parsing PDF..." : "Upload Deal Memo (PDF)"}</div>
              <div style={{ fontSize: 13, color: "#888", lineHeight: 1.5 }}>Upload a deal memo PDF — AI will extract show data automatically</div>
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 10 }}>or drag and drop</div>
              <input ref={pdfInputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handlePdfUpload} />
            </div>
          </div>
        )}

        {/* Paste mode */}
        {step === 1 && pasteMode && (
          <div style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Paste Your Data</div>
              <button onClick={() => { setPasteMode(false); setPasteText(""); }} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #DDDDDD", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Cancel</button>
            </div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>First row should be headers. Supports comma, tab, or pipe-separated values.</div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"Date,Event,City,Country,Venue,Offer\n2026-03-15,The Roxy,Los Angeles,USA,The Roxy Theatre,$5000"}
              style={{ width: "100%", boxSizing: "border-box", minHeight: 200, padding: 14, border: "1px solid #DDDDDD", borderRadius: 10, fontSize: 13, fontFamily: "monospace", resize: "vertical", outline: "none" }}
            />
            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handlePasteSubmit}
                disabled={!pasteText.trim()}
                style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 900, fontSize: 13, cursor: "pointer", opacity: pasteText.trim() ? 1 : 0.5 }}
              >Parse Data</button>
            </div>
          </div>
        )}

        {/* ══════ STEP 2: Column Mapper ══════ */}
        {step === 2 && (
          <div style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Map Columns</div>
                <div style={{ fontSize: 13, color: "#888" }}>
                  {rawRows.length} rows detected &middot; {headers.length} columns
                  {resolving && <span style={{ marginLeft: 8, color: "#b35c00" }}>&middot; AI mapping headers...</span>}
                </div>
              </div>
              <button onClick={() => { setStep(1); setPasteMode(false); setError(""); }} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #DDDDDD", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Back</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
              {MAPPER_FIELDS.map((f) => (
                <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <label style={{ width: 160, fontSize: 13, fontWeight: f.required ? 800 : 600, color: f.required ? "#111" : "#666" }}>
                    {f.label}{f.required ? " *" : ""}
                  </label>
                  <select
                    value={mapping[f.key] || ""}
                    onChange={(e) => updateMapping(f.key, e.target.value)}
                    style={{ flex: 1, padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, background: "#fff", outline: "none" }}
                  >
                    <option value="">{f.required ? "\u2014 Required \u2014" : "\u2014 Skip \u2014"}</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Preview first 3 rows */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Preview (first 3 rows)</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>
                      {headers.map((h) => (
                        <th key={h} style={{ padding: "6px 10px", borderBottom: "1px solid #DDDDDD", textAlign: "left", fontWeight: 700, color: "#888", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rawRows.slice(0, 3).map((row, i) => (
                      <tr key={i}>
                        {headers.map((h) => (
                          <td key={h} style={{ padding: "6px 10px", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" }}>{row[h] || ""}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={applyMapping}
                style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 900, fontSize: 13, cursor: "pointer" }}
              >Apply Mapping</button>
            </div>
          </div>
        )}

        {/* ══════ STEP 3: Review & Save ══════ */}
        {step === 3 && (
          <div style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Review Shows</div>
                <div style={{ fontSize: 13, color: "#888" }}>{shows.length} shows parsed</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setStep(headers.length > 0 ? 2 : 1); setError(""); }} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid #DDDDDD", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Back</button>
                <button
                  onClick={saveShows}
                  disabled={saving || shows.length === 0}
                  style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 900, fontSize: 13, cursor: "pointer", opacity: saving || shows.length === 0 ? 0.5 : 1 }}
                >{saving ? "Saving..." : "Save to Tour"}</button>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    {["#", "Date", "Event", "City", "Country", "Venue", "Offer", "Currency", "Status", "Capacity"].map((h) => (
                      <th key={h} style={{ padding: "8px 10px", borderBottom: "2px solid #DDDDDD", textAlign: "left", fontWeight: 700, color: "#888", whiteSpace: "nowrap", textTransform: "uppercase", fontSize: 11, letterSpacing: "0.04em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shows.map((s, i) => (
                    <tr key={i} style={{ background: s.is_off ? "#fafaf8" : "#fff" }}>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f0", color: s.is_off ? "#aaa" : "#111" }}>{s.is_off ? "OFF" : i + 1}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f0", whiteSpace: "nowrap" }}>{s.date_iso || "\u2014"}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f0", fontWeight: 600 }}>{s.event}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f0" }}>{s.city}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f0" }}>{s.country}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f0" }}>{s.venue}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f0", fontFamily: "monospace" }}>{s.offer_amount ? `$${s.offer_amount.toLocaleString()}` : "\u2014"}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f0" }}>{s.offer_currency}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f0" }}>{s.status || "\u2014"}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f0", fontFamily: "monospace" }}>{s.capacity || "\u2014"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {shows.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "#888", fontSize: 14 }}>No valid shows found. Check your data and column mapping.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
