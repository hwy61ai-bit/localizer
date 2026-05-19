# Localizer — 30-Day Public Launch Plan

**Date:** May 19, 2026
**Target launch date:** June 19, 2026
**Owner:** Drew (build + design) | Tim (outreach + customer conversations + onboarding narrative)
**Scope discipline:** This plan is a contract with yourself. If a feature isn't on it, it's Phase 2. Resist additions.

---

## Pre-Day-1 prerequisites

Before Day 1 kicks off, two things must be locked:

1. **Bank account closed and Stripe business setup complete** (in flight, May 19 target).
2. **Conversation with Tim concluded** with:
   - Agreement on 30-day timebox
   - Tim's commitment to deliver Localizer-only onboarding narrative within 5 days
   - Tim's commitment on weekly outreach volume
   - Agreement that four-product decisions defer 60 days post-launch

If either of these isn't true on Day 1, the clock doesn't start yet.

---

## Week 1 (Days 1–7) — Foundation + Tim unblocks

The goal this week is to get the billing infrastructure modernized and unblock the onboarding wizard work.

### Day 1 — Stripe restructure kickoff

- Archive legacy Stripe products (TourRouter Standalone $29, Add-on $20, Add-on Agency $30, old Localizer Basic $39).
- Create three new Localizer products at correct pricing:
  - **Solo:** $29/mo, $290/yr (1 artist)
  - **Pro:** $59/mo, $590/yr (up to 5 artists)
  - **Agency:** $129/mo, $1,290/yr (up to 12 artists)
- Capture all six `price_xxx` IDs into a `LOCALIZER_PRICE_MAP` constant.
- 7-day free trial enabled on all three.

### Day 2 — Stripe webhook update + price ID rotation

- Update `app/api/stripe/webhook/route.ts` to handle new price IDs (lightweight version — not the full 30-SKU restructure, just Localizer-relevant).
- Update env vars in Vercel.
- Test sandbox subscription through each tier.

### Day 3 — Existing customer pricing migration

- Identify existing Localizer customers via Stripe dashboard.
- Migrate each to corresponding new lower-priced subscription (Stripe handles proration).
- Send friendly notification email via Resend: "We're lowering Localizer prices. Your subscription has been automatically adjusted. Pay less, same features."
- Verify each customer's `localizer_plan_status` still reads `active` post-migration.

### Day 4–5 — Onboarding wizard build (assumes Tim delivered narrative by Day 3)

- Build the Localizer-only onboarding flow using Tim's narrative. Steps:
  1. Magic link sign-in
  2. "Welcome to Localizer" intro screen
  3. Add your first artist (name + logo upload + brand colors)
  4. Add your first show (date + venue + city)
  5. Generate your first asset (one-click using a default template)
  6. "Here's your venue link. Share it." moment
- Use existing `HwCard`/`HwInput`/`HwButton` components.
- The whole flow should take a new user < 4 minutes from magic link to first asset.

### Day 6 — Welcome email + getting-started doc

- Welcome email triggered on first sign-in (via Resend transactional). Includes:
  - 1 paragraph welcome from Tim (use his actual voice)
  - 3 bullet "what to do next" steps
  - Link to help docs
  - Tim's email for direct support
- Single help doc: "Getting Started with Localizer" — covers the wizard flow, what venue links are, how to share them.

### Day 7 — Customer support workflow defined

- `support@hwy61labs.com` already forwards to your inbox. Add Tim to the forward.
- Decide: Tim primarily replies to customer questions. You handle bug-fix escalations.
- Set up a shared Notion page or Linear board for tracking customer issues.
- Tim drafts canned responses for the 5 most likely customer questions (pricing, billing, "how do I do X," refund requests, "is my data safe").
- Smoke-test the support address: send a test email, confirm forwarding works.

**End of Week 1 checkpoint:** New pricing live, onboarding wizard shipped, existing customers migrated, support workflow ready.

---

## Week 2 (Days 8–14) — Design + marketing site

This is the heaviest design week. The goal is a public-facing Localizer that looks polished and converts.

### Day 8–9 — Landing page redesign (`hwy61labs.com/`)

The current site is behind COMING_SOON. New version focused on Localizer:

**Above the fold:**
- Hero headline: Tim's clearest one-liner. Working version: "Tour marketing assets in 10 minutes, not 10 hours."
- 90-second demo video or animated GIF showing the workflow (record this Day 12)
- Primary CTA: "Start free trial" → magic link → wizard
- Secondary CTA: "See how it works" → scrolls to demo section

**Below the fold (in order):**
- 3-step "How it works": Drop schedule → AI parses → Generate all formats
- Feature grid (4-6 features with icons): AI parser, multi-format rendering, venue links, custom branding, sponsor logos, print PDF
- "Built by working music industry people" callout with Tim's bio + photo
- Pricing tier comparison (Solo / Pro / Agency)
- Final CTA + footer

### Day 10 — Pricing page (`hwy61labs.com/pricing`)

- Three-tier comparison table
- Monthly/Annual toggle (annual = 2 months free)
- Highlight Pro as "most popular"
- Single "Start free trial" CTA per tier (no separate "Contact sales")
- FAQ section addressing common pricing questions

### Day 11 — Empty states + first-asset moment

**Empty states** (the surfaces a new user hits before they have data):
- Dashboard with zero artists: illustration + "Add your first artist" CTA (links to wizard)
- Artist page with zero tours: "Import your first tour" CTA with sub-text "Drop any schedule, we'll parse it"
- Tour page with zero shows: "Add shows manually or drop a routing PDF"
- Template editor with no assets: clearer "Upload a template image to get started"

**First-asset moment** (the magic moment):
- When the wizard generates the first asset, show a celebratory state — confetti animation or a clear success screen
- Big "Copy your venue link" button — make this prominent
- Three buttons: "Share to social," "Copy link," "Send to venue" (the last opens a mailto: pre-populated)
- This moment is the most important UX in the whole product. Treat it accordingly.

### Day 12 — Demo video / GIF

- Record screen: Tim or Drew walking through the workflow (drop schedule → parse → generate → venue link).
- Length: 60–90 seconds.
- No music, no fancy editing — just clean voiceover (Tim does this).
- Export as MP4 + an animated GIF version (smaller, autoplay on landing page).
- Self-host or use a lightweight provider. Don't embed YouTube — branded experience matters.

### Day 13–14 — Help docs / FAQ

5-7 articles, ~200 words each. Tim writes for voice; Drew builds the pages.

1. "Getting Started with Localizer" (already drafted Day 6)
2. "How to upload templates and customize branding"
3. "Understanding venue links — how to share with promoters"
4. "Custom fonts and how to upload them"
5. "Sponsor logos — what works and what doesn't"
6. "Pricing, billing, and your subscription"
7. "Troubleshooting common issues"

Single page or simple nav. Don't over-engineer the docs structure — these are at `hwy61labs.com/help`.

**End of Week 2 checkpoint:** Marketing site polished, demo video shot, help docs drafted, design moments improved.

---

## Week 3 (Days 15–21) — Polish + viral wedge + mobile

The goal this week is to fix the rough edges that lose customers.

### Day 15 — Venue link viewer page redesign

This is the most-seen public surface (every promoter who receives a venue link). Currently functional but could convert more:

**Design improvements:**
- Cleaner asset grid with format labels ("Instagram Post — 1080×1080" style)
- Hover state showing download options (PNG, JPG)
- **New: Prominent "Made yours at localizer.hwy61labs.com" CTA at the bottom** — this is the viral wedge. Visible, not annoying.
- **New: "Forward to your artist" button** — copies a shareable URL and includes a templated message. Promoter sends to artist who's not on Localizer yet. Direct lead generation.
- Mobile responsive — many promoters will open these on phones

### Day 16 — Mobile responsiveness pass

Run through every customer-facing screen on a real mobile device (or Chrome dev tools):

- Landing page
- Pricing
- Login / magic link
- Onboarding wizard
- Dashboard / artist page / tour page
- Template editor (this one is hardest — accept that desktop is primary)
- Venue link viewer (most important to nail — promoters use phones)
- Account/billing
- Help pages

Fix anything that breaks. Don't try to make the template editor perfect on mobile — most users won't edit on mobile anyway. Add a "Open on desktop for best experience" banner if needed.

### Day 17 — Account/billing page polish

Currently functional. Improvements:
- Show current plan + usage clearly
- "Upgrade" CTA visible
- Annual/monthly toggle on upgrade
- Stripe Customer Portal link for "Manage billing"
- Clean cancellation flow (don't make people fight to cancel — earns goodwill)

### Day 18 — Print PDF / generation wait states

- Print PDF takes ~24s. Already has progress bar + elapsed-time counter. Add one improvement: a small "Why this takes a moment" explainer tooltip — sets expectations.
- Generation progress: when generating all formats, show a list of formats being processed with checkmarks as each completes.

### Day 19 — Auth flow polish

- Magic link page: branded with HWY61 wordmark, clear "We just emailed you a link" copy
- The error states (expired link, wrong email, etc.) — make sure these are friendly and recoverable
- Verify PKCE migration is in good shape (currently still on deprecated `flowType: "implicit"` per backlog) — actually defer this one. Not a launch blocker. Phase 2.

### Day 20 — Toast / error state audit

- Run through the app finding any remaining `alert()` calls — replace with toast notifications
- Make sure error states have actionable next steps ("Try again" buttons, etc.)

### Day 21 — Press kit + social assets

- `hwy61labs.com/press` or downloadable PDF:
  - 1-page product description
  - 4-6 product screenshots
  - Logo files (light + dark)
  - Tim + Drew bios + photos
  - 3 pre-written quotes from Tim
  - Contact info (`press@hwy61labs.com`)
- Social media announcement graphics (IG post + IG story format) — created using Localizer itself for meta points
- Set up `@hwy61labs` accounts on Instagram, X, TikTok if not done

**End of Week 3 checkpoint:** All design polish done, viral wedge in venue link viewer live, press kit ready.

---

## Week 4 (Days 22–30) — QA + launch

### Day 22–23 — Full QA sweep

- Run QA agent on Mac mini against production site (use the existing `docs/QA_RUNBOOK.md` pattern)
- Manual end-to-end test from clean browser:
  1. Land on `hwy61labs.com`
  2. Click "Start free trial"
  3. Enter email, get magic link
  4. Click magic link
  5. Complete onboarding wizard
  6. Generate first asset
  7. View venue link
  8. Go to account page
  9. Upgrade to paid tier
  10. Cancel subscription (verify graceful)
- Test on Safari, Chrome, Firefox, mobile Safari, mobile Chrome
- Have one non-tester (friend, family) attempt signup unsupervised. Watch silently. Note every hesitation.

### Day 24–25 — Bug fix sprint

- Triage QA findings: CRITICAL/HIGH only. Everything else goes to BACKLOG.
- Fix CRITICAL/HIGH bugs.
- Re-test the failure paths.

### Day 26 — Tim's outreach plan locked

Tim should have by end of today:
- Spreadsheet of 30–50 names with contact methods
- Suggested pitch angle for each (band manager → "your roster's tours," booking agent → "every show your agency books")
- Calendar blocked for outreach starting Day 31
- Demo call template ready (Tim's screen + product demo)

### Day 27 — Day-0 launch plan written

Document covers:
- Exact sequence on launch day (what gets pushed when)
- Social media posts ready (drafts approved by Tim)
- Press email drafts (3 outlets max — Pollstar, MBW, Hypebot)
- Tim's first 5 outreach emails personalized and ready to send
- Status page / status check procedure if things break
- Rollback plan if something catastrophic happens (re-enable COMING_SOON gate)

### Day 28 — Final smoke test + buffer

- Remove `COMING_SOON=true` from `.env.local` (don't push yet)
- Verify everything works on local with gate off
- Last-pass review of all marketing copy
- Final permissions check on Stripe webhook, Resend, Cloudinary, Mapbox, Anthropic API
- Verify PostHog events firing across the full funnel
- This is a buffer day — use it for anything that slipped from earlier in the week

### Day 29 — Coming Soon gate removed in production

- Remove `COMING_SOON=true` from Vercel environment variables
- Redeploy
- Verify production site loads the new landing page
- Verify signup flow end-to-end on production
- Soft soak: friends, family, beta testers (Kurt + Tim) test on production
- Fix anything that breaks immediately

### Day 30 — PUBLIC LAUNCH

- Tim sends first 5 personalized outreach emails
- Social media posts go out
- Press emails sent to Pollstar, MBW, Hypebot
- Monitor PostHog all day for funnel issues
- Bug triage rapid-response: any CRITICAL bug gets a hotfix same day
- End of day: send first day numbers to Tim. How many signups? How many activated (generated first asset)? How many subscribed?

---

## Design improvements explicitly called out

Pulling these out of the day-by-day so you can see them at a glance:

| # | Improvement | Day | Impact |
|---|---|---|---|
| 1 | Landing page hero + demo video above fold | 8–9, 12 | Conversion |
| 2 | Pricing page with clear tier comparison | 10 | Conversion |
| 3 | Empty states across all surfaces | 11 | Activation |
| 4 | First-asset moment celebration + share buttons | 11 | Activation, viral |
| 5 | Venue link viewer "Made yours here" CTA | 15 | **Viral wedge — highest leverage** |
| 6 | Venue link viewer "Forward to your artist" share | 15 | Viral wedge |
| 7 | Mobile responsiveness pass | 16 | Reach |
| 8 | Account/billing page polish | 17 | Retention |
| 9 | Generation progress states | 18 | Trust |
| 10 | Auth flow branding | 19 | Trust |
| 11 | Toast/error state audit | 20 | Trust |
| 12 | Press kit visual design | 21 | Distribution |

The viral wedge changes on Day 15 are probably the single highest-ROI design intervention in the whole plan. Don't skimp on them.

---

## What is NOT in scope (defensive list)

These will tempt you. Resist:

- Four-product onboarding chooser (deferred 60 days)
- Plan / Books / Road App product surfaces
- Tour-level Download All page (replaced by marketing tokens already)
- PKCE migration (backlog, not launch-blocking)
- Auto-Advancing audit (can run in parallel but not blocking launch)
- Remaining expense tabs in TourRouter
- Tour Manager UI addition (unblocked but defer)
- Send to All Promoters bulk button (Tim hasn't greenlit yet)
- Stripe restructure for non-Localizer products (defer to Phase 1A proper, post-launch)
- In-app chatbot
- Help docs beyond the 7 listed
- Annual contract option (already deferred to Q2 2027 in BACKLOG)
- Anything that surfaces in Kurt's batch 3 if it appears
- Anything Tim adds to the scope mid-stream that doesn't fit in the existing plan

---

## Daily ritual

- 8am: Check PostHog overnight funnel (after launch)
- 8:15am: Open this doc, see what's on for today
- 8:30am: Start the day's work in Claude Code
- End of day: Update `docs/SESSION_LOG.md` with what shipped and what didn't (per the standing end-of-session reminder)
- Friday EOD: Quick check-in with Tim — what shipped this week, what's on for next week, any roadblocks

---

## Failure modes to watch for

1. **Tim delivers narrative late.** Day 3 hard deadline. If he hasn't by Day 5, escalate hard. Onboarding wizard build slips otherwise.
2. **Stripe migration glitches.** Test in sandbox extensively before touching production customers.
3. **QA finds a CRITICAL bug late in Week 4.** Day 28 buffer is for this. Don't let it leak into Day 30.
4. **Bank account doesn't close on schedule.** Stripe restructure stalls. Need a backup plan: launch at current $39/$69/$139 pricing if necessary, migrate later.
5. **Scope creep.** Every day, ask: "Is this on the plan?" If not, BACKLOG it.

---

## Launch-day success metrics (what you measure on Day 30)

These are the numbers to track. Decide success/failure based on these, not feelings.

- **Site visits:** From all sources (direct, Tim's outreach, press)
- **Signups:** Magic link → completed wizard
- **Activations:** Completed wizard → generated first asset
- **Subscriptions:** Activations → paid tier within 7-day trial
- **Drop-off points:** Where in the funnel do people leave?

Set baselines now. Day-1 targets: 100 visits, 20 signups, 15 activations, 0 subs (trial just started). Day-30 targets: 1000 visits, 100 signups, 80 activations, 30 trials, 15 paid.

If you're at 10% of these targets, the launch is working. If you're at 1%, the marketing site or the distribution channel isn't working — not the product. If signups are high but activations are low, the onboarding wizard isn't working.

---

*Drafted by Drew, May 19, 2026. This document is the contract. Don't break it without a damn good reason.*
