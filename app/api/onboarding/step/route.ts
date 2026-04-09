import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { isOnboardingRole } from "@/lib/onboarding/roles";

// Never cache — this route mutates per-user state.
export const dynamic = "force-dynamic";

type ErrCode =
  | "UNAUTHORIZED"
  | "INVALID_INPUT"
  | "INVALID_ROLE"
  | "NO_ORG"
  | "ORG_MISMATCH"
  | "RLS_BLOCKED"
  | "SERVER_ERROR";

function err(code: ErrCode, message: string, status: number) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
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

    const {
      step,
      data,
      orgId: claimedOrgId,
      userId: claimedUserId,
    } = raw as {
      step?: unknown;
      data?: unknown;
      orgId?: unknown;
      userId?: unknown;
    };

    if (step !== 1 && step !== 2 && step !== 3) {
      return err("INVALID_INPUT", "Step must be 1, 2, or 3.", 400);
    }
    if (!data || typeof data !== "object") {
      return err("INVALID_INPUT", "Missing data payload.", 400);
    }
    if (typeof claimedOrgId !== "string" || typeof claimedUserId !== "string") {
      return err("INVALID_INPUT", "Missing orgId or userId.", 400);
    }

    // ── Membership lookup & cross-check ─────────────────────
    // Known simplification (matches page.tsx): if a user belongs to multiple
    // orgs, .maybeSingle() returns an arbitrary one. Fine for onboarding.
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!membership?.org_id) {
      return err("NO_ORG", "No org membership found for this user.", 403);
    }

    // Defense-in-depth: the client-claimed ids must match the server-derived
    // ids. Catches stale sessions, client bugs, and any attempt to write
    // into an org the user does not belong to.
    if (claimedUserId !== user.id || claimedOrgId !== membership.org_id) {
      return err(
        "ORG_MISMATCH",
        "Session does not match the org being updated.",
        403
      );
    }

    const orgId = membership.org_id;
    const payload = data as Record<string, unknown>;

    // ── Step 1: org name ────────────────────────────────────
    if (step === 1) {
      if (!isNonEmptyString(payload.name)) {
        return err("INVALID_INPUT", "Org name is required.", 400);
      }
      const name = payload.name.trim();

      const { data: updated } = await supabase
        .from("orgs")
        .update({ name, onboarding_step: 2 })
        .eq("id", orgId)
        .select("id")
        .maybeSingle();

      if (!updated) {
        return err(
          "RLS_BLOCKED",
          "Could not save org name. Please contact support.",
          403
        );
      }

      return NextResponse.json({ ok: true, nextStep: 2 });
    }

    // ── Step 2: full name → auth.users.user_metadata ────────
    if (step === 2) {
      if (!isNonEmptyString(payload.full_name)) {
        return err("INVALID_INPUT", "Name is required.", 400);
      }
      const fullName = payload.full_name.trim();

      // Write full_name into auth.users.user_metadata per the earlier
      // decision to avoid adding a display_name column on org_members.
      const { error: updateUserError } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });
      if (updateUserError) {
        console.error("[onboarding] auth.updateUser failed:", updateUserError);
        return err(
          "SERVER_ERROR",
          "Could not save your name. Please try again.",
          500
        );
      }

      const { data: updated } = await supabase
        .from("orgs")
        .update({ onboarding_step: 3 })
        .eq("id", orgId)
        .select("id")
        .maybeSingle();

      if (!updated) {
        return err(
          "RLS_BLOCKED",
          "Could not advance onboarding. Please contact support.",
          403
        );
      }

      return NextResponse.json({ ok: true, nextStep: 3 });
    }

    // ── Step 3: role + finalize ─────────────────────────────
    if (!isNonEmptyString(payload.user_role)) {
      return err("INVALID_INPUT", "Role is required.", 400);
    }
    const userRole = payload.user_role.trim();
    if (!isOnboardingRole(userRole)) {
      return err("INVALID_ROLE", "That role is not allowed.", 400);
    }

    const { data: memberUpdated } = await supabase
      .from("org_members")
      .update({ user_role: userRole })
      .eq("user_id", user.id)
      .eq("org_id", orgId)
      .select("user_id")
      .maybeSingle();

    if (!memberUpdated) {
      return err(
        "RLS_BLOCKED",
        "Could not save your role. Please contact support.",
        403
      );
    }

    const { data: orgUpdated } = await supabase
      .from("orgs")
      .update({ onboarding_step: 4, onboarding_completed: true })
      .eq("id", orgId)
      .select("id")
      .maybeSingle();

    if (!orgUpdated) {
      return err(
        "RLS_BLOCKED",
        "Could not finish onboarding. Please contact support.",
        403
      );
    }

    return NextResponse.json({ ok: true, nextStep: 4 });
  } catch (e) {
    console.error("[onboarding] unexpected error:", e);
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
