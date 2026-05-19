# HWY61 — Detailed Weekly Build Plan

**Date:** May 19, 2026
**Companion to:** `HWY61_Codebase_vs_Four_Product_Plan_May_19_2026.md` and `HWY61_Engineering_Response_To_Build_Scope_May_19_2026.md`
**Purpose:** Granular week-by-week breakdown of the four-product launch build. Each week has the engineering work, the design work, and the decision points.

---

## A note on Plan and Books

Both run on the `tourrouter` codebase. The math layer, drawer components, settlement panel, route table, and financial primitives all reuse. **But the page-level UI composition is essentially new for both products** because they solve different jobs at different points in a tour's lifecycle.

| | Plan | Books |
|---|---|---|
| **When it's used** | Pre-tour ("should I take this?") | During / post-tour ("where are we?") |
| **Hero surface** | Scenario set view with A/B compare | Live tour dashboard with variance |
| **Primary CTAs** | "Model a scenario," "Confirm this tour" | "Settle this show," "Review receipts" |
| **Data emphasis** | Projections, capacity scenarios, comparisons | Actuals, variances, settlements |
| **Empty state** | "Drop an offer, see if it works" | "Confirm a tour in Plan to start tracking" |

That means each gets new top-level pages, new landing surfaces, and a fresh information architecture — even though the underlying components and data are shared.

---

# Phase 1A — Billing Foundation (Weeks 1–3)

This phase has zero customer-visible UI. It's foundational infrastructure that eliminates the manual SQL-flip workflow and lets everything else gate cleanly.

## Week 1 — Stripe + plan-status migration

### What you're building
- All 30 Stripe products created in dashboard (5 products × 3 tiers × 2 intervals)
- Schema migration adding per-product plan-status and tier columns to `orgs`
- Soft start of the Auto-Advancing audit (runs in background all week)

### Engineering work
- Stripe dashboard: archive legacy products (TourRouter Standalone $29, Add-on $20, Add-on Agency $30, old Localizer Basic $39). Create new products with correct pricing per the build scope doc (§10.1).
- Capture all 30 `price_xxx` IDs into a `STRIPE_PRICE_ID_MAP` constant in env/secrets.
- Supabase migration:
  ```sql
  ALTER TABLE orgs ADD COLUMN road_app_plan_status TEXT;
  ALTER TABLE orgs ADD COLUMN plan_plan_status TEXT;
  ALTER TABLE orgs ADD COLUMN books_plan_status TEXT;
  ALTER TABLE orgs ADD COLUMN road_app_tier TEXT;
  ALTER TABLE orgs ADD COLUMN plan_tier TEXT;
  ALTER TABLE orgs ADD COLUMN books_tier TEXT;
  ALTER TABLE orgs ADD COLUMN localizer_tier TEXT;
  ALTER TABLE orgs RENAME COLUMN bundle_plan_status TO suite_plan_status;
  ALTER TABLE orgs ADD COLUMN suite_tier TEXT;
  ```
- Single-statement migrations only (no BEGIN/COMMIT — your codebase rule).
- Backfill existing customers: `UPDATE orgs SET localizer_tier = ... WHERE localizer_plan_status = 'active'` mapping their old plan to new tier names.

### Auto-Advancing audit in parallel
- Open `lib/tourrouter/advance/*` and `app/api/advancing/*` and `app/advance/*`.
- Specifically: state machine logic, daily Vercel cron at 10am UTC, Resend webhook handler, 4 email templates, escalation logic.
- Determine: why was it disabled? Is it a data integrity issue, a deliverability issue, a logic bug, or just untested? Write findings to `docs/AUTO_ADVANCING_AUDIT_2026-05.md`.

### Design needed
- None this week.

### Decisions to lock
- Final 30 SKU names and exact pricing (done if Tim's scope doc is authoritative).
- Whether to keep existing legacy Stripe products around for in-flight subscriptions or migrate them all over immediately.

---

## Week 2 — Webhook rewrite + gate logic

### What you're building
- Stripe webhook that writes per-product plan-status columns instead of legacy columns
- `lib/billing/gates.ts` with unified `getProductAccess()` function and supersedes logic
- Test sandbox subscriptions through every SKU

### Engineering work
- Extend `app/api/stripe/webhook/route.ts`:
  - Add `PRICE_TO_PRODUCT_TIER` map (price_id → { product, tier })
  - Handle `subscription.created` / `subscription.updated` / `subscription.deleted` events
  - Write to `${product}_plan_status` and `${product}_tier` columns
  - For Suite SKUs: write to `suite_plan_status` and `suite_tier` only (don't touch individual product columns — the gate handles the cascade)
  - Use `.select().maybeSingle()` after every write (your silent RLS pattern)
- Build `lib/billing/gates.ts`:
  - `getOrgPlanStatuses(orgId)` — reads all five columns
  - `isSuiteActive(orgId)` — short-circuit check
  - `getProductAccess(orgId, product)` — cascading logic (suite → books-supersedes-roadapp → specific)
- Replace existing `checkTourRouterAccess` and `checkLocalizerAccess` call sites with the unified function.
- Test plan: spin up 30 sandbox subscriptions in Stripe test mode, verify each writes the correct columns. Cancel each, verify status flips to `canceled`. Past-due each, verify status flips to `past_due`.

### Design needed
- None this week.

### Decisions to lock
- The exact mapping of Stripe `subscription.status` values (`trialing`, `active`, `past_due`, `canceled`, `unpaid`, `incomplete`, `incomplete_expired`) to internal statuses (`active`, `past_due`, `free`).

---

## Week 3 — Grace period + soak

### What you're building
- 30-day grace period logic for new orgs (no card required)
- Pricing migration for existing Localizer customers ($39→$29, $69→$59, $139→$129)
- Soak the new infrastructure with the current Localizer beta

### Engineering work
- In `lib/billing/gates.ts`, add grace-period check: if `org.created_at` is within 30 days AND no Stripe subscription exists, return `active` for the product they signed up under.
- Build email reminders at day 21, 28, 30, 35 via Resend. Use existing transactional email pattern.
- Build "trial ending" UI state — a non-punitive banner across the dashboard.
- Stripe: create migration plan to move existing Localizer customers to new lower-priced subscriptions. Stripe will prorate. Communicate via Resend email batch.
- Soak: every existing beta user (Kurt, Tim, Drew's test accounts) should keep working unchanged through W2 + W3 changes. If anything breaks, fix immediately.

### Design needed
- Trial-ending banner copy and visual (lightweight — can use existing HwAlert component)
- Customer notification email for the price reduction (favorable change, so simple copy)

### Decisions to lock
- Day-30 transition behavior: does the account go to `free` (gated) or `past_due` (with grace banner)? Recommendation: `free` is cleaner — the upgrade prompt is more direct.
- Auto-Advancing audit conclusion: re-enable, rebuild, or defer to Phase 1D?

---

# Phase 1B — State Machine + Plan Surface (Weeks 4–6)

This is where the Plan product gets built as a real customer-facing surface.

## Week 4 — Lifecycle state machine + projected_settlements

### What you're building
- Tour lifecycle state machine (`scenario` | `confirmed` | `live` | `closed`)
- New `projected_settlements` table
- Confirm-tour action

### Engineering work
- Supabase migrations:
  ```sql
  ALTER TABLE tours_routing
    ADD COLUMN lifecycle_state TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (lifecycle_state IN ('scenario', 'confirmed', 'live', 'closed'));
  ALTER TABLE tours_routing ADD COLUMN scenario_set_id UUID;
  ALTER TABLE tours_routing ADD COLUMN confirmed_at TIMESTAMPTZ;
  ALTER TABLE tours_routing ADD COLUMN started_at TIMESTAMPTZ;
  ALTER TABLE tours_routing ADD COLUMN closed_at TIMESTAMPTZ;
  
  CREATE TABLE projected_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID REFERENCES tours_routing(id),
    show_id UUID REFERENCES tour_shows(id),
    scenario_capacity NUMERIC,
    settlement_data JSONB,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    share_token TEXT UNIQUE
  );
  ```
- RLS on `projected_settlements`: org members read/write own, public read via share_token (same pattern as `finance_report_links`).
- Backfill: every existing tour gets `lifecycle_state = 'confirmed'` by default.
- Build `POST /api/plan/tours/[tourId]/confirm` — flips state from `scenario` to `confirmed`, sets `confirmed_at`. Irreversible without admin intervention.
- Build state transition helpers in `lib/tourrouter/lifecycle.ts`:
  - `canTransitionTo(from, to)` validator
  - `transitionTour(tourId, newState)` writer with `.select().maybeSingle()` check
  - Cron job for automatic transitions (`confirmed → live` at first show date, `live → closed` 14 days after last show)

### Design needed
- **Confirm-tour confirmation modal copy.** "Once confirmed, this tour appears in Localizer, Road App, and Books. Are you sure?"
- **Lifecycle state badges** — visual treatment for the four states. Recommend small color-coded pills using existing `--hw-*` tokens.

### Decisions to lock
- Whether "Confirm tour" is reversible by admin only (recommended per your locked decision §13.B.4) or self-service "Unconfirm."

---

## Week 5 — Route split + scenario CRUD

### What you're building
- Splitting `/dashboard/tourrouter/*` into `/dashboard/plan/*` and `/dashboard/books/*`
- Scenario CRUD within Plan
- Scenario set grouping

### Engineering work
- Create `app/dashboard/plan/` and `app/dashboard/books/` route trees. Most pages are wrappers around existing TourRouter components but with different gating, headers, and IA.
- Plan pages:
  - `app/dashboard/plan/page.tsx` — Plan home (scenario sets + confirmed tours, with "+ Model a scenario" CTA)
  - `app/dashboard/plan/scenarios/[setId]/page.tsx` — scenario set detail (variants in this set)
  - `app/dashboard/plan/scenarios/[setId]/[scenarioId]/page.tsx` — single scenario tour
  - `app/dashboard/plan/scenarios/[setId]/compare/page.tsx` — side-by-side compare
  - `app/dashboard/plan/tours/[tourId]/` — confirmed tour read-only view in Plan
- Books pages (placeholders for now, fleshed out in Phase 1D):
  - `app/dashboard/books/page.tsx` — Books home (live tours + recent closed)
  - `app/dashboard/books/tours/[tourId]/` — single live tour dashboard
- Scenario CRUD:
  - `POST /api/plan/scenarios` — create scenario set with first variant
  - `POST /api/plan/scenarios/[setId]/variants` — add variant to existing set
  - `DELETE /api/plan/scenarios/[setId]/variants/[scenarioId]` — drop a variant
- Migrate existing `/dashboard/tourrouter/*` to redirect to either `/dashboard/plan/*` or `/dashboard/books/*` based on the tour's `lifecycle_state` (scenario → plan; everything else → books, with read-only access from plan).

### Design needed — heavy week
- **Plan home page IA.** This is a new page. What's the hero — a "scenarios" grid plus a "confirmed tours" list below? Or two separate tabs? Recommendation: tabs ("Scenarios | Confirmed Tours") at top with "+ Model a scenario" as the primary CTA.
- **Scenario set detail page IA.** A scenario set is a group of variants for the same underlying offer. How do you visualize it? Recommend: variants as tile cards laid out in a row, with a hero "Compare these scenarios →" button.
- **"+ Model a scenario" entry flow.** Does the user start by uploading an offer doc? Filling out a routing? Picking a starting template? This is a real onboarding-into-feature design decision.
- **Empty states for Plan home.** "No scenarios yet — drop an offer to start modeling."

### Decisions to lock
- Does `/dashboard/tourrouter/*` keep redirecting forever, or get deleted after a soak period?
- Default scenario name format. ("Offer A," "Variant 1," timestamps, custom names from user?)

---

## Week 6 — Scenario compare + projected settlement renderer

### What you're building
- Side-by-side scenario comparison (2-up per your locked decision)
- Projected settlement renderer (per-line at 50%/75%/100% capacity)
- Public viewer route for share token

### Engineering work
- `app/dashboard/plan/scenarios/[setId]/compare/page.tsx`:
  - Two-column layout
  - User picks which 2 variants to compare from a dropdown
  - Each column shows: total guarantee, projected gross, projected expenses, projected net, key drive legs, key flight legs, expense breakdowns
  - All numbers from `calcTourFinancials()` per variant — no new math
- Projected settlement renderer:
  - Component renders a settlement JSONB at a given scenario capacity
  - 50% / 75% / 100% capacity scenarios (per your locked default)
  - Per-line breakdown: gross, taxes, deductions, walkout, splits, artist net
  - Generates `projected_settlements` row with share_token on save
- Public viewer route:
  - `app/v/projected/[shareToken]/page.tsx`
  - Uses `supabaseAdmin` (public route — your codebase pattern)
  - No auth required; token in URL is the gate
  - Same visual treatment as the dashboard renderer but read-only with HWY61 branding

### Design needed — heavy week
- **Compare-two layout.** Columns top-to-bottom, or paired rows showing same metric across variants? Recommendation: paired rows with diff highlighting (green if higher, red if lower in expense rows).
- **Projected settlement sheet design.** This is a real document, not just a table. People will print and share these. Treat as a designed artifact — header with tour/show/date, line items grouped (income, deductions, splits, net), totals at the bottom. Worth a real wireframe pass.
- **Capacity toggle UI.** 50/75/100 chips at the top, switchable, persists in URL.
- **Public viewer treatment.** What does this look like to a non-customer? Has to be polished enough to send to a promoter, agent, or manager. HWY61 branding visible but not loud.

### Decisions to lock
- **Tim's onboarding narrative for the four-product wizard should land this week** (per your response-to-Tim doc). If not yet in hand, escalate. Used in W15.
- Whether the compare view supports any user-driven "tweak" of a variant inline, or whether the user has to back out and edit a scenario separately. Recommendation: read-only compare in Phase 1; tweak-in-place is Phase 2.

---

# Phase 1C — Road App (Weeks 7–12)

The single biggest phase. React Native + Expo is greenfield. The TM-side dashboard mostly reuses existing TourRouter components.

## Week 7 — Mobile foundation

### What you're building
- Expo project initialized
- EAS build config
- Token-based auth + deep-link claim flow
- Four new database tables

### Engineering work
- Outside the `~/localizer` repo (new repo recommended): `npx create-expo-app hwy61-road-app`. Or monorepo it inside — your call.
- Apple Developer ($99/yr) and Google Play Developer ($25) accounts created.
- EAS CLI installed, `eas build:configure` run.
- Auth flow:
  - `POST /api/mobile/auth/claim { token }` — returns mobile session
  - TM-side: `POST /api/road-app/tours/[id]/invites` — generates per-member tokens, stores in `crew_access`-style table
  - Deep link format: `hwy61://claim?token=xxx`
  - Mobile app stores session in `AsyncStorage`
- Supabase migrations:
  ```sql
  CREATE TABLE mobile_push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    device_token TEXT NOT NULL,
    platform TEXT CHECK (platform IN ('ios', 'android')),
    registered_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ
  );
  
  CREATE TABLE pending_receipt_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES orgs(id),
    uploaded_by_user_id UUID REFERENCES auth.users(id),
    tour_id UUID REFERENCES tours_routing(id),
    image_url TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    parsed_data JSONB,
    parsed_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    expense_id UUID REFERENCES tour_expenses(id)
  );
  
  CREATE TABLE tour_broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID REFERENCES tours_routing(id),
    sender_user_id UUID REFERENCES auth.users(id),
    message TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    recipient_count INTEGER
  );
  
  CREATE TABLE per_diem_received (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    tour_id UUID REFERENCES tours_routing(id),
    show_id UUID REFERENCES tour_shows(id),
    received_at TIMESTAMPTZ DEFAULT NOW()
  );
  ```
- RLS on all four: band members see own records only; org TMs see all for their org's tours.

### Design needed
- **Onboarding flow for the mobile app.** First-time open: enter your name → claim from deep link OR enter invite code → confirmed.
- **Visual identity.** Does the mobile app match `--hw-*` tokens? It should, but you'll need to translate to React Native StyleSheet equivalents. The Warhol crimson/cream pairing translates fine to native.

### Decisions to lock
- Separate repo for mobile or monorepo? Recommendation: separate repo. Mobile build pipeline (EAS) wants its own home.
- Final mobile app name in App Store / Play Store: "HWY61 Road App," "Road App by HWY61," or something else?

---

## Week 8 — Tonight + Schedule screens + offline cache

### What you're building
- Tonight screen (today's day sheet)
- Schedule screen (full tour calendar)
- AsyncStorage offline caching
- Backend API for both

### Engineering work
- Mobile screens:
  - `TonightScreen`: today's `tour_shows` row rendered — venue, address (tappable → nav app), load-in, soundcheck, doors, showtime, curfew, WiFi password, production contacts (tappable → call/text), hospitality notes
  - `ScheduleScreen`: all upcoming shows in chronological order, off days marked, drive-day estimates from `drive_cache`
- Backend API:
  - `GET /api/mobile/tours` — list tours the auth'd user is on (read from `tour_roster` JSONB)
  - `GET /api/mobile/tours/[id]/today` — today's show
  - `GET /api/mobile/tours/[id]/schedule` — full schedule
- Offline cache:
  - On Tonight/Schedule fetch success, persist full tour to AsyncStorage under key `tour:${tourId}`
  - On startup, render from AsyncStorage immediately; revalidate in background
  - Pull-to-refresh forces re-fetch
- Show drill-down: tap any show in Schedule → opens detail view with all the same day-sheet fields

### Design needed
- **Tonight screen layout.** This is the most important screen — it's what 80% of users will look at every day. Hero is the venue name + load-in time. Everything else flows below. Worth a real native UI pass — generous typography, big tappable hit targets.
- **Schedule list layout.** Date + city + venue per row. Visual distinction between show days, off days, travel days.
- **Show detail view.** All the fields organized into sections (timing, venue, hospitality, production, travel).

### Decisions to lock
- Default Tonight screen behavior when there's no show today: empty state with next show? Or just the next show?

---

## Week 9 — Per Diems + My Comp + RLS gates

### What you're building
- Per Diems screen
- My Comp screen
- Strict RLS so users only see their own financial data

### Engineering work
- Mobile screens:
  - `PerDiemsScreen`: list of per-diems by show, "got it" button to mark received, running tour total
  - `MyCompScreen`: shows user's own pay components for this tour, with pay-stack visibility if there are multiple components, hides other members' comp entirely
- Backend API:
  - `GET /api/mobile/tours/[id]/per-diems` — auth'd user's per-diems only
  - `GET /api/mobile/tours/[id]/comp` — auth'd user's comp only (RLS-enforced, never returns other members' comp regardless of caller)
  - `POST /api/mobile/per-diem-received { showId }` — mark per-diem as received
- Critical RLS:
  - Band/crew user can SELECT only their own `tour_roster` JSONB key from `tours_routing`
  - Comp data is in `tour_roster` so the RLS has to be JSONB-element-level — this is fiddly. Pattern: API route extracts only the auth'd user's slice of the JSONB before returning.
- Books-active orgs unlock multi-member view (Phase 1D), but in Phase 1C the gating defaults to self-only.

### Design needed
- **Per Diems screen.** Each show row: date + amount + "got it" button. Running total at top.
- **My Comp screen.** This is sensitive content. Clean, no clutter. Show user's name at top, their pay components below, totals. Don't show what the tour pays in aggregate (would imply they could compare to others).

### Decisions to lock
- Compensation visibility refinement: when a Books-active org has multi-member view on, does the band member's mobile experience change? Recommendation: no — mobile always shows self-only. Multi-member is a TM-side dashboard feature.

---

## Week 10 — Receipts screen + camera + push tokens

### What you're building
- Receipts screen with camera capture
- Receipt upload pipeline
- Push notification token registration

### Engineering work
- Mobile screens:
  - `ReceiptsScreen`: camera button, list of past uploads with parse status, "pending review" indicator
- Camera integration:
  - `expo-camera` or `expo-image-picker`
  - Photograph receipt → upload to Supabase Storage (`tour-expenses/` bucket)
  - Insert row into `pending_receipt_photos`
- Backend API:
  - `POST /api/mobile/tours/[id]/receipts` — receive photo, store, queue for parsing
  - Reuse existing receipt parser prompt from `lib/tourrouter/prompts/receiptParsePrompt.ts`
  - For standalone Road App orgs: receipt sits in `pending_receipt_photos`, surfaces nowhere on the TM side until they upgrade to Books
  - For Books-active orgs: receipt appears in the TM's "Review Receipts" queue immediately
- Push token registration:
  - `POST /api/mobile/push/register { deviceToken, platform }` — writes to `mobile_push_tokens`
  - Tokens refreshed on each app open

### Design needed
- **Receipts screen layout.** Big camera button at top. History list below with status pills (pending, parsed, approved).
- **Camera capture flow.** Native camera preview → snap → preview → "use this" or "retake." Standard pattern.
- **Permissions explainer.** Why does the app need camera access? Plain-language pre-prompt before the OS dialog.

### Decisions to lock
- Default receipt category — does the user pick (fuel, food, hotel, etc.) before upload, or does the parser guess and let the TM correct? Recommendation: parser guesses, TM confirms.

---

## Week 11 — Push notifications + broadcasts + native polish

### What you're building
- Push notification infrastructure (schedule-change detection + delivery)
- Broadcast UI (TM web → mobile push)
- Native UI polish ahead of EAS submission

### Engineering work
- Push infra:
  - Server-side: Expo Push API integration. Pick provider this week (Expo's wrapper is simplest for cross-platform).
  - Change detection cron: nightly check for `tour_shows` updates in the last 24 hours; for each show updated, find all roster members with push tokens, send notification
  - Notification types: schedule change, day-of-show reminder (morning), broadcast from TM
- Broadcasts:
  - TM-side: `app/dashboard/road-app/tours/[id]/broadcasts/page.tsx` — text input, "send to all," confirmation
  - Backend: `POST /api/road-app/tours/[id]/broadcasts` — writes to `tour_broadcasts`, triggers push to all roster members with tokens
  - Mobile-side: notification arrives, opens app to a Broadcasts screen showing message history
- Native polish:
  - Splash screen
  - App icon (need this from a designer or done in-house — high stakes for App Store first impression)
  - All transitions feel native (use React Navigation defaults; don't reinvent)
  - Pull-to-refresh on Tonight, Schedule, Per Diems, Receipts
  - Empty states that don't look broken
  - Error handling (offline, network errors, expired token)

### Design needed — heavy week
- **App icon.** Real design work. The icon is the single most-seen brand element of the mobile app. Don't ship a placeholder.
- **Splash screen.** Brief but branded.
- **Broadcast composer (TM web).** Plain text input, character count, "send to N members" confirmation modal.
- **Broadcast viewer (mobile).** Message history list. Latest at top. Tap to mark read.

### Decisions to lock
- Push notification opt-in default. iOS requires explicit user permission. Show a pre-prompt with rationale before the OS dialog ("Get day sheet updates from your TM").
- Whether broadcasts support attachments (images, PDFs). Recommendation: text-only at launch. Defer attachments to Phase 2.

---

## Week 12 — TM-side web dashboard + EAS submission

### What you're building
- TM-side `/dashboard/road-app/*` route surface (mostly re-mounts of existing TourRouter components)
- EAS build for iOS + Android, submit to both stores

### Engineering work
- TM-side pages:
  - `app/dashboard/road-app/page.tsx` — overview, list of active tours with roster previews
  - `app/dashboard/road-app/intake/page.tsx` — drop zone for routing/advance docs (reuses Universal AI Intake)
  - `app/dashboard/road-app/tours/[id]/page.tsx` — tour overview (shows list, schedule, roster)
  - `app/dashboard/road-app/tours/[id]/edit/page.tsx` — per-show day-sheet edit (mostly reuses ShowDrawer)
  - `app/dashboard/road-app/tours/[id]/roster/page.tsx` — manage roster, invite tokens, per-member settings
  - `app/dashboard/road-app/tours/[id]/invites/page.tsx` — generate and share invite links
  - `app/dashboard/road-app/tours/[id]/broadcasts/page.tsx` — broadcast composer (built W11)
  - `app/dashboard/road-app/settings/page.tsx` — org-level Road App settings
- Most of these are wrappers around existing TourRouter components with new headers and re-arranged IA.
- EAS submission:
  - `eas build --platform all`
  - Test in TestFlight + Play Store internal testing channel for ~24h
  - Create demo tour with realistic sample data for Apple reviewer
  - Submit privacy policy URL (update Localizer ToS / Privacy to cover Road App)
  - `eas submit --platform all`
  - **Submit by end of W12** — Apple review can take a week or more.

### Design needed
- **Road App dashboard IA.** Different from TourRouter even though most components reuse — emphasis is on roster, invites, day-sheet ops. Less on financials.
- **Invite-share UX.** Copy a per-member link, send via text/email, member taps → mobile app opens via deep link → claims their profile.
- **App Store screenshots.** 6 screenshots per platform. Heroes: Tonight screen, Schedule screen, Per Diems, My Comp, Receipts, Broadcasts. Real design work; takes ~half a day.

### Decisions to lock
- App Store description copy.
- Whether to submit as "HWY61 Road App" or something more user-friendly (e.g. "HWY61 Tour"). Recommendation: keep "Road App" — that's the product name and matches your marketing.

---

# Phase 1D — Books Polish + Variance (Weeks 13–14)

This phase finishes Books as a real customer-facing product. The math layer is already there; this is UI + the Plan-to-Books bridge.

## Week 13 — Variance + multi-member + receipt review

### What you're building
- Variance report UI (Plan ↔ Books bridge)
- Multi-member view for TMs
- Receipt-photo review queue

### Engineering work
- Variance report:
  - Supabase migration:
    ```sql
    CREATE TABLE tour_variance_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tour_id UUID REFERENCES tours_routing(id),
      scenario_settlement_id UUID REFERENCES projected_settlements(id),
      generated_at TIMESTAMPTZ DEFAULT NOW(),
      share_token TEXT UNIQUE,
      variance_data JSONB
    );
    ```
  - Computation: per-line projected (from `projected_settlements`) vs actual (from `tour_shows.settlement` and `tour_expenses`)
  - UI: table view with bars in the variance column per your locked decision §13.B.9
  - Public viewer via share token (`app/v/variance/[shareToken]/page.tsx`)
- Multi-member view:
  - `app/dashboard/books/tours/[id]/roster/page.tsx` — TM-only, shows all roster members, all per-diems, all comp, RLS-enforced at API level so this is org-scoped not user-scoped
- Receipt review queue:
  - `app/dashboard/books/tours/[id]/receipts/page.tsx` — list of `pending_receipt_photos` with status, parsed values, approve/reject/edit
  - Approval flow: parser-suggested values, TM confirms or edits, on save → write to `tour_expenses` and mark `pending_receipt_photos.reviewed_at` + `.expense_id`

### Design needed — heavy week
- **Variance report layout.** Table with bars per line — but what about totals? Roll-ups? Recommend: total row at bottom with overall variance, plus drill-down expand on each line.
- **Multi-member roster view.** Spreadsheet-y or card-based? Recommendation: spreadsheet-y for at-a-glance scanning across N members and M shows.
- **Receipt review queue UI.** Image preview on left, parsed fields on right, approve/edit buttons. Same pattern as the existing Universal AI Intake review screen — can largely reuse.

### Decisions to lock
- Whether variance reports auto-generate or are user-triggered. Recommendation: auto-generate the day after each show settles; user can refresh manually.

---

## Week 14 — Auto-Advancing finish + cross-product prompts

### What you're building
- Auto-Advancing re-enable (or rebuild, depending on W1–3 audit conclusion)
- Cross-product prompts (Plan → Books, Books → Plan, etc.)
- Remaining expense tabs (mechanical — defer to Phase 2 if time tight)

### Engineering work
- Auto-Advancing: act on the W1–3 audit. Could be a single-day re-enable, could be a 2-week rebuild. The work itself was built in Phase 4 of the original plan — state machine, daily cron, 4 email templates, Resend webhooks, alias library all exist. What's needed depends on what the audit found.
- Cross-product prompts:
  - In `/dashboard/plan/*`: banner CTA "Want to track this once it's confirmed? Upgrade to Books — $39/mo"
  - In `/dashboard/books/tours/[id]`: sidebar CTA "Want a variance report? Set up a projected settlement in Plan."
  - In `/dashboard/localizer/*`: banner CTA "Track this tour's expenses? HWY61 Books — $39/mo"
  - All built in a `lib/upsell/CrossProductPrompts.tsx` component, varied per surface
- Remaining expense tabs (Transport, Food, Gear, Misc, Merch, Promo, Other): mechanical work following the Accommodation pattern that already exists. Each tab is roughly an hour of work. If timeline is tight, cut to Phase 2.

### Design needed
- **Cross-product prompt copy.** Each upsell prompt needs a one-line value prop. Push to Tim for the four versions; engineering can scaffold the component.
- **The banner/sidebar placement.** Top banner is intrusive but visible; sidebar is subtle but might be missed. Recommendation: top banner with dismiss; reappears after 7 days.

### Decisions to lock
- Auto-Advancing posture if audit came back ugly: ship Books without it (label "coming back") or hold the launch?

---

# Phase 1E — Onboarding + Marketing Site (Weeks 15–17)

The final phase. UI-heavy and copy-heavy.

## Week 15 — Four-product onboarding wizard + Localizer gate

### What you're building
- Four-product onboarding wizard (using Tim's narrative)
- Confirmed-tour gate in Localizer
- Pricing migration communication (if not done in W3)

### Engineering work
- Onboarding wizard:
  - Replaces the existing `WelcomeWizard` for new sign-ups
  - Survey flow per Tim's narrative (artist/TM/manager? how many acts? current tool? biggest pain?)
  - Decision tree → recommended product or Suite
  - Recommendation page with screenshot/preview
  - "Start 30-day trial" → flips plan-status to `active` for the chosen product, no card required
  - Existing org_members logic preserved (per-user wizard for new members joining existing orgs)
- Confirmed-tour gate in Localizer:
  - In Localizer tour picker, filter to `lifecycle_state IN ('confirmed', 'live')`
  - For `scenario` state, show "Confirm this tour in Plan to generate assets" with link
- Cross-product handoff testing end-to-end

### Design needed — heavy week
- **The entire onboarding wizard surface.** Multi-step flow, progress indicator, branch logic on survey answers, recommendation page. Real wireframing needed before build.
- **Recommendation page.** This is the moment of truth — user sees "Here's what we built for you." Worth a real design pass.
- **30-day trial start UI.** Confirmation modal, what they're getting, what happens after 30 days. Has to be reassuring not punitive.

### Decisions to lock
- Tim's narrative needs to be locked by end of W14 at the latest. If not, raise the alarm hard.

---

## Week 16 — Marketing site

### What you're building
- 6 marketing landing pages
- Pricing page
- Signup flow update

### Engineering work
- Pages to build/redesign:
  - `app/page.tsx` — `/` — front door, four-product overview, "Find your fit" CTA
  - `app/road-app/page.tsx` — `/road-app` — Road App landing
  - `app/plan/page.tsx` — `/plan` — HWY61 Plan landing
  - `app/localizer/page.tsx` — `/localizer` — Localizer landing (refresh existing)
  - `app/books/page.tsx` — `/books` — HWY61 Books landing
  - `app/touring-suite/page.tsx` — `/touring-suite` — Suite landing
- Pricing page:
  - `app/pricing/page.tsx` — all SKUs visible, annual toggle, Suite math callout
- Signup flow update:
  - `/login` route extended with product-selection step before magic link
  - Or: magic link → onboarding wizard (W15) handles product selection
- Remove `COMING_SOON=true` from `.env.local` and Vercel when ready to flip
- All hardcoded references to old pricing updated

### Design needed — heaviest design week of the whole build
- **All 6 landing pages.** Each needs: hero, value prop, key features (3-5), product screenshot/mockup, social proof if available, pricing CTA, secondary CTA to demo/learn more.
- **Pricing page IA.** Five products plus Suite at three tiers each plus annual toggle. Easy to make this overwhelming. Recommendation: anchor on Suite first, then tiered comparison table.
- **Suite math callout.** "$92/mo separately, $59/mo as a Suite — save 36%." Has to be visually present.
- **Copy across all pages.** This is where Tim's voice matters most. Push Tim to provide draft copy by end of W15; engineering can scaffold pages with lorem and swap in real copy.
- **Product screenshots/mockups.** Real or polished mockups of each product's hero screen. Worth half a day to do these right.

### Decisions to lock
- Marketing site theme — dark, light, or both with toggle? Recommendation: match the dashboard's Warhol system for consistency. Single theme.
- Whether annual pricing is shown by default or behind a toggle. Recommendation: monthly by default, "Save with annual →" toggle.

---

## Week 17 — Polish + soft launch readiness

### What you're building
- Cross-product handoff QA
- Copy finalization across all surfaces
- App Store approval should land (submitted W12)
- Soft launch readiness check

### Engineering work
- End-to-end test of all upgrade flows:
  - Free Road App → Books upgrade
  - Plan → Books variance trigger
  - Any product → Suite switch (with proration)
  - Pricing migration for existing Localizer customers (verify Stripe behaved)
- Copy review on every customer-facing surface
- Remove `COMING_SOON=true` from Vercel env vars when ready
- PostHog event verification — every key event firing? Funnel from signup → recommended product → trial start → upgrade → public launch readable?
- Final BACKLOG sweep — anything that snuck through?
- Mobile app: if approved, test deep-link flow with TestFlight users. If rejected, address feedback and resubmit.

### Design needed
- Final copy review across all surfaces.
- Any rough edges noticed in QA.

### Decisions to lock
- Public launch date. Aim for mid-October.

---

# Weeks 18–22 — Soft Launch

20–40 customers from Drew + Tim's network. No marketing push. Goal is feedback and bug squashing.

- **W18:** First 5 customers onboarded manually. Watch onboarding wizard funnel like a hawk in PostHog. Daily bug triage.
- **W19:** Onboard 10 more. Iterate on the highest-impact bugs from W18. First retention check at 7 days.
- **W20:** Onboard 10 more. Run a "Suite upgrade" pressure test — does anyone actually convert from one product to Suite? If not, fix the prompt.
- **W21:** Onboard the final batch. Variance report users? Cross-product upgrade flows? Watch for the patterns.
- **W22:** Lock down for public launch. No new features. Bug fixes only.

# Week 23+ — Public Launch

Marketing push, PR, social, Tim's network outreach. Open the gates.

---

# Recap — Design-heavy weeks

If you're going to plan design sprints with Tim (or wireframing time with yourself), these are the weeks that need the most design attention:

- **W5–W6:** Plan UI surface — new pages, compare view, projected settlement renderer
- **W8:** Tonight + Schedule screens (mobile native UI patterns)
- **W11:** App icon + native polish for App Store
- **W13:** Variance report layout, multi-member view, receipt review
- **W15:** Onboarding wizard — multi-step flow + recommendation page
- **W16:** Marketing site — 6 landing pages + pricing page (heaviest week of all)

---

*Drafted by Drew, May 19, 2026. This document is a working build plan and is expected to be updated as the build progresses.*
