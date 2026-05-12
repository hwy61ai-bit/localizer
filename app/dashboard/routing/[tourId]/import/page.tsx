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
import { normalizeState } from "@/lib/tourrouter/stateNames";
import { cacheKey as geoCacheKey } from "@/lib/tourrouter/geocoding-shared";

function cleanMarkdownTable(text: string): string {
  const lines = text.split("\n");
  const looksLikeMarkdown = lines.filter(l => /^\s*\*?\s*\|/.test(l)).length >= 2;
  if (!looksLikeMarkdown) return text;
  const cleaned = lines
    .map(line => {
      let l = line.replace(/^\s*\*\s*/, "");
      l = l.replace(/^\s*\|/, "").replace(/\|\s*$/, "");
      return l;
    })
    .filter(line => !/^[\s|:\-]+$/.test(line))
    .filter(line => line.trim().length > 0);
  return cleaned.join("\n");
}

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
  promoter_contact: string;
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
  const [geoResolved, setGeoResolved] = useState<Map<string, boolean>>(new Map());
  const [geoResolvedReady, setGeoResolvedReady] = useState(false);

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

  // ── Prefetch geo resolution for import preview ───────────────

  useEffect(() => {
    if (step !== 3 || shows.length === 0) return;
    setGeoResolvedReady(false);

    const pairs = shows
      .filter(s => s.city && s.country && !s.is_off)
      .map(s => ({ city: s.city, country: s.country }));
    if (pairs.length === 0) {
      setGeoResolvedReady(true);
      return;
    }

    fetch("/api/tourrouter/geocode/prefetch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shows: pairs }),
    })
      .then(r => r.json())
      .then(data => {
        const resolved = new Map<string, boolean>();
        for (const s of shows) {
          if (!s.city || !s.country || s.is_off) continue;
          const key = geoCacheKey(s.city, s.country);
          resolved.set(key, !!data.coords?.[key]);
        }
        setGeoResolved(resolved);
        setGeoResolvedReady(true);
      })
      .catch((err) => {
        console.warn("[import] geocode prefetch failed:", err);
        setGeoResolvedReady(true);
      });
  }, [step, shows]);

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
        for (const [header, match] of Object.entries(resolved)) {
          if (match.field && match.confidence >= 0.7) {
            // Never override a field that the builtin already mapped
            if (builtinGuesses[match.field]) continue;
            // Don't map to a header already used by builtin
            if (Object.values(builtinGuesses).includes(header)) continue;
            merged[match.field] = header;
          }
        }
        setMapping(merged);
      }
    } catch { /* alias resolve failed, keep builtin */ }
    setResolving(false);
  }

  function handlePasteSubmit() {
    if (!pasteText.trim()) return;
    Papa.parse(cleanMarkdownTable(pasteText), {
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
      const cityRaw = String(row.city || "").trim();
      const venueStr = String(row.venue || "").trim();
      const offPattern = /\bOFF\b|OFF DAY|DAY OFF|TRAVEL DAY|\bTRAVEL\b|\bDARK\b|NO SHOW/i;
      const isOff =
        offPattern.test(eventStr) ||
        offPattern.test(cityRaw) ||
        offPattern.test(venueStr) ||
        (!cityRaw && !venueStr && !eventStr);
      const stateRaw = normalizeState(row.state as string);

      // Handle various user input formats:
      // Case 1: city already has "City, ST" — use as-is but normalize state portion
      // Case 2: city has extra parts like "Dallas, TX, USA" — take first two
      // Case 3: city is "Dallas" and state col has value — combine them
      // Case 4: city is "London" and state col is empty — use city alone
      let cityWithState: string;
      if (cityRaw.includes(",")) {
        const parts = cityRaw.split(",").map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          const normalizedPart = normalizeState(parts[1]);
          cityWithState = `${parts[0]}, ${normalizedPart}`;
        } else {
          cityWithState = parts[0];
        }
      } else if (stateRaw) {
        cityWithState = `${cityRaw}, ${stateRaw}`;
      } else {
        cityWithState = cityRaw;
      }

      const countryRaw = countryMapped
        ? String(row.country || "").trim()
        : detectCountry(cityWithState);
      const offerParsed = parseOffer(row.offer, countryRaw);

      built.push({
        date_iso: `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${String(dateObj.getDate()).padStart(2, "0")}`,
        event: eventStr,
        city: cityWithState,
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
        promoter_contact: String(row.promoter_contact || "").trim(),
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
    <div className="fade-in" style={{ minHeight: "100vh", padding: "32px 24px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "3px solid var(--hw-border-strong)" }}>
          <Link href={`/dashboard/routing/${tourId}`} style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-muted)", textDecoration: "none", display: "inline-block", marginBottom: 8 }}>&larr; BACK TO TOUR</Link>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontFamily: "var(--hw-font-display)", fontSize: 28, letterSpacing: "4px", color: "var(--hw-crimson)", margin: 0, marginBottom: 4, paddingBottom: 8 }}>TOURROUTER</h1>
              <div style={{ borderBottom: "3px solid var(--hw-border-strong)", marginBottom: 6 }} />
              <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 48, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text)", margin: 0 }}>{tour?.name?.toUpperCase() || "TOUR"}</div>
            </div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 8 }}>
                {navItems.map((item) => (
                  <Link
                    key={item.num}
                    href={item.href}
                    style={{
                      padding: "10px 18px",
                      border: item.active ? "3px solid var(--hw-border-strong)" : "3px solid transparent",
                      background: item.active ? "var(--hw-bg-invert)" : "var(--hw-bg-surface)",
                      color: item.active ? "#fff" : "var(--hw-text)",
                      textDecoration: "none",
                      fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: item.active ? 700 : 400,
                      letterSpacing: "1.5px", textTransform: "uppercase",
                    }}
                  >{item.num}. {item.label}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", gap: 0, marginBottom: 20 }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{
              padding: "8px 16px",
              fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700,
              letterSpacing: "1.5px", textTransform: "uppercase",
              background: step === s ? "var(--hw-bg-invert)" : "var(--hw-bg-surface)",
              color: step === s ? "#fff" : "var(--hw-text-muted)",
              border: "3px solid var(--hw-border-strong)",
              marginLeft: s > 1 ? -3 : 0,
            }}>
              {s === 1 ? "1. SOURCE" : s === 2 ? "2. MAP COLUMNS" : "3. REVIEW & SAVE"}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "var(--hw-red-ghost)", border: "3px solid var(--hw-crimson)", padding: "10px 16px", marginBottom: 16, fontFamily: "var(--hw-font-mono)", fontSize: 11, color: "var(--hw-crimson)" }}>
            {error}
          </div>
        )}

        {/* ══════ STEP 1: Source Selection ══════ */}
        {step === 1 && !pasteMode && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <div
              onClick={() => setPasteMode(true)}
              style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 32, textAlign: "center", cursor: "pointer", transition: "var(--hw-ease)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--hw-shadow-lg)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>{"\u{1F4CB}"}</div>
              <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 18, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8 }}>PASTE TEXT / CSV</div>
              <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-text-secondary)", lineHeight: 1.5 }}>Paste comma or tab-separated text directly from a spreadsheet</div>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOverSpreadsheet(true); }}
              onDragLeave={() => setDragOverSpreadsheet(false)}
              onDrop={handleSpreadsheetDrop}
              style={{ background: "var(--hw-bg-surface)", border: dragOverSpreadsheet ? "3px solid var(--hw-crimson)" : "3px solid var(--hw-border-strong)", padding: 32, textAlign: "center", cursor: "pointer", transition: "var(--hw-ease)" }}
              onMouseEnter={(e) => { if (!dragOverSpreadsheet) { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--hw-shadow-lg)"; } }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              <div style={{ fontSize: 36, marginBottom: 12, opacity: dragOverSpreadsheet ? 0.7 : 0.4 }}>{"\u{1F4CA}"}</div>
              <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 18, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8 }}>UPLOAD SPREADSHEET</div>
              <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-text-secondary)", lineHeight: 1.5 }}>Upload a .csv, .xlsx, or .xls file with your tour schedule</div>
              <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-muted)", marginTop: 10 }}>OR DRAG AND DROP</div>
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={handleFileUpload} />
            </div>

            <div
              onClick={() => pdfInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOverPdf(true); }}
              onDragLeave={() => setDragOverPdf(false)}
              onDrop={handlePdfDrop}
              style={{ background: dragOverPdf ? "var(--hw-crimson-ghost)" : "var(--hw-bg-surface)", border: dragOverPdf ? "3px solid var(--hw-crimson)" : "3px solid var(--hw-border-strong)", padding: 32, textAlign: "center", cursor: pdfLoading ? "wait" : "pointer", opacity: pdfLoading ? 0.4 : 1, transition: "var(--hw-ease)" }}
              onMouseEnter={(e) => { if (!dragOverPdf) { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--hw-shadow-lg)"; } }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
            >
              <div style={{ fontSize: 36, marginBottom: 12, opacity: dragOverPdf ? 0.7 : 0.4 }}>{pdfLoading ? "\u23F3" : "\u{1F4C4}"}</div>
              <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 18, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8 }}>{pdfLoading ? "PARSING PDF..." : "UPLOAD DEAL MEMO (PDF)"}</div>
              <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-text-secondary)", lineHeight: 1.5 }}>Upload a deal memo PDF — AI will extract show data automatically</div>
              <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-muted)", marginTop: 10 }}>OR DRAG AND DROP</div>
              <input ref={pdfInputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={handlePdfUpload} />
            </div>
          </div>
        )}

        {/* Paste mode */}
        {step === 1 && pasteMode && (
          <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, letterSpacing: "2px", textTransform: "uppercase" }}>PASTE YOUR DATA</div>
              <button onClick={() => { setPasteMode(false); setPasteText(""); }} style={{ padding: "6px 14px", border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", cursor: "pointer", fontFamily: "var(--hw-font-display)", fontSize: 12, letterSpacing: "2px", textTransform: "uppercase" }}>CANCEL</button>
            </div>
            <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-text-secondary)", marginBottom: 12 }}>First row should be headers. Supports comma, tab, or pipe-separated values.</div>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"Date,Event,City,Country,Venue,Offer\n2026-03-15,The Roxy,Los Angeles,USA,The Roxy Theatre,$5000"}
              style={{ width: "100%", boxSizing: "border-box", minHeight: 200, padding: 14, border: "3px solid var(--hw-border-strong)", fontFamily: "var(--hw-font-mono)", fontSize: 13, resize: "vertical", outline: "none" }}
            />
            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={handlePasteSubmit}
                disabled={!pasteText.trim()}
                style={{ padding: "10px 24px", border: "3px solid var(--hw-action-primary)", background: "var(--hw-action-primary)", color: "#fff", fontFamily: "var(--hw-font-display)", fontSize: 14, letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer", opacity: pasteText.trim() ? 1 : 0.4 }}
              >PARSE DATA</button>
            </div>
          </div>
        )}

        {/* ══════ STEP 2: Column Mapper ══════ */}
        {step === 2 && (
          <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 4 }}>MAP COLUMNS</div>
                <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-muted)" }}>
                  {rawRows.length} rows detected &middot; {headers.length} columns
                  {resolving && <span style={{ marginLeft: 8, color: "var(--hw-amber)" }}>&middot; AI MAPPING HEADERS...</span>}
                </div>
              </div>
              <button onClick={() => { setStep(1); setPasteMode(false); setError(""); }} style={{ padding: "6px 14px", border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", cursor: "pointer", fontFamily: "var(--hw-font-display)", fontSize: 12, letterSpacing: "2px", textTransform: "uppercase" }}>BACK</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
              {MAPPER_FIELDS.map((f) => (
                <div key={f.key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <label style={{ width: 160, fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: f.required ? 700 : 400, color: f.required ? "var(--hw-text)" : "var(--hw-text-muted)" }}>
                    {f.label}{f.required ? " *" : ""}
                  </label>
                  <select
                    value={mapping[f.key] || ""}
                    onChange={(e) => updateMapping(f.key, e.target.value)}
                    style={{ flex: 1, padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontFamily: "var(--hw-font-body)", fontSize: 13, background: "var(--hw-bg-surface)", outline: "none", appearance: "none" }}
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
              <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-blue)", marginBottom: 8 }}>PREVIEW (FIRST 3 ROWS)</div>
              <div style={{ overflowX: "auto", border: "3px solid var(--hw-border-strong)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--hw-bg-invert)" }}>
                      {headers.map((h) => (
                        <th key={h} style={{ padding: "10px 10px", textAlign: "left", fontFamily: "var(--hw-font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "2px", color: "#fff", whiteSpace: "nowrap", textTransform: "uppercase" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rawRows.slice(0, 3).map((row, i) => (
                      <tr key={i} style={{ borderTop: "2px solid var(--hw-border)" }}>
                        {headers.map((h) => (
                          <td key={h} style={{ padding: "8px 10px", fontFamily: "var(--hw-font-body)", fontSize: 13, fontWeight: 300, color: "var(--hw-text-secondary)", whiteSpace: "nowrap" }}>{row[h] || ""}</td>
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
                style={{ padding: "10px 24px", border: "3px solid var(--hw-action-primary)", background: "var(--hw-action-primary)", color: "#fff", fontFamily: "var(--hw-font-display)", fontSize: 14, letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer" }}
              >APPLY MAPPING</button>
            </div>
          </div>
        )}

        {/* ══════ STEP 3: Review & Save ══════ */}
        {step === 3 && (
          <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 4 }}>REVIEW SHOWS</div>
                <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-muted)" }}>{shows.length} shows parsed</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setStep(headers.length > 0 ? 2 : 1); setError(""); }} style={{ padding: "8px 16px", border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", cursor: "pointer", fontFamily: "var(--hw-font-display)", fontSize: 12, letterSpacing: "2px", textTransform: "uppercase" }}>BACK</button>
                <button
                  onClick={saveShows}
                  disabled={saving || shows.length === 0}
                  style={{ padding: "10px 24px", border: "3px solid var(--hw-action-primary)", background: "var(--hw-action-primary)", color: "#fff", fontFamily: "var(--hw-font-display)", fontSize: 14, letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer", opacity: saving || shows.length === 0 ? 0.4 : 1 }}
                >{saving ? "SAVING..." : "SAVE TO TOUR"}</button>
              </div>
            </div>

            <div style={{ overflowX: "auto", border: "3px solid var(--hw-border-strong)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "var(--hw-bg-invert)" }}>
                    {["#", "Date", "Event", "City", "Country", "Venue", "Offer", "Currency", "Status", "Capacity"].map((h) => (
                      <th key={h} style={{ padding: "12px 10px", textAlign: "left", fontFamily: "var(--hw-font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "2px", color: "#fff", whiteSpace: "nowrap", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shows.map((s, i) => {
                    const unresolved = !s.is_off && geoResolvedReady && s.city && s.country && geoResolved.get(geoCacheKey(s.city, s.country)) === false;
                    return (
                    <tr
                      key={i}
                      style={{ background: s.is_off ? "var(--hw-bg-warm)" : "var(--hw-bg-surface)", borderTop: "2px solid var(--hw-border)", transition: "var(--hw-ease)" }}
                      onMouseEnter={(e) => { if (!s.is_off) (e.currentTarget as HTMLElement).style.background = "var(--hw-crimson-ghost)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = s.is_off ? "var(--hw-bg-warm)" : "var(--hw-bg-surface)"; }}
                    >
                      <td style={{ padding: "10px 10px", fontFamily: "var(--hw-font-mono)", fontSize: 12, color: s.is_off ? "var(--hw-text-muted)" : "var(--hw-text)" }}>{s.is_off ? "OFF" : i + 1}</td>
                      <td style={{ padding: "10px 10px", fontFamily: "var(--hw-font-mono)", fontSize: 12, whiteSpace: "nowrap", fontWeight: 500, color: "var(--hw-text)" }}>{s.date_iso || "\u2014"}</td>
                      <td style={{ padding: "10px 10px", fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 500, color: "var(--hw-text)" }}>{s.event}</td>
                      <td style={{ padding: "10px 10px", fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-text-secondary)", background: unresolved ? "var(--hw-amber-ghost)" : undefined }}>
                        {s.city}
                        {unresolved && (
                          <span style={{ marginLeft: 6, fontFamily: "var(--hw-font-mono)", fontSize: 9, letterSpacing: "1px", color: "var(--hw-amber)", textTransform: "uppercase" }}>&#9888; NOT FOUND</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 10px", fontFamily: "var(--hw-font-body)", fontSize: 13, fontWeight: 300, color: "var(--hw-text-secondary)" }}>{s.country}</td>
                      <td style={{ padding: "10px 10px", fontFamily: "var(--hw-font-body)", fontSize: 13, fontWeight: 300, color: "var(--hw-text-secondary)" }}>{s.venue}</td>
                      <td style={{ padding: "10px 10px", fontFamily: "var(--hw-font-mono)", fontSize: 13, textAlign: "right", color: s.offer_amount ? "var(--hw-green)" : "var(--hw-text-muted)" }}>{s.offer_amount ? `$${s.offer_amount.toLocaleString()}` : "\u2014"}</td>
                      <td style={{ padding: "10px 10px", fontFamily: "var(--hw-font-mono)", fontSize: 12, color: "var(--hw-text-secondary)" }}>{s.offer_currency}</td>
                      <td style={{ padding: "10px 10px", fontFamily: "var(--hw-font-body)", fontSize: 13, fontWeight: 300, color: "var(--hw-text-secondary)" }}>{s.status || "\u2014"}</td>
                      <td style={{ padding: "10px 10px", fontFamily: "var(--hw-font-mono)", fontSize: 12, textAlign: "right", color: "var(--hw-text)" }}>{s.capacity || "\u2014"}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {shows.length === 0 && (
              <div style={{ padding: 40, textAlign: "center" }}>
                <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 24, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text)", marginBottom: 8 }}>NO VALID SHOWS FOUND</div>
                <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-text-muted)" }}>Check your data and column mapping.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
