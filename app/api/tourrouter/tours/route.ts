import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get user's org
  const { data: profile } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.org_id) return NextResponse.json({ error: "No org" }, { status: 403 });

  const { data: tours, error } = await supabase
    .from("routing_tours")
    .select("*, artists(name)")
    .eq("org_id", profile.org_id)
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tours: tours ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.org_id) return NextResponse.json({ error: "No org" }, { status: 403 });

  const body = await req.json();
  const { name, artist_id } = body;
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const { data: tour, error } = await supabase
    .from("routing_tours")
    .insert({
      org_id: profile.org_id,
      name,
      artist_id: artist_id || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tour }, { status: 201 });
}
