"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  calcTourFinancials,
  fmtUSD,
  type TourShow,
  type FinancialResults,
  type VehicleType,
} from "@/lib/tourrouter";
import type { TourVehicle } from "@/lib/tourrouter/vehicleTypes";
import { useFeatureFlags } from "@/lib/tourrouter/FeatureFlagContext";


type TourListItem = {
  id: string;
  name: string;
  artists: { name: string } | null;
  vehicle_type: VehicleType | null;
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
};

type ShowRow = {
  id: string;
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
  backend: string | null;
  doors: string | null;
  showtime: string | null;
  merch: string | null;
};

type TourFinRow = {
  tour: TourListItem;
  fin: FinancialResults;
  showCount: number;
  status: "active" | "completed";
};

export default function FinanceDashboard() {
  const flags = useFeatureFlags();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TourFinRow[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const toursResp = await fetch("/api/tourrouter/tours");
        if (!toursResp.ok) { setLoading(false); return; }
        const { tours } = await toursResp.json();
        if (!tours || tours.length === 0) { setLoading(false); return; }

        // Fetch shows for each tour in parallel
        const results: TourFinRow[] = [];
        const fetches = tours.map(async (tour: TourListItem) => {
          try {
            const resp = await fetch(`/api/tourrouter/tours/${tour.id}`);
            if (!resp.ok) return;
            const data = await resp.json();
            const shows: ShowRow[] = data.shows || [];
            if (shows.length === 0) return;

            const rates = tour.currency_rates || {};
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
            }));

            const fin = calcTourFinancials({
              tourShows,
              legChoices,
              showExpenses: {},
              rates,
              pax: tour.pax || 4,
              flightThreshold: tour.flight_threshold_h || 6,
              blanketShowAmt: tour.blanket_show_amount || 0,
              blanketOffAmt: tour.blanket_off_amount || 0,
              blanketShowLabel: tour.blanket_show_label || "Band Pay",
              blanketOffLabel: tour.blanket_off_label || "Hotel + Per Diem",
              vehicleType: tour.vehicle_type || "van",
              vehicleCount: 1,
              fuelPriceOverride: tour.fuel_price_usd || null,
              tourVehicles: (tour.tour_vehicles as unknown as TourVehicle[] | undefined) ?? [],
              flightPriceCache: {},
              commissions: (tour.tour_commissions || []) as never[],
            });

            const today = new Date();
            const lastDate = fin.lastDate;
            const status: "active" | "completed" = lastDate && lastDate < today ? "completed" : "active";

            results.push({
              tour,
              fin,
              showCount: shows.filter((s) => !s.is_off).length,
              status,
            });
          } catch { /* skip failed tour */ }
        });

        await Promise.all(fetches);
        results.sort((a, b) => b.fin.totalIncome - a.fin.totalIncome);
        setRows(results);
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  // Totals
  const totalGross = rows.reduce((s, r) => s + r.fin.totalIncome, 0);
  const totalComm = rows.reduce((s, r) => s + r.fin.totalCommissions, 0);
  const totalExp = rows.reduce((s, r) => s + r.fin.totalExpenses, 0);
  const totalNet = rows.reduce((s, r) => s + r.fin.netIncome, 0);

  return (
    <div className="fade-in" style={{ minHeight: "100vh", padding: "32px 24px 80px", background: "transparent" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/dashboard" style={{ fontSize: 13, fontWeight: 700, color: "var(--hw-text-muted)", textDecoration: "none", display: "inline-block", marginBottom: 8, fontFamily: "var(--hw-font-mono)" }}>&larr; HWY61</Link>
          <h1 className="brand-title" style={{ margin: 0, marginBottom: 4, paddingBottom: 8 }}>HWY61</h1>
          <div style={{ borderBottom: "3px solid var(--hw-border-strong)", marginBottom: 6, maxWidth: 200 }} />
          <div className="brand-title" style={{ margin: 0, fontSize: "360%" }}>FINANCE DASHBOARD</div>
        </div>

        {!flags.multiTour ? (
          <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", borderRadius: 0, padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, fontFamily: "var(--hw-font-display)", color: "var(--hw-text)" }}>Finance Dashboard</div>
            <div style={{ fontSize: 13, color: "var(--hw-text-muted)", marginBottom: 20, fontFamily: "var(--hw-font-body)" }}>Multi-tour financial tracking and reporting is available with TourRouter.</div>
            <Link href="/dashboard" style={{ padding: "10px 24px", borderRadius: 0, border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-invert)", color: "#fff", textDecoration: "none", fontWeight: 900, fontSize: 13, fontFamily: "var(--hw-font-mono)" }}>Back to Tours</Link>
          </div>
        ) : loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "var(--hw-text-muted)", fontFamily: "var(--hw-font-mono)" }}>Loading...</div>
        ) : rows.length === 0 ? (
          <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", borderRadius: 0, padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--hw-text-muted)", marginBottom: 12, fontFamily: "var(--hw-font-display)" }}>No tours yet</div>
            <div style={{ fontSize: 13, color: "var(--hw-text-muted)", marginBottom: 20, fontFamily: "var(--hw-font-body)" }}>Create a tour in TourRouter to see financial data here.</div>
            <Link href="/dashboard" style={{ padding: "10px 24px", borderRadius: 0, border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-invert)", color: "#fff", textDecoration: "none", fontWeight: 900, fontSize: 13, fontFamily: "var(--hw-font-mono)" }}>Go to TourRouter</Link>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Total Gross Income", value: fmtUSD(totalGross), color: "var(--hw-green)" },
                { label: "Total Commissions", value: fmtUSD(totalComm), color: "var(--hw-text-secondary)" },
                { label: "Total Expenses", value: fmtUSD(totalExp), color: "var(--hw-crimson)" },
                { label: "Total Net", value: fmtUSD(totalNet), color: totalNet >= 0 ? "var(--hw-green)" : "var(--hw-crimson)" },
              ].map((c) => (
                <div key={c.label} style={{ background: "white", border: "3px solid black", borderRadius: 0, padding: "18px 22px" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--hw-text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6, fontFamily: "var(--hw-font-mono)" }}>{c.label}</div>
                  <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "var(--hw-font-display)", color: c.color }}>{c.value}</div>
                </div>
              ))}
            </div>

            {/* Tours Table */}
            <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", borderRadius: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Tour", "Artist", "Shows", "Gross Income", "Commissions", "Expenses", "Net", "Margin", "Status"].map((h) => (
                        <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "3px solid var(--hw-border-strong)", whiteSpace: "nowrap", background: "var(--hw-bg-invert)", fontFamily: "var(--hw-font-mono)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.tour.id}
                        onClick={() => window.location.href = `/dashboard/routing/${row.tour.id}/financials`}
                        style={{ cursor: "pointer", borderBottom: "1px solid var(--hw-border-strong)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--hw-bg-surface)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 700, fontFamily: "var(--hw-font-body)", color: "var(--hw-text)" }}>{row.tour.name}</td>
                        <td style={{ padding: "12px 14px", fontSize: 13, color: "var(--hw-text-secondary)", fontFamily: "var(--hw-font-body)" }}>{row.tour.artists?.name || "\u2014"}</td>
                        <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: "var(--hw-font-mono)", color: "var(--hw-text)" }}>{row.showCount}</td>
                        <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: "var(--hw-font-mono)", color: "var(--hw-green)", fontWeight: 600 }}>{fmtUSD(row.fin.totalIncome)}</td>
                        <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: "var(--hw-font-mono)", color: row.fin.totalCommissions > 0 ? "var(--hw-text-secondary)" : "var(--hw-text-muted)" }}>{row.fin.totalCommissions > 0 ? fmtUSD(row.fin.totalCommissions) : "\u2014"}</td>
                        <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: "var(--hw-font-mono)", color: "var(--hw-crimson)" }}>{fmtUSD(row.fin.totalExpenses)}</td>
                        <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: "var(--hw-font-mono)", fontWeight: 700, color: row.fin.netIncome >= 0 ? "var(--hw-green)" : "var(--hw-crimson)" }}>{fmtUSD(row.fin.netIncome)}</td>
                        <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: "var(--hw-font-mono)", color: row.fin.margin >= 0 ? "var(--hw-green)" : "var(--hw-crimson)" }}>{row.fin.margin.toFixed(1)}%</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 0,
                            background: row.status === "active" ? "var(--hw-green)" : "var(--hw-bg-surface)",
                            color: row.status === "active" ? "#fff" : "var(--hw-text-muted)",
                            fontFamily: "var(--hw-font-mono)", textTransform: "uppercase" as const,
                          }}>{row.status === "active" ? "Active" : "Completed"}</span>
                        </td>
                      </tr>
                    ))}

                    {/* Totals row */}
                    <tr style={{ borderTop: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)" }}>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 800, textTransform: "uppercase", fontFamily: "var(--hw-font-mono)", color: "var(--hw-text)" }}>Total</td>
                      <td style={{ padding: "12px 14px" }}></td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: "var(--hw-font-mono)", fontWeight: 700, color: "var(--hw-text)" }}>{rows.reduce((s, r) => s + r.showCount, 0)}</td>
                      <td style={{ padding: "12px 14px", fontSize: 14, fontFamily: "var(--hw-font-mono)", fontWeight: 800, color: "var(--hw-green)" }}>{fmtUSD(totalGross)}</td>
                      <td style={{ padding: "12px 14px", fontSize: 14, fontFamily: "var(--hw-font-mono)", fontWeight: 800, color: totalComm > 0 ? "var(--hw-text-secondary)" : "var(--hw-text-muted)" }}>{totalComm > 0 ? fmtUSD(totalComm) : "\u2014"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 14, fontFamily: "var(--hw-font-mono)", fontWeight: 800, color: "var(--hw-crimson)" }}>{fmtUSD(totalExp)}</td>
                      <td style={{ padding: "12px 14px", fontSize: 14, fontFamily: "var(--hw-font-mono)", fontWeight: 800, color: totalNet >= 0 ? "var(--hw-green)" : "var(--hw-crimson)" }}>{fmtUSD(totalNet)}</td>
                      <td style={{ padding: "12px 14px", fontSize: 14, fontFamily: "var(--hw-font-mono)", fontWeight: 800, color: totalGross > 0 ? (totalNet / totalGross * 100 >= 0 ? "var(--hw-green)" : "var(--hw-crimson)") : "var(--hw-text-muted)" }}>
                        {totalGross > 0 ? (totalNet / totalGross * 100).toFixed(1) + "%" : "\u2014"}
                      </td>
                      <td style={{ padding: "12px 14px" }}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
