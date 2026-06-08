"use client";

import { useState, useEffect, useCallback } from "react";
import HwModal from "@/app/components/hw/HwModal";
import HwInput from "@/app/components/hw/HwInput";
import HwSelect from "@/app/components/hw/HwSelect";
import HwButton from "@/app/components/hw/HwButton";
import { useToast } from "@/app/components/Toast";

interface Token {
  token: string;
  label: string | null;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

export default function ShareWithMarketingButton({ tourId }: { tourId: string }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [expiration, setExpiration] = useState("never");
  const [generating, setGenerating] = useState(false);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    setLoadingTokens(true);
    try {
      const res = await fetch(`/api/marketing-tokens/list?tourId=${tourId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTokens(data.tokens);
    } catch {
      setError("Failed to load existing tokens");
    } finally {
      setLoadingTokens(false);
    }
  }, [tourId]);

  useEffect(() => {
    if (open) {
      fetchTokens();
    }
  }, [open, fetchTokens]);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/marketing-tokens/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tourId,
          label: label.trim(),
          expiresInDays: expiration === "never" ? undefined : parseInt(expiration),
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLabel("");
      setExpiration("never");
      await fetchTokens();
      try {
        await navigator.clipboard.writeText(window.location.origin + data.hubUrl);
        setCopiedToken(data.token);
        setTimeout(() => setCopiedToken(null), 2000);
      } catch {}
    } catch {
      setError("Failed to generate link");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy(token: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/v/tour/${token}`);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch {}
  }

  async function handleRevoke(token: string) {
    if (!confirm("Revoke this link? Anyone using it will lose access.")) return;
    try {
      const res = await fetch("/api/marketing-tokens/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error();
      await fetchTokens();
    } catch {
      setError("Failed to revoke token");
    }
  }

  async function handleDownloadFormat(format: string, label: string) {
    if (downloadingFormat) return;
    setDownloadingFormat(format);
    try {
      const res = await fetch(`/api/tours/${tourId}/download-format?format=${format}`);
      if (!res.ok) {
        let errKey = "";
        try { errKey = (await res.json())?.error ?? ""; } catch {}
        if (errKey === "no_rendered_assets") {
          toast.error(`No ${label} assets generated yet. Generate assets for your shows first.`);
        } else if (errKey === "no_events") {
          toast.error("Add shows to this tour before downloading.");
        } else if (errKey === "download_requires_paid") {
          toast.error("Downloading assets requires an active Localizer plan.");
        } else {
          toast.error("Download failed. Please try again.");
        }
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename="(.+)"/);
      a.download = match ? match[1] : `${label}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed. Please try again.");
    } finally {
      setDownloadingFormat(null);
    }
  }

  return (
    <>
      <HwButton variant="secondary" onClick={() => setOpen(true)}>
        SHARE WITH MARKETING
      </HwButton>

      <HwModal open={open} onClose={() => setOpen(false)} title="Share with Marketing" wide>
        {/* Generate form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <HwInput
            label="Contractor name or label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Sarah at AcmePR"
          />
          <HwSelect
            label="Link expires"
            value={expiration}
            onChange={(e) => setExpiration(e.target.value)}
            options={[
              { value: "never", label: "Never" },
              { value: "7", label: "7 days" },
              { value: "30", label: "30 days" },
              { value: "90", label: "90 days" },
            ]}
          />
          <div>
            <HwButton
              variant="primary"
              onClick={handleGenerate}
              disabled={generating || !label.trim()}
            >
              {generating ? "Generating..." : "Generate Link"}
            </HwButton>
          </div>
          {error && (
            <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, color: "var(--hw-crimson)" }}>
              {error}
            </div>
          )}
        </div>

        {/* Active links list */}
        <div style={{ marginTop: 24 }}>
          <div style={{
            fontFamily: "var(--hw-font-mono)",
            fontSize: 13,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "var(--hw-text-muted)",
            marginBottom: 12,
          }}>
            Active Links
          </div>

          {loadingTokens ? (
            <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, color: "var(--hw-text-muted)" }}>
              Loading...
            </div>
          ) : tokens.length === 0 ? (
            <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, color: "var(--hw-text-muted)" }}>
              No active links yet
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {tokens.map((t) => (
                <div
                  key={t.token}
                  style={{
                    border: "3px solid var(--hw-border-strong)",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "var(--hw-font-body)",
                      fontSize: 14,
                      fontWeight: 500,
                      color: "var(--hw-text)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {t.label || "(no label)"}
                    </div>
                    <div style={{
                      fontFamily: "var(--hw-font-mono)",
                      fontSize: 13,
                      color: "var(--hw-text-muted)",
                      marginTop: 2,
                    }}>
                      Created {formatDate(t.created_at)}
                      {" · "}
                      {t.expires_at ? `Expires ${formatDate(t.expires_at)}` : "Never expires"}
                      {" · "}
                      {t.last_used_at ? `Last used ${formatDate(t.last_used_at)}` : "Never used"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <HwButton
                      size="small"
                      variant="secondary"
                      onClick={() => handleCopy(t.token)}
                    >
                      {copiedToken === t.token ? "COPIED \u2713" : "COPY"}
                    </HwButton>
                    <HwButton
                      size="small"
                      variant="destructive"
                      onClick={() => handleRevoke(t.token)}
                    >
                      REVOKE
                    </HwButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Download All by format — buttons shaped like the asset's aspect ratio */}
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: "3px solid var(--hw-border-strong)" }}>
          <style>{`
            @keyframes dlBarSlide {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(300%); }
            }
          `}</style>
          <div style={{
            fontFamily: "var(--hw-font-mono)", fontSize: 13, letterSpacing: "2px",
            textTransform: "uppercase", color: "var(--hw-text-muted)", marginBottom: 4,
          }}>
            Download All by Format
          </div>
          <div style={{
            fontFamily: "var(--hw-font-body)", fontSize: 13, fontWeight: 300,
            color: "var(--hw-text-secondary)", marginBottom: 16,
          }}>
            Download one format across every show in this tour as a single zip. Only shows with generated assets are included.
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end" }}>
            {[
              { format: "square",    label: "IG Post",        w: 90,  h: 90 },
              { format: "story",     label: "IG Story",       w: 72,  h: 90 },
              { format: "tiktok",    label: "TikTok/Reels Video", w: 84,  h: 100 },
              { format: "landscape", label: "FB Cover",       w: 120, h: 56 },
              { format: "yt_shorts", label: "Square Video",   w: 90,  h: 90 },
            ].map((f) => {
              const isLoading = downloadingFormat === f.format;
              return (
                <button
                  key={f.format}
                  onClick={() => handleDownloadFormat(f.format, f.label)}
                  disabled={!!downloadingFormat}
                  title={`Download all ${f.label} assets`}
                  style={{
                    width: f.w, height: f.h,
                    border: "3px solid var(--hw-border-strong)",
                    background: isLoading ? "var(--hw-bg-invert)" : "var(--hw-bg-surface)",
                    color: isLoading ? "#fff" : "var(--hw-text)",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 4,
                    cursor: downloadingFormat ? "default" : "pointer",
                    opacity: downloadingFormat && !isLoading ? 0.4 : 1,
                    padding: 6, transition: "var(--hw-ease)",
                  }}
                  onMouseEnter={(e) => { if (!downloadingFormat) { e.currentTarget.style.background = "var(--hw-crimson)"; e.currentTarget.style.color = "#fff"; } }}
                  onMouseLeave={(e) => { if (!isLoading) { e.currentTarget.style.background = "var(--hw-bg-surface)"; e.currentTarget.style.color = "var(--hw-text)"; } }}
                >
                  {isLoading ? (
                    <>
                      <div style={{ width: "70%", height: 6, border: "2px solid #fff", position: "relative", overflow: "hidden", marginBottom: 2 }}>
                        <div style={{ position: "absolute", top: 0, bottom: 0, width: "40%", background: "#fff", animation: "dlBarSlide 0.9s linear infinite" }} />
                      </div>
                      <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", textAlign: "center", lineHeight: 1.2 }}>
                        Preparing
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 16, lineHeight: 1 }}>{"\u2193"}</span>
                      <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", textAlign: "center", lineHeight: 1.2 }}>
                        {f.label}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </HwModal>
    </>
  );
}
