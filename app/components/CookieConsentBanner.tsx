"use client";

import { useEffect, useState } from "react";
import { getConsent, setConsent, CONSENT_EVENT, ConsentEventDetail } from "./cookieConsent";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getConsent() === null);
    function onConsentChanged(e: Event) {
      const detail = (e as CustomEvent<ConsentEventDetail>).detail;
      if (detail === null) setVisible(true);
    }
    window.addEventListener(CONSENT_EVENT, onConsentChanged);
    return () => {
      window.removeEventListener(CONSENT_EVENT, onConsentChanged);
    };
  }, []);

  if (!visible) return null;

  function accept() {
    setConsent("accepted");
    setVisible(false);
  }

  function decline() {
    setConsent("declined");
    setVisible(false);
  }

  const buttonBase: React.CSSProperties = {
    padding: "10px 24px",
    fontFamily: "var(--hw-font-display)",
    fontSize: 15,
    letterSpacing: "3px",
    textTransform: "uppercase",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: "var(--hw-bg-surface)",
        borderTop: "3px solid var(--hw-border-strong)",
        boxShadow: "var(--hw-shadow-md)",
        padding: "16px 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          maxWidth: 1100,
          margin: "0 auto",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            fontFamily: "var(--hw-font-body)",
            fontSize: 14,
            color: "var(--hw-text)",
            lineHeight: 1.5,
          }}
        >
          We use cookies for analytics to improve Localizer. See our{" "}
          <a
            href="/privacy"
            style={{ color: "var(--hw-text)", textDecoration: "underline" }}
          >
            Privacy Policy
          </a>
          .
        </div>
        <div style={{ display: "flex", gap: 12, flexShrink: 0 }}>
          <button
            onClick={decline}
            style={{
              ...buttonBase,
              border: "3px solid var(--hw-border-strong)",
              background: "var(--hw-bg-surface)",
              color: "var(--hw-text)",
            }}
          >
            Decline
          </button>
          <button
            onClick={accept}
            style={{
              ...buttonBase,
              border: "3px solid var(--hw-crimson)",
              background: "var(--hw-crimson)",
              color: "var(--hw-text-invert)",
            }}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
