# SPEC.md — v2 (DRAFT for Tim freeze)
**HWY61 LLC · codename Delta61 · product name TBD pending trademark knockout**
**v2 drafted August 21, 2026 against: SPEC v1 draft (8/19) + Tim's Pass 1 answers (Aug 2026)**
*Status: DRAFT v2. Incorporates every change from Tim's Pass 1. Freezes on Tim's sign-off of the change list below. After freeze: no feature exists unless it's in this file; when code and spec conflict, spec wins.*

---

## CHANGE LIST — v1 → v2 (Tim: this is the only section you need to read)

Eight of your ten answers were "agree/confirmed" and required no spec text change. Five edits landed:

| # | Where | Change | Source |
|---|---|---|---|
| C1 | §5 F6 (Exports) | **Pay detail and commission lines are now per-export toggles, default OFF.** Opt in, never opt out. Provenance footnotes remain always-on. | Your item 7 |
| C2 | New §8 (Acceptance criteria) | Your four trust tests are now formal, testable acceptance criteria the build must pass before Nashville. Adds one input deliverable: a **hand-built reference spreadsheet** (owner: Tim) for the to-the-dollar parity test. | Your item 9 |
| C3 | §5 F3 (Intake) | Confirm-screen speed requirements added to the gate: pre-filled fields, low-confidence fields surfaced first, one keystroke per accept. | Your item 6 |
| C4 | §2 (Stack & skeleton) | Design adjectives written into the token definition as binding direction: **calm, precise, dense-but-legible, trustworthy, unshowy.** No music-biz theatrics. | Your item 8 |
| C5 | §1 (Decisions of record) | Recorded: **B primary, A must feel at home.** Home screen is one tour, deep — money bar pinned, net-to-band up front. Roster/agency view is a tab, not the front door. Noted as distinct from F5's demo-order decision (product home ≠ demo opener; both stay explicit). | Your item 1 |

Nothing was added to scope (your item 10) and nothing was removed. Everything else below is v1 text unchanged. Sign off on these five and the spec freezes.

---

## 0. What this product is

A standalone, instant, detailed **tour budgeting tool** for the touring music industry. Feed it tour documents; get back a complete, defensible budget for everything happening on a tour — band & crew pay, lodging, transportation, flights, commissions, per-show P&L — and export it beautifully. Nothing after the numbers are locked lives in v1: no expense tracking, no advancing, no guest lists, no contacts, no emails to anyone.

**Mission:** a demo-able v1 for the Nashville agency meeting in **6–8 weeks** (hard date from Tim, TBD). The demo is the product decision filter: whatever makes the demo undeniable stays; everything else is cut.

**Strategy context (shapes the build, not a feature):** dual-track. Door 1: white-label to an agency (their version, HWY61 keeps the asset). Door 2: SaaS on the Localizer model. Multi-tenancy stays; billing polish waits; nothing in the demo hints at cross-agency data sharing.

## 1. Decisions of record (Tim, 8/19 + Pass 1)

1. **Prices come from maintained tables, overridable everywhere.** Hotels by city/region × star tier; fuel by region; flights by route. Provenance is a feature: the product can say where every number comes from.
2. **The AI flight-price lookup survives as an on-demand "check current prices" assist** (with its 7-day cache), layered on the flight tables. Repositioned, not rebuilt. Results labeled as estimates.
3. **No contacts, no venues layer, no sharing.** Cut entirely from v1. Nothing in UI, schema naming, or demo may imply cross-agency anything.
4. **Approval lane:** Drew runs screens/internal copy/UX solo. Tim approves: anything shown in Nashville, anything customer-facing outside the demo, anything legal/ownership.
5. **Name-agnostic build.** No product name baked into repo name, DB project name, package name, env var prefixes, email templates, or exported files' branding until the name lands. Codename **Delta61** (decided 8/19): repo `delta61-app`, Supabase project `delta61-prod`, package `delta61`, domain modules under `lib/delta61/`. All display naming flows from one branding config file (single point of rename).
6. **Primary chair: B — the TM / self-managed act working one tour at a time. A (agency chair) must still feel at home.** *(Pass 1, item 1.)* The home screen is one tour, deep: money bar on top, net-to-band right there. The agency roster view exists but it's a tab, not the front door. Rationale of record: the roster view layers onto a great single-tour experience more easily than the reverse. **Note:** this is the *product home* decision. F5's demo-order question ("dashboard may lead the pitch") is a separate *presentation* decision, resolved in rehearsal — the two do not conflict and neither reopens the other.
7. **Intake trust: always confirm, no auto-save, ever.** *(Pass 1, item 6, elevating v1 §4's intake posture to a decision of record.)* For a tool about money, the human look is the feature. Counterweight requirement: the confirm screen must be fast — see F3 gate.
8. **Overrides: edit-in-place everywhere, subtle mark on overridden numbers, original remembered, one-click revert.** *(Pass 1, item 4 confirmation.)* Nothing hides which numbers are ours versus the tables'.

## 2. Stack & skeleton (week 1)

Next.js App Router + TypeScript strict · Supabase (new project, neutral name, HWY61 org) · Vercel · Resend · Stripe wiring pattern only · Tailwind + stock shadcn themed by tokens defined once. Supabase magic-link auth (`@supabase/ssr` `createBrowserClient`, PKCE cookie lesson applied). CLAUDE.md with full scar-tissue list in the first commit. **Migrations are the source of truth from table one** — every table exists in a migration file, no manual-SQL drift. RLS: the org-membership pattern from the inventory, applied uniformly, reviewed once as its own task.

**Design direction (binding, from Tim's Pass 1 item 8):** the token pass targets **calm, precise, dense-but-legible, trustworthy, unshowy.** No music-biz theatrics. The design says "your money is handled." Every token and component choice is testable against these five words; anything that reads as showy fails review.

Multi-tenant from day one (orgs/org_members). Billing: Stripe wiring pattern present, no tiers/pricing/checkout polish in v1.

## 3. Data model (new migrations, informed by old schema)

Port as new migrations, pruned to scope:

- **`d61_tours`** (from `tours_routing`, minus `localizer_tour_id`, minus advance_config): vehicle config, mpg, fuel price (defaults from tables, overridable), flight threshold, blanket expenses, currency rates, roster, lodging defaults, hotel budget override.
- **`d61_shows`** (from `tour_shows` 110-col taxonomy, pruned): keep deal (all types, tiers, scaling, potentials), lodging (rooms, rates, blocks, cutoffs, attrition), settlement-relevant money fields, load-in basics. **Drop:** advancing state machine, wifi/socials, guest-list linkage, form tokens. The crew-visibility concept (`tour_shows_crew`) is out of v1; noted for later.
- **`d61_artists`** (own table, not shared): name + the config JSONB blobs (`default_commissions`, `default_roster`, `lodging_defaults`, `vehicles_equipment`). Migration from old DB = export blobs for any tours we want as demo seeds.
- **`intake_documents`**, **`field_aliases`** (incl. per-agency learning column), **`geocode_cache`**, **`drive_cache`**, **`flight_price_cache`** — port as-is minus contact/venue references.
- **`geo_cities`** — seed with the ~200 curated rows only (city, coords, population, timezone, IATA). Cache rows do not migrate.
- **Rate tables (new):** `hotel_rates` (city/region × star tier, effective-date column for maintenance), `fuel_prices` (region, fuel type, effective date), `flight_route_prices` (route, cabin, effective date). Admin-editable; every consumer of these values supports manual override at the tour/show level with provenance shown ("table · region default · manual").
- **Postgres:** recreate `is_org_member`. Recreate `nearest_airport` (definition extracted 8/19: SQL function over `geo_cities` rows with IATA codes, returns nearest within a 150 km default radius). **Fix on recreate:** replace the flat-plane `point <-> point × 111.32` distance with proper great-circle math (`earthdistance`/haversine) — the old approximation overstates east–west distance at higher latitudes; fine for US airport-picking, wrong in principle, cheap to fix now.

## 4. Ported engines (move-in week; fixes applied on entry)

`financials` · `calculateShowIncome` (deal-types engine) · `commissions` (9 types + visibility) · `personnelPay` (8 components × 4 day types) · `vehicleDatabase`/`vehicleTypes` · `hotelRates` (rewired to rate tables) · `geography` · `mapbox` · `flights` (threshold + nearest-airport) · `currency`/`fetchLiveRates` · `exports` data layer (`buildExportRows`) · `parsers`/`columnMapper` · `aliasLibrary`/`aliasPromotion` · `constants` · prompt library (9 of 10: contact-list parser shelved with the contacts cut) + registry.

**Fixes applied during port:** geocoder off-day guard (day-type check before geocoding; "OFF"/"TRAVEL"/blank never geocode) · country-hint pass (country context from tour routing carried into lookups; reject cross-country mismatches) · geocode-cache dedupe on write · prompts re-baselined on a current model and re-tested against the sanitized doc set · flight lookup gated to explicit user action (button), never automatic.

## 5. Features (build order; each = one Claude Code feature-prompt with gates)

**F1 — Skeleton + auth + org shell.** Sign in by magic link, create org, empty dashboard. *Gate: build passes; Playwright: signup → dashboard.*

**F2 — Engine move-in + rate tables.** All §4 modules in, unit smoke on money math (one reference tour computed end-to-end matches old build's numbers). Rate tables seeded with launch dataset (US/CA/UK/EU cities we tour). *Gate: reference-tour parity.*

**F3 — Intake.** Drop PDF/CSV/text → classify → parse with per-field confidence → confirm screen → tour + shows created/updated. Column-mapper + alias learning wired (the per-agency memory is a demo beat). Nothing writes without human confirmation — ever (decision of record #7). **Confirm-screen speed requirements (Pass 1, item 6):** every field pre-filled from the parse; low-confidence fields surfaced first; accepting a field is one keystroke. *Gate: sanitized doc set — deal memo, day sheet, two agency-format tour sheets — each lands correctly through the confirm flow, AND the confirm pass on a parsed tour sheet is fast enough that confirmation never feels like data entry (low-confidence-first ordering and one-keystroke accept verified in the Playwright path).*

**F4 — Tour budget view (the core surface).** Per-tour: shows table (deal + income per show), roster & pay panel (all 8 components, per-member breakdown), lodging panel (rooms/star tier/overrides per show; projections from tables), transportation panel (vehicle picker from database, fuel math per leg, drive times, blanket expenses), flights panel (drive-vs-fly per leg with threshold, nearest-airport fallback, table price + "check current prices" button), commissions panel (types + who-sees-what), tour P&L rollup with currency handling. Every projected number shows provenance and accepts override. Per decision of record #6, this is the product's home screen: money bar pinned on every tab, net-to-band up front. *Gate: Playwright core path; the reference tour reads correctly on screen.*

**F5 — Multi-tour dashboard.** Server-side aggregation (one query path, no client N+1): every tour, P&L each, active vs. completed, roster-wide totals. Built third; **demo position decided in rehearsal** (Tim: may lead the pitch — "every tour we have out, on one screen"). Lives as a tab off the single-tour home, per decision of record #6.

**F6 — Exports (the product).** PDF (full design pass: cover, budget summary, per-show detail, provenance footnotes — this is what the room holds), Excel, CSV — all from `buildExportRows` so they can't disagree. **Pay detail and commission lines are per-export toggles, default OFF (Pass 1, item 7).** A budget forwarded to a promoter or band member must never leak individual pay by accident: the exporter opts in per export; no sticky "remember my choice" that could silently carry pay detail into a later export. Provenance footnotes are always on and are not toggleable. Branding pulled from the single config file (rename-safe). *Gate: Tim approves the PDF (Nashville-visible), including the default-OFF state of both toggles.*

**F7 — Demo seed + rehearsal build.** One-click seed of a realistic tour from the sanitized doc set; preview deploy stable for live demo; both demo orders (intake-first vs. dashboard-first) rehearsed. *Gate: full dry run, twice, both orders.*

## 6. Out of scope for v1 (deliberate, defend the line)

Expense tracking/receipts · advancing (emails, state machine, cron) · guest lists · contacts & venues (any form) · Road App · crew-visibility variant · Localizer integration of any kind · billing tiers/pricing page/checkout polish · live price feeds · public marketing site beyond a placeholder.

Per Tim's Pass 1 item 10: no additions. Scope discipline got Localizer shipped; same rule here.

## 7. Protected files (careful-diff protocol, not feature-prompts)

Everything under `lib/delta61/` money math (`financials`, `calculateShowIncome`, `commissions`, `personnelPay`), the export data layer, migrations, and the branding config. These change by explicit diff review only.

## 8. Acceptance criteria (NEW in v2 — from Tim's Pass 1, item 9)

Tim's trust sentence, converted to four pass/fail tests. The build is not Nashville-ready until all four pass; each is tested explicitly, not assumed.

| # | Criterion | How it's tested | Feature gate it rides on |
|---|---|---|---|
| A1 | **Matches a hand-built spreadsheet to the dollar on a reference tour.** | Side-by-side against the reference spreadsheet: every per-show income figure, every pay line, lodging total, transport total, commissions, and final net-to-band identical to the dollar. Any mismatch is a bug in one of the two — resolved and documented either way. | F2 (engine parity) + F4 (on-screen parity) |
| A2 | **Every number answers "where did this come from" in one click.** | Audit pass over the F4 surface and F6 exports: every projected or computed figure exposes provenance ("table · region default · manual · computed-from") in one interaction, no dead ends. | F4 + F6 |
| A3 | **Nothing ever saves silently.** | Intake writes only through the confirm screen (decision of record #7). All other writes are user-initiated edits with visible result state. Verified by code review of every write path + Playwright assertions that no DB mutation occurs without a corresponding user action. | F3 + all features |
| A4 | **A TM who's never seen it can build a defensible budget in under 30 minutes.** | Timed cold-user test before Nashville: a real TM (not Drew, not Tim) gets the app and a tour document, no walkthrough. Clock stops when they export a budget PDF they'd be willing to hand an artist. Under 30 minutes = pass. | F3 → F4 → F6 end-to-end |

**Input deliverable this section creates:** the **hand-built reference spreadsheet** for A1. Owner: **Tim** (the domain expert and archetype user). It should be built independently of the app — same tour as the sanitized demo seed or a second real-structure tour, Tim's call — and delivered before F2's gate runs, since F2's parity check needs it. Listed alongside the sanitized doc set as a pre-build input.

## 9. Open items to close before freeze

**Closed 8/19:** `nearest_airport` extracted (see §3) · codename = **Delta61** · sanitized doc set defined: four documents — one deal memo, one WME-style tour sheet, one CAA-style tour sheet, one day sheet; real structures, invented artists/venues/numbers; Drew builds, Tim reviews (Nashville-visible) · rate-table seed scope: hotel rates for the ~200 curated `geo_cities`; fuel by US region + Canada + UK/EU; flight routes = demo-tour pairs + ~12 common pairs (regional fallback + manual override cover the rest; widen anytime, it's just data).

**Closed via Pass 1 (Aug 2026):** primary chair (B, decision of record #6) · budget entry paths (both, documents-first emphasized) · tour screen organization (tabs + pinned P&L bar) · override behavior (decision of record #8) · artist profile spine (confirmed as specced, no v1 additions) · intake trust (always confirm, decision of record #7) · export sections/order (confirmed, with C1's toggle change) · design adjectives (§2) · acceptance criteria (§8) · scope (no additions).

**Still open:** Nashville date + contact (Tim) → sets the real deadline · **Tim's hand-built reference spreadsheet (§8, needed before F2 gate)** · Tim sign-off on the v2 change list → **FREEZE.**

---
*Change control after freeze: additions require a spec edit first (one line is fine), so the doc stays the single source of truth Claude Code builds from.*
