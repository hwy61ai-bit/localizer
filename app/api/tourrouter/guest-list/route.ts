import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";

export async function GET(req: NextRequest) {
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);
  const supabase = await supabaseServer();

  const showId = req.nextUrl.searchParams.get("showId");
  if (!showId) return NextResponse.json({ error: "showId required" }, { status: 400 });

  const { data: entries, error } = await supabase
    .from("guest_list")
    .select("*")
    .eq("show_id", showId)
    .order("submitted_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: entries ?? [] });
}

export async function POST(req: NextRequest) {
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);
  const supabase = await supabaseServer();

  const body = await req.json();
  const { showId, guestName, plusOnes, passType, notes } = body;
  if (!showId || !guestName) return NextResponse.json({ error: "showId and guestName required" }, { status: 400 });

  const { data: entry, error } = await supabase
    .from("guest_list")
    .insert({
      show_id: showId,
      guest_name: guestName,
      plus_ones: plusOnes || 0,
      pass_type: passType || "GA",
      notes: notes || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry }, { status: 201 });
}
