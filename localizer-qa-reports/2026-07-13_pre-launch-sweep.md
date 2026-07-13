# QA Report — Pre-Launch Read-Only Sweep
**Date:** 2026-07-13
**Machine:** MacBook (Drew)
**Branch:** main (working tree)
**Scope:** Localizer only. TourRouter routes/lib/pages excluded except where explicitly checked (staleness section 4, auth section 5). Focus on code shipped July 8–13 with re-check of standing concerns.
**Method:** Static code review with targeted greps. No modifications, no git operations.

---

## Summary

| Severity | Count |
|---|---|
| CRITICAL | 0 |
| HIGH | 9 |
| LOW | 3 |

No CRITICAL findings. Nine HIGH findings — most are silent-write hygiene gaps (rule 6) where RLS is the sole line of defense; one is a dead-code hazard on `/api/renders/generate`; one is a real staleness hole on the TR→Localizer push path.

---

## HIGH

### H1 — `render_status` bulk write lacks verification (generate/route.ts:507)

**File:** `app/api/renders/generate/route.ts:507`
**What:** `await supabase.from("events").update({ render_status: "rendering" }).in("id", ids);` — no `.select()`, no error binding, no row-count check.
**Why it matters:** if RLS rejects the update, every event in the batch stays in its prior state. The client-side UI has already optimistically flipped to "rendering"; the DB stays as-is; on any refresh, the events reappear as "ready" or "error" without ever having been re-rendered. Silent divergence between UI and DB.
**Fix:** `const { data, error } = await ... .in("id", ids).select("id"); if (error || (data?.length ?? 0) !== ids.length) { throw / log }`.

### H2 — `venue_links` insert unverified in generate + approve

**Files:**
- `app/api/renders/generate/route.ts:580` (insert new venue_link when none exists for event)
- `app/api/renders/approve/route.ts:87` (insert new venue_link for approve flow)

**What:** both call `await supabase.from("venue_links").insert({...})` with no error binding, no `.select().maybeSingle()` verification.
**Why it matters:** in the approve case especially — the followup `update({ render_status: "ready", sent_at: now })` at approve:98 succeeds even if the venue_link insert silently failed, so the event gets marked SENT but the promoter's link doesn't exist. Promoter clicks the emailed link → 404. The UI sees "sent" and nothing looks wrong.
**Fix:** capture `error` and `data`, log + return 500 on either failure. Follow the pattern already used at save-urls:35.

### H3 — `render_status: "ready" | "error"` per-event writes unverified (generate/route.ts:589, 593)

**File:** `app/api/renders/generate/route.ts:589` (ready), `593` (error).
**What:** post-loop status flips run `await supabase.from("events").update({...}).eq("id", event.id)` without any error/data checks.
**Why it matters:** less severe than H1/H2 since the venue_links write already succeeded — the row shows current URLs, just possibly stuck in a stale `render_status`. But this silently degrades the SEND button gating (which requires `render_status === "ready"`) — events with successful renders could be stuck "rendering" forever.
**Fix:** minimum: log the error; ideally verify data returned. Compare with save-urls:46-56 which handles the identical pattern correctly.

### H4 — New Event insert unverified (dashboard events actions.ts:31)

**File:** `app/dashboard/tours/[tourId]/events/actions.ts:31`
**What:** `supabase.from("events").insert({...})` binds `insErr` (throws on error) but no `.select()` verification. Redirect fires immediately after.
**Why it matters:** if RLS rejects the insert but returns success-with-zero-rows, the redirect fires as if the event was created, but the events page will show nothing new. User thinks they created an event; they didn't.
**Fix:** `.insert({...}).select("id").maybeSingle()` + null check → throw with a helpful message.

### H5 — Bulk import insert unverified (import/save/route.ts:71)

**File:** `app/api/import/save/route.ts:71`
**What:** `supabase.from("events").insert(rows)` — bulk insert, error checked, no row count verification. Also: no explicit org-membership check before writing to `tour.org_id`.
**Why it matters:** import can silently write zero rows on RLS rejection; user sees "saved: N" (from `rows.length`, not returned rows) and thinks the import worked. Related: if RLS on events is permissive, any authenticated user could theoretically inject events into any tour whose ID they know, since there's no explicit `org_members` membership check before the insert.
**Fix:** `.insert(rows).select("id")` + verify the returned array length matches `rows.length`. Add an `org_members` membership check between the tour fetch and the insert, mirroring events/[eventId]/route.ts:96-105.

### H6 — Upload-image write unverified (upload-image/route.ts:106)

**File:** `app/api/tours/[tourId]/upload-image/route.ts:106`
**What:** `.update({ [column]: public_id }).eq("id", tourId).eq("org_id", tour.org_id)` — error checked, no data check. Double `.eq` is a safety belt but not a silent-failure signal.
**Why it matters:** Cloudinary upload succeeded (line 100), user sees success toast, but if the DB write silently returned zero rows the tour still points at the old asset. User thinks they replaced the print poster; they didn't. Only surfaces on next asset regeneration.
**Fix:** `.select("id").maybeSingle()` + null check.

### H7 — events PATCH current-value fetch has no error check (events/[eventId]/route.ts:124)

**File:** `app/api/events/[eventId]/route.ts:124-128`
**What:** the SELECT that precedes the staleness detection binds `data: current` but not `error`. If the SELECT itself errors (RLS misconfig, network flake, transient DB issue), `current` is null → `if (current)` skips staleness detection → `needs_rerender` never set → user edits a venue and the staleness UI stays silent.
**Why it matters:** the entire Phase 2 staleness system quietly fails to fire on any event whose read errors. UI shows no "↻ RE-RENDER" microcopy, toolbar chip never appears, promoter link ships with stale assets. User believes the assets are current because the UI says so.
**Fix:** bind `error` too and either surface as 500 or set `needs_rerender: true` conservatively when the pre-check fails ("we couldn't verify, so flag as stale").

### H8 — `renders/*` routes lack explicit auth + membership check

**Files:** `app/api/renders/generate/route.ts`, `save-urls/route.ts`, `approve/route.ts`, `tour-data/route.ts`, `print-pdf/route.ts` — none call `supabase.auth.getUser()` or verify `org_members`. All rely on `supabaseServer()` cookie-scoped session + RLS on the underlying tables.
**Why it matters:** if RLS on `events`, `venue_links`, or `tours` is ever misconfigured (a fresh migration forgets a policy, a table add misses ENABLE ROW LEVEL SECURITY), these routes will silently allow cross-org reads/writes. The events PATCH route (which was recently touched) demonstrates the correct defense-in-depth pattern with explicit auth + membership at events/[eventId]/route.ts:69-105. Rendering routes should mirror it. **Not a break today** — RLS is functional — but a single migration drift could turn this into a data-exposure incident.
**Fix:** add the standard auth-then-membership block at the top of each renders route. Roughly 6 lines per route × 5 routes = 30 minutes.

### H9 — `buildCloudinaryUrl` (dead image builder) still reachable via public route

**File:** `app/api/renders/generate/route.ts:139` (function), `:536` (invocation)
**What:** the deprecated image builder runs whenever POST body omits `videosOnly: true`. Currently the only in-app caller (`renderEvents()` in EventsTable.tsx:447) always passes `videosOnly: true`. But there is no server-side gate — a manual `curl`, an old cached client bundle, or any misconfigured caller triggers the dead path, overwriting correct canvas renders with URL-builder output that has NO opener, NO custom fonts, NO logos, NO custom text.
**Why it matters:** silent wrong output. The user's assets suddenly lose overlays after a stray request, with no visible cause. Since it writes through the same save-urls pipeline, it clears `needs_rerender: false` — the staleness system won't flag it as needing repair.
**Fix:** either (a) delete the image path from generate/route.ts entirely — the function is documented as dead code in SESSION_LOG (April 15/16) and BACKLOG. Or (b) server-side-require `videosOnly: true` and 400 anything else.

### H10 — TR→Localizer push silently orphans renders (push-to-localizer/route.ts:62)

**File:** `app/api/tourrouter/tours/[tourId]/push-to-localizer/route.ts:62`
**What:** on re-push to an existing Localizer tour, deletes all events (`from("events").delete().eq("tour_id", localizerTourId)`) then inserts fresh. New events have `needs_rerender` at default `false`. Any pre-existing venue_links pointing at old event IDs are orphaned (or FK-cascade-deleted). No user-visible staleness signal.
**Why it matters:** the staleness system's premise is "renders are current unless a watched-field change flags them stale." A wholesale event replacement bypasses that entirely — the new events look "not stale" the moment they land, but they have no renders at all. User re-pushes from TourRouter, opens Localizer, sees events, no chip warns them to Generate All.
**Fix:** either (a) after the insert, explicitly `update({ needs_rerender: true }).eq("tour_id", localizerTourId)` so every new event announces its staleness; or (b) show a tour-level "no assets generated yet" banner keyed on `venue_links` being empty. **Deferred acceptable** because TourRouter is paused at launch (`/tourrouter` → `/coming-soon` redirect); flag as gate on TR un-pause.

---

## LOW

### L1 — Debug `console.log` leftover (generate/route.ts:572)

**File:** `app/api/renders/generate/route.ts:572` — `console.log("UPDATE RESULT:", existing.id, "rows=" + (data ? 1 : 0), updateErr ? JSON.stringify(updateErr) : "");`
**What:** informational log that fires on every venue_links update in the video path — clutters Vercel logs during real customer traffic.
**Fix:** delete, or downgrade to `console.debug` (which Vercel filters by default).

### L2 — Canvas opener gate uses `.length`, video + print use `.trim().length`

**Files:** `lib/clientRender.ts:348` uses `(eventData.opener ?? "").length > 0`; `app/api/renders/generate/route.ts:335` and `app/api/renders/print-pdf/route.ts:370` both use `.trim().length > 0`.
**What:** a whitespace-only opener (e.g. `"   "`) draws a blank space band on canvas image renders but is skipped on video + print. Very edge-case, probably impossible to hit via the gigs-page inline editor (blur commits `value || null`), but latent inconsistency.
**Fix:** one-line change in clientRender.ts to add `.trim()`.

### L3 — sponsor-logo update destructures `data` but not `error` (sponsor-logo/route.ts:154, 227)

**File:** `app/api/tours/[tourId]/sponsor-logo/route.ts:154`, `:227`
**What:** `const { data: updated } = await supabase.from("tours").update(...).eq(...).select().maybeSingle();` — no `error` binding. If a genuine DB error occurs, the code path enters the "possible RLS rejection" branch and mislabels the failure in the log.
**Fix:** bind `error` too, log distinctly. Doesn't affect user-visible behavior.

---

## Checked and clean

- **Opener field-list propagation (section 2):** all consumer sites read opener/needs_rerender consistently — `app/api/events/[eventId]/route.ts:126`, `app/api/renders/tour-data/route.ts:29`, `app/api/renders/generate/route.ts:500` (via `select("*")`), `app/api/renders/print-pdf/route.ts:132`, `app/dashboard/tours/[tourId]/page.tsx:61`, `app/dashboard/tours/[tourId]/template/page.tsx:33`, `app/dashboard/tours/[tourId]/components/EventsTable.tsx:17` (component type). Public venue viewers (`app/v/e/[token]/page.tsx:25`, `app/v/m/[token]/page.tsx:33`, `app/v/tour/[token]/page.tsx:37`) correctly omit opener — it's baked into rendered assets, not raw-exposed. `app/api/download-all/*` and `download-format` correctly omit opener (they operate on venue_links URLs, not raw event data).
- **`needs_rerender` client-settable check (section 2):** confirmed NOT in the events PATCH `allowed` array at `app/api/events/[eventId]/route.ts:107-111`. Set only server-side via the render-affecting-field detection; cleared only in save-urls:48.
- **Opener render-path consistency (section 3):** all three paths gate on `showOpener + non-empty` and render raw (no caps transform, no pipe splitting). See canvas `lib/clientRender.ts:348`, video `app/api/renders/generate/route.ts:329-337, 372`, print `app/api/renders/print-pdf/route.ts:369-372`. Minor `.trim()` inconsistency filed as L2.
- **Tint removal completeness (section 3):** zero remaining `source-in`, `e_colorize`, or `WebkitMask` references anywhere in `app/` or `lib/`.
- **sanitize() (section 3):** only one `function sanitize` in the codebase, at `app/api/renders/generate/route.ts:63`, and it double-encodes rather than strips. No other stripping site exists in the video path.
- **needs_rerender lifecycle (section 4):** set only in `app/api/events/[eventId]/route.ts:137` on watched-field changes; cleared only in `app/api/renders/save-urls/route.ts:48`. No other routes update the flag directly.
- **Watched-field write paths (section 4):** searched all `events` writes in Localizer surface area. Findings inventory:
  - PATCH via `/api/events/[eventId]` → sets flag correctly.
  - New Event via `dashboard/tours/[tourId]/events/actions.ts` → inserts with flag=false (default). Correct: new events have never been rendered, so "not stale" is the right initial state.
  - Bulk import via `/api/import/save` → same. Correct.
  - TR push via `/api/tourrouter/tours/[tourId]/push-to-localizer` → delete + insert; H10 above.
  - Delete via `/api/events/[eventId]` DELETE → no field write. Correct.
- **Admin gates on TourRouter routes (section 5):** the July 2 admin gates on `/api/tourrouter/intake`, `/import/pdf`, `/import/text`, `/flight-price`, `/demo-seed` remain in place (spot-checked `demo-seed` — still calls `isAdminEmail`).
- **Public venue payload (section 8):** `app/v/e/[token]/page.tsx` events SELECT (line 25) exposes no `promoter_email`, no `manager_email`, no `opener`. `link.org_id` is fetched but not passed to JSX (no `{link.org_id}` in the file). Visibility toggles (`venue_show_team`, `venue_show_advance_docs`, `venue_show_w9`) gate PII additions server-side. No new exposure from this month's work.
- **Console/debug hygiene (section 7):** CHIP DEBUG removed from `TemplateEditor.tsx`. No TODO/FIXME/HACK comments added this month. One `console.log` leftover flagged as L1.

---

## Out of scope, noted

- TourRouter routes broadly not audited per scope directive. The two explicit TR checks in sections 4 (push-to-localizer) and 5 (admin gates) are handled above.
- BACKLOG's silent-write TourRouter-deferred inventory not re-checked — those items remain accurate per July 2 sweep.

---

## Suggested action ordering

If any subset of the HIGH items should ship before launch, priority:
1. **H2** (venue_links insert unverified in approve) — real customer visible: send-marks-sent-but-link-404s.
2. **H9** (dead code path reachable) — reproducible corruption if ever triggered.
3. **H7** (staleness pre-check swallows read errors) — silently disables the whole Phase 2 system on any RLS glitch.
4. **H4, H5, H6** (New Event / import / upload-image unverified writes) — same failure mode as H2 but on lower-frequency surfaces.
5. **H8** (defense-in-depth auth on renders routes) — mitigation for future RLS drift, not for a current break.
6. **H1, H3** (render_status silent writes) — UI/DB divergence, correctable by refresh.
7. **H10** (TR push staleness) — dormant while TourRouter is paused; block on TR un-pause.
