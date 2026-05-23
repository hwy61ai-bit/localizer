# Localizer Launch Briefing for Tim

*Last updated May 23, 2026*

**TL;DR**

- We're inside Week 1 of the 30-day Localizer launch sprint. The Localizer-side onboarding flow, master artist page gating, dashboard redirects, and a rewritten product landing page are all shipped — significantly ahead on the design side, intentionally behind on Stripe.
- Stripe Day 1 (product/price creation) is parked on your final pricing call. The Day 3 customer-migration step is now moot — every Stripe product we'd built so far was in sandbox, so live mode starts clean.
- Onboarding flow pivoted from a 5-step wizard to a single welcome page after testing the wizard against the actual product (Localizer is batch-tour, not single-show). Cleaner, faster, and the welcome page is in place now.
- Root site direction landed on Localizer-first. The `/localizer` page is rewritten and trimmed; other product pages stay parked until post-launch.

---

## What's blocked on you

**1. Pricing decision (highest priority)**
The 30-day plan landed on Solo $29 / Pro $59 / Agency $129 (monthly), but you flagged you wanted to reconsider before we created the Stripe products. Until that's locked, Stripe Day 1 (archive legacy SKUs, create six new price IDs, capture into `LOCALIZER_PRICE_MAP`) can't ship. Day 2 (webhook + env-var rotation) is downstream of Day 1. The landing page currently shows `$XX/mo` placeholders for all three tiers. Decision unblocks roughly two days of work.

**2. Onboarding video script — first-pass review**
`docs/LOCALIZER_ONBOARDING_VIDEO_SCRIPT.md` is drafted (~2:30 narration, tour-manager-to-tour-manager voice). Needs your voice/copy pass before we record. Recording itself is a solo task on my side once the script is approved — the unblock here is ~20 minutes of your time reading it through.

**3. Welcome email copy — review pass (incoming)**
I'm drafting this next. The 30-day plan calls for a Resend transactional welcome email triggered on first sign-in (welcome paragraph, three "what to do next" steps, link to help docs, your direct email). I'll write a first pass in your voice and put it in front of you for review/edits before it ships.

---

## Where we are vs the original 30-day plan

| Day | Item | Status |
|---|---|---|
| 1 | Archive legacy Stripe SKUs + create 6 new Localizer price IDs | **Parked** — awaiting your pricing call |
| 2 | Stripe webhook + env-var rotation for new price IDs | Blocked on Day 1 |
| 3 | Existing customer pricing migration | **Moot** — all prior Stripe products were sandbox; live mode is a clean slate |
| 4–5 | Onboarding flow build | **Shipped** — as a welcome page, not a 5-step wizard (see below) |
| 6 | Welcome email + getting-started doc | Not started — drafting welcome email next |
| 7 | Customer support workflow defined | Not started — needs your input on canned responses |

Stripe business setup (bank account, EIN verification doc, billing email update to `billing@hwy61labs.com`) was completed May 21 in parallel. Your CP 575 form for EIN verification is parked but doesn't matter until we're creating live products.

---

## What's been built since the plan was written

**Localizer onboarding flow.** Originally specced as a 5-step wizard (welcome → artist → show → generate asset → share link). I built it end-to-end, then we tested it and the flow was contrived — Localizer is a batch-tour tool, not a single-show tool, so walking a new user through one show didn't match how anyone actually uses the product. Pivoted to a simple welcome page: one screen, optional video, "GET STARTED" button that drops the user into `/dashboard/artists`. 80 lines instead of 530. All the underlying infrastructure (schema, API, eligibility gates) was preserved through the pivot.

**Master Artist page gating.** The Master Artist page has seven TourRouter-specific sections (Roster, Lodging, Vehicles, Hospitality, Promo & Marketing, Business Entity, Technical Production). For Localizer-only users these were showing up empty and confusing. The page now checks the org's plan status on load and hides those sections (plus their visual divider) for users without TourRouter or bundle access. Localizer-only users see header, bio, team, and advance materials — that's it.

**Dashboard direct-access redirect.** Users coming in from a Stripe checkout success URL, a bookmark, or an email link were landing at `/dashboard` directly and bypassing the welcome page entirely. Now `/dashboard` checks whether the user is Localizer-eligible and hasn't completed onboarding; if so, they get bounced to the welcome page before anything else loads.

**Landing page rewrite.** The product page at `/localizer` was 376 lines / 8 sections including a 6-feature grid, persona cards, and placeholder testimonials. Cut to 6 sections — hero, problem, solution, pricing, final CTA, footer. The 30-day plan called for a denser page with more proof points, but we made the strategic call to ship a tighter v1 and add proof material after we have real beta-user feedback to quote. Pricing tiers swapped to Solo / Pro / Agency naming with placeholder dollar amounts.

**LOCALIZER wordmark treatment.** Added a large Bebas Neue "LOCALIZER" wordmark above the hero headline with a black-bordered box on warm background. The crimson text-shadow and box-shadow track the user's cursor as if the cursor is a light source — the shadow swings smoothly on a 0.45s easing curve. Small detail but it gives the hero a distinct identity.

**Stripe business setup (partial).** Connected HWY61 Labs LLC bank account in live mode via Plaid. Uploaded EIN verification document. Updated public support email to `billing@hwy61labs.com` (kept account alerts on my address). Product creation itself is the Day 1 work that's parked on your pricing decision.

**Onboarding video script (first pass).** Drafted at `docs/LOCALIZER_ONBOARDING_VIDEO_SCRIPT.md`. ~2:30 narration, scene markers from hook through to the venue-link share moment. Tour-manager-to-tour-manager voice. Awaiting your review pass before recording.

---

## Strategic decisions I made without you (push back if any feel wrong)

- **Welcome page, not 5-step wizard.** Wizard didn't match how anyone uses Localizer in practice. Single welcome screen with optional video is what's live.
- **Root domain becomes Localizer-first.** Other product pages (TourRouter, DIY, Road App) stay parked. The `/localizer` page is the new public-facing entry point for the product.
- **Six-section landing page, not eight.** Cut Features grid, Personas, and Testimonials. Will add proof material back post-launch once we have real beta users to quote.
- **Pricing tier names locked: Solo / Pro / Agency at 1 / up to 5 / up to 12 artists.** Names and artist counts confirmed; dollar amounts pending your call.
- **All primary CTAs say "Start your free trial."** Consistent across hero, pricing tiers, and final CTA. No more "Get Early Access" / "Start Free During Beta" mixed phrasing.
- **Hero "Tour Marketing" eyebrow tag dropped.** Was redundant once the LOCALIZER wordmark went in directly above the headline.
- **Wordmark cursor-light effect.** Subtle but distinctive. Approved across three iterations.

---

## Still on the docket

**Drew-owned (unblocked, working through):**
- Welcome email draft (Day 6) — drafting next, will share for review
- Onboarding video recording — solo task once you sign off on the script
- Help docs / FAQ first pass (Day 13–14) — can start in parallel with the email
- Customer support workflow setup (Day 7) — `support@hwy61labs.com` forwarding, Linear or Notion tracking board

**Tim-owned (your input needed):**
- Final pricing for Solo / Pro / Agency tiers
- Onboarding video script review
- Welcome email review (incoming after I draft)
- Five canned customer-support responses (pricing, billing, "how do I do X", refund requests, "is my data safe") — Day 7 deliverable

**Carry-over from the prior backlog (lower priority):**
- Onboarding wizard per-user vs per-org state mismatch — when a new user joins an existing onboarded org they skip the wizard. Pre-launch gate; needs your call on which of three fixes to take.
- Stale "My Workspace" test orgs in the orgs table — cleanup before public launch.
- Re-enable Supabase email signups and run a full new-user smoke test before flipping `COMING_SOON=false`.

---

## Promoter Edition status

Parked until launch is done. The Localizer 2.0 venue-side concept (promoters and venues using Localizer from their side with their branding) is intentionally out of scope for the 30-day sprint. The brainstorm doc you have is still the source of truth on the direction. The May 20 read-receipts feature concept (artist-side asset delivery with engagement tracking) is logged in the backlog under future ideas — it captures most of the value of the venue-side feature without requiring a second user base, so it's a strong post-launch candidate.

The Jack due-diligence call is not yet scheduled. Worth circling back on post-launch if the conversation is still alive.

---

Questions or pushback — text me or drop in next session.
