"use client";

import { useState } from "react";

export default function W9DownloadGate({
  token,
  available,
}: {
  token: string;
  available: boolean;
}) {
  const [mode, setMode] = useState<"default" | "confirm" | "downloading">(
    "default",
  );

  // ── Unavailable: exact copy of the page's disabled tile (page.tsx l.220–225) ──
  if (!available) {
    return (
      <div
        style={{
          aspectRatio: "1 / 1",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: 16,
          background: "var(--hw-bg-surface)",
          border: "3px solid var(--hw-border-strong)",
          cursor: "not-allowed",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--hw-font-display)",
            fontSize: 24,
            opacity: 0.3,
            color: "var(--hw-text-muted)",
          }}
        >
          ↓
        </span>
        <span
          style={{
            fontFamily: "var(--hw-font-display)",
            fontSize: 15,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "var(--hw-text-muted)",
            lineHeight: 1.2,
          }}
        >
          W-9
        </span>
        <span
          style={{
            fontFamily: "var(--hw-font-mono)",
            fontSize: 11,
            fontWeight: 400,
            fontStyle: "italic",
            letterSpacing: "1px",
            color: "var(--hw-text-muted)",
          }}
        >
          Not uploaded yet
        </span>
      </div>
    );
  }

  // ── Confirm state (also covers the transient "downloading" flash) ──
  // Aspect-ratio dropped intentionally: the acknowledgment copy plus two stacked
  // buttons won't fit legibly inside a 1/1 square at minmax(140px, 1fr) without
  // shrinking text below the 10px floor. This tile grows taller; adjacent
  // tiles keep their 1/1 shape.
  if (mode === "confirm" || mode === "downloading") {
    const primaryBtnStyle: React.CSSProperties = {
      padding: "10px 12px",
      background: "var(--hw-bg-invert)",
      color: "var(--hw-text-invert)",
      border: "3px solid var(--hw-border-strong)",
      borderRadius: 0,
      fontFamily: "var(--hw-font-display)",
      fontSize: 13,
      letterSpacing: "2px",
      textTransform: "uppercase",
      cursor: mode === "downloading" ? "wait" : "pointer",
      opacity: mode === "downloading" ? 0.6 : 1,
      transition: "var(--hw-ease)",
    };
    const secondaryBtnStyle: React.CSSProperties = {
      padding: "10px 12px",
      background: "var(--hw-bg-surface)",
      color: "var(--hw-text)",
      border: "3px solid var(--hw-border-strong)",
      borderRadius: 0,
      fontFamily: "var(--hw-font-display)",
      fontSize: 13,
      letterSpacing: "2px",
      textTransform: "uppercase",
      cursor: mode === "downloading" ? "not-allowed" : "pointer",
      opacity: mode === "downloading" ? 0.6 : 1,
      transition: "var(--hw-ease)",
    };
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          justifyContent: "center",
          gap: 12,
          padding: 16,
          background: "var(--hw-bg-surface)",
          border: "3px solid var(--hw-border-strong)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--hw-font-body)",
            fontSize: 12,
            lineHeight: 1.4,
            color: "var(--hw-text)",
          }}
        >
          This document contains tax information. By downloading, you confirm
          you&rsquo;re authorized to receive it for this booking.
        </div>
        <button
          type="button"
          onClick={() => {
            setMode("downloading");
            window.location.href = `/api/advance-doc?token=${encodeURIComponent(
              token,
            )}&fieldId=adv_w9_url`;
            setTimeout(() => setMode("default"), 3000);
          }}
          disabled={mode === "downloading"}
          style={primaryBtnStyle}
        >
          {mode === "downloading" ? "Downloading\u2026" : "Confirm & Download"}
        </button>
        <button
          type="button"
          onClick={() => setMode("default")}
          disabled={mode === "downloading"}
          style={secondaryBtnStyle}
        >
          Cancel
        </button>
      </div>
    );
  }

  // ── Default: green tile styled as a button (page.tsx l.214–218 <a> mirror) ──
  return (
    <button
      type="button"
      onClick={() => setMode("confirm")}
      style={{
        aspectRatio: "1 / 1",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: 16,
        background: "var(--hw-green-ghost)",
        border: "3px solid var(--hw-border-strong)",
        borderRadius: 0,
        cursor: "pointer",
        textAlign: "center",
        transition: "var(--hw-ease)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--hw-font-display)",
          fontSize: 24,
          color: "var(--hw-green)",
        }}
      >
        ↓
      </span>
      <span
        style={{
          fontFamily: "var(--hw-font-display)",
          fontSize: 15,
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: "var(--hw-green)",
          lineHeight: 1.2,
        }}
      >
        W-9
      </span>
    </button>
  );
}
