import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getCookieDomain } from "@/lib/cookieDomain";
import { ensureOrgExists } from "@/lib/auth/ensureOrgExists";

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
