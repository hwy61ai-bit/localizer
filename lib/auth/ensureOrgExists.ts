import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Ensures the authenticated user has an org and an org_members row.
 * Idempotent: if the user already has an org, returns immediately.
 *
 * Called from:
 * - app/auth/callback/route.ts — on magic-link callback
 * - app/dashboard/page.tsx — on dashboard render, to catch flows
 *   that bypass the callback (notably Google OAuth implicit flow,
 *   where the access_token arrives in the URL fragment that the
 *   server route can't see)
 *
 * New orgs start on a 14-day no-card Localizer trial via trial_ends_at
 * (now + 7d). No active localizer_plan_status is seeded — the billing
 * gate treats an unexpired trial_ends_at as paid-equivalent access, then
 * falls through to "free" after expiry. The Stripe webhook flips
 * localizer_plan_status to "active" on payment. plan='pro' remains as
 * TourRouter's tier (separate product, out of scope here).
 */
export async function ensureOrgExists(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const admin = supabaseAdmin();

  // Stamp user assent on every login. Existing users' first login after the
  // checkbox deploy is their assent moment, so this must run before the
  // "already has an org" early return. Non-blocking: a failure here must
  // never break login.
  try {
    const { error: assentError } = await admin
      .from("user_assents")
      .upsert({ user_id: user.id, tos_version: "v1.0-2026-07" }, { onConflict: "user_id", ignoreDuplicates: true });
    if (assentError) {
      console.error("ensureOrgExists: user_assents upsert failed (non-blocking)", assentError);
    }
  } catch (e) {
    console.error("ensureOrgExists: user_assents upsert threw (non-blocking)", e);
  }

  const { data: existing } = await admin
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return;

  const newOrgId = randomUUID();
  const { data: orgRow, error: orgError } = await admin
    .from("orgs")
    .insert({
      id: newOrgId,
      name: "My Workspace",
      owner_email: user.email ?? null,
      plan: "pro",
      localizer_plan: null,
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      localizer_enabled: true,
    })
    .select()
    .maybeSingle();

  if (orgError || !orgRow) {
    console.error("ensureOrgExists: org insert failed", orgError);
    throw new Error(orgError?.message ?? "org insert returned no row (RLS?)");
  }

  const { data: memberRow, error: memberError } = await admin
    .from("org_members")
    .insert({ org_id: newOrgId, user_id: user.id, role: "owner" })
    .select()
    .maybeSingle();

  if (memberError || !memberRow) {
    console.error("ensureOrgExists: org_members insert failed", memberError);
    throw new Error(memberError?.message ?? "org_members insert returned no row (RLS?)");
  }

  if (user.email) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/welcome`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.WELCOME_INTERNAL_SECRET}`,
        },
        body: JSON.stringify({ email: user.email }),
      });
    } catch {
      // Non-blocking — don't fail onboarding if email fails
    }
  }
}
