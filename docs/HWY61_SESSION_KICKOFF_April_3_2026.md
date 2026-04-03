# HWY61 — Session Kickoff (April 3, 2026)
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

**Design System:**
- Phase 1: globals.css foundation + 29 Hw* components
- Phase 2: Dashboard shell (artist tiles, notification bell, onboarding wizard, artist hub tabs, tour tiles)
- Phase 3: All TourRouter pages (routing table, roster panel, settlement panel, vehicle manager, intake drop zone, import, financials, export, public advance form)
- Phase 4: All Localizer pages (gigs/events, template editor sidebar, import assets, import schedule, artist detail, venue share page)
- Phase 5: Supporting pages (artist profile, settings/billing)
- Phase 6: Global audit — 22 files cleaned, zero legacy styles remaining

**Landing Page:**
- Rebuilt from Tim's v3 HTML (docs/HWY61_LANDING_PAGE_v3.html)
- Dark nav bar, full pricing with monthly/yearly toggle, drop zone demo animation, product blocks, audience cards, phone mockup, bundle card
- Added HWY61 LABS wordmark in hero (crimson "6" and "1")
- Smooth scroll nav links
- Files: app/page.tsx + app/landing.css

**Other fixes:**
- Login page restyled with Warhol design system
- Artist delete cascade fix (foreign key on tours_routing)
- Auth callback fix (Supabase wildcard redirects + stale PKCE cookies)
- Hydration fixes (hardcoded HWY61 brand on financials, export, contacts, finance, routing pages)
- Halftone dot overlay fix (z-index layering)
- Template editor sidebar fixes (toggles → checkboxes, readability, missed fonts)

---

## What Needs Building Next (Priority Order)

### 1. Product Pages (4 pages)
Tim delivered HTML files for each product page. These need to be converted to Next.js pages.
- **Source HTML:** Tim has sent these (HWY61_TourRouter.html, HWY61_Localizer.html, HWY61_DIY.html, HWY61_RoadApp.html) — check if they're in docs/ or need to be downloaded
- **Copy:** `docs/HWY61_PRODUCT_PAGE_COPY.md` has all the text content
- **Structure:** Hero → Problem → Solution → Features → Use Cases → Testimonials (placeholder) → Pricing → CTA
- **Routes:** /tourrouter, /localizer-product, /diy, /road-app (or similar — don't conflict with existing routes)
- **Design:** Must match the Warhol design system + Tim's product page styling (dark nav, section dividers, same patterns as landing page)

### 2. Onboarding Wizard (5-step build)
The spec is ready in `docs/HWY61_DREW_BUILD_PACKAGE_april_1__2026.md` (Section 3).
- Route: `/dashboard/onboarding`
- Flow: Create Artist → Add Roster → Create Tour → Add Shows → Done
- Shell already exists at `app/components/OnboardingWizard.tsx` (choice screen only)
- Needs: full 5-step wizard with forms, document intake at step 4, summary at step 5
- Style with Hw* components throughout

### 3. Demo Tour Data Seed
Full data spec in `docs/HWY61_DEMO_TOUR_DATA.md`
- "Beta Test Band" — 18 shows across US/Canada/UK/EU
- 7-person roster, 3 settled shows, 10 hotels, guest lists, expenses, advance details
- Triggered when user clicks "Explore a Demo Tour" in onboarding
- Creates artist, roster, tour, shows, and all associated records in one transaction

### 4. FAQ/Support Page
Content in `docs/HWY61_FAQ_CONTENT_FINAL.md` — 34 Q&As, approved by Tim
- Build as an in-app support page accessible from dashboard
- Accordion-style Q&A sections
- Style with Hw* components

---

## Current Architecture

```
/dashboard (HWY61 LABS)
  └── Artist tiles (universal for all products)
        ├── Gear icon → /dashboard/artists/[id]/profile (Master Artist Profile)
        └── Click tile → /dashboard/artists/[id] (ArtistHubClient)
              ├── Localizer-only → ArtistDetailClient (tour grid for assets)
              ├── TourRouter-only → ArtistToursClient (tour grid for routing)
              ├── Both → Tabs: "TourRouter / Management" | "Localizer / Assets"
              └── DIY → TourRouter tab + upgrade banner

Bell icon with notifications in all dashboard headers.
New users with 0 artists → OnboardingWizard choice screen.
Back button from tour detail → artist hub (not old tours list).
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
| 7H Onboarding wizard | 🟡 Shell + choice screen built — needs 5-step wizard |
| 7I Beta invites | ✅ Done |
| 7J Support / FAQ | 🟡 Content finalized — needs page built |
| 7K Marketing site | 🟡 Landing page done — needs 4 product pages |
| 7L Legal updates | ✅ Done — needs lawyer review |
| 7M Final QA + beta launch | 🔲 Blocked on EIN + beta user list |

---

## Key File Paths

| File | Purpose |
|---|---|
| `app/page.tsx` | Landing page (v3 rebuild) |
| `app/landing.css` | Landing page styles |
| `app/login/page.tsx` | Login page |
| `app/dashboard/page.tsx` | Main dashboard — artist tiles |
| `app/dashboard/artists/[artistId]/ArtistHubClient.tsx` | Tabbed artist hub |
| `app/dashboard/artists/[artistId]/ArtistToursClient.tsx` | Tour tiles filtered by artist |
| `app/dashboard/artists/[artistId]/profile/page.tsx` | Master Artist Profile |
| `app/dashboard/routing/[tourId]/page.tsx` | Tour detail / routing table |
| `app/dashboard/routing/[tourId]/financials/page.tsx` | Tour financials |
| `app/dashboard/routing/[tourId]/import/page.tsx` | TourRouter import page |
| `app/dashboard/routing/[tourId]/export/page.tsx` | TourRouter export page |
| `app/advance/[token]/page.tsx` | Public advance form |
| `app/v/e/[token]/page.tsx` | Venue share page (public) |
| `app/components/hw/` | All 29 Hw* design system components |
| `app/components/NotificationBell.tsx` | Bell icon + dropdown |
| `app/components/OnboardingWizard.tsx` | Onboarding choice screen |
| `lib/clientRender.ts` | Localizer canvas rendering engine — DO NOT TOUCH |
| `lib/tourrouter/financials.ts` | calcTourFinancials() — DO NOT TOUCH |
| `lib/notifications.ts` | createNotification() helper |
| `docs/HWY61_DESIGN_SYSTEM.md` | Design system spec |
| `docs/HWY61_BRAND_GUIDELINES.md` | Brand guidelines |
| `docs/HWY61_DEMO_TOUR_DATA.md` | Demo tour seed data |
| `docs/HWY61_FAQ_CONTENT_FINAL.md` | FAQ content (34 Q&As) |
| `docs/HWY61_PRODUCT_PAGE_COPY.md` | Product page copy (4 pages) |
| `docs/HWY61_DREW_BUILD_PACKAGE_april_1__2026.md` | Onboarding wizard spec (Section 3) |
| `docs/SESSION_LOG.md` | Session log — update + commit at end of every session |

---

## Tim's Remaining Deliverables

1. **Beta user list** — names/emails for invite codes
2. **EIN** — blocks Stripe restructure
3. **Tutorial videos** — scripts written, needs live site to record
4. **Lawyer review** — ToS and Privacy Policy
5. **Product page HTML files** — may need to download from Tim (HWY61_TourRouter.html, HWY61_Localizer.html, HWY61_DIY.html, HWY61_RoadApp.html)
6. **Logo files** — SVG + PNG versions

---

## Session Reminders

- **One feature per prompt.** Context degrades with scope creep.
- **Work on localhost today.** `npm run dev` → preview at localhost:3000. Push at end of session.
- **At end of session:** `open -a TextEdit docs/SESSION_LOG.md` → update → `git add/commit/push`
- **Blocked items:** Skip and return when dependencies resolve.
- **Token conservation:** Avoid parallel agents and massive file reads. One file at a time keeps usage low.
