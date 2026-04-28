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
 * During beta, new orgs are provisioned with active Localizer
 * status (plan='pro', localizer_plan='agency', localizer_plan_status='active').
 * These three lines must be removed before COMING_SOON=false to
 * restore correct freemium gating for public signups.
 */
export async function ensureOrgExists(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const admin = supabaseAdmin();

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
      localizer_plan: "agency",
      localizer_plan_status: "active",
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
    } catch {
      // Non-blocking — don't fail onboarding if email fails
    }
  }
}
