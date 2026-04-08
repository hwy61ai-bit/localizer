import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ artistId: string }> },
) {
  const { artistId } = await params;
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);
  const supabase = await supabaseServer();
  const orgId = result.orgId;

  const { data: artist, error } = await supabase
    .from("artists")
    .select("*")
    .eq("id", artistId)
    .eq("org_id", orgId)
    .single();

  if (error || !artist) return NextResponse.json({ error: "Artist not found" }, { status: 404 });
  return NextResponse.json({ artist });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ artistId: string }> },
) {
  const { artistId } = await params;
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);
  const supabase = await supabaseServer();
  const orgId = result.orgId;

  const body = await req.json();

  const allowed = [
    "name", "bio", "image_url", "logo_url",
    "manager_name", "manager_email",
    "booking_agent_name", "booking_agent_email",
    "publicist_name", "publicist_email",
    "agent_name", "agent_email",
    "spotify_url",
    "business_entity", "key_contacts", "tax_compliance", "insurance",
    "technical_production", "hospitality_rider", "promo_marketing",
    "merch_defaults", "vehicles_equipment", "lodging_defaults", "default_roster", "default_commissions",
  ];

  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data: artist, error } = await supabase
    .from("artists")
    .update(update)
    .eq("id", artistId)
    .eq("org_id", orgId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ artist });
}
