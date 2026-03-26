export function buildDocumentTypePrompt(fileName: string, preview: string): string {
  return `You are a tour management document classifier. Analyze the filename and text preview to determine the document type.

FILENAME: ${fileName}
TEXT PREVIEW (first 300 chars):
${preview}

Classify as ONE of these types:
- deal_memo: Deal memo, offer sheet, or contract with show terms (guarantee, percentages, rider)
- settlement: Post-show settlement, box office report, or final accounting
- box_office: Box office statement, ticket counts, gross/net receipts
- hotel_confirmation: Hotel booking confirmation, reservation details
- expense_receipt: Receipt for tour expense (gas, food, parking, tolls, etc.)
- advance_response: Venue advance response with production/hospitality/load-in details
- contact_list: List of contacts (promoters, venues, agents, production)
- co_headliner: Co-headliner agreement, support act deal, billing arrangement
- unknown: Cannot determine type

Respond ONLY with valid JSON (no markdown):
{
  "type": "<document_type>",
  "confidence": <0.0-1.0>,
  "reason": "<one sentence explanation>",
  "suggestedTypes": ["<type1>", "<type2>"]
}

suggestedTypes: if confidence < 0.8, include your top 2-3 guesses. Otherwise empty array.`;
}
