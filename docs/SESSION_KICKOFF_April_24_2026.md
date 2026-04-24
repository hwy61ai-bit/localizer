# Session Kickoff — April 24, 2026

## Where we left off last night (April 22-23 session, 24 commits)

The Localizer beta is fully built, tested end-to-end, and waiting on Tim to pick 10 users and hand out codes. No code work blocks the beta launch.

**Last commit:** `c9e687d` — docs: session log late evening + cron kill wrap.

## First 5 minutes

Before anything else:

```bash
cd ~/localizer
git pull
git status
```

Should be clean. If it's not, something happened on another machine — reconcile first.

Then clear all Chrome tabs pointing at `hwy61labs.com` before starting local dev (those tabs continuously refresh session tokens and trigger Supabase rate limiting).

## State of play

### Beta system — READY, waiting on Tim

- 10 invite codes seeded (`HWY61-BETA-001` through `HWY61-BETA-010`), all unclaimed
- `HWY61-BETA-001` is reset to unclaimed so Tim can test first
- Full login flow works end-to-end
- `docs/BETA_USER_GUIDE.md` has paste-ready copy Tim can forward with codes
- Brand-styled PDF guide also generated (in this project's chat history) — can be attached to emails if Tim wants

**Action:** nothing required. Send Tim the codes when he's ready. No code work blocking.

### TourRouter advance cron — DISABLED

Discovered last night that `/api/tourrouter/advance/cron` was firing real `resend.emails.send()` calls daily with no gate. Turned out to be a non-event — all recipients in the DB were seed-data names ("Aaron Blackwood") not email addresses, so Resend rejected every send. No real promoters got emails.

- `vercel.json` emptied to `{}` — no cron runs
- Four bugs captured in `docs/BACKLOG.md` under "TourRouter" section
- Re-enabling checklist in the same section
- Manual "Send Advance" button in the tour page UI still exists but nothing auto-fires

**Action:** nothing. Not urgent. Revisit when TourRouter is a real roadmap item.

## Three priorities for today, in order

Pick whichever matches your energy.

### 1. (Highest priority when Tim's ready) Option B onboarding wizard

Current `OnboardingWizard.tsx` has Option A shipped (hides TourRouter options for Localizer-only users, shows a single-card welcome). Option B is the proper fix — a dedicated Localizer narrative:

- Step 1: Add your first artist
- Step 2: Add your first show
- Step 3: Generate your first asset

**Blocked on:** Tim's input on the narrative copy and flow. Don't start building until he's given you the steps.

If Tim hasn't responded yet, skip this and move on.

### 2. Beta-claim timing bug

Known issue: beta code claim fires on `PostHogProvider` mount (before auth completes). Users whose magic link fails burn their code. Fix is to move the claim call into `/auth/callback` post-`ensureOrgExists`.

This is the one lingering bug that could bite a real beta user. Worth knocking out early.

### 3. Unit D — Upstash Redis rate limiting

Four priority tiers:
- AI parsing: 50/hr/org
- Venue/contact reads: 200/hr/org
- Exports: 30/hr/org
- Everything else: 500/hr/org

Pure build work, no blockers, good focused-morning task. Start with provisioning Upstash and wiring the middleware — the tier enforcement comes after.

## Lower priority backlog (pick if above are blocked)

- Font upload route still uses old `org.plan` schema — quick fix
- Root-cause SSR cookie-propagation fix (currently patched in 4 places with service-role reads; proper fix is middleware-level)
- TEAM LOGIN / SIGN IN bypass — anyone can skip invite gate. Fine for private beta, must fix before public launch.
- 41-route billing gate rollout — waiting on Tim's architectural input
- ArtistHubClient.tsx Localizer access check uses `plan_status` logic instead of `localizer_enabled` — harmless today, fix for consistency

## Parked — don't touch without Tim

- Stripe business setup bundle (EIN entry, bank account selection, billing contact email) — all three blocked on bank account decision, do them in one Stripe session once account is chosen
- Full TourRouter advance feature re-enable — see `docs/BACKLOG.md` TourRouter section for the 4-bug checklist

## Permanently cut — do not surface

These come up sometimes but should never be on the roadmap:
- Merch and Agency products
- Stylized PDF exports
- Optional third video slot in Localizer template editor
- Tour-level Download All page (`/v/tour/[tourId]`) — replaced by marketing token hub

## Quick health checks before starting

If the dev server behaves weirdly:
- `.next` cache corruption is a recurring issue. Fix: `rm -rf .next node_modules/.cache`
- `zsh` glob hazard on dynamic routes — quote paths with square brackets for git add/sed/cp/rm

## Remember

- Claude Code prompts in one file per run
- `tsc --noEmit` after every change
- Supabase SQL runs manually in the SQL Editor — never write migration files
- Never `npx vercel --prod` — Vercel auto-deploys on push
- Multi-line commit messages via Write tool to `.git/COMMIT_MSG_TMP` then `git commit -F`

## Session log

End of day, don't forget:

```bash
open -a TextEdit docs/SESSION_LOG.md
```

Add what got done, what didn't, what tomorrow starts with. Then:

```bash
git add docs/SESSION_LOG.md
git commit -m "docs: session log $(date +%Y-%m-%d)"
git push
```
