import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { generatePublicToken } from "@/lib/tokens";

export async function POST(req: NextRequest) {
  const { orgId, eventId } = await req.json();
  const supabase = await supabaseServer();

  const { data: existing } = await supabase
    .from("venue_links").select("token")
    .eq("event_id", eventId).eq("is_active", true).maybeSingle();

  if (existing?.token) {
    return NextResponse.json({ token: existing.token });
  }

  const token = generatePublicToken();
  const { error } = await supabase.from("venue_links").insert({
    org_id: orgId,
    event_id: eventId,
    token,
    is_active: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ token });
}
