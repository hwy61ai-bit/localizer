/**
 * calculateShowIncome — Deal Types Calculation Engine
 *
 * The single source of truth for per-show income calculation.
 * Switch on deal.dealType to handle all deal type formulas.
 * Called by calcTourFinancials() for each show.
 *
 * Architectural rule: NEVER calculate deal income inline. Always use this function.
 *
 * Usage:
 *   import { calculateShowIncome } from '@/lib/tourrouter/calculateShowIncome';
 *   const income = calculateShowIncome(show, false, currencyRates);
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DealTerms {
  dealType: DealType;
  guarantee: number | null;
  guaranteeCurrency: string;
  percentage: number | null;       // artist percentage (e.g. 85 = 85%)
  versusBase: 'gross' | 'net' | 'adjusted_gross' | null;
  expenseCap: number | null;       // for versus_expense_cap
  promoterProfit: number | null;   // for versus_promoter_profit
  walkoutPotential: number | null;
  bonusAmount: number | null;
  bonusCondition: string | null;   // e.g. "sellout", "1500 paid"
  bonusThreshold: number | null;   // numeric trigger (e.g. 1500 tickets)
  slidingScale: SlidingScaleTier[] | null;
  slidingMode: 'blended' | 'tiered' | null;
  coHeadlinerSplit: number | null; // artist's percentage of co-headliner split
  ticketBuyoutPrice: number | null;
  ticketBuyoutCount: number | null;
  merchGuarantee: number | null;
  allInSupport: boolean;
  rawText: string | null;          // original deal language from document
  modifiers: string[];
}

export interface SlidingScaleTier {
  threshold: number;    // tickets sold or gross revenue threshold
  percentage: number;   // artist percentage at this tier
}

export interface SettlementData {
  grossTicketRevenue: number | null;
  facilityFeesTotal: number | null;
  adjustedGross: number | null;
  taxesTotal: number | null;
  taxPercentage: number | null;
  netGross: number | null;
  totalExpenses: number | null;
  promoterProfit: number | null;
  netRevenue: number | null;
  artistPayment: number | null;     // what the promoter actually paid
  artistPaymentMethod: string | null;
  ticketsSold: number | null;
  ticketsComped: number | null;
  merchGross: number | null;
  merchVenueCommission: number | null;
  merchNet: number | null;
  currency: string;
}

export interface ShowForCalc {
  offer: { amount: number; currency: string };
  deal: DealTerms | null;
  settlement: SettlementData | null;
}

export type DealType =
  | 'flat_guarantee'
  | 'versus_gross'
  | 'versus_net'
  | 'versus_adjusted_gross'
  | 'versus_expense_cap'
  | 'versus_promoter_profit'
  | 'overage_only'
  | 'straight_percentage'
  | 'door_deal'
  | 'sliding_scale'
  | 'co_headliner'
  | 'plus_one'
  | 'flat_plus_bonus'
  | 'ticket_buyout'
  | 'guarantee_plus_merch';

// ─── Main Function ──────────────────────────────────────────────────────────

/**
 * Calculate income for a single show based on deal type.
 *
 * @param show - The show with deal and optional settlement data
 * @param useActuals - true = use settlement actuals, false = use projected/deal terms
 * @param currencyRates - Exchange rates keyed by currency code (e.g. { EUR: 1.08, GBP: 1.27 })
 * @returns Income in USD
 */
export function calculateShowIncome(
  show: ShowForCalc,
  useActuals: boolean,
  currencyRates: Record<string, number>
): number {
  const deal = show.deal;
  const settlement = show.settlement;

  // If using actuals and we have a confirmed artist payment, use it directly
  if (useActuals && settlement?.artistPayment != null) {
    return toUSD(settlement.artistPayment, settlement.currency, currencyRates);
  }

  // No deal on file — fall back to the simple offer amount (legacy behavior)
  if (!deal) {
    return toUSD(show.offer.amount, show.offer.currency, currencyRates);
  }

  const guarantee = deal.guarantee ?? 0;
  const pct = (deal.percentage ?? 0) / 100; // convert 85 → 0.85
  const currency = deal.guaranteeCurrency || show.offer.currency || 'USD';

  // Get the financial waterfall numbers — from settlement if actuals, otherwise projected
  const waterfall = useActuals && settlement
    ? getActualWaterfall(settlement)
    : getProjectedWaterfall(show);

  let income: number;

  switch (deal.dealType) {
    // ── Flat Guarantee ──────────────────────────────────────────────
    case 'flat_guarantee':
      income = guarantee;
      break;

    // ── Versus Gross ────────────────────────────────────────────────
    // Guarantee vs % of gross (after taxes and fees only, NOT expenses)
    case 'versus_gross': {
      const grossBase = waterfall.netGross; // gross after taxes and fees
      const pctShare = grossBase * pct;
      income = Math.max(guarantee, pctShare);
      break;
    }

    // ── Versus Net ──────────────────────────────────────────────────
    // Guarantee vs % of net revenue (after taxes, fees, AND expenses)
    case 'versus_net': {
      const netBase = waterfall.netGross - waterfall.totalExpenses;
      const pctShare = Math.max(0, netBase) * pct;
      income = Math.max(guarantee, pctShare);
      break;
    }

    // ── Versus Adjusted Gross ───────────────────────────────────────
    // Guarantee vs % of adjusted gross (gross minus specific deductions)
    case 'versus_adjusted_gross': {
      const adjBase = waterfall.adjustedGross;
      const pctShare = adjBase * pct;
      income = Math.max(guarantee, pctShare);
      break;
    }

    // ── Versus Expense Cap ──────────────────────────────────────────
    // Like versus_net but expenses are capped at a fixed amount
    case 'versus_expense_cap': {
      const cappedExpenses = Math.min(waterfall.totalExpenses, deal.expenseCap ?? waterfall.totalExpenses);
      const netBase = waterfall.netGross - cappedExpenses;
      const pctShare = Math.max(0, netBase) * pct;
      income = Math.max(guarantee, pctShare);
      break;
    }

    // ── Versus Promoter Profit ──────────────────────────────────────
    // Net after a fixed promoter profit is taken
    case 'versus_promoter_profit': {
      const promProfit = deal.promoterProfit ?? waterfall.promoterProfit;
      const netBase = waterfall.netGross - waterfall.totalExpenses - promProfit;
      const pctShare = Math.max(0, netBase) * pct;
      income = Math.max(guarantee, pctShare);
      break;
    }

    // ── Overage Only ────────────────────────────────────────────────
    // Guarantee PLUS percentage of overage after expenses (NOT "versus")
    // Artist always gets guarantee, plus a share of anything above
    case 'overage_only': {
      const netRevenue = waterfall.netGross - waterfall.totalExpenses;
      const overage = Math.max(0, netRevenue - guarantee);
      income = guarantee + (overage * pct);
      break;
    }

    // ── Straight Percentage ─────────────────────────────────────────
    // No guarantee, just a percentage of gross or net
    case 'straight_percentage': {
      const base = deal.versusBase === 'net'
        ? Math.max(0, waterfall.netGross - waterfall.totalExpenses)
        : waterfall.netGross; // default to gross
      income = base * pct;
      break;
    }

    // ── Door Deal ───────────────────────────────────────────────────
    // Percentage of actual door/walk-up revenue
    case 'door_deal': {
      // Door revenue is typically a subset of gross — if settlement has it, use it
      // Otherwise fall back to gross as approximation
      const doorRevenue = waterfall.grossTicketRevenue;
      income = doorRevenue * pct;
      break;
    }

    // ── Sliding Scale ───────────────────────────────────────────────
    // Percentage changes at different thresholds
    case 'sliding_scale': {
      if (!deal.slidingScale || deal.slidingScale.length === 0) {
        // No scale defined — fall back to guarantee
        income = guarantee;
        break;
      }

      const ticketsSold = waterfall.ticketsSold;
      const baseForCalc = deal.versusBase === 'net'
        ? Math.max(0, waterfall.netGross - waterfall.totalExpenses)
        : waterfall.netGross;

      if (deal.slidingMode === 'tiered') {
        // Tiered: each tier's percentage applies only to tickets within that tier's range
        income = calcTieredSlidingScale(deal.slidingScale, ticketsSold, baseForCalc, waterfall.grossTicketRevenue);
      } else {
        // Blended (default): the highest reached tier's percentage applies to ALL revenue
        income = calcBlendedSlidingScale(deal.slidingScale, ticketsSold, baseForCalc);
      }

      income = Math.max(guarantee, income);
      break;
    }

    // ── Co-Headliner ────────────────────────────────────────────────
    // Artist's share of a co-headliner split (stored per show, rule #13)
    case 'co_headliner': {
      const splitPct = (deal.coHeadlinerSplit ?? 50) / 100;
      const netRevenue = Math.max(0, waterfall.netGross - waterfall.totalExpenses);
      income = netRevenue * splitPct;
      // If there's also a guarantee floor
      if (guarantee > 0) {
        income = Math.max(guarantee, income);
      }
      break;
    }

    // ── Plus One ────────────────────────────────────────────────────
    // Base deal plus additional payment at a threshold
    case 'plus_one': {
      income = guarantee;
      if (deal.bonusAmount && deal.bonusThreshold) {
        const ticketsSold = waterfall.ticketsSold;
        if (ticketsSold >= deal.bonusThreshold) {
          income += deal.bonusAmount;
        }
      }
      break;
    }

    // ── Flat Plus Bonus ─────────────────────────────────────────────
    // Flat guarantee plus conditional bonus (e.g. bonus at sellout)
    case 'flat_plus_bonus': {
      income = guarantee;
      if (deal.bonusAmount) {
        const ticketsSold = waterfall.ticketsSold;
        const threshold = deal.bonusThreshold ?? waterfall.totalCapacity;
        if (ticketsSold >= threshold) {
          income += deal.bonusAmount;
        }
      }
      break;
    }

    // ── Ticket Buyout ───────────────────────────────────────────────
    // Fixed price per ticket for a guaranteed count
    case 'ticket_buyout': {
      const pricePerTicket = deal.ticketBuyoutPrice ?? 0;
      const count = deal.ticketBuyoutCount ?? 0;
      income = pricePerTicket * count;
      break;
    }

    // ── Guarantee Plus Merch ────────────────────────────────────────
    // Flat guarantee plus a guaranteed merch minimum
    case 'guarantee_plus_merch': {
      income = guarantee + (deal.merchGuarantee ?? 0);
      break;
    }

    default:
      // Unknown deal type — fall back to guarantee or offer
      income = guarantee || show.offer.amount;
      break;
  }

  return toUSD(income, currency, currencyRates);
}

// ─── Settlement Verification ────────────────────────────────────────────────

export interface VerificationResult {
  dealMatchesSettlement: boolean;
  expectedArtistPayment: number;
  actualArtistPayment: number;
  difference: number;
  percentageDifference: number;
  grossMathChecks: boolean;
  expenseOverages: Array<{ category: string; budgeted: number; actual: number; overage: number }>;
  discrepancies: string[];
}

/**
 * Compare settlement numbers against what the deal formula should produce.
 * Returns a verification result with flagged discrepancies.
 */
export function verifySettlement(
  show: ShowForCalc,
  currencyRates: Record<string, number>
): VerificationResult | null {
  if (!show.deal || !show.settlement) return null;

  const projected = calculateShowIncome(show, false, currencyRates);
  const actual = show.settlement.artistPayment ?? 0;
  const currency = show.settlement.currency || 'USD';
  const actualUSD = toUSD(actual, currency, currencyRates);
  const diff = actualUSD - projected;

  const discrepancies: string[] = [];

  if (Math.abs(diff) > 1) {
    discrepancies.push(
      `Artist payment differs from deal formula: expected $${projected.toFixed(2)}, got $${actualUSD.toFixed(2)} (diff: $${diff.toFixed(2)})`
    );
  }

  // Verify gross math: does tickets_sold x price = stated gross?
  let grossMathChecks = true;
  if (show.settlement.grossTicketRevenue != null && show.settlement.ticketsSold != null) {
    // This is a rough check — exact verification needs per-tier data
    // Just flag if the gross seems wildly off from expected
    const statedGross = show.settlement.grossTicketRevenue;
    if (statedGross === 0 && show.settlement.ticketsSold > 0) {
      grossMathChecks = false;
      discrepancies.push('Gross ticket revenue is $0 but tickets were sold');
    }
  }

  return {
    dealMatchesSettlement: discrepancies.length === 0,
    expectedArtistPayment: projected,
    actualArtistPayment: actualUSD,
    difference: diff,
    percentageDifference: projected > 0 ? (diff / projected) * 100 : 0,
    grossMathChecks,
    expenseOverages: [], // populated by caller with per-expense comparison
    discrepancies,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

interface WaterfallNumbers {
  grossTicketRevenue: number;
  facilityFees: number;
  adjustedGross: number;
  taxes: number;
  netGross: number;
  totalExpenses: number;
  promoterProfit: number;
  netRevenue: number;
  ticketsSold: number;
  totalCapacity: number;
}

function getActualWaterfall(s: SettlementData): WaterfallNumbers {
  const gross = s.grossTicketRevenue ?? 0;
  const ff = s.facilityFeesTotal ?? 0;
  const adj = s.adjustedGross ?? (gross - ff);
  const tax = s.taxesTotal ?? 0;
  const netGross = s.netGross ?? (adj - tax);
  const exp = s.totalExpenses ?? 0;
  const pp = s.promoterProfit ?? 0;
  const net = s.netRevenue ?? (netGross - exp - pp);

  return {
    grossTicketRevenue: gross,
    facilityFees: ff,
    adjustedGross: adj,
    taxes: tax,
    netGross,
    totalExpenses: exp,
    promoterProfit: pp,
    netRevenue: net,
    ticketsSold: s.ticketsSold ?? 0,
    totalCapacity: 0, // not available in settlement data
  };
}

function getProjectedWaterfall(show: ShowForCalc): WaterfallNumbers {
  // For projected mode, we only have the guarantee/offer.
  // Versus deals can't produce a projected backend amount without ticket sales data.
  // Return zeros for waterfall numbers — projected income falls back to guarantee.
  return {
    grossTicketRevenue: 0,
    facilityFees: 0,
    adjustedGross: 0,
    taxes: 0,
    netGross: 0,
    totalExpenses: 0,
    promoterProfit: 0,
    netRevenue: 0,
    ticketsSold: 0,
    totalCapacity: 0,
  };
}

function calcBlendedSlidingScale(
  tiers: SlidingScaleTier[],
  ticketsSold: number,
  revenueBase: number
): number {
  // Sort tiers by threshold ascending
  const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold);

  // Find the highest tier where ticketsSold >= threshold
  let applicablePct = sorted[0]?.percentage ?? 0;
  for (const tier of sorted) {
    if (ticketsSold >= tier.threshold) {
      applicablePct = tier.percentage;
    }
  }

  return revenueBase * (applicablePct / 100);
}

function calcTieredSlidingScale(
  tiers: SlidingScaleTier[],
  ticketsSold: number,
  revenueBase: number,
  grossRevenue: number
): number {
  // Sort tiers by threshold ascending
  const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold);

  if (sorted.length === 0 || grossRevenue === 0) return 0;

  // Calculate per-ticket revenue for proportional allocation
  const revenuePerTicket = ticketsSold > 0 ? revenueBase / ticketsSold : 0;
  let totalIncome = 0;
  let previousThreshold = 0;

  for (let i = 0; i < sorted.length; i++) {
    const tier = sorted[i];
    const nextThreshold = i < sorted.length - 1 ? sorted[i + 1].threshold : Infinity;
    const ticketsInTier = Math.min(ticketsSold, nextThreshold) - previousThreshold;

    if (ticketsInTier <= 0) break;

    const tierRevenue = ticketsInTier * revenuePerTicket;
    totalIncome += tierRevenue * (tier.percentage / 100);
    previousThreshold = Math.min(ticketsSold, nextThreshold);

    if (previousThreshold >= ticketsSold) break;
  }

  return totalIncome;
}

function toUSD(
  amount: number,
  currency: string,
  rates: Record<string, number>
): number {
  if (!currency || currency === 'USD') return amount;
  const rate = rates[currency];
  if (!rate) return amount; // no rate available — return as-is
  return amount * rate;
}
