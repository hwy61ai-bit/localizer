# HWY61 — Forward Build Plan
**Date:** March 31, 2026
**From:** Tim (via Claude)
**For:** Drew
**Purpose:** This replaces the Phase 7–9 section of the build status. Merch and Agency are removed from the build entirely. They may be revisited later or not at all.

---

## Scope Change: What We're NOT Building

**Removed from the build plan effective now:**

- **HWY61 Merch** — inventory tracking, per-show sales, merch commission, merch reports. All cut.
- **HWY61 Agency** — offer pipeline, roster management, calendar, agent commissions, confirmed offer handoff, radius checking. All cut.
- **Phase 8C (Merch)** — removed
- **Phase 9 (Agency)** — removed entirely

If either product is revisited, it will be scoped and planned as a separate initiative after launch. Drew should not build toward, stub out, or allocate any time to either.

---

## What's Done (For Reference)

Phases 1–6: Complete. Localizer shipped, TourRouter stable, all core features built.

Phase 7 completed sub-phases: 7A (domain migration), 7B (Mapbox), 7D (feature flags + mobile), 7G (PostHog), 7I (beta invites).

---

## Outstanding Bug

**Post-login redirect** — TourRouter and DIY users land on `/dashboard` instead of `/dashboard/routing` after login. If this wasn't fixed during the March 31 mobile pass, fix it before anything else. It's the first thing every user sees.

---

## The Plan: Fastest Path to Beta Users

### Priority: What blocks beta?

Beta users need: a marketing site to land on, a working login with invite codes (done), a product that works end-to-end, onboarding so they're not lost, and legal pages that are current. Stripe does NOT block beta — beta is free.

### Sequence

**Week 1 — Marketing Site + Legal (7K + 7L)**

These are the front door. Nothing else matters if people can't find us or understand what we do.

1. Build hwy61labs.com landing page (Tim has mockup direction ready — warm light or lighter dark, content finalized)
2. Build /localizer product page
3. Build /tourrouter product page
4. Build /diy product page
5. Build /pricing page (all tiers, annual toggle, bundle)
6. Update Terms of Service for hwy61labs.com domain and current product names
7. Update Privacy Policy
8. Verify DMCA registration covers new domain
9. Update effective dates on all legal docs

**Week 2 — Onboarding + Notifications (7H + 7F)**

First-time user experience. A beta user who doesn't know what to do in the first 60 seconds is a lost beta user.

1. Build onboarding choice screen: guided wizard / demo tour / skip
2. Create demo tour with realistic fake data (Tim provides real tour data to base it on)
3. Build guided setup wizard (create tour → add shows → drop a document → view financials)
4. Placeholder spots for tutorial video links (Tim records these separately)
5. Build notifications table with RLS
6. Build in-app notification center (bell icon, dropdown, unread count)
7. Expand email notifications beyond advance engine (show confirmations, document processed, etc.)
8. Set up Twilio for internal escalation SMS to Tim and Drew

**Week 3 — Support + QA Prep (7J + 7M start)**

Safety net before real users touch it.

1. Build FAQ / knowledge base pages (Tim writes content, Drew builds the pages)
2. Build chat widget for hwy61labs.com (can be simple — routes to support@hwy61labs.com initially)
3. Tim begins end-to-end testing with real tour data
4. Tim tests Localizer with 20+ real schedules
5. Review all marketing site copy for accuracy
6. Verify pricing matches across marketing site, in-app billing, and Stripe (where possible)

**Week 4 — QA Sweep + Beta Launch (7M)**

1. QA agent full sweep (second machine, adversarial testing per master context Part 16)
2. Fix critical and high-priority bugs from QA + Tim's testing
3. Final copy review on all pages
4. Send beta invites to first 5 users
5. Monitor feedback daily — Tim and Drew both watching
6. Fix critical issues same-day, high issues within 48 hours
7. Expand to 10 beta users after first week if stable

---

## Parallel Track: Road App (7E)

The Road App does NOT block beta launch. It's a separate workstream that can happen alongside or after beta begins.

**When to start:** After Week 2 (onboarding + notifications), or whenever Drew has bandwidth. It's 2–3 weeks of work.

**Prerequisites before starting:**
- Register Apple Developer account ($99/yr)
- Register Google Play Developer account ($25)

**Build sequence:**
1. Scaffold Expo project
2. Token auth flow (crew_access table already exists)
3. Five core screens: Home, ShowDetail, Calendar, Travel, Settings
4. Crew-safe API routes (financial data stripped at API level — not in UI, at the route)
5. Offline caching with AsyncStorage
6. Native UI polish
7. Create test tour for App Store review
8. Build with EAS, submit to both stores
9. Iterate on review feedback

**Note:** Push notifications (originally part of 7F) should be deferred to Road App v2. Get the app in the stores first, add push later.

---

## Parallel Track: Stripe (7C)

Blocked on EIN. When it arrives, this becomes the #1 priority — it's the only thing between beta and paid users.

**When EIN arrives, immediately:**
1. Archive all old Stripe products
2. Create new products with correct pricing:
   - Localizer: Basic $39, Pro $69, Agency $139 (monthly + annual)
   - TourRouter: Solo $49, Pro $79, Agency $149 (monthly + annual)
   - DIY: $19/mo (monthly + annual)
   - HWY61 Suite Bundle: $249/mo (monthly + annual)
3. Enable 7-day free trials on all products
4. Build trial → read-only grace period → lockout flow
5. Build upgrade/downgrade with immediate access change
6. Build full data export for cancelled accounts
7. Update all billing gate checks in the codebase
8. Test the complete billing lifecycle: signup → trial → payment → upgrade → downgrade → cancel → export

---

## Decisions Already Made (March 30–31)

For reference, these decisions are already communicated to Drew:

- Domain redirect: hwy61.ai → hwy61labs.com — do it now
- AI Intake for DIY: keep it on, it's a hook
- DIY deal types: all 14, no gating
- Build priority: Drew's call on sequencing
- Post-login redirect: fix now
- EIN: applied, waiting on IRS

---

## What Tim Owns

Tim's deliverables that Drew is waiting on or will need:

1. **Marketing site copy** — final copy for landing page and product pages (mockup direction in progress with Claude)
2. **Tutorial video recordings** — linked from onboarding wizard
3. **FAQ content** — questions and answers for knowledge base
4. **Demo tour data** — real tour data (anonymized if needed) for the demo tour in onboarding
5. **Real tour data for QA** — at least 3 complete tours for end-to-end testing
6. **Beta user list** — who gets the first 5–10 invite codes
7. **Legal review** — sign off on updated ToS and Privacy Policy

---

## Timeline Summary

| Week | Focus | Outcome |
|------|-------|---------|
| 1 | Marketing site + Legal | Front door exists, legal current |
| 2 | Onboarding + Notifications | First-time experience works |
| 3 | Support + QA begins | Safety net in place, Tim testing |
| 4 | QA sweep + Beta launch | First beta users in the product |
| 5+ | Road App + Stripe (when EIN arrives) | Mobile app + paid users |

**Target: Beta users in the product within 4 weeks.**

---

*This plan supersedes the Phase 7–9 section of HWY61_BUILD_STATUS_March_31_2026.md. Merch and Agency are not part of the HWY61 build.*
