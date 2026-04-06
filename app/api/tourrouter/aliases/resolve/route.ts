import { NextRequest, NextResponse } from "next/server";
import { resolveHeaders } from "@/lib/tourrouter/aliasLibrary";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";

export async function POST(req: NextRequest) {
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);

  const { headers, sampleRows, agencyName } = await req.json();
  if (!headers || !Array.isArray(headers)) {
    return NextResponse.json({ error: "headers array required" }, { status: 400 });
  }

  try {
    const mappings = await resolveHeaders(headers, result.orgId, sampleRows, agencyName);
    return NextResponse.json({ mappings });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Resolve failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
