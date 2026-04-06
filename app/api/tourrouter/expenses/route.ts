import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";

export async function GET(req: NextRequest) {
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);
  const supabase = await supabaseServer();
  const orgId = result.orgId;

  const tourId = req.nextUrl.searchParams.get("tourId");
  if (!tourId) return NextResponse.json({ error: "tourId required" }, { status: 400 });

  const { data: expenses, error } = await supabase
    .from("tour_expenses")
    .select("*")
    .eq("tour_id", tourId)
    .eq("org_id", orgId)
    .order("date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expenses: expenses ?? [] });
}

export async function POST(req: NextRequest) {
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);
  const supabase = await supabaseServer();
  const orgId = result.orgId;

  const body = await req.json();
  const { tourId, showId, date, category, amount, currency, description, paidBy, needsReimbursement, receiptUrl } = body;
  if (!tourId || !category || !amount) return NextResponse.json({ error: "tourId, category, and amount required" }, { status: 400 });

  const { data: expense, error } = await supabase
    .from("tour_expenses")
    .insert({
      tour_id: tourId,
      org_id: orgId,
      show_id: showId || null,
      date: date || new Date().toISOString().split("T")[0],
      category,
      amount: parseFloat(amount) || 0,
      currency: currency || "USD",
      description: description || null,
      paid_by: paidBy || null,
      needs_reimbursement: needsReimbursement || false,
      receipt_url: receiptUrl || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ expense }, { status: 201 });
}
