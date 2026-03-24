"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  type TourShow,
  type FinancialResults,
  type VehicleType,
} from "@/lib/tourrouter";

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
    title: "Venue",
    fields: [
      { key: "venue", label: "Venue Name" },
      { key: "capacity", label: "Capacity", type: "number" },
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
    title: "Financials",
    fields: [
      { key: "offer_display", label: "Offer" },
      { key: "offer_currency", label: "Currency" },
      { key: "backend", label: "Backend / Deal Terms" },
      { key: "status", label: "Status" },
    ],
  },
  {
    title: "Contacts",
    fields: [
      { key: "promoter", label: "Promoter" },
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
  const [tour, setTour] = useState<TourData | null>(null);
  const [shows, setShows] = useState<ShowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [legChoices, setLegChoices] = useState<Record<number, string>>({});
  const [financials, setFinancials] = useState<FinancialResults | null>(null);
  const [legs, setLegs] = useState<(LegInfo | null)[]>([]);

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

  // Guest List
  type GuestEntry = { id: string; guest_name: string; plus_ones: number; pass_type: string; status: string; submitted_by: string | null; notes: string | null };
  const [guests, setGuests] = useState<GuestEntry[]>([]);
  const [guestLoading, setGuestLoading] = useState(false);
  const [addingGuest, setAddingGuest] = useState(false);
  const [newGuest, setNewGuest] = useState({ name: "", plusOnes: 0, passType: "GA", notes: "" });

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
      const km = getRoadKm(prev.city, prev.country, s.city, s.country);
      const driveH = km ? estimateDriveHours(km) : null;
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
    });
    setFinancials(fin);
  }, [shows, tour, legChoices]);

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
      setNewGuest({ name: "", plusOnes: 0, passType: "GA", notes: "" });
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

  function updateDrawerField(key: string, value: string) {
    if (!drawerShow) return;
    const updated = { ...drawerShow, [key]: key === "capacity" ? (parseInt(value) || 0) : value };
    setDrawerShow(updated);
    // Debounce save
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch(`/api/tourrouter/tours/${tourId}/shows/${drawerShow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: key === "capacity" ? (parseInt(value) || 0) : value }),
      }).then(() => {
        // Update local shows array
        setShows((prev) => prev.map((s, i) => i === drawerIdx ? { ...s, [key]: key === "capacity" ? (parseInt(value) || 0) : value } : s));
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
    { num: 3, label: "Financials", href: `/dashboard/routing/${tourId}/financials`, active: false },
    { num: 4, label: "Export", href: `/dashboard/routing/${tourId}/export`, active: false },
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

  // ── Render ─────────────────────────────────────────────────

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
              <div className="brand-title" style={{ margin: 0, fontSize: "360%" }}>{loading ? "\u2014" : tour?.name?.toUpperCase() || "TOUR"}</div>
            </div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "#fff", border: "1px solid #DDDDDD", borderRadius: 12, padding: 8 }}>
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
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 20 }}>
          {statCards.map((card) => (
            <div key={card.label} style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>{card.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "monospace", color: card.color || "#111" }}>{card.value}</div>
            </div>
          ))}
        </div>

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
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["#", "Date", "Event / Venue", "City", "Country", "Offer", "USD", "Status", "Cap", "Adv"].map((h) => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "2px solid #DDDDDD", whiteSpace: "nowrap", background: "#fafaf8" }}>{h}</th>
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
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ══════ Slide Drawer ══════ */}
      {drawerShow !== null && (
        <>
          <div onClick={closeDrawer} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 900 }} />
          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0, width: 460, maxWidth: "90vw",
            background: "#fff", zIndex: 901, overflowY: "auto",
            boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
            animation: "slideIn 0.25s ease-out",
          }}>
            <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
            {/* Drawer header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #DDDDDD", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{drawerShow.event || "Show Detail"}</div>
                  <div style={{ fontSize: 13, color: "#888" }}>
                    {[formatShowDate(drawerShow.date_iso), drawerShow.city, drawerShow.country].filter(Boolean).join(" \u00b7 ")}
                  </div>
                </div>
                <button onClick={closeDrawer} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888", padding: "4px 8px" }}>&times;</button>
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
                          <div key={field.key} style={{ gridColumn: field.key === "notes" || field.key === "backend" ? "1 / -1" : undefined }}>
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

              {/* Advancing Section */}
              {drawerShow && !drawerShow.is_off && (
                <div style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <div
                    onClick={() => toggleSection("Advancing")}
                    style={{ padding: "14px 0", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "#888" }}>Advancing</div>
                      {drawerShow.advance_status && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                          background: drawerShow.advance_status === "submitted" ? "#e8f5e9" : drawerShow.advance_status?.includes("sent") ? "#fff3e0" : "#f5f5f5",
                          color: drawerShow.advance_status === "submitted" ? "#1a6b3c" : drawerShow.advance_status?.includes("sent") ? "#b35c00" : "#888",
                        }}>{drawerShow.advance_status === "submitted" ? "Submitted" : drawerShow.advance_status?.includes("sent") ? "Sent" : drawerShow.advance_status}</span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: "#aaa" }}>{collapsedSections.has("Advancing") ? "\u25b6" : "\u25bc"}</span>
                  </div>
                  {!collapsedSections.has("Advancing") && (
                    <div style={{ paddingBottom: 14 }}>
                      {/* Status info */}
                      {drawerShow.advance_sent_at && (
                        <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
                          Sent: {new Date(drawerShow.advance_sent_at).toLocaleDateString()} to {drawerShow.advance_recipient_email}
                        </div>
                      )}
                      {drawerShow.advance_form_submitted_at && (
                        <div style={{ fontSize: 12, color: "#1a6b3c", marginBottom: 8, fontWeight: 600 }}>
                          Form submitted: {new Date(drawerShow.advance_form_submitted_at).toLocaleDateString()}
                          {drawerShow.advance_form_submitted_by ? ` by ${drawerShow.advance_form_submitted_by}` : ""}
                        </div>
                      )}

                      {/* Send form */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                        <div>
                          <label style={{ fontSize: 11, color: "#aaa", display: "block", marginBottom: 4 }}>Recipient Email</label>
                          <input
                            value={advanceEmail || drawerShow.advance_recipient_email || ""}
                            onChange={(e) => setAdvanceEmail(e.target.value)}
                            placeholder="promoter@venue.com"
                            type="email"
                            style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: "#aaa", display: "block", marginBottom: 4 }}>Recipient Name</label>
                          <input
                            value={advanceName}
                            onChange={(e) => setAdvanceName(e.target.value)}
                            placeholder="Contact name"
                            style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, outline: "none" }}
                          />
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <button
                          onClick={() => sendAdvance(drawerShow.advance_sent_at ? "followup" : "initial")}
                          disabled={advanceSending || !(advanceEmail.trim() || drawerShow.advance_recipient_email)}
                          style={{
                            padding: "8px 16px", borderRadius: 8, border: "1px solid #111",
                            background: "#111", color: "#fff", fontWeight: 700, fontSize: 12,
                            cursor: "pointer", opacity: advanceSending ? 0.5 : 1,
                          }}
                        >{advanceSending ? "Sending..." : drawerShow.advance_sent_at ? "Resend / Follow-up" : "Send Advance"}</button>

                        {drawerShow.advance_sent_at && (
                          <button
                            onClick={() => sendAdvance("final")}
                            disabled={advanceSending}
                            style={{
                              padding: "8px 16px", borderRadius: 8, border: "1px solid #c0392b",
                              background: "#fff", color: "#c0392b", fontWeight: 700, fontSize: 12, cursor: "pointer",
                            }}
                          >Final Request</button>
                        )}

                        {advanceMsg && <span style={{ fontSize: 12, color: advanceMsg.includes("failed") ? "#c0392b" : "#1a6b3c", fontWeight: 600 }}>{advanceMsg}</span>}
                      </div>

                      {/* Advance form link */}
                      {drawerShow.advance_form_token && (
                        <div style={{ marginTop: 10 }}>
                          <label style={{ fontSize: 11, color: "#aaa", display: "block", marginBottom: 4 }}>Advance Form Link</label>
                          <div style={{ display: "flex", gap: 6 }}>
                            <input
                              readOnly
                              value={`${window.location.origin}/advance/${drawerShow.advance_form_token}`}
                              style={{ flex: 1, padding: "6px 10px", border: "1px solid #eee", borderRadius: 8, fontSize: 11, fontFamily: "monospace", color: "#888", outline: "none" }}
                            />
                            <button
                              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/advance/${drawerShow.advance_form_token}`)}
                              style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #DDDDDD", background: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                            >Copy</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Guest List Section */}
              {drawerShow && !drawerShow.is_off && (
                <div style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <div
                    onClick={() => toggleSection("Guest List")}
                    style={{ padding: "14px 0", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: "#888" }}>Guest List</div>
                      {guests.length > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#f0f0f0", color: "#666" }}>
                          {guests.length} guest{guests.length !== 1 ? "s" : ""} + {guests.reduce((s, g) => s + g.plus_ones, 0)} = {guests.reduce((s, g) => s + 1 + g.plus_ones, 0)} total
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 12, color: "#aaa" }}>{collapsedSections.has("Guest List") ? "\u25b6" : "\u25bc"}</span>
                  </div>
                  {!collapsedSections.has("Guest List") && (
                    <div style={{ paddingBottom: 14 }}>
                      {guestLoading ? (
                        <div style={{ fontSize: 12, color: "#888" }}>Loading...</div>
                      ) : (
                        <>
                          {guests.length > 0 && (
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 10 }}>
                              <thead>
                                <tr>
                                  {["Name", "+", "Pass", "Status", ""].map((h) => (
                                    <th key={h} style={{ padding: "4px 6px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#aaa", borderBottom: "1px solid #eee" }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {guests.map((g) => (
                                  <tr key={g.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                                    <td style={{ padding: "5px 6px", fontWeight: 600 }}>{g.guest_name}</td>
                                    <td style={{ padding: "5px 6px", fontFamily: "monospace" }}>{g.plus_ones}</td>
                                    <td style={{ padding: "5px 6px" }}>{g.pass_type}</td>
                                    <td style={{ padding: "5px 6px" }}>
                                      <span style={{
                                        fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4,
                                        background: g.status === "approved" ? "#e8f5e9" : g.status === "denied" ? "#ffebee" : "#fff3e0",
                                        color: g.status === "approved" ? "#1a6b3c" : g.status === "denied" ? "#c0392b" : "#b35c00",
                                      }}>{g.status}</span>
                                    </td>
                                    <td style={{ padding: "5px 6px", whiteSpace: "nowrap" }}>
                                      {g.status !== "approved" && (
                                        <button onClick={() => updateGuestStatus(g.id, "approved")} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 12, color: "#1a6b3c", fontWeight: 700, marginRight: 4 }}>&#10003;</button>
                                      )}
                                      {g.status !== "denied" && (
                                        <button onClick={() => updateGuestStatus(g.id, "denied")} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 12, color: "#c0392b", fontWeight: 700, marginRight: 4 }}>&#10007;</button>
                                      )}
                                      <button onClick={() => deleteGuest(g.id)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 10, color: "#aaa" }}>&times;</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}

                          {addingGuest ? (
                            <div style={{ display: "flex", gap: 6, alignItems: "flex-end", flexWrap: "wrap" }}>
                              <div style={{ flex: 1, minWidth: 100 }}>
                                <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 2 }}>Name</label>
                                <input value={newGuest.name} onChange={(e) => setNewGuest((p) => ({ ...p, name: e.target.value }))} placeholder="Guest name" style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: "1px solid #ddd", borderRadius: 6, fontSize: 12, outline: "none" }} />
                              </div>
                              <div style={{ width: 40 }}>
                                <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 2 }}>+</label>
                                <input type="number" value={newGuest.plusOnes} onChange={(e) => setNewGuest((p) => ({ ...p, plusOnes: parseInt(e.target.value) || 0 }))} min={0} style={{ width: "100%", boxSizing: "border-box", padding: "6px 4px", border: "1px solid #ddd", borderRadius: 6, fontSize: 12, outline: "none" }} />
                              </div>
                              <div style={{ width: 70 }}>
                                <label style={{ fontSize: 10, color: "#aaa", display: "block", marginBottom: 2 }}>Pass</label>
                                <select value={newGuest.passType} onChange={(e) => setNewGuest((p) => ({ ...p, passType: e.target.value }))} style={{ width: "100%", boxSizing: "border-box", padding: "6px 4px", border: "1px solid #ddd", borderRadius: 6, fontSize: 12, background: "#fff", outline: "none" }}>
                                  {["GA", "VIP", "AAA", "Photo", "Press"].map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                              </div>
                              <button onClick={addGuest} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #111", background: "#111", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Add</button>
                              <button onClick={() => setAddingGuest(false)} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
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
    </div>
  );
}

// ── Sub-component for leg + show row ─────────────────────────

function LegAndShowRow({
  show, showNum, index, leg, flying, suggestFly, fromAP, toAP, sd,
  flightThreshold, onToggleLeg, onClickRow, driveColorBg, driveColor, formatShowDate,
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
}) {
  const hasAP = fromAP && toAP;
  const links = hasAP ? buildFlightLinks(fromAP.iata, toAP.iata) : null;

  return (
    <>
      {/* Drive leg row */}
      {leg && (
        <tr>
          <td colSpan={10} style={{ padding: 0, borderBottom: "1px solid #DDDDDD" }}>
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
          <div style={{ fontWeight: 600, fontSize: 13 }}>{show.is_off ? <em>OFF DAY</em> : (show.event || "\u2014")}</div>
          {show.venue && <div style={{ fontSize: 11, color: "#888" }}>{show.venue}</div>}
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
      </tr>
    </>
  );
}
