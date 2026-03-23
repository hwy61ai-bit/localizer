import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[TourRouter tours GET] Auth error:", authError?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: membership, error: memberError } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError) {
      console.error("[TourRouter tours GET] org_members query error:", memberError.message);
      return NextResponse.json({ error: "Org lookup failed" }, { status: 500 });
    }
    if (!membership?.org_id) {
      console.error("[TourRouter tours GET] No org found for user:", user.id);
      return NextResponse.json({ error: "No org" }, { status: 403 });
    }

    const { data: tours, error } = await supabase
      .from("routing_tours")
      .select("*, artists(name)")
      .eq("org_id", membership.org_id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[TourRouter tours GET] Query error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ tours: tours ?? [] });
  } catch (e) {
    console.error("[TourRouter tours GET] Unexpected error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[TourRouter tours POST] Auth error:", authError?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: membership, error: memberError } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError) {
      console.error("[TourRouter tours POST] org_members query error:", memberError.message);
      return NextResponse.json({ error: "Org lookup failed: " + memberError.message }, { status: 500 });
    }
    if (!membership?.org_id) {
      console.error("[TourRouter tours POST] No org found for user:", user.id, user.email);
      return NextResponse.json({ error: "No org found for this user" }, { status: 403 });
    }

    const body = await req.json();
    const { name, artist_id } = body;
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    console.log("[TourRouter tours POST] Inserting tour:", { org_id: membership.org_id, name, artist_id, created_by: user.id });

    const { data: tour, error } = await supabase
      .from("routing_tours")
      .insert({
        org_id: membership.org_id,
        name,
        artist_id: artist_id || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("[TourRouter tours POST] Insert error:", error.message, error.details, error.hint);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[TourRouter tours POST] Created tour:", tour?.id);
    return NextResponse.json({ tour }, { status: 201 });
  } catch (e) {
    console.error("[TourRouter tours POST] Unexpected error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
