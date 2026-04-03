"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type CommissionItem = { label: string; recipientName: string; type: string; amountUSD: number };
type ShowItem = { date: string; venue: string; city: string; country: string; guarantee: number; currency: string; offerDisplay: string; status: string };

type ReportData = {
  tourName: string;
  artistName: string;
  dateRange: { first: string | null; last: string | null; spanDays: number };
  summary: {
    showCount: number;
    offDayCount: number;
    totalGross: number;
    totalGrossFormatted: string;
    totalCommissions: number;
    totalCommissionsFormatted: string;
    totalExpenses: number;
    totalExpensesFormatted: string;
    labelSupportCredit: number;
    netIncome: number;
    netIncomeFormatted: string;
    margin: number;
    avgPerShow: number;
    avgPerShowFormatted: string;
  };
  commissions: CommissionItem[];
  perShow: ShowItem[];
  transport: {
    totalKm: number;
    totalMiles: number;
    fuelCost: number;
    fuelCostFormatted: string;
    flightCost: number;
    flightCostFormatted: string;
    flightLegs: number;
    imperial: boolean;
  };
  personnel: {
    totalPersonnel: number;
    totalPersonnelFormatted: string;
    totalPerDiems: number;
    totalPerDiemsFormatted: string;
  };
  generatedAt: string;
};

function fmt(n: number): string {
  return `$${Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PublicReportPage() {
  const { token } = useParams<{ token: string }>();
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/tourrouter/finance/report/${token}`)
      .then((r) => {
        if (!r.ok) { setError(true); setLoading(false); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) setReport(data);
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [token]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "var(--hw-text-muted)", fontSize: 15, fontFamily: "var(--hw-font-mono)" }}>Loading report...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ minHeight: "100vh", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, fontFamily: "var(--hw-font-display)", textTransform: "uppercase" as const, letterSpacing: "3px" }}>Report Not Found</div>
          <div style={{ fontSize: 14, color: "var(--hw-text-muted)", fontFamily: "var(--hw-font-body)" }}>This report link is invalid or has expired.</div>
        </div>
      </div>
    );
  }

  const s = report.summary;

  return (
    <div style={{ minHeight: "100vh", background: "transparent", padding: "40px 32px 80px", fontFamily: "var(--hw-font-body)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Print button — hidden in print */}
        <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <button
            onClick={() => window.print()}
            style={{ padding: "8px 20px", borderRadius: 0, border: "3px solid var(--hw-border-strong)", background: "var(--hw-crimson)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "var(--hw-font-display)", textTransform: "uppercase" as const, letterSpacing: "3px" }}
          >Print / Save PDF</button>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 32, paddingBottom: 20, borderBottom: "3px solid var(--hw-border-strong)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--hw-text-muted)", letterSpacing: "0.12em", textTransform: "uppercase" as const, marginBottom: 8, fontFamily: "var(--hw-font-mono)" }}>Tour Financial Report</div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 4, fontFamily: "var(--hw-font-display)", textTransform: "uppercase" as const }}>{report.artistName || report.tourName}</div>
          {report.artistName && <div style={{ fontSize: 18, fontWeight: 600, color: "var(--hw-text-muted)", marginBottom: 8, fontFamily: "var(--hw-font-body)" }}>{report.tourName}</div>}
          <div style={{ fontSize: 14, color: "var(--hw-text-muted)", fontFamily: "var(--hw-font-mono)" }}>
            {[report.dateRange.first, report.dateRange.last].filter(Boolean).join(" \u2014 ")}
            {report.dateRange.spanDays > 0 && <span> &middot; {report.dateRange.spanDays} days</span>}
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Gross Income", value: s.totalGrossFormatted, positive: true },
            { label: "Total Expenses", value: s.totalExpensesFormatted, positive: false },
            { label: "Net to Artist", value: s.netIncomeFormatted, positive: s.netIncome >= 0 },
            { label: "Shows", value: String(s.showCount), positive: null },
            { label: "Avg Per Show", value: s.avgPerShowFormatted, positive: null },
            { label: "Margin", value: s.margin.toFixed(1) + "%", positive: s.margin >= 0 ? true : false },
          ].map((c) => (
            <div key={c.label} style={{ border: "3px solid var(--hw-border-strong)", borderRadius: 0, padding: "16px 20px", background: "var(--hw-bg-surface)" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "var(--hw-text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.04em", marginBottom: 4, fontFamily: "var(--hw-font-mono)" }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "var(--hw-font-mono)", color: c.positive === null ? "var(--hw-text-primary)" : c.positive ? "var(--hw-positive)" : "var(--hw-crimson)" }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Commission Waterfall */}
        {report.commissions.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, fontFamily: "var(--hw-font-display)", textTransform: "uppercase" as const, letterSpacing: "3px" }}>Commission Waterfall</div>
            <div style={{ border: "3px solid var(--hw-border-strong)", borderRadius: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", background: "var(--hw-bg-surface)", borderBottom: "1px solid var(--hw-border-strong)" }}>
                <span style={{ fontWeight: 600, fontFamily: "var(--hw-font-body)" }}>Gross Tour Income</span>
                <span style={{ fontFamily: "var(--hw-font-mono)", fontWeight: 600, color: "var(--hw-positive)" }}>{s.totalGrossFormatted}</span>
              </div>
              {report.commissions.filter((c) => c.type !== "label_support").map((c, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px 8px 32px", borderBottom: "1px solid var(--hw-border-default)", fontSize: 13 }}>
                  <span style={{ color: "var(--hw-text-muted)", fontFamily: "var(--hw-font-body)" }}>{c.label} ({c.recipientName})</span>
                  <span style={{ fontFamily: "var(--hw-font-mono)", color: "var(--hw-crimson)" }}>-{fmt(c.amountUSD)}</span>
                </div>
              ))}
              {s.totalCommissions > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid var(--hw-border-strong)", fontWeight: 600 }}>
                  <span style={{ fontFamily: "var(--hw-font-body)" }}>After Commissions</span>
                  <span style={{ fontFamily: "var(--hw-font-mono)", color: "var(--hw-positive)" }}>{fmt(s.totalGross - s.totalCommissions)}</span>
                </div>
              )}
              {s.labelSupportCredit > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid var(--hw-border-default)", fontSize: 13 }}>
                  <span style={{ color: "var(--hw-text-muted)", fontFamily: "var(--hw-font-body)" }}>Label Tour Support (credit)</span>
                  <span style={{ fontFamily: "var(--hw-font-mono)", color: "var(--hw-positive)" }}>+{fmt(s.labelSupportCredit)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid var(--hw-border-strong)", fontWeight: 600 }}>
                <span style={{ fontFamily: "var(--hw-font-body)" }}>Total Expenses</span>
                <span style={{ fontFamily: "var(--hw-font-mono)", color: "var(--hw-crimson)" }}>-{s.totalExpensesFormatted}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "var(--hw-bg-surface)", fontWeight: 700, fontSize: 15 }}>
                <span style={{ fontFamily: "var(--hw-font-body)" }}>Net to Artist</span>
                <span style={{ fontFamily: "var(--hw-font-mono)", color: s.netIncome >= 0 ? "var(--hw-positive)" : "var(--hw-crimson)" }}>
                  {s.netIncome < 0 ? "-" : ""}{fmt(s.netIncome)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Per-Show Table */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, fontFamily: "var(--hw-font-display)", textTransform: "uppercase" as const, letterSpacing: "3px" }}>Per-Show Breakdown</div>
          <div style={{ border: "3px solid var(--hw-border-strong)", borderRadius: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["#", "Date", "Venue", "City", "Offer", "Currency", "Status"].map((h) => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "var(--hw-text-muted)", textTransform: "uppercase" as const, letterSpacing: "0.04em", borderBottom: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", fontFamily: "var(--hw-font-mono)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.perShow.map((show, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--hw-border-default)" }}>
                    <td style={{ padding: "8px 12px", fontSize: 12, color: "var(--hw-text-muted)", fontFamily: "var(--hw-font-mono)" }}>{i + 1}</td>
                    <td style={{ padding: "8px 12px", fontSize: 12, fontFamily: "var(--hw-font-mono)", whiteSpace: "nowrap" }}>{show.date}</td>
                    <td style={{ padding: "8px 12px", fontSize: 13, fontWeight: 600, fontFamily: "var(--hw-font-body)" }}>{show.venue || "\u2014"}</td>
                    <td style={{ padding: "8px 12px", fontSize: 13, fontFamily: "var(--hw-font-body)" }}>{show.city}{show.country ? `, ${show.country}` : ""}</td>
                    <td style={{ padding: "8px 12px", fontSize: 13, fontFamily: "var(--hw-font-mono)", fontWeight: 600 }}>{show.offerDisplay || (show.guarantee ? fmt(show.guarantee) : "\u2014")}</td>
                    <td style={{ padding: "8px 12px", fontSize: 11, color: "var(--hw-text-muted)", fontFamily: "var(--hw-font-mono)" }}>{show.currency}</td>
                    <td style={{ padding: "8px 12px" }}>
                      {show.status && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 0,
                          border: "1px solid var(--hw-border-strong)",
                          background: show.status.toLowerCase().includes("confirm") ? "var(--hw-bg-surface)" : "var(--hw-bg-surface)",
                          color: show.status.toLowerCase().includes("confirm") ? "var(--hw-positive)" : "var(--hw-text-muted)",
                          fontFamily: "var(--hw-font-mono)", textTransform: "uppercase" as const,
                        }}>{show.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transport */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, fontFamily: "var(--hw-font-display)", textTransform: "uppercase" as const, letterSpacing: "3px" }}>Transport</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ border: "3px solid var(--hw-border-strong)", borderRadius: 0, padding: 16, background: "var(--hw-bg-surface)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--hw-text-muted)", textTransform: "uppercase" as const, marginBottom: 10, fontFamily: "var(--hw-font-mono)" }}>Driving</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: "var(--hw-text-muted)", fontFamily: "var(--hw-font-body)" }}>Total distance</span>
                <span style={{ fontFamily: "var(--hw-font-mono)", fontWeight: 600 }}>
                  {report.transport.imperial ? report.transport.totalMiles.toLocaleString() + " mi" : Math.round(report.transport.totalKm).toLocaleString() + " km"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, borderTop: "1px solid var(--hw-border-default)", paddingTop: 8, marginTop: 4 }}>
                <span style={{ fontFamily: "var(--hw-font-body)" }}>Fuel cost</span>
                <span style={{ fontFamily: "var(--hw-font-mono)", color: "var(--hw-crimson)" }}>{report.transport.fuelCostFormatted}</span>
              </div>
            </div>
            <div style={{ border: "3px solid var(--hw-border-strong)", borderRadius: 0, padding: 16, background: "var(--hw-bg-surface)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--hw-text-muted)", textTransform: "uppercase" as const, marginBottom: 10, fontFamily: "var(--hw-font-mono)" }}>Flights</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: "var(--hw-text-muted)", fontFamily: "var(--hw-font-body)" }}>Flight legs</span>
                <span style={{ fontFamily: "var(--hw-font-mono)", fontWeight: 600 }}>{report.transport.flightLegs}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, borderTop: "1px solid var(--hw-border-default)", paddingTop: 8, marginTop: 4 }}>
                <span style={{ fontFamily: "var(--hw-font-body)" }}>Flight cost</span>
                <span style={{ fontFamily: "var(--hw-font-mono)", color: "var(--hw-crimson)" }}>{report.transport.flightCostFormatted}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Personnel */}
        {(report.personnel.totalPersonnel > 0 || report.personnel.totalPerDiems > 0) && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, fontFamily: "var(--hw-font-display)", textTransform: "uppercase" as const, letterSpacing: "3px" }}>Personnel</div>
            <div style={{ border: "3px solid var(--hw-border-strong)", borderRadius: 0, padding: 16, background: "var(--hw-bg-surface)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: "var(--hw-text-muted)", fontFamily: "var(--hw-font-body)" }}>Personnel costs</span>
                <span style={{ fontFamily: "var(--hw-font-mono)", fontWeight: 600 }}>{report.personnel.totalPersonnelFormatted}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "var(--hw-text-muted)", fontFamily: "var(--hw-font-body)" }}>Per diems</span>
                <span style={{ fontFamily: "var(--hw-font-mono)", fontWeight: 600 }}>{report.personnel.totalPerDiemsFormatted}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: "3px solid var(--hw-border-strong)", paddingTop: 16, textAlign: "center", fontSize: 11, color: "var(--hw-text-muted)", fontFamily: "var(--hw-font-mono)" }}>
          Generated by HWY61 TourRouter &middot; {new Date(report.generatedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
