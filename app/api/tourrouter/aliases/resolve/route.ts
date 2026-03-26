import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { resolveHeaders } from "@/lib/tourrouter/aliasLibrary";

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership?.org_id) return NextResponse.json({ error: "No org" }, { status: 403 });

  const { headers, sampleRows, agencyName } = await req.json();
  if (!headers || !Array.isArray(headers)) {
    return NextResponse.json({ error: "headers array required" }, { status: 400 });
  }

  try {
    const result = await resolveHeaders(headers, membership.org_id, sampleRows, agencyName);
    return NextResponse.json({ mappings: result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Resolve failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
