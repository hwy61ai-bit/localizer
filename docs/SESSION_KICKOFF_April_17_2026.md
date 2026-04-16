# HWY61 Session Kickoff — April 17, 2026

## Start Here

1. `git pull` — always before touching anything
2. `git status` — confirm clean working tree
3. `claude` — start Claude Code (now at v2.1.112, working npm-global install at `/usr/local/bin/claude`)
4. Open this doc for reference: `docs/SESSION_KICKOFF_April_17_2026.md`
5. Read the previous day's session log entry: `tail -150 docs/SESSION_LOG.md`

---

## Where We Ended Yesterday (April 16)

**26 commits shipped.** Biggest day of the sprint. Arc summary:

- Morning: Mapbox geocoding write-back hardened with `.select().maybeSingle()` + greppable error logs
- Midday: 8-file public-share auth refactor — entire `/v/*` viewer pipeline + download API routes + billingGate moved from `supabaseServer()` to new `lib/supabaseAdmin`. The public share system had been invisibly broken for anonymous users since day one.
- Afternoon: video upload progress bar, drag grid overlay in template editor, sticky preview column
- Evening: sponsor logo tinting epic (preview + JPEGs shipped, print PDF reverted due to 100+ second sharp cost on Vercel), Google Fonts `:wght@700` fix for print PDF text weight, PrintDownloadButton progress UI
- Late evening: roster drag-drop hint, venue page footer "HWY61 LABS" branding parity

**Last commit of the day:** `18e7317` (session log).

---

## 🚨 FIRST PRIORITY — Auth Bug Diagnostic (BETA BLOCKER)

**Do not start anything else until this is resolved or has a clear fix path.**

### Symptom

4 days in a row, production shows "session expired" and cannot log in without clearing browser cache. Happened again late evening 4/16.

### What We Know

- **April 14's PKCE fix (`5255a82`)** addressed the HTTP-localhost magic-link callback vector. That was a real fix, but this production recurrence is a different symptom.
- **`middleware.ts` is correct.** Both auth gates use `getSession()` (cookie-only, the right pattern). The only `getUser()` call in the codebase is in `/auth/callback/route.ts`, which is appropriate.
- **Vercel logs** during the affected window showed no auth errors.
- **Browser cache clear** is the current workaround. Unacceptable for beta users.

### Why This Cannot Ship to Beta

Localizer-only beta is starting very soon. A tour manager hitting "session expired" with only "clear your cache" as a workaround will churn immediately. This is a pre-launch blocker.

### Diagnostic Plan

Run these in order. Stop at the first one that reveals the cause.

**Step 1 — Supabase dashboard audit.** Login to Supabase, go to the project's Authentication settings. Check:
- JWT expiry (default 1 hour — is it shorter?)
- Refresh token expiry / rotation settings
- Site URL — should be `https://hwy61labs.com` (or whichever the prod primary is)
- Redirect URLs — should include all subdomain callbacks. Verify nothing stale is lingering from the `localizer.hwy61.ai` domain.
- Any rate limit or cookie-related settings that may have changed

**Step 2 — Live reproduction with DevTools open.**
- Open hwy61labs.com in a browser you've been using (one that will likely show the bug)
- Open DevTools → Application tab → Cookies → hwy61labs.com
- Record which Supabase cookies are present (`sb-*-auth-token`, `sb-*-auth-token.0`, etc.)
- Note their expiry times, domain scope, and SameSite/Secure flags
- Try to hit the dashboard. When the "session expired" bounce happens, re-check cookies. Which ones are still there? Which ones vanished? Are any expired?
- Save a screenshot or text dump of the cookie state before and after

**Step 3 — Cookie domain scoping check.**
- Your memory note flags the subdomain migration set cookies to `.hwy61labs.com` (leading dot — allows all subdomains)
- In DevTools → Cookies, look at the `Domain` column for each Supabase cookie. Verify leading-dot presence.
- If cookies are scoped to `hwy61labs.com` (no dot) instead of `.hwy61labs.com`, subdomain requests would see no auth cookies and bounce to `/login`. Exact symptom match.
- If this is the problem, the fix is in `lib/supabaseClient.ts` or wherever the browser client is initialized — ensure `cookieOptions.domain = ".hwy61labs.com"` is set.

**Step 4 — Single-tab test.**
- Close every prod tab except one
- Work in that single tab for 15-30 minutes
- See if bug reproduces
- If it DOES NOT reproduce with a single tab, the cause is a refresh-token race between tabs. Fix is to coordinate refresh or use a more recent `@supabase/ssr` that handles this natively.

**Step 5 — Google OAuth linked-provider path.**
- April 14 log flagged this as untested
- If other steps don't reveal the cause, check whether the account being affected has Google OAuth linked. If so, the refresh flow for linked providers may have a specific bug.

**Step 6 — Audit 4/16's supabaseAdmin commits.**
- Unlikely to affect session cookies (supabaseAdmin uses service role, no session persistence)
- But as a final ruleout, check `lib/supabaseAdmin.ts` and make sure `persistSession: false` is set in its createClient call
- Verify no cookie-setting side effects

### What NOT to Do

- Don't patch `middleware.ts` without a clear root cause. It's architecturally correct right now.
- Don't add a retry loop or "session refresh" button as a workaround. That papers over the real bug.
- Don't just add longer JWT expiry to hide the symptom — that makes eventual sessions stale rather than expired, which is worse.

### Deliverable

- Root cause identified in writing (even if fix is deferred)
- A fix shipped, OR
- A clear decision that the fix requires Tim's input / deeper work and the beta is paused until resolved

---

## Second Priority — Tim's List

### Check for Tim Email Reply

Tim owes a written reply to the April 15 status doc. Three open questions:

1. **Sponsor logo tint** — probably superseded by 4/16's work (preview + JPEGs now tint to text color, print PDF stays native color with documented helper text). Ok to archive unless Tim says otherwise.
2. **Venue-download billing gate caveat** — still open. Documented as a comment in `lib/localizer/billingGate.ts` above the `isAdminEmail` check. Needs ratification.
3. **Send to All Promoters bulk button** — still open. Backlog entry in `docs/BACKLOG.md` has all build constraints (Resend rate limits → serial sends with 200-500ms delay, idempotency, failure handling, reuse single-send route, mandatory confirmation modal).

### Get Written List of Remaining Test-Pass Items

From 4/16 session log:
> Tim also said he'd follow up by email on the April 15 status doc... Localizer test pass surfaced 5–6 issues total. Today's session fixed issue #1 (the share-link 404, which expanded into this 8-file public-share refactor). Other 4–5 items not yet triaged in writing — Drew had a verbal conversation with Tim during the test, will reconvene.

**Do not diagnose Tim's feedback from memory.** Get it in writing before building anything.

---

## Backlog Carried From Yesterday

If auth + Tim's items are both unblocked early, attack these in priority order:

1. **`lib/tourrouter/billingGate.ts`** — likely has the same RLS-bound Supabase client issue as the Localizer one we fixed 4/16. Single-file mechanical fix. Check before TourRouter launch.

2. **Print PDF logo tinting done right.** Pre-tint logos at upload time using sharp (already installed), save tinted variant to Supabase, render PDF fetches pre-tinted bytes. Zero sharp cost at render time. Needs design thinking on how to handle text-color variance (user might change their template's text color after uploading a logo — do we re-tint on text-color change? Pre-tint in multiple common colors? One decision point).

3. **Print PDF speed (5-8s → 24s).** Caused by `:wght@700` Google Fonts fetch. Cache TTF server-side, pre-bundle common weights, or find a lighter pattern.

4. **Cloudinary video overlay sponsor logo tinting.** One-line `e_colorize:100,co_rgb:${color}` addition in `buildSponsorLogoLayer` in `app/api/renders/generate/route.ts`.

5. **ESLint rule:** flag `supabaseServer()` imports in `app/v/**`, `app/advance/**`, `app/report/**` paths. Prevents future regression of the bug we fixed 4/16.

6. **Remaining expense tabs** (Transport, Food, Gear, Misc, Merch, Promo, Other). Follow Accommodation pattern. Mechanical, batchable.

7. **Tour-level Download All page** (`/v/tour/[tourId]`). Dedicated half-day session.

8. **Onboarding wizard completion** — blocked on Tim's wizard steps + demo tour seed data (Beta Test Band).

9. **Stripe restructure** — blocked on EIN (IRS still processing).

---

## Known Issues / Behavior

- **Print PDF takes 24 seconds** (was 5-8s pre-4/16). Caused by `:wght@700` Google Fonts fetch. Print PDF also now shows elapsed-time progress bar + "up to 30 seconds" message. Acceptable short-term, worth optimizing in backlog.
- **Sharp is installed** (from 4/16). Unused now. Keep installed — it's ready for pre-tint-at-upload approach.
- **Two old `.claude-code` binary paths** — the broken native install at `~/.local/bin/claude` was removed 4/16 late evening. Current working install is npm-global at `/usr/local/bin/claude` v2.1.112. If "auto-update failed" warning reappears on Claude Code startup, ignore it — manually run `sudo npm i -g @anthropic-ai/claude-code` when you want to update.

---

## Standing Rules (Reminder)

1. One file per Claude Code prompt. Never batch.
2. Always show diff before applying. Always confirm before proceeding.
3. When Claude Code asks for file edit permissions, select option 2 ("Yes, allow all edits during this session").
4. `calcTourFinancials()` is the single source of truth for financials.
5. `parseDate()` uses `new Date(year, month-1, day)`. Never `new Date(string)`.
6. Excel parsing: `raw:true cellDates:true`. Always.
7. Never use bash heredocs (smart-quote corruption risk).
8. Staged preview always — intake API never writes to DB directly.
9. RLS is the silent killer — always use `.select().maybeSingle()` after writes to catch silent RLS rejections.
10. Always run `npx tsc --noEmit` before committing.
11. `git pull` before starting on any machine.
12. Never write Tim status docs from memory. Always grep-verify against actual code.
13. zsh path quoting: always quote paths with square brackets for `git add`, `sed`, `cp`, `rm`. Safer: `git add -A` or `git add .` after verifying `git status`.

---

## End of Session Checklist

- [ ] Update `docs/SESSION_LOG.md` with today's entry at the bottom
- [ ] `git add docs/SESSION_LOG.md && git commit -m "docs: session log YYYY-MM-DD" && git push`
- [ ] If auth bug resolved: flag it clearly in the log with the root cause + fix commit SHA
- [ ] If auth bug still open: note what was ruled out, what evidence was gathered, what's next
- [ ] If switching machines: `git push` before leaving, `git pull` before starting
- [ ] Mac mini is read-only QA only, never pushes
