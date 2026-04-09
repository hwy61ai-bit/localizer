# HWY61 — Access Gate & Protection Decisions for Drew
**Date:** April 9, 2026
**From:** Tim
**To:** Drew
**Re:** Answers to your three questions + rate limiting scope

---

## Question 1 — TourRouter Only Tonight, or Localizer Too?

**Build both tonight.**

Apply the same pattern to Localizer: free users get full access, but exports are paywalled with a hard block upgrade modal. This matches the TourRouter model exactly — same gate logic, same `'none' | 'free' | 'paid'` access level enum, same export-only wall.

---

## Question 2 — Finance Report Route Gating

**Gate the POST only. The GET stays public.**

- `POST /api/tourrouter/tours/[tourId]/finance/report` — **paid only.** Generating the shareable link requires an active subscription.
- `GET /api/tourrouter/finance/report/[token]` — **public.** Once a report link exists, anyone with the link can view it — no account, no subscription required. A manager needs to be able to share it with a lawyer, accountant, or label rep who isn't on HWY61.

This is the same pattern as how the advance form token works — authenticated user generates it, public URL works for anyone.

---

## Question 3 — Protection Against Cloning / Scraping

**Add rate limiting. No watermarking or blurring needed.**

We want to stop someone from hammering the API to systematically scrape tour data, venue data, or contact intelligence — not punish legitimate users or add visual noise to exports.

### Where to add rate limiting

**Priority 1 — AI-powered routes (most expensive, most valuable):**
- `POST /api/tourrouter/intake` — document parsing
- `POST /api/tourrouter/import/pdf` — PDF import
- `POST /api/tourrouter/flight-price` — flight estimates
- `POST /api/tourrouter/finance/report` — end-of-tour report generation

**Priority 2 — Data read routes (venue + contact intelligence):**
- `GET /api/tourrouter/venues`
- `GET /api/tourrouter/contacts` (if exists)
- `GET /api/tourrouter/shared-contacts` (if exists)

**Priority 3 — Export routes (all six):**
- All `/export/csv`, `/export/excel`, `/export/pdf`, `/export/daysheet`, `/export/advance` routes
- `POST /api/tourrouter/finance/report`

### Implementation approach

Use Upstash Redis (already compatible with Vercel Edge) or a simple in-memory rate limiter via `@upstash/ratelimit` if not already in the stack. If that's not in the stack yet, a sliding window check on the Supabase `org_members` table keyed by `org_id` is acceptable for v1 — not as fast but no new infrastructure.

**Suggested limits (starting point — adjust after beta):**
| Route category | Limit |
|---|---|
| AI parsing routes | 50 requests / hour / org |
| Venue / contact reads | 200 requests / hour / org |
| Export routes | 30 requests / hour / org |
| Everything else | 500 requests / hour / org |

Return `429 Too Many Requests` with a `Retry-After` header. No need to explain why in the error body — just `{ error: 'rate_limit_exceeded', retryAfter: 60 }`.

### What this covers
- Prevents someone from looping our venue or contact database with a script
- Prevents abuse of the Anthropic API via our endpoints (protects our bill)
- Stops bulk export scraping
- Does not affect any normal usage pattern — a real TM hitting these limits would be doing something unusual

### What this does NOT cover
No watermarks, no fingerprinting, no blurred previews. Clean exports for paid users, hard wall for free users.

---

## Question 4 — Localizer Paid Signal

**Each product tracks paid status independently via its own column.**

Localizer gets its own `localizer_plan_status` column on the `orgs` table, mirroring the existing `tourrouter_plan_status` setup. This means:

- A customer paying for TourRouter only → `tourrouter_plan_status = 'active'`, `localizer_plan_status = null` (free tier for Localizer)
- A customer paying for Localizer only → `localizer_plan_status = 'active'`, `tourrouter_plan_status = null` (free tier for TourRouter)
- A customer paying for both → both columns active (see Question 5 below)

The Localizer gate reads `localizer_plan_status`. The TourRouter gate reads `tourrouter_plan_status`. Neither bleeds into the other.

---

## Question 5 — Bundle Customers

**Add a `bundle_plan_status` column. Both product gates check their own column OR the bundle column.**

When someone buys the Localizer + TourRouter bundle, flip `bundle_plan_status = 'active'` on their org. Leave the individual product columns alone.

The gate logic for each product becomes:

```typescript
// TourRouter gate
const isPaid = tourrouter_plan_status === 'active' || bundle_plan_status === 'active';

// Localizer gate
const isPaid = localizer_plan_status === 'active' || bundle_plan_status === 'active';
```

This means:
- Adding a new bundle SKU in Stripe only requires flipping one column, not two
- Individual product subscriptions keep working exactly as before — no risk of breaking existing customers when bundle SKUs go live
- If someone downgrades from bundle to a single product, set `bundle_plan_status = null` and flip the appropriate individual column to `'active'`

### New columns needed on `orgs`
```sql
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS localizer_plan_status text;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS localizer_plan text;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS bundle_plan_status text;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS bundle_plan text;
```

---

## Summary — Tonight's Build Checklist (Updated)

1. **`lib/tourrouter/billingGate.ts`** — add `getTourRouterAccessLevel()` returning `'none' | 'free' | 'paid'`. Check `tourrouter_plan_status === 'active' || bundle_plan_status === 'active'` for paid. Keep `checkTourRouterAccess` as deprecated wrapper.
2. **`lib/localizer/billingGate.ts`** (new or equivalent) — add `getLocalizerAccessLevel()` with same return shape. Check `localizer_plan_status === 'active' || bundle_plan_status === 'active'` for paid.
3. **`lib/tourrouter/requireAccess.ts`** — add `accessLevel` to success return type. Non-export routes pass free users through. Export routes check `=== 'paid'`.
4. **Gate all six TourRouter export routes** — 403 + structured error if `accessLevel !== 'paid'`.
5. **Gate Localizer exports** — same pattern. Free users can use everything, exports hard-wall.
6. **Gate `POST /finance/report`** — paid only. `GET /finance/report/[token]` stays public.
7. **Add rate limiting** — Priority 1 routes first (AI + parsing), then Priority 2 (data reads), then Priority 3 (exports). Return 429 with `Retry-After`.
8. **Run the four `ALTER TABLE` migrations** on `orgs` to add `localizer_plan_status`, `localizer_plan`, `bundle_plan_status`, `bundle_plan`.

---

*Decisions confirmed by Tim, April 9, 2026.*
