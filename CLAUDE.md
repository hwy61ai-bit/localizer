# CLAUDE.md

This file is loaded automatically by Claude Code at the start of every session in this repo. It contains the persistent rules, context, and workflow expectations for working on this codebase. Read it in full before doing anything else.

---

## What this repo is

HWY61 Labs is a software platform for the touring music industry. The repo contains two products sharing one database and one Next.js codebase:

- **TourRouter** — tour routing, budgeting, advancing, settlement, personnel pay, hotels, guest list, deposits, and finance. The logistics and finance brain.
- **Localizer** — tour marketing automation. Poster and social asset generation via a Canvas renderer. The marketing brain.
- **DIY** — a feature-flagged lighter tier of TourRouter for self-managed bands.

The whole thesis is that logistics and marketing share a single source of truth: confirm a show in TourRouter and Localizer immediately knows about it. Nothing is re-entered. Treat this as the core architectural principle.

Stack: Next.js 14 (App Router) + TypeScript, Supabase (Postgres + Auth + Storage + RLS), Vercel, Stripe, Resend, Mapbox, PostHog, Anthropic API. Deployed at hwy61labs.com.

A Coming Soon gate is currently active via the `COMING_SOON` env var in middleware. Marketing routes redirect to `/coming-soon`; dashboard, login, and API routes remain live.

---

## Non-negotiable rules

These are the rules that silently break production when violated. Do not deviate from any of them without explicit instruction. Every one of these exists because of a bug that already happened once.

1. **`parseDate()` must use `new Date(year, month - 1, day)`.** Never `new Date(string)`. The string form silently applies timezone conversion and shifts shows by a day in non-UTC zones.

2. **`calcTourFinancials()` in `lib/tourrouter/financials.ts` is the single source of truth for every financial total.** Never recalculate totals inline anywhere else.

3. **The fuel variable inside `calcTourFinancials()` is named `legCtry`, not `legCountry`.** Do not rename it to look cleaner. There is a variable-name collision that silently breaks fuel math if you do.

4. **`calculateShowIncome(show, useActuals)` is the single source of truth for per-show income.** Switches on `deal.dealType`. Never inline this logic.

5. **Excel parsing must use `raw: true, cellDates: true`.** Never `raw: false`. The string form produces locale-dependent date parsing bugs.

6. **Every Supabase write must use `.select().maybeSingle()` and verify a row came back.** RLS silently returns `{ data: null, error: null }` on blocked writes — a `200` with zero rows affected. If you don't check, the user sees "success" and the row never existed. Treat a null return as a silent RLS rejection and surface it as an error.

7. **Every server-side Supabase read in Next.js 14 must use `cache: "no-store"`** or equivalent. Next.js 14 aggressively caches server-side fetches and will serve stale data in production that does not appear in development.

8. **`legChoices` key is the destination show's index in `tourShows[]`.** Never the origin. Consistent everywhere.

9. **Financial fields never reach crew or label API responses.** Excluded at the API route level via the `tour_shows_crew` view. Road App and any crew-facing surface must query through crew-safe routes only.

10. **Staged preview always — no import or inbound data writes directly to the database without user review.** The intake API never writes; it returns a parsed preview that the user confirms before a separate write endpoint commits.

11. **Feature flags checked before rendering any gated feature.** DIY users must never see TourRouter-only features.

12. **Commission visibility is checked at the API route level, never in the UI.** Never rely on client-side filtering for sensitive financial data.

13. **Idempotency on all cron and background jobs.** Check whether the action has already been taken before acting.

14. **Payment amounts are always manually confirmed by the tour manager.** Claude may pre-fill from AI parsing, but the TM must explicitly confirm before write.

15. **The Canvas poster renderer in Localizer is independent of CSS.** It uses the Canvas API and FontFace JS API directly. Changes to `globals.css` or design tokens do not affect it. Do not assume otherwise when doing design system work.

16. **Google Fonts `.ttf` fetching requires a `User-Agent: Mozilla/5.0` header.** Without it, Google returns `.woff2` which `pdf-lib` cannot embed. If you touch PDF font loading, preserve the user-agent spoof.

17. **When committing code, never add a Co-Authored-By trailer to the commit message** (e.g. `Co-Authored-By: Claude <noreply@anthropic.com>`). Commits should be attributed to the user only. This applies to all commit messages you write via `git commit -m`, `git commit -F`, or any other method.

18. **Explicit GRANTs on new public-schema tables.** When creating a new table in the public schema, the migration SQL must include explicit GRANT statements alongside ENABLE RLS + CREATE POLICY. Starting Oct 30, 2026, Supabase removes the default Data API grant; without explicit GRANTs, supabase-js will return 42501. Existing tables are unaffected and keep their current grants.

    ```sql
    CREATE TABLE public.your_table (
      id uuid primary key default gen_random_uuid()
      -- columns...
    );

    GRANT SELECT, INSERT, UPDATE, DELETE ON public.your_table TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.your_table TO service_role;
    -- GRANT SELECT ON public.your_table TO anon;  -- only for tokenized public viewer access

    ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "org_access" ON public.your_table
      FOR ALL USING (
        org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid())
      );
    ```

    Fail-loud safety net: if a GRANT is forgotten post-Oct-30, PostgREST returns 42501 with the exact GRANT statement to paste.

---

## Workflow rules

How to work in this repo. These are process rules, not code rules. They exist to keep review tractable and prevent compounding errors.

1. **One file per Claude Code prompt.** Never batch multiple file edits into a single prompt. Batching causes context loss and hanging sessions.

2. **Always present a numbered plan before editing any files.** Wait for explicit approval before writing or modifying anything. No exceptions, even for small changes.

3. **Show diffs before applying edits.** The human reviews every diff.

4. **Migrations are run by hand in the Supabase SQL Editor.** Do NOT write files to `supabase/migrations/` unless explicitly instructed. There is no automated migration runner in this project. When a schema change is needed, produce the SQL in a separate clearly-labeled code block so the human can paste it into the Supabase dashboard.

5. **Never assume a schema change has or has not been applied.** Before proposing any schema work, run an `information_schema.columns` query (or equivalent) to verify current state. Never add a column that already exists. Never reference a column that does not exist yet.

6. **Never run `npx vercel --prod` or any Vercel CLI deploy command.** Vercel auto-deploys on `git push` to the main branch. Manual deploys create drift.

7. **Never use bash heredocs.** Smart quote corruption risk. Use `create_file` or equivalent tool operations for multi-line content.

8. **Never use `npm run build` as a substitute for `tsc --noEmit`** when you only want a type check. Use `tsc --noEmit` for faster feedback.

9. **Supabase SQL, Claude Code prompts, and terminal commands each get their own separate code block.** Never mix them. The human runs each one in a different place (SQL Editor, Claude Code, terminal) and combined blocks cause errors.

10. **The `docs/SESSION_LOG.md` file is chronological and updated at the end of each session.** Do not treat it as a spec or source of truth for current state. Specs live in `docs/*SPEC*.md`; current state is verified against the code and database directly.

11. **The repo has a QA agent running on a separate Mac mini as a read-only environment.** Never push commits intended only for QA. Never design workflows that require git writes from the QA machine.

12. **Avoid parallel agents working on the repo simultaneously.** Single-threaded work is cheaper in tokens and easier to debug. If multiple tasks are queued, do them sequentially.

13. **Reconcile `docs/BACKLOG.md` before pushing the `docs/SESSION_LOG.md` update.** At the end of each session, grep `docs/BACKLOG.md` for keywords from this session's commits — file paths, feature names, bug descriptions. Any backlog item the session's work resolved gets a Resolution stamp and moves to the `## Resolved` section at the bottom. Catches the "fixed something and forgot to update the backlog" failure mode.

14. **Run a 20-minute `docs/BACKLOG.md` audit every 2–3 weeks.** Walk 🔴 Active issues and 🟡 Pre-launch gates first. For each open item, ask "would I be surprised if this is still broken?" — test the suspicious ones. Catches side-effect resolutions: items that got incidentally fixed by unrelated work and were never explicitly closed. Rule 13 alone misses these because nobody can predict which adjacent items a given commit will resolve.

---

## Design system

The visual language is called the **Warhol** system. Black, white, red, halftone dot overlay on the body background. Very 1966.

- Global CSS variables live in `app/globals.css` as `--hw-*` custom properties.
- Reusable components live in `app/components/hw/` (29 components: `HwCard`, `HwButton`, `HwInput`, `HwSelect`, etc.). Check this folder before building any new UI primitive — there is almost certainly already a component for what you need.
- All new UI should use `Hw*` components and `--hw-*` variables. Do not introduce new CSS files for one-off styling without explicit approval.
- The Canvas poster renderer in Localizer is NOT part of this system and does not inherit from it. See rule 15 in the Non-negotiable list.

---

## Key file locations

| What | Where |
|---|---|
| Financial calculation engine | `lib/tourrouter/financials.ts` |
| Per-show income calculator | `lib/tourrouter/calculateShowIncome.ts` |
| Mapbox integration | `lib/tourrouter/mapbox.ts` |
| Hotel rate lookup | `lib/tourrouter/hotelRates.ts` |
| Constants (city coords, market rates, vehicle data) | `lib/tourrouter/constants.ts` |
| All AI parsing prompts | `lib/tourrouter/prompts/` |
| Date/currency/Excel parsers | `lib/tourrouter/parsers.ts` |
| State/country normalization | `lib/tourrouter/stateNames.ts` |
| Design system components | `app/components/hw/` |
| Global styles and `--hw-*` tokens | `app/globals.css` |
| Routing page (main) | `app/dashboard/routing/[tourId]/page.tsx` |
| Financials page | `app/dashboard/routing/[tourId]/financials/page.tsx` |
| Intake API (read-only parse) | `app/api/tourrouter/intake/route.ts` |
| Intake confirm (the actual write) | `app/api/tourrouter/intake/confirm/route.ts` |
| Supabase server client | `lib/supabaseServer.ts` |
| Supabase browser client | `lib/supabaseClient.ts` |
| Session log (chronological) | `docs/SESSION_LOG.md` |
| Build plan | `TOURROUTER_CLAUDE_CODE_BUILD_PLAN.md` |
| Specs for in-progress work | `docs/*SPEC*.md` |

---

## Database notes

- Postgres via Supabase. RLS is enabled on every table. Row-level security is the primary access control — do not rely on application-layer filtering for sensitive data.
- `orgs` is the multi-tenant root. Every row in every table ultimately belongs to an org.
- `org_members` joins users to orgs with a `role` column for access control.
- User display names live in `auth.users.user_metadata.full_name` — there is no `profiles` table and no `display_name` column on `org_members`. Read via `user.user_metadata?.full_name`, write via `supabase.auth.updateUser({ data: { full_name } })`.
- Routing tours live in `tours_routing`. Marketing tours (Localizer) live in `tours`. These are different tables — do not confuse them.
- `tour_shows` has 90+ columns. There is a crew-safe view called `tour_shows_crew` that strips all financial fields.
- Critical tables: `tours_routing`, `tour_shows`, `shared_venues`, `shared_contacts`, `account_contacts`, `field_aliases`, `intake_documents`, `advance_emails`, `tour_expenses`, `guest_list`.

---

## Before starting any task

Run through this checklist at the start of every session and every new task:

1. Read `CLAUDE.md` (this file) in full.
2. Read the relevant spec in `docs/` if one exists. Specs are authoritative. If a spec and the code disagree, ask — do not silently prefer one.
3. If the task touches the database schema, run an `information_schema.columns` query to verify current state before proposing any changes. Never assume.
4. If the task touches financials, PDF generation, the Canvas renderer, or intake parsing, re-read the relevant rule in the "Non-negotiable rules" section above.
5. Present a numbered plan. Wait for explicit approval.
6. Work one file at a time. Show the diff. Wait for approval. Apply. Move on.
7. Run `tsc --noEmit` (or `npm run build` for a full check) before declaring the task done.
8. Do not commit or push unless explicitly instructed. The human controls git.

---

## When in doubt

Ask. This repo has scars that are not visible in the code — rules that exist because a specific bug happened once and we are not going to let it happen again. If a change looks "obviously cleaner" and you cannot see why the existing code is the way it is, stop and ask rather than refactor. Nine times out of ten, the existing code is the way it is because of something in the "Non-negotiable rules" section above, and the tenth time you will learn something new that belongs in this file.
