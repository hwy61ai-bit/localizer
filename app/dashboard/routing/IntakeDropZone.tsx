"use client";

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import posthog from "posthog-js";

type IntakeResult = {
  documentType: string;
  documentTypeConfidence: number;
  suggestedTypes: string[];
  matchedShowId: string | null;
  matchedShowConfidence: number;
  fields: Record<string, unknown>;
  confidence: Record<string, number>;
  confirmationRequired: string[];
  autoConfirmed: string[];
  reviewRequired: string[];
  storageUrl: string;
};

type ShowOption = { id: string; label: string };

const DOC_TYPE_LABELS: Record<string, string> = {
  deal_memo: "Deal Memo",
  settlement: "Settlement",
  box_office: "Box Office Report",
  hotel_confirmation: "Hotel Confirmation",
  expense_receipt: "Expense Receipt",
  advance_response: "Advance Response",
  contact_list: "Contact List",
  co_headliner: "Co-Headliner Agreement",
  unknown: "Unknown",
};

export default function IntakeDropZone({
  children,
  tourId,
  showId,
  shows,
  onSaved,
}: {
  children: ReactNode;
  tourId: string;
  showId?: string | null;
  shows?: ShowOption[];
  onSaved?: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [editedFields, setEditedFields] = useState<Record<string, unknown>>({});
  const [editedType, setEditedType] = useState("");
  const [editedShowId, setEditedShowId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const dragCounterRef = useRef(0);

  // Prevent browser from opening dropped files
  useEffect(() => {
    const prevent = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setProcessing(true);
    setProcessingStep("Reading file...");
    setError(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];

      setProcessingStep("Analyzing document...");

      try {
        const resp = await fetch("/api/tourrouter/intake", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base64,
            fileType: file.type,
            fileName: file.name,
            tourId,
            showId: showId || null,
          }),
        });

        if (!resp.ok) {
          const err = await resp.json();
          setError(err.error || "Processing failed");
          setProcessing(false);
          return;
        }

        const data: IntakeResult = await resp.json();
        posthog.capture("document_dropped", { document_type: data.documentType });
        setResult(data);
        setEditedFields({ ...data.fields });
        setEditedType(data.documentType);
        setEditedShowId(data.matchedShowId);
        setProcessing(false);
      } catch {
        setError("Failed to process document");
        setProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  }, [tourId, showId]);

  async function confirmSave() {
    if (!result) return;
    setSaving(true);
    setError(null);

    try {
      const resp = await fetch("/api/tourrouter/intake/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: editedType,
          showId: editedShowId,
          tourId,
          fields: editedFields,
          storageUrl: result.storageUrl,
          fileName,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json();
        setError(err.error || "Save failed");
        setSaving(false);
        return;
      }

      const data = await resp.json();
      setSavedMsg(data.saved?.join(", ") || "Saved");
      setResult(null);
      setSaving(false);
      if (onSaved) onSaved();
      setTimeout(() => setSavedMsg(null), 3000);
    } catch {
      setError("Save failed");
      setSaving(false);
    }
  }

  function updateField(key: string, value: unknown) {
    setEditedFields((prev) => ({ ...prev, [key]: value }));
  }

  function closeReview() {
    setResult(null);
    setError(null);
  }

  const fieldColor = (key: string): string => {
    if (!result) return "var(--hw-bg-surface)";
    if (result.confirmationRequired.includes(key)) return "var(--hw-red-ghost)";
    if (result.reviewRequired.includes(key)) return "var(--hw-amber-ghost)";
    return "var(--hw-green-ghost)";
  };

  const fieldBorder = (key: string): string => {
    if (!result) return "var(--hw-border-strong)";
    if (result.confirmationRequired.includes(key)) return "var(--hw-crimson)";
    if (result.reviewRequired.includes(key)) return "var(--hw-amber)";
    return "var(--hw-green-border)";
  };

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current++;
        setDragOver(true);
      }}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current--;
        if (dragCounterRef.current === 0) setDragOver(false);
      }}
      onDrop={handleDrop}
      style={{ position: "relative" }}
    >
      {children}

      {/* Drag overlay */}
      {dragOver && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 950,
          background: "rgba(0,0,0,0.6)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            border: "3px dashed var(--hw-crimson)",
            background: "var(--hw-crimson-ghost)",
            padding: "60px 80px", textAlign: "center",
          }}>
            <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 48, marginBottom: 12, opacity: 0.7, color: "var(--hw-crimson)" }}>+</div>
            <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 24, letterSpacing: "2px", textTransform: "uppercase", color: "#fff" }}>DROP DOCUMENT TO PROCESS</div>
            <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginTop: 8 }}>
              DEAL MEMOS, SETTLEMENTS, HOTEL CONFIRMATIONS, RECEIPTS, ADVANCES
            </div>
          </div>
        </div>
      )}

      {/* Processing modal */}
      {processing && (
        <div style={{ position: "fixed", inset: 0, zIndex: 960, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)", boxShadow: "var(--hw-shadow-xl)", padding: 40, textAlign: "center", maxWidth: 400 }}>
            <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 8 }}>PROCESSING DOCUMENT</div>
            <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-muted)", marginBottom: 16 }}>{fileName}</div>
            <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: "1px", color: "var(--hw-text)" }}>{processingStep}</div>
            <style>{`@keyframes intakeProgress { from { width: 0%; } to { width: 85%; } }`}</style>
            <div style={{ width: "100%", height: 4, background: "var(--hw-border)", marginTop: 16 }}>
              <div style={{ height: "100%", background: "var(--hw-crimson)", animation: "intakeProgress 15s linear forwards" }} />
            </div>
          </div>
        </div>
      )}

      {/* Saved toast */}
      {savedMsg && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 970, background: "var(--hw-bg-invert)", color: "var(--hw-text-invert)", padding: "12px 24px", border: "3px solid var(--hw-border-strong)", boxShadow: "var(--hw-shadow-lg)", fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" }}>
          {savedMsg}
        </div>
      )}

      {/* Error toast */}
      {error && !result && !processing && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 970, background: "var(--hw-crimson)", color: "#fff", padding: "12px 24px", border: "3px solid var(--hw-crimson)", boxShadow: "var(--hw-shadow-lg)", fontFamily: "var(--hw-font-mono)", fontSize: 11, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", cursor: "pointer" }} onClick={() => setError(null)}>
          {error} (CLICK TO DISMISS)
        </div>
      )}

      {/* Review modal */}
      {result && (
        <>
          <div onClick={closeReview} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 960 }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            width: 600, maxWidth: "95vw", maxHeight: "85vh", overflowY: "auto",
            background: "var(--hw-bg-surface)", border: "3px solid var(--hw-border-strong)",
            zIndex: 961, boxShadow: "var(--hw-shadow-xl)",
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 24px", borderBottom: "3px solid var(--hw-border-strong)" }}>
              <div>
                <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 22, letterSpacing: "2px", textTransform: "uppercase", marginBottom: 4 }}>REVIEW EXTRACTED DATA</div>
                <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-muted)" }}>{fileName}</div>
              </div>
              <button onClick={closeReview} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--hw-text-muted)" }}>&times;</button>
            </div>

            {/* Document type */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 24px", marginTop: 16, marginBottom: 16 }}>
              <div>
                <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-secondary)", display: "block", marginBottom: 6 }}>DOCUMENT TYPE</label>
                <select
                  value={editedType}
                  onChange={(e) => setEditedType(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontFamily: "var(--hw-font-body)", fontSize: 13, background: "var(--hw-bg-surface)", outline: "none", appearance: "none" }}
                >
                  {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                {result.documentTypeConfidence < 0.8 && result.suggestedTypes.length > 0 && (
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, color: "var(--hw-amber)", marginTop: 4 }}>
                    Low confidence ({Math.round(result.documentTypeConfidence * 100)}%). Also consider: {result.suggestedTypes.map((t) => DOC_TYPE_LABELS[t] || t).join(", ")}
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-secondary)", display: "block", marginBottom: 6 }}>MATCHED SHOW</label>
                <select
                  value={editedShowId || ""}
                  onChange={(e) => setEditedShowId(e.target.value || null)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "3px solid var(--hw-border-strong)", fontFamily: "var(--hw-font-body)", fontSize: 13, background: "var(--hw-bg-surface)", outline: "none", appearance: "none" }}
                >
                  <option value="">No show selected</option>
                  {(shows || []).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                {result.matchedShowId && (
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, marginTop: 4, color: result.matchedShowConfidence >= 0.8 ? "var(--hw-green)" : "var(--hw-amber)" }}>
                    {result.matchedShowConfidence >= 0.8
                      ? `Auto-matched (${Math.round(result.matchedShowConfidence * 100)}% confidence)`
                      : `Low confidence match (${Math.round(result.matchedShowConfidence * 100)}%) — please verify`}
                  </div>
                )}
                {!result.matchedShowId && (
                  <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, marginTop: 4, color: "var(--hw-text-muted)" }}>
                    No show auto-matched — please select from the list
                  </div>
                )}
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 12, padding: "0 24px", marginBottom: 12, fontFamily: "var(--hw-font-mono)", fontSize: 9, letterSpacing: "1px", textTransform: "uppercase" }}>
              <span><span style={{ display: "inline-block", width: 10, height: 10, background: "var(--hw-green-ghost)", border: "2px solid var(--hw-green-border)", marginRight: 4 }} />Auto-confirmed</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, background: "var(--hw-amber-ghost)", border: "2px solid var(--hw-amber)", marginRight: 4 }} />Review</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, background: "var(--hw-red-ghost)", border: "2px solid var(--hw-crimson)", marginRight: 4 }} />Confirm required</span>
            </div>

            {/* Fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 24px", marginBottom: 16 }}>
              {Object.entries(editedFields).map(([key, val]) => {
                if (val === null || val === undefined) return null;
                const isObject = typeof val === "object";
                return (
                  <div key={key} style={{ gridColumn: isObject || String(val).length > 60 ? "1 / -1" : undefined }}>
                    <label style={{ fontFamily: "var(--hw-font-mono)", fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--hw-text-muted)", display: "block", marginBottom: 4 }}>
                      {key.replace(/_/g, " ")}
                      {result.confidence[key] !== undefined && (
                        <span style={{ marginLeft: 4, color: result.confidence[key] >= 0.95 ? "var(--hw-green)" : result.confidence[key] >= 0.75 ? "var(--hw-amber)" : "var(--hw-crimson)" }}>
                          {Math.round(result.confidence[key] * 100)}%
                        </span>
                      )}
                    </label>
                    {isObject ? (
                      <textarea
                        value={JSON.stringify(val, null, 2)}
                        onChange={(e) => { try { updateField(key, JSON.parse(e.target.value)); } catch { /* invalid json */ } }}
                        rows={3}
                        style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: `3px solid ${fieldBorder(key)}`, fontFamily: "var(--hw-font-mono)", fontSize: 12, outline: "none", background: fieldColor(key), resize: "vertical" }}
                      />
                    ) : (
                      <input
                        value={String(val)}
                        onChange={(e) => updateField(key, e.target.value)}
                        style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: `3px solid ${fieldBorder(key)}`, fontFamily: "var(--hw-font-body)", fontSize: 13, outline: "none", background: fieldColor(key) }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {error && (
              <div style={{ margin: "0 24px 12px", background: "var(--hw-red-ghost)", border: "3px solid var(--hw-crimson)", padding: "8px 12px", fontFamily: "var(--hw-font-mono)", fontSize: 11, color: "var(--hw-crimson)" }}>{error}</div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, padding: "16px 24px", borderTop: "3px solid var(--hw-border-strong)", background: "var(--hw-bg)" }}>
              <button onClick={closeReview} style={{ padding: "8px 16px", border: "3px solid var(--hw-border-strong)", background: "var(--hw-bg-surface)", fontFamily: "var(--hw-font-display)", fontSize: 12, letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer" }}>CANCEL</button>
              <button
                onClick={confirmSave}
                disabled={saving}
                style={{ padding: "8px 20px", border: "3px solid var(--hw-crimson)", background: "var(--hw-crimson)", color: "#fff", fontFamily: "var(--hw-font-display)", fontSize: 12, letterSpacing: "3px", textTransform: "uppercase", cursor: "pointer", opacity: saving ? 0.4 : 1 }}
              >{saving ? "SAVING..." : "CONFIRM & SAVE"}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
