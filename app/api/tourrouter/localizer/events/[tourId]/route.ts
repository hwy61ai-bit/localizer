import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tourId: string }> },
) {
  const { tourId } = await params;
  const supabase = await supabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.org_id) return NextResponse.json({ error: "No org" }, { status: 403 });

  // Verify tour belongs to org
  const { data: tour } = await supabase
    .from("tours")
    .select("id")
    .eq("id", tourId)
    .eq("org_id", profile.org_id)
    .single();
  if (!tour) return NextResponse.json({ error: "Tour not found" }, { status: 404 });

  const { data: events, error } = await supabase
    .from("events")
    .select("id, date_iso, day, venue, venue_name, city, state, venue_city, venue_state")
    .eq("tour_id", tourId)
    .order("date_iso");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: events ?? [] });
}
