import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ contactId: string }> },
) {
  const { contactId } = await params;
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);
  const supabase = await supabaseServer();

  // Set my_flag on account_contacts (upsert)
  const { data: existing } = await supabase
    .from("account_contacts")
    .select("id, my_flag")
    .eq("shared_contact_id", contactId)
    .eq("org_id", result.orgId)
    .maybeSingle();

  if (existing) {
    if (existing.my_flag) {
      return NextResponse.json({ ok: true, alreadyFlagged: true });
    }
    const { error } = await supabase
      .from("account_contacts")
      .update({ my_flag: true })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("account_contacts")
      .insert({ shared_contact_id: contactId, org_id: result.orgId, my_flag: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Increment anonymous_flag_count on shared_contacts
  // Never store which org flagged — only the count
  const { data: contact } = await supabase
    .from("shared_contacts")
    .select("anonymous_flag_count")
    .eq("id", contactId)
    .single();

  const currentCount = (contact?.anonymous_flag_count as number) || 0;
  const { error: updateError } = await supabase
    .from("shared_contacts")
    .update({ anonymous_flag_count: currentCount + 1 })
    .eq("id", contactId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true, flagCount: currentCount + 1 });
}
