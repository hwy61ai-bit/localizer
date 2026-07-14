"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveBandTourInfo } from "./events/actions";

type Props = {
  tourId: string;
  initialBand: string;
  initialTourLabel: string;
};

export default function BandTourForm({ tourId, initialBand, initialTourLabel }: Props) {
  const router = useRouter();
  const [band, setBand] = useState(initialBand);
  const [tourLabel, setTourLabel] = useState(initialTourLabel);
  const savedBandRef = useRef(initialBand);
  const savedTourLabelRef = useRef(initialTourLabel);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function save(nextBand: string, nextTourLabel: string) {
    if (nextBand === savedBandRef.current && nextTourLabel === savedTourLabelRef.current) return;
    setStatus("saving");
    const result = await saveBandTourInfo(
      tourId,
      nextBand.trim() ? nextBand.trim() : null,
      nextTourLabel.trim() ? nextTourLabel.trim() : null,
    );
    if (result.ok) {
      savedBandRef.current = nextBand;
      savedTourLabelRef.current = nextTourLabel;
      setStatus("saved");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setStatus("idle"), 2000);
      if (result.flagged) {
        // Notify EventsTable to flip needs_rerender optimistically — no wait for router.refresh.
        window.dispatchEvent(new CustomEvent("tour-fields-changed", { detail: { tourId } }));
        router.refresh();
      }
    } else {
      setStatus("failed");
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.currentTarget as HTMLInputElement).blur();
    }
  }

  const labelStyle: React.CSSProperties = { fontFamily: "var(--hw-font-mono)", fontSize: 13, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-secondary)", marginBottom: 6 };

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={labelStyle}>BAND</div>
        <input value={band} onChange={e => setBand(e.target.value)} onBlur={() => save(band, tourLabel)} onKeyDown={handleKey} placeholder="Band name" style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", border: "3px solid var(--hw-border-strong)", fontFamily: "var(--hw-font-body)", fontSize: 18, fontWeight: 500, outline: "none" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={labelStyle}>TOUR</div>
        <input value={tourLabel} onChange={e => setTourLabel(e.target.value)} onBlur={() => save(band, tourLabel)} onKeyDown={handleKey} placeholder="Tour name" style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", border: "3px solid var(--hw-border-strong)", fontFamily: "var(--hw-font-body)", fontSize: 18, fontWeight: 500, outline: "none" }} />
      </div>
      <div style={{ minWidth: 100, paddingBottom: 14, fontFamily: "var(--hw-font-mono)", fontSize: 12, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" }}>
        {status === "saved" && <span style={{ color: "var(--hw-green)" }}>SAVED ✓</span>}
        {status === "failed" && <span style={{ color: "var(--hw-crimson)" }}>SAVE FAILED</span>}
      </div>
    </div>
  );
}
