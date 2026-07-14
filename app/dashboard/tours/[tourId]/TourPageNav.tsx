// Shared tour-page navigation: GIGS DASHBOARD standalone Link + numbered
// step box. Used by the tour root, import, assets, and template pages.
//
// LAYOUT CONTRACT: this component returns TWO sibling elements as a Fragment
// (the GIGS DASHBOARD Link and the 3-step box). It MUST be rendered inside a
// flex container with three direct children — typically `[title block]
// <TourPageNav /> [auto-resolves to GIGS link + box]`. The parent should set
// `display: flex, justifyContent: "space-between"` so the title pins left,
// the box pins right, and GIGS DASHBOARD floats at the midpoint. Add
// `flexWrap: "wrap"` for narrow-width safety. Returning a Fragment couples
// this component to its parent's row contract by design — the alternative
// (centering both nav elements together) creates the bunched cluster we
// explicitly moved away from.

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
    <>
      <Link href={`/dashboard/tours/${tourId}`} style={{ ...itemStyle(active === "gigs"), border: "3px solid var(--hw-border-strong)", ...(active === "gigs" ? { padding: "14px 28px", fontSize: 16, letterSpacing: "2px", marginLeft: 64 } : {}), marginLeft: 120 }}>
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
    </>
  );
}
