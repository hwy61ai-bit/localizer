"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type TourData = {
  id: string;
  name: string;
  artist_id: string | null;
};

const STAT_CARDS = [
  { label: "Total Shows", value: "\u2014" },
  { label: "Total Miles", value: "\u2014" },
  { label: "Total Drive Hours", value: "\u2014" },
  { label: "Est. Fuel Cost", value: "\u2014" },
];

export default function RouteTourPage() {
  const { tourId } = useParams<{ tourId: string }>();
  const [tour, setTour] = useState<TourData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tourrouter/tours/${tourId}`)
      .then((r) => r.json())
      .then((data) => { setTour(data.tour); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tourId]);

  const navItems = [
    { num: 1, label: "Import", href: `/dashboard/routing/${tourId}/import`, active: false },
    { num: 2, label: "Route", href: `/dashboard/routing/${tourId}`, active: true },
    { num: 3, label: "Financials", href: `/dashboard/routing/${tourId}/financials`, active: false },
    { num: 4, label: "Export", href: `/dashboard/routing/${tourId}/export`, active: false },
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
              <div className="brand-title" style={{ margin: 0, fontSize: "360%" }}>{loading ? "\u2014" : tour?.name?.toUpperCase() || "TOUR"}</div>
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

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {STAT_CARDS.map((card) => (
            <div key={card.label} style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: "16px 20px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "monospace" }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* Placeholder */}
        <div style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#888" }}>Route table coming in Phase 6</div>
        </div>
      </div>
    </div>
  );
}
