import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ venueId: string }> },
) {
  const { venueId } = await params;
  const supabase = await supabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get current flag count
  const { data: venue, error: fetchError } = await supabase
    .from("shared_venues")
    .select("id, flag_count")
    .eq("id", venueId)
    .single();

  if (fetchError || !venue) return NextResponse.json({ error: "Venue not found" }, { status: 404 });

  const newCount = (venue.flag_count || 0) + 1;
  const flagged = newCount >= 3;

  const { data: updated, error } = await supabase
    .from("shared_venues")
    .update({ flag_count: newCount, flagged })
    .eq("id", venueId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ venue: updated });
}
