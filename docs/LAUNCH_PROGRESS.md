# Launch Progress

*Single source of truth for the 30-day Localizer launch.*
*Last updated: June 14, 2026*

Source plan: `docs/HWY61_Localizer_30_Day_Launch_Plan_May_19_2026.md`. Day numbers and item descriptions below mirror that file; status reflects actual shipped work per `docs/SESSION_LOG.md` and session work through May 23.

## At a glance

- **Day status:** Days 1, 2, 4–7, 10, 11, 16, 17, 18, and 20 fully resolved; Day 3 moot (no customers to migrate); Day 15 cut June 4 (viewer already substantially built — see "Day 15" section); Days 8–9 partially complete (highest-value items shipped, remainder open). Specifics: Day 1 wired May 26, Day 2 webhook consolidation May 27, Day 4–5 welcome page shipped, Day 7 (5/5) customer support workflow fully defined, Day 8–9 landing live (video embed + bio callout pending), Day 10 closed out June 2 — all 5/5 items shipped (4-tier grid, monthly/annual toggle, "Most Popular" Pro highlight, "Start free trial" CTA copy, 8-Q&A FAQ in Tim's voice); 2 FAQ copy upgrades parked in BACKLOG ("Pricing FAQ copy upgrades") gated on the live-Stripe screen-share — switch-plans + cancel-at-period-end can be strengthened from soft-form to strong-form pending portal-config verification; Day 11 closed out June 2 — 4 items shipped (3 empty states + first-asset success banner), 2 items deliberately cut (template page-level empty state, copy-venue-link button); Day 16 closed out June 4 — venue viewer fixed June 2 (commit `d6b028c`); remaining surfaces (landing, pricing, login, onboarding, dashboard, account) verified at 375px June 4 with no code changes needed; template editor accepted as desktop-primary per plan; `/help` pages dropped as moot (no `/help` route exists); Day 20 alert() → toast cleanup done June 2; actionable error next-steps deferred to post-launch polish (June 5).
- **1 day-item moot** (Day 3 — no live customers to migrate; all prior Stripe products were sandbox)
- **1 day-item cut** (Day 15 — viewer already substantially built; growth wedges parked as post-launch fast-follow, owner Tim)
- **Pricing locked May 23** (source record: `docs/LOCALIZER_PRICING_DECISION_2026-05-23.md`) — Solo $29/$290, Pro $59/$590, Agency $129/$1,290, plus a no-card 7-day trial of full access, then free/blocked until a plan is picked (replaces the May 23 watermarked Free tier — see "Trial model" section below)
- **38 items added since the original plan was written** (see "Added since the original plan" section)
- **Trial model live in production (June 2)** — gate reads `trial_ends_at` (`8095476`), `ensureOrgExists` seeds trial-not-active (`67cf438`), 22-org beta backfill applied May 28. Both commits pushed and live; verified via access-bucket query (22 active trials, 1 shared org preserved, 14 correctly expired/blocked).
- **Blocked on:** Tim's video script review (Day 12), Tim's Day 3 live Stripe verification screen-share, Tim's 1 remaining trial-model email question (Q1, Q2, Q3, Q4 resolved; only Q5 cancellation copy remains), Tim's attorney contact / authorization to find a Texas SaaS attorney for ToS/Privacy items 1–3 (governing law/arbitration, liability cap floor, multi-state privacy thresholds); status email sent June 9.
- **Currently in flight:** Stripe Day 3 live verification (awaiting Tim screen-share); legal review awaiting Tim's attorney answer (status email sent June 9 — nothing else legal in progress). Tim/Don's June 10 label-consistency polish batch landed (Import Assets shape/dimensions reorder + 1px divider, Template Editor FORMATS tab rename, Share & Download modal labels, venue viewer label restyle + Square Video card label flip with filename decoupled, artist profile photo label + Spotify helper text) — copy/labels only, no ✅/⬜ state changes. `/tourrouter`, `/diy`, `/roadapp` verified June 11 as hidden by unconditional redirects independent of `COMING_SOON` — no `/labs`-style launch-flip exposure (tested locally with gate off). June 11 UI polish landed: dashboard editorial masthead (HWY61 LABS eyebrow + LOCALIZER/rule/YOUR ARTISTS lockup), gigs page header/counter row rearrangement (+ NEW EVENT relocated into the counter row, SHARE & DOWNLOAD FULL TOUR centered in the header row, helper text + RE-GENERATE ALL order swapped), and landing-page billboard equation replacing the stat card (20 × 5 = 100+ with crimson "100+" block) — visual changes only, no ✅/⬜ state changes; screenshots sent to Tim for review. June 11 evening: session-aware nav added on `/` and `/pricing` (Dashboard CTA replaces Sign in + Start your free trial when logged in); 3-tour Solo/trial limit enforced via `lib/localizer/tourLimits.ts` + `createTourForArtist` server action (`app/dashboard/artists/[artistId]/actions.ts`), verified on production. Pricing-page Free-card rewrite + logged-in CTA copy awaiting Tim's four answers. **June 12:** Tim's four pricing answers came back and the rewrite shipped (Free Trial card mirroring the landing, "7 days" period, hide-when-logged-in, "Select plan" CTA for logged-in users). CASCADE migration applied (12 statements; FK landscape collapsed so org delete is now a single statement). `deleteOrg` admin routine built and proven end-to-end (`lib/admin/deleteOrg.ts` + `POST /api/admin/delete-org` dual-gated + `deleted_orgs_audit` table) — `testicles` and `testx` deleted via the new endpoint with Cloudinary asset cleanup verified out-of-band. Remaining test-org cleanup is two `curl`s (`testcorkys`, `testalex`) plus the `+test2026` retention decision. **June 13–14:** Venue page polish batch — header lockup rebuilt as a single-line "HWY61 LABS / LOCALIZER" wrapped in one `<a>` (48px display); section order reflowed to Photos → Video → Print Poster → Advance Materials → Press & Playlists → Follow the Artist → Listen; hero buttons enlarged and center-justified; all 8 blue mono section labels bumped fontSize 13 → 16 across `page.tsx` + `PressPlaylists.tsx` + `SocialIcons.tsx` for stronger hierarchy. Press & Playlists feature shipped: new `press_playlists` jsonb column on `artists` (SQL run in Supabase SQL Editor); profile-side editor mirroring the `adv_custom_materials` pattern (label + URL per row, `.select().maybeSingle()` rule-6 verification on save); venue-side `PressPlaylists.tsx` server component with hybrid display — Spotify URLs auto-embed as iframes (open.spotify.com/embed/), non-Spotify URLs render as bordered link pills with leading brand glyph + crimson-on-hover via scoped CSS. `SocialIcons.tsx` flexWrap at 375px to prevent 6-icon overflow. OG image + favicon shipped via Next.js convention files: `app/opengraph-image.tsx` renders a 1200×630 cream Warhol card via next/og `ImageResponse` (real Bebas Neue fetched from Google Fonts with `User-Agent: Mozilla/5.0` UA spoof per CLAUDE.md rule 16, subtle halftone dot field via radial-gradient + backgroundSize, "OFFICIAL ASSET KIT" eyebrow + HWY61 LABS split-color lockup + LOCALIZER hero); `app/icon.tsx` mirrors a stacked HWY (ink) / 61 (crimson) Bebas lockup at 256×256 as the favicon (crimson-circle badge stripped per Tim direction — just type on cream); `metadataBase: new URL("https://hwy61labs.com")` added to the root metadata export; legacy `app/favicon.ico` deleted so the new convention file is the sole favicon source. Rick (`rick@ninemilerecords.com`) comped to Agency tier directly in Stripe per `docs/PRICING_FOR_TIM.md`; Tony (`tony@keeledscales.com`) runbook drafted in `docs/COMP_TONY_RUNBOOK.md`, comp pending Tim. Team venue feature shipped (June 14): new `team_extra` jsonb column on `artists` (nullable, no default — mirrors `press_playlists`) for unlimited custom roles beyond the four fixed (Manager, Tour Manager, Booking Agent, Publicist); profile-side editor extended with a "+ ADD TEAM MEMBER" dashed button + custom-member cards rendered as additional cells in the existing 2-col fixed-role grid (uniform width with fixed cards, role-label input + name + email + phone + × delete, `.select().maybeSingle()` rule-6 verification on save); venue-side `app/v/e/[token]/TeamContacts.tsx` server component renders a unified card grid (fixed roles first, then custom members from `team_extra`), skips any card where name+email+phone are all empty, conditionally hides the role caption when a custom member's role is blank, returns null when no cards fill; mounted between Advance Materials and Press & Playlists. Final venue page section order: **Advance Materials → Team → Press & Playlists → Follow the Artist → Listen.**

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
- ✅ Welcome email triggered on first sign-in (Resend transactional)
  - 1-paragraph welcome from Tim
  - 3-bullet "what to do next" steps
  - Link to help docs
  - Tim's email for direct support
  - *Welcome email body rewritten Localizer-only June 4 (commit `0c7df71`) in `app/api/welcome/route.ts`: body paragraph swapped from the suite pitch ("HWY61 Labs builds tools for people who move music for a living. Everything autosaves. Everything drag & drop.") to Localizer-only ("Localizer turns one promo image into a full set of branded marketing assets — sized for every platform, ready for every show. Upload once, download everything."); flyer stack swapped Routing/Marketing/Advancing → One image./Every asset./Every show. (crimson moved from middle to last line); subject line "Welcome to HWY61 Labs" → "Welcome to Localizer". Tim's Q3 (welcome email trigger point + new body via `/api/welcome`) resolved by this commit — leaves only Q5 (cancellation copy) outstanding. The `<title>`, "Tools for Touring" sub-tagline, sign-off ("— The HWY61 Labs team"), and `hwy61-wordmark.png` were left intact (header/footer branding); body copy is the part that matters for the Localizer-only voice.*
- 🚫 "Getting Started with Localizer" help doc (single article) — DROPPED (June 5). Superseded by the demo video (Day 12), which covers the getting-started walkthrough better in a visual product. The in-app onboarding wizard (add artist → add show → generate) plus the Localizer-only FAQ already guide new users in-app. NOTE: the demo video itself is still pending (Day 12, blocked on Tim's script review) — getting-started coverage at launch depends on that video shipping. Also: no `/help` surface exists (doc-article system deferred post-launch), so there was nowhere to host a standalone article anyway.

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
- ✅ Stale "Free forever / 1 artist, watermarked" pricing tile fixed (June 9)
  - *First pricing card on `/` now reads "Free Trial / $0 / 7 days / Full access. No card required." matching the trial model. Closes the long-deferred BACKLOG / NEXT SESSION watermark-copy item.*
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

### Day 15 — Venue link viewer page redesign — **CUT June 4**
- 🚫 Day 15 — Venue link viewer page redesign — CUT. Recon (June 4) confirmed the viewer (`app/v/e/[token]/page.tsx`) is already substantially built: labeled multi-format asset grid with dimensions, download component, advance materials, Spotify embed. Current state judged good enough for launch. Growth wedges ("Made yours at..." CTA, "Forward to artist") not built — parked as post-launch fast-follow if desired, owner Tim.

### Day 16 — Mobile responsiveness pass — **COMPLETE June 4**

*Verification pass. Most surfaces were already responsive from prior work (May 26 mobile polish pass, June 2 venue-viewer fix). This session confirmed login, account, dashboard, and onboarding all hold at 375px with no overflow or fixed-grid breaks. No code changes needed.*

- ✅ Landing page
  - *Already covered — `app/page.tsx` has a `@media (max-width: 768px)` block (line 200) plus the LOCALIZER wordmark scale-down shipped May 26. Verified at 375px June 4.*
- ✅ Pricing
  - *Already covered — May 26 mobile pass (`app/pricing/page.tsx` `@media (max-width: 768px)` block at line 194 hiding the redundant nav CTA, consolidated inline `<style>`, dropped `!important` flags). Verified at 375px June 4.*
- ✅ Login / magic link
  - *Verified at 375px June 4. `app/login/page.tsx` uses a 480px max-width container that collapses cleanly; no fixed widths or hardcoded large grids.*
- ✅ Onboarding wizard
  - *Verified at 375px June 4. `app/components/OnboardingWizard.tsx` overlay (the actual welcome surface fresh trial users hit per the June 4 redirect-mechanism correction) reads fine at narrow width.*
- ✅ Dashboard / artist / tour pages
  - *Verified at 375px June 4. The `repeat(auto-fill, minmax(280px, 1fr))` artist tile grid in `app/dashboard/page.tsx` already collapses to a single column. Artist + tour child pages inherit the same intrinsic-sizing pattern.*
- 🚫 ~~Template editor~~ — **accept desktop-primary** per the source plan. Overlay editing on the Canvas renderer is inherently a desktop task (precise text positioning, multi-format preview). Not blocking launch; promoters/venues never touch this surface, only tour managers do.
- ✅ Venue link viewer (highest priority — promoters use phones)
  - *Fixed two confirmed phone-width breaks in `app/v/e/[token]/page.tsx` June 2 (commit `d6b028c`): hero title/Download-All row now wraps (`flexWrap: "wrap"` + `gap: 16`) so the button drops below the title instead of overlapping; Advance Materials grid changed from hard `repeat(4, 1fr)` to `repeat(auto-fit, minmax(140px, 1fr))` so it collapses 4→2→1 columns instead of crushing W-9 against the edge. Pure inline-style intrinsic-sizing fix, no `<style>` block or CSS file. Verified live at narrow width.*
- ✅ Account/billing
  - *Verified at 375px June 4. `AccountClient.tsx` uses a 640px max-width column wrapper that collapses cleanly; artist meter, plan badge, trial-days-left chip, billing portal button, and the new sign-out button all read fine at narrow width.*
- 🚫 ~~Help pages~~ — **MOOT.** No `/help` route exists in `app/` (verified by glob June 4). Mobile item removed; revisit only if a help surface ships post-launch. The Day 6 / Day 13–14 "Getting Started with Localizer" help doc is the gating dependency for any future mobile work here, and itself remains ⬜.

### Day 17 — Account/billing page polish — **COMPLETE June 4**
- ✅ Current plan + usage clearly displayed
  - *`app/account/page.tsx` + `AccountClient.tsx` rewritten June 4 (commits `c4f5b4c` + `0d85b31`): now reads `localizer_plan`, `localizer_plan_status`, `trial_ends_at` (instead of the dead `plan` column). Surfaces plan badge (Solo/Pro/Agency/Trial), trial-days-left countdown, trial-end date, and an artist-count meter `{artistsUsed}/{artistLimit}` sourced from `artistLimitForPlan()`. Replaces the stale "renders this month" meter that no longer reflects the gating model.*
- ✅ "Upgrade" CTA visible
  - *Both states: the no-Stripe path renders a crimson "VIEW PLANS" CTA → `/pricing`; the with-Stripe path shows the portal button + a "VIEW ALL PLANS →" secondary link. Over-limit state renders an additional inline "Upgrade to add more" crimson warning on the artist meter.*
- ✅ Annual/monthly toggle on upgrade
  - *Lives on `/pricing` (not on account), which is the right home — the toggle drives the Stripe price ID at checkout. Account-page "VIEW PLANS" CTA routes there. All 6 live Stripe annual/monthly price IDs exist (Solo/Pro/Agency × monthly/annual) per Day 1; nothing left to unblock.*
- ✅ Stripe Customer Portal link
  - *Already shipped: `app/api/billing/portal/route.ts` returns `stripe.billingPortal.sessions.create({ customer })` URL; AccountClient's "MANAGE BILLING & INVOICES" button POSTs to it and redirects on success. Unchanged by this session's rewrite.*
- ✅ Clean cancellation flow
  - *Handled entirely via Stripe Customer Portal — the canonical Stripe pattern. No in-app cancel UI needed; portal handles confirmation, end-of-period vs immediate, and prorations. Already wired via the portal route above.*

### Day 18 — Print PDF / generation wait states
- ✅ "Why this takes a moment" explainer tooltip on print PDF
  - *Already shipped in `app/v/e/[token]/PrintDownloadButton.tsx`: "This can take up to 30 seconds. Please don't refresh." + animated striped progress bar + elapsed-time counter. Verified June 2.*
- 🚫 Format-by-format checkmark progress on multi-format generation — DEFERRED to post-launch polish (June 5). EventsTable.tsx currently shows a single aggregate done/total progress bar, which works and communicates progress fine. Replacing it with per-format checkmarks is a UX rebuild (real work), not a launch blocker — it's a delight improvement on a functional wait state. Revisit post-launch; only prioritize if beta feedback shows the aggregate bar is confusing.

### Day 19 — Auth flow polish
- ✅ Magic link page branded with HWY61 wordmark
  - *Already shipped in `app/login/page.tsx:170–183`: "HWY61" wordmark in display font, crimson, 36px, with 4px letter-spacing. Verified June 2.*
- ✅ Friendly recoverable error states
  - *Already shipped in `app/login/page.tsx`: three layered error states (`urlError` from `?error=` param, `inviteError` for beta password, `error` for OTP/OAuth failures), each rendered with a retry path. Verified June 2. Optional copy-polish pass noted but not required.*
- 🚫 ~~PKCE migration~~ — deferred to post-launch (per source plan)

### Day 20 — Toast / error state audit
- ✅ Replace remaining `alert()` calls with toasts
  - *All 4 remaining `alert()` calls swapped to `toast.error()` June 2 (commit `98199d9`): `app/dashboard/TourTile.tsx` (delete failed), `app/pricing/page.tsx` (checkout error + network error), `app/v/e/[token]/PrintDownloadButton.tsx` (print poster failed). `ToastProvider` confirmed global in `app/layout.tsx:30` — wraps all routes, so the two public-route swaps (`/pricing`, `/v/e/[token]`) are safe.*
- 🚫 Actionable next-steps on every error state — DEFERRED to post-launch polish (June 5). Current error toasts fire and are styled; they're terse but functional. Upgrading them to include recovery steps (retry/refresh/support contact) is polish, not a launch blocker. Revisit post-launch; if done then, prioritize high-frequency errors (failed checkout, asset generation, download) over rare ones.

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
- ✅ **Artist-count tier ENFORCEMENT shipped (June 4, commits `c4f5b4c` + `0d85b31`).** Tiers previously gated nothing — Solo/Pro/Agency were sold as 1/5/12-artist plans on `/pricing` and `/` but the code allowed unlimited artists on any tier. New `lib/localizer/artistLimits.ts` is the single source of truth (`ARTIST_LIMITS = { solo: 1, pro: 5, agency: 12 }`, trial = Solo). Enforcement lives in the `createArtist` server action in `app/dashboard/page.tsx`: pre-insert count of non-blank artists (so abandoned draft rows with `name = ""` don't falsely consume the cap), compared against `artistLimitForPlan(org.localizer_plan)`, redirects to `/dashboard?error=artist_limit` on hit. Admins bypass via `isAdminEmail(user.email)`. Surfaced client-side via `app/dashboard/ArtistLimitToast.tsx` (matches `@/app/components/Toast` provider used by TourTile, fires once per limit-hit via `useRef`, strips `?error=artist_limit` from URL via `history.replaceState` so re-renders/back-nav don't re-fire). Account page also rewritten this session to read `localizer_plan`/`trial_ends_at` instead of the dead `plan` column, with trial state + `{artistsUsed}/{artistLimit}` meter replacing the stale renders-per-month meter.
- ✅ **Sign-out shipped (June 4, commit `8c11b03`).** Was MISSING ENTIRELY — code recon confirmed zero `signOut` / `logout` references anywhere in `app/` or `lib/`, meaning signed-in users had no way to end their session short of manually clearing browser cookies. Almost certainly a launch blocker we hadn't caught. Fix: new `app/auth/signout/route.ts` POST handler mirrors the auth-callback's server-client pattern — `supabaseServer()` → `supabase.auth.signOut()` (clears `sb-*` cookies via the existing `setAll` helper, so cookie-domain handling is preserved) → 303 redirect to `/login` (303 ensures the POST redirects to a GET). UI hook: plain `<form action="/auth/signout" method="POST">` ghost/outline button added as the last card in `app/account/AccountClient.tsx` — no client JS, works with JS disabled, secondary visual treatment (transparent bg, dark border) so it doesn't compete with the Stripe Portal / View Plans CTAs. Live-tested.
- ✅ **Removed April 28 middleware band-aid (June 5, commit `5b6a688`).** The April 28 band-aid was a 9-line block in `middleware.ts` that unconditionally redirected `/` → `/coming-soon` for public hosts (with `?dev=1` as the bypass) because, at the time, the env-var-gated COMING_SOON block below it was believed to not be firing in production. Diagnosed May 6 (logged in BACKLOG) as a misdiagnosis — the env gate was working all along; the original "not firing" symptom was almost certainly the admin-bypass at the gate's authenticated-user check (testing while logged into `hwy61ai@gmail.com` would have correctly let the request through, looking like the gate had failed). Removal was deferred until beta steady. Executed today: set `COMING_SOON=false` locally → `/` rendered the Localizer landing directly (no redirect); set `COMING_SOON=true` → `/` redirected to `/coming-soon` as expected. Both directions verified before committing. The band-aid block deleted in full; the `// --- Coming Soon gate ---` env-gated block is now the single point of control. **If left in place, this band-aid would have kept the homepage redirected even after flipping `COMING_SOON=false` at launch — i.e. it was a silent launch blocker we now no longer carry.**
- ✅ **Tour-wide "Download All Full Tour" shipped (June 8, commits `fd53273`, `1f812f5`, `e8d565b`).** Beta-user request — Tim wanted it pre-launch. Lets a tour manager pick one render format (IG Post, IG Story, TikTok/Reels Video, FB Cover, Square Video) and download it across every show in the tour as one zip, instead of clicking download per-show. New dashboard-authed route `app/api/tours/[tourId]/download-format/route.ts` (mirrors `overlay-config` auth pattern, paid-gate at 402), gathers the chosen `render_*_url` column across all the tour's `venue_links`, zips via the existing JSZip engine from `download-all/route.ts`, streams. Print poster excluded (separate pdf-lib path). UI in `ShareWithMarketingButton.tsx`: aspect-ratio-shaped format buttons (square IG Post, tall TikTok, wide FB Cover, etc.), JS click handler using object-URL download (so we can intercept non-OK responses and surface a specific toast), animated "Preparing" indeterminate bar for slow video zips. Toast maps: `no_rendered_assets` → "No X assets generated yet. Generate assets for your shows first."; `no_events` → "Add shows to this tour…"; `download_requires_paid` → "Downloading assets requires an active Localizer plan." Trigger button renamed "SHARE WITH MARKETING" → "SHARE & DOWNLOAD" → "SHARE & DOWNLOAD FULL TOUR" (Tim + Don approved). Tested on prod, all paths work. Deliberate scope choices: no per-format count query (the "only shows with generated assets are included" note covers it); no real % progress bar (the architecture builds the zip server-side then streams, so true % isn't possible — used an honest indeterminate "Preparing" indicator); un-rendered shows silently skipped (expected partial-count behavior).
- ✅ **Fixed SEND marking events "sent" when no promoter email (June 8, commit `b2c926f`).** Root cause: `/api/renders/approve` stamped `sent_at` and returned `ok: true` even when `event.promoter_email` was empty. The email send itself was correctly skipped by the existing `if (event.promoter_email)` guard around the Resend call — but `sent_at` was set anyway, so the UI showed "SENT" even when nothing was emailed, and the state persisted to the DB. Defense-in-depth fix: frontend guard in `EventsTable.sendEvent` short-circuits with `toast.error("Add a promoter email first.")` before any state mutation or network call; backend guard in the approve route returns 400 with `error: "no_promoter_email"` immediately after the event-not-found check, so the downstream `sent_at` stamp can never run without an email. The venue link itself is created via the separate link button, so blocking SEND for no-email events doesn't remove the manual-share path — a tour manager who wants to send the link manually still can.
- ✅ **Share / copy-link button on venue link page (June 9, commit `0b9c475`).** New client component `app/v/e/[token]/ShareLinkButton.tsx` copies the current venue URL via `navigator.clipboard.writeText`, flips label to "COPIED ✓" for 2s. Wired into `app/v/e/[token]/page.tsx` hero row stacked vertically directly below the existing "↓ DOWNLOAD ALL" button (column flex wrapper, `flexShrink: 0` lifted onto the wrapper). Mirrors the existing share pattern in `ShareWithMarketingButton.tsx`. Promoter-facing surface, so a real customer-UX improvement, not internal.
- ✅ **Venue + marketing link token entropy verified — Legal Decision Sheet item 8 closed (June 9).** Audit confirmed venue-link tokens are 256-bit and marketing-link tokens are 192-bit, both generated via cryptographically secure RNG, non-enumerable. Venue page (`app/v/e/[token]/page.tsx`) confirmed to leak no promoter emails — only date, venue name, city, and rendered assets surface to the public viewer. No code change required; this was a verification + sign-off pass.
- ✅ **DMCA agent re-registered under HWY61 LLC — Legal Decision Sheet item 7 closed (June 9).** Designation #DMCA-1073957 active with the U.S. Copyright Office under HWY61 LLC (replacing prior entity registration). `dmca@hwy61labs.com` is the registered takedown address.
- ✅ **Legal dates synced — Legal Decision Sheet item 9 closed (June 9, commit `81298be`).** `app/privacy/page.tsx` and `app/terms/page.tsx` both now show `Effective Date: [SET AT PUBLISH]` (placeholder fills on launch-day publish) and `Last Updated: June 4, 2026` directly below it. Attorney-review .docx copies updated to match. Dates now identical across live pages and attorney handoff so legal review sees what production sees.
- ✅ **Privacy Policy further scoped Localizer-only (June 9, follow-up to June 4 `ca5b976`).** Three additional cuts to `app/privacy/page.tsx`: (1) intro paragraph collapsed from "Localizer, TourRouter, and DIY at hwy61labs.com and its subdomains (localizer.hwy61labs.com, tourrouter.hwy61labs.com, diy.hwy61labs.com)" → "Localizer at hwy61labs.com"; (2) "TourRouter and DIY Data" item under Section 1 ("Information We Collect") deleted entirely (tour financial / settlement / personnel / advance / routing data references gone); (3) Mapbox removed from Section 3 service-provider list (Localizer doesn't use Mapbox — that's a TourRouter dependency). Live `/privacy`, `/terms`, and attorney .docx are now in sync.
- ✅ **Attorney legal .docx (ToS + Privacy) regenerated to match deployed pages (June 9).** Both Word docs rebuilt from the post-June-9 live page content (Localizer-only scope, current dates, no stale TourRouter/DIY/Mapbox refs) so the attorney sees exactly what production shows. Ready for handoff the moment Tim names a reviewing attorney.

---

## Active blockers

| Blocker | Owner | What unblocks it |
|---|---|---|
| Tim's 1 remaining trial-model email question | Tim | Answer to: (5) cancellation copy — confirm pre-upgrade users see no "cancel" action. (Q1 resolved May 28 by trial-gate work; Q2 cron home + Q4 idempotency resolved June 2 by the trial-nudge cron build — Vercel cron at `0 13 * * *`, idempotency via `trial_nudge_emails` log table; Q3 welcome-body wiring resolved June 4 by `0c7df71` — Localizer-only rewrite of `/api/welcome` route body + subject.) |
| Live Stripe verification end-to-end | Drew + Tim | Schedule screen-share session, run the 9-step test plan above |
| Attorney review of ToS/Privacy items 1–3 | Tim | Waiting on Tim to name an attorney contact or authorize finding a Texas SaaS attorney. Items 1–3 are governing law/arbitration, liability cap floor, multi-state privacy thresholds. Status email sent to Tim June 9. This is the longest-pole launch item. |
| Day 12 video recording | Tim | Voice/copy review of the script draft |
| Landing hero copy diff (informational) | Tim | Heads-up on `/` sub-headline rewrite shipped May 27 — no approval needed to launch |

---

## Open items parked for later

Deliberately deferred — not blocking launch, revisit on the timeline indicated.

- **Pro price review at 60 days post-launch.** Most likely change: $59 → $79 if conversion data supports it.
- **Annual conversion prompt motion for Free users at 60–90 days.** Separate from the upgrade wall — more of a "you've been with us a while" email nudge inviting annual upgrade.
- **Reconcile "unlimited artists" marketing copy against the new artist-count limits.** With Solo/Pro/Agency now hard-capped at 1/5/12 artists (enforced in `createArtist` as of June 4, commit `c4f5b4c`), any surviving "unlimited artists" copy in `app/labs/page.tsx` or `app/tourrouter/page.tsx` is now wrong. Verify scope first — `/labs` is the preserved portfolio (`noindex, nofollow`) and `/tourrouter` redirects to `/coming-soon` per the May 26 config — so this may be fully out-of-funnel and not block launch. If either page is reachable from the funnel, swap the copy to match the artist-count tiers.
- **Smoke-test artist-limit enforcement on a fresh non-admin trial org.** The full path (`createArtist` server action → non-blank count → `artistLimitForPlan(null)` returns 1 → second-artist insert redirects to `/dashboard?error=artist_limit` → `ArtistLimitToast` fires the toast once and strips the param) has only been verified by build + type check, not exercised against live Supabase + Stripe. Run on a fresh signup: create artist 1 (succeeds), attempt artist 2 (blocks + toasts), confirm toast doesn't re-fire on refresh / back-nav.

---

## Next session candidates

Ranked by priority for the next focused session:

1. **Stripe Day 3 live verification.** In-flight screen-share with Tim — run the 9-step test plan above. Trial-model commits already pushed (June 2), so Stripe is the remaining half of the original June 2 in-flight pair.
2. **Tim's 1 remaining trial-model email question (handoff + answer).** Q5 (pre-upgrade cancellation copy) — confirm pre-upgrade users see no "cancel" action. Q1, Q2, Q3, Q4 all resolved (Q3 closed June 4 by Localizer-only `/api/welcome` rewrite in `0c7df71`). FAQ positioning copy review + landing hero diff fold into the same handoff doc.
3. **Watch first trial-nudge cron run + raise advance cron with Tim.** First scheduled fire is June 3 at 9am ET (13:00 UTC). Verify in Vercel Cron Jobs logs: bearer auth passes, Resend delivery succeeds, `trial_nudge_emails` rows insert correctly, idempotency holds on a manual second invocation. Same session: raise the TourRouter advance cron — no external trigger exists (see Active blockers), so advance follow-up emails are likely not auto-firing in production.
4. **"Getting Started with Localizer" help doc (Day 6 / Day 13).** Pairs naturally with the welcome email rewrite.
