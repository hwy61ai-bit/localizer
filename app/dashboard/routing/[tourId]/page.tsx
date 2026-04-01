"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import posthog from "posthog-js";
import Link from "next/link";
import { useParams } from "next/navigation";
import IntakeDropZone from "../IntakeDropZone";
import SettlementPanel from "./SettlementPanel";
import RosterPanel from "./RosterPanel";
import VehicleManager from "./VehicleManager";
import {
  getRoadKm,
  estimateDriveHours,
  fmtHours,
  fmtUSD,
  fmtDist,
  formatDateDisplay,
  legCountry,
  isImperialCountry,
  getAirport,
  buildFlightLinks,
  calcTourFinancials,
  prefetchDriveData,
  buildDriveDataKey,
  type TourShow,
  type FinancialResults,
  type VehicleType,
  type DriveDataMap,
  COMMISSION_TYPE_LABELS,
  type CommissionType,
} from "@/lib/tourrouter";
import type { Commission } from "@/lib/tourrouter/commissions";
import { useFeatureFlags } from "@/lib/tourrouter/FeatureFlagContext";
import { useProductBranding } from "@/lib/tourrouter/ProductBrandingContext";
import "./tour-detail.css";

// ── Types ────────────────────────────────────────────────────

type TourData = {
  id: string;
  name: string;
  artist_id: string | null;
  vehicle_type: VehicleType | null;
  mpg: number | null;
  pax: number | null;
  fuel_price_usd: number | null;
  flight_threshold_h: number | null;
  blanket_show_amount: number | null;
  blanket_off_amount: number | null;
  blanket_show_label: string | null;
  blanket_off_label: string | null;
  currency_rates: Record<string, number> | null;
  leg_choices: Record<string, string> | null;
  localizer_tour_id: string | null;
  advance_config: { initialSendDays?: number; followup1Days?: number; followup2Days?: number; finalNudgeDays?: number; enabled?: boolean } | null;
  tour_roster: Record<string, unknown>[] | null;
  tour_vehicles: Record<string, unknown>[] | null;
  tour_commissions: Commission[] | null;
};

type ShowRow = {
  id: string;
  sort_order: number;
  date_iso: string | null;
  event: string | null;
  city: string | null;
  country: string | null;
  country_norm: string | null;
  venue: string | null;
  offer_display: string | null;
  offer_amount: number;
  offer_currency: string;
  capacity: number | null;
  status: string | null;
  is_off: boolean;
  doors: string | null;
  showtime: string | null;
  onstage: string | null;
  curfew: string | null;
  merch: string | null;
  backend: string | null;
  promoter: string | null;
  notes: string | null;
  support: string | null;
  advance_status: string | null;
  advance_sent_at: string | null;
  advance_form_token: string | null;
  advance_form_submitted_at: string | null;
  advance_form_submitted_by: string | null;
  advance_recipient_email: string | null;
  deal?: Record<string, unknown> | null;
  settlement?: Record<string, unknown> | null;
};

type LegInfo = {
  km: number | null;
  driveH: number | null;
  distStr: string;
  legCtry: string;
  dayGap: number;
  fromCity: string;
  toCity: string;
};

// ── Drawer field helpers ─────────────────────────────────────

const DRAWER_SECTIONS = [
  {
    title: "Show Info",
    fields: [
      { key: "date_iso", label: "Date", type: "date" },
      { key: "event", label: "Event Name" },
      { key: "venue", label: "Venue" },
      { key: "city", label: "City" },
      { key: "country", label: "Country" },
    ],
  },
  {
    title: "Financials",
    fields: [
      { key: "offer_amount", label: "Offer Amount", type: "number" },
      { key: "offer_currency", label: "Currency" },
      { key: "status", label: "Status" },
      { key: "billing", label: "Billing" },
      { key: "age_limit", label: "Age Limit" },
      { key: "backend", label: "Backend / Deal Terms" },
    ],
  },
  {
    title: "Schedule",
    fields: [
      { key: "doors", label: "Doors" },
      { key: "showtime", label: "Showtime" },
      { key: "onstage", label: "Onstage" },
      { key: "curfew", label: "Curfew" },
    ],
  },
  {
    title: "Contacts",
    fields: [
      { key: "promoter", label: "Promoter" },
      { key: "promoter_contact", label: "Promoter Contact" },
      { key: "production_contact", label: "Production Contact" },
    ],
  },
  {
    title: "Hotel",
    fields: [
      { key: "hotel_name", label: "Hotel Name" },
      { key: "hotel_address", label: "Hotel Address" },
      { key: "hotel_checkin", label: "Check-in" },
      { key: "hotel_checkout", label: "Check-out" },
      { key: "hotel_rooms", label: "Rooms", type: "number" },
      { key: "hotel_rate", label: "Rate ($)", type: "number" },
      { key: "hotel_currency", label: "Currency" },
      { key: "hotel_confirmation", label: "Confirmation #" },
      { key: "hotel_notes", label: "Notes" },
    ],
  },
  {
    title: "Support & Merch",
    fields: [
      { key: "support", label: "Support / Opener" },
      { key: "merch", label: "Merch Deal" },
    ],
  },
  {
    title: "Notes",
    fields: [
      { key: "notes", label: "Notes" },
    ],
  },
];

// ── Component ────────────────────────────────────────────────

export default function RouteTourPage() {
  const { tourId } = useParams<{ tourId: string }>();
  const flags = useFeatureFlags();
  const branding = useProductBranding();
  const [tour, setTour] = useState<TourData | null>(null);
  const [shows, setShows] = useState<ShowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [legChoices, setLegChoices] = useState<Record<number, string>>({});
  const [financials, setFinancials] = useState<FinancialResults | null>(null);
  const [legs, setLegs] = useState<(LegInfo | null)[]>([]);
  const [driveData, setDriveData] = useState<DriveDataMap>({});

  // Drawer
  const [drawerShow, setDrawerShow] = useState<ShowRow | null>(null);
  const [drawerIdx, setDrawerIdx] = useState(-1);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Advancing
  const [advanceEmail, setAdvanceEmail] = useState("");
  const [advanceName, setAdvanceName] = useState("");
  const [advanceSending, setAdvanceSending] = useState(false);
  const [advanceMsg, setAdvanceMsg] = useState("");

  // Push to Localizer
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState<{ localizerTourId: string; eventCount: number; status: string } | null>(null);

  // Add Show modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newShow, setNewShow] = useState({ date_iso: "", venue: "", city: "", country: "", offer_amount: "", offer_currency: "USD", event: "" });
  const [addingSaving, setAddingSaving] = useState(false);

  // Delete show
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Settings panel
  const [showSettings, setShowSettings] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [showLegacyVehicle, setShowLegacyVehicle] = useState(false);
  const [blanketDetail, setBlanketDetail] = useState(false);
  const [showCommissions, setShowCommissions] = useState(false);

  // Drawer save indicator
  const [drawerSaved, setDrawerSaved] = useState(false);
  const [settlementOpen, setSettlementOpen] = useState(false);

  // Guest List
  type GuestEntry = { id: string; guest_name: string; plus_ones: number; pass_type: string; status: string; submitted_by: string | null; notes: string | null };
  const [guests, setGuests] = useState<GuestEntry[]>([]);
  const [guestLoading, setGuestLoading] = useState(false);
  const [addingGuest, setAddingGuest] = useState(false);
  const [newGuest, setNewGuest] = useState({ name: "", plusOnes: 0, passType: "Guest", notes: "" });

  // ── Fetch ──────────────────────────────────────────────────

  useEffect(() => {
    fetch(`/api/tourrouter/tours/${tourId}`)
      .then((r) => r.json())
      .then((data) => {
        setTour(data.tour);
        setShows(data.shows || []);
        // Restore leg_choices from tour settings
        if (data.tour?.leg_choices) {
          const restored: Record<number, string> = {};
          for (const [k, v] of Object.entries(data.tour.leg_choices)) {
            restored[parseInt(k)] = v as string;
          }
          setLegChoices(restored);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tourId]);

  // ── Prefetch Mapbox drive data ───────────────────────────────

  useEffect(() => {
    if (shows.length < 2) return;
    const showPairs = shows.map((s) => ({ city: s.city || "", country: s.country || "", isOff: s.is_off }));
    prefetchDriveData(showPairs).then(setDriveData);
  }, [shows]);

  // ── Compute legs & financials ──────────────────────────────

  const compute = useCallback(() => {
    if (!shows.length || !tour) return;

    const rates = tour.currency_rates || {};
    const vehicleType = tour.vehicle_type || "van";
    const vehicleCount = 1;
    const pax = tour.pax || 4;
    const flightThreshold = tour.flight_threshold_h || 6;

    // Build leg info
    const legInfos: (LegInfo | null)[] = shows.map((s, i) => {
      if (i === 0) return null;
      const prev = shows[i - 1];
      const driveKey = buildDriveDataKey(prev.city || "", s.city || "");
      const cached = driveData[driveKey];
      const km = cached ? cached.distanceKm : getRoadKm(prev.city, prev.country, s.city, s.country);
      const driveH = cached ? cached.driveHours : (km ? estimateDriveHours(km) : null);
      // CRITICAL: legCtry not legCountry
      const legCtry = legCountry(prev.country, s.country);
      const distStr = km ? fmtDist(km, legCtry === "usa" ? "usa" : "europe") : "?";
      let dayGap = 0;
      if (prev.date_iso && s.date_iso) {
        const d1 = new Date(prev.date_iso);
        const d2 = new Date(s.date_iso);
        dayGap = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      }
      return { km, driveH, distStr, legCtry, dayGap, fromCity: prev.city || "?", toCity: s.city || "?" };
    });
    setLegs(legInfos);

    // Build TourShow array for calcTourFinancials
    const tourShows: TourShow[] = shows.map((s) => ({
      date: s.date_iso ? new Date(s.date_iso + "T00:00:00") : null,
      event: s.event || "",
      city: s.city || "",
      country: s.country || "",
      countryNorm: s.country_norm || "",
      venue: s.venue || "",
      offer: {
        amount: s.offer_amount || 0,
        currency: s.offer_currency || "USD",
        display: s.offer_display || "",
      },
      usd: 0,
      capacity: s.capacity || 0,
      status: s.status || "",
      isOff: s.is_off,
      backend: s.backend || undefined,
      doors: s.doors || undefined,
      showtime: s.showtime || undefined,
      merch: s.merch || undefined,
      notes: s.notes || undefined,
      support: s.support || undefined,
      promoter: s.promoter || undefined,
    }));

    // SINGLE SOURCE OF TRUTH: calcTourFinancials
    const fin = calcTourFinancials({
      tourShows,
      legChoices,
      showExpenses: {},
      rates,
      pax,
      flightThreshold,
      blanketShowAmt: tour.blanket_show_amount || 0,
      blanketOffAmt: tour.blanket_off_amount || 0,
      blanketShowLabel: tour.blanket_show_label || "Band Pay",
      blanketOffLabel: tour.blanket_off_label || "Hotel + Per Diem",
      vehicleType,
      vehicleCount,
      fuelPriceOverride: tour.fuel_price_usd || null,
      flightPriceCache: {},
      driveData,
    });
    setFinancials(fin);
  }, [shows, tour, legChoices, driveData]);

  useEffect(() => { compute(); }, [compute]);

  // ── Leg choice toggle ──────────────────────────────────────

  function toggleLeg(idx: number, choice: string) {
    const next = { ...legChoices, [idx]: choice };
    setLegChoices(next);
    // Debounce save to API
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch(`/api/tourrouter/tours/${tourId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leg_choices: next }),
      });
    }, 800);
  }

  // ── Drawer ─────────────────────────────────────────────────

  function openDrawer(idx: number) {
    const s = shows[idx];
    setDrawerShow({ ...s });
    setDrawerIdx(idx);
    setAdvanceEmail(s.advance_recipient_email || "");
    setAdvanceName("");
    setAdvanceMsg("");
    setGuests([]);
    setAddingGuest(false);
    if (!s.is_off) fetchGuests(s.id);
  }

  function closeDrawer() {
    setDrawerShow(null);
    setDrawerIdx(-1);
    setAdvanceEmail("");
    setAdvanceName("");
    setAdvanceMsg("");
  }

  async function sendAdvance(emailType: string = "initial") {
    if (!drawerShow || !advanceEmail.trim()) return;
    setAdvanceSending(true);
    setAdvanceMsg("");
    try {
      const resp = await fetch("/api/tourrouter/advance/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          showId: drawerShow.id,
          recipientEmail: advanceEmail.trim(),
          recipientName: advanceName.trim(),
          emailType,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        setAdvanceMsg(err.error || "Send failed");
      } else {
        const data = await resp.json();
        setAdvanceMsg("Advance sent!");
        // Update local show
        setShows((prev) => prev.map((s) =>
          s.id === drawerShow.id ? { ...s, advance_status: "sent", advance_sent_at: new Date().toISOString(), advance_form_token: data.token, advance_recipient_email: advanceEmail.trim() } : s
        ));
        setDrawerShow((prev) => prev ? { ...prev, advance_status: "sent", advance_sent_at: new Date().toISOString(), advance_form_token: data.token, advance_recipient_email: advanceEmail.trim() } : null);
      }
    } catch {
      setAdvanceMsg("Send failed");
    }
    setAdvanceSending(false);
  }

  // ── Guest list ─────────────────────────────────────────────

  async function fetchGuests(showId: string) {
    setGuestLoading(true);
    const resp = await fetch(`/api/tourrouter/guest-list?showId=${showId}`);
    if (resp.ok) {
      const data = await resp.json();
      setGuests(data.entries);
    }
    setGuestLoading(false);
  }

  async function addGuest() {
    if (!drawerShow || !newGuest.name.trim()) return;
    const resp = await fetch("/api/tourrouter/guest-list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ showId: drawerShow.id, guestName: newGuest.name, plusOnes: newGuest.plusOnes, passType: newGuest.passType, notes: newGuest.notes }),
    });
    if (resp.ok) {
      const data = await resp.json();
      setGuests((prev) => [...prev, data.entry]);
      setNewGuest({ name: "", plusOnes: 0, passType: "Guest", notes: "" });
      setAddingGuest(false);
    }
  }

  async function updateGuestStatus(entryId: string, status: string) {
    const resp = await fetch(`/api/tourrouter/guest-list/${entryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (resp.ok) {
      setGuests((prev) => prev.map((g) => g.id === entryId ? { ...g, status } : g));
    }
  }

  async function deleteGuest(entryId: string) {
    await fetch(`/api/tourrouter/guest-list/${entryId}`, { method: "DELETE" });
    setGuests((prev) => prev.filter((g) => g.id !== entryId));
  }

  // ── Push to Localizer ────────────────────────────────────────

  async function pushToLocalizer() {
    setPushing(true);
    setPushResult(null);
    try {
      const resp = await fetch(`/api/tourrouter/tours/${tourId}/push-to-localizer`, {
        method: "POST",
      });
      if (!resp.ok) {
        const err = await resp.json();
        setPushResult({ localizerTourId: "", eventCount: 0, status: "error: " + (err.error || "Failed") });
        setPushing(false);
        return;
      }
      const data = await resp.json();
      setPushResult(data);
      // Update local tour state
      setTour((prev) => prev ? { ...prev, localizer_tour_id: data.localizerTourId } : prev);
    } catch {
      setPushResult({ localizerTourId: "", eventCount: 0, status: "error: Push failed" });
    }
    setPushing(false);
  }

  // ── Add Show ─────────────────────────────────────────────────

  async function saveNewShow() {
    setAddingSaving(true);
    try {
      const resp = await fetch(`/api/tourrouter/tours/${tourId}/shows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shows: [{
            date_iso: newShow.date_iso || null,
            event: newShow.event || null,
            venue: newShow.venue || null,
            city: newShow.city || null,
            country: newShow.country || null,
            offer_amount: parseFloat(newShow.offer_amount) || 0,
            offer_currency: newShow.offer_currency || "USD",
            offer_display: newShow.offer_amount ? `${newShow.offer_currency} ${newShow.offer_amount}` : null,
            is_off: false,
            sort_order: shows.length,
          }],
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const added: ShowRow[] = data.shows || [];
        setShows((prev) => [...prev, ...added].sort((a, b) =>
          (a.date_iso || "").localeCompare(b.date_iso || "")
        ));
        posthog.capture("show_added");
        setShowAddModal(false);
        setNewShow({ date_iso: "", venue: "", city: "", country: "", offer_amount: "", offer_currency: "USD", event: "" });
      }
    } catch { /* ignore */ }
    setAddingSaving(false);
  }

  // ── Delete Show ──────────────────────────────────────────────

  async function deleteShow(showId: string) {
    try {
      const resp = await fetch(`/api/tourrouter/tours/${tourId}/shows/${showId}`, { method: "DELETE" });
      if (resp.ok) {
        setShows((prev) => prev.filter((s) => s.id !== showId));
        if (drawerShow?.id === showId) closeDrawer();
      }
    } catch { /* ignore */ }
    setDeleteConfirmId(null);
  }

  // ── Tour Settings ────────────────────────────────────────────

  function updateTourSetting(key: string, value: unknown) {
    setTour((prev) => prev ? { ...prev, [key]: value } : prev);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch(`/api/tourrouter/tours/${tourId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
    }, 600);
  }

  function updateDrawerField(key: string, value: string) {
    if (!drawerShow) return;
    const numFields = ["capacity", "offer_amount", "hotel_rooms", "hotel_rate", "hotel_block_size", "hotel_block_rate", "hotel_attrition_pct", "deposit_amount"];
    const boolFields = ["hotel_block"];
    const parsed: unknown = boolFields.includes(key) ? !!value : numFields.includes(key) ? (parseFloat(value) || 0) : value;
    const updated = { ...drawerShow, [key]: parsed };
    setDrawerShow(updated);
    setDrawerSaved(false);
    // Debounce save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch(`/api/tourrouter/tours/${tourId}/shows/${drawerShow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: parsed }),
      }).then(() => {
        setShows((prev) => prev.map((s, i) => i === drawerIdx ? { ...s, [key]: parsed } : s));
        setDrawerSaved(true);
        setTimeout(() => setDrawerSaved(false), 1500);
      });
    }, 600);
  }

  function toggleSection(title: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title); else next.add(title);
      return next;
    });
  }

  // ── Helpers ────────────────────────────────────────────────

  function driveColorBg(h: number | null): string {
    if (h === null) return "transparent";
    if (h > 6) return "#fff0ef";
    if (h > 4) return "#fff8f0";
    return "#f0faf4";
  }

  function driveColor(h: number | null): string {
    if (h === null) return "#888";
    if (h > 6) return "#c0392b";
    if (h > 4) return "#b35c00";
    return "#1a6b3c";
  }

  function statusDot(status: string | null): { color: string; label: string } {
    if (!status) return { color: "#ddd", label: "" };
    const s = status.toLowerCase();
    if (s.includes("confirm")) return { color: "#1a6b3c", label: "Confirmed" };
    if (s.includes("cancel")) return { color: "#c0392b", label: "Cancelled" };
    return { color: "#b35c00", label: "Pending" };
  }

  function formatShowDate(dateStr: string | null): string {
    if (!dateStr) return "\u2014";
    const d = new Date(dateStr + "T00:00:00");
    return formatDateDisplay(d);
  }

  // ── Nav ────────────────────────────────────────────────────

  const navItems = [
    { num: 1, label: "Import", href: `/dashboard/routing/${tourId}/import`, active: false },
    { num: 2, label: "Route", href: `/dashboard/routing/${tourId}`, active: true },
    ...(flags.financeLayer ? [{ num: 3, label: "Financials", href: `/dashboard/routing/${tourId}/financials`, active: false }] : []),
    { num: flags.financeLayer ? 4 : 3, label: "Export", href: `/dashboard/routing/${tourId}/export`, active: false },
  ];

  const f = financials;
  const flightThreshold = tour?.flight_threshold_h || 6;

  // ── Stat cards ─────────────────────────────────────────────

  const totalDriveH = legs.reduce((sum, leg) => {
    if (!leg) return sum;
    const idx = legs.indexOf(leg);
    if (legChoices[idx] === "fly") return sum;
    return sum + (leg.driveH || 0);
  }, 0);

  const drivingLegs = legs.filter((leg, idx) => leg && legChoices[idx] !== "fly" && leg.driveH !== null);
  const avgDriveH = drivingLegs.length ? drivingLegs.reduce((s, l) => s + (l!.driveH || 0), 0) / drivingLegs.length : 0;
  const longestDriveH = drivingLegs.length ? Math.max(...drivingLegs.map((l) => l!.driveH || 0)) : 0;
  const brutalLegs = drivingLegs.filter((l) => (l!.driveH || 0) > 6).length;

  const statCards = [
    { label: "Total Shows", value: f ? String(f.showDayCount) : "\u2014" },
    { label: "Off Days", value: f ? String(f.offDayCount) : "\u2014" },
    { label: f?.imperialTour ? "Total Miles" : "Total KM", value: f ? (f.imperialTour ? Math.round(f.totalKm * 0.6214).toLocaleString() : Math.round(f.totalKm).toLocaleString()) : "\u2014" },
    { label: "Total Drive", value: totalDriveH ? fmtHours(totalDriveH) : "\u2014" },
    { label: "Est. Fuel", value: f ? fmtUSD(f.totalFuel) : "\u2014", color: "#c0392b" },
    { label: "Avg Drive", value: avgDriveH ? fmtHours(avgDriveH) : "\u2014" },
    { label: "Longest Drive", value: longestDriveH ? fmtHours(longestDriveH) : "\u2014", color: longestDriveH > 6 ? "#c0392b" : undefined },
    { label: "Brutal Legs >6h", value: String(brutalLegs), color: brutalLegs > 0 ? "#b35c00" : undefined },
  ];

  // ── Show options for intake drop zone ─────────────────────
  const intakeShowOptions = shows.filter((s) => !s.is_off).map((s) => ({
    id: s.id,
    label: [formatShowDate(s.date_iso), s.city, s.venue].filter(Boolean).join(" \u2014 "),
  }));

  function reloadTour() {
    fetch(`/api/tourrouter/tours/${tourId}`)
      .then((r) => r.json())
      .then((data) => { setTour(data.tour); setShows(data.shows || []); });
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <IntakeDropZone tourId={tourId} showId={drawerShow?.id} shows={intakeShowOptions} onSaved={reloadTour}>
    <>
    <div className="fade-in td-page" style={{ minHeight: "100vh", background: "#EEEEEE", padding: "32px 24px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid #DDDDDD" }}>
          <Link href={tour?.artist_id ? `/dashboard/artists/${tour.artist_id}` : "/dashboard"} style={{ fontSize: 13, fontWeight: 700, color: "#888", textDecoration: "none", display: "inline-block", marginBottom: 8 }}>&larr; {tour?.artist_id ? "Back to Artist" : "Back to Dashboard"}</Link>
          <div className="td-header-inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 className="brand-title" style={{ margin: 0, marginBottom: 4, paddingBottom: 8 }}>{branding.name}</h1>
              <div style={{ borderBottom: "2px solid #111111", marginBottom: 6 }} />
              <div className="brand-title td-tour-name" style={{ margin: 0, fontSize: "360%" }}>{loading ? "\u2014" : tour?.name?.toUpperCase() || "TOUR"}</div>
            </div>
            <div className="td-nav" style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <div className="td-nav-pills" style={{ display: "flex", flexDirection: "column", gap: 6, background: "#fff", border: "1px solid #DDDDDD", borderRadius: 12, padding: 8 }}>
                {navItems.map((item) => (
                  <Link
                    key={item.num}
                    href={item.href}
                    style={{
                      padding: "10px 18px", borderRadius: 10,
                      border: item.active ? "1px solid #111" : "1px solid #DDDDDD",
                      background: item.active ? "#111" : "#fff",
                      color: item.active ? "#fff" : "#111",
                      textDecoration: "none", fontWeight: item.active ? 900 : 700, fontSize: 13,
                    }}
                  >{item.num}. {item.label}</Link>
                ))}
              </div>
            </div>
            {/* Push to Localizer */}
            {shows.length > 0 && (
              <div className="td-push-col" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <button
                  onClick={pushToLocalizer}
                  disabled={pushing}
                  style={{
                    padding: "10px 20px", borderRadius: 10,
                    border: "1px solid #1a6b3c",
                    background: "#1a6b3c", color: "#fff",
                    fontWeight: 900, fontSize: 13, cursor: pushing ? "wait" : "pointer",
                    opacity: pushing ? 0.6 : 1,
                  }}
                >{pushing ? "Pushing..." : tour?.localizer_tour_id ? "Update Localizer \u2192" : "Push to Localizer \u2192"}</button>
                {pushResult && !pushResult.status.startsWith("error") && (
                  <div style={{ fontSize: 12 }}>
                    <span style={{ color: "#1a6b3c", fontWeight: 600 }}>{pushResult.eventCount} shows {pushResult.status}</span>
                    {pushResult.localizerTourId && (
                      <Link href={`/dashboard/tours/${pushResult.localizerTourId}`} style={{ marginLeft: 8, color: "#1a5fa6", textDecoration: "none", fontWeight: 700 }}>Open in Localizer &rarr;</Link>
                    )}
                  </div>
                )}
                {pushResult && pushResult.status.startsWith("error") && (
                  <div style={{ fontSize: 12, color: "#c0392b" }}>{pushResult.status}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="td-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 20 }}>
          {statCards.map((card) => (
            <div key={card.label} style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>{card.label}</div>
              <div className="td-stat-value" style={{ fontSize: 20, fontWeight: 800, fontFamily: "monospace", color: card.color || "#111" }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* Settings Panel */}
        {showSettings && tour && (
          <div style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800 }}>Tour Settings</div>
              <button onClick={() => setShowSettings(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#888" }}>&times;</button>
            </div>
            {flags.multiVehicle && <VehicleManager
              tourId={tourId}
              vehicles={(tour?.tour_vehicles || []) as never[]}
              defaultFuelPrice={tour?.fuel_price_usd || 3.50}
              onUpdate={(updated) => setTour((prev) => prev ? { ...prev, tour_vehicles: updated as unknown as Record<string, unknown>[] } : prev)}
            />}

            {/* Legacy single-vehicle settings — show only if no multi-vehicle config */}
            {(!tour.tour_vehicles || tour.tour_vehicles.length === 0) && (
              <div style={{ borderTop: "1px solid #eee", marginTop: 12, paddingTop: 8 }}>
                <div onClick={() => setShowLegacyVehicle(!showLegacyVehicle)} style={{ fontSize: 11, color: "#aaa", cursor: "pointer", marginBottom: showLegacyVehicle ? 10 : 0 }}>
                  {showLegacyVehicle ? "Hide" : "Show"} legacy single-vehicle settings {showLegacyVehicle ? "\u25bc" : "\u25b6"}
                </div>
                {showLegacyVehicle && (
                  <div className="td-settings-grid-5" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Vehicle</label>
                      <select value={tour.vehicle_type || "van"} onChange={(e) => { const v = e.target.value; updateTourSetting("vehicle_type", v); const mpgDefaults: Record<string, number> = { van: 18, e350: 14, minibus: 12, bus: 6, truck: 10, car: 28 }; if (mpgDefaults[v]) updateTourSetting("mpg", mpgDefaults[v]); }} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, background: "#fff", outline: "none" }}>
                        {["van", "e350", "minibus", "bus", "truck", "car"].map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Passengers</label>
                      <input type="number" value={tour.pax ?? 4} onChange={(e) => updateTourSetting("pax", parseInt(e.target.value) || 1)} min={1} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>MPG</label>
                      <input type="number" value={tour.mpg ?? ""} onChange={(e) => updateTourSetting("mpg", parseFloat(e.target.value) || null)} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }} placeholder="Auto" />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Fuel $/gal</label>
                      <input type="number" value={tour.fuel_price_usd ?? 3.50} onChange={(e) => updateTourSetting("fuel_price_usd", parseFloat(e.target.value) || null)} step="0.01" style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Fly threshold (h)</label>
                      <input type="number" value={tour.flight_threshold_h ?? 6} onChange={(e) => updateTourSetting("flight_threshold_h", parseInt(e.target.value) || 6)} min={1} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Blanket Expenses */}
            <div style={{ borderTop: "1px solid #e0e0da", paddingTop: 16, marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Blanket Expenses</div>
                <button
                  onClick={() => setBlanketDetail(!blanketDetail)}
                  style={{ padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600, border: "1px solid #e0e0da", background: "#fff", cursor: "pointer" }}
                >
                  {blanketDetail ? "Summary View" : "Detail View"}
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 1fr 120px", gap: 8, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#888880", marginBottom: 2 }}>Show Day Label</div>
                  <input
                    style={{ width: "100%", boxSizing: "border-box", padding: "4px 8px", border: "1px solid #e0e0da", borderRadius: 4, fontSize: 13, outline: "none" }}
                    value={tour?.blanket_show_label || ""}
                    placeholder="e.g. Band Pay"
                    onChange={(e) => updateTourSetting("blanket_show_label", e.target.value)}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#888880", marginBottom: 2 }}>$/Show Day</div>
                  <input
                    style={{ width: "100%", boxSizing: "border-box", padding: "4px 8px", border: "1px solid #e0e0da", borderRadius: 4, fontSize: 13, fontFamily: "monospace", textAlign: "right" as const, outline: "none" }}
                    type="number"
                    value={tour?.blanket_show_amount || ""}
                    placeholder="0"
                    onChange={(e) => updateTourSetting("blanket_show_amount", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#888880", marginBottom: 2 }}>Off Day Label</div>
                  <input
                    style={{ width: "100%", boxSizing: "border-box", padding: "4px 8px", border: "1px solid #e0e0da", borderRadius: 4, fontSize: 13, outline: "none" }}
                    value={tour?.blanket_off_label || ""}
                    placeholder="e.g. Hotel + Per Diem"
                    onChange={(e) => updateTourSetting("blanket_off_label", e.target.value)}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#888880", marginBottom: 2 }}>$/Off Day</div>
                  <input
                    style={{ width: "100%", boxSizing: "border-box", padding: "4px 8px", border: "1px solid #e0e0da", borderRadius: 4, fontSize: 13, fontFamily: "monospace", textAlign: "right" as const, outline: "none" }}
                    type="number"
                    value={tour?.blanket_off_amount || ""}
                    placeholder="0"
                    onChange={(e) => updateTourSetting("blanket_off_amount", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              {blanketDetail && (
                <div style={{ marginTop: 12, background: "#f5f5f2", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#888880", marginBottom: 8 }}>BREAKDOWN</div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                    <span>{tour?.blanket_show_label || "Show Day"} &times; {financials?.showDayCount || 0} show days</span>
                    <span style={{ fontFamily: "monospace" }}>${((tour?.blanket_show_amount || 0) * (financials?.showDayCount || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                    <span>{tour?.blanket_off_label || "Off Day"} &times; {financials?.offDayCount || 0} off days</span>
                    <span style={{ fontFamily: "monospace" }}>${((tour?.blanket_off_amount || 0) * (financials?.offDayCount || 0)).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, fontWeight: 700, borderTop: "1px solid #e0e0da", marginTop: 4 }}>
                    <span>Total Blanket Expenses</span>
                    <span style={{ fontFamily: "monospace" }}>${(((tour?.blanket_show_amount || 0) * (financials?.showDayCount || 0)) + ((tour?.blanket_off_amount || 0) * (financials?.offDayCount || 0))).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                  {tour?.tour_roster && tour.tour_roster.length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 11, color: "#b35c00", padding: "4px 8px", background: "#fff3e0", borderRadius: 4 }}>
                      Note: You have a roster with {tour.tour_roster.length} member(s). When roster pay components are set, they replace blanket amounts in the financial calculations.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Commissions */}
            {flags.commissions && <div style={{ borderTop: "1px solid #e0e0da", paddingTop: 16, marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showCommissions ? 12 : 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, cursor: "pointer" }} onClick={() => setShowCommissions(!showCommissions)}>
                  Commissions {showCommissions ? "\u25bc" : "\u25b6"}
                </div>
                {showCommissions && (
                  <button
                    onClick={() => {
                      const newC: Commission = {
                        id: crypto.randomUUID(),
                        type: "agent_pct" as CommissionType,
                        label: "",
                        recipientName: "",
                        recipientCompany: null,
                        percentage: null,
                        flatAmount: null,
                        flatPeriod: null,
                        currency: "USD",
                        isActive: true,
                        notes: null,
                      };
                      const updated = [...(tour?.tour_commissions || []), newC];
                      updateTourSetting("tour_commissions", updated);
                    }}
                    style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #111", background: "#111", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >+ Add Commission</button>
                )}
              </div>
              {showCommissions && (
                <div>
                  {(tour?.tour_commissions || []).length === 0 && (
                    <div style={{ fontSize: 12, color: "#888", padding: "8px 0" }}>No commissions configured</div>
                  )}
                  {(tour?.tour_commissions || []).map((c, idx) => {
                    const isPct = ["agent_pct", "manager_pct_gross", "manager_pct_net", "bm_pct_gross", "co_manager_pct", "subagent_pct"].includes(c.type);
                    const isFlat = ["bm_flat_monthly", "label_support"].includes(c.type);
                    const isCustom = c.type === "custom";

                    function updateCommission(field: string, value: unknown) {
                      const updated = [...(tour?.tour_commissions || [])];
                      updated[idx] = { ...updated[idx], [field]: value };
                      updateTourSetting("tour_commissions", updated);
                    }

                    function removeCommission() {
                      const updated = (tour?.tour_commissions || []).filter((_, i) => i !== idx);
                      updateTourSetting("tour_commissions", updated);
                    }

                    return (
                      <div key={c.id} className="td-commission-row" style={{ display: "grid", gridTemplateColumns: "1fr 140px 1fr 100px 60px 40px 30px", gap: 6, alignItems: "end", marginBottom: 8, padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                        <div>
                          <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>Label</div>
                          <input value={c.label || ""} onChange={(e) => updateCommission("label", e.target.value)} placeholder="e.g. Booking Agent" style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: "1px solid #DDDDDD", borderRadius: 6, fontSize: 12, outline: "none" }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>Type</div>
                          <select value={c.type} onChange={(e) => updateCommission("type", e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "6px 4px", border: "1px solid #DDDDDD", borderRadius: 6, fontSize: 11, background: "#fff", outline: "none" }}>
                            {Object.entries(COMMISSION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>Recipient</div>
                          <input value={c.recipientName || ""} onChange={(e) => updateCommission("recipientName", e.target.value)} placeholder="Name" style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: "1px solid #DDDDDD", borderRadius: 6, fontSize: 12, outline: "none" }} />
                        </div>
                        <div>
                          {(isPct || isCustom) && (
                            <>
                              <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>%</div>
                              <input type="number" step="0.1" value={c.percentage ?? ""} onChange={(e) => updateCommission("percentage", parseFloat(e.target.value) || null)} placeholder="10" style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: "1px solid #DDDDDD", borderRadius: 6, fontSize: 12, fontFamily: "monospace", outline: "none" }} />
                            </>
                          )}
                          {(isFlat || isCustom) && !isPct && (
                            <>
                              <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>$ Flat</div>
                              <input type="number" value={c.flatAmount ?? ""} onChange={(e) => updateCommission("flatAmount", parseFloat(e.target.value) || null)} placeholder="0" style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: "1px solid #DDDDDD", borderRadius: 6, fontSize: 12, fontFamily: "monospace", outline: "none" }} />
                            </>
                          )}
                        </div>
                        <div>
                          {isFlat && (
                            <>
                              <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>Period</div>
                              <select value={c.flatPeriod || "monthly"} onChange={(e) => updateCommission("flatPeriod", e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "6px 2px", border: "1px solid #DDDDDD", borderRadius: 6, fontSize: 10, background: "#fff", outline: "none" }}>
                                <option value="monthly">Monthly</option>
                                <option value="weekly">Weekly</option>
                                <option value="per_tour">Per Tour</option>
                              </select>
                            </>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 2 }}>
                          <input type="checkbox" checked={c.isActive} onChange={(e) => updateCommission("isActive", e.target.checked)} title="Active" style={{ width: 14, height: 14, accentColor: "#111" }} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 2 }}>
                          <button onClick={removeCommission} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#ccc", padding: 0 }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#c0392b"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#ccc"; }}>&times;</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>}

            {/* Advance Settings */}
            {flags.advancing && <div style={{ borderTop: "1px solid #DDDDDD", marginTop: 16, paddingTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 10 }}>Advance Automation</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Initial (days before)</label>
                  <input type="number" value={tour.advance_config?.initialSendDays ?? 21} onChange={(e) => updateTourSetting("advance_config", { ...tour.advance_config, initialSendDays: parseInt(e.target.value) || 21 })} min={1} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Follow-up 1 (days)</label>
                  <input type="number" value={tour.advance_config?.followup1Days ?? 5} onChange={(e) => updateTourSetting("advance_config", { ...tour.advance_config, followup1Days: parseInt(e.target.value) || 5 })} min={1} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Follow-up 2 (days)</label>
                  <input type="number" value={tour.advance_config?.followup2Days ?? 5} onChange={(e) => updateTourSetting("advance_config", { ...tour.advance_config, followup2Days: parseInt(e.target.value) || 5 })} min={1} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Final nudge (days before)</label>
                  <input type="number" value={tour.advance_config?.finalNudgeDays ?? 3} onChange={(e) => updateTourSetting("advance_config", { ...tour.advance_config, finalNudgeDays: parseInt(e.target.value) || 3 })} min={1} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }} />
                </div>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", padding: "8px 0" }}>
                    <input type="checkbox" checked={tour.advance_config?.enabled !== false} onChange={(e) => updateTourSetting("advance_config", { ...tour.advance_config, enabled: e.target.checked })} style={{ width: 16, height: 16, accentColor: "#111" }} />
                    <span style={{ fontWeight: 600 }}>Enabled</span>
                  </label>
                </div>
              </div>
            </div>}
          </div>
        )}

        {/* Action bar */}
        <div className="td-actions" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 800, fontSize: 12, cursor: "pointer" }}
          >+ Add Show</button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #DDDDDD", background: "#fff", color: "#888", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
          >{showSettings ? "Hide Vehicle Settings" : "\u2699 Vehicle Settings"}</button>
          {flags.personnelPay && <button
            onClick={() => setShowRoster(!showRoster)}
            style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #DDDDDD", background: "#fff", color: "#888", fontWeight: 700, fontSize: 12, cursor: "pointer" }}
          >{showRoster ? "Hide Roster" : "\u{1F465} Roster"}</button>}
        </div>

        {/* Roster Panel */}
        {flags.personnelPay && showRoster && (
          <div style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>Tour Roster & Pay</div>
              <button onClick={() => setShowRoster(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#888" }}>&times;</button>
            </div>
            <RosterPanel
              tourId={tourId}
              roster={(tour?.tour_roster || []) as never[]}
              onUpdate={(updated) => setTour((prev) => prev ? { ...prev, tour_roster: updated as unknown as Record<string, unknown>[] } : prev)}
            />
          </div>
        )}

        {/* Empty state */}
        {!loading && shows.length === 0 && (
          <div style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#888", marginBottom: 12 }}>No shows imported yet</div>
            <Link href={`/dashboard/routing/${tourId}/import`} style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", textDecoration: "none", fontWeight: 900, fontSize: 13 }}>Import Shows</Link>
          </div>
        )}

        {/* Route Table */}
        {shows.length > 0 && (
          <div style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, overflow: "hidden" }}>
            {/* Table header */}
            <div className="td-table-wrap" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["#", "Date", "Event / Venue", "City", "Country", "Offer", "USD", "Status", "Cap", "Adv", ""].map((h) => (
                      <th key={h || "del"} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "2px solid #DDDDDD", whiteSpace: "nowrap", background: "#fafaf8" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shows.map((s, i) => {
                    const leg = i > 0 ? legs[i] : null;
                    const flying = legChoices[i] === "fly";
                    const suggestFly = leg && leg.driveH !== null && leg.driveH > flightThreshold;
                    const showNum = shows.slice(0, i + 1).filter((x) => !x.is_off).length;
                    const sd = statusDot(s.status);
                    const fromAP = i > 0 ? getAirport(shows[i - 1].city, shows[i - 1].country) : null;
                    const toAP = getAirport(s.city, s.country);

                    return (
                      <LegAndShowRow
                        key={s.id}
                        show={s}
                        showNum={showNum}
                        index={i}
                        leg={leg}
                        flying={flying}
                        suggestFly={!!suggestFly}
                        fromAP={fromAP}
                        toAP={toAP}
                        sd={sd}
                        flightThreshold={flightThreshold}
                        onToggleLeg={toggleLeg}
                        onClickRow={openDrawer}
                        driveColorBg={driveColorBg}
                        driveColor={driveColor}
                        formatShowDate={formatShowDate}
                        onDelete={(id) => setDeleteConfirmId(id)}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>

      {/* ══════ Slide Drawer ══════ */}
      {drawerShow !== null && (
        <>
          <div onClick={closeDrawer} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 900 }} />
          <div className="td-drawer" style={{
            position: "fixed", top: 0, right: 0, bottom: 0, width: 460, maxWidth: "90vw",
            background: "#fff", zIndex: 901, overflowY: "auto",
            boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
            animation: "slideIn 0.25s ease-out",
          }}>
            <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
            {/* Drawer header */}
            <div className="td-drawer-header" style={{ padding: "20px 24px", borderBottom: "1px solid #DDDDDD", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{drawerShow.event || "Show Detail"}</div>
                  <div style={{ fontSize: 13, color: "#888" }}>
                    {[formatShowDate(drawerShow.date_iso), drawerShow.city, drawerShow.country].filter(Boolean).join(" \u00b7 ")}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {drawerSaved && <span style={{ fontSize: 11, fontWeight: 600, color: "#1a6b3c" }}>Saved</span>}
                  <a
                    href={`/api/tourrouter/tours/${tourId}/export/advance?showId=${drawerShow.id}`}
                    download
                    style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #DDDDDD", background: "#fff", fontSize: 11, fontWeight: 700, color: "#888", textDecoration: "none", cursor: "pointer" }}
                  >Advance</a>
                  <a
                    href={`/api/tourrouter/tours/${tourId}/export/daysheet?showId=${drawerShow.id}`}
                    download
                    style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #DDDDDD", background: "#fff", fontSize: 11, fontWeight: 700, color: "#888", textDecoration: "none", cursor: "pointer" }}
                  >Day Sheet</a>
                  <button onClick={closeDrawer} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888", padding: "4px 8px" }}>&times;</button>
                </div>
              </div>
            </div>
            {/* Drawer sections */}
            <div style={{ padding: "0 24px 24px" }}>
              {DRAWER_SECTIONS.map((section) => {
                const collapsed = collapsedSections.has(section.title);
                return (
                  <div key={section.title} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <div
                      onClick={() => toggleSection(section.title)}
                      style={{ padding: "14px 0", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "#888" }}>{section.title}</div>
                      <span style={{ fontSize: 12, color: "#aaa" }}>{collapsed ? "\u25b6" : "\u25bc"}</span>
                    </div>
                    {!collapsed && (
                      <div style={{ paddingBottom: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {section.fields.map((field) => (
                          <div key={field.key} style={{ gridColumn: ["notes", "backend", "hotel_notes", "hotel_address"].includes(field.key) ? "1 / -1" : undefined }}>
                            <label style={{ fontSize: 11, color: "#aaa", display: "block", marginBottom: 4 }}>{field.label}</label>
                            <input
                              value={String((drawerShow as Record<string, unknown>)[field.key] ?? "")}
                              onChange={(e) => updateDrawerField(field.key, e.target.value)}
                              type={field.type || "text"}
                              style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Hotel Block (conditional fields) */}
              {drawerShow && !collapsedSections.has("Hotel") && (
                <div style={{ paddingBottom: 14, marginTop: -10 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", padding: "8px 0" }}>
                    <input
                      type="checkbox"
                      checked={!!(drawerShow as Record<string, unknown>).hotel_block}
                      onChange={(e) => updateDrawerField("hotel_block", e.target.checked ? "true" : "")}
                      style={{ width: 16, height: 16, accentColor: "#111" }}
                    />
                    <span style={{ fontWeight: 600 }}>Room Block</span>
                  </label>
                  {!!(drawerShow as Record<string, unknown>).hotel_block && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6, paddingLeft: 24 }}>
                      <div>
                        <label style={{ fontSize: 11, color: "#aaa", display: "block", marginBottom: 4 }}>Block Size</label>
                        <input type="number" value={String((drawerShow as Record<string, unknown>).hotel_block_size ?? "")} onChange={(e) => updateDrawerField("hotel_block_size", e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "#aaa", display: "block", marginBottom: 4 }}>Block Rate ($)</label>
                        <input type="number" value={String((drawerShow as Record<string, unknown>).hotel_block_rate ?? "")} onChange={(e) => updateDrawerField("hotel_block_rate", e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "#aaa", display: "block", marginBottom: 4 }}>Cutoff Date</label>
                        <input value={String((drawerShow as Record<string, unknown>).hotel_cutoff_date ?? "")} onChange={(e) => updateDrawerField("hotel_cutoff_date", e.target.value)} placeholder="e.g. 2026-05-01" style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "#aaa", display: "block", marginBottom: 4 }}>Attrition %</label>
                        <input type="number" value={String((drawerShow as Record<string, unknown>).hotel_attrition_pct ?? "")} onChange={(e) => updateDrawerField("hotel_attrition_pct", e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Settlement Section */}
              {flags.settlement && drawerShow && !drawerShow.is_off && (
                <div style={{ borderBottom: "1px solid #f0f0f0", padding: "0 0 14px" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "#888", padding: "14px 0", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => setSettlementOpen(!settlementOpen)}>
                    Settlement
                    <span style={{ fontSize: 12, color: "#aaa" }}>{settlementOpen ? "\u25bc" : "\u25b6"}</span>
                  </div>
                  {settlementOpen && (
                    <SettlementPanel
                      show={{
                        id: drawerShow.id,
                        event: drawerShow.event || "",
                        date_iso: drawerShow.date_iso || "",
                        city: drawerShow.city || "",
                        venue: drawerShow.venue || "",
                        offer_amount: drawerShow.offer_amount || 0,
                        offer_currency: drawerShow.offer_currency || "USD",
                        deal: (drawerShow.deal as Record<string, unknown>) as never || null,
                        settlement: (drawerShow.settlement as Record<string, unknown>) as never || null,
                      }}
                      tourId={tourId}
                      currencyRates={tour?.currency_rates || {}}
                      onUpdate={(field, value) => {
                        setDrawerShow((prev) => prev ? { ...prev, [field]: value } : prev);
                      }}
                    />
                  )}
                </div>
              )}

              {/* Deposits Section */}
              {flags.depositTracking && drawerShow && !drawerShow.is_off && (
                <div style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <div
                    onClick={() => toggleSection("Deposits")}
                    style={{ padding: "14px 0", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "#888" }}>Deposits</div>
                      {(() => {
                        const ds = String((drawerShow as Record<string, unknown>).deposit_status || "");
                        if (!ds) return null;
                        const c = ds === "Received" ? "#1a6b3c" : ds === "Returned" ? "#c0392b" : ds === "Requested" ? "#b35c00" : "#888";
                        return <span style={{ width: 7, height: 7, borderRadius: "50%", background: c, display: "inline-block" }} />;
                      })()}
                    </div>
                    <span style={{ fontSize: 12, color: "#aaa" }}>{collapsedSections.has("Deposits") ? "\u25b6" : "\u25bc"}</span>
                  </div>
                  {!collapsedSections.has("Deposits") && (
                    <div style={{ paddingBottom: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      <div>
                        <label style={{ fontSize: 11, color: "#aaa", display: "block", marginBottom: 4 }}>Amount</label>
                        <input type="number" value={String((drawerShow as Record<string, unknown>).deposit_amount ?? "")} onChange={(e) => updateDrawerField("deposit_amount", e.target.value)} placeholder="0" style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "#aaa", display: "block", marginBottom: 4 }}>Currency</label>
                        <input value={String((drawerShow as Record<string, unknown>).deposit_currency ?? "USD")} onChange={(e) => updateDrawerField("deposit_currency", e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "#aaa", display: "block", marginBottom: 4 }}>Status</label>
                        {(() => {
                          const val = String((drawerShow as Record<string, unknown>).deposit_status || "Not Received");
                          const dotColor = val === "Received" ? "#1a6b3c" : val === "Returned" ? "#c0392b" : val === "Requested" ? "#b35c00" : "#888";
                          return (
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0 }} />
                              <select value={val} onChange={(e) => updateDrawerField("deposit_status", e.target.value)} style={{ flex: 1, padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, background: "#fff", outline: "none" }}>
                                {["Not Received", "Requested", "Received", "Returned"].map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                          );
                        })()}
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: "#aaa", display: "block", marginBottom: 4 }}>Collected By</label>
                        <input value={String((drawerShow as Record<string, unknown>).deposit_collected_by ?? "")} onChange={(e) => updateDrawerField("deposit_collected_by", e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }} />
                      </div>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <label style={{ fontSize: 11, color: "#aaa", display: "block", marginBottom: 4 }}>Notes</label>
                        <input value={String((drawerShow as Record<string, unknown>).deposit_notes ?? "")} onChange={(e) => updateDrawerField("deposit_notes", e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Advancing Section */}
              {flags.advancing && drawerShow && !drawerShow.is_off && (() => {
                const as = drawerShow.advance_status || "not_started";
                const statusColor = as === "confirmed" ? "#1a6b3c" : as.includes("escalated") || as.includes("bounced") ? "#c0392b" : as.includes("followup") || as.includes("final") ? "#b35c00" : as === "sent" ? "#1a5fa6" : "#888";
                const statusBg = as === "confirmed" ? "#e8f5e9" : as.includes("escalated") || as.includes("bounced") ? "#ffebee" : as.includes("followup") || as.includes("final") ? "#fff3e0" : as === "sent" ? "#e3f2fd" : "#f5f5f5";
                const statusLabel = as.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                const isPaused = !!(drawerShow as Record<string, unknown>).advance_auto_stop;

                return (
                <div style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <div
                    onClick={() => toggleSection("Advancing")}
                    style={{ padding: "14px 0", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "#888" }}>Advancing</div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: statusBg, color: statusColor }}>{statusLabel}</span>
                      {isPaused && <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#f5f5f5", color: "#888" }}>Paused</span>}
                    </div>
                    <span style={{ fontSize: 12, color: "#aaa" }}>{collapsedSections.has("Advancing") ? "\u25b6" : "\u25bc"}</span>
                  </div>
                  {!collapsedSections.has("Advancing") && (
                    <div style={{ paddingBottom: 14 }}>
                      {/* Timeline */}
                      {drawerShow.advance_sent_at && (
                        <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
                          Last sent: {new Date(drawerShow.advance_sent_at).toLocaleDateString()} to {drawerShow.advance_recipient_email}
                        </div>
                      )}
                      {drawerShow.advance_form_submitted_at && (
                        <div style={{ fontSize: 12, color: "#1a6b3c", marginBottom: 4, fontWeight: 600 }}>
                          Form submitted: {new Date(drawerShow.advance_form_submitted_at).toLocaleDateString()}
                          {drawerShow.advance_form_submitted_by ? ` by ${drawerShow.advance_form_submitted_by}` : ""}
                        </div>
                      )}

                      {/* Controls */}
                      <div style={{ display: "flex", gap: 6, marginBottom: 10, marginTop: 8 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, cursor: "pointer" }}>
                          <input type="checkbox" checked={isPaused} onChange={(e) => updateDrawerField("advance_auto_stop", e.target.checked ? "true" : "")} style={{ accentColor: "#111" }} />
                          Pause auto-advance
                        </label>
                        {as !== "confirmed" && (
                          <button
                            onClick={() => updateDrawerField("advance_status", "confirmed")}
                            style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #1a6b3c", background: "#fff", color: "#1a6b3c", fontWeight: 700, fontSize: 11, cursor: "pointer", marginLeft: 8 }}
                          >Mark Confirmed</button>
                        )}
                      </div>

                      {/* Send form */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                        <div>
                          <label style={{ fontSize: 11, color: "#aaa", display: "block", marginBottom: 4 }}>Recipient Email</label>
                          <input value={advanceEmail || drawerShow.advance_recipient_email || ""} onChange={(e) => setAdvanceEmail(e.target.value)} placeholder="promoter@venue.com" type="email" style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: "#aaa", display: "block", marginBottom: 4 }}>Recipient Name</label>
                          <input value={advanceName} onChange={(e) => setAdvanceName(e.target.value)} placeholder="Contact name" style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }} />
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <button onClick={() => sendAdvance(drawerShow.advance_sent_at ? "followup" : "initial")} disabled={advanceSending || !(advanceEmail.trim() || drawerShow.advance_recipient_email)} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", opacity: advanceSending ? 0.5 : 1 }}>
                          {advanceSending ? "Sending..." : drawerShow.advance_sent_at ? "Resend / Follow-up" : "Send Now"}
                        </button>
                        {drawerShow.advance_sent_at && (
                          <button onClick={() => sendAdvance("final")} disabled={advanceSending} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #c0392b", background: "#fff", color: "#c0392b", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Final Request</button>
                        )}
                        {advanceMsg && <span style={{ fontSize: 12, color: advanceMsg.includes("failed") ? "#c0392b" : "#1a6b3c", fontWeight: 600 }}>{advanceMsg}</span>}
                      </div>

                      {/* Advance form link */}
                      {drawerShow.advance_form_token && (
                        <div style={{ marginTop: 10 }}>
                          <label style={{ fontSize: 11, color: "#aaa", display: "block", marginBottom: 4 }}>Advance Form Link</label>
                          <div style={{ display: "flex", gap: 6 }}>
                            <input readOnly value={`${window.location.origin}/advance/${drawerShow.advance_form_token}`} style={{ flex: 1, padding: "6px 10px", border: "1px solid #eee", borderRadius: 8, fontSize: 11, fontFamily: "monospace", color: "#888", outline: "none" }} />
                            <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/advance/${drawerShow.advance_form_token}`)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #DDDDDD", background: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Copy</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                );
              })()}

              {/* Guest List Section */}
              {flags.guestList && drawerShow && !drawerShow.is_off && (
                <div style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <div
                    onClick={() => toggleSection("Guest List")}
                    style={{ padding: "14px 0", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "#888" }}>Guest List</div>
                      {guests.length > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#f0f0f0", color: "#666" }}>
                          {guests.reduce((s, g) => s + 1 + g.plus_ones, 0)} total
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: "#aaa" }}>{collapsedSections.has("Guest List") ? "\u25b6" : "\u25bc"}</span>
                  </div>
                  {!collapsedSections.has("Guest List") && (
                    <div style={{ paddingBottom: 14 }}>
                      {/* Guest list cutoff */}
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 11, color: "#aaa", display: "block", marginBottom: 4 }}>Guest List Cutoff</label>
                        <input
                          type="datetime-local"
                          value={String((drawerShow as Record<string, unknown>).guest_list_cutoff ?? "")}
                          onChange={(e) => updateDrawerField("guest_list_cutoff", e.target.value)}
                          style={{ padding: "6px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 12, outline: "none" }}
                        />
                      </div>

                      {guestLoading ? (
                        <div style={{ fontSize: 12, color: "#888" }}>Loading...</div>
                      ) : (
                        <>
                          {guests.length > 0 && (
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 10 }}>
                              <thead>
                                <tr>
                                  {["Name", "Party", "Pass", "Notes", "Status", ""].map((h) => (
                                    <th key={h} style={{ padding: "4px 6px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#aaa", borderBottom: "1px solid #eee" }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {guests.map((g) => {
                                  const stColor = g.status === "confirmed" ? "#1a6b3c" : g.status === "declined" ? "#c0392b" : "#b35c00";
                                  const stBg = g.status === "confirmed" ? "#e8f5e9" : g.status === "declined" ? "#ffebee" : "#fff3e0";
                                  return (
                                    <tr key={g.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                                      <td style={{ padding: "5px 6px", fontWeight: 600 }}>{g.guest_name}</td>
                                      <td style={{ padding: "5px 6px", fontFamily: "monospace" }}>{1 + g.plus_ones}</td>
                                      <td style={{ padding: "5px 6px" }}>{g.pass_type}</td>
                                      <td style={{ padding: "5px 6px", fontSize: 11, color: "#888", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={g.notes || ""}>{g.notes || "\u2014"}</td>
                                      <td style={{ padding: "5px 6px" }}>
                                        <select
                                          value={g.status}
                                          onChange={(e) => updateGuestStatus(g.id, e.target.value)}
                                          style={{ fontSize: 10, fontWeight: 700, padding: "2px 4px", borderRadius: 4, border: "none", background: stBg, color: stColor, cursor: "pointer", outline: "none" }}
                                        >
                                          {["pending", "confirmed", "declined"].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                        </select>
                                      </td>
                                      <td style={{ padding: "5px 6px" }}>
                                        <button onClick={() => deleteGuest(g.id)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 12, color: "#ccc", padding: "2px 4px" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#c0392b"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#ccc"; }}>&times;</button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}

                          {addingGuest ? (
                            <div className="td-guest-add-grid" style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 6, alignItems: "end" }}>
                              <div>
                                <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 2 }}>Name</label>
                                <input value={newGuest.name} onChange={(e) => setNewGuest((p) => ({ ...p, name: e.target.value }))} placeholder="Guest name" onKeyDown={(e) => e.key === "Enter" && addGuest()} style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: "1px solid #ddd", borderRadius: 6, fontSize: 12, outline: "none" }} />
                              </div>
                              <div style={{ width: 44 }}>
                                <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 2 }}>Party</label>
                                <input type="number" value={newGuest.plusOnes} onChange={(e) => setNewGuest((p) => ({ ...p, plusOnes: parseInt(e.target.value) || 0 }))} min={0} style={{ width: "100%", boxSizing: "border-box", padding: "6px 4px", border: "1px solid #ddd", borderRadius: 6, fontSize: 12, outline: "none" }} />
                              </div>
                              <div style={{ width: 80 }}>
                                <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 2 }}>Pass</label>
                                <select value={newGuest.passType} onChange={(e) => setNewGuest((p) => ({ ...p, passType: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", padding: "6px 4px", border: "1px solid #ddd", borderRadius: 6, fontSize: 12, background: "#fff", outline: "none" }}>
                                  {["Guest", "VIP", "Photo", "Working", "Will Call"].map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </div>
                              <div style={{ display: "flex", gap: 4 }}>
                                <button onClick={addGuest} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #111", background: "#111", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Add</button>
                                <button onClick={() => setAddingGuest(false)} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                              </div>
                              <div style={{ gridColumn: "1 / -1" }}>
                                <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 2 }}>Notes</label>
                                <input value={newGuest.notes} onChange={(e) => setNewGuest((p) => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: "1px solid #ddd", borderRadius: 6, fontSize: 12, outline: "none" }} />
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setAddingGuest(true)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+ Add Guest</button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ══════ Add Show Modal ══════ */}
      {showAddModal && (
        <>
          <div onClick={() => setShowAddModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 900 }} />
          <div className="td-add-modal" style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 480, maxWidth: "90vw", background: "#fff", borderRadius: 14, padding: 24, zIndex: 901, boxShadow: "0 12px 40px rgba(0,0,0,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Add Show</div>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>&times;</button>
            </div>
            <div className="td-add-modal-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Date</label>
                <input type="date" value={newShow.date_iso} onChange={(e) => setNewShow((p) => ({ ...p, date_iso: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Event Name</label>
                <input value={newShow.event} onChange={(e) => setNewShow((p) => ({ ...p, event: e.target.value }))} placeholder="Show name" style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Venue</label>
                <input value={newShow.venue} onChange={(e) => setNewShow((p) => ({ ...p, venue: e.target.value }))} placeholder="Venue name" style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>City</label>
                <input value={newShow.city} onChange={(e) => setNewShow((p) => ({ ...p, city: e.target.value }))} placeholder="City" style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Country</label>
                <input value={newShow.country} onChange={(e) => setNewShow((p) => ({ ...p, country: e.target.value }))} placeholder="USA" style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Offer Amount</label>
                <input type="number" value={newShow.offer_amount} onChange={(e) => setNewShow((p) => ({ ...p, offer_amount: e.target.value }))} placeholder="0" style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Currency</label>
                <select value={newShow.offer_currency} onChange={(e) => setNewShow((p) => ({ ...p, offer_currency: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, background: "#fff", outline: "none" }}>
                  {["USD", "EUR", "GBP", "CAD", "AUD", "CHF", "SEK", "NOK", "DKK"].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="td-add-modal-actions" style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setShowAddModal(false)} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #DDDDDD", background: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Cancel</button>
              <button onClick={saveNewShow} disabled={addingSaving} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 800, fontSize: 12, cursor: "pointer", opacity: addingSaving ? 0.5 : 1 }}>{addingSaving ? "Saving..." : "Add Show"}</button>
            </div>
          </div>
        </>
      )}

      {/* ══════ Delete Confirmation ══════ */}
      {deleteConfirmId && (
        <>
          <div onClick={() => setDeleteConfirmId(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 900 }} />
          <div className="td-delete-modal" style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 360, background: "#fff", borderRadius: 14, padding: 24, zIndex: 901, boxShadow: "0 12px 40px rgba(0,0,0,0.15)" }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Delete Show</div>
            <div style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>Are you sure? This cannot be undone.</div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={() => setDeleteConfirmId(null)} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #DDDDDD", background: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => deleteShow(deleteConfirmId)} style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid #c0392b", background: "#c0392b", color: "#fff", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </>
      )}
    </>
    </IntakeDropZone>
  );
}

// ── Sub-component for leg + show row ─────────────────────────

function LegAndShowRow({
  show, showNum, index, leg, flying, suggestFly, fromAP, toAP, sd,
  flightThreshold, onToggleLeg, onClickRow, driveColorBg, driveColor, formatShowDate,
  onDelete,
}: {
  show: ShowRow;
  showNum: number;
  index: number;
  leg: LegInfo | null;
  flying: boolean;
  suggestFly: boolean;
  fromAP: ReturnType<typeof getAirport>;
  toAP: ReturnType<typeof getAirport>;
  sd: { color: string; label: string };
  flightThreshold: number;
  onToggleLeg: (idx: number, choice: string) => void;
  onClickRow: (idx: number) => void;
  driveColorBg: (h: number | null) => string;
  driveColor: (h: number | null) => string;
  formatShowDate: (d: string | null) => string;
  onDelete: (id: string) => void;
}) {
  const hasAP = fromAP && toAP;
  const links = hasAP ? buildFlightLinks(fromAP.iata, toAP.iata) : null;

  return (
    <>
      {/* Drive leg row */}
      {leg && (
        <tr>
          <td colSpan={11} style={{ padding: 0, borderBottom: "1px solid #DDDDDD" }}>
            <div style={{
              padding: "8px 16px 8px 28px",
              background: driveColorBg(flying ? null : leg.driveH),
              display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
              fontSize: 12, color: "#666",
            }}>
              <span style={{ fontWeight: 600 }}>{leg.fromCity} &rarr; {leg.toCity}</span>
              {leg.dayGap > 1 && <span style={{ color: "#aaa" }}>(+{leg.dayGap - 1} day{leg.dayGap > 2 ? "s" : ""})</span>}
              {leg.driveH !== null && !flying && (
                <span style={{ fontWeight: 700, color: driveColor(leg.driveH) }}>{fmtHours(leg.driveH)}</span>
              )}
              {!flying && <span style={{ color: "#aaa" }}>{leg.distStr}</span>}
              {leg.driveH !== null && leg.driveH > 6 && !flying && (
                <span style={{ background: "#c0392b", color: "#fff", padding: "1px 8px", borderRadius: 4, fontSize: 10, fontWeight: 800 }}>BRUTAL</span>
              )}

              {/* Drive / Fly toggle */}
              <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
                <button
                  onClick={() => onToggleLeg(index, "drive")}
                  style={{
                    padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
                    border: !flying ? "1px solid #111" : "1px solid #DDDDDD",
                    background: !flying ? "#111" : "#fff",
                    color: !flying ? "#fff" : "#888",
                  }}
                >Drive</button>
                <button
                  onClick={() => onToggleLeg(index, "fly")}
                  style={{
                    padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
                    border: flying ? "1px solid #111" : "1px solid #DDDDDD",
                    background: flying ? "#111" : "#fff",
                    color: flying ? "#fff" : "#888",
                  }}
                >Fly</button>
              </div>

              {suggestFly && !flying && (
                <span style={{ fontSize: 11, color: "#b35c00" }}>Long drive — consider flying</span>
              )}

              {/* Flight info when flying */}
              {flying && hasAP && (
                <span style={{ fontSize: 11 }}>
                  {fromAP.iata} &rarr; {toAP.iata}
                  {links && (
                    <span style={{ marginLeft: 8 }}>
                      <a href={links.google} target="_blank" rel="noopener noreferrer" style={{ color: "#1a5fa6", marginRight: 6, textDecoration: "none" }}>Google</a>
                      <a href={links.skyscanner} target="_blank" rel="noopener noreferrer" style={{ color: "#1a5fa6", marginRight: 6, textDecoration: "none" }}>Skyscanner</a>
                      <a href={links.kiwi} target="_blank" rel="noopener noreferrer" style={{ color: "#1a5fa6", textDecoration: "none" }}>Kiwi</a>
                    </span>
                  )}
                </span>
              )}
            </div>
          </td>
        </tr>
      )}

      {/* Show row */}
      <tr
        onClick={() => onClickRow(index)}
        style={{
          cursor: "pointer",
          background: show.is_off ? "#fafaf8" : "#fff",
          color: show.is_off ? "#aaa" : "#111",
          borderBottom: "1px solid #DDDDDD",
        }}
        onMouseEnter={(e) => { if (!show.is_off) (e.currentTarget as HTMLElement).style.background = "#f8f8f6"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = show.is_off ? "#fafaf8" : "#fff"; }}
      >
        <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12, color: "#888" }}>
          {show.is_off ? "\u2014" : showNum}
        </td>
        <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12, whiteSpace: "nowrap" }}>
          {formatShowDate(show.date_iso)}
        </td>
        <td style={{ padding: "10px 12px" }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{show.is_off ? <em>OFF DAY</em> : (show.event || show.venue || "\u2014")}</div>
          {show.event && show.venue && <div style={{ fontSize: 13, color: "#222" }}>{show.venue}</div>}
        </td>
        <td style={{ padding: "10px 12px", fontSize: 13 }}>{show.city || "\u2014"}</td>
        <td style={{ padding: "10px 12px", fontSize: 12 }}>{show.country || "\u2014"}</td>
        <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 13 }}>
          {show.is_off ? "\u2014" : (show.offer_display || "\u2014")}
        </td>
        <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 13, color: show.offer_amount ? "#1a6b3c" : "#aaa" }}>
          {show.is_off ? "\u2014" : (show.offer_amount ? fmtUSD(show.offer_amount) : "\u2014")}
        </td>
        <td style={{ padding: "10px 12px" }}>
          {sd.label && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: sd.color, display: "inline-block" }} />
              {sd.label}
            </span>
          )}
        </td>
        <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12 }}>
          {show.capacity ? show.capacity.toLocaleString() : "\u2014"}
        </td>
        <td style={{ padding: "10px 8px", textAlign: "center" }}>
          {!show.is_off && show.advance_status === "submitted" && (
            <span title="Advance submitted" style={{ fontSize: 14 }}>{"\u2705"}</span>
          )}
          {!show.is_off && show.advance_status && show.advance_status.includes("sent") && show.advance_status !== "submitted" && (
            <span title="Advance sent" style={{ fontSize: 14 }}>{"\u2709\uFE0F"}</span>
          )}
        </td>
        <td style={{ padding: "10px 4px", textAlign: "center" }}>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(show.id); }}
            title="Delete show"
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#ccc", padding: "2px 6px", borderRadius: 4 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#c0392b"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#ccc"; }}
          >&times;</button>
        </td>
      </tr>
    </>
  );
}
