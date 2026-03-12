import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { eventId } = params;
  const supabase = await supabaseServer();
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { eventId } = params;
  const body = await req.json();
  const supabase = await supabaseServer();
  const { error } = await supabase.from("events").update(body).eq("id", eventId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
