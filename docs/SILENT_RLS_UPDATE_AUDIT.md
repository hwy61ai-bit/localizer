# Silent-RLS `.update()` Audit

Forensic recon produced **2026-04-20**. Catalogues every `.update()` call in public-facing routes (`app/api/**`, `app/v/**`, `app/**/actions.ts`) that does not chain `.select()` / `.maybeSingle()` / `.single()` to verify rows-affected — the silent-RLS-reject risk described in CLAUDE.md rule 6 and reinforced by today's three auth fixes (`fb768de`, `1134401`, `09d076e`).

**Read-only audit.** No code changed. No SQL run. Inferences drawn from the repo at HEAD.

**What "missing verification" means here.** A `.update(...).eq(...)` call that is `await`-ed but whose result is only checked for an `error` field. Supabase-js treats a zero-row-affected update (RLS filter, `.eq` miss, or both) as `{ data: null, error: null }` on a `.then()` — the server responds `200` with no rows changed, and the handler returns `ok: true` anyway.

---

## 1. Summary

- **Total `.update()` sites in scope:** 68
  - `app/api/**`: 66
  - `app/v/**`: 2
  - `app/**/actions.ts`: 0 (the two in-scope `actions.ts` files contain no `.update()` calls)
- **Already verified (chains `.select()` + `.maybeSingle()`/`.single()`):** 19
- **Missing verification:** 49

**Breakdown of the 49 missing-verification sites by route family:**

| Route family | Missing | Notes |
|---|---:|---|
| `/api/tourrouter/intake/confirm` | 7 | User-confirmed writes; RLS-scoped with `.eq("org_id", access.orgId)` |
| `/api/webhooks/resend` | 7 | Service role; email-lifecycle tracking |
| `/api/tourrouter/demo-seed` | 5 | Service role (`admin` client); one-shot demo seeding |
| `/api/renders/generate` | 4 | User-scoped; re-render pipeline — implicated in STALE_URL_EVIDENCE |
| `/api/tourrouter/advance/cron` | 3 | Service role cron at `0 10 * * *` |
| `/api/stripe/webhook` | 3 | Service role; **billing-adjacent** |
| `/api/billing/webhook` | 3 | Service role; **billing-adjacent** |
| `/api/renders/save-urls` | 2 | User-scoped; re-render pipeline |
| `/api/tourrouter/advance/send` | 2 | User-scoped; email + state flip |
| `/api/tourrouter/contacts/[contactId]` | 2 | User-scoped; contact edits |
| `/api/tourrouter/contacts/[contactId]/flag` | 2 | User-scoped; flag state |
| `/api/tourrouter/tours/[tourId]/push-to-localizer` | 2 | User-scoped; cross-product linking |
| `/api/events/[eventId]` (PATCH) | 1 | User-scoped; **also no auth check** — parallel to today's DELETE fix |
| `/api/tours/[tourId]/advance` (PATCH) | 1 | User-scoped; **also no auth check**, **no whitelist** |
| `/api/tours/[tourId]/upload-image` | 1 | User-scoped; post-Cloudinary row update |
| `/api/renders/approve` | 1 | User-scoped; "Send" button state flip |
| `/api/notifications/read` | 1 | User-scoped; has auth; cosmetic risk |
| `/api/beta/claim` | 1 | Service role; invite claim |
| `/api/tourrouter/advance/[token]` (PUT) | 1 | Service role; public promoter form submission |

**Top-line finding.** 72% of in-scope `.update()` sites lack post-write verification. Most of the risk concentrates in two places: (a) the `/api/renders/*` + `/api/tourrouter/intake/confirm` pipelines, where user-scoped Supabase clients write through RLS and a silent reject mimics "success" in the UI; and (b) the billing webhooks, where a silent no-match means a paying customer stays on the free plan. Service-role webhook routes (resend, cron, demo-seed) are materially lower risk because RLS isn't the filter — but they still lack rows-affected verification, so stale-row or `.eq`-miss cases go unnoticed.

---

## 2. Ranked findings — by user-facing blast radius

### HIGH

#### Renders pipeline (user-scoped, directly tied to STALE_URL_EVIDENCE)

**`app/api/renders/save-urls/route.ts:24` — `supabase.from("venue_links").update({ ...renderUrls }).eq("id", existing.id)`**
- Table/columns: `venue_links` — `render_square_url`, `render_story_url`, `render_landscape_url`, `render_poster_url`, `render_tiktok_url`, `render_yt_shorts_url`.
- Trigger: User action ("Re-Generate All" / per-event render in `EventsTable.tsx:363`). Client posts freshly-computed Cloudinary URLs.
- If silently no-ops: Venue page and `/api/download*` serve the OLD URLs. User sees spinner disappear, poster appears to update in preview (because the preview reads the local `renderUrls`), but the DB still has stale values. Exactly the STALE_URL_EVIDENCE bug shape — confirmed unresolved in BACKLOG.md:396.
- **HIGH.** Trust-breaking + matches an active bug.

**`app/api/renders/generate/route.ts:476` — `supabase.from("venue_links").update({ ...renderUrls }).eq("id", existing.id)`**
- Table/columns: same `venue_links.render_*_url` columns.
- Trigger: Server-side render pass from `/api/renders/generate` POST (both the image-pass and `videosOnly: true` pass fired from `EventsTable.tsx:385`). Already has a `console.log("UPDATE RESULT:", existing.id, updateErr ? ... : "OK")` that explicitly prints "OK" for a zero-row update, misleading anyone debugging.
- If silently no-ops: same as above — venue page serves stale URLs. Second incarnation of the same risk.
- **HIGH.** Same bug family.

**`app/api/renders/approve/route.ts:79` — `supabase.from("events").update({ render_status: "ready", sent_at: now }).eq("id", eventId)`**
- Table/columns: `events.render_status`, `events.sent_at`.
- Trigger: User clicks "SEND" on the EventsTable (`sendEvent` in EventsTable.tsx:405). The Resend email fires BEFORE this update.
- If silently no-ops: Email goes out to the promoter, but the dashboard still shows "READY" (not "SENT"), `sent_at` stays null. User clicks Send again thinking nothing happened → duplicate email to the promoter. Worse than "did nothing" — it actively enables double-sends.
- **HIGH.** Trust-breaking + has irreversible side effect (emails already delivered).

#### Unauthenticated PATCH handlers (same shape as today's `fb768de` fix)

**`app/api/events/[eventId]/route.ts:69` — `supabase.from("events").update(body).eq("id", eventId)`**
- Table/columns: `events` — **every column, no whitelist.** Accepts whatever is in `body`.
- Trigger: PATCH from EventsTable.tsx:134 (inline field edit).
- **No auth check.** Just like the DELETE handler this morning had. Only RLS stands between this handler and arbitrary event edits.
- If silently no-ops: User edits a venue name inline, sees their edit in the UI (optimistic update), reloads the page — original value is back. They think they have a bad network.
- **HIGH.** Two compounding issues (no auth + no verify). A focused follow-up to `fb768de` covering PATCH.

**`app/api/tours/[tourId]/advance/route.ts:11` — `supabase.from("tours").update(body).eq("id", tourId)`**
- Table/columns: `tours` — **every column, no whitelist.** Any body field becomes a column update.
- Trigger: PATCH handler, single-line body. Caller grep: unclear which client calls this, but the route's scope (`/advance` suffix) suggests it writes tour-level advance-related fields.
- **No auth check. No whitelist. No verification.** Worst shape of the three — accepts arbitrary column writes on `tours` with no guard.
- If silently no-ops: depends on caller. If it exists at all, user sees success + local state diverges from DB.
- **HIGH.** Even more exposed than `events` PATCH because no whitelist. Recommend auth + whitelist + verification in one commit.

#### Intake confirm — the core "I approve this parsed document" write path

**`app/api/tourrouter/intake/confirm/route.ts:75, 87, 100, 124, 162, 273, 285` (seven sites)**
- Tables/columns:
  - `tour_shows` — core show fields (lines 75, 124, 273): venue, city, capacity, offer, dates, etc.
  - `tour_shows.settlement` (JSON, lines 87, 100): settlement + box office data.
  - `tour_shows.hotel_cost_actual` (line 162).
  - `tour_shows.co_headliner` (line 285, JSON).
- Trigger: User clicks "Confirm" on the intake preview UI after AI parses a settlement sheet / deal memo / advance response / hotel confirmation. Per CLAUDE.md rule 10, this is the only write path for parsed documents.
- Scoping: All `.eq("id", showId).eq("org_id", access.orgId)`. Silent-RLS possible if `access.orgId` is inconsistent with the row's actual `org_id`. Also possible on `.eq("id", showId)` if the show was deleted between parse and confirm.
- Failure mode: `if (error) throw error; saved.push("Updated show ${showId}");` — pushes to `saved[]` based on whether `error` is set. Zero-row update doesn't set error → "saved" message lies.
- User impact: User drops a settlement sheet, reviews parsed numbers, confirms. UI says "Saved 3 updates." Nothing persisted. Tour manager trusts the app and doesn't re-check. Financial data drift.
- **HIGH.** Financial data + user-facing confirmation + trust-breaking. Single shared pattern, can be fixed in one commit (wrap all seven in `.select().maybeSingle()` and check length).

#### Advance send — email-before-state-flip pattern

**`app/api/tourrouter/advance/send/route.ts:35` — `.update({ advance_form_token: token }).eq("id", showId)`**
- Table/columns: `tour_shows.advance_form_token`.
- Trigger: Fires before the Resend email send if the show doesn't already have a token.
- If silently no-ops: The `token` variable is still in memory so the email link works once. But on next send the token regeneration path re-fires and the DB still shows null, so a new token replaces the old — the old link stops working for the promoter.
- **HIGH.** Breaks the shared link for the promoter.

**`app/api/tourrouter/advance/send/route.ts:103` — `.update(updates).eq("id", showId)` (advance_status, advance_sent_at, recipient)**
- Table/columns: `tour_shows.advance_status`, `advance_sent_at`, `advance_recipient_email`, `advance_recipient_name`.
- Trigger: After the email is sent.
- If silently no-ops: Email went out. DB still says "not_started". Next day's cron at `0 10 * * *` evaluates status and fires the initial email again → promoter gets a duplicate. Same shape as `/api/renders/approve` — email committed + DB state drift = double-sends.
- **HIGH.** Cron-driven amplification. Promoters get spammed.

#### Billing webhooks

**`app/api/stripe/webhook/route.ts:42, 56, 65` and `app/api/billing/webhook/route.ts:65, 94, 106` (six sites total)**
- Service role — silent-RLS isn't the mechanism. But zero-row match IS — e.g., `.eq("owner_email", customerEmail)` will silently miss if the user changed their owner_email between subscribing and the webhook firing; `.eq("stripe_customer_id", customerId)` will miss on a double-webhook race before the initial checkout.session.completed has populated it.
- Impact if silently no-op:
  - **Activation failure** (`checkout.session.completed`, `plan: "active"`): User paid, Stripe shows success, our DB still says `plan: "free"`. Paid customer locked out of paid features. Support ticket cost + trust damage.
  - **Status-drift failure** (`customer.subscription.updated`, `plan_status` update): User's subscription lapsed at Stripe, our DB still says "active". They keep using paid features post-cancellation.
  - **Cancellation failure** (`customer.subscription.deleted`, cancel path): Stripe cancelled, our DB still says active. Opposite of the above — they're paid-for-nothing in our view.
- Webhooks are Stripe-retried on non-2xx so the handler returning 200 on a zero-row miss actively prevents the retry that would save us.
- **HIGH.** Billing-adjacent per rubric. All six sites share the same shape and fix.

---

### MEDIUM

#### Re-render / render-status flags (user-scoped)

**`app/api/renders/generate/route.ts:418, 489, 493`** — `events.render_status` updates (`rendering`, `ready`, `error`).
**`app/api/renders/save-urls/route.ts:40`** — same `events.render_status: "ready"`.
- Trigger: state-machine updates during re-render flow.
- If silently no-ops: UI badge stuck on "RENDERING..." or wrong-state. Self-healing on next generate. User-visible but not trust-breaking. **MEDIUM.**

#### Contact edits (user-scoped, dashboard-driven)

**`app/api/tourrouter/contacts/[contactId]/route.ts:64` — `shared_contacts.update(sharedUpdate)`**
**`app/api/tourrouter/contacts/[contactId]/route.ts:88` — `account_contacts.update(privateUpdate)`**
- Trigger: User edits a contact record in TourRouter.
- If silently no-ops: Contact card shows old value after reload. User retries. **MEDIUM** (recoverable, but trust-dings).

**`app/api/tourrouter/contacts/[contactId]/flag/route.ts:28` — `account_contacts.update({ my_flag: true })`**
**`app/api/tourrouter/contacts/[contactId]/flag/route.ts:49` — `shared_contacts.update({ anonymous_flag_count })`**
- If silently no-ops: "Flagged" UI lights up but DB doesn't update. Worse for 49 because of the read-modify-write race: increment based on a possibly-stale `currentCount`. But verification wouldn't fix the race anyway — that's a separate atomicity issue. **MEDIUM.**

#### Cross-product linking

**`app/api/tourrouter/tours/[tourId]/push-to-localizer/route.ts:70` — `tours.update({ name, band_name, artist_id }).eq("id", localizerTourId)`**
**`app/api/tourrouter/tours/[tourId]/push-to-localizer/route.ts:145` — `tours_routing.update({ localizer_tour_id })`**
- Trigger: User clicks "Push to Localizer" in TourRouter. If the first update silently no-ops, the linked Localizer tour has stale metadata. If the second update silently no-ops, the parent routing tour never gets linked → next push creates a duplicate Localizer tour. The second is worse: duplicates compound.
- **MEDIUM.** Recoverable but annoying + duplicate data risk.

#### Asset upload follow-up

**`app/api/tours/[tourId]/upload-image/route.ts:59` — `tours.update({ [column]: public_id })`**
- Trigger: After Cloudinary returns a public_id, save it back to the tour row.
- If silently no-ops: Cloudinary has the asset; our DB doesn't know. Template editor loads without it. User re-uploads, sees success, same result. Potentially confusing bug report. **MEDIUM** (self-healing only after user finds workaround).

#### Notifications

**`app/api/notifications/read/route.ts:22` — `notifications.update({ read: true })`**
- Trigger: User clicks "Mark all read".
- If silently no-ops: unread badge stays. User reloads, sees it, clicks again. Pure cosmetic. **MEDIUM** leaning LOW.

#### Public promoter advance form (service role)

**`app/api/tourrouter/advance/[token]/route.ts:131` — `tour_shows.update(update).eq("id", show.id)`**
- Service role (public endpoint). Silent-RLS isn't the mechanism. Zero-row only possible if show row deleted between SELECT and UPDATE — unlikely in practice.
- Impact if no-op: Promoter fills out advance form, clicks submit, sees "ok:true", but their data didn't save. Next cron email fires again. Promoter is confused, support ticket cost.
- **MEDIUM.** Low probability, high user-visibility if it happens.

#### Resend webhook — escalation paths

**`app/api/webhooks/resend/route.ts:55, 82` — `tour_shows` updates on `email.bounced` and `email.complained`**
- Service role. Sets `advance_status: "email_bounced"` / `advance_auto_stop: true` when a promoter's email bounces or complains.
- If silently no-ops: Bounce happens at Resend, we don't escalate, cron re-sends next day, bounces again, promoter never gets reached, show stays unadvanced. Recoverable by manual intervention but *silent* failure mode — no one notices the tour_shows update didn't stick.
- **MEDIUM.** Service-role so silent-RLS isn't the trigger, but rows-affected check still valuable.

---

### LOW

#### Resend webhook — delivery tracking

**`app/api/webhooks/resend/route.ts:41, 45, 49, 53, 80` — `advance_emails.status` updates (delivered/opened/clicked/bounced/complained)**
- Service role. Purely cosmetic status tracking on the advance_emails log. Silent no-op means the dashboard doesn't show "Delivered 2h ago" — but the underlying email lifecycle is unchanged. **LOW.**

#### Advance cron (service role, self-healing)

**`app/api/tourrouter/advance/cron/route.ts:162, 172, 239` — `tour_shows` advance_status / advance_form_token / batch updates**
- Service role daily cron. A silent no-op means the next cron run re-fires. Self-healing. **LOW.**

#### Demo seed (service role, one-shot)

**`app/api/tourrouter/demo-seed/route.ts:164, 238, 298, 378, 389` — `tour_shows`, `tours_routing`, `artists`**
- Service role. Only hit when a user clicks "Load Demo Tour". If a row silently no-ops, demo data is incomplete but the user can click again. **LOW.**

#### Beta claim

**`app/api/beta/claim/route.ts:29` — `beta_invites.update({ claimed_by, claimed_at })`**
- Service role. Silent-RLS isn't the issue. Because the SELECT filters on `.is("claimed_by", null)`, a zero-row update would mean the row was claimed by someone else between SELECT and UPDATE (a race), not RLS. Unlikely at current volume. **LOW.**

---

## 3. Patterns and anti-patterns

### Pattern A — **"Email then state-flip"** (HIGH risk cluster)

Sites: `renders/approve:79`, `tourrouter/advance/send:103`, webhooks/resend escalation paths.

The handler sends an email via Resend, *then* updates a DB flag saying "sent" / "escalated". If the update silently no-ops, the email is unrecoverable but the DB thinks it never went. Next trigger (user click or cron) fires again → duplicate email. This is the exact shape that will make promoters yell.

**Fix shape:** flip the state BEFORE the email send, or wrap the update with `.select().maybeSingle()` + a length check and refuse to send the email if the state update failed.

### Pattern B — **"Trusting PATCH handlers with body-as-update"** (HIGH risk)

Sites: `events/[eventId]:69`, `tours/[tourId]/advance:11`. Both take `body = await req.json()` and pass it directly into `.update(body)`. No auth check. No whitelist. No rows-affected check. Three compounding gaps per handler.

Compare `tourrouter/artists/[artistId]/route.ts` which has `requireTourRouterAccess()` + whitelist + `.select().maybeSingle()`. That's the corrected pattern established in the codebase.

**Fix shape:** copy the `artists` PUT pattern to both routes. Single bundled fix (3 tasks × 2 files).

### Pattern C — **"Idempotent render-status machine updates"** (MEDIUM)

Multiple renders/* sites update `events.render_status` in-flight (`rendering` → `ready` or `error`). These are state-machine transitions during a single request. A silent no-op leaves the UI badge stuck but the next request will re-flip. Recoverable.

Could be fixed by introducing a thin helper `setRenderStatus(eventId, status)` that wraps the update with verification. Single helper, several call sites cleaned up.

### Pattern D — **"Service-role webhook, no rows-affected check"** (mixed)

Stripe webhook, billing webhook, Resend webhook, advance cron, demo seed. All use service role so silent-RLS isn't the mechanism — the risk is zero-row `.eq` mismatches (email changes, race conditions, orphaned IDs). Stripe/billing webhooks return 200 to prevent Stripe retry even on zero-row mismatches, which is the wrong behavior.

**Fix shape:** for billing webhooks specifically, return 500 (so Stripe retries) when a zero-row update is detected, with observability (`console.error` + alert). For cron/demo-seed, just log — retry comes on next schedule.

### Pattern E — **"Existing `.select()` verification pattern is proven and cheap"**

19 sites already use the correct shape. No special infrastructure needed — every fix is "add `.select().maybeSingle()` at the end of the chain; check `!data` → 500".

---

## 4. Quick-win candidates (one-line fix, zero logic change)

These five sites are literal one-line additions. The existing error handling already catches explicit errors — adding `.select().maybeSingle()` plus a null check on the returned data is additive, doesn't change any happy-path behavior, and closes the silent-RLS hole.

| # | Site | Line | Why it's a one-liner |
|---|---|---:|---|
| 1 | `app/api/renders/save-urls/route.ts` | 24 | Update already has its own error path; add `.select().maybeSingle()` + a null-check after, return 500. **Directly closes STALE_URL_EVIDENCE risk.** |
| 2 | `app/api/renders/approve/route.ts` | 79 | Trivial chain addition. Closes the double-email risk. |
| 3 | `app/api/renders/generate/route.ts` | 476 | Already has `console.log`, just add verification and log the length instead. |
| 4 | `app/api/tourrouter/advance/send/route.ts` | 103 | Trivial chain addition. Closes cron-amplified double-email risk. |
| 5 | `app/api/tourrouter/advance/send/route.ts` | 35 | Single-column update, trivial to add chain. |

The intake/confirm cluster (7 sites) is *almost* a quick win but not quite — each is wrapped in a different case branch and the "saved" message assembly would need to change. Call it a **"quick medium"** — 15–20 minutes, single file, all-or-nothing.

The unauthenticated PATCH handlers (`events`, `tours/advance`) are NOT quick wins — they need auth, whitelist, AND verification. Real logic changes. Budget one session per handler matching the pattern of `fb768de`.

---

## 5. Recommended fix order

1. **`app/api/events/[eventId]` PATCH — auth + whitelist + verification** (HIGH, ~30 min)
   Directly parallel to today's `fb768de` DELETE fix. Same file. Cheapest "close a known gap" move. Model after `/api/marketing-tokens/create/route.ts` + `tourrouter/artists` whitelist.

2. **`app/api/tours/[tourId]/advance` PATCH — auth + whitelist + verification** (HIGH, ~30 min)
   Same shape as #1, second instance. Fixing this in the same session as #1 is efficient because the pattern is identical.

3. **`/api/renders/save-urls:24` + `/api/renders/generate:476` — venue_links verification** (HIGH, ~15 min for both)
   Directly addresses the suspected STALE_URL_EVIDENCE root cause. Two one-line fixes. Can be bundled into a single commit. High leverage: closes an active bug AND an audit finding.

4. **`/api/renders/approve:79` — events state-flip verification** (HIGH, ~5 min)
   Closes the double-email risk. True one-liner.

5. **`/api/tourrouter/advance/send:35, 103` — advance state-flip verification** (HIGH, ~10 min)
   Closes the cron-amplified double-email risk. Two one-liners, same file.

6. **Billing webhooks — stripe + billing, six sites** (HIGH, ~45 min)
   Single commit. All six sites share the same shape. Also needs a decision: return 500 on zero-row so Stripe retries? Yes, with observability. Coordinated fix.

7. **`/api/tourrouter/intake/confirm` — seven sites in one file** (HIGH, ~20 min)
   Single-file fix. Wrap each `.update()` with `.select().maybeSingle()` + check `!data` → push to an `errors[]` array instead of `saved[]`. Update the response shape to include errors. Low risk, high-trust payoff.

8. **`/api/tourrouter/tours/[tourId]/push-to-localizer:145`** (MEDIUM, ~5 min)
   Prevents duplicate-tour bug on retry. One-liner.

9. **Contact routes — PUT + flag (4 sites)** (MEDIUM, ~15 min)
   Single commit across two files. Straightforward.

10. **`/api/tours/[tourId]/upload-image:59`** (MEDIUM, ~5 min)
    One-liner. Eliminates a confusing "upload worked but didn't" case.

Everything else (notifications, render-status state machine updates, resend delivery tracking, cron, demo-seed, beta claim) is LOW and can wait for a batch "verify every update" sweep post-beta.

**Total est. effort for HIGH tier (1–7):** ~2.5 hours across 5–6 commits.

---

## 6. Out-of-scope sites noted

Encountered while grepping. Listed for triage; not analyzed.

- **`lib/supabaseAdmin.ts`** — defines the admin client; no `.update()` calls itself, but worth auditing everywhere it's imported (20 files per today's VENUE_LINKS_DELETION_AUDIT). The admin client bypasses RLS, so every `.update()` against it needs rows-affected verification rather than relying on RLS to catch bad IDs.
- **`lib/notifications.ts`** — called from multiple routes (`createNotification(...)`). Likely does INSERTs (not `.update()`) but worth a quick look during a broader `lib/` audit.
- **`app/dashboard/**`** — explicitly out of today's scope per the audit brief. A handful of `.update()` calls exist in dashboard server actions (e.g., event edits, tour config saves). Follow-up audit.
- **`app/roadapp/**`** — didn't check; new surface area per recent commits. Worth a follow-up grep in a separate session if this surface has write paths.
- **`scripts/**`** — one-off migrations/seeds; not currently executed from routes.

---

## Uncertainty / second-opinion requests

The audit assumes RLS policies exist and are roughly "authenticated user of org X can write rows with org_id=X". If any of the named tables (`events`, `tours`, `tour_shows`, `venue_links`, `orgs`, `advance_emails`) have an unusually permissive or unusually strict DELETE/UPDATE policy shape, the risk tiers above could shift. Per CLAUDE.md rule 4, policies live only in the Supabase SQL Editor — this audit could not inspect them.

Specifically:
- If `tour_shows` has an UPDATE policy that also checks `org_members.role IN ('admin', 'tour_manager')`, the intake/confirm writes could silently fail for a crew user even though the outer `requireTourRouterAccess()` passed.
- If `events` has no UPDATE policy at all (`FOR UPDATE` not declared), then `supabaseServer()` writes from `authenticated` users get default-deny and EVERY `events.update()` above is silently no-op. Hopefully not — but cannot verify from repo.
- The `resend` webhook routes use service role so are immune to the above, but their zero-row-match risk remains.

One site I'd genuinely want a human second opinion on: `app/api/tourrouter/contacts/[contactId]/flag/route.ts:49` — the `currentCount + 1` read-modify-write on `shared_contacts.anonymous_flag_count`. Adding `.select().maybeSingle()` doesn't fix the underlying atomicity problem (two concurrent flags both read the same `currentCount` and both write `currentCount + 1`, losing a flag). A Postgres `UPDATE ... SET c = c + 1 RETURNING c` via `.rpc()` would be the real fix. Worth noting but explicitly out of scope for this audit.
