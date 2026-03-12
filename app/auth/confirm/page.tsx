"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthConfirm() {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        window.location.href = "/dashboard";
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) window.location.href = "/dashboard";
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#EEEEEE" }}>
      <div style={{ fontSize: 14, opacity: 0.7 }}>Signing you in...</div>
    </main>
  );
}
