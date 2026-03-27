/**
 * Universal Fallback Prompt — UNIVERSAL_FALLBACK_PROMPT
 *
 * Handles documents that the document type detector could not confidently classify.
 * Attempts to extract whatever structured data is available and suggests what type
 * the document might be.
 *
 * Usage:
 *   import { buildUniversalFallbackPrompt } from '@/lib/tourrouter/prompts/universalFallbackPrompt';
 *   const prompt = buildUniversalFallbackPrompt({ tourId, existingShows });
 */

interface UniversalFallbackPromptContext {
  tourId: string;
  fileName?: string;
  detectedType?: string;
  detectedTypeConfidence?: number;
  existingShows?: Array<{
    id: string;
    date: string;
    venue: string;
    city: string;
    state: string;
  }>;
}

export function buildUniversalFallbackPrompt(context: UniversalFallbackPromptContext): string {
  const showList = context.existingShows?.length
    ? `\n\nEXISTING SHOWS IN THIS TOUR:\n${context.existingShows
        .map((s) => `- ${s.date} | ${s.venue} | ${s.city}, ${s.state} | id: ${s.id}`)
        .join('\n')}`
    : '';

  const fileInfo = context.fileName ? `\nFILE NAME: ${context.fileName}` : '';
  const priorDetection = context.detectedType
    ? `\nPRIOR DETECTION ATTEMPT: type="${context.detectedType}" confidence=${context.detectedTypeConfidence}`
    : '';

  return `You are analyzing a document that could not be automatically classified by the TourRouter document type detector. Your job is to:

1. Determine what type of music industry document this is
2. Extract whatever structured data you can find
3. Suggest which TourRouter parser should handle this document

Return a single JSON object with your analysis.
${fileInfo}${priorDetection}

IMPORTANT RULES:
1. Return ONLY valid JSON. No markdown fences, no preamble, no explanation.
2. If a field is not found, set it to null — never guess or infer.
3. All dollar amounts must be numbers. Strip "$" and commas.
4. All dates must be ISO format: "YYYY-MM-DD".

KNOWN DOCUMENT TYPES IN TOURROUTER:
  "deal_memo" — Deal confirmation, offer confirmation, performance agreement
  "settlement_sheet" — Post-show financial reconciliation
  "box_office_report" — Ticket sales report, ticket count, sales audit
  "hotel_confirmation" — Hotel booking confirmation or receipt
  "expense_receipt" — General expense receipt or invoice
  "advance_response" — Venue advance info, tech specs, production pack
  "contact_list" — Personnel list, tour contacts, crew roster
  "offer_sheet" — Pre-deal offer from promoter (not yet a deal memo)
  "contract" — Full performance contract (longer than deal memo, legal language)
  "flight_itinerary" — Flight bookings, travel itineraries
  "marketing_plan" — Ad plan, media plan, radio promo proposal
  "media_list" — Press credentials, photo passes, reviewer list
  "rider" — Hospitality rider, technical rider, stage plot, input list
  "tour_plan_sheet" — Agent routing sheet with multiple shows
  "w9_tax_form" — W-9, W-8BEN, or other tax form
  "invoice" — Vendor invoice, production invoice
  "insurance_certificate" — Certificate of insurance, COI
  "parking_map" — Load-in and parking diagram
  "stage_plot" — Stage layout diagram
  "input_list" — Audio input list / channel list
  "unknown" — Cannot determine document type

SHOW MATCHING:
${showList}

RETURN THIS EXACT JSON STRUCTURE:
{
  "suggested_document_type": "string from list above",
  "suggested_type_confidence": 0.0,
  "alternative_types": [
    { "type": "string", "confidence": 0.0, "reasoning": "string" }
  ],
  "recommended_parser": "dealMemoPrompt | settlementParsePrompt | boxOfficeParsePrompt | hotelConfirmPrompt | receiptParsePrompt | advanceResponsePrompt | contactListPrompt | columnMapperPrompt | null",

  "matchedShowId": "uuid or null",
  "matchedShowConfidence": 0.0,

  "extracted_data": {
    "artist_name": "string or null",
    "show_date": "YYYY-MM-DD or null",
    "venue_name": "string or null",
    "venue_city": "string or null",
    "promoter_name": "string or null",
    "financial_amounts": [
      { "label": "string", "amount": 0, "context": "string" }
    ],
    "contacts": [
      { "name": "string", "role": "string or null", "phone": "string or null", "email": "string or null" }
    ],
    "dates_found": ["YYYY-MM-DD"],
    "key_text_excerpts": ["string"]
  },

  "document_summary": "1-2 sentence description of what this document appears to be",

  "confidence": {
    "document_type": 0.0,
    "extracted_data": 0.0,
    "show_match": 0.0
  },

  "warnings": []
}

CLASSIFICATION HINTS:
- If the document mentions "guarantee", "versus", "NBOR", "GBOR", or deal percentages, it is likely a deal_memo or offer_sheet
- If it shows a financial waterfall (Gross -> Expenses -> Net), it is likely a settlement_sheet
- If it lists ticket tiers with quantities sold, it is likely a box_office_report
- If it has check-in/check-out dates and room rates, it is likely a hotel_confirmation
- If it has flight numbers, airlines, and departure/arrival times, it is a flight_itinerary
- If it has stage dimensions, PA specs, or lighting rigs, it is an advance_response
- If it lists people with roles and contact info, it is a contact_list
- If it has ad spend, media placements, or promotional value, it is a marketing_plan
- If it has legal terms, signature blocks, and numbered clauses, it is a contract
- If it is a W-9 or tax form, it is a w9_tax_form
- If it is primarily a diagram or map, it is a parking_map, stage_plot, or input_list

CRITICAL REMINDERS:
- The goal is to HELP THE TM, not to force a classification. If you are uncertain, say so.
- Extract whatever data you CAN find, even if the document type is unclear. Partial data is better than nothing.
- ALL FINANCIAL FIGURES require TM confirmation.
- NEVER INVENT DATA. Missing fields are null.
- Return ONLY the JSON object.`;
}
