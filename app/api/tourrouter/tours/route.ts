import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { checkTourRouterAccess } from "@/lib/tourrouter/billingGate";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  try {
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[TourRouter tours GET] Auth error:", authError?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: membership, error: memberError } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError) {
      console.error("[TourRouter tours GET] org_members query error:", memberError.message);
      return NextResponse.json({ error: "Org lookup failed" }, { status: 500 });
    }
    if (!membership?.org_id) {
      console.error("[TourRouter tours GET] No org found for user:", user.id);
      return NextResponse.json({ error: "No org" }, { status: 403 });
    }

    // Billing gate
    const access = await checkTourRouterAccess(membership.org_id, user.email);
    if (!access.allowed) {
      return NextResponse.json({ error: "subscription_required", reason: access.reason }, { status: 403 });
    }

    const { data: tours, error } = await supabase
      .from("tours_routing")
      .select("*, artists(name)")
      .eq("org_id", membership.org_id)
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
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[TourRouter tours POST] Auth error:", authError?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: membership, error: memberError } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberError) {
      console.error("[TourRouter tours POST] org_members query error:", memberError.message);
      return NextResponse.json({ error: "Org lookup failed: " + memberError.message }, { status: 500 });
    }
    if (!membership?.org_id) {
      console.error("[TourRouter tours POST] No org found for user:", user.id, user.email);
      return NextResponse.json({ error: "No org found for this user" }, { status: 403 });
    }

    // Billing gate
    const access = await checkTourRouterAccess(membership.org_id, user.email);
    if (!access.allowed) {
      return NextResponse.json({ error: "subscription_required", reason: access.reason }, { status: 403 });
    }

    const body = await req.json();
    const { name, artist_id } = body;
    if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

    // If artist_id provided, fetch default_roster and map RosterEntry → RosterMember
    let tour_roster: Record<string, unknown>[] | null = null;
    if (artist_id) {
      try {
        const { data: artist } = await supabase
          .from("artists")
          .select("default_roster")
          .eq("id", artist_id)
          .single();
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
      } catch (e) {
        console.error("[TourRouter tours POST] Failed to fetch default_roster, skipping:", e);
      }
    }

    console.log("[TourRouter tours POST] Inserting tour:", { org_id: membership.org_id, name, artist_id });

    const { data: tour, error } = await supabase
      .from("tours_routing")
      .insert({
        org_id: membership.org_id,
        name,
        artist_id: artist_id || null,
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
      orgId: membership.org_id,
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
