"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthConfirm() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error) {
          window.location.href = "/dashboard";
        } else {
          console.error("Auth error:", error.message);
          window.location.href = "/login?error=auth";
        }
      });
    }
  }, []);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#EEEEEE" }}>
      <div style={{ fontSize: 14, opacity: 0.7 }}>Signing you in...</div>
    </main>
  );
}
