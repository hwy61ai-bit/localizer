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
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#EEEEEE" }}>
      <div style={{ fontSize: 14, opacity: 0.7 }}>{message}</div>
    </main>
  );
}
