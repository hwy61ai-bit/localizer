import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { EmailOtpType, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { getCookieDomain } from "@/lib/cookieDomain";

async function ensureOrgExists(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: existing } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) return;

  const newOrgId = randomUUID();
  const { data: orgRow, error: orgError } = await supabase
    .from("orgs")
    .insert({
      id: newOrgId,
      name: "My Workspace",
      owner_email: user.email ?? null,
      trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      localizer_enabled: true,
    })
    .select()
    .maybeSingle();

  if (orgError || !orgRow) {
    console.error("ensureOrgExists: org insert failed", orgError);
    throw new Error(orgError?.message ?? "org insert returned no row (RLS?)");
  }

  const { data: memberRow, error: memberError } = await supabase
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

export async function GET(request: Request) {
  const { searchParams, origin, hostname } = new URL(request.url);
  const cookieDomain = getCookieDomain(hostname);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  console.log("AUTH CALLBACK HIT", { token_hash: !!token_hash, type, code: !!code });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const mergedOptions = cookieDomain
              ? { ...options, domain: cookieDomain }
              : options;
            cookieStore.set(name, value, mergedOptions);
          });
        },
      },
    }
  );

  let authed = false;

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    console.log("verifyOtp result:", error?.message ?? "success");
    if (!error) authed = true;
  }

  if (!authed && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    console.log("exchangeCode result:", error?.message ?? "success");
    if (!error) authed = true;
  }

  if (authed) {
    try {
      await ensureOrgExists(supabase);
      return NextResponse.redirect(`${origin}/dashboard`);
    } catch (e) {
      console.error("ensureOrgExists threw", e);
      return NextResponse.redirect(`${origin}/login?error=auth_setup`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
