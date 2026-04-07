import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";

export async function GET() {
  try {
    const result = await requireTourRouterAccess();
    if (!result.ok) return tourRouterAccessErrorResponse(result);
    const supabase = await supabaseServer();

    const { data: artists, error } = await supabase
      .from("artists")
      .select("*")
      .eq("org_id", result.orgId)
      .order("name", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ artists: artists ?? [] });
  } catch (e) {
    console.error("[Artists GET] Unexpected error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const result = await requireTourRouterAccess();
    if (!result.ok) return tourRouterAccessErrorResponse(result);

    const supabase = await supabaseServer();
    const body = await req.json();
    const { name } = body;
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const { data: artist, error } = await supabase
      .from("artists")
      .insert({ org_id: result.orgId, name })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ artist }, { status: 201 });
  } catch (e) {
    console.error("[Artists POST] Unexpected error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
