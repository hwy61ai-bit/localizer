"use client";

import { useState, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getProductName } from "@/lib/tourrouter/productBranding";
import posthog from "posthog-js";
import "./login.css";

export default function LoginPage() {
  const productName = useMemo(() => getProductName(), []);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Beta invite gate
  const [inviteCode, setInviteCode] = useState("");
  const [inviteVerified, setInviteVerified] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  async function verifyInvite() {
    if (!inviteCode.trim()) return;
    setInviteLoading(true);
    setInviteError(null);
    try {
      const resp = await fetch("/api/beta/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inviteCode.trim() }),
      });
      const data = await resp.json();
      if (data.valid) {
        localStorage.setItem("beta_invite_code", inviteCode.trim());
        setInviteVerified(true);
      } else {
        setInviteError("Invalid or already claimed invite code.");
      }
    } catch {
      setInviteError("Could not verify code. Try again.");
    }
    setInviteLoading(false);
  }

  function skipToLogin() {
    setInviteVerified(true);
  }

  async function sendMagicLink() {
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

    posthog.capture("user_logged_in", { method: "magic_link" });
    setSent(true);
  }

  async function signInWithGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      posthog.capture("user_logged_in", { method: "google" });
    }
  }

  return (
    <main
      className="login-container"
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
            {productName}
          </div>
          <div className="login-subtitle" style={{ marginTop: 10, fontSize: 13, opacity: 0.7 }}>
            {!inviteVerified
              ? "Enter your beta invite code to get started."
              : "Enter your email and we\u2019ll send you a sign-in link. No password needed."}
          </div>
        </div>

        {/* Card */}
        <div
          className="login-card"
          style={{
            border: "1px solid #DDDDDD",
            borderRadius: 14,
            background: "#FFFFFF",
            padding: 18,
          }}
        >
          {!inviteVerified ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
                Invite Code
              </div>
              <input
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid #DDDDDD",
                  fontSize: 14,
                  outline: "none",
                  background: "#FFFFFF",
                  color: "#111111",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
                placeholder="XXXX-XXXX"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !inviteLoading && verifyInvite()}
                disabled={inviteLoading}
              />
              <button
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  marginTop: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid #111111",
                  background: "#111111",
                  color: "#FFFFFF",
                  fontWeight: 900,
                  cursor: !inviteCode.trim() || inviteLoading ? "not-allowed" : "pointer",
                  opacity: !inviteCode.trim() || inviteLoading ? 0.55 : 1,
                }}
                disabled={!inviteCode.trim() || inviteLoading}
                onClick={verifyInvite}
              >
                {inviteLoading ? "Verifying\u2026" : "Verify"}
              </button>
              {inviteError && (
                <p style={{ marginTop: 12, fontSize: 13, color: "#B00020" }}>
                  {inviteError}
                </p>
              )}
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <button
                  onClick={skipToLogin}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 12,
                    color: "#999",
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Team Login
                </button>
              </div>
            </>
          ) : !sent ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
                Email
              </div>
              <input
                style={{
                  width: "100%",
                  boxSizing: "border-box",
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
                onKeyDown={(e) => e.key === "Enter" && !(!email || loading) && sendMagicLink()}
                disabled={loading}
              />
              <button
                style={{
                  width: "100%",
                  boxSizing: "border-box",
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
                onClick={sendMagicLink}
              >
                {loading ? "Sending\u2026" : "Send login link"}
              </button>

              <div style={{ margin: "16px 0", textAlign: "center", fontSize: 12, color: "#999" }}>OR</div>

              <button
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid #DDDDDD",
                  background: "#FFFFFF",
                  color: "#111111",
                  fontWeight: 900,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
                onClick={signInWithGoogle}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>

              <div style={{ marginTop: 16, textAlign: "center", fontSize: 12, color: "#999", lineHeight: 1.5 }}>
                By continuing, you agree to our{" "}
                <a href="/terms" style={{ color: "#666", textDecoration: "underline" }}>Terms of Service</a>{" "}
                and{" "}
                <a href="/privacy" style={{ color: "#666", textDecoration: "underline" }}>Privacy Policy</a>.
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 15, fontWeight: 900, marginBottom: 8 }}>
                Check your inbox
              </div>
              <div style={{ fontSize: 13, opacity: 0.7, marginBottom: 16 }}>
                We sent a login link to <strong>{email}</strong>. Click it to sign in — it expires in 1 hour.
              </div>
              <button
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid #DDDDDD",
                  background: "#FFFFFF",
                  color: "#111111",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
                onClick={() => {
                  setSent(false);
                  setEmail("");
                  setError(null);
                }}
              >
                Use a different email
              </button>
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
