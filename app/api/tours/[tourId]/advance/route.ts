import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { tourId: string } }
) {
  const { tourId } = params;
  const body = await req.json();
  const supabase = await supabaseServer();
  const { error } = await supabase.from("tours").update(body).eq("id", tourId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
