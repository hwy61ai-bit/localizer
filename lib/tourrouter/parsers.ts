export function parseDate(str: string | number | Date | null | undefined): Date | null {
  if (!str) return null;
  str = String(str).trim();
  // YYYY-MM-DD (from Excel cellDates)
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  // DD/MM/YYYY or DD-MM-YYYY
  if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(str)) {
    const parts = str.split(/[\/\-]/);
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  // DD-MM-YY
  if (/^\d{2}-\d{2}-\d{2}$/.test(str)) {
    const [d, m, y] = str.split('-').map(Number);
    return new Date(2000 + y, m - 1, d);
  }
  // "Sat, 07 Feb 2026" or similar
  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  const m2 = str.match(/(\d{1,2})\s+([a-z]{3})\s+(\d{4})/i);
  if (m2) return new Date(parseInt(m2[3]), months[m2[2].toLowerCase()], parseInt(m2[1]));
  // MM/DD/YYYY (US format)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [m, d, y] = str.split('/').map(Number);
    return new Date(y, m - 1, d);
  }
  return null;
}

export interface ParsedOffer {
  amount: number;
  currency: string;
  display: string;
  pending: boolean;
}

export function parseOffer(str: string | number | null | undefined, countryHint?: string | null): ParsedOffer {
  if (!str && str !== 0) return { amount: 0, currency: 'USD', display: '\u2014', pending: false };
  str = String(str).trim();
  let pending = false;
  if (str.toLowerCase().includes('tbd') || str.toLowerCase().includes('pending')) pending = true;

  let currency = 'USD';
  // Detect currency code
  const codeMatch = str.match(/\b(USD|EUR|GBP|CAD|AUD|CHF|DKK|NOK|SEK|PLN|CZK|HUF|MXN)\b/i);
  if (codeMatch) currency = codeMatch[1].toUpperCase();
  else if (str.includes('\u20ac')) currency = 'EUR';
  else if (str.includes('\u00a3')) currency = 'GBP';
  else if (str.startsWith('C$')) currency = 'CAD';
  else if (countryHint) {
    const ch = countryHint.toLowerCase();
    if (ch.includes('uk') || ch.includes('england') || ch.includes('scotland')) currency = 'GBP';
    else if (ch.includes('canada')) currency = 'CAD';
    else if (ch.includes('germany') || ch.includes('france') || ch.includes('spain') ||
             ch.includes('italy') || ch.includes('netherlands') || ch.includes('austria')) currency = 'EUR';
  }

  // Extract number - handle European comma-as-decimal vs US comma-as-thousands
  const numStr = str.replace(/[^0-9.,]/g, '');
  let amount = 0;
  if (numStr) {
    // If has period after comma, it's European decimal: 3.500 = 3500
    if (numStr.includes('.') && !numStr.includes(',')) {
      amount = parseFloat(numStr.replace(/\./g, '')) || 0;
      if (amount < 100 && numStr.includes('.')) amount = parseFloat(numStr);
    } else {
      amount = parseFloat(numStr.replace(/,/g, '')) || 0;
    }
  }

  return { amount, currency, display: str, pending };
}

export function cellStr(val: unknown): string {
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(val === null || val === undefined ? '' : val).trim();
}

export function normalizeCountry(str: string | null | undefined): string {
  if (!str) return '';
  const s = str.toLowerCase().trim();
  if (s.includes('usa') || s.includes('united states') || s === 'us' || s === 'u.s.' || s === 'u.s.a.') return 'usa';
  if (s.includes('uk') || s.includes('united kingdom') || s.includes('england') || s.includes('scotland') || s.includes('wales')) return 'uk';
  if (s.includes('canada') || s === 'ca') return 'canada';
  if (s.includes('germany') || s === 'de') return 'germany';
  if (s.includes('france') || s === 'fr') return 'france';
  if (s.includes('netherlands') || s.includes('holland') || s === 'nl') return 'netherlands';
  if (s.includes('australia') || s === 'au') return 'australia';
  return s;
}
