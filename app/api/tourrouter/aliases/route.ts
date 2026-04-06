import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { saveAlias } from "@/lib/tourrouter/aliasLibrary";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";

export async function GET(req: NextRequest) {
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);
  const supabase = await supabaseServer();

  const { data: aliases, error } = await supabase
    .from("field_aliases")
    .select("*")
    .or(`org_id.eq.${result.orgId},scope.eq.global`)
    .order("raw_header");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ aliases: aliases ?? [] });
}

export async function POST(req: NextRequest) {
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);

  const { header, field, agencyName } = await req.json();
  if (!header || !field) return NextResponse.json({ error: "header and field required" }, { status: 400 });

  try {
    await saveAlias(result.orgId, header, field, "account", agencyName);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Save failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
