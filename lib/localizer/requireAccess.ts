import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getLocalizerAccessLevel } from "@/lib/localizer/billingGate";
import type { User } from "@supabase/supabase-js";

type AccessSuccess = {
  ok: true;
  user: User;
  orgId: string;
  userEmail: string;
  accessLevel: "free" | "paid";
};
type AccessFailure =
  | { ok: false; reason: "unauthorized"; status: 401 }
  | { ok: false; reason: "no_org"; status: 403 }
  | { ok: false; reason: "download_requires_paid"; status: 402 };

export type LocalizerAccessResult = AccessSuccess | AccessFailure;

/**
 * Resolve the signed-in user, their org, and their Localizer access level.
 * Non-download Localizer routes should use this directly — free users pass
 * through with accessLevel === 'free'. Download routes that are initiated by
 * an authenticated tour manager should use requirePaidLocalizerAccess below.
 *
 * Public venue-facing routes (/api/download, /api/download-all) do NOT use
 * this helper because the caller is unauthenticated. Those routes call
 * getLocalizerAccessLevel(link.org_id) directly against the venue_links owner.
 *
 * Mirrors lib/tourrouter/requireAccess.ts#requireTourRouterAccess.
 */
export async function requireLocalizerAccess(): Promise<LocalizerAccessResult> {
  const supabase = await supabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { ok: false, reason: "unauthorized", status: 401 };

  const { data: profile } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.org_id) return { ok: false, reason: "no_org", status: 403 };

  const level = await getLocalizerAccessLevel(profile.org_id, user.email);
  // Membership exists, so the org exists — 'none' should be unreachable here.
  // If it happens (e.g. transient RLS hiccup), log and fall back to 'free'.
  if (level === "none") {
    console.warn(
      `[requireLocalizerAccess] getLocalizerAccessLevel returned 'none' for orgId=${profile.org_id} despite active membership — falling back to 'free'`,
    );
  }
  const accessLevel: "free" | "paid" = level === "paid" ? "paid" : "free";

  return {
    ok: true,
    user,
    orgId: profile.org_id,
    userEmail: user.email ?? "",
    accessLevel,
  };
}

/**
 * Like requireLocalizerAccess, but additionally requires accessLevel === 'paid'.
 * Use on any tour-manager-initiated download or export surface that should be
 * gated behind a paid Localizer or bundle subscription. Free users get a 402
 * with reason 'download_requires_paid'.
 *
 * NOTE: This helper is not used by /api/download or /api/download-all — those
 * are public venue-facing routes that gate by the link owner's org, not the
 * viewer. Reserved for future authenticated download surfaces (e.g. a tour
 * manager "download all assets for this tour" button in the dashboard).
 */
export async function requirePaidLocalizerAccess(): Promise<LocalizerAccessResult> {
  const result = await requireLocalizerAccess();
  if (!result.ok) return result;
  if (result.accessLevel !== "paid") {
    return { ok: false, reason: "download_requires_paid", status: 402 };
  }
  return result;
}

export function localizerAccessErrorResponse(result: AccessFailure): NextResponse {
  if (result.reason === "download_requires_paid") {
    return NextResponse.json(
      {
        error: "download_requires_paid",
        message: "Downloading assets requires a paid Localizer subscription.",
      },
      { status: 402 },
    );
  }
  return NextResponse.json({ error: result.reason }, { status: result.status });
}
