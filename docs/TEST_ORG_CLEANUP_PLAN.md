# Test Org Cleanup Plan

**Created:** June 11, 2026
**Targets:** 6 test orgs owned by `hwy61ai+test*@gmail.com` accounts.
**Execution window:** Week 4 QA prep.
**Retention option:** consider retaining `hwy61ai+test2026@gmail.com`'s org as the designated non-admin QA org and deleting only the other 5. Decide at execution time.

This plan was produced from code-only recon on June 11, 2026. The authoritative schema lives in production Postgres; the partial migration files in `supabase/migrations/` are NOT a complete picture. Step 0 must be run before any destructive SQL.

---

## Summary findings

### A. Tables with `org_id` directly (deletion targets)

Inferred from code references and (where available) migration SQL:

| Table | Source of evidence | FK behavior |
|---|---|---|
| `org_members` | `lib/auth/ensureOrgExists.ts:59-61` | unknown |
| `tours_routing` (TourRouter) | `app/api/tourrouter/tours/route.ts:14-16` | unknown |
| `tours` (Localizer marketing) | `app/dashboard/tours/[tourId]/page.tsx:27` | unknown |
| `artists` | `app/api/tourrouter/artists/route.ts:11-14` | unknown |
| `advance_emails` | `supabase/migrations/20260326_create_advance_emails.sql:3` | **`REFERENCES orgs(id)` with NO `ON DELETE` clause → default `NO ACTION` (RESTRICT). Will block `DELETE FROM orgs` if any row exists.** |
| `trial_nudge_emails` | `app/api/billing/trial-nudge/cron/route.ts` | unknown |
| `notifications` | `lib/notifications.ts:49` | unknown |
| `custom_fonts` | `app/api/fonts/upload/route.ts:115` | unknown |
| `marketing_tokens` | `app/api/marketing-tokens/create/route.ts:52` | unknown |
| `beta_invites` | `app/api/beta/claim/route.ts:16,28` | unknown |
| `field_aliases` | `lib/tourrouter/aliasLibrary.ts` | unknown |
| `shared_venues`, `shared_contacts`, `account_contacts` | CLAUDE.md only — no app code hits | unknown |

### B. Indirect children (via `tour_id` / `event_id` / `show_id` chains)

| Child | Parent | Existing app deletion path |
|---|---|---|
| `tour_shows` | `tours_routing` | `app/dashboard/TourTile.tsx:51-61` |
| `guest_list` | `tour_shows.show_id` | `TourTile.tsx:54` |
| `tour_expenses` | `tours_routing.tour_id` | `TourTile.tsx:63` |
| `intake_documents` | `tours_routing.tour_id` | `TourTile.tsx:66` |
| `finance_report_links` | `tours_routing.tour_id` | `TourTile.tsx:69` |
| `events` | `tours.tour_id` (Localizer) | `TourTile.tsx:80` |
| `venue_links` | `events.event_id` | `docs/VENUE_LINKS_DELETION_AUDIT.md:34-37` |

### C. Storage / Cloudinary orphans

None of the tour / artist / venue_links rows trigger storage deletion when the row goes. If the orgs are deleted without first capturing asset IDs, the Cloudinary uploads and Supabase Storage files become unreachable but billable.

| Table | Storage columns | Cleans up on row delete? |
|---|---|---|
| `tours` | `image_square_id`, `image_story_id`, `image_landscape_id`, `image_print_id`, `video_tiktok_id`, `video_yt_shorts_id`, `sponsor_logo_1_url`, `sponsor_logo_2_url` | **No** — Cloudinary orphans |
| `artists` | `image_url`, `logo_url`, `adv_stage_plot_url`, `adv_hospitality_url`, `adv_foh_url`, `adv_w9_url`, `adv_custom_materials` | **No** — Storage / URL orphans |
| `venue_links` | `render_*_url` (square / story / landscape / poster / tiktok / yt_shorts) | **No** — Cloudinary URL orphans |
| `custom_fonts` | `storage_url`, `cloudinary_public_id` | **Yes** — `app/api/fonts/delete/route.ts:44-52` deletes both |
| `intake_documents` | Supabase Storage `/tour-documents/` | Unknown — deletion code not found |

### D. `auth.users` coupling

- `ensureOrgExists` (`lib/auth/ensureOrgExists.ts`) creates the org + `org_members` row on first login; uses `supabaseAdmin()` so it's idempotent and RLS-bypassing.
- Crons resolve `org_members.user_id → auth.users` via `supabase.auth.admin.getUserById()` — `app/api/billing/trial-nudge/cron/route.ts:38` and `app/api/tourrouter/advance/cron/route.ts:285`. **If the auth user is deleted but `org_members` still references it, `getUserById` returns null and the digest email silently fails to send.** Not a deletion blocker, but a cleanup-correctness issue.
- No `auth.admin.deleteUser` calls anywhere in the codebase. Deleting an org does NOT delete the auth user. Delete `auth.users` rows separately via the Supabase dashboard (or `auth.admin.deleteUser`) for user-side cleanup.
- RLS policies use `auth.uid() IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())` (CLAUDE.md:77). Deleting the org row first means the user's RLS lookups return zero rows for that org — they're effectively locked out even if their `auth.users` row survives. Safe.

### E. Notable gotchas

1. **`advance_emails` will RESTRICT the org deletion** if any row exists. Must be deleted first regardless of what `information_schema` shows for other tables.
2. **Two `tours` tables exist** — `tours_routing` (TourRouter) and `tours` (Localizer). Both have `org_id`. CLAUDE.md flagged this; don't conflate them.
3. **Migration files are NOT authoritative** — only 7 partial files in `supabase/migrations/`. CLAUDE.md rule 5 explicitly says "never assume schema state; verify with `information_schema`."
4. **`shared_venues`, `shared_contacts`, `account_contacts`** — referenced in CLAUDE.md but zero app-code hits. They likely exist with `org_id` columns (per CLAUDE.md they're "critical tables") but their cascade behavior is invisible from here.

---

## Step 0 — Run this verification query FIRST (read-only)

This is the authoritative source for what's actually in production. Run it and refine the deletion SQL against the real schema before running anything destructive.

```sql
-- All tables with an org_id column
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND column_name = 'org_id'
ORDER BY table_name;

-- All FK constraints pointing at orgs.id, with cascade behavior
SELECT
  tc.table_name AS child_table,
  kcu.column_name AS child_column,
  tc.constraint_name,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name AND tc.constraint_schema = kcu.constraint_schema
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name AND tc.constraint_schema = rc.constraint_schema
JOIN information_schema.constraint_column_usage ccu
  ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'orgs'
  AND ccu.column_name = 'id'
ORDER BY child_table;

-- All FK constraints inside the public schema (so we can see the tour / event / show chains too)
SELECT
  tc.table_name AS child_table,
  kcu.column_name AS child_column,
  ccu.table_name AS parent_table,
  ccu.column_name AS parent_column,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.referential_constraints rc
  ON tc.constraint_name = rc.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.constraint_schema = 'public'
ORDER BY parent_table, child_table;
```

---

## Step 1 — Pre-flight row-count audit (read-only)

Per-table impact count. Replace the placeholder UUIDs with the real 6 (or 5, if retaining `hwy61ai+test2026`). If any of the optional tables don't exist in the schema, the query errors on that line — strike the missing ones based on Step 0 results.

```sql
WITH target_orgs AS (
  SELECT id::uuid FROM (VALUES
    ('00000000-0000-0000-0000-000000000001'::uuid),
    ('00000000-0000-0000-0000-000000000002'::uuid),
    ('00000000-0000-0000-0000-000000000003'::uuid),
    ('00000000-0000-0000-0000-000000000004'::uuid),
    ('00000000-0000-0000-0000-000000000005'::uuid),
    ('00000000-0000-0000-0000-000000000006'::uuid)
  ) AS t(id)
)
SELECT 'orgs'              AS table_name, count(*) FROM orgs               WHERE id     IN (SELECT id FROM target_orgs)
UNION ALL SELECT 'org_members',          count(*) FROM org_members         WHERE org_id IN (SELECT id FROM target_orgs)
UNION ALL SELECT 'tours_routing',        count(*) FROM tours_routing       WHERE org_id IN (SELECT id FROM target_orgs)
UNION ALL SELECT 'tour_shows',           count(*) FROM tour_shows          WHERE tour_id IN (SELECT id FROM tours_routing WHERE org_id IN (SELECT id FROM target_orgs))
UNION ALL SELECT 'guest_list',           count(*) FROM guest_list          WHERE show_id IN (SELECT id FROM tour_shows WHERE tour_id IN (SELECT id FROM tours_routing WHERE org_id IN (SELECT id FROM target_orgs)))
UNION ALL SELECT 'tour_expenses',        count(*) FROM tour_expenses       WHERE tour_id IN (SELECT id FROM tours_routing WHERE org_id IN (SELECT id FROM target_orgs))
UNION ALL SELECT 'intake_documents',     count(*) FROM intake_documents    WHERE tour_id IN (SELECT id FROM tours_routing WHERE org_id IN (SELECT id FROM target_orgs))
UNION ALL SELECT 'finance_report_links', count(*) FROM finance_report_links WHERE tour_id IN (SELECT id FROM tours_routing WHERE org_id IN (SELECT id FROM target_orgs))
UNION ALL SELECT 'tours',                count(*) FROM tours               WHERE org_id IN (SELECT id FROM target_orgs)
UNION ALL SELECT 'events',               count(*) FROM events              WHERE tour_id IN (SELECT id FROM tours WHERE org_id IN (SELECT id FROM target_orgs))
UNION ALL SELECT 'venue_links',          count(*) FROM venue_links         WHERE event_id IN (SELECT id FROM events WHERE tour_id IN (SELECT id FROM tours WHERE org_id IN (SELECT id FROM target_orgs)))
UNION ALL SELECT 'artists',              count(*) FROM artists             WHERE org_id IN (SELECT id FROM target_orgs)
UNION ALL SELECT 'advance_emails',       count(*) FROM advance_emails      WHERE org_id IN (SELECT id FROM target_orgs)
UNION ALL SELECT 'trial_nudge_emails',   count(*) FROM trial_nudge_emails  WHERE org_id IN (SELECT id FROM target_orgs)
UNION ALL SELECT 'notifications',        count(*) FROM notifications       WHERE org_id IN (SELECT id FROM target_orgs)
UNION ALL SELECT 'custom_fonts',         count(*) FROM custom_fonts        WHERE org_id IN (SELECT id FROM target_orgs)
UNION ALL SELECT 'marketing_tokens',     count(*) FROM marketing_tokens    WHERE org_id IN (SELECT id FROM target_orgs)
UNION ALL SELECT 'beta_invites',         count(*) FROM beta_invites        WHERE org_id IN (SELECT id FROM target_orgs)
UNION ALL SELECT 'field_aliases',        count(*) FROM field_aliases       WHERE org_id IN (SELECT id FROM target_orgs)
UNION ALL SELECT 'shared_venues',        count(*) FROM shared_venues       WHERE org_id IN (SELECT id FROM target_orgs)
UNION ALL SELECT 'shared_contacts',      count(*) FROM shared_contacts     WHERE org_id IN (SELECT id FROM target_orgs)
UNION ALL SELECT 'account_contacts',     count(*) FROM account_contacts    WHERE org_id IN (SELECT id FROM target_orgs)
ORDER BY table_name;
```

---

## Step 2 — Capture Cloudinary + storage IDs BEFORE deletion (read-only)

Save the output (CSV from the SQL Editor) for manual Cloudinary / Supabase Storage cleanup post-delete. Nothing in app code does this cleanup automatically.

```sql
WITH target_orgs AS (
  SELECT id::uuid FROM (VALUES
    ('00000000-0000-0000-0000-000000000001'::uuid)
    -- (paste the other 5 here)
  ) AS t(id)
)
SELECT 'tour_cloudinary' AS asset_kind, t.id AS row_id,
       t.image_square_id, t.image_story_id, t.image_landscape_id, t.image_print_id,
       t.video_tiktok_id, t.video_yt_shorts_id,
       t.sponsor_logo_1_url, t.sponsor_logo_2_url
FROM tours t WHERE t.org_id IN (SELECT id FROM target_orgs)
UNION ALL
SELECT 'artist_storage', a.id, a.image_url, a.logo_url,
       a.adv_stage_plot_url, a.adv_hospitality_url, a.adv_foh_url, a.adv_w9_url,
       NULL, NULL, a.adv_custom_materials::text
FROM artists a WHERE a.org_id IN (SELECT id FROM target_orgs)
UNION ALL
SELECT 'venue_link_cloudinary', vl.id,
       vl.render_square_url, vl.render_story_url, vl.render_landscape_url,
       vl.render_poster_url, vl.render_tiktok_url, vl.render_yt_shorts_url,
       NULL, NULL
FROM venue_links vl WHERE vl.event_id IN (
  SELECT e.id FROM events e WHERE e.tour_id IN (
    SELECT id FROM tours WHERE org_id IN (SELECT id FROM target_orgs)
  )
);
```

Column counts may need adjusting once the actual `tours.video_*` / `tours.sponsor_*` columns are confirmed. Per the venue page code at `app/v/e/[token]/page.tsx:12` they exist but the inventory may have grown.

---

## Step 3 — Draft deletion SQL (DO NOT RUN until Steps 0–2 are reviewed)

Wrapped in a transaction so any FK violation aborts the whole thing cleanly. The final `COMMIT` / `ROLLBACK` is left commented — type one of them consciously at the end.

```sql
BEGIN;

CREATE TEMP TABLE _target_orgs (id uuid PRIMARY KEY);
INSERT INTO _target_orgs(id) VALUES
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000004'),
  ('00000000-0000-0000-0000-000000000005'),
  ('00000000-0000-0000-0000-000000000006');

-- Convenience temp tables for the cascade chains
CREATE TEMP TABLE _target_routing_tours AS
  SELECT id FROM tours_routing WHERE org_id IN (SELECT id FROM _target_orgs);

CREATE TEMP TABLE _target_localizer_tours AS
  SELECT id FROM tours WHERE org_id IN (SELECT id FROM _target_orgs);

CREATE TEMP TABLE _target_tour_shows AS
  SELECT id FROM tour_shows WHERE tour_id IN (SELECT id FROM _target_routing_tours);

CREATE TEMP TABLE _target_events AS
  SELECT id FROM events WHERE tour_id IN (SELECT id FROM _target_localizer_tours);

-- ── Layer 1: leaves (children of children) ──
DELETE FROM guest_list           WHERE show_id  IN (SELECT id FROM _target_tour_shows);
DELETE FROM venue_links          WHERE event_id IN (SELECT id FROM _target_events);

-- ── Layer 2: direct children of tours_routing / tours ──
DELETE FROM tour_shows           WHERE tour_id  IN (SELECT id FROM _target_routing_tours);
DELETE FROM tour_expenses        WHERE tour_id  IN (SELECT id FROM _target_routing_tours);
DELETE FROM intake_documents     WHERE tour_id  IN (SELECT id FROM _target_routing_tours);
DELETE FROM finance_report_links WHERE tour_id  IN (SELECT id FROM _target_routing_tours);
DELETE FROM events               WHERE tour_id  IN (SELECT id FROM _target_localizer_tours);

-- ── Layer 3: parent tours tables ──
DELETE FROM tours_routing        WHERE id IN (SELECT id FROM _target_routing_tours);
DELETE FROM tours                WHERE id IN (SELECT id FROM _target_localizer_tours);

-- ── Layer 4: other tables with org_id ── (advance_emails MUST be deleted before orgs)
DELETE FROM advance_emails       WHERE org_id IN (SELECT id FROM _target_orgs);
DELETE FROM trial_nudge_emails   WHERE org_id IN (SELECT id FROM _target_orgs);
DELETE FROM notifications        WHERE org_id IN (SELECT id FROM _target_orgs);
DELETE FROM custom_fonts         WHERE org_id IN (SELECT id FROM _target_orgs);
DELETE FROM marketing_tokens     WHERE org_id IN (SELECT id FROM _target_orgs);
DELETE FROM beta_invites         WHERE org_id IN (SELECT id FROM _target_orgs);
DELETE FROM field_aliases        WHERE org_id IN (SELECT id FROM _target_orgs);
DELETE FROM artists              WHERE org_id IN (SELECT id FROM _target_orgs);

-- These three only if they exist in your schema (per Step 0 verification):
DELETE FROM shared_venues        WHERE org_id IN (SELECT id FROM _target_orgs);
DELETE FROM shared_contacts      WHERE org_id IN (SELECT id FROM _target_orgs);
DELETE FROM account_contacts     WHERE org_id IN (SELECT id FROM _target_orgs);

-- ── Layer 5: junction ──
DELETE FROM org_members          WHERE org_id IN (SELECT id FROM _target_orgs);

-- ── Layer 6: root ──
DELETE FROM orgs                 WHERE id     IN (SELECT id FROM _target_orgs);

-- ★ VERIFY before committing ★
-- Run the Step 1 audit query again inside the same transaction; every count should be 0.
-- If anything looks wrong, ROLLBACK instead of COMMIT.

-- COMMIT;       -- uncomment to commit
-- ROLLBACK;     -- run this if anything looks wrong
```

**Notes:**

- After the `DELETE`s run, re-run the Step 1 audit query (still inside the transaction) — every count should be 0. If anything's non-zero, `ROLLBACK`.
- If any of the optional tables (`shared_venues` / `shared_contacts` / `account_contacts` / `finance_report_links`) don't exist, that `DELETE` will error and roll the whole transaction. Use Step 0 results to strike the lines before running.
- If Step 0 reveals some FKs already have `ON DELETE CASCADE`, the corresponding `DELETE` lines become no-ops — still safe to leave in for explicitness.

---

## Step 4 — Post-deletion checklist (manual)

1. **Cloudinary cleanup.** Use the captured CSV from Step 2 to bulk-delete the `image_*_id` / `video_*_id` public IDs in Cloudinary, plus the `render_*_url` URL paths (they're hosted on the same Cloudinary account — the URL ends with a public_id you can extract).
2. **Supabase Storage cleanup.** Same CSV for `image_url` / `logo_url` / `adv_*_url` on artists, plus `intake_documents` storage paths if any were found.
3. **`auth.users` cleanup (optional).** For each deleted org's `owner_email`, find the matching `auth.users` row and delete it via the Supabase dashboard or `supabase.auth.admin.deleteUser(userId)`. Not strictly required — the user is already locked out via the deleted `org_members` row — but cleaner. Skip for the retained QA org (`hwy61ai+test2026`).
4. **Confirm crons don't barf.** Next morning's trial-nudge cron at 13:00 UTC: check Vercel Functions logs that it ran cleanly with no `getUserById returned null` warnings.

---

## Open questions / decisions to make at execution

- **Confirm the 6 org UUIDs.** Query `SELECT id, owner_email, created_at FROM orgs WHERE owner_email LIKE 'hwy61ai+test%@gmail.com' ORDER BY created_at;` before running Steps 1–3.
- **Retain `hwy61ai+test2026@gmail.com` as the QA org?** If yes, drop its UUID from the lists in Steps 1, 2, and 3 — delete only 5.
- **Run Step 0 first.** Use its output to (a) strike `DELETE` lines for tables that don't exist and (b) annotate which FKs already cascade so the plan reads accurately.
- **Decide who runs it.** This file is meant for Drew. The Supabase SQL Editor session must be the production project, not a staging clone.
