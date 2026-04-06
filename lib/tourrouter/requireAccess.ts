import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { checkTourRouterAccess } from "@/lib/tourrouter/billingGate";
import type { User } from "@supabase/supabase-js";

type AccessSuccess = { ok: true; user: User; orgId: string; userEmail: string };
type AccessFailure =
  | { ok: false; reason: "unauthorized"; status: 401 }
  | { ok: false; reason: "no_org"; status: 403 }
  | { ok: false; reason: "subscription_required"; status: 403 };

export type TourRouterAccessResult = AccessSuccess | AccessFailure;

export async function requireTourRouterAccess(
  options?: { skipBillingGate?: boolean }
): Promise<TourRouterAccessResult> {
  const supabase = await supabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { ok: false, reason: "unauthorized", status: 401 };

  const { data: profile } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.org_id) return { ok: false, reason: "no_org", status: 403 };

  if (!options?.skipBillingGate) {
    const access = await checkTourRouterAccess(profile.org_id, user.email);
    if (!access.allowed) return { ok: false, reason: "subscription_required", status: 403 };
  }

  return { ok: true, user, orgId: profile.org_id, userEmail: user.email ?? "" };
}

export function tourRouterAccessErrorResponse(result: AccessFailure): NextResponse {
  return NextResponse.json({ error: result.reason }, { status: result.status });
}
