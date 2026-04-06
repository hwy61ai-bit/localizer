import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const { entryId } = await params;
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);
  const supabase = await supabaseServer();

  const body = await req.json();
  const allowed = ["guest_name", "plus_ones", "pass_type", "status", "notes"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  const { data: entry, error } = await supabase
    .from("guest_list")
    .update(update)
    .eq("id", entryId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> },
) {
  const { entryId } = await params;
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);
  const supabase = await supabaseServer();

  const { error } = await supabase
    .from("guest_list")
    .delete()
    .eq("id", entryId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
