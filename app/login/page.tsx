"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendLink() {
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
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
            We’ll email you a secure magic link.
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
              cursor: !email || loading ? "not-allowed" : "pointer",
              opacity: !email || loading ? 0.55 : 1,
            }}
            disabled={!email || loading}
            onClick={sendLink}
          >
            {loading ? "Sending…" : "Send magic link"}
          </button>

          {sent && (
            <p style={{ marginTop: 12, fontSize: 13, color: "#0F7B3A" }}>
              Check your email for the sign-in link.
            </p>
          )}

          {error && (
            <p style={{ marginTop: 12, fontSize: 13, color: "#B00020" }}>
              {error}
            </p>
          )}

          <div style={{ marginTop: 12, fontSize: 12, opacity: 0.6 }}>
            If links expire, request a new one.
          </div>
        </div>
      </div>
    </main>
  );
}