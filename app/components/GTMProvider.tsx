"use client";

// GTM loads ONLY after cookie-consent accept. Once loaded it cannot be
// un-injected; revocation pushes consent_revoked — all tags configured in
// the GTM dashboard MUST use Google Consent Mode triggers. Noscript fallback
// deliberately omitted.

import { useEffect, useRef } from "react";
import { getConsent, CONSENT_EVENT, ConsentEventDetail } from "./cookieConsent";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function GTMProvider() {
  const didInitRef = useRef(false);

  useEffect(() => {
    function initGTM() {
      if (didInitRef.current) return;
      if (typeof window === "undefined") return;
      if (
        !window.location.hostname.includes("hwy61labs.com") &&
        !window.location.hostname.includes("localizer.music")
      ) {
        return;
      }
      const id = process.env.NEXT_PUBLIC_GTM_ID;
      if (!id) return;

      try {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtm.js?id=${id}`;
        document.head.appendChild(script);
        didInitRef.current = true;
      } catch {
        // DOM / dataLayer inaccessible — swallow.
      }
    }

    if (getConsent() === "accepted") {
      initGTM();
    }

    function onConsentChanged(e: Event) {
      const detail = (e as CustomEvent<ConsentEventDetail>).detail;
      if (detail === "accepted") {
        if (didInitRef.current) {
          try {
            window.dataLayer?.push({ event: "consent_granted" });
          } catch {
            // dataLayer inaccessible — swallow.
          }
        } else {
          initGTM();
        }
      } else if (didInitRef.current) {
        // "declined" or null — revoke on a running session; no-op if never initialized.
        try {
          window.dataLayer?.push({ event: "consent_revoked" });
        } catch {
          // dataLayer inaccessible — swallow.
        }
      }
    }
    window.addEventListener(CONSENT_EVENT, onConsentChanged);
    return () => {
      window.removeEventListener(CONSENT_EVENT, onConsentChanged);
    };
  }, []);

  return null;
}
