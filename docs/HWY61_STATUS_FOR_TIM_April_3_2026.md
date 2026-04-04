# HWY61 — Build Status for Tim
**Date:** April 3, 2026
**From:** Drew
**Covers:** All changes since March 28, 2026

---

## Summary

Two major sessions (April 2 and April 3) completed the Warhol design system rollout across the entire app, rebuilt the landing page from your v3 HTML, built all 4 product pages, built the FAQ/Support page, built the 5-step onboarding wizard, redesigned the Master Artist Profile header, and fixed a stack of bugs across TourRouter import, export, and financials.

---

## Design System — COMPLETE

The Warhol design system is now live across every page in the app. Six phases of work:

- **Phase 1:** Foundation — globals.css, CSS custom properties, 29 reusable Hw* components (HwButton, HwCard, HwTabs, HwTable, HwDropZone, etc.) with barrel export
- **Phase 2:** Dashboard — artist tiles, notification bell, onboarding wizard choice screen, artist hub tabs, tour tiles
- **Phase 3:** All TourRouter pages — routing table, roster panel, settlement panel, vehicle manager, intake drop zone, import, financials, export, public advance form
- **Phase 4:** All Localizer pages — gigs/events, template editor sidebar, import assets, import schedule, artist detail, venue share page
- **Phase 5:** Supporting pages — artist profile, settings/billing
- **Phase 6:** Global audit — 22 files cleaned, zero legacy styles remaining

**Design rules (locked in):**
- border-radius: 0 everywhere (except radio buttons)
- Fonts: Bebas Neue (headlines), Space Mono (labels/metadata), DM Sans (body)
- Primary color: crimson #c5535b
- Cards: white bg, 3px black borders, flat offset shadow on hover
- No blur shadows — flat offset only

---

## Landing Page — REBUILT

Rebuilt from your v3 HTML (docs/HWY61_LANDING_PAGE_v3.html):
- Dark nav bar with product links
- Full pricing section with monthly/yearly toggle
- Drop zone demo animation
- Product blocks for TourRouter, Localizer, DIY
- Audience cards, phone mockup, bundle card
- HWY61 LABS wordmark in hero (crimson "6" and "1")
- Smooth scroll nav links
- Color-coded "LEARN MORE" buttons linking to each product page (crimson for TourRouter, blue for Localizer, purple for DIY)

---

## Product Pages — BUILT (4 pages)

Converted your HTML files to Next.js pages. All copy preserved verbatim, all Warhol styling intact:

| Page | Route | Source |
|---|---|---|
| TourRouter | /tourrouter | HWY61_TourRouter.html |
| Localizer | /localizer | HWY61_Localizer.html |
| DIY | /diy | HWY61_DIY.html |
| Road App | /roadapp | HWY61_RoadApp.html |

Each page has: hero, problem section, solution section, feature cards, use cases, testimonial placeholders, pricing, bundle bar, final CTA, footer. Shared nav bar across all pages with active state on current product.

**Note:** No "Band" product naming found — all pages already use "TourRouter." The Band rename is dead.

---

## FAQ / Support Page — BUILT

- Route: /dashboard/support
- All 34 Q&As from your finalized content (docs/HWY61_FAQ_CONTENT_FINAL.md)
- 4 collapsible sections: Getting Started, Billing & Plans, Features, Troubleshooting
- Accordion layout — one Q&A open at a time per section
- Accessible from every dashboard page via a "SUPPORT" link in the header next to the notification bell

---

## Onboarding Wizard — BUILT (5 steps)

- Route: /dashboard/onboarding
- Triggered when new user clicks "Get Started" on the choice screen

**Step 1 — Create Your First Artist:** Name + optional logo upload
**Step 2 — Add Your Team:** Repeatable roster rows (name, role, day rate, off-day rate). Skip allowed.
**Step 3 — Create Your Tour:** Tour name, start/end dates, vehicle type. Auto-copies roster.
**Step 4 — Add Your Shows:** Two paths side by side — manual entry (date, city, venue, offer) OR drop a route sheet. Document parsing via AI with preview table and checkboxes. Both paths work simultaneously.
**Step 5 — Done:** Summary card showing everything created, with links to tour, import, vehicle settings, and artist profile.

**Note:** This wizard is TourRouter-focused. If we want a Localizer-specific onboarding path, we should discuss.

---

## Master Artist Profile — REDESIGNED

Header section now has three matching 94px squares under the artist name:

1. **Band / Artist Photo** — uploads to image_url, used for artist tile
2. **Spotify** — paste a Spotify artist URL, auto-fetches the artist thumbnail via Spotify's oembed API (no API key needed). Click the filled square to open Spotify in a new tab.
3. **Logo (Transparent .PNG)** — same as before, just repositioned and enlarged from 72px to 94px

First-time users clicking "+" to create their first artist now go directly to the Master Artist Profile page instead of the artist hub.

---

## TourRouter Fixes & Improvements

### Import
- **Off-day auto-fill:** When shows are imported without off days in the file, the system now automatically creates off-day rows for every gap between show dates. Consecutive runs of 6+ off days are consolidated into a single visual row in the routing table (e.g., "OFF · Apr 5–11 · 7 DAYS"). Individual off days still show as separate rows. Financial calculations remain accurate because each off day is stored as its own database record.
- **Column mapping fix:** The "Day" column (day of week) was overriding the "Date" column during import, causing failures. Fixed by removing "day" from the date field aliases and preventing the AI alias resolver from overriding confident builtin mappings.

### Export
- **PDF report, day sheets, and advance sheets all work now.** The issue was pdfkit's font files weren't accessible through webpack bundling. Fixed by adding pdfkit to Next.js external packages.
- **Export PDF design needs polish** — both of us should review and design these to look professional before beta.

### Financials
- **Actual Expenses section moved above Blanket Expenses** on the financials page for better workflow.

### Routing Table
- **Country field now displays uppercase.**
- **"Vehicle Settings" renamed to "Tour Settings"** (pending — about to implement).

---

## Other Fixes

- Login page restyled with Warhol design system
- Artist delete cascade fix (foreign key on tours_routing)
- Auth callback fix (Supabase wildcard redirects + stale PKCE cookies)
- Hydration fixes across financials, export, contacts, finance, routing pages
- Halftone dot overlay z-index fix
- Template editor sidebar polish (toggles → checkboxes, readability, fonts)
- Anthropic API key replaced (expired) — updated in both .env.local and Vercel

---

## Phase Status

| Sub-phase | Status |
|---|---|
| 7A Domain migration | ✅ Done |
| 7B Mapbox integration | ✅ Done |
| 7C Stripe restructure | 🚫 Blocked on EIN |
| 7D Feature flags + mobile | ✅ Done |
| 7E Road App | 🔲 Not started |
| 7F Notifications | ✅ Core done |
| 7G PostHog analytics | ✅ Done |
| 7H Onboarding wizard | ✅ Done (5-step wizard live) |
| 7I Beta invites | ✅ Done |
| 7J Support / FAQ | ✅ Done (34 Q&As live) |
| 7K Marketing site | ✅ Landing page + 4 product pages done |
| 7L Legal updates | ✅ Done — needs lawyer review |
| 7M Final QA + beta launch | 🔲 Blocked on EIN + beta user list |

---

## What We Still Need From Tim

1. **Beta user list** — names and emails for invite codes
2. **EIN** — blocks Stripe restructure and launch
3. **Tutorial video scripts** — need live site to record against
4. **Lawyer review** — ToS and Privacy Policy
5. **Logo files** — SVG + PNG versions for the site
6. **Review exported PDFs** — route report, day sheets, advance sheets work but need visual design polish
7. **Product page review** — check all 4 pages for copy accuracy
8. **Onboarding discussion** — do we need a Localizer-specific onboarding path?

---

## What's Next

- Demo tour data seed (Beta Test Band — 18 shows, from your spec)
- Product page headers (make it clearer which product you're looking at)
- "Tour Settings" rename (minor, about to do)
- Stripe restructure (when EIN clears)
- Road App (Phase 7E — biggest remaining build)
