"use client";

import { useState, useEffect } from "react";

export default function PrintDownloadButton({ eventId, venueName }: { eventId: string; venueName: string }) {
  const [generating, setGenerating] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!generating) {
      setElapsed(0);
      return;
    }
    const started = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - started) / 1000));
    }, 250);
    return () => clearInterval(interval);
  }, [generating]);

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
        display: "flex",
        flexDirection: generating ? "column" : "row",
        alignItems: generating ? "stretch" : "center",
        gap: 10,
        padding: generating ? "20px 28px" : "16px 28px",
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
          <style>{`
            @keyframes hwStripeMove {
              0% { background-position: 0 0; }
              100% { background-position: 28px 0; }
            }
          `}</style>
          <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 14, letterSpacing: "3px", textTransform: "uppercase", textAlign: "center" }}>
            GENERATING PDF — {elapsed}s
          </div>
          <div style={{ width: "100%", height: 8, background: "var(--hw-bg-surface)", overflow: "hidden" }}>
            <div style={{ width: "100%", height: "100%", background: "repeating-linear-gradient(45deg, var(--hw-crimson) 0px, var(--hw-crimson) 10px, transparent 10px, transparent 20px)", animation: "hwStripeMove 1s linear infinite" }} />
          </div>
          <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, fontWeight: 400, color: "var(--hw-text-muted)", letterSpacing: "1px", textAlign: "center" }}>
            This can take up to 30 seconds. Please don't refresh.
          </div>
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
