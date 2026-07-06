import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminEmail } from "@/lib/auth/adminEmails";
import { ensureOrgExists } from "@/lib/auth/ensureOrgExists";
import { artistLimitForPlan } from "@/lib/localizer/artistLimits";
import TourTile from "./TourTile";
import ArtistLimitToast from "./ArtistLimitToast";
import NotificationBell from "@/app/components/NotificationBell";
import OnboardingGate from "@/app/components/OnboardingGate";
import { HwButton, HwPageHeader } from "@/app/components/hw";
import "./dashboard.css";

type TourStat = {
  count: number;
  minDate: string | null;
  maxDate: string | null;
};

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const limitError = sp?.error === "artist_limit";
  const headersList = await headers();
  const isDiy = headersList.get("x-hwy61-diy") === "1";
  const supabase = await supabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const admin = supabaseAdmin();
  await ensureOrgExists(supabase);

  const { data: membership } = await admin
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let orgId = membership?.org_id as string | undefined;

  if (!orgId) redirect("/login?error=no_org");

  // Fetch org plan + trial status
  const { data: org } = await admin
    .from("orgs")
    .select("plan, plan_status, trial_ends_at, stripe_customer_id, tourrouter_enabled, localizer_onboarding_completed, localizer_plan_status, bundle_plan_status, localizer_plan")
    .eq("id", orgId)
    .maybeSingle();

  if (!org) redirect("/login?error=no_org");

  // Send Localizer-eligible users to the onboarding welcome page if they
  // haven't completed it yet. This catches users who land at /dashboard
  // directly (Stripe checkout success URL, bookmarks, email links) and
  // would otherwise bypass the welcome flow.
  if (
    org.localizer_onboarding_completed === false &&
    (org.localizer_plan_status !== null || org.bundle_plan_status !== null)
  ) {
    redirect("/dashboard/onboarding/localizer");
  }

  const isPaid = !!org?.stripe_customer_id && org?.plan_status === "active";
  const trialActive = org?.trial_ends_at ? new Date(org.trial_ends_at) > new Date() : false;
  const isAdmin = isAdminEmail(user.email);
  const hasAccess = isPaid || trialActive || isAdmin;
  const hasTourRouter = isAdmin || org.tourrouter_enabled === true;

  if (!hasAccess) redirect("/pricing?reason=trial_expired");

  const { data: artistsData, error: artistsError } = await admin
    .from("artists")
    .select("id, name, image_url, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (artistsError) throw new Error(artistsError.message);
  const artists = artistsData ?? [];

  const tourCounts: { [key: string]: number } = {};

  if (artists.length > 0) {
    const { data: tourData } = await admin
      .from("tours")
      .select("id, artist_id")
      .in("artist_id", artists.map((a) => a.id));

    for (const artist of artists) {
      tourCounts[artist.id] = (tourData ?? []).filter((t) => t.artist_id === artist.id).length;
    }
  }


  async function createArtist() {
    "use server";
    const supabase = await supabaseServer();

    // Enforce artist limit (admins bypass). Count only non-blank artists so
    // abandoned draft rows (name = "") don't falsely consume the cap.
    if (!isAdminEmail(user?.email)) {
      const { count } = await supabase
        .from("artists")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId)
        .not("name", "is", null)
        .neq("name", "");
      const limit = artistLimitForPlan(org?.localizer_plan ?? null);
      if ((count ?? 0) >= limit) {
        redirect("/dashboard?error=artist_limit");
      }
    }

    const newArtistId = randomUUID();
    const { error } = await supabase.from("artists").insert({
      id: newArtistId,
      org_id: orgId,
      name: "",
    });
    if (error) throw new Error(error.message);
    redirect(`/dashboard/artists/${newArtistId}/profile`);
  }

  function formatDate(iso: string | null): string | null {
    if (!iso) return null;
    try {
      return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  }

  return (
    <OnboardingGate artistCount={artists.length} hasTourRouter={hasTourRouter}>
    <ArtistLimitToast show={limitError} />
    <div className="dash-page" style={{ minHeight: "100vh", padding: "32px 24px 80px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        <div className="dash-header" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 32, position: "relative" }}>
          <div style={{ width: "100%" }}>
            <div className="dash-header-nav" style={{ position: "absolute", top: 0, right: 0, display: "flex", gap: 8, alignItems: "center" }}>
              <a href="/dashboard/support" style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, letterSpacing: "2px", textTransform: "uppercase" as const, color: "#000", textDecoration: "none" }}>SUPPORT/FAQ</a>
              <NotificationBell />
              <a href="/account" style={{ fontFamily: "var(--hw-font-display)", fontSize: 12, fontWeight: 400, letterSpacing: "3px", textTransform: "uppercase", color: "#fff", textDecoration: "none", background: "var(--hw-bg-invert)", padding: "8px 16px", border: "3px solid var(--hw-border-strong)" }}>Account</a>
            </div>
            <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, letterSpacing: "3px", color: "var(--hw-text-muted)" }}>HWY61 LABS</div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", borderBottom: "3px solid var(--hw-border-strong)", paddingBottom: 3, width: "100%", maxWidth: 520, marginTop: 36, gap: 12 }}>
              <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 48, letterSpacing: "2px", color: "var(--hw-crimson)", lineHeight: 0.9 }}>LOCALIZER</div>
              <div style={{ fontFamily: "var(--hw-font-mono)", fontSize: 12, letterSpacing: "2px", color: "var(--hw-text-muted)", textTransform: "uppercase" as const, paddingBottom: 4 }}>
                {artists.length} artist{artists.length !== 1 ? "s" : ""}
              </div>
            </div>
            <HwPageHeader title="YOUR ARTISTS" />
          </div>
        </div>

        {artists.length === 0 ? (
          <form action={createArtist} style={{
            maxWidth: 520,
            margin: "60px auto",
            padding: 40,
            border: "3px solid var(--hw-border-strong)",
            background: "var(--hw-bg-surface)",
            textAlign: "center",
            boxShadow: "var(--hw-shadow-lg)",
          }}>
            <div style={{
              fontFamily: "var(--hw-font-display)",
              fontSize: 24,
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "var(--hw-text)",
              marginBottom: 12,
            }}>
              NO ARTISTS YET
            </div>
            <div style={{
              fontFamily: "var(--hw-font-body)",
              fontSize: 14,
              fontWeight: 300,
              color: "var(--hw-text-secondary)",
              lineHeight: 1.5,
              marginBottom: 24,
            }}>
              Add your first artist to start managing tours, shows, and settlements.
            </div>
            <button type="submit" style={{
              padding: "14px 28px",
              border: "3px solid var(--hw-action-primary)",
              background: "var(--hw-action-primary)",
              color: "var(--hw-text-invert)",
              fontFamily: "var(--hw-font-display)",
              fontSize: 14,
              letterSpacing: "3px",
              textTransform: "uppercase",
              cursor: "pointer",
            }}>
              ADD ARTIST
            </button>
          </form>
        ) : (
          <div className="dash-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {artists.map((artist) => {
              const dateRange: string | null = null;

              return (
                <TourTile
                  key={artist.id}
                  tourId={artist.id}
                  tourName={artist.name ?? "Untitled Artist"}
                  bandName={artist.name ?? null}
                  dateRange={dateRange}
                  eventCount={tourCounts[artist.id] ?? 0}
                  imageUrl={artist.image_url ?? null}
                  href={`/dashboard/artists/${artist.id}`}
                  type="artist"
                />
              );
            })}

            <form id="create-artist-form" action={createArtist}>
              <button className="dash-add-btn" type="submit" style={{
                width: "100%",
                aspectRatio: "1 / 1",
                background: "var(--hw-bg-surface)",
                border: "3px dashed var(--hw-border-light)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                cursor: "pointer",
                padding: 20,
                transition: "var(--hw-ease)",
              }}>
                <span style={{ fontFamily: "var(--hw-font-display)", fontSize: 120, fontWeight: 400, color: "var(--hw-text)", lineHeight: 1 }}>+</span>
                <span style={{ fontFamily: "var(--hw-font-mono)", fontSize: 13, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--hw-text-muted)" }}>NEW ARTIST</span>
              </button>
            </form>
          </div>
        )}

        <form id="create-artist-form-hidden" action={createArtist} style={{ display: "none" }} />
      </div>
    </div>
    </OnboardingGate>
  );
}
