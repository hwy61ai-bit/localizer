import { NextRequest, NextResponse } from "next/server";
import {
  geocodeCity,
  cacheGeocode,
  getDriveInfo,
  cacheDriveInfo,
} from "@/lib/tourrouter/mapbox";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);

  const { originCity, destCity, originCountry, destCountry, originState, destState } = await req.json();
  if (!originCity || !destCity) {
    return NextResponse.json(
      { error: "originCity and destCity required" },
      { status: 400 }
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  try {
    // Geocode both cities (checks CITY_COORDS → cache → Mapbox)
    const [origin, dest] = await Promise.all([
      geocodeCity(originCity, originCountry, originState),
      geocodeCity(destCity, destCountry, destState),
    ]);

    // Cache geocode results if we have service role key
    if (serviceRoleKey) {
      // Fire and forget — don't block the response
      cacheGeocode(
        originCity,
        origin.lat,
        origin.lng,
        origin.formattedName,
        serviceRoleKey
      );
      cacheGeocode(
        destCity,
        dest.lat,
        dest.lng,
        dest.formattedName,
        serviceRoleKey
      );
    }

    // Get drive info (checks cache → Mapbox Directions)
    const info = await getDriveInfo(originCity, destCity, originCountry, destCountry, originState, destState);

    // Cache drive result if we have service role key
    if (serviceRoleKey) {
      cacheDriveInfo(originCity, destCity, origin, dest, info, serviceRoleKey);
    }

    return NextResponse.json({
      ...info,
      origin: origin.formattedName,
      destination: dest.formattedName,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Drive info lookup failed", details: msg },
      { status: 500 }
    );
  }
}
