"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";

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
    if (!result) return "#fff";
    if (result.confirmationRequired.includes(key)) return "#fff5f5";
    if (result.reviewRequired.includes(key)) return "#fffbf0";
    return "#f0faf4";
  };

  const fieldBorder = (key: string): string => {
    if (!result) return "#DDDDDD";
    if (result.confirmationRequired.includes(key)) return "#ffcccc";
    if (result.reviewRequired.includes(key)) return "#f0d080";
    return "#c8e6c9";
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }}
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
            border: "3px dashed rgba(255,255,255,0.5)",
            borderRadius: 20, padding: "60px 80px", textAlign: "center",
          }}>
            <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.8 }}>+</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>Drop document to process</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>
              Deal memos, settlements, hotel confirmations, receipts, advances
            </div>
          </div>
        </div>
      )}

      {/* Processing modal */}
      {processing && (
        <div style={{ position: "fixed", inset: 0, zIndex: 960, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 40, textAlign: "center", maxWidth: 400 }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Processing Document</div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>{fileName}</div>
            <div style={{ fontSize: 13, color: "#111" }}>{processingStep}</div>
          </div>
        </div>
      )}

      {/* Saved toast */}
      {savedMsg && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 970, background: "#111", color: "#fff", padding: "10px 24px", borderRadius: 10, fontSize: 13, fontWeight: 700 }}>
          {savedMsg}
        </div>
      )}

      {/* Error toast */}
      {error && !result && !processing && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 970, background: "#c0392b", color: "#fff", padding: "10px 24px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }} onClick={() => setError(null)}>
          {error} (click to dismiss)
        </div>
      )}

      {/* Review modal */}
      {result && (
        <>
          <div onClick={closeReview} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 960 }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            width: 600, maxWidth: "95vw", maxHeight: "85vh", overflowY: "auto",
            background: "#fff", borderRadius: 14, padding: 24, zIndex: 961,
            boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Review Extracted Data</div>
                <div style={{ fontSize: 12, color: "#888" }}>{fileName}</div>
              </div>
              <button onClick={closeReview} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>&times;</button>
            </div>

            {/* Document type */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Document Type</label>
                <select
                  value={editedType}
                  onChange={(e) => setEditedType(e.target.value)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, background: "#fff", outline: "none" }}
                >
                  {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                {result.documentTypeConfidence < 0.8 && result.suggestedTypes.length > 0 && (
                  <div style={{ fontSize: 11, color: "#b35c00", marginTop: 4 }}>
                    Low confidence ({Math.round(result.documentTypeConfidence * 100)}%). Also consider: {result.suggestedTypes.map((t) => DOC_TYPE_LABELS[t] || t).join(", ")}
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>Matched Show</label>
                <select
                  value={editedShowId || ""}
                  onChange={(e) => setEditedShowId(e.target.value || null)}
                  style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", border: "1px solid #DDDDDD", borderRadius: 8, fontSize: 13, background: "#fff", outline: "none" }}
                >
                  <option value="">No show selected</option>
                  {(shows || []).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 12, marginBottom: 12, fontSize: 11 }}>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#f0faf4", border: "1px solid #c8e6c9", marginRight: 4 }} />Auto-confirmed</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#fffbf0", border: "1px solid #f0d080", marginRight: 4 }} />Review</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "#fff5f5", border: "1px solid #ffcccc", marginRight: 4 }} />Confirm required</span>
            </div>

            {/* Fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {Object.entries(editedFields).map(([key, val]) => {
                if (val === null || val === undefined) return null;
                const isObject = typeof val === "object";
                return (
                  <div key={key} style={{ gridColumn: isObject || String(val).length > 60 ? "1 / -1" : undefined }}>
                    <label style={{ fontSize: 10, color: "#888", display: "block", marginBottom: 2 }}>
                      {key.replace(/_/g, " ")}
                      {result.confidence[key] !== undefined && (
                        <span style={{ marginLeft: 4, color: result.confidence[key] >= 0.95 ? "#1a6b3c" : result.confidence[key] >= 0.75 ? "#b35c00" : "#c0392b" }}>
                          {Math.round(result.confidence[key] * 100)}%
                        </span>
                      )}
                    </label>
                    {isObject ? (
                      <textarea
                        value={JSON.stringify(val, null, 2)}
                        onChange={(e) => { try { updateField(key, JSON.parse(e.target.value)); } catch { /* invalid json */ } }}
                        rows={3}
                        style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: `1px solid ${fieldBorder(key)}`, borderRadius: 6, fontSize: 12, outline: "none", background: fieldColor(key), fontFamily: "monospace", resize: "vertical" }}
                      />
                    ) : (
                      <input
                        value={String(val)}
                        onChange={(e) => updateField(key, e.target.value)}
                        style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", border: `1px solid ${fieldBorder(key)}`, borderRadius: 6, fontSize: 12, outline: "none", background: fieldColor(key) }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {error && (
              <div style={{ background: "#fff0f0", border: "1px solid #ffcccc", borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 12, color: "#c00" }}>{error}</div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button onClick={closeReview} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid #DDDDDD", background: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>Cancel</button>
              <button
                onClick={confirmSave}
                disabled={saving}
                style={{ padding: "8px 20px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff", fontWeight: 800, fontSize: 12, cursor: "pointer", opacity: saving ? 0.5 : 1 }}
              >{saving ? "Saving..." : "Confirm & Save"}</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
