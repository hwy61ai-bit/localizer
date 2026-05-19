# HWY61 — Existing Codebase vs. Four-Product Plan

**Date:** May 19, 2026
**Purpose:** Map what's already built against the four-product build scope. Understand reuse vs. net-new work before committing to a build plan.

---

## TL;DR

**~70–75% of the technical foundation for the four-product plan is already built.**

The four-product restructure is primarily a **repositioning and re-surfacing** of capability that already exists in the `tourrouter` codebase, plus three genuinely new things:

1. **Road App mobile** (React Native + Expo) — 100% net new, ~5–6 weeks
2. **Stripe restructure to 30 SKUs + webhook rewrite** — net new, ~2 weeks
3. **Tour lifecycle state machine** (scenario → confirmed → live → closed) — net new, ~1 week

Everything else — the financial engine, deal types, settlement, personnel pay, commission engine, AI intake, advance automation, contact intelligence, finance dashboard, end-of-tour report, Mapbox/geo data, RLS patterns, billing gate scaffolding — is already shipped.

This changes the timeline math. Tim's 6–8 week estimate was unrealistic for a solo engineer, but **5–6 months was probably too conservative.** Realistic: **~4–5 months to soft launch.**

---

## Coverage by product

| Product | Foundation built | Net new work |
|---|---|---|
| **Localizer** | ~95% | Confirmed-tour gate, cross-product prompts, pricing migration to $29/$59/$129, four-product onboarding chooser |
| **HWY61 Plan** | ~80% | Lifecycle state machine, scenario CRUD, side-by-side comparison UI, projected settlement renderer, public viewer routes |
| **HWY61 Books** | ~85% | Variance report UI, multi-member view, receipt photo TM-review UI, Auto-Advancing audit + re-enable |
| **Road App** | ~30% (TM-side mostly built; mobile 0%) | Entire React Native app, push infrastructure, mobile auth flow, receipt photo capture, four new tables |
| **Cross-product infra** | ~60% | Stripe webhook rewrite for 30 SKUs, plan-status column expansion, unified gate logic, four-product onboarding wizard, marketing site (6 landing pages) |

---

## Localizer — ~95% built

This is the easy one. Localizer is in beta and largely complete.

### What's built
- Full asset generation pipeline: Square, Story, Landscape, Print PDF (11×17 / 300 DPI via pdf-lib), TikTok/IG Reels/FB Stories (vertical video), YouTube Shorts (square video)
- Cloudinary two-stage render pipeline
- Custom font upload + tinting (band logos AND sponsor logos)
- Template editor: drag/drop element positioning, visibility toggles, font size sliders, save-state UI
- Venue link distribution system (`/v/e/[token]`)
- Marketing token system (`/v/m/[token]`) — replaced the deferred tour-level Download All
- ShareWithMarketingButton UI
- Toast notifications, animations (fadeInUp, card-hover, save-pulse, progress-shimmer, etc.)
- AI tour schedule import parser
- Auth via Supabase magic link / Resend
- Stripe billing at current $39/$69/$139 pricing
- ToS + Privacy Policy (April 1, 2026 effective date)
- DMCA agent registration ($6, copyright.gov)
- Custom domain `hwy61labs.com` with subdomains
- Email forwarding (support@, dmca@, privacy@)
- Coming Soon gate
- Resend Pro for custom domain emails
- Universal AI Intake works in Localizer too (drop any document)
- Kurt batch 2 a11y work shipped (contrast tokens, button decoupling from crimson, font-size bumps, dismissible Upload Tips, dividers)
- PostHog instrumented with masked session replay

### Net new for the four-product plan
- **Confirmed-tour gate** — hard block on generating assets against Scenario-state tours. Small change, one gating function.
- **Cross-product prompt UI** — banner/CTA when a user has Localizer but no Plan or Books active.
- **Pricing migration to $29/$59/$129** — Stripe product creation + migrate existing customers (no grandfathering decided). Done as part of the Stripe restructure phase.
- **Four-product onboarding chooser** — replacing the long-blocked Option B narrative work. This is a larger ask of Tim now — needs the four-product version of the narrative, not the original Localizer-only one.

**Estimate: 1 week of net-new work**, mostly gating + cross-product UI. Pricing migration falls under the Stripe phase.

---

## HWY61 Plan — ~80% built

Plan is a re-surfacing of existing TourRouter routing/budgeting capability under a new product name, plus a lifecycle state machine.

### What's built (and carries forward to Plan)
- `tours_routing` table with full routing data
- `tour_shows` table (90+ columns) with everything needed to model a show
- `calcTourFinancials()` — the single source of truth for all financial math (protected file)
- Mapbox geocoding + drive time integration; `geocode_cache` and `drive_cache` tables
- 332-city curated geo database (US + Europe major touring markets)
- 24 countries with airport coverage; CITY_COORDS/CITY_AIRPORTS/AIRPORT_COORDS constants
- Currency engine, parsers, day-type determination (Show/Off/Travel/Load-In)
- **14 deal types calculation engine** (`calculateShowIncome.ts`, 480 lines) — covers NBOR, GBOR, vs, plus, flat, sliding scale, bonus, straight pct, "from dollar 1"
- Multi-vehicle support (54-vehicle database, searchable, per-vehicle MPG)
- Blanket expense toggle (summary vs detail, roster awareness)
- Personnel pay engine (`personnelPay.ts`, 448 lines, 8 pay structures including pct_net circular dependency)
- Universal AI Intake with 9 parser prompts (~1,812 lines) — deal memo, settlement, box office, hotel, receipt, advance response, contact list, column mapper, universal fallback
- CSV/Excel/PDF import layer with column mapper + staged review
- Routing PDF parsing
- Drag-and-drop intake (global drop zone, 4-layer pipeline)
- Master Artist Profile (10 sections, 682-line page)
- Public viewer routes pattern (already proven via Localizer venue links and finance report tokens)

### Net new for Plan
- **Lifecycle state machine** — `lifecycle_state` column on `tours_routing` (`scenario` | `confirmed` | `live` | `closed`), `scenario_set_id` UUID, `confirmed_at` / `started_at` / `closed_at` timestamps
- **`projected_settlements` table** — JSONB settlement per-line, share token, RLS
- **Scenario CRUD** — create scenario tours, group variants in scenario_sets
- **Side-by-side comparison UI** — 2 scenarios per the locked decision
- **Projected settlement renderer** — per-line view at 50%/75%/100% capacity, share-as-link
- **`/dashboard/plan/*` route surface** — split from `/dashboard/tourrouter/*`
- **"Confirm tour" action** — state flip from scenario → confirmed
- **Confirmed-tour read-only mode** in Plan once a tour is confirmed

**Estimate: 3 weeks of net-new work.** The math layer and data model already exist. This is UI work plus a state machine.

---

## HWY61 Books — ~85% built

Books is the most over-built product. The vast majority of "tour accounting" capability was completed in Phases 3–5 of the original build plan.

### What's built (and carries forward to Books)
- Settlement system: 640-line panel with waterfall entry, projected vs actual, verification mode, manual TM confirmation rule
- Settlement parser with handwritten document handling (ambiguous character flagging, crossed-out values, initialed corrections)
- Personnel pay with 8 pay structures, roster management UI, pct_net circular dependency resolution
- Commission engine (9 commission types) and income waterfall UI
- Multi-tour finance dashboard
- End-of-tour report (PDF + Excel + CSV + shareable token via `finance_report_links`)
- Tour expense tracking (`tour_expenses` table)
- Accommodation expense tab (with three-state hotel waterfall: actual → confirmed → projected; fuel estimate persistence stack-separately decision)
- Advance Automation Engine: full state machine (not_started → Sent → Follow-Up 1/2 → Final Nudge → Escalated → Confirmed), daily Vercel cron at 10am UTC, 4 email templates, Resend webhook handler, daily digest, advance status badges
- Alias library (3-layer lookup, batch Claude mapping, human confirmation + learning, global promotion logic)
- Venue confirmation portal (`/advance/*`)
- Guest list UI with pass types, status colors
- Deposit tracking with color-coded dot status
- Day sheet PDF (single + batch, US Letter, 7 sections)
- Advance sheet PDF (single + batch, 6 sections)
- Contact intelligence (search, anonymous flagging, autocomplete hook with 300ms debounce)

### Net new for Books
- **Variance report UI** — per-line projected vs. actual comparison, depends on Plan being available. New `tour_variance_reports` table.
- **Multi-member view UI** — TM seeing per-roster-member compensation/per-diems
- **Receipt photo TM-review UI** — backend already handles receipts; need the inbound queue dashboard
- **Auto-Advancing audit + re-enable** — currently disabled. Unknown scope until audited. Could be a day, could be 2 weeks.
- **`/dashboard/books/*` route surface** — split from `/dashboard/tourrouter/*`
- **Remaining expense tabs** — Transport, Food, Gear, Misc, Merch, Promo, Other. Currently only Accommodation is fully built. Pattern is established; mechanical work.

**Estimate: 2–3 weeks of net-new work, plus 0–3 weeks for Auto-Advancing depending on audit outcome.**

---

## Road App — ~30% built

This is where the real net-new work concentrates. The TM-side dashboard mostly already exists in TourRouter. The mobile app is 100% greenfield.

### What's built (carries forward)
- Day sheet schema on `tour_shows`: `load_in_time`, `soundcheck_time`, `doors`, `showtime`, `onstage`, `curfew`, `venue_wifi_password`, `production_contact`, `production_contact_phone`, `hospitality_notes`, hotel fields — all the fields the mobile app needs to display already exist
- Per-diem schema in `tours_routing.tour_roster` JSONB + per-show overrides
- Compensation schema in `tour_roster` JSONB
- Routing PDF parsing
- Drag-drop intake for advance docs
- `tour_shows_crew` view (financial fields stripped for crew access)
- Mapbox drive times
- Token-based crew access pattern (originally designed in `HWY61_TECHNICAL_SPEC.md` for the original Phase 13 crew app)

### Net new — TM-side web dashboard for Road App
- `/dashboard/road-app/*` route surface (overview, intake, per-tour edit, roster, invites, broadcasts, settings)
- Most of these features exist in `/dashboard/tourrouter/*` and just need a Road-App-scoped surface — copy + re-mount of existing components
- New: per-member invite link generation (deep links into mobile app), broadcast UI

### Net new — Mobile app (100% greenfield)
- Expo project initialization, build/submit pipeline (EAS, Apple Developer $99/yr, Google Play Developer $25 one-time)
- Token-based auth + deep link claim flow (`POST /api/mobile/auth/claim`)
- Five+ screens: Tonight, Schedule, Per Diems, My Comp, Receipts, Notifications, Settings
- AsyncStorage offline caching (the killer feature for dead-zone venues)
- Pull-to-refresh
- Camera integration for receipt photos
- Push notification infrastructure (Expo Push, schedule-change detection, broadcast delivery)
- Native UI polish (must feel native for App Store review)

### Net new — Backend mobile API
- `GET /api/mobile/tours`, `/today`, `/schedule`, `/per-diems`, `/comp`, `POST /api/mobile/tours/[id]/receipts`, `POST /api/mobile/push/register`, `POST /api/mobile/auth/claim`
- RLS enforcement so band members only see their own tours and their own comp/per-diems

### Net new — New tables
```sql
mobile_push_tokens          -- device registrations
pending_receipt_photos      -- queue (works in standalone Road App, surfaces in Books)
tour_broadcasts             -- TM one-off messages
per_diem_received           -- "got it" markers
```

**Estimate: 5–6 weeks of net-new work.** This is the longest phase. Most of the time is in React Native — the backend API surface is mostly thin wrappers around existing data.

---

## Cross-product infrastructure — ~60% built

### What's built
- `orgs.localizer_plan_status` and `orgs.bundle_plan_status` columns (need 3 more + rename bundle → suite)
- Three-state access model (`'none' | 'free' | 'paid'`) shipped April 9 (Unit B + Unit C)
- Welcome wizard with three-field flow (org name / user / role)
- `OnboardingGate`, `ensureOrgExists()` helper in auth callback
- Auth: Supabase magic link via Resend (PKCE verifier fix shipped April 14, 4-day daily auth pain resolved)
- Centralized `ADMIN_EMAILS` in `lib/auth/adminEmails.ts`
- `lib/supabaseAdmin` for public routes vs `supabaseServer` for authenticated routes
- Global `fetch` wrapper with `cache: "no-store"` in `lib/supabaseAdmin.ts`
- `lib/localizer/billingGate.ts` with venue-download caveat documented in source
- Marketing site shell at `hwy61labs.com` with subdomain routing (currently behind COMING_SOON gate)
- Feature flag system (DIY vs TourRouter)
- Notifications table with RLS

### Net new
- **Stripe products: 30 SKUs.** 5 products (Road App, Plan, Localizer, Books, Suite) × 3 tiers × 2 intervals. Plus archive of legacy products.
- **Stripe webhook rewrite.** Currently writes legacy `plan` and `plan_status`. Needs `PRICE_TO_PRODUCT_TIER` mapping + per-product/tier column writes.
- **Plan-status column expansion.** Add `road_app_plan_status`, `plan_plan_status`, `books_plan_status` + tier columns. Rename `bundle_plan_status` → `suite_plan_status`.
- **Unified gate logic** (`lib/billing/gates.ts`) with `getProductAccess()`, suite-supersedes-all, Books-supersedes-RoadApp cascade.
- **30-day grace period** for new orgs — bake into gate logic from day one.
- **Four-product onboarding wizard rebuild** — survey → recommendation → 30-day trial start.
- **Marketing site** — 6 landing pages (`/`, `/road-app`, `/plan`, `/localizer`, `/books`, `/touring-suite`) + `/pricing` page with all SKUs + annual toggle.
- **Removal of COMING_SOON gate** when ready to launch publicly.

**Estimate: 4–5 weeks of net-new work**, with marketing site copy being the most compressible item.

---

## The actual net-new work list

Pulling it all together — here's what genuinely needs to be built:

| Item | Estimate | Phase |
|---|---|---|
| Stripe 30 SKUs + webhook rewrite + plan-status migration + unified gate logic + 30-day grace | 3 weeks | 1A |
| Lifecycle state machine + projected_settlements + Plan route split + scenario CRUD + side-by-side compare + projected settlement renderer | 3 weeks | 1B |
| Auto-Advancing audit | 1 week (best case) – 3 weeks (worst case) | 1B parallel / 1D |
| Mobile app: Expo init, auth, 5+ screens, offline cache, push, receipt camera | 5–6 weeks | 1C |
| Road App TM-side web dashboard + mobile-facing API + 4 new tables | 1.5 weeks | 1C (parallel) |
| Variance report UI + multi-member view + receipt-photo review UI + remaining expense tabs + Books route split | 2–3 weeks | 1D |
| Four-product onboarding wizard rebuild + Localizer Confirmed-tour gate + cross-product prompts | 2 weeks | 1E |
| Marketing site: 6 landing pages + pricing page + signup flow update | 2–3 weeks | 1E |
| Integration testing + polish + soft launch readiness | 2 weeks | end of 1E |

**Total net-new work: 21–28 weeks of sequential effort.** With aggressive scope cuts and an Auto-Advancing audit that comes back clean, the floor is realistic at **~17 weeks (~4 months)** to soft launch.

---

## Revised timeline (informed by what's built)

This replaces the 5–6 month estimate in `HWY61_Engineering_Response_To_Build_Scope_May_19_2026.md`.

- **Phase 1A — Billing foundation:** Weeks 1–3
- **Phase 1B — Plan surface + Auto-Advancing audit started in parallel:** Weeks 4–6
- **Phase 1C — Road App:** Weeks 7–12
- **Phase 1D — Books polish (variance, multi-member, receipt review) + Auto-Advancing finish:** Weeks 13–14
- **Phase 1E — Onboarding + marketing site:** Weeks 15–17
- **Soft launch:** Weeks 18–22
- **Public launch:** Week 23+

Soft launch in **mid-September 2026**. Public launch by **mid-October 2026**.

That assumes:
- Solo engineering throughput
- Auto-Advancing audit comes back manageable (1 week, not 3)
- Onboarding wizard narrative arrives from Tim by week 4
- No surprises in the Stripe webhook rewrite

---

## The big risks revisited

1. **Auto-Advancing.** Still the biggest single unknown. Audit it in week 1 of Phase 1A, independently of the billing work. If it's a real rebuild, that pushes soft launch 2–3 weeks. Pre-decide: if the audit is ugly, ship Books to soft launch with Auto-Advancing labeled "coming back" rather than holding the whole launch.

2. **The mobile app App Store review window.** First submission can take up to a week per Apple's policies. Build EAS submission into week 11–12, not week 17. Submit early, iterate during the back half of Phase 1D/1E.

3. **Stripe webhook edge cases.** 30 SKUs × subscription lifecycle events is a wide test matrix. Build the manual override path (admin can flip plan-status if webhook misses) as a safety net before depending on the webhook for production traffic.

4. **The four-product onboarding narrative.** This blocks Phase 1E. If Tim doesn't deliver the narrative by week 4, Phase 1E starts late and the soft launch slips. Treat this as the single biggest external dependency.

5. **The Promoter Edition question.** The data model is being built around a four-product architecture that doesn't include a venue/promoter org concept. If Promoter Edition comes back in Phase 2, a `venue_orgs` table or org-type discriminator may need retrofitting. Worth a 1-hour design pass before Phase 1A to make sure today's schema isn't actively hostile to that future direction.

---

## Bottom line for the conversation with Tim

The four-product plan looked enormous when first read. After mapping it against the codebase, the real ask is:

- A new mobile app
- A billing infrastructure modernization
- Three new database concepts (state machine, projected settlements, variance reports)
- A re-shuffling of existing TourRouter functionality into two product surfaces
- A marketing site that tells the four-product story

That's a credible 4-month solo build, not the 6-8 weeks Tim's scope estimated, and not the 5-6 months my first read suggested either. The reason it's faster than my first take: I underestimated how much of the Books and Plan product surfaces already exist as TourRouter features.

The reason it's slower than Tim's take: there's only one engineer, and parallelizing six workstreams doesn't apply.

---

*Drafted by Drew, May 19, 2026.*
