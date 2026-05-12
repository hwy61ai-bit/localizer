"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

/* ------------------------------------------------------------------ */
/*  TYPES                                                              */
/* ------------------------------------------------------------------ */

type RosterRow = {
  id: string;
  name: string;
  role: string;
  dayRate: string;
  offDayRate: string;
};

type ShowRow = {
  id: string;
  date: string;
  city: string;
  venue: string;
  offer: string;
};

type ParsedShow = {
  date: string;
  city: string;
  venue: string;
  offer: string;
  checked: boolean;
};

const ROLE_OPTIONS = [
  "TM", "BM", "FOH", "Monitor", "Guitar Tech", "Drum Tech", "Bass Tech",
  "Keys Tech", "Backline", "Merch", "Bus Driver", "PM", "LD", "Stage Mgr",
  "Photographer", "Band Member", "Other",
];

const VEHICLE_OPTIONS = ["Van", "Bus", "Fly", "Mix"];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1 state
  const [artistName, setArtistName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [artistId, setArtistId] = useState<string | null>(null);

  // Step 2 state
  const [roster, setRoster] = useState<RosterRow[]>([
    { id: uid(), name: "", role: "Band Member", dayRate: "", offDayRate: "" },
  ]);

  // Step 3 state
  const [tourName, setTourName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [vehicleType, setVehicleType] = useState("Van");
  const [tourId, setTourId] = useState<string | null>(null);

  // Step 4 state
  const [shows, setShows] = useState<ShowRow[]>([
    { id: uid(), date: "", city: "", venue: "", offer: "" },
  ]);
  const [parsing, setParsing] = useState(false);
  const [parsedShows, setParsedShows] = useState<ParsedShow[] | null>(null);
  const [parseError, setParseError] = useState("");
  const dropRef = useRef<HTMLInputElement>(null);

  const STEPS = ["Artist", "Team", "Tour", "Shows", "Done"];

  /* ── Logo helpers ── */
  function handleLogoDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  }

  /* ── Roster helpers ── */
  function addRosterRow() {
    setRoster((prev) => [...prev, { id: uid(), name: "", role: "Band Member", dayRate: "", offDayRate: "" }]);
  }

  function removeRosterRow(id: string) {
    setRoster((prev) => prev.filter((r) => r.id !== id));
  }

  function updateRosterRow(id: string, field: keyof RosterRow, value: string) {
    setRoster((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  /* ── Show helpers ── */
  function addShowRow() {
    setShows((prev) => [...prev, { id: uid(), date: "", city: "", venue: "", offer: "" }]);
  }

  function removeShowRow(id: string) {
    setShows((prev) => prev.filter((s) => s.id !== id));
  }

  function updateShowRow(id: string, field: keyof ShowRow, value: string) {
    setShows((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  }

  /* ── Document intake ── */
  async function handleDocDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) await parseDocument(file);
  }

  async function handleDocSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await parseDocument(file);
  }

  async function parseDocument(file: File) {
    if (!tourId) return;
    setParsing(true);
    setParseError("");
    setParsedShows(null);
    try {
      const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls") || file.type.includes("spreadsheet");

      let endpoint = "/api/tourrouter/import/pdf";
      let body: Record<string, string>;

      if (isExcel) {
        const arrayBuf = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuf, { raw: true, cellDates: true });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const csv = XLSX.utils.sheet_to_csv(firstSheet);
        endpoint = "/api/tourrouter/import/text";
        body = { text_content: csv };
      } else {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        body = { pdf_base64: base64 };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to parse document");
      }

      const data = await res.json();
      const rawShows = Array.isArray(data.shows) ? data.shows : [];
      const mapped: ParsedShow[] = rawShows.map((s: Record<string, unknown>) => {
        // offer comes back as string like "$5000" — strip to number
        const offerRaw = (s.offer as string) || "";
        const offerNum = offerRaw.replace(/[^0-9.]/g, "");
        return {
          date: (s.date as string) || "",
          city: (s.city as string) || "",
          venue: (s.venue as string) || "",
          offer: offerNum,
          checked: true,
        };
      });

      if (mapped.length > 0 && mapped.some((s) => s.city || s.venue || s.date)) {
        setParsedShows(mapped);
      } else {
        setParseError("Could not extract show data from this document. Try adding shows manually.");
      }
    } catch (e: unknown) {
      setParseError(e instanceof Error ? e.message : "Failed to parse document");
    } finally {
      setParsing(false);
    }
  }

  function toggleParsedShow(idx: number) {
    setParsedShows((prev) =>
      prev ? prev.map((s, i) => (i === idx ? { ...s, checked: !s.checked } : s)) : prev
    );
  }

  function confirmParsedShows() {
    if (!parsedShows) return;
    const newRows: ShowRow[] = parsedShows
      .filter((s) => s.checked)
      .map((s) => ({
        id: uid(),
        date: s.date,
        city: s.city,
        venue: s.venue,
        offer: s.offer,
      }));
    setShows((prev) => [...prev.filter((s) => s.date || s.city), ...newRows]);
    setParsedShows(null);
  }

  /* ── Step 4 submit ── */
  async function submitStep4() {
    if (!tourId) return;
    setSaving(true);
    setError("");
    try {
      const filledShows = shows.filter((s) => s.date || s.city);
      if (filledShows.length > 0) {
        const payload = filledShows.map((s) => ({
          date_iso: s.date || undefined,
          city: s.city || undefined,
          venue: s.venue || undefined,
          offer_amount: s.offer ? Number(s.offer) : undefined,
          offer_currency: "USD",
          status: "pending",
        }));

        const res = await fetch("/api/tourrouter/tours/" + tourId + "/shows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shows: payload }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to add shows");
        }
      }
      localStorage.setItem("onboarding_dismissed", "true");
      setStep(5);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  /* ── Step 1 submit ── */
  async function submitStep1() {
    if (!artistName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/tourrouter/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: artistName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create artist");
      }
      const { artist } = await res.json();
      setArtistId(artist.id);

      // Upload logo if present
      if (logoFile && artist.id) {
        const formData = new FormData();
        formData.append("file", logoFile);
        formData.append("artistId", artist.id);
        try {
          await fetch("/api/tourrouter/artists/" + artist.id + "/logo", {
            method: "POST",
            body: formData,
          });
        } catch {
          // Non-blocking — logo upload failure shouldn't stop onboarding
        }
      }

      setStep(2);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  /* ── Step 2 submit ── */
  async function submitStep2() {
    if (!artistId) return;
    setSaving(true);
    setError("");
    try {
      const filledRows = roster.filter((r) => r.name.trim());
      const defaultRoster = filledRows.map((r) => ({
        id: r.id,
        preferredName: r.name.trim(),
        role: r.role,
        showDayRate: r.dayRate ? Number(r.dayRate) : 0,
        offDayRate: r.offDayRate ? Number(r.offDayRate) : 0,
      }));

      const res = await fetch("/api/tourrouter/artists/" + artistId, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ default_roster: defaultRoster }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save roster");
      }
      setStep(3);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  /* ── Step 3 submit ── */
  async function submitStep3() {
    if (!tourName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/tourrouter/tours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tourName.trim(),
          artist_id: artistId,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          vehicle_type: vehicleType,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create tour");
      }
      const { tour } = await res.json();
      setTourId(tour.id);
      setStep(4);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  /* ── Render ── */
  return (
    <div className="wiz-page">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=Space+Mono:wght@400;700&display=swap');

        .wiz-page {
          max-width: 720px;
          margin: 0 auto;
          padding: 48px 24px 96px;
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
          color: #1A1A1A;
        }

        /* ── Progress bar ── */
        .wiz-progress {
          display: flex;
          gap: 0;
          margin-bottom: 48px;
        }
        .wiz-step {
          flex: 1;
          text-align: center;
          position: relative;
        }
        .wiz-step-dot {
          width: 32px;
          height: 32px;
          border: 3px solid #1A1A1A;
          border-radius: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 8px;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px;
          letter-spacing: 1px;
          background: #fff;
          transition: all 0.15s ease;
        }
        .wiz-step.active .wiz-step-dot {
          background: #c5535b;
          color: #fff;
          border-color: #c5535b;
        }
        .wiz-step.completed .wiz-step-dot {
          background: #1A1A1A;
          color: #fff;
          border-color: #1A1A1A;
        }
        .wiz-step-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #8A8580;
        }
        .wiz-step.active .wiz-step-label { color: #c5535b; font-weight: 700; }
        .wiz-step.completed .wiz-step-label { color: #1A1A1A; }
        .wiz-step-line {
          position: absolute;
          top: 16px;
          left: calc(50% + 20px);
          right: calc(-50% + 20px);
          height: 3px;
          background: #E0D8CC;
        }
        .wiz-step.completed .wiz-step-line { background: #1A1A1A; }
        .wiz-step:last-child .wiz-step-line { display: none; }

        /* ── Typography ── */
        .wiz-headline {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 48px;
          letter-spacing: 2px;
          text-transform: uppercase;
          line-height: 1.05;
          margin: 0 0 8px;
        }
        .wiz-subhead {
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          color: #4A4540;
          margin: 0 0 36px;
          line-height: 1.6;
        }

        /* ── Form elements ── */
        .wiz-label {
          display: block;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #4A4540;
          margin-bottom: 8px;
        }
        .wiz-input {
          width: 100%;
          padding: 12px 16px;
          border: 3px solid #1A1A1A;
          border-radius: 0;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 400;
          color: #1A1A1A;
          background: #fff;
          outline: none;
          transition: border-color 0.15s;
          -webkit-appearance: none;
        }
        .wiz-input:focus { border-color: #c5535b; }
        .wiz-input::placeholder { color: #8A8580; }
        .wiz-select {
          width: 100%;
          padding: 12px 16px;
          border: 3px solid #1A1A1A;
          border-radius: 0;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 400;
          color: #1A1A1A;
          background: #fff;
          outline: none;
          cursor: pointer;
          -webkit-appearance: none;
        }
        .wiz-select:focus { border-color: #c5535b; }
        .wiz-field { margin-bottom: 24px; }
        .wiz-field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .wiz-helper {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #8A8580;
          margin-top: 4px;
        }

        /* ── Logo drop zone ── */
        .wiz-logo-zone {
          width: 160px;
          height: 160px;
          border: 3px dashed #CCC4B8;
          border-radius: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          background: #fff;
          transition: all 0.15s ease;
          overflow: hidden;
        }
        .wiz-logo-zone:hover { border-color: #c5535b; border-style: solid; }
        .wiz-logo-zone img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .wiz-logo-text {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #8A8580;
          text-align: center;
          padding: 12px;
          line-height: 1.5;
        }

        /* ── Buttons ── */
        .wiz-btn {
          display: inline-block;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 16px;
          letter-spacing: 3px;
          text-transform: uppercase;
          padding: 14px 32px;
          border: 3px solid;
          border-radius: 0;
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
        }
        .wiz-btn-primary {
          background: #c5535b;
          color: #fff;
          border-color: #c5535b;
        }
        .wiz-btn-primary:hover:not(:disabled) {
          background: #a8444b;
          transform: translateY(-2px);
          box-shadow: 4px 4px 0 #1A1A1A;
        }
        .wiz-btn-primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .wiz-btn-back {
          background: transparent;
          color: #1A1A1A;
          border-color: transparent;
          padding: 14px 16px;
        }
        .wiz-btn-back:hover { color: #c5535b; }
        .wiz-btn-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 40px;
        }

        /* ── Roster rows ── */
        .wiz-roster-row {
          display: grid;
          grid-template-columns: 1fr 140px 90px 90px 32px;
          gap: 8px;
          align-items: end;
          margin-bottom: 12px;
        }
        .wiz-roster-row .wiz-input,
        .wiz-roster-row .wiz-select {
          padding: 10px 12px;
          font-size: 14px;
        }
        .wiz-roster-delete {
          width: 32px;
          height: 42px;
          border: 3px solid #E0D8CC;
          border-radius: 0;
          background: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          color: #8A8580;
          transition: all 0.15s ease;
        }
        .wiz-roster-delete:hover {
          border-color: #c5535b;
          color: #c5535b;
        }
        .wiz-add-link {
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #c5535b;
          cursor: pointer;
          background: none;
          border: none;
          padding: 8px 0;
          transition: color 0.15s;
        }
        .wiz-add-link:hover { color: #a8444b; }

        /* ── Error ── */
        .wiz-error {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #c5535b;
          margin-top: 12px;
        }

        /* ── Step 4: Two-path layout ── */
        .wiz-paths {
          display: flex;
          gap: 0;
          align-items: stretch;
        }
        .wiz-path {
          flex: 1;
          min-width: 0;
        }
        .wiz-path-label {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #1A1A1A;
          font-weight: 700;
          margin-bottom: 20px;
        }
        .wiz-divider {
          width: 1px;
          background: #E0D8CC;
          margin: 0 28px;
          position: relative;
          flex-shrink: 0;
        }
        .wiz-divider-or {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: #F5F0E8;
          padding: 8px 0;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #8A8580;
        }

        /* ── Show rows ── */
        .wiz-show-row {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 16px;
          padding: 16px;
          background: #fff;
          border: 3px solid #1A1A1A;
        }
        .wiz-show-row .wiz-input {
          padding: 10px 12px;
          font-size: 14px;
          width: 100%;
          box-sizing: border-box;
        }

        /* ── Document drop zone ── */
        .wiz-doc-zone {
          border: 3px dashed #CCC4B8;
          border-radius: 0;
          padding: 40px 24px;
          text-align: center;
          cursor: pointer;
          background: #fff;
          transition: all 0.15s ease;
          min-height: 180px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .wiz-doc-zone:hover { border-color: #c5535b; border-style: solid; }
        .wiz-doc-zone.active { border-color: #c5535b; border-style: solid; background: rgba(197,83,91,0.04); }
        .wiz-doc-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #4A4540;
          margin-bottom: 8px;
        }
        .wiz-doc-formats {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #8A8580;
        }
        .wiz-parsing {
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: #c5535b;
        }

        /* ── Parsed preview ── */
        .wiz-preview {
          margin-top: 20px;
          border: 3px solid #1A1A1A;
          max-height: 280px;
          overflow-y: auto;
        }
        .wiz-preview-header {
          display: grid;
          grid-template-columns: 32px 90px 1fr 1fr 70px;
          gap: 8px;
          padding: 10px 12px;
          background: #1A1A1A;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #fff;
          font-weight: 700;
          position: sticky;
          top: 0;
        }
        .wiz-preview-row {
          display: grid;
          grid-template-columns: 32px 90px 1fr 1fr 70px;
          gap: 8px;
          padding: 10px 12px;
          font-size: 14px;
          border-bottom: 1px solid #E0D8CC;
          align-items: center;
        }
        .wiz-preview-row:last-child { border-bottom: none; }
        .wiz-checkbox {
          width: 20px;
          height: 20px;
          border: 3px solid #1A1A1A;
          border-radius: 0;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          position: relative;
          background: #fff;
        }
        .wiz-checkbox:checked {
          background: #c5535b;
          border-color: #c5535b;
        }
        .wiz-checkbox:checked::after {
          content: '\\2713';
          position: absolute;
          top: -1px;
          left: 3px;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
        }
        .wiz-btn-confirm {
          display: inline-block;
          font-family: 'Bebas Neue', sans-serif;
          font-size: 14px;
          letter-spacing: 2px;
          text-transform: uppercase;
          padding: 10px 24px;
          border: 3px solid #1A1A1A;
          border-radius: 0;
          background: #1A1A1A;
          color: #fff;
          cursor: pointer;
          margin-top: 12px;
          transition: all 0.15s ease;
        }
        .wiz-btn-confirm:hover {
          transform: translateY(-2px);
          box-shadow: 3px 3px 0 #c5535b;
        }

        /* ── Step 5: Summary card ── */
        .wiz-summary {
          background: #fff;
          border: 3px solid #1A1A1A;
          padding: 32px;
          box-shadow: 4px 4px 0 #1A1A1A;
          margin-bottom: 40px;
        }
        .wiz-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 10px 0;
          border-bottom: 1px solid #E0D8CC;
        }
        .wiz-summary-row:last-child { border-bottom: none; }
        .wiz-summary-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #8A8580;
        }
        .wiz-summary-value {
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          font-weight: 500;
          color: #1A1A1A;
        }
        .wiz-links {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 40px;
        }
        .wiz-link {
          display: block;
          padding: 16px 20px;
          border: 3px solid #1A1A1A;
          background: #fff;
          text-decoration: none;
          color: #1A1A1A;
          transition: all 0.15s ease;
          border-radius: 0;
        }
        .wiz-link:hover {
          transform: translateY(-2px);
          box-shadow: 3px 3px 0 #1A1A1A;
        }
        .wiz-link-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 18px;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .wiz-link-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #8A8580;
        }
        .wiz-done-cta {
          text-align: center;
        }

        /* ── Responsive ── */
        @media (max-width: 640px) {
          .wiz-page { padding: 32px 16px 64px; }
          .wiz-headline { font-size: 36px; }
          .wiz-roster-row {
            grid-template-columns: 1fr 1fr;
          }
          .wiz-roster-row > *:nth-child(1) { grid-column: 1 / -1; }
          .wiz-roster-row > *:nth-child(5) { grid-column: 2; justify-self: end; }
          .wiz-step-label { font-size: 8px; letter-spacing: 1px; }
          .wiz-step-dot { width: 28px; height: 28px; font-size: 14px; }
          .wiz-paths { flex-direction: column; }
          .wiz-divider {
            width: 100%;
            height: 1px;
            margin: 28px 0;
          }
          .wiz-divider-or {
            padding: 0 8px;
          }
          .wiz-preview-header, .wiz-preview-row {
            grid-template-columns: 28px 80px 1fr 1fr 60px;
            font-size: 12px;
          }
          .wiz-links { grid-template-columns: 1fr; }
        }
      ` }} />

      {/* ── Progress Bar ── */}
      <div className="wiz-progress">
        {STEPS.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === step;
          const isCompleted = stepNum < step;
          return (
            <div
              key={label}
              className={`wiz-step${isActive ? " active" : ""}${isCompleted ? " completed" : ""}`}
            >
              <div className="wiz-step-dot">
                {isCompleted ? "\u2713" : stepNum}
              </div>
              <div className="wiz-step-label">{label}</div>
              {i < STEPS.length - 1 && <div className="wiz-step-line" />}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Create Artist ── */}
      {step === 1 && (
        <div>
          <h1 className="wiz-headline">Let&rsquo;s get your act on the road.</h1>
          <p className="wiz-subhead">We just need a name to get started. You can add everything else later.</p>

          <div className="wiz-field">
            <label className="wiz-label">Artist / Band Name</label>
            <input
              className="wiz-input"
              type="text"
              placeholder="The War on Drugs"
              value={artistName}
              onChange={(e) => setArtistName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="wiz-field">
            <label className="wiz-label">Logo (optional)</label>
            <div
              className="wiz-logo-zone"
              onClick={() => logoInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleLogoDrop}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" />
              ) : (
                <div className="wiz-logo-text">Drop a logo here &mdash; transparent PNG works best</div>
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleLogoSelect}
            />
          </div>

          {error && <div className="wiz-error">{error}</div>}

          <div className="wiz-btn-row">
            <div />
            <button
              className="wiz-btn wiz-btn-primary"
              disabled={!artistName.trim() || saving}
              onClick={submitStep1}
            >
              {saving ? "Saving..." : "Next \u2014 Add Your Team"}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Add Team ── */}
      {step === 2 && (
        <div>
          <h1 className="wiz-headline">Who&rsquo;s coming on the road?</h1>
          <p className="wiz-subhead">Add the people on your tour &mdash; band, crew, management, whoever. You can add pay rates later.</p>

          <div style={{ marginBottom: 8 }}>
            <div className="wiz-roster-row" style={{ marginBottom: 4 }}>
              <span className="wiz-label" style={{ marginBottom: 0 }}>Name</span>
              <span className="wiz-label" style={{ marginBottom: 0 }}>Role</span>
              <span className="wiz-label" style={{ marginBottom: 0 }}>Day Rate</span>
              <span className="wiz-label" style={{ marginBottom: 0 }}>Off Day</span>
              <span />
            </div>

            {roster.map((row) => (
              <div className="wiz-roster-row" key={row.id}>
                <input
                  className="wiz-input"
                  type="text"
                  placeholder="Jamie"
                  value={row.name}
                  onChange={(e) => updateRosterRow(row.id, "name", e.target.value)}
                />
                <select
                  className="wiz-select"
                  value={row.role}
                  onChange={(e) => updateRosterRow(row.id, "role", e.target.value)}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <input
                  className="wiz-input"
                  type="number"
                  placeholder="$0"
                  value={row.dayRate}
                  onChange={(e) => updateRosterRow(row.id, "dayRate", e.target.value)}
                />
                <input
                  className="wiz-input"
                  type="number"
                  placeholder="$0"
                  value={row.offDayRate}
                  onChange={(e) => updateRosterRow(row.id, "offDayRate", e.target.value)}
                />
                <button
                  className="wiz-roster-delete"
                  onClick={() => removeRosterRow(row.id)}
                  title="Remove"
                >&times;</button>
              </div>
            ))}
          </div>

          <button className="wiz-add-link" onClick={addRosterRow}>+ Add another person</button>

          {error && <div className="wiz-error">{error}</div>}

          <div className="wiz-btn-row">
            <button className="wiz-btn wiz-btn-back" onClick={() => { setError(""); setStep(1); }}>&larr; Back</button>
            <button
              className="wiz-btn wiz-btn-primary"
              disabled={saving}
              onClick={submitStep2}
            >
              {saving ? "Saving..." : "Next \u2014 Create Your Tour"}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Create Tour ── */}
      {step === 3 && (
        <div>
          <h1 className="wiz-headline">Name your tour.</h1>
          <p className="wiz-subhead">This is where everything lives &mdash; your routing, budget, shows, and documents.</p>

          <div className="wiz-field">
            <label className="wiz-label">Tour Name</label>
            <input
              className="wiz-input"
              type="text"
              placeholder="Spring 2026 US Run"
              value={tourName}
              onChange={(e) => setTourName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="wiz-field-row">
            <div className="wiz-field">
              <label className="wiz-label">Start Date</label>
              <input
                className="wiz-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <div className="wiz-helper">Rough dates are fine</div>
            </div>
            <div className="wiz-field">
              <label className="wiz-label">End Date</label>
              <input
                className="wiz-input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="wiz-field">
            <label className="wiz-label">Vehicle Type</label>
            <select
              className="wiz-select"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
            >
              {VEHICLE_OPTIONS.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {error && <div className="wiz-error">{error}</div>}

          <div className="wiz-btn-row">
            <button className="wiz-btn wiz-btn-back" onClick={() => { setError(""); setStep(2); }}>&larr; Back</button>
            <button
              className="wiz-btn wiz-btn-primary"
              disabled={!tourName.trim() || saving}
              onClick={submitStep3}
            >
              {saving ? "Saving..." : "Next \u2014 Add Shows"}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Add Shows ── */}
      {step === 4 && (
        <div>
          <h1 className="wiz-headline">Now the fun part.</h1>
          <p className="wiz-subhead">Add dates manually or drop a route sheet and let HWY61 do the work.</p>

          <div className="wiz-paths">
            {/* Path A — Manual Entry */}
            <div className="wiz-path">
              <div className="wiz-path-label">Add Manually</div>

              <div>
                {shows.map((row, index) => (
                  <div className="wiz-show-row" key={row.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span className="wiz-label" style={{ marginBottom: 0 }}>Show {index + 1}</span>
                      <button onClick={() => removeShowRow(row.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#8A8580" }}>&times;</button>
                    </div>
                    <label className="wiz-label" style={{ marginBottom: 2, fontSize: 11 }}>Date</label>
                    <input className="wiz-input" type="date" value={row.date} onChange={(e) => updateShowRow(row.id, "date", e.target.value)} />
                    <label className="wiz-label" style={{ marginBottom: 2, fontSize: 11 }}>City</label>
                    <input className="wiz-input" type="text" placeholder="Austin, TX" value={row.city} onChange={(e) => updateShowRow(row.id, "city", e.target.value)} />
                    <label className="wiz-label" style={{ marginBottom: 2, fontSize: 11 }}>Venue</label>
                    <input className="wiz-input" type="text" placeholder="The Continental Club" value={row.venue} onChange={(e) => updateShowRow(row.id, "venue", e.target.value)} />
                    <label className="wiz-label" style={{ marginBottom: 2, fontSize: 11 }}>Offer</label>
                    <input className="wiz-input" type="number" placeholder="$0" value={row.offer} onChange={(e) => updateShowRow(row.id, "offer", e.target.value)} />
                  </div>
                ))}
              </div>

              <button className="wiz-add-link" onClick={addShowRow}>+ Add another show</button>
            </div>

            {/* Divider */}
            <div className="wiz-divider">
              <div className="wiz-divider-or">OR</div>
            </div>

            {/* Path B — Drop a Document */}
            <div className="wiz-path">
              <div className="wiz-path-label">Or Drop a Document</div>

              <div
                className={`wiz-doc-zone${parsing ? " active" : ""}`}
                onClick={() => dropRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); }}
                onDrop={handleDocDrop}
              >
                {parsing ? (
                  <div className="wiz-parsing">HWY61 is reading your document...</div>
                ) : (
                  <>
                    <div className="wiz-doc-text">Drop a route sheet, deal memo, or schedule &mdash; PDF, Excel (.xlsx), CSV, or image</div>
                    <div className="wiz-doc-formats">PDF &middot; Excel &middot; CSV &middot; Image</div>
                  </>
                )}
              </div>
              <input
                ref={dropRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.csv,image/*"
                style={{ display: "none" }}
                onChange={handleDocSelect}
              />

              {parseError && <div className="wiz-error" style={{ marginTop: 12 }}>{parseError}</div>}

              {parsedShows && (
                <>
                  <div className="wiz-preview">
                    <div className="wiz-preview-header">
                      <span />
                      <span>Date</span>
                      <span>City</span>
                      <span>Venue</span>
                      <span>Offer</span>
                    </div>
                    {parsedShows.map((s, i) => (
                      <div className="wiz-preview-row" key={i}>
                        <input
                          type="checkbox"
                          className="wiz-checkbox"
                          checked={s.checked}
                          onChange={() => toggleParsedShow(i)}
                        />
                        <span>{s.date}</span>
                        <span>{s.city}</span>
                        <span>{s.venue}</span>
                        <span>{s.offer ? "$" + s.offer : ""}</span>
                      </div>
                    ))}
                  </div>
                  <button className="wiz-btn-confirm" onClick={confirmParsedShows}>
                    Confirm {parsedShows.filter((s) => s.checked).length} Shows
                  </button>
                </>
              )}
            </div>
          </div>

          {error && <div className="wiz-error">{error}</div>}

          <div className="wiz-btn-row">
            <button className="wiz-btn wiz-btn-back" onClick={() => { setError(""); setStep(3); }}>&larr; Back</button>
            <button
              className="wiz-btn wiz-btn-primary"
              disabled={saving}
              onClick={submitStep4}
            >
              {saving ? "Saving..." : "Finish Setup"}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 5: Done ── */}
      {step === 5 && (
        <div>
          <h1 className="wiz-headline">You&rsquo;re on the road.</h1>
          <p className="wiz-subhead">Here&rsquo;s what we set up for you. Everything is editable &mdash; go explore.</p>

          <div className="wiz-summary">
            <div className="wiz-summary-row">
              <span className="wiz-summary-label">Artist</span>
              <span className="wiz-summary-value">{artistName}</span>
            </div>
            <div className="wiz-summary-row">
              <span className="wiz-summary-label">Tour</span>
              <span className="wiz-summary-value">{tourName}</span>
            </div>
            <div className="wiz-summary-row">
              <span className="wiz-summary-label">Shows</span>
              <span className="wiz-summary-value">{shows.filter((s) => s.date || s.city).length}</span>
            </div>
            <div className="wiz-summary-row">
              <span className="wiz-summary-label">Roster</span>
              <span className="wiz-summary-value">{roster.filter((r) => r.name.trim()).length} people</span>
            </div>
            <div className="wiz-summary-row">
              <span className="wiz-summary-label">Vehicle</span>
              <span className="wiz-summary-value">{vehicleType}</span>
            </div>
            {(startDate || endDate) && (
              <div className="wiz-summary-row">
                <span className="wiz-summary-label">Dates</span>
                <span className="wiz-summary-value">
                  {startDate && new Date(startDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {startDate && endDate && " \u2013 "}
                  {endDate && new Date(endDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            )}
          </div>

          <div className="wiz-links">
            <a className="wiz-link" href={tourId ? "/dashboard/routing/" + tourId : "/dashboard"}>
              <div className="wiz-link-title">View your tour</div>
              <div className="wiz-link-desc">See your routing table and budget</div>
            </a>
            <a className="wiz-link" href={tourId ? "/dashboard/routing/" + tourId + "/import" : "/dashboard"}>
              <div className="wiz-link-title">Upload a document</div>
              <div className="wiz-link-desc">Drop a settlement, deal memo, or receipt</div>
            </a>
            <a className="wiz-link" href={tourId ? "/dashboard/routing/" + tourId : "/dashboard"}>
              <div className="wiz-link-title">Set up your vehicle</div>
              <div className="wiz-link-desc">MPG, fuel price, passenger count</div>
            </a>
            <a className="wiz-link" href={artistId ? "/dashboard/artists/" + artistId + "/profile" : "/dashboard"}>
              <div className="wiz-link-title">Update your Artist Profile</div>
              <div className="wiz-link-desc">Bio, contacts, rider, and more</div>
            </a>
          </div>

          <div className="wiz-done-cta">
            <button
              className="wiz-btn wiz-btn-primary"
              style={{ padding: "18px 48px", fontSize: 18 }}
              onClick={() => {
                if (tourId) {
                  router.push("/dashboard/routing/" + tourId);
                } else {
                  router.push("/dashboard");
                }
              }}
            >
              View Your Tour
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
