/**
 * Contact List Prompt — CONTACT_LIST_PROMPT
 *
 * Parses personnel lists, tour contact sheets, crew lists, and immigration documents.
 * Known formats: Love Police personnel list, CAA show details contacts, Wasserman contact sheet.
 *
 * Usage:
 *   import { buildContactListPrompt } from '@/lib/tourrouter/prompts/contactListPrompt';
 *   const prompt = buildContactListPrompt({ tourId });
 */

interface ContactListPromptContext {
  tourId: string;
  existingRoster?: Array<{
    name: string;
    role: string;
  }>;
}

export function buildContactListPrompt(context: ContactListPromptContext): string {
  const rosterList = context.existingRoster?.length
    ? `\n\nEXISTING TOUR ROSTER (match incoming contacts against these):\n${context.existingRoster
        .map((r) => `- ${r.name} | ${r.role}`)
        .join('\n')}`
    : '';

  return `You are parsing a contact list, personnel list, crew roster, or tour party document for a touring music act. Extract all contacts and return them as a single JSON object.

These documents come in many formats: spreadsheets, PDFs, emails, and even immigration-format personnel manifests.

IMPORTANT RULES:
1. Return ONLY valid JSON. No markdown fences, no preamble, no explanation.
2. If a field is not found for a contact, set it to null — never guess or infer.
3. All dates must be ISO format: "YYYY-MM-DD".
4. Extract EVERY person listed, even if you only have a name and no other details.

DOCUMENT TYPES:

  "tour_party_list" — Full touring party manifest.
    Names, roles, and often passport/immigration details (nationality, passport number, DOB).
    Immigration format with columns for each field.

  "production_contacts" — Show-specific production contact list.
    Venue staff, promoter contacts, local crew leads.
    One show or multi-show.

  "tour_contacts" — Business contacts for the tour.
    Agent, manager, business manager, attorney, label, publicist.

  "crew_list" — Band and crew roster with roles.
    May include per diem info, pay tier, travel arrangements.

  "support_act_contacts" — Contact sheet for a support act.
    Support act TM, agent, band members.

  "other" — Any unrecognized contact document.

EXISTING ROSTER:
${rosterList}

If incoming contacts match existing roster members by name, flag the match so the TM can merge or update.

ROLE NORMALIZATION:
Normalize role titles to these standard values when possible:
  "artist" — performing artist / band member
  "tour_manager" or "TM" — tour manager
  "production_manager" or "PM" — production manager
  "front_of_house" or "FOH" — FOH engineer
  "monitor_engineer" or "MON" — monitor engineer
  "lighting_director" or "LD" — lighting director
  "guitar_tech" — guitar technician
  "drum_tech" — drum technician
  "bass_tech" — bass technician
  "backline_tech" — backline technician
  "merch" — merchandise manager
  "road_manager" — road manager
  "driver" — bus/van driver
  "security" — personal security
  "booking_agent" — booking agent
  "manager" — artist manager
  "business_manager" — business manager
  "attorney" — entertainment attorney
  "publicist" — publicist / PR
  "label_rep" — record label representative
  "promoter" — show promoter
  "venue_pm" — venue production manager
  "venue_gm" — venue general manager

  If the role does not match any of the above, keep the original text.

RETURN THIS EXACT JSON STRUCTURE:
{
  "document_type": "tour_party_list | production_contacts | tour_contacts | crew_list | support_act_contacts | other",
  "artist_name": "string or null",
  "tour_name": "string or null",
  "document_date": "YYYY-MM-DD or null",

  "contacts": [
    {
      "name": "string",
      "role": "string or null",
      "role_normalized": "string or null",
      "company": "string or null",
      "email": "string or null",
      "phone": "string or null",
      "cell_phone": "string or null",
      "nationality": "string or null",
      "passport_number": "string or null",
      "date_of_birth": "YYYY-MM-DD or null",
      "emergency_contact": "string or null",
      "emergency_phone": "string or null",
      "notes": "string or null",
      "matches_existing_roster": null
    }
  ],

  "total_contacts": 0,

  "confidence": {
    "names": 0.0,
    "roles": 0.0,
    "contact_info": 0.0,
    "immigration_data": 0.0
  },

  "warnings": []
}

CRITICAL REMINDERS:
- PASSPORT NUMBERS and DATES OF BIRTH are sensitive PII. Extract them if present but flag in warnings that they contain sensitive data.
- DUPLICATE DETECTION: if the same person appears multiple times with different roles (e.g. "FOH Engineer" on one line and "Audio" on another), merge into one contact with the most specific role.
- PHONE NUMBER FORMATTING: preserve international format if present (e.g. +44, +61). Do not strip country codes.
- NEVER INVENT DATA. Missing fields are null.
- Return ONLY the JSON object.`;
}
