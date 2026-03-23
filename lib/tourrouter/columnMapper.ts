export const FIELD_ALIASES: Record<string, string[]> = {
  date: ['date', 'show date', 'show_date', 'event date', 'date of show', 'day'],
  event: ['event', 'show', 'event name', 'show name', 'artist', 'act', 'band', 'name'],
  city: ['city', 'market', 'location', 'town', 'venue city', 'show city'],
  country: ['country', 'nation', 'territory', 'country/region'],
  offer: ['offer', 'guarantee', 'fee', 'deal', 'gig fee', 'price', 'amount', 'income'],
  venue: ['venue', 'venue name', 'club', 'theater', 'theatre', 'hall', 'room'],
  capacity: ['capacity', 'cap', 'venue cap', 'max capacity', 'cap.'],
  status: ['status', 'confirmed', 'deal status', 'booking status'],
  doors: ['doors', 'door time', 'doors open'],
  showtime: ['showtime', 'show time', 'set time', 'start time'],
  onstage: ['onstage', 'on stage', 'stage time', 'performance time'],
  curfew: ['curfew', 'end time', 'finish'],
  promoter: ['promoter', 'buyer', 'promoter name', 'presented by'],
  notes: ['notes', 'comments', 'memo', 'details', 'info'],
  backend: ['backend', 'back end', 'percentage', 'vs', 'versus', 'deal terms'],
  support: ['support', 'opener', 'opening act', 'support act'],
  merch: ['merch', 'merchandise', 'merch %', 'merch deal', 'merch split'],
};

export interface MapperField {
  key: string;
  label: string;
  required: boolean;
}

export const MAPPER_FIELDS: MapperField[] = [
  { key: 'date', label: 'Date', required: true },
  { key: 'event', label: 'Event / Show Name', required: true },
  { key: 'city', label: 'City', required: true },
  { key: 'country', label: 'Country', required: true },
  { key: 'offer', label: 'Offer / Guarantee', required: true },
  { key: 'venue', label: 'Venue', required: false },
  { key: 'capacity', label: 'Capacity', required: false },
  { key: 'status', label: 'Status', required: false },
  { key: 'doors', label: 'Doors', required: false },
  { key: 'showtime', label: 'Showtime', required: false },
  { key: 'onstage', label: 'Onstage', required: false },
  { key: 'curfew', label: 'Curfew', required: false },
  { key: 'promoter', label: 'Promoter', required: false },
  { key: 'merch', label: 'Merch Deal', required: false },
  { key: 'backend', label: 'Backend / Deal Terms', required: false },
  { key: 'notes', label: 'Notes', required: false },
];

export function bestGuess(field: string, hdrs: string[], usedCols: Set<string>): string {
  const aliases = FIELD_ALIASES[field] || [field];
  // Exact match first
  for (const alias of aliases) {
    const idx = hdrs.findIndex(h => h.toLowerCase().trim() === alias.toLowerCase() && !usedCols.has(h));
    if (idx >= 0) return hdrs[idx];
  }
  // Partial match
  for (const alias of aliases) {
    const idx = hdrs.findIndex(h => h.toLowerCase().trim().includes(alias.toLowerCase()) && !usedCols.has(h));
    if (idx >= 0) return hdrs[idx];
  }
  return '';
}

export function autoMapHeaders(hdrs: string[]): Record<string, string> {
  const usedCols = new Set<string>();
  const guesses: Record<string, string> = {};
  for (const f of MAPPER_FIELDS) {
    const g = bestGuess(f.key, hdrs, usedCols);
    guesses[f.key] = g;
    if (g) usedCols.add(g);
  }
  return guesses;
}
