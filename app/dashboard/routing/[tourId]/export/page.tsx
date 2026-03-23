"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type TourData = { id: string; name: string };

export default function ExportPage() {
  const { tourId } = useParams<{ tourId: string }>();
  const [tour, setTour] = useState<TourData | null>(null);

  useEffect(() => {
    fetch(`/api/tourrouter/tours/${tourId}`)
      .then((r) => r.json())
      .then((data) => setTour(data.tour))
      .catch(() => {});
  }, [tourId]);

  const navItems = [
    { num: 1, label: "Import", href: `/dashboard/routing/${tourId}/import`, active: false },
    { num: 2, label: "Route", href: `/dashboard/routing/${tourId}`, active: false },
    { num: 3, label: "Financials", href: `/dashboard/routing/${tourId}/financials`, active: false },
    { num: 4, label: "Export", href: `/dashboard/routing/${tourId}/export`, active: true },
  ];

  const exportOptions = [
    { title: "PDF Report", desc: "Generate a formatted PDF with tour summary, route, and financials", icon: "\u{1F4D1}" },
    { title: "Excel Workbook", desc: "Multi-sheet Excel file with budget summary, route, and routing flags", icon: "\u{1F4D7}" },
    { title: "CSV", desc: "Simple comma-separated export for spreadsheets and custom tools", icon: "\u{1F4BE}" },
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
                  <Link
                    key={item.num}
                    href={item.href}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 10,
                      border: item.active ? "1px solid #111" : "1px solid #DDDDDD",
                      background: item.active ? "#111" : "#fff",
                      color: item.active ? "#fff" : "#111",
                      textDecoration: "none",
                      fontWeight: item.active ? 900 : 700,
                      fontSize: 13,
                    }}
                  >{item.num}. {item.label}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {exportOptions.map((opt) => (
            <div
              key={opt.title}
              className="card-hover"
              style={{
                background: "#fff",
                border: "1px solid #DDDDDD",
                borderRadius: 14,
                padding: 32,
                textAlign: "center",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>{opt.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.3px" }}>{opt.title}</div>
              <div style={{ fontSize: 13, color: "#888", lineHeight: 1.5 }}>{opt.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
