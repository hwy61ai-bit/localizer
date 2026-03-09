import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: Request) {
  try {
    const { tourId, events } = await request.json();

    if (!tourId || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    const { data: tour, error: tourErr } = await supabase
      .from("tours")
      .select("id, org_id")
      .eq("id", tourId)
      .single();

    if (tourErr || !tour) {
      return NextResponse.json({ error: "Tour not found." }, { status: 404 });
    }

    const rows = events.map((e: {
      date_iso: string | null;
      day: string | null;
      venue_name: string | null;
      city: string | null;
      state: string | null;
      promoter_email: string | null;
      manager_email: string | null;
    }, i: number) => ({
      org_id: tour.org_id,
      tour_id: tourId,
      source: "ai_import",
      event_index: i,
      date_iso: e.date_iso,
      day: e.day,
      city: e.city ?? "",
      state: e.state,
      venue: e.venue_name ?? "",
      event_date: e.date_iso,
      venue_name: e.venue_name,
      venue_city: e.city,
      venue_state: e.state,
      promoter_email: e.promoter_email,
      manager_email: e.manager_email,
    }));

    const { error: insertErr } = await supabase.from("events").insert(rows);

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ saved: rows.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
