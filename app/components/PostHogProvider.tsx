"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const identified = useRef(false);

  useEffect(() => {
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
      setInitialized(true);
    }
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

  // Claim beta invite code after login
  const betaClaimed = useRef(false);
  useEffect(() => {
    if (betaClaimed.current) return;
    const code = typeof window !== "undefined" ? localStorage.getItem("beta_invite_code") : null;
    if (!code) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      betaClaimed.current = true;
      fetch("/api/beta/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, userId: user.id }),
      }).then(() => {
        localStorage.removeItem("beta_invite_code");
      }).catch(() => {});
    });
  }, []);

  if (!initialized) return <>{children}</>;

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
