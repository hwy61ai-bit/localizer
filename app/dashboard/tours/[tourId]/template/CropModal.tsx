"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Cropper from "react-easy-crop";
import type { Area, Point } from "react-easy-crop";
import HwButton from "@/app/components/hw/HwButton";

export type CropFormatKey = "square" | "story" | "landscape" | "print";
export type CropRegion = { x: number; y: number; w: number; h: number };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  format: CropFormatKey;
  formatLabel: string;
  aspect: number;
  initialCrop: CropRegion | null;
  onSave: (crop: CropRegion) => Promise<void>;
  onReset: () => Promise<void>;
};

const STAGE_HEIGHT = 480;

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export default function CropModal({
  isOpen,
  onClose,
  imageUrl,
  format,
  formatLabel,
  aspect,
  initialCrop,
  onSave,
  onReset,
}: Props) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveWrapRef = useRef<HTMLDivElement | null>(null);
  const titleId = `crop-modal-title-${format}`;

  const initialCroppedAreaPercentages: Area | undefined = useMemo(() => {
    if (!initialCrop) return undefined;
    return {
      x: clamp01(initialCrop.x) * 100,
      y: clamp01(initialCrop.y) * 100,
      width: clamp01(initialCrop.w) * 100,
      height: clamp01(initialCrop.h) * 100,
    };
  }, [initialCrop]);

  useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedArea(null);
      setError(null);
      setBusy(false);
    }
  }, [isOpen, format]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => {
      saveWrapRef.current?.querySelector("button")?.focus();
    }, 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [isOpen, onClose]);

  const onCropComplete = useCallback((areaPct: Area, _areaPx: Area) => {
    setCroppedArea(areaPct);
  }, []);

  const previewStyle: React.CSSProperties = useMemo(() => {
    if (!croppedArea) {
      return {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    }
    const cw = clamp01(croppedArea.width / 100);
    const ch = clamp01(croppedArea.height / 100);
    const cx = clamp01(croppedArea.x / 100);
    const cy = clamp01(croppedArea.y / 100);
    const sizeX = cw > 0 ? `${100 / cw}%` : "100%";
    const sizeY = ch > 0 ? `${100 / ch}%` : "100%";
    const posX = cw < 1 ? `${(cx / (1 - cw)) * 100}%` : "0%";
    const posY = ch < 1 ? `${(cy / (1 - ch)) * 100}%` : "0%";
    return {
      backgroundImage: `url(${imageUrl})`,
      backgroundSize: `${sizeX} ${sizeY}`,
      backgroundPosition: `${posX} ${posY}`,
      backgroundRepeat: "no-repeat",
    };
  }, [croppedArea, imageUrl]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!croppedArea) return;
    setBusy(true);
    setError(null);
    try {
      const region: CropRegion = {
        x: clamp01(croppedArea.x / 100),
        y: clamp01(croppedArea.y / 100),
        w: clamp01(croppedArea.width / 100),
        h: clamp01(croppedArea.height / 100),
      };
      await onSave(region);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save crop");
      setBusy(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm("Reset crop for this format?")) return;
    setBusy(true);
    setError(null);
    try {
      await onReset();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Failed to reset crop");
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--hw-bg-surface)",
          border: "3px solid var(--hw-border-strong)",
          boxShadow: "var(--hw-shadow-xl)",
          width: "min(960px, 95vw)",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            flexShrink: 0,
            borderBottom: "3px solid var(--hw-border-strong)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2
            id={titleId}
            style={{
              fontFamily: "var(--hw-font-display)",
              fontSize: 22,
              textTransform: "uppercase",
              letterSpacing: "2px",
              color: "var(--hw-text)",
              margin: 0,
            }}
          >
            Crop Image — {formatLabel}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              fontSize: 22,
              lineHeight: 1,
              color: "var(--hw-text-muted)",
              cursor: "pointer",
              padding: 0,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            padding: 24,
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            display: "grid",
            gridTemplateColumns: "minmax(0, 65%) minmax(0, 35%)",
            gap: 20,
            fontFamily: "var(--hw-font-body)",
            fontSize: 14,
            color: "var(--hw-text)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                height: STAGE_HEIGHT,
                background: "var(--hw-bg-invert)",
                border: "3px solid var(--hw-border-strong)",
              }}
            >
              <Cropper
                image={imageUrl}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                initialCroppedAreaPercentages={initialCroppedAreaPercentages}
                showGrid={true}
                restrictPosition={true}
              />
            </div>
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span
                style={{
                  fontFamily: "var(--hw-font-mono)",
                  fontSize: 13,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: "var(--hw-text-muted)",
                }}
              >
                Zoom
              </span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </label>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                fontFamily: "var(--hw-font-mono)",
                fontSize: 13,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "var(--hw-text-muted)",
              }}
            >
              Framing Preview
            </div>
            <div
              style={{
                width: "100%",
                aspectRatio: aspect,
                border: "3px solid var(--hw-border-strong)",
                background: "var(--hw-bg-invert)",
                ...previewStyle,
              }}
              aria-hidden="true"
            />
          </div>
        </div>

        <div
          style={{
            padding: "0 24px 16px",
            flexShrink: 0,
            fontFamily: "var(--hw-font-body)",
            fontSize: 13,
            color: "var(--hw-text-secondary)",
            fontStyle: "italic",
          }}
        >
          Text positions stay where they are on the final image. After cropping,
          you may want to adjust text positioning in the editor if it overlaps.
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: "0 24px 12px",
              flexShrink: 0,
              fontFamily: "var(--hw-font-body)",
              fontSize: 13,
              color: "var(--hw-crimson)",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            padding: "16px 24px",
            flexShrink: 0,
            borderTop: "3px solid var(--hw-border-strong)",
            background: "var(--hw-bg)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <HwButton variant="destructive" onClick={handleReset} disabled={busy}>
            Reset
          </HwButton>
          <HwButton variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </HwButton>
          <div ref={saveWrapRef} style={{ display: "contents" }}>
            <HwButton
              variant="primary"
              onClick={handleSave}
              disabled={busy || !croppedArea}
            >
              {busy ? "Saving…" : "Save"}
            </HwButton>
          </div>
        </div>
      </div>
    </div>
  );
}
