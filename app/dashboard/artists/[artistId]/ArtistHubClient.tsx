"use client";

import ArtistDetailClient from "./ArtistDetailClient";
import { HwPageHeader, HwBreadcrumb, HwButton, HwCard, HwCardTitle, HwCardDesc } from "@/app/components/hw";

// Localizer-only artist page. The TourRouter tab was removed from this page;
// TourRouter's own routes/components (incl. ArtistToursClient) are untouched.
export default function ArtistHubClient({
  artistId,
  artistName,
  hasLocalizer,
}: {
  artistId: string;
  artistName: string;
  hasLocalizer: boolean;
}) {
  if (!hasLocalizer) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
        <HwCard variant="standard" hoverable={false}>
          <div style={{ textAlign: "center", maxWidth: 480, padding: "16px 0" }}>
            <HwCardTitle>NO ACTIVE SUBSCRIPTION</HwCardTitle>
            <HwCardDesc>Subscribe to Localizer to manage your artists.</HwCardDesc>
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

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <HwBreadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: artistName }]} />
      </div>
      <div style={{ padding: "8px 24px 0" }}>
        <HwPageHeader title={artistName} />
      </div>
      <ArtistDetailClient artistId={artistId} />
    </div>
  );
}
