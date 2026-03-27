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
      <div style={{ minHeight: "100vh", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#888", fontSize: 15 }}>Loading report...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div style={{ minHeight: "100vh", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Report Not Found</div>
          <div style={{ fontSize: 14, color: "#888" }}>This report link is invalid or has expired.</div>
        </div>
      </div>
    );
  }

  const s = report.summary;

  return (
    <div style={{ minHeight: "100vh", background: "#fff", padding: "40px 32px 80px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Print button — hidden in print */}
        <div className="no-print" style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <button
            onClick={() => window.print()}
            style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >Print / Save PDF</button>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 32, paddingBottom: 20, borderBottom: "2px solid #111" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Tour Financial Report</div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 4 }}>{report.artistName || report.tourName}</div>
          {report.artistName && <div style={{ fontSize: 18, fontWeight: 600, color: "#666", marginBottom: 8 }}>{report.tourName}</div>}
          <div style={{ fontSize: 14, color: "#888" }}>
            {[report.dateRange.first, report.dateRange.last].filter(Boolean).join(" \u2014 ")}
            {report.dateRange.spanDays > 0 && <span> &middot; {report.dateRange.spanDays} days</span>}
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Gross Income", value: s.totalGrossFormatted, color: "#1a6b3c" },
            { label: "Total Expenses", value: s.totalExpensesFormatted, color: "#c0392b" },
            { label: "Net to Artist", value: s.netIncomeFormatted, color: s.netIncome >= 0 ? "#1a6b3c" : "#c0392b" },
            { label: "Shows", value: String(s.showCount), color: "#111" },
            { label: "Avg Per Show", value: s.avgPerShowFormatted, color: "#111" },
            { label: "Margin", value: s.margin.toFixed(1) + "%", color: s.margin >= 0 ? "#1a6b3c" : "#c0392b" },
          ].map((c) => (
            <div key={c.label} style={{ border: "1px solid #eee", borderRadius: 10, padding: "16px 20px" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color: c.color }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Commission Waterfall */}
        {report.commissions.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Commission Waterfall</div>
            <div style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", background: "#fafafa", borderBottom: "1px solid #eee" }}>
                <span style={{ fontWeight: 600 }}>Gross Tour Income</span>
                <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#1a6b3c" }}>{s.totalGrossFormatted}</span>
              </div>
              {report.commissions.filter((c) => c.type !== "label_support").map((c, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px 8px 32px", borderBottom: "1px solid #f5f5f5", fontSize: 13 }}>
                  <span style={{ color: "#666" }}>{c.label} ({c.recipientName})</span>
                  <span style={{ fontFamily: "monospace", color: "#c0392b" }}>-{fmt(c.amountUSD)}</span>
                </div>
              ))}
              {s.totalCommissions > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid #eee", fontWeight: 600 }}>
                  <span>After Commissions</span>
                  <span style={{ fontFamily: "monospace", color: "#1a6b3c" }}>{fmt(s.totalGross - s.totalCommissions)}</span>
                </div>
              )}
              {s.labelSupportCredit > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid #f5f5f5", fontSize: 13 }}>
                  <span style={{ color: "#666" }}>Label Tour Support (credit)</span>
                  <span style={{ fontFamily: "monospace", color: "#1a6b3c" }}>+{fmt(s.labelSupportCredit)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid #eee", fontWeight: 600 }}>
                <span>Total Expenses</span>
                <span style={{ fontFamily: "monospace", color: "#c0392b" }}>-{s.totalExpensesFormatted}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "#fafafa", fontWeight: 700, fontSize: 15 }}>
                <span>Net to Artist</span>
                <span style={{ fontFamily: "monospace", color: s.netIncome >= 0 ? "#1a6b3c" : "#c0392b" }}>
                  {s.netIncome < 0 ? "-" : ""}{fmt(s.netIncome)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Per-Show Table */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Per-Show Breakdown</div>
          <div style={{ border: "1px solid #eee", borderRadius: 10, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["#", "Date", "Venue", "City", "Offer", "Currency", "Status"].map((h) => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "2px solid #eee", background: "#fafafa" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.perShow.map((show, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f5f5f5" }}>
                    <td style={{ padding: "8px 12px", fontSize: 12, color: "#888", fontFamily: "monospace" }}>{i + 1}</td>
                    <td style={{ padding: "8px 12px", fontSize: 12, fontFamily: "monospace", whiteSpace: "nowrap" }}>{show.date}</td>
                    <td style={{ padding: "8px 12px", fontSize: 13, fontWeight: 600 }}>{show.venue || "\u2014"}</td>
                    <td style={{ padding: "8px 12px", fontSize: 13 }}>{show.city}{show.country ? `, ${show.country}` : ""}</td>
                    <td style={{ padding: "8px 12px", fontSize: 13, fontFamily: "monospace", fontWeight: 600 }}>{show.offerDisplay || (show.guarantee ? fmt(show.guarantee) : "\u2014")}</td>
                    <td style={{ padding: "8px 12px", fontSize: 11, color: "#888" }}>{show.currency}</td>
                    <td style={{ padding: "8px 12px" }}>
                      {show.status && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                          background: show.status.toLowerCase().includes("confirm") ? "#e8f5e9" : "#f5f5f5",
                          color: show.status.toLowerCase().includes("confirm") ? "#1a6b3c" : "#888",
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
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Transport</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", marginBottom: 10 }}>Driving</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: "#666" }}>Total distance</span>
                <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
                  {report.transport.imperial ? report.transport.totalMiles.toLocaleString() + " mi" : Math.round(report.transport.totalKm).toLocaleString() + " km"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, borderTop: "1px solid #f0f0f0", paddingTop: 8, marginTop: 4 }}>
                <span>Fuel cost</span>
                <span style={{ fontFamily: "monospace", color: "#c0392b" }}>{report.transport.fuelCostFormatted}</span>
              </div>
            </div>
            <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", marginBottom: 10 }}>Flights</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: "#666" }}>Flight legs</span>
                <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{report.transport.flightLegs}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, borderTop: "1px solid #f0f0f0", paddingTop: 8, marginTop: 4 }}>
                <span>Flight cost</span>
                <span style={{ fontFamily: "monospace", color: "#c0392b" }}>{report.transport.flightCostFormatted}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Personnel */}
        {(report.personnel.totalPersonnel > 0 || report.personnel.totalPerDiems > 0) && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Personnel</div>
            <div style={{ border: "1px solid #eee", borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: "#666" }}>Personnel costs</span>
                <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{report.personnel.totalPersonnelFormatted}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: "#666" }}>Per diems</span>
                <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{report.personnel.totalPerDiemsFormatted}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: "1px solid #eee", paddingTop: 16, textAlign: "center", fontSize: 11, color: "#aaa" }}>
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
