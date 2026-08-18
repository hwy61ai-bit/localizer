import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// One @, no whitespace, a domain carrying at least one dot. Deliberately
// permissive — the real check is whether launch mail delivers, not this regex.
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
const MAX_EMAIL_LENGTH = 254; // RFC 5321 practical ceiling

function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return xff || req.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(req: NextRequest) {
  try {
    let body: { email?: unknown; website?: unknown };
    try {
      body = await req.json();
    } catch {
      // Unparseable body is a malformed client, not a server fault.
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    // Honeypot. Real users never see the "website" field, so anything in it is a
    // bot: hand back the exact 200 a real signup gets and write nothing.
    if (typeof body?.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ ok: true });
    }

    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(email)) {
      return NextResponse.json({ ok: false, error: "invalid_email" }, { status: 400 });
    }

    const rl = await checkRateLimit(`prelaunch-signup:${clientIp(req)}`, {
      limit: 5,
      window: "1 h",
    });
    if (!rl.success) {
      return NextResponse.json(
        { ok: false, error: "rate_limited" },
        {
          status: 429,
          headers: rl.reset
            ? {
                "Retry-After": String(
                  Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000))
                ),
              }
            : undefined,
        }
      );
    }

    // Service role: signups arrive unauthenticated, so there is no session for
    // RLS to key off. Nothing user-supplied reaches this client beyond `email`.
    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from("prelaunch_signups")
      .upsert(
        { email, source: "coming_soon" },
        { onConflict: "email", ignoreDuplicates: true }
      )
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("[prelaunch/signup] upsert failed:", error.message);
      return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
    }

    // Rule 6's .select().maybeSingle() chain, with one documented exception: a
    // null row here means the email was already on the list (ignoreDuplicates
    // returns nothing), NOT a silent RLS rejection — the service-role client
    // bypasses RLS, so RLS cannot be what dropped the write. Both cases return
    // an identical 200: a duplicate must be indistinguishable from a new signup
    // on the wire, or the endpoint becomes an email-enumeration oracle.
    console.log(
      `[prelaunch/signup] ${data ? "new" : "duplicate"} signup recorded`
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[prelaunch/signup] unexpected error:", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
