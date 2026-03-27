# HWY61 — Build Plan & Schedule (Updated March 28, 2026)

**Created:** March 25, 2026
**Updated:** March 28, 2026 — integrated Tim's Artist Profile spec, multi-vehicle, blanket expense toggle, profile AI intake
**Engineer:** Drew (Claude Code) | **Product:** Tim
**Target:** 28 weeks to full platform launch (mid-October 2026)

---

## Phase 1 — Ship Localizer (Weeks 1–2) ✅ COMPLETE

Localizer live at `localizer.hwy61.ai`. ToS + Privacy Policy (effective April 1, 2026), Stripe pricing corrected, DMCA registered, Resend Pro verified, custom domain configured.

**REMAINING:** End-to-end testing with Tim using real tour schedules.

---

## Phase 2 — TourRouter Stabilization (Weeks 2–4) ✅ COMPLETE

Save/load state, Add/Delete Show, Vehicle Settings, Drawer editing, fuel calc fix, real billing gate, 45 new columns, 5 new tables with RLS, 3 Storage buckets.

---

## Phase 3 — Band Must-Haves (Weeks 4–10) 🔴 HIGH PRESSURE

### Completed (5 items)
- ✅ Hotel management UI (14 fields, room block conditional)
- ✅ Guest list UI (modal, pass types, status colors)
- ✅ Deposit tracking UI (color-coded status dots)
- ✅ Day sheet PDF (single + batch, 7 sections)
- ✅ Advance sheet PDF (single + batch, 6 sections)

### Blocked — waiting on Tim's spec docs
- ⏸ **Settlement system** — 10+ deal types, projected vs actual, settlement verification mode. BLOCKED on `03_PERSONNEL_PAY_SETTLEMENT_SPEC` (received March 27, now unblocked — ready to build)
- ⏸ **Personnel & pay** — 8 pay structures, pct_net circular dependency, 4 day types. BLOCKED on same spec (received March 27, now unblocked — ready to build)
- ⏸ **Deal types calculation engine** — `calculateShowIncome()` switch function, all 6 versus variations. BLOCKED on `11_DEAL_TYPES_CALCULATION_ENGINE` (received March 27, now unblocked — ready to build)

### NEW — from Tim's March 26 spec
- 🔲 **3A. Multi-Vehicle System** (independent, can start now)
  - Add "+" button to add multiple vehicles per tour
  - Build searchable vehicle database (Claude-generated master list covering all touring regions)
  - Autocomplete search bar for vehicle selection
  - Each vehicle: fuel type, MPG/L100km, passenger capacity, cargo capacity, rental/owned, notes
  - Schema: `tour_vehicles` table or JSONB array on `tours_routing`
  - Update `calcTourFinancials()` to sum fuel costs across all vehicles per leg
  - UI lives in existing Vehicle Settings panel area
  - **Complexity:** Medium | **Dependencies:** None

- 🔲 **3B. Master Artist Profile** (10 sections, progressive entry)
  - Expand `artists` table schema to support full business profile
  - 10 sections: Business Entity, Key Contacts, Tax & Compliance, Insurance, Technical Production, Hospitality & Rider, Promo & Marketing, Merch Defaults, Vehicles & Equipment, Roster (10 sub-sections)
  - Progressive entry — minimum to create: artist name + one roster member (name + role)
  - Auto-populates into every new tour; tour-level overrides available
  - Tour-level edits do NOT change profile defaults unless user explicitly chooses "update default"
  - UI: collapsible sections, each section independently editable
  - Roster sub-sections: Identity, Contact, Emergency, Travel Docs, Travel Preferences, Dietary & Health, Apparel Sizes, Pay & Financial (TM/BM eyes only), Skills & Credentials, Personal Preferences
  - **Complexity:** Large (schema + lots of UI) | **Dependencies:** None — foundation piece

- 🔲 **3C. Blanket Expense Toggle** (quick win)
  - Summary view vs detail view toggle on existing blanket expense system
  - Summary: single line with total per show day / off day
  - Detail: itemized breakdown of each expense component
  - **Complexity:** Small | **Dependencies:** Roster must exist (for personnel-based blankets)

### Build Order for Phase 3 Remaining
1. **Deal types calculation engine** — unblocked, highest priority (settlement depends on it)
2. **Settlement system** — unblocked, depends on deal types engine
3. **Personnel & pay** — unblocked, can parallel with settlement
4. **Multi-Vehicle System** — independent, can start anytime
5. **Master Artist Profile** — independent, large but parallelizable
6. **Blanket Expense Toggle** — quick, do after roster exists

### Time Estimate: 4–6 weeks (extended from original 4 due to 3 new items)

---

## Phase 4 — AI Differentiators (Weeks 10–14) 🔴 HIGH PRESSURE

### Completed (3 items)
- ✅ Universal AI Intake (global drop zone, 4-layer pipeline, confirm API)
- ✅ Advance Automation Engine (state machine, daily cron, 4 email templates, Resend webhooks, digest)
- ✅ Alias Library (3-layer lookup, batch Claude mapping, human confirmation, global promotion)

### Completed this session
- ✅ **All 9 AI intake parser prompts written and committed:**
  - dealMemoPrompt.ts (335 lines) — 3 agency formats + indie
  - settlementParsePrompt.ts (359 lines) — 5 formats + handwritten
  - boxOfficeParsePrompt.ts (150 lines) — ticket count reports, sales audits
  - hotelConfirmPrompt.ts (169 lines) — hotel bookings, receipts, venue recs
  - receiptParsePrompt.ts (142 lines) — expense receipts (19 categories)
  - advanceResponsePrompt.ts (232 lines) — venue advance responses, tech packs
  - contactListPrompt.ts (135 lines) — personnel lists, tour contacts, crew rosters
  - columnMapperPrompt.ts (152 lines) — alias library batch header mapping
  - universalFallbackPrompt.ts (138 lines) — catch-all for unrecognized docs
  - Plus 2 pre-existing: documentTypePrompt.ts, parsePrompts.ts

### Remaining
- 🔲 **Venue confirmation portal** — public form at `/advance/[token]` where venues fill in advance info

### NEW — from Tim's March 26 spec
- 🔲 **4A. AI Intake for Artist Profile** (33 document types)
  - Drag-and-drop onto any profile section or the profile page itself
  - Claude identifies document type, parses fields, matches to correct section and/or roster member
  - Multi-document drops: e.g. drop 6 passport scans at once, Claude matches each to a roster member
  - Stages everything for user confirmation before writing to database
  - Reuses existing Universal AI Intake pipeline + the 9 parser prompts
  - 33 document types mapped to profile sections (per Tim's spec):
    - W-9 → Business Entity (EIN, legal name, entity type, address)
    - Passport scan → Roster member (passport number, country, expiration, DOB)
    - Management agreement → Key Contacts (commission rate, term dates)
    - Certificate of insurance → Insurance (policy number, coverage, expiration)
    - Tech rider / input list → Technical Production (full requirements)
    - Hospitality rider → Hospitality & Rider
    - Vehicle registration → Vehicles & Equipment
    - CDL / certification docs → Roster Skills & Credentials
    - And 25+ more per the spec
  - Same confidence thresholds as Universal Intake (0.95+ auto, 0.75-0.94 review, etc.)
  - **Complexity:** Medium (reuses existing pipeline) | **Dependencies:** Profile sections must exist (Phase 3B)

### Time Estimate: 3–4 weeks (extended from original 4 due to profile intake)

---

## Phase 5 — Finance Layer & Commissions (Weeks 14–16) 🟡 MEDIUM PRESSURE

Presentation layer on `calcTourFinancials()`. No new calculations.

### Tasks
1. Finance Dashboard — `/dashboard/finance` — multi-tour overview
2. Tour Finance page — `/dashboard/routing/[tourId]/finance`
3. Income waterfall — gross → commissions → net
4. Commission system — 9 types, visibility controls, `manager_pct_net` circular dependency
5. Per-show P&L table
6. End-of-tour report — PDF + Excel + CSV, shareable token link
7. Role-based default landing pages

### Time Estimate: 2 weeks

---

## Phase 6 — Contact Intelligence & Polish (Weeks 16–18) 🟢 LOW PRESSURE

### Tasks
1. Shared contacts database — CRUD + search API
2. Account-private layer — notes, settlement history, rating, flags, tags
3. Anonymous flag system
4. Auto-populate on contact fields
5. Contact import via universal intake pipeline
6. Multi-tour dashboard
7. Bug fixes from Tim's testing

### Time Estimate: 2 weeks

---

## Phase 7 — Launch TourRouter (Weeks 18–19) 🟡 MEDIUM PRESSURE

### Tasks
1. Correct all Stripe pricing — every product, every tier
2. Real billing gate verification
3. Launch page — `hwy61.ai` product showcase
4. Tim's outreach begins — first paying users
5. Final end-to-end test with real tour data

### Time Estimate: 1 week

---

## Phase 8 — Road App + DIY + Merch (Weeks 19–26) 🟡 MEDIUM PRESSURE

### 8A. Road App (Weeks 19–22)
- Expo project, token-based auth, 5 screens, offline caching
- Financial data NEVER in crew responses
- EAS Build → App Store + Play Store

### 8B. HWY61 DIY (Weeks 22–23)
- Feature flags on Band codebase
- Stripe product $19/mo
- DIY-specific onboarding

### 8C. HWY61 Merch (Weeks 23–25)
- Inventory tracking, per-show sales, venue commission, end-of-tour report

### Time Estimate: 6 weeks

---

## Phase 9 — Agency Product (Weeks 26–30) 🔴 HIGH PRESSURE

- `/dashboard/agency/*` pages: roster, offers pipeline, calendar, contacts, commissions
- Offer → band handoff crossing org boundaries via RLS
- Account linking (agent ↔ manager per act)
- Radius conflict checking

### Time Estimate: 4 weeks

---

## Summary Timeline (Updated)

| Phase | What | Weeks | Status |
|-------|------|-------|--------|
| 1 | Ship Localizer | 1–2 | ✅ Complete |
| 2 | TourRouter Stabilization | 2–4 | ✅ Complete |
| 3 | Band Must-Haves + Multi-Vehicle + Artist Profile | 4–10 | 🔴 In Progress (5/10) |
| 4 | AI Differentiators + Profile AI Intake | 10–14 | 🔴 In Progress (3/5 + prompts done) |
| 5 | Finance & Commissions | 14–16 | 🔲 Not started |
| 6 | Contact Intelligence | 16–18 | 🔲 Not started |
| 7 | Launch TourRouter | 18–19 | 🔲 Not started |
| 8 | Road App + DIY + Merch | 19–26 | 🔲 Not started |
| 9 | Agency Product | 26–30 | 🔲 Not started |

**Total: ~30 weeks (7.5 months) — extends original 28-week plan by 2 weeks to absorb multi-vehicle system, master artist profile, and profile AI intake.**

---

## What's Buildable Right Now (No Blockers)

These items have zero dependencies and can start immediately:

1. **Deal types calculation engine** — spec received March 27, ready to build
2. **Settlement system** — spec received March 27, depends on deal types engine
3. **Personnel & pay** — spec received March 27, can parallel with settlement
4. **Multi-Vehicle System** — fully independent
5. **Venue confirmation portal** — ready to build
6. **Master Artist Profile (schema + UI)** — independent foundation piece

---

## Document Library Status (Updated March 28)

~54 real-world example documents across 11 categories in `docs/test-documents/` (gitignored, local only):

| Category | Count | Key formats |
|----------|-------|-------------|
| Deal Memos | 7 | MUSIC·TEAM, Wasserman, WME |
| Settlement Sheets | 6 | Prism.fm, Live Nation, handwritten, European, Australian |
| Offer Sheets | 8 | Prism.fm, festival, email, Excel, handwritten, indie |
| Contracts | 4 | WME, Wasserman (2), university/corporate |
| Advance Documents | 5 | Beer City, Tedeschi Trucks, Wasserman Tour Plan, CAA, support offer |
| Tech Specs + Parking | 7 | Vic Theatre, Mission Ballroom, Atomic by Jamo, Smart Financial Centre, Fonda Theatre |
| Marketing Plans | 3 | AEG Ad Plan, iHeartMedia radio promo, Live Nation media list |
| Flights/Travel | 4 | Flight manifest, Priceline hotel receipts (2), venue hotel recs |
| Ticket Reports | 1 | MUSIC·TEAM 35-show ticket count |
| Personnel | 1 | Love Police immigration format |
| Sales Audit | 1 | AEG sales audit report |

---

## AI Parser Prompt Status (Updated March 28)

All 9 prompts written, verified, and committed to `lib/tourrouter/prompts/`:

| Prompt | Lines | Status |
|--------|-------|--------|
| dealMemoPrompt.ts | 335 | ✅ Committed |
| settlementParsePrompt.ts | 359 | ✅ Committed |
| boxOfficeParsePrompt.ts | 150 | ✅ Committed |
| hotelConfirmPrompt.ts | 169 | ✅ Committed |
| receiptParsePrompt.ts | 142 | ✅ Committed |
| advanceResponsePrompt.ts | 232 | ✅ Committed |
| contactListPrompt.ts | 135 | ✅ Committed |
| columnMapperPrompt.ts | 152 | ✅ Committed |
| universalFallbackPrompt.ts | 138 | ✅ Committed |
