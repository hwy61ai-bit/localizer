# HWY61 — Claude Code Session Kickoff
**Date:** March 31, 2026
**Use:** Paste this at the start of any Claude Code session.

---

## Stack
- Next.js 14 App Router + TypeScript
- Supabase (PostgreSQL + Auth + Storage + RLS)
- Vercel (auto-deploys on git push — never use `npx vercel --prod`)
- Cloudinary (image CDN)
- Resend Pro (transactional email)
- Anthropic API (document parsing + automation)
- Mapbox (geocoding + directions — replaces haversine)
- Stripe (billing)
- Repo: `~/localizer/`
- Domain: `hwy61labs.com` (subdomains: localizer, tourrouter, diy)

## Engineering Rules (Never Violate)
1. `parseDate()` always uses `new Date(year, month-1, day)` — never `new Date(string)`
2. Excel imports: always `raw:true, cellDates:true`
3. `legCtry` not `legCountry` in renderTable fuel block
4. `calcTourFinancials()` is the single source of truth — never calculate financials inline
5. `calculateShowIncome(show, useActuals)` — switch on deal.dealType, never inline
6. RLS on every new table — missing RLS returns empty results silently
7. Supabase server-side `fetch()` calls require `cache: "no-store"`
8. One file per prompt — large multi-file prompts cause hangs
9. Never use bash heredocs — smart quote corruption risk
10. Financial fields never reach crew/label API responses — excluded at API level
11. Payment amounts always manually confirmed by TM
12. Mapbox cache first, API second — never call Mapbox for a cached city pair
13. Feature flags checked before rendering any gated feature
14. `advance_escalated = true` set once, never reset
15. Intake API never writes to database — returns staged result, confirm API writes
16. `pct_net` / `manager_pct_net` circular dependency: calculate net first, then apply, then recalculate

## Key File Locations
- `lib/tourrouter/financials.ts` — calcTourFinancials (single source of truth)
- `lib/tourrouter/calculateShowIncome.ts` — 14 deal types
- `lib/tourrouter/mapbox.ts` — geocodeCity(), getDriveInfo(), cache helpers
- `lib/tourrouter/geography.ts` — haversine fallbacks, getMapboxDriveInfo()
- `lib/tourrouter/featureFlags.ts` — DIY_FLAGS, TOURROUTER_FLAGS
- `lib/tourrouter/FeatureFlagContext.tsx` — FeatureFlagProvider, useFeatureFlags()
- `lib/tourrouter/ProductBrandingContext.tsx` — useProductBranding()
- `lib/tourrouter/constants.ts` — CITY_COORDS, CITY_AIRPORTS, vehicle fuel data
- `lib/tourrouter/prompts/` — AI parser prompts
- `lib/supabaseClient.ts` — browser client (cookie domain: .hwy61labs.com)
- `middleware.ts` — hostname routing for all subdomains
- `app/api/tourrouter/` — all TourRouter API routes
- `docs/SESSION_LOG.md` — session log (update after every session)

## Products
| Product | Subdomain | Price | Notes |
|---|---|---|---|
| Localizer | localizer.hwy61labs.com | $29–$139/mo | Tour marketing automation |
| TourRouter | tourrouter.hwy61labs.com | $49–$179/mo | Full touring OS |
| DIY | diy.hwy61labs.com | $19/mo flat | TourRouter with feature flags off |
| Road App | (future native app) | Free | React Native/Expo, Phase 7E |

## What's Complete (Phases 1–6 + 7A, 7B, 7D partial)
- **Phase 1:** Localizer launch (Stripe, DNS, email, legal, print PDF)
- **Phase 2:** TourRouter stabilization (schema, billing gate, UI, 45 columns, 5 tables)
- **Phase 3:** Must-haves (14 deal types, settlement, personnel pay, roster, hotel, guest list, deposits, day sheet PDF, advance PDF)
- **Phase 4:** AI (Universal AI Intake, Advance Automation Engine, Alias Library, venue portal)
- **Phase 5:** Finance (commissions, waterfall, multi-tour dashboard, end-of-tour report)
- **Phase 6:** Contact intelligence (API, flagging, contacts page, autocomplete)
- **Phase 7A:** Domain migration to hwy61labs.com — COMPLETE
- **Phase 7B:** Mapbox integration — COMPLETE (real drive times everywhere, caching, all exports)
- **Phase 7D (partial):** Feature flags built, subdomain branding, HWY61 LABS wordmark

## Tim's Latest Feedback (March 31, 2026)

1. **Redirect hwy61.ai → hwy61labs.com NOW.** No parallel period. Set up 301 redirects immediately.
2. **DIY gets all 14 deal types.** Remove dealTypes from DIY_FLAGS gating. Don't restrict it.
3. **AI Intake for DIY is intentional.** Already enabled — leave as-is.
4. **EIN applied, waiting on IRS.** Stripe restructure still blocked. Stub out product structure if it makes sense.
5. **Post-login redirect bug — fix NOW.** TourRouter/DIY users landing on `/dashboard` instead of `/dashboard/routing` after login. First-impression issue.
6. **Build priority is Drew's call.** Tim trusts the sequencing.

## Immediate Tasks (Next Session)

### Task 1: Fix post-login redirect (Tim says fix now)
- After login on tourrouter.hwy61labs.com or diy.hwy61labs.com, users land on `/dashboard` instead of `/dashboard/routing`
- The auth callback redirect needs to be subdomain-aware
- Check `app/auth/callback/route.ts` — it probably hardcodes the redirect to `/dashboard`
- tourrouter and diy subdomains should redirect to `/dashboard/routing`
- localizer subdomains should redirect to `/dashboard`

### Task 2: Redirect hwy61.ai → hwy61labs.com
- Set up 301 redirects: hwy61.ai → hwy61labs.com and *.hwy61.ai → *.hwy61labs.com
- This is a DNS/Vercel config task, not a code task
- Keep the domain registered (never let it expire)

### Task 3: Update DIY deal types flag
- In `lib/tourrouter/featureFlags.ts`, change DIY_FLAGS.dealTypes from `false` to `true`
- Tim confirmed: DIY users get all 14 deal types, no restriction

## Remaining Phase 7 Sequence
- **7C:** Stripe restructuring (blocked on EIN — stub if useful)
- **7D remainder:** Mobile responsiveness pass
- **7E:** Road App (React Native/Expo, 2-3 weeks)
- **7F:** Notifications (email, in-app bell, push)
- **7G:** PostHog analytics
- **7H:** Onboarding wizard + demo tour
- **7I:** Beta invite infrastructure
- **7J:** Support infrastructure (FAQ, Claude agent, chat widget)
- **7K:** Marketing site (product pages, pricing page)
- **7L:** Legal updates
- **7M:** Final pre-launch QA + beta
