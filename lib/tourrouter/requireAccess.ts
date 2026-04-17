import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getTourRouterAccessLevel } from "@/lib/tourrouter/billingGate";
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
  | { ok: false; reason: "export_requires_paid"; status: 402 };

export type TourRouterAccessResult = AccessSuccess | AccessFailure;

export async function requireTourRouterAccess(): Promise<TourRouterAccessResult> {
  const supabase = await supabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { ok: false, reason: "unauthorized", status: 401 };

  const { data: profile } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.org_id) return { ok: false, reason: "no_org", status: 403 };

  const level = await getTourRouterAccessLevel(profile.org_id, user.email);
  // Membership exists, and billingGate.ts uses supabaseAdmin (RLS bypassed),
  // so 'none' should be unreachable here. If it fires, it indicates a data
  // integrity bug (e.g., org_members row pointing at a deleted orgs row).
  // Log loudly and fall back to 'free' so the request doesn't fail.
  if (level === "none") {
    console.error(
      `[requireTourRouterAccess] DATA INTEGRITY: getTourRouterAccessLevel returned 'none' for orgId=${profile.org_id}, userId=${user.id} despite active org_members row. After billingGate.ts moved to supabaseAdmin (RLS bypassed), this should be unreachable unless org_members points at a deleted orgs row. Falling back to 'free'.`,
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
 * Like requireTourRouterAccess, but additionally requires accessLevel === 'paid'.
 * Use on export routes and any other surface that should be gated behind a paid
 * TourRouter or bundle subscription. Free users get a 402 with reason
 * 'export_requires_paid'.
 */
export async function requirePaidTourRouterAccess(): Promise<TourRouterAccessResult> {
  const result = await requireTourRouterAccess();
  if (!result.ok) return result;
  if (result.accessLevel !== "paid") {
    return { ok: false, reason: "export_requires_paid", status: 402 };
  }
  return result;
}

export function tourRouterAccessErrorResponse(result: AccessFailure): NextResponse {
  if (result.reason === "export_requires_paid") {
    return NextResponse.json(
      {
        error: "export_requires_paid",
        message: "Exporting requires a paid TourRouter subscription.",
      },
      { status: 402 },
    );
  }
  return NextResponse.json({ error: result.reason }, { status: result.status });
}
