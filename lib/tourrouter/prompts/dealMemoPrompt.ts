/**
 * Deal Memo Parser Prompt — DEAL_MEMO_PROMPT_v2
 *
 * Parses deal memos / deal confirmations from any agency format.
 * Known formats: MUSIC·TEAM, Wasserman Music, WME (William Morris Endeavor)
 *
 * Called by the Universal AI Intake pipeline after document type detection
 * identifies the uploaded file as a deal memo.
 *
 * Usage:
 *   import { buildDealMemoPrompt } from '@/lib/tourrouter/prompts/dealMemoPrompt';
 *   const prompt = buildDealMemoPrompt({ tourId, existingShows });
 *   // Send prompt + base64 PDF to Anthropic API
 *
 * Rules:
 *   - This file exports a function, never a raw string (Master Context rule)
 *   - The intake API never writes to the database (rule #19)
 *   - PAYMENT AMOUNT fields always require confirmation regardless of confidence
 *   - Return JSON only — no markdown, no preamble
 */

interface DealMemoPromptContext {
  tourId: string;
  existingShows?: Array<{
    id: string;
    date: string;
    venue: string;
    city: string;
    state: string;
  }>;
}

export function buildDealMemoPrompt(context: DealMemoPromptContext): string {
  const showList = context.existingShows?.length
    ? `\n\nEXISTING SHOWS IN THIS TOUR (use for matching):\n${context.existingShows
        .map((s) => `- ${s.date} | ${s.venue} | ${s.city}, ${s.state} | id: ${s.id}`)
        .join('\n')}`
    : '';

  return `You are parsing a deal memo (also called a deal confirmation memo, performance contract face page, or offer sheet) from a music industry booking agency. Extract all structured data from this document and return it as a single JSON object.

IMPORTANT RULES:
1. Return ONLY valid JSON. No markdown fences, no preamble, no explanation.
2. If a field is not found in the document, set it to null — never guess or infer.
3. For every extracted field, provide a confidence score (0.0 to 1.0) in the "confidence" object.
4. All dollar amounts must be numbers (not strings). Strip "$" and commas. Example: "$6,500.00" becomes 6500.00
5. All dates must be ISO format: "YYYY-MM-DD". If only partial (e.g. "June 7"), use the document year context.
6. All percentages must be decimal numbers. Example: "85%" becomes 85, not 0.85.
7. If the document contains a deal description in natural language, you MUST parse it into the structured deal_type and deal_terms fields using the DEAL TYPE DETECTION rules below.

AGENCY FORMAT DETECTION:
Identify the source agency format from document layout and branding:

  "music_team" — Header says "DEAL CONFIRMATION MEMO" with a memo number (7-digit).
    Structured two-column PDF. Sections: Artist/Date/Venue, Contact Info, Show Info,
    Compensation, Deposits, Ticket Scaling, Deductions/Taxes, Expenses, Merchandise,
    Special Provisions, Booking/Responsible Agent. Brand: MUSIC TEAM or "The Team".

  "wasserman" — Nearly identical layout to MUSIC TEAM (same booking platform).
    Key difference: says "OFFER AS OF" (not yet confirmed) or "CONFIRMED AS OF".
    Brand: Wasserman Music. May also appear as "Wasserman" without "Music".

  "wme" — Completely different format. Text-based legal contract with numbered sections 1-15.
    8+ pages. Addendum "A" contains ticket scaling and itemized expenses.
    Brand: WME or William Morris Endeavor. Face page + Addendum structure.

  "other" — Any format that does not match the above three.

DEAL TYPE DETECTION:
Parse the compensation/deal section and classify into exactly one deal_type enum value:

  "flat_guarantee" — Flat fee, no percentage component.
    Patterns: "Flat Guarantee", "$X flat", "Flat fee", "$X Flat Guarantee"

  "versus_net" — Guarantee vs percentage of net revenue (after taxes, fees, expenses).
    Patterns: "$X vs Y% NBOR", "$X Versus Y% of Net Revenue after Taxes, Fees, and Agreed Expenses",
    "$X vs Y% of net box office", "$X versus Y% net"

  "versus_gross" — Guarantee vs percentage of gross revenue (before or after only taxes/fees, NOT expenses).
    Patterns: "$X vs Y% GBOR", "$X vs Y% of ticket revenue from dollar 1",
    "$X vs Y% of Gross Box Office Revenue after taxes and fees"

  "versus_adjusted_gross" — Guarantee vs percentage of adjusted gross (gross minus specific deductions).
    Patterns: "$X vs Y% of Adjusted Gross", "$X vs Y% AGR"

  "versus_expense_cap" — Guarantee vs percentage after expenses are capped at a fixed amount.
    Patterns: "expenses capped at $X", "expense cap: $X"

  "versus_promoter_profit" — Guarantee vs percentage after promoter takes a fixed profit.
    Patterns: "promoter profit: $X", "after $X promoter profit"

  "overage_only" — Guarantee PLUS percentage of overage after expenses (no "versus").
    Patterns: "$X plus Y% after expenses", "$X guarantee plus Y% overage",
    "$X plus Y% of net after expenses"

  "straight_percentage" — No guarantee, artist gets a percentage only.
    Patterns: "Y% of GBOR from $1", "Mutually Agreeable", "Y% of Net Revenue" (with no guarantee stated)

  "sliding_scale" — Percentage changes at different sales thresholds.
    Patterns: "reverts to Z% at S/O", "Y% up to X paid, then Z% after",
    "sliding scale", "tiered percentage"

  "door_deal" — Artist gets percentage of actual door/walk-up sales.
    Patterns: "door deal", "percentage of door"

  "flat_plus_bonus" — Flat guarantee with a conditional bonus.
    Patterns: "$X Flat Guarantee plus $Y bonus at sellout", "$X plus $Y bonus at Z paid"

  "plus_one" — Base deal plus additional payment at a threshold.
    Patterns: "$X plus $Y at Z tickets sold"

  If the deal type cannot be determined, set deal_type to "unknown" and put the raw deal text in deal_terms.raw_text.

ALIAS GLOSSARY (common abbreviations in deal memos):
  NBOR = Net Box Office Revenue
  GBOR = Gross Box Office Revenue
  S/O = Sellout
  DOS = Day of Show
  MFN = Most Favored Nations (same terms as co-headliner)
  2H / 3H = Second Hold / Third Hold (hold position, not confirmed)
  AGR = Adjusted Gross Revenue
  PRO = Performance Rights Organization (ASCAP/BMI/SESAC)
  NTE = Not To Exceed
  TBD = To Be Determined
  TBA = To Be Announced

DEAL TERMS EXTRACTION:
From the compensation/deal section, extract these specific values:
  - guarantee: number (the base guarantee amount)
  - percentage: number (the artist percentage, if any)
  - versus_base: "gross" | "net" | "adjusted_gross" | null
  - expense_cap: number | null
  - promoter_profit: number | null
  - walkout_potential: number | null (the maximum possible artist earnings stated in doc)
  - bonus_amount: number | null
  - bonus_condition: string | null (e.g. "at sellout", "at 1500 paid")
  - raw_text: string (the EXACT text of the deal/compensation section, verbatim)
  - modifiers: string[] (e.g. ["ALL IN - INCLUSIVE OF SUPPORT", "MFN"])

TICKET SCALING:
Extract each pricing tier as an object in the ticket_scaling array:
  - tier_name: string (e.g. "GA", "Reserved", "VIP", "Balcony")
  - price: number (face value / ticket price)
  - quantity: number (number of tickets available at this tier)
  - facility_fee: number | null (per-ticket facility fee if listed)
  - service_charge: number | null
  - gross: number | null (tier_price x quantity if calculable)
  - kill_count: number | null (tickets killed/held/not for sale)

EXPENSES:
Extract each listed expense as an object in the expenses array:
  - category: string (e.g. "Sound", "Lights", "Stagehands", "Catering", "Security", "Runner", "ASCAP/BMI", "Insurance", "Advertising", "Production Manager")
  - amount: number
  - notes: string | null (e.g. "included in deal", "artist responsibility", "if needed")
  - is_estimated: boolean (true if marked as estimate or "up to" or "not to exceed")
  - is_percentage: boolean (true if expressed as percentage, e.g. "3% of gross" for PRO fees)
  - percentage_of: string | null (what the percentage applies to, e.g. "gross", "net", "adjusted_gross")

DEPOSITS:
Extract each deposit as an object in the deposits array:
  - amount: number
  - due_date: string | null (ISO date)
  - due_description: string | null (e.g. "upon execution", "14 days prior", "at contract signing")
  - percentage_of_guarantee: number | null (if stated as percentage)

CONTACTS:
Extract all named contacts:
  - booking_agent: { name, email, phone, agency } or null
  - responsible_agent: { name, email, phone, agency } or null (sometimes different from booking)
  - venue_contact: { name, role, email, phone } or null
  - promoter: { name, company, email, phone, address } or null
  - production_contact: { name, role, email, phone } or null

MERCHANDISE:
  - merch_rate: number or null (venue percentage of merch sales, e.g. 15 means 15%)
  - merch_sell_type: "artist_sells" | "venue_sells" | "hard_hall" | null
  - merch_notes: string or null (any special merch terms)

SHOW TIMING:
  - doors_time: "HH:MM" or null (24-hour format)
  - showtime: "HH:MM" or null
  - curfew: "HH:MM" or null
  - load_in_time: "HH:MM" or null
  - soundcheck_time: "HH:MM" or null
  - set_length_minutes: number or null

SHOW MATCHING:
${showList}

Match the document to an existing show by:
  1. Exact date match (strongest signal)
  2. City + venue fuzzy match (secondary)
  3. If no match found, set matchedShowId to null

If this document contains MULTIPLE SHOWS (e.g. Wasserman Tour Plan Sheet with a routing grid), set is_multi_show to true and populate the shows array with one entry per show, each containing its own complete field set.

RETURN THIS EXACT JSON STRUCTURE:
{
  "agency_format": "music_team | wasserman | wme | other",
  "document_status": "offer | confirmed | unknown",
  "memo_number": "string or null",
  "matchedShowId": "uuid string or null",
  "matchedShowConfidence": 0.0,
  "is_multi_show": false,
  "shows": null,

  "artist_name": "string",
  "support_acts": ["string"] or null,
  "show_date": "YYYY-MM-DD",
  "day_of_week": "string or null",

  "venue": {
    "name": "string",
    "address": "string or null",
    "city": "string",
    "state": "string or null",
    "country": "string or null",
    "capacity": null,
    "age_restriction": "all_ages | 18+ | 21+ | null"
  },

  "promoter": {
    "name": "string or null",
    "company": "string or null",
    "phone": "string or null",
    "email": "string or null",
    "address": "string or null"
  },

  "booking_agent": {
    "name": "string or null",
    "agency": "string or null",
    "phone": "string or null",
    "email": "string or null"
  },

  "responsible_agent": {
    "name": "string or null",
    "agency": "string or null",
    "phone": "string or null",
    "email": "string or null"
  },

  "production_contact": {
    "name": "string or null",
    "role": "string or null",
    "phone": "string or null",
    "email": "string or null"
  },

  "deal_type": "flat_guarantee | versus_net | versus_gross | versus_adjusted_gross | versus_expense_cap | versus_promoter_profit | overage_only | straight_percentage | sliding_scale | door_deal | flat_plus_bonus | plus_one | unknown",

  "deal_terms": {
    "guarantee": null,
    "guarantee_currency": "USD",
    "percentage": null,
    "versus_base": null,
    "expense_cap": null,
    "promoter_profit": null,
    "walkout_potential": null,
    "bonus_amount": null,
    "bonus_condition": null,
    "sliding_scale": null,
    "raw_text": "exact verbatim text from the document compensation section",
    "modifiers": []
  },

  "ticket_scaling": null,
  "ticket_currency": "USD",
  "total_capacity": null,
  "total_gross_potential": null,

  "expenses": null,
  "total_budgeted_expenses": null,

  "deposits": null,

  "merch": {
    "rate": null,
    "sell_type": null,
    "notes": null
  },

  "tax": {
    "withholding_pct": null,
    "notes": null
  },

  "timing": {
    "doors": null,
    "showtime": null,
    "curfew": null,
    "load_in": null,
    "soundcheck": null,
    "set_length_minutes": null
  },

  "hold_position": null,
  "special_provisions": null,

  "confidence": {
    "artist_name": 0.0,
    "show_date": 0.0,
    "venue_name": 0.0,
    "deal_type": 0.0,
    "guarantee": 0.0,
    "percentage": 0.0,
    "deposit": 0.0,
    "ticket_scaling": 0.0,
    "expenses": 0.0,
    "merch_rate": 0.0,
    "promoter": 0.0,
    "booking_agent": 0.0,
    "timing": 0.0,
    "walkout_potential": 0.0
  },

  "warnings": []
}

CONFIDENCE SCORING GUIDE:
  0.95+ = clearly labeled and unambiguous in the document
  0.80-0.94 = present but required interpretation (e.g. deal language needed parsing)
  0.60-0.79 = inferred from context or partially visible
  0.40-0.59 = best guess, document is ambiguous or partially obscured
  below 0.40 = very uncertain, add explanation to warnings array

CRITICAL REMINDERS:
- PAYMENT AMOUNTS (guarantee, deposit amounts, walkout_potential, expense amounts) are ALWAYS flagged for manual TM confirmation regardless of confidence score.
- VERSUS DEALS: always extract BOTH the guarantee AND the percentage. "$6,500 versus 85% of Net" means guarantee: 6500, percentage: 85, versus_base: "net".
- SLIDING SCALE: capture the full tier array in deal_terms.sliding_scale AND set deal_type to "sliding_scale".
- MULTI-SHOW: if the document lists multiple shows (routing grid), set is_multi_show: true and put each show as an object in the shows array with its own complete field set.
- NEVER INVENT DATA. Missing fields are null. Do not guess addresses, emails, or financial figures.
- Return ONLY the JSON object. No wrapping, no markdown, no commentary.`;
}
