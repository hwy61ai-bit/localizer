"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendCode() {
    setError(null);
    setLoading(true);

    // This still triggers an email, but we’ll VERIFY via 6-digit code (more reliable than links).
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`, // harmless to keep
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
  }

  async function verifyCode() {
    setError(null);
    setLoading(true);

    const token = code.trim();
    if (!token) {
      setLoading(false);
      setError("Enter the 6-digit code from your email.");
      return;
    }

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setVerified(true);
    // After session is set in the browser, go to dashboard
    window.location.href = "/dashboard";
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#EEEEEE",
        color: "#111111",
      }}
    >
      <div style={{ width: "100%", maxWidth: 520 }}>
        {/* Wordmark */}
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div
            className="brand-title-login"
            style={{
              fontSize: 92,
              fontWeight: 900,
              letterSpacing: "-0.06em",
            }}
          >
            LOCALIZER
          </div>

          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.7 }}>
            We’ll email you a secure code.
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            border: "1px solid #DDDDDD",
            borderRadius: 14,
            background: "#FFFFFF",
            padding: 18,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
            Email
          </div>

          <input
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #DDDDDD",
              fontSize: 14,
              outline: "none",
              background: "#FFFFFF",
              color: "#111111",
            }}
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={sent || loading}
          />

          {!sent ? (
            <button
              style={{
                width: "100%",
                marginTop: 12,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #111111",
                background: "#111111",
                color: "#FFFFFF",
                fontWeight: 900,
                cursor: !email || loading ? "not-allowed" : "pointer",
                opacity: !email || loading ? 0.55 : 1,
              }}
              disabled={!email || loading}
              onClick={sendCode}
            >
              {loading ? "Sending…" : "Send code"}
            </button>
          ) : (
            <>
              <div style={{ marginTop: 14, fontSize: 13, fontWeight: 800 }}>
                6-digit code
              </div>

              <input
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid #DDDDDD",
                  fontSize: 16,
                  letterSpacing: "0.18em",
                  outline: "none",
                  background: "#FFFFFF",
                  color: "#111111",
                  textAlign: "center",
                }}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                disabled={loading || verified}
              />

              <button
                style={{
                  width: "100%",
                  marginTop: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid #111111",
                  background: "#111111",
                  color: "#FFFFFF",
                  fontWeight: 900,
                  cursor: !code || loading ? "not-allowed" : "pointer",
                  opacity: !code || loading ? 0.55 : 1,
                }}
                disabled={!code || loading || verified}
                onClick={verifyCode}
              >
                {loading ? "Verifying…" : "Verify & Continue"}
              </button>

              <button
                style={{
                  width: "100%",
                  marginTop: 10,
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid #DDDDDD",
                  background: "#FFFFFF",
                  color: "#111111",
                  fontWeight: 900,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.55 : 1,
                }}
                disabled={loading}
                onClick={() => {
                  setSent(false);
                  setCode("");
                  setError(null);
                }}
              >
                Use a different email
              </button>

              <div style={{ marginTop: 12, fontSize: 12, opacity: 0.6 }}>
                If the code doesn’t arrive, request another and use the newest one.
              </div>
            </>
          )}

          {error && (
            <p style={{ marginTop: 12, fontSize: 13, color: "#B00020" }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}