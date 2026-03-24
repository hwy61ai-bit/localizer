import Anthropic from "@anthropic-ai/sdk";

export type ParsedEvent = {
  date_iso: string | null;       // YYYY-MM-DD
  day: string | null;            // "Monday", "Tue", etc.
  venue_name: string | null;
  city: string | null;
  state: string | null;
  promoter_email: string | null;
  manager_email: string | null;
  notes: string | null;
};

export type ParseImportResult = {
  events: ParsedEvent[];
  warnings: string[];
};

const client = new Anthropic();

export async function parseTourSchedule(
  rawText: string
): Promise<ParseImportResult> {
  const prompt = `You are a tour schedule parser for a music industry tool called Localizer.

Your job is to extract every show/event from the raw tour schedule text below and return structured JSON.

Rules:
- Extract every date/show you find, even if some fields are missing
- date_iso must be YYYY-MM-DD format. If you only have a partial date (e.g. "May 3"), use the most likely year based on context or leave null
- day should be the day of week ("Monday", "Tuesday", etc.) — derive it from the date if not explicitly given
- venue_name is the name of the venue or club
- city and state should be separate fields. Use 2-letter state abbreviation for US states
- promoter_email: any email address associated with the show promoter or buyer
- manager_email: any email address for a manager, agent, or tour manager
- notes: ALWAYS set to null. Do NOT put any data in notes.
- If a field is not present, use null — do not guess

IMPORTANT: ONLY extract the fields listed above. Completely IGNORE all other data in the source file including: financial data, ticket prices, offers, guarantees, capacity, age limits, set times, door times, curfews, hospitality info, production notes, contract details, backend deals, merch percentages, support acts, and any other fields. Do NOT include any of this data in any field, especially not in notes.

Return ONLY a valid JSON object in this exact shape, no explanation, no markdown:
{
  "events": [
    {
      "date_iso": "2026-05-01",
      "day": "Friday",
      "venue_name": "The Fillmore",
      "city": "Detroit",
      "state": "MI",
      "promoter_email": "promo@example.com",
      "manager_email": null,
      "notes": null
    }
  ],
  "warnings": []
}

Only add to the "warnings" array if something is genuinely ambiguous or missing — for example, a date you couldn't parse, a city with no state, or conflicting information. Do NOT add warnings about date gaps or missing dates between shows. Do NOT add warnings to confirm that correct data is correct.

Here is the raw tour schedule:
---
${rawText}
---`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  // Strip markdown fences if present
  const clean = raw.replace(/```json|```/g, "").trim();

  let parsed: ParseImportResult;
  try {
    parsed = JSON.parse(clean);
  } catch (parseErr) {
    console.error("Failed to parse AI response:");
    console.error("Raw response:", raw);
    console.error("Cleaned response:", clean);
    console.error("Parse error:", parseErr);
    throw new Error(
      "AI returned unexpected format. Please try again or simplify your input."
    );
  }

  if (!Array.isArray(parsed.events)) {
    throw new Error("No events found in the parsed result.");
  }

  return parsed;
}
