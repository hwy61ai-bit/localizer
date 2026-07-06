"use client";

import { clearConsent } from "./cookieConsent";

export function CookieSettingsButton() {
  return (
    <button
      onClick={() => clearConsent()}
      style={{
        background: "none",
        border: "none",
        padding: 0,
        fontFamily: "var(--hw-font-body)",
        color: "var(--hw-text)",
        textDecoration: "underline",
        cursor: "pointer",
      }}
    >
      COOKIE SETTINGS
    </button>
  );
}
