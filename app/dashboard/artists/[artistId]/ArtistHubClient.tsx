"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ArtistDetailClient from "./ArtistDetailClient";
import ArtistToursClient from "./ArtistToursClient";

const ADMIN_EMAILS = ["hwy61ai@gmail.com", "hwy61regan@gmail.com"];

type AccessState = {
  loading: boolean;
  hasLocalizer: boolean;
  hasTourRouter: boolean;
};

export default function ArtistHubClient({
  artistId,
  artistName,
  orgId,
  userEmail,
}: {
  artistId: string;
  artistName: string;
  orgId: string;
  userEmail: string;
}) {
  const [access, setAccess] = useState<AccessState>({ loading: true, hasLocalizer: false, hasTourRouter: false });
  const [activeTab, setActiveTab] = useState<"tourrouter" | "localizer">("tourrouter");
  const [isDiy, setIsDiy] = useState(false);

  useEffect(() => {
    async function checkAccess() {
      const isAdmin = ADMIN_EMAILS.includes(userEmail.toLowerCase());

      // Check Localizer access
      let hasLocalizer = false;
      const { data: org } = await supabase
        .from("orgs")
        .select("plan_status, trial_ends_at")
        .eq("id", orgId)
        .single();

      if (org) {
        const isPaid = org.plan_status === "active";
        const trialActive = org.trial_ends_at ? new Date(org.trial_ends_at) > new Date() : false;
        hasLocalizer = isPaid || trialActive || isAdmin;
      }

      // Check TourRouter access
      let hasTourRouter = false;
      if (isAdmin) {
        hasTourRouter = true;
      } else {
        const resp = await fetch("/api/tourrouter/tours");
        hasTourRouter = resp.ok;
      }

      // Admin-only URL override for testing
      if (isAdmin && typeof window !== "undefined") {
        const view = new URLSearchParams(window.location.search).get("view");
        if (view === "localizer") { hasLocalizer = true; hasTourRouter = false; }
        else if (view === "tourrouter") { hasTourRouter = true; hasLocalizer = false; }
        else if (view === "diy") { hasTourRouter = true; hasLocalizer = false; setIsDiy(true); }
      }

      setAccess({ loading: false, hasLocalizer, hasTourRouter });

      // Set default tab based on access
      if (hasTourRouter) {
        setActiveTab("tourrouter");
      } else if (hasLocalizer) {
        setActiveTab("localizer");
      }
    }

    checkAccess();
    if (typeof window !== "undefined" && window.location.hostname.includes("diy")) {
      setIsDiy(true);
    }
  }, [orgId, userEmail]);

  if (access.loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#F7F7F5", display: "grid", placeItems: "center" }}>
        <div style={{ fontSize: 13, color: "#888" }}>Loading...</div>
      </div>
    );
  }

  // No access at all
  if (!access.hasLocalizer && !access.hasTourRouter) {
    return (
      <div style={{ minHeight: "100vh", background: "#F7F7F5", display: "grid", placeItems: "center", padding: 24 }}>
        <div style={{ background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: 48, textAlign: "center", maxWidth: 480 }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No Active Subscription</div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 20, lineHeight: 1.6 }}>
            Subscribe to Localizer or TourRouter to manage your artists.
          </div>
          <a
            href="/pricing"
            style={{
              padding: "12px 28px", borderRadius: 10, border: "1px solid #111",
              background: "#111", color: "#fff", fontWeight: 900, fontSize: 13,
              textDecoration: "none", display: "inline-block",
            }}
          >
            View Plans
          </a>
        </div>
      </div>
    );
  }

  const backLink = (
    <div style={{ padding: "16px 24px 0" }}>
      <a href="/dashboard" style={{ fontSize: 13, fontWeight: 700, color: "#888", textDecoration: "none" }}>&larr; HWY61 LABS</a>
    </div>
  );

  // Localizer only — no tabs, render directly
  if (access.hasLocalizer && !access.hasTourRouter) {
    return (
      <div style={{ minHeight: "100vh", background: "#F7F7F5" }}>
        {backLink}
        <ArtistDetailClient artistId={artistId} />
      </div>
    );
  }

  // TourRouter only or both — show tabs
  const tabs = [];
  tabs.push({ key: "tourrouter" as const, label: "TourRouter / Management" });
  if (access.hasLocalizer) {
    tabs.push({ key: "localizer" as const, label: "Localizer / Assets" });
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7F7F5" }}>
      {backLink}
      {/* Tab bar */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #DDDDDD",
        padding: "0 24px", display: "flex", gap: 0,
      }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "14px 24px",
                fontSize: 13,
                fontWeight: isActive ? 900 : 600,
                color: isActive ? "#111" : "#888",
                background: "none",
                border: "none",
                borderBottom: isActive ? "2px solid #111" : "2px solid transparent",
                cursor: "pointer",
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* DIY upgrade banner */}
      {activeTab === "tourrouter" && isDiy && (
        <div style={{
          background: "#f5f5f5", borderBottom: "1px solid #e8e8e8",
          padding: "10px 24px", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        }}>
          <div style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>
            You're on the <strong>DIY</strong> plan. Upgrade to TourRouter for advancing, settlements, finance tools, and more.
          </div>
          <a
            href="/pricing"
            style={{
              fontSize: 11, fontWeight: 700, color: "#111",
              textDecoration: "none", padding: "5px 14px",
              border: "1px solid #ccc", borderRadius: 6,
              background: "#fff", whiteSpace: "nowrap",
            }}
          >
            View Plans
          </a>
        </div>
      )}

      {/* Tab content */}
      {activeTab === "tourrouter" && (
        <ArtistToursClient artistId={artistId} artistName={artistName} />
      )}

      {activeTab === "localizer" && access.hasLocalizer && (
        <ArtistDetailClient artistId={artistId} />
      )}
    </div>
  );
}
