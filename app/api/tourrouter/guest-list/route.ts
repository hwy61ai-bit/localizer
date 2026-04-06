import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";

export async function GET(req: NextRequest) {
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);
  const supabase = await supabaseServer();
  const orgId = result.orgId;

  const showId = req.nextUrl.searchParams.get("showId");
  if (!showId) return NextResponse.json({ error: "showId required" }, { status: 400 });

  const { data: entries, error } = await supabase
    .from("tour_guest_list")
    .select("*")
    .eq("show_id", showId)
    .eq("org_id", orgId)
    .order("created_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: entries ?? [] });
}

export async function POST(req: NextRequest) {
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);
  const supabase = await supabaseServer();
  const orgId = result.orgId;

  const body = await req.json();
  const { showId, guestName, plusOnes, passType, notes } = body;
  if (!showId || !guestName) return NextResponse.json({ error: "showId and guestName required" }, { status: 400 });

  const { data: entry, error } = await supabase
    .from("tour_guest_list")
    .insert({
      show_id: showId,
      org_id: orgId,
      guest_name: guestName,
      plus_ones: plusOnes || 0,
      pass_type: passType || "GA",
      notes: notes || null,
      status: "pending",
      submitted_by: result.userEmail || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry }, { status: 201 });
}
