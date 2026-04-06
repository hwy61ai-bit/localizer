import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";

export async function GET(req: NextRequest) {
  const access = await requireTourRouterAccess();
  if (!access.ok) return tourRouterAccessErrorResponse(access);
  const supabase = await supabaseServer();
  const orgId = access.orgId;

  const q = req.nextUrl.searchParams.get("q") || "";
  const role = req.nextUrl.searchParams.get("role") || "";
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "10") || 10;

  let query = supabase
    .from("shared_contacts")
    .select("*, account_contacts!left(id, private_notes, relationship_rating, my_flag, my_flag_notes, tags, last_contact_date)")
    .eq("account_contacts.org_id", orgId)
    .order("name")
    .limit(limit);

  if (q) {
    query = query.or(`name.ilike.%${q}%,company.ilike.%${q}%`);
  }
  if (role) {
    query = query.ilike("role", `%${role}%`);
  }

  const { data: contacts, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flatten: merge account_contacts data into the contact object
  const result = (contacts || []).map((c) => {
    const acArr = c.account_contacts as Record<string, unknown>[] | null;
    const ac = acArr && acArr.length > 0 ? acArr[0] : null;
    const { account_contacts: _, ...shared } = c;
    return {
      ...shared,
      private_notes: ac?.private_notes || null,
      relationship_rating: ac?.relationship_rating || null,
      my_flag: ac?.my_flag || false,
      my_flag_notes: ac?.my_flag_notes || null,
      tags: ac?.tags || null,
      last_contact_date: ac?.last_contact_date || null,
      account_contact_id: ac?.id || null,
    };
  });

  return NextResponse.json({ contacts: result });
}

export async function POST(req: NextRequest) {
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);
  const supabase = await supabaseServer();
  const orgId = result.orgId;

  const body = await req.json();
  const { name, company, role, email, phone, markets, website } = body;
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  // Check if contact already exists (same name + email)
  let contactId: string | null = null;

  if (email) {
    const { data: existing } = await supabase
      .from("shared_contacts")
      .select("id")
      .eq("name", name)
      .eq("email", email)
      .maybeSingle();
    if (existing) contactId = existing.id;
  }

  // Create shared contact if not found
  if (!contactId) {
    const { data: newContact, error } = await supabase
      .from("shared_contacts")
      .insert({
        name,
        company: company || null,
        role: role || null,
        email: email || null,
        phone: phone || null,
        markets: markets || null,
        website: website || null,
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    contactId = newContact.id;
  }

  // Create or find account_contacts link
  const { data: existingLink } = await supabase
    .from("account_contacts")
    .select("id")
    .eq("shared_contact_id", contactId)
    .eq("org_id", orgId)
    .maybeSingle();

  if (!existingLink) {
    const { error: linkError } = await supabase
      .from("account_contacts")
      .insert({
        shared_contact_id: contactId,
        org_id: orgId,
      });
    if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  // Return the full contact
  const { data: contact } = await supabase
    .from("shared_contacts")
    .select("*")
    .eq("id", contactId)
    .single();

  return NextResponse.json({ contact }, { status: 201 });
}
