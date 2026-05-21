import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

// Never cache — this route mutates per-user state.
export const dynamic = "force-dynamic";

type ErrCode =
  | "UNAUTHORIZED"
  | "INVALID_INPUT"
  | "NO_ORG"
  | "RLS_BLOCKED"
  | "SERVER_ERROR";

function err(code: ErrCode, message: string, status: number) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseServer();

    // ── Auth ────────────────────────────────────────────────
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return err("UNAUTHORIZED", "You must be signed in.", 401);
    }

    // ── Parse body ──────────────────────────────────────────
    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return err("INVALID_INPUT", "Request body must be valid JSON.", 400);
    }

    if (!raw || typeof raw !== "object") {
      return err("INVALID_INPUT", "Request body must be a JSON object.", 400);
    }

    const { step } = raw as { step?: unknown };

    const isComplete = step === "complete";
    const isValidStepNumber =
      typeof step === "number" &&
      Number.isInteger(step) &&
      step >= 1 &&
      step <= 5;

    if (!isComplete && !isValidStepNumber) {
      return err(
        "INVALID_INPUT",
        'Step must be an integer 1..5 or the string "complete".',
        400
      );
    }

    // ── Membership lookup ───────────────────────────────────
    // Known simplification (matches /api/onboarding/step): if a user belongs
    // to multiple orgs, .maybeSingle() returns an arbitrary one. Fine for
    // onboarding.
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership?.org_id) {
      return err("NO_ORG", "No org membership found for this user.", 403);
    }

    const orgId = membership.org_id;

    // ── Write ───────────────────────────────────────────────
    const updatePayload = isComplete
      ? { localizer_onboarding_step: 5, localizer_onboarding_completed: true }
      : { localizer_onboarding_step: step as number };

    const { data: updated } = await supabase
      .from("orgs")
      .update(updatePayload)
      .eq("id", orgId)
      .select("id")
      .maybeSingle();

    if (!updated) {
      return err(
        "RLS_BLOCKED",
        "Could not save onboarding step. Please contact support.",
        403
      );
    }

    return NextResponse.json({
      ok: true,
      step: isComplete ? 5 : (step as number),
    });
  } catch (e) {
    console.error("[localizer-onboarding] unexpected error:", e);
    return NextResponse.json(
      {
        ok: false,
        code: "SERVER_ERROR",
        message: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
