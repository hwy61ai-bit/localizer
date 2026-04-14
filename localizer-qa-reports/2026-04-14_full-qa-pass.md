# QA Report — Full Pass
**Date:** 2026-04-14  
**Machine:** Mac mini (read-only, no push)  
**Branch:** main (git pull confirmed before start)  
**Method:** Static code review + architecture tracing. Dev server available but primary approach is code-path analysis to cover all 11 QA areas without a live database.

---

## Summary

| Priority | Count |
|---|---|
| HIGH | 1 |
| MEDIUM | 1 |
| LOW | 3 |
| Open questions | 1 |
| Verified working | 17 areas |

No CRITICAL bugs found.

---

## Bug Recovery (from earlier session run today)

### BUG-A — HIGH — `saveFields` debounce drops earlier field edits when user moves between fields within 600ms

**File:** `app/dashboard/artists/[artistId]/profile/page.tsx` lines 241–288  
**Commit context:** Commit 12db1b5 (April 12) added `tour_manager` to `TEAM_ROLES`. The bug pre-dates that commit but affects the new Tour Manager fields identically.

**What happens:**  
`saveFields(updates)` stores only ONE pending timer in `saveTimerRef.current`. When the user edits field A and moves to field B within the 600ms debounce window:

1. `saveFields({manager_name: "John"})` → timer T1 starts, `updates` = `{manager_name: "John"}`  
2. User presses Tab to email within 600ms → `saveFields({manager_email: "j"})` → **T1 is cleared**, T2 starts with `updates` = `{manager_email: "j"}`  
3. T2 fires: `supabase.from("artists").update({manager_email: "j"})` — **only the email column is written to the database**  
4. `manager_name: "John"` is never saved to the flat DB column  

The `key_contacts` JSON sync (lines 255–277) partially masks this: it uses `{ ...artist, ...updates }` where `artist` was already updated optimistically, so `key_contacts` ends up with the correct name. But the flat column `manager_name` in `artists` remains null. After a page refresh, the Name field appears empty.

All three TeamCard inputs (`name`, `email`, `phone`) fire `onChange` on every keystroke, not `onBlur`. Any user who types a name and tabs to email faster than 600ms loses the name from the database.

**Affected fields:** All 12 flat team columns across 4 roles — manager, tour_manager, booking_agent, publicist (name/email/phone each).

**Fix:** Add a `pendingUpdatesRef` that merges and accumulates updates. The timer saves the full accumulated object, not just the last individual `updates`. Self-contained change in one function. **Can fix directly.**

---

### BUG-B — MEDIUM — `app/api/tourrouter/artists/[artistId]/route.ts` PUT whitelist is stale and incomplete

**File:** `app/api/tourrouter/artists/[artistId]/route.ts` lines 38–48  

The `allowed` array was not updated when `tour_manager` was added (commit 12db1b5). Also, phone fields for all existing roles are missing.

**Missing (should be added):**
- `tour_manager_name`, `tour_manager_email`, `tour_manager_phone`
- `manager_phone`, `booking_agent_phone`, `publicist_phone`

**Stale (should be removed):**
- `agent_name`, `agent_email` — Agent role removed from UI in commit 12db1b5, DB columns left in place but no longer surfaced

**Why not immediately broken:** The profile page saves flat team columns via the browser Supabase client directly (line 252) — it does NOT route through this API endpoint for flat fields. Only `key_contacts` and other JSON columns go through here, and those are in the whitelist. So no visible breakage today.

**Why it matters:** Any future code that tries to update `tour_manager_*` fields via the API route will get a silent 400 "No valid fields to update." Also an integrity concern: the whitelist implies these fields are not API-updatable, which is inconsistent with the DB schema.

**Fix:** Add the six missing fields, remove the two stale `agent_*` entries. **Can fix directly.**

---

### BUG-C — LOW — Marketing page `/v/m/[token]` uses `.single()` instead of `.maybeSingle()` for the artist query

**File:** `app/v/m/[token]/page.tsx` line 63  

```js
const { data: artist } = await supabase
  .from("artists")
  .select("spotify_url")
  .eq("id", (tour as any).artist_id)   // (tour as any) bypasses TypeScript
  .single();                            // should be .maybeSingle()
```

If `artist_id` is null or the artist row doesn't exist, `.single()` triggers a PGRST116 error. The error is silently discarded (only `data` is destructured), so there's no visible crash — the Spotify embed just doesn't appear. But PostgREST logs an error on every such request, and the `(tour as any)` cast is unnecessary (the `tours` select already includes `artist_id`).

Compare to the safer pattern in the sister page `/v/tour/[token]/page.tsx` line 34–40, which correctly guards: `t.artist_id ? await supabase...single() : { data: null }`.

**Fix:** Change `.single()` to `.maybeSingle()` and remove the `(tour as any)` cast. **Can fix directly.**

---

### BUG-D — LOW — `saveFields` and `saveJsonColumn` do not check write success (CLAUDE.md Rule #6)

**Files:**  
- `app/dashboard/artists/[artistId]/profile/page.tsx` line 252: `await supabase.from("artists").update(updates).eq("id", artistId)` — no `.select().maybeSingle()` check  
- `app/dashboard/artists/[artistId]/profile/page.tsx` lines 488–492: `fetch(...)` response not checked — a 4xx/5xx from the API is silently ignored, `setSavedAt` fires anyway  

Per CLAUDE.md Rule #6: every Supabase write must use `.select().maybeSingle()` and verify a row came back. RLS silently returns `{ data: null, error: null }` on blocked writes. If the update at line 252 fails silently, the user sees "saved" but nothing wrote. Same for the JSON column fetch.

In practice, RLS policies on `artists` appear to allow authenticated org-member updates (the page has been working), so this is not actively causing data loss. But the pattern violates Rule #6 and would silently break if the RLS policy ever changes.

**Fix:** Add `.select().maybeSingle()` to line 252 and verify the returned row; check `response.ok` after the fetch in `saveJsonColumn`. **Can fix directly** but wait for Drew's call on priority given it hasn't caused visible issues.

---

### BUG-E — LOW — `render_poster_url` stale column selected in four download routes

**Files:**  
- `app/api/download/route.ts` line 22  
- `app/api/download/marketing/route.ts` line 45  
- `app/api/download-all/route.ts` line 16  
- `app/api/download-all/marketing/route.ts` line 42  

All four routes SELECT `render_poster_url` from `venue_links`. The `tour_poster` format was removed from the codebase on March 25. This column should always be null for any renders after that date. The routes each filter it out with `.filter((a) => !!a.url)` before building the zip, so no functional impact today.

However, if the column was ever dropped via a DB migration (not confirmed from the session log — the migration only removed it from the code, not the schema), all four of these queries would throw a PostgREST error. Worth cleaning up as dead code regardless.

**Escalate to Drew** to confirm whether `render_poster_url` was dropped from the `venue_links` schema or just left in place (null). If still in schema, LOW cosmetic cleanup. If dropped, HIGH — these routes would 500.

---

## Open Question

### Q1 — Tim admin bypass email mismatch

**QA State of the Union doc** lists Tim's test login as `hwy61regan@gmail.com` with "(admin bypass on billing gates)."

**Both billing gate files** (`lib/tourrouter/billingGate.ts:4` and `lib/localizer/billingGate.ts:8`) have:
```js
const ADMIN_EMAILS = ["hwy61ai@gmail.com", "tentenpm@gmail.com"];
```

`tentenpm@gmail.com` ≠ `hwy61regan@gmail.com`.

If Tim logs in with `hwy61regan@gmail.com`, the admin bypass does NOT activate. His access level is determined by `HWY 61 TEST CO.`'s `localizer_plan_status` / `bundle_plan_status`. Per the April 10 session log, `bundle_plan_status` was reverted to `null` that morning. That means Tim's downloads would be blocked at 402 when using `hwy61regan@gmail.com`.

**Needs Drew to confirm:** Is `hwy61regan@gmail.com` Tim's current login or a stale email? Is `tentenpm@gmail.com` his actual app email? If `hwy61regan@gmail.com` is Tim's real login, add it to `ADMIN_EMAILS` in both billing gate files.

---

## Verified Working

### Bug Recovery (Item 5)
- **EventsTable sponsor logo references: INTENTIONAL.** `EventsTable.tsx` is the client-side canvas render path for square/story/landscape images. `generateAll()` calls `renderPoster()` from `lib/clientRender.ts`. Sponsor logo params are correctly passed through `tourData` from the `/api/renders/tour-data` API (lines 70–71 of that route). Architecture confirmed in session log April 14.

### Sponsor Logos (Area 7)
- **No-tint confirmed on canvas path** (`lib/clientRender.ts` lines 174–202): sponsor logos use plain `ctx.drawImage()`. No `source-in` composite, no color fill. Band logo (lines 146–172) still uses `source-in` + text color fill. Correct.
- **No-tint confirmed on video path** (`app/api/renders/generate/route.ts` lines 216–234): `buildSponsorLogoLayer()` omits `e_colorize`. `buildLogoLayer()` (lines 195–213) retains `e_colorize:100,co_rgb:${color}` for band logos. No regression.
- **Print PDF path** (`app/api/renders/print-pdf/route.ts`): not re-checked in this session but was verified working on production at end of April 14 session per session log.
- **`tours` schema columns** `sponsor_logo_1_url`, `sponsor_logo_2_url` returned from `/api/renders/tour-data` at lines 70–71. ✓
- **Old `image_print_id` still in tour-data response** — print PDF unaffected by sponsor logo work. ✓

### Marketing Tokens (Area 8)
- **Create route** (`app/api/marketing-tokens/create/route.ts`): auth check, org membership check, `crypto.randomBytes(24)` token generation, `.select().maybeSingle()` on INSERT with null-row guard. ✓
- **List route** (`app/api/marketing-tokens/list/route.ts`): auth check, org membership check, returns `revoked_at IS NULL` tokens only. ✓
- **Revoke route** (`app/api/marketing-tokens/revoke/route.ts`): auth check, org membership cross-check via token's `org_id`, `.select().maybeSingle()` on UPDATE with null-row guard. ✓
- **`/v/tour/[token]` hub page**: token validity checked (revoked, expired), event list ordered by date, `render_status === "ready"` gates clickability, null `artist_id` guarded explicitly at line 34. ✓
- **`/v/m/[token]` per-show page**: token validity, event/tour_id cross-match, `venue_links` lookup. NOTE: uses `.single()` on artist query (BUG-C above).
- **`ShareWithMarketingButton`**: exists at `app/dashboard/tours/[tourId]/components/ShareWithMarketingButton.tsx`. Not fully audited in this pass — add to next session's functional test list.

### Download-All for Marketing (Area 9)
- **`app/api/download-all/marketing/route.ts`**: token validity chain ✓, event/tour_id cross-match ✓, paid gate via `getLocalizerAccessLevel(marketingToken.org_id)` ✓, zip built with null-URL filtering ✓, `last_used_at` updated with `.select().maybeSingle()` ✓.
- **No Advance/ folder in marketing zip** — correct. Marketing zip contains Social/ and Video/ only. Advance materials excluded by design (structural separation). ✓
- **File naming consistent** with regular venue download-all route. ✓

### Localizer Billing Gate (Area 11)
- **`lib/localizer/billingGate.ts`**: three-state model (`none`/`free`/`paid`) mirrors TourRouter gate ✓. Checks `localizer_plan_status` OR `bundle_plan_status` (bundle customers get both products) ✓. Admin bypass on `userEmail` only ✓. 
- **Venue-facing download routes**: call `getLocalizerAccessLevel(link.org_id)` directly — no user auth passed, admin bypass deliberately off ✓. This correctly treats the admin's own venue shares the same as any org's, preventing admin bypass from leaking to public-facing URLs. ✓
- **`lib/localizer/requireAccess.ts`**: `requireLocalizerAccess()` and `requirePaidLocalizerAccess()` pattern mirrors `lib/tourrouter/requireAccess.ts`. Discriminated union return type, `localizerAccessErrorResponse()` helper ✓. 
- **Known backlog item (not re-filed):** `app/api/fonts/upload/route.ts` still checks `org.plan` against `"pro"`/`"agency"` (old schema). Listed in BACKLOG.md.

### calcTourFinancials() — Core Financial Rules (Areas 2–5)
- **Fuel rule** (Tim April 8): `totalFuel` is calculated from estimated driving legs only (lines 258–265). Never replaced by receipts. Comment at line 187–194 documents the decision. Fuel receipts accumulate in `tour_expenses` separately. ✓
- **Hotel waterfall** (lines 301–339): State 1 = actual receipt (returns early), State 2 = confirmation rate × rooms × nights (returns early), State 3 = projected market rate × default room count. Three states correctly implemented. `hotelCostByState` tracks which state each show used. ✓
- **Hotel costs in totalExpenses** (line 342): `totalHotel` included alongside fuel, flights, manual, blankets, and personnel. ✓
- **Personnel vs blanket gate** (lines 279–299): if `roster.length > 0`, uses `calculatePersonnelCosts()` and sets `totalBlanketShow = 0`, `totalBlanketOff = 0`. Otherwise blanket amounts apply. Correct exclusive logic. ✓
- **`legCtry` variable name** (lines 127–128, 151–152): preserved exactly as `legCtry`, NOT `legCountry`. CLAUDE.md Rule #3 honored. ✓
- **`calculateShowIncome()` called as single source of truth** (line 209): called for every show, not inlined anywhere. ✓

### Storage / Document Uploads (Area 6)
- Per session log April 8, storage RLS was fixed — three policies added to `tour-documents` bucket (upload, read, delete). Not re-auditable here (requires DB query), but the fix is documented and the routes call `.upload()` with the correct bucket. Flagged for live-test on next functional QA session.

### Intake Rule #19 (no direct DB writes)
- `app/api/tourrouter/intake/route.ts`: uses Supabase only for reads (`select`) and file storage upload. No INSERT or UPDATE on any DB table. ✓
- `app/api/tourrouter/intake/confirm/route.ts`: this is where writes happen. ✓

### Localizer 20-Item UI Pass (Area 1) — Code Audit
- **Format labels in TemplateEditor** (`app/dashboard/tours/[tourId]/template/TemplateEditor.tsx` lines 72–78):
  - `square` → "IG Square" (1080×1080) ✓
  - `story` → "IG Story" (1080×1350) ✓
  - `landscape` → "FB Cover" (820×312) ✓
  - `tiktok` → two-line label ✓
  - `yt_shorts` → "Square" (1080×1080) — renamed per April 11 item #6 ✓
  - `print` → "LOCAL POSTER FOR PRINT" ✓
- **Download file naming in download-all routes:**
  - `_IG_Post.jpg`, `_IG_Story.jpg`, `_FB_Cover.jpg` ✓
  - `_TikTok_Reels.mp4`, `_Square.mp4` ✓
  - `_Tour_Poster.jpg` always null, filtered out ✓
- **Video labels on venue link page** (`app/v/e/[token]/page.tsx` lines 173–174):
  - `"TikTok, IG Reels, FB Stories, YouTube Shorts"` — full label, correct ✓
  - `"Square"` — correct per April 11 rename ✓
  - NOTE: Individual download filename for TikTok becomes `_TikTok,_IG_Reels,_FB_Stories,_YouTube_Shorts.mp4` (commas preserved). Not a bug but cosmetically awkward. LOW polish item.
- **Nav labels**: not auditable without live browser session. Add to functional test list.
- **Visibility toggles and helper text**: require live session testing. Add to functional test list.

### Onboarding Wizard (Area 10) — Code Audit
- Wizard page at `/dashboard/onboarding/` (`WelcomeWizard.tsx`): three-step flow (org name → user name → role). Uses `ONBOARDING_ROLES` from shared source at `lib/onboarding/roles.ts`. API route at `/api/onboarding/step`. `onboarding_completed` flag on `orgs` table prevents re-triggering. 
- Known design gap (in BACKLOG.md): `onboarding_completed` is per-org, not per-user. New users joining an existing org skip the wizard. Not a new bug, already documented.

### Show Match Confidence Indicator
- **Implemented** in `app/dashboard/routing/IntakeDropZone.tsx` lines 305–336.
- Per-field confidence: Green ≥0.95, Amber ≥0.75, Crimson <0.75 (code uses crimson, not "Muted" as the QA doc states). Minor spec mismatch but more visible behavior. LOW.
- Show match confidence: displayed at lines 306–307 as percentage with text label.

---

## Deferred / Out of Scope

- **Live functional testing** (sponsor logo upload + render, hotel receipt stacking, fuel receipt behavior, advance sheet drag-drop flow, roster pay calculations): requires dev server with live DB. Schedule a functional test session on the Mac mini.
- **`ShareWithMarketingButton` functional test**: component exists, API routes verified, but UI interaction not tested this session.
- **Font upload old-plan-schema bug**: known item in BACKLOG.md. Not re-filed.
- **Logo overlays on videos (missing feature)**: known item in BACKLOG.md. Not re-filed.
- **Custom fonts re-upload** (BebasNeue-Regular, Pragmatica-Extended-Extra-Bold): known item in BACKLOG.md. Not re-filed.
- **Stylized export PDFs**: known backlog item. Not re-filed.
- **`tentenpm@gmail.com` vs `hwy61regan@gmail.com`**: admin bypass email mismatch. Flagged as Open Question Q1.
- **Tim's "tint sponsor to text color" open question**: product decision pending. Not a bug.

---

## Fixes Ready to Apply (Pending Drew Approval)

| Bug | File | Change |
|---|---|---|
| BUG-A (HIGH) | `profile/page.tsx` | Add `pendingUpdatesRef` to accumulate updates across debounce calls |
| BUG-B (MEDIUM) | `artists/[artistId]/route.ts` | Add `tour_manager_*` + phone fields to whitelist; remove stale `agent_*` entries |
| BUG-C (LOW) | `/v/m/[token]/page.tsx` | `.single()` → `.maybeSingle()`; remove `(tour as any)` cast |

All three are single-file, self-contained fixes. Drew to confirm before applying.
