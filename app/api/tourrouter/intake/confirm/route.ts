import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";
import { formatOfferDisplay } from "@/lib/tourrouter/currency";

export async function POST(req: NextRequest) {
  const access = await requireTourRouterAccess();
  if (!access.ok) return tourRouterAccessErrorResponse(access);
  const supabase = await supabaseServer();

  const body = await req.json();
  const { documentType, showId, tourId, fields, storageUrl } = body;

  if (!documentType || !tourId) {
    return NextResponse.json({ error: "documentType and tourId required" }, { status: 400 });
  }

  const saved: string[] = [];

  try {
    switch (documentType) {
      case "deal_memo": {
        if (!showId && fields.date) {
          // Create new show from deal memo
          const { data: newShow, error } = await supabase
            .from("tour_shows")
            .insert({
              tour_id: tourId,
              org_id: access.orgId,
              date_iso: fields.date || null,
              event: fields.event || null,
              venue: fields.venue || null,
              city: fields.city || null,
              country: fields.country || null,
              capacity: fields.capacity || null,
              offer_amount: fields.offer_amount || 0,
              offer_currency: fields.offer_currency || "USD",
              offer_display: formatOfferDisplay(fields.offer_amount, fields.offer_currency),
              backend: fields.backend || null,
              doors: fields.doors || null,
              showtime: fields.showtime || null,
              curfew: fields.curfew || null,
              age_limit: fields.age_limit || null,
              billing: fields.billing || null,
              ticket_price: fields.ticket_price || null,
              promoter: fields.promoter || null,
              promoter_contact: fields.promoter_contact || null,
              merch: fields.merch || null,
              hospitality_notes: fields.hospitality_notes || null,
              notes: fields.notes || null,
              sort_order: 999,
              is_off: false,
            })
            .select("id")
            .single();
          if (error) throw error;
          saved.push(`Created show ${newShow?.id}`);
        } else if (showId) {
          // Update existing show
          const update: Record<string, unknown> = {};
          const allowedFields = [
            "venue", "city", "country", "capacity", "offer_amount", "offer_currency",
            "backend", "doors", "showtime", "curfew", "age_limit", "billing",
            "ticket_price", "promoter", "promoter_contact", "merch", "hospitality_notes", "notes",
          ];
          for (const key of allowedFields) {
            if (fields[key] !== undefined && fields[key] !== null && fields[key] !== "") {
              update[key] = fields[key];
            }
          }
          if (fields.offer_amount) {
            update.offer_display = formatOfferDisplay(fields.offer_amount, fields.offer_currency);
          }
          if (Object.keys(update).length > 0) {
            const { error } = await supabase.from("tour_shows").update(update).eq("id", showId).eq("org_id", access.orgId);
            if (error) throw error;
            saved.push(`Updated show ${showId}`);
          }
        }
        break;
      }

      case "settlement": {
        if (showId) {
          const { error } = await supabase
            .from("tour_shows")
            .update({ settlement: fields })
            .eq("id", showId)
            .eq("org_id", access.orgId);
          if (error) throw error;
          saved.push(`Saved settlement to show ${showId}`);
        }
        break;
      }

      case "box_office": {
        if (showId) {
          const { error } = await supabase
            .from("tour_shows")
            .update({ settlement: fields })
            .eq("id", showId)
            .eq("org_id", access.orgId);
          if (error) throw error;
          saved.push(`Saved box office data to show ${showId}`);
        }
        break;
      }

      case "hotel_confirmation": {
        if (showId) {
          const update: Record<string, unknown> = {};
          const hotelFields = [
            "hotel_name", "hotel_address", "hotel_checkin", "hotel_checkout",
            "hotel_rooms", "hotel_rate", "hotel_currency", "hotel_confirmation",
            "hotel_notes", "hotel_block", "hotel_block_size", "hotel_block_rate",
            "hotel_cutoff_date", "hotel_attrition_pct",
          ];
          for (const key of hotelFields) {
            if (fields[key] !== undefined && fields[key] !== null) {
              update[key] = fields[key];
            }
          }
          if (Object.keys(update).length > 0) {
            const { error } = await supabase.from("tour_shows").update(update).eq("id", showId).eq("org_id", access.orgId);
            if (error) throw error;
            saved.push(`Updated hotel info on show ${showId}`);
          }
        }
        break;
      }

      case "expense_receipt": {
        const { error } = await supabase
          .from("tour_expenses")
          .insert({
            tour_id: tourId,
            org_id: access.orgId,
            date: fields.date || new Date().toISOString().split("T")[0],
            category: fields.category || "Other",
            amount: fields.amount || 0,
            currency: fields.currency || "USD",
            vendor: fields.vendor || null,
            description: fields.description || null,
            notes: fields.notes || null,
          });
        if (error) throw error;
        // If this is a hotel/lodging receipt and we have a matched show, write to hotel_cost_actual
        // Multiple receipts stack additively per Tim's spec
        const isHotelReceipt = ["Lodging", "Accommodation", "Hotel"].includes(fields.category as string);
        if (isHotelReceipt && showId && fields.amount) {
          // Fetch current hotel_cost_actual to stack additively
          const { data: currentShow } = await supabase
            .from("tour_shows")
            .select("hotel_cost_actual")
            .eq("id", showId)
            .eq("org_id", access.orgId)
            .maybeSingle();
          const existing = (currentShow?.hotel_cost_actual as number) || 0;
          const newTotal = existing + (fields.amount as number);
          const { error: hotelErr } = await supabase
            .from("tour_shows")
            .update({ hotel_cost_actual: newTotal })
            .eq("id", showId)
            .eq("org_id", access.orgId);
          if (hotelErr) console.error("[Intake confirm] hotel_cost_actual update failed:", hotelErr.message);
          else saved.push(`Updated hotel_cost_actual to ${newTotal} on show ${showId}`);
        }
        saved.push("Created expense");
        break;
      }

      case "advance_response": {
        if (showId) {
          const update: Record<string, unknown> = {};

          // Schedule fields
          const schedule = fields.schedule as Record<string, unknown> | undefined;
          if (schedule) {
            if (schedule.load_in_time) update.load_in_time = schedule.load_in_time;
            if (schedule.soundcheck_time) update.soundcheck_time = schedule.soundcheck_time;
            if (schedule.doors_time) update.doors = schedule.doors_time;
            if (schedule.headliner_set_time) update.showtime = schedule.headliner_set_time;
            if (schedule.curfew) update.curfew = schedule.curfew;
          }

          // Venue fields
          const venue = fields.venue as Record<string, unknown> | undefined;
          if (venue) {
            if (venue.age_restriction) update.age_limit = venue.age_restriction;
            if (venue.capacity) update.capacity = venue.capacity;
          }

          // Backstage fields
          const backstage = fields.backstage as Record<string, unknown> | undefined;
          if (backstage) {
            if (backstage.wifi_network) update.venue_wifi_name = backstage.wifi_network;
            if (backstage.wifi_password) update.venue_wifi_password = backstage.wifi_password;
            if (backstage.catering) update.hospitality_notes = backstage.catering;
          }

          // Parking notes
          const parking = fields.parking as Record<string, unknown> | undefined;
          if (parking?.notes) update.parking_notes = String(parking.notes);

          // Load in directions as part of venue notes
          const loadIn = fields.load_in as Record<string, unknown> | undefined;
          if (loadIn?.directions) update.venue_notes = String(loadIn.directions);

          // Production — backline notes
          const production = fields.production as Record<string, unknown> | undefined;
          if (production) {
            const prodParts: string[] = [];
            if (production.pa_system) prodParts.push(`PA: ${production.pa_system}`);
            if (production.monitor_wedges) prodParts.push(`Monitors: ${production.monitor_wedges}`);
            if (production.foh_console) prodParts.push(`FOH: ${production.foh_console}`);
            if (production.monitor_console) prodParts.push(`MON: ${production.monitor_console}`);
            if (production.backline_available) prodParts.push(`Backline: ${production.backline_available}`);
            if (prodParts.length > 0) update.backline_notes = prodParts.join(". ");
          }

          // Contacts — map production and settlement contacts
          const contacts = fields.contacts as Array<Record<string, unknown>> | undefined;
          if (Array.isArray(contacts)) {
            const prodContact = contacts.find((c) =>
              typeof c.role === "string" && c.role.toLowerCase().includes("production")
            );
            if (prodContact) {
              if (prodContact.name) update.production_contact = prodContact.name;
              if (prodContact.phone) update.production_contact_phone = prodContact.phone;
              if (prodContact.email) update.production_contact_email = prodContact.email;
            }
            const settlementContact = contacts.find((c) =>
              typeof c.role === "string" && c.role.toLowerCase().includes("settlement")
            );
            if (settlementContact) {
              if (settlementContact.name) update.settlement_contact = settlementContact.name;
              if (settlementContact.phone) update.settlement_contact_phone = settlementContact.phone;
              if (settlementContact.email) update.settlement_contact_email = settlementContact.email;
            }
          }

          // Settlement info fallback
          const settlementInfo = fields.settlement_info as Record<string, unknown> | undefined;
          if (settlementInfo?.settlement_contact && !update.settlement_contact) {
            update.settlement_contact = settlementInfo.settlement_contact;
          }

          // Notes — combine house_rules and special_notes
          const noteParts: string[] = [];
          if (fields.house_rules) noteParts.push(String(fields.house_rules));
          if (fields.special_notes) noteParts.push(String(fields.special_notes));
          if (noteParts.length > 0) update.notes = noteParts.join("\n\n");

          // Merch
          const merch = fields.merch as Record<string, unknown> | undefined;
          if (merch?.notes) update.merch = String(merch.notes);

          // Flat field fallback for backwards compatibility
          const flatFields = [
            "load_in_time", "soundcheck_time", "venue_wifi_name", "venue_wifi_password",
            "venue_notes", "backline_notes", "hospitality_notes", "parking_notes",
            "production_contact", "production_contact_phone", "production_contact_email",
            "settlement_contact", "settlement_contact_phone", "settlement_contact_email",
            "doors", "showtime", "curfew", "age_limit",
          ];
          for (const key of flatFields) {
            if (fields[key] !== undefined && fields[key] !== null && fields[key] !== "" && !update[key]) {
              update[key] = fields[key];
            }
          }

          if (Object.keys(update).length > 0) {
            const { error } = await supabase.from("tour_shows").update(update).eq("id", showId).eq("org_id", access.orgId);
            if (error) throw error;
            saved.push(`Updated advance info on show ${showId}`);
          }
        }
        break;
      }

      case "co_headliner": {
        if (showId) {
          const { error } = await supabase
            .from("tour_shows")
            .update({ co_headliner: fields })
            .eq("id", showId)
            .eq("org_id", access.orgId);
          if (error) throw error;
          saved.push(`Saved co-headliner data to show ${showId}`);
        }
        break;
      }

      default:
        return NextResponse.json({ error: `Unsupported document type: ${documentType}` }, { status: 400 });
    }

    // Log the intake record (if table exists, silently skip if not)
    try {
      await supabase.from("intake_documents").insert({
        org_id: access.orgId,
        tour_id: tourId,
        show_id: showId || null,
        document_type: documentType,
        file_name: body.fileName || null,
        storage_url: storageUrl || null,
        fields_saved: fields,
        processed_by: access.userEmail,
      });
    } catch { /* intake_documents table may not exist yet */ }

    return NextResponse.json({ ok: true, saved });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Save failed";
    console.error("[Intake Confirm] Error:", message, e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
