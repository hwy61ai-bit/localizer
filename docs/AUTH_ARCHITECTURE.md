# Auth Architecture

**Last updated:** April 22, 2026
**Status:** Working end-to-end. New-user signup confirmed functional as of commit `4c63d2f`.

This doc captures how authentication, org provisioning, and per-product access gating currently work in the Localizer / TourRouter codebase. Read this before making any changes to auth, `/auth/callback`, `ensureOrgExists`, `requireTourRouterAccess`, or anything that reads/writes the `orgs` or `org_members` tables.

---

## High-level flow

A user signs in or signs up through three layers:

1. **App-level beta invite gate** — `/login` page requires an invite code (or the TEAM LOGIN bypass button) before showing the email/Google sign-in form.
2. **Supabase Auth** — magic link or Google OAuth. Creates the `auth.users` row if the user is new.
3. **Post-auth bootstrap** — `/auth/callback` completes the session, then calls `ensureOrgExists` to create the user's org and membership row if they don't already have one.

After that, the user lands on `/dashboard` which loads their org and access flags.

---

## Key files

| Purpose | File |
|---|---|
| Login page (client) | `app/login/page.tsx` |
| Beta code validate endpoint | `app/api/beta/validate/route.ts` |
| Beta code claim endpoint | `app/api/beta/claim/route.ts` |
| Auth callback (exchange code, create org) | `app/auth/callback/route.ts` |
| Middleware (auth guard + session refresh + hostname routing) | `middleware.ts` |
| Admin email allowlist | `lib/auth/adminEmails.ts` |
| User-scoped Supabase server client | `lib/supabaseServer.ts` |
| Service-role Supabase client | `lib/supabaseAdmin.ts` |
| TourRouter access level resolver | `lib/tourrouter/billingGate.ts` |
| TourRouter access gate (API routes) | `lib/tourrouter/requireAccess.ts` |
| Cookie domain helper | `lib/cookieDomain.ts` |
| Dashboard page (server component) | `app/dashboard/page.tsx` |
| Artist Hub (renders product tabs) | `app/dashboard/artists/[artistId]/ArtistHubClient.tsx` |

---

## The login flow in detail

### 1. Beta invite gate (`app/login/page.tsx`)

The login page is a client component with two states:

- **Unverified:** shows an invite code input. On submit, POSTs to `/api/beta/validate` which checks `beta_invites` for a matching unclaimed code. On success, stores the code in `localStorage` as `beta_invite_code` and advances to the email form.
- **Verified:** shows email + Google sign-in form. Email triggers Supabase magic link; Google triggers OAuth.

There is a **TEAM LOGIN** button that bypasses the invite gate entirely and advances straight to the email form. This is a soft bypass — not email-restricted. Anyone who finds the button can click it. Adequate for a small private beta; not a hard security boundary.

### 2. Supabase Auth

Magic links redirect to `/auth/callback?code=...` (PKCE flow). Google OAuth also redirects to `/auth/callback`.

### 3. Auth callback (`app/auth/callback/route.ts`)

The callback does four things:

1. Constructs a server-side Supabase client with cookie handling via `@supabase/ssr`, scoped to the cookie domain from `getCookieDomain()`
2. Calls `exchangeCodeForSession(code)` (PKCE flow) or `verifyOtp(token_hash, type)` (legacy flow) to establish the session
3. If auth succeeded, calls `ensureOrgExists(supabase)` to provision the user's org
4. Redirects to `/dashboard` on success, or `/login?error=auth` / `/login?error=auth_setup` on failure

### 4. `ensureOrgExists` — the bootstrap

Creates an org + `org_members` row for a user who doesn't have one. Critical details:

- **Uses the user-scoped client only for `getUser()`** — to identify who the user is
- **Uses `supabaseAdmin()` for all DB reads and writes** — the membership check, orgs insert, and org_members insert
- Sets `localizer_enabled: true` on new org inserts (gives beta users Localizer access by default)
- Does NOT set `tourrouter_enabled` — relies on the column default of `false` (new users do not get TourRouter access by default)
- Fires a non-blocking POST to `/api/welcome` to send the welcome email

**Why service role?** See the "RLS cookie-propagation issue" section below.

### 5. Beta code claim (`app/components/PostHogProvider.tsx`)

After successful auth, `PostHogProvider` mounts on the client. On mount, it reads `beta_invite_code` from localStorage and POSTs to `/api/beta/claim` which marks the code as claimed by the user's ID.

**Known bug:** this happens when PostHogProvider mounts, not specifically after successful auth. If a user's magic link click fails partway through (PKCE error, etc.), the code may get claimed without the user actually completing signup. Workaround: reset the code manually in `beta_invites` via SQL.

---

## The RLS cookie-propagation issue

This is the single most important thing to understand about this codebase's auth state.

### Symptom

Immediately after signup (in `/auth/callback`) and in the first dashboard render after signup, a user-scoped Supabase client cannot reliably read from RLS-protected tables — even though `supabase.auth.getUser()` returns a valid user.

Specifically: `auth.uid()` evaluates to `null` inside Postgres RLS policies, so any policy that requires `auth.uid() IS NOT NULL` or `auth.uid() = something` fails silently (returns zero rows) or explicitly (violates RLS on insert).

### Root cause

When `exchangeCodeForSession(code)` runs in `/auth/callback` (a GET route handler), it writes auth cookies via the `setAll` callback. Those cookies are set on the outgoing response but **are not guaranteed to be attached to the subsequent database queries within the same request context.** This is a known Supabase SSR + Next.js App Router edge case — the session is established at the JS level (so `getUser()` works) but the auth context that Postgres RLS evaluates against doesn't propagate consistently within the same request.

### How we fixed it

Every code path that runs inside or immediately after `/auth/callback`, or on the first dashboard render after signup, uses `supabaseAdmin()` (service role, RLS bypassed) for its database operations. Specifically:

- `ensureOrgExists` — uses `supabaseAdmin()` for org_members check, orgs insert, org_members insert
- `app/dashboard/page.tsx` — uses `supabaseAdmin()` for the initial membership lookup, org lookup, artists read, and tours read

User identity is always verified first via `supabase.auth.getUser()` on the user-scoped client. The admin client is only used for reads/writes that are scoped to that verified user's own data.

### When to use user-scoped vs admin

**Use `supabaseServer()` (user-scoped, RLS-enforced) when:**
- Writing data on behalf of a user that genuinely needs RLS enforcement
- Reading data where the user's session has had time to settle (e.g. mid-session API routes, navigation after the initial render)
- In server actions that run in their own request context (e.g. `createArtist` in the dashboard page)

**Use `supabaseAdmin()` (service role, RLS bypassed) when:**
- Running inside or immediately after the auth callback
- Running in the first server component render of a new session (especially immediately after signup)
- Bootstrap operations where user identity has been verified via `getUser()` and you're reading/writing that user's own data
- Public token-based access paths (share links, public viewers) where the access credential is validated in application code

---

## Per-product access gating

Two boolean columns on `orgs` control product access:

- `localizer_enabled boolean NOT NULL DEFAULT false`
- `tourrouter_enabled boolean NOT NULL DEFAULT false`

All 12 existing test orgs were backfilled to `true` on both (preserving behavior before the gate existed).

### How the gate works

**For Localizer:** `app/dashboard/artists/[artistId]/ArtistHubClient.tsx` checks Localizer access via the org's `plan_status` / `trial_ends_at` / `isAdmin` fields. The `localizer_enabled` flag is not currently consulted in the UI path — it's set by `ensureOrgExists` but not read by any gate. This is intentional: the flag exists so future code can read it, but current Localizer access is gated by plan/trial/admin.

**For TourRouter:** 
1. `ArtistHubClient.tsx` calls `fetch("/api/tourrouter/tours")` and sets `hasTourRouter = resp.ok`
2. That endpoint calls `requireTourRouterAccess()` in `lib/tourrouter/requireAccess.ts`
3. Which calls `getTourRouterAccessLevel()` in `lib/tourrouter/billingGate.ts`
4. Which checks `org.tourrouter_enabled`. If false, returns `"none"`
5. `requireTourRouterAccess` converts `"none"` into a hard failure: `{ ok: false, reason: "no_tourrouter_access", status: 403 }`
6. `/api/tourrouter/tours` returns 403
7. `ArtistHubClient` sees `resp.ok = false`, sets `hasTourRouter = false`, hides the TourRouter tab

The gate is enforced at the API layer, not just the UI. A beta user who manually URL-hacks to `/api/tourrouter/*` gets 403.

### Admin bypass

`isAdminEmail()` in `lib/auth/adminEmails.ts` is the single source of truth for admin identity. Four addresses are currently admins:

- `hwy61ai@gmail.com` (Drew)
- `tentenpm@gmail.com` (Tim)
- `drew@hwy61labs.com` (Drew, new)
- `tim@hwy61labs.com` (Tim, new)

The two gmail addresses are scheduled for removal around May 6, 2026 (2-week soak after adding the hwy61labs.com addresses on April 22, 2026).

Admin bypass is checked at the top of `getTourRouterAccessLevel()` and in `ArtistHubClient.tsx`'s access check. Admins see everything regardless of flag state.

---

## Beta Access Control

### Invite infrastructure

`beta_invites` table in Supabase:

````
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
code text UNIQUE NOT NULL
created_at timestamptz DEFAULT now()
claimed_by uuid REFERENCES auth.users(id)
claimed_at timestamptz
notes text
````

RLS policies:
- `Anyone can read unclaimed invites` — SELECT where `claimed_by IS NULL`
- `Service role can update invites` — UPDATE (unconditional, used by `/api/beta/claim`)

Ten codes currently seeded: `HWY61-BETA-001` through `HWY61-BETA-010`, all unclaimed, batch note "Tim batch 1".

### Claim flow

1. User enters code on `/login` → POSTs to `/api/beta/validate`
2. Validate endpoint looks up code in `beta_invites` with `claimed_by IS NULL` (ilike match for case-insensitivity), returns `{ valid: true/false }`
3. On valid, login page stores code in `localStorage` as `beta_invite_code`
4. User signs up via magic link or Google OAuth
5. After `/auth/callback` succeeds, client-side `PostHogProvider` mounts, reads `beta_invite_code` from localStorage, POSTs to `/api/beta/claim` with `{ code, userId }`
6. Claim endpoint updates `beta_invites` row with `claimed_by = userId, claimed_at = now()`
7. localStorage entry is removed

### Beta user lifecycle

A new beta user's org is provisioned by `ensureOrgExists` with:
- `localizer_enabled = true` (explicit)
- `tourrouter_enabled = false` (column default)
- `plan = 'starter'`, `plan_status = 'active'` (default from orgs table)
- `trial_ends_at` = 7 days from signup

This gives them dashboard access (via `trialActive = true`) and Localizer access. TourRouter tab hidden in Artist Hub. Export routes return 403 if they somehow hit them.

### Resetting a code

If a beta code gets claimed accidentally (e.g. PKCE bug, failed signup) or needs reuse:

```sql
update beta_invites
set claimed_by = null, claimed_at = null
where code = 'HWY61-BETA-00X';
```

Optionally delete the orphan auth user:

```sql
delete from auth.users where email = 'their-email@example.com';
```

Cascade deletes should handle `org_members` and `orgs` rows if FKs are set up correctly.

---

## Middleware responsibilities

`middleware.ts` runs on every non-static request and does four things in order:

1. **Refreshes the Supabase session** via `getSession()` with cookie rotation (critical — do NOT use `getUser()` here, it's a network call that triggers Supabase `/token` rate limiting under load)
2. **Coming Soon gate** — if `COMING_SOON=true`, redirects marketing routes to `/coming-soon` unless the user is authenticated
3. **Hostname-based rewriting** — `localizer.hwy61labs.com` rewrites to `/dashboard`, `tourrouter.hwy61labs.com` rewrites to `/dashboard/routing`, etc.
4. **Auth guard** — any `/dashboard/*` request without a session gets redirected to `/login`

Cookie domain is set via `getCookieDomain()` to scope cookies to `.hwy61labs.com` in production, `undefined` in local dev.

---

## Rules for Future Changes

These rules prevent re-hitting the bugs we fixed on April 22, 2026.

### 1. Never use `supabaseServer()` (user-scoped) for bootstrap reads in server components

If a server component runs on the first render after signup and reads from an RLS-protected table (`orgs`, `org_members`, `artists`, `tours`, anything else user-scoped), use `supabaseAdmin()` for those reads. Verify user identity first via `supabase.auth.getUser()` on the user-scoped client, then switch to admin for the DB operations.

Specifically: **any time you see a pattern of "just signed up" or "just logged in, about to render the first page," assume user-scoped RLS will fail unpredictably.**

### 2. Never use `supabaseServer()` for DB writes inside `/auth/callback`

Same issue as rule 1, but worse because RLS insert failures are hard errors, not silent zero-row returns. Use `supabaseAdmin()` for all writes in the callback and any downstream functions it calls (like `ensureOrgExists`).

### 3. Always prefer `.maybeSingle()` over `.single()`

`.single()` throws on zero rows. `.maybeSingle()` returns null. Handle the null case explicitly with a redirect or error response. This is a standing rule across the codebase — see `CLAUDE.md`.

### 4. Always check writes with `.select().maybeSingle()` after insert

RLS silent failures return `error: null` with zero rows written. Add `.select().maybeSingle()` after any write on a user-scoped client to verify the row actually persisted, and return a 500 if it didn't. Service-role writes are less vulnerable to this but the pattern is still good practice.

### 5. Admin identity goes through `isAdminEmail()`, never hardcode emails

`lib/auth/adminEmails.ts` is the single source of truth. If you see hardcoded `hwy61ai@gmail.com` or similar anywhere, replace with `isAdminEmail(user.email)`.

### 6. The TourRouter access gate is `tourrouter_enabled`, not plan-based

Do not gate TourRouter UI visibility or route access on plan status. Gate on `tourrouter_enabled` via `requireTourRouterAccess()`. Plan status is for billing, which is a separate concern (and pending Stripe restructure anyway).

### 7. Server components cannot pass functions to client component props

If you see an `onClick` or `onAction` prop being passed from a server component to a client component, the render will throw. Use server actions via `<form action={serverAction}>` for interactive empty states and similar patterns, or convert the parent to a client component if real interactivity is needed.

### 8. Do not add more symptom fixes; fix root cause eventually

The four service-role workarounds in `ensureOrgExists` / `app/dashboard/page.tsx` / `billingGate.ts` are symptom fixes for the RLS cookie-propagation issue. The root fix is one of:
- A proper middleware session refresh that guarantees cookie consistency before downstream renders
- An architecture change that does all authenticated user reads via admin client after identity verification
- An upstream Supabase SSR fix (wait for it)

If you hit a new "user-scoped client can't read RLS-protected data after signup" bug, consider whether it's time to do the root fix instead of adding a fifth symptom patch.

---

## Known bugs (documented, not yet fixed)

1. **Beta code claim timing** — `/api/beta/claim` fires from `PostHogProvider` on mount, not after confirmed auth. Users whose magic link fails can burn their code without completing signup. Fix: move claim into `/auth/callback` post-`ensureOrgExists`.

2. **Dashboard page has unused `HwButton` import** — minor lint noise, pre-existing.

3. **TEAM LOGIN button is a soft bypass** — any user who finds the button skips the invite gate. Fine for small private beta, not acceptable for public launch with sensitive gating.

4. **`ArtistHubClient.tsx` Localizer access check uses plan_status logic, not `localizer_enabled`** — the new column is set on org creation but not consulted in the UI. Harmless today (both paths grant access to all trial users), but the intent of the column is for future gating.

---

## Historical context (commits that shaped this)

| Commit | What it did |
|---|---|
| `9f88d03` | Moved `ensureOrgExists` into `/auth/callback`. Introduced the latent RLS bug that surfaced April 22. |
| `0ea670c` | Scoped server-side auth cookies to `.hwy61labs.com`. |
| `cb7b734` | Added `drew@hwy61labs.com` and `tim@hwy61labs.com` to `adminEmails.ts`. |
| `4711b5a` | Added `localizer_enabled` and `tourrouter_enabled` columns. Modified `billingGate.ts` and `requireAccess.ts` to enforce the TourRouter gate. Added `localizer_enabled: true` to new org inserts. |
| `1508a86` | First service-role fix — `ensureOrgExists` now uses `supabaseAdmin()` for DB ops. |
| `0406685` | Second service-role fix — dashboard page uses `supabaseAdmin()` for membership + org bootstrap reads. |
| `103bbb1` | Third service-role fix — dashboard page uses `supabaseAdmin()` for artists + tours reads. |
| `4c63d2f` | Replaced `HwEmptyState` (client component with function prop) with a plain form to fix the server/client boundary violation that blocked new-user dashboard rendering. |
