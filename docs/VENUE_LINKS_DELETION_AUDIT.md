# venue_links Deletion Audit

Forensic recon produced **2026-04-20** in response to the COMMISSARY / KILLING ME debug session on 2026-04-19, during which the `venue_links` row for token `fbef4c39dc8883330500cb48a167f8660dd3dec02e34e13265edc0a23bf841b0` disappeared between morning and afternoon. The goal of this audit is to enumerate every code path that can cause a `venue_links` row to vanish, so we can trust deletion semantics before opening beta.

**Read-only audit.** No code changed. No SQL run. Findings drawn from the repo at HEAD (commit `0d7c03e`).

---

## 1. Direct deletion call sites

Grep patterns used: `.delete().from("venue_links")`, `.from("venue_links").delete()`, single-quote variants, `DELETE FROM venue_links` (case-insensitive), and Supabase `.rpc(` calls.

### 1.1 Raw SQL / DELETE FROM statements

**Zero matches.** No raw SQL strings in the codebase that spell out a `DELETE FROM venue_links`.

### 1.2 Supabase RPC calls

**Zero matches touching `venue_links`.** The only `.rpc(` call in the repo is `lib/tourrouter/geocoding.ts:173` (`nearest_airport`), unrelated.

### 1.3 `.from("venue_links").delete()` — explicit deletion in app code

There are exactly **three explicit deletion sites**, all in browser-side React components using the user-scoped browser Supabase client (`lib/supabaseClient.ts`). All three chain `.delete().in("event_id", eventIds)` — i.e. they delete every `venue_links` row whose `event_id` is in a given set.

| # | File | Line | Enclosing function | Trigger |
|---|---|---|---|---|
| A | `app/dashboard/TourTile.tsx` | **81** | `handleDelete` (artist-delete branch) | User clicks Delete on an artist tile in `/dashboard` |
| B | `app/dashboard/TourTile.tsx` | **97** | `handleDelete` (tour-delete branch) | User clicks Delete on a tour tile in `/dashboard` |
| C | `app/dashboard/artists/[artistId]/ArtistDetailClient.tsx` | **51** | `handleDeleteTour` | User clicks Delete on a tour tile inside an artist's detail page |

All three have the same structure:

```ts
const { data: events } = await supabase.from("events").select("id").eq/.in("tour_id", ...);
const eventIds = (events ?? []).map(ev => ev.id);
if (eventIds.length > 0) {
  const { error: vlErr } = await supabase.from("venue_links").delete().in("event_id", eventIds);
  if (vlErr) throw vlErr;
}
// ...then delete events, then delete tours
```

#### Per-site details

**A — `TourTile.tsx:81` (artist delete)**
- Trigger: User action. Confirmed via `window.confirm("Delete this artist and all its tours? This cannot be undone.")` before any delete fires.
- Auth: *Implicit only.* No explicit `supabase.auth.getUser()` check in this handler. Relies on RLS — because it uses the **browser** client, Supabase attaches the user's session JWT automatically, and RLS on `venue_links` is expected to scope the delete to rows the user owns. No auth check in application code.
- Verification of the write: `if (vlErr) throw vlErr` — catches PostgREST errors but **does not** call `.select().maybeSingle()` to confirm a row actually came back. A silently-filtered RLS reject (the "200 with zero rows" pattern from CLAUDE.md rule 6) would pass through as success. Importantly though, this is a *delete*, not a write-we-want-to-confirm — a silent zero-row-affected here would be the *safe* outcome for our incident.

**B — `TourTile.tsx:97` (tour delete)**
- Same as A but scoped to a single tour (`.eq("tour_id", tourId)`). Same implicit auth model, same lack of `.select()` verification, same user-confirm prompt.

**C — `ArtistDetailClient.tsx:51` (tour delete from artist page)**
- Same pattern but inside an artist's detail page. Same user-confirm (`"Delete this tour and all its events? This cannot be undone."`), same implicit auth, same no-verify.
- Noticeably **loosest** of the three: the handler does not check any error on the `venue_links` delete (no `const { error: vlErr } =`, just `await supabase...delete()...`), and wraps the whole sequence in a try/catch that logs and toasts on failure. If the venue_links delete failed silently, the subsequent events delete would still run.

### 1.4 Summary of direct deletion sites

Every direct deletion is:
- **User-triggered** (click on a tile's "Delete" button), guarded by `window.confirm`.
- **Browser-side** (uses the session-scoped Supabase JS client). RLS is the only enforcement layer.
- **Chained to event IDs**, not by token and not by venue_links PK.
- **Not verified post-delete.** A zero-row-affected delete is indistinguishable from a successful one.

There are **no server-side, service-role, or RLS-bypassing** `.delete()` calls against `venue_links` anywhere in the repo.

---

## 2. Cascade deletion paths

### 2.1 Caveat — schema not in repo

`supabase/migrations/` contains only seven migrations and **none reference `venue_links`**. Per CLAUDE.md rule 4, migrations in this project are applied by hand in the Supabase SQL Editor and are not committed. The `CREATE TABLE venue_links (...)` statement and its FK constraints therefore **cannot be inspected from the repo**. The cascade behavior below is inferred from column names used in code (`event_id`, `org_id`) and from the delete-ordering of the three direct sites; it needs to be confirmed with a live query against `information_schema.table_constraints` / `information_schema.referential_constraints`.

### 2.2 Likely foreign keys (inferred)

- `venue_links.event_id` → `events.id`
- `venue_links.org_id` → `orgs.id`

No evidence of a direct `tours` FK on `venue_links`; tours are reached through `events.tour_id → tours.id`.

### 2.3 ON DELETE behavior — unknown from repo

Cannot be determined from the checked-in code. Two indirect signals:

- **The direct deletion sites always delete venue_links *before* deleting events.** This ordering suggests the authors believed they could not rely on `ON DELETE CASCADE` (otherwise the venue_links delete step would be redundant). That is *weak* evidence that the FK is **NOT** `ON DELETE CASCADE` — possibly `RESTRICT`, `NO ACTION`, or `SET NULL`.
- **`app/api/events/[eventId]/route.ts` (the single-event DELETE handler) does NOT delete venue_links first.** See 2.5 below. Its code issues `supabase.from("events").delete().eq("id", eventId)` and returns. If the FK were `RESTRICT`/`NO ACTION`, that delete would fail whenever the event has a venue_links row — and yet the route returns `ok:true` without any special handling. That is *weak* evidence that the FK IS `ON DELETE CASCADE` or `ON DELETE SET NULL`, or that the handler has simply never been exercised on an event with a venue_links child.

These two signals **conflict**. Resolving this requires the live `information_schema` query (explicitly out of scope for this audit but a high-priority follow-up).

### 2.4 Parent tables whose deletion might cascade into venue_links

| Parent | Direct deletion sites | Auth | Verify post-delete |
|---|---|---|---|
| `events` | `TourTile.tsx:84`, `TourTile.tsx:100`, `ArtistDetailClient.tsx:52`, `app/api/events/[eventId]/route.ts:10` | RLS-only in 4/4 | None |
| `tours` | `TourTile.tsx:86`, `TourTile.tsx:102`, `ArtistDetailClient.tsx:54` | RLS-only in 3/3 | None |
| `orgs` | None found in code | — | — |
| `artists` | `TourTile.tsx:91` (artist delete branch only) | RLS-only | None |

### 2.5 Details on `DELETE /api/events/[eventId]`

This is the **most interesting finding** for the incident hypothesis. Full source of `app/api/events/[eventId]/route.ts`:

```ts
export async function DELETE(req: NextRequest, { params }: { params: { eventId: string } }) {
  const { eventId } = params;
  const supabase = await supabaseServer();
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

- **No auth check.** Does not call `supabase.auth.getUser()`. Relies entirely on RLS for access control.
- **No org verification.** Does not check that the deleted event belongs to the caller's org.
- **No cascade guard.** Does not first delete child venue_links rows, so this handler's success behavior depends entirely on the FK's `ON DELETE` action.
- **Only caller in code:** `app/dashboard/tours/[tourId]/components/EventsTable.tsx:145` (`deleteEvent(id)`, triggered by a delete button in the events table; see also line 576 for a "long-venue" re-render path that issues a PATCH, not DELETE).

If the FK is `ON DELETE CASCADE`, **a single row deletion via the "Delete event" button in the events table of a tour is sufficient to silently delete that event's venue_links row.** No "are you sure?" dialog more forceful than the inline tile button, no post-delete confirmation, no trace.

This is the **most plausible mechanism** for the COMMISSARY row disappearance.

---

## 3. Regeneration / overwrite paths

Sometimes a row "disappears" because it was re-created with a new token. The token `fbef4c39…` could have been overwritten with a fresh one. Audit of every INSERT / UPDATE path on `venue_links`:

### 3.1 `/api/renders/save-urls` (POST) — upsert in place
- `app/api/renders/save-urls/route.ts:14-37`.
- SELECT existing where `event_id=? AND is_active=true`.
- **If found:** `UPDATE` columns. **Does not re-issue a token.** Token is preserved.
- **If not found:** `INSERT` with a *new* token from `generatePublicToken()`.
- **No DELETE.** No delete-then-insert.
- Safe w.r.t. token preservation. Safe w.r.t. row identity.

### 3.2 `/api/renders/generate` (POST) — upsert in place
- `app/api/renders/generate/route.ts:468-487`.
- Same pattern as 3.1: SELECT → UPDATE-if-exists, else INSERT-new-token.
- **No DELETE.** No delete-then-insert.
- Token preserved on re-generate. This means "Re-Generate All" does NOT touch the token — the same token survives.

### 3.3 `/api/renders/approve` (POST) — upsert in place
- `app/api/renders/approve/route.ts:55-74`.
- Same SELECT → INSERT-if-missing pattern, no UPDATE-existing branch for render URLs, and **never** a DELETE.
- Token preserved if already present.

### 3.4 `/api/venue-link` (POST) — get-or-create
- `app/api/venue-link/route.ts:9-23`.
- SELECT existing → return, else INSERT new. Never deletes.
- (Known backlog item: no auth check — see BACKLOG.md "/api/venue-link — missing auth check". Does not enable deletion but does enable unauthorized token creation.)

### 3.5 `createVenueLink` server action
- `app/dashboard/tours/[tourId]/events/actions.ts:51-77`.
- Same get-or-create shape. No DELETE.

### 3.6 EventsTable client — Re-Generate All / Send flow
- `app/dashboard/tours/[tourId]/components/EventsTable.tsx` calls into `/api/renders/save-urls`, `/api/renders/approve`, `/api/renders/generate`. All three paths are the upsert-in-place upserts analyzed above. None of these client flows issue a venue_links delete.
- The `reRenderEvent` handler (around line 417) POSTs to `/api/renders/generate` — same UPDATE-in-place behavior.

### 3.7 INSERT conflict behavior
- Every `.insert({...})` call in the codebase is a **plain insert**. None use `onConflict:` / `.upsert()` / `ON CONFLICT DO UPDATE` / `ON CONFLICT DO NOTHING`. The code manually does the SELECT-then-UPDATE-or-INSERT dance.
- This means there is **no ON CONFLICT path** that could silently delete or replace a row.

### 3.8 Verdict on regeneration paths

**No regeneration / overwrite / Re-Generate-All path deletes the venue_links row.** All writes are either `UPDATE` in place (preserving the token) or `INSERT` a new row when none matches on `(event_id, is_active=true)`.

Corollary: the COMMISSARY token was not "replaced" with a new one by a normal-flow action. Either the row was deleted (sections 1–2) or something happened outside application code (section 4, or manual SQL).

---

## 4. Scheduled / background deletion

### 4.1 Vercel crons
- `vercel.json` declares exactly one cron: `/api/tourrouter/advance/cron` @ `0 10 * * *`.
- Grepped that route for `venue_links` — **no match**. It works on advance emails, not venue_links.
- **No other crons.**

### 4.2 Supabase Edge Functions
- `supabase/` contains only a `migrations/` directory. No `functions/` directory. **No edge functions** in this project.

### 4.3 Background tasks inside request handlers
- `/api/renders/generate` fires a fire-and-forget CDN-warm loop (`route.ts:498-511`) that only issues `SELECT … maybeSingle()` + `fetch(...)`. No writes, no deletes.
- No `setTimeout`/`setInterval`-style background deletion logic anywhere.

### 4.4 TTL / expiration columns
Columns referenced on `venue_links` in the codebase: `id`, `org_id`, `event_id`, `token`, `is_active`, `created_at`, `render_square_url`, `render_story_url`, `render_landscape_url`, `render_poster_url`, `render_tiktok_url`, `render_yt_shorts_url`.

- **No `expires_at` column.**
- **No `revoked_at` column.** (Those live on `marketing_tokens`, not `venue_links` — confirmed by `app/v/m/[token]/page.tsx:19`.)
- **No `deleted_at` column.** (No soft-delete pattern.)
- `is_active` is the only boolean flag; no observed code flips it from `true` to `false`, and no cleanup consumes `is_active=false` rows.

**No scheduled or TTL-driven deletion mechanism exists.**

---

## 5. RLS policy review

**Cannot be done from repo.** The RLS policies on `venue_links` are not present in `supabase/migrations/` and no `*.sql` policy dump exists anywhere in the working tree. The `docs/BACKLOG.md` entry "/api/venue-link — missing auth check" (lines 248–261) explicitly notes that the RLS policies on `venue_links` have **not yet been audited**.

What we *can* say from the code:

- The three direct deletion sites (§1) use the **browser** client with the user's JWT. Whatever RLS permits for authenticated org members determines whether they can fire. If the policy is a common "org member can write their org's rows" shape, tour-delete and event-delete should succeed for any org member.
- `/api/events/[eventId]` DELETE (§2.5) uses `supabaseServer()` (user-scoped, JWT-forwarded). Same RLS gate applies.
- **None** of the deletion sites use the service-role admin client (`lib/supabaseAdmin.ts`). There is no RLS-bypass deletion path in the application code.

**This leaves one open question that must be answered outside this audit:** are there any DELETE policies on `venue_links` that permit `anon` or `public`? If yes, the backlog-noted missing-auth on `/api/venue-link` becomes a *read/write* problem rather than a write-only problem. We don't know. It should be verified before beta.

**Action for beta readiness:** run `pg_policies` / `pg_catalog` queries against the live DB and dump the current venue_links DELETE policies into the audit followup.

---

## 6. Summary & risk assessment

**How many code paths can delete a venue_links row?**
- Three direct `.delete()` call sites, all user-triggered in the dashboard: TourTile artist-delete, TourTile tour-delete, ArtistDetailClient tour-delete.
- One potential cascade source: `DELETE /api/events/[eventId]` (called from the events-table "delete event" button). Whether this *actually* cascades depends on the FK's `ON DELETE` action, which is not visible in the repo.
- Zero scheduled/background/RPC/raw-SQL deletion paths.
- Zero regeneration paths that delete-and-recreate.

**User-triggered vs automated:** **All four** real deletion paths are user-triggered via a dashboard click. There is no automation, cron, or TTL that deletes venue_links rows.

**Auth posture:**
- The three `handleDelete` sites rely on RLS via the browser JWT — implicit auth, no app-level checks, guarded only by a `window.confirm`.
- `/api/events/[eventId]` DELETE also relies only on RLS — **no app-level auth check, no org check, no confirmation**. A caller who can forge or pass a session (or whose session permits DELETE on events under a permissive RLS policy) can delete any event by ID, and if the FK cascades, can delete the child venue_links silently.

**Top hypothesis for the COMMISSARY `fbef4c39…` row disappearance:**
The most likely mechanism is a user-triggered delete, almost certainly by Drew during the same-day debug session on the KILLING ME tour:

1. **Highest-probability hypothesis:** Drew clicked "Delete" on an event row in the tour's events table (EventsTable.tsx:145 → `/api/events/[eventId]` DELETE), and the `events → venue_links` FK is configured `ON DELETE CASCADE`. No venue_links.delete() appeared in application code because the delete happened implicitly at the database level. The session log at `docs/SESSION_LOG.md:1958` explicitly notes "KILLING ME tour (THE COMMISSARY original evidence tour was deleted from `venue_links` mid-session — unknown which code path)" — consistent with an inadvertent events-level delete during debug.
2. **Second-most-likely hypothesis:** Drew clicked "Delete" on the tour tile in `/dashboard` or in the artist detail page, triggering one of the three explicit venue_links deletes followed by events+tours deletes. This wipes more than one row though, so inconsistent with the "just one token disappeared" framing.
3. **Third-most-likely hypothesis:** Manual SQL in the Supabase SQL Editor during debug (not in repo, not auditable here). Cannot rule out given CLAUDE.md rule 4 — SQL is commonly run by hand.

**Paths that look risky for beta:**

1. **`DELETE /api/events/[eventId]` has no auth check and no org check.** This is the single highest-risk finding. A forged or replayed session — or any authenticated user in a shared-org setting — can delete any event by UUID. If the FK cascades to venue_links, it also silently destroys tokenized share links without any audit trail. Add `requireLocalizerAccess()` or equivalent before beta.
2. **The three `handleDelete` client flows do not `.select().maybeSingle()` after delete.** Per CLAUDE.md rule 6, a silent zero-row-affected is indistinguishable from success. For a delete this is safer than for a write, but it still means users see "Deleted" when in fact RLS may have blocked the venue_links half and left orphans. At minimum, log the row count.
3. **The `events → venue_links` FK's `ON DELETE` action is not auditable from the repo and is not documented.** Before beta, dump the constraint definitions and decide intentionally (favor `ON DELETE CASCADE` + explicit auth checks upstream, *or* `ON DELETE RESTRICT` + application cleanup — but **not** "unclear which").
4. **The known backlog item "/api/venue-link — missing auth check"** (BACKLOG.md:248) does not permit deletion, but it does permit unauthorized *creation* of venue_links rows under any orgId. Worth closing in the same pre-beta hygiene pass that addresses finding #1.
5. **No RLS policy dump in the repo.** Impossible to tell from the codebase whether anonymous DELETE on `venue_links` is permitted. Must be verified live before beta.

---

## Appendix — complete grep inventory

Patterns run (case-sensitive and insensitive where noted):

```
.delete().from("venue_links")                          → 0 hits
.from("venue_links").delete()                          → 3 hits (see §1.3)
.from('venue_links').delete()  (single quotes)         → 0 hits
DELETE FROM venue_links  (ci)                          → 0 hits
delete from venue_links  (ci)                          → 0 hits
rpc(… venue_links …)                                   → 0 hits

Parent table deletions:
.from("events").delete()                               → 4 hits (TourTile x2, ArtistDetailClient, /api/events/[eventId])
.from("tours").delete()                                → 3 hits (TourTile x2, ArtistDetailClient)
.from("orgs").delete()                                 → 0 hits
.from("artists").delete()                              → 1 hit (TourTile artist-branch)

Schedulers:
vercel.json crons                                      → 1 (advance, unrelated)
supabase/functions/                                    → directory does not exist

venue_links columns referenced in code:
id, org_id, event_id, token, is_active, created_at,
render_square_url, render_story_url, render_landscape_url,
render_poster_url, render_tiktok_url, render_yt_shorts_url
→ no expires_at, revoked_at, or deleted_at column
```
