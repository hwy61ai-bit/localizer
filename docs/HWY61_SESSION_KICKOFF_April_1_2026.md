# HWY61 — Session Kickoff (April 1, 2026)
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

## Critical Build Rules

- **One file per prompt.** Large multi-file prompts cause Claude Code to hang.
- **Never use bash heredocs.** Smart quote corruption risk.
- **parseDate:** Always `new Date(year, month-1, day)` — never `new Date(string)`
- **`calcTourFinancials()`** is the single source of truth for tour finances.
- **Fuel variable:** Must be `legCtry` not `legCountry`
- **Excel parsing:** `raw:true, cellDates:true` — never `raw:false`
- **`buildShows`:** Must declare `row={}` inside the loop body
- **RLS on every new table** before the feature is considered done.
- **Clear `.next` cache** when seeing webpack errors.
- **New tables:** Always use `.select().maybeSingle()` to detect zero-row writes.
- **Next.js 14 server-side:** Add `cache: "no-store"` to Supabase `fetch()` calls.
- **Components defined inside other components** get remounted on every render — always extract to module level (learned this today with roster fields).

---

## What Was Built Yesterday (March 31)

Monster session. 21 items completed:

1. DIY deal types flag enabled (all 14 deal types)
2. Post-login redirect — all users now land on `/dashboard` (universal artist picker)
3. hwy61.ai → hwy61labs.com redirect live (DNS transferred to Vercel)
4. PostHog analytics installed (provider, identify, 6 key events)
5. Mobile responsiveness pass (8 pages)
6. Beta invite infrastructure (10 codes: HWY61-BETA-001 through 010)
7. Supabase auth cleanup (Site URL → hwy61labs.com, old URLs removed)
8. Legal updates — ToS + Privacy Policy current (April 1, 2026 effective)
9. Artist hub architecture — tabbed detail page:
   - Localizer-only → asset management, no tabs
   - TourRouter-only → tour tiles filtered by artist, no tabs
   - Bundle → two tabs: "TourRouter / Management" (default) and "Localizer / Assets"
   - DIY → TourRouter tab with upgrade banner
   - Admin test: add `?view=localizer` or `?view=tourrouter` or `?view=diy` to any artist page
10. Artist-filtered tours (ArtistToursClient) — tours filtered by artist_id, create pre-sets artist
11. Master Artist Profile rebuilt:
    - Top section (always visible): logo upload, name, Spotify, bio, team contacts (2x2 grid), advance materials (4 upload cards)
    - 8 accordion sections: Roster, Vehicles & Equipment, Hospitality & Rider, Promo & Marketing, Business Entity, Tax & Compliance, Insurance, Technical Production
    - Auto-save with 600ms debounce
    - Gear icon on artist dashboard tiles links to profile
12. ArtistDetailClient stripped to 100-line tours-only grid
13. Branding fix — routing pages show "TOURROUTER" regardless of hostname (pathname check)
14. Restored drive/fly toggle for off days
15. Dashboard header: "LOCALIZER" → "HWY61 LABS"

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
```

Subscription detection:
- Localizer: `org.plan_status === "active"` (or trial, or admin)
- TourRouter: `GET /api/tourrouter/tours` returns 200 (not 403)
- DIY: hostname includes "diy" (feature flags, not subscription)
- Bundle: both checks pass → show tabs

Branding: hostname-based via ProductBrandingContext, with pathname override (`/dashboard/routing/*` → always "TOURROUTER.")

---

## Phase Status

**Phases 1–6: ✅ Complete** (Localizer, TourRouter, Band Must-Haves, AI Differentiators, Finance, Contacts)

**Phase 7 — Launch Prep:**

| Sub-phase | Status |
|---|---|
| 7A Domain migration | ✅ Done |
| 7B Mapbox integration | ✅ Done |
| 7C Stripe restructure | 🚫 Blocked on EIN |
| 7D Feature flags + mobile | ✅ Done |
| 7E Road App | 🔲 Not started (parallel track, 2-3 weeks) |
| 7F Notifications | 🔲 Not started |
| 7G PostHog analytics | ✅ Done |
| 7H Onboarding wizard | 🔲 Not started |
| 7I Beta invites | ✅ Done |
| 7J Support infrastructure | 🔲 Not started (needs Tim's FAQ content) |
| 7K Marketing site | 🔲 Not started (needs Tim's copy/direction) |
| 7L Legal updates | ✅ Done |
| 7M Final QA + beta launch | 🔲 Not started |

---

## Tim's 4-Week Beta Sprint (Forward Plan)

**Merch and Agency are CUT from the build. Not being built.**

| Week | Focus | Status |
|------|-------|--------|
| 1 | Marketing site + Legal | Legal ✅ done. Marketing site needs Tim's copy. |
| 2 | Onboarding + Notifications | Not started |
| 3 | Support + QA prep | Not started |
| 4 | QA sweep + Beta launch | Not started |

**Parallel tracks:**
- Road App: start after Week 2, 2-3 weeks
- Stripe: immediately when EIN arrives

---

## Open Items / Next Steps

1. **Default roster → tour roster population** — when creating a new tour, pre-fill the tour roster from the artist's `default_roster` on the profile page. Not built yet.

2. **Marketing site (7K)** — blocked on Tim's copy and design direction. He's working on mockups.

3. **Onboarding wizard + demo tour (7H)** — needs Tim's real tour data for the demo tour. Can build the wizard UI and choice screen (wizard / demo / skip) independently.

4. **Notifications (7F)** — can build infrastructure now:
   - `notifications` table with RLS
   - Bell icon in header with dropdown and unread count
   - Twilio SMS wiring for internal escalation

5. **Master Artist Profile design review** — mockups sent to Tim. Waiting on his feedback on section order and fields. Profile page is functional now.

6. **Tim's deliverables Drew is waiting on:**
   - Marketing site copy (landing page + product pages)
   - Tutorial video recordings
   - FAQ content for knowledge base
   - Demo tour data (anonymized real tour)
   - Real tour data for QA testing (3+ complete tours)
   - Beta user list (who gets the first 5-10 codes)
   - Legal sign-off on updated ToS/Privacy Policy

---

## Key File Paths

| File | Purpose |
|---|---|
| `app/dashboard/page.tsx` | Main dashboard — artist tiles |
| `app/dashboard/artists/[artistId]/ArtistHubClient.tsx` | Tabbed artist hub (subscription-aware) |
| `app/dashboard/artists/[artistId]/ArtistToursClient.tsx` | Tour tiles filtered by artist |
| `app/dashboard/artists/[artistId]/ArtistDetailClient.tsx` | Localizer tour grid (stripped down) |
| `app/dashboard/artists/[artistId]/profile/page.tsx` | Master Artist Profile (rebuilt) |
| `app/dashboard/routing/[tourId]/page.tsx` | Tour detail page |
| `app/components/PostHogProvider.tsx` | PostHog + beta invite claim |
| `lib/tourrouter/featureFlags.ts` | DIY_FLAGS vs TOURROUTER_FLAGS |
| `lib/tourrouter/productBranding.ts` | Hostname + pathname branding |
| `lib/tourrouter/billingGate.ts` | TourRouter subscription check |
| `lib/tourrouter/financials.ts` | calcTourFinancials() — single source of truth |
| `app/auth/callback/route.ts` | Post-login redirect (universal /dashboard) |
| `docs/HWY61_FORWARD_PLAN_March_31_2026.md` | Tim's 4-week beta sprint plan |
| `docs/HWY61_BUILD_STATUS_March_31_2026.md` | Full phase status doc |
| `docs/SESSION_LOG.md` | Session log (update + commit at end of every session) |

---

## Session Reminders

- **One feature per prompt.** Context degrades with scope creep.
- **At end of session:** `open -a TextEdit docs/SESSION_LOG.md` → update → `git add/commit/push`
- **Testing:** Primarily on live deployed site, not localhost.
- **Blocked items:** Skip and return when dependencies resolve.
