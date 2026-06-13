# Runbook: Comp tony@keeledscales.com to Agency (pending his first login)

**Created June 12, 2026** — per Tim, tony@keeledscales.com gets full (Agency) Localizer access, comped (no Stripe payment). He had NOT signed up as of June 12. Rick (rick@ninemilerecords.com) was comped the same day and is done; this runbook is Tony's half, to run once he logs in.

## How comping works (why two columns)
The billing gate (`lib/localizer/billingGate.ts`) reads `localizer_plan_status` for ACCESS; the `localizer_plan` string only drives the artist/tour LIMITS. So an Agency comp sets BOTH:
- `localizer_plan = 'agency'` -> 12 artists, unlimited tours
- `localizer_plan_status = 'active'` -> unlocks downloads, generation, venue links

No Stripe customer/subscription is involved (this is a manual comp). If Tony later subscribes via Stripe, the webhook overwrites these to whatever he buys — that's correct.

## Step 1 — Tony signs in (he does this)
Tim sends Tony to https://hwy61labs.com/login to sign in once (magic link). First login auto-creates his org + org_members rows with a fresh 7-day trial (so he has access immediately; the comp can follow anytime).

## Step 2 — Find his org (run in Supabase SQL Editor)

    SELECT om.org_id, o.owner_email, o.localizer_plan, o.localizer_plan_status, o.stripe_subscription_id
    FROM org_members om
    JOIN orgs o ON o.id = om.org_id
    WHERE om.user_id = (SELECT id FROM auth.users WHERE email = 'tony@keeledscales.com');

- If this returns NO ROWS -> Tony hasn't completed sign-in yet. Stop; wait.
- If stripe_subscription_id is NOT null -> he has a live paid sub; STOP and check with Tim before comping (webhook conflict).
- Otherwise -> copy the org_id and continue.

## Step 3 — Comp him (run in Supabase SQL Editor; replace TONY_ORG_ID)

    UPDATE public.orgs
    SET localizer_plan = 'agency',
        localizer_plan_status = 'active',
        trial_ends_at = NULL
    WHERE id = 'TONY_ORG_ID';

## Step 4 — Verify (expect agency / active / null)

    SELECT id, owner_email, localizer_plan, localizer_plan_status, trial_ends_at, stripe_subscription_id
    FROM public.orgs
    WHERE id = 'TONY_ORG_ID';

Tony gets Agency access on his next app load — no re-login needed.

## To reverse a comp later (either user)
Set `localizer_plan_status = NULL` (and optionally clear `localizer_plan`). No Stripe cleanup needed — there's no subscription.

## Audit note
Neither comp has a comped_by record in the DB (no such column). This file IS the audit trail: rick@ninemilerecords.com (org f5dfd115-ebe5-43b1-bb3d-19bc06532457) and tony@keeledscales.com, both Agency/active comped June 12, 2026 per Tim, no Stripe payment.
