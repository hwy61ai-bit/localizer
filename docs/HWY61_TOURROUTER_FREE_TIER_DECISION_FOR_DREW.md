# HWY61 TourRouter — Free Tier Access Decision
**Date:** April 9, 2026
**From:** Tim
**To:** Drew
**Re:** Replacing the binary `checkTourRouterAccess` with a three-tier model

---

## Background

The current `checkTourRouterAccess` function is binary: active subscription or admin = allowed, everything else = blocked. There is no free tier concept at all. This needs to change before onboarding can work — new signups have no path to actually use the product before being asked to pay.

---

## The Decision

### Three Tiers, Not Two

| State | Who | Access |
|---|---|---|
| **Unauthenticated** | No account / not signed in | Redirect to sign-up / sign-in. No access. |
| **Free Tier** | Signed in, no active subscription | Full TourRouter access — except exports (hard wall) |
| **Paid** | Active subscription or admin | Full access including all exports |

---

## What Free Tier Gets (Everything Except Exports)

Free users can:
- Create tours
- Add and edit shows
- Use all routing features (drive times, flight estimates, legs, routing table)
- Access all financial features (deal types, settlement, P&L, financials page)
- Manage the advance pipeline
- Manage guest lists
- Use the Universal AI Intake (drag-and-drop documents)
- Access the finance layer and commission engine
- View the multi-tour dashboard

Free users **cannot:**
- Export to CSV
- Export to Excel
- Export to PDF
- Export day sheets
- Export advance sheets
- Generate end-of-tour reports

---

## The Hard Wall — Exports Only

When a free user triggers any export, show a **hard block upgrade modal**. No partial export, no preview, no workaround. The modal should use the upgrade copy once that doc is revised (see April 9 revision notes — Merch and Agency references need to be stripped).

The export moment is the right wall. Users build a real tour, get real value, and hit the wall exactly when they need to actually use the data outside the app. That's when the upgrade ask lands.

---

## Implementation Notes

### Replace the boolean with an enum

`checkTourRouterAccess` returning `true | false` won't cut it anymore. Replace it with:

```typescript
type TourRouterAccessLevel = 'none' | 'free' | 'paid';

async function getTourRouterAccessLevel(userId: string): Promise<TourRouterAccessLevel> {
  // No session → 'none'
  // Active subscription or admin → 'paid'
  // Authenticated, no subscription → 'free'
}
```

### Where the checks live

- **Any TourRouter page or API route** — check `!== 'none'`. If `'none'`, redirect to sign-in.
- **Export routes only** — check `=== 'paid'`. If `'free'`, return 403 and trigger the upgrade modal on the client.

### Export routes to gate
```
/api/tourrouter/tours/[tourId]/export/csv
/api/tourrouter/tours/[tourId]/export/excel
/api/tourrouter/tours/[tourId]/export/pdf
/api/tourrouter/finance/report/[token]  ← shareable report generation
```

Day sheets and advance sheet exports follow the same rule — any route that generates a downloadable file is gated.

### Onboarding wizard
The wizard should work fully on the free tier. Demo tour seed (`seedDemoTour(orgId)`) runs on free accounts. The goal is to get a new user into a real tour with real data as fast as possible, then let the export wall do the conversion work.

---

## What This Doesn't Change

- RLS policies — no changes needed. Free users are authenticated, so org-level RLS works as normal.
- Feature flags — DIY vs TourRouter gating is separate from this. Feature flags stay as-is.
- Crew / Road App access — token-based auth, unaffected.
- Admin override — admins stay `'paid'` equivalent regardless of subscription state.

---

*Decision confirmed by Tim, April 9, 2026. Supersedes the binary checkTourRouterAccess model.*
