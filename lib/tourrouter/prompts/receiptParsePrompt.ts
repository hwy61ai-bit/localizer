/**
 * Receipt Parse Prompt — RECEIPT_PARSE_PROMPT
 *
 * Parses expense receipts, invoices, and reimbursement documents.
 * These create rows in tour_expenses table.
 *
 * Usage:
 *   import { buildReceiptParsePrompt } from '@/lib/tourrouter/prompts/receiptParsePrompt';
 *   const prompt = buildReceiptParsePrompt({ tourId, existingShows });
 */

interface ReceiptParsePromptContext {
  tourId: string;
  existingShows?: Array<{
    id: string;
    date: string;
    venue: string;
    city: string;
    state: string;
  }>;
}

export function buildReceiptParsePrompt(context: ReceiptParsePromptContext): string {
  const showList = context.existingShows?.length
    ? `\n\nEXISTING SHOWS IN THIS TOUR (match receipt date to show dates):\n${context.existingShows
        .map((s) => `- ${s.date} | ${s.venue} | ${s.city}, ${s.state} | id: ${s.id}`)
        .join('\n')}`
    : '';

  return `You are parsing an expense receipt or invoice related to a music tour. Extract all structured data and return it as a single JSON object.

This could be a gas station receipt, restaurant bill, gear purchase, rental invoice, toll receipt, parking receipt, or any other touring expense.

IMPORTANT RULES:
1. Return ONLY valid JSON. No markdown fences, no preamble, no explanation.
2. If a field is not found, set it to null — never guess or infer.
3. All dollar amounts must be numbers. Strip "$" and commas.
4. All dates must be ISO format: "YYYY-MM-DD".
5. ALL PAYMENT AMOUNTS require TM confirmation regardless of confidence.

EXPENSE CATEGORIES:
Classify each receipt into one of these categories:
  "fuel" — Gas, diesel, EV charging
  "tolls" — Highway tolls, bridge tolls
  "parking" — Parking garage, meter, lot
  "food_band" — Meals for band/artist
  "food_crew" — Meals for crew
  "food_buyout" — Catering buyout (lump sum meal payment)
  "hotel" — Hotel charges not covered by the hotel booking
  "vehicle" — Vehicle rental, repairs, maintenance, car wash
  "gear" — Equipment purchase or rental
  "merch_supplies" — Merch production costs (shirts, printing, etc.)
  "travel" — Flights, trains, rideshare, taxi, bus tickets
  "production" — Sound, lights, backline rental, stage equipment
  "per_diem" — Cash per diem withdrawals
  "medical" — First aid, pharmacy, urgent care
  "laundry" — Laundry, dry cleaning
  "shipping" — Fedex, UPS, freight
  "office" — Printing, supplies, internet
  "tips" — Tips for venue staff, runners
  "miscellaneous" — Anything that does not fit above

SHOW MATCHING:
${showList}

Match the receipt date to the nearest show date. Expenses on show days or travel days between shows should be matched. If the receipt date falls between two shows, match to the earlier show (expenses are typically incurred traveling TO the next show).

RETURN THIS EXACT JSON STRUCTURE:
{
  "matchedShowId": "uuid or null",
  "matchedShowConfidence": 0.0,
  "is_tour_level_expense": false,

  "vendor": {
    "name": "string or null",
    "address": "string or null",
    "city": "string or null",
    "state": "string or null",
    "phone": "string or null"
  },

  "transaction": {
    "date": "YYYY-MM-DD",
    "time": "HH:MM or null",
    "receipt_number": "string or null",
    "invoice_number": "string or null"
  },

  "expense_category": "fuel | tolls | parking | food_band | food_crew | food_buyout | hotel | vehicle | gear | merch_supplies | travel | production | per_diem | medical | laundry | shipping | office | tips | miscellaneous",

  "line_items": [
    {
      "description": "string",
      "quantity": null,
      "unit_price": null,
      "amount": 0
    }
  ],

  "totals": {
    "subtotal": null,
    "tax": null,
    "tip": null,
    "total": 0,
    "currency": "USD"
  },

  "payment": {
    "method": "cash | credit | debit | check | wire | null",
    "card_last_four": "string or null",
    "card_type": "visa | mastercard | amex | discover | null",
    "paid_by": "string or null"
  },

  "fuel_specific": {
    "gallons": null,
    "price_per_gallon": null,
    "fuel_type": "regular | premium | diesel | null",
    "odometer": null
  },

  "notes": "string or null",

  "confidence": {
    "vendor_name": 0.0,
    "date": 0.0,
    "total": 0.0,
    "category": 0.0,
    "line_items": 0.0
  },

  "warnings": []
}

CRITICAL REMINDERS:
- ALL DOLLAR AMOUNTS require TM confirmation.
- FUEL RECEIPTS: extract gallons and price per gallon if visible — these feed into the fuel cost tracking system.
- MULTI-ITEM RECEIPTS: if a receipt has items spanning multiple categories (e.g. Walmart with food + supplies), use the dominant category and note the split in warnings.
- HANDWRITTEN RECEIPTS: use the uncertain number format { value, confidence, uncertain, alternatives } for any ambiguous amounts.
- NEVER INVENT DATA. Missing fields are null.
- Return ONLY the JSON object.`;
}
