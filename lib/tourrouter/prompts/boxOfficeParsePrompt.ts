/**
 * Box Office Parse Prompt — BOX_OFFICE_PARSE_PROMPT
 *
 * Parses ticket count reports, box office statements, and sales audit reports.
 * Known formats: MUSIC·TEAM Ticket Count Report (35+ shows), AEG Sales Audit, Prism.fm box office
 *
 * Usage:
 *   import { buildBoxOfficeParsePrompt } from '@/lib/tourrouter/prompts/boxOfficeParsePrompt';
 *   const prompt = buildBoxOfficeParsePrompt({ tourId, existingShows });
 */

interface BoxOfficePromptContext {
  tourId: string;
  existingShows?: Array<{
    id: string;
    date: string;
    venue: string;
    city: string;
    state: string;
  }>;
}

export function buildBoxOfficeParsePrompt(context: BoxOfficePromptContext): string {
  const showList = context.existingShows?.length
    ? `\n\nEXISTING SHOWS IN THIS TOUR (use for matching):\n${context.existingShows
        .map((s) => `- ${s.date} | ${s.venue} | ${s.city}, ${s.state} | id: ${s.id}`)
        .join('\n')}`
    : '';

  return `You are parsing a box office report, ticket count report, or sales audit from a live music event or tour. Extract all structured ticket sales data and return it as a single JSON object.

These documents may cover a single show or an entire tour (30+ shows in one document).

IMPORTANT RULES:
1. Return ONLY valid JSON. No markdown fences, no preamble, no explanation.
2. If a field is not found, set it to null — never guess or infer.
3. All dollar amounts must be numbers. Strip "$" and commas.
4. All dates must be ISO format: "YYYY-MM-DD".
5. All percentages must be decimal numbers. "85%" becomes 85.

KNOWN FORMATS:

  "music_team_ticket_count" — MUSIC TEAM Ticket Count Report.
    Multi-show document (often 35+ shows). One row per show.
    Columns typically: Date, City, Venue, Capacity, Sold, Comps, Gross, On Sale Date.
    May include ticket tier breakdowns per show.

  "aeg_sales_audit" — AEG Sales Audit Report.
    Detailed per-show breakdown with tier-level data.
    Columns: Tier, Price Level, Face Value, Fees, Sold, Comped, Killed, Gross.
    Event ID reference.

  "prism_fm" — Prism.fm box office statement.
    Digital format with tier breakdown, facility fees, service charges.
    Often attached to or embedded in a settlement sheet.

  "venue_box_office" — Generic venue-generated box office statement.
    Varies widely. May be Excel, PDF, or printed summary.

  "other" — Any unrecognized format.

SHOW MATCHING:
${showList}

If this is a multi-show document, match EACH show row to an existing tour show by date + venue + city. Return all matches in the shows array.

RETURN THIS EXACT JSON STRUCTURE:
{
  "report_format": "music_team_ticket_count | aeg_sales_audit | prism_fm | venue_box_office | other",
  "report_date": "YYYY-MM-DD or null",
  "is_multi_show": false,

  "matchedShowId": "uuid or null",
  "matchedShowConfidence": 0.0,

  "event_name": "string or null",
  "artist_name": "string or null",
  "show_date": "YYYY-MM-DD or null",
  "venue_name": "string or null",
  "venue_city": "string or null",
  "venue_capacity": null,

  "ticket_tiers": [
    {
      "tier_name": "string",
      "face_value": 0,
      "facility_fee": null,
      "service_charge": null,
      "total_price": null,
      "available": null,
      "sold": 0,
      "comped": null,
      "killed": null,
      "held": null,
      "gross_revenue": null
    }
  ],

  "totals": {
    "total_capacity": null,
    "total_available": null,
    "total_sold": null,
    "total_comped": null,
    "total_killed": null,
    "total_held": null,
    "total_gross_revenue": null,
    "total_net_revenue": null,
    "total_facility_fees": null,
    "total_service_charges": null
  },

  "on_sale_date": "YYYY-MM-DD or null",
  "event_id": "string or null",

  "shows": null,

  "confidence": {
    "artist_name": 0.0,
    "show_date": 0.0,
    "venue_name": 0.0,
    "ticket_tiers": 0.0,
    "totals": 0.0
  },

  "warnings": []
}

MULTI-SHOW FORMAT:
If the document contains multiple shows, set is_multi_show to true and populate "shows" as an array where each entry has the full structure above (minus the shows field itself). Set top-level matchedShowId to null. Each show in the array gets its own matchedShowId and matchedShowConfidence.

Also include tour-level aggregates:
{
  "tour_totals": {
    "total_shows": 0,
    "total_tickets_sold": 0,
    "total_tickets_comped": 0,
    "total_gross_revenue": 0,
    "average_tickets_per_show": 0,
    "average_gross_per_show": 0,
    "sellout_count": 0
  }
}

CRITICAL REMINDERS:
- ALL FINANCIAL FIGURES require TM confirmation regardless of confidence.
- VERIFY MATH: if tier quantities x prices should equal stated gross, check it. Flag discrepancies.
- COMPS vs KILLS: comps are free tickets given away (count toward attendance). Kills are tickets removed from inventory (do not count). Do not confuse them.
- NEVER INVENT DATA. Missing fields are null.
- Return ONLY the JSON object.`;
}
