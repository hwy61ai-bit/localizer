import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("orgId");
  const tourId = req.nextUrl.searchParams.get("tourId");
  if (!orgId || !tourId) return NextResponse.json({ error: "Missing params" }, { status: 400 });

  const supabase = await supabaseServer();

  const { data: tour } = await supabase
    .from("tours")
    .select("artist_id")
    .eq("id", tourId)
    .single();

  if (!tour?.artist_id) return NextResponse.json({ logoUrl: null });

  const { data: artist } = await supabase
    .from("artists")
    .select("logo_url")
    .eq("id", tour.artist_id)
    .single();

  return NextResponse.json({ logoUrl: artist?.logo_url ?? null });
}
