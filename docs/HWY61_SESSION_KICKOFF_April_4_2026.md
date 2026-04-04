# HWY61 — Session Kickoff (April 4, 2026)
**Paste this at the start of a new Claude Code session to pick up where we left off.**

---

## Stack & Repo

- **Repo:** `~/localizer` → `github.com/hwy61ai-bit/localizer`
- **Stack:** Next.js 14, TypeScript, Supabase, Vercel, Cloudinary, Anthropic API, Stripe, Resend, Mapbox, PostHog
- **Domain:** hwy61labs.com (subdomains: localizer, tourrouter, diy)
- **Deploy:** Vercel auto-deploys on `git push` — never use `npx vercel --prod`
- **Dev server:** port 3000 (sometimes 3001/3002)
- **Supabase SQL migrations:** Must run manually via SQL Editor (terminal has no network access to Supabase)

---

## ⚠️ WORK ON LOCALHOST, NOT LIVE SITE

1. **Start dev server:** `cd ~/localizer && npm run dev`
2. **Preview all changes at:** `http://localhost:3000`
3. **Do NOT push after every change.** Batch all changes and do ONE git add/commit/push at the end of the session (or at natural breakpoints).
4. If you need to test subdomain-specific behavior, add `?view=localizer` or `?view=tourrouter` or `?view=diy` to any page on localhost.

---

## Critical Build Rules

- **One file per prompt.** Large multi-file prompts cause Claude Code to hang.
- **Never use bash heredocs.** Smart quote corruption risk.
- **parseDate:** Always `new Date(year, month-1, day)` — never `new Date(string)`
- **`calcTourFinancials()`** is the single source of truth for tour finances. NEVER modify.
- **Fuel variable:** Must be `legCtry` not `legCountry`
- **Excel parsing:** `raw:true, cellDates:true` — never `raw:false`
- **`buildShows`:** Must declare `row={}` inside the loop body
- **RLS on every new table** before the feature is considered done.
- **Clear `.next` cache** when seeing webpack errors: `rm -rf .next`
- **New tables:** Always use `.select().maybeSingle()` to detect zero-row writes.
- **Next.js 14 server-side:** Add `cache: "no-store"` to Supabase `fetch()` calls.
- **Components defined inside other components** get remounted on every render — always extract to module level.
- **No "AI" in user-facing copy.** Always "HWY61 reads it" / "HWY61 figures it out."
- **Do NOT touch lib/clientRender.ts, canvas operations, FontFace API, or any render logic.** The Localizer renderer is a separate system from the UI.
- **Do NOT use useProductBranding for page header brand text.** Causes hydration errors. Hardcode "HWY61" instead.
- **Inline `<style>` tags cause hydration errors.** Always use `<style dangerouslySetInnerHTML={{ __html: `...` }} />`.
- **pdfkit is in serverComponentsExternalPackages** in next.config.js. Do not remove it or PDF exports break.
- **Anthropic API key was replaced April 3.** Both .env.local and Vercel are updated. The intake endpoint uses raw fetch (not the SDK). The import/pdf endpoint also uses raw fetch.
- **"Band" as a product name is dead.** TourRouter is the customer-facing name everywhere.

---

## Design System — COMPLETE ✅

The Warhol design system is fully implemented across the entire app (Phases 1–6 done April 2, 2026).

**Reference file:** `docs/HWY61_DESIGN_SYSTEM.md`
**Brand guidelines:** `docs/HWY61_BRAND_GUIDELINES.md`
**Components:** `app/components/hw/` — 29 Hw* components with barrel export at `app/components/hw/index.ts`

**Key rules (always follow for any new UI):**
- border-radius: ALWAYS 0 (except radio buttons)
- Shadows: flat offset only (Xpx Ypx 0 color, no blur)
- Fonts: Bebas Neue (headlines), Space Mono (labels/metadata), DM Sans (body)
- Primary color: crimson #c5535b
- Page background: transparent (body has cream #F5F0E8 + halftone dots)
- Cards: white bg, 3px black borders, flat shadow on hover
- Tables: dark header row, Space Mono headers, crimson-ghost row hover
- Financial numbers: Space Mono, right-aligned, green positive, crimson negative
- Import components from `@/app/components/hw`

---

## What Was Built April 2–3

**Design System (April 2):**
- Phase 1: globals.css foundation + 29 Hw* components
- Phase 2: Dashboard shell (artist tiles, notification bell, onboarding wizard, artist hub tabs, tour tiles)
- Phase 3: All TourRouter pages (routing table, roster panel, settlement panel, vehicle manager, intake drop zone, import, financials, export, public advance form)
- Phase 4: All Localizer pages (gigs/events, template editor sidebar, import assets, import schedule, artist detail, venue share page)
- Phase 5: Supporting pages (artist profile, settings/billing)
- Phase 6: Global audit — 22 files cleaned, zero legacy styles remaining

**Landing Page (April 2):**
- Rebuilt from Tim's v3 HTML
- Dark nav bar, full pricing with monthly/yearly toggle, drop zone demo animation, product blocks, audience cards, phone mockup, bundle card
- HWY61 LABS wordmark in hero (crimson "6" and "1")
- Smooth scroll nav links
- Color-coded "Learn More" buttons linking to product pages

**Product Pages (April 3):**
- TourRouter at /tourrouter — converted from Tim's HWY61_TourRouter.html
- Localizer at /localizer — converted from Tim's HWY61_Localizer.html
- DIY at /diy — converted from Tim's HWY61_DIY.html
- Road App at /roadapp — converted from Tim's HWY61_RoadApp.html
- All pages share consistent nav bar with active state

**FAQ / Support Page (April 3):**
- /dashboard/support — 38 Q&As across 4 sections (Getting Started, Billing, Features, Troubleshooting)
- Accordion layout with Warhol styling
- Support link added to dashboard header next to notification bell

**Onboarding Wizard (April 3):**
- /dashboard/onboarding — 5-step wizard
- Step 1: Create Artist (name + logo)
- Step 2: Add Team (repeatable roster rows)
- Step 3: Create Tour (name, dates, vehicle)
- Step 4: Add Shows (manual entry + document drop, side by side)
- Step 5: Done (summary card + navigation links)
- OnboardingWizard choice screen "Get Started" routes to /dashboard/onboarding
- Document drop supports PDF and xlsx (xlsx parsed client-side with SheetJS, sent to /api/tourrouter/import/text)

**Master Artist Profile Redesign (April 3):**
- Three 94px squares under artist name: Band Photo | Spotify Thumbnail | Logo
- Spotify auto-fetches artist image via oembed (no API key needed)
- First-time users creating their first artist go directly to profile page

**TourRouter Fixes (April 3):**
- Auto-fill off days between show dates on import (6+ consecutive days consolidated in display)
- Column mapping fix (removed "day" from date aliases, alias resolver can't override builtin mappings)
- PDF/daysheet/advance exports fixed (pdfkit added to serverComponentsExternalPackages)
- Actual Expenses moved above Blanket Expenses on financials page
- Country field uppercase in routing table
- "Vehicle Settings" renamed to "Tour Settings"

**Other Fixes (April 2–3):**
- Login page restyled with Warhol
- Artist delete cascade fix (foreign key on tours_routing)
- Auth callback fix (Supabase wildcard redirects + stale PKCE cookies)
- Hydration fixes (hardcoded HWY61 brand on multiple pages)
- Halftone dot overlay z-index fix
- Template editor sidebar polish
- Anthropic API key replaced (expired) and updated in Vercel

---

## What Needs Building Next (Priority Order)

### 1. Demo Tour Data Seed
Full data spec in `docs/HWY61_DEMO_TOUR_DATA.md`
- "Beta Test Band" — 18 shows across US/Canada/UK/EU
- 7-person roster, 3 settled shows, 10 hotels, guest lists, expenses, advance details
- Triggered when user clicks "Explore a Demo Tour" in onboarding
- Creates artist, roster, tour, shows, and all associated records in one transaction

### 2. Product Page Headers
- Each product page needs a stronger visual indicator of which product you're looking at
- Discussed but not implemented — revisit and design

### 3. Onboarding Wizard Polish / Testing
- Test full flow end-to-end with real data
- Verify document parsing works with various file formats
- Check edge cases: browser close mid-wizard, back navigation, 0 shows/roster

### 4. Export PDF Design
- PDF report, day sheets, and advance sheets all work but need visual design polish
- Tim and Drew should review and design these together
- Files: app/api/tourrouter/tours/[tourId]/export/pdf/, daysheet/, advance/

### 5. "Tour Settings" Section Expansion
- Currently just vehicle settings
- Could include: per diems, blanket expenses, commission defaults, advance automation settings

---

## Known QA Items

- Localizer-only view via `?view=localizer` has a redirect/bounce issue on artist detail page (doesn't affect real users — only admin testing)
- Onboarding wizard is TourRouter-focused — no Localizer-specific onboarding path yet (discuss with Tim)
- Tour card stagger animation on artist page doesn't trigger (cosmetic)
- Export PDFs need design polish

---

## Current Architecture

```
/dashboard (HWY61 LABS)
  └── Artist tiles (universal for all products)
        ├── Gear icon → /dashboard/artists/[id]/profile (Master Artist Profile)
        ├── + tile → profile page (first artist) or artist hub (subsequent)
        └── Click tile → /dashboard/artists/[id] (ArtistHubClient)
              ├── Localizer-only → ArtistDetailClient (tour grid for assets)
              ├── TourRouter-only → ArtistToursClient (tour grid for routing)
              ├── Both → Tabs: "TourRouter" | "Localizer"
              └── DIY → TourRouter tab + upgrade banner

Bell icon + notifications in all dashboard headers.
Support link in dashboard header (→ /dashboard/support).
New users with 0 artists → OnboardingWizard choice screen.
  → "Get Started" → /dashboard/onboarding (5-step wizard)
  → "Explore a Demo Tour" → demo seed (not built yet)
  → "Skip" → empty dashboard
Back button from tour detail → artist hub (not old tours list).

Marketing pages:
  / → Landing page (v3 rebuild)
  /tourrouter → TourRouter product page
  /localizer → Localizer product page
  /diy → DIY product page
  /roadapp → Road App product page
```

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
| 7H Onboarding wizard | ✅ Done (5-step wizard + choice screen) |
| 7I Beta invites | ✅ Done |
| 7J Support / FAQ | ✅ Done (34 Q&As live) |
| 7K Marketing site | ✅ Landing page + 4 product pages done |
| 7L Legal updates | ✅ Done — needs lawyer review |
| 7M Final QA + beta launch | 🔲 Blocked on EIN + beta user list |

---

## Key File Paths

| File | Purpose |
|---|---|
| `app/page.tsx` | Landing page (v3 rebuild) |
| `app/landing.css` | Landing page styles |
| `app/login/page.tsx` | Login page |
| `app/tourrouter/page.tsx` | TourRouter product page |
| `app/localizer/page.tsx` | Localizer product page |
| `app/diy/page.tsx` | DIY product page |
| `app/roadapp/page.tsx` | Road App product page |
| `app/dashboard/page.tsx` | Main dashboard — artist tiles |
| `app/dashboard/support/page.tsx` | FAQ / Support page (34 Q&As) |
| `app/dashboard/onboarding/page.tsx` | 5-step onboarding wizard |
| `app/dashboard/artists/[artistId]/ArtistHubClient.tsx` | Tabbed artist hub |
| `app/dashboard/artists/[artistId]/ArtistToursClient.tsx` | Tour tiles filtered by artist |
| `app/dashboard/artists/[artistId]/profile/page.tsx` | Master Artist Profile (photo/spotify/logo squares) |
| `app/dashboard/routing/[tourId]/page.tsx` | Tour detail / routing table |
| `app/dashboard/routing/[tourId]/financials/page.tsx` | Tour financials |
| `app/dashboard/routing/[tourId]/import/page.tsx` | TourRouter import page |
| `app/dashboard/routing/[tourId]/export/page.tsx` | TourRouter export page |
| `app/advance/[token]/page.tsx` | Public advance form |
| `app/v/e/[token]/page.tsx` | Venue share page (public) |
| `app/api/tourrouter/import/pdf/route.ts` | PDF/document import (AI parsing) |
| `app/api/tourrouter/import/text/route.ts` | Text/CSV import for xlsx (AI parsing) |
| `app/api/tourrouter/intake/route.ts` | Universal document intake |
| `app/api/tourrouter/tours/[tourId]/shows/route.ts` | Add shows + auto-fill off days |
| `app/api/tourrouter/tours/[tourId]/export/pdf/route.ts` | PDF export |
| `app/api/tourrouter/tours/[tourId]/export/daysheet/route.ts` | Day sheet export |
| `app/api/tourrouter/tours/[tourId]/export/advance/route.ts` | Advance sheet export |
| `app/api/tourrouter/artists/route.ts` | Artist creation (for onboarding wizard) |
| `app/components/hw/` | All 29 Hw* design system components |
| `app/components/NotificationBell.tsx` | Bell icon + dropdown |
| `app/components/OnboardingWizard.tsx` | Onboarding choice screen |
| `lib/clientRender.ts` | Localizer canvas rendering engine — DO NOT TOUCH |
| `lib/tourrouter/financials.ts` | calcTourFinancials() — DO NOT TOUCH |
| `lib/tourrouter/columnMapper.ts` | Column mapping + aliases for import |
| `lib/notifications.ts` | createNotification() helper |
| `next.config.js` | Includes pdfkit + @pdf-lib/fontkit in serverComponentsExternalPackages |
| `docs/HWY61_DESIGN_SYSTEM.md` | Design system spec |
| `docs/HWY61_BRAND_GUIDELINES.md` | Brand guidelines |
| `docs/HWY61_DEMO_TOUR_DATA.md` | Demo tour seed data |
| `docs/HWY61_FAQ_CONTENT_FINAL.md` | FAQ content (34 Q&As) |
| `docs/HWY61_PRODUCT_PAGE_COPY.md` | Product page copy (4 pages) |
| `docs/HWY61_DREW_BUILD_PACKAGE_april_1__2026.md` | Onboarding wizard spec (Section 3) + Demo data (Section 4) |
| `docs/HWY61_STATUS_FOR_TIM_April_3_2026.md` | Latest status update for Tim |
| `docs/SESSION_LOG.md` | Session log — update + commit at end of every session |

---

## Tim's Remaining Deliverables

1. **Beta user list** — names/emails for invite codes
2. **EIN** — blocks Stripe restructure
3. **Tutorial videos** — scripts written, needs live site to record
4. **Lawyer review** — ToS and Privacy Policy
5. **Logo files** — SVG + PNG versions
6. **Export PDF design review** — route report, day sheets, advance sheets need polish
7. **Product page review** — check all 4 pages for copy accuracy
8. **Onboarding path discussion** — Localizer-specific onboarding needed?

---

## API Endpoints Reference

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/tourrouter/tours` | GET/POST | List/create routing tours |
| `/api/tourrouter/tours/[tourId]/shows` | POST | Add shows + auto-fill off days |
| `/api/tourrouter/tours/[tourId]/shows/[showId]` | PUT/DELETE | Update/delete individual show |
| `/api/tourrouter/tours/[tourId]/export/csv` | GET | CSV export |
| `/api/tourrouter/tours/[tourId]/export/excel` | GET | Excel export |
| `/api/tourrouter/tours/[tourId]/export/pdf` | GET | PDF route report |
| `/api/tourrouter/tours/[tourId]/export/daysheet` | GET | Day sheet PDF |
| `/api/tourrouter/tours/[tourId]/export/advance` | GET | Advance sheet PDF |
| `/api/tourrouter/import/pdf` | POST | Parse PDF/document via Claude |
| `/api/tourrouter/import/text` | POST | Parse text/CSV via Claude (used for xlsx) |
| `/api/tourrouter/intake` | POST | Universal document intake |
| `/api/tourrouter/artists` | POST | Create artist (onboarding wizard) |
| `/api/tourrouter/aliases/resolve` | POST | AI-assisted column mapping |

---

## Session Reminders

- **One feature per prompt.** Context degrades with scope creep.
- **Work on localhost today.** `npm run dev` → preview at localhost:3000. Push at end of session.
- **At end of session:** `open -a TextEdit docs/SESSION_LOG.md` → update → `git add/commit/push`
- **Blocked items:** Skip and return when dependencies resolve.
- **Token conservation:** Avoid parallel agents and massive file reads. One file at a time keeps usage low.
- **Hydration errors on style tags:** Always use `<style dangerouslySetInnerHTML={{ __html: `...` }} />` not `<style>{`...`}</style>`
