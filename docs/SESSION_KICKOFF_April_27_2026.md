# Session Kickoff — April 27, 2026 (Monday)

## Where we left off

Yesterday (Sunday April 26) was a pre-beta security audit. Two critical
auth holes Tim flagged in his draft invite email turned out to be real
and exploitable from outside the app entirely. Both fixed, both smoke-
tested in production, both shipped. Plus a status doc for Tim that
supersedes the stale claims in his draft invite email.

**Yesterday's commits (4):**

- `5341b74` — fix(security): require auth + org membership on overlay-config PATCH
- `01a0a5b` — fix(security): require token validation on print-pdf route
- `5baec8d` — docs: session log 2026-04-26
- `99e9411` — docs: status snapshot for Tim 2026-04-26

The beta system itself is fully functional. Two real claims in the
database (Tim on `001`, Drew test on `002`). Eight codes still unclaimed.
No code work blocks invites going out.

## First 5 minutes

```bash
cd ~/localizer
git pull
git status
```

Should be clean. If not, reconcile before doing anything else.

Then close any Chrome tabs pointing at hwy61labs.com — they trigger
Supabase rate limiting on long-lived sessions. This bit during yesterday's
testing.

## Top of mind

The Tim status doc went into the repo yesterday at
`docs/TIM_STATUS_2026-04-26.md`. **Decide first thing this morning:**

- Has Tim seen it yet? (Slack? Email? Pointed his Claude at it?)
- If not, send it to him now. The whole sequence depends on his reply
  with the tester list.

While waiting on Tim, work the unblocked items below. Don't sit idle on
his response.

## Three priorities for today, in order

### 1. Send Tim the status doc (5 minutes)

`docs/TIM_STATUS_2026-04-26.md` is the canonical handoff. Whether Tim
reads it himself or hands it to his Claude, this gets him aligned with
what's actually deployed.

Suggested message:

> "Yesterday I shipped two security fixes that closed the unauth route
> issues you flagged in your draft email. Wrote it all up in the repo
> at `docs/TIM_STATUS_2026-04-26.md` — it covers the fixes, the auth
> flow correction needed in your invite email, and three things you
> should know that aren't in your draft. Point your Claude at it or
> read it directly. Need from you: tester list with codes assigned,
> revised email copy, and confirm the `[LINK]` URL. No code work
> blocks invites once those are in."

### 2. Confirm and document the [LINK] URL (10 minutes)

Tim needs a definitive sign-in URL for his email. Best guess:
`https://hwy61labs.com/login`. Verify by:

- Visiting it in a fresh incognito browser
- Confirming it shows the beta-code + email entry flow
- Confirming a magic link from there lands on `/dashboard` after sign-in

If `/login` is wrong or behaves weirdly, the actual URL is whatever
the marketing site's "Sign In" button points to. Note it back to Tim.

### 3. Orphan tour cleanup (15 minutes)

Yesterday's data check found 2 orphaned tours sitting in a zero-member
"My Workspace" org (`3e384602-cf13-4ba2-bb45-949f25917e84`). They're
unreachable now that the security fix shipped, but they exist as data.

The two tours:

- `1f4ce7f1-25f3-4311-88df-89cf7add6162` — "New Tour" (created 2026-03-09)
- `5711c729-7e4f-4477-bcb0-c933ddf0db94` — "New Tour" (created 2026-03-02)

Both are pre-launch test data with no real content. Cleanup SQL (run
in Supabase SQL Editor — no migration file):

```sql
-- Verify before deleting
SELECT id, name, created_at, org_id
FROM tours
WHERE org_id = '3e384602-cf13-4ba2-bb45-949f25917e84';

-- Delete the orphan tours (cascade should clean up events + venue_links)
DELETE FROM tours WHERE org_id = '3e384602-cf13-4ba2-bb45-949f25917e84';

-- Delete the orphan org itself
DELETE FROM orgs WHERE id = '3e384602-cf13-4ba2-bb45-949f25917e84';

-- Verify clean
SELECT COUNT(*) FROM tours WHERE org_id = '3e384602-cf13-4ba2-bb45-949f25917e84';
SELECT COUNT(*) FROM orgs WHERE id = '3e384602-cf13-4ba2-bb45-949f25917e84';
```

(The 11 zero-member orgs with zero tours are harmless and can be batched
in a separate cleanup pass later — not today's work.)

## When Tim replies — execute the comp script

Once Tim sends the tester list, the workflow is:

1. For each tester email, in Supabase SQL Editor:
   - Confirm or pre-create the user (Supabase Auth → Users → Invite if
     needed, then have them sign up via the magic link flow first time
     they hit the site)
   - Find their org
   - Set `localizer_plan='agency'`, `localizer_plan_status='active'`,
     and `bundle_plan_status='active'` if needed for full Agency tier
2. Hand Tim a confirmation he can copy into his invite emails:
   "Your code is `HWY61-BETA-XXX`. Sign in at `[LINK]` using
   this email."

Don't pre-create orgs before testers hit the site — the existing
ensureOrgExists flow handles org creation correctly, and pre-creating
risks the per-user-vs-per-org mismatch confusion.

## Lower-priority backlog (if blocked above, pick from)

- **Font upload route still uses old `org.plan` schema** — quick
  freemium-era fix, ~30 minutes
- **Beta-claim timing bug entry** — remove from BACKLOG.md and any
  other doc that still lists it (yesterday's smoke test confirmed it's
  not a bug, the doc is stale)
- **Lint cleanup pass on public viewer pages** — ~20 lint errors/warnings
  in app/v/, app/advance/, app/report/, app/api/download — mechanical,
  ~30-45 min
- **Mapbox write-back still hardened, no hits in logs** — optional
  spot check on the three `[geocoding]` log strings; should still be
  zero hits
- **TEAM LOGIN / SIGN IN bypass** — fine for private beta, must fix
  before public launch
- **Unit D (Upstash Redis rate limiting)** — ~90 min, four tier spec
  in BACKLOG.md

## Parked — don't touch without Tim

- Stripe business setup bundle (EIN, bank account, billing email)
- TourRouter advance feature re-enable (4-bug checklist in BACKLOG.md)
- Onboarding wizard Option B (needs Tim's narrative input)
- 41-route billing gate rollout (needs Tim's helper architecture)

## Permanently cut — do not surface

- Merch and Agency products
- Stylized PDF exports
- Optional third video slot in Localizer template editor
- Tour-level Download All page (replaced by marketing token hub)

## Quick health checks

- `.next` cache corruption symptoms (missing styles, 404s on chunks):
  `rm -rf .next node_modules/.cache`
- `zsh` glob hazard on dynamic routes — quote paths with square brackets
  for `git add`/`sed`/`cp`/`rm`
- CORS preflight failures during browser smoke tests — fall back to
  curl for clean status codes (the apex-vs-www domain split causes this)
- "Session expired" on magic links — testers must click the link in the
  same browser they entered the code in

## Process reminders

- Claude Code prompts in one file per run
- `npx tsc --noEmit` after every change
- Supabase SQL runs manually in the SQL Editor — never write migration
  files
- Never `npx vercel --prod` — Vercel auto-deploys on push
- Always show diff before applying — yesterday's work caught real issues
  this way three separate times

## End of day

```bash
open -a TextEdit docs/SESSION_LOG.md
```

Add what got done, what didn't, what tomorrow starts with. Then:

```bash
git add docs/SESSION_LOG.md
git commit -m "docs: session log $(date +%Y-%m-%d)"
git push
```
