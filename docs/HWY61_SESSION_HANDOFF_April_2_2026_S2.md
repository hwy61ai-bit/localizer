# HWY61 — Session Handoff
**Date:** April 2, 2026 (Session 2)
**Who you're talking to:** Tim (product/founder)
**Developer:** Drew (builds via Claude Code)
**What this is:** Everything you need to know to pick up exactly where we left off.

---

## What HWY61 Is

HWY61 is the first complete operating system for the touring music industry. One platform for routing, advancing, settlement, finance, guest lists, personnel pay, document management, and tour marketing. Target market: sub-5,000 cap venues, club through theater level.

**Stack:** Next.js 14 + TypeScript, Supabase, Vercel, Cloudinary, Resend, Anthropic API, Stripe, React Native (Road App)

---

## Current Product Lineup (v1)

| Product | Price | Status |
|---------|-------|--------|
| **TourRouter** | $49–$149/mo (Solo/Pro/Agency) | Core product, partially built |
| **Localizer** | $39–$139/mo (Basic/Pro/Agency) | Built, needs design system pass |
| **DIY** | $19/mo | TourRouter with feature flags |
| **Road App** | Free | Not started |
| **Full Suite Bundle** | $249/mo | TourRouter + Localizer + DIY + Road App |

**Cut from v1:** HWY61 Agency (booking agent OS) and HWY61 Merch — removed entirely, not deferred.

**Annual billing:** 20% discount across all plans.

---

## What We Produced This Session (April 2, Session 2)

| Deliverable | File | Status |
|-------------|------|--------|
| FAQ content (final) | `HWY61_FAQ_CONTENT_FINAL.md` | ✅ Done — Tim approved, ready for Drew |
| FAQ review PDF | `HWY61_FAQ_CONTENT_REVIEW.pdf` | ✅ Done — formatted PDF of all 34 Q&As |
| Product page copy (final) | `HWY61_PRODUCT_PAGE_COPY_FINAL.md` | ✅ Done — Tim approved, 4 pages, ready for Drew |
| Product page copy PDF | `HWY61_PRODUCT_PAGE_COPY.pdf` | ✅ Done — formatted PDF for review |
| TourRouter product page | `HWY61_TourRouter.html` | ✅ Done — full Warhol design system |
| Localizer product page | `HWY61_Localizer.html` | ✅ Done — full Warhol design system |
| DIY product page | `HWY61_DIY.html` | ✅ Done — full Warhol design system |
| Road App product page | `HWY61_RoadApp.html` | ✅ Done — full Warhol design system |
| Landing page (restyled) | `HWY61_LANDING_PAGE.html` | ✅ Done — matches product pages now |
| Logo SVG (black bg) | `HWY61_LOGO_4800x2000.svg` | ✅ Done — Bebas Neue, 4800×2000 |
| Logo SVG (transparent) | `HWY61_LOGO_TRANSPARENT.svg` | ✅ Done — no background |
| Logo PNG | `HWY61_LOGO_4800x2000.png` | ✅ Done — high-res raster fallback |

---

## What Changed on the Landing Page

The landing page (`HWY61_WARHOL_CUSTOM_PALETTE.html`) was restyled to match the product pages. Key changes:

- **Removed:** Pop border (crimson + blue frame), frosted glass nav, Warhol color blocks hero background
- **Added:** Dark sticky nav bar, section dividers (3px solid black), hero eyebrow badge, dark background on problem section, consistent section-tag/headline/sub-headline patterns, matching footer
- **Kept intact:** Drop zone animation (all 5 document types), pricing toggle (monthly/yearly), phone mockup, audience cards, bundle section, reveal-on-scroll animations, all copy unchanged
- **File:** `HWY61_LANDING_PAGE.html` replaces `HWY61_WARHOL_CUSTOM_PALETTE.html`

---

## Product Page Structure (All 4 Pages)

Every product page follows the same section pattern:

**Hero** → **Problem** (dark bg) → **Solution** → **Features** (cards with numbered accent bars) → **Use Cases** (cards with color-coded left borders) → **Testimonials** (placeholder) → **Pricing** → **Final CTA** (dark bg)

Design system applied consistently:
- Dark sticky nav with HWY61 logo, product links, and CTA button
- Section dividers (3px solid black `<hr>`)
- Section tags: steel blue, Space Mono 11px, 4px letter-spacing, uppercase
- Cream background (#F5F0E8), white cards, dark sections for problem/CTA
- Zero border-radius everywhere
- 3px black borders on cards
- Flat offset shadows (no blur)
- Halftone dot overlay
- Mobile responsive

**Navigation order:** Home → TourRouter → Localizer → DIY → Road App → Pricing → Get Early Access

---

## Phase Status

| Phase | Status |
|---|---|
| 7A Domain migration | ✅ Done |
| 7B Mapbox integration | ✅ Done |
| 7C Stripe restructure | 🚫 Blocked on EIN (next week) |
| 7D Feature flags + mobile | ✅ Done |
| 7E Road App | 🔲 Not started |
| 7F Notifications | ✅ Core done |
| 7G PostHog analytics | ✅ Done |
| 7H Onboarding wizard | 🟡 Shell built — spec ready, needs building |
| 7I Beta invites | ✅ Done |
| 7J Support / FAQ | ✅ Content finalized |
| 7K Marketing site | ✅ Landing page + all 4 product pages done |
| 7L Legal updates | ✅ Tim signed off — lawyer review before launch |
| 7M Final QA + beta launch | 🔲 Blocked on EIN + beta user list |

---

## What's Next (Priority Order)

**Drew's next moves:**
1. Build onboarding wizard steps (spec is ready)
2. Seed demo tour data (data is ready)
3. Start design system rollout (Phase 1: foundation + components)
4. Apply design system to core layout (Phase 2)
5. Continue through TourRouter pages (Phase 3)
6. Integrate product page HTML into the Next.js site when ready

**Tim's remaining to-do:**
1. **Beta user list** — names/emails for the 10 invite codes
2. **EIN** — coming next week, blocks Stripe and therefore billing and therefore launch
3. **Tutorial videos** — scripts are written, blocked on live site to record against
4. **Lawyer review** — ToS and Privacy Policy to lawyer before launch

---

## Important Rules

1. **No "AI" in user-facing copy or marketing.** Internally: Anthropic API, AI parsing. Externally: "HWY61 reads it." Never say AI to users.
2. **`calcTourFinancials()` is the single source of truth for all financial calculations.** No inline math. Ever.
3. **Staged preview always.** No import or document intake writes directly to database without user review.
4. **RLS on every table.** Missing RLS = empty results with no error = silent data leak.
5. **Financial fields never reach crew.** Excluded at the API route level, not hidden in UI.
6. **Zero border-radius.** The design system is strict about this. No exceptions.

---

## Key Files Tim Has

- `HWY61_MASTER_CONTEXT_FOR_DREW_v4_March_25__2026.md` — full build context (still current for backend/schema)
- `HWY61_DREW_BUILD_PACKAGE_april_1__2026.md` — design system + specs from April 1 session
- `HWY61_FAQ_CONTENT_FINAL.md` — finalized FAQ, 34 Q&As
- `HWY61_PRODUCT_PAGE_COPY_FINAL.md` — finalized copy for all 4 product pages
- `HWY61_LANDING_PAGE.html` — restyled landing page (replaces Warhol Custom Palette version)
- `HWY61_TourRouter.html` — TourRouter product page
- `HWY61_Localizer.html` — Localizer product page
- `HWY61_DIY.html` — DIY product page
- `HWY61_RoadApp.html` — Road App product page
- `HWY61_LOGO_4800x2000.svg` — logo SVG (black bg)
- `HWY61_LOGO_TRANSPARENT.svg` — logo SVG (no bg)
- All spec files from previous sessions still current

---

*This document is current as of April 2, 2026 (Session 2). Paste it at the start of any new conversation to pick up where we left off.*
