"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { getProductName } from "@/lib/tourrouter/productBranding";
import posthog from "posthog-js";
import "./login.css";

function LoginContent() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 16px",
    border: "3px solid var(--hw-border-strong)",
    background: "var(--hw-bg-surface)",
    color: "var(--hw-text)",
    fontFamily: "var(--hw-font-body)",
    fontSize: 15,
    outline: "none",
    transition: "var(--hw-ease)",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--hw-font-mono)",
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: "1.5px",
    textTransform: "uppercase",
    color: "var(--hw-text-secondary)",
    display: "block",
    marginBottom: 6,
  };

  const primaryBtnStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    marginTop: 12,
    padding: "14px 28px",
    border: "3px solid var(--hw-crimson)",
    background: "var(--hw-crimson)",
    color: "var(--hw-text-invert)",
    fontFamily: "var(--hw-font-display)",
    fontSize: 16,
    letterSpacing: "3px",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "var(--hw-ease)",
  };

  const secondaryBtnStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 28px",
    border: "3px solid var(--hw-border-strong)",
    background: "var(--hw-bg-surface)",
    color: "var(--hw-text)",
    fontFamily: "var(--hw-font-display)",
    fontSize: 16,
    letterSpacing: "3px",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "var(--hw-ease)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  };

  return (
    <main
      className="login-container"
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Wordmark */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              fontFamily: "var(--hw-font-display)",
              fontSize: 36,
              letterSpacing: "4px",
              textTransform: "uppercase",
              color: "var(--hw-crimson)",
              lineHeight: 1,
            }}
          >
            HWY61
          </div>
          <div className="login-subtitle" style={{
            marginTop: 10,
            fontFamily: "var(--hw-font-body)",
            fontSize: 14,
            fontWeight: 300,
            color: "var(--hw-text-secondary)",
          }}>
            {!inviteVerified
              ? "Enter your beta invite code to get started."
              : "Enter your email and we\u2019ll send you a sign-in link. No password needed."}
          </div>
        </div>

        {/* Card */}
        <div
          className="login-card"
          style={{
            border: "3px solid var(--hw-border-strong)",
            background: "var(--hw-bg-surface)",
            boxShadow: "var(--hw-shadow-lg)",
            padding: 32,
          }}
        >
          {urlError && (
            <div style={{
              background: "#c5535b",
              color: "#fff",
              border: "3px solid #1A1A1A",
              boxShadow: "4px 4px 0 #000",
              borderRadius: 0,
              padding: "12px 16px",
              marginBottom: 16,
              fontFamily: "var(--hw-font-mono)",
              fontSize: 13,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}>
              {urlError === "auth"
                ? "Your session expired. Please sign in again."
                : "Something went wrong. Please try signing in again."}
            </div>
          )}
          {!inviteVerified ? (
            <>
              <div style={{
                fontFamily: "var(--hw-font-body)",
                fontSize: 13,
                fontWeight: 300,
                color: "var(--hw-text-secondary)",
                marginBottom: 14,
                lineHeight: 1.4,
              }}>
                New users — enter your beta invite code to get started.
              </div>
              <label style={labelStyle}>INVITE CODE</label>
              <input
                style={{
                  ...inputStyle,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
                placeholder="XXXX-XXXX"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !inviteLoading && verifyInvite()}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--hw-crimson)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--hw-border-strong)")}
                disabled={inviteLoading}
              />
              <button
                style={{
                  ...primaryBtnStyle,
                  opacity: !inviteCode.trim() || inviteLoading ? 0.4 : 1,
                  pointerEvents: !inviteCode.trim() || inviteLoading ? "none" : "auto",
                }}
                disabled={!inviteCode.trim() || inviteLoading}
                onClick={verifyInvite}
              >
                {inviteLoading ? "VERIFYING\u2026" : "VERIFY"}
              </button>
              {inviteError && (
                <p style={{ marginTop: 12, fontFamily: "var(--hw-font-mono)", fontSize: 11, color: "var(--hw-crimson)" }}>
                  {inviteError}
                </p>
              )}
              <div style={{
                marginTop: 28,
                paddingTop: 20,
                borderTop: "3px solid var(--hw-border-strong)",
                textAlign: "center",
              }}>
                <div style={{
                  fontFamily: "var(--hw-font-body)",
                  fontSize: 13,
                  fontWeight: 300,
                  color: "var(--hw-text-secondary)",
                  marginBottom: 10,
                }}>
                  Already have an account?
                </div>
                <button
                  onClick={skipToLogin}
                  style={{
                    background: "none",
                    border: "none",
                    fontFamily: "var(--hw-font-display)",
                    fontSize: 14,
                    fontWeight: 400,
                    letterSpacing: "3px",
                    textTransform: "uppercase",
                    color: "var(--hw-crimson)",
                    cursor: "pointer",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                  }}
                >
                  SIGN IN
                </button>
              </div>
            </>
          ) : !sent ? (
            <>
              <label style={labelStyle}>EMAIL</label>
              <input
                style={inputStyle}
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !(!email || loading) && sendMagicLink()}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--hw-crimson)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--hw-border-strong)")}
                disabled={loading}
              />
              <button
                style={{
                  ...primaryBtnStyle,
                  opacity: !email || loading ? 0.4 : 1,
                  pointerEvents: !email || loading ? "none" : "auto",
                }}
                disabled={!email || loading}
                onClick={sendMagicLink}
              >
                {loading ? "SENDING\u2026" : "SEND LOGIN LINK"}
              </button>

              <div style={{
                margin: "20px 0",
                textAlign: "center",
                fontFamily: "var(--hw-font-mono)",
                fontSize: 11,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "var(--hw-text-muted)",
              }}>
                OR
              </div>

              <button
                style={secondaryBtnStyle}
                onClick={signInWithGoogle}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                SIGN IN WITH GOOGLE
              </button>

              <div style={{
                marginTop: 20,
                textAlign: "center",
                fontFamily: "var(--hw-font-body)",
                fontSize: 13,
                fontWeight: 300,
                color: "var(--hw-text-muted)",
                lineHeight: 1.5,
              }}>
                By continuing, you agree to our{" "}
                <a href="/terms" style={{ color: "var(--hw-text-secondary)", textDecoration: "underline" }}>Terms of Service</a>{" "}
                and{" "}
                <a href="/privacy" style={{ color: "var(--hw-text-secondary)", textDecoration: "underline" }}>Privacy Policy</a>.
              </div>
            </>
          ) : (
            <>
              <div style={{
                fontFamily: "var(--hw-font-display)",
                fontSize: 22,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "var(--hw-text)",
                marginBottom: 8,
              }}>
                CHECK YOUR INBOX
              </div>
              <div style={{
                fontFamily: "var(--hw-font-body)",
                fontSize: 14,
                fontWeight: 300,
                color: "var(--hw-text-secondary)",
                marginBottom: 20,
                lineHeight: 1.5,
              }}>
                We sent a login link to <strong>{email}</strong>. Click it to sign in — it expires in 1 hour.
              </div>
              <button
                style={secondaryBtnStyle}
                onClick={() => {
                  setSent(false);
                  setEmail("");
                  setError(null);
                }}
              >
                USE A DIFFERENT EMAIL
              </button>
            </>
          )}

          {error && (
            <p style={{ marginTop: 12, fontFamily: "var(--hw-font-mono)", fontSize: 11, color: "var(--hw-crimson)" }}>
              {error}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
