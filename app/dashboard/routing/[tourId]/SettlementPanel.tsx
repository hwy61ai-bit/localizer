/**
 * SettlementPanel — Show-level settlement UI
 *
 * Renders inside the show detail drawer. Handles:
 * - Deal terms display (read-only reference from deal JSONB)
 * - Settlement waterfall entry (all financial fields)
 * - Projected vs Actual toggle
 * - Settlement verification against deal formula
 * - Auto-save via debounced PUT
 *
 * Usage in drawer:
 *   <SettlementPanel show={drawerShow} tourId={tourId} onUpdate={handleShowUpdate} />
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  calculateShowIncome,
  verifySettlement,
  type DealTerms,
  type SettlementData,
  type ShowForCalc,
} from '@/lib/tourrouter/calculateShowIncome';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SettlementPanelProps {
  show: {
    id: string;
    event: string;
    date_iso: string;
    city: string;
    venue: string;
    offer_amount: number;
    offer_currency: string;
    deal: DealTerms | null;
    settlement: SettlementData | null;
  };
  tourId: string;
  currencyRates: Record<string, number>;
  onUpdate: (field: string, value: unknown) => void;
}

// ─── Deal Type Labels ────────────────────────────────────────────────────────

const DEAL_TYPE_LABELS: Record<string, string> = {
  flat_guarantee: 'Flat Guarantee',
  versus_gross: 'Guarantee vs % Gross',
  versus_net: 'Guarantee vs % Net',
  versus_adjusted_gross: 'Guarantee vs % Adjusted Gross',
  versus_expense_cap: 'Guarantee vs % (Expense Cap)',
  versus_promoter_profit: 'Guarantee vs % (After Promoter Profit)',
  overage_only: 'Guarantee + % Overage',
  straight_percentage: 'Straight Percentage',
  door_deal: 'Door Deal',
  sliding_scale: 'Sliding Scale',
  co_headliner: 'Co-Headliner Split',
  plus_one: 'Plus One',
  flat_plus_bonus: 'Flat + Bonus',
  ticket_buyout: 'Ticket Buyout',
  guarantee_plus_merch: 'Guarantee + Merch',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function SettlementPanel({
  show,
  tourId,
  currencyRates,
  onUpdate,
}: SettlementPanelProps) {
  const [mode, setMode] = useState<'projected' | 'actual'>('projected');
  const [settlement, setSettlement] = useState<Partial<SettlementData>>(
    show.settlement ?? {}
  );
  const [saving, setSaving] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  // Sync when show changes
  useEffect(() => {
    setSettlement(show.settlement ?? {});
  }, [show.id, show.settlement]);

  // ─── Save Handler ────────────────────────────────────────────────────────

  const saveSettlement = useCallback(
    async (updated: Partial<SettlementData>) => {
      setSaving(true);
      try {
        const res = await fetch(
          `/api/tourrouter/tours/${tourId}/shows/${show.id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ settlement: updated }),
          }
        );
        if (res.ok) {
          onUpdate('settlement', updated);
        }
      } catch (e) {
        console.error('Settlement save failed:', e);
      } finally {
        setSaving(false);
      }
    },
    [tourId, show.id, onUpdate]
  );

  // Debounced save
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(settlement).length > 0) {
        saveSettlement(settlement);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [settlement, saveSettlement]);

  // ─── Field Updater ───────────────────────────────────────────────────────

  const updateField = (field: keyof SettlementData, value: string) => {
    const numericFields = [
      'grossTicketRevenue', 'facilityFeesTotal', 'adjustedGross',
      'taxesTotal', 'taxPercentage', 'netGross', 'totalExpenses',
      'promoterProfit', 'netRevenue', 'artistPayment', 'ticketsSold',
      'ticketsComped', 'merchGross', 'merchVenueCommission', 'merchNet',
    ];

    const parsed = numericFields.includes(field)
      ? value === '' ? null : parseFloat(value.replace(/,/g, ''))
      : value || null;

    setSettlement((prev) => ({ ...prev, [field]: parsed }));
  };

  // ─── Calculations ────────────────────────────────────────────────────────

  const showForCalc: ShowForCalc = useMemo(() => ({
    offer: { amount: show.offer_amount, currency: show.offer_currency },
    deal: show.deal ?? null,
    settlement: settlement as SettlementData | null,
  }), [show.offer_amount, show.offer_currency, show.deal, settlement]);

  const projectedIncome = useMemo(
    () => calculateShowIncome(showForCalc, false, currencyRates),
    [showForCalc, currencyRates]
  );

  const actualIncome = useMemo(
    () => calculateShowIncome(showForCalc, true, currencyRates),
    [showForCalc, currencyRates]
  );

  const verification = useMemo(
    () => showVerification ? verifySettlement(showForCalc, currencyRates) : null,
    [showForCalc, currencyRates, showVerification]
  );

  // ─── Render Helpers ──────────────────────────────────────────────────────

  const deal = show.deal;
  const currency = settlement.currency || show.offer_currency || 'USD';
  const currSymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '\u20AC' : currency === 'GBP' ? '\u00A3' : `${currency} `;

  const fmt = (n: number | null | undefined) =>
    n != null ? `${currSymbol}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '\u2014';

  const numVal = (n: number | null | undefined) =>
    n != null ? String(n) : '';

  // ─── Styles ──────────────────────────────────────────────────────────────

  const sectionStyle: React.CSSProperties = { marginBottom: 16 };
  const headerStyle: React.CSSProperties = {
    fontFamily: 'var(--hw-font-mono)', fontSize: 13, fontWeight: 400,
    textTransform: 'uppercase' as const, letterSpacing: '2px',
    color: 'var(--hw-blue)', marginBottom: 8, display: 'flex',
    justifyContent: 'space-between', alignItems: 'center',
  };
  const rowStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '6px 0', borderBottom: '2px solid var(--hw-border)',
  };
  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--hw-font-body)', fontSize: 14, fontWeight: 300,
    color: 'var(--hw-text-secondary)',
  };
  const inputStyle: React.CSSProperties = {
    width: 140, padding: '6px 10px', border: '3px solid var(--hw-border-strong)',
    fontFamily: 'var(--hw-font-mono)', fontSize: 13,
    textAlign: 'right' as const, background: 'var(--hw-bg-surface)',
    outline: 'none',
  };
  const readonlyStyle: React.CSSProperties = {
    ...inputStyle, background: 'var(--hw-bg)', color: 'var(--hw-text-muted)',
    border: '3px solid var(--hw-border)',
  };
  const tagStyle: React.CSSProperties = {
    display: 'inline-block', padding: '3px 10px',
    fontFamily: 'var(--hw-font-mono)', fontSize: 11, fontWeight: 700,
    letterSpacing: '2px', textTransform: 'uppercase' as const,
    background: 'var(--hw-green-ghost)', color: 'var(--hw-green)',
    border: '2px solid var(--hw-green-border)',
  };
  const warningTagStyle: React.CSSProperties = {
    ...tagStyle, background: 'var(--hw-amber-ghost)', color: 'var(--hw-amber)',
    border: '2px solid var(--hw-amber)',
  };
  const dangerTagStyle: React.CSSProperties = {
    ...tagStyle, background: 'var(--hw-red-ghost)', color: 'var(--hw-crimson)',
    border: '2px solid var(--hw-crimson)',
  };
  const toggleContainerStyle: React.CSSProperties = {
    display: 'flex', overflow: 'hidden',
    border: '3px solid var(--hw-border-strong)', marginBottom: 16,
  };
  const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '8px 0',
    fontFamily: 'var(--hw-font-mono)', fontSize: 13, fontWeight: 700,
    letterSpacing: '2px', textTransform: 'uppercase' as const,
    border: 'none', cursor: 'pointer', textAlign: 'center' as const,
    background: active ? 'var(--hw-bg-invert)' : 'var(--hw-bg-surface)',
    color: active ? '#fff' : 'var(--hw-text-muted)',
    transition: 'var(--hw-ease)',
  });
  const summaryBoxStyle: React.CSSProperties = {
    background: 'var(--hw-bg-surface)', border: '3px solid var(--hw-border-strong)',
    padding: 16, marginBottom: 16,
  };
  const summaryRowStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', padding: '4px 0',
    fontSize: 14,
  };
  const summaryLabelStyle: React.CSSProperties = {
    fontFamily: 'var(--hw-font-mono)', fontSize: 12, letterSpacing: '1.5px',
    textTransform: 'uppercase' as const, color: 'var(--hw-text-muted)',
  };
  const summaryValueStyle: React.CSSProperties = {
    fontFamily: 'var(--hw-font-mono)', fontSize: 13, fontWeight: 700,
    color: 'var(--hw-text)',
  };
  const btnStyle: React.CSSProperties = {
    padding: '4px 10px',
    fontFamily: 'var(--hw-font-mono)', fontSize: 11, fontWeight: 700,
    letterSpacing: '1.5px', textTransform: 'uppercase' as const,
    border: '2px solid var(--hw-border-strong)', background: 'var(--hw-bg-surface)',
    color: 'var(--hw-text)', cursor: 'pointer', transition: 'var(--hw-ease)',
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '0' }}>
      {/* ── Mode Toggle ─────────────────────────────────────────── */}
      <div style={toggleContainerStyle}>
        <button
          style={toggleBtnStyle(mode === 'projected')}
          onClick={() => setMode('projected')}
        >
          Projected
        </button>
        <button
          style={toggleBtnStyle(mode === 'actual')}
          onClick={() => setMode('actual')}
        >
          Actual
        </button>
      </div>

      {/* ── Income Summary ──────────────────────────────────────── */}
      <div style={summaryBoxStyle}>
        <div style={summaryRowStyle}>
          <span style={summaryLabelStyle}>Projected Income</span>
          <span style={{ ...summaryValueStyle, color: 'var(--hw-green)' }}>
            {fmt(projectedIncome)}
          </span>
        </div>
        <div style={summaryRowStyle}>
          <span style={summaryLabelStyle}>Actual Income</span>
          <span style={{
            ...summaryValueStyle,
            color: actualIncome > projectedIncome ? 'var(--hw-green)' : actualIncome < projectedIncome ? 'var(--hw-crimson)' : 'var(--hw-text)',
          }}>
            {settlement.artistPayment != null ? fmt(actualIncome) : '\u2014'}
          </span>
        </div>
        <div style={{ ...summaryRowStyle, borderTop: '3px solid var(--hw-border-strong)', marginTop: 4, paddingTop: 8 }}>
          <span style={summaryLabelStyle}>Remaining</span>
          <span style={{
            ...summaryValueStyle,
            color: settlement.artistPayment != null
              ? (actualIncome - projectedIncome >= 0 ? 'var(--hw-green)' : 'var(--hw-crimson)')
              : 'var(--hw-text-muted)',
          }}>
            {settlement.artistPayment != null
              ? `${actualIncome - projectedIncome >= 0 ? '+' : ''}${fmt(actualIncome - projectedIncome)}`
              : '\u2014'}
          </span>
        </div>
      </div>

      {/* ── Deal Terms (read-only reference) ─────────────────────── */}
      <div style={sectionStyle}>
        <div style={headerStyle}>
          <span>Deal Terms</span>
          {deal ? (
            <span style={tagStyle}>{DEAL_TYPE_LABELS[deal.dealType] || deal.dealType}</span>
          ) : (
            <span style={warningTagStyle}>No deal on file</span>
          )}
        </div>
        {deal ? (
          <>
            {deal.guarantee != null && (
              <div style={rowStyle}>
                <span style={labelStyle}>Guarantee</span>
                <span style={{ ...labelStyle, fontFamily: 'var(--hw-font-mono)' }}>
                  {fmt(deal.guarantee)}
                </span>
              </div>
            )}
            {deal.percentage != null && (
              <div style={rowStyle}>
                <span style={labelStyle}>
                  {deal.versusBase === 'net' ? '% of Net' : deal.versusBase === 'adjusted_gross' ? '% of Adj. Gross' : '% of Gross'}
                </span>
                <span style={{ ...labelStyle, fontFamily: 'var(--hw-font-mono)' }}>
                  {deal.percentage}%
                </span>
              </div>
            )}
            {deal.expenseCap != null && (
              <div style={rowStyle}>
                <span style={labelStyle}>Expense Cap</span>
                <span style={{ ...labelStyle, fontFamily: 'var(--hw-font-mono)' }}>{fmt(deal.expenseCap)}</span>
              </div>
            )}
            {deal.promoterProfit != null && (
              <div style={rowStyle}>
                <span style={labelStyle}>Promoter Profit</span>
                <span style={{ ...labelStyle, fontFamily: 'var(--hw-font-mono)' }}>{fmt(deal.promoterProfit)}</span>
              </div>
            )}
            {deal.walkoutPotential != null && (
              <div style={rowStyle}>
                <span style={labelStyle}>Walkout Potential</span>
                <span style={{ ...labelStyle, fontFamily: 'var(--hw-font-mono)' }}>{fmt(deal.walkoutPotential)}</span>
              </div>
            )}
            {deal.rawText && (
              <div style={{ marginTop: 8, padding: 8, background: 'var(--hw-bg)', border: '2px solid var(--hw-border)', fontFamily: 'var(--hw-font-body)', fontSize: 13, fontWeight: 300, color: 'var(--hw-text-muted)', fontStyle: 'italic' }}>
                {deal.rawText}
              </div>
            )}
          </>
        ) : (
          <div style={{ fontFamily: 'var(--hw-font-body)', fontSize: 14, fontWeight: 300, color: 'var(--hw-text-muted)', padding: '8px 0' }}>
            Drop a deal memo onto this show to populate deal terms.
          </div>
        )}
      </div>

      {/* ── Settlement Waterfall ──────────────────────────────────── */}
      <div style={sectionStyle}>
        <div style={headerStyle}>
          <span>Settlement Waterfall</span>
          {saving && <span style={{ fontSize: 13, color: '#888880' }}>Saving...</span>}
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Gross Ticket Revenue</span>
          <input
            style={inputStyle}
            type="text"
            placeholder="0.00"
            value={numVal(settlement.grossTicketRevenue)}
            onChange={(e) => updateField('grossTicketRevenue', e.target.value)}
          />
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Facility Fees</span>
          <input
            style={inputStyle}
            type="text"
            placeholder="0.00"
            value={numVal(settlement.facilityFeesTotal)}
            onChange={(e) => updateField('facilityFeesTotal', e.target.value)}
          />
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Adjusted Gross</span>
          <input
            style={readonlyStyle}
            type="text"
            readOnly
            value={
              settlement.grossTicketRevenue != null && settlement.facilityFeesTotal != null
                ? String((settlement.grossTicketRevenue ?? 0) - (settlement.facilityFeesTotal ?? 0))
                : ''
            }
          />
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Taxes</span>
          <input
            style={inputStyle}
            type="text"
            placeholder="0.00"
            value={numVal(settlement.taxesTotal)}
            onChange={(e) => updateField('taxesTotal', e.target.value)}
          />
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Net Gross</span>
          <input
            style={readonlyStyle}
            type="text"
            readOnly
            value={
              settlement.grossTicketRevenue != null
                ? String(
                    (settlement.grossTicketRevenue ?? 0) -
                    (settlement.facilityFeesTotal ?? 0) -
                    (settlement.taxesTotal ?? 0)
                  )
                : ''
            }
          />
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Total Expenses</span>
          <input
            style={inputStyle}
            type="text"
            placeholder="0.00"
            value={numVal(settlement.totalExpenses)}
            onChange={(e) => updateField('totalExpenses', e.target.value)}
          />
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Promoter Profit</span>
          <input
            style={inputStyle}
            type="text"
            placeholder="0.00"
            value={numVal(settlement.promoterProfit)}
            onChange={(e) => updateField('promoterProfit', e.target.value)}
          />
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Net Revenue</span>
          <input
            style={readonlyStyle}
            type="text"
            readOnly
            value={
              settlement.grossTicketRevenue != null
                ? String(
                    (settlement.grossTicketRevenue ?? 0) -
                    (settlement.facilityFeesTotal ?? 0) -
                    (settlement.taxesTotal ?? 0) -
                    (settlement.totalExpenses ?? 0) -
                    (settlement.promoterProfit ?? 0)
                  )
                : ''
            }
          />
        </div>

        <div style={{ ...rowStyle, borderBottom: '3px solid var(--hw-border-strong)', paddingBottom: 8, marginBottom: 8 }}>
          <span style={{ ...labelStyle, fontWeight: 500, color: 'var(--hw-text)' }}>Artist Payment</span>
          <input
            style={{ ...inputStyle, borderColor: 'var(--hw-green)', fontWeight: 700 }}
            type="text"
            placeholder="0.00"
            value={numVal(settlement.artistPayment)}
            onChange={(e) => updateField('artistPayment', e.target.value)}
          />
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Payment Method</span>
          <select
            style={{ ...inputStyle, width: 160 }}
            value={settlement.artistPaymentMethod || ''}
            onChange={(e) => updateField('artistPaymentMethod', e.target.value)}
          >
            <option value="">Select...</option>
            <option value="check">Check</option>
            <option value="cash">Cash</option>
            <option value="wire">Wire</option>
            <option value="direct_deposit">Direct Deposit</option>
          </select>
        </div>
      </div>

      {/* ── Ticket Sales ─────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <div style={headerStyle}>
          <span>Ticket Sales</span>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Tickets Sold</span>
          <input
            style={inputStyle}
            type="text"
            placeholder="0"
            value={numVal(settlement.ticketsSold)}
            onChange={(e) => updateField('ticketsSold', e.target.value)}
          />
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Tickets Comped</span>
          <input
            style={inputStyle}
            type="text"
            placeholder="0"
            value={numVal(settlement.ticketsComped)}
            onChange={(e) => updateField('ticketsComped', e.target.value)}
          />
        </div>
      </div>

      {/* ── Merch Settlement ─────────────────────────────────────── */}
      <div style={sectionStyle}>
        <div style={headerStyle}>
          <span>Merch</span>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Merch Gross</span>
          <input
            style={inputStyle}
            type="text"
            placeholder="0.00"
            value={numVal(settlement.merchGross)}
            onChange={(e) => updateField('merchGross', e.target.value)}
          />
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Venue Commission</span>
          <input
            style={inputStyle}
            type="text"
            placeholder="0.00"
            value={numVal(settlement.merchVenueCommission)}
            onChange={(e) => updateField('merchVenueCommission', e.target.value)}
          />
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>Merch Net</span>
          <input
            style={readonlyStyle}
            type="text"
            readOnly
            value={
              settlement.merchGross != null
                ? String((settlement.merchGross ?? 0) - (settlement.merchVenueCommission ?? 0))
                : ''
            }
          />
        </div>
      </div>

      {/* ── Currency ─────────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <div style={rowStyle}>
          <span style={labelStyle}>Settlement Currency</span>
          <select
            style={{ ...inputStyle, width: 100 }}
            value={settlement.currency || 'USD'}
            onChange={(e) => updateField('currency', e.target.value)}
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="CAD">CAD</option>
            <option value="AUD">AUD</option>
            <option value="SEK">SEK</option>
            <option value="CHF">CHF</option>
            <option value="JPY">JPY</option>
            <option value="NZD">NZD</option>
            <option value="MXN">MXN</option>
          </select>
        </div>
      </div>

      {/* ── Verification ─────────────────────────────────────────── */}
      <div style={sectionStyle}>
        <div style={headerStyle}>
          <span>Verification</span>
          <button
            style={btnStyle}
            onClick={() => setShowVerification(!showVerification)}
          >
            {showVerification ? 'Hide' : 'Verify'}
          </button>
        </div>

        {showVerification && verification && (
          <div style={{ padding: 12, background: verification.dealMatchesSettlement ? 'var(--hw-green-ghost)' : 'var(--hw-amber-ghost)', border: `3px solid ${verification.dealMatchesSettlement ? 'var(--hw-green-border)' : 'var(--hw-amber)'}` }}>
            <div style={summaryRowStyle}>
              <span style={summaryLabelStyle}>Status</span>
              <span style={verification.dealMatchesSettlement ? tagStyle : dangerTagStyle}>
                {verification.dealMatchesSettlement ? 'Match' : 'Discrepancy'}
              </span>
            </div>
            <div style={summaryRowStyle}>
              <span style={summaryLabelStyle}>Expected (from deal)</span>
              <span style={summaryValueStyle}>{fmt(verification.expectedArtistPayment)}</span>
            </div>
            <div style={summaryRowStyle}>
              <span style={summaryLabelStyle}>Actual (settlement)</span>
              <span style={summaryValueStyle}>{fmt(verification.actualArtistPayment)}</span>
            </div>
            {verification.difference !== 0 && (
              <div style={summaryRowStyle}>
                <span style={summaryLabelStyle}>Difference</span>
                <span style={{
                  ...summaryValueStyle,
                  color: verification.difference > 0 ? 'var(--hw-green)' : 'var(--hw-crimson)',
                }}>
                  {verification.difference > 0 ? '+' : ''}{fmt(verification.difference)}
                  {verification.percentageDifference !== 0 &&
                    ` (${verification.percentageDifference > 0 ? '+' : ''}${verification.percentageDifference.toFixed(1)}%)`}
                </span>
              </div>
            )}
            {verification.discrepancies.length > 0 && (
              <div style={{ marginTop: 8, fontFamily: 'var(--hw-font-body)', fontSize: 13, fontWeight: 300, color: 'var(--hw-amber)' }}>
                {verification.discrepancies.map((d, i) => (
                  <div key={i} style={{ padding: '4px 0' }}>{d}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {showVerification && !verification && (
          <div style={{ fontFamily: 'var(--hw-font-body)', fontSize: 14, fontWeight: 300, color: 'var(--hw-text-muted)', padding: '8px 0' }}>
            Need both deal terms and settlement data to verify.
          </div>
        )}
      </div>
    </div>
  );
}
