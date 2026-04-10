import { NextRequest, NextResponse } from "next/server";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";
import { searchCities, getCityCoordinates } from "@/lib/tourrouter/geocoding";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);

  const q = req.nextUrl.searchParams.get("q") || "";
  if (!q.trim()) {
    return NextResponse.json({ error: "q parameter required" }, { status: 400 });
  }

  const country = req.nextUrl.searchParams.get("country") || undefined;
  const resolve = req.nextUrl.searchParams.get("resolve") === "true";

  if (resolve) {
    // Single best match via three-tier lookup
    if (!country) {
      return NextResponse.json({ error: "country parameter required when resolve=true" }, { status: 400 });
    }
    const state = req.nextUrl.searchParams.get("state") || undefined;
    const coords = await getCityCoordinates(q.trim(), country, state);
    return NextResponse.json({ result: coords });
  }

  // Autocomplete — top matches by population
  const limitParam = req.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 10, 1), 50) : 10;
  const cities = await searchCities(q.trim(), country, limit);
  return NextResponse.json({ cities });
}
