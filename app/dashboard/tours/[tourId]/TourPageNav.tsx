// Shared tour-page navigation: GIGS DASHBOARD standalone (left) + numbered
// step box (right). Used by the tour root, import, assets, and template pages.
// No "use client" directive — uses only next/link + inline styles, so this
// component renders fine inside both server (tour root) and client (import,
// assets, template) pages.
//
// Previously this nav was copy-pasted inline across the 4 surfaces. Extracted
// June 2026 so step/active-state changes hit one file instead of four.

import Link from "next/link";

type Props = {
  tourId: string;
  active: "import" | "assets" | "template" | "gigs";
};

const itemBase: React.CSSProperties = {
  padding: "10px 18px",
  textDecoration: "none",
  fontFamily: "var(--hw-font-mono)",
  fontSize: 13,
  letterSpacing: "1.5px",
  textTransform: "uppercase",
};

const itemActive: React.CSSProperties = {
  border: "3px solid var(--hw-border-strong)",
  background: "var(--hw-bg-invert)",
  color: "#fff",
  fontWeight: 700,
};

const itemInactive: React.CSSProperties = {
  border: "3px solid transparent",
  background: "var(--hw-bg-surface)",
  color: "var(--hw-text)",
  fontWeight: 400,
};

function itemStyle(isActive: boolean): React.CSSProperties {
  return { ...itemBase, ...(isActive ? itemActive : itemInactive) };
}

export function TourPageNav({ tourId, active }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <Link href={`/dashboard/tours/${tourId}`} style={itemStyle(active === "gigs")}>
        GIGS DASHBOARD
      </Link>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", padding: 8 }}>
        <Link href={`/dashboard/tours/${tourId}/import`} style={itemStyle(active === "import")}>
          1. IMPORT SCHEDULE
        </Link>
        <Link href={`/dashboard/tours/${tourId}/assets`} style={itemStyle(active === "assets")}>
          2. IMPORT ASSETS
        </Link>
        <Link href={`/dashboard/tours/${tourId}/template`} style={itemStyle(active === "template")}>
          3. DESIGN TEMPLATE
        </Link>
      </div>
    </div>
  );
}
