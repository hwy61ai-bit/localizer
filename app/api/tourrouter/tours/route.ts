import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";
import { createNotification } from "@/lib/notifications";
import { fetchLiveRates } from "@/lib/tourrouter/fetchLiveRates";

export async function GET() {
  try {
    const result = await requireTourRouterAccess();
    if (!result.ok) return tourRouterAccessErrorResponse(result);
    const supabase = await supabaseServer();

    const { data: tours, error } = await supabase
      .from("tours_routing")
      .select("*, artists(name)")
      .eq("org_id", result.orgId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[TourRouter tours GET] Query error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ tours: tours ?? [] });
  } catch (e) {
    console.error("[TourRouter tours GET] Unexpected error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const result = await requireTourRouterAccess();
    if (!result.ok) return tourRouterAccessErrorResponse(result);
    const supabase = await supabaseServer();

    const body = await req.json();
    const { name, artist_id } = body;
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    // If artist_id provided, fetch default_roster and map RosterEntry → RosterMember
    let tour_roster: Record<string, unknown>[] | null = null;
    let tour_vehicles: Record<string, unknown>[] = [];
    if (artist_id) {
      try {
        const { data: artist } = await supabase
          .from("artists")
          .select("default_roster, vehicles_equipment")
          .eq("id", artist_id)
          .maybeSingle();
        if (!artist) {
          console.warn("[TourRouter tours POST] Artist not found, tour will start with empty roster + fleet:", artist_id);
        }
        if (artist?.default_roster && Array.isArray(artist.default_roster) && artist.default_roster.length > 0) {
          tour_roster = artist.default_roster.map((entry: Record<string, unknown>) => {
            // Seed pay components from artist-level rates if present
            const payComponents: Record<string, unknown>[] = [];
            if (entry.showDayRate && typeof entry.showDayRate === 'number') {
              payComponents.push({
                type: 'per_show',
                amount: entry.showDayRate,
                currency: 'USD',
                appliesTo: ['show_day'],
              });
            }
            if (entry.offDayRate && typeof entry.offDayRate === 'number') {
              payComponents.push({
                type: 'per_day',
                amount: entry.offDayRate,
                currency: 'USD',
                appliesTo: ['off_day', 'travel_day'],
              });
            }
            if (entry.perDiemRate && typeof entry.perDiemRate === 'number') {
              payComponents.push({
                type: 'per_diem',
                amount: entry.perDiemRate,
                currency: 'USD',
                appliesTo: ['show_day', 'off_day', 'travel_day', 'load_in_day'],
              });
            }
            // Default component if no rates were set
            if (payComponents.length === 0) {
              payComponents.push({
                type: 'per_show',
                amount: 0,
                currency: 'USD',
                appliesTo: ['show_day'],
              });
            }

            return {
              id: entry.id || crypto.randomUUID(),
              name: (entry.preferredName as string) || (entry.legalName as string) || 'Unknown',
              role: (entry.role as string) || 'Other',
              roleCategory: 'band' as const,
              payComponents,
              isActive: true,
            };
          });
        }
        // Copy artist fleet template into new tour (Decision A: bare copy, no defaults)
        const fleetVehicles = (artist?.vehicles_equipment as { vehicles?: unknown })?.vehicles;
        if (Array.isArray(fleetVehicles)) {
          tour_vehicles = fleetVehicles as Record<string, unknown>[];
        }
      } catch (e) {
        console.error("[TourRouter tours POST] Failed to fetch artist roster + fleet, skipping:", e);
      }
    }

    // Fetch live currency rates for new tour (non-blocking on failure)
    let currency_rates: Record<string, number> = {};
    try {
      currency_rates = await fetchLiveRates();
    } catch (e) {
      console.warn("[TourRouter tours POST] Failed to fetch live rates, tour will start without them:", e);
    }

    console.log("[TourRouter tours POST] Inserting tour:", { org_id: result.orgId, name, artist_id });

    const { data: tour, error } = await supabase
      .from("tours_routing")
      .insert({
        org_id: result.orgId,
        name,
        artist_id: artist_id || null,
        tour_vehicles,
        ...(Object.keys(currency_rates).length > 0 ? { currency_rates } : {}),
        ...(tour_roster ? { tour_roster } : {}),
      })
      .select()
      .single();

    if (error) {
      console.error("[TourRouter tours POST] Insert error:", error.message, error.details, error.hint);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[TourRouter tours POST] Created tour:", tour?.id);

    await createNotification({
      supabase,
      orgId: result.orgId,
      type: "tour_created",
      title: "New tour created",
      body: name,
      link: `/dashboard/routing/${tour.id}`,
    });

    return NextResponse.json({ tour }, { status: 201 });
  } catch (e) {
    console.error("[TourRouter tours POST] Unexpected error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
