import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.org_id) return NextResponse.json({ error: "No org" }, { status: 403 });

  const { data: tours, error } = await supabase
    .from("tours")
    .select("id, name, band_name, artist_id, artists(name), created_at")
    .eq("org_id", profile.org_id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get event counts
  const tourIds = (tours ?? []).map((t: Record<string, unknown>) => t.id as string);
  const counts: Record<string, number> = {};
  if (tourIds.length > 0) {
    const { data: events } = await supabase
      .from("events")
      .select("tour_id")
      .in("tour_id", tourIds);
    for (const e of events ?? []) {
      counts[e.tour_id] = (counts[e.tour_id] || 0) + 1;
    }
  }

  const result = (tours ?? []).map((t: Record<string, unknown>) => ({
    id: t.id,
    name: t.name,
    bandName: t.band_name,
    artistName: (t.artists as Record<string, unknown> | null)?.name || null,
    eventCount: counts[t.id as string] || 0,
    createdAt: t.created_at,
  }));

  return NextResponse.json({ tours: result });
}
