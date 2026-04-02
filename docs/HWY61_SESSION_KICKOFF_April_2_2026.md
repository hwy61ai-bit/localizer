# HWY61 — Session Kickoff (April 2, 2026)
**Paste this at the start of a new Claude Code session to pick up where we left off.**

---

## Stack & Repo

- **Repo:** `~/localizer` → `github.com/hwy61ai-bit/localizer`
- **Stack:** Next.js 14, TypeScript, Supabase, Vercel, Cloudinary, Anthropic API, Stripe, Resend, Mapbox, PostHog
- **Domain:** hwy61labs.com (subdomains: localizer, tourrouter, diy)
- **Deploy:** Vercel auto-deploys on `git push` — never use `npx vercel --prod`
- **Drew login:** hwy61ai@gmail.com
- **Tim login:** hwy61regan@gmail.com
- **Drew's org ID:** d38702d7-ea6b-49f1-bc8b-4a21b439642b
- **Dev server:** port 3000 (sometimes 3001/3002)
- **Supabase SQL migrations:** Must run manually via SQL Editor (terminal has no network access to Supabase)

---

## ⚠️ TODAY: WORK ON LOCALHOST, NOT LIVE SITE

Today's session is heavily visual — UI polish, layout changes, design tweaks. To avoid slow Vercel deploy cycles:

1. **Start dev server:** `cd ~/localizer && npm run dev`
2. **Preview all changes at:** `http://localhost:3000`
3. **Do NOT push after every change.** Batch all changes and do ONE git add/commit/push at the end of the session (or at natural breakpoints).
4. **Test on localhost first, push when it looks right.**
5. Dev server hot-reloads on file save — no restart needed for most changes.
6. If you need to test subdomain-specific behavior (branding, feature flags), add `?view=localizer` or `?view=tourrouter` or `?view=diy` to any page on localhost.

---

## Critical Build Rules

- **One file per prompt.** Large multi-file prompts cause Claude Code to hang.
- **Never use bash heredocs.** Smart quote corruption risk.
- **parseDate:** Always `new Date(year, month-1, day)` — never `new Date(string)`
- **`calcTourFinancials()`** is the single source of truth for tour finances.
- **Fuel variable:** Must be `legCtry` not `legCountry`
- **Excel parsing:** `raw:true, cellDates:true` — never `raw:false`
- **`buildShows`:** Must declare `row={}` inside the loop body
- **RLS on every new table** before the feature is considered done.
- **Clear `.next` cache** when seeing webpack errors: `rm -rf .next`
- **New tables:** Always use `.select().maybeSingle()` to detect zero-row writes.
- **Next.js 14 server-side:** Add `cache: "no-store"` to Supabase `fetch()` calls.
- **Components defined inside other components** get remounted on every render — always extract to module level.

---

## What Was Built Yesterday (April 1)

1. **Default roster → tour roster population** — new tours auto-inherit artist's default roster with correct RosterEntry → RosterMember mapping (names, roles, pay rates)
2. **Notification system (Phase 7F)** — `notifications` table + RLS, GET/PATCH API routes, bell icon in dashboard headers with unread badge, dropdown, mark-all-as-read, 60s polling, 4 event triggers (tour_created, document_parsed, advance_bounced, advance_escalated), reusable `createNotification()` helper at `lib/notifications.ts`
3. **Onboarding wizard (Phase 7H shell)** — choice screen (Get Started / Demo Tour / Skip), OnboardingGate wrapper checks artist count + localStorage, `?onboarding=true` query param for testing
4. **Branding fix** — ProductBrandingContext now uses `usePathname()` so branding updates on client-side navigation without refresh
5. **Navigation cleanup** — removed old "YOUR TOURS" page (`/dashboard/routing` now redirects to `/dashboard`), back button from tour detail goes to artist hub
6. **Master Artist Profile polish** — logo upload is square with rounded corners + PNG hint text, artist name is uppercase bold with fade-slide animation
7. **Bug sweep fixes** — extracted nested StarRating component, removed hwy61.ai reference from middleware, updated all dead `/dashboard/routing` links
8. **Tim status doc** — `docs/HWY61_STATUS_FOR_TIM_April_1_2026.md` with full deliverables list
9. **Beta-Test Band kit started** — route sheet, deal memo, settlement, hotel, tech rider, hospitality rider, EPK, logo created (not yet committed)

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

**Phases 1–6: ✅ Complete**

**Phase 7 — Launch Prep:**

| Sub-phase | Status |
|---|---|
| 7A Domain migration | ✅ Done |
| 7B Mapbox integration | ✅ Done |
| 7C Stripe restructure | 🚫 Blocked on EIN |
| 7D Feature flags + mobile | ✅ Done |
| 7E Road App | 🔲 Not started (2-3 week parallel track) |
| 7F Notifications | ✅ Core done (table, API, bell, 4 triggers) |
| 7G PostHog analytics | ✅ Done |
| 7H Onboarding wizard | 🟡 Shell built — needs wizard steps + demo tour |
| 7I Beta invites | ✅ Done |
| 7J Support infrastructure | 🔲 Needs Tim's FAQ content |
| 7K Marketing site | 🔲 Needs Tim's copy/direction |
| 7L Legal updates | ✅ Done |
| 7M Final QA + beta launch | 🔲 Not started |
| 7N Beta-Test Band kit | 🟡 Files created, not committed |

**Merch and Agency are permanently cut. No Phase 8C or Phase 9.**

---

## Tim's Deliverables (Waiting On)

1. Onboarding wizard steps (confirm/modify the proposed 5-step flow)
2. Demo tour data (anonymized real tour, ~15 dates)
3. Tutorial video recordings
4. FAQ content for knowledge base
5. Marketing site copy (landing page + product pages)
6. Beta user list (who gets the first 5-10 codes)
7. Real tour data for QA testing (3+ complete tours)
8. Legal sign-off on updated ToS/Privacy Policy
9. **Any new MD files Tim sends today** — review and incorporate into today's plan

---

## Key File Paths

| File | Purpose |
|---|---|
| `app/dashboard/page.tsx` | Main dashboard — artist tiles |
| `app/dashboard/artists/[artistId]/ArtistHubClient.tsx` | Tabbed artist hub |
| `app/dashboard/artists/[artistId]/ArtistToursClient.tsx` | Tour tiles filtered by artist |
| `app/dashboard/artists/[artistId]/profile/page.tsx` | Master Artist Profile |
| `app/dashboard/routing/[tourId]/page.tsx` | Tour detail page |
| `app/components/NotificationBell.tsx` | Bell icon + dropdown |
| `app/components/OnboardingWizard.tsx` | Onboarding choice screen |
| `app/components/OnboardingGate.tsx` | Onboarding conditional wrapper |
| `lib/notifications.ts` | createNotification() helper |
| `lib/tourrouter/featureFlags.ts` | DIY_FLAGS vs TOURROUTER_FLAGS |
| `lib/tourrouter/productBranding.ts` | Hostname + pathname branding |
| `lib/tourrouter/ProductBrandingContext.tsx` | Branding context (uses usePathname) |
| `lib/tourrouter/financials.ts` | calcTourFinancials() — single source of truth |
| `docs/SESSION_LOG.md` | Session log (update + commit at end of every session) |

---

## Session Reminders

- **One feature per prompt.** Context degrades with scope creep.
- **Work on localhost today.** `npm run dev` → preview at localhost:3000. Push at end of session.
- **At end of session:** `open -a TextEdit docs/SESSION_LOG.md` → update → `git add/commit/push`
- **Blocked items:** Skip and return when dependencies resolve.
