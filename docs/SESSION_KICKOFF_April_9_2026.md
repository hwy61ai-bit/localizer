# HWY61 Session Kickoff — April 9, 2026

## Start Here — Every Session

1. `git pull` — always before touching anything
2. `npm run dev` — start local dev server
3. You are Claude Code (Opus model) in the terminal. This chat (claude.ai) is for planning and architecture only.
4. One file per Claude Code prompt. Never batch multiple file edits into one prompt.
5. Always show diff before applying. Always confirm before proceeding.
6. When Claude Code asks for file edit permissions, select option 2 ("Yes, allow all edits during this session")

---

## Current State (as of April 8, 2026)

### Repo
- GitHub: `hwy61ai-bit/localizer`
- Local: `~/localizer`
- Production: `hwy61labs.com` (auto-deploys on git push to main)
- Coming Soon gate: ACTIVE — marketing routes redirect to /coming-soon when COMING_SOON=true in .env.local

### Machines
- **Old Mac Pro** — primary dev machine
- **MacBook Pro** — travel dev machine (fully configured)
- **Mac mini** — QA agent only (read-only, git push disabled)

---

## What Just Shipped (April 8, 2026)

### All 13 QA Bugs Closed
Every bug from the QA tracker is confirmed fixed. Zero open bugs going into this session.

### Roster Pay Wired Into Financials
`tour_roster` now correctly passed to `calcTourFinancials()` on the financials page. Personnel pay from the roster now flows into totalExpenses on both the routing page and the financials page.

### Advance Sheet Drag-Drop — Full Feature
Drop a venue advance sheet anywhere on the routing page. Extracts and writes:
- Load In, Sound Check, Doors, Showtime, Curfew, Age Limit (Schedule section)
- WiFi Network, WiFi Password, Parking Notes, Venue Notes, Backline Notes, Hospitality Notes (new Venue Info drawer section)
- Production and Settlement contacts with phone and email

### Hotel/Lodging — Full Feature
Complete end-to-end hotel cost tracking:
- **Artist Profile Lodging section** — rooms by type, bed config, star rating, nightly budget override
- **HOTEL_MARKET_RATES** — 130+ cities in constants.ts, plus regional fallbacks
- **Three-state waterfall in calcTourFinancials()** — actual receipt → confirmation estimate → planning projection
- **Hotel costs in financials** — flows into totalExpenses, netIncome, margin, avgPerShow
- **Accommodations tab** — collapsible per-show breakdown with Actual/Confirmed/Projected source flags
- **All tab** — hotel summary strip with "See Breakdown →" button
- **Hotel receipt intake** — writes to hotel_cost_actual additively (multiple receipts stack)

### Fuel Receipts
- vendor column added to tour_expenses (was causing 500 errors on receipt save)
- Fuel added as its own expense category tab
- Fuel summary strip on All tab — Est vs Actual receipts side by side
- Transport Costs section updated — Est. fuel cost + Actual receipts shown together
- Tim's decision (April 8): estimates persist permanently, actuals stack separately (opposite of hotels)

### Show Match Confidence Indicator
The intake review screen now shows a confidence indicator below the MATCHED SHOW dropdown:
- Green = auto-matched (≥80% confidence)
- Amber = low confidence match — please verify
- Muted = no show auto-matched — please select

### Storage RLS Fixed
Tour document uploads were failing silently. Added 3 RLS policies to the tour-documents Supabase Storage bucket (upload, read, delete). Documents now store correctly.

### Tim Master Status Doc
`docs/TIM_MASTER_STATUS_April_8_2026.md` — comprehensive technical reference. Send to Tim whenever he has questions about how something is built (especially Mapbox drive times).

---

## Architecture — Critical Facts

### calcTourFinancials() is the single source of truth
Never calculate financial totals anywhere else. Located in `lib/tourrouter/financials.ts`.

Current expense components flowing into totalExpenses:
1. totalFuel — estimated fuel per leg (drive calculations, never replaced by receipts)
2. totalFlights — flight costs from cache
3. totalManual — per-show manual expenses
4. totalBlanketShow — blanket show day payroll (only when no roster)
5. totalBlanketOff — blanket off day payroll (only when no roster)
6. totalPersonnel — roster-based personnel pay (replaces blankets when roster exists)
7. totalHotel — three-state waterfall (actual → confirmed → projected)

### Drive times use Mapbox — not estimates
All drive distances and times are real road data from Mapbox Directions API. Cached in drive_cache table permanently. Haversine is the silent fallback only. Key file: `lib/tourrouter/mapbox.ts`

### Hotel vs Fuel — Different Rules
- **Hotels:** Actual receipt replaces estimate (three-state waterfall)
- **Fuel:** Estimate persists permanently. Actual receipts stack separately alongside. (Tim's decision April 8 2026 — documented in financials.ts comment)

### Drag-and-Drop Intake — How It Works
Drop any document anywhere on the routing page. No drawer needs to be open.
1. Detect — document type identified by Claude
2. Match — show matched by date + venue + city (confidence score shown)
3. Parse — all fields extracted with confidence scores
4. Review — TM confirms before anything writes to DB (Rule #19 — intake API never writes directly)

### Design System
"Warhol" system — `globals.css` with `--hw-` CSS custom properties, 29 `Hw*` components in `app/components/hw/`

---

## What To Build Next

### Priority 1 — Onboarding Wizard Shell
Spec in `docs/ONBOARDING_WIZARD_SPEC_FOR_DREW.md`. All product decisions made.

**What can be built now (no blockers):**
- 3-field wizard UI (org name, user name, role)
- Wizard state in DB (onboarding_completed, onboarding_step on orgs table)
- Skip/resume behavior
- Freemium hard wall enforcement at API level:
  - TourRouter/DIY: 402 Payment Required when show count ≥ 5 on free tier
  - Localizer: block export/download API route for free tier (preview still works)
- "Setup Guide" persistent link in dashboard

**Blocked on Tim:**
- Demo tour button (needs Beta Test Band seed data — 8-10 dates, venues, deals, hotels, advance statuses, guest list, expenses)
- Upgrade prompt copy for each product's hard wall

### Priority 2 — Remaining Expense Tabs
Transport, Food, Gear, Misc, Merch, Promo, Other tabs all need:
- Summary strip on All tab (same pattern as Hotel and Fuel)
- Per-category breakdown on their own tab

### Priority 3 — Road App
Full spec in `docs/ROAD_APP_V1_SPEC_FOR_DREW.md`. React Native + Expo. ~14-19 days. Separate codebase from Next.js. Needs its own dedicated planning session before starting.

---

## Waiting on Tim

| Item | Status |
|---|---|
| Beta Test Band demo tour seed data | Needed for onboarding wizard demo button |
| Upgrade prompt copy for freemium hard walls | Needed for onboarding wizard |
| Fuel receipt decision follow-up | Done — Tim answered April 8 |

---

## Key File Locations

| What | Where |
|---|---|
| Financial calculation engine | `lib/tourrouter/financials.ts` |
| Mapbox integration | `lib/tourrouter/mapbox.ts` |
| Hotel rate lookup | `lib/tourrouter/hotelRates.ts` |
| Market rate table | `lib/tourrouter/constants.ts` (HOTEL_MARKET_RATES) |
| All AI parsing prompts | `lib/tourrouter/prompts/` |
| Design system components | `app/components/hw/` |
| Routing page (main) | `app/dashboard/routing/[tourId]/page.tsx` |
| Financials page | `app/dashboard/routing/[tourId]/financials/page.tsx` |
| Artist profile | `app/dashboard/artists/[artistId]/profile/page.tsx` |
| Intake API | `app/api/tourrouter/intake/route.ts` |
| Intake confirm | `app/api/tourrouter/intake/confirm/route.ts` |
| Session log | `docs/SESSION_LOG.md` |
| Tim master status | `docs/TIM_MASTER_STATUS_April_8_2026.md` |
| Hotel lodging decisions | `docs/HOTEL_LODGING_DECISIONS_FOR_DREW.md` |
| Road App spec | `docs/ROAD_APP_V1_SPEC_FOR_DREW.md` |
| Onboarding wizard spec | `docs/ONBOARDING_WIZARD_SPEC_FOR_DREW.md` |

---

## Rules — Never Violate

1. `calcTourFinancials()` is the single source of truth. Never recalculate totals inline.
2. `parseDate()` uses `new Date(year, month-1, day)`. Never `new Date(string)`.
3. Excel parsing: `raw:true cellDates:true`. Always.
4. Never use bash heredocs (smart quote corruption risk).
5. Staged preview always — intake API never writes to DB directly.
6. RLS is the silent killer — test every new table's RLS before marking done.
7. Never use `npx vercel --prod` — Vercel auto-deploys on git push.
8. One Claude Code session, one well-defined feature.
9. Always run `npx tsc --noEmit` before committing.
10. `git pull` before starting on any machine.

---

## End of Session Checklist

- [ ] Update `docs/SESSION_LOG.md`
- [ ] `git add . && git commit -m "docs: session log update" && git push`
- [ ] If switching machines: `git push` before leaving, `git pull` before starting
- [ ] Mac mini: `git pull` only before QA sessions, never push from it
