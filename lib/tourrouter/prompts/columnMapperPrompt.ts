/**
 * Column Mapper Prompt — COLUMN_MAPPER_PROMPT
 *
 * Maps unknown spreadsheet/document headers to TourRouter database fields.
 * Used by the Alias Library system for batch header resolution.
 * Sends ALL unknown headers in ONE API call — never loops per header.
 *
 * Usage:
 *   import { buildColumnMapperPrompt } from '@/lib/tourrouter/prompts/columnMapperPrompt';
 *   const prompt = buildColumnMapperPrompt({ unknownHeaders, sampleRows, documentType });
 */

interface ColumnMapperPromptContext {
  unknownHeaders: string[];
  sampleRows?: Record<string, string>[];
  documentType?: string;
  knownAliases?: Record<string, string>;
}

export function buildColumnMapperPrompt(context: ColumnMapperPromptContext): string {
  const headerList = context.unknownHeaders
    .map((h, i) => `  ${i + 1}. "${h}"`)
    .join('\n');

  const sampleData = context.sampleRows?.length
    ? `\n\nSAMPLE DATA ROWS (first 3 rows for context):\n${JSON.stringify(context.sampleRows.slice(0, 3), null, 2)}`
    : '';

  const docType = context.documentType
    ? `\n\nDOCUMENT TYPE: ${context.documentType}`
    : '';

  const knownList = context.knownAliases
    ? `\n\nALREADY MAPPED HEADERS (do not re-map these):\n${Object.entries(context.knownAliases)
        .map(([raw, field]) => `  "${raw}" -> ${field}`)
        .join('\n')}`
    : '';

  return `You are mapping unknown document headers (column names, field labels) from a music industry document to TourRouter database fields.

Given a list of unknown headers and optional sample data rows, determine the best TourRouter field match for each header.

IMPORTANT RULES:
1. Return ONLY valid JSON. No markdown fences, no preamble, no explanation.
2. Map EVERY header in the list. If no match exists, set field to null.
3. Provide a confidence score (0.0 to 1.0) for each mapping.
4. Include brief reasoning for each mapping.
${docType}

UNKNOWN HEADERS TO MAP:
${headerList}
${sampleData}
${knownList}

TOURROUTER DATABASE FIELDS:
These are the valid target fields. Map each unknown header to the closest match:

SHOW FIELDS:
  show_date, show_day_of_week, venue_name, venue_city, venue_state, venue_country,
  venue_address, venue_capacity, venue_phone, venue_website,
  promoter_name, promoter_company, promoter_phone, promoter_email,
  doors_time, showtime, curfew, load_in_time, soundcheck_time, set_length_minutes,
  age_restriction, hold_position

DEAL FIELDS:
  deal_type, guarantee, guarantee_currency, versus_percentage, versus_base,
  expense_cap, promoter_profit, walkout_potential, deposit_amount, deposit_due_date,
  deal_status, offer_amount

TICKET FIELDS:
  ticket_tier_name, ticket_price, ticket_quantity, ticket_facility_fee,
  ticket_service_charge, tickets_sold, tickets_comped, tickets_killed,
  gross_ticket_revenue, net_ticket_revenue

SETTLEMENT FIELDS:
  gross_revenue, adjusted_gross, taxes, net_gross, total_expenses,
  net_revenue, artist_payment, artist_percentage, overage,
  settlement_contact, settlement_contact_phone, settlement_contact_email

EXPENSE FIELDS:
  expense_category, expense_amount, expense_budgeted, expense_actual, expense_notes

HOTEL FIELDS:
  hotel_name, hotel_address, hotel_checkin, hotel_checkout, hotel_rooms,
  hotel_rate, hotel_currency, hotel_confirmation, hotel_notes,
  hotel_block, hotel_block_size, hotel_block_rate, hotel_cutoff_date

ADVANCE FIELDS:
  advance_status, advance_notes, load_in_location,
  venue_wifi_name, venue_wifi_password, venue_notes

PERSONNEL FIELDS:
  person_name, person_role, person_email, person_phone,
  person_nationality, person_passport, person_dob

MERCH FIELDS:
  merch_rate, merch_sell_type, merch_gross, merch_net, merch_notes

TRANSPORT FIELDS:
  drive_distance, drive_hours, fuel_cost, flight_cost, vehicle_type

FINANCE FIELDS:
  commission_type, commission_percentage, commission_amount,
  per_diem_rate, per_diem_total

META FIELDS:
  artist_name, tour_name, booking_agent, responsible_agent,
  event_id, memo_number, document_date

COMMON MUSIC INDUSTRY ALIASES:
  "Guarantee" / "Artist Fee" / "Flat" / "AF" -> guarantee
  "Door" / "Doors" / "Door Time" -> doors_time
  "Show" / "Set Time" / "Stage Time" -> showtime
  "Cap" / "Capacity" / "Room Cap" -> venue_capacity
  "GA" / "General Admission" -> ticket_tier_name
  "FF" / "Fac Fee" / "Facility" -> ticket_facility_fee
  "SC" / "Svc Chg" / "Service" -> ticket_service_charge
  "Sold" / "Tix Sold" / "Tickets" -> tickets_sold
  "Comps" / "Comp" / "Complimentary" -> tickets_comped
  "Kills" / "Dead" / "Killed" -> tickets_killed
  "Gross" / "Gross Rev" / "GBO" / "GBOR" -> gross_ticket_revenue
  "Net" / "Net Rev" / "NBO" / "NBOR" -> net_ticket_revenue
  "Dep" / "Deposit" -> deposit_amount
  "Status" / "Hold" -> hold_position
  "RA" / "Resp Agent" -> responsible_agent
  "BM" -> person_role (business manager)
  "TM" -> person_role (tour manager)
  "PM" -> person_role (production manager)
  "FOH" -> person_role (front of house)
  "MON" -> person_role (monitor engineer)
  "LD" -> person_role (lighting director)

RETURN THIS EXACT JSON STRUCTURE:
{
  "mappings": {
    "original_header_text": {
      "field": "tourrouter_field_name or null",
      "confidence": 0.0,
      "reasoning": "brief explanation"
    }
  },
  "unmapped_count": 0,
  "warnings": []
}

CRITICAL REMINDERS:
- USE SAMPLE DATA to disambiguate. If the header is "Date" and the sample data shows "06/07/2024", that is show_date. If it shows "04/19/2024" and is labeled "On Sale", that is a different field.
- AGENCY-SPECIFIC HEADERS: WME, Wasserman, MUSIC TEAM, and High Road all use different column names for the same data. Use context clues from the document type and sample data.
- If a header is clearly not music-industry-related (e.g. "Priceline trip #"), set field to null with reasoning.
- NEVER FORCE A MATCH. If you are below 0.5 confidence, set field to null and explain in reasoning.
- Return ONLY the JSON object.`;
}
