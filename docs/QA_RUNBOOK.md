# HWY61 QA Runbook

Reusable guide for running a QA session on the Mac mini.
This document is evergreen — update it when the process changes,
not after every session.

## Machine & rules

- **Mac mini** is read-only. `git push` is disabled via
  `git remote set-url --push origin DISABLED`.
- Always `git pull` before starting.
- Launch with `qa-start` (alias → `~/qa-start.sh`). It pulls,
  installs, kills stale dev servers, starts `npm run dev` in
  background with logs to `~/localizer/qa/dev-server.log`, and
  launches Claude Code.
- When done: exit Claude Code, then run `qa-stop`.

## Repo & production

- **GitHub:** `hwy61ai-bit/localizer`
- **Local path:** `~/localizer`
- **Production:** `hwy61labs.com` (auto-deploys on push to main)
- **Coming Soon gate:** `COMING_SOON=true` in env redirects
  marketing routes to `/coming-soon`. Set to `false` and
  redeploy to go live.

## Logins for QA

- **Drew (admin):** `hwy61ai@gmail.com` — admin bypass on
  billing gates, primary dev/QA account.
- **Tim (admin):** `tentenpm@gmail.com` — admin bypass on
  billing gates. Note: Tim's historical email `hwy61regan@gmail.com`
  is NOT an admin email. `tentenpm@gmail.com` is the one in
  `ADMIN_EMAILS`.

## QA reports

- Every QA session writes a full report to:
  `localizer-qa-reports/YYYY-MM-DD_description.md`
- Structure: summary by priority, CRITICAL/HIGH/MEDIUM/LOW
  bugs, verified working, deferred, open questions.
- Never report findings only in chat — the file is the
  deliverable.

## Standard QA prompt template

For each session, paste a fresh kickoff prompt into Claude
Code that covers:

1. "You are the QA agent. Read-only. No commits, no pushes."
2. A pointer to the latest briefing (either a fresh State-of-
   the-Union doc or the previous session log entry).
3. Focus areas — usually: whatever shipped since the last QA
   pass, plus Tim's most recent UI list.
4. Fix-directly vs escalate rules.
5. Critical architectural rules to verify (calcTourFinancials
   is single source of truth, intake API never writes to DB
   directly, hotel waterfall, fuel estimate-persists rule,
   .select().maybeSingle() on writes, etc.).
6. Where to write the report.

Prompts are pasted into Claude Code, not checked into the
repo. They change every session.

## Bug priority levels

- **CRITICAL** — blocks launch or corrupts data
- **HIGH** — significant feature broken or wrong numbers
- **MEDIUM** — feature works but incomplete vs spec
- **LOW** — polish, edge cases, minor UI issues

## QA agent scope

**Fix directly:** typos, wrong variable names, missing RLS
policies, wrong formulas, missing PUT whitelist fields, broken
API route field names.

**Escalate (document, do not touch):** architectural issues,
product rethink items, DB migrations, anything touching
multiple interconnected systems.

**Note:** the mini cannot push. Any fix applied on the mini
sits as uncommitted local changes. For that reason, the agent
should usually prefer *writing the exact patch into the QA
report* over applying it in-place, so the Old Mac Pro can
reproduce the fix cleanly.
