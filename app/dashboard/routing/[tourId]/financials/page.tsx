"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  calcTourFinancials,
  fmtUSD,
  fmtHours,
  getRate,
  toUSD,
  getRoadKm,
  estimateDriveHours,
  legCountry,
  formatDateDisplay,
  prefetchDriveData,
  buildDriveDataKey,
  type TourShow,
  type FinancialResults,
  type VehicleType,
  type DriveDataMap,
} from "@/lib/tourrouter";
import type { TourVehicle } from "@/lib/tourrouter/vehicleTypes";
import { useFeatureFlags } from "@/lib/tourrouter/FeatureFlagContext";

// ── Types ────────────────────────────────────────────────────

type TourData = {
  id: string;
  name: string;
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
  tour_commissions: Record<string, unknown>[] | null;
  tour_vehicles: Record<string, unknown>[] | null;
  tour_roster: Record<string, unknown>[] | null;
  lodging_defaults: Record<string, unknown> | null;
  hotel_budget_override: number | null;
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
  merch: string | null;
  backend: string | null;
  promoter: string | null;
  notes: string | null;
  support: string | null;
  hotel_cost_actual: number | null;
  hotel_rate: number | null;
  hotel_rooms: number | null;
  hotel_checkin: string | null;
  hotel_checkout: string | null;
};

// ── Component ────────────────────────────────────────────────

export default function FinancialsPage() {
  const { tourId } = useParams<{ tourId: string }>();
  const flags = useFeatureFlags();

  const [tour, setTour] = useState<TourData | null>(null);
  const [shows, setShows] = useState<ShowRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Editable settings
  const [blanketShowAmt, setBlanketShowAmt] = useState(0);
  const [blanketOffAmt, setBlanketOffAmt] = useState(0);
  const [blanketShowLabel, setBlanketShowLabel] = useState("Band Pay");
  const [blanketOffLabel, setBlanketOffLabel] = useState("Hotel + Per Diem");
  const [showExpenses, setShowExpenses] = useState<Record<number, number>>({});
  const [rates, setRates] = useState<Record<string, number>>({});
  const [ratesLoading, setRatesLoading] = useState(false);

  // Expenses
  type Expense = { id: string; date: string; category: string; amount: number; currency: string; description: string | null; paid_by: string | null; needs_reimbursement: boolean; receipt_url: string | null };
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [expFilter, setExpFilter] = useState("All");
  const [addingExp, setAddingExp] = useState(false);
  const [newExp, setNewExp] = useState({ date: "", category: "Transport", amount: "", currency: "USD", description: "", paidBy: "", needsReimbursement: false, receiptUrl: "" });

  // Drive data
  const [driveData, setDriveData] = useState<DriveDataMap>({});

  // Computed
  const [fin, setFin] = useState<FinancialResults | null>(null);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Fetch ──────────────────────────────────────────────────

  useEffect(() => {
    fetch(`/api/tourrouter/tours/${tourId}`)
      .then((r) => r.json())
      .then((data) => {
        setTour(data.tour);
        setShows(data.shows || []);
        if (data.tour) {
          setBlanketShowAmt(data.tour.blanket_show_amount || 0);
          setBlanketOffAmt(data.tour.blanket_off_amount || 0);
          setBlanketShowLabel(data.tour.blanket_show_label || "Band Pay");
          setBlanketOffLabel(data.tour.blanket_off_label || "Hotel + Per Diem");
          setRates(data.tour.currency_rates || {});
        }
        setLoading(false);
        // Fetch expenses
        fetch(`/api/tourrouter/expenses?tourId=${tourId}`)
          .then((r) => r.json())
          .then((d) => setExpenses(d.expenses || []))
          .catch(() => {});
      })
      .catch(() => setLoading(false));
  }, [tourId]);

  // ── Prefetch Mapbox drive data ───────────────────────────────

  useEffect(() => {
    if (shows.length < 2) return;
    const showPairs = shows.map((s) => ({ city: s.city || "", country: s.country || "", isOff: s.is_off }));
    prefetchDriveData(showPairs).then(setDriveData);
  }, [shows]);

  // ── Compute financials — SINGLE SOURCE OF TRUTH ────────────

  const compute = useCallback(() => {
    if (!shows.length || !tour) return;

    const legChoices: Record<number, string> = {};
    if (tour.leg_choices) {
      for (const [k, v] of Object.entries(tour.leg_choices)) {
        legChoices[parseInt(k)] = v as string;
      }
    }

    const tourShows: TourShow[] = shows.map((s) => ({
      date: s.date_iso ? new Date(s.date_iso + "T00:00:00") : null,
      event: s.event || "",
      city: s.city || "",
      country: s.country || "",
      countryNorm: s.country_norm || "",
      venue: s.venue || "",
      offer: { amount: s.offer_amount || 0, currency: s.offer_currency || "USD", display: s.offer_display || "" },
      usd: 0,
      capacity: s.capacity || 0,
      status: s.status || "",
      isOff: s.is_off,
      backend: s.backend || undefined,
      doors: s.doors || undefined,
      showtime: s.showtime || undefined,
      merch: s.merch || undefined,
      hotelCostActual: s.hotel_cost_actual || null,
      hotelRate: s.hotel_rate || null,
      hotelRooms: s.hotel_rooms || null,
      hotelCheckin: s.hotel_checkin || null,
      hotelCheckout: s.hotel_checkout || null,
    }));

    const result = calcTourFinancials({
      tourShows,
      legChoices,
      showExpenses,
      rates,
      pax: tour.pax || 4,
      flightThreshold: tour.flight_threshold_h || 6,
      blanketShowAmt,
      blanketOffAmt,
      blanketShowLabel,
      blanketOffLabel,
      vehicleType: tour.vehicle_type || "van",
      vehicleCount: 1,
      fuelPriceOverride: tour.fuel_price_usd || null,
      tourVehicles: (tour.tour_vehicles as unknown as TourVehicle[] | undefined) ?? [],
      roster: (tour.tour_roster || []) as never[],
      flightPriceCache: {},
      commissions: (tour.tour_commissions || []) as never[],
      driveData,
      lodgingDefaults: (tour.lodging_defaults as any) || null,
      hotelBudgetOverride: tour.hotel_budget_override || null,
    });
    setFin(result);
  }, [shows, tour, blanketShowAmt, blanketOffAmt, blanketShowLabel, blanketOffLabel, showExpenses, rates, driveData]);

  useEffect(() => { compute(); }, [compute]);

  // ── Save helpers ───────────────────────────────────────────

  function debounceSaveTour(updates: Record<string, unknown>) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      fetch(`/api/tourrouter/tours/${tourId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
    }, 600);
  }

  function onBlanketShowAmtChange(val: string) {
    const n = parseFloat(val) || 0;
    setBlanketShowAmt(n);
    debounceSaveTour({ blanket_show_amount: n });
  }

  function onBlanketOffAmtChange(val: string) {
    const n = parseFloat(val) || 0;
    setBlanketOffAmt(n);
    debounceSaveTour({ blanket_off_amount: n });
  }

  function onBlanketShowLabelChange(val: string) {
    setBlanketShowLabel(val);
    debounceSaveTour({ blanket_show_label: val });
  }

  function onBlanketOffLabelChange(val: string) {
    setBlanketOffLabel(val);
    debounceSaveTour({ blanket_off_label: val });
  }

  function onShowExpenseChange(idx: number, val: string) {
    const n = parseFloat(val) || 0;
    setShowExpenses((prev) => ({ ...prev, [idx]: n }));
  }

  function onRateChange(currency: string, val: string) {
    const n = parseFloat(val) || 1;
    const next = { ...rates, [currency]: n };
    setRates(next);
    debounceSaveTour({ currency_rates: next });
  }

  async function fetchLiveRates() {
    setRatesLoading(true);
    try {
      const resp = await fetch("/api/tourrouter/currency-rates");
      if (resp.ok) {
        const data = await resp.json();
        setRates(data.rates);
        debounceSaveTour({ currency_rates: data.rates });
      }
    } catch { /* ignore */ }
    setRatesLoading(false);
  }

  // ── Per-show breakdown data ────────────────────────────────

  const showOnlyRows = shows.filter((s) => !s.is_off);
  const perShowData = showOnlyRows.map((s, idx) => {
    const globalIdx = shows.indexOf(s);
    const usd = toUSD(
      { amount: s.offer_amount || 0, currency: s.offer_currency || "USD" },
      rates,
    );
    const expenses = blanketShowAmt + (showExpenses[globalIdx] || 0);
    const net = usd - expenses;
    return { show: s, globalIdx, usd, expenses, net, manualExp: showExpenses[globalIdx] || 0 };
  });

  // ── Transport breakdown ────────────────────────────────────

  const legChoicesMap: Record<number, string> = {};
  if (tour?.leg_choices) {
    for (const [k, v] of Object.entries(tour.leg_choices)) {
      legChoicesMap[parseInt(k)] = v as string;
    }
  }

  let driveLegs = 0, flyLegs = 0, totalDriveKm = 0, totalDriveH = 0;
  shows.forEach((s, i) => {
    if (i === 0) return;
    const prev = shows[i - 1];
    const driveKey = buildDriveDataKey(prev.city || "", s.city || "");
    const cached = driveData[driveKey];
    const km = cached ? cached.distanceKm : getRoadKm(prev.city, prev.country, s.city, s.country);
    if (legChoicesMap[i] === "fly") {
      flyLegs++;
    } else {
      driveLegs++;
      if (km) {
        totalDriveKm += km;
        const h = cached ? cached.driveHours : estimateDriveHours(km);
        if (h) totalDriveH += h;
      }
    }
  });

  // ── Expense CRUD ────────────────────────────────────────────

  const CATEGORIES = ["Transport", "Accommodation", "Food", "Gear", "Misc", "Merch", "Promo", "Other"];

  async function addExpense() {
    if (!newExp.amount || !tourId) return;
    const resp = await fetch("/api/tourrouter/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tourId, date: newExp.date || new Date().toISOString().split("T")[0],
        category: newExp.category, amount: newExp.amount, currency: newExp.currency,
        description: newExp.description, paidBy: newExp.paidBy,
        needsReimbursement: newExp.needsReimbursement, receiptUrl: newExp.receiptUrl,
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      setExpenses((prev) => [...prev, data.expense]);
      setNewExp({ date: "", category: "Transport", amount: "", currency: "USD", description: "", paidBy: "", needsReimbursement: false, receiptUrl: "" });
      setAddingExp(false);
    }
  }

  async function deleteExpense(id: string) {
    await fetch(`/api/tourrouter/expenses/${id}`, { method: "DELETE" });
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  const filteredExpenses = expFilter === "All" ? expenses : expenses.filter((e) => e.category === expFilter);
  const expTotalByCategory: Record<string, number> = {};
  expenses.forEach((e) => { expTotalByCategory[e.category] = (expTotalByCategory[e.category] || 0) + e.amount; });
  const expGrandTotal = expenses.reduce((s, e) => s + e.amount, 0);

  // ── Nav ────────────────────────────────────────────────────

  const navItems = [
    { num: 1, label: "Import", href: `/dashboard/routing/${tourId}/import`, active: false },
    { num: 2, label: "Route", href: `/dashboard/routing/${tourId}`, active: false },
    { num: 3, label: "Financials", href: `/dashboard/routing/${tourId}/financials`, active: true },
    { num: 4, label: "Export", href: `/dashboard/routing/${tourId}/export`, active: false },
  ];

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="fade-in" style={{ minHeight: "100vh", padding: "32px 24px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "3px solid var(--hw-border-strong)" }}>
          <Link href={`/dashboard/routing/${tourId}`} style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-muted)", textDecoration: "none", display: "inline-block", marginBottom: 8 }}>&larr; BACK TO TOUR</Link>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontFamily: "var(--hw-font-display)", fontSize: 28, letterSpacing: "4px", color: "var(--hw-crimson)", margin: 0, marginBottom: 4, paddingBottom: 8 }}>HWY61</h1>
              <div style={{ borderBottom: "3px solid var(--hw-border-strong)", marginBottom: 6 }} />
              <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 48, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text)", margin: 0 }}>{tour?.name?.toUpperCase() || "TOUR"}</div>
            </div>
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 8 }}>
                {navItems.map((item) => (
                  <Link key={item.num} href={item.href} style={{
                    padding: "10px 18px",
                    border: item.active ? "3px solid var(--hw-border-strong)" : "3px solid transparent",
                    background: item.active ? "var(--hw-bg-invert)" : "var(--hw-bg-surface)",
                    color: item.active ? "var(--hw-text-invert)" : "var(--hw-text)",
                    textDecoration: "none", fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: item.active ? 700 : 400,
                    letterSpacing: "1.5px", textTransform: "uppercase",
                  }}>{item.num}. {item.label}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {loading || !fin ? (
          <div style={{ textAlign: "center", padding: 60, fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text-muted)" }}>LOADING...</div>
        ) : !flags.financeLayer ? (
          <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 48, textAlign: "center" }}>
            <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 24, letterSpacing: "2px", textTransform: "uppercase", fontWeight: 800, marginBottom: 8 }}>Financial Tools</div>
            <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 13, color: "var(--hw-text-muted)", marginBottom: 20 }}>Detailed financial tracking, expense management, and reporting are available with TourRouter.</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, maxWidth: 500, margin: "0 auto", marginBottom: 24 }}>
              <div style={{ background: "var(--hw-bg-warm)", padding: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--hw-text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Shows</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{fin.showDayCount}</div>
              </div>
              <div style={{ background: "var(--hw-bg-warm)", padding: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--hw-text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Income</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--hw-green)" }}>{fmtUSD(fin.totalIncome)}</div>
              </div>
              <div style={{ background: "var(--hw-bg-warm)", padding: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "var(--hw-text-muted)", textTransform: "uppercase", marginBottom: 4 }}>Est. Fuel</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--hw-crimson)" }}>{fmtUSD(fin.totalFuel)}</div>
              </div>
            </div>
            <a href="https://hwy61labs.com" target="_blank" rel="noopener noreferrer" style={{ padding: "10px 24px", border: "3px solid var(--hw-bg-invert)", background: "var(--hw-bg-invert)", color: "var(--hw-text-invert)", textDecoration: "none", fontFamily: "var(--hw-font-display)", fontWeight: 900, fontSize: 13, letterSpacing: "3px", textTransform: "uppercase" }}>Upgrade to TourRouter</a>
          </div>
        ) : (
          <>
            {/* ══════ Summary Cards ══════ */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Total Income", value: fmtUSD(fin.totalIncome), color: "var(--hw-green)" },
                { label: "Total Expenses", value: fmtUSD(fin.totalExpenses), color: "var(--hw-crimson)" },
                { label: "Net Profit", value: fmtUSD(fin.netIncome), color: fin.netIncome >= 0 ? "var(--hw-green)" : "var(--hw-crimson)" },
                { label: "Margin", value: fin.margin.toFixed(1) + "%", color: fin.margin >= 0 ? "var(--hw-green)" : "var(--hw-crimson)" },
                { label: "Avg Per Show", value: fmtUSD(fin.avgPerShow) },
                { label: "Est. Fuel", value: fmtUSD(fin.totalFuel), color: "var(--hw-crimson)" },
              ].map((c) => (
                <div key={c.label} style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: "16px 20px" }}>
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, fontWeight: 400, color: "var(--hw-text-muted)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 28, letterSpacing: "1px", color: c.color || "var(--hw-text)" }}>{c.value}</div>
                </div>
              ))}
            </div>

            {/* ══════ Income Waterfall ══════ */}
            <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 20, marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, letterSpacing: "2px", textTransform: "uppercase", fontWeight: 700, marginBottom: 16 }}>Income Waterfall</div>
              {(() => {
                const gross = fin.totalIncome;
                const commTotal = fin.totalCommissions;
                const commItems = (fin.commissionResult as unknown as Record<string, unknown>)?.items as { label: string; recipientName: string; amountUSD: number; type: string }[] ?? [];
                const labelSupport = fin.labelSupportCredit;
                const expenses = fin.totalExpenses;
                const net = fin.netIncome;

                const fmt = (n: number) => `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

                const rowStyle = (isTotal?: boolean): React.CSSProperties => ({
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0", borderBottom: isTotal ? "3px solid var(--hw-border-strong)" : "2px solid var(--hw-border)",
                  fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300,
                  color: "var(--hw-text-secondary)",
                });
                const amtStyle = (negative?: boolean): React.CSSProperties => ({
                  fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 700,
                  color: negative ? "var(--hw-crimson)" : "var(--hw-green)",
                });
                const subRowStyle: React.CSSProperties = {
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "6px 0 6px 24px", fontFamily: "var(--hw-font-body)", fontSize: 13, fontWeight: 300,
                  color: "var(--hw-text-muted)", borderBottom: "1px solid var(--hw-border)",
                };

                return (
                  <>
                    <div style={rowStyle()}>
                      <span style={{ fontWeight: 600 }}>Gross Tour Income</span>
                      <span style={amtStyle()}>{fmt(gross)}</span>
                    </div>

                    {commItems.length > 0 && (
                      <>
                        <div style={rowStyle()}>
                          <span style={{ fontWeight: 600 }}>Commissions</span>
                          <span style={amtStyle(true)}>-{fmt(commTotal)}</span>
                        </div>
                        {commItems.filter((i) => i.type !== "label_support").map((item, idx) => (
                          <div key={idx} style={subRowStyle}>
                            <span>{item.label} ({item.recipientName})</span>
                            <span style={{ fontFamily: "var(--hw-font-mono)" }}>-{fmt(item.amountUSD)}</span>
                          </div>
                        ))}
                      </>
                    )}

                    {commTotal > 0 && (
                      <div style={rowStyle()}>
                        <span style={{ fontWeight: 600 }}>Income After Commissions</span>
                        <span style={amtStyle()}>{fmt(gross - commTotal)}</span>
                      </div>
                    )}

                    {labelSupport > 0 && (
                      <div style={rowStyle()}>
                        <span>Label Tour Support (credit)</span>
                        <span style={amtStyle()}>+{fmt(labelSupport)}</span>
                      </div>
                    )}

                    <div style={rowStyle()}>
                      <span style={{ fontWeight: 600 }}>Total Expenses</span>
                      <span style={amtStyle(true)}>-{fmt(expenses)}</span>
                    </div>

                    <div style={rowStyle(true)}>
                      <span style={{ fontSize: 16, fontWeight: 700 }}>Net to Artist</span>
                      <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 16, fontWeight: 700, color: net >= 0 ? "var(--hw-green)" : "var(--hw-crimson)" }}>
                        {net < 0 ? "-" : ""}{fmt(net)}
                      </span>
                    </div>

                    {gross > 0 && (
                      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8, fontSize: 13, color: "var(--hw-text-muted)" }}>
                        Margin: {((net / gross) * 100).toFixed(1)}%
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* ══════ Actual Expenses ══════ */}
            <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", overflow: "hidden", marginTop: 20 }}>
              <div style={{ padding: "16px 20px", borderBottom: "3px solid var(--hw-border-strong)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, letterSpacing: "2px", textTransform: "uppercase" }}>Actual Expenses</div>
                  <div style={{ fontSize: 12, color: "var(--hw-text-muted)", marginTop: 2 }}>{expenses.length} expense{expenses.length !== 1 ? "s" : ""} &middot; {fmtUSD(expGrandTotal)} total</div>
                </div>
                <button onClick={() => setAddingExp(true)} style={{ padding: "6px 14px", border: "3px solid var(--hw-crimson)", background: "var(--hw-crimson)", color: "var(--hw-text-invert)", fontFamily: "var(--hw-font-display)", fontSize: 12, letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer" }}>+ ADD EXPENSE</button>
              </div>

              {/* Category filters */}
              <div style={{ padding: "10px 20px", display: "flex", gap: 6, flexWrap: "wrap", borderTop: "2px solid var(--hw-border)" }}>
                {["All", ...CATEGORIES].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setExpFilter(cat)}
                    style={{
                      padding: "4px 12px", fontFamily: "var(--hw-font-mono)", fontSize: 9, fontWeight: 700,
                      letterSpacing: "1.5px", textTransform: "uppercase", cursor: "pointer",
                      border: expFilter === cat ? "3px solid var(--hw-border-strong)" : "3px solid var(--hw-border)",
                      background: expFilter === cat ? "var(--hw-bg-invert)" : "var(--hw-bg-surface)",
                      color: expFilter === cat ? "var(--hw-text-invert)" : "var(--hw-text-muted)",
                    }}
                  >{cat}{cat !== "All" && expTotalByCategory[cat] ? ` (${fmtUSD(expTotalByCategory[cat])})` : ""}</button>
                ))}
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--hw-bg-invert)" }}>
                      {["Date", "Category", "Description", "Amount", "Paid By", "Reimb.", ""].map((h) => (
                        <th key={h} style={{ padding: "12px 12px", textAlign: "left", fontFamily: "var(--hw-font-mono)", fontSize: 10, fontWeight: 700, color: "var(--hw-text-invert)", textTransform: "uppercase", letterSpacing: "2px", borderBottom: "2px solid var(--hw-border)", background: "var(--hw-bg-invert)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Add row */}
                    {addingExp && (
                      <tr style={{ borderTop: "2px solid var(--hw-border)", background: "var(--hw-bg-warm)" }}>
                        <td style={{ padding: "6px 8px" }}><input type="date" value={newExp.date} onChange={(e) => setNewExp((p) => ({ ...p, date: e.target.value }))} style={{ padding: "4px 6px", border: "3px solid var(--hw-border-strong)", fontSize: 12, outline: "none", width: 110 }} /></td>
                        <td style={{ padding: "6px 8px" }}>
                          <select value={newExp.category} onChange={(e) => setNewExp((p) => ({ ...p, category: e.target.value }))} style={{ padding: "4px 6px", border: "3px solid var(--hw-border-strong)", fontSize: 12, background: "var(--hw-bg-surface)", outline: "none" }}>
                            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: "6px 8px" }}><input value={newExp.description} onChange={(e) => setNewExp((p) => ({ ...p, description: e.target.value }))} placeholder="Description" style={{ padding: "4px 6px", border: "3px solid var(--hw-border-strong)", fontSize: 12, outline: "none", width: 140 }} /></td>
                        <td style={{ padding: "6px 8px" }}>
                          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: "var(--hw-text-muted)" }}>$</span>
                            <input type="number" value={newExp.amount} onChange={(e) => setNewExp((p) => ({ ...p, amount: e.target.value }))} placeholder="0" style={{ padding: "4px 6px", border: "3px solid var(--hw-border-strong)", fontSize: 12, fontFamily: "var(--hw-font-mono)", outline: "none", width: 70 }} />
                          </div>
                        </td>
                        <td style={{ padding: "6px 8px" }}><input value={newExp.paidBy} onChange={(e) => setNewExp((p) => ({ ...p, paidBy: e.target.value }))} placeholder="Who" style={{ padding: "4px 6px", border: "3px solid var(--hw-border-strong)", fontSize: 12, outline: "none", width: 80 }} /></td>
                        <td style={{ padding: "6px 8px" }}><input type="checkbox" checked={newExp.needsReimbursement} onChange={(e) => setNewExp((p) => ({ ...p, needsReimbursement: e.target.checked }))} /></td>
                        <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>
                          <button onClick={addExpense} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 12, color: "var(--hw-green)", fontWeight: 700 }}>Save</button>
                          <button onClick={() => setAddingExp(false)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 12, color: "var(--hw-text-muted)", marginLeft: 4 }}>Cancel</button>
                        </td>
                      </tr>
                    )}

                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id} style={{ borderTop: "2px solid var(--hw-border)" }}>
                        <td style={{ padding: "8px 12px", fontSize: 12, fontFamily: "var(--hw-font-mono)" }}>{exp.date}</td>
                        <td style={{ padding: "8px 12px", fontSize: 12 }}>
                          <span style={{ padding: "3px 10px", background: "var(--hw-bg-warm)", border: "2px solid var(--hw-border)", fontFamily: "var(--hw-font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>{exp.category}</span>
                        </td>
                        <td style={{ padding: "8px 12px", fontSize: 13 }}>{exp.description || "\u2014"}</td>
                        <td style={{ padding: "8px 12px", fontSize: 13, fontFamily: "var(--hw-font-mono)", fontWeight: 600, color: "var(--hw-crimson)" }}>{fmtUSD(exp.amount)}</td>
                        <td style={{ padding: "8px 12px", fontSize: 12 }}>{exp.paid_by || "\u2014"}</td>
                        <td style={{ padding: "8px 12px", fontSize: 12 }}>{exp.needs_reimbursement ? "Yes" : ""}</td>
                        <td style={{ padding: "8px 12px" }}>
                          <button onClick={() => deleteExpense(exp.id)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 12, color: "var(--hw-text-muted)" }}>&times;</button>
                        </td>
                      </tr>
                    ))}

                    {/* Totals */}
                    {expenses.length > 0 && (
                      <tr style={{ borderTop: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-warm)" }}>
                        <td colSpan={3} style={{ padding: "10px 12px", fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>Total</td>
                        <td style={{ padding: "10px 12px", fontSize: 14, fontFamily: "var(--hw-font-mono)", fontWeight: 800, color: "var(--hw-crimson)" }}>{fmtUSD(expFilter === "All" ? expGrandTotal : filteredExpenses.reduce((s, e) => s + e.amount, 0))}</td>
                        <td colSpan={3}></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {expenses.length === 0 && !addingExp && (
                <div style={{ padding: 32, textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 24, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text)", marginBottom: 8 }}>NO EXPENSES YET</div>
                  <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-text-muted)" }}>Click &quot;+ Add Expense&quot; to start tracking tour expenses.</div>
                </div>
              )}
            </div>

            {/* ══════ Section 1: Blanket Expenses ══════ */}
            <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 24, marginBottom: 20 }}>
              <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, letterSpacing: "2px", textTransform: "uppercase", fontWeight: 800, marginBottom: 16 }}>Blanket Expenses</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                {/* Per Show Day */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--hw-text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Per Show Day</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input
                      value={blanketShowLabel}
                      onChange={(e) => onBlanketShowLabelChange(e.target.value)}
                      placeholder="Label"
                      style={{ flex: 1, padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, outline: "none" }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <span style={{ fontSize: 13, color: "var(--hw-text-muted)" }}>$</span>
                      <input
                        type="number"
                        value={blanketShowAmt || ""}
                        onChange={(e) => onBlanketShowAmtChange(e.target.value)}
                        placeholder="0"
                        style={{ width: 80, padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-mono)", outline: "none" }}
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--hw-text-muted)" }}>
                    {blanketShowAmt > 0 ? `${fin.showDayCount} shows \u00d7 ${fmtUSD(blanketShowAmt)} = ${fmtUSD(fin.totalBlanketShow)}` : "No per-show expense set"}
                  </div>
                </div>

                {/* Per Off Day */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--hw-text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Per Off Day</div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input
                      value={blanketOffLabel}
                      onChange={(e) => onBlanketOffLabelChange(e.target.value)}
                      placeholder="Label"
                      style={{ flex: 1, padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, outline: "none" }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <span style={{ fontSize: 13, color: "var(--hw-text-muted)" }}>$</span>
                      <input
                        type="number"
                        value={blanketOffAmt || ""}
                        onChange={(e) => onBlanketOffAmtChange(e.target.value)}
                        placeholder="0"
                        style={{ width: 80, padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontSize: 13, fontFamily: "var(--hw-font-mono)", outline: "none" }}
                      />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--hw-text-muted)" }}>
                    {blanketOffAmt > 0 ? `${fin.offDayCount} off days \u00d7 ${fmtUSD(blanketOffAmt)} = ${fmtUSD(fin.totalBlanketOff)}` : "No per-off-day expense set"}
                  </div>
                </div>
              </div>
            </div>

            {/* ══════ Section 2: Per-Show Financial Table ══════ */}
            <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", overflow: "hidden", marginBottom: 20 }}>
              <div style={{ padding: "16px 20px", borderBottom: "3px solid var(--hw-border-strong)" }}>
                <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, letterSpacing: "2px", textTransform: "uppercase" }}>Per-Show Breakdown</div>
                <div style={{ fontSize: 12, color: "var(--hw-text-muted)", marginTop: 2 }}>{showOnlyRows.length} shows</div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--hw-bg-invert)" }}>
                      {["Date", "Venue", "City", "Offer", "Cur", "USD", "Expenses", "Net"].map((h) => (
                        <th key={h} style={{ padding: "12px 12px", textAlign: "left", fontFamily: "var(--hw-font-mono)", fontSize: 10, fontWeight: 700, color: "var(--hw-text-invert)", textTransform: "uppercase", letterSpacing: "2px", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {perShowData.map((row, i) => (
                      <tr key={row.show.id} style={{ borderTop: "2px solid var(--hw-border)" }}>
                        <td style={{ padding: "9px 12px", fontSize: 12, fontFamily: "var(--hw-font-mono)", whiteSpace: "nowrap" }}>
                          {row.show.date_iso ? formatDateDisplay(new Date(row.show.date_iso + "T00:00:00")) : "\u2014"}
                        </td>
                        <td style={{ padding: "9px 12px", fontSize: 13, fontWeight: 600 }}>{row.show.venue || "\u2014"}</td>
                        <td style={{ padding: "9px 12px", fontSize: 13 }}>{row.show.city || "\u2014"}</td>
                        <td style={{ padding: "9px 12px", fontSize: 13, fontFamily: "var(--hw-font-mono)" }}>{row.show.offer_display || "\u2014"}</td>
                        <td style={{ padding: "9px 12px", fontSize: 11, color: "var(--hw-text-muted)" }}>{row.show.offer_currency}</td>
                        <td style={{ padding: "9px 12px", fontSize: 13, fontFamily: "var(--hw-font-mono)", color: "var(--hw-green)", fontWeight: 600 }}>{fmtUSD(row.usd)}</td>
                        <td style={{ padding: "9px 12px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ fontSize: 12, color: "var(--hw-text-muted)" }}>$</span>
                            <input
                              type="number"
                              value={row.manualExp || ""}
                              onChange={(e) => onShowExpenseChange(row.globalIdx, e.target.value)}
                              placeholder="0"
                              style={{ width: 60, padding: "4px 6px", border: "3px solid var(--hw-border)", fontSize: 12, fontFamily: "var(--hw-font-mono)", outline: "none" }}
                            />
                            {blanketShowAmt > 0 && <span style={{ fontSize: 10, color: "var(--hw-text-muted)" }}>+{fmtUSD(blanketShowAmt)}</span>}
                          </div>
                        </td>
                        <td style={{ padding: "9px 12px", fontSize: 13, fontFamily: "var(--hw-font-mono)", fontWeight: 700, color: row.net >= 0 ? "var(--hw-green)" : "var(--hw-crimson)" }}>{fmtUSD(row.net)}</td>
                      </tr>
                    ))}
                    {/* Totals */}
                    <tr style={{ borderTop: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-warm)" }}>
                      <td colSpan={5} style={{ padding: "10px 12px", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em" }}>Total</td>
                      <td style={{ padding: "10px 12px", fontSize: 14, fontFamily: "var(--hw-font-mono)", fontWeight: 800, color: "var(--hw-green)" }}>{fmtUSD(fin.totalIncome)}</td>
                      <td style={{ padding: "10px 12px", fontSize: 14, fontFamily: "var(--hw-font-mono)", fontWeight: 800, color: "var(--hw-crimson)" }}>{fmtUSD(fin.totalBlanketShow + Object.values(showExpenses).reduce((a, b) => a + b, 0))}</td>
                      <td style={{ padding: "10px 12px", fontSize: 14, fontFamily: "var(--hw-font-mono)", fontWeight: 800, color: fin.netIncome >= 0 ? "var(--hw-green)" : "var(--hw-crimson)" }}>{fmtUSD(fin.netIncome)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ══════ Section 3: Currency Summary ══════ */}
            {Object.keys(fin.byCurrency).length > 0 && (
              <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 24, marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, letterSpacing: "2px", textTransform: "uppercase" }}>Currency Summary</div>
                  <button
                    onClick={fetchLiveRates}
                    disabled={ratesLoading}
                    style={{ padding: "6px 14px", border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", cursor: "pointer", fontFamily: "var(--hw-font-display)", fontSize: 12, letterSpacing: "3px", textTransform: "uppercase", fontWeight: 700, opacity: ratesLoading ? 0.5 : 1 }}
                  >{ratesLoading ? "LOADING..." : "UPDATE LIVE RATES"}</button>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "var(--hw-bg-invert)" }}>
                      {["Currency", "Shows", "Total (Original)", "Rate (to USD)", "Total (USD)"].map((h) => (
                        <th key={h} style={{ padding: "12px 12px", textAlign: "left", fontFamily: "var(--hw-font-mono)", fontSize: 10, fontWeight: 700, color: "var(--hw-text-invert)", textTransform: "uppercase", letterSpacing: "2px", borderBottom: "2px solid var(--hw-border)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(fin.byCurrency).map(([currency, amount]) => {
                      const showCount = shows.filter((s) => s.offer_currency === currency && !s.is_off).length;
                      const rate = rates[currency] || 1;
                      const usdTotal = amount * rate;
                      return (
                        <tr key={currency} style={{ borderTop: "2px solid var(--hw-border)" }}>
                          <td style={{ padding: "9px 12px", fontSize: 13, fontWeight: 700 }}>{currency}</td>
                          <td style={{ padding: "9px 12px", fontSize: 13, fontFamily: "var(--hw-font-mono)" }}>{showCount}</td>
                          <td style={{ padding: "9px 12px", fontSize: 13, fontFamily: "var(--hw-font-mono)" }}>{amount.toLocaleString()} {currency}</td>
                          <td style={{ padding: "9px 12px" }}>
                            <input
                              type="number"
                              step="0.0001"
                              value={rate || ""}
                              onChange={(e) => onRateChange(currency, e.target.value)}
                              style={{ width: 90, padding: "4px 8px", border: "3px solid var(--hw-border-strong)", fontSize: 12, fontFamily: "var(--hw-font-mono)", outline: "none" }}
                            />
                          </td>
                          <td style={{ padding: "9px 12px", fontSize: 13, fontFamily: "var(--hw-font-mono)", color: "var(--hw-green)", fontWeight: 600 }}>{fmtUSD(usdTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ══════ Section 4: Transport Costs Breakdown ══════ */}
            <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 24 }}>
              <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, letterSpacing: "2px", textTransform: "uppercase", fontWeight: 800, marginBottom: 16 }}>Transport Costs</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Drive */}
                <div style={{ border: "3px solid var(--hw-border)", padding: 16 }}>
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, color: "var(--hw-text-muted)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 12 }}>Driving</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "var(--hw-text-secondary)" }}>Drive legs</span>
                    <span style={{ fontSize: 13, fontFamily: "var(--hw-font-mono)", fontWeight: 600 }}>{driveLegs}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "var(--hw-text-secondary)" }}>Total distance</span>
                    <span style={{ fontSize: 13, fontFamily: "var(--hw-font-mono)", fontWeight: 600 }}>
                      {fin.imperialTour ? Math.round(totalDriveKm * 0.6214).toLocaleString() + " mi" : Math.round(totalDriveKm).toLocaleString() + " km"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "var(--hw-text-secondary)" }}>Total drive time</span>
                    <span style={{ fontSize: 13, fontFamily: "var(--hw-font-mono)", fontWeight: 600 }}>{fmtHours(totalDriveH)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid var(--hw-border)", paddingTop: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Fuel cost</span>
                    <span style={{ fontSize: 14, fontFamily: "var(--hw-font-mono)", fontWeight: 800, color: "var(--hw-crimson)" }}>{fmtUSD(fin.totalFuel)}</span>
                  </div>
                </div>

                {/* Fly */}
                <div style={{ border: "3px solid var(--hw-border)", padding: 16 }}>
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 400, color: "var(--hw-text-muted)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: 12 }}>Flights</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: "var(--hw-text-secondary)" }}>Flight legs</span>
                    <span style={{ fontSize: 13, fontFamily: "var(--hw-font-mono)", fontWeight: 600 }}>{fin.flightLegs}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid var(--hw-border)", paddingTop: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Flight cost</span>
                    <span style={{ fontSize: 14, fontFamily: "var(--hw-font-mono)", fontWeight: 800, color: "var(--hw-crimson)" }}>{fmtUSD(fin.totalFlights)}</span>
                  </div>
                </div>
              </div>

              {/* Combined total */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, padding: "12px 16px", background: "var(--hw-bg-warm)", border: "3px solid var(--hw-border)" }}>
                <span style={{ fontSize: 13, fontWeight: 800 }}>Combined Transport</span>
                <span style={{ fontSize: 16, fontFamily: "var(--hw-font-mono)", fontWeight: 800, color: "var(--hw-crimson)" }}>{fmtUSD(fin.totalFuel + fin.totalFlights)}</span>
              </div>
              {fin.showDayCount > 0 && (
                <div style={{ fontSize: 12, color: "var(--hw-text-muted)", marginTop: 6, textAlign: "right" }}>
                  {fmtUSD((fin.totalFuel + fin.totalFlights) / fin.showDayCount)} per show average
                </div>
              )}
            </div>

          </>
        )}
      </div>
    </div>
  );
}
