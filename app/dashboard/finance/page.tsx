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
    <div className="fade-in" style={{ minHeight: "100vh", background: "#EEEEEE", padding: "32px 24px 80px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Link href="/dashboard/routing" style={{ fontSize: 13, fontWeight: 700, color: "#888", textDecoration: "none", display: "inline-block", marginBottom: 8 }}>&larr; TourRouter</Link>
          <h1 className="brand-title" style={{ margin: 0, marginBottom: 4, paddingBottom: 8 }}>TOURROUTER.</h1>
          <div style={{ borderBottom: "2px solid #111", marginBottom: 6, maxWidth: 200 }} />
          <div className="brand-title" style={{ margin: 0, fontSize: "360%" }}>FINANCE DASHBOARD</div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60, color: "#888" }}>Loading...</div>
        ) : rows.length === 0 ? (
          <div style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#888", marginBottom: 12 }}>No tours yet</div>
            <div style={{ fontSize: 13, color: "#aaa", marginBottom: 20 }}>Create a tour in TourRouter to see financial data here.</div>
            <Link href="/dashboard/routing" style={{ padding: "10px 24px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", textDecoration: "none", fontWeight: 900, fontSize: 13 }}>Go to TourRouter</Link>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Total Gross Income", value: fmtUSD(totalGross), color: "#1a6b3c" },
                { label: "Total Commissions", value: fmtUSD(totalComm), color: "#b35c00" },
                { label: "Total Expenses", value: fmtUSD(totalExp), color: "#c0392b" },
                { label: "Total Net", value: fmtUSD(totalNet), color: totalNet >= 0 ? "#1a6b3c" : "#c0392b" },
              ].map((c) => (
                <div key={c.label} style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: "18px 22px" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{c.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "monospace", color: c.color }}>{c.value}</div>
                </div>
              ))}
            </div>

            {/* Tours Table */}
            <div style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Tour", "Artist", "Shows", "Gross Income", "Commissions", "Expenses", "Net", "Margin", "Status"].map((h) => (
                        <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "2px solid #DDDDDD", whiteSpace: "nowrap", background: "#fafaf8" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.tour.id}
                        onClick={() => window.location.href = `/dashboard/routing/${row.tour.id}/financials`}
                        style={{ cursor: "pointer", borderBottom: "1px solid #f0f0f0" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f8f8f6"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}
                      >
                        <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 700 }}>{row.tour.name}</td>
                        <td style={{ padding: "12px 14px", fontSize: 13, color: "#666" }}>{row.tour.artists?.name || "\u2014"}</td>
                        <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: "monospace" }}>{row.showCount}</td>
                        <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: "monospace", color: "#1a6b3c", fontWeight: 600 }}>{fmtUSD(row.fin.totalIncome)}</td>
                        <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: "monospace", color: row.fin.totalCommissions > 0 ? "#b35c00" : "#aaa" }}>{row.fin.totalCommissions > 0 ? fmtUSD(row.fin.totalCommissions) : "\u2014"}</td>
                        <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: "monospace", color: "#c0392b" }}>{fmtUSD(row.fin.totalExpenses)}</td>
                        <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: "monospace", fontWeight: 700, color: row.fin.netIncome >= 0 ? "#1a6b3c" : "#c0392b" }}>{fmtUSD(row.fin.netIncome)}</td>
                        <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: "monospace", color: row.fin.margin >= 0 ? "#1a6b3c" : "#c0392b" }}>{row.fin.margin.toFixed(1)}%</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4,
                            background: row.status === "active" ? "#e8f5e9" : "#f5f5f5",
                            color: row.status === "active" ? "#1a6b3c" : "#888",
                          }}>{row.status === "active" ? "Active" : "Completed"}</span>
                        </td>
                      </tr>
                    ))}

                    {/* Totals row */}
                    <tr style={{ borderTop: "2px solid #DDDDDD", background: "#fafaf8" }}>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 800, textTransform: "uppercase" }}>Total</td>
                      <td style={{ padding: "12px 14px" }}></td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontFamily: "monospace", fontWeight: 700 }}>{rows.reduce((s, r) => s + r.showCount, 0)}</td>
                      <td style={{ padding: "12px 14px", fontSize: 14, fontFamily: "monospace", fontWeight: 800, color: "#1a6b3c" }}>{fmtUSD(totalGross)}</td>
                      <td style={{ padding: "12px 14px", fontSize: 14, fontFamily: "monospace", fontWeight: 800, color: totalComm > 0 ? "#b35c00" : "#aaa" }}>{totalComm > 0 ? fmtUSD(totalComm) : "\u2014"}</td>
                      <td style={{ padding: "12px 14px", fontSize: 14, fontFamily: "monospace", fontWeight: 800, color: "#c0392b" }}>{fmtUSD(totalExp)}</td>
                      <td style={{ padding: "12px 14px", fontSize: 14, fontFamily: "monospace", fontWeight: 800, color: totalNet >= 0 ? "#1a6b3c" : "#c0392b" }}>{fmtUSD(totalNet)}</td>
                      <td style={{ padding: "12px 14px", fontSize: 14, fontFamily: "monospace", fontWeight: 800, color: totalGross > 0 ? (totalNet / totalGross * 100 >= 0 ? "#1a6b3c" : "#c0392b") : "#888" }}>
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
