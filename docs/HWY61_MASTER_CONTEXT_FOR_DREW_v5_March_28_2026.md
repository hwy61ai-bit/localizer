# HWY61 — Complete Build Context for Drew
**Version:** 5.0 — Updated March 28, 2026
**Last updated:** March 28, 2026
**Prepared by:** Tim (product) + Claude (synthesis)
**How to use:** Paste this entire document at the start of any Claude Code session. It contains everything needed to build any part of the HWY61 platform correctly, consistently, and without contradicting what already exists.

**This document supersedes v4 and all previous context documents.** Major changes in v5: product lineup simplified to three core products, pricing restructured, domain moving to hwy61labs.com, Road App restored as native iOS/Android build in Phase 7, Mapbox integration added as high priority, onboarding/trial/notification/support systems defined.

---

## Part 1 — What We're Building and Why

HWY61 is the first complete operating system for the touring music industry. The goal is simple: every person involved in a touring act — from the booking agent routing offers to the band member checking their van call — has a purpose-built experience inside one platform that shares one database.

**The company:** HWY61 Labs. Everything lives under this roof. Domain: hwy61labs.com.

**The north star:** A touring act starts with a blank calendar and ends with a fully settled tour — every offer tracked, every show routed, every advance sent and confirmed, every settlement verified, every person paid, every document filed — without any other tool, spreadsheet, email chain, or math done by hand.

**The market:** Sub-5,000 capacity venues. Club touring through theater level. Bands in vans through acts on buses with full production crews. This is the most underserved segment in touring software.

**The moat:** The system gets smarter with every user. Shared venue database, alias library, contact intelligence, promoter track records — all built from real user data that competitors cannot replicate without years of adoption.

---

## Part 2 — The Product Architecture

### Three Products at Launch

| Product | Users | Core Function | Price |
|---|---|---|---|
| **Localizer** | Marketing, manager | Tour marketing automation | $29–$139/mo |
| **TourRouter** | Manager, TM, BM, band, crew | Complete touring OS — routing, advancing, settlement, finance, personnel, guest list, crew access | $49–$179/mo |
| **DIY** | Self-managed acts | Limited version of TourRouter — basic routing, budgeting, day sheets, Universal AI Intake | $19/mo |

**Key relationships:**
- DIY is TourRouter with feature flags turned off. Same codebase, same database, same schema. Users upgrade from DIY to TourRouter by changing their subscription — feature flags flip, no data migration.
- The Road App is a free native iOS/Android app for crew. It reads from the same database as TourRouter but only exposes non-financial data. It is NOT a feature inside the web app — it is a standalone download from the App Store and Play Store.
- Localizer is a separate product that can be purchased standalone or bundled with TourRouter.

### Deferred Products (Not in First Launch)
- **HWY61 Agency** — booking agent operating system. Future add-on.
- **HWY61 Merch** — inventory and settlement tracking. Future add-on.

These are not on the marketing site, not in Stripe, and not in Drew's current build scope.

---

## Part 3 — Pricing

### Monthly Pricing

| Product | Basic | Pro | Agency |
|---|---|---|---|
| **Localizer** | $29/mo (1 artist) | $69/mo (up to 5 artists) | $139/mo (up to 12 artists) |
| **TourRouter** | $49/mo (1 artist) | $99/mo (up to 5 artists) | $179/mo (up to 12 artists) |
| **DIY** | $19/mo (flat, one tier) | — | — |
| **Road App** | Free (always) | — | — |

### Bundle Pricing (Localizer + TourRouter)

| Tier | Separate | Bundle | Savings |
|---|---|---|---|
| Basic | $78/mo | **$59/mo** | $19/mo saved |
| Pro | $168/mo | **$139/mo** | $29/mo saved |
| Agency | $318/mo | **$249/mo** | $69/mo saved |

### Annual Pricing (2 Months Free — Pay for 10, Get 12)

| Product | Monthly | Annual |
|---|---|---|
| DIY | $19/mo | $190/year |
| Localizer Basic | $29/mo | $290/year |
| Localizer Pro | $69/mo | $690/year |
| Localizer Agency | $139/mo | $1,390/year |
| TourRouter Basic | $49/mo | $490/year |
| TourRouter Pro | $99/mo | $990/year |
| TourRouter Agency | $179/mo | $1,790/year |
| Bundle Basic | $59/mo | $590/year |
| Bundle Pro | $139/mo | $1,390/year |
| Bundle Agency | $249/mo | $2,490/year |

### Tier Differentiator
All tiers across Localizer and TourRouter are based on **number of artists on the account**: Basic = 1, Pro = up to 5, Agency = up to 12. Consistent everywhere.

### 7-Day Free Trial
All paid products include a 7-day free trial with full feature access. After 7 days, if the user hasn't subscribed, they enter a **14-day read-only grace period** — they can view all their data but can't edit or create. After the grace period, the account is locked until they subscribe. **Data is preserved the entire time. Nobody loses work.**

### Billing Behavior
- **Upgrade (e.g., DIY → TourRouter, Basic → Pro):** Immediate access change. Stripe prorates.
- **Downgrade:** Immediate access change. Features gated by flags are immediately hidden. Data is preserved but inaccessible until they upgrade again.
- **Cancellation:** User can export everything (full CSV/PDF export of all data) before their access ends. Data preserved for 90 days in case they resubscribe.

### Stripe Products to Create (Replace All Old Products)

Archive old products:
- TourRouter Standalone ($29) — ARCHIVE
- TourRouter Add-on ($20) — ARCHIVE
- TourRouter Add-on Agency ($30) — ARCHIVE
- Localizer Basic ($39) — ARCHIVE (price changed to $29)

Create new products (monthly + annual for each):
```
STRIPE_PRICE_DIY_MONTHLY                    $19/mo
STRIPE_PRICE_DIY_ANNUAL                     $190/year

STRIPE_PRICE_LOCALIZER_BASIC_MONTHLY        $29/mo
STRIPE_PRICE_LOCALIZER_BASIC_ANNUAL         $290/year
STRIPE_PRICE_LOCALIZER_PRO_MONTHLY          $69/mo
STRIPE_PRICE_LOCALIZER_PRO_ANNUAL           $690/year
STRIPE_PRICE_LOCALIZER_AGENCY_MONTHLY       $139/mo
STRIPE_PRICE_LOCALIZER_AGENCY_ANNUAL        $1390/year

STRIPE_PRICE_TOURROUTER_BASIC_MONTHLY       $49/mo
STRIPE_PRICE_TOURROUTER_BASIC_ANNUAL        $490/year
STRIPE_PRICE_TOURROUTER_PRO_MONTHLY         $99/mo
STRIPE_PRICE_TOURROUTER_PRO_ANNUAL          $990/year
STRIPE_PRICE_TOURROUTER_AGENCY_MONTHLY      $179/mo
STRIPE_PRICE_TOURROUTER_AGENCY_ANNUAL       $1790/year

STRIPE_PRICE_BUNDLE_BASIC_MONTHLY           $59/mo
STRIPE_PRICE_BUNDLE_BASIC_ANNUAL            $590/year
STRIPE_PRICE_BUNDLE_PRO_MONTHLY             $139/mo
STRIPE_PRICE_BUNDLE_PRO_ANNUAL              $1390/year
STRIPE_PRICE_BUNDLE_AGENCY_MONTHLY          $249/mo
STRIPE_PRICE_BUNDLE_AGENCY_ANNUAL           $2490/year
```

All products: 7-day free trial enabled.

---

## Part 4 — Domain Structure

### The New Domain: hwy61labs.com
Purchased from Squarespace. This replaces hwy61.ai as the primary domain for everything.

### Marketing Site (Public-Facing)
```
hwy61labs.com                    — Front door, full platform pitch, pricing, all products
hwy61labs.com/localizer          — Localizer product page
hwy61labs.com/tourrouter         — TourRouter product page
hwy61labs.com/diy                — DIY product page
hwy61labs.com/pricing            — Full pricing page with bundles and annual options
```

### App Subdomains
```
localizer.hwy61labs.com          — Localizer app
tourrouter.hwy61labs.com         — TourRouter app
diy.hwy61labs.com                — DIY app
```

### Email
```
support@hwy61labs.com            — Customer support
dmca@hwy61labs.com               — DMCA agent
privacy@hwy61labs.com            — Privacy inquiries
```
Transactional email (magic links, advance emails, notifications) sent from @hwy61labs.com via Resend.

### Retiring hwy61.ai
Decision point for Drew: redirect hwy61.ai → hwy61labs.com, or keep both active during a transition period, or let it expire. Evaluate and decide based on current traffic and any existing links in the wild.

---

## Part 5 — Domain Setup Walkthrough for Drew

This is the complete step-by-step for getting hwy61labs.com wired up. Several decision points are flagged — evaluate the options and choose what works best, or check with Tim.

### Step 1: DNS Management — Choose Where to Manage DNS

The domain was purchased on Squarespace. You have three options for DNS management:

**Option A: Transfer DNS to Vercel (Recommended)**
- Pros: Simplest setup, automatic SSL for all subdomains, Vercel manages everything, no manual DNS record management for deployments
- Cons: DNS and hosting coupled to one provider
- How: In Vercel dashboard → Settings → Domains → Add hwy61labs.com → Vercel provides nameservers → Go to Squarespace domain settings → Change nameservers to Vercel's

**Option B: Transfer DNS to Cloudflare (Free)**
- Pros: Free CDN layer, DDoS protection, fast DNS, analytics, more control
- Cons: Extra layer of configuration, need to manage DNS records manually
- How: Create Cloudflare account → Add site → Cloudflare provides nameservers → Change nameservers in Squarespace → Add DNS records pointing to Vercel

**Option C: Keep DNS at Squarespace**
- Pros: No migration needed
- Cons: Squarespace DNS management is limited, slower propagation, harder to manage multiple subdomains
- How: Add CNAME/A records in Squarespace pointing to Vercel
- Not recommended for a multi-subdomain setup

### Step 2: Add Domain to Vercel

1. In Vercel dashboard → Project Settings → Domains
2. Add the following domains:
```
hwy61labs.com                  → main marketing site
www.hwy61labs.com              → redirect to hwy61labs.com
localizer.hwy61labs.com        → Localizer app
tourrouter.hwy61labs.com       → TourRouter app
diy.hwy61labs.com              → DIY app
```
3. Vercel will provide the DNS records needed (CNAME or A records)
4. If using Vercel DNS (Option A), this is automatic
5. If using Cloudflare or Squarespace DNS, add the records manually
6. Verify SSL certificates are issued for all subdomains (automatic on Vercel, may take a few minutes)

### Step 3: Next.js Middleware for Hostname-Based Routing

The single Next.js deployment needs to serve different experiences based on which subdomain the request hits. Create or update middleware:

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // Marketing site: hwy61labs.com (no subdomain)
  if (hostname === 'hwy61labs.com' || hostname === 'www.hwy61labs.com') {
    // Serve marketing/showcase pages
    // Rewrite to /showcase routes internally if needed
  }

  // Localizer app: localizer.hwy61labs.com
  if (hostname === 'localizer.hwy61labs.com') {
    // Serve Localizer dashboard
  }

  // TourRouter app: tourrouter.hwy61labs.com
  if (hostname === 'tourrouter.hwy61labs.com') {
    // Serve TourRouter dashboard (full features)
  }

  // DIY app: diy.hwy61labs.com
  if (hostname === 'diy.hwy61labs.com') {
    // Serve TourRouter dashboard with DIY feature flags
  }

  return NextResponse.next();
}
```

Note: DIY and TourRouter hit the same codebase — the middleware sets a context flag that tells the UI which feature set to enable. The actual feature gating happens via `tour.feature_flags` and subscription tier checks.

### Step 4: Supabase Auth — Cross-Subdomain Cookies

This is critical. Auth needs to work across all subdomains.

1. In your Supabase client initialization, set the cookie domain to the parent domain:
```typescript
// lib/supabase/client.ts
const supabase = createBrowserSupabaseClient({
  cookieOptions: {
    domain: '.hwy61labs.com',  // Note the leading dot — this allows all subdomains
    path: '/',
    sameSite: 'lax',
    secure: true,
  }
});
```

2. Update Supabase Auth redirect URLs in the Supabase dashboard:
```
https://localizer.hwy61labs.com/auth/callback
https://tourrouter.hwy61labs.com/auth/callback
https://diy.hwy61labs.com/auth/callback
https://hwy61labs.com/auth/callback
```

3. Remove old redirect URLs:
```
https://localizer.hwy61.ai/auth/callback
https://localizer-two.vercel.app/auth/callback
```

### Step 5: Resend — Domain Verification for Email

1. In Resend dashboard → Domains → Add domain → hwy61labs.com
2. Resend provides DNS records (TXT for verification, CNAME/MX for email)
3. Add these records in your DNS provider (Vercel, Cloudflare, or Squarespace)
4. Verify domain in Resend
5. Update all email sending code to use @hwy61labs.com addresses
6. Decision point: keep @hwy61.ai active during transition? Or switch immediately?

### Step 6: Email Forwarding

Set up email forwarding for:
```
support@hwy61labs.com    → your personal/team inbox
dmca@hwy61labs.com       → your personal/team inbox
privacy@hwy61labs.com    → your personal/team inbox
```

How to do this depends on DNS provider:
- **Vercel DNS:** Vercel doesn't handle email. Use a service like ImprovMX (free tier) or Cloudflare Email Routing
- **Cloudflare DNS:** Built-in email routing — free, easy to configure
- **Squarespace DNS:** Squarespace supports email forwarding natively

### Step 7: Environment Variables Update

Update all environment variables that reference the old domain:
```
NEXT_PUBLIC_APP_URL=https://hwy61labs.com
NEXT_PUBLIC_LOCALIZER_URL=https://localizer.hwy61labs.com
NEXT_PUBLIC_TOURROUTER_URL=https://tourrouter.hwy61labs.com
NEXT_PUBLIC_DIY_URL=https://diy.hwy61labs.com
```

Search the entire codebase for any hardcoded references to:
- `hwy61.ai`
- `localizer-two.vercel.app`
- `localizer.hwy61.ai`

Replace all with the new hwy61labs.com equivalents.

### Step 8: hwy61.ai Disposition

Decision point — evaluate and choose:

**Option A: Redirect everything**
Set up 301 redirects from hwy61.ai → hwy61labs.com and *.hwy61.ai → corresponding *.hwy61labs.com subdomains. Keep the domain registered so nobody else takes it.

**Option B: Keep active during transition**
Run both domains in parallel for 30-60 days. Both point to the same deployment. Then switch to redirects.

**Option C: Let it expire**
Only if there are no links in the wild pointing to hwy61.ai. Check Google Search Console, any published materials, social media profiles, email footers, DMCA registration.

Recommendation: Option A or B. Never let a domain you've used publicly expire.

### Step 9: Legal Updates

- Update Terms of Service to reference hwy61labs.com and current product names (Localizer, TourRouter, DIY)
- Update Privacy Policy to reference hwy61labs.com
- Check if DMCA agent registration at copyright.gov needs domain update
- Update effective date on legal documents

### Step 10: Verify Everything

After setup, verify:
- [ ] hwy61labs.com loads the marketing site
- [ ] localizer.hwy61labs.com loads the Localizer app
- [ ] tourrouter.hwy61labs.com loads the TourRouter app
- [ ] diy.hwy61labs.com loads the DIY app (TourRouter with limited features)
- [ ] SSL certificates active on all subdomains (check for padlock icon)
- [ ] Magic link auth works — send from one subdomain, lands correctly
- [ ] Transactional emails send from @hwy61labs.com
- [ ] Email forwarding works for support@, dmca@, privacy@
- [ ] No broken links or references to old domain in the UI
- [ ] Stripe checkout redirects use new domain

---

## Part 6 — The Stack

```
Next.js 14 App Router + TypeScript
Supabase (PostgreSQL + Auth + Storage + RLS)
Vercel Pro (hosting + serverless functions)
Cloudinary Plus (image CDN + rendering)
Resend Pro (transactional email + webhooks)
Anthropic API (Claude — document parsing + automation)
Mapbox (geocoding + directions — replacing haversine)
React Native + Expo (iOS/Android Road App)
Stripe (billing)
PostHog (product analytics)
Twilio (internal SMS escalation — Tim + Drew notifications only)
```

**Repo:** https://github.com/hwy61ai-bit/localizer.git
**Production (current):** https://localizer.hwy61.ai (migrating to hwy61labs.com)
**Auth:** Supabase magic link OTP via Resend — no passwords, ever
**Deployment:** `npx vercel --prod`

### Environment Variables (Required)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
RESEND_API_KEY
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
MAPBOX_ACCESS_TOKEN
POSTHOG_API_KEY
POSTHOG_HOST
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
NEXT_PUBLIC_APP_URL                   (https://hwy61labs.com)
NEXT_PUBLIC_LOCALIZER_URL             (https://localizer.hwy61labs.com)
NEXT_PUBLIC_TOURROUTER_URL            (https://tourrouter.hwy61labs.com)
NEXT_PUBLIC_DIY_URL                   (https://diy.hwy61labs.com)
```

Plus all Stripe price ID environment variables listed in Part 3.

---

## Part 7 — What's Already Built (March 28, 2026)

### Phases 1–6 Complete

Drew completed Phases 1 through 6 of the build plan. Full details in `HWY61_STATUS_FOR_TIM_March_28_2026.md`. Summary:

**Phase 1 — Ship Localizer:** ✅ Complete. ToS, Privacy Policy, Stripe billing, custom domain, Resend Pro, DMCA registration, production deployed.

**Phase 2 — TourRouter Stabilization:** ✅ Complete. Save/load state, full UI (Add Show, Delete, Vehicle Settings, Drawer editing), fuel calculation fixed, real Stripe billing gate with admin bypass, 45 new columns on tour_shows, 5 new tables with RLS, 3 storage buckets.

**Phase 3 — Band Must-Haves:** ✅ Complete. 14 deal types, settlement panel, personnel pay (8 structures with pct_net circular dependency resolution), roster management, multi-vehicle (54 vehicles), blanket expense toggle, Master Artist Profile (10 sections), hotel management, guest list, deposit tracking, day sheet PDF, advance sheet PDF.

**Phase 4 — AI Differentiators:** ✅ Complete. Universal AI Intake (global drop zone, 4-layer parsing, 9 document type prompts), advance automation engine (full state machine, daily cron, 4 email templates, Resend webhooks, daily digest), alias library (3-layer lookup, batch Claude mapping, human confirmation, global promotion), venue confirmation portal. ~54 real-world test documents across 11 categories.

**Phase 5 — Finance Layer:** ✅ Complete. Commission engine (9 types), income waterfall UI, multi-tour finance dashboard, end-of-tour report (PDF + shareable token).

**Phase 6 — Contact Intelligence:** ✅ Complete. Contact API routes, anonymous flagging, contacts page UI, contact autocomplete hook.

### Database Tables (Already Created)
- `tours_routing` — routing tour records
- `tour_shows` — individual show dates (90+ columns)
- `shared_venues` — crowd-sourced venue database
- `shared_contacts` — crowd-sourced contact directory
- `account_contacts` — private contact data per org
- `field_aliases` — alias library for document intelligence
- `finance_report_links` — shareable finance report tokens
- `intake_documents` — document intake tracking
- `flight_price_cache` — cached AI flight price estimates
- `guest_list` — per-show guest list with pass types
- `tour_expenses` — actual expense logging
- `advance_emails` — advance email tracking

**View:** `tour_shows_crew` — strips all financial data for safe crew access

### TypeScript Modules (Already Built — `lib/tourrouter/`)
| Module | Key Contents |
|---|---|
| `constants.ts` | CITY_COORDS (~170 cities), CITY_AIRPORTS (~120), AIRPORT_COORDS, vehicle fuel efficiency |
| `geography.ts` | `haversine()`, `getRoadKm()`, `estimateDriveHours()`, `isImperialCountry()`, `getCityCoords()` |
| `currency.ts` | `getRate()`, `toUSD()`, `fmtUSD()`, `fmtDist()` |
| `parsers.ts` | `parseDate()`, `parseOffer()`, `cellStr()`, `normalizeCountry()` |
| `financials.ts` | `calcTourFinancials()` — single source of truth for all financial calculations |
| `calculateShowIncome.ts` | 14 deal types fully implemented |
| `flights.ts` | `getAirport()`, `buildFlightLinks()` |
| `exports.ts` | `buildExportRows()` — shared row builder for all export formats |
| `columnMapper.ts` | `FIELD_ALIASES` and `bestGuess()` for auto-matching import columns |

### API Routes (Already Built — `app/api/tourrouter/`)
```
tours/                    GET, POST
tours/[tourId]/           GET, PUT, DELETE
tours/[tourId]/shows/     POST (bulk insert)
tours/[tourId]/shows/[showId]/  PUT, DELETE
import/csv/               POST
import/pdf/               POST (Anthropic API)
intake/                   POST (Universal AI Intake)
flight-price/             POST (AI + caching)
currency-rates/           GET (frankfurter.app)
venues/                   GET, POST
venues/[venueId]/flag/    POST
advance/send/             POST
advance/[token]/          GET, PUT (public form)
advance/status/           GET
guest-list/               GET, POST
guest-list/[entryId]/     PUT, DELETE
expenses/                 GET, POST
expenses/[expenseId]/     PUT, DELETE
tours/[tourId]/export/csv/    GET
tours/[tourId]/export/excel/  GET
tours/[tourId]/export/pdf/    GET
tours/[tourId]/push-to-localizer/  POST
tours/[tourId]/finance/       GET
tours/[tourId]/finance/report/  GET, POST
finance/report/[token]/       GET (public shareable)
localizer/tours/          GET
localizer/events/[tourId]/  GET
contacts/                 GET, POST
contacts/[contactId]/     PUT, DELETE
contacts/[contactId]/flag/  POST
billing/checkout/         POST
billing/portal/           POST
billing/status/           GET
```

### UI Pages (Already Built)
| Page | Route | Status |
|---|---|---|
| Tour List | `/dashboard/routing` | Built |
| Route Table | `/dashboard/routing/[tourId]` | Built |
| Import | `/dashboard/routing/[tourId]/import` | Built |
| Financials | `/dashboard/routing/[tourId]/financials` | Built |
| Export | `/dashboard/routing/[tourId]/export` | Built |
| Finance Dashboard | `/dashboard/finance` | Built |
| Contacts | `/dashboard/contacts` | Built |
| Public Advance Form | `/advance/[token]` | Built |
| Public Finance Report | `/report/[token]` | Built |
| Showcase Hub (placeholder) | `/showcase` | Structural placeholder, needs redesign |

---

## Part 8 — Mapbox Integration (HIGH PRIORITY)

### The Problem
The current system uses a hardcoded `CITY_COORDS` lookup table (~170 cities) and haversine distance estimation with a road multiplier. This produces inaccurate drive times and fails entirely for cities not in the list. Real-world routing through mountain passes, highways, and rural roads is significantly different from straight-line estimates.

### The Fix — Two APIs

**Mapbox Geocoding API** — converts city names to lat/lng coordinates
- Replaces the hardcoded CITY_COORDS limitation
- Any city in the world works, not just 170 pre-loaded ones

**Mapbox Directions API** — returns actual driving distance and time between two points
- Replaces haversine → getRoadKm → estimateDriveHours entirely
- Real road distance, real drive time, accounting for highways, terrain, speed limits

### The Pattern
```typescript
// 1. Get coordinates for both cities
//    Check CITY_COORDS first (free, instant)
//    If miss → call Mapbox Geocoding API
//    Cache result in database

// 2. Get driving directions between the two coordinate pairs
//    Check cache first (free, instant)
//    If miss → call Mapbox Directions API
//    Cache result in database (city_pair + distance_km + drive_hours)

// 3. Return real distance and drive time
//    Every subsequent lookup for this city pair is free and instant
```

### New Database Table
```sql
CREATE TABLE drive_cache (
  id              uuid primary key default gen_random_uuid(),
  origin_city     text not null,
  origin_lat      numeric not null,
  origin_lng      numeric not null,
  dest_city       text not null,
  dest_lat        numeric not null,
  dest_lng        numeric not null,
  distance_km     numeric not null,
  distance_miles  numeric not null,
  drive_seconds   integer not null,
  drive_hours     numeric not null,
  route_summary   text,              -- e.g., "I-35 S → I-10 W"
  fetched_at      timestamptz default now(),
  UNIQUE(origin_city, dest_city)
);

-- Also add a geocode cache
CREATE TABLE geocode_cache (
  id              uuid primary key default gen_random_uuid(),
  city_input      text not null unique,  -- the raw city string searched
  lat             numeric not null,
  lng             numeric not null,
  formatted_name  text,                  -- Mapbox's canonical name
  fetched_at      timestamptz default now()
);
```

### Mapbox Free Tier
- 100,000 geocoding requests/month
- 100,000 directions requests/month
- More than sufficient for current scale
- With caching, actual API calls will be a tiny fraction of total lookups

### Environment Variable
```
MAPBOX_ACCESS_TOKEN=pk.xxxxx
```

### What Gets Replaced
- `haversine()` — still useful for quick radius checks, but no longer used for drive time
- `getRoadKm()` — replaced by cached Mapbox Directions distance
- `estimateDriveHours()` — replaced by cached Mapbox Directions duration
- `CITY_COORDS` — kept as first-check fallback for geocoding, but no longer the limiting factor

### Priority
**This is a pre-launch requirement.** Inaccurate drive times undermine the core routing and budgeting functionality. Build this before the showcase site or any polish work.

---

## Part 9 — Database Schema (Complete)

### Existing Tables (Localizer — Do Not Modify Without Care)
```sql
orgs              -- multi-tenant root; add new columns here carefully
org_members       -- user ↔ org relationship + role
artists           -- band profiles; default_commissions and default_roster JSONB cols added
tours             -- Localizer marketing tours (NOT routing tours)
events            -- Localizer show dates
venue_links       -- tokenized sharing links
custom_fonts      -- org font uploads
crew_access       -- token-based crew access (no Supabase account needed)
```

### tours_routing (Full Schema)
```sql
CREATE TABLE tours_routing (
  id                    uuid primary key default gen_random_uuid(),
  org_id                uuid references orgs(id) on delete cascade,
  artist_id             uuid references artists(id),
  name                  text not null,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now(),
  vehicle_type          text,           -- 'van' | 'bus' | 'fly'
  pax                   integer,
  mpg                   numeric,
  fuel_price_usd        numeric,
  flight_threshold_h    numeric default 6,
  blanket_show_label    text,
  blanket_show_amount   numeric,
  blanket_off_label     text,
  blanket_off_amount    numeric,
  currency_rates        jsonb,
  leg_choices           jsonb,          -- { "3": "fly", "7": "fly" }
  localizer_tour_id     uuid references tours(id),
  default_roster        jsonb,
  tour_roster           jsonb,
  advance_config        jsonb,
  tour_commissions      jsonb,
  commission_visibility jsonb,
  feature_flags         jsonb,          -- { advancing, settlement, financeLayer, personnelPay, guestList, multiTour, aiIntake }
  image_url             text
);
```

### New Tables to Create (Beyond What's Already Built)
```sql
-- Drive time cache (Mapbox Directions)
CREATE TABLE drive_cache (
  id              uuid primary key default gen_random_uuid(),
  origin_city     text not null,
  origin_lat      numeric not null,
  origin_lng      numeric not null,
  dest_city       text not null,
  dest_lat        numeric not null,
  dest_lng        numeric not null,
  distance_km     numeric not null,
  distance_miles  numeric not null,
  drive_seconds   integer not null,
  drive_hours     numeric not null,
  route_summary   text,
  fetched_at      timestamptz default now(),
  UNIQUE(origin_city, dest_city)
);

-- Geocode cache (Mapbox Geocoding)
CREATE TABLE geocode_cache (
  id              uuid primary key default gen_random_uuid(),
  city_input      text not null unique,
  lat             numeric not null,
  lng             numeric not null,
  formatted_name  text,
  fetched_at      timestamptz default now()
);

-- In-app notifications
CREATE TABLE notifications (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid references orgs(id) on delete cascade,
  user_id         uuid references auth.users(id),
  type            text not null,       -- 'advance_submitted' | 'settlement_review' | 'schedule_change' | 'escalation' | etc.
  title           text not null,
  body            text,
  link            text,                -- deep link to relevant page
  read            boolean default false,
  created_at      timestamptz default now()
);
CREATE INDEX ON notifications(user_id, read, created_at DESC);

-- Beta invite system
CREATE TABLE beta_invites (
  id              uuid primary key default gen_random_uuid(),
  email           text not null unique,
  invite_code     text not null unique,
  status          text default 'pending',  -- 'pending' | 'accepted' | 'expired'
  invited_by      text,
  created_at      timestamptz default now(),
  accepted_at     timestamptz
);
```

### RLS Policy Patterns
**Every new table needs RLS. Always.** Missing RLS returns empty results with no error — the silent killer.

```sql
-- Standard org-level RLS pattern (use this for most tables)
ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_access" ON your_table
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- User-level RLS (for notifications)
CREATE POLICY "user_access" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- Public read with authenticated write (for caches)
CREATE POLICY "public_read" ON drive_cache FOR SELECT USING (true);
CREATE POLICY "authenticated_insert" ON drive_cache FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Crew access: API routes using crew tokens bypass RLS with service role key
-- NEVER use anon key for crew routes — use service_role with manual org check

-- Financial data exclusion: never add financial fields to crew views
-- tour_shows_crew view: explicitly SELECT only non-financial columns
```

### Supabase Storage Buckets
```
tour-images/          -- tour tile photos: {org_id}/{tour_id}.jpg
tour-assets/          -- band assets: {org_id}/{artist_id}/{asset_type}.{ext}
tour-documents/       -- intake documents: {org_id}/{tour_id}/{show_id}/{timestamp}_{type}.pdf
tour-expenses/        -- expense receipts: {org_id}/{tour_id}/{expense_id}.jpg
tour-exports/         -- generated exports: {org_id}/{tour_id}/{timestamp}_{type}.pdf
```

---

## Part 10 — DIY Feature Set

DIY is TourRouter with feature flags. Same codebase, same schema.

### What DIY Includes ($19/mo)

**Routing & Planning**
- Tour creation and show management (add/edit/delete dates)
- Drive time and distance calculations (via Mapbox)
- Basic vehicle settings (one vehicle)
- Map view of the route
- CSV import for dates

**Basic Budgeting**
- Guarantee/offer amounts per show
- Basic expense tracking (gas, hotels, food)
- Simple tour budget summary — total income vs total expenses, net number
- Per diem calculator

**Day-to-Day**
- Day sheet generation (single and batch)
- Hotel info per show (name, address, confirmation)
- Basic contact fields per show (venue contact, promoter)

**Universal AI Intake**
- Global drop zone — drop any document, Claude parses it
- Document type detection
- Field population with staged review
- All 9 document type parsers

**Export**
- CSV export of tour dates
- Day sheet PDF export

### What Requires TourRouter (Upgrade Triggers)

- Full deal types engine (14 deal types — DIY gets flat guarantee only)
- Settlement system (projected vs actual)
- Personnel & pay engine
- Roster management
- Commission engine and waterfall
- Finance layer and P&L
- Advance automation engine
- Guest list management
- Deposit tracking
- Multi-vehicle support
- Advance sheet PDF
- End-of-tour report
- Shareable finance reports
- Contact intelligence (autocomplete, flagging, shared database)
- Crew access / Road App integration
- Multi-tour dashboard

### Feature Flags Implementation
```typescript
const DIY_FLAGS = {
  aiIntake: true,          // Universal AI Intake is available in DIY
  advancing: false,
  settlement: false,
  financeLayer: false,
  personnelPay: false,
  guestList: false,
  multiTour: false,
  multiVehicle: false,
  dealTypes: false,        // DIY gets flat guarantee only
  contactIntelligence: false,
  crewAccess: false,
  advanceSheetPdf: false,
  depositTracking: false,
  commissions: false,
  shareableReports: false,
};

const TOURROUTER_FLAGS = {
  aiIntake: true,
  advancing: true,
  settlement: true,
  financeLayer: true,
  personnelPay: true,
  guestList: true,
  multiTour: true,
  multiVehicle: true,
  dealTypes: true,
  contactIntelligence: true,
  crewAccess: true,
  advanceSheetPdf: true,
  depositTracking: true,
  commissions: true,
  shareableReports: true,
};

// Check in every page/component that touches gated features:
const flags = tour.feature_flags ?? TOURROUTER_FLAGS;
if (!flags.settlement) return null;
```

**The philosophy: DIY plans the tour. TourRouter runs it.** The moment a band needs to settle a show, pay people, track commissions, or automate advances — that's the upgrade moment.

---

## Part 11 — The v35 Engineering Rules (Never Violate)

These bugs were discovered the hard way in v35 and fixed. Do not revert them.

1. **`parseDate()` always uses `new Date(year, month, day)`.** Never `new Date(string)` — timezone shifts corrupt dates.

2. **Excel imports: always `raw:true, cellDates:true`.** `raw:false` causes locale string parsing failures.

3. **`legCtry` not `legCountry` in renderTable fuel block.** Variable name collision with outer scope. Do not rename.

4. **`legChoices` key = destination show index in `tourShows[]`.** Consistent everywhere. Never use show ID as key.

5. **`renderAll()` must call both table AND financials.** Calling one without the other leaves UI out of sync.

6. **`calcTourFinancials()` is the single source of truth.** No inline financial calculations anywhere. Ever.

---

## Part 12 — Core Calculation Functions

### calcTourFinancials(params)
The financial brain. Returns everything. All stat cards, all exports, all P&L displays read from this.

```typescript
interface TourFinancialsParams {
  shows: TourShow[];
  roster: RosterMember[];
  perDiem: PerDiemConfig;
  blanket: BlanketConfig;
  fuelPriceUSD: number;
  currencyRates: Record<string, number>;
  commissions: Commission[];
}

interface TourFinancialsResult {
  showDayCount: number;
  offDayCount: number;
  travelDayCount: number;
  loadInDayCount: number;
  weekCount: number;
  zeroShowWeeks: number;
  totalGuaranteesProjected: number;
  totalGuaranteesActual: number;
  totalBackendProjected: number;
  totalBackendActual: number;
  totalMerchProjected: number;
  totalMerchActual: number;
  grossIncomeProjected: number;
  grossIncomeActual: number;
  totalCommissions: number;
  totalCommissionsActual: number;
  commissionWaterfall: CommissionLineItem[];
  incomeAfterCommissions: number;
  totalFuelCost: number;
  totalHotelCost: number;
  totalFlightCost: number;
  totalPersonnelBand: number;
  totalPersonnelCrew: number;
  totalPersonnel: number;
  totalPerDiems: number;
  totalDeposits: number;
  totalExpenses: number;
  netToArtistProjected: number;
  netToArtistActual: number;
  shows: ShowFinancials[];
  brutals: number;
  totalMiles: number;
  totalDriveHours: number;
  avgDriveHours: number;
}
```

### calculateShowIncome(show, useActuals)
Per-show income calculation. Switch on `deal.dealType`. Never calculate deal income inline.

### pct_net Circular Dependency Resolution
```typescript
// ALWAYS in this order:
// 1. Calculate netIncome excluding all pct_net pay components
// 2. Compute pct_net components using that netIncome
// 3. Subtract them to get final net
// Same pattern applies to manager_pct_net commission type
```

---

## Part 13 — The Anthropic API Usage Patterns

### Standard API Call Structure
```typescript
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY!,
    'anthropic-version': '2023-06-01',
  },
  body: JSON.stringify({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }]
  })
});
```

### PDF Document Parsing (Base64)
```typescript
const base64 = Buffer.from(fileBuffer).toString('base64');
content: [
  { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
  { type: 'text', text: DEAL_MEMO_PROMPT_v2 }
]
```

### Batch Header Mapping
Send ALL unknown headers in ONE API call — never loop per header.

### Parsing Prompt Location
All prompts in `lib/tourrouter/prompts/`. Each is a function accepting context, returning a string. Never hardcode prompts inline.

### API Cost Tracking
Track Anthropic API usage per org. Log every API call with org_id, document_type, token count, and cost estimate. Surface this data in an admin dashboard so Tim can monitor spend patterns and identify heavy users.

---

## Part 14 — The Universal AI Intake System

Available in ALL products including DIY. One drop zone. Four steps. Every document.

### The Intake API Route
```
POST /api/tourrouter/intake
Body: { file: base64, fileType: string, fileName: string, tourId: string, showId?: string }
Returns: IntakeResult (see v4 doc for full interface)
```

### Confidence Thresholds
```
>= 0.95  → autoConfirmed
0.75-0.94 → reviewRequired
0.50-0.74 → confirmationRequired
< 0.50   → unmapped
PAYMENT AMOUNT → ALWAYS confirmationRequired regardless of confidence
```

### Where Data Routes After Parsing
```
settlement sheet    → tour_shows.settlement
box office report   → settlement.actualGrossTickets, .ticketTiers
hotel confirmation  → hotel_* fields
expense receipt     → tour_expenses
advance response    → advance_* and venue_* fields
deal memo           → creates/updates tour_shows records
contact list        → staged review → shared_contacts + account_contacts
co-headliner sheet  → co_headliner jsonb
```

---

## Part 15 — The Advance Automation Engine

### State Machine
```
not_started → Sent → Follow-Up 1 Sent → Follow-Up 2 Sent → Final Nudge Sent → Escalated
                                                                              ↘ Confirmed (any stage)
```

### Resend Webhook Handler
```
POST /api/webhooks/resend
Events: email.delivered, email.opened, email.clicked, email.bounced, email.complained
```

### Key Rules
- Daily cron, idempotent — check advance_emails before sending
- Auto-confirm check runs after EVERY field update, not just cron
- `advance_escalated = true` set once, never reset
- `advance_auto_stop = true` on show → skip entirely

---

## Part 16 — The Finance Layer

### Key Rule
The Finance Layer is a PRESENTATION layer. All numbers come from `calcTourFinancials()`. No new calculations.

### Commission Visibility
```typescript
// Always checked in API route — never rely on UI
const canSeeCommissions = tour.commission_visibility?.includes(userRole) ?? false;
if (!canSeeCommissions) {
  delete responseData.commissionWaterfall;
  delete responseData.commissionDetail;
}
```

---

## Part 17 — Contact Intelligence

### Opt-In Sharing
`orgs.contact_sharing_enabled` = true by default. Clearly explained at signup.

### Anonymous Flag System
- `account_contacts.my_flag = true` (private)
- `shared_contacts.anonymous_flag_count` increment only
- NEVER store which orgs flagged
- Warning displayed when count >= 3

---

## Part 18 — The Road App (React Native / Expo)

### What It Is
A free native iOS and Android app for band and crew members. Download from App Store / Play Store, enter a tour code, see your schedule. No financial data, ever.

### What Crew Sees
- Today's show: van call, venue, load-in, soundcheck, doors, showtime, curfew
- Calendar of all tour dates
- Per-show details: venue address, contacts, production notes, parking
- Hotel info: name, address, confirmation, check-in/out
- Drive time to next city
- Day sheets
- Own guest list submissions (if enabled by TM)

### What Crew Never Sees
- Offers, guarantees, deals
- Settlement data
- Personnel pay
- Commissions
- Deposits
- Finance layer, P&L — anything with a dollar sign tied to the business

### Auth Flow (Token-Based — No Supabase Account)
```typescript
// 1. TM generates tour code (6 chars) or invite link in web app
// 2. Code stored in crew_access table: { token, tour_id, org_id, show_ids[], role }
// 3. Crew enters code in Road App
// 4. App calls: POST /api/crew/auth { token }
// 5. Server validates token → returns crew session
// 6. App stores session in AsyncStorage
// 7. All subsequent requests include crew session in header
// 8. API routes use service_role key + manual org check (bypass RLS)
```

### Screens
```
HomeScreen        — today's show: van call, venue, load-in, soundcheck, doors, showtime, curfew
ShowDetailScreen  — full show info, production notes
CalendarScreen    — all tour dates
TravelScreen      — drive time, hotel info, flight info
SettingsScreen    — tour code entry, display preferences
```

### Offline Caching (Critical)
This is the killer feature that justifies a native app. Cache the full tour schedule, day sheets, and hotel info on first load using AsyncStorage. Update when connected. Crew can check everything they need in dead zones.

### Push Notifications
Schedule changes, van call reminders, day-of-show notifications. Expo Push Notifications service handles both iOS and Android from one codebase.

### Build and Submit

**Developer Accounts:**
- Apple Developer: $99/year
- Google Play Developer: $25 one-time

**Build Process:**
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform all
eas submit
```

**App Store Review Requirements:**
- Must feel native (not a web view wrapper) — native navigation, native lists, pull-to-refresh
- Provide a working demo tour code for the Apple reviewer
- Privacy policy required (update existing one to mention Road App)
- Offline functionality helps justify native app vs. mobile website
- First submission may take up to a week for review

**Build Sequence:**
1. Scaffold Expo project
2. Token auth flow
3. Five core screens
4. Crew-safe API routes (financial fields stripped at API level)
5. Offline caching with AsyncStorage
6. Push notification setup
7. Native UI polish
8. Create test tour with sample data for App Store review
9. Build with EAS, submit to both stores
10. Iterate on review feedback

### Timeline
2–3 weeks focused build, plus up to a week for App Store review.

---

## Part 19 — Onboarding and First-Run Experience

### New User Flow
When a new user signs up and first enters the app, they get choices:

1. **Guided setup wizard** — step-by-step walkthrough to create their first tour, add dates, drop a document
2. **Load demo tour** — optional, skippable. Pre-loaded with realistic fake data so they can explore a fully populated account before committing to entering their own data
3. **Tutorial videos** — accessible throughout the app, covering each core workflow

Meet the user where they are — some want hand-holding, some want to explore, some want to watch first.

### Demo Tour
- Pre-loaded for every new account but skippable with a clear "Skip — I'll start fresh" button
- Realistic fake data: ~15 show dates, mix of venues, populated hotel info, some settled shows, some pending advances
- Clearly labeled as demo data throughout
- User can delete the demo tour at any time
- Also serves as a sales tool during the trial period

### Tutorial Videos (Pre-Launch Requirement)
Short, specific videos covering each core workflow:
- Creating a tour and adding dates
- Dropping a document into AI Intake
- Using the routing map
- Running a settlement
- Generating day sheets
- Managing the advance pipeline
- Reading the finance dashboard

These videos need to be produced before launch. They live on the marketing site and are linked from within the app.

---

## Part 20 — Notifications

### Three Channels at Launch

**Email (via Resend)**
Already partially built for advance automation. Expand to all key events:
- Advance form submitted
- Settlement ready for review
- Schedule change on an active tour
- Trial expiring / grace period starting
- Weekly digest of tour activity

**In-App Notification Center**
- Bell icon in the app header
- Dropdown showing recent activity
- Unread count badge
- Click-through to relevant page
- Uses the `notifications` table (schema in Part 9)

**Push Notifications (Road App)**
- Schedule changes
- Van call reminders (morning of show day)
- Day-of-show info updates
- Via Expo Push Notifications

### Internal Escalation (Twilio SMS)
Not user-facing. When the Claude support agent can't handle a query or a customer explicitly asks for human help:
- SMS sent to Tim and Drew
- Email sent simultaneously
- Includes customer context and conversation summary

---

## Part 21 — Customer Support

### Tier 1 — Claude Support Agent
- Runs on a dedicated Mac Mini
- Trained on the complete FAQ/knowledge base, product docs, tutorial content
- Handles first-contact support via chat widget on hwy61labs.com (NOT inside the apps — keep apps clean)
- Available 24/7
- Answers how-to questions, troubleshooting, feature explanations, billing questions

### Tier 2 — Tim and Drew
- Claude escalates when it can't answer or user asks for a human
- Notification via SMS + email immediately
- Jump on chat or phone call

### FAQ / Knowledge Base (Pre-Launch Requirement)
Must be written before launch. This is what the Claude agent is trained on. Cover:
- Getting started guides for each product
- Common workflows
- Billing and subscription questions
- Troubleshooting common issues
- Feature explanations
- Data export and cancellation process

---

## Part 22 — Analytics

### PostHog (Launch Requirement)
Full product analytics from day one.

**Setup:** Drop in PostHog snippet, configure key events.

**Key Events to Track:**
- Account created
- Tour created
- Show added
- Document dropped (AI Intake used)
- Export generated
- Feature first used (settlement, advance, finance, etc.)
- Upgrade clicked
- Upgrade completed
- Trial started / expired / converted
- Page views and session duration
- Feature usage frequency

**Why This Matters:**
- Know which features drive upgrades from DIY to TourRouter
- Know where users drop off in onboarding
- Know which document types are most commonly parsed
- Know which features are unused (deprioritize)
- Data-driven decisions on what to build next

### API Cost Tracking
Track Anthropic API calls per org: document_type, token_count, estimated_cost. Surface in admin dashboard.

---

## Part 23 — Content Strategy

### Content Types
- Blog articles (touring how-tos, industry knowledge)
- Downloadable templates (day sheets, budgets, settlement sheets)
- Video tutorials / YouTube channel
- Industry guides ("The Complete Guide to Advancing a Show")

### Process
Claude generates drafts, Tim edits for industry voice and credibility.

### Cadence
Launch with product pages only. Content ramps within first 2 weeks after launch. Plan for 1–2 pieces per week once ramping.

### SEO Targets
People searching for: "tour budget template," "how to advance a show," "settlement sheet explained," "tour manager day sheet," "routing a tour," "deal memo template." HWY61 Labs should own these searches.

### Separate Planning Session
A full content calendar with topics, keywords, formats, and schedule will be planned in a dedicated session. Not in Drew's build scope.

---

## Part 24 — Launch Strategy

### Controlled Beta First
5–10 real touring professionals test the platform before public launch.

**Beta Infrastructure:**
- `beta_invites` table (schema in Part 9)
- Invite-only signup: user enters invite code to create account
- Beta users get full access to all features
- Feedback channel: direct line to Tim and Drew
- Beta period: 2–4 weeks depending on feedback

**Beta User Selection Criteria:**
- Mix of self-managed bands (DIY users) and professionally managed acts (TourRouter users)
- At least one user who tours internationally
- At least one management company with multiple acts
- People who will give honest, specific feedback

### Public Launch
After beta feedback is incorporated:
- Remove invite gate
- Marketing site live at hwy61labs.com
- All product pages and pricing live
- Tutorial videos published
- FAQ / knowledge base populated
- Claude support agent trained and active
- Social media accounts active
- Tim begins outreach

### Social Media Accounts (Grab Now)
Lock down @hwy61labs on: Instagram, Twitter/X, TikTok, YouTube, LinkedIn.

---

## Part 25 — The QA Process

### The QA Agent (Second Machine)
A dedicated Claude Code session on a second machine whose only job is testing.

**Starting prompt for QA sessions:**
```
You are the QA agent for HWY61.
Your job is NOT to build new features.
Your job is to break things, find bugs, verify feature
completeness against the specs, and fix what you can.

1. Run: git log --oneline -20
2. For each recent feature, find its spec and run a completeness check
3. Run real documents from qa/test-documents/ through parsers
4. Verify financial calculations with known expected values
5. Test RLS policies on any new tables
6. Test all three product experiences (Localizer, TourRouter, DIY)
7. Test subdomain routing and cross-subdomain auth
8. Fix bugs you can fix directly. Submit PRs.
9. Update qa/BUG_TRACKER.md with everything found.
```

### Bug Priority Levels
```
CRITICAL  — blocks launch or corrupts data
HIGH      — significant feature broken or wrong numbers
MEDIUM    — feature works but incomplete vs spec
LOW       — polish, edge cases, minor UI issues
```

---

## Part 26 — The Build Sequence (Updated Priority Order)

### Phase 7A — Domain Migration (NOW — Critical Path)
1. Set up DNS for hwy61labs.com (see Part 5 walkthrough)
2. Configure subdomains on Vercel
3. Next.js middleware for hostname-based routing
4. Supabase auth cross-subdomain cookies
5. Resend domain verification for @hwy61labs.com
6. Email forwarding setup
7. Update all environment variables and hardcoded references
8. Verify everything works

### Phase 7B — Mapbox Integration (HIGH PRIORITY — Pre-Launch)
1. Sign up for Mapbox, get access token
2. Create geocode_cache and drive_cache tables with RLS
3. Build geocoding service (check CITY_COORDS → Mapbox → cache)
4. Build directions service (check cache → Mapbox → cache)
5. Replace haversine/getRoadKm/estimateDriveHours with Mapbox data
6. Verify fuel calculations still work correctly with real distances
7. Test with edge case cities (Harlowton MT, Steamboat Springs CO, Felton CA)

### Phase 7C — Stripe Restructuring (Blocked on EIN — Do When Unblocked)
1. Archive old Stripe products
2. Create all new products with correct pricing (monthly + annual)
3. Create bundle products
4. Enable 7-day free trials on all products
5. Implement upgrade/downgrade with immediate access change
6. Implement trial → read-only grace period → lockout flow
7. Implement full data export for cancelled accounts

### Phase 7D — Product Naming and UI Cleanup
1. Rename all "Band" references to "TourRouter" throughout UI
2. Ensure DIY experience correctly gates features via flags
3. Update all user-facing text, page titles, navigation
4. Full mobile responsiveness pass — all pages must work on phone

### Phase 7E — Road App Build (Pre-Launch)
1. Register Apple Developer ($99/yr) and Google Play Developer ($25) accounts
2. Scaffold Expo project
3. Build token auth flow
4. Build five core screens
5. Crew-safe API routes
6. Offline caching
7. Push notification setup
8. UI polish (must feel native, not web view)
9. Create test tour for App Store review
10. Build with EAS, submit to both stores
11. Iterate on review feedback

### Phase 7F — Notifications
1. Expand email notifications beyond advance engine
2. Build in-app notification center (bell icon, dropdown, unread count)
3. Build `notifications` table with RLS
4. Set up Twilio for internal escalation SMS to Tim and Drew

### Phase 7G — Analytics
1. Set up PostHog account
2. Drop in PostHog snippet
3. Instrument key events (account created, tour created, document dropped, feature used, upgrade clicked)
4. Build admin dashboard for API cost tracking

### Phase 7H — Onboarding
1. Build guided setup wizard
2. Create demo tour with realistic fake data
3. Build onboarding choice screen (wizard / demo / skip)
4. Link tutorial videos throughout app (videos produced by Tim)

### Phase 7I — Beta Infrastructure
1. Build beta_invites table and invite code validation
2. Gate signup behind invite code
3. Create 10 invite codes for Tim's beta users

### Phase 7J — Support Infrastructure
1. Write FAQ / knowledge base (Tim's content, Drew builds the pages)
2. Set up Claude support agent on Mac Mini
3. Build chat widget for hwy61labs.com
4. Wire escalation flow: Claude → SMS + email to Tim and Drew

### Phase 7K — Marketing Site
1. Redesign hwy61labs.com hub page (dark theme, polished)
2. Build /localizer product page
3. Build /tourrouter product page
4. Build /diy product page
5. Build /pricing page with all tiers, bundles, annual toggle
6. Blog/resource section (structure only — content ramps post-launch)

### Phase 7L — Legal Updates
1. Update Terms of Service for hwy61labs.com and product names
2. Update Privacy Policy
3. Check DMCA registration
4. Update effective dates

### Phase 7M — Final Pre-Launch
1. Tim's end-to-end testing with real tour data
2. Tim tests Localizer with 20+ real schedules
3. Review all marketing site copy
4. Verify pricing across all touchpoints
5. QA agent full sweep
6. Beta invites sent to 5–10 users
7. Monitor beta feedback, fix critical issues
8. Public launch

---

## Part 27 — Architectural Rules (Complete — Never Violate)

1. **`calcTourFinancials()` is the single source of truth.** Never recalculate totals inline.
2. **`calculateShowIncome(show, useActuals)` is the single source of truth for per-show income.** Switch on `deal.dealType`. Never inline.
3. **`legChoices` key = destination show index in `tourShows[]`.** Consistent everywhere.
4. **`renderAll()` must call both table AND financials.** Never just one.
5. **`parseDate()` uses `new Date(year, month, day)`.** Never `new Date(string)`.
6. **Excel: `raw:true, cellDates:true`.** Always.
7. **`legCtry` not `legCountry` in renderTable fuel block.** Do not revert.
8. **Staged preview always.** No import or inbound data writes directly to database without user review.
9. **RLS is the silent killer.** Test every new table's RLS before marking done.
10. **Financial fields never reach crew or label API responses.** Excluded at API route level.
11. **Idempotency on all cron/background jobs.** Check before acting.
12. **Payment amount always manually confirmed by TM.** Claude pre-fills, TM must confirm.
13. **Co-headliner split stored per show.** Never tour-level.
14. **Commission visibility checked in API route.** Never rely on UI.
15. **Feature flags checked before rendering any gated feature.** DIY users never see TourRouter-only features.
16. **One Claude Code session, one well-defined feature.** Context quality degrades with scope creep.
17. **New tables always get RLS before the feature is considered done.**
18. **`advance_escalated = true` is set once and never reset.**
19. **The intake API never writes to the database.** It returns staged result. Confirm API writes.
20. **`pct_net` and `manager_pct_net` have circular dependency.** Calculate net before these, then apply, then recalculate.
21. **Mapbox cache first, API second.** Never call Mapbox for a city pair that's already cached.
22. **Crew data stripped at API level.** The Road App and crew routes never receive financial data — enforced server-side, not client-side.
23. **Track API costs per org.** Every Anthropic API call logs org_id, document_type, token count.

---

## Part 28 — What's Not Being Built (At Launch)

- HWY61 Agency (booking agent product) — future
- HWY61 Merch (inventory + settlement) — future
- Set list management
- Real-time WebSocket collaboration (post-v1)
- SMS notifications for users (post-launch, opt-in when built)
- Web app offline mode (Road App handles offline needs)
- Email forwarding intake (post-launch — needs Postmark or Cloudmailin)
- Radius conflict checker logic (field exists, logic deferred)
- TourCommand (arena/stadium — waiting on source documents)
- Festival buy-on deal type
- PRO/publisher royalties in commission system
- VAT / withholding tax calculations (multi-currency supported, tax specifics deferred)
- Full accessibility / WCAG audit (best effort at launch, formal audit post-launch)

---

## Part 29 — The Operating Rhythm

Tim and Drew talk 5–6 times per day. Answers are immediate.

**The rule:** Drew should never start a Claude Code session without a complete spec to work from.

**When Drew hits something ambiguous mid-build:** message Tim immediately. Tim responds within the hour.

**Spec pipeline:** Tim always has 2 weeks of specs ready.

**Testing:** Tim tests every significant feature with real tour data within 48 hours of build.

---

## Part 30 — Document Reference

| Doc | What Drew Needs It For |
|---|---|
| `01_TOURROUTER_FEATURE_EXPANSION_SPEC.docx` | Day sheets, hotels, multi-vehicle, production budget, room blocks |
| `02_DEAL_MEMO_PROMPT_v2.docx` | Drop-in replacement for DEAL_MEMO_PROMPT in parsePDF() |
| `03_PERSONNEL_PAY_SETTLEMENT_SPEC.docx` | Full personnel system + settlement + live P&L |
| `04_TOURROUTER_TOURING_OS_SPEC_v2.docx` | Master system vision, roles, access model |
| `05_TOURROUTER_GAPS_SPEC.docx` | Guest list, deposit tracking, multi-tour dashboard |
| `06_ADVANCE_PIPELINE_SPEC_v2.docx` | Two-way advance pipeline, venue confirmation portal |
| `07_ADVANCE_AUTOMATION_ENGINE.docx` | Full autopilot engine, cron logic, daily digest |
| `08_COMMISSIONS_NET_TO_ARTIST_SPEC.docx` | Commission system, waterfall, visibility |
| `09_TOUR_FINANCE_LAYER_SPEC.docx` | Finance module, P&L, end-of-tour report |
| `10_UNIVERSAL_DOCUMENT_INTELLIGENCE_SPEC.docx` | Alias library, 7 translation problems, agency profiles |
| `11_DEAL_TYPES_CALCULATION_ENGINE.docx` | All deal types, settlement verification |
| `12_UNIVERSAL_DOCUMENT_DROP_ZONE.docx` | Drop zone, settlement parser, all document parsers |
| `13_UNIVERSAL_AI_INTAKE.docx` | Intake API design, four steps, real-world scenarios |
| `14_CONTACT_INTELLIGENCE_AGENCY_INTEGRATION.docx` | Contact database, opt-in, promoter track record |
| `HWY61_COMPLETE_SYSTEM_VISION.docx` | North star — the full picture |
| `HWY61_PRODUCT_ARCHITECTURE.docx` | Six products → NOW THREE (Localizer, TourRouter, DIY) |
| `HWY61_BUILD_ROADMAP_6MONTH.docx` | Month-by-month build plan (superseded by Phase 7 sequence in this doc) |
| `HWY61_QA_MACHINE_SETUP_CHECKLIST.docx` | Second machine setup for QA agent |
| `HWY61_STATUS_FOR_TIM_March_28_2026.md` | Drew's build status as of March 28 |

---

## Part 31 — The Dedicated Mac Mini Agent

A dedicated Mac Mini running Claude full-time. Not just a support bot — a tireless team member that handles everything repetitive, scheduled, and data-intensive so Tim and Drew only deal with decisions and creative work.

### Pre-Launch Responsibilities (Now)

**Continuous QA**
- Runs on a schedule (or triggered on every git push)
- Pulls latest code, runs full test suite
- Checks RLS policies on all tables
- Verifies financial calculations against known expected values from test documents
- Tests all three product experiences (Localizer, TourRouter, DIY)
- Tests subdomain routing and cross-subdomain auth
- Posts results to a shared doc or channel every morning
- Drew wakes up to a bug report — not a surprise

**Document Parser Testing**
- Runs all 54 real-world test documents through the AI Intake pipeline on a schedule
- Compares parsed results against expected values
- Reports accuracy rates per document type
- Tracks parser quality over time — any regression is caught immediately
- When new test documents are added, automatically includes them in the next run

**FAQ and Knowledge Base Generation**
- Crawls entire codebase and all spec docs
- Generates first drafts of FAQ articles, feature explanations, troubleshooting guides
- Tim edits for voice and accuracy
- Covers: getting started, common workflows, billing, troubleshooting, feature explanations, data export

**Tutorial Script Writing**
- Reads codebase and understands each user workflow
- Drafts step-by-step tutorial scripts for each video Tim needs to record
- Includes callouts for what's on screen at each moment
- Tim edits and records — the hard part (writing) is done

**Test Data Generation**
- Generates the demo tour data: ~15 realistic shows with venues, hotels, contacts
- Mix of settled and pending shows, different deal types, multiple cities
- Properly formatted for database insertion
- Also generates edge case test data for QA: international tours, multi-currency, unusual deal types

### Post-Launch Responsibilities (Ongoing)

**Customer Support — Tier 1**
- Chat widget on hwy61labs.com
- Trained on FAQ/knowledge base
- Handles how-to, troubleshooting, billing, feature questions
- Available 24/7
- Escalates to Tim and Drew via SMS + email when it can't answer or user requests human

**Nightly Health Checks**
- Every night, verify:
  - Supabase responding and healthy
  - Cron jobs ran successfully (advance automation, etc.)
  - Email delivery rates via Resend (flag if bounce rate spikes)
  - Stripe webhook health
  - All subdomains resolve correctly
  - SSL certificates not expiring soon
  - Vercel deployment status
- Posts daily health report
- Alerts Tim and Drew immediately on any failures

**API Cost Monitoring**
- Tracks Anthropic API spend per org in real time
- Alerts if a single org burns unusual API calls (possible abuse or bug)
- Weekly cost summary report
- Trend analysis — predict monthly costs based on usage patterns

**Alias Library Curation**
- Reviews new alias submissions as they come in from users
- Checks for conflicts or duplicates
- Flags entries that need human review before promotion to global
- Maintains alias quality as the library grows

**Venue Database Cleanup**
- Identifies duplicate venues (same venue, different spellings or slight variations)
- Proposes merges for review
- Flags suspicious entries
- Keeps the shared venue data clean as user base grows

**Financial Anomaly Detection**
- Periodic scan of active tours looking for obvious errors:
  - $50,000 guarantee at a 200-cap venue
  - Settlement actuals 10x projected
  - Commission exceeding income
  - Negative net-to-artist on shows with large guarantees
- Flags to the TM as "this looks unusual, please verify"
- Never auto-corrects — always surfaces for human decision

**Advance Intelligence**
- Analyzes advance response patterns across all users:
  - Which promoters respond quickly vs. ghost
  - Which venues have consistently incomplete advance info
  - Average response time by market/region
- Feeds insights into contact intelligence system
- Helps TMs know what to expect before they even send the advance

**Content Drafting**
- Once content calendar is established, drafts blog posts on schedule
- Tim wakes up to a draft, edits, publishes
- Also drafts social media posts, email newsletter content
- Tracks which content topics drive the most signups (via PostHog data)

**Ongoing QA**
- Continues the pre-launch QA role permanently
- Every code push triggers a test run
- Regression testing on financial calculations
- Parser accuracy monitoring
- RLS policy verification on any new tables

### Setup Requirements

**Hardware:**
- Mac Mini (M-series, 16GB+ RAM)
- Always-on, connected to power and internet
- Dedicated to this role — not shared with other tasks

**Software:**
- Claude API access (Anthropic API key)
- Git access to the repo
- Supabase service role key (for database health checks)
- Resend API access (for delivery monitoring)
- Stripe API access (for webhook health)
- Twilio credentials (for escalation SMS)
- PostHog API access (for analytics queries)

**Scheduling:**
- Use cron jobs or a task scheduler for recurring tasks
- QA runs: on every git push + nightly full sweep
- Health checks: nightly at 3am
- Parser testing: weekly full run
- Alias/venue curation: daily
- Cost monitoring: continuous with hourly summary
- Content drafts: per content calendar schedule

### Key Rules
- The agent NEVER modifies production data without human approval
- The agent NEVER auto-confirms financial fields
- The agent NEVER sends customer-facing emails without going through the advance automation engine
- All agent actions are logged with timestamps
- Tim and Drew can review the agent's activity log at any time
- The agent flags and recommends — humans decide

---

*Version 5.0 — Updated March 28, 2026. This file supersedes all previous context documents including v4. Major changes: three-product lineup (Localizer, TourRouter, DIY), new pricing structure with bundles and annual plans, domain migration to hwy61labs.com, Road App restored as native iOS/Android build, Mapbox integration for accurate drive times, onboarding system, notification system, customer support architecture, analytics, beta launch strategy, dedicated Mac Mini agent. Start here for any Claude Code session on any part of the HWY61 platform.*
