# HWY61 Backlog

Forward-looking list of features, refactors, and design questions to revisit after Phase 7 launch. Not a commitment — a parking lot. Items here require Tim sign-off before moving to the build plan.

## 🔴 Active issues affecting users (0)

*Bugs your beta users could trip over right now.*

*No active issues at the moment. Items will appear here when bugs that affect users get logged.*

---

## 🟡 Pre-launch gates (6)

*Things that must be true before flipping `COMING_SOON=false`.*

### Audit and clean up stale test workspaces

As of April 9, 2026, the orgs table has 12 rows all named "My Workspace" — leftover test accounts from earlier development. Before public launch, audit and delete any that aren't tied to active users (Drew, Tim, or beta invitees).

**Progress (July 1):** `testcorkys` and `testalex` (both "My Workspace", June 4) deleted via the `deleteOrg` routine — dry-run-previewed (empty Cloudinary/Storage, one auth user each), then hard-deleted with audit rows written and auth.users removed; verified gone by re-query. `test2026` retained per prior decision. Remaining "My Workspace" test orgs from the original ~12 still need the same treatment before launch.

---

### Remaining custom fonts need to be re-uploaded

Two of the three existing `custom_fonts` rows still point at Cloudinary assets that don't exist: BebasNeue-Regular and Pragmatica-Extended-Extra-Bold. They were uploaded under the old broken pipeline that never wrote to Cloudinary. The render code will silently fail on any tour that uses these two fonts on a video overlay.

BullandRegular-d91g6 was already re-uploaded tonight and verified working on Uncle Lucius. The other two just need to be deleted via the UI and re-uploaded from their original font files (sources in Supabase storage URLs from the `custom_fonts.storage_url` column if Drew no longer has the local originals).

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

**Trigger / scheduling (decided June 11, 2026):** Register the advance cron in `vercel.json` (one line + verify `CRON_SECRET`) when TourRouter launches. Automation deliberately left dormant for the Localizer-only launch — recon June 11 confirmed `vercel.json` carries only the trial-nudge cron and nothing in-app fires `/api/tourrouter/advance/cron`. Route is fully built at `app/api/tourrouter/advance/cron/route.ts`; manual sends via `app/api/tourrouter/advance/send/route.ts` continue to work for testers in the meantime.

---

### Real legal review of Privacy Policy + Terms of Service

`app/privacy/page.tsx` and `app/terms/page.tsx` were finalized for internal consistency on 2026-05-27 — HWY61 LLC entity name, June 1, 2026 effective date, hwy61labs.com domain, and content accurate to current product behavior — but they were not reviewed by counsel.

Get a real legal review before public launch. The liability, indemnification, and limitation-of-liability clauses in particular warrant professional sign-off given HWY61 LLC processes payments through Stripe.

**Launch blocker if not reviewed.**

---

### /pricing not auth-aware — logged-in users see "Sign in" + get trapped on nav-back

**Symptom:** A logged-in user clicking "View all plans" (`app/account/AccountClient.tsx:111`) or "VIEW PLANS" lands on `/pricing`, which shows logged-OUT chrome ("Sign in" nav link, "Start your free trial" CTA). Clicking the logo or "← Back" (both point to `/`) routes them through the COMING_SOON band-aid to `/coming-soon`, sealing the impression they've been logged out. They are NOT logged out — session is intact (cookie scoped to `.hwy61labs.com`, present on all subdomains). Confirmed via recon June 2: no code path clears the session; middleware does not touch `/pricing`; `/pricing` makes zero auth calls.

**Fix (Pattern B — pure client, matches existing precedent in `login/page.tsx:33` and `PostHogProvider.tsx:33,47`):**
In `app/pricing/page.tsx` (already `"use client"`):

1. Add: `import { supabase } from "@/lib/supabaseClient";`
2. Add state: `const [isLoggedIn, setIsLoggedIn] = useState(false);`
3. Add effect:
   ```tsx
   useEffect(() => {
     supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
   }, []);
   ```
4. In the nav (lines ~174–183): when `isLoggedIn`, replace the "Sign in" link with an "Account" link → `/account`, and point the logo link to `/dashboard` instead of `/`. When logged out, leave nav exactly as-is (correct for prospects).
5. The "← Back" link (line ~186): when `isLoggedIn`, point to `/dashboard` (or `/account`); when logged out, leave as `/`.

**Explicitly OUT of scope:** Do NOT touch middleware, the COMING_SOON band-aid (`middleware.ts:104` unconditional `/` → `/coming-soon`), session handling, or convert to a server component. The `/` → `/coming-soon` trap self-resolves when COMING_SOON is lifted at launch; the only durable fix needed is making `/pricing`'s nav auth-aware so logged-in users see "Account" and have a sane path back.

**Effort:** ~15 min. One file (`app/pricing/page.tsx`). `tsc` + build after.

**Related latent issue (separate, lower priority):** `middleware.ts:104` — the unconditional `/` → `/coming-soon` redirect bounces authenticated users too. Self-resolves at launch when COMING_SOON lifts, but if any logged-in user needs `/` to work pre-launch, that's where to look. Not part of this fix.

---

### Pricing FAQ copy upgrades — gated on Stripe portal-config screen-share

Two FAQ answers on `/pricing` currently ship in their SAFE/soft form because the behavior depends on Stripe Dashboard Customer Portal config (unverified). After the live-Stripe screen-share with Tim (already on the launch checklist), verify the portal config and upgrade the copy:

1. **SWITCH PLANS** — current copy: "Reach out and we'll switch you over." IF the screen-share confirms the portal has plan-switching enabled with all 6 Localizer prices (Solo/Pro/Agency × monthly/annual) listed as switchable → swap in the stronger version: "Upgrade or downgrade anytime from your account settings. Changes take effect right away." (Tim pre-approved this stronger version conditional on the portal being live.) Also consider adding "…and switch plans" to the account-page button which currently reads "MANAGE BILLING & INVOICES" (doesn't telegraph plan-switching).

2. **CANCEL** — current copy: "Anytime. And your data stays put… Re-subscribe whenever." (data-preservation only — verified unconditionally true). IF the screen-share confirms the portal is set to "cancel at period end" (Stripe default, NOT "cancel immediately") → add the end-of-period line back: "Your access runs through the end of the period you've already paid for." Only add if confirmed — if portal is "cancel immediately," leave as-is.

Both are ~2-min copy swaps in `app/pricing/page.tsx` `FAQS` array. Gated on the Stripe screen-share, not standalone work.

---

## 🟢 Ready to build (6)

*Scoped, unblocked, just needs a session.*

### Unit D — Rate limiting (Upstash Redis) — ⚠️ LARGELY SHIPPED June 30

**Status:** The launch-critical slice shipped June 30 — shared fail-open `lib/rateLimit.ts` (30/min per org, NOT the old four-tier /hr scheme below), wired into `/api/renders/generate`, `/api/renders/approve`, and `/api/tours/[tourId]/upload-image` (commits `90657b7`, `4224201`, `6ebecc5`, `1955a5a`). Remaining fast-follow (post-launch acceptable): rate-limit `/api/import/extract`, `/api/import/parse-w9`, `/api/renders/print-pdf`; signup friction. The original April-9 spec below (four priority tiers, /hr/org) was NOT the design shipped — kept for history only.

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

### Welcome email — rewrite Localizer-focused — ✅ SHIPPED June 4

**Status:** Done June 4 in commit `0c7df71` (Localizer-only rewrite of `/api/welcome` body + subject — flyer stack → One image./Every asset./Every show.; body → Localizer-only; subject → "Welcome to Localizer"). LAUNCH_PROGRESS Day 6 confirms. Original item below kept for history.

The transactional welcome email at `app/api/welcome/route.ts` (Resend, fires from `lib/auth/ensureOrgExists.ts:71–78` on first signup) currently pitches the full HWY61 suite. The "flyer stack" centerpiece reads:

- **Routing.** (TourRouter — gated under COMING_SOON, customer can't access)
- **Marketing.** (Localizer — what they actually signed up for)
- **Advancing.** (TourRouter — also gated)

A Localizer-only customer gets promised three product surfaces, two of which they can't access. Same suite-positioning pattern as the `/dashboard/support` FAQ that was rewritten June 4 — this is the next surface in the same cleanup pass.

Body copy ("HWY61 Labs builds tools for people who move music for a living. Everything autosaves. Everything drag & drop.") also reads suite-flavored — "tools" plural.

**Scope:** rewrite the flyer-stack triplet + body paragraph to be Localizer-focused. Keep the visual treatment (display font, crimson middle line, dashboard CTA). Keep the "You're in." headline, sign-off, and reply note as-is.

**Effort:** ~30 min, one file (`app/api/welcome/route.ts`), HTML email body only. No infrastructure changes.

**Copy authority:** Drew per copy-approval authority (Tim coordination optional, since this is voice-aligned with the FAQ rewrite Drew just shipped from Tim's canonical sources). Cross-check final copy against `app/pricing/page.tsx` FAQS and `app/dashboard/support/page.tsx` FAQ_DATA for consistency.

**Why not in the launch sprint:** Surfaces post-signup only — a Localizer-only customer who hasn't signed up doesn't see this email. Lower-traffic than landing/pricing/dashboard. Worth doing before broader marketing pushes but not a launch blocker.

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

## ⚪ Awaiting Tim (6)

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

### Confirm Tim blessed the venue section header names

The June 14 Team/Marketing build named/renamed venue section headers (Marketing, Team, Press & Playlists, Follow the Artist). Tim was to bless/rename these. Status unconfirmed as of July 1 — verify with Tim. Low-stakes (naming only, not a launch gate); folding the floating June-14 session-log item here so it's tracked.

---

## ⏳ Soak items (4)

*Waiting on production data or time to pass.*

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

### TourRouter landing page — stale "Free during beta" copy

`app/tourrouter/page.tsx` has two stale beta lines that survived the June 4 cleanup pass on `/` and OnboardingWizard:

- Line 702: `<p className="pricing-note">Annual billing saves 20%. Free during beta — no credit card required.</p>`
- Line 721: `<p className="sub-headline">Free during beta. No credit card. No commitment. Just the tool the touring industry should have had 20 years ago.</p>`

Both also use the wrong "20%" annual figure (correct is ~17%, as documented in the May 28 landing-page correction).

**Why deferred:** `/tourrouter` is currently redirected to `/coming-soon` via `next.config` / middleware (per LAUNCH_PROGRESS Day 8–9 "Hide /tourrouter, /diy, /roadapp via config-level redirects"). No real customer sees this page at launch. **Trigger:** if/when TourRouter is un-gated as a public surface, do a copy pass first. Mirror the June 4 fixes on `/` (drop "Free during beta," replace with the actual trial model offer, correct the 20% → ~17%).

---

## 🧹 Code hygiene queue (17)

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

### Magic-link email template hardcodes Site URL

The Supabase auth email template builds magic links as `{{ .SiteURL }}/auth/callback?token_hash=...`, so ALL magic links land on production regardless of where the login was requested. Discovered June 11, 2026 during local testing — a `localhost:3000` login attempt received a magic link pointing at the production domain. Workaround until fix: hand-edit the link domain after receiving the email.

**Post-launch fix:** change the template to honor the `redirect_to` the client sends — use `{{ .ConfirmationURL }}` or `{{ .RedirectTo }}` so the link routes back to whichever host initiated the login (production, preview, or localhost).

**HIGH CAUTION:** this template serves every production login. A typo breaks auth for all users. Test on a throwaway flow (separate Supabase project or a dev email account) before saving to production. No code change in this repo; it's a Supabase dashboard config edit.

**Related (June 11):** `localhost:3000/**` added to Supabase Redirect URLs allowlist as part of the same local-testing session.

---

### Artist page pings `/api/tourrouter/tours` (403) for Localizer-only orgs

Pre-existing noise: on the artist page, a fetch hits `/api/tourrouter/tours` and returns 403 for Localizer-only orgs (correctly gated by `requireTourRouterAccess`), surfacing as console errors. First logged in `SESSION_LOG.md:3605`. Cosmetic only — no UX impact — but post-launch polish. Fix: gate the fetch client-side on `localizer_enabled && !hasTourRouter` (or its equivalent) before firing, so the network panel stays clean for Localizer-only customers.

---

### Venue hero buttons — duplicate inline style objects across two files

Venue hero buttons (DOWNLOAD ALL in `app/v/e/[token]/page.tsx` + `ShareLinkButton.tsx`) carry duplicate inline style objects across two files — they drifted-risk on any future size/style change. Extract a shared `lib/ui/heroButtonStyle.ts` constant. Low priority, cosmetic-debt only.

---

### Extract VenueSectionHeader component — 9 inline headers across 4 files

Every section header on the venue link page (Photos, Video, Print Poster, Advance Materials, Marketing, Listen in `app/v/e/[token]/page.tsx`; Team in `TeamContacts.tsx`; Press & Playlists in `PressPlaylists.tsx`; Follow the Artist in `SocialIcons.tsx`) uses an identical inline `<div>` carrying the same 6-property style block (mono 16px / 4px letterSpacing / `var(--hw-blue)` / uppercase / `paddingBottom: 10` / `borderBottom: 2px solid var(--hw-text)` / `marginBottom: 20`). Drift risk: every future tuning pass — size bump, color tweak, rule-thickness change — has to find all 9 sites and apply identically. The bumped fontSize 13 → 16 batch and the 2px ink-rule batch were both shipped this way (replace_all on a unique substring), which worked but won't scale.

**Fix:** create `app/v/e/[token]/VenueSectionHeader.tsx` exporting a `<VenueSectionHeader label="Photos" />` component. Replace each of the 9 inline divs with the component. Bonus: the hero "Show Assets" eyebrow at `page.tsx:104` (different `marginBottom: 8`, no rule) stays inline because it's a different visual role — don't conflate it. Low priority, cosmetic-debt only.

**Originated:** June 14, 2026, after a second consecutive launch-week batch tuned all 9 headers in lockstep.

---

### Centralize font-name encoding inside buildTextLayer — 5-site duplication

In `app/api/renders/generate/route.ts`, the space-to-`%20` conversion for non-custom font names runs at **5 sites**: the central encoder inside `buildTextLayer` (line 85, applied to every text layer) AND four caller-side pre-encodes (lines 135 / 173 / 259 / 294, where image/video URL builders pre-encode the font before passing it to `buildTextLayer`). The caller-side replaces are redundant — buildTextLayer's own line-85 replace would handle the encoding if the callers passed raw names. They exist for historical reasons (pre-existing pattern).

**Why it matters:** the Fjalla One launch-blocker bug lived latent because the encoding logic was distributed across 5 sites — fixing it required a careful `replace_all` substring + visual check to ensure no other space-to-underscore conversion was missed. With one canonical encoder, any future Cloudinary URL grammar change (or a switch from `%20` to something else) is a single-line edit.

**Fix:** remove the 4 caller-side `.replace(/ /g, "%20")` calls. Let `customFontsMap.get(name)` fall through to `buildTextLayer` with the raw font name. `buildTextLayer` already handles encoding via line 85 and the `isCustomFont` colon-detection branch. tsc + a re-render smoke test confirms parity. Low priority — the bug is fixed, this is hygiene.

**Originated:** June 14, 2026, alongside the Fjalla One fix.

---

### TourPageNav layout-coupling — Fragment return contract

`app/dashboard/tours/[tourId]/TourPageNav.tsx` returns a Fragment with two siblings (GIGS DASHBOARD link + 3-step box), documented in a 6-line top-of-file LAYOUT CONTRACT comment. Its layout is owned by the parent flex row in each of the 4 calling pages — TourPageNav doesn't render a wrapping `<div>`, so its children participate directly in the parent's `display: flex, justifyContent: "space-between"` distribution.

**Why it's acceptable today:** delivers the title-left / GIGS-DASHBOARD-center / box-right distribution Tim + Don requested without bunching. The single-place-to-change benefit of the extraction is preserved. Coupling is mild — the parent contract is one CSS property (`space-between`) and one set of siblings (title block adjacent).

**Why it might bite later:** if a new layout context surfaces (e.g. rendering this nav in a vertical sidebar, or with a different parent row shape), Fragment return won't fit. The component is no longer self-contained as a layout primitive.

**Refactor path (when triggered):** split into two named exports — `<TourGigsLink tourId={} active={} />` and `<TourStepsBox tourId={} active={} />` — and let each page compose them in whatever layout it wants. Each page picks up two imports instead of one, but layout decisions live at the call site where they belong. Document the new contract in TourPageNav's docstring as "deprecated, prefer the two-component path for new contexts."

**Originated:** June 14, 2026, when extraction + restructure shipped.

---

### Remove dead RETRY / `reRenderEvent` path in EventsTable (logo-stripping latent trap)

Priority: low (hygiene). Not user-reachable today.

`app/dashboard/tours/[tourId]/components/EventsTable.tsx` contains a `reRenderEvent` function (~lines 451-463) and a RETRY button (~line 569) that are not currently rendered in the per-show row UI (rows show only SEND/SENT and the link button). The RETRY path hits `/api/renders/generate` with `eventId` only (no `videosOnly`), which routes image columns through the server-side `buildCloudinaryUrl` — that path has NO logo layers and overwrites the canvas-rendered URLs. If this button is ever re-exposed, it would silently strip band + sponsor logos from a show's photo assets (square/story/landscape) while the editor preview still shows the logo — a silent, promoter-facing divergence.

**Action:** delete the dead RETRY button + `reRenderEvent` function, OR if RETRY is wanted back, route it through the same canvas path as Generate All (`renderPoster` → upload → `save-urls`) so logos are preserved. Do NOT simply re-expose the existing button.

**Context:** the server-side `buildCloudinaryUrl` image path is "effectively dead code" per `docs/SESSION_LOG.md` (it's immediately overwritten by the canvas path in normal Generate All flow). This backlog item is the cleanup that makes that true permanently.

---

### Agency Pro provisioning gap — no tier resolution path for comped customers

*Surfaced 2026-06-30 when the Agency Pro contact-sales card was added to `/pricing` and `/`.*

The "Agency Pro" tier (added to `/pricing` and the landing page as a contact-sales option on June 30) exists only as marketing copy. There is no `LOCALIZER_PRICE_MAP` entry, no `LocalizerTier` union value, and no resolution path in `lib/localizer/tierGate.ts::effectiveTierForFeatures`. If an Agency Pro customer is manually provisioned post-sales-call (comped or invoiced outside Stripe), their org has no tier to resolve to — `effectiveTierForFeatures` returns `"none"` and **locks them out of the product**, the exact opposite of what a paying Agency Pro customer should get.

**Why not broken today:** Agency Pro is a contact-sales tier with zero signups. The mailto CTA on both `/pricing` and `/` lands in support@; no Stripe checkout, no webhook, no provisioning code is exercised. Latent until first deal.

**Fix paths (pick at first-deal time):**
1. **Comp them as `localizer_plan = 'agency'`.** Identical feature set to what Agency Pro promises (Agency unlocks every rich format + custom fonts + every count limit they'd hit in practice). Zero code change. Custom pricing handled out-of-band via Stripe invoice or comp record. Simplest.
2. **Add a real `agency_pro` `LocalizerTier` value.** Extend the union in `lib/stripe/localizerPrices.ts`, add an `agency_pro` branch to `effectiveTierForFeatures` that returns full access, optionally add a `LOCALIZER_PRICE_MAP.agency_pro` entry if Stripe ever runs the billing. More work but cleaner if Agency Pro ever gets count limits distinct from Agency.

**Not a blocker for the marketing card** — the card is honest copy ("contact us, custom pricing") and the lockout only triggers if someone is comped *and* the comp uses an `agency_pro` plan string that doesn't resolve. The fix is conditional on the first deal closing.

Files involved when triggered: `lib/stripe/localizerPrices.ts` (`LocalizerTier` union + `LOCALIZER_PRICE_MAP`), `lib/localizer/tierGate.ts` (`effectiveTierForFeatures`), `lib/localizer/artistLimits.ts` + `lib/localizer/tourLimits.ts` (count helpers if Agency Pro gets distinct limits).

---

### trial-nudge `day5` / `day7` variable + NudgeType names are misnomers post-trial-extension

*Surfaced 2026-06-30 during the trial 7→14 day extension.*

`app/api/billing/trial-nudge/cron/route.ts` uses the names `day5` and `day7` for both the local variables and the `NudgeType` literals. After the trial went from 7 to 14 days, these nudges now fire at **signup + 12** and **signup + 14**, not days 5 and 7. The **timing logic is correct** — the windows are relative to `trial_ends_at`, which moved with the trial-length change — only the names are stale.

**Why this can't be a casual rename — footgun:** the strings `"day5"` and `"day7"` are persisted as the `nudge_type` column in the `trial_nudge_emails` table, which has a unique constraint on `(org_id, nudge_type)` for idempotency. Renaming the literals in code without migrating the column would make **every org that already received an old-typed nudge eligible to receive a duplicate of the new-typed nudge** — the unique constraint wouldn't catch the new value as a dup of the old.

**Proper fix (coordinated):**
1. SQL migration: `UPDATE trial_nudge_emails SET nudge_type = 'day12' WHERE nudge_type = 'day5';` plus `'day7' → 'day14'`.
2. Code change: rename literals + variables + `NudgeType` union in `app/api/billing/trial-nudge/cron/route.ts` to match.
3. Deploy both atomically (migration runs first, then code).

**Or just leave the names as historical artifacts.** Purely cosmetic — nothing reads the variable name; the logic is correct.

Low priority.

---

## 💭 Future ideas (5)

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

### Localizer help-doc article system

Standalone how-to articles (separate from the in-app FAQ at `/dashboard/support`, which is launch-sufficient as of June 4 — see LAUNCH_PROGRESS Day 13–14):

- "Getting Started with Localizer" — first-asset walkthrough
- "How to upload templates and customize branding" — fonts, colors, layouts
- "Custom fonts and how to upload them" — `.ttf` / `.otf` workflow
- "Sponsor logos — what works and what doesn't" — PNG transparency, sizing
- Likely a few more discovered post-launch from real customer questions

**Why not in the 30-day launch:** Original Day 13–14 spec (7 articles) was scoped under the assumption that a `/help` route + article rendering would exist. Neither exists today — `app/help/` and `app/dashboard/help/` are absent; there's no markdown pipeline, no DB article store. Building the surface itself plus 4–7 articles is a 1–2 day project. The June 4 in-app FAQ rewrite (19 Q&As, commit `2298e82`) covers launch-day customer questions about pricing, billing, the trial model, venue links, custom fonts, and troubleshooting — enough to ship.

**Architecture decision deferred until rebuild:** three options to pick at build time —
1. Extend `FAQ_DATA` in `app/dashboard/support/page.tsx` with longer answer fields acting as articles. Cheapest, but constrained to plain-string content.
2. New `app/help/page.tsx` + `app/help/[slug]/page.tsx` with article content in a typed constant. Matches existing codebase patterns (hardcoded constants, inline styles).
3. Add a markdown pipeline (`react-markdown` + `content/help/*.md`). Most flexible for long-form; introduces a dependency this codebase doesn't have.

Option 2 is the closest fit to existing patterns. Decision made at build time.

**Copy authority:** Partly Tim-voice-dependent (positioning of "Getting Started" especially). Drew can draft; Tim editorial pass before publish.

---

### Cloudinary / Storage orphan-file sweep across delete and replace paths

The same gap that motivated the (now-shipped) `deleteOrg` work applies to ALL per-entity delete and replace paths today — deleting an artist or a tour, or replacing an uploaded image, orphans the old Cloudinary/Storage files. Only `custom_fonts` cleans up after itself (`app/api/fonts/delete/route.ts` — use as the template).

Post-launch follow-on: sweep every delete/replace path to remove associated files. Scope is probably every `app/api/` route that does `.delete()` on artists / tours / venue_links / etc. or `.update({ ..._url: ... })` on artists / tours columns that hold Cloudinary public_ids or Storage URLs.

**Why this still matters after `deleteOrg` shipped:** `deleteOrg` solves the org-wide orphan problem (CCPA/GDPR + churn cleanup). This entry tracks the per-entity orphan problem that's still live during normal app use — a user deleting one artist out of three, or swapping a logo, still leaves files behind in Cloudinary / Supabase Storage. Long-tail billing waste.

**Originated:** June 11, 2026, as part of the `Org / account deletion routine` BACKLOG entry (now in `## Resolved`, shipped June 12). Carved out as its own item per the user's note that it shouldn't ride along into Resolved with the parent work.

---

### Per-show OG images via next/og generateMetadata on venue page

Currently every venue link unfurls with the same root Warhol card from `app/opengraph-image.tsx` (HWY61 LABS / LOCALIZER lockup, OFFICIAL ASSET KIT eyebrow). Could render a per-link Open Graph image with "Band Name — Venue, City" baked into the card so an unfurled link in iMessage/Slack/Twitter shows the actual show context instead of generic brand frame.

**Approach:** add `generateMetadata` to `app/v/e/[token]/page.tsx` returning `openGraph.images` pointing at a per-token dynamic OG route (e.g. `app/v/e/[token]/opengraph-image.tsx` — the Next.js per-segment convention). Route renders via `ImageResponse` with the same Bebas/cream/crimson treatment as the root card, plus band name and venue+city pulled from the token's `tour` and `event` rows (look up via `supabaseAdmin` keyed on `token`, same pattern as `page.tsx`).

**Why not in the 30-day launch:** root OG already lands the brand visually; per-show personalization is a polish-tier conversion lever, not a launch gate. Edge runtime + Bebas font fetching are already proven in the root OG file — incremental work is just the per-token data fetch + a slightly busier layout. Revisit post-launch once link-share traffic exists and we can A/B whether the personalization moves promoter open rate.

Post-launch nice-to-have.

---

### Per-field privacy control on venue Team contacts

The venue page Team section (shipped June 14 — `app/v/e/[token]/TeamContacts.tsx`) surfaces every populated contact field — name, email, phone — for every fixed role (Manager, Tour Manager, Booking Agent, Publicist) and every custom `team_extra` row. There is no per-field "show on venue page" toggle. The artist's only hiding mechanism today is to leave a field blank in the profile editor.

This is intentional for launch (CLAUDE.md rule 9 covers financial fields, not contact fields; promoters need to reach humans), but worth flagging: an artist who wants their Manager's email visible to promoters but their phone hidden has no way to express that — they have to either show both or hide both. Same with Manager-vs-Tour-Manager visibility: an artist who treats their Manager as internal-only must leave the entire Manager card blank in the profile, which loses the TourRouter-side visibility too.

**Possible refinements (pick at build time):**
1. Per-field `visible_on_venue: boolean` toggles next to each input in the profile editor — most flexible, most UI clutter.
2. Per-role `show_on_venue: boolean` toggle (one switch per card) — coarser, but covers the most common case of "Manager stays internal."
3. A separate "internal notes" field per role for stuff the artist wants stored but not shared — sidesteps the toggle UI entirely.

**Why deferred:** speculative. Real beta usage will tell us whether artists feel comfortable with the all-or-blank model or whether they want finer control. Per-field toggles also fragment the Team data model — worth waiting for actual demand before adding.

**Originated:** June 14, 2026, as the Team venue display shipped.

Post-launch refinement.

---

## 🧭 Decisions / deliberate non-actions (2)

*Records of decisions to NOT do something. The reason matters more than the title — these are the items future readers will be tempted to "fix" without knowing why.*

### Print PDF route (/api/renders/print-pdf) — deliberately NOT tier-gated (Phase 3 decision, June 29)

The Indie static-only gate does NOT block the print-pdf route, by deliberate choice.

**Reasoning:** the route regenerates the PDF fresh on every request (no stored asset). Gating by current tier would 403 a promoter's already-sent venue link the moment the org downgraded — breaking the forward-only principle we hold everywhere else (sent links never degrade). The video gate on `/api/renders/generate` does not have this problem because video URLs are stored on `venue_links.render_tiktok_url` / `render_yt_shorts_url` at generation time; print has no stored equivalent.

**Print is protected instead by:**
1. **The editor tier gate (Phase 3 frontend).** An Indie org cannot set up a print poster (`image_print_id` + `overlay_config.print`) in the template editor, so a never-paid Indie org has no print config and the route 404s naturally at `print-pdf/route.ts:145` (`if (!tour.image_print_id || !printConfig)`).
2. **Rate limiting (abuse-surface track).** The cost-abuse angle — high-res Cloudinary fetch (`w_3300,h_5100` at `:154`) + pdf-lib serialization per token hit — is a rate-limit concern, already on the fast-follow rate-limit list, NOT a tier-gate concern.

**Net:** a downgraded org's already-sent print links keep working (forward-only preserved); a never-paid Indie org never had print to set up in the first place. **Do NOT add a current-tier gate to this route** — it would break forward-only. If print cost-abuse becomes a problem, the fix is rate limiting, not tier gating.

**Originated:** June 29, 2026, during the Indie static-only Phase 3 backend gate work. Forward-only behavior was an emergent property of video URL storage; print's regenerate-on-demand shape was discovered by recon to break that property if gated naïvely.

---

### Download routes — deliberately NOT tier-gated (Phase 3 decision, June 29)

None of the five download routes get an Indie static-only tier gate. They keep their existing paid/free check (`getLocalizerAccessLevel` → 402), but no current-tier format gate is added.

**Routes:** `/api/download`, `/api/download/marketing`, `/api/download-all`, `/api/download-all/marketing`, `/api/tours/[tourId]/download-format`.

**Reasoning:** all five serve STORED assets (`render_*_url` columns), never regenerate. Forward-only applies:
- Four are promoter-facing (reached via a sent venue/marketing token). A promoter has no say in the org's tier; gating would degrade a link the org already sent them. Clear forward-only — do not gate.
- The fifth (`download-format`, the tour-wide "SHARE & DOWNLOAD FULL TOUR" action) is TM-facing and ambiguous, but resolves the same way: an Indie org that never paid has NULL rich-format columns (nothing to download), so the ONLY org that can download video here is one that generated it while Pro and later downgraded — exactly the case forward-only protects. Gating it would add zero protection (never-paid Indie has no rich assets) and only punish the downgrade case (a TM retrieving their own prior paid work).

**The "Indie dashboard shouldn't show working video-download buttons" concern** is handled in the Phase 3 FRONTEND (gray out the rich-format buttons in `ShareWithMarketingButton` for Indie — same grayed-out-clickable pattern as the editor tabs), NOT by a backend gate. Frontend communicates current tier; backend honors prior paid work.

**The real rich-asset enforcement** lives at generation time (`/api/renders/generate` tier gate, shipped Phase 3 step 2) and the editor gate (Phase 3 frontend) — Indie can't MAKE new rich assets. Anything downloadable already passed the generation gate when it was created. **Do NOT add current-tier gates to the download routes.**

**Originated:** June 29, 2026, Phase 3 backend gate work. Same forward-only reasoning as the print-pdf non-gating decision above.

---

## Resolved

*Items here are completed and verified. Kept in this file (rather than deleted) as historical record — useful for future debugging that retraces a known-fixed bug, and for understanding why certain patterns in the codebase exist.*

### Org / account deletion routine

**Resolution (2026-06-12):** Shipped. Two-day arc from BACKLOG entry to production-ready feature. Two parts, both live:

1. **CASCADE migration applied (June 12)** — 12 SQL Editor statements converting all org-descendant FKs to CASCADE (7) or SET NULL (3) and adding a missing CASCADE FK on `marketing_tokens` (1). Statement 11 was originally drafted to add an FK to `tour_shows_crew` but skipped post-hoc when that turned out to be a view. After the migration, `DELETE FROM orgs WHERE id IN (...)` walks every dependent table in a single transaction.
2. **`deleteOrg` admin function shipped (June 12)** — `lib/admin/deleteOrg.ts` (manifest capture → audit-row insert → DB delete → batched Cloudinary `delete_resources` + Supabase Storage `.remove()` + `auth.admin.deleteUser` cleanup) wrapped by `POST /api/admin/delete-org` (dual-gated: admin session via `isAdminEmail` + `ADMIN_DELETE_ORG_SECRET` bearer; Layer 1 bypassed in dev for local testing). Audit table `deleted_orgs_audit` (service-role only, RLS-enabled, no `authenticated`/`anon` grants). Proven end-to-end on `testicles` and `testx` (June 12) with Cloudinary asset deletion verified out-of-band. Spec doc: `docs/TEST_ORG_CLEANUP_PLAN.md` (Phase 1 migration + Phase 2 deletion + as-built spec).

**Original problem:** NO deletion path existed for an org or its user. Code recon (June 11) confirmed: no `auth.admin.deleteUser` calls anywhere in the codebase, no `deleteOrg` admin function, no FK cascade behavior visible from migrations. Manual multi-layer DELETEs in the Supabase SQL Editor were the only option. Privacy-law deletion requests (CCPA, GDPR) had no automated path; routine customer-account churn had no path either. The per-entity file-cleanup gap that was bundled into the original BACKLOG entry has been carved out as its own open item in `💭 Future ideas` ("Cloudinary / Storage orphan-file sweep across delete and replace paths") — that work still rides post-launch and is intentionally not closed with this entry.

### Verify dmca@, privacy@, support@ hwy61labs.com inbox routing

**Resolution (2026-06-11):** Verified. `support@hwy61labs.com` is a Google Workspace group with both `drew@hwy61labs.com` and `tim@hwy61labs.com` as actively-checked members. `dmca@hwy61labs.com` and `privacy@hwy61labs.com` are aliases on Tim's account. All three confirmed by external test emails reaching the monitored inboxes. Removed from LAUNCH_PROGRESS Active blockers June 11.

**Original problem:** `dmca@`, `privacy@`, and `support@hwy61labs.com` are referenced as official contact channels in the finalized Privacy Policy (`app/privacy/page.tsx`) and Terms of Service (`app/terms/page.tsx`). Launch blocker if any of the three bounced or silently dropped. `dmca@` in particular is the legal DMCA agent channel — copyright notices must actually be received for HWY61 LLC to maintain safe-harbor status.

### Onboarding wizard — per-user vs per-org state mismatch — WON'T FIX

**Resolution (2026-06-05): WON'T FIX.** Decided not to fix. A second user joining an existing org skips the onboarding wizard — accepted as fine; not worth addressing for launch or after.

**Original problem:** `orgs.onboarding_completed` is org-level state, but `org_members.user_role` is per-user. When a new user joins an existing onboarded org, they skip the wizard entirely and never get a chance to set their role.

**Example found April 9, 2026:** Drew completed the wizard on HWY 61 TEST CO. and got `user_role = Tour Manager`. Tim is also a member of the same org with `user_role = null` because the wizard only runs once per org, not once per user.

**Possible fixes considered:**
1. Move onboarding state to `org_members` so each user onboards independently (`org_members.onboarding_completed`, `org_members.onboarding_step`)
2. Keep `onboarding_completed` on orgs but add a lightweight "role picker" prompt that fires on first login for any member whose `user_role` is null, regardless of org-level state
3. Accept the gap — assume Tim's beta invites go to users who create their own orgs, not users joining existing orgs

**Outcome:** Accept (option 3) as launch-day reality. `user_role` is per-user state but isn't load-bearing for any current product behavior — the gating model is the org-level plan/trial state, not per-user role. The "second user joins existing org" case is rare in the actual launch funnel (most users sign up and create their own org), and the worst-case symptom is a `null` user_role on a second member, which is benign. Not worth the schema migration or the role-picker prompt cost to fix. Removed from Active blockers in LAUNCH_PROGRESS June 5.

### April 28 middleware band-aid removal

**Resolution (2026-06-05, commit `5b6a688`):** Band-aid removed. The COMING_SOON env gate was verified working alone in both directions — `COMING_SOON=true` correctly hides `/` (redirects to `/coming-soon`), `COMING_SOON=false` correctly releases it. The 9-line band-aid block (5-line explanatory comment + 4-line unconditional redirect) was deleted from `middleware.ts`; the env-gated `// --- Coming Soon gate ---` block that follows is untouched and remains the single point of control. If the band-aid had been left in place, flipping `COMING_SOON=false` at launch would not have released the homepage — `/` would have continued redirecting to `/coming-soon` regardless of env-var state.

**Background:** On April 28 a TEMPORARY unconditional redirect was added to middleware.ts sending `/` to `/coming-soon` for public hosts, with `?dev=1` as the bypass. Comment said the env-var-gated COMING_SOON block below it wasn't firing in production.

**Diagnosis (2026-05-06):** The env-var gate was working correctly. Confirmed by visiting `hwy61labs.com/?dev=1` in incognito — bypassed the band-aid via the dev query param, exercised the env-var gate directly, redirected to `/coming-soon` as expected.

**Most likely cause of the original misdiagnosis:** the env-var gate has an authenticated-user bypass — admins testing the marketing site shouldn't be redirected. Testing while logged into the hwy61ai@gmail.com admin account would have correctly let the request through, looking like the gate "wasn't firing." The band-aid was added without auth bypass, confirming "the marketing site is hidden" but with broader scope than intended (no admin preview, no preview tokens). Alternative: `COMING_SOON=true` may not have been in Vercel env vars on April 28 and was added later without note.

**Verification on removal (2026-06-05):** Set `COMING_SOON=false` locally; `/` rendered the Localizer landing page directly (no redirect). Set `COMING_SOON=true`; `/` redirected to `/coming-soon` as expected. Both directions confirmed before the band-aid removal was committed.

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

---

### Build the Free tier (engineering) before launch — CUT (2026-05-28)

The May 23 Free tier spec (watermark renderer, 5-shows/mo counter, 3-format limit, custom-font / video / PDF blocks, upgrade-wall modal) was killed by Tim's call on 2026-05-28. Replaced by a no-card 7-day trial of full Localizer access. After expiry, access falls through to "free" — downloads return 402 until the user picks a plan. No watermark, no per-month cap, no per-feature gates, no upgrade-wall modal.

**Resolution (2026-05-28):** Model replaced, not implemented. Original requirements list is dead. Trial model wired across three surfaces in one session:

- `lib/localizer/billingGate.ts` reads `trial_ends_at` and returns `"paid"` while it's in the future, evaluated before the existing `paidStatuses` check. Commit `8095476` (unpushed at write time).
- `lib/auth/ensureOrgExists.ts` seeds new orgs with `localizer_plan: null`, `localizer_plan_status: null`, `trial_ends_at = now() + 7d`. Replaces the prior beta-mode seed (`localizer_plan: "agency"` + `localizer_plan_status: "active"`). Commit `67cf438` (unpushed at write time).
- Beta-org backfill in Supabase SQL Editor: 22 existing tester orgs reset to fresh June-5 trials; shared org `d38702d7` preserved as `active` with `owner_email = 'hwy61ai@gmail.com'`. Verified by SELECT.

The Free cards on `/pricing` and `/` no longer constitute a "broken promise" — clicking "Start Free" lands a user in a 7-day trial of full access, then free/blocked until they pick a plan. The five sub-items in the original entry (watermark renderer, 5-shows/mo counter, feature gates, format limit, upgrade wall) are NOT happening. See `docs/LAUNCH_PROGRESS.md` "Trial model (locked May 28 — replaces the May 23 watermarked Free tier)" for current state. See `docs/SESSION_LOG.md` 2026-05-28 "No-card trial model locked" for the decision narrative.

---

### Verify new-user signup works end-to-end before launch — PASSED (2026-06-04)

Pre-launch gate to verify the post-May-28 trial-seed `ensureOrgExists` path end-to-end on production. The new-user provisioning logic (commit `67cf438`, May 28) seeds new orgs with `localizer_plan = null`, `localizer_plan_status = null`, `trial_ends_at = now() + 7d`, replacing the prior beta-mode seed. This code path had **never been exercised from the auth-callback** before — `HWY 61 TEST CO.` was created manually on March 10, predating the move of `ensureOrgExists` into the auth callback (commit `9f88d03`, April 9).

**Resolution (2026-06-04): PASSED.** Real fresh signup run end-to-end against production with `hwy61ai+testx@gmail.com`:

- Magic-link signup → `/auth/callback` → `ensureOrgExists` correctly seeded a new trial org: `localizer_plan = null`, `localizer_plan_status = null`, `trial_ends_at ≈ now() + 7d`, `localizer_enabled = true`, `owner_email` set, `org_members` row created with `role = 'owner'`.
- User landed on the onboarding welcome page (`/dashboard/onboarding/localizer`).
- Clicked GET STARTED → `/dashboard`.
- Added an artist, added a show, generated an asset — **NO paywall hit**; the trial gate granted access end-to-end (`getLocalizerAccessLevel` returned `"paid"` via the unexpired `trial_ends_at` branch).
- Test org cleaned up afterward.

**Correction to the original entry:** The claim "Supabase email signups are currently DISABLED at the project level" was stale at the time of the test. Email signups were already ENABLED in the Supabase Dashboard as of June 4 (confirmed during the test). Whoever wrote that line was working from out-of-date information; the actual project setting allowed the signup to proceed without a config change.

**Items 5 + 6 from the original test plan not exercised in this pass:** the beta-invite gate block on un-invited signups, and the Google OAuth fresh-account path. Magic-link path is verified; the other two remain unverified but are LOW risk (beta gate already protects production, OAuth is similar enough auth flow that the same `ensureOrgExists` call site fires). Acceptable launch posture.