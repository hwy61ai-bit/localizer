# Hotel / Lodging Financial Integration — Tim's Decisions
**Date:** April 7, 2026
**Status:** All questions answered. Ready to build.

---

## Part 1 — Artist Profile Lodging Defaults

- **Room count:** Broken out by type (e.g., 2 band doubles + 1 crew double + 1 TM single)
- **Bed configuration:** Yes, store as a default on the artist profile
- **Star rating / quality minimum:** Yes, include it
- **Other defaults:** None needed — room breakdown + bed config + star rating is sufficient

---

## Part 2 — Three-State Hotel Cost Calculation

- **Estimation method:** Combination — market-based default with a per-tour override. System estimates by city/market, TM can override per tour.
- **Rate change notification:** Silent update. No notification when a confirmation rate differs from the projection — TM sees the updated number next time they look.
- **Off-day hotel costs:** Own line items, separate from any show. Off-days do not attach to adjacent show dates.
- **Room block + overflow rates:** TM chooses per show which rate to use when both a venue block and a separate booking exist.

---

## Part 3 — Accommodations Tab (Finance Page)

**Layout confirmed as proposed:**
1. Total lodging cost (all shows + off days)
2. Per-night breakdown (date, city, hotel name, rooms, rate, total, source: receipt/confirmation/projection)
3. Cost by confidence state (how much is real vs. estimated)
4. Average nightly cost
5. Nights with no hotel assigned (gaps the TM needs to fill)

**Financial summary treatment:** Hotel is a separate visible line item AND rolls into Total Expenses — same pattern as fuel and flights.

**Visibility:** Same as other expenses (TM, BM, manager). No additional restriction.

---

## Part 4 — Receipt Intake

- **Incidentals:** Just capture the total. One number. No separation of room cost from minibar/parking/fees.
- **Multiple receipts same night:** Stack additively. Both receipts add to the same date's hotel cost.

---

## Summary for Drew

**Data model implications:**
- Artist profile needs a new `lodging_defaults` JSONB column: `{ rooms: [{ type, bed_config, count }], star_minimum, nightly_budget_override }`
- Build a market rate lookup table (city → estimated nightly rate) — `constants.ts` city data is the starting point
- `tours_routing` needs a `hotel_budget_override` field for per-tour TM override
- Off-days need to exist as line items in the Accommodations tab even when they have no `tour_shows` record — iterate by calendar date, not just show dates
- `tour_shows` hotel fields need a `hotel_rate_source` field: `'block'` | `'overflow'` | `'combined'` — TM picks per show

**calcTourFinancials() changes:**
- `totalHotelCost` stops returning zero — calculates from the three-state waterfall (receipt > confirmation > projection)
- Hotel cost rolls into `totalExpenses`
- Off-day hotel costs included in `totalHotelCost`
- New return fields: `hotelCostByState: { actual, confirmed, projected }` for the confidence breakdown on the Accommodations tab

**Receipt parser:**
- Capture total only — no incidental line-item parsing
- Multiple receipts for the same date stack additively

**No build blockers remain. All decisions made.**
