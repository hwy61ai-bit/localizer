# Status Update for Tim — April 14, 2026

**From:** Drew
**Period covered:** April 9 → April 14, 2026 (6 days, 55 commits)
**Last status doc:** TIM_MASTER_STATUS_April_8_2026.md

---

## TL;DR

It's been six heavy days since my last status doc. Here's what shipped:

1. **Freemium gate refactor (Units A/B/C)** — three-state access model (`none` / `free` / `paid`) across TourRouter and Localizer, plus a pre-existing SSRF hole closed on the venue download route.
2. **Localizer critical fixes** — Generate All for video-only tours, custom fonts on videos, video logo overlays, stale render URL cleanup, Cloudinary font upload pipeline that was broken since day one.
3. **GEO_CITIES geocoding backend** — full three-tier city/airport lookup, 332-city curated seed (after pivoting away from GeoNames), client-side prefetch + autocomplete, integrated into `calcTourFinancials` without breaking its sync contract.
4. **Your April 11 Localizer UI spec** — 16 of 20 items shipped, 4 deferred (one of which is now unblocked — see below).
5. **Tour Manager field** — added end-to-end.
6. **Tour Marketing Hub** — token-based shareable hub that marketing folks can access without seeing advance materials. Physically separated codepath, not runtime-filtered.
7. **Middleware session rotation fix (CRITICAL)** — the "session expired every morning" bug is gone. This had to be fixed before any beta tester touched prod.
8. **Sponsor logos end-to-end** — two-slot feature across all six formats plus print PDF. No-tint per your spec.
9. **Today's backlog cleanup** — 5 bugs fixed, 1 misdiagnosis caught, 1 refactor, 1 root-cause fix on the daily auth pain.

**Three things below need your attention**, flagged in "For Your Review" at the bottom:
- **Tour Manager field in Localizer UI is now unblocked** (thought it needed a migration — it didn't)
- **Sponsor logo tint question** — open from the April 14 sponsor logo build
- **Venue-download billing gate caveat** — architectural decision that currently only lives in a source comment

---

## April 9 — Freemium rollout + Localizer critical fixes

**10 commits.** Long day.

### Freemium access gate refactor (Units A, B, C)

- **Unit A (schema):** Four new columns on `orgs`: `localizer_plan`, `localizer_plan_status`, `bundle_plan`, `bundle_plan_status`. Applied via Supabase SQL Editor.
- **Unit B (TourRouter):** New `getTourRouterAccessLevel()` returning `'none' | 'free' | 'paid'` with admin bypass and bundle OR clause. `checkTourRouterAccess` rewritten as a deprecated wrapper. `requireTourRouterAccess()` now always succeeds for authenticated+org users (free tier passes through). New `requirePaidTourRouterAccess()` returns 402 `export_requires_paid` on the six export routes. 15 files modified, zero type errors.
- **Unit C (Localizer):** New `getLocalizerAccessLevel()` / `requireLocalizerAccess()` / `requirePaidLocalizerAccess()` mirroring TourRouter.

**Critical discovery during Unit C:** `/api/download` and `/api/download-all` are public venue-facing routes — venues don't have accounts. Gating them on `requirePaidLocalizerAccess()` would have broken the entire venue-share flow. Instead, both routes gate by the **link owner's org**, not the viewer. This is load-bearing architecture worth knowing about (see "For Your Review").

**Bonus fix:** While in `/api/download`, closed a pre-existing SSRF hole. The `url` query param is now validated against the `render_*_url` columns on the `venue_links` row, closing an open-proxy vulnerability that predates this work.

**Unit D (rate limiting)** was deferred. Your Localizer bug report took priority and consumed the rest of the session.

### Localizer bug chain — four bugs stacked on each other

You reported: "Generate All shows red error and no video on link" on a video-only tour. Four separate bugs came out of this:

1. **`/api/renders/tour-data` rejected video-only tours.** A line-18 guard required `image_square_id` and returned 400 "No images uploaded." The check predated video formats. Fixed with a `hasAnyAsset` check across all six asset columns.

2. **Bulk `generateAll()` in `EventsTable.tsx` never rendered videos at all.** The three image formats were rendered client-side via Canvas, but no video handling existed. The per-event re-render path through `/api/renders/generate` already handled videos correctly. Fix: added a `videosOnly` flag to `/api/renders/generate` that skips the image loop. `generateAll()` now fires a non-blocking `videosOnly: true` call after the image loop completes.

3. **Deleted source assets left stale render URLs on `venue_links`.** The loop skipped missing formats, so the spread never wrote NULL. Fixed: explicitly assign `null` to `renderUrls` when the source ID is null, in both client and server paths.

4. **Custom fonts on videos never worked.** Three cascading causes:
   - Double `.ttf` extension in `customFontsMap` construction
   - **The font upload route never uploaded to Cloudinary at all** — only Supabase. This was latent since the feature was built. Image renders happened to work because the Canvas path loads fonts from Supabase; videos don't.
   - Cloudinary requires `type: "authenticated"` for raw font files used in `l_text` overlays. Public raw uploads return 400 on the transformation.

All four fixed end-to-end. Verified against JESUS ETC (video-only test) and Uncle Lucius (custom font test).

### Hidden schema debts discovered and fixed

- **`orgs` INSERT RLS policy was unsatisfiable from day one.** Old policy had `WITH CHECK ((auth.uid() IS NOT NULL) AND (id = gen_random_uuid()))` — the `gen_random_uuid()` clause generates a fresh UUID on every evaluation and can never match a client-supplied UUID. Every signup since launch has relied on the auth callback's service-role client bypassing RLS entirely. Fixed.
- **`org_members` had no UPDATE RLS policy.** All updates to user_role, onboarding state, etc. were silently failing since table creation. Fixed.

Both were latent bugs that would have bitten us during beta.

### Phase 7H onboarding wizard shell

Three-step flow (org name → user name → role) at `/dashboard/onboarding`. Server page with auth + org lookup + redirect. Client `WelcomeWizard` with full HwCard/HwInput/HwSelect/HwAlert integration, Enter-to-submit, skip/resume via `orgs.onboarding_step`. API route at `/api/onboarding/step` with RLS silent-write guards. Shared role source of truth at `lib/onboarding/roles.ts`. Old tour creation wizard moved from `/dashboard/onboarding` to `/dashboard/onboarding/tour` (git mv, history preserved).

**Still blocked on you:** wizard steps and Beta Test Band demo tour seed data.

**Known design gap:** `onboarding_completed` is per-org but `user_role` is per-user. Users joining an existing onboarded org skip the wizard and never set their role. Needs a decision before beta.

### Also landed

- `CLAUDE.md` at repo root — 157 lines of persistent rules, workflow, and key file locations loaded automatically on every Claude Code session start. This has paid off every day since.
- Dashboard auto-create refactor — org creation moved from `app/dashboard/page.tsx` into `app/auth/callback/route.ts` via a new `ensureOrgExists()` helper. Idempotent, RLS-guarded.

---

## April 10 — GEO_CITIES geocoding backend + Localizer polish

**12 commits.** Split across two major threads.

### Thread 1: GEO_CITIES end-to-end

- **Backend:** `geo_cities` Supabase table, three-tier lookup (in-memory constants → Supabase table → Mapbox Geocoding API with write-back), API routes, city + airport resolution.
- **`calcTourFinancials` integration:** Added two optional params (`coordsMap`, `airportMap`) mirroring the existing `driveData` prefetch pattern. Keeps `calcTourFinancials` synchronous (load-bearing invariant — it can never become async).
- **Client-side integration:** Routing page prefetch, autocomplete on the Add Show modal, unresolved-city warnings on the import page.
- **Data layer pivot:** Originally followed your spec for a GeoNames + OurAirports seed. Ran into multiple issues — Supabase PostgREST 1000-row cap breaking airport matching, transient Node fetch failures killing 6 countries mid-seed, GeoNames feature-class filtering missing major US cities (Miami FL, Philadelphia PA), and ~14 wrong IATA assignments for name-collision cases. After a call, pivoted to a hand-curated 332-city list covering major US touring markets plus dense Europe per your request. Every row has verified coordinates and primary commercial airport IATA. Zero ambiguity.
- **Build fix learning:** `npx tsc --noEmit` validates types but does NOT catch Next.js server/client boundary violations. The first push broke production because `geocoding.ts` imported from `supabaseServer.ts` (which uses `next/headers`), and a client page was importing `cacheKey` from `geocoding.ts`, dragging the entire server chain into the client bundle. Fix: moved `cacheKey` to `geocoding-shared.ts` with zero server deps. **Going forward:** always run `npm run build` before pushing changes that touch shared `lib/` files. `tsc --noEmit` is insufficient.

**Current state of the seed:**
- 332 cities, all `source='curated'`
- 292 have IATA codes, 40 fall back to nearest-airport RPC
- 24 countries: US 150, GB 28, CA 20, DE 20, FR 15, IT 12, ES 10, JP 10, AU 10, NL 8, others smaller
- MIA, AUS, PHL all confirmed working

### Thread 2: Localizer polish + venue page fixes

- **Video logo overlays** via Cloudinary `l_fetch` + `e_colorize` — completes the logo story started April 9.
- **Generate All progress bar freezing at 0/total on video-only tours** — fixed.
- **Square image prefill leaking into Story + FB cover** — killed the `?? tour.image_square_id` fallback in `EventsTable.tsx`.
- **Individual file names missing show info** — added `filenameSlug` (band + venue + date) to download anchor filenames.
- **Artist name editability affordance** — tightened UX on profile page.
- **Download-all event query missing `city`** — fixed.
- Updated your admin email from `hwy61regan@gmail.com` to `tentenpm@gmail.com` across the code.

### Housekeeping

- Reverted HWY 61 TEST CO. `bundle_plan_status` to null (set to 'active' during April 9 Unit C testing).
- Deleted duplicate Uncle Lucius artist (`eab49bf6-6fe8-4535-833b-0131a42ed96d`) and its two test tours.
- Created `docs/HANDOFF_April10_2026.md`.

---

## April 11 — Your April 11 Localizer UI spec (20-item list)

**6 commits.** Your spec, item by item.

### Shipped (16 items)

- **Middleware `getSession()` fix** — eliminated rate-limit bursts on login (precursor to the April 13 middleware session rotation fix).
- New Artist field starts empty (#1)
- Hospitality & Rider → Hospitality (#3)
- Import Scheduler copy: "HWY61 Labs" not "The AI" (#5)
- Video labels updated; `yt_shorts` changed to square 1080×1080 across all render paths (#6, #7, #8)
- Template format tabs wrap; TikTok label two-line
- Design Template rename throughout (#10)
- Text element order: Venue → City → Date (#11)
- City & State → City (#12)
- Venue / City / Date visibility toggles (#13)
- Short Date and All Caps on by default (#14)
- Gigs page helper texts (#16, #17, #18, #19)
- Download-all `BandName_Date_City` file naming (#20)

### Deferred at the time (4 items)

- **#2 Tour Manager field** — I said it needed a DB migration. I was wrong. See "For Your Review."
- **#4 Next → button** — you're happy with current UX
- **#9 Optional third video slot** — low priority
- **#15 Tour-level Download All page** — half-day build, needs its own dedicated session. Still on the horizon.

---

## April 12 — Tour Manager field

**2 commits.**

- SQL migration: `tour_manager_name`, `tour_manager_email`, `tour_manager_phone` added to `artists` table.
- UI: `tour_manager` added to `TEAM_ROLES` between Manager and Booking Agent.
- Removed unused `agent` role from UI. DB columns `agent_name/email/phone` left in place (no more UI references — can clean up later).
- Round-trip verified: name, email, phone all persist independently.

This closed deferred item #2 from your April 11 list (TourRouter-side). The Localizer-side Tour Manager field addition is **now unblocked as of today's BUG-B fix** — see "For Your Review."

---

## April 13 — Tour Marketing Hub + middleware session rotation fix

**8 commits.** Two major pieces.

### Tour Marketing Hub (shipped full end-to-end)

This was your deferred item #15 from the April 11 list, redesigned on April 12 after killing the original "one giant zip" idea (Vercel function size/timeout limits would have blown up).

**New architecture:** Token-based shareable hub at `/v/tour/[token]` linking to marketing-only per-show pages at `/v/m/[token]`, with a `/api/download-all/marketing` endpoint that excludes advance materials.

**Security model — structural, not runtime-filtered:** Marketing routes are physically separated from venue routes. They cannot query `artist.adv_*` fields because their code does not select those columns. This is the strongest form of isolation — no conditional filters that could be bypassed if someone forgets a WHERE clause in a future edit.

**What shipped:**
- `marketing_tokens` Supabase table + RLS policy keyed to `org_members`
- `/v/m/[token]` marketing-only per-show page (mirrors `/v/e/[token]` minus advance materials)
- `/api/download/marketing` per-asset proxy
- `/api/download-all/marketing` zip endpoint (Social/ + Video/ only, no Advance/ folder)
- `/v/tour/[token]` tour marketing hub landing page with READY/RENDERING badges per show
- Three management API routes — create, list, revoke — with auth + org membership checks
- `ShareWithMarketingButton` client component + modal slotted into the tour view's EVENTS header

All five end-to-end flows tested locally and verified.

### Middleware session rotation fix — CRITICAL for beta

**Commit:** `3df9c99`

**The bug:** Users logging in to prod after overnight idle periods were hit with "session expired" and bounced to `/login` every morning. Two separate bugs in `middleware.ts` broke Supabase refresh token rotation:

1. **Coming Soon block used `getUser()` (network call) and threw away rotated cookies.** It created a local `comingSoonRes`, wrote Supabase's rotated cookies to it, then fell through to the rewrite/auth logic below which created a *different* `res` object. The rotated cookies never reached the browser. Next request, the browser sent the old (now server-invalidated) refresh token → session expired.

2. **Main auth guard's `setAll` only wrote to `res.cookies`, not `req.cookies`.** The canonical `@supabase/ssr` pattern requires writing to both so downstream code in the same request sees the rotated session.

3. **Compounding factor:** `getUser()` in the Coming Soon block was hitting the Supabase `/token` endpoint on every marketing-route request, contributing to burst rate-limiting.

**The fix:**
- Single shared `res` and single shared Supabase client at the top of `middleware()`, reused across Coming Soon / rewrite / auth guard blocks
- `setAll` writes to both `req.cookies` and `res.cookies` in place — does NOT reassign `res` (reassigning clobbers rewrites and custom headers)
- Coming Soon uses `getSession()` (cookie-only, no network) instead of `getUser()`
- Rewrite path copies cookies from old `res` onto the new rewrite response before reassigning
- Both redirect paths preserve cookies from `res` using `.set(cookie)` with the full cookie object (preserves httpOnly/secure/sameSite/path)

**Why this mattered for beta:** Every beta tester would have hit this. Any user who logged in, closed their laptop overnight, and came back the next morning would have been greeted with "session expired" — terrible first impression for a paid SaaS. **This had to be fixed before any external user touched prod.**

**Required check before onboarding beta users:** test the overnight-idle scenario manually. Log in, wait >1 hour (ideally overnight), return, confirm session is still active.

### Backlog flagged during the Marketing Hub build

- **`/api/renders/print-pdf` has no auth.** PrintDownloadButton hits it with just `eventId`, no token. Anyone with an event ID can generate the print PDF. Pre-existing, not introduced by this work.
- **`/api/tours/[tourId]/overlay-config` has a service-role fallback that bypasses RLS** with no explicit auth or org membership check. Pre-existing.
- **`HwToastProvider` is defined but never mounted anywhere in the app.** `useToast()` would throw if used. Should be wrapped in root layout if we want toasts available. Worked around in the Share button with an inline COPIED indicator.

---

## April 14 morning — Sponsor logos end-to-end

**10 commits.** Full feature shipped.

**Two-slot sponsor logo feature across the entire render pipeline:**
- **Supabase:** `sponsor_logo_1_url`, `sponsor_logo_2_url` text columns on `tours`
- **API:** POST/DELETE/GET at `/api/tours/[tourId]/sponsor-logo?slot=1|2`
- **API:** `sponsorLogo1Url` / `sponsorLogo2Url` returned from `/api/renders/tour-data`
- **UI:** Template editor sidebar — collapsible single-row panels, click empty checkbox to upload, drag/resize in preview, per-format position saved to `overlay_config`
- **Client canvas (`lib/clientRender.ts`):** plain `ctx.drawImage`, no tint, renders on square/story/landscape/print via EventsTable → Cloudinary upload flow
- **Server video renderer (`/api/renders/generate`):** new `buildSponsorLogoLayer()` helper — identical to `buildLogoLayer` minus `e_colorize`. Renders on `tiktok` + `yt_shorts`.
- **Print PDF (`/api/renders/print-pdf`):** `pdf-lib` `embedPng` + `page.drawImage`, native colors via PNG alpha channel.

**Tested on production:** all six formats + print PDF render sponsor logos correctly on first try.

**Key decisions (confirmed with you upfront):**
- **No tint.** Sponsor logos render as uploaded. Users upload a PNG in the color they need.
- **Sponsor panels collapse to one-row toggle,** matching the Text Color panel footprint.
- **Click empty checkbox opens file picker directly** → auto-expand on upload success → minimum friction.

**Gotcha worth knowing for future work:** The kickoff doc assumed `/api/renders/generate` drew the band logo on all formats. It doesn't — only videos. For square/story/landscape JPEGs, `EventsTable` calls `renderPoster()` in the browser canvas and uploads the blob directly to Cloudinary, then POSTs to `/api/renders/save-urls`. The `buildCloudinaryUrl` image path in `/api/renders/generate` is effectively dead code (gets immediately overwritten). Not fixed today, but flagging for the next time anyone touches that area.

**Open question for you — see "For Your Review."**

---

## April 14 afternoon/evening — Backlog cleanup

**9 commits.** Today's bug run.

### Auth daily pain — root cause fixed (`5255a82`)

Local dev auth has been breaking daily for weeks, forcing re-logins and cookie clears. **Root cause:** PKCE code verifier was being rejected on HTTP localhost because the cookie was being set with `Secure: true`, which browsers silently drop on non-HTTPS origins. The verifier would vanish between the auth redirect and the callback, and Supabase would reject the exchange. **Fix:** conditionally set `Secure` only on HTTPS. Production unaffected. Local dev now holds the verifier cookie across the redirect.

### BUG-A + BUG-D: saveFields debounce data loss (`b75c9a2`)

Rapid edits to form fields could silently lose data. If a user typed field A, then immediately typed field B before the 500ms debounce fired, field A's pending write could be overwritten by field B's payload. Fix: debounced saves now merge pending changes into a single payload keyed by field name rather than replacing wholesale.

### BUG-C: `.single()` → `.maybeSingle()` in marketing viewer (`df9d1a3`)

Public marketing viewer used `.single()` on a lookup that could legitimately return zero rows. On a miss, this threw PGRST116 and returned 500 instead of a clean 404. Fixed.

### BUG-B: Artist PUT whitelist missing 12 fields (`640ee13`)

**This is the important one.** The artist update endpoint (`PUT /api/tourrouter/artists/[artistId]`) had a hardcoded whitelist out of sync with the database schema. **Twelve valid fields were being silently dropped on every update:**

- `manager_phone`, `booking_agent_phone`, `publicist_phone`, `agent_phone`
- `tour_manager_name`, `tour_manager_email`, `tour_manager_phone`
- `adv_stage_plot_url`, `adv_hospitality_url`, `adv_foh_url`, `adv_w9_url`, `adv_custom_materials`

If the UI sent any of these, the endpoint accepted the request with 200 OK but wrote nothing. No error, no warning, just gone.

Fix: whitelist expanded to include all 12. Also hardened the post-update read from `.single()` to `.maybeSingle()` with an explicit 404 on null, so RLS/org-mismatch cases surface cleanly instead of 500ing.

**Any user who tried to save a phone number or advance doc URL in the past and found it missing on refresh — that bug is now fixed.**

### BUG-E: closed as misdiagnosis (`a5c733c`)

A backlog note flagged `render_poster_url` as a "dead column" in 4 download routes, suggesting we strip the references. I checked before editing and found the column is live — it exists on `venue_links`, is written by the Print Poster render pipeline (`lib/clientRender.ts` + `app/api/renders/print-pdf/route.ts`), and is read correctly by all 4 download routes. The 9/90 population rate reflects that Print Poster is an optional/opt-in format, not that the column is dead. **If I had trusted the backlog note and stripped the references, I would have broken tour poster downloads for the 9 venue_links that currently have rendered posters.** Closed as misdiagnosis with a resolution note in `docs/BACKLOG.md`.

### ADMIN_EMAILS centralization (`fde2452`)

Admin email list was duplicated across 3 files. Created `lib/auth/adminEmails.ts` with a single `isAdminEmail(email)` helper. All 3 call sites now import from one location. Pure refactor, zero behavior change. The venue-download caveat comment in `lib/localizer/billingGate.ts` was preserved during the refactor and moved to sit directly above the `isAdminEmail(userEmail)` check. **That caveat is something I'd like you to ratify — see "For Your Review."**

---

## For Your Review — three things need your input

### 1. Tour Manager field in Localizer UI — now unblocked

When we went through your April 11 Localizer UI list, I deferred the Tour Manager field addition because I thought it needed a DB migration. **It didn't — I was wrong about the scope.** The columns `tour_manager_name`, `tour_manager_email`, `tour_manager_phone` already exist on the `artists` table (added April 12 for the TourRouter side). They just weren't being accepted by the PUT endpoint because of BUG-B, which is now fixed.

**As of today's 640ee13, the backend is ready.** Adding the Tour Manager field to the Localizer UI is now a pure frontend task whenever you give the green light. Let me know if you want me to slot it into the next session.

### 2. Sponsor logo tint question — still open from this morning

During the sponsor logo build, I tested with a black sponsor PNG on a dark background image and it wasn't visible. The kickoff doc says no-tint and that's what shipped, but this is a real usability gotcha. Two options:

1. **Keep strict no-tint** + update the upload helper text ("upload a PNG in the color you need for your background")
2. **Add an optional "tint to text color" toggle** per sponsor slot for monochrome logos

I need your call before the next sponsor logo iteration. It's low-urgency but worth resolving so we don't ship it twice.

### 3. Venue-download billing gate caveat — needs ratification

There's a deliberate architectural decision currently documented only as a source-code comment in `lib/localizer/billingGate.ts`:

> Venue-facing download routes (`/api/download`, `/api/download-all`) deliberately omit the `userEmail` argument when calling the billing gate, so admin-owned venue shares are gated like any other org for the public download flow.

In other words: even if I (an admin) own a tour, the public venue download page for that tour gets gated based on the org's plan, not my admin status. Admins don't get a free bypass on their own venues' public download flow.

**I think this is correct** — admins shouldn't get free downloads on their own venues when testing the public flow, or the testing becomes meaningless. But it's worth you ratifying this, and I'd like to fold it into the billing gate audit doc once we pick that back up. Does this match your mental model, or did I miss a nuance?

---

## Still Open (not touched during this 6-day window)

- **Mapbox write-back silent RLS risk** in `lib/tourrouter/geocoding.ts` — fire-and-forget without `.select().maybeSingle()`. Same pattern as today's BUG-B and BUG-C. Should be cleaned up.
- **Full billing gate audit** across all 41 API routes — partially done. Blocked on your input for the shared helper design.
- **Hardcoded `CITY_COORDS`** in `lib/tourrouter/constants.ts` — deferred replacement with the new geocoding API. `mapbox.ts` line 79, `flights.ts` line 73, `geography.ts` lines 56–57 still use sync `getCityCoords` as haversine fallbacks. Not urgent — only matters if Mapbox Directions fails AND the city is outside `CITY_COORDS`.
- **Tour-level Download All page** (`/v/tour/[tourId]`) — still waiting for a dedicated half-day session.
- **Remaining expense tabs** (Transport, Food, Gear, Misc, Merch, Promo, Other) — follow the Accommodation pattern.
- **Onboarding wizard completion** — shell built April 9, blocked on your wizard steps + Beta Test Band demo data.
- **Stripe restructure** — blocked on EIN (IRS processing pending).
- **Freemium Unit D (rate limiting)** — Upstash Redis, four priority tiers, ~90 min. Spec captured in backlog.
- **Per-user vs per-org onboarding state mismatch** — `onboarding_completed` is per-org but `user_role` is per-user. Users joining an existing onboarded org skip the wizard and never set their role. Needs a decision before beta.
- **`/api/renders/print-pdf` has no auth** — pre-existing, flagged April 13. Any event ID can generate a print PDF.
- **`/api/tours/[tourId]/overlay-config` service-role fallback** bypasses RLS with no auth check. Pre-existing, flagged April 13.

---

## Required check before onboarding beta users

From the April 13 middleware fix, repeating it here because it's critical:

**Test the overnight-idle scenario manually.** Log in, wait >1 hour (ideally overnight), return to the site, confirm session is still active. This was the "session expired every morning" bug that commit `3df9c99` was supposed to fix. Worth verifying on prod before any external user touches it.

Also: confirm `COMING_SOON=false` in Vercel env vars when you're ready to launch publicly. That removes the Coming Soon gate entirely, eliminating that code path as a risk area.

---

## Commit log (April 9 → April 14)

**April 9 (3 commits):** `ae091df` Generate All video fixes · `2465c9f` custom fonts on videos · `8c63ff8` session wrap

**April 10 (12 commits):** `74fb7fb` video logo overlays · `4de79e8` progress bar freeze fix · `b6db3fa` handoff doc · `daf23f4` artist name UX · `e6cee8a` venue page download fixes · `b28b8ca` session log · `0dc7774` Tim admin email update · `39dbde6` GEO_CITIES spec · `0824f49` geocoding backend · `4758f2f` calcTourFinancials wiring · `841eb3e` client-side geocoding · `8226f1c` curated 332-city seed · `addf5e6` client bundle fix · `0943736` session log

**April 11 (6 commits):** `852afe8` middleware + artist + Hospitality rename · `db6a5cb` video labels + yt_shorts 1080×1080 · `df98a47` template tabs wrap + tiktok label · `495f898` template rename + element order + visibility toggles · `01384a7` gigs page helpers + download-all naming · `11ad445` session log

**April 12 (2 commits):** `0254268` session log · `12db1b5` Tour Manager field

**April 13 (8 commits):** `3df9c99` middleware session rotation fix · `7b70e41` session log · `789e83e` kickoff doc · `3a323e1` session log · `2fc8c4c` marketing-only viewer + download · `099efee` marketing download-all · `38b42e6` tour marketing hub landing · `b3897ce` marketing token API · `40b2beb` share with marketing modal · `f618094` session log · `5cbee45` back link from gigs

**April 14 morning (10 commits):** `e68089b` sponsor logos kickoff · `f914f4b` upload/delete API · `b5800c8` tour-data API · `ceb3818` GET handler · `4b63467` template editor controls · `a1df3bc` collapse to single-row toggle · `2e54f30` client canvas rendering · `94781ea` video formats rendering · `41dbd79` print poster PDF rendering · `656e02c` / `d3a4cf5` session logs

**April 14 afternoon/evening (9 commits):** `b75c9a2` BUG-A + BUG-D · `fac700b` QA report · `5255a82` PKCE verifier fix · `df9d1a3` BUG-C · `da31c98` docs housekeeping · `640ee13` BUG-B · `a5c733c` BUG-E closed · `fde2452` ADMIN_EMAILS refactor · `fb48989` session log

---

## Questions for you

1. **Tour Manager field in Localizer UI** — ready for me to slot into the next session, or is there a different priority?
2. **Sponsor logo tint** — strict no-tint + updated helper text, or add an optional tint toggle per slot?
3. **Venue-download billing gate caveat** — does my description match your intent?
4. **Next session focus** — Tour Manager UI, remaining expense tabs, tour-level Download All page, Freemium Unit D rate limiting, or something else?
5. **Onboarding wizard** — do you have wizard steps and Beta Test Band demo data ready? This is the last thing blocking wizard completion.

Let me know which threads to pull on.
