import { NextRequest, NextResponse } from "next/server";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";
import { resolveAllCityCoords, resolveAllAirports } from "@/lib/tourrouter/geocoding";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);

  const { shows } = await req.json();
  if (!Array.isArray(shows)) {
    return NextResponse.json({ error: "shows array required" }, { status: 400 });
  }

  const pairs: Array<{ city: string; country: string }> = shows
    .filter((s: { city?: string; country?: string }) => s.city && s.country)
    .map((s: { city: string; country: string }) => ({ city: s.city, country: s.country }));

  // Resolve coords first, then airports (which need coordsMap for nearest-airport fallback)
  const coordsMap = await resolveAllCityCoords(pairs);
  const airportMap = await resolveAllAirports(pairs, coordsMap);

  // Serialize Maps to plain objects for JSON transport.
  // AirportInfo.coords is [number, number] | undefined — JSON.stringify drops undefined,
  // so explicitly convert to null for safe round-trip serialization.
  const coordsObj: Record<string, [number, number]> = {};
  for (const [k, v] of coordsMap) coordsObj[k] = v;

  const airportsObj: Record<string, { iata: string; coords: [number, number] | null }> = {};
  for (const [k, v] of airportMap) {
    airportsObj[k] = { iata: v.iata, coords: v.coords ?? null };
  }

  return NextResponse.json({ coords: coordsObj, airports: airportsObj });
}
