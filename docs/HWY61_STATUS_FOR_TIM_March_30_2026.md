# HWY61 — Build Status for Tim
**Date:** March 30, 2026
**From:** Drew
**Session:** Full build day — Phases 7A, 7B, and 7D completed

---

## What Got Done Today

### Phase 7A — Domain Migration ✅ COMPLETE

The new domain `hwy61labs.com` is live and fully operational.

- **DNS** moved from Squarespace to Vercel (Vercel nameservers)
- **All subdomains** configured, verified, SSL active:
  - `hwy61labs.com` — marketing/showcase site
  - `www.hwy61labs.com` — redirects to root
  - `localizer.hwy61labs.com` — Localizer app
  - `tourrouter.hwy61labs.com` — TourRouter app
  - `diy.hwy61labs.com` — DIY app
- **Supabase auth** — redirect URLs added for all new subdomains, cross-subdomain cookies configured (login on one subdomain works across all)
- **Resend** — domain verified for `@hwy61labs.com` (transactional email ready)
- **Email forwarding** — ImprovMX set up for `support@hwy61labs.com`, `dmca@hwy61labs.com`, `privacy@hwy61labs.com`
- **SPF records** merged for Resend + ImprovMX (both sending and forwarding work)
- **Middleware** — hostname-based routing serves different app experiences per subdomain
- **Old domain** — `localizer.hwy61.ai` still works during transition (no breaking changes)
- **Codebase** — all hardcoded `hwy61.ai` references updated to `hwy61labs.com` across 9 files

**Decision needed from Tim:** When to redirect `hwy61.ai` → `hwy61labs.com` (Option A: now, Option B: parallel 30-60 days, per your v5 doc)

---

### Phase 7B — Mapbox Integration ✅ COMPLETE

Real driving distances and times replace the old haversine estimates everywhere.

- **Mapbox account** created, access token configured
- **Two new Supabase tables** with RLS:
  - `geocode_cache` — caches city → lat/lng lookups
  - `drive_cache` — caches city pair → distance/time
- **Mapbox service** (`lib/tourrouter/mapbox.ts`):
  - `geocodeCity()` — 3-tier: hardcoded CITY_COORDS → geocode_cache → Mapbox Geocoding API
  - `getDriveInfo()` — 2-tier: drive_cache → Mapbox Directions API
  - Any city in the world now works, not just the ~170 hardcoded ones
- **Drive info API route** — `/api/tourrouter/drive-info` (POST, auth-gated, caches results)
- **calcTourFinancials()** — accepts pre-fetched drive data as optional parameter, haversine as silent fallback
- **All export routes** wired to Mapbox: Excel, PDF, advance sheet, day sheet
- **Client pages** prefetch all leg data on load via `Promise.all` (parallel, fast)
- **Performance:** cached lookups ~100ms, first-ever city pair ~500ms, then cached forever for all users

**Test results:**
- Kansas City, MO → Iowa City, IA: **4h 40m** (was 6h 15m with haversine — 25% more accurate)
- Harlowton, MT (not in old CITY_COORDS list): **works** — Mapbox resolves it, old system showed "?"

**Also fixed:**
- Off days no longer show drive/fly buttons
- Venue display in route table — proper font size and color, no stray em dashes

---

### Phase 7D — Product Naming, Feature Flags & Branding ✅ COMPLETE

#### Feature Flag System
DIY is now properly gated as TourRouter-lite. Same codebase, different experience.

- **`lib/tourrouter/featureFlags.ts`** — DIY_FLAGS and TOURROUTER_FLAGS defined
- **`FeatureFlagProvider`** — React context, detects hostname, provides flags
- **Gates applied to all TourRouter-only features:**

| Feature | DIY | TourRouter |
|---|---|---|
| AI Intake (drop zone) | ✅ | ✅ |
| Settlement system | ❌ | ✅ |
| Personnel & pay | ❌ | ✅ |
| Guest list | ❌ | ✅ |
| Deposit tracking | ❌ | ✅ |
| Advance automation | ❌ | ✅ |
| Commissions | ❌ | ✅ |
| Multi-vehicle | ❌ | ✅ |
| Finance layer & P&L | ❌ | ✅ |
| Multi-tour dashboard | ❌ | ✅ |
| Contact intelligence | ❌ | ✅ |
| Crew access / Road App | ❌ | ✅ |
| Advance sheet PDF | ❌ | ✅ |
| Shareable reports | ❌ | ✅ |
| Deal types (14 types) | ❌ | ✅ |

- DIY financials page shows simplified 3-card view with upgrade CTA
- Multi-tour dashboard shows upgrade message for DIY users

#### Subdomain-Aware Branding
- Login page dynamically shows product name per subdomain
- All dashboard headers update: "LOCALIZER" / "TOURROUTER." / "DIY"
- Cross-product nav links hidden appropriately (DIY users don't see "← Localizer" links)
- Billing gate text adapts per product

#### Landing Page
- Animated wordmark changed from "Localizer." to **"HWY61 LABS"**
- Same scrolling venue data animation, same look

#### Bug Fixes
- Login page email input overflow fixed (was stretching outside container)

---

## Current State of All Subdomains

| URL | Status | What It Shows |
|---|---|---|
| `hwy61labs.com` | ✅ Live | Marketing/showcase (HWY61 LABS wordmark) |
| `localizer.hwy61labs.com` | ✅ Live | Localizer app (login → dashboard) |
| `tourrouter.hwy61labs.com` | ✅ Live | TourRouter app (full features) |
| `diy.hwy61labs.com` | ✅ Live | DIY app (gated features) |
| `localizer.hwy61.ai` | ✅ Live | Legacy — still works, landing page + app |

---

## Known Remaining Items

### Phase 7D (minor polish)
- Post-login redirect on tourrouter/diy subdomains lands on `/dashboard` instead of `/dashboard/routing` — needs auth callback fix
- Mobile responsiveness pass — all pages need phone testing
- Deal type selector for DIY — currently shows all 14, should show flat guarantee only

### Phase 7C — Stripe Restructuring
- **Blocked on EIN** — cannot create new Stripe products until obtained
- Old products to archive, 20 new products to create (monthly + annual)
- Trial → grace period → lockout flow to build

### Phases 7E–7M (remaining)
- 7E: Road App (React Native/Expo, 2-3 weeks)
- 7F: Notifications (email expansion, in-app bell, push)
- 7G: PostHog analytics
- 7H: Onboarding wizard + demo tour
- 7I: Beta invite infrastructure
- 7J: Support infrastructure (FAQ, Claude agent, chat widget)
- 7K: Marketing site pages (product pages, pricing page)
- 7L: Legal updates (ToS, Privacy Policy for new domain)
- 7M: Final pre-launch QA + beta

---

## Tech Decisions Made Today

1. **DNS at Vercel** (not Cloudflare) — simplest for multi-subdomain setup
2. **ImprovMX** for email forwarding — free, works alongside Resend
3. **Mapbox data everywhere** — no haversine in any user-facing output, same real data in UI and exports
4. **Feature flags by hostname** — `diy.hwy61labs.com` gets DIY flags, clean separation without database lookup
5. **Old domain kept active** — `localizer.hwy61.ai` still works, redirect strategy TBD with Tim
