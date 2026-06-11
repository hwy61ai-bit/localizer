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
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/New_York",
  });

  const prompt = `You are a tour schedule parser for a music industry tool called Localizer.

Today's date is ${todayFormatted}. Use this as the reference for inferring years when the source data has no year.

Your job is to extract every show/event from the raw tour schedule text below and return structured JSON.

Rules:
- Extract every date/show you find, even if some fields are missing
- date_iso must be YYYY-MM-DD format. Always return dates in this format regardless of input format
- INTERNATIONAL DATE FORMATS: European dates use day/month/year (DD/MM/YYYY, DD.MM.YYYY, DD-MM-YYYY, "15 March 2026", "Sa 15.03.2026"). American dates use month/day/year. Determine which format is being used based on context clues (country names, venue names, language, whether dates exceed 12 for the first number) and parse accordingly
- If the source data has no year (e.g. "May 3", "Wed Sep 23"), infer the year using these rules:
  - Tour schedules being imported are for UPCOMING shows. Never assume a year in the past.
  - Default to the current year, or the next year if the dates have already passed in the current year.
  - If the source includes day-of-week labels (e.g. "Wednesday, Sep 23"), use them to disambiguate: pick the nearest current-or-future year in which those dates fall on the listed weekdays.
  - Add a warning to the warnings array stating which year was chosen and why (e.g. "No year provided; assumed 2026 because Sep 23 falls on a Wednesday in 2026 and the date is in the future").
- day should be the day of week ("Monday", "Tuesday", etc.) — derive it from the date if not explicitly given
- venue_name is the name of the venue or club. Preserve special characters in venue names (accents, umlauts: ü, ö, é, ñ, ß, etc.)
- city: the city name. Preserve special characters (München, Zürich, São Paulo, etc.)
- state: For US shows, use the 2-letter state abbreviation (e.g. "TX", "CA"). For international shows, use the country name (e.g. "Germany", "UK", "France", "Netherlands", "Japan"). This field serves as both US state and country for international tours
- promoter_email: any email address associated with the show promoter or buyer
- manager_email: any email address for a manager, agent, or tour manager
- notes: ALWAYS set to null. Do NOT put any data in notes
- If a field is not present, use null — do not guess
- Accept cities and venues from ANY country worldwide, not just the US

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
    },
    {
      "date_iso": "2026-06-15",
      "day": "Monday",
      "venue_name": "Festsaal Kreuzberg",
      "city": "Berlin",
      "state": "Germany",
      "promoter_email": null,
      "manager_email": null,
      "notes": null
    }
  ],
  "warnings": []
}

Only add to the "warnings" array if something is genuinely ambiguous or missing — for example, a date you couldn't parse, a city with no state/country, or conflicting information. Do NOT add warnings about date gaps or missing dates between shows. Do NOT add warnings to confirm that correct data is correct.

CRITICAL: Your entire response must be a single JSON object. No text before it, no text after it, no markdown fences, no explanation outside the JSON.

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

  // Strip markdown fences, then slice between the first { and last } so any
  // preamble/postamble the model emits outside the JSON object is dropped.
  const stripped = raw.replace(/```json|```/g, "").trim();
  const firstBrace = stripped.indexOf("{");
  const lastBrace = stripped.lastIndexOf("}");
  const clean = firstBrace !== -1 && lastBrace > firstBrace
    ? stripped.slice(firstBrace, lastBrace + 1)
    : stripped;

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
