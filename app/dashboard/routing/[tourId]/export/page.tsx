"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
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

      posthog.capture("export_generated", { export_type: format });
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
    <div className="fade-in" style={{ minHeight: "100vh", padding: "32px 24px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "3px solid var(--hw-border-strong)" }}>
          <Link href={`/dashboard/routing/${tourId}`} style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-muted)", textDecoration: "none", display: "inline-block", marginBottom: 8 }}>&larr; BACK TO TOUR</Link>
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
                    color: item.active ? "#fff" : "var(--hw-text)",
                    textDecoration: "none", fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: item.active ? 700 : 400,
                    letterSpacing: "1.5px", textTransform: "uppercase",
                  }}>{item.num}. {item.label}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "var(--hw-red-ghost)", border: "3px solid var(--hw-crimson)", padding: "10px 16px", marginBottom: 16, fontFamily: "var(--hw-font-mono)", fontSize: 13, color: "var(--hw-crimson)" }}>
            {error}
          </div>
        )}

        {/* Export Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 24 }}>
          {exportOptions.map((opt) => {
            const isLoading = downloading === opt.key;
            return (
              <div
                key={opt.key}
                style={{
                  background: "var(--hw-bg-surface)",
                  border: "3px solid var(--hw-border-strong)",
                  padding: 32,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  minHeight: 220,
                  transition: "var(--hw-ease)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--hw-shadow-lg)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = "none"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                <div style={{ fontSize: 42, marginBottom: 16, opacity: 0.4 }}>{opt.icon}</div>
                <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8 }}>{opt.title}</div>
                <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-text-secondary)", lineHeight: 1.5, marginBottom: 20, flex: 1 }}>{opt.desc}</div>
                <button
                  onClick={() => downloadExport(opt.key)}
                  disabled={isLoading}
                  style={{
                    width: "100%",
                    padding: "14px 28px",
                    border: "3px solid var(--hw-border-strong)",
                    background: "var(--hw-bg-surface)",
                    color: "var(--hw-text)",
                    fontFamily: "var(--hw-font-display)",
                    fontSize: 14,
                    letterSpacing: "3px",
                    textTransform: "uppercase",
                    cursor: isLoading ? "wait" : "pointer",
                    opacity: isLoading ? 0.4 : 1,
                    transition: "var(--hw-ease)",
                  }}
                >
                  {isLoading ? "GENERATING..." : opt.button.toUpperCase()}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
