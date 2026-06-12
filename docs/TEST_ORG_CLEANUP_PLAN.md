# Test Org Cleanup Plan

**Created:** June 11, 2026
**MIGRATION APPLIED June 12, 2026** — all 12 statements run in production, verified via `information_schema` (7 org FKs → CASCADE, 2 `shared_*` → SET NULL, `localizer_tour_id` → SET NULL, `finance_report_links.created_by` → SET NULL, `marketing_tokens` FK added). The destructive deletion step now collapses to a single `DELETE FROM orgs WHERE id IN (...)`.
**deleteOrg ROUTINE SHIPPED June 12, 2026** — `lib/admin/deleteOrg.ts` + `POST /api/admin/delete-org` + `deleted_orgs_audit` table live. Proven on `testicles` and `testx` end-to-end (dryRun manifest review → real run → Cloudinary asset deletion verified out-of-band). Replaces the manual SQL-Editor Phase 2 protocol below for all future test-org and customer-account deletions.
**Targets:** 6 test orgs owned by `hwy61ai+test*@gmail.com` accounts.
**Execution window:** Week 4 QA prep.
**Retention option:** consider retaining `hwy61ai+test2026@gmail.com`'s org as the designated non-admin QA org and deleting only the other 5. Decide at execution time.

This plan was produced from code-only recon on June 11, 2026, then refined June 12 against `information_schema` output from production Postgres.

---

## Summary findings (refreshed June 12 against real schema)

### A. Tables with `org_id` (or equivalent) — real FK behavior

23 tables hold `org_id` or an org-ref variant (`created_by_org`). Pre-migration FK delete behavior, with the Phase 1 action:

| Table | FK to orgs | Delete rule (pre-migration) | Phase 1 action |
|---|---|---|---|
| account_contacts | yes (`org_id`) | NO ACTION | → **CASCADE** |
| advance_emails | yes (`org_id`) | NO ACTION | → **CASCADE** |
| artists | yes (`org_id`) | CASCADE | none |
| custom_fonts | yes (`org_id`) | CASCADE | none |
| event_assets | yes (`org_id`) | CASCADE | none |
| events | yes (`org_id`) | CASCADE | none |
| field_aliases | yes (`org_id`) | NO ACTION | → **CASCADE** |
| imports | yes (`org_id`) | CASCADE | none |
| intake_documents | yes (`org_id`) | NO ACTION | → **CASCADE** |
| jobs | yes (`org_id`) | CASCADE | none |
| marketing_tokens | **no FK** (column only) | n/a | → **ADD CASCADE FK** (belt-and-suspenders; `tour_id` is nullable, so the `tour_id → tours` CASCADE alone doesn't guarantee cleanup) |
| notifications | yes (`org_id`) | CASCADE | none |
| org_members | yes (`org_id`) | CASCADE | none |
| shared_contacts | yes (`created_by_org`) | NO ACTION | → **SET NULL** (preserve shared library on org delete) |
| shared_venues | yes (`created_by_org`) | NO ACTION | → **SET NULL** (preserve shared library on org delete) |
| template_layouts | yes (`org_id`) | CASCADE | none |
| templates | yes (`org_id`) | CASCADE | none |
| tour_expenses | yes (`org_id`) | NO ACTION | → **CASCADE** |
| tour_shows | yes (`org_id`) | NO ACTION | → **CASCADE** |
| tour_shows_crew | **no FK** (column only) | n/a | → **ADD CASCADE FK** |
| tours | yes (`org_id`) | CASCADE | none |
| tours_routing | yes (`org_id`) | NO ACTION | → **CASCADE** |
| trial_nudge_emails | yes (`org_id`) | CASCADE | none |
| usage_monthly | yes (`org_id`) | CASCADE | none |
| venue_links | yes (`org_id`) | CASCADE | none |

**Corrections to the June 11 draft:** `beta_invites` does NOT have an `org_id` column (Q1 confirms); the June 11 plan listed it in error and is dropped. The 8 tables newly surfaced by Q1 (`event_assets`, `imports`, `jobs`, `marketing_tokens`, `template_layouts`, `templates`, `tour_shows_crew`, `usage_monthly`) are added to the inventory above.

### B. Indirect children — no application-layer deletion code needed after Phase 1

All chains below already CASCADE or are covered by the Phase 1 migration. After migration, a single `DELETE FROM orgs WHERE id IN (...)` walks the whole tree:

- org → tours_routing → tour_shows → guest_list (all CASCADE)
- org → tours_routing → tour_expenses (CASCADE via both `tour_id` and the new `org_id` CASCADE)
- org → tours_routing → intake_documents (CASCADE via new `org_id`; the `tour_id NO ACTION` is satisfied at end-of-statement because rows are already gone)
- org → tours → events → venue_links + event_assets (all CASCADE)
- org → org_members → finance_report_links: `created_by → org_members` is **NO ACTION** pre-migration. Phase 1 converts to SET NULL (preserve audit trail). Without this, org_members CASCADE would block on org delete when any finance_report_links row references a deleted member.

### C. Storage / Cloudinary orphans (unchanged from June 11)

The DB cascade handles row deletion, but Cloudinary uploads and Supabase Storage objects are NOT touched by FK cascades. Phase 2 Step 2 below captures the asset IDs before delete so they can be cleaned up out-of-band. The planned `deleteOrg()` admin function (see sketch at the bottom) will automate this in app code.

| Table | Storage columns | Cleans up on row delete? |
|---|---|---|
| `tours` | `image_square_id`, `image_story_id`, `image_landscape_id`, `image_print_id`, `video_tiktok_id`, `video_yt_shorts_id`, `sponsor_logo_1_url`, `sponsor_logo_2_url` | **No** — Cloudinary orphans |
| `artists` | `image_url`, `logo_url`, `adv_stage_plot_url`, `adv_hospitality_url`, `adv_foh_url`, `adv_w9_url`, `adv_custom_materials` | **No** — Storage / URL orphans |
| `venue_links` | `render_*_url` (square / story / landscape / poster / tiktok / yt_shorts) | **No** — Cloudinary URL orphans |
| `custom_fonts` | `storage_url`, `cloudinary_public_id` | **Yes** — `app/api/fonts/delete/route.ts:44-52` deletes both |
| `intake_documents` | Supabase Storage `/tour-documents/` | Unknown — deletion code not found |

### D. `auth.users` coupling (unchanged from June 11)

- `ensureOrgExists` creates org + org_members row on first login via `supabaseAdmin()` (idempotent, RLS-bypassing).
- Crons resolve `org_members.user_id → auth.users` via `supabase.auth.admin.getUserById()`. If org_members survives but auth.users is gone, `getUserById` returns null and digest sends fail silently.
- No `auth.admin.deleteUser` calls anywhere in the codebase. Org delete does NOT delete the auth user unless the `deleteOrg()` routine (sketch below) is invoked.
- RLS via `auth.uid() IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())` — once org_members row is gone, the user is RLS-locked-out even if auth.users survives.

### E. Notable gotchas (refreshed June 12)

1. **`finance_report_links.created_by` was the hidden blocker.** Q3 surfaced a `created_by → org_members` FK with NO ACTION; the June 11 draft missed it. Without the Phase 1 SET NULL conversion, `DELETE FROM orgs` would have failed when `org_members CASCADE` tried to remove a member referenced by a finance_report_link.
2. **Two tables had `org_id` columns with NO FK at all** — `tour_shows_crew` and `marketing_tokens`. Phase 1 adds CASCADE FKs to both. Pre-migration, `tour_shows_crew` rows would have been silent orphans on org delete; `marketing_tokens` rows are usually cleaned via `tour_id → tours CASCADE`, but `tour_id` is nullable so a null-tour token would have been a stuck orphan.
3. **Cross-org references** — edge case worth pre-checking before running test-org deletes. Any `tours_routing` row in org A referencing an artist in org B, or any `intake_documents` row in org A referencing a `tours_routing` in org B, would survive cross-org NO ACTION check failure. In practice these shouldn't exist; sanity query:
   ```sql
   SELECT count(*) FROM tours_routing tr JOIN artists a ON tr.artist_id = a.id WHERE tr.org_id <> a.org_id;
   ```
   (And similar for intake_documents.)
4. **Migration files are NOT authoritative** — confirmed by Step 0 results. The `supabase/migrations/` folder shows only 7 partial files; the real schema diverged significantly. Per CLAUDE.md rule 5, always `information_schema` first.

---

## Phase 1 — Schema migration (run once in SQL Editor)

Verification queries below ran June 12; results inline. The 12 effective migration statements that follow were run in production June 12. Statement 11 was originally drafted to add an FK to `tour_shows_crew` but was dropped post-hoc when that turned out to be a view (annotation kept inline below for the historical record).

### Verification queries — June 12 results

**(a) `finance_report_links` structure** — confirmed: `tour_id uuid NULLABLE` with FK CASCADE to `tours_routing`; `created_by uuid NULLABLE` with FK NO ACTION to `org_members`. **Decision: SET NULL on `created_by`** — `tour_id` nullable means a null-tour report link would survive the `tour_id` CASCADE path and its `created_by` reference would block org delete. SET NULL preserves audit rows.

**(b) Nullability of SET NULL targets** — confirmed all three nullable: `shared_venues.created_by_org`, `shared_contacts.created_by_org`, `tours_routing.localizer_tour_id`. No `ALTER COLUMN ... DROP NOT NULL` prerequisite needed.

**(c) `tour_shows_crew`** — turned out to be a **VIEW**, not a table. Statement 11 was dropped (constraint impossible and unnecessary; views hold no rows, underlying tables already cascade). See annotation at statement 11.

**(d) `marketing_tokens` orphan count** — run this read-only check BEFORE statement 13:

```sql
SELECT count(*) AS orphan_count
FROM marketing_tokens
WHERE org_id IS NOT NULL
  AND org_id NOT IN (SELECT id FROM orgs);
```

If `0` → use statement 13 Path A (single ADD). If `> 0` → use Path B (NOT VALID + DELETE orphans + VALIDATE).

### Migration statements (paste one at a time)

Order is non-critical at the FK level (all are independent); listed in logical groups: org_id CASCADE conversions first, then SET NULL conversions, then new FKs.

**1.** `account_contacts.org_id` → CASCADE
```sql
ALTER TABLE public.account_contacts
  DROP CONSTRAINT account_contacts_org_id_fkey,
  ADD  CONSTRAINT account_contacts_org_id_fkey
       FOREIGN KEY (org_id) REFERENCES public.orgs(id) ON DELETE CASCADE;
```

**2.** `advance_emails.org_id` → CASCADE
```sql
ALTER TABLE public.advance_emails
  DROP CONSTRAINT advance_emails_org_id_fkey,
  ADD  CONSTRAINT advance_emails_org_id_fkey
       FOREIGN KEY (org_id) REFERENCES public.orgs(id) ON DELETE CASCADE;
```

**3.** `field_aliases.org_id` → CASCADE
```sql
ALTER TABLE public.field_aliases
  DROP CONSTRAINT field_aliases_org_id_fkey,
  ADD  CONSTRAINT field_aliases_org_id_fkey
       FOREIGN KEY (org_id) REFERENCES public.orgs(id) ON DELETE CASCADE;
```

**4.** `intake_documents.org_id` → CASCADE
```sql
ALTER TABLE public.intake_documents
  DROP CONSTRAINT intake_documents_org_id_fkey,
  ADD  CONSTRAINT intake_documents_org_id_fkey
       FOREIGN KEY (org_id) REFERENCES public.orgs(id) ON DELETE CASCADE;
```

**5.** `tour_expenses.org_id` → CASCADE
```sql
ALTER TABLE public.tour_expenses
  DROP CONSTRAINT tour_expenses_org_id_fkey,
  ADD  CONSTRAINT tour_expenses_org_id_fkey
       FOREIGN KEY (org_id) REFERENCES public.orgs(id) ON DELETE CASCADE;
```

**6.** `tour_shows.org_id` → CASCADE
```sql
ALTER TABLE public.tour_shows
  DROP CONSTRAINT tour_shows_org_id_fkey,
  ADD  CONSTRAINT tour_shows_org_id_fkey
       FOREIGN KEY (org_id) REFERENCES public.orgs(id) ON DELETE CASCADE;
```

**7.** `tours_routing.org_id` → CASCADE
```sql
ALTER TABLE public.tours_routing
  DROP CONSTRAINT tours_routing_org_id_fkey,
  ADD  CONSTRAINT tours_routing_org_id_fkey
       FOREIGN KEY (org_id) REFERENCES public.orgs(id) ON DELETE CASCADE;
```

**8.** `shared_contacts.created_by_org` → SET NULL
```sql
ALTER TABLE public.shared_contacts
  DROP CONSTRAINT shared_contacts_created_by_org_fkey,
  ADD  CONSTRAINT shared_contacts_created_by_org_fkey
       FOREIGN KEY (created_by_org) REFERENCES public.orgs(id) ON DELETE SET NULL;
```

**9.** `shared_venues.created_by_org` → SET NULL
```sql
ALTER TABLE public.shared_venues
  DROP CONSTRAINT shared_venues_created_by_org_fkey,
  ADD  CONSTRAINT shared_venues_created_by_org_fkey
       FOREIGN KEY (created_by_org) REFERENCES public.orgs(id) ON DELETE SET NULL;
```

**10.** `tours_routing.localizer_tour_id` → SET NULL

(If the actual constraint name differs from the `_fkey` convention, substitute the real name from `\d tours_routing`.)
```sql
ALTER TABLE public.tours_routing
  DROP CONSTRAINT tours_routing_localizer_tour_id_fkey,
  ADD  CONSTRAINT tours_routing_localizer_tour_id_fkey
       FOREIGN KEY (localizer_tour_id) REFERENCES public.tours(id) ON DELETE SET NULL;
```

**11.** ~~`tour_shows_crew.org_id` → new FK with CASCADE~~ — **SKIPPED.** `tour_shows_crew` turned out to be a **VIEW**, not a table — `ADD CONSTRAINT` on a view is invalid Postgres syntax and would have errored. Views hold no rows; the underlying tables (`tour_shows`, etc.) already cascade. No action needed. Statement number kept for stable cross-reference; effective migration count is 12.

**12.** `finance_report_links.created_by` → SET NULL
```sql
ALTER TABLE public.finance_report_links
  DROP CONSTRAINT finance_report_links_created_by_fkey,
  ADD  CONSTRAINT finance_report_links_created_by_fkey
       FOREIGN KEY (created_by) REFERENCES public.org_members(id) ON DELETE SET NULL;
```

**13.** `marketing_tokens.org_id` → new FK with CASCADE — **run verification query (d) first.**

**Path A** (orphan_count = 0):
```sql
ALTER TABLE public.marketing_tokens
  ADD CONSTRAINT marketing_tokens_org_id_fkey
      FOREIGN KEY (org_id) REFERENCES public.orgs(id) ON DELETE CASCADE;
```

**Path B** (orphan_count > 0) — three sub-statements:
```sql
-- 13.B.1: add unvalidated FK so future writes are constrained but existing orphans don't block
ALTER TABLE public.marketing_tokens
  ADD CONSTRAINT marketing_tokens_org_id_fkey
      FOREIGN KEY (org_id) REFERENCES public.orgs(id) ON DELETE CASCADE NOT VALID;
```
```sql
-- 13.B.2: clean the orphans (decide whether to delete vs. otherwise repair based on what they represent)
DELETE FROM public.marketing_tokens
WHERE org_id IS NOT NULL AND org_id NOT IN (SELECT id FROM public.orgs);
```
```sql
-- 13.B.3: promote to fully-validated
ALTER TABLE public.marketing_tokens VALIDATE CONSTRAINT marketing_tokens_org_id_fkey;
```

### Post-migration verification

After all 13 statements run, re-execute the Q2 query from the original Step 0 to confirm the new state:

```sql
SELECT
  tc.table_name AS child_table,
  kcu.column_name AS child_column,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu USING (constraint_name, constraint_schema)
JOIN information_schema.referential_constraints rc USING (constraint_name, constraint_schema)
JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'orgs'
  AND ccu.column_name = 'id'
ORDER BY child_table;
```

Expected (confirmed June 12): the 7 previously-NO ACTION rows now show CASCADE; `shared_contacts` and `shared_venues` show SET NULL; new row for `marketing_tokens` (CASCADE). No row for `tour_shows_crew` — it's a view.

---

## Phase 2 — Test-org deletion (when executing)

**Status (June 12, 2026):** Three proving runs done — `testsign` via direct SQL (asset capture + single `DELETE FROM orgs`; all-zeros verification across `orgs`, `org_members`, `artists`, `tours`, `trial_nudge_emails`); then `testicles` and `testx` via the newly-shipped `POST /api/admin/delete-org` (dryRun first to inspect the manifest, then real run with audit row + auth.users delete + Cloudinary asset deletion verified out-of-band). The routine validated end-to-end on real cross-system deletions.

**Remaining work:**
- `testcorkys` and `testalex` — one `curl` each via `/api/admin/delete-org`. No more SQL Editor needed for the destructive step.
- `+test2026` retention decision (still stands as the candidate non-admin QA org).
- `auth.users` cleanup happens inside `deleteOrg` now (gated by the `deleteAuthUsers` flag, default true).

Phase 1 already handled the schema. The original June 11 layered-DELETE transaction collapses to a single statement.

### Step 1 — Identify target UUIDs

```sql
SELECT id, owner_email, created_at
FROM orgs
WHERE owner_email LIKE 'hwy61ai+test%@gmail.com'
ORDER BY created_at;
```

Confirm 6 rows (or 5 if retaining `hwy61ai+test2026@gmail.com` as QA org).

### Step 2 — Capture Cloudinary + Storage IDs BEFORE delete

Save CSV from the SQL Editor for out-of-band cleanup. Nothing in DB cascades touches storage:

```sql
WITH target_orgs AS (
  SELECT id::uuid FROM (VALUES
    ('00000000-0000-0000-0000-000000000001'::uuid)
    -- (paste the other UUIDs here)
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

### Step 3 — Sanity row-count audit (read-only, optional but recommended)

Confirms expected fan-out before the destructive step:

```sql
WITH target_orgs AS (
  SELECT id::uuid FROM (VALUES
    ('00000000-0000-0000-0000-000000000001'::uuid)
    -- ... paste the rest
  ) AS t(id)
)
SELECT 'orgs'            AS table_name, count(*) FROM orgs            WHERE id     IN (SELECT id FROM target_orgs)
UNION ALL SELECT 'org_members',    count(*) FROM org_members     WHERE org_id IN (SELECT id FROM target_orgs)
UNION ALL SELECT 'tours_routing',  count(*) FROM tours_routing   WHERE org_id IN (SELECT id FROM target_orgs)
UNION ALL SELECT 'tours',          count(*) FROM tours           WHERE org_id IN (SELECT id FROM target_orgs)
UNION ALL SELECT 'artists',        count(*) FROM artists         WHERE org_id IN (SELECT id FROM target_orgs)
ORDER BY 1;
```

### Step 4 — Single-statement DELETE

After Phase 1 ran, this is the entire destructive step:

```sql
BEGIN;

DELETE FROM public.orgs
WHERE id IN (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000006'
);

-- Verify: should return 0
SELECT count(*) FROM public.orgs WHERE id IN (
  '00000000-0000-0000-0000-000000000001'
  -- (etc.)
);

-- COMMIT;       -- uncomment to commit
-- ROLLBACK;     -- if anything looks wrong
```

The Phase 1 migration handles every dependent table. No layered DELETE needed; no temp tables, no per-layer FK ordering. Single transaction wrapping a single statement.

### Step 5 — Post-deletion checklist (manual, unchanged from June 11)

1. **Cloudinary cleanup.** Use the CSV from Step 2 to bulk-delete the `image_*_id` / `video_*_id` public IDs in Cloudinary, plus the `render_*_url` URL paths.
2. **Supabase Storage cleanup.** Same CSV for `image_url` / `logo_url` / `adv_*_url` on artists, plus any `intake_documents` storage paths.
3. **`auth.users` cleanup (optional).** For each deleted org's `owner_email`, find the matching `auth.users` row and delete it via Supabase dashboard or `supabase.auth.admin.deleteUser(userId)`. Skip for the retained QA org if applicable.
4. **Confirm crons don't barf.** Next trial-nudge cron at 13:00 UTC: check Vercel Functions logs for `getUserById returned null` warnings.

---

## `deleteOrg(orgId)` admin function — SHIPPED June 12, 2026

**Implementation files:**
- `lib/admin/deleteOrg.ts` — core routine (refusal checks → manifest capture → audit insert → DB delete → external cleanup).
- `app/api/admin/delete-org/route.ts` — `POST /api/admin/delete-org` dual-gated (admin session + `ADMIN_DELETE_ORG_SECRET` bearer; Layer 1 bypassed in dev for local testing).
- `deleted_orgs_audit` table — created June 12 (service-role only, RLS-enabled, no `authenticated` / `anon` grants).

**Proven on:** `testicles` and `testx` (June 12). Cloudinary asset deletion verified out-of-band.

The design that was built is captured in the sections below.

**Signature:**
```ts
deleteOrg(orgId: string, opts?: { deleteAuthUsers?: boolean }): Promise<Result>
```

**Phases (in order):**

1. **Capture asset manifest** — single SQL query returning every Cloudinary public_id and Supabase Storage path tied to the org (`tours.image_*_id`, `video_*_id`, `sponsor_*_url`; `artists.image_url`, `logo_url`, `adv_*_url`, `adv_custom_materials` JSON; `venue_links.render_*_url`; `intake_documents` storage paths).
2. **Capture user_id list** — `SELECT user_id FROM org_members WHERE org_id = $1`. Phase 4 needs these after Phase 3 deletes the org_members rows.
3. **Single-statement DB delete** — `DELETE FROM orgs WHERE id = $1`. Wrapped in a transaction with a post-check `SELECT count(*) FROM orgs WHERE id = $1` that throws on non-zero.
4. **External cleanup (best-effort, post-commit)** — sequential, no rollback:
   - Cloudinary: `cloudinary.api.delete_resources(ids, { resource_type })` batched by 100, per-batch error capture.
   - Supabase Storage: `supabase.storage.from(bucket).remove([...])` batched per bucket.
   - `auth.users`: `supabase.auth.admin.deleteUser(userId)` per captured user, gated by `opts.deleteAuthUsers ?? true`.

**Return:**
```ts
{
  ok: true,
  dbDeletedAt: string,
  cloudinary: { deleted: number; failed: Array<{ id: string; error: string }> },
  storage:    { deleted: number; failed: Array<{ path: string; error: string }> },
  authUsers:  { deleted: number; failed: Array<{ userId: string; error: string }> }
}
```

**External-cleanup failures do NOT roll back the DB delete.** DB is authoritative; external orphans are harmless billing/storage waste, sweepable later.

**Use cases this single function serves:**

1. **CCPA / GDPR deletion requests** — call with `deleteAuthUsers: true`.
2. **Test-org cleanup (this plan)** — call with `deleteAuthUsers: false` if retaining auth.users for QA, else `true`.
3. **Future self-serve "delete account" UI** — call with `deleteAuthUsers: true`.

---

## Open questions / decisions to make at execution (refreshed June 12)

- **Confirm the 6 target UUIDs at execution time.** Phase 2 Step 1 query above.
- **Retain `hwy61ai+test2026@gmail.com` as the QA org?** If yes, drop its UUID from Step 4 — delete only 5. Skip the auth.users cleanup for that one in Step 5.
- **Cross-org reference sanity check** before running deletes — the gotcha #3 query in Summary E.
- **Phase 1 timing.** Migration is independent of Phase 2 execution timing — can run any time before Week 4. Lower-risk window: when there are no active writes (off-hours). The 13 statements are individually fast; each is a metadata-level constraint change, not a table rewrite.
- **Decide who runs Phase 2.** This file is for Drew. The Supabase SQL Editor session must be the production project, not a staging clone.
