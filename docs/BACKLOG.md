# HWY61 Backlog

Forward-looking list of features, refactors, and design questions to revisit after Phase 7 launch. Not a commitment — a parking lot. Items here require Tim sign-off before moving to the build plan.

## 🔴 Active issues affecting users (0)

*Bugs your beta users could trip over right now.*

*No active issues at the moment. Items will appear here when bugs that affect users get logged.*

---

## 🟡 Pre-launch gates (7)

*Things that must be true before flipping `COMING_SOON=false`.*

### Onboarding wizard — per-user vs per-org state mismatch

`orgs.onboarding_completed` is org-level state, but `org_members.user_role` is per-user. When a new user joins an existing onboarded org, they skip the wizard entirely and never get a chance to set their role.

**Example found April 9, 2026:** Drew completed the wizard on HWY 61 TEST CO. and got user_role = Tour Manager. Tim is also a member of the same org with user_role = null because the wizard only runs once per org, not once per user.

**Possible fixes (need Tim's input):**
1. Move onboarding state to org_members so each user onboards independently (org_members.onboarding_completed, org_members.onboarding_step)
2. Keep onboarding_completed on orgs but add a lightweight "role picker" prompt that fires on first login for any member whose user_role is null, regardless of org-level state
3. Accept the gap — assume Tim's beta invites will be sent to users who create their own orgs, not users joining existing orgs

**Decision needed before beta launch** since Tim's beta users will be joining orgs Tim already created for them.

---

### Audit and clean up stale test workspaces

As of April 9, 2026, the orgs table has 12 rows all named "My Workspace" — leftover test accounts from earlier development. Before public launch, audit and delete any that aren't tied to active users (Drew, Tim, or beta invitees).

---

### Remaining custom fonts need to be re-uploaded

Two of the three existing `custom_fonts` rows still point at Cloudinary assets that don't exist: BebasNeue-Regular and Pragmatica-Extended-Extra-Bold. They were uploaded under the old broken pipeline that never wrote to Cloudinary. The render code will silently fail on any tour that uses these two fonts on a video overlay.

BullandRegular-d91g6 was already re-uploaded tonight and verified working on Uncle Lucius. The other two just need to be deleted via the UI and re-uploaded from their original font files (sources in Supabase storage URLs from the `custom_fonts.storage_url` column if Drew no longer has the local originals).

---

### Verify new-user signup works end-to-end before launch

Supabase email signups are currently DISABLED at the project
level (Authentication → Providers → Email). No new user can sign
up on production right now. This is deliberate during the Coming
Soon gate.

**Before flipping `COMING_SOON=false`:**
1. Re-enable Supabase email signups
2. Create a fresh test email (e.g. `yourname+test1@gmail.com`
   via Gmail plus-addressing)
3. Run through full signup → magic link → auth callback →
   onboarding wizard flow
4. Verify `ensureOrgExists` correctly provisions a new org and
   `org_members` row (it has never been tested from this code
   path — HWY 61 TEST CO. was created manually on March 10,
   before `ensureOrgExists` was moved to the auth callback in
   commit 9f88d03 on April 9)
5. Verify the beta invite gate at app level correctly blocks
   un-invited signups
6. Verify Google OAuth also works for a fresh account

**Launch blocker if untested.**

---

### Advance feature — full audit needed before re-enabling

*Items discovered during Localizer beta development that need addressing before TourRouter is production-ready. Not urgent while the beta is Localizer-only, but critical before TourRouter ever ships to real users.*

**Context:** Discovered on April 22, 2026 that the TourRouter advance cron was firing daily but the underlying implementation had multiple issues. The cron was disabled (commit `c121f76`) before any real damage occurred — all apparent "sends" were to seed data with names instead of email addresses in the recipient field, so Resend rejected every attempt. No real promoter received anything. But the bugs are real and must be fixed before the feature ever goes live.

**Bugs to fix:**

1. **Schema / flow confusion — `advance_recipient_email` populated with names, not emails.**
   Whatever path is writing to `tour_shows.advance_recipient_email` is storing promoter display names ("Aaron Blackwood") instead of email addresses. Likely candidates: the demo seed data (`app/api/tourrouter/demo-seed/`), the advance-assignment UI on the tour detail page, or the promoter contact import flow. Audit all three.

2. **No email-format validation in the cron.**
   The cron at `app/api/tourrouter/advance/cron/route.ts` line 214 calls `resend.emails.send()` unconditionally. Add a guard before the send:
```typescript
   if (!recipientEmail || !recipientEmail.includes("@")) {
     console.warn("[advance/cron] skipping show with invalid recipient", { showId, recipientEmail });
     continue;
   }
```
   Prevents future silent failures from polluting `advance_emails` and the digest.

3. **Silent RLS failure on `tour_shows` status update.**
   The `supabase.from("tour_shows").update(updates).eq("id", showId)` call at ~line 232 has no `.select().maybeSingle()` verification. If RLS rejects the update, the cron re-evaluates the same show the next day and fires another email. Same pattern that bit us on auth earlier tonight — needs the same fix pattern (verify with `.select().maybeSingle()` and throw on unexpected zero-row response, or use service-role client for this write).

4. **Feature has no gate.**
   There's no feature flag, no env-var kill switch, no `tourrouter_advance_enabled` column. The cron either runs or doesn't, based on `vercel.json`. Before re-enabling, gate the whole feature behind `orgs.tourrouter_enabled` at minimum, and ideally behind a per-tour or per-org `advance_enabled` flag so it's opt-in.

**Related code paths:**

- `app/api/tourrouter/advance/cron/route.ts` — the scheduled send loop
- `app/api/tourrouter/advance/send/route.ts` — the manual "Send Advance" button handler (already has a console.error flagging the same RLS issue at line 118)
- `app/dashboard/routing/[tourId]/page.tsx` line 656 — the `sendAdvance` button UI
- `advance_emails` table — audit log
- `tour_shows.advance_status`, `tour_shows.advance_sent_at`, `tour_shows.advance_recipient_email` — state columns

**Re-enabling checklist:**

Before adding the cron back to `vercel.json`:

- [ ] All four bugs above fixed and tested
- [ ] Tim has reviewed the email templates and confirmed copy
- [ ] Feature flag / gate in place, defaulted OFF
- [ ] End-to-end test with a real (test) promoter email address, not a name string
- [ ] Verify `advance_emails` log matches Resend delivery confirmations
- [ ] Status transitions verified with `.select().maybeSingle()` and surface any RLS errors

---

### Verify dmca@, privacy@, support@ hwy61labs.com inbox routing

`dmca@hwy61labs.com`, `privacy@hwy61labs.com`, and `support@hwy61labs.com` are referenced as official contact channels in the finalized Privacy Policy (`app/privacy/page.tsx`) and Terms of Service (`app/terms/page.tsx`). Before public launch, verify all three route to a real, monitored inbox.

`dmca@` is the legal DMCA agent channel — copyright notices must actually be received for HWY61 LLC to maintain safe-harbor status. Setup/DNS verification work, not code.

**Launch blocker if any of the three bounce or silently drop.**

---

### Real legal review of Privacy Policy + Terms of Service

`app/privacy/page.tsx` and `app/terms/page.tsx` were finalized for internal consistency on 2026-05-27 — HWY61 LLC entity name, June 1, 2026 effective date, hwy61labs.com domain, and content accurate to current product behavior — but they were not reviewed by counsel.

Get a real legal review before public launch. The liability, indemnification, and limitation-of-liability clauses in particular warrant professional sign-off given HWY61 LLC processes payments through Stripe.

**Launch blocker if not reviewed.**

---

## 🟢 Ready to build (5)

*Scoped, unblocked, just needs a session.*

### Unit D — Rate limiting (Upstash Redis)

Fourth unit of the April 9 freemium work, not started. Tim's decision doc specifies Upstash Redis with four priority tiers: AI parsing routes (50/hr/org), venue/contact reads (200/hr/org), exports (30/hr/org), everything else (500/hr/org). Returns 429 with `Retry-After` header on limit. Scoped for roughly 90 minutes when tackled fresh. Deferred to a future session because Tim's Localizer bug (discovered mid-session) took priority and consumed the remaining time in the April 9 session.

---

### Centralize `ADMIN_EMAILS` constant

Admin emails (`hwy61ai@gmail.com`, `tentenpm@gmail.com`) are
duplicated across five locations, three as exported `ADMIN_EMAILS`
arrays and two as inline hardcoded email comparisons:

1. `lib/tourrouter/billingGate.ts` line 4 (array)
2. `lib/localizer/billingGate.ts` line 8 (array)
3. `app/dashboard/artists/[artistId]/ArtistHubClient.tsx` line 9 (array)
4. `app/dashboard/page.tsx` line 46 (inline hardcoded)
5. `app/api/fonts/upload/route.ts` line 45 (inline hardcoded)

Any update requires touching all five. The inline checks in
locations 4 and 5 will drift silently if someone updates the
three array locations expecting them to be authoritative.

**Fix:** extract to `lib/auth/adminEmails.ts` as a single
exported constant, import everywhere, convert inline checks to
`ADMIN_EMAILS.includes(email)`.

Effort: ~30 minutes. Not urgent. Do before launch so new admin
additions don't require five-file edits.

---

### /api/venue-link — missing auth check

*Surfaced April 17, 2026 during ESLint rule design for supabaseServer forbidden zones.*

app/api/venue-link/route.ts (the POST handler that creates or fetches a venue share token for an event) is called only from the dashboard by logged-in tour managers — as of April 17 the only caller is app/dashboard/tours/[tourId]/components/EventsTable.tsx line 524. But the route itself doesn't verify the caller is logged in. It trusts whatever orgId and eventId arrive in the request body and happily creates a venue_links row under that org.

In practice this hasn't been exploited because only dashboard code calls it and no malicious traffic is hitting the endpoint. But the route would gladly create tokens for any orgId an unauthenticated attacker posts, and the RLS policies on venue_links may or may not catch it depending on how they're written (not yet audited).

**Fix:**
- Add a `supabase.auth.getUser()` check at the top. Return 401 if null.
- Verify the authenticated user is a member of the requested orgId before creating the row. Return 403 on mismatch.
- Pattern to follow: app/api/marketing-tokens/create/route.ts already does this correctly — model after it.

**Priority:** Low-medium. Hygiene, not a user-facing bug. Belongs in a pre-launch security hygiene pass rather than a standalone urgent fix.

---

### `drive_cache` schema: add `origin_country` / `dest_country` columns

*Surfaced 2026-05-11.*

`drive_cache` is keyed by `(origin_city, dest_city)` lowercased text. No country columns, no country in the unique constraint. After the May 11 fix the geocoding step is country-disambiguated, so coords going into Mapbox Directions are correct — but the `drive_cache` row that gets written is still keyed only on city pair. Two tours can collide on same-named cities across countries, and `Prefer: resolution=merge-duplicates` will overwrite blindly.

The five `(chicago, il → chicago, il)` zero-distance fossil rows in `drive_cache` today appear to be from a much earlier era when `origin_city` was being set to the raw `"city, state"` string — not from real legs. Inert. Can be deleted as part of this cleanup.

**Fix:** add `origin_country text` and `dest_country text` columns, update the unique constraint to `(origin_city, origin_country, dest_city, dest_country)`, update `cacheDriveInfo` in `mapbox.ts` to write country, update the `drive_cache` lookup query in `getDriveInfo` to filter on country. Old rows without country can either be backfilled from resolved coords or just left to age out as new lookups write fresh rows.

Effort: ~1 hour including migration, writer update, reader update, and verifying existing rows behave.

---

### Kurt Penny notes — batch 2 (template editor UX)

*Surfaced 2026-05-12 in Kurt's original beta-feedback email. The first 10 notes shipped 2026-05-12. Item #2 below shipped 2026-05-13 (commit 6266023). Item #3 declined 2026-05-14 — not pursuing. Item #1 is the only remaining open work.*

**#1 — Checkbox-to-reveal pattern + Band Name consolidation:** Currently field visibility (showVenue/showCity/showDate checkboxes) is decoupled from field controls (sliders, color, position in the TEXT SIZES card). Kurt suggests folding them: checking the box reveals that field's full control set. Also consolidate the separate Band Name panel into the same City/Venue/Date panel — currently Band Name has its own card.

**#2 — Group related options near what they modify:** ✅ Shipped 2026-05-13 (commit 6266023). "Short date" and "All caps" currently sit at the end of the sidebar in their own panels. Kurt suggests moving them adjacent to City/Venue/Date where they apply. Short date is Date-specific. All caps applies to all text fields — TBD whether it stays global or becomes per-field.

**#3 — Wide horizontal stepper, not stacked vertical:** ❌ Declined 2026-05-14. Keeping the existing stacked vertical workflow nav. The workflow nav (1. IMPORT → 2. ARTIST → 3. GIGS → 4. ASSETS → 5. TEMPLATE) currently reads as a stacked vertical list. Kurt argues a horizontal stepper better communicates linear forward motion through a process, while stacked layouts read as a single-page outline. Trade-off: narrow laptop widths might truncate stepper labels or push content below the fold. Worth a sketch before committing to a redesign.

**Effort estimate (remaining #1 only):** Half-day session for the template editor sidebar restructure.

---

## 🗣️ Comms / launch ops (1)

*Launch-related tooling and content — not feature code, not Tim-blocked.*

### Tim launch update PDF template

Warhol-styled HTML template Drew duplicates every few days and prints to PDF from Chrome. Includes:

- Hero with % complete + progress bar
- Four current-state sections (Shipped / In flight / Waiting on Tim / Coming up this week)
- "Road to launch" section with Week 2 / Week 3 / Week 4 subsections

Design preview locked in May 24, 2026 chat session.

**Build steps when picked up:**
1. Create `docs/templates/TIM_LAUNCH_UPDATE_TEMPLATE.html` with Bebas Neue via Google Fonts + print stylesheet
2. Create `docs/tim-updates/` directory with a README explaining the duplicate + edit + save-as-PDF workflow

---

## ⚪ Awaiting Tim (5)

*Blocked on his decision, copy, or sign-off.*

### In-app chatbot

Goal: user-facing helper chatbot inside TourRouter/Localizer that answers questions about how to use the app and, ideally, about the user's specific current context.

**Tier 1 — Docs-aware helper (~3–5 days build)**
- Claude API call with system prompt containing help docs, feature descriptions, common workflows
- Answers general "how do I..." questions from docs only
- No knowledge of user's actual data — read-only, low risk
- Best implemented with RAG (retrieval-augmented generation) over indexed docs so it scales as the app grows
- Hidden cost: requires real user-facing help docs to exist first (currently lives in session log, build plan, Drew's head). ~2–3 weeks of writing before the bot is worth building. Tim will have opinions on voice/content.

**Tier 2 — Context-aware helper (~2–3 weeks build, after Tier 1)**
- Same as Tier 1, plus current page context passed into each message ("user is on Settlement screen, Tour X, Leg 4, Stuttgart show")
- Can answer specific questions like "why is my fuel cost high on this leg?" with real data
- Still read-only — no writes, no tool calls, no edits on user's behalf
- Sanitized data snapshot per message; no persistent access

**Deliberately skipped: Tier 3 (agentic helper with write access).** Same risk profile as managed agents — new attack surface for RLS bypasses, silent write failures, user error via liberal interpretation. Revisit only after product is stable.

**Dependencies before starting:** written help docs, Tim sign-off on scope and voice, decision on RAG infrastructure (likely Supabase pgvector since we're on Postgres — no new vendor).

---

### OnboardingGate / old welcome choice screen retirement

app/components/OnboardingWizard.tsx (the GET STARTED / EXPLORE DEMO / SKIP welcome choice screen) still renders on dashboard login for users with zero artists. Its role is being absorbed by the new three-field WelcomeWizard plus the demo tour button that will eventually live inside it. Retire the old choice screen and OnboardingGate wrapper once:
1. Tim delivers demo tour seed data and the demo tour button is wired into the new wizard
2. The new wizard covers the "fresh user with nothing" state end-to-end

Until then, both flows coexist: WelcomeWizard runs once per org on first login, and OnboardingGate still shows to users with zero artists.

---

### Stylized export files (PDF, day sheets, advance sheets)

**Idea logged:** April 9, 2026. Currently all exports — PDF tour summary, day sheets, advance sheets, end-of-tour finance report — are functional but visually generic. They don't look like they came from HWY61. For a product whose thesis is "the platform every touring band rolls down," the physical artifacts (the PDFs a tour manager hands to a promoter, the day sheet a driver reads at 6 AM) should be instantly recognizable as ours.

**What this means concretely:**
- Apply the Warhol design system to PDF exports: black, white, crimson (#c5535b), halftone dot overlay, Bebas Neue / Space Mono / DM Sans typography, 3px black borders, flat offset shadows, zero border-radius.
- HWY61 Labs wordmark and/or logo in the header of every exported document.
- Consistent layout grid across all five export types so they feel like a family.
- Subtle footer line: "Generated by HWY61 Labs · hwy61labs.com" or similar — Tim to refine copy.
- Tour manager name and generation timestamp on the cover/header.

**Technical notes:**
- Exports are built with pdfkit (the TourRouter export routes use pdfkit; pdf-lib is used elsewhere in the codebase, e.g. Localizer's poster PDF path — verify which one a given file uses before making changes) server-side. Typography requires the existing Google Fonts user-agent spoof trick to fetch .ttf files (documented in CLAUDE.md rule 16).
- The Canvas renderer used by Localizer posters is a separate system and lives in its own universe (CLAUDE.md rule 15). Do not try to share code between the two — the PDF exports need their own styling layer.
- day sheet and advance sheet templates live in app/api/tourrouter/tours/[tourId]/export/daysheet and .../advance respectively.
- Five files to restyle: csv (N/A — stays plain), excel (stays plain), pdf, daysheet, advance, plus the finance report PDF.

**Priority:** Medium. Not blocking launch, but a real conversion lever — when a promoter sees the day sheet branded with HWY61, that is free marketing. Worth doing in the first month post-launch, alongside the tutorial video production.

**Dependencies:** Tim sign-off on final visual treatment, logo files at the right export resolution, any typography licensing questions resolved.

---

### Font upload route uses old plan schema

`app/api/fonts/upload/route.ts` lines 37–54 check `org.plan` against `"pro"` or `"agency"` for the plan gate on custom font uploads. That's the old pre-freemium billing schema. The April 9 freemium rollout is replacing those checks with `localizer_plan_status` and `bundle_plan_status` (see `lib/localizer/billingGate.ts`). When the 41-route billing gate rollout happens, this route should be migrated to use `requirePaidLocalizerAccess()` or the Localizer-side three-state enum instead of the raw `plan` column.

---

### Send to All Promoters — bulk send button on gigs page (proposed, awaiting Tim sign-off)

Status: Proposed in TIM_STATUS_2026-04-15.md, awaiting Tim's answers on three sub-questions before build.

**Build constraints (don't lose these when implementing):**
- **Resend rate limits:** Sends must fire serially with a small delay between them, not in parallel. Resend has per-second and per-minute rate limits, and clustered sends also increase spam-folder risk because mailbox providers flag bursts of identical-template emails to similar domains. A 25-show tour firing 25 sends in parallel could trip both rate limiting and spam classifiers. Recommend serial sends with 200–500ms delay between each (final number to be tuned during build), or a proper queue if Resend's batch API is more appropriate.
- **Idempotency:** Default behavior must skip rows already sent — re-sending the same link to a promoter who already received it would damage trust with promoters and the platform's reputation.
- **Failure handling:** A failure mid-loop must not block the rest of the sends. Collect failures and surface them in the final summary.
- **Reuse existing send mechanism:** Must call the same per-promoter send route as the single-send button, not duplicate the email path. Otherwise we'll have two send code paths to maintain.
- **Confirmation modal required:** Bulk email actions need a "Will send to N of M, K skipped, L missing email" confirmation before firing. No one-click bulk sends.

**Open questions for Tim (carried in TIM_STATUS_2026-04-15.md):**
- Force re-send checkbox in the modal? (Off by default if added.)
- Handling for rows missing a promoter email — silent skip or surface in confirmation?
- Button label preference?

---

## ⏳ Soak items (4)

*Waiting on production data or time to pass.*

### April 28 middleware band-aid removal

**Status:** Diagnosed 2026-05-06. Removal still pending — deferred to post-beta for safety.

**Background:** On April 28 a TEMPORARY unconditional redirect was added to middleware.ts (lines 99-106) sending `/` to `/coming-soon` for public hosts, with `?dev=1` as the bypass. Comment said the env-var-gated COMING_SOON block below it wasn't firing in production.

**Diagnosis (2026-05-06):** The env-var gate at lines 109-127 is working correctly. Confirmed by visiting `hwy61labs.com/?dev=1` in incognito — bypasses the band-aid via the dev query param, exercises the env-var gate directly, redirects to `/coming-soon` as expected.

**Most likely cause of the original misdiagnosis:** the env-var gate has an authenticated-user bypass at line 117 — admins testing the marketing site shouldn't be redirected. Testing while logged into the hwy61ai@gmail.com admin account would have correctly let the request through, looking like the gate "wasn't firing." The band-aid was added without auth bypass, confirming "the marketing site is hidden" but with broader scope than intended (no admin preview, no preview tokens).

Alternative explanation: `COMING_SOON=true` may not have been in Vercel env vars on April 28 and was added later without note. Either way, the gate is functional now.

**Removal plan (execute on a quiet day, post-beta):**
1. Delete lines 99-106 of middleware.ts (the 4-line comment block + the unconditional redirect)
2. `git push` to deploy
3. Verify in incognito: `hwy61labs.com/` → redirects to `/coming-soon` (env-var gate firing)
4. Verify admin bypass: visit while logged into hwy61ai@gmail.com → marketing landing renders
5. Verify preview bypass: `hwy61labs.com/?preview=true` in incognito → marketing landing renders
6. If anything looks off, revert the commit and re-diagnose

Total work: ~10 minutes. Zero new code, pure deletion. Low risk on a calm day with monitoring.

**Verification of May 5 fix:** Log in fresh, check DevTools cookies — sb-* auth cookies should have Expires/Max-Age ~30 days out (around June 4 2026). If shorter than that, fix didn't take or there's another code path setting cookies.

---

### Delete `geocodeCity` / `cacheGeocode` and drop `geocode_cache` table

*Surfaced 2026-05-11 as Phase 3 follow-up to the country-aware geocoding fix.*

After the May 11 fix, the drive-time path delegates to `getCityCoordinates` from `lib/tourrouter/geocoding.ts` whenever country is present. The legacy three-tier `geocodeCity` in `mapbox.ts` (CITY_COORDS → `geocode_cache` → bare Mapbox) is now only reached as a fallback when `country` is missing or the new system returns null. In practice, the page always passes country, so the legacy path is dead.

**Soak first.** Wait at least 1–2 weeks of beta usage before deleting anything. Confirm via Vercel logs that no production calls reach the legacy fall-through — could add a `console.warn("[geocodeCity] legacy fallback hit", { city })` to the existing flow as cheap instrumentation in the meantime.

**Then:**
1. Delete the `geocodeCity` and `cacheGeocode` exports from `lib/tourrouter/mapbox.ts`.
2. Simplify `getDriveInfo` to call `getCityCoordinates` directly (return type widens to include resolved coords so `cacheDriveInfo` can use them without re-geocoding).
3. `DROP TABLE geocode_cache;` after a final grep confirms no other code path reads from it.
4. Update the obsolete `// Geocoding: CITY_COORDS → geocode_cache → Mapbox API` header comment in `mapbox.ts`.

Stale rows in `geocode_cache` today: `washington` at lat 38.90 (DC, correct after mid-session SQL fix), `cambridge` at lat 52.20 (UK, wrong — never overwritten because new path returns early before the legacy `cacheGeocode` write can land). Plus older fossils from pre-curated-geo_cities era. None matters operationally; just drop the table.

Sequencing: don't do this until the cache-write bleed item above is fixed and verified — otherwise the diagnosis story for any future drive-time bug gets harder.

Effort: ~1 hour.

**Related:** `cacheGeocode` in `lib/tourrouter/mapbox.ts` has the same `fetched_at`-frozen-on-upsert bug that was fixed in `cacheDriveInfo` (commit e710dd7). Not fixing standalone since `geocode_cache` is slated for removal in this same backlog item. If the drop gets deferred past the soak window for any reason, mirror the `cacheDriveInfo` fix: add `fetched_at: new Date().toISOString()` to the POST body in cacheGeocode.

---

### `state` column on `tour_shows` for state-level disambiguation

*Surfaced 2026-05-11 during country-aware geocoding fix.*

Country was enough to fix the May 11 bug (Washington D.C. vs WA State, Cambridge MA vs UK), but state-level ambiguity within a country is still unresolved:

- Cambridge MA vs Cambridge OH
- Portland OR vs Portland ME
- Springfield (12+ US states)
- Columbus OH vs Columbus GA vs Columbus IN

`tour_shows` has no `state` column today. The AI PDF parser strips state info silently ("Washington, D.C." → `city: "Washington"`, state lost). The existing geocoding code at `lib/tourrouter/geocoding.ts` already accepts an optional `state` param as a tiebreaker — it's just never provided.

**Work involved:**
1. SQL migration: `ALTER TABLE tour_shows ADD COLUMN state text;` plus `state_norm text` for normalization.
2. Parser updates: prompts in `lib/tourrouter/prompts/` (deal memo, intake parsers) must extract state when present.
3. Import pipeline: `lib/tourrouter/columnMapper.ts` `FIELD_ALIASES` already has `state` aliases per April 5 work — verify still wired through `applyMapping` and the POST `/shows` handler.
4. UI: Add Show modal needs a state field, drawer Show Info section needs state field, city autocomplete should populate state from `geo_cities.state_province`.
5. Drive-info / prefetch plumbing: `prefetchDriveData`, `getMapboxDriveInfo`, and the drive-info route already accept optional `state` per the May 11 refactor — just thread it through from `tour_shows.state`.

Defer until the country-only fix has soaked and we see whether state-level ambiguity actually surfaces in real beta tours. Probably will — Springfield, Portland, and Columbus are real touring markets.

Effort: 4–6 hours including testing.

---

### Supabase Data API grant change — Oct 29-30, 2026 verification

*Surfaced 2026-05-13 from a Supabase email announcing the rollout.*

Starting Oct 30, 2026, Supabase removes the default Data API grant on public-schema tables for all existing projects. New tables created after that date require explicit GRANT statements for anon/authenticated/service_role roles. Existing tables (drive_cache, tours, artists, etc.) keep their current grants and are unaffected.

**Status:**
- CLAUDE.md rule added 2026-05-13 enforcing explicit GRANTs on new-table migrations going forward.
- No action needed until Oct 29.

**Oct 29 verification (one-time, ~10 min):**
- Re-read Supabase's latest docs on the rollout — confirm scope hasn't changed
- Spot-check that the standard new-table pattern still works in this project
- Verify public viewer routes (/v/**, /advance/**, /report/**) still serve anonymous traffic correctly the day after the cutoff

**Fail-loud safety net:** if a GRANT is forgotten post-Oct-30, PostgREST returns 42501 with the exact GRANT statement to paste.

---

## 🧹 Code hygiene queue (8)

*Refactors, dead code, low-pressure cleanup.*

### BUG-B — Stale `allowed` whitelist in tourrouter artist PUT route

`app/api/tourrouter/artists/[artistId]/route.ts` lines 38–48
has a stale `allowed` field whitelist. Missing: `tour_manager_name`,
`tour_manager_email`, `tour_manager_phone`, plus phone fields for
all existing roles (`manager_phone`, `booking_agent_phone`,
`publicist_phone`). Stale entries that should be removed:
`agent_name`, `agent_email` (Agent role removed from UI in commit
12db1b5, April 12).

**Why not broken today:** the profile page saves flat team columns
via the browser Supabase client directly, not through this API
route. Only `key_contacts` and other JSON columns flow through the
route, and those are in the whitelist.

**Why it matters:** any future code that tries to update
`tour_manager_*` fields via the API route will get a silent 400
"No valid fields to update."

Found in QA report 2026-04-14. Single-file fix.

---

### Custom font upload architectural debt

The current font pipeline writes fonts to both Supabase storage (for browser Canvas previews + image rendering) and Cloudinary (for video `l_text` overlays). Two sources of truth means race conditions on partial failures (handled via cleanup logic tonight, but real complexity). Post-launch consideration: move to Cloudinary-only font storage with the browser renderer loading fonts from Cloudinary's URL via `@font-face`. One source of truth. Requires touching `lib/clientRender.ts` (protected code) and a one-time backfill script for existing fonts.

---

### Lint cleanup pass on public viewer pages

*Surfaced April 17, 2026 when running eslint against app/v, app/advance, app/report, app/api/download, app/api/download-all for the first time.*

These folders carry ~20 pre-existing lint errors and warnings. None are user-facing bugs — all are code quality signals — but they're worth cleaning up in a single pass so future lint runs in these zones stay clean (and the new no-restricted-imports rule's signal doesn't get lost in noise).

The inventory:
- **13 @typescript-eslint/no-explicit-any errors** in app/v/e/[token]/page.tsx, app/v/m/[token]/page.tsx, and app/v/tour/[token]/page.tsx. Developer wrote `any` when the real data shape wasn't obvious. Fix requires understanding what each piece of data actually is — not mechanical.
- **1 react/no-unescaped-entities error** in app/v/e/[token]/PrintDownloadButton.tsx line 78 (a literal apostrophe in JSX). Trivial one-character fix.
- **2 @next/next/no-img-element warnings** on two `<img>` tags in the public viewer pages. Swap to Next.js `<Image>` for auto-optimization; requires knowing the image dimensions.
- **2 @typescript-eslint/no-unused-vars warnings** for `cleanVenue` in app/api/download-all/route.ts and app/api/download-all/marketing/route.ts. Dead variable from a refactor. Delete the assignments.

**Estimated effort:** 30-45 minutes if done in one pass. Can be done cold — no Tim input needed, no product decisions. Good "fill an hour" task.

Reproduce with:
```bash
cd ~/localizer && npx eslint app/v app/advance app/report app/api/download app/api/download-all --max-warnings=0
```

---

### Parallel FormatConfig / FieldConfig type declarations in TemplateEditor.tsx and lib/clientRender.ts

*Surfaced during custom text build on April 18, 2026.*

Both `app/dashboard/tours/[tourId]/template/TemplateEditor.tsx` (lines ~30-58) and `lib/clientRender.ts` (lines 4-26) declare their own local `FieldConfig` and `FormatConfig` types. Not imported from a shared file — fully parallel declarations.

Existing minor drift: `FieldConfig.align` is typed `Align` (a strict union) in TemplateEditor vs `string` (wide) in clientRender.ts. Works today because `Align` values are string literals that satisfy the wide string type. But any future field extension requires updating both files independently — as happened multiple times today for custom text.

**Fix (when ready):** Extract to `lib/types/overlayConfig.ts` or similar. Import in both places. Estimated 30-45 min mechanical refactor. No Tim input needed.

**Not urgent.** Both files compile and function correctly. Filed here so future devs understand the parallel-declaration pattern is a known debt, not an accident.

---

### /api/venue-links — possibly dead code

*Surfaced April 17, 2026 during ESLint rule design.*

app/api/venue-links/route.ts (the GET handler that takes tourId + orgId and returns render URLs for all events in that tour) has **zero call sites** in the codebase as of April 17. Grepped the full repo, including tsx and ts files, and nothing references the endpoint.

Possibilities:
1. Genuinely dead — was built for a feature that shipped with different plumbing, never cleaned up. Delete the file.
2. Called by something outside the grep's reach (external tool, manual curl, third-party integration, Vercel cron). Unlikely given the route shape but possible.
3. Reserved for a future feature and left as a placeholder. If so, worth a comment explaining that.

**Next step:** Before deleting, check Vercel's function invocation logs for the last 30 days. If the route has zero invocations, safe to delete. If non-zero, figure out who's calling it.

Like the venue-link audit above, no user impact either way. Just code hygiene / reducing the attack surface of unused endpoints.

---

### Middleware auth error handling

when a request comes in with stale/invalid Supabase refresh tokens, middleware throws 'Invalid Refresh Token: Refresh Token Not Found' instead of gracefully treating the user as anonymous. Logs are noisy and the recovery path is suboptimal. Reproduced May 5: laptop with stale cookies got refresh-token errors on every request including public routes (/coming-soon). Cleared by clearing cookies. Fix: middleware should catch refresh_token_not_found and proceed as anonymous, only logging at debug/info level.

---

### PKCE migration

*Primary auth bug — cookie max-age=3600 (1 hour) in lib/supabaseClient.ts cookieStorage adapter — was fixed in commit a7e0ef2 (bumped to 30 days = 2592000s). Three follow-ups remain:*

lib/supabaseClient.ts currently uses flowType: 'implicit' which is deprecated. PKCE is more secure and better-suited to SSR. Touches login flow end-to-end (email magic links, OAuth callbacks, /auth/callback handler). Dedicated session.

---

### Graceful middleware error handling on getSession() failures

middleware.ts has two getSession() calls (lines 117, 156) that destructure data without checking error. When 'Refresh Token Not Found' fires, the error is logged noisily by Supabase before being swallowed. Wrap in try/catch, treat as anonymous, log at debug level. Captured separately above.

---

## 💭 Future ideas (1)

*Speculative post-launch work.*

### Trackable asset delivery (read-receipts for artists) — 💭 Future idea

Artist-side feature inside Localizer that lets an artist send assets to a promoter per show via Localizer (instead of email/Dropbox), and shows the artist who actually engaged with them.

**The flow:** Artist enters promoter email per show → Localizer sends a branded email with a unique link to a `/share/[token]` page hosting that show's assets → every interaction logs back. Promoter never needs an account; works like Docsend/Calendly/Mailchimp tracking from the recipient's side.

**Events tracked per show:**
- Email opened (Resend tracking pixel — already in stack)
- Share page visited (server log on the share token)
- Specific assets viewed (Cloudinary impression data)
- Assets downloaded (download button events)
- Ticket-link clicked (UTM on the URL — strongest signal the post is live)

Artist's tour dashboard surfaces per-show delivery status: green for "downloaded and ticket link clicked," yellow for "opened, no downloads," red for "email never opened."

**Why this is worth preserving:** Originally the killer feature of the parked Localizer 2.0 venue-side concept. The full version required promoters to have accounts; this scaled-down version delivers most of the value with no second user base. Strong paid-tier upgrade trigger candidate — managers and artists have zero visibility into which promoters actually market their shows today.

**Infrastructure required:** All existing — Resend (with open-tracking), public viewer route pattern (/v/*), Cloudinary asset hosting, Supabase for share tokens + engagement table. Rough estimate: 1–2 weeks focused work when prioritized.

**Why not in the 30-day Localizer launch:** Not on the contract. Worth revisiting post-launch once retention data exists and we know which artists are asking for visibility into their promo flow.

**Originated:** May 20, 2026 brainstorm session.

---

## Resolved

*Items here are completed and verified. Kept in this file (rather than deleted) as historical record — useful for future debugging that retraces a known-fixed bug, and for understanding why certain patterns in the codebase exist.*

### BUG-E — `render_poster_url` dead column in venue_links

Four download routes (`app/api/download/route.ts`,
`app/api/download/marketing/route.ts`,
`app/api/download-all/route.ts`,
`app/api/download-all/marketing/route.ts`) still `SELECT
render_poster_url` from `venue_links`. The `tour_poster` format
was removed from the codebase March 25, so this column is always
null for post-March-25 renders. Routes filter it out with
`.filter((a) => !!a.url)` before zipping, so no runtime impact.

Schema check on 2026-04-14 confirmed the column still exists in
`venue_links` (not dropped). LOW cleanup: either remove from
selects or drop from schema.

Found in QA report 2026-04-14.

**Resolution (2026-04-14):** Closed as misdiagnosis. No code change required.

- Verified: `render_poster_url` is a LIVE column on the `venue_links` table (90 rows total, 9 populated).
- It is written by the Print Poster render pipeline (`lib/clientRender.ts` + `app/api/renders/print-pdf/route.ts`) and read correctly by all 4 download routes alongside the other 5 render format URLs.
- The low population rate reflects that Print Poster is an optional/opt-in format, not that the column is dead.
- Stripping these references would break tour poster downloads for the 9 venue_links that have rendered posters.

---

### Drive-info cache writes bleed in Vercel serverless

*Surfaced 2026-05-11 during country-aware geocoding fix verification.*

Both `cacheGeocode` and `cacheDriveInfo` in `lib/tourrouter/mapbox.ts` are called fire-and-forget (no `await`, no `waitUntil`) from `app/api/tourrouter/drive-info/route.ts`. The Vercel function tears down on response return, killing the cache writes before they complete. Confirmed by querying `drive_cache` after the fix deployed — zero rows from the past 30 minutes despite ~9 drive-info calls per Cal's Cutoff page load. Same for `geocode_cache`: `cambridge` and `washington` timestamps unchanged from before deploy.

**Why this got worse after the May 11 fix.** The old path took 2–3 seconds per drive-info call (legacy `geocodeCity` did its own Mapbox geocoding twice, plus the Directions call). Background writes had that whole window to land. The new path drops total request time to ~500–1000ms (in-memory cache hits for the geocoding step), shrinking the fire-and-forget window. Same writer code, less time, fewer landings.

**Functional impact:** none user-facing. Drive times are correct on every page load — they just always come from a fresh Mapbox call instead of `drive_cache`. Wastes API quota: 10-show tour ≈ 9 directions calls per page load, multiplied across every routing-page visit. Currently <1% of Mapbox free tier, but Tim's beta users will multiply traffic.

**Fix:** either `await cacheDriveInfo(...)` (adds ~50–200ms per drive-info response, predictable) or `import { waitUntil } from 'next/server'` and wrap the cache write (non-blocking, Vercel-aware). Same pattern for `cacheGeocode` — though once `geocode_cache` is dropped (separate backlog item below) those writes go away entirely.

Effort: ~30 minutes.

**Resolution (2026-05-11):** Fixed via three commits (d369b71, f8381dc, 9540155). Bleed was actually three nested failure modes: (1) fire-and-forget teardown as suspected, (2) silent HTTP error swallowing in cacheGeocode/cacheDriveInfo, (3) `drive_seconds` integer column rejecting Mapbox's float `route.duration`. All three fixed; verified 9 fresh rows in drive_cache on Cal's Cutoff page refresh. See SESSION_LOG.md 2026-05-11 (continued) for the full diagnostic arc. Actual effort: ~75 minutes (vs estimated 30).

---

### Dedupe Washington rows in `geo_cities` + audit country-code consistency

*Surfaced 2026-05-11 during Washington-bug investigation.*

The curated `geo_cities` table has two rows for Washington D.C.:
- `name='Washington' country='US' iata_code='DCA'` (38.9072, -77.0369)
- `name='Washington' country='USA' iata_code=null` (38.90253, -77.039386)

Both point to D.C., but the country code mismatch (`US` vs `USA`) means `getCityCoordinates(city, 'USA')` only matches one row, `getCityCoordinates(city, 'US')` only matches the other. The codebase uses `USA` per `tour_shows.country` and per the new system's `country.toUpperCase()` normalization, so the `country='US'` row is effectively unreachable from the app today. Wasted row, plus inconsistency that will cause weird bugs.

Likely a seed inconsistency between the original GeoNames pass and Tim's curated 332-city list. Worth a broader audit:

```sql
select name_lower, count(distinct country) as country_variants, array_agg(distinct country) as country_codes
from geo_cities
group by name_lower
having count(distinct country) > 1;
```

**Fix:** standardize to one country-code convention (alpha-3 / `USA` to match `tour_shows.country` and current app behavior), migrate any alpha-2 rows (`US`, `GB`, `DE`, etc.) to alpha-3, dedupe.

Effort: ~1 hour including the audit and SQL migration.

**Resolution (2026-05-11):** Scope expanded mid-investigation when audit revealed the inconsistency was widespread (25 alpha-2 codes plus 2 uppercase full-name fossils across 340 rows, not just Washington). Also discovered the codebase canonical was UPPERCASE-lowercase-English (not ISO 3166 alpha-3 as the backlog entry assumed). Migration ran in a single Supabase transaction: dedupe Washington, normalize all 26 distinct country values in geo_cities to UPPERCASE-lowercase-English, normalize 11 uppercase `'USA'` rows in `tour_shows` + `tour_shows_crew` to lowercase. Result: ~340 curated geo_cities rows previously orphaned by convention mismatch are now reachable to the app. Cal's Cutoff verified end-to-end post-migration. See SESSION_LOG.md `## 2026-05-11 (continued) — country-code normalization` for full diagnostic arc. Actual effort: ~2 hours.

---

### Consolidate duplicate `buildDriveDataKey` / `DriveDataMap` definitions

*Surfaced 2026-05-11.*

`lib/tourrouter/mapbox.ts` and `lib/tourrouter/geography.ts` both define `buildDriveDataKey(city1, city2)` and the `DriveDataMap` type, with identical bodies and shapes. Both are re-exported via the `@/lib/tourrouter` barrel. Either works for callers, but two sources of truth.

**Fix:** move both to a shared module (likely a new `lib/tourrouter/driveTypes.ts`, or merge into the existing `geocoding-shared.ts` if it stays scoped to pure helpers). Update `mapbox.ts` and `geography.ts` to import from the shared module. Keep barrel re-exports working so the call sites in `page.tsx` and elsewhere don't need to change.

Effort: ~30 minutes. Not blocking; pure code hygiene.

**Resolution (2026-05-11):** Fixed in commit af7fb10 — deleted the duplicate `DriveDataMap` type and `buildDriveDataKey` function from `lib/tourrouter/mapbox.ts` and extended its existing `./geography` import to pull them in. `geography.ts` is now the single source of truth; barrel `lib/tourrouter/index.ts` already re-exports from there. No caller changes needed — `mapbox.ts`'s prior exports of these symbols were dead (zero external importers per inventory). Files touched: 1 (`mapbox.ts`); lines removed: 18; lines added: 1. Verified clean with `npx tsc --noEmit` and `npm run build` (72/72 static pages, no warnings).

---

### `/api/notifications` static-build warning

*Surfaced 2026-05-11 as observation during repeated `npm run build` runs.*

Every `npm run build` prints during static page collection:

```
[Notifications GET] Unexpected error: n [Error]: Dynamic server usage:
Route /api/notifications couldn't be rendered statically because it
used `cookies`. See more info here: nextjs.org/docs/messages/dynamic-server-error
```

Pre-existing — not introduced by the May 11 country-aware geocoding work. The route correctly ends up marked `ƒ` (Dynamic) in the route table, so it's functionally fine; just noisy in build logs and slightly slows the collection step (Next.js retries the route before giving up on static rendering).

**Fix:** add `export const dynamic = "force-dynamic";` at the top of `app/api/notifications/route.ts` (same pattern as `app/api/tourrouter/drive-info/route.ts` and several other cookie-using routes). Tells Next.js to skip the static-rendering attempt entirely.

Effort: ~5 minutes.

**Resolution (2026-05-11):** Fixed in commit 7400480 — added `export const dynamic = "force-dynamic"` to `app/api/notifications/route.ts`. Verified clean build with no `[Notifications GET]` warning; static page count went 73→72 confirming Next.js no longer attempts the static-render pass on this route. Route still marked `ƒ` (Dynamic) in the route table, behavior unchanged.

---

### Unused `CITY_COORDS` import in `lib/tourrouter/mapbox.ts`

*Surfaced 2026-05-11 during the buildDriveDataKey/DriveDataMap consolidation. Out of scope at the time; logged for later.*

`lib/tourrouter/mapbox.ts` line 1 imports `CITY_COORDS` from `./constants` but never references it anywhere in the file. The file uses `getCityCoords` (the function, imported from `./geography`) but not `CITY_COORDS` (the raw constant). Dead import, no behavioral impact, but flags as noise in any future import audit.

**Fix:** delete the unused import line. Verify with `npx tsc --noEmit` and `npm run build`.

Effort: ~2 minutes.

**Resolution (2026-05-12):** Fixed in commit b7095a1 — deleted the unused `import { CITY_COORDS } from './constants';` line in `lib/tourrouter/mapbox.ts`. Two remaining string mentions on lines 59 and 83 are inside comments describing the conceptual lookup hierarchy (constants → cache → API), which still describes the architecture correctly after the symbol moved to `getCityCoords` from `./geography`. Comments left intact as separate doc-cleanup concern. Verified clean with `npx tsc --noEmit` and `npm run build` (72/72 static pages).

---

### `drive_cache.fetched_at` doesn't update on upsert

*Surfaced 2026-05-11 during country-code migration verification.*

`cacheDriveInfo` in `lib/tourrouter/mapbox.ts` does a POST to `/rest/v1/drive_cache` with `Prefer: resolution=merge-duplicates`. On a fresh INSERT, `fetched_at`'s `default: now()` fires correctly. On a merge (existing row), PostgREST updates only the columns present in the request body — and `fetched_at` is not in the body. Net effect: once a `(origin_city, dest_city)` pair has been written, its `fetched_at` is frozen at the original write time, regardless of how many times subsequent refreshes upsert the row.

**Operational impact:** `fetched_at` reflects "first written" rather than "last refreshed". Any monitoring or staleness logic that uses `fetched_at` ("show me rows updated in the last 5 minutes") gets misleading results once a row has been upserted. Today (2026-05-11), discovering this took a couple cycles of "wait, why isn't drive_cache populating after refresh? — oh, it IS populating, the 5-minute window query is just lying."

**Fix:** add `fetched_at: new Date().toISOString()` to the body of the `cacheDriveInfo` fetch call in `lib/tourrouter/mapbox.ts`. Explicit value overrides the default and gets updated on every upsert.

Effort: ~5 minutes including a clean build and one verification cycle.

**Resolution (2026-05-12):** Fixed in commit e710dd7 — added `fetched_at: new Date().toISOString()` to the `cacheDriveInfo` POST body in `lib/tourrouter/mapbox.ts`. PostgREST `Prefer: resolution=merge-duplicates` now writes the column on both INSERT and UPDATE paths. Verified in production by deleting `(cambridge → brooklyn)` from `drive_cache`, hard-refreshing Cal's Cutoff, and confirming the row repopulated with a current timestamp while the other two Monday-fixed legs retained their original timestamps (correct read-through cache behavior).

---

### Logo overlays on videos

Logos have never rendered on Cloudinary video text overlays. `buildCloudinaryVideoUrl` in `app/api/renders/generate/route.ts` only builds text layers (venue, date, city, optional band name) and has no `l_image` or `l_fetch` layer for the logo. Images render logos via the Canvas renderer in `lib/clientRender.ts`, which is a completely separate code path — that's why "logos work on images" but "logos don't work on videos."

The fix requires: reading `lib/clientRender.ts` to understand how the logo is resolved and positioned on image renders, mirroring that logic into a new Cloudinary transformation layer in `buildCloudinaryVideoUrl`, handling the logo URL resolution (the logo lives on Cloudinary as part of the artist record already), and testing across multiple logo positions and sizes. Estimated 1–2 hours. Out of scope for the April 9 Localizer bug-fix session.

Discovered tonight while verifying the font fix worked — Tim's video renders with correct text and font, but the logo was missing. Not a regression, a latent missing feature.

**Resolution (2026-05-12):** Verified working in production on this date — Drew added a band logo to a video, rendered it, and the logo appeared correctly in the output. The April 9 entry's technical diagnosis (`buildCloudinaryVideoUrl` having no `l_image`/`l_fetch` block) is stale. Most likely fix was incidental during the April 14 sponsor logo work, which added image overlay construction to the same function — sponsor logos on TikTok video URLs are confirmed live per the open "Venue link page serves stale render URL" entry. The band logo path either reused the same layer-building code or was extended in the same pass. User-workflow verification is sufficient — no code archaeology required.

---

### Custom text lines — two user-editable text fields per tour

*Surfaced April 17, 2026 end of session. Tim has confirmed as must-have for Localizer. Drew plans to start first thing next session.*

**STATUS:** Tim sign-off confirmed. Ready to build. Not speculative.

**What it is.** Two additional text fields, editable in the template editor, that render on all non-print formats (square, story, landscape, TikTok, YT Shorts). Use cases the user has in mind: band website URL, supporting act name, tour sponsor tagline, or any secondary text a tour manager wants on all their social posts without editing each base image.

**Why it matters.** Today a tour manager who wants "w/ The Supporting Band Name" on their square posters has to either build it into the base image in Photoshop or go without. Both are bad. This is a frequent-enough use case that Tim called it must-have.

**Design decisions (locked in with Tim on 4/17):**

1. **Global text, per-format position.** The text itself is stored once at the tour level (in `tours.custom_text_1` and `tours.custom_text_2` — new columns). Position, size, and align are stored per-format inside each format's overlay config, matching how venue/date/city already work. A user types "www.bandname.com" once and it appears on square, story, landscape, TikTok, and YT Shorts — each in its own position that the user has set independently.
2. **Font and color inherited.** No separate font picker or color swatch for custom text. Whatever font and color the rest of the overlay text uses (same source as venue/date/city) is what custom text uses. Keeps the controls column tight.
3. **Empty-state placeholder shows in editor only.** If a user enables a custom text line but hasn't typed anything yet, the live preview in the template editor shows the draggable element with "Your text here" as visual placeholder. Final rendered outputs (JPEGs, video overlays) skip the draw entirely if the text is empty — no "Your text here" leaking into a published poster.
4. **Works on video formats too.** This means touching two render paths: `lib/clientRender.ts` for the image formats, and `app/api/renders/generate/route.ts` (Cloudinary URL overlays) for TikTok / YT Shorts.
5. **Hidden on Local Poster for Print tab.** Matches the `isPrintFormat` / `formatKey !== "print"` pattern established today in commits a1b1ce6 and db983db. Custom text controls, preview, canvas renderer, and video overlay builder all skip when format is print. Full tour posters are designed externally — we don't layer our own text on them.
6. **35-character max per line.** Soft enough for most use cases ("w/ The Opening Band", "www.longbandname.com/tour"), tight enough to prevent visual overflow surprises. Auto-shrink already handles any residual sizing issues.
7. **Controls live at the bottom of the sidebar**, below the existing sections (Band Name, Venue, Date, City, and on non-print tabs, Band Logo and the two Sponsor Logos). Two text inputs plus two sets of position controls.

**What the build actually touches:**

- **Supabase migration:** add `custom_text_1 text` and `custom_text_2 text` columns to `tours`. Both nullable, no default.
- **Config type:** extend the format overlay config type to include `customText1` and `customText2` field configs (position/size/align — matching the FieldConfig shape used by venue/date/city).
- **TemplateEditor.tsx:** two new text inputs (global, at the bottom of the sidebar), two new control sections for position/size/align, two new preview elements in the live preview with drag handlers, all gated with `!isPrintFormat`. Character-limit enforcement via `maxLength={35}` on the inputs.
- **lib/clientRender.ts:** two new `drawText` calls inside `renderPoster`, gated with `formatKey !== "print"`, skipped when text is empty.
- **app/api/renders/generate/route.ts:** two new Cloudinary text overlay layers for TikTok and YT Shorts, skipped when text is empty or format is print (though print shouldn't hit this path anyway).
- **Defaults:** decide starting position for each custom line on each format. Reasonable first pass: `customText1` near top-center, `customText2` near bottom-center, both at the same font size as the date field. Easy to revise after building.

**Estimated effort:** 5-7 hours focused work for a single person, spread across 4-5 files plus one migration. Build cold from these specs — no Tim input needed mid-build.

**Things to verify before starting:**
- That the existing overlay config graceful-defaults handles the two new undefined fields on pre-existing tours (it almost certainly does, since this file pattern has been extended several times, but worth a quick check of how unknown FieldConfigs get handled on load)
- Where the Cloudinary text overlay syntax lives in `generate/route.ts` — the TikTok/YT Shorts video path hasn't been touched in recent sessions so the code shape may have drifted from the image path

**Open questions deferred to build time (not blocking):**
- Exact pixel position of the two defaults on each of the five non-print formats
- Whether the text input should live in a separate "Text Content" section at the bottom, or be inline with each custom text's position controls

**Resolution (2026-05-12):** Full feature shipped. Image render path (square, story, landscape) shipped April 18, 2026. Video render path (TikTok, YT Shorts) verified working 2026-05-12 — see "Custom text lines — Step 6" entry below in this Resolved section. Original spec from April 17 fully implemented end-to-end. No follow-up work outstanding.

---

### Custom text lines — Step 6: Cloudinary video overlays (TikTok + YT Shorts)

*Image formats shipped April 18, 2026. Video formats deferred to next session.*

**STATUS:** Ready to build. Image render path is live and working end-to-end in prod. Video overlays are the remaining work to make the feature fully shippable.

**What it is.** Extend `buildCloudinaryVideoUrl` in `app/api/renders/generate/route.ts` to append two additional `buildTextLayer` overlays for `customText1` and `customText2` on video formats (TikTok, YT Shorts). Text content is already threaded into the route via `tour.custom_text_1` / `tour.custom_text_2` (part of the April 18 work) — just needs to flow into the video layer construction.

**Gate logic:** Same three-part gate as image path:
- Format must not be "print" (implicit — print isn't in `VIDEO_FORMATS`)
- `cfg.showCustomText1 ?? false` / `cfg.showCustomText2 ?? false` — same per-format flag used by image path
- Text must be non-empty (`(text ?? "").length > 0`) — IMPORTANT because the existing Cloudinary layer builder has no empty-text guard (venue/date/city always have values from event data). Must add explicit check before calling `buildTextLayer` for custom text.

**Defaults to match image path:** `CUSTOM_TEXT_1_DEFAULT` and `CUSTOM_TEXT_2_DEFAULT` with `{ x: 0.5, y: 0.08, size: 48, align: "center" }` and `{ x: 0.5, y: 0.92, size: 48, align: "center" }` respectively.

**File touches:**
- `app/api/renders/generate/route.ts`: extend `buildCloudinaryVideoUrl` to read customText1/customText2 from overlayConfig and eventData, add two new layer entries with appropriate gate

**Estimated effort:** 60-90 min including live smoke test on a tour with TikTok + YT Shorts assets.

**Dependencies:** None — all data plumbing already in place from April 18 work. Tour-data route already returns `custom_text_1` / `custom_text_2`. EventsTable already passes them through. Just need the video layer construction.

**Resolution (2026-05-12):** Verified working in production on this date — Drew generated a video render with custom text filled in and confirmed the text appears correctly on the rendered TikTok/YT Shorts output. The `buildCloudinaryVideoUrl` layer construction for `customText1`/`customText2` was either built and not separately tracked in the backlog, or completed incidentally during related video-overlay work. User-workflow verification is sufficient — no code archaeology required. With Step 6 done, the Custom text lines feature is now fully shipped on both image formats (April 18) and video formats.

---

### Venue link page serves stale render URL — bypasses DB updates

*Surfaced April 18, 2026 evening, during Step 6 video custom text verification.*

Re-Gen All correctly writes fresh Cloudinary URLs to `venue_links.render_*_url`. The database row for a Memphis venue link on tour `b7b9da2f-55c3-477b-a92c-7a5bf87c3d24` was confirmed via SQL to contain the current URL with sponsor logo layer (`h_400` with `c_scale`), custom text overlay, and band logo at `h_510`. But the venue page at `/v/e/[token]` and the `/api/download?token=...` endpoint both serve an older URL that has `h_560` on the band logo, no sponsor logo `l_fetch` block, and no custom text `l_text` block. The old URL predates the April 14 sponsor-logo-on-video feature.

Ruled out during diagnosis:
- Browser cache (hard refresh + fresh incognito both serve the stale URL)
- Supabase fetch cache (page uses `supabaseAdmin` service-role client, no Next.js `cache` directive)
- Duplicate URL generator (grep confirmed `buildCloudinaryVideoUrl` is the only Cloudinary video URL builder in the codebase)
- Multiple `venue_links` rows for the event (SQL confirmed single row)
- Stale `overlay_config` (DB row has current TikTok config with sponsor logo y=0.565, size 400)

Remaining hypotheses (untested, for tomorrow):
- Vercel CDN edge cache on the tokenized `/v/e/[token]` route — the page is a Server Component with no caching directive but Vercel may be caching the rendered output
- ISR / stale-while-revalidate on Server Component render
- Venue link page somehow reading a cached database snapshot rather than live

Debug data captured:
- Tour ID: `b7b9da2f-55c3-477b-a92c-7a5bf87c3d24`
- Event: Memphis, `96a50165-0eeb-4acb-918c-839034831775`
- Venue link token: `974351a5e0c51b5aae02a76140a9e7dd538315cfd3d6b41ff05d3ed6623c9e5b`
- `venue_links.created_at`: 2026-03-15
- DB `render_tiktok_url` tail: `...tour_b7b9da2f-55c3-477b-a92c-7a5bf87c3d24_tiktok_1773703791368` — has sponsor logo layer and custom text layer
- Served URL at `/v/e/[token]` and `/api/download`: same public_id tail but missing sponsor logo and custom text blocks, band logo h=560 not 510
- Direct Cloudinary URL from the stored DB value RENDERS correctly — sponsor logo appears. So Cloudinary is fine. The served URL itself is different content than the stored URL.

**Impact assessment:** This is not a Step 6 regression. The old URL predates both Step 6 (today) and sponsor logos on video (April 14). Any Re-Gen All on any tour never made it to the served venue page for the TikTok/YT Shorts formats. Custom text on videos shipped today and DOES appear on the freshly-regenerated URL when accessed directly at Cloudinary — but won't appear on the venue link page until this bug is fixed.

**Severity:** HIGH pre-beta. Any promoter visiting a venue link sees outdated assets. The image formats may or may not have the same issue — not yet verified. Check `render_square_url`, `render_story_url`, `render_landscape_url` DB value vs served value before declaring image-only beta safe.

**First step when picking this up:**
1. Re-query the DB row vs inspect the rendered page source one more time with fresh eyes — confirm the mismatch reproduces
2. Query Vercel deployment logs for the `/v/e/[token]` route: is it being hit on each request or served from cache?
3. Check if `export const dynamic = 'force-dynamic'` or `export const revalidate = 0` resolves — BUT note yesterday's prod scare with these exact directives on the template editor route; if used on the venue page, preview-deploy first this time.
4. If image formats also show the stale-URL issue, the fix is the same mechanism and covers images too. If only video formats, look for a video-specific render path.

**Resolution (2026-05-12):** Verified working in production on this date. Pulled the DB row for the original-bug Memphis venue link (token 974351a5e0c51b5aae02a76140a9e7dd538315cfd3d6b41ff05d3ed6623c9e5b), opened the venue link page `/v/e/[token]` in incognito on hwy61labs.com, and grabbed the served TikTok URL from the page source. Compared against the DB value: byte-for-byte identical. All four diagnostic markers from the original bug entry matched — public ID `tour_b7b9da2f-55c3-477b-a92c-7a5bf87c3d24_tiktok_1773703791368`, band logo at `h_510` (not the old `h_560`), sponsor logo `l_fetch` block present, custom text `l_text` block with "SHORTS TEST 20:35" present. The cache-serving-stale-snapshots behavior is no longer reproducing. Exact mechanism of the fix is unknown — could have been an explicit cache directive added to the `/v/e/[token]` route, deployment-level change, or incidental fix from related work. User-workflow verification is sufficient.

---

### Template editor stale video preview on asset replacement

When a user replaces a video in Import Assets and navigates to the template editor without a full page reload, the editor displays the old video instead of the newly uploaded one. Hard refresh (Cmd+Shift+R) resolves it. Likely cause: either browser video caching keyed on a stable URL, or stale React state in the template editor component not reacting to prop changes on navigation. Not a data integrity issue — the database and render pipeline correctly use the new video. Only the in-page preview is stale.

Discovered April 10, 2026 during post-session testing on production. Affected artist: Uncle Lucius.

Fix options: (a) include a version/timestamp query param in the template editor's video src so the browser treats new uploads as different URLs, (b) reload the tour state from the server on asset-replacement events, or (c) add a `key` prop to the video element that changes on replacement so React remounts it. Option (a) is probably the simplest and most robust.

**Resolution (2026-05-13):** Fixed in commit 34dc628 — `Refetch tour image IDs in template editor on mount and tab visibility`. Effectively implemented fix option (b) from the entry body — "reload the tour state from the server on asset-replacement events." Surfaced via Rule 14 verification pass on 2026-05-13. Resolved on commit-message evidence; not empirically re-verified.

---

### Router cache stale UI on template editor — needs different fix

*Surfaced April 18, 2026. Two attempted fixes (`export const dynamic = "force-dynamic"` and `export const revalidate = 0`) worked in `npm run dev` but triggered an unrelated production failure on Vercel that broke Re-Generate All (count: 0 with no Cloudinary calls) and venue link page asset rendering. Both cache-fix commits reverted (f3eae0d + 2c7ff86).*

**The bug:** On the template editor page (`/dashboard/tours/[tourId]/template`), after a user saves changes and navigates away via Next.js client-side navigation, returning to the editor shows stale UI state. The server sends fresh data in the response HTML (confirmed via response body inspection), but React client-side state from the earlier visit is preserved and displayed instead. Workaround: hard refresh or incognito session.

**Only affects returning users within the same browser session.** First-visit users (including new sessions, incognito, hard refresh) always see fresh data.

**Candidate fixes to try:**
- `revalidatePath("/dashboard/tours/[tourId]/template")` called from the mutation routes (`/api/tours/[tourId]/overlay-config` and any others that update tour state)
- Move the editor's data loading to a client-side SWR-style fetch pattern so stale state naturally gets invalidated on mutation
- Investigate whether the prod-only failure from `revalidate = 0` is specifically related to authentication or edge caching, in which case a more targeted directive might work

**Not blocking beta launch.** User just needs to know "hard refresh if something looks stale." But should be fixed before Tim's full rollout to paying customers.

**Resolution (2026-05-13):** Fixed in commit a580240 — `fix(template editor): invalidate Router Cache on save to prevent stale state on client-side back-navigation`. Targeted fix that avoided the prod-breaking `force-dynamic` / `revalidate=0` patterns from the reverted f3eae0d / 2c7ff86. Surfaced via Rule 14 verification pass on 2026-05-13; entry sat unmoved because no one tracked it back after the fix shipped.

---

### TourRouter import — paste text and CSV drop zone broken

*Surfaced 2026-05-12 during Kurt-note button color decoupling testing. Suspected pre-existing, not a regression from today's CSS-only edits.*

**Symptoms:**
- Dragging a CSV file over the TourRouter import drop zone produces no visual highlight (drag-over state doesn't fire).
- Dropping the file does nothing — no upload, no parse, no error.
- The paste text / CSV window also rejects dragged input.

**Files likely involved:**
- `app/dashboard/routing/[tourId]/import/page.tsx` — import page UI
- `app/dashboard/routing/IntakeDropZone.tsx` — dedicated drop-zone component

**Diagnostic steps:**
1. Hard refresh, open DevTools console, attempt drag — note any JS errors.
2. Inspect the drop zone in DevTools — confirm `onDragOver` / `onDrop` handlers are attached.
3. Check git history on both files for recent changes.
4. Cross-reference against the Localizer schedule import drop zone at `app/dashboard/tours/[tourId]/import/page.tsx` (similar pattern, may still work — useful for diff).

**Why 🟡 Pre-launch gates:** Same TourRouter-blocker category as Advance feature audit. Blocks TourRouter beta launch. Not blocking Localizer launch (paste/CSV import isn't in Localizer flow).

Effort: 30-60 min once root cause is found.

**Resolution (2026-05-13):** Closed via feature add, not bug fix. Empirical reproduction showed the two real drop zones (UPLOAD SPREADSHEET and UPLOAD DEAL MEMO) worked correctly — the entry conflated them with the PASTE TEXT / CSV card, which was paste-only by design and never had drag-drop wired. After confirming the actual drop zones worked, decided to add drag-drop to the paste card for visual + functional parity across all three import options. Shipped in the same commit as this entry move — mirrors the spreadsheet card pattern, reuses handleSpreadsheetDrop, click still opens the paste modal as before.

### Dashboard direct-access onboarding redirect

Users who hit /dashboard directly (Stripe checkout success URL, bookmarks,
email links) bypass the /dashboard/onboarding redirect chain and never see
the Localizer welcome page even if localizer_onboarding_completed=false.

Fix: add a check at the top of app/dashboard/page.tsx — if
localizer_plan_status IS NOT NULL OR bundle_plan_status IS NOT NULL,
AND localizer_onboarding_completed === false, redirect to
/dashboard/onboarding/localizer.

Half-hour change. Not blocking immediate testing because the welcome page
itself works when accessed directly. Becomes critical when public signup
starts pointing new users at /dashboard.

### Localizer onboarding welcome video

Welcome page at /dashboard/onboarding/localizer has a video placeholder
controlled by ONBOARDING_VIDEO_URL constant in LocalizerWelcome.tsx
(currently empty string — video element hidden).

When Drew records the walkthrough video (2-3 min covering import → upload →
generate → share), upload to Cloudinary or YouTube and set the constant to
the playback URL.