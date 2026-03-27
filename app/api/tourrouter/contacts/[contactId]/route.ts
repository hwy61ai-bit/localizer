import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

async function getAuthOrg(supabase: Awaited<ReturnType<typeof supabaseServer>>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: profile } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();
  return profile?.org_id ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ contactId: string }> },
) {
  const { contactId } = await params;
  const supabase = await supabaseServer();
  const orgId = await getAuthOrg(supabase);
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: contact, error } = await supabase
    .from("shared_contacts")
    .select("*, account_contacts!left(id, private_notes, relationship_rating, my_flag, my_flag_notes, tags, last_contact_date)")
    .eq("id", contactId)
    .eq("account_contacts.org_id", orgId)
    .single();

  if (error || !contact) return NextResponse.json({ error: "Contact not found" }, { status: 404 });

  const acArr = contact.account_contacts as Record<string, unknown>[] | null;
  const ac = acArr && acArr.length > 0 ? acArr[0] : null;
  const { account_contacts: _, ...shared } = contact;

  return NextResponse.json({
    contact: {
      ...shared,
      private_notes: ac?.private_notes || null,
      relationship_rating: ac?.relationship_rating || null,
      my_flag: ac?.my_flag || false,
      my_flag_notes: ac?.my_flag_notes || null,
      tags: ac?.tags || null,
      last_contact_date: ac?.last_contact_date || null,
      account_contact_id: ac?.id || null,
    },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ contactId: string }> },
) {
  const { contactId } = await params;
  const supabase = await supabaseServer();
  const orgId = await getAuthOrg(supabase);
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Shared fields → update shared_contacts
  const sharedFields = ["name", "company", "role", "email", "phone", "markets", "website"];
  const sharedUpdate: Record<string, unknown> = {};
  for (const key of sharedFields) {
    if (body[key] !== undefined) sharedUpdate[key] = body[key];
  }

  if (Object.keys(sharedUpdate).length > 0) {
    const { error } = await supabase
      .from("shared_contacts")
      .update(sharedUpdate)
      .eq("id", contactId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Private fields → update account_contacts
  const privateFields = ["private_notes", "relationship_rating", "my_flag", "my_flag_notes", "tags", "last_contact_date"];
  const privateUpdate: Record<string, unknown> = {};
  for (const key of privateFields) {
    if (body[key] !== undefined) privateUpdate[key] = body[key];
  }

  if (Object.keys(privateUpdate).length > 0) {
    // Ensure account_contacts row exists
    const { data: existing } = await supabase
      .from("account_contacts")
      .select("id")
      .eq("shared_contact_id", contactId)
      .eq("org_id", orgId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("account_contacts")
        .update(privateUpdate)
        .eq("id", existing.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await supabase
        .from("account_contacts")
        .insert({ shared_contact_id: contactId, org_id: orgId, ...privateUpdate });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ contactId: string }> },
) {
  const { contactId } = await params;
  const supabase = await supabaseServer();
  const orgId = await getAuthOrg(supabase);
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only remove the private link — never delete the shared contact
  const { error } = await supabase
    .from("account_contacts")
    .delete()
    .eq("shared_contact_id", contactId)
    .eq("org_id", orgId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
