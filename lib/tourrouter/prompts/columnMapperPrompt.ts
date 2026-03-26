const VALID_FIELDS = [
  "date", "event", "city", "country", "venue", "offer", "capacity",
  "status", "doors", "showtime", "onstage", "curfew", "promoter",
  "notes", "backend", "support", "merch", "billing", "age_limit",
  "ticket_price", "hotel_name", "hotel_address", "hotel_rate",
  "production_contact", "promoter_contact", "set_length",
];

export function buildColumnMapperPrompt(
  unknownHeaders: string[],
  sampleRows: Record<string, string>[],
): string {
  const sampleStr = sampleRows.slice(0, 3).map((row, i) => {
    const vals = unknownHeaders.map((h) => `${h}: "${row[h] || ""}"`).join(", ");
    return `Row ${i + 1}: { ${vals} }`;
  }).join("\n");

  return `You are mapping spreadsheet column headers to TourRouter fields for a concert/tour routing system.

UNKNOWN HEADERS TO MAP:
${unknownHeaders.map((h) => `- "${h}"`).join("\n")}

SAMPLE DATA (first 3 rows):
${sampleStr}

VALID TOURROUTER FIELDS:
${VALID_FIELDS.map((f) => `- ${f}`).join("\n")}

TRANSLATION RULES:
- Date formats vary: MM/DD/YYYY, DD/MM/YYYY, "Sat 07 Feb", etc.
- Currency: "$5,000" or "€3.500" or "5000 USD" → field "offer"
- Status: "conf", "confirmed", "hold", "pending", "avail" → field "status"
- "guarantee", "fee", "gig fee", "artist fee", "income" → field "offer"
- "market", "town", "metro" → field "city"
- "club", "theater", "room", "hall" → field "venue"
- "buyer", "presented by", "local" → field "promoter"
- "back end", "percentage", "vs", "versus", "deal terms" → field "backend"
- "cap", "cap." → field "capacity"
- "door time", "doors open" → field "doors"
- "show time", "set time", "start time" → field "showtime"
- If a header clearly doesn't map to any field, use "unknown"

For EACH header, respond with your best mapping. Respond ONLY with JSON (no markdown):
{
  "mappings": {
    "<original_header>": {
      "field": "<tourrouter_field or unknown>",
      "confidence": <0.0-1.0>,
      "reasoning": "<brief explanation>"
    }
  }
}`;
}
