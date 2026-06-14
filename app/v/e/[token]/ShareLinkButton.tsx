"use client";

import { useState } from "react";

export default function ShareLinkButton() {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — no-op
    }
  }

  return (
    <button
      onClick={handleCopy}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "16px 32px",
        border: "3px solid var(--hw-border-strong)",
        background: "var(--hw-bg-surface)",
        color: "var(--hw-text)",
        fontFamily: "var(--hw-font-display)",
        fontSize: 16,
        letterSpacing: "3px",
        textDecoration: "none",
        whiteSpace: "nowrap",
        flexShrink: 0,
        textTransform: "uppercase",
        transition: "var(--hw-ease)",
        cursor: "pointer",
      }}
    >
      {copied ? "COPIED ✓" : "⧉ SHARE"}
    </button>
  );
}
