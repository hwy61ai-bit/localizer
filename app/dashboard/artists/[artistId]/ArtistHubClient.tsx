"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import ArtistDetailClient from "./ArtistDetailClient";
import ArtistToursClient from "./ArtistToursClient";
import { HwTabs, HwTab, HwPageHeader, HwBreadcrumb, HwButton, HwCard, HwCardTitle, HwCardDesc } from "@/app/components/hw";
import { isAdminEmail } from "@/lib/auth/adminEmails";

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
      const isAdmin = isAdminEmail(userEmail);

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

      // URL override for landing on a specific tab
      if (typeof window !== "undefined") {
        const tabParam = new URLSearchParams(window.location.search).get("tab");
        if (tabParam === "localizer" && hasLocalizer) {
          setActiveTab("localizer");
        } else if (tabParam === "tourrouter" && hasTourRouter) {
          setActiveTab("tourrouter");
        }
      }
    }

    checkAccess();
    if (typeof window !== "undefined" && window.location.hostname.includes("diy")) {
      setIsDiy(true);
    }
  }, [orgId, userEmail]);

  if (access.loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text-muted)" }}>Loading...</div>
      </div>
    );
  }

  // No access at all
  if (!access.hasLocalizer && !access.hasTourRouter) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <HwCard variant="standard" hoverable={false}>
          <div style={{ textAlign: "center", maxWidth: 480, padding: "16px 0" }}>
            <HwCardTitle>NO ACTIVE SUBSCRIPTION</HwCardTitle>
            <HwCardDesc>Subscribe to Localizer or TourRouter to manage your artists.</HwCardDesc>
            <div style={{ marginTop: 24 }}>
              <a href="/pricing" style={{ textDecoration: "none" }}>
                <HwButton>VIEW PLANS</HwButton>
              </a>
            </div>
          </div>
        </HwCard>
      </div>
    );
  }

  const backLink = (
    <div style={{ padding: "16px 24px 0" }}>
      <HwBreadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: artistName }]} />
    </div>
  );

  // Localizer only — no tabs, render directly
  if (access.hasLocalizer && !access.hasTourRouter) {
    return (
      <div style={{ minHeight: "100vh" }}>
        {backLink}
        <div style={{ padding: "8px 24px 0" }}>
          <HwPageHeader title={artistName} />
        </div>
        <ArtistDetailClient artistId={artistId} />
      </div>
    );
  }

  // TourRouter only or both — show tabs
  const tabs = [];
  tabs.push({ key: "tourrouter" as const, label: "TourRouter" });
  if (access.hasLocalizer) {
    tabs.push({ key: "localizer" as const, label: "Localizer" });
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      {backLink}
      <div style={{ padding: "8px 24px 0" }}>
        <HwPageHeader title={artistName} />
      </div>
      {/* Tab bar */}
      <div style={{ padding: "0 24px" }}>
        <HwTabs>
          {tabs.map((tab) => (
            <HwTab
              key={tab.key}
              label={tab.label}
              active={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
            />
          ))}
        </HwTabs>
      </div>

      {/* DIY upgrade banner */}
      {activeTab === "tourrouter" && isDiy && (
        <div style={{
          background: "var(--hw-amber-ghost)", borderBottom: "3px solid var(--hw-amber)",
          padding: "12px 24px", display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        }}>
          <div style={{ fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, color: "var(--hw-text)", lineHeight: 1.5 }}>
            You&apos;re on the <strong>DIY</strong> plan. Upgrade to TourRouter for advancing, settlements, finance tools, and more.
          </div>
          <a href="/pricing" style={{ textDecoration: "none" }}>
            <HwButton variant="secondary" size="small">VIEW PLANS</HwButton>
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
