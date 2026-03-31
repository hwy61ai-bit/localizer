import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin, hostname } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const postLoginPath = hostname.includes("tourrouter") || hostname.includes("diy")
    ? "/dashboard/routing"
    : "/dashboard";

  console.log("AUTH CALLBACK HIT", { token_hash: !!token_hash, type, code: !!code });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    console.log("verifyOtp result:", error?.message ?? "success");
    if (!error) return NextResponse.redirect(`${origin}${postLoginPath}`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    console.log("exchangeCode result:", error?.message ?? "success");
    if (!error) return NextResponse.redirect(`${origin}${postLoginPath}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
