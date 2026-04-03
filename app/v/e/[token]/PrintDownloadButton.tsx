"use client";

import { useState } from "react";

export default function PrintDownloadButton({ eventId, venueName }: { eventId: string; venueName: string }) {
  const [generating, setGenerating] = useState(false);

  const handlePrintDownload = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/renders/print-pdf?eventId=${eventId}`);
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `print_poster_${venueName.replace(/[^a-zA-Z0-9_-]/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to generate print poster");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={handlePrintDownload}
      disabled={generating}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "16px 28px",
        border: "3px solid var(--hw-border-strong)",
        background: "var(--hw-bg-invert)",
        color: "var(--hw-text-invert)",
        fontFamily: "var(--hw-font-display)",
        fontWeight: 400,
        fontSize: 16,
        letterSpacing: "3px",
        textTransform: "uppercase" as const,
        cursor: generating ? "wait" : "pointer",
        opacity: generating ? 0.7 : 1,
        transition: "opacity 0.15s",
      }}
    >
      {generating ? (
        <>
          <span style={{ display: "inline-block", animation: "spin 1s linear infinite", fontSize: 16 }}>&#9696;</span>
          Generating PDF...
        </>
      ) : (
        <>
          <span style={{ fontSize: 18 }}>&#128438;</span>
          Download Print Poster (11x17 PDF)
        </>
      )}
    </button>
  );
}
