# Launch Progress

*Single source of truth for the 30-day Localizer launch.*
*Last updated: June 4, 2026*

Source plan: `docs/HWY61_Localizer_30_Day_Launch_Plan_May_19_2026.md`. Day numbers and item descriptions below mirror that file; status reflects actual shipped work per `docs/SESSION_LOG.md` and session work through May 23.

## At a glance

- **Day status:** Days 1, 2, 4–5, 7, 10, and 11 fully resolved; Day 3 moot (no customers to migrate); Days 8–9, 16, and 20 partially complete (highest-value items shipped, remainder open). Specifics: Day 1 wired May 26, Day 2 webhook consolidation May 27, Day 4–5 welcome page shipped, Day 7 (5/5) customer support workflow fully defined, Day 8–9 landing live (video embed + bio callout pending), Day 10 closed out June 2 — all 5/5 items shipped (4-tier grid, monthly/annual toggle, "Most Popular" Pro highlight, "Start free trial" CTA copy, 8-Q&A FAQ in Tim's voice); 2 FAQ copy upgrades parked in BACKLOG ("Pricing FAQ copy upgrades") gated on the live-Stripe screen-share — switch-plans + cancel-at-period-end can be strengthened from soft-form to strong-form pending portal-config verification; Day 11 closed out June 2 — 4 items shipped (3 empty states + first-asset success banner), 2 items deliberately cut (template page-level empty state, copy-venue-link button); Day 16 venue viewer (highest-priority mobile surface — promoters use phones) fixed June 2 (commit `d6b028c`), rest of mobile pass still open; Day 20 alert() → toast cleanup done June 2 (actionable error next-steps still open).
- **1 day-item moot** (Day 3 — no live customers to migrate; all prior Stripe products were sandbox)
- **Pricing locked May 23** (source record: `docs/LOCALIZER_PRICING_DECISION_2026-05-23.md`) — Solo $29/$290, Pro $59/$590, Agency $129/$1,290, plus a no-card 7-day trial of full access, then free/blocked until a plan is picked (replaces the May 23 watermarked Free tier — see "Trial model" section below)
- **27 items added since the original plan was written** (see "Added since the original plan" section)
- **Trial model live in production (June 2)** — gate reads `trial_ends_at` (`8095476`), `ensureOrgExists` seeds trial-not-active (`67cf438`), 22-org beta backfill applied May 28. Both commits pushed and live; verified via access-bucket query (22 active trials, 1 shared org preserved, 14 correctly expired/blocked).
- **Blocked on:** Tim's video script review (Day 12), Tim's Day 3 live Stripe verification screen-share, Tim's 2 remaining trial-model email questions (Q1, Q2, Q4 resolved; Q3 welcome-body wiring + Q5 cancellation copy remain), Tim's legal-review attorney recipient (Localizer-only Privacy + ToS rewrite shipped June 4 in `ca5b976`; 3 docs ready for Tim — Privacy, ToS, legal-review memo — but the external clock has not started)
- **Currently in flight:** Stripe Day 3 live verification (awaiting Tim screen-share); legal-review kickoff (page content + 3 docx drafts ready for Tim, awaiting his attorney recipient — longest external clock, not yet started)

---

## Week 1 (Days 1–7)

### Day 1 — Stripe restructure kickoff
- ✅ ~~Archive legacy Stripe products~~ *(N/A — live mode was empty; nothing to archive. Sandbox-only products discovered May 21.)*
- ✅ Create 6 new Localizer price IDs (live in Stripe May 23):
  - `LOCALIZER_SOLO_MONTHLY` — $29/mo
  - `LOCALIZER_SOLO_ANNUAL` — $290/yr
  - `LOCALIZER_PRO_MONTHLY` — $59/mo
  - `LOCALIZER_PRO_ANNUAL` — $590/yr
  - `LOCALIZER_AGENCY_MONTHLY` — $129/mo
  - `LOCALIZER_AGENCY_ANNUAL` — $1,290/yr
- ✅ Capture price IDs into `LOCALIZER_PRICE_MAP` constant *(`lib/stripe/localizerPrices.ts`, May 26)*
- ✅ Enable 7-day free trial on all three tiers *(configured in `app/api/stripe/checkout/route.ts` via `subscription_data.trial_period_days`, not Stripe dashboard)*

### Day 2 — Stripe webhook consolidation
- ✅ Consolidate dual webhook routes — `/api/stripe/webhook` deleted, `/api/billing/webhook` is now the single endpoint *(May 27)*
- ✅ Plan-tier mapping wired via `tierFromPriceId` from `lib/stripe/localizerPrices.ts` (replaces env-var-based `planFromPriceId` lookup)
- ✅ `mapSubStatus()` helper covering all Stripe sub statuses; writes migrated to `localizer_plan` / `localizer_plan_status` columns; `.select()` + zero-row warnings on every `orgs` update (rule 6 compliance)

### Day 3 — Stripe live mode swap (code-complete, end-to-end verification pending)
- ✅ STRIPE_SECRET_KEY in Vercel swapped to live (Production scope)
- ✅ STRIPE_WEBHOOK_SECRET in Vercel set to live signing secret (Production scope)
- ✅ Live mode webhook destination registered in Stripe (`Localizer Billing` at hwy61labs.com/api/billing/webhook, 3 events subscribed)
- ✅ Production deploy green after env var fix
- 🟡 End-to-end verification — pending screen-share session with Tim (test plan below)

#### Live Stripe verification — pre-launch screen-share with Tim

> Goal: validate the complete live checkout-to-org-update pipeline before any real customer hits it. Drew acts as the test customer using his own card. 7-day trial means no money moves; cancel before any charge fires.
>
> **Steps (run with Tim on screen-share):**
>
> 1. From a clean incognito session, navigate through the team-login path to access the app, then go to `/pricing`
> 2. Pick Solo monthly ($29) — cheapest tier, simplest validation
> 3. Use a real personal card at Stripe checkout. The 7-day trial means no immediate charge — Stripe should show "$0.00 today, $29 on [date 7 days from now]"
> 4. Complete checkout — Stripe redirects back to the app
> 5. Verify webhook fired in Stripe Dashboard → `Localizer Billing` destination → Event deliveries tab — `checkout.session.completed` should show 200 response
> 6. Verify the customer + subscription got created: Stripe Dashboard → Customers → search by test email — should show as customer with active sub on Solo trial
> 7. Verify the org row got updated: Supabase SQL Editor `SELECT id, owner_email, stripe_customer_id, stripe_subscription_id, localizer_plan, localizer_plan_status FROM orgs WHERE owner_email = '<test email>';` — should show `localizer_plan = 'solo'`, `localizer_plan_status = 'active'`, both Stripe IDs populated
> 8. Cancel immediately via app's Account Settings (or Stripe Dashboard customer page). Verify `customer.subscription.deleted` also fires with 200, and Supabase shows `localizer_plan_status = 'canceled'`
> 9. Optional: archive the test customer in Stripe for clean Customers list
>
> **Acceptance criteria:** all three webhook events return 200, all three Supabase row states (active → canceled) reflect correctly, no warn strings in Vercel logs (`unknown priceId`, `orgs update affected 0 rows`).
>
> **Why screen-share with Tim:** Tim owns the customer-experience side of billing/subscription flow. He should see the live checkout for the first time at the same moment Drew does — both for narrative-voice feedback on the experience and for shared knowledge of how it behaves.

### Day 3 (original) — Existing customer pricing migration
- 🚫 ~~Identify existing Localizer customers via Stripe~~
- 🚫 ~~Migrate each to corresponding new lower-priced subscription~~
- 🚫 ~~Send friendly notification email via Resend~~
  - *Moot — discovered May 21 that all Stripe products created since March were in sandbox, not live. Live mode is a clean slate; no customers to migrate.*

### Day 4–5 — Onboarding flow build
- ✅ Welcome page at `/dashboard/onboarding/localizer` shipped May 21
- ✅ Step persistence API at `/api/onboarding/localizer/step`
- ✅ Eligibility gate on `/dashboard/onboarding` redirects Localizer-eligible users to the new flow
- ✅ Dashboard direct-access redirect (added May 22 — catches Stripe-checkout / bookmark / email-link entries)
- ⬜ Onboarding video embedded in welcome page
  - *Blocked on: video recording, which is blocked on Tim's script review*
- *Pivoted from the 5-step wizard originally specced. Tested wizard end-to-end (commit reverted), confirmed contrived for batch-tour workflow, replaced with single welcome screen. 80 lines instead of 530.*

### Day 6 — Welcome email + getting-started doc
- 🟡 Welcome email triggered on first sign-in (Resend transactional)
  - 1-paragraph welcome from Tim
  - 3-bullet "what to do next" steps
  - Link to help docs
  - Tim's email for direct support
  - *Tim picked the rewritten 2A variant on May 28 and added Day 5/7 nudge drafts. Transactional wiring still pending — gated on Tim's answers to questions 2–5 (cron home for Day 5/7 sends; `/api/welcome` trigger point + new body; idempotency check against `localizer_plan_status === 'active'`; pre-upgrade cancellation copy).*
- ⬜ "Getting Started with Localizer" help doc (single article)
  - *Drew drafting next — will share for Tim's review*

### Day 7 — Customer support workflow defined
- ✅ Add Tim to `support@hwy61labs.com` forward
  - *`support@` is a Google Workspace group (MX on Google, not ImprovMX as old notes implied). Both `drew@hwy61labs.com` and `tim@hwy61labs.com` are members; both inboxes are actively checked. Confirmed June 2.*
- ✅ Decide ownership split (Tim replies, Drew handles bug escalations)
  - *Tim approved the split June 2: Tim replies to customers, Drew handles bug escalations.*
- ✅ Set up tracking board for customer issues
  - *Google Sheet created June 2 in the shared Google Workspace (columns: Issue / Reported by / Type / Status / Assigned), shared with Tim. Switched from Notion June 2 — the team already lives in Google Workspace daily, so a Sheet is the tracker they'll actually maintain. Manual entry (no automation — appropriate for two-person launch volume).*
- ✅ Smoke-test the support address end-to-end
  - *`support@` confirmed reaching both members' actively-checked inboxes (group delivery verified June 2).*
- ✅ 5 canned responses finalized (`docs/SUPPORT_CANNED_RESPONSES.md`, commits 2a3ad0b + ab4cc16, May 28) — pricing, billing, "how do I do X", refund requests, "is my data safe"

---

## Week 2 (Days 8–14)

### Day 8–9 — Landing page redesign
- ✅ `/localizer` rewritten and trimmed (376 → 319 lines)
- ✅ Six-section structure (hero, problem, solution, pricing, final CTA, footer)
- ✅ LOCALIZER wordmark with cursor-responsive crimson shadows
- ✅ Pricing tier names: Solo / Pro / Agency at 1 / 5 / 12 artists
- ✅ Primary CTAs unified to "Start your free trial"
- ✅ Nav reduced to Pricing / Sign in / Start your free trial
- ✅ Footer contact updated to `support@hwy61labs.com`
- ✅ Page lives at `/` (Localizer content moved to root May 26; old `/` landing preserved at `/labs`)
- ✅ Hide `/tourrouter`, `/diy`, `/roadapp` via config-level redirects to `/coming-soon` (May 26)
- ⬜ 90-second demo video embedded in hero
- ✅ Final dollar amounts in pricing tiers ($29 / $59 / $129, locked May 23, applied May 26)
- ✅ Stale "Free during beta" copy removed (June 4, commit `a7cadf8`)
  - *Final-CTA subhead and pricing-note on `/` now reflect the 7-day trial model instead of "free during beta" / "free tier available." See "Added since the original plan" for the full beta-copy cleanup pass.*
- ⬜ "Built by working music industry people" callout with Tim's bio + photo

### Day 10 — Pricing page (`/pricing`) — **COMPLETE June 2**

*All 5 items shipped. Two FAQ answers ship in SAFE/soft form pending Stripe Customer Portal config verification on the live-Stripe screen-share — copy upgrades parked in `docs/BACKLOG.md` ("Pricing FAQ copy upgrades") as a ~2-min follow-up.*

- ✅ Standalone three-tier comparison table
  - *Built in `app/pricing/page.tsx` as a 4-tier card grid (Free / Solo / Pro / Agency), `PLANS` array + CSS grid. 4-tier instead of 3 — Free card added May 28; functionally equal-or-better than the source-plan spec.*
- ✅ Monthly/Annual toggle (annual = 2 months free)
  - *Fully wired toggle (`const [annual, setAnnual] = useState(false)`): flips displayed price, period label, AND the Stripe price ID sent to checkout. Badge reads "SAVE ~17%" — the truthful figure ($290 vs $29×12=$348). Documented correction from the spec's "2 months free" — same number, more accurate language.*
- ✅ Highlight Pro as "most popular"
  - *Pro has `highlight: true`; crimson border + translateY lift + 6px crimson box-shadow + "Most Popular" badge + crimson CTA. Pro is the only highlighted tier.*
- ✅ "Start free trial" CTA per tier
  - *Paid-tier CTA copy changed from "Get [Tier]" → "Start free trial" June 2 (commit `f8edd03`). Free tier "Start Free" → `/login` unchanged. Loading state "Loading…" unchanged. Functionally complete: all paid CTAs start the 7-day Stripe trial via `subscription_data.trial_period_days` from Day 1.*
- ✅ FAQ section
  - *8-Q&A FAQ section added to `app/pricing/page.tsx` June 2 (commit `f8edd03`) in Tim's voice from his marked-up decision doc. Topics: no credit card, trial-end behavior, tier differences, switch plans, annual billing, "what counts as an artist," cancel, data safety. No stale pricing numbers (tier answer states artist counts only, per Tim's warning). Two answers (switch-plans, cancel) ship in SAFE/soft form pending Stripe portal-config verification — see BACKLOG "Pricing FAQ copy upgrades" for the conditional copy upgrades after the live-Stripe screen-share.*

### Day 11 — Empty states + first-asset moment — **COMPLETE June 2**

*All items shipped or deliberately cut. Celebration scoped to a simple success banner — no confetti, no copy-venue-link button. Two empty states left in their existing form (functional, not worth the migration churn); template editor empty state cut in favor of contextual per-format fallbacks.*

- ✅ Dashboard with zero artists empty state
  - *Already exists as a functional custom inline block in `app/dashboard/page.tsx` ("NO ARTISTS YET" + "ADD ARTIST" form). Deliberately NOT migrated to `HwEmptyState` — works fine, not worth the churn. Considered done June 2.*
- ✅ Artist page with zero tours empty state
  - *Already uses `HwEmptyState` in `ArtistToursClient.tsx` ("NO TOURS YET" + "CREATE TOUR" action) — the canonical example. Done.*
- ✅ Tour page with zero shows empty state
  - *Fixed June 2 (commit `8b4a775`): hid the table column header, helper line ("All info can be edited below."), and duplicate "NO EVENTS YET" text when zero events. Single empty-state message in `EventsTable.tsx` is now the only source of that text.*
- 🚫 ~~Template editor empty state~~ — **CUT June 2.** Per-format slot fallbacks ("not uploaded yet" + "→ Import Assets" link) in `TemplateEditor.tsx` already give contextual empty messaging, which is better than a generic page-level empty state. Page-level empty state not needed. Revisit post-launch only if user feedback indicates confusion.
- ✅ First-asset celebration moment (confetti or success screen)
  - *Shipped June 2 (commit `2976ec5`) as a success banner in `EventsTable.tsx`: appears on clean Generate All completion (success-path only, not on errors), auto-dismisses after 5s, `--hw-green` / `--hw-green-ghost` styling matching `/advance/[token]` and `/v/e/[token]` precedent. Scoped down from confetti/copy-link per decision June 2 — simple banner only.*
- 🚫 ~~Prominent "Copy your venue link" button on first asset~~ — **CUT June 2.** Per-show vs tour-level link ambiguity made it low-payoff; success banner ships without it. Revisit post-launch if conversion data supports.

### Day 12 — Demo video / GIF
- ✅ Onboarding video script drafted (`docs/LOCALIZER_ONBOARDING_VIDEO_SCRIPT.md`, ~2:30 narration)
- ⬜ Tim reviews script for voice
  - *Blocked on: Tim's review*
- ⬜ Record screen + voiceover
- ⬜ Export MP4 + animated GIF version
- ⬜ Self-host (no YouTube embed)

### Day 13–14 — Help docs / FAQ — **LAUNCH-SUFFICIENT June 4**

- 🟡 In-app FAQ at `/dashboard/support` rewritten Localizer-only June 4 (19 Q&As, commit `2298e82`): covers pricing, billing, trial model, venue links, custom fonts, troubleshooting. Replaced the stale suite/TourRouter FAQ (~40 Q&As, wrong pricing, fake $249 Full Suite, "beta is free"). Standalone how-to article system (getting-started, templates/branding, custom fonts, sponsor logos) deferred to post-launch — see BACKLOG. Not a launch blocker.

---

## Week 3 (Days 15–21)

### Day 15 — Venue link viewer page redesign
- ⬜ Cleaner asset grid with format labels
- ⬜ Hover state for download options (PNG, JPG)
- ⬜ "Made yours at localizer.hwy61labs.com" CTA (viral wedge)
- ⬜ "Forward to your artist" button (lead-gen wedge)
- ⬜ Mobile responsive

### Day 16 — Mobile responsiveness pass
- ⬜ Landing page
- ⬜ Pricing
- ⬜ Login / magic link
- ⬜ Onboarding wizard
- ⬜ Dashboard / artist / tour pages
- ⬜ Template editor (accept desktop-primary)
- ✅ Venue link viewer (highest priority — promoters use phones)
  - *Fixed two confirmed phone-width breaks in `app/v/e/[token]/page.tsx` June 2 (commit `d6b028c`): hero title/Download-All row now wraps (`flexWrap: "wrap"` + `gap: 16`) so the button drops below the title instead of overlapping; Advance Materials grid changed from hard `repeat(4, 1fr)` to `repeat(auto-fit, minmax(140px, 1fr))` so it collapses 4→2→1 columns instead of crushing W-9 against the edge. Pure inline-style intrinsic-sizing fix, no `<style>` block or CSS file. Verified live at narrow width.*
- ⬜ Account/billing
- ⬜ Help pages

### Day 17 — Account/billing page polish
- ⬜ Current plan + usage clearly displayed
- ⬜ "Upgrade" CTA visible
- ⬜ Annual/monthly toggle on upgrade
- ⬜ Stripe Customer Portal link
- ⬜ Clean cancellation flow

### Day 18 — Print PDF / generation wait states
- ✅ "Why this takes a moment" explainer tooltip on print PDF
  - *Already shipped in `app/v/e/[token]/PrintDownloadButton.tsx`: "This can take up to 30 seconds. Please don't refresh." + animated striped progress bar + elapsed-time counter. Verified June 2.*
- ⬜ Format-by-format checkmark progress on multi-format generation
  - *Currently `EventsTable.tsx` shows a single aggregate `done/total` progress bar (not per-format checkmarks). Real work — would be a UX rebuild of the progress display.*

### Day 19 — Auth flow polish
- ✅ Magic link page branded with HWY61 wordmark
  - *Already shipped in `app/login/page.tsx:170–183`: "HWY61" wordmark in display font, crimson, 36px, with 4px letter-spacing. Verified June 2.*
- ✅ Friendly recoverable error states
  - *Already shipped in `app/login/page.tsx`: three layered error states (`urlError` from `?error=` param, `inviteError` for beta password, `error` for OTP/OAuth failures), each rendered with a retry path. Verified June 2. Optional copy-polish pass noted but not required.*
- 🚫 ~~PKCE migration~~ — deferred to post-launch (per source plan)

### Day 20 — Toast / error state audit
- ✅ Replace remaining `alert()` calls with toasts
  - *All 4 remaining `alert()` calls swapped to `toast.error()` June 2 (commit `98199d9`): `app/dashboard/TourTile.tsx` (delete failed), `app/pricing/page.tsx` (checkout error + network error), `app/v/e/[token]/PrintDownloadButton.tsx` (print poster failed). `ToastProvider` confirmed global in `app/layout.tsx:30` — wraps all routes, so the two public-route swaps (`/pricing`, `/v/e/[token]`) are safe.*
- ⬜ Actionable next-steps on every error state

### Day 21 — Press kit + social assets
- ⬜ `/press` page or downloadable PDF
  - 1-page product description
  - 4–6 product screenshots
  - Logo files (light + dark)
  - Tim + Drew bios + photos
  - 3 pre-written Tim quotes
  - `press@hwy61labs.com` contact
- ⬜ IG post + IG story announcement graphics (use Localizer itself)
- ⬜ `@hwy61labs` accounts on IG / X / TikTok

---

## Week 4 (Days 22–30)

### Day 22–23 — Full QA sweep
- ⬜ QA agent on Mac mini against production
- ⬜ Manual 10-step end-to-end test from clean browser
- ⬜ Cross-browser test (Safari, Chrome, Firefox + mobile Safari/Chrome)
- ⬜ One non-tester unsupervised signup observation

### Day 24–25 — Bug fix sprint
- ⬜ Triage QA findings (CRITICAL/HIGH only — rest to BACKLOG)
- ⬜ Fix CRITICAL/HIGH bugs
- ⬜ Re-test failure paths

### Day 26 — Tim's outreach plan locked
- ⬜ Spreadsheet of 30–50 names with contact methods
- ⬜ Pitch angle per contact
- ⬜ Calendar blocked for outreach starting Day 31
- ⬜ Demo call template ready

### Day 27 — Day-0 launch plan written
- ⬜ Exact launch-day sequence document
- ⬜ Social media posts ready + Tim-approved
- ⬜ Press email drafts (Pollstar, MBW, Hypebot)
- ⬜ Tim's first 5 outreach emails personalized
- ⬜ Status check procedure if things break
- ⬜ Rollback plan (re-enable COMING_SOON gate)

### Day 28 — Final smoke test + buffer
- ⬜ Remove `COMING_SOON=true` from `.env.local` locally
- ⬜ Verify everything works locally with gate off
- ⬜ Last-pass marketing copy review
- ⬜ Permissions check on Stripe / Resend / Cloudinary / Mapbox / Anthropic
- ⬜ PostHog events firing across full funnel

### Day 29 — Coming Soon gate removed in production
- ⬜ Remove `COMING_SOON=true` from Vercel env vars
- ⬜ Redeploy and verify production
- ⬜ Verify signup flow end-to-end on production
- ⬜ Soft soak with Kurt + Tim + friends/family

### Day 30 — PUBLIC LAUNCH
- ⬜ Tim sends first 5 personalized outreach emails
- ⬜ Social media posts go out
- ⬜ Press emails sent
- ⬜ Monitor PostHog all day
- ⬜ Bug triage rapid-response
- ⬜ End-of-day signup / activation / subscription numbers to Tim

---

## Trial model (locked May 28 — replaces the May 23 watermarked Free tier)

The May 23 Free tier spec (watermark, 5-shows/mo counter, 3-format limit, custom-font / video / PDF blocks, upgrade-wall modal) is **DEAD**. Replaced by a no-card 7-day trial of full Localizer access. After expiry, access falls through to "free" — downloads return 402, signed-in dashboard surfaces remain usable until the user picks a plan. The watermark, shows-per-month counter, feature gates, and upgrade-wall items below are CUT — none of them ship.

- ✅ **Trial gate reads `trial_ends_at`** — `lib/localizer/billingGate.ts` treats an unexpired `trial_ends_at` as paid-equivalent access, evaluated before the existing `paidStatuses` check (commit `8095476`, May 28).
- ✅ **`ensureOrgExists` seeds trial-not-active** — new orgs created with `localizer_plan: null`, `localizer_plan_status: null`, `trial_ends_at = now() + 7d` (commit `67cf438`, May 28). Docstring updated.
- ✅ **Beta-org backfill complete (May 28)** — 22 existing tester orgs reset to `localizer_plan = null`, `localizer_plan_status = null`, fresh `trial_ends_at = now() + 7d` (June 5 expiry); shared org `d38702d7` preserved as `active` with `owner_email = 'hwy61ai@gmail.com'`. Verified by SELECT in Supabase SQL Editor.
- ✅ **Trial-model commits pushed (June 2)** — `8095476` + `67cf438` live in production via Vercel auto-deploy. Access-bucket query confirms behavior: 22 orgs on active trials, shared org `d38702d7` preserved as `active`, 14 orgs correctly past `trial_ends_at` and gated.
- ~~Watermark renderer~~ — **CUT** (no watermark in the trial model).
- ~~Shows-per-month counter on orgs~~ — **CUT** (no per-month cap; trial gives unlimited, post-trial gates downloads only).
- ~~Feature gates on Free accounts~~ — **CUT** (free state gates downloads via 402, not per-feature).
- ~~Upgrade wall UI~~ — **CUT** (the download 402 carries the upgrade prompt).
- ~~Plan-status check for Free~~ — **DONE differently** (free = `localizer_plan_status: null` + expired `trial_ends_at`, handled inline by the gate without a new status enum).

---

## Added since the original plan

Real work shipped that wasn't in the 30-day plan as written. Most of this came out of testing the original specs and finding gaps.

- ✅ **Welcome-page pivot from 5-step wizard.** Built the wizard end-to-end, tested it, replaced it with a single welcome screen because the wizard didn't match Localizer's actual batch-tour workflow.
- ✅ **Master Artist page gating for Localizer-only orgs.** Seven TourRouter-specific sections (Roster, Lodging, Vehicles, Hospitality, Promo & Marketing, Business Entity, Technical Production) plus their divider now hide for users without TourRouter or bundle access.
- ✅ **Dashboard direct-access redirect.** `/dashboard` checks Localizer eligibility + onboarding state before any other logic, catching Stripe-checkout / bookmark / email-link entries that bypassed the welcome page.
- ✅ **LOCALIZER wordmark treatment.** Black-bordered box on warm background, crimson text-shadow + box-shadow tracking cursor position via CSS variables, 0.45s cubic-bezier easing.
- ✅ **Nav cleanup on `/localizer`.** Reduced from 6 items (TourRouter / Localizer / DIY / Road App / Pricing / Join the Beta) to 3 items (Pricing / Sign in / Start your free trial).
- ✅ **Dead CSS hygiene pass on `/localizer`.** Removed 22 rules + 3 section comments tied to deleted markup (Features, Use Cases, Testimonials, hero eyebrow, nav `.active` state).
- ✅ **Tim launch briefing doc.** `docs/TIM_LAUNCH_BRIEFING.md` summarizing where we are vs the plan, strategic decisions made, current blockers, and Promoter Edition status.
- ✅ **Stripe business setup (partial).** Bank account connected via Plaid, EIN verification document uploaded, public/support email updated to `billing@hwy61labs.com`. Product creation itself remains parked on Tim's pricing call.
- ✅ **Onboarding video script (first pass).** `docs/LOCALIZER_ONBOARDING_VIDEO_SCRIPT.md` drafted with tour-manager-to-tour-manager voice, ~2:30 narration, scene markers.
- ✅ **Artist tile "ARTIST PROFILE" button.** Bottom-right pill link on artist tiles with image-aware styling. Replaced a hover-only top-right gear icon that was failing desktop discoverability and mobile entirely.
- ✅ **HWY61 Labs portfolio preserved at `/labs`.** Original 562-line `app/page.tsx` (drop-zone demo, four-product portfolio, multi-tier pricing) moved aside May 26 to make room for the Localizer landing at root. Still in git history, still browseable.
- ✅ **fadeUp cascade + smooth scroll ported from labs to landing.** Staggered hero entrance animation (wordmark → headline → sub-headline → btn-row at 100ms increments) plus CSS `scroll-behavior: smooth` for nav anchors — ported from `/labs` to the Localizer landing.
- ✅ **`/pricing` page restyled to match Localizer Warhol aesthetic.** Replaced inline `style={{}}` props with a class-based `<style>` block; added sticky dark nav matching the landing; featured Pro card now carries the crimson 6×6 flat offset shadow + translateY treatment.
- ✅ **`noindex, nofollow` meta tag on `/labs`.** Server-component layout exports `metadata.robots` so search engines don't index the preserved portfolio at the `/labs` URL.
- ✅ **Mobile responsive polish pass (May 26).** Three fixes after the initial restyle: consolidated `pricing.css` into the `/pricing` inline `<style>` block (deleted the file, dropped all `!important` flags); hid the nav "Start your free trial" CTA at ≤768px on `/pricing` (redundant with per-card CTAs); scaled the LOCALIZER wordmark on `/` at ≤768px (font 80px → 48px, letter-spacing 6px → 3px, shadow 6px → 3px via the existing `--shadow-x`/`-y` vars) so the hero no longer overflows the container at 375px / 600px.
- ✅ **Privacy Policy + Terms of Service content finalized (May 28).** Codebase-wide entity rename "HWY61 AI" → "HWY61 LLC" (9 instances across `app/privacy/page.tsx` and `app/terms/page.tsx`); Effective Date bumped April 1 → June 1, 2026; "invitation only" line dropped from Eligibility; "monthly render limit" line dropped from Subscription & Billing. Content is now internally consistent, current, and accurate to product behavior. Legal review by counsel still pending (logged as pre-launch blocker).
- ✅ **Privacy Policy + Terms of Service rewritten Localizer-only (June 4, commit `ca5b976`, building on prior `d78de22`).** Both `app/privacy/page.tsx` and `app/terms/page.tsx` narrowed to Localizer scope — TourRouter/DIY/settlement/personnel references removed (those products get papered separately at their own launches, not now). ToS additions: Texas governing law + jurisdiction; free-trial billing language (no card required, end-of-trial behavior, Stripe Customer Portal cancellation, 30-day price-change notice); Termination + General Provisions sections. Privacy: PostHog disclosed as a third-party processor. 3 matching .docx prepared for Tim (Privacy, ToS, legal-review memo). Pages live in production via Vercel auto-deploy. Legal counsel review still pending — Tim to name the reviewing attorney (see Active blockers).
- ✅ **Day 7 canned support responses finalized (May 28).** `docs/SUPPORT_CANNED_RESPONSES.md` with five Tim-voice replies: pricing, billing, generic how-to, refund requests, and data safety. Notes section flags `[help docs link]` placeholder for swap when Getting Started article ships.
- ✅ **Pricing page (`/pricing`) Free tier card added (May 28).** Free tier added as first card in the four-tier grid; CSS grid bumped 3 → 4 columns; Free CTA routes to `/login` (skips Stripe checkout); Pro and Agency artist counts corrected from "3 bands" / "Unlimited bands" → "Up to 5 bands" / "Up to 12 bands" to match May 23 pricing model. Box-sizing fix on the shared `.pricing-cta` rule keeps `<a>` and `<button>` CTAs visually identical.
- ✅ **Landing page (`/`) Free tier card added (May 28).** Free tier card added as first card in the landing pricing grid; CSS grid bumped 3 → 4 columns; "Annual billing saves 20%. Free during beta — no credit card required" replaced with "Annual billing saves ~17%. Free tier available — no credit card required" (the 20% number was inflated — actual is $290/yr vs $29×12=$348, savings = ~17%).
- ✅ **Trial-gate reads `trial_ends_at` (May 28).** `lib/localizer/billingGate.ts` treats an unexpired `trial_ends_at` as paid-equivalent access — short-circuits to `"paid"` before the existing `paidStatuses` (active / past_due) check. Replaces the dead watermarked Free tier model. Commit `8095476`. tsc + build clean.
- ✅ **`ensureOrgExists` seeds trial-not-active (May 28).** New orgs created with `localizer_plan: null`, `localizer_plan_status: null`, `trial_ends_at = now() + 7d`. Replaces the prior beta-mode seed (`localizer_plan: "agency"` + `localizer_plan_status: "active"`). Docstring rewritten to retire the "beta provisioning" note. Commit `67cf438`. tsc + build clean.
- ✅ **Beta-org backfill complete (May 28).** Three SQL UPDATEs in Supabase SQL Editor: (1) 22 existing tester orgs reset to `localizer_plan = null`, `localizer_plan_status = null`, fresh `trial_ends_at = now() + 7d` (June 5 expiry); (2) shared org `d38702d7` preserved as `active`; (3) `owner_email = 'hwy61ai@gmail.com'` set on `d38702d7`. Verified by SELECT — 22 testers on fresh June-5 trials, shared org active with the right owner email.
- ✅ **`trial_nudge_emails` idempotency log table created (June 2).** New public-schema table with `(org_id, nudge_type, resend_id, sent_at)` columns + `unique(org_id, nudge_type)` constraint as the idempotency backstop. RLS enabled; service-role only — no `authenticated` GRANT (cron-only writes). Explicit GRANTs per rule 18.
- ✅ **Day 5/7 trial-nudge cron route built (June 2).** `app/api/billing/trial-nudge/cron/route.ts` patterned on `app/api/tourrouter/advance/cron`: bearer-secret auth with dev bypass, inline service-role client, idempotency pre-fetch into a Set, try/catch per send, `errors[]` array, JSON response. Two HTML bodies in Tim's May 28 copy, welcome-email styling (cream `#F5F0E8` + crimson `#c5535b`). Windows: Day 5 (now+1d…now+2d), Day 7 (now−1d…now). Excludes paid orgs and shared org `d38702d7`. Commit `1d49587`. tsc + build clean.
- ✅ **Dry-run verified against live data (June 2).** Hit the route with `?dryRun=true` after temporary scaffolding — both windows correctly returned empty (no mis-targeted orgs; backfilled trial cohort lands in the Day 5 window on June 3). Scaffolding reverted before commit.
- ✅ **Cron scheduled live (June 2).** `CRON_SECRET` added to Vercel project env; `vercel.json` populated with `{ "crons": [{ "path": "/api/billing/trial-nudge/cron", "schedule": "0 13 * * *" }] }` (13:00 UTC = 9am EDT). Commit `b4f8fd9`. First real fire June 3–4 when backfilled testers land in the Day 5 window.
- ✅ **End-to-end signup smoke test passed (June 4).** Real fresh signup with a brand-new Supabase Auth user (`hwy61ai+testx@gmail.com`) against production: magic link → `/auth/callback` → `ensureOrgExists` correctly seeded a new trial org (`localizer_plan = null`, `localizer_plan_status = null`, `trial_ends_at ≈ now() + 7d`, `localizer_enabled = true`); user landed on the welcome page; clicked GET STARTED → `/dashboard`; added artist + show; generated an asset with NO paywall (trial gate granted access via the unexpired `trial_ends_at` branch). Test org cleaned up afterward. Verifies the post-May-28 trial-seed `ensureOrgExists` path (commit `67cf438`) which had never been exercised from the auth-callback before. Closes the BACKLOG pre-launch gate "Verify new-user signup works end-to-end before launch."

  **Welcome-redirect mechanism — correction (June 4).** An earlier note in this section claimed the welcome-page routing for fresh trial users was a non-issue because `localizer_onboarding_completed = false` drove the routing. That note was wrong on the mechanism. The real story, traced June 4: fresh trial users do NOT reach `/dashboard/onboarding/localizer` (`LocalizerWelcome.tsx`) — its eligibility gate at `page.tsx:42–44` explicitly bounces them back to `/dashboard` when both `localizer_plan_status` and `bundle_plan_status` are null (which is the trial-seed state). On `/dashboard`, `OnboardingGate` then renders `OnboardingWizard` as a full-screen overlay because `artistCount === 0` — THAT is the welcome screen the smoke-test user saw. The original "redirect gap" code-recon was right; users just hit a different welcome surface (the overlay) that masks it. Not a launch blocker — fresh trial users do get a proper welcome screen, just via the overlay path, not the dedicated route. Recording the correct mechanism so future copy edits target the right file (`app/components/OnboardingWizard.tsx`, not `LocalizerWelcome.tsx`).
- ✅ **In-app FAQ rewritten Localizer-only (June 4, commit `2298e82`).** `app/dashboard/support/page.tsx` `FAQ_DATA` constant replaced wholesale: 41 stale suite-positioned Q&As → 19 Localizer-only Q&As across 4 sections (Getting Started, Plans & Billing, Using Localizer, Troubleshooting). Drops $249 "Full HWY61 Suite" pricing (product doesn't exist), $49–$149 TourRouter pricing, "20% annual" claim (correct is ~17%), "during beta everything is free" copy, "@hwy61.io" domain (correct is `hwy61labs.com`), and the ~14 TourRouter-feature answers that aren't relevant to Localizer-only launch. Two answers (switch-plans, cancel) ship in SAFE/soft form pending Stripe Customer Portal config verification — copy upgrades parked in BACKLOG. Closes the LAUNCH_PROGRESS "FAQ positioning copy review | Tim" Active blockers row.
- ✅ **Stale "beta" copy removed from live public surfaces (June 4, commit `a7cadf8`).** Three string swaps: (1) `app/components/OnboardingWizard.tsx:127` "WELCOMES YOU TO THE LOCALIZER BETA" → "WELCOME TO LOCALIZER"; (2) same file line 139, "You're one of a small group helping us shape what Localizer becomes" → "Turn one promo image into a full set of branded, show-ready marketing assets. Let's make your first one."; (3) `app/page.tsx:328` final-CTA subhead "Free during beta. Upload one image..." → "7 days free, no card required. Upload one image, get every asset for every show on every platform." Plus a fourth fix at `app/page.tsx:317`: pricing-note "Free tier available — no credit card required" → "Start with a 7-day free trial — no credit card required" (the "free tier" claim implied a permanent feature-complete free tier that the trial model doesn't actually provide). The OnboardingWizard overlay is the welcome screen fresh trial users see post-signup (see welcome-redirect correction above), so this fix lands on the highest-traffic post-signup surface.

---

## Active blockers

| Blocker | Owner | What unblocks it |
|---|---|---|
| Tim's 2 remaining trial-model email questions | Tim | Answers to: (3) welcome email trigger point + new body via `/api/welcome`; (5) cancellation copy — confirm pre-upgrade users see no "cancel" action. (Q1 resolved May 28 by trial-gate work; Q2 cron home + Q4 idempotency resolved June 2 by the trial-nudge cron build — Vercel cron at `0 13 * * *`, idempotency via `trial_nudge_emails` log table.) |
| Advance cron has no external trigger | Drew → Tim | TourRouter's `app/api/tourrouter/advance/cron` route has no `vercel.json` entry, no GitHub Action, no other scheduler — advance follow-up emails are likely not auto-firing in production. Drew to raise with Tim: confirm whether this is intentional, then either add to `vercel.json` or document as out-of-scope for Localizer launch. |
| Live Stripe verification end-to-end | Drew + Tim | Schedule screen-share session, run the 9-step test plan above |
| Legal review of Privacy Policy + Terms of Service | Tim | 🟡 Page content is final and accurate to product as of June 4 (`ca5b976`); Localizer-only scope decided. 3 docs ready for Tim (Privacy, ToS, legal-review memo). External clock not yet started — waiting on Tim to name the reviewing attorney. Longest-pole launch item. |
| Verify dmca@, privacy@, support@ hwy61labs.com inbox routing | Drew | DNS / forwarding setup; verify all three route to a real monitored inbox |
| Day 12 video recording | Tim | Voice/copy review of the script draft |
| Landing hero copy diff (informational) | Tim | Heads-up on `/` sub-headline rewrite shipped May 27 — no approval needed to launch |
| Pre-launch — onboarding wizard per-user vs per-org mismatch | Tim | Decision on which of three fixes to take (see BACKLOG) |

---

## Open items parked for later

Deliberately deferred — not blocking launch, revisit on the timeline indicated.

- **Pro price review at 60 days post-launch.** Most likely change: $59 → $79 if conversion data supports it.
- **Annual conversion prompt motion for Free users at 60–90 days.** Separate from the upgrade wall — more of a "you've been with us a while" email nudge inviting annual upgrade.

---

## Next session candidates

Ranked by priority for the next focused session:

1. **Stripe Day 3 live verification.** In-flight screen-share with Tim — run the 9-step test plan above. Trial-model commits already pushed (June 2), so Stripe is the remaining half of the original June 2 in-flight pair.
2. **Tim's 2 remaining trial-model email questions (handoff + answers).** Q3 (welcome email trigger point + new body via `/api/welcome`) and Q5 (pre-upgrade cancellation copy). Q1, Q2, Q4 all resolved. Once answered, unblocks welcome transactional wiring. FAQ positioning copy review + landing hero diff fold into the same handoff doc.
3. **Watch first trial-nudge cron run + raise advance cron with Tim.** First scheduled fire is June 3 at 9am ET (13:00 UTC). Verify in Vercel Cron Jobs logs: bearer auth passes, Resend delivery succeeds, `trial_nudge_emails` rows insert correctly, idempotency holds on a manual second invocation. Same session: raise the TourRouter advance cron — no external trigger exists (see Active blockers), so advance follow-up emails are likely not auto-firing in production.
4. **First-asset celebration moment (Day 11).** Highest-leverage UX improvement per the source plan ("the most important UX in the whole product"). Confetti or success screen + prominent "Copy your venue link" button. Half-day session.
5. **Empty states pass (Day 11).** Four empty-state surfaces (dashboard / artist / tour / template editor). Mechanical work, no Tim input needed. Half-day session.
6. **"Getting Started with Localizer" help doc (Day 6 / Day 13).** Pairs naturally with the welcome email rewrite.
7. **Pre-launch gate: signup smoke test end-to-end.** Per BACKLOG — Supabase email signups currently disabled, ensureOrgExists never tested from the new auth-callback path. Catches a major surprise before launch.
