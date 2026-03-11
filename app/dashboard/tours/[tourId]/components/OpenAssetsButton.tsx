"use client";

import { useState, useRef, useCallback } from "react";

type TextElement = {
  id: string;
  label: string;
  value: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontWeight: number;
  fontFamily: string;
};

type Props = {
  event: {
    id: string;
    date_iso: string;
    city: string;
    state: string | null;
    venue: string;
  };
};

const CANVAS_W = 1080;
const CANVAS_H = 1080;

function makeDefaultElements(event: Props["event"]): TextElement[] {
  const cityState = event.state
    ? `${event.city}, ${event.state}`
    : event.city;

  return [
    {
      id: "date",
      label: "Date",
      value: event.date_iso,
      x: 80,
      y: 80,
      fontSize: 52,
      color: "#ffffff",
      fontWeight: 900,
      fontFamily: "sans-serif",
    },
    {
      id: "venue",
      label: "Venue",
      value: event.venue,
      x: 80,
      y: 160,
      fontSize: 38,
      color: "#ffffff",
      fontWeight: 700,
      fontFamily: "sans-serif",
    },
    {
      id: "city",
      label: "City / State",
      value: cityState,
      x: 80,
      y: 230,
      fontSize: 30,
      color: "#eeeeee",
      fontWeight: 400,
      fontFamily: "sans-serif",
    },
  ];
}

export default function OpenAssetsButton({ event }: Props) {
  const [open, setOpen] = useState(false);
  const [elements, setElements] = useState<TextElement[]>(() =>
    makeDefaultElements(event)
  );
  const [selectedId, setSelectedId] = useState<string | null>("date");
  const [bgImage, setBgImage] = useState<string | null>(null);

  // Drag state
  const dragging = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const selected = elements.find((el) => el.id === selectedId) ?? null;

  // ── open / close ──────────────────────────────────────────────
  function handleOpen() {
    setElements(makeDefaultElements(event));
    setSelectedId("date");
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
  }

  // ── background upload ─────────────────────────────────────────
  function handleBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setBgImage(url);
  }

  // ── drag handlers ─────────────────────────────────────────────
  function onMouseDown(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(id);
    const el = elements.find((x) => x.id === id);
    if (!el) return;
    dragging.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX: el.x,
      origY: el.y,
    };
  }

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging.current || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const dx = (e.clientX - dragging.current.startX) * scaleX;
      const dy = (e.clientY - dragging.current.startY) * scaleY;
      setElements((prev) =>
        prev.map((el) =>
          el.id === dragging.current!.id
            ? {
                ...el,
                x: Math.round(dragging.current!.origX + dx),
                y: Math.round(dragging.current!.origY + dy),
              }
            : el
        )
      );
    },
    []
  );

  function onMouseUp() {
    dragging.current = null;
  }

  // ── update selected element props ─────────────────────────────
  function updateSelected(patch: Partial<TextElement>) {
    if (!selectedId) return;
    setElements((prev) =>
      prev.map((el) => (el.id === selectedId ? { ...el, ...patch } : el))
    );
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        style={{
          padding: "6px 10px",
          borderRadius: 999,
          border: "1px solid #111",
          background: "#111",
          color: "#fff",
          cursor: "pointer",
          fontWeight: 900,
          fontSize: 12,
          whiteSpace: "nowrap",
        }}
      >
        Open Assets
      </button>
    );
  }

  return (
    <>
      {/* ── Fullscreen Modal Overlay ─────────────────────────── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px",
            background: "#111",
            borderBottom: "1px solid #333",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span
              style={{
                color: "#fff",
                fontWeight: 900,
                fontSize: 14,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              LOCALIZER · Asset Editor
            </span>
            <span style={{ color: "#666", fontSize: 12 }}>
              {event.venue} · {event.date_iso}
            </span>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label
              style={{
                padding: "7px 12px",
                borderRadius: 8,
                border: "1px solid #444",
                background: "#222",
                color: "#ccc",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {bgImage ? "Change Background" : "+ Upload Background"}
              <input
                type="file"
                accept="image/*"
                onChange={handleBgUpload}
                style={{ display: "none" }}
              />
            </label>

            <button
              onClick={handleClose}
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                border: "1px solid #555",
                background: "transparent",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            gap: 0,
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          {/* ── Canvas area ────────────────────────────────────── */}
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 32,
              overflow: "hidden",
            }}
          >
            <div
              ref={canvasRef}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onClick={() => setSelectedId(null)}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 600,
                aspectRatio: "1 / 1",
                background: bgImage
                  ? `url(${bgImage}) center/cover no-repeat`
                  : "#1a1a1a",
                borderRadius: 12,
                overflow: "hidden",
                boxShadow: "0 0 0 1px #444, 0 24px 60px rgba(0,0,0,0.6)",
                cursor: "default",
                userSelect: "none",
              }}
            >
              {/* Checkerboard hint if no bg */}
              {!bgImage && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: 8,
                    pointerEvents: "none",
                  }}
                >
                  <div style={{ fontSize: 40, opacity: 0.15 }}>🖼</div>
                  <div
                    style={{
                      color: "#555",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                    }}
                  >
                    Upload a background image
                  </div>
                </div>
              )}

              {/* Text elements */}
              {elements.map((el) => {
                const rect = canvasRef.current?.getBoundingClientRect();
                const scale = rect ? rect.width / CANVAS_W : 1;
                const isSelected = el.id === selectedId;

                return (
                  <div
                    key={el.id}
                    onMouseDown={(e) => onMouseDown(e, el.id)}
                    style={{
                      position: "absolute",
                      left: el.x * scale,
                      top: el.y * scale,
                      fontSize: el.fontSize * scale,
                      color: el.color,
                      fontWeight: el.fontWeight,
                      fontFamily: el.fontFamily,
                      cursor: "grab",
                      padding: "2px 4px",
                      borderRadius: 4,
                      outline: isSelected
                        ? "2px solid rgba(255,255,255,0.7)"
                        : "2px solid transparent",
                      background: isSelected
                        ? "rgba(255,255,255,0.08)"
                        : "transparent",
                      whiteSpace: "nowrap",
                      lineHeight: 1.1,
                      transition: "outline 0.1s",
                      textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                    }}
                  >
                    {el.value}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Right sidebar ───────────────────────────────────── */}
          <div
            style={{
              width: 280,
              background: "#161616",
              borderLeft: "1px solid #2a2a2a",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {/* Layer list */}
            <div
              style={{
                padding: "14px 16px 10px",
                borderBottom: "1px solid #2a2a2a",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 900,
                  color: "#666",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  marginBottom: 10,
                }}
              >
                Text Layers
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {elements.map((el) => (
                  <button
                    key={el.id}
                    onClick={() => setSelectedId(el.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 10px",
                      borderRadius: 8,
                      border: "1px solid",
                      borderColor:
                        el.id === selectedId ? "#444" : "transparent",
                      background:
                        el.id === selectedId ? "#222" : "transparent",
                      color: "#ccc",
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#666",
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                        }}
                      >
                        {el.label}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#ddd",
                          marginTop: 2,
                          maxWidth: 180,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {el.value}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 99,
                        background: el.color,
                        border: "1px solid #444",
                        flexShrink: 0,
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Controls for selected layer */}
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              {selected ? (
                <>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      color: "#666",
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      marginBottom: 14,
                    }}
                  >
                    Edit · {selected.label}
                  </div>

                  {/* Text value */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Text</label>
                    <input
                      value={selected.value}
                      onChange={(e) =>
                        updateSelected({ value: e.target.value })
                      }
                      style={inputStyle}
                    />
                  </div>

                  {/* Font size */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>
                      Font Size · {selected.fontSize}px
                    </label>
                    <input
                      type="range"
                      min={12}
                      max={120}
                      value={selected.fontSize}
                      onChange={(e) =>
                        updateSelected({ fontSize: Number(e.target.value) })
                      }
                      style={{ width: "100%", accentColor: "#fff" }}
                    />
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 10,
                        color: "#555",
                        marginTop: 2,
                      }}
                    >
                      <span>12</span>
                      <span>120</span>
                    </div>
                  </div>

                  {/* Color */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Color</label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {PRESETS.map((c) => (
                        <button
                          key={c}
                          onClick={() => updateSelected({ color: c })}
                          title={c}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: c,
                            border:
                              selected.color === c
                                ? "2px solid #fff"
                                : "1px solid #333",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        />
                      ))}
                      <input
                        type="color"
                        value={selected.color}
                        onChange={(e) =>
                          updateSelected({ color: e.target.value })
                        }
                        title="Custom color"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 6,
                          border: "1px solid #333",
                          padding: 0,
                          background: "none",
                          cursor: "pointer",
                        }}
                      />
                    </div>
                  </div>

                  {/* Font weight */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Weight</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      {[
                        { label: "Regular", value: 400 },
                        { label: "Bold", value: 700 },
                        { label: "Black", value: 900 },
                      ].map((w) => (
                        <button
                          key={w.value}
                          onClick={() =>
                            updateSelected({ fontWeight: w.value })
                          }
                          style={{
                            flex: 1,
                            padding: "6px 0",
                            borderRadius: 7,
                            border: "1px solid",
                            borderColor:
                              selected.fontWeight === w.value
                                ? "#fff"
                                : "#333",
                            background:
                              selected.fontWeight === w.value
                                ? "#fff"
                                : "transparent",
                            color:
                              selected.fontWeight === w.value
                                ? "#000"
                                : "#888",
                            fontSize: 11,
                            fontWeight: w.value,
                            cursor: "pointer",
                          }}
                        >
                          {w.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Position readout */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Position</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: "#555", marginBottom: 3 }}>X</div>
                        <input
                          type="number"
                          value={selected.x}
                          onChange={(e) =>
                            updateSelected({ x: Number(e.target.value) })
                          }
                          style={{ ...inputStyle, fontFamily: "monospace" }}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, color: "#555", marginBottom: 3 }}>Y</div>
                        <input
                          type="number"
                          value={selected.y}
                          onChange={(e) =>
                            updateSelected({ y: Number(e.target.value) })
                          }
                          style={{ ...inputStyle, fontFamily: "monospace" }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    color: "#444",
                    fontSize: 13,
                    textAlign: "center",
                    marginTop: 40,
                    lineHeight: 1.6,
                  }}
                >
                  Click a text layer
                  <br />
                  to edit it
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div
              style={{
                padding: 16,
                borderTop: "1px solid #2a2a2a",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                flexShrink: 0,
              }}
            >
              <button
                style={{
                  padding: "10px 0",
                  borderRadius: 9,
                  border: "none",
                  background: "#fff",
                  color: "#000",
                  fontWeight: 900,
                  fontSize: 13,
                  cursor: "pointer",
                  width: "100%",
                }}
                onClick={() => {
                  // TODO: wire up real export / save to Supabase
                  alert("Export coming soon — this will save the rendered asset.");
                }}
              >
                Save Asset
              </button>
              <button
                style={{
                  padding: "8px 0",
                  borderRadius: 9,
                  border: "1px solid #333",
                  background: "transparent",
                  color: "#888",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                  width: "100%",
                }}
                onClick={() => setElements(makeDefaultElements(event))}
              >
                Reset to defaults
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Shared styles ────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "#666",
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "7px 10px",
  borderRadius: 7,
  border: "1px solid #2a2a2a",
  background: "#111",
  color: "#ddd",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

const PRESETS = [
  "#ffffff",
  "#000000",
  "#eeeeee",
  "#f5f5dc",
  "#ffd700",
  "#ff4444",
  "#44aaff",
  "#44ff88",
];
