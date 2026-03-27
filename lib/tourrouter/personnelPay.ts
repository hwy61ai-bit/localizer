/**
 * Personnel Pay Engine — calculatePersonnelCosts
 *
 * Handles 8 stacked pay component types per roster member:
 *   per_show, per_week, per_day, flat_tour, per_diem, pct_merch, pct_net, base_bonus
 *
 * 4 day types: show_day, off_day, travel_day, load_in_day
 *   - Travel day: off day where drive time > 4 hours
 *   - Load-in day: marked explicitly on tour_shows.is_load_in
 *
 * pct_net circular dependency (rule #20):
 *   1. Calculate net income EXCLUDING all pct_net components
 *   2. Compute pct_net components using that net income
 *   3. Subtract them to get final net
 *
 * Usage:
 *   import { calculatePersonnelCosts } from '@/lib/tourrouter/personnelPay';
 *   const result = calculatePersonnelCosts(roster, tourStats, currencyRates);
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type PayComponentType =
  | 'per_show'    // paid per show day
  | 'per_week'    // paid per calendar week on tour
  | 'per_day'     // paid every day (show + off + travel + load-in)
  | 'flat_tour'   // one-time flat amount for the entire tour
  | 'per_diem'    // daily allowance (separate from base pay)
  | 'pct_merch'   // percentage of merch revenue
  | 'pct_net'     // percentage of net tour income (CIRCULAR — handled specially)
  | 'base_bonus'; // base amount + bonus if conditions met

export type DayType = 'show_day' | 'off_day' | 'travel_day' | 'load_in_day';

export interface PayComponent {
  type: PayComponentType;
  amount: number;           // dollar amount or percentage (for pct_ types)
  currency: string;         // default 'USD'
  appliesTo: DayType[];     // which day types this component applies to
  bonusCondition?: string;  // for base_bonus: 'sellout', 'per_show_threshold', etc.
  bonusThreshold?: number;  // numeric threshold for bonus
  bonusAmount?: number;     // bonus payout amount
  notes?: string;
}

export interface RosterMember {
  id: string;
  name: string;
  role: string;
  roleCategory: 'band' | 'crew';
  payComponents: PayComponent[];
  isActive: boolean;         // inactive members don't accrue pay
}

export interface TourDayInfo {
  date: string;              // YYYY-MM-DD
  dayType: DayType;
  showId?: string;
  driveHours?: number;       // for determining travel_day vs off_day
  ticketsSold?: number;      // for bonus conditions
  isSellout?: boolean;
}

export interface TourStats {
  days: TourDayInfo[];
  showDayCount: number;
  offDayCount: number;
  travelDayCount: number;
  loadInDayCount: number;
  totalDayCount: number;
  weekCount: number;
  zeroShowWeeks: number;     // weeks with no shows (some per_week contracts exclude these)
  totalMerchGross: number;   // for pct_merch calculation
  totalMerchNet: number;
  netTourIncome: number;     // gross income minus non-personnel expenses (for pct_net)
}

// ─── Results ─────────────────────────────────────────────────────────────────

export interface PersonnelCostResult {
  totalPersonnelCost: number;       // all personnel, all components, USD
  totalBandCost: number;
  totalCrewCost: number;
  totalPerDiems: number;            // per_diem components only
  totalPctNetCost: number;          // pct_net components only (separated for circular dep)
  members: MemberCostBreakdown[];
  netAfterPersonnel: number;        // netTourIncome minus totalPersonnelCost
}

export interface MemberCostBreakdown {
  memberId: string;
  memberName: string;
  role: string;
  roleCategory: 'band' | 'crew';
  components: ComponentCostDetail[];
  totalCost: number;                // sum of all components for this member
  perDiemTotal: number;             // per_diem component only
}

export interface ComponentCostDetail {
  type: PayComponentType;
  label: string;
  baseCost: number;                 // before currency conversion
  costUSD: number;                  // after currency conversion
  daysApplied: number;              // how many days this applied to
  calculation: string;              // human-readable: "12 show days × $250/day = $3,000"
}

// ─── Main Function ──────────────────────────────────────────────────────────

/**
 * Calculate all personnel costs for a tour.
 *
 * Handles pct_net circular dependency:
 *   1. First pass: calculate all non-pct_net costs
 *   2. Compute pct_net using (netTourIncome - nonPctNetCosts)
 *   3. Return total including pct_net
 *
 * @param roster - All roster members with their pay components
 * @param stats - Tour statistics (day counts, income, merch)
 * @param currencyRates - Exchange rates keyed by currency code
 * @returns Complete personnel cost breakdown
 */
export function calculatePersonnelCosts(
  roster: RosterMember[],
  stats: TourStats,
  currencyRates: Record<string, number>
): PersonnelCostResult {
  const activeRoster = roster.filter((m) => m.isActive);

  // ── Pass 1: Calculate all non-pct_net costs ─────────────────────────────
  const pass1Members: MemberCostBreakdown[] = activeRoster.map((member) =>
    calculateMemberCosts(member, stats, currencyRates, false)
  );

  const nonPctNetTotal = pass1Members.reduce((sum, m) => sum + m.totalCost, 0);

  // ── Pass 2: Calculate pct_net using adjusted net ────────────────────────
  // Net for pct_net = netTourIncome - all non-pct_net personnel costs
  const netForPctNet = Math.max(0, stats.netTourIncome - nonPctNetTotal);

  const adjustedStats: TourStats = {
    ...stats,
    netTourIncome: netForPctNet,
  };

  const pass2Members: MemberCostBreakdown[] = activeRoster.map((member) =>
    calculateMemberCosts(member, adjustedStats, currencyRates, true)
  );

  // ── Merge results ──────────────────────────────────────────────────────
  const finalMembers: MemberCostBreakdown[] = activeRoster.map((member, i) => {
    const p1 = pass1Members[i];
    const p2 = pass2Members[i];

    // Merge: non-pct_net from pass 1, pct_net from pass 2
    const nonPctComponents = p1.components.filter((c) => c.type !== 'pct_net');
    const pctNetComponents = p2.components.filter((c) => c.type === 'pct_net');
    const allComponents = [...nonPctComponents, ...pctNetComponents];

    const totalCost = allComponents.reduce((sum, c) => sum + c.costUSD, 0);

    return {
      memberId: member.id,
      memberName: member.name,
      role: member.role,
      roleCategory: member.roleCategory,
      components: allComponents,
      totalCost,
      perDiemTotal: allComponents
        .filter((c) => c.type === 'per_diem')
        .reduce((sum, c) => sum + c.costUSD, 0),
    };
  });

  const totalPersonnelCost = finalMembers.reduce((sum, m) => sum + m.totalCost, 0);
  const totalBandCost = finalMembers
    .filter((m) => m.roleCategory === 'band')
    .reduce((sum, m) => sum + m.totalCost, 0);
  const totalCrewCost = finalMembers
    .filter((m) => m.roleCategory === 'crew')
    .reduce((sum, m) => sum + m.totalCost, 0);
  const totalPerDiems = finalMembers.reduce((sum, m) => sum + m.perDiemTotal, 0);
  const totalPctNetCost = finalMembers.reduce(
    (sum, m) =>
      sum +
      m.components
        .filter((c) => c.type === 'pct_net')
        .reduce((s, c) => s + c.costUSD, 0),
    0
  );

  return {
    totalPersonnelCost,
    totalBandCost,
    totalCrewCost,
    totalPerDiems,
    totalPctNetCost,
    members: finalMembers,
    netAfterPersonnel: stats.netTourIncome - totalPersonnelCost,
  };
}

// ─── Per-Member Calculation ─────────────────────────────────────────────────

function calculateMemberCosts(
  member: RosterMember,
  stats: TourStats,
  rates: Record<string, number>,
  pctNetOnly: boolean
): MemberCostBreakdown {
  const components: ComponentCostDetail[] = [];

  for (const comp of member.payComponents) {
    // In pass 1, skip pct_net. In pass 2, only do pct_net.
    if (pctNetOnly && comp.type !== 'pct_net') continue;
    if (!pctNetOnly && comp.type === 'pct_net') continue;

    const detail = calculateComponent(comp, stats, rates);
    if (detail) {
      components.push(detail);
    }
  }

  const totalCost = components.reduce((sum, c) => sum + c.costUSD, 0);
  const perDiemTotal = components
    .filter((c) => c.type === 'per_diem')
    .reduce((sum, c) => sum + c.costUSD, 0);

  return {
    memberId: member.id,
    memberName: member.name,
    role: member.role,
    roleCategory: member.roleCategory,
    components,
    totalCost,
    perDiemTotal,
  };
}

// ─── Component Calculators ──────────────────────────────────────────────────

function calculateComponent(
  comp: PayComponent,
  stats: TourStats,
  rates: Record<string, number>
): ComponentCostDetail | null {
  const toUSD = (amount: number, currency: string) => {
    if (!currency || currency === 'USD') return amount;
    const rate = rates[currency];
    return rate ? amount * rate : amount;
  };

  switch (comp.type) {
    // ── Per Show ────────────────────────────────────────────────
    case 'per_show': {
      const days = countApplicableDays(comp.appliesTo, stats);
      const base = comp.amount * days;
      return {
        type: 'per_show',
        label: 'Per Show',
        baseCost: base,
        costUSD: toUSD(base, comp.currency),
        daysApplied: days,
        calculation: `${days} show day${days !== 1 ? 's' : ''} \u00D7 ${fmtCurrency(comp.amount, comp.currency)} = ${fmtCurrency(base, comp.currency)}`,
      };
    }

    // ── Per Week ────────────────────────────────────────────────
    case 'per_week': {
      // Some contracts exclude zero-show weeks
      const weeks = stats.weekCount;
      const base = comp.amount * weeks;
      return {
        type: 'per_week',
        label: 'Per Week',
        baseCost: base,
        costUSD: toUSD(base, comp.currency),
        daysApplied: weeks,
        calculation: `${weeks} week${weeks !== 1 ? 's' : ''} \u00D7 ${fmtCurrency(comp.amount, comp.currency)} = ${fmtCurrency(base, comp.currency)}`,
      };
    }

    // ── Per Day (every day) ────────────────────────────────────
    case 'per_day': {
      const days = countApplicableDays(comp.appliesTo, stats);
      const base = comp.amount * days;
      return {
        type: 'per_day',
        label: 'Per Day',
        baseCost: base,
        costUSD: toUSD(base, comp.currency),
        daysApplied: days,
        calculation: `${days} day${days !== 1 ? 's' : ''} \u00D7 ${fmtCurrency(comp.amount, comp.currency)} = ${fmtCurrency(base, comp.currency)}`,
      };
    }

    // ── Flat Tour ──────────────────────────────────────────────
    case 'flat_tour': {
      return {
        type: 'flat_tour',
        label: 'Flat Tour',
        baseCost: comp.amount,
        costUSD: toUSD(comp.amount, comp.currency),
        daysApplied: 1,
        calculation: `Flat: ${fmtCurrency(comp.amount, comp.currency)}`,
      };
    }

    // ── Per Diem ───────────────────────────────────────────────
    case 'per_diem': {
      // Per diem is a separate line from base pay
      // Typically applies to all day types
      const days = countApplicableDays(comp.appliesTo, stats);
      const base = comp.amount * days;
      return {
        type: 'per_diem',
        label: 'Per Diem',
        baseCost: base,
        costUSD: toUSD(base, comp.currency),
        daysApplied: days,
        calculation: `${days} day${days !== 1 ? 's' : ''} \u00D7 ${fmtCurrency(comp.amount, comp.currency)}/day = ${fmtCurrency(base, comp.currency)}`,
      };
    }

    // ── Percentage of Merch ───────────────────────────────────
    case 'pct_merch': {
      // comp.amount is the percentage (e.g. 10 = 10%)
      const pct = comp.amount / 100;
      const base = stats.totalMerchNet * pct;
      return {
        type: 'pct_merch',
        label: '% of Merch',
        baseCost: base,
        costUSD: toUSD(base, comp.currency),
        daysApplied: 0,
        calculation: `${comp.amount}% of ${fmtCurrency(stats.totalMerchNet, 'USD')} merch net = ${fmtCurrency(base, comp.currency)}`,
      };
    }

    // ── Percentage of Net ─────────────────────────────────────
    // CIRCULAR DEPENDENCY: netTourIncome must already exclude pct_net costs
    // This is handled by the two-pass system in calculatePersonnelCosts()
    case 'pct_net': {
      const pct = comp.amount / 100;
      const base = Math.max(0, stats.netTourIncome) * pct;
      return {
        type: 'pct_net',
        label: '% of Net',
        baseCost: base,
        costUSD: toUSD(base, comp.currency),
        daysApplied: 0,
        calculation: `${comp.amount}% of ${fmtCurrency(stats.netTourIncome, 'USD')} net income = ${fmtCurrency(base, comp.currency)}`,
      };
    }

    // ── Base + Bonus ──────────────────────────────────────────
    case 'base_bonus': {
      const days = countApplicableDays(comp.appliesTo, stats);
      let base = comp.amount * days;
      let bonusEarned = 0;
      let bonusCalc = '';

      if (comp.bonusAmount && comp.bonusCondition) {
        // Check bonus condition across all show days
        if (comp.bonusCondition === 'sellout') {
          const selloutShows = stats.days.filter(
            (d) => d.dayType === 'show_day' && d.isSellout
          ).length;
          bonusEarned = comp.bonusAmount * selloutShows;
          bonusCalc = ` + ${selloutShows} sellout${selloutShows !== 1 ? 's' : ''} \u00D7 ${fmtCurrency(comp.bonusAmount, comp.currency)} bonus`;
        } else if (comp.bonusCondition === 'per_show_threshold' && comp.bonusThreshold) {
          const qualifyingShows = stats.days.filter(
            (d) =>
              d.dayType === 'show_day' &&
              (d.ticketsSold ?? 0) >= (comp.bonusThreshold ?? 0)
          ).length;
          bonusEarned = comp.bonusAmount * qualifyingShows;
          bonusCalc = ` + ${qualifyingShows} show${qualifyingShows !== 1 ? 's' : ''} over ${comp.bonusThreshold} tix \u00D7 ${fmtCurrency(comp.bonusAmount, comp.currency)} bonus`;
        }
      }

      const totalBase = base + bonusEarned;

      return {
        type: 'base_bonus',
        label: 'Base + Bonus',
        baseCost: totalBase,
        costUSD: toUSD(totalBase, comp.currency),
        daysApplied: days,
        calculation: `${days} day${days !== 1 ? 's' : ''} \u00D7 ${fmtCurrency(comp.amount, comp.currency)}${bonusCalc} = ${fmtCurrency(totalBase, comp.currency)}`,
      };
    }

    default:
      return null;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Count how many days match the given day types.
 * If appliesTo is empty, defaults to all show days only.
 */
function countApplicableDays(
  appliesTo: DayType[],
  stats: TourStats
): number {
  if (!appliesTo || appliesTo.length === 0) {
    // Default: show days only
    return stats.showDayCount;
  }

  let count = 0;
  if (appliesTo.includes('show_day')) count += stats.showDayCount;
  if (appliesTo.includes('off_day')) count += stats.offDayCount;
  if (appliesTo.includes('travel_day')) count += stats.travelDayCount;
  if (appliesTo.includes('load_in_day')) count += stats.loadInDayCount;
  return count;
}

/**
 * Determine day type for a tour day.
 * Travel day threshold: drive time > 4 hours on an off day.
 */
export function determineDayType(
  isShowDay: boolean,
  isLoadIn: boolean,
  isOff: boolean,
  driveHours: number
): DayType {
  if (isShowDay && !isOff) return 'show_day';
  if (isLoadIn) return 'load_in_day';
  if (isOff && driveHours > 4) return 'travel_day';
  return 'off_day';
}

function fmtCurrency(amount: number, currency: string): string {
  const symbol =
    currency === 'USD' ? '$' :
    currency === 'EUR' ? '\u20AC' :
    currency === 'GBP' ? '\u00A3' :
    currency === 'AUD' ? 'A$' :
    currency === 'CAD' ? 'C$' :
    `${currency} `;
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
