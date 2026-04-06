import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> },
) {
  const { expenseId } = await params;
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);
  const supabase = await supabaseServer();
  const orgId = result.orgId;

  const body = await req.json();
  const allowed = ["date", "category", "amount", "currency", "description", "paid_by", "needs_reimbursement", "receipt_url", "show_id"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  const { data: expense, error } = await supabase
    .from("tour_expenses")
    .update(update)
    .eq("id", expenseId)
    .eq("org_id", orgId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expense });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> },
) {
  const { expenseId } = await params;
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);
  const supabase = await supabaseServer();
  const orgId = result.orgId;

  const { error } = await supabase
    .from("tour_expenses")
    .delete()
    .eq("id", expenseId)
    .eq("org_id", orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
