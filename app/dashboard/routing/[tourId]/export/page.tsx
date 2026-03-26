"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type TourData = { id: string; name: string };

export default function ExportPage() {
  const { tourId } = useParams<{ tourId: string }>();
  const [tour, setTour] = useState<TourData | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/tourrouter/tours/${tourId}`)
      .then((r) => r.json())
      .then((data) => setTour(data.tour))
      .catch(() => {});
  }, [tourId]);

  async function downloadExport(format: "csv" | "excel" | "pdf" | "daysheet" | "advance") {
    setDownloading(format);
    setError("");
    try {
      const resp = await fetch(`/api/tourrouter/tours/${tourId}/export/${format}`);
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Download failed" }));
        setError(err.error || "Download failed");
        setDownloading(null);
        return;
      }
      const blob = await resp.blob();
      const disposition = resp.headers.get("Content-Disposition") || "";
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      const extMap: Record<string, string> = { excel: "xlsx", daysheet: "pdf", advance: "pdf" };
      const filename = filenameMatch ? filenameMatch[1] : `export.${extMap[format] || format}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Download failed");
    }
    setDownloading(null);
  }

  const navItems = [
    { num: 1, label: "Import", href: `/dashboard/routing/${tourId}/import`, active: false },
    { num: 2, label: "Route", href: `/dashboard/routing/${tourId}`, active: false },
    { num: 3, label: "Financials", href: `/dashboard/routing/${tourId}/financials`, active: false },
    { num: 4, label: "Export", href: `/dashboard/routing/${tourId}/export`, active: true },
  ];

  const exportOptions = [
    {
      key: "pdf" as const,
      title: "PDF Report",
      icon: "\u{1F4D1}",
      desc: "3-page landscape report with financial overview, show schedule, and routing detail",
      button: "Download PDF",
    },
    {
      key: "excel" as const,
      title: "Excel Workbook",
      icon: "\u{1F4D7}",
      desc: "3-sheet workbook with budget summary, tour route, and routing flags",
      button: "Download Excel",
    },
    {
      key: "csv" as const,
      title: "CSV",
      icon: "\u{1F4BE}",
      desc: "Simple comma-separated file with financial summary and show data for custom analysis",
      button: "Download CSV",
    },
    {
      key: "daysheet" as const,
      title: "Day Sheets",
      icon: "\u{1F4CB}",
      desc: "One-page-per-show printable day sheets with venue, schedule, hotel, contacts, and travel info",
      button: "Download All Day Sheets",
    },
    {
      key: "advance" as const,
      title: "Advance Sheets",
      icon: "\u{1F4E8}",
      desc: "Venue advance documents with production, hospitality, merch, hotel, and guest list details",
      button: "Download All Advances",
    },
  ];

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
                  <Link key={item.num} href={item.href} style={{
                    padding: "10px 18px", borderRadius: 10,
                    border: item.active ? "1px solid #111" : "1px solid #DDDDDD",
                    background: item.active ? "#111" : "#fff",
                    color: item.active ? "#fff" : "#111",
                    textDecoration: "none", fontWeight: item.active ? 900 : 700, fontSize: 13,
                  }}>{item.num}. {item.label}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#fff0f0", border: "1px solid #ffcccc", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#c00" }}>
            {error}
          </div>
        )}

        {/* Export Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {exportOptions.map((opt) => {
            const isLoading = downloading === opt.key;
            return (
              <div
                key={opt.key}
                className="card-hover"
                style={{
                  background: "#fff",
                  border: "1px solid #DDDDDD",
                  borderRadius: 14,
                  padding: 32,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  minHeight: 220,
                }}
              >
                <div style={{ fontSize: 42, marginBottom: 16 }}>{opt.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.3px" }}>{opt.title}</div>
                <div style={{ fontSize: 13, color: "#888", lineHeight: 1.5, marginBottom: 20, flex: 1 }}>{opt.desc}</div>
                <button
                  onClick={() => downloadExport(opt.key)}
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: "12px 24px",
                    borderRadius: 10,
                    border: "1px solid #111",
                    background: "#111",
                    color: "#fff",
                    fontWeight: 900,
                    fontSize: 13,
                    cursor: isLoading ? "wait" : "pointer",
                    opacity: isLoading ? 0.6 : 1,
                  }}
                >
                  {isLoading ? "Generating..." : opt.button}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
