"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getConsent, CONSENT_EVENT, ConsentEventDetail } from "./cookieConsent";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const identified = useRef(false);
  const didInitRef = useRef(false);

  useEffect(() => {
    function initPostHog() {
      if (didInitRef.current) return;
      if (
        typeof window !== "undefined" &&
        window.location.hostname.includes("hwy61labs.com") &&
        process.env.NEXT_PUBLIC_POSTHOG_KEY
      ) {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
          api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
          capture_pageview: true,
          capture_pageleave: true,
          autocapture: true,
          session_recording: {
            maskAllInputs: true,
          },
        });
        didInitRef.current = true;
        setInitialized(true);
      }
    }

    if (getConsent() === "accepted") {
      initPostHog();
    }

    function onConsentChanged(e: Event) {
      const detail = (e as CustomEvent<ConsentEventDetail>).detail;
      if (detail === "accepted") {
        if (didInitRef.current) {
          posthog.opt_in_capturing();
        } else {
          initPostHog();
        }
      } else if (didInitRef.current) {
        // "declined" or null — revoke on a running session; no-op if never initialized.
        posthog.opt_out_capturing();
        posthog.reset();
      }
    }
    window.addEventListener(CONSENT_EVENT, onConsentChanged);
    return () => {
      window.removeEventListener(CONSENT_EVENT, onConsentChanged);
    };
  }, []);

  useEffect(() => {
    if (!initialized || identified.current) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        posthog.identify(user.id, { email: user.email });
        identified.current = true;
      }
    });
  }, [initialized]);

  if (!initialized) return <>{children}</>;

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
