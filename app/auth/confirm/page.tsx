"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthConfirm() {
  const [message, setMessage] = useState("Signing you in...");

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) {
      setMessage("No code found in URL.");
      return;
    }
    supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
      if (error) {
        setMessage("Error: " + error.message);
      } else if (data.session) {
        window.location.href = "/dashboard";
      } else {
        setMessage("No session returned.");
      }
    });
  }, []);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "transparent" }}>
      <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-text-muted)" }}>{message}</div>
    </main>
  );
}
