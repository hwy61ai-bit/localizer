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
  | { ok: false; reason: "no_tourrouter_access"; status: 403 }
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
  if (level === "none") {
    console.error(
      `[requireTourRouterAccess] blocked: getTourRouterAccessLevel returned 'none' for orgId=${profile.org_id}, userId=${user.id}`,
    );
    return { ok: false, reason: "no_tourrouter_access", status: 403 };
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
  if (result.reason === "no_tourrouter_access") {
    return NextResponse.json(
      {
        error: "no_tourrouter_access",
        message: "Your organization does not have TourRouter access.",
      },
      { status: 403 },
    );
  }
  return NextResponse.json({ error: result.reason }, { status: result.status });
}
