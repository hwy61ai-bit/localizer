// Maps full state/province names to 2-letter abbreviations
// Covers US, Canada, Australia — the primary touring markets with state-based addressing

const STATE_NAME_TO_ABBR: Record<string, string> = {
  // US States
  "ALABAMA": "AL", "ALASKA": "AK", "ARIZONA": "AZ", "ARKANSAS": "AR",
  "CALIFORNIA": "CA", "COLORADO": "CO", "CONNECTICUT": "CT", "DELAWARE": "DE",
  "FLORIDA": "FL", "GEORGIA": "GA", "HAWAII": "HI", "IDAHO": "ID",
  "ILLINOIS": "IL", "INDIANA": "IN", "IOWA": "IA", "KANSAS": "KS",
  "KENTUCKY": "KY", "LOUISIANA": "LA", "MAINE": "ME", "MARYLAND": "MD",
  "MASSACHUSETTS": "MA", "MICHIGAN": "MI", "MINNESOTA": "MN", "MISSISSIPPI": "MS",
  "MISSOURI": "MO", "MONTANA": "MT", "NEBRASKA": "NE", "NEVADA": "NV",
  "NEW HAMPSHIRE": "NH", "NEW JERSEY": "NJ", "NEW MEXICO": "NM", "NEW YORK": "NY",
  "NORTH CAROLINA": "NC", "NORTH DAKOTA": "ND", "OHIO": "OH", "OKLAHOMA": "OK",
  "OREGON": "OR", "PENNSYLVANIA": "PA", "RHODE ISLAND": "RI", "SOUTH CAROLINA": "SC",
  "SOUTH DAKOTA": "SD", "TENNESSEE": "TN", "TEXAS": "TX", "UTAH": "UT",
  "VERMONT": "VT", "VIRGINIA": "VA", "WASHINGTON": "WA", "WEST VIRGINIA": "WV",
  "WISCONSIN": "WI", "WYOMING": "WY", "DISTRICT OF COLUMBIA": "DC",
  // Canadian Provinces
  "ALBERTA": "AB", "BRITISH COLUMBIA": "BC", "MANITOBA": "MB",
  "NEW BRUNSWICK": "NB", "NEWFOUNDLAND AND LABRADOR": "NL", "NEWFOUNDLAND": "NL",
  "NOVA SCOTIA": "NS", "ONTARIO": "ON", "PRINCE EDWARD ISLAND": "PE",
  "QUEBEC": "QC", "SASKATCHEWAN": "SK", "NORTHWEST TERRITORIES": "NT",
  "NUNAVUT": "NU", "YUKON": "YT",
  // Australian States/Territories
  "NEW SOUTH WALES": "NSW", "VICTORIA": "VIC", "QUEENSLAND": "QLD",
  "WESTERN AUSTRALIA": "WA", "SOUTH AUSTRALIA": "SA", "TASMANIA": "TAS",
  "AUSTRALIAN CAPITAL TERRITORY": "ACT", "NORTHERN TERRITORY": "NT",
};

const KNOWN_ABBRS = new Set(Object.values(STATE_NAME_TO_ABBR));

/**
 * Normalize a user-entered state/province string to a 2-letter abbreviation.
 * - "Texas" → "TX"
 * - "texas" → "TX"
 * - "tx" → "TX"
 * - "TX" → "TX"
 * - "XX" → "XX" (unknown but uppercased — don't discard user input)
 * - "" → ""
 */
export function normalizeState(input: string | null | undefined): string {
  if (!input) return "";
  const upper = String(input).trim().toUpperCase();
  if (!upper) return "";
  if (KNOWN_ABBRS.has(upper)) return upper;
  if (STATE_NAME_TO_ABBR[upper]) return STATE_NAME_TO_ABBR[upper];
  return upper;
}
