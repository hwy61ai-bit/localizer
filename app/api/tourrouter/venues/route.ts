import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(req: NextRequest) {
  const supabase = await supabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q.trim()) return NextResponse.json({ venues: [] });

  const pattern = `%${q}%`;
  const { data: venues, error } = await supabase
    .from("shared_venues")
    .select("*")
    .or(`name.ilike.${pattern},city.ilike.${pattern}`)
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ venues: venues ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, city, country, capacity, address } = body;
  if (!name || !city) return NextResponse.json({ error: "name and city required" }, { status: 400 });

  const { data: venue, error } = await supabase
    .from("shared_venues")
    .insert({
      name,
      city,
      country: country || null,
      capacity: capacity ?? null,
      address: address || null,
      added_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ venue }, { status: 201 });
}
