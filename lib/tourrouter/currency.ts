import { isImperialCountry } from './geography';

export interface OfferObj {
  amount: number;
  currency: string;
  display?: string;
  pending?: boolean;
}

export type RateProvider = (currency: string) => number;

export function getRate(currency: string, rates: Record<string, number>): number {
  if (currency === 'USD') return 1;
  return rates[currency] || 1;
}

export function toUSD(offerObj: OfferObj | null | undefined, rates: Record<string, number>): number {
  if (!offerObj || !offerObj.amount) return 0;
  return offerObj.amount * getRate(offerObj.currency || 'USD', rates);
}

export function fmtUSD(n: number | null | undefined): string {
  if (!n && n !== 0) return '\u2014';
  return '$' + Math.round(n).toLocaleString();
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$', CAD: 'CA$', GBP: '£', EUR: '€', AUD: 'A$',
};

export function formatOfferDisplay(amount: number | null | undefined, currency: string | null | undefined): string | null {
  if (!amount) return null;
  const rounded = Math.round(amount).toLocaleString();
  const sym = CURRENCY_SYMBOLS[(currency || 'USD').toUpperCase()];
  return sym ? `${sym}${rounded}` : `${(currency || 'USD').toUpperCase()} ${rounded}`;
}

export function fmtDist(km: number, country: string | null | undefined): string {
  if (isImperialCountry(country)) {
    return Math.round(km * 0.6214) + ' mi';
  }
  return Math.round(km) + ' km';
}
