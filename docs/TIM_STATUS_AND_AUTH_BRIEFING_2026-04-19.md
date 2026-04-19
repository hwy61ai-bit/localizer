# HWY61 Labs — Tim Status & Auth Briefing

**Date:** April 19, 2026
**From:** Drew (via Claude)
**For:** Tim (and Tim's Claude instance)
**Last formal status doc to Tim:** April 14, 2026

---

## Why this doc exists

Two reasons. First, Tim hasn't had a written status update since April 14 — a lot has shipped since then, including a major auth fix that took four days to root-cause and one today that took another day. Second, Tim's about to start specifying beta-tester setup. Several of the recent fixes, and several known-unfixed architectural footguns, will materially affect how beta provisioning has to work. If Tim's Claude writes specs without this context, it's likely to propose things that either can't be built as written, or that reintroduce already-solved bugs.

Part 1 is the status catalog. Part 2 is the auth architecture deep dive. Part 3 is specifically what matters for beta tester onboarding. Part 4 is the list of known architectural debts. Part 5 is anti-patterns to avoid suggesting.

---

## Part 1 — What shipped since April 14

### April 16 — Public-share auth refactor (morning/midday)

Eight files moved from `supabaseServer()` to a new helper `supabaseAdmin()`. The problem: every public viewer page (`/v/e/[token]`, `/v/m/[token]`, `/v/tour/[token]`) and every download endpoint was using the cookie-aware Supabase client, which respects Row-Level Security. Anonymous users without a session cookie hit RLS walls and got silent 404s. This had been broken for anyone who wasn't Drew or Tim since day one — our testing always happened while logged in, with cookies leaking across tabs.

The fix introduced `lib/supabaseAdmin.ts`, a service-role client that bypasses RLS entirely. It's only safe to use in routes where the access credential is a cryptographically-random token validated in application code (which is true for every `/v/*` and `/api/download*` route). Authenticated routes continue to use `supabaseServer()` and its RLS-respecting anon-key client.

### April 16 — Sponsor logo tinting + print PDF work (evening)

Sponsor logos now tint to text color in template editor previews and downloaded JPEGs. Server-side PDF tinting was tried via `sharp` but reverted — each request incurred 100+ seconds of cold-start cost on Vercel even when warm. The PDF-side stayed native-color with UI copy explaining the divergence between web (tinted) and print (native).

A pre-existing Google Fonts weight bug was fixed in the PDF renderer (font was loading weight 400 instead of 700, so PDF text rendered thinner than the preview). Fix added `:wght@700` to the font URL. Tradeoff: PDF generation went from 5–8s to ~24s because the bold font variant has to be fetched on every request. Known regression, worth investigating later.

### April 17 — THE auth fix (cookie domain)

This is the one. The "session expired, clear cache to log in" bug that had been hitting every day for four straight days and was blocking beta launch.

Root cause: cookie domain scope mismatch between browser and server-side Supabase clients. The browser client was correctly scoping cookies to `.hwy61labs.com` (leading dot, subdomain-wide). But three server-side cookie writers — `middleware.ts`, `lib/supabaseServer.ts`, and `app/auth/callback/route.ts` — weren't passing any `domain` attribute at all, which defaulted to host-only scope (`www.hwy61labs.com`, no dot).

What that means in practice: every browser accumulated two cookie sets with the same name but different scopes, each holding a different refresh token. When the access token expired (~1 hour), whichever code path read one cookie rotated that token. The other cookie still held the now-stale token. Next request hit the other cookie, presented the stale refresh token, got `400 refresh_token_already_used`, and — because Supabase's "Detect and revoke compromised refresh tokens" setting is correctly ON — the entire token family got revoked. Session dead. User sees "session expired." Only fix was clearing all cookies.

The shipped solution introduced `lib/cookieDomain.ts` with a helper that returns `.hwy61labs.com` when the host ends with `hwy61labs.com`, and `undefined` otherwise (so localhost and Vercel preview URLs use host-only cookies as needed). All three server-side writers now pass this domain through. Commit `0ea670c`.

**The practical implication for beta: if a beta tester signs up, everything works. The auth flow is solid now.** But every new route or cookie-writing code path Tim's Claude proposes must respect this domain-scoping pattern. If a future route writes auth cookies without the domain attribute, the bug reappears.

### April 17 — Local Poster for Print simplification

Decision made jointly: no logos at all on the Local Poster for Print tab. Reasoning — users printing an 11x17 tour poster have already baked band name and tour-wide sponsors into the artwork design itself. Offering separate logo overlays on top invited double-branding. Band Logo, Sponsor Logo 1, and Sponsor Logo 2 were removed from the Local Poster sidebar, the PDF renderer, the live preview, and the canvas renderer.

### April 18 — Custom text lines on images

Two tour-level user-editable text fields (`custom_text_1`, `custom_text_2`) with per-format visibility toggles, per-format position/size/align stored in `overlay_config`. A user types something like "w/ The Supporting Band" or "www.bandname.com/tour" once at the tour level, and it renders on each format independently at whatever position they set. 35-character max. Font and color inherited from the existing text overlays. Hidden on the print tab.

Shipped end-to-end on Square, Story, and Landscape JPEGs. Video formats deferred to the next day.

### April 19 — Custom text lines on videos

Video custom text shipped. The vertical video format (labeled with TikTok / IG Reels / FB Stories / YouTube Shorts in the UI) and the Square video format both now render `custom_text_1` and `custom_text_2` overlays via Cloudinary video URL transformations. Non-empty-text guard in place to avoid broken Cloudinary `l_text` fragments.

### April 19 — Stale-URL download bug (root-caused)

Some time this week (exact origin unknown; at least as old as April 16), certain venue-page downloads started failing with a JSON error file instead of the actual asset. Today we diagnosed it fully.

What was happening: the venue page (`/v/e/[token]/page.tsx`) reads `render_*_url` values from the database and embeds them into download link `href` attributes. When a user regenerated assets, new URLs got written to the database, but the page's server-rendered HTML was cached by Next.js's fetch cache layer. The page kept serving old URLs in the download links. The download endpoint (`/api/download`) has a byte-equal allow-list for security — it confirms the URL the client is requesting matches a URL currently stored for that venue link. Client sent stale URL, server checked against current DB, mismatch, 403 `url_not_allowed`. Browser saved the error JSON as `download.json`.

Attempted fix #1 (`export const dynamic = "force-dynamic"` on the viewer pages) worked on localhost's production build but did not hold on Vercel production. Reverted.

Attempted fix #2 worked: added a `global.fetch` override to the `supabaseAdmin` client that passes `cache: "no-store"` to every underlying HTTP call. This bypasses Next.js 14's default fetch cache at the data layer rather than the route layer. Verified in prod. Commit `5258f1d`.

**This is important architectural context: Next.js 14 caches all server-side `fetch()` calls by default. The Supabase JS client uses `fetch()` internally. Route-segment configs like `force-dynamic` do not bypass this cache.** We now have the correct pattern in `supabaseAdmin`; we have NOT yet applied it to `supabaseServer`.

### April 19 — Template editor stale-state bug

Tim spotted this during today's meeting: set template positions, navigate to Gigs, navigate back to Template, everything reverted to defaults. Hard refresh brought them back.

Root cause: Next.js 14's **Router Cache** (separate from the fetch cache). On client-side navigation via `<Link>`, the browser serves the cached RSC payload from memory for 30 seconds to 5 minutes before asking the server again. Saved data got to the DB fine, but the cache still had the pre-save RSC payload. Cookies-based dynamic rendering doesn't help here; the cache intercepts before the server is consulted.

Fix: one-line addition — call `router.refresh()` inside the save success handler in `TemplateEditor.tsx`. This invalidates the Router Cache for the current route. Next navigation fetches fresh data. Commit `a580240`.

### April 19 — Template editor preview fixes (two)

Two smaller fixes to the template editor:

1. The live preview was falling back to the square image for Story and Landscape formats when those formats had no dedicated base image uploaded. Same pattern had been fixed in the Generate All path on April 9, but the template editor's preview code had its own parallel copy of the logic. Removed the fallback. Now surfaces a "No image uploaded for this format yet → IMPORT ASSETS" placeholder that was already built but never triggered. Commit `cce49cc`.

2. Sponsor logo preview was tinting to text color on video formats too, even though the Cloudinary video renderer correctly outputs native PNG colors. Preview now branches on video-vs-image: native `<img>` on videos (matching output), tinted CSS-mask on images (also matching output). Commit `2dad3a4`.

### April 19 — Email branding fixes

The transactional email sent when a promoter receives their venue link had two issues:

1. Several text elements inside the black-box email template were colored in hard-to-read gray. Changed four hex values (`#555`, two `#888`, `#444`) to `#ffffff` in the approve route's email template. Commit `020bfeb`.

2. Gmail was showing "noreply" in the sender column because the `from:` field was a bare email address with no display name. Fixed across all six Resend send sites in the codebase by adding "HWY61 Labs" as the display name in RFC 5322 format. All outbound emails now show "HWY61 Labs" in the sender column. Commit `cba407e`.

---

## Part 2 — Auth architecture deep dive

### The stack

- **Authentication provider:** Supabase Auth
- **Primary flow:** passwordless magic links sent via email
- **Session storage:** HTTP cookies, scoped to `.hwy61labs.com`
- **Authorization model:** Row-Level Security (RLS) on every table
- **Authorization keys:** two Supabase API keys — `ANON` (client-side, respects RLS) and `SERVICE_ROLE` (server-only, bypasses RLS)
- **Session refresh:** automatic via Supabase's refresh-token rotation

### The two Supabase client helpers

The codebase wraps Supabase client construction in two factory functions. Every route in the app uses one of them (with 11 exceptions that bypass both — flagged in Part 4).

**`supabaseServer()` — use in authenticated routes.** Builds a client via `@supabase/ssr`'s `createServerClient`, keyed by the anon key. Reads cookies and headers from the Next.js request, which both respects the user's RLS permissions AND implicitly forces the consuming route into dynamic rendering (because reading cookies marks the route as dynamic by Next.js's rules). Used in every `/dashboard/*` page, every authenticated API route, and anywhere the current user's identity matters.

**`supabaseAdmin()` — use in public token-validated routes.** Builds a client via `@supabase/supabase-js`'s `createClient`, keyed by the service role key. Bypasses RLS entirely. Used in `/v/e/*`, `/v/m/*`, `/v/tour/*`, all `/api/download*` routes, advance-form public routes, and anywhere access is gated by a cryptographically-random token validated in application code rather than by the user's session.

As of today, `supabaseAdmin` also has a `global.fetch` override that passes `cache: "no-store"` to every HTTP call. This is what fixed the stale-URL bug — without it, Next.js's default fetch cache would serve stale DB reads on heavy routes. `supabaseServer` does NOT have this override yet. If Tim's Claude specs a new authenticated dashboard route that reads data users edit frequently (like a "my billing history" page), the same stale-read bug could surface. Adding the override to `supabaseServer` is a known follow-up.

### Why mixing them up is dangerous

Using `supabaseServer()` in a public route means RLS-bound queries fail silently for unauthenticated users — they hit the allow-list, fail the check, and the code keeps running as if they got no data. The route returns a 404 or renders as if the resource doesn't exist. This was the entire origin of the April 16 8-file refactor.

Using `supabaseAdmin()` in an authenticated route means the app silently ignores the user's identity. Any logged-in user could theoretically read any other user's data if the query doesn't independently scope by `org_id` or similar. We've avoided this so far by reserving `supabaseAdmin` for routes where the route's token is itself the access credential.

### Cookie domain scoping

This is the thing that caused four days of "session expired" pain in mid-April.

The browser-side Supabase client scopes auth cookies to `.hwy61labs.com` (leading dot, subdomain-wide). Server-side writers must do the same, or cookies accumulate in two different scopes with different refresh tokens, and the token families start revoking each other on rotation.

All three server-side cookie writers — middleware, `supabaseServer`, and `auth/callback` — now use `getCookieDomain()` from `lib/cookieDomain.ts`, which returns `.hwy61labs.com` when the host string ends with `hwy61labs.com`, and `undefined` otherwise (so localhost and Vercel preview URLs fall back to host-only cookies).

If a new route needs to write auth cookies, it MUST use this same helper. There's no ESLint rule enforcing this; it's a human-awareness convention for now.

### Middleware behavior

`middleware.ts` uses `supabase.auth.getSession()`, NOT `getUser()`. This is a deliberate choice that matters for rate limiting. `getSession()` is cookie-only — decodes the JWT from the cookie without calling Supabase's servers. `getUser()` makes a network call to Supabase to verify the token on every invocation, which under concurrent requests triggers Supabase's rate limits on the `/token` endpoint.

The middleware runs on every request that matches its route pattern, so the network cost of `getUser()` would be catastrophic. The tradeoff is that middleware trusts any signed JWT without verifying it hasn't been revoked server-side. This is an acceptable tradeoff for middleware — the dashboard auth guard falls through to real RLS-enforced queries in the route handler itself, and revoked tokens will fail there.

### The OAuth callback route

`app/auth/callback/route.ts` handles two flows: OAuth code exchange (`exchangeCodeForSession`) and magic-link token verification (`verifyOtp`). Either success sets the user's session.

Immediately after authentication succeeds, the route calls `ensureOrgExists`, which is idempotent: looks up `org_members` by user ID, returns early if present, otherwise creates an `orgs` row and an `org_members` row atomically. The welcome email is fired non-blocking as a side effect.

**This is where every new user first lands in the DB.** Tim's Claude should understand this when specifying beta flows: there is no separate "create account" API. Authentication and org creation are fused into the callback.

### RLS model

Every table respects RLS. Policies are keyed to `org_members` — a user can read/write a row if they're a member of the `org_id` on that row. Writes that fail RLS return `{ data: null, error: null }` (silent failure, not an exception). This is why the codebase convention is to use `.select().maybeSingle()` after every `.update()` or `.insert()` — the `.select()` forces a round-trip that verifies rows were actually affected.

**Important caveat: RLS policies are not checked into the repo.** The `supabase/migrations/` directory intentionally does not include policy definitions — those are managed in the Supabase dashboard's SQL Editor. The UPDATE policy on `org_members` was added imperatively on April 13 (it had been missing since the table was created, silently failing all role changes and onboarding-state updates). The Supabase dashboard is the source of truth for what RLS policies actually exist.

### The public share-link token model

Orthogonal to user auth. A venue link has a 64-character hex token stored in `venue_links.token`. The `/v/e/[token]` page looks up this token, validates it exists and is active, and serves the venue page to anyone who knows the URL. No user authentication required. Same pattern for marketing tokens, advance form tokens, and finance report tokens.

Security depends entirely on the token being cryptographically random and unguessable. All tokens are generated via `generatePublicToken()` in `lib/tokens.ts`. If Tim's Claude specs a new public-share feature, it should use the same helper.

---

## Part 3 — Beta tester provisioning: what matters

This is the section most relevant to what Tim's about to work on.

### What happens automatically when a new user signs up

1. They enter their email on `/login`
2. Supabase sends them a magic link
3. They click the link, which hits `/auth/callback`
4. `exchangeCodeForSession` or `verifyOtp` validates the token and creates their session
5. `ensureOrgExists` creates an `orgs` row and an `org_members` row
6. Welcome email fires via `/api/welcome`
7. User is redirected to `/dashboard`

### What does NOT happen automatically

**Plan-status columns are not populated.** `orgs.localizer_plan_status` and `orgs.bundle_plan_status` remain `NULL` for any new org created this way. The Stripe webhook populates the legacy `plan` and `plan_status` columns (only when a real Stripe checkout happens), but does NOT populate the per-product or bundle plan-status columns that the billing gates read.

**This is the big landmine for beta testing.** The billing gate checks `localizer_plan_status` and `bundle_plan_status`. If neither is `'active'` or `'past_due'`, the gate returns `'free'`. Public download routes check this gate and, if the owning org is on `'free'`, return `402 download_requires_paid`. The browser saves this error response as `download.json` (same symptom we debugged for hours today before realizing it was the byte-equal URL allow-list, not the billing gate — they produce similar-looking symptoms).

So when a beta tester signs up and tries to download their first asset pack, they'll get a `download.json` error file. Every time. Until someone manually flips their plan-status in the Supabase dashboard.

**What a beta provisioning workflow needs to include:**

- Either a manual step for Drew to flip each beta tester's `localizer_plan_status` to `'active'` after they sign up (current approach, doesn't scale past ~10 testers)
- Or an automated beta-invite flow — a "beta invite code" the tester enters during signup, which the code validates and auto-flips their plan status
- Or a time-limited grace period where newly-created orgs get a temporary `'active'` status for 30 days without any payment

There's an existing `/api/beta/claim` route and `/api/beta/validate` route, but they're using raw `createClient` calls and their exact behavior hasn't been audited against the current billing gate. Worth Tim's Claude spec'ing a full-flow review before we rely on them for onboarding.

### Other things that can silently fail during beta onboarding

**The `ensureOrgExists` flow depends on INSERT policies on `orgs` and `org_members`.** These are confirmed present by side-effect (users do successfully get created today), but the exact policy clauses aren't checked in. If those policies get accidentally changed via the Supabase dashboard, signup will silently stop working.

**The welcome email can fail without surfacing.** It's fired non-blocking. If Resend is down or the `orgs` row doesn't have the expected columns, nothing in the UI tells the user. Tim's Claude should consider whether the welcome email should include any critical onboarding info (and therefore be blocking), or remain fire-and-forget as a nice-to-have.

**First-save stale-state on new tours.** Until today's Router Cache fix landed, any user creating a new tour and saving it would see the saved state revert on navigation-back. Beta testers discovering this would have churned. This is fixed now, but similar cache issues could affect any NEW dashboard page Tim's Claude specs. Pattern to follow: after any mutation, call `router.refresh()` from `next/navigation` to invalidate the Router Cache.

### How many testers can we reasonably onboard at once?

Today, without automation: ~5–10. Each one is a manual SQL write to flip plan-status. More than that and you'll skip one and they'll churn.

With a proper beta-invite flow (Tim's Claude to spec): unlimited.

With an automatic grace period (simpler to spec): unlimited, but we'd need to track which orgs are "grace" vs "paid" for eventual conversion.

---

## Part 4 — Known architectural footguns

These are things Tim's Claude should know exist so it doesn't accidentally spec things that run into them.

### 11 raw Supabase clients bypass the helpers

Eleven routes construct `createClient` inline instead of using `supabaseAdmin()` or `supabaseServer()`. Among them: the Stripe webhook, the Resend webhook, the TourRouter advance cron, the demo-seed route, and — notably — `app/api/tours/[tourId]/overlay-config/route.ts`, which is the route the template editor posts to on save. These don't benefit from the `cache: "no-store"` fix shipped today. If the stale-data symptom ever recurs on any of these routes, that's the reason. Consolidation is an open backlog item.

### 30+ `.update()` calls without `.select().maybeSingle()`

The silent-RLS pattern. If RLS rejects the update, the code returns success with zero rows affected and no error. Most load-bearing offenders: `app/api/renders/generate/route.ts` line 476 and `app/api/renders/save-urls/route.ts` line 24 — both of which write the exact `render_*_url` columns we were debugging today. If a future symptom looks like "the save worked but the data didn't update," this is the first place to look.

Full audit list exists in session logs. Not fixed today because it's a ~30-site sweep, not a single patch.

### 79 `.single()` calls where `.maybeSingle()` is the project convention

`.single()` throws when zero rows match. `.maybeSingle()` returns `null`. The project rule per CLAUDE.md is `.maybeSingle()` everywhere — gives the calling code a chance to handle the not-found case gracefully instead of catching a thrown exception. 79 remaining violations, heavily concentrated in TourRouter routes. Also not fixed today for the same reason.

### Plan-status writes are manual, not webhook-driven

Covered in Part 3. The Stripe webhook writes legacy columns; the gates read new columns; there's no automation bridging them. Tim's Claude should not assume "a user paid through Stripe, therefore the billing gate will recognize them as paid." It won't, until a human runs SQL in the Supabase dashboard.

### `org_members` RLS policies aren't in the repo

Covered in Part 2. The Supabase dashboard is the source of truth. If Tim's Claude specs anything that touches RLS, the spec should explicitly note that the policy check has to happen in the dashboard, not via a migration file.

### Local vs Vercel prod build divergence

Today taught this one fresh: `export const dynamic = "force-dynamic"` and `export const revalidate = 0` behave differently on Vercel production builds than on `npm run dev` or even `npm run build && npm run start`. Both of those local modes handled the directive; Vercel prod did not. When specifying anything that relies on Next.js route-segment configs, either test on a preview deploy or prefer data-layer fixes (`cache: "no-store"` on the fetch) over route-layer ones.

---

## Part 5 — Anti-patterns for Tim's Claude to avoid suggesting

- **"Use `export const dynamic = 'force-dynamic'` to fix stale data."** No. Use the data-layer fix: either `cache: "no-store"` on the Supabase client's fetch, or `router.refresh()` after mutations.
- **"Create a new Supabase client inline for this route."** No. Use `supabaseServer()` for authenticated routes or `supabaseAdmin()` for public token-validated routes. Adding new inline `createClient` calls perpetuates the 11-site bypass problem.
- **"Write to the DB directly from the intake API."** No. The codebase convention is to stage intake-form inputs for human review before writing. Direct-writes from intake skip review and have caused data-quality problems historically.
- **"Use `.single()` for the happy path."** No. Always `.maybeSingle()`, even on reads that logically should always succeed. It gives the calling code a chance to handle the case where RLS returned zero rows.
- **"Add an `.update()` without `.select().maybeSingle()`."** No. Silent-RLS failure is a silent-data-loss class of bug. Every write needs a verification round-trip.
- **"Add a new route that writes auth cookies without the `.hwy61labs.com` domain."** No. Use the `getCookieDomain()` helper from `lib/cookieDomain.ts`. Skipping the domain attribute reintroduces the four-day-diagnosis cookie scope bug.
- **"Use `supabase.auth.getUser()` in middleware."** No. `getUser()` triggers Supabase rate limiting under concurrent load. Middleware uses `getSession()` (cookie-only, no network call).
- **"Stripe paid the user, so the billing gate will let them in."** No. Plan-status columns are written manually, not by the Stripe webhook. A human has to flip the flag.

---

## What's next

Drew's current backlog, in rough priority order:

1. Beta tester provisioning flow (Tim to spec)
2. Apply the `cache: "no-store"` treatment to `supabaseServer()` for symmetry with `supabaseAdmin()` (pre-emptive)
3. Full audit of 30+ `.update()` calls missing `.select().maybeSingle()`
4. Consolidate the 11 raw-createClient sites under the helpers
5. Stripe webhook should write the new plan-status columns, not just the legacy ones
6. Tour-level Download All page (`/v/tour/[tourId]`)
7. Remaining TourRouter expense tabs (Transport, Food, Gear, Misc, Merch, Promo, Other)
8. Stripe product restructure (blocked on EIN)

None of these are blocking beta launch per se. The stale-URL bug and the template editor revert bug were the two that would have tanked the first tester experience, and both landed today. We're in a genuinely good place to bring real users in.
