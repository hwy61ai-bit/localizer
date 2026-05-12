"use client";

import { useState, useEffect, useCallback } from "react";
import HwModal from "@/app/components/hw/HwModal";
import HwInput from "@/app/components/hw/HwInput";
import HwSelect from "@/app/components/hw/HwSelect";
import HwButton from "@/app/components/hw/HwButton";

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
      </HwModal>
    </>
  );
}
