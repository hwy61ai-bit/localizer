// Parse prompts for each document type.
// These return prompts that instruct Claude to extract structured fields from a document.

const JSON_INSTRUCTION = `\nRespond ONLY with valid JSON (no markdown, no code fences). Include a "confidence" object with 0.0-1.0 confidence for each extracted field.`;

export function buildDealMemoPrompt(text: string): string {
  return `Extract deal memo / offer information from this document. Extract these fields:

- date (ISO format YYYY-MM-DD)
- venue (venue name)
- city
- country
- capacity (number)
- offer_amount (number, the guarantee/fee)
- offer_currency (USD, EUR, GBP, etc.)
- backend (percentage or deal terms, e.g. "85/15 after expenses")
- doors (time)
- showtime (time)
- curfew (time)
- age_limit (e.g. "18+", "21+", "All Ages")
- billing (e.g. "Headliner", "Co-Headliner", "Support")
- ticket_price (e.g. "$25 ADV / $30 DOS")
- promoter (promoter name)
- promoter_contact (email or phone)
- merch (merch deal terms)
- hospitality_notes (rider/catering requirements mentioned)
- notes (any other important terms or special provisions)

DOCUMENT TEXT:
${text}
${JSON_INSTRUCTION}

Format: { "fields": { ... }, "confidence": { ... } }`;
}

export function buildSettlementPrompt(text: string): string {
  return `Extract settlement / accounting information from this document:

- date (ISO format YYYY-MM-DD)
- venue
- gross_revenue (total ticket revenue, number)
- net_revenue (after deductions, number)
- tickets_sold (number)
- ticket_price (price per ticket or tier breakdown)
- expenses_total (total venue expenses, number)
- expense_items (array of {name, amount})
- artist_guarantee (number)
- artist_percentage (e.g. "85%")
- artist_settlement (final amount owed to artist, number)
- merch_gross (total merch sales, number)
- merch_commission (venue merch cut, number)
- merch_net (artist merch net, number)
- currency (USD, EUR, etc.)
- notes (any discrepancies or special notes)

DOCUMENT TEXT:
${text}
${JSON_INSTRUCTION}

Format: { "fields": { ... }, "confidence": { ... } }`;
}

export function buildHotelConfirmationPrompt(text: string): string {
  return `Extract hotel booking confirmation details from this document:

- hotel_name
- hotel_address
- hotel_checkin (date or time)
- hotel_checkout (date or time)
- hotel_rooms (number of rooms)
- hotel_rate (nightly rate, number)
- hotel_currency
- hotel_confirmation (confirmation number)
- hotel_notes (special requests, amenities, parking info)
- hotel_block (true/false - is this a room block?)
- hotel_block_size (number of rooms in block)
- hotel_block_rate (group rate, number)
- hotel_cutoff_date (block cutoff date)
- hotel_attrition_pct (attrition percentage)

DOCUMENT TEXT:
${text}
${JSON_INSTRUCTION}

Format: { "fields": { ... }, "confidence": { ... } }`;
}

export function buildExpenseReceiptPrompt(text: string): string {
  return `Extract expense receipt information from this document:

- date (ISO format YYYY-MM-DD)
- category (one of: Transport, Fuel, Food, Lodging, Equipment, Parking, Tolls, Other)
- amount (number)
- currency (USD, EUR, etc.)
- vendor (store/business name)
- description (brief description of what was purchased. For fuel receipts, always format as: "X.X gallons unleaded" or "X.X gallons diesel" — gallons first, then fuel type, no other text)
- notes

DOCUMENT TEXT:
${text}
${JSON_INSTRUCTION}

Format: { "fields": { ... }, "confidence": { ... } }`;
}

export function buildAdvanceResponsePrompt(text: string): string {
  return `Extract venue advance response information from this document:

- load_in_time
- soundcheck_time
- load_in_location
- venue_wifi_name
- venue_wifi_password
- age_limit (e.g. "18+", "21+", "all ages")
- parking_notes (parking location, directions, reserved spots)
- venue_notes (green room, dressing room, merch table location — NOT parking)
- backline_notes (available backline equipment, stage specs, PA, monitors)
- hospitality_notes (catering, rider fulfillment, buyout amount)
- production_contact (name)
- production_contact_phone
- production_contact_email
- settlement_contact (name)
- settlement_contact_phone
- settlement_contact_email
- doors (confirmed door time)
- showtime (confirmed show time)
- curfew
- notes

DOCUMENT TEXT:
${text}
${JSON_INSTRUCTION}

Format: { "fields": { ... }, "confidence": { ... } }`;
}

export function buildContactListPrompt(text: string): string {
  return `Extract contacts from this document. Return an array of contacts:

Each contact should have:
- name
- role (e.g. "Promoter", "Agent", "Production Manager", "Venue Manager")
- email
- phone
- company
- city
- notes

DOCUMENT TEXT:
${text}
${JSON_INSTRUCTION}

Format: { "contacts": [ { ... } ], "confidence": { "overall": 0.0-1.0 } }`;
}

export function buildCoHeadlinerPrompt(text: string): string {
  return `Extract co-headliner or support act agreement details from this document:

- artist_name (the other artist)
- billing (e.g. "Co-Headliner", "Direct Support", "Opener")
- set_length (their set length)
- changeover_time
- ticket_split (how tickets/revenue are split)
- production_requirements (their stage/sound needs)
- merch_terms (their merch deal)
- guest_list_allocation (how many guests they get)
- notes

DOCUMENT TEXT:
${text}
${JSON_INSTRUCTION}

Format: { "fields": { ... }, "confidence": { ... } }`;
}

// Map document type to parse prompt builder
export const PARSE_PROMPTS: Record<string, (text: string) => string> = {
  deal_memo: buildDealMemoPrompt,
  settlement: buildSettlementPrompt,
  hotel_confirmation: buildHotelConfirmationPrompt,
  expense_receipt: buildExpenseReceiptPrompt,
  advance_response: buildAdvanceResponsePrompt,
  contact_list: buildContactListPrompt,
  co_headliner: buildCoHeadlinerPrompt,
};
