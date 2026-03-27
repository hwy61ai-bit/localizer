/**
 * Hotel Confirm Prompt — HOTEL_CONFIRM_PROMPT
 *
 * Parses hotel booking confirmations, receipts, and venue hotel recommendation sheets.
 * Known formats: Priceline, Booking.com, Hotels.com, direct hotel confirmations, venue recommendation PDFs.
 *
 * Usage:
 *   import { buildHotelConfirmPrompt } from '@/lib/tourrouter/prompts/hotelConfirmPrompt';
 *   const prompt = buildHotelConfirmPrompt({ tourId, existingShows });
 */

interface HotelConfirmPromptContext {
  tourId: string;
  existingShows?: Array<{
    id: string;
    date: string;
    venue: string;
    city: string;
    state: string;
  }>;
}

export function buildHotelConfirmPrompt(context: HotelConfirmPromptContext): string {
  const showList = context.existingShows?.length
    ? `\n\nEXISTING SHOWS IN THIS TOUR (match hotel dates to show dates):\n${context.existingShows
        .map((s) => `- ${s.date} | ${s.venue} | ${s.city}, ${s.state} | id: ${s.id}`)
        .join('\n')}`
    : '';

  return `You are parsing a hotel booking confirmation, hotel receipt, or hotel recommendation document for a touring music act. Extract all structured data and return it as a single JSON object.

IMPORTANT RULES:
1. Return ONLY valid JSON. No markdown fences, no preamble, no explanation.
2. If a field is not found, set it to null — never guess or infer.
3. All dollar amounts must be numbers. Strip "$" and commas.
4. All dates must be ISO format: "YYYY-MM-DD".

DOCUMENT TYPES:

  "booking_confirmation" — A confirmed hotel reservation with confirmation number.
    Sources: Priceline, Booking.com, Hotels.com, Expedia, direct hotel emails.
    Contains: hotel name, address, check-in/out dates, room type, rate, confirmation number,
    guest name, payment info, cancellation policy.

  "hotel_receipt" — A post-stay receipt or invoice.
    Contains: itemized charges, room rate, taxes, total paid, payment method.

  "hotel_recommendation" — A venue-provided list of nearby hotels with rates.
    Contains: multiple hotel options with distances, rates by room type, amenities.
    Often includes nearby restaurants and local info.
    Does NOT contain a confirmed booking — this is informational only.

  "room_block" — A group room block agreement.
    Contains: block size, cutoff date, group rate, attrition percentage.

  "other" — Any unrecognized hotel document.

SHOW MATCHING:
${showList}

Match hotel check-in date to show dates. The hotel is typically for the night OF the show or the night BEFORE the show. Consider both when matching:
  - Check-in date matches show date = high confidence match (band stays night of show)
  - Check-in date is one day before show date = medium confidence match (band arrives early)
  - If the hotel city matches a show city, boost confidence

RETURN THIS EXACT JSON STRUCTURE:
{
  "document_type": "booking_confirmation | hotel_receipt | hotel_recommendation | room_block | other",
  "matchedShowId": "uuid or null",
  "matchedShowConfidence": 0.0,
  "is_multi_booking": false,

  "hotel": {
    "name": "string",
    "address": "string or null",
    "city": "string or null",
    "state": "string or null",
    "country": "string or null",
    "phone": "string or null",
    "website": "string or null",
    "star_rating": null
  },

  "reservation": {
    "confirmation_number": "string or null",
    "booking_platform": "priceline | booking_com | hotels_com | expedia | direct | other | null",
    "trip_number": "string or null",
    "check_in": "YYYY-MM-DD or null",
    "check_out": "YYYY-MM-DD or null",
    "check_in_time": "HH:MM or null",
    "check_out_time": "HH:MM or null",
    "num_nights": null,
    "num_rooms": null,
    "room_type": "string or null",
    "guest_names": ["string"] or null
  },

  "pricing": {
    "rate_per_night": null,
    "subtotal": null,
    "taxes_and_fees": null,
    "total_charged": null,
    "currency": "USD",
    "payment_method": "string or null",
    "billing_name": "string or null"
  },

  "room_block": {
    "block_size": null,
    "group_rate": null,
    "cutoff_date": "YYYY-MM-DD or null",
    "attrition_pct": null,
    "block_code": "string or null"
  },

  "amenities": {
    "free_wifi": null,
    "free_breakfast": null,
    "free_parking": null,
    "pool": null,
    "laundry": null,
    "shuttle": null,
    "pet_friendly": null
  },

  "cancellation_policy": "string or null",

  "recommendations": null,

  "confidence": {
    "hotel_name": 0.0,
    "check_in": 0.0,
    "check_out": 0.0,
    "confirmation_number": 0.0,
    "pricing": 0.0,
    "room_block": 0.0
  },

  "warnings": []
}

MULTI-BOOKING:
If the document contains multiple rooms or multiple hotels:
  - Set is_multi_booking to true
  - If multiple rooms at the same hotel on the same dates, keep as one entry with num_rooms reflecting the count
  - If multiple hotels or multiple date ranges, return an array in a "bookings" key

HOTEL RECOMMENDATIONS FORMAT:
If document_type is "hotel_recommendation", populate the "recommendations" field:
{
  "recommendations": [
    {
      "hotel_name": "string",
      "distance_from_venue": "string or null",
      "is_recommended": true or false,
      "rates": [
        { "room_type": "string", "price": 0, "notes": null }
      ],
      "amenities_notes": "string or null"
    }
  ]
}

CRITICAL REMINDERS:
- ALL FINANCIAL FIGURES require TM confirmation regardless of confidence.
- MULTIPLE CONFIRMATION NUMBERS: some platforms list one conf number per room. Capture all of them.
- NEVER INVENT DATA. Missing fields are null.
- Return ONLY the JSON object.`;
}
