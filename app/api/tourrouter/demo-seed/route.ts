import { NextResponse } from "next/server";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);

  const orgId = result.orgId;

  // Service role client for bulk writes
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check if demo tour already exists for this org
  const { data: existingArtist } = await admin
    .from("artists")
    .select("id")
    .eq("org_id", orgId)
    .eq("name", "Beta Test Band")
    .maybeSingle();
  if (existingArtist) {
    const { data: existingTour } = await admin
      .from("tours_routing")
      .select("id")
      .eq("artist_id", existingArtist.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return NextResponse.json({
      success: true,
      artist_id: existingArtist.id,
      tour_id: existingTour?.id || null,
      shows_created: 0,
      already_existed: true,
    });
  }

  try {
    // Create artist
    const { data: artist, error: artistErr } = await admin
      .from("artists")
      .insert({ name: "Beta Test Band", org_id: orgId })
      .select()
      .single();
    if (artistErr) throw artistErr;

    // 4. Create tour
    const { data: tour, error: tourErr } = await admin
      .from("tours_routing")
      .insert({
        name: "Fall 2026 — North America + UK",
        artist_id: artist.id,
        org_id: orgId,
        vehicle_type: "Van",
        pax: 7,
        mpg: 14,
        fuel_price_usd: 3.45,
        flight_threshold_h: 6,
        blanket_show_label: "Per Diem",
        blanket_show_amount: 35,
        blanket_off_label: "Per Diem",
        blanket_off_amount: 25,
        currency_rates: { CAD: 0.74, GBP: 1.27, EUR: 1.09 },
      })
      .select()
      .single();
    if (tourErr) throw tourErr;

    // 5. Build all shows + off days
    // IMPORTANT: use the exact column names from the tour_shows table.
    // For deal info, use the deal jsonb column.
    // sort_order must be sequential.

    const shows = [
      // Show 1
      { sort_order: 1, date_iso: "2026-09-10", event: "Music Hall of Williamsburg", city: "Brooklyn, NY", country: "US", venue: "Music Hall of Williamsburg", capacity: 550, offer_amount: 4500, offer_currency: "USD", offer_display: "$4,500", status: "Settled", advance_status: "confirmed", deal: { dealType: "flat_guarantee", guarantee: 4500 } },
      // Show 2
      { sort_order: 2, date_iso: "2026-09-11", event: "Union Transfer", city: "Philadelphia, PA", country: "US", venue: "Union Transfer", capacity: 700, offer_amount: 5000, offer_currency: "USD", offer_display: "$5,000", status: "Settled", advance_status: "confirmed", deal: { dealType: "versus_gross", guarantee: 5000, split: 80, threshold: 8000 } },
      // Off day Sep 12
      { sort_order: 3, date_iso: "2026-09-12", event: "OFF", city: "Travel Day", country: "US", is_off: true },
      // Show 3
      { sort_order: 4, date_iso: "2026-09-13", event: "9:30 Club", city: "Washington, DC", country: "US", venue: "9:30 Club", capacity: 1200, offer_amount: 7500, offer_currency: "USD", offer_display: "$7,500", status: "Settled", advance_status: "confirmed", deal: { dealType: "versus_gross", guarantee: 7500, split: 85, threshold: 12000 } },
      // Show 4
      { sort_order: 5, date_iso: "2026-09-14", event: "The National", city: "Richmond, VA", country: "US", venue: "The National", capacity: 1500, offer_amount: 4000, offer_currency: "USD", offer_display: "$4,000", status: "Confirmed", advance_status: "confirmed", deal: { dealType: "flat_guarantee", guarantee: 4000 } },
      // Off day Sep 15
      { sort_order: 6, date_iso: "2026-09-15", event: "OFF", city: "Travel Day", country: "US", is_off: true },
      // Show 5
      { sort_order: 7, date_iso: "2026-09-16", event: "The Orange Peel", city: "Asheville, NC", country: "US", venue: "The Orange Peel", capacity: 1050, offer_amount: 3500, offer_currency: "USD", offer_display: "$3,500", status: "Confirmed", advance_status: "followup_1_sent", deal: { dealType: "flat_guarantee", guarantee: 3500 } },
      // Show 6
      { sort_order: 8, date_iso: "2026-09-17", event: "Terminal West", city: "Atlanta, GA", country: "US", venue: "Terminal West", capacity: 600, offer_amount: 3000, offer_currency: "USD", offer_display: "$3,000", status: "Confirmed", advance_status: "sent", deal: { dealType: "door_deal", guarantee: 3000, split: 70, expenseDeduction: true } },
      // Off day Sep 18
      { sort_order: 9, date_iso: "2026-09-18", event: "OFF", city: "Travel Day", country: "US", is_off: true },
      // Show 7
      { sort_order: 10, date_iso: "2026-09-19", event: "Mercy Lounge", city: "Nashville, TN", country: "US", venue: "Mercy Lounge", capacity: 500, offer_amount: 3000, offer_currency: "USD", offer_display: "$3,000", status: "Confirmed", advance_status: "not_started", deal: { dealType: "flat_guarantee", guarantee: 3000 } },
      // Show 8
      { sort_order: 11, date_iso: "2026-09-20", event: "Headliners Music Hall", city: "Louisville, KY", country: "US", venue: "Headliners Music Hall", capacity: 800, offer_amount: 2500, offer_currency: "USD", offer_display: "$2,500", status: "Confirmed", advance_status: "not_started", deal: { dealType: "flat_guarantee", guarantee: 2500 } },
      // Off day Sep 21
      { sort_order: 12, date_iso: "2026-09-21", event: "OFF", city: "Travel Day", country: "US", is_off: true },
      // Show 9
      { sort_order: 13, date_iso: "2026-09-22", event: "Thalia Hall", city: "Chicago, IL", country: "US", venue: "Thalia Hall", capacity: 800, offer_amount: 5500, offer_currency: "USD", offer_display: "$5,500", status: "Confirmed", advance_status: "escalated", deal: { dealType: "versus_gross", guarantee: 5500, split: 80, threshold: 10000 } },
      // Show 10
      { sort_order: 14, date_iso: "2026-09-23", event: "El Club", city: "Detroit, MI", country: "US", venue: "El Club", capacity: 350, offer_amount: 2000, offer_currency: "USD", offer_display: "$2,000", status: "Confirmed", advance_status: "final_nudge_sent", deal: { dealType: "flat_guarantee", guarantee: 2000 } },
      // Off day Sep 24
      { sort_order: 15, date_iso: "2026-09-24", event: "OFF", city: "Travel Day", country: "US", is_off: true },
      // Show 11
      { sort_order: 16, date_iso: "2026-09-25", event: "A&R Music Bar", city: "Columbus, OH", country: "US", venue: "A&R Music Bar", capacity: 400, offer_amount: 2000, offer_currency: "USD", offer_display: "$2,000", status: "Pending", advance_status: "not_started", deal: { dealType: "flat_guarantee", guarantee: 2000 } },
      // Show 12
      { sort_order: 17, date_iso: "2026-09-26", event: "Mr. Smalls Theatre", city: "Pittsburgh, PA", country: "US", venue: "Mr. Smalls Theatre", capacity: 600, offer_amount: 2500, offer_currency: "USD", offer_display: "$2,500", status: "Pending", advance_status: "not_started", deal: { dealType: "flat_guarantee", guarantee: 2500 } },
      // Off day Sep 27
      { sort_order: 18, date_iso: "2026-09-27", event: "OFF", city: "Travel Day", country: "US", is_off: true },
      // Show 13
      { sort_order: 19, date_iso: "2026-09-28", event: "The Danforth Music Hall", city: "Toronto, ON", country: "CA", venue: "The Danforth Music Hall", capacity: 1500, offer_amount: 9000, offer_currency: "CAD", offer_display: "CA$9,000", status: "Confirmed", advance_status: "confirmed", deal: { dealType: "versus_gross", guarantee: 9000, split: 80, threshold: 14000 } },
      // Show 14
      { sort_order: 20, date_iso: "2026-09-29", event: "La Tulipe", city: "Montreal, QC", country: "CA", venue: "La Tulipe", capacity: 450, offer_amount: 4500, offer_currency: "CAD", offer_display: "CA$4,500", status: "Confirmed", advance_status: "sent", deal: { dealType: "flat_guarantee", guarantee: 4500 } },
      // Off day Sep 30
      { sort_order: 21, date_iso: "2026-09-30", event: "OFF", city: "Fly Day", country: "CA", is_off: true },
      // Off day Oct 1
      { sort_order: 22, date_iso: "2026-10-01", event: "OFF", city: "Fly Day", country: "GB", is_off: true },
      // Show 15
      { sort_order: 23, date_iso: "2026-10-02", event: "Electric Brixton", city: "London, UK", country: "GB", venue: "Electric Brixton", capacity: 1500, offer_amount: 6000, offer_currency: "GBP", offer_display: "£6,000", status: "Confirmed", advance_status: "confirmed", deal: { dealType: "versus_gross", guarantee: 6000, split: 80, threshold: 10000 } },
      // Show 16
      { sort_order: 24, date_iso: "2026-10-03", event: "Gorilla", city: "Manchester, UK", country: "GB", venue: "Gorilla", capacity: 600, offer_amount: 3500, offer_currency: "GBP", offer_display: "£3,500", status: "Confirmed", advance_status: "followup_2_sent", deal: { dealType: "flat_guarantee", guarantee: 3500 } },
      // Off day Oct 4
      { sort_order: 25, date_iso: "2026-10-04", event: "OFF", city: "Fly Day", country: "NL", is_off: true },
      // Show 17
      { sort_order: 26, date_iso: "2026-10-05", event: "Paradiso (Small Hall)", city: "Amsterdam, NL", country: "NL", venue: "Paradiso (Small Hall)", capacity: 450, offer_amount: 4000, offer_currency: "EUR", offer_display: "€4,000", status: "Pending", advance_status: "not_started", deal: { dealType: "flat_guarantee", guarantee: 4000 } },
      // Show 18
      { sort_order: 27, date_iso: "2026-10-06", event: "Ancienne Belgique (Club)", city: "Brussels, BE", country: "BE", venue: "Ancienne Belgique (Club)", capacity: 400, offer_amount: 3000, offer_currency: "EUR", offer_display: "€3,000", status: "Pending", advance_status: "not_started", deal: { dealType: "flat_guarantee", guarantee: 3000 } },
    ];

    // Add tour_id and org_id to each show
    const showRows = shows.map(s => ({ ...s, tour_id: tour.id, org_id: orgId }));

    const { data: insertedShows, error: showsErr } = await admin
      .from("tour_shows")
      .insert(showRows)
      .select("id, sort_order, date_iso");
    if (showsErr) throw showsErr;

    // Helper to find show ID by sort_order
    const showByOrder = (order: number) => insertedShows?.find(s => s.sort_order === order);

    // 6. Update hotel data on specific shows
    const hotelUpdates = [
      { sort_order: 1, hotel_name: "The Hoxton, Williamsburg", hotel_address: "97 Wythe Ave, Brooklyn, NY", hotel_checkin: "Sep 10", hotel_checkout: "Sep 11", hotel_rooms: 4, hotel_rate: 189, hotel_currency: "USD", hotel_confirmation: "HXT-449281" },
      { sort_order: 2, hotel_name: "Lokal Hotel", hotel_address: "139 N 2nd St, Philadelphia, PA", hotel_checkin: "Sep 11", hotel_checkout: "Sep 12", hotel_rooms: 4, hotel_rate: 169, hotel_currency: "USD", hotel_confirmation: "LOK-882103" },
      { sort_order: 4, hotel_name: "The Line DC", hotel_address: "1770 Euclid St NW, Washington, DC", hotel_checkin: "Sep 13", hotel_checkout: "Sep 14", hotel_rooms: 4, hotel_rate: 205, hotel_currency: "USD", hotel_confirmation: "LDC-337820" },
      { sort_order: 7, hotel_name: "Aloft Asheville", hotel_address: "51 Biltmore Ave, Asheville, NC", hotel_checkin: "Sep 16", hotel_checkout: "Sep 17", hotel_rooms: 4, hotel_rate: 149, hotel_currency: "USD", hotel_confirmation: "ALF-209384" },
      { sort_order: 8, hotel_name: "Home2 Suites Atlanta", hotel_address: "375 Northside Dr, Atlanta, GA", hotel_checkin: "Sep 17", hotel_checkout: "Sep 18", hotel_rooms: 4, hotel_rate: 139, hotel_currency: "USD", hotel_confirmation: "H2S-559102" },
      { sort_order: 13, hotel_name: "The Robey", hotel_address: "2018 W North Ave, Chicago, IL", hotel_checkin: "Sep 22", hotel_checkout: "Sep 23", hotel_rooms: 4, hotel_rate: 179, hotel_currency: "USD", hotel_confirmation: "ROB-104488" },
      { sort_order: 19, hotel_name: "The Drake Hotel", hotel_address: "1150 Queen St W, Toronto, ON", hotel_checkin: "Sep 28", hotel_checkout: "Sep 29", hotel_rooms: 4, hotel_rate: 210, hotel_currency: "CAD", hotel_confirmation: "DRK-773291" },
      { sort_order: 20, hotel_name: "Hotel 10", hotel_address: "10 Rue Sherbrooke O, Montreal, QC", hotel_checkin: "Sep 29", hotel_checkout: "Sep 30", hotel_rooms: 4, hotel_rate: 185, hotel_currency: "CAD", hotel_confirmation: "H10-498201" },
      { sort_order: 23, hotel_name: "The Hoxton, Southwark", hotel_address: "32 Blackfriars Rd, London, UK", hotel_checkin: "Oct 2", hotel_checkout: "Oct 3", hotel_rooms: 4, hotel_rate: 179, hotel_currency: "GBP", hotel_confirmation: "HXT-UK-881204" },
      { sort_order: 24, hotel_name: "The Cow Hollow Hotel", hotel_address: "57 Newton St, Manchester, UK", hotel_checkin: "Oct 3", hotel_checkout: "Oct 4", hotel_rooms: 4, hotel_rate: 129, hotel_currency: "GBP", hotel_confirmation: "CHH-330122" },
    ];

    for (const h of hotelUpdates) {
      const show = showByOrder(h.sort_order);
      if (show) {
        const { sort_order, ...hotelData } = h;
        await admin.from("tour_shows").update(hotelData).eq("id", show.id);
      }
    }

    // 7. Update settlement data on shows 1-3
    const settlementUpdates = [
      {
        sort_order: 1,
        settlement: {
          settled: true,
          actualGrossTickets: 5180,
          ticketsSold: 490,
          ticketTiers: [
            { name: "GA Advance", price: 22, sold: 380 },
            { name: "GA Door", price: 28, sold: 110 },
          ],
          actualExpenses: 850,
          expenseBreakdown: [
            { item: "Sound", amount: 400 },
            { item: "Lights", amount: 250 },
            { item: "Staff", amount: 200 },
          ],
          actualArtistPayment: 4500,
          settlementNotes: "Flat deal. Clean settlement.",
        },
      },
      {
        sort_order: 2,
        settlement: {
          settled: true,
          actualGrossTickets: 11200,
          ticketsSold: 640,
          ticketTiers: [
            { name: "GA Advance", price: 20, sold: 510 },
            { name: "GA Door", price: 25, sold: 130 },
          ],
          actualExpenses: 1200,
          expenseBreakdown: [
            { item: "Sound", amount: 500 },
            { item: "Lights", amount: 350 },
            { item: "Stagehands", amount: 200 },
            { item: "Security", amount: 150 },
          ],
          actualArtistPayment: 5640,
          settlementNotes: "Versus deal kicked in. Overage of $640 above guarantee.",
        },
      },
      {
        sort_order: 4,
        settlement: {
          settled: true,
          actualGrossTickets: 18400,
          ticketsSold: 1100,
          ticketTiers: [
            { name: "GA Advance", price: 18, sold: 870 },
            { name: "GA Door", price: 22, sold: 230 },
          ],
          actualExpenses: 1800,
          expenseBreakdown: [
            { item: "Sound", amount: 600 },
            { item: "Lights", amount: 500 },
            { item: "Stagehands", amount: 300 },
            { item: "Security", amount: 250 },
            { item: "Runner", amount: 150 },
          ],
          actualArtistPayment: 8810,
          settlementNotes: "Big night. Versus deal overage. Final payout $8,810 per promoter settlement.",
        },
      },
    ];

    for (const s of settlementUpdates) {
      const show = showByOrder(s.sort_order);
      if (show) {
        await admin.from("tour_shows").update({ settlement: s.settlement }).eq("id", show.id);
      }
    }

    // 8. Update advance detail fields on confirmed shows
    const advanceUpdates = [
      {
        sort_order: 1,
        load_in_time: "3:00 PM",
        doors: "7:00 PM",
        showtime: "9:15 PM",
        venue_wifi_name: "MHOW-Guest",
        venue_wifi_password: "music2026",
        settlement_contact: "Danny Oliveira",
        settlement_contact_email: "danny@mhow.com",
        production_contact: "Ava Simmons",
        venue_notes: "Green room upstairs. No smoking anywhere in venue. Merch split: 80/20 soft, 85/15 hard. Load via rear entrance, N 6th St. Street parking only, load zone 30 min.",
      },
      {
        sort_order: 4,
        load_in_time: "2:00 PM",
        doors: "7:00 PM",
        showtime: "9:30 PM",
        venue_wifi_name: "930Club-Backstage",
        venue_wifi_password: "livemusic930",
        settlement_contact: "Marcus Webb",
        settlement_contact_email: "marcus@930.com",
        production_contact: "Tina Rhodes",
        venue_notes: "Legendary room. Backline available — Ampeg SVT + Marshall JCM800. Green room basement level. Buyout $15/person for dinner. V St loading dock. 2 parking spots reserved.",
      },
      {
        sort_order: 19,
        load_in_time: "1:00 PM",
        doors: "7:00 PM",
        showtime: "9:15 PM",
        venue_wifi_name: "DMH-Artist",
        venue_wifi_password: "danforth2026",
        settlement_contact: "Ben Takahashi",
        settlement_contact_email: "ben@danforthmusichall.com",
        production_contact: "Sam Okafor",
        venue_notes: "Beautiful old theater. Balcony seats 400. All ages. Merch: venue takes 10% flat. No venue lot — street parking on Danforth.",
      },
      {
        sort_order: 23,
        load_in_time: "12:00 PM",
        doors: "7:00 PM",
        showtime: "9:30 PM",
        venue_wifi_name: "EB-Artist",
        venue_wifi_password: "brixton2026",
        settlement_contact: "Gemma Walsh",
        settlement_contact_email: "gemma@electricbrixton.uk",
        production_contact: "Owen Hughes",
        venue_notes: "Stunning venue — old cinema. Stage right power supply is dodgy, bring DIs. Curfew is HARD — council will fine the venue. Merch: 20% venue cut, cash settlement night-of. No venue parking.",
      },
    ];

    for (const a of advanceUpdates) {
      const show = showByOrder(a.sort_order);
      if (show) {
        const { sort_order, ...advData } = a;
        await admin.from("tour_shows").update(advData).eq("id", show.id);
      }
    }

    // 9. Insert guest list entries
    const guestListEntries = [
      // Show 1
      { show_id_order: 1, guest_name: "Sarah Kwan", plus_ones: 1, pass_type: "Guest" },
      { show_id_order: 1, guest_name: "Dev Okonkwo", plus_ones: 0, pass_type: "Guest" },
      { show_id_order: 1, guest_name: "Mike Tierney", plus_ones: 1, pass_type: "Photo" },
      { show_id_order: 1, guest_name: "Lisa Chen", plus_ones: 0, pass_type: "Industry" },
      // Show 3 (sort_order 4)
      { show_id_order: 4, guest_name: "Amara Osei", plus_ones: 1, pass_type: "Guest" },
      { show_id_order: 4, guest_name: "Tom Whitfield", plus_ones: 1, pass_type: "Industry" },
      { show_id_order: 4, guest_name: "Priya Nair", plus_ones: 0, pass_type: "Guest" },
      { show_id_order: 4, guest_name: "Jake Morrison", plus_ones: 1, pass_type: "Guest" },
      { show_id_order: 4, guest_name: "Rebecca Tran", plus_ones: 0, pass_type: "Press" },
      { show_id_order: 4, guest_name: "Chloe Watts", plus_ones: 1, pass_type: "Industry" },
      // Show 9 (sort_order 13)
      { show_id_order: 13, guest_name: "Noah Kim", plus_ones: 1, pass_type: "Guest" },
      { show_id_order: 13, guest_name: "Emily Vance", plus_ones: 0, pass_type: "Industry" },
    ];

    const guestRows = guestListEntries.map(g => {
      const show = showByOrder(g.show_id_order);
      return {
        show_id: show?.id,
        guest_name: g.guest_name,
        plus_ones: g.plus_ones,
        pass_type: g.pass_type,
        status: "confirmed",
      };
    }).filter(g => g.show_id);

    if (guestRows.length > 0) {
      await admin.from("guest_list").insert(guestRows);
    }

    // 10. Insert expense records
    const expenses = [
      { date_iso: "2026-09-10", category: "Fuel", vendor: "BP Station, NJ Turnpike", amount: 62.40, currency: "USD", notes: "Van fill-up" },
      { date_iso: "2026-09-10", category: "Parking", vendor: "Icon Parking, Williamsburg", amount: 45.00, currency: "USD", notes: "Overnight" },
      { date_iso: "2026-09-11", category: "Fuel", vendor: "Wawa, I-95", amount: 58.20, currency: "USD" },
      { date_iso: "2026-09-11", category: "Tolls", vendor: "NJ Turnpike", amount: 14.50, currency: "USD" },
      { date_iso: "2026-09-13", category: "Fuel", vendor: "Shell, I-95", amount: 71.30, currency: "USD" },
      { date_iso: "2026-09-14", category: "Vehicle", vendor: "Jiffy Lube, Richmond", amount: 89.00, currency: "USD", notes: "Oil change" },
      { date_iso: "2026-09-16", category: "Fuel", vendor: "BP, I-40", amount: 67.80, currency: "USD", notes: "Long drive day" },
      { date_iso: "2026-09-17", category: "Fuel", vendor: "QT, I-85", amount: 55.10, currency: "USD" },
      { date_iso: "2026-09-22", category: "Fuel", vendor: "Shell, I-65", amount: 72.40, currency: "USD" },
      { date_iso: "2026-09-22", category: "Gear", vendor: "Guitar Center, Chicago", amount: 34.99, currency: "USD", notes: "Replacement strings + picks" },
      { date_iso: "2026-09-28", category: "Fuel", vendor: "Petro-Canada, QEW", amount: 81.20, currency: "CAD" },
      { date_iso: "2026-10-02", category: "Transport", vendor: "Heathrow Express", amount: 75.00, currency: "GBP", notes: "4 tickets, airport to city" },
    ];

    const expenseRows = expenses.map(e => ({
      tour_id: tour.id,
      org_id: orgId,
      date_iso: e.date_iso,
      category: e.category,
      vendor: e.vendor,
      amount: e.amount,
      currency: e.currency,
      notes: e.notes || null,
    }));

    await admin.from("tour_expenses").insert(expenseRows);

    // 11. Store roster on the tour
    const roster = [
      { name: "Casey Muller", role: "Tour Manager", day_rate: 350, off_day_rate: 200 },
      { name: "Raj Patel", role: "FOH Engineer", day_rate: 300, off_day_rate: 150 },
      { name: "Shea Donovan", role: "Monitor Engineer", day_rate: 275, off_day_rate: 150 },
      { name: "Marco Ruiz", role: "Guitar Tech", day_rate: 225, off_day_rate: 125 },
      { name: "Dani Cho", role: "Merch", day_rate: 150, off_day_rate: 100 },
      { name: "Alex Brewer", role: "Band Member", day_rate: 0, off_day_rate: 0, pay_type: "pct_net" },
      { name: "Jordan Cross", role: "Band Member", day_rate: 0, off_day_rate: 0, pay_type: "pct_net" },
    ];

    await admin
      .from("tours_routing")
      .update({ tour_roster: roster })
      .eq("id", tour.id);

    // 12. Store commission structure on the artist
    const commissions = [
      { payee: "Northside Management", type: "pct_gross", rate: 15, applies_to: "All income" },
      { payee: "Raven Agency", type: "pct_gross", rate: 10, applies_to: "Guarantees only" },
    ];

    await admin
      .from("artists")
      .update({ default_commissions: commissions })
      .eq("id", artist.id);

    return NextResponse.json({
      success: true,
      artist_id: artist.id,
      tour_id: tour.id,
      shows_created: insertedShows?.length || 0,
    });

  } catch (err: any) {
    console.error("Demo seed error:", err);
    return NextResponse.json({ error: err.message || "Seed failed" }, { status: 500 });
  }
}
