/**
 * Commission Calculation Engine
 *
 * 9 commission types with visibility controls.
 * manager_pct_net has same circular dependency as pct_net personnel pay (rule #20).
 *
 * Stored on artists.default_commissions → tours_routing.tour_commissions (copy on tour create).
 * Visibility stored on tours_routing.commission_visibility (array of roles that can see breakdown).
 *
 * Usage:
 *   import { calculateCommissions } from '@/lib/tourrouter/commissions';
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type CommissionType =
  | 'agent_pct'          // booking agent — % of gross income
  | 'manager_pct_gross'  // manager — % of gross income
  | 'manager_pct_net'    // manager — % of net income (CIRCULAR — same as pct_net)
  | 'bm_pct_gross'       // business manager — % of gross income
  | 'bm_flat_monthly'    // business manager — flat monthly fee
  | 'label_support'      // label tour support — treated as expense REDUCTION, not income
  | 'co_manager_pct'     // co-manager — % of gross
  | 'subagent_pct'       // sub-agent — % of gross
  | 'custom';            // custom commission with user-defined label

export interface Commission {
  id: string;
  type: CommissionType;
  label: string;           // display name (e.g. "WME - Booking", "Red Light - Management")
  recipientName: string;   // who gets paid
  recipientCompany: string | null;
  percentage: number | null;  // for percentage-based types (e.g. 10 = 10%)
  flatAmount: number | null;  // for flat-fee types (bm_flat_monthly, custom)
  flatPeriod: 'monthly' | 'weekly' | 'per_tour' | null;
  currency: string;
  isActive: boolean;
  notes: string | null;
}

export interface CommissionResult {
  totalCommissions: number;       // all commissions combined, USD
  totalCommissionsExclSupport: number; // excluding label_support
  labelSupportTotal: number;      // label_support only (treated as expense reduction)
  incomeAfterCommissions: number; // gross - commissions
  netAfterCommissionsAndSupport: number; // gross - commissions + label support
  items: CommissionLineItem[];
}

export interface CommissionLineItem {
  commissionId: string;
  type: CommissionType;
  label: string;
  recipientName: string;
  baseAmount: number;        // the income base this was calculated from
  calculatedAmount: number;  // the commission amount in original currency
  amountUSD: number;         // converted to USD
  calculation: string;       // human-readable: "10% of $150,000 gross = $15,000"
}

// ─── Labels ──────────────────────────────────────────────────────────────────

export const COMMISSION_TYPE_LABELS: Record<CommissionType, string> = {
  agent_pct: 'Booking Agent (%)',
  manager_pct_gross: 'Manager (% Gross)',
  manager_pct_net: 'Manager (% Net)',
  bm_pct_gross: 'Business Manager (% Gross)',
  bm_flat_monthly: 'Business Manager (Flat Monthly)',
  label_support: 'Label Tour Support',
  co_manager_pct: 'Co-Manager (%)',
  subagent_pct: 'Sub-Agent (%)',
  custom: 'Custom',
};

// ─── Main Function ──────────────────────────────────────────────────────────

/**
 * Calculate all commissions for a tour.
 *
 * Handles manager_pct_net circular dependency (rule #20):
 *   1. Calculate all non-pct_net commissions first
 *   2. Compute net = grossIncome - nonPctNetCommissions - totalExpenses
 *   3. Apply manager_pct_net to that net
 *
 * @param commissions - Commission definitions from tour_commissions JSONB
 * @param grossIncome - Total tour gross income (from calcTourFinancials)
 * @param totalExpenses - Total tour expenses (fuel + hotels + flights + personnel + blankets)
 * @param tourWeeks - Number of weeks in tour (for bm_flat_monthly)
 * @param currencyRates - Exchange rates
 * @returns Full commission breakdown
 */
export function calculateCommissions(
  commissions: Commission[],
  grossIncome: number,
  totalExpenses: number,
  tourWeeks: number,
  currencyRates: Record<string, number>
): CommissionResult {
  const active = commissions.filter((c) => c.isActive);

  // ── Pass 1: Calculate all non-manager_pct_net commissions ──────────
  const pass1Items: CommissionLineItem[] = [];
  let pass1Total = 0;
  let labelSupportTotal = 0;

  for (const comm of active) {
    if (comm.type === 'manager_pct_net') continue; // skip for pass 1

    const item = calculateSingleCommission(comm, grossIncome, 0, tourWeeks, currencyRates);
    if (item) {
      pass1Items.push(item);
      if (comm.type === 'label_support') {
        labelSupportTotal += item.amountUSD;
      } else {
        pass1Total += item.amountUSD;
      }
    }
  }

  // ── Pass 2: Calculate manager_pct_net using adjusted net ───────────
  // Net for pct_net = grossIncome - non-pct-net commissions - expenses
  const netForPctNet = Math.max(0, grossIncome - pass1Total - totalExpenses);

  const pass2Items: CommissionLineItem[] = [];
  let pass2Total = 0;

  for (const comm of active) {
    if (comm.type !== 'manager_pct_net') continue;

    const item = calculateSingleCommission(comm, grossIncome, netForPctNet, tourWeeks, currencyRates);
    if (item) {
      pass2Items.push(item);
      pass2Total += item.amountUSD;
    }
  }

  // ── Merge ──────────────────────────────────────────────────────────
  const allItems = [...pass1Items, ...pass2Items];
  const totalCommissions = pass1Total + pass2Total;
  const totalCommissionsExclSupport = totalCommissions; // label support is separate

  return {
    totalCommissions,
    totalCommissionsExclSupport,
    labelSupportTotal,
    incomeAfterCommissions: grossIncome - totalCommissions,
    netAfterCommissionsAndSupport: grossIncome - totalCommissions + labelSupportTotal,
    items: allItems,
  };
}

// ─── Single Commission Calculator ───────────────────────────────────────────

function calculateSingleCommission(
  comm: Commission,
  grossIncome: number,
  netIncome: number,
  tourWeeks: number,
  rates: Record<string, number>
): CommissionLineItem | null {
  const toUSD = (amount: number, currency: string) => {
    if (!currency || currency === 'USD') return amount;
    const rate = rates[currency];
    return rate ? amount * rate : amount;
  };

  let base: number;
  let amount: number;
  let calculation: string;

  switch (comm.type) {
    case 'agent_pct': {
      const pct = (comm.percentage ?? 0) / 100;
      base = grossIncome;
      amount = base * pct;
      calculation = `${comm.percentage}% of $${grossIncome.toLocaleString()} gross = $${amount.toLocaleString()}`;
      break;
    }

    case 'manager_pct_gross': {
      const pct = (comm.percentage ?? 0) / 100;
      base = grossIncome;
      amount = base * pct;
      calculation = `${comm.percentage}% of $${grossIncome.toLocaleString()} gross = $${amount.toLocaleString()}`;
      break;
    }

    case 'manager_pct_net': {
      // Uses netIncome from pass 2 (already excludes other commissions + expenses)
      const pct = (comm.percentage ?? 0) / 100;
      base = netIncome;
      amount = base * pct;
      calculation = `${comm.percentage}% of $${netIncome.toLocaleString()} net = $${amount.toLocaleString()}`;
      break;
    }

    case 'bm_pct_gross': {
      const pct = (comm.percentage ?? 0) / 100;
      base = grossIncome;
      amount = base * pct;
      calculation = `${comm.percentage}% of $${grossIncome.toLocaleString()} gross = $${amount.toLocaleString()}`;
      break;
    }

    case 'bm_flat_monthly': {
      const monthly = comm.flatAmount ?? 0;
      const months = Math.ceil(tourWeeks / 4.33);
      base = monthly;
      amount = monthly * months;
      calculation = `$${monthly.toLocaleString()}/mo × ${months} months = $${amount.toLocaleString()}`;
      break;
    }

    case 'label_support': {
      // Label tour support is an expense REDUCTION, not a commission deduction
      // Stored as a positive number but applied as a credit
      base = comm.flatAmount ?? 0;
      amount = base;
      calculation = `Label support: $${base.toLocaleString()} (expense reduction)`;
      break;
    }

    case 'co_manager_pct': {
      const pct = (comm.percentage ?? 0) / 100;
      base = grossIncome;
      amount = base * pct;
      calculation = `${comm.percentage}% of $${grossIncome.toLocaleString()} gross = $${amount.toLocaleString()}`;
      break;
    }

    case 'subagent_pct': {
      const pct = (comm.percentage ?? 0) / 100;
      base = grossIncome;
      amount = base * pct;
      calculation = `${comm.percentage}% of $${grossIncome.toLocaleString()} gross = $${amount.toLocaleString()}`;
      break;
    }

    case 'custom': {
      if (comm.percentage != null) {
        const pct = comm.percentage / 100;
        base = grossIncome;
        amount = base * pct;
        calculation = `${comm.percentage}% of $${grossIncome.toLocaleString()} = $${amount.toLocaleString()}`;
      } else if (comm.flatAmount != null) {
        base = comm.flatAmount;
        if (comm.flatPeriod === 'monthly') {
          const months = Math.ceil(tourWeeks / 4.33);
          amount = base * months;
          calculation = `$${base.toLocaleString()}/mo × ${months} months = $${amount.toLocaleString()}`;
        } else if (comm.flatPeriod === 'weekly') {
          amount = base * tourWeeks;
          calculation = `$${base.toLocaleString()}/wk × ${tourWeeks} weeks = $${amount.toLocaleString()}`;
        } else {
          amount = base;
          calculation = `Flat: $${base.toLocaleString()}`;
        }
      } else {
        return null;
      }
      break;
    }

    default:
      return null;
  }

  return {
    commissionId: comm.id,
    type: comm.type,
    label: comm.label,
    recipientName: comm.recipientName,
    baseAmount: base,
    calculatedAmount: amount,
    amountUSD: toUSD(amount, comm.currency),
    calculation,
  };
}

// ─── Visibility Check (for API routes) ──────────────────────────────────────

/**
 * Check if a user role can see commission details.
 * Rule #14: Commission visibility checked in API route, never just UI.
 *
 * @param userRole - The current user's role (from org_members)
 * @param visibilityList - Array of roles that can see (from tour.commission_visibility)
 * @returns true if the user can see commission breakdown
 */
export function canSeeCommissions(
  userRole: string,
  visibilityList: string[] | null
): boolean {
  // Owner and admin always see everything
  if (userRole === 'owner' || userRole === 'admin') return true;

  // If no visibility list set, default to owner/admin only
  if (!visibilityList || visibilityList.length === 0) return false;

  return visibilityList.includes(userRole);
}

/**
 * Strip commission details from a response object.
 * Used in API routes when user doesn't have visibility.
 */
export function stripCommissionDetails(data: any): any {
  const stripped = { ...data };
  delete stripped.commissionWaterfall;
  delete stripped.commissionDetail;
  delete stripped.commissionItems;
  // netToArtist is always returned — just not the breakdown
  return stripped;
}
