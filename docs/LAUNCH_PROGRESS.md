# Launch Progress

*Single source of truth for the 30-day Localizer launch.*
*Last updated: May 26, 2026*

Source plan: `docs/HWY61_Localizer_30_Day_Launch_Plan_May_19_2026.md`. Day numbers and item descriptions below mirror that file; status reflects actual shipped work per `docs/SESSION_LOG.md` and session work through May 23.

## At a glance

- **3 of 30 day-items complete** (Day 1 wired May 26, Day 4–5 welcome page shipped, Day 8–9 mostly complete — video embed + bio callout still pending)
- **1 day-item moot** (Day 3 — no live customers to migrate; all prior Stripe products were sandbox)
- **Pricing locked May 23** (source record: `docs/LOCALIZER_PRICING_DECISION_2026-05-23.md`) — Solo $29/$290, Pro $59/$590, Agency $129/$1,290, plus a net-new Free tier (1 artist, 5 shows/mo, watermarked, 3 formats)
- **12 items added since the original plan was written** (see "Added since the original plan" section)
- **Blocked on:** Tim's video script review (Day 12), Tim's welcome email review (Day 6, drafting now), Tim's canned support responses (Day 7)
- **Currently in flight:** Drew picks next session work — likely welcome email draft (Day 6) or Stripe Day 2 webhook update

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

### Day 2 — Stripe webhook update + price ID rotation
- ⬜ Update `app/api/stripe/webhook/route.ts` for new price IDs
- ⬜ Update Vercel env vars
- ⬜ Test sandbox subscription through each tier

### Day 3 — Existing customer pricing migration
- ⬜ ~~Identify existing Localizer customers via Stripe~~
- ⬜ ~~Migrate each to corresponding new lower-priced subscription~~
- ⬜ ~~Send friendly notification email via Resend~~
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
- ⬜ Welcome email triggered on first sign-in (Resend transactional)
  - 1-paragraph welcome from Tim
  - 3-bullet "what to do next" steps
  - Link to help docs
  - Tim's email for direct support
- ⬜ "Getting Started with Localizer" help doc (single article)
  - *Drew drafting next — will share for Tim's review*

### Day 7 — Customer support workflow defined
- ⬜ Add Tim to `support@hwy61labs.com` forward
- ⬜ Decide ownership split (Tim replies, Drew handles bug escalations)
- ⬜ Set up Linear or Notion board for tracking customer issues
- ⬜ Smoke-test the support address end-to-end
- ⬜ Tim drafts 5 canned responses (pricing, billing, "how do I do X", refund requests, "is my data safe")
  - *Blocked on: Tim's canned responses*

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
- ⬜ "Built by working music industry people" callout with Tim's bio + photo

### Day 10 — Pricing page (`/pricing`)
- ⬜ Standalone three-tier comparison table
- ⬜ Monthly/Annual toggle (annual = 2 months free)
- ⬜ Highlight Pro as "most popular"
- ⬜ "Start free trial" CTA per tier
- ⬜ FAQ section
  - *Pricing currently lives inside `/localizer` only; standalone `/pricing` not yet built*

### Day 11 — Empty states + first-asset moment
- ⬜ Dashboard with zero artists empty state
- ⬜ Artist page with zero tours empty state
- ⬜ Tour page with zero shows empty state
- ⬜ Template editor empty state
- ⬜ First-asset celebration moment (confetti or success screen)
- ⬜ Prominent "Copy your venue link" button on first asset

### Day 12 — Demo video / GIF
- ✅ Onboarding video script drafted (`docs/LOCALIZER_ONBOARDING_VIDEO_SCRIPT.md`, ~2:30 narration)
- ⬜ Tim reviews script for voice
  - *Blocked on: Tim's review*
- ⬜ Record screen + voiceover
- ⬜ Export MP4 + animated GIF version
- ⬜ Self-host (no YouTube embed)

### Day 13–14 — Help docs / FAQ
- ⬜ "Getting Started with Localizer" (also Day 6)
- ⬜ "How to upload templates and customize branding"
- ⬜ "Understanding venue links — how to share with promoters"
- ⬜ "Custom fonts and how to upload them"
- ⬜ "Sponsor logos — what works and what doesn't"
- ⬜ "Pricing, billing, and your subscription"
- ⬜ "Troubleshooting common issues"

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
- ⬜ Venue link viewer (highest priority — promoters use phones)
- ⬜ Account/billing
- ⬜ Help pages

### Day 17 — Account/billing page polish
- ⬜ Current plan + usage clearly displayed
- ⬜ "Upgrade" CTA visible
- ⬜ Annual/monthly toggle on upgrade
- ⬜ Stripe Customer Portal link
- ⬜ Clean cancellation flow

### Day 18 — Print PDF / generation wait states
- ⬜ "Why this takes a moment" explainer tooltip on print PDF
- ⬜ Format-by-format checkmark progress on multi-format generation

### Day 19 — Auth flow polish
- ⬜ Magic link page branded with HWY61 wordmark
- ⬜ Friendly recoverable error states
- ⬜ ~~PKCE migration~~ — deferred to post-launch (per source plan)

### Day 20 — Toast / error state audit
- ⬜ Replace remaining `alert()` calls with toasts
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

## Free tier scope (added May 23 — Tim's pricing decision)

Tim's pricing locked in a Free tier ($0, 1 artist, 5 shows/mo, 3 formats, watermarked). This is net-new engineering not in the original 30-day plan. Estimated 2–3 days; runs as a parallel track to Stripe Days 1–2.

- ⬜ **Watermark renderer** — Cloudinary `l_text` overlay reading `localizer.hwy61labs.com` in footer/corner position. Free users only. Applies to both image and video outputs.
- ⬜ **Shows-per-month counter on orgs** — DB column tracking shows touched this billing month, monthly reset, enforcement at asset-gen time. Block + upgrade wall at the 6th show.
- ⬜ **Feature gates on Free accounts** — block: format count >3, custom font upload, video asset generation, PDF routing parser.
- ⬜ **Upgrade wall UI** — modal shown at every gated action. Monthly and annual prices side-by-side, annual highlighted as default.
- ⬜ **Plan-status check for Free** — extension of existing eligibility pattern in `lib/localizer/billingGate.ts`. Free becomes a real plan status, not "no plan."

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

---

## Active blockers

| Blocker | Owner | What unblocks it |
|---|---|---|
| Day 6 welcome email | Tim | Review pass on Drew's draft (incoming) |
| Day 7 canned support responses | Tim | Tim drafts 5 canned responses |
| Day 12 video recording | Tim | Voice/copy review of the script draft |
| Pre-launch — onboarding wizard per-user vs per-org mismatch | Tim | Decision on which of three fixes to take (see BACKLOG) |

---

## Open items parked for later

Deliberately deferred — not blocking launch, revisit on the timeline indicated.

- **Pro price review at 60 days post-launch.** Most likely change: $59 → $79 if conversion data supports it.
- **Annual conversion prompt motion for Free users at 60–90 days.** Separate from the upgrade wall — more of a "you've been with us a while" email nudge inviting annual upgrade.

---

## Next session candidates

Ranked by priority for the next focused session:

1. **Welcome email draft (Day 6).** Drew-owned, drafting next. Roughly 30–60 min for a first pass + send to Tim.
2. **Stripe Day 2 — webhook consolidation + price ID rotation.** Two webhooks currently coexist (`/api/stripe/webhook` vs `/api/billing/webhook`) — Day 2 picks one and retires the other, wires plan-tier mapping via `tierFromPriceId` from the new pricing module. Half-day session.
3. **First-asset celebration moment (Day 11).** Highest-leverage UX improvement per the source plan ("the most important UX in the whole product"). Confetti or success screen + prominent "Copy your venue link" button. Half-day session.
4. **Empty states pass (Day 11).** Four empty-state surfaces (dashboard / artist / tour / template editor). Mechanical work, no Tim input needed. Half-day session.
5. **"Getting Started with Localizer" help doc (Day 6 / Day 13).** Pairs naturally with the welcome email draft.
6. **Pre-launch gate: signup smoke test end-to-end.** Per BACKLOG — Supabase email signups currently disabled, ensureOrgExists never tested from the new auth-callback path. Catches a major surprise before launch.
