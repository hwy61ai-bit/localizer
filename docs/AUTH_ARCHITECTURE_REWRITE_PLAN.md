# AUTH_ARCHITECTURE.md Rewrite Plan

**Created:** 2026-04-28 by Drew (in conversation with Claude in claude.ai)

**Purpose:** Capture the structural analysis and pre-drafted replacement prose for the upcoming rewrite of `docs/AUTH_ARCHITECTURE.md`. Significant portions of that doc were invalidated by the 2026-04-28 beta-readiness auth work (commits `093026f`, `c6a0bfc`, `4d0b74f`). This file preserves the analysis and proposed replacement prose so the rewrite can proceed from durable artifacts rather than regenerating context from scratch.

**How to use this file in the rewrite session:**

1. Open `docs/AUTH_ARCHITECTURE.md` in TextEdit alongside this file.
2. Walk each section listed in Part 2 below.
3. For each section, find the matching block in the source doc, delete the obsolete prose, paste the replacement prose.
4. Verify line numbers and adjacent prose haven't drifted (file may have grown since this plan was written).
5. Update the "Last updated" header line in AUTH_ARCHITECTURE.md to the rewrite-session date.
6. Run `git diff docs/AUTH_ARCHITECTURE.md` for a final review before committing.

---

## Part 1 — Claude Code's structural analysis (2026-04-28 session)

Section structure of the original `docs/AUTH_ARCHITECTURE.md` (38 H2/H3 headings total):

    # Auth Architecture                                           (line 1)
      ## High-level flow                                          (line 10)
      ## Key files                                                (line 22)
      ## The login flow in detail                                 (line 42)
        ### 1. Beta invite gate (app/login/page.tsx)              (line 44)
        ### 2. Supabase Auth                                      (line 53)
        ### 3. Auth callback (app/auth/callback/route.ts)         (line 57)
        ### 4. ensureOrgExists — the bootstrap                    (line 66)
        ### 5. Beta code claim (app/components/PostHogProvider)   (line 78)
      ## The RLS cookie-propagation issue                         (line 86)
        ### Symptom / Root cause / How we fixed it /
            When to use user-scoped vs admin                      (lines 90-109)
      ## Per-product access gating                                (line 124)
        ### How the gate works                                    (line 133)
        ### Admin bypass                                          (line 148)
      ## Beta Access Control                                      (line 163)
        ### Invite infrastructure / Claim flow /
            Beta user lifecycle / Resetting a code                (lines 165-204)
      ## Middleware responsibilities                              (line 224)
      ## Rules for Future Changes (8 numbered subsections)        (line 237)
      ## Known bugs (documented, not yet fixed)                   (line 282)
      ## Historical context (commits that shaped this)            (line 294)

### Mapping of obsolete content to sections

1. **Beta invite flow / `beta_invites` table / HWY61-BETA-001..010 codes** — High-level flow step 1 (line 14); §1. Beta invite gate (44-51); §5. Beta code claim (78-82); entire §Beta Access Control (163-220, codes named at 182); Known bugs items 1 and 3 (284, 288); Key files rows for `/api/beta/validate` and `/api/beta/claim` (27-28).

2. **Magic-link flow / PKCE / "session expired"** — §2. Supabase Auth (53-55) explicitly says "PKCE flow" and labels `verifyOtp` as "legacy"; §3. Auth callback step 2 (line 62) same PKCE-as-default framing. "Session expired" is not mentioned anywhere in the doc.

3. **`ensureOrgExists` (inline vs shared)** — High-level flow step 3 (16); §4. ensureOrgExists — the bootstrap (66-76); referenced in §Beta user lifecycle (196-202); referenced in Rules 1, 2, 8 (243-278); Historical context row 1508a86 (302). Doc currently treats `ensureOrgExists` as inline-in-callback — file path not specified beyond it being called from the callback.

4. **Cross-browser email click / PKCE limitation** — Not documented anywhere. The PKCE-cross-browser failure mode (verifier in same-browser localStorage) is silently absent.

5. **Org provisioning fields** — §4. ensureOrgExists (72-74) names `localizer_enabled: true` and "does NOT set tourrouter_enabled"; §Beta user lifecycle (196-200) names `plan='starter'`, `plan_status='active'`, `trial_ends_at`. Does not mention `plan='pro'`, `localizer_plan='agency'`, `localizer_plan_status='active'` (the fields added in 093026f).

6. **Skip-to-login / "SIGN IN" bypass** — §1. Beta invite gate (51) — "TEAM LOGIN button that bypasses the invite gate"; Known bugs item 3 (288) — "TEAM LOGIN button is a soft bypass". Note: the doc calls it "TEAM LOGIN" but the actual button text in the code that was removed was "SIGN IN" — the doc was already slightly stale on this point.

7. **Supabase email template configuration** — Not documented. No mention of `{{ .ConfirmationURL }}` vs `{{ .Token }}` / `{{ .TokenHash }}`, dashboard auth template, or the interaction between client `flowType` and template-emitted URL shape.

8. **Login page UI flow** — §1. Beta invite gate (44-51) names two-state UI (Unverified/Verified), invite-code input, TEAM LOGIN button, advance to email/Google form. Every concrete UX detail is now obsolete.

### Order of magnitude

Roughly 40% of the doc needs rewriting (most concentrated in `## Beta Access Control` and the `## The login flow in detail` subsections); roughly 10% needs minor tweaks; roughly 50% can stay as-is.

---

## Part 2 — Pre-drafted replacement prose

The drafts below are intended to be dropped into `docs/AUTH_ARCHITECTURE.md` to replace the corresponding obsolete sections. They are written in the existing doc's style (concrete file paths, behavior-focused, terse). Verify line numbers and existing surrounding prose before slotting them in — the file may have grown since this plan was written.

---

### REPLACEMENT for § The login flow in detail / 1. Beta invite gate (lines 44-51)

Rename the heading from "Beta invite gate" to "Password gate."

> ### 1. Password gate (`app/login/page.tsx`)
>
> Before any Supabase auth UI is shown, the login page renders a single password field labeled "Beta Access Password." On submit, the page POSTs to `/api/beta/validate` which compares the submitted value against `process.env.BETA_GATE_PASSWORD` using `crypto.timingSafeEqual`.
>
> On successful validation, the page advances client-side to the email/Google sign-in form. There is no localStorage write — the gated state lives only in the page's React state for this session. Each fresh browser session re-prompts.
>
> There is no bypass. The previous "SIGN IN" / "TEAM LOGIN" button has been removed; admins re-enter the password each session like any other user.
>
> Password rotation: change `BETA_GATE_PASSWORD` env var in Vercel (Production, Preview, Development) and redeploy. All users (admins and beta testers) must enter the new password to sign in next time.

---

### REPLACEMENT for § The login flow in detail / 2. Supabase Auth (lines 53-55)

> ### 2. Supabase Auth
>
> The browser Supabase client (`lib/supabaseClient.ts`) is configured with `flowType: "implicit"`. In practice this controls Google OAuth's return path (URL fragment with `#access_token=...`) and is mostly dormant for the magic-link path.
>
> Magic links arrive via a customized Supabase email template that hand-builds the URL using `{{ .TokenHash }}` and `{{ .SiteURL }}`. The relevant template lives in the Supabase dashboard under Authentication → Email Templates → Confirm signup. Its body emits links of the form:
>
>     {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup
>
> This bypasses Supabase's `/verify` redirect endpoint and avoids PKCE entirely. The emitted link goes straight to the app's auth callback regardless of which browser the user clicks it from. Cross-browser email clicks (submit form in Chrome, click email in Safari) work because no client-stored verifier is required.
>
> Future template changes should preserve the `?token_hash=...&type=...` URL shape. If the template is ever reset to `{{ .ConfirmationURL }}`, magic links revert to PKCE behavior and cross-browser clicks break.

---

### REPLACEMENT for § The login flow in detail / 3. Auth callback (lines 57-65)

> ### 3. Auth callback (`app/auth/callback/route.ts`)
>
> The callback route handles two URL shapes:
>
> 1. **`?token_hash=...&type=...`** (primary path) — produced by the customized email template for magic links. Handled by `supabase.auth.verifyOtp({ token_hash, type })`. No client-side verifier required, so works cross-browser.
>
> 2. **`?code=...`** (fallback) — produced by any provider still using PKCE code exchange. Handled by `supabase.auth.exchangeCodeForSession(code)`. Requires the code verifier to be present in the same browser's storage as where the auth flow started.
>
> After session establishment, the callback calls `ensureOrgExists(supabase)` (see §4) and then redirects to `/dashboard`.
>
> Note: Google OAuth with `flowType: "implicit"` returns `#access_token=...` in the URL fragment, which the server callback can't see (fragments aren't sent to servers). The fragment-handling path lives in `app/login/page.tsx` — a `useEffect` that detects the hash on mount, suppresses any error banner, gives `detectSessionInUrl` a moment to parse the fragment, then pushes to `/dashboard`. The dashboard's defensive `ensureOrgExists` call (see §4) handles bootstrap for users who arrive via this path.

---

### REPLACEMENT for § The login flow in detail / 4. ensureOrgExists (lines 66-76)

> ### 4. ensureOrgExists — the bootstrap
>
> `lib/auth/ensureOrgExists.ts` exports a single function called from two places:
>
> 1. `app/auth/callback/route.ts` — runs after session establishment for email/magic-link sign-ins and any OAuth provider that completes via the `?code=...` callback.
>
> 2. `app/dashboard/page.tsx` — runs defensively at the top of dashboard render. Defends against any session-bearing path that reaches the dashboard without going through the callback (currently only the OAuth implicit-fragment path, but extensible).
>
> Behavior:
>
> - Looks up `org_members` by `auth.uid()`. If a row exists, returns silently.
> - Otherwise creates a new `orgs` row plus an `org_members` row in a single RLS-guarded admin write, then triggers a non-blocking welcome email via `/api/welcome`.
>
> New `orgs` rows are created with these fields explicitly set:
>
>     {
>       id:                    <new uuid>,
>       name:                  "My Workspace",
>       owner_email:           <user.email>,
>       plan:                  "pro",                  // beta-temp; see PRE-LAUNCH NOTE
>       localizer_plan:        "agency",               // beta-temp; see PRE-LAUNCH NOTE
>       localizer_plan_status: "active",               // beta-temp; see PRE-LAUNCH NOTE
>       trial_ends_at:         <now + 7 days>,
>       localizer_enabled:     true,
>     }
>
> `tourrouter_enabled` is intentionally not set — Localizer-only beta accounts should not see TourRouter.
>
> **PRE-LAUNCH NOTE:** the three beta-temp lines (`plan`, `localizer_plan`, `localizer_plan_status`) auto-grant active Localizer Agency access to any new signup. This was added in commit `093026f` to unblock self-serve beta onboarding without per-user manual SQL. **Before flipping `COMING_SOON=false` for public launch, those three lines must be removed** (or gated behind a `BETA_AUTO_ACTIVE` env flag). Otherwise public signups will silently get free Localizer Agency access.

---

### REPLACEMENT for § The login flow in detail / 5. Beta code claim (lines 78-82)

> ### 5. Beta code claim — REMOVED
>
> As of 2026-04-28 (commit `4d0b74f`), `app/login/page.tsx` no longer writes a beta-invite code to localStorage, so PostHogProvider's claim block (which listened for that value and POSTed to `/api/beta/claim`) never fires. Both the claim block and the `/api/beta/claim` route are dead code pending deletion. The `beta_invites` table is also no longer queried; it can be dropped after the dead-code cleanup.
>
> Beta access is now gated by a single shared password — see §1 — not by per-user invite codes.

---

### REPLACEMENT for ## Beta Access Control (entire section, lines 163-220)

> ## Beta Access Control
>
> Beta access is gated by a single shared password held in the `BETA_GATE_PASSWORD` environment variable, validated server-side by `/api/beta/validate` using `crypto.timingSafeEqual`. The same password is used by Drew, Tim, and all beta testers. Tim distributes the password to beta testers out of band (email or DM).
>
> ### Lifecycle
>
> 1. Tester loads `https://www.hwy61labs.com/login`. Sees the password field.
> 2. Tester enters the shared password.
> 3. `/api/beta/validate` returns `{ ok: true }`.
> 4. Login page advances client-side to the email/Google sign-in form.
> 5. Tester submits email; magic link is generated by Supabase using the customized Confirm signup template (see §2).
> 6. Tester clicks the link in any browser. `/auth/callback?token_hash=...&type=signup` resolves the session via `verifyOtp`.
> 7. `ensureOrgExists` creates a new org with active Localizer status (see §4 for fields and pre-launch reversal note).
> 8. Tester lands on `/dashboard`. The Localizer-beta welcome view in `app/components/OnboardingWizard.tsx` fires for first-time users with zero artists.
>
> ### Rotation
>
> Change `BETA_GATE_PASSWORD` in Vercel (Production, Preview, Development) and redeploy. All testers will need the new password the next time they sign in. Already-authenticated sessions are unaffected — the gate only protects the unauthenticated sign-in path.
>
> ### What's still in the database
>
> The `beta_invites` table (and the seeded codes HWY61-BETA-001 through HWY61-BETA-010) still exists in Supabase but is no longer queried by any production code path. The table can be dropped after the dead-code cleanup of `/api/beta/claim` lands.
>
> ### Rate limiting (DEFERRED)
>
> `/api/beta/validate` is not currently rate-limited. A single shared password is brute-forceable without one. Spec for adding rate limiting (Upstash Redis tier) lives in `docs/BACKLOG.md` as Unit D from the April 9 freemium plan.

---

## Part 3 — Minor updates (one-line tweaks within otherwise-correct sections)

### § Header metadata (lines 3-4)

Update the "Last updated" date and the most-recent-commit reference. Replace the current header block with:

> **Last updated:** _(rewrite-session date)_
>
> **Most recent commit shaping current behavior:** `4d0b74f` (shared password gate, 2026-04-28)

### § High-level flow / step 1 (line 14)

Change "invite code (or the TEAM LOGIN bypass button)" — or whatever the current phrasing is — to "shared beta password."

### § Key files (lines 27-28)

- `/api/beta/validate` row: change description to "env-var password gate; validates submitted value against `BETA_GATE_PASSWORD` using `crypto.timingSafeEqual`."
- `/api/beta/claim` row: mark as "DEPRECATED — dead code as of 2026-04-28; pending deletion. No production caller."

Add a new row for `lib/auth/ensureOrgExists.ts` with description "Shared bootstrap helper. Idempotent. Called from auth callback and dashboard render."

### § The RLS cookie-propagation issue / How we fixed it (lines 100-108)

Add one sentence noting that the dashboard page now also calls `ensureOrgExists`, which itself uses `supabaseAdmin()` for its bootstrap writes. The RLS cookie propagation issue described in this section applies to the user-scoped client; the admin client used by `ensureOrgExists` bypasses RLS entirely, which is why the bootstrap writes work even when the user-scoped client doesn't yet have its session cookies fully propagated.

### § Known bugs

- **Remove item 1** (claim timing) — fixed by removing the localStorage write in `4d0b74f`.
- **Remove item 3** (TEAM LOGIN bypass) — fixed by removing the `skipToLogin` function in `4d0b74f`.
- **Items 2 (HwButton import) and 4 (ArtistHubClient localizer_enabled unused) remain** — keep their existing prose.

**Add a new item:**

> ### Dead `/api/beta/claim` endpoint and `beta_invites` table
>
> The `/api/beta/claim` route still exists and is registered, but no caller exists in the production code path as of 2026-04-28. PostHogProvider's claim block at approximately `app/components/PostHogProvider.tsx:40-50` listens for a localStorage key (`beta_invite_code`) that the login page no longer writes. The `beta_invites` Supabase table is also no longer queried. Cleanup: delete the claim block, delete the route file, drop the table. Estimated 15 minutes single session.

**Add a new item:**

> ### Mixed naming in `app/login/page.tsx`
>
> The shared-password gate state mixes new naming (`accessPassword`) with legacy invite-flow naming (`inviteVerified`, `inviteLoading`, `inviteError`, `verifyInvite` function). Pure cosmetic inconsistency, no behavioral effect. Cleanup is a find-replace pass, ~5 minutes.

### § Historical context (line 294)

Append three rows in the existing format. Adjust column format to match what's already in the doc:

| Commit | Date | Effect |
|---|---|---|
| `093026f` | 2026-04-28 | ensureOrgExists provisions new orgs with active Localizer status (beta-temp; see §4 PRE-LAUNCH NOTE) |
| `c6a0bfc` | 2026-04-28 | Magic-link flow refactor: client `flowType: "implicit"` + login hash drain for OAuth + ensureOrgExists extraction with second call site on dashboard |
| `4d0b74f` | 2026-04-28 | Shared password gate replaces beta_invites; skipToLogin button removed |

---

## Part 4 — Sections that stay as-is

These sections were verified to still be architecturally accurate after the 2026-04-28 changes. No edits required:

- § High-level flow / step 2 ("magic link or Google OAuth") — generic enough to remain accurate.
- § High-level flow / step 3 — `ensureOrgExists` is still called from `/auth/callback`; it's just no longer the only call site. The step's prose at the existing level of detail still describes what happens.
- § Per-product access gating (entire section, including subsections "How the gate works" and "Admin bypass"). Architecture untouched.
- § The RLS cookie-propagation issue / Symptom, Root cause, and "When to use user-scoped vs admin" subsections. The fix-related subsection gets the one-line addition noted in Part 3.
- § Middleware responsibilities. No recent changes here.
- § Rules for Future Changes (all 8 rules still hold).

---

## Part 5 — Verification checklist for the rewrite session

Before committing the rewrite, verify each of the following with the actual code on disk:

1. `lib/auth/ensureOrgExists.ts` exists and exports `ensureOrgExists(supabase)`.
2. `app/dashboard/page.tsx` calls `ensureOrgExists` near the top of its render path.
3. `app/auth/callback/route.ts` calls `ensureOrgExists` after session establishment.
4. `app/api/beta/validate/route.ts` uses `crypto.timingSafeEqual` against `process.env.BETA_GATE_PASSWORD`.
5. `app/login/page.tsx` no longer contains a `skipToLogin` function or any `localStorage.setItem("beta_invite_code", ...)` call.
6. The Supabase Confirm signup email template emits `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup` (or similar). Verify in the Supabase dashboard, not in code.
7. The `BETA_GATE_PASSWORD` env var is set in Vercel for all three scopes (Production, Preview, Development) and in `.env.local`.

Any item that doesn't match what's on disk indicates that the doc rewrite needs to reflect a different reality than this plan assumes. Pause and re-investigate before pasting.

---

## Part 6 — Estimated time for the rewrite session

- 5 minutes: open both files, read this plan top to bottom.
- 10 minutes: Part 5 verification checklist.
- 30-40 minutes: walk Part 2 + Part 3 sections, paste replacements, adjust line-number-dependent prose for any drift.
- 5 minutes: final `git diff docs/AUTH_ARCHITECTURE.md` review.
- 5 minutes: commit and push.

Total: 60-75 minutes if no surprises. Add 30 minutes of contingency for unexpected drift in the source doc or for adjacent prose that needs harmonizing with the new sections.
