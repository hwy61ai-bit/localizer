/**
 * Settlement Sheet Parser Prompt — SETTLEMENT_PARSE_PROMPT
 *
 * Parses settlement sheets from any format including handwritten documents and photos.
 * Known formats: Prism.fm, Live Nation, Handwritten/Email, Sedate Touring (European), Love Police (Australian)
 *
 * Called by the Universal AI Intake pipeline after document type detection
 * identifies the uploaded file as a settlement sheet.
 *
 * Usage:
 *   import { buildSettlementParsePrompt } from '@/lib/tourrouter/prompts/settlementParsePrompt';
 *   const prompt = buildSettlementParsePrompt({ tourId, existingShows, dealOnFile });
 *   // Send prompt + base64 PDF/image to Anthropic API
 *
 * Rules:
 *   - This file exports a function, never a raw string (Master Context rule)
 *   - The intake API never writes to the database (rule #19)
 *   - ALL PAYMENT AMOUNTS require TM confirmation regardless of confidence
 *   - Handwritten: flag ambiguous characters, never guess
 *   - Crossed-out values: use replacement, not original
 *   - Initialed corrections supersede originals
 */

interface SettlementParsePromptContext {
  tourId: string;
  existingShows?: Array<{
    id: string;
    date: string;
    venue: string;
    city: string;
    state: string;
    deal?: {
      deal_type: string;
      guarantee: number | null;
      percentage: number | null;
      versus_base: string | null;
    };
  }>;
  dealOnFile?: {
    deal_type: string;
    guarantee: number | null;
    percentage: number | null;
    versus_base: string | null;
    expenses_budgeted: number | null;
  };
}

export function buildSettlementParsePrompt(context: SettlementParsePromptContext): string {
  const showList = context.existingShows?.length
    ? `\n\nEXISTING SHOWS IN THIS TOUR (use for matching):\n${context.existingShows
        .map((s) => {
          const dealInfo = s.deal
            ? ` | deal: ${s.deal.deal_type}, guarantee: ${s.deal.guarantee}, pct: ${s.deal.percentage}`
            : '';
          return `- ${s.date} | ${s.venue} | ${s.city}, ${s.state} | id: ${s.id}${dealInfo}`;
        })
        .join('\n')}`
    : '';

  const dealContext = context.dealOnFile
    ? `\n\nDEAL ON FILE FOR THIS SHOW (use for verification):\n  deal_type: ${context.dealOnFile.deal_type}\n  guarantee: ${context.dealOnFile.guarantee}\n  percentage: ${context.dealOnFile.percentage}\n  versus_base: ${context.dealOnFile.versus_base}\n  expenses_budgeted: ${context.dealOnFile.expenses_budgeted}`
    : '';

  return `You are parsing a settlement sheet from a live music event. This is the financial reconciliation document produced after a show, showing what the artist actually earned. Extract all structured data and return it as a single JSON object.

This document may be a clean digital PDF, a scanned page, a photograph of a handwritten sheet, or an email with inline calculations. Handle all formats.

IMPORTANT RULES:
1. Return ONLY valid JSON. No markdown fences, no preamble, no explanation.
2. If a field is not found in the document, set it to null — never guess or infer.
3. ALL DOLLAR AMOUNTS require TM confirmation regardless of confidence. This is non-negotiable.
4. All dollar amounts must be numbers (not strings). Strip "$" and commas.
5. All dates must be ISO format: "YYYY-MM-DD".
6. All percentages must be decimal numbers. Example: "85%" becomes 85, not 0.85.
7. When a number is uncertain, return it as an object: { "value": 6500, "confidence": 0.4, "uncertain": true, "alternatives": [6800, 6300] }

HANDWRITTEN DOCUMENT RULES:
When parsing handwritten, photographed, or scanned settlement sheets:

1. AMBIGUOUS CHARACTERS — flag rather than guess:
   - 1 vs 7: if unclear, return uncertain object with both alternatives
   - 6 vs 0: common in dollar amounts, flag uncertainty
   - 5 vs 8: flag uncertainty
   - 4 vs 9: flag uncertainty
   - Decimal point vs comma vs stray mark: flag uncertainty

2. CROSSED-OUT VALUES — use the replacement, not the original:
   - A number with a line through it has been voided
   - The number written next to, above, or below it is the correction
   - If both are readable, return the correction as value and note the original in warnings

3. INITIALED CORRECTIONS — supersede original values:
   - If a value has initials next to a correction, the corrected value is authoritative
   - Note the initials in warnings for audit trail

4. LOW LIGHT / ANGLED PHOTOS:
   - If numbers are partially obscured, flag all affected fields as uncertain
   - If entire sections are unreadable, set those fields to null and add to warnings

5. HANDWRITTEN MATH:
   - If the document shows manual calculations (addition columns, running totals), verify the math
   - If the math does not add up, flag the discrepancy in warnings with both the stated total and the calculated total

SETTLEMENT FORMAT DETECTION:
Identify the format from layout and branding:

  "prism_fm" — Digital, structured layout from Prism.fm platform.
    Deal stated in plain English on first line (e.g. "$6,500.00 Versus 85.00% of Net Revenue after Taxes, Fees, and Agreed Expenses").
    Full waterfall: Gross -> Facility Fee -> Adjusted Gross -> Tax -> Net Gross -> Expenses -> Promoter Profit -> Net Revenue to Split.
    Sales breakdown table (tier, price, sold, gross). Expense budget vs actual vs variance columns.

  "live_nation" — Simple header fields + guarantee table + Artist Earnings section.
    Event ID in footer. May have handwritten signatures.
    Typically shorter than Prism.fm — fewer line items.

  "handwritten" — Freeform handwritten or typed email/text.
    Deal stated inline (e.g. "$2000 vs 70% of net box office").
    Inline math calculations. Payout by name with payment method (check, cash, wire).
    May include scribbled notes, arrows, or margin annotations.

  "european" — Multi-currency tour-level settlement.
    One row per show across multiple shows. Exchange rates column.
    Commission calculation at bottom. Currencies: EUR, SEK, GBP, CHF, etc.
    Sedate Touring, Friendly Fire, Paradigm Europe, etc.

  "australian" — Full tour P&L from promoter perspective.
    AUD currency. Itemized expenses by category.
    Per-show income breakdown on separate page.
    Love Police, Chugg Entertainment, etc.

  "other" — Any format not matching the above.

THE SETTLEMENT WATERFALL:
This is the standard financial flow. Not every document will have all steps, but extract whatever is present:

  1. GROSS TICKET REVENUE — total face value of all tickets sold
  2. minus FACILITY FEES — per-ticket venue fees (sometimes called "venue fee" or "restoration fee")
  3. = ADJUSTED GROSS — gross minus facility fees
  4. minus TAXES — state/local/VAT taxes on ticket sales
  5. = NET GROSS (or "Gross after taxes and fees")
  6. minus AGREED EXPENSES — production costs (sound, lights, stagehands, catering, security, etc.)
  7. = NET REVENUE (before promoter profit, if applicable)
  8. minus PROMOTER PROFIT — fixed or percentage profit to promoter (if versus_promoter_profit deal)
  9. = NET TO SPLIT — the amount the artist percentage applies to (in versus deals)
  10. ARTIST PAYMENT — the greater of guarantee vs percentage share (in versus deals), or flat guarantee

TICKET SALES EXTRACTION:
Extract the ticket sales breakdown:
  - Each tier: tier_name, price, quantity_available, quantity_sold, quantity_comped, gross_revenue
  - Total tickets sold, total tickets comped, total tickets available
  - Gross ticket revenue
  - If the document shows "drops" or "kills" (tickets removed from sale), capture those

EXPENSE EXTRACTION:
Extract expenses with budget vs actual if both are shown:
  - category: string (Sound, Lights, Stagehands, Catering, Security, Runner, ASCAP/BMI, Insurance, Advertising, Production, Barricade, Forklift, Hospitality, Towels, Runner, etc.)
  - budgeted: number or null
  - actual: number or null
  - variance: number or null (actual minus budgeted)
  - notes: string or null

SETTLEMENT VERIFICATION:
If a deal is on file for this show, compare the promoter settlement numbers against what the deal terms would produce:
${dealContext}

Flag any discrepancies in the "verification" object:
  - Does the stated gross match tickets_sold x price per tier?
  - Do the expenses exceed the budgeted amounts from the deal memo?
  - Does the artist payment match what the deal formula would produce?
  - Is the percentage applied to the correct base (gross vs net vs adjusted)?

MULTI-SHOW SETTLEMENTS:
European and Australian formats often settle an entire tour in one document. If this document contains multiple shows:
  - Set is_multi_show to true
  - Populate the shows array with one entry per show
  - Each show gets its own waterfall, expenses, and artist payment
  - Extract tour-level totals separately (total_tour_gross, total_tour_expenses, total_tour_artist_payment)
  - Extract exchange rates if multi-currency
  - Extract commission calculations if present (agent commission, management commission)

SHOW MATCHING:
${showList}

Match by:
  1. Exact date match (strongest signal)
  2. City + venue fuzzy match (secondary)
  3. If no match, set matchedShowId to null

RETURN THIS EXACT JSON STRUCTURE:
{
  "settlement_format": "prism_fm | live_nation | handwritten | european | australian | other",
  "matchedShowId": "uuid string or null",
  "matchedShowConfidence": 0.0,
  "is_multi_show": false,
  "shows": null,

  "event_name": "string or null",
  "artist_name": "string",
  "show_date": "YYYY-MM-DD",
  "venue_name": "string",
  "venue_city": "string or null",
  "venue_state": "string or null",
  "venue_country": "string or null",
  "event_id": "string or null",
  "promoter_name": "string or null",
  "promoter_company": "string or null",

  "deal_as_stated": "exact verbatim deal language from the settlement sheet",
  "deal_type_detected": "flat_guarantee | versus_net | versus_gross | versus_adjusted_gross | versus_expense_cap | versus_promoter_profit | overage_only | straight_percentage | sliding_scale | door_deal | flat_plus_bonus | plus_one | unknown",

  "waterfall": {
    "gross_ticket_revenue": null,
    "facility_fees_total": null,
    "adjusted_gross": null,
    "taxes_total": null,
    "tax_percentage": null,
    "net_gross": null,
    "total_expenses": null,
    "promoter_profit": null,
    "net_revenue": null,
    "artist_percentage": null,
    "artist_percentage_share": null,
    "artist_guarantee": null,
    "artist_payment": null,
    "artist_payment_method": "check | cash | wire | direct_deposit | null",
    "overage": null,
    "currency": "USD"
  },

  "ticket_sales": {
    "tiers": [
      {
        "tier_name": "string",
        "price": 0,
        "available": null,
        "sold": 0,
        "comped": null,
        "killed": null,
        "gross": 0
      }
    ],
    "total_available": null,
    "total_sold": null,
    "total_comped": null,
    "total_gross": null
  },

  "expenses": [
    {
      "category": "string",
      "budgeted": null,
      "actual": null,
      "variance": null,
      "notes": null
    }
  ],
  "total_expenses_budgeted": null,
  "total_expenses_actual": null,

  "adjustments": [
    {
      "description": "string",
      "amount": 0,
      "type": "deduction | addition"
    }
  ],

  "merch": {
    "gross_sales": null,
    "venue_percentage": null,
    "venue_commission": null,
    "net_to_artist": null,
    "notes": null
  },

  "deposits": {
    "total_deposits_applied": null,
    "balance_due": null,
    "overpayment": null
  },

  "payouts": [
    {
      "payee_name": "string",
      "amount": 0,
      "method": "check | cash | wire | direct_deposit | null",
      "check_number": null,
      "notes": null
    }
  ],

  "tour_level": {
    "total_tour_gross": null,
    "total_tour_expenses": null,
    "total_tour_artist_payment": null,
    "total_shows": null,
    "exchange_rates": null,
    "agent_commission_pct": null,
    "agent_commission_amount": null,
    "management_commission_pct": null,
    "management_commission_amount": null,
    "net_after_commissions": null
  },

  "verification": {
    "deal_matches_file": null,
    "gross_math_checks": null,
    "expense_overages": [],
    "payment_matches_formula": null,
    "discrepancies": []
  },

  "signatures": {
    "artist_rep_signed": null,
    "promoter_signed": null,
    "settlement_date": null,
    "notes": null
  },

  "confidence": {
    "artist_name": 0.0,
    "show_date": 0.0,
    "venue_name": 0.0,
    "deal_type": 0.0,
    "gross_ticket_revenue": 0.0,
    "total_expenses": 0.0,
    "artist_payment": 0.0,
    "ticket_sales": 0.0,
    "waterfall": 0.0,
    "merch": 0.0,
    "deposits": 0.0,
    "payouts": 0.0
  },

  "warnings": []
}

UNCERTAIN NUMBER FORMAT:
When any number is uncertain (handwritten ambiguity, poor image quality, partially obscured), replace the simple number with this object:
  { "value": 6500, "confidence": 0.4, "uncertain": true, "alternatives": [6800, 6300] }

The "value" field is your best guess. The "alternatives" array contains other plausible readings. The TM will see all options and choose.

CONFIDENCE SCORING GUIDE:
  0.95+ = clearly printed/typed, unambiguous
  0.80-0.94 = legible but required interpretation
  0.60-0.79 = partially obscured or ambiguous formatting
  0.40-0.59 = handwritten with some unclear characters
  below 0.40 = significant uncertainty, multiple plausible readings

CRITICAL REMINDERS:
- ALL PAYMENT AMOUNTS are flagged for manual TM confirmation. Every dollar figure. No exceptions.
- CROSSED-OUT VALUES: use the replacement value, note the original in warnings.
- INITIALED CORRECTIONS: the corrected value with initials is authoritative.
- MATH VERIFICATION: if the document shows a total and you can verify it from line items, do so. Flag discrepancies.
- MULTI-CURRENCY: European settlements may have amounts in EUR, GBP, SEK, etc. Capture the currency per amount. Capture exchange rates if shown.
- NEVER INVENT DATA. Missing fields are null. Do not guess financial figures.
- Return ONLY the JSON object. No wrapping, no markdown, no commentary.`;
}
