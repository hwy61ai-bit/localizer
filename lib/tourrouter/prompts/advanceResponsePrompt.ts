/**
 * Advance Response Prompt — ADVANCE_RESPONSE_PROMPT
 *
 * Parses venue advance responses — questionnaires, tech specs, and production info
 * sent by venues in response to the advance request.
 * Known formats: Beer City Music Hall questionnaire, venue tech packs, production advance sheets.
 *
 * Usage:
 *   import { buildAdvanceResponsePrompt } from '@/lib/tourrouter/prompts/advanceResponsePrompt';
 *   const prompt = buildAdvanceResponsePrompt({ tourId, existingShows });
 */

interface AdvanceResponsePromptContext {
  tourId: string;
  existingShows?: Array<{
    id: string;
    date: string;
    venue: string;
    city: string;
    state: string;
  }>;
}

export function buildAdvanceResponsePrompt(context: AdvanceResponsePromptContext): string {
  const showList = context.existingShows?.length
    ? `\n\nEXISTING SHOWS IN THIS TOUR (match venue to show):\n${context.existingShows
        .map((s) => `- ${s.date} | ${s.venue} | ${s.city}, ${s.state} | id: ${s.id}`)
        .join('\n')}`
    : '';

  return `You are parsing a venue advance response document for a touring music act. This is information provided by the venue or promoter in preparation for an upcoming show — stage specs, load-in details, hospitality info, parking, local contacts, and logistics.

These documents vary enormously: structured questionnaires, multi-page tech packs, single-page info sheets, or email replies with answers inline.

IMPORTANT RULES:
1. Return ONLY valid JSON. No markdown fences, no preamble, no explanation.
2. If a field is not found, set it to null — never guess or infer.
3. Times should be in "HH:MM" 24-hour format.
4. Dimensions should be extracted as strings preserving the original format (e.g. "44'w x 29'd x 4'h").

DOCUMENT TYPES:

  "venue_advance_questionnaire" — Filled-in advance questionnaire.
    Structured Q&A format. Covers schedule, hospitality, parking, merch, settlement, WiFi, hotel info.

  "venue_tech_pack" — Full venue technical specification package.
    Multi-page document covering stage dimensions, audio system, lighting rig, rigging, power,
    backstage layout, parking/load-in maps, crew info, house rules.

  "production_advance" — Production-specific advance from a larger show.
    Day schedule, labor call, production grid, tour contacts, meal counts.
    Arena/amphitheater level.

  "venue_info_sheet" — Single-page venue information summary.
    Capacity, address, contacts, basic production specs.

  "email_response" — Freeform email with advance info inline.
    Unstructured text. Extract what you can.

  "other" — Any unrecognized format.

SHOW MATCHING:
${showList}

Match by venue name + city. If the document mentions a specific show date, use that for confirmation.

RETURN THIS EXACT JSON STRUCTURE:
{
  "document_type": "venue_advance_questionnaire | venue_tech_pack | production_advance | venue_info_sheet | email_response | other",
  "matchedShowId": "uuid or null",
  "matchedShowConfidence": 0.0,

  "venue": {
    "name": "string",
    "address": "string or null",
    "city": "string or null",
    "state": "string or null",
    "country": "string or null",
    "capacity": null,
    "website": "string or null",
    "phone": "string or null",
    "age_restriction": "all_ages | 18+ | 21+ | null",
    "venue_type": "club | theater | ballroom | arena | amphitheater | festival | other | null"
  },

  "contacts": [
    {
      "name": "string",
      "role": "string",
      "phone": "string or null",
      "email": "string or null"
    }
  ],

  "schedule": {
    "load_in_time": "HH:MM or null",
    "soundcheck_time": "HH:MM or null",
    "doors_time": "HH:MM or null",
    "support_set_time": "HH:MM or null",
    "headliner_set_time": "HH:MM or null",
    "curfew": "HH:MM or null",
    "load_out_time": "HH:MM or null"
  },

  "stage": {
    "dimensions": "string or null",
    "width": "string or null",
    "depth": "string or null",
    "height": "string or null",
    "trim_height": "string or null",
    "wing_space": "string or null",
    "barricade": null,
    "barricade_type": "string or null",
    "risers_available": "string or null"
  },

  "production": {
    "foh_console": "string or null",
    "monitor_console": "string or null",
    "pa_system": "string or null",
    "monitor_wedges": "string or null",
    "lighting_console": "string or null",
    "lighting_fixtures": "string or null",
    "follow_spots": null,
    "video_wall": "string or null",
    "backline_available": "string or null",
    "hazer": "string or null"
  },

  "power": {
    "lighting_service": "string or null",
    "audio_service": "string or null",
    "phase_type": "single | three | null",
    "shore_power": "string or null",
    "generator_needed": null
  },

  "load_in": {
    "dock_type": "string or null",
    "push_distance": "string or null",
    "door_dimensions": "string or null",
    "ramp_available": null,
    "forklift_available": null,
    "forklift_capacity": "string or null",
    "directions": "string or null"
  },

  "parking": {
    "bus_parking": "string or null",
    "truck_parking": "string or null",
    "shore_power_connections": null,
    "water_lines": null,
    "overnight_allowed": null,
    "notes": "string or null"
  },

  "backstage": {
    "dressing_rooms": null,
    "showers": null,
    "laundry": null,
    "towels": "string or null",
    "production_office": null,
    "catering": "string or null",
    "green_room": null,
    "wifi_network": "string or null",
    "wifi_password": "string or null",
    "wired_internet": "string or null"
  },

  "crew": {
    "union_house": null,
    "house_crew": "string or null",
    "stagehands_available": null,
    "stagehand_minimum_hours": null,
    "riggers_available": null,
    "spotlight_operators": null,
    "runners_available": null,
    "runner_hours": "string or null"
  },

  "merch": {
    "who_sells": "artist_sells | venue_sells | null",
    "venue_rate": null,
    "merch_location": "string or null",
    "seller_provided": null,
    "seller_cost": null,
    "notes": "string or null"
  },

  "settlement_info": {
    "settlement_contact": "string or null",
    "cash_needs_advance_days": null,
    "settlement_notes": "string or null"
  },

  "hotel_info": {
    "venue_hotel_deal": null,
    "recommended_hotels": [
      {
        "name": "string",
        "distance": "string or null",
        "rate": null,
        "notes": "string or null"
      }
    ]
  },

  "house_rules": "string or null",
  "special_notes": "string or null",

  "confidence": {
    "venue_name": 0.0,
    "contacts": 0.0,
    "schedule": 0.0,
    "stage": 0.0,
    "production": 0.0,
    "parking": 0.0,
    "backstage": 0.0,
    "merch": 0.0
  },

  "warnings": []
}

CRITICAL REMINDERS:
- VENUE TECH PACKS are dense. Extract the most operationally relevant data — stage dimensions, console models, power specs, parking, load-in, contacts, WiFi. Skip exhaustive fixture lists unless specifically useful.
- CONTACTS are high value. Every name, role, phone, and email in the document should be captured.
- WIFI CREDENTIALS: capture network name and password — touring crews need these immediately.
- PARKING DETAILS: shore power count, bus/truck capacity, and overnight rules are critical for tour logistics.
- NEVER INVENT DATA. Missing fields are null.
- Return ONLY the JSON object.`;
}
