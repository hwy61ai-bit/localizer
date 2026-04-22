# Session Kickoff — April 22, 2026

## Starting state

Yesterday shipped four commits plus email infrastructure migration. Main is at `845991b` (docs: session log 2026-04-21).

### Commits shipped April 21
- `869a83b` — feat(template editor): social UI overlay zone warning on tiktok tab
- `9eceafd` — fix(save-urls): soft-fail verification on events render_status update
- `ba31e66` — fix(fonts): upsert custom_fonts on upload to prevent duplicate rows
- `29d5d05` — fix(renders): remove weekday from short date format across all renderers
- `845991b` — docs: session log 2026-04-21

### DB state changes yesterday
- Added UNIQUE constraint `custom_fonts_org_id_font_name_unique` on `custom_fonts (org_id, font_name)`
- Removed stale duplicate row for `BullandRegular-d91g6` in `custom_fonts`

### Email infrastructure — fully migrated yesterday
- Google Workspace live with 2 seats ($12/mo)
- `tim@hwy61labs.com` + `drew@hwy61labs.com` primary mailboxes
- 2 groups (`support@`, `team@`) + 8 aliases (Tim gets `hello/billing/beta/press/privacy/legal/dmca`, Drew gets `security`)
- SPF merged: `v=spf1 include:_spf.google.com include:amazonses.com ~all`
- DMARC reporting to both founders
- Google DKIM active at `google._domainkey`
- Resend continues to work (amazonses.com preserved in SPF)
- ImprovMX fully decommissioned
- Mail-tester score 9.4/10

### Audit freshness findings
The April 20 Silent-RLS Update audit's §5 HIGH-tier items 1, 2, 3, 4, 5, 7 were all verified closed by yesterday's `b1ee117`/`692cb47`/`851606f` wave (plus today's `9eceafd` incidental). Only §5 item 6 (billing webhooks) remains, and it is today's primary target — deferred from yesterday deliberately because the EIN clearing unblocked the Stripe restructure, and patching the old webhook handlers would be sunk work ahead of the restructure.

---

## Today's primary target — Stripe webhook restructure

The silent-RLS audit's last HIGH-tier item is billing webhooks. Six sites across `app/api/stripe/webhook/route.ts` and `app/api/billing/webhook/route.ts`. Yesterday's recon revealed:

- **Two webhook routes exist with overlapping event coverage and different schema writes.** File A writes `subscription_status`. File B writes `plan` + `plan_status`. Neither alone puts an org into complete billing state.
- **Zero real paying customers have ever flowed through.** All 12 currently-billing-active test orgs have `stripe_customer_id = null` — they were hand-set during Unit A/B/C freemium testing.
- **File B has an idempotency guard that defeats the audit's recommended fix.** Inserting into `stripe_events` BEFORE handler completion means Stripe retries short-circuit as "already processed" — the whole "return 500 to get Stripe to retry" premise is defeated.
- **File B's B1 site has the "email after state-flip" anti-pattern.** Resend notification to hwy61ai@gmail.com fires after a possibly-silently-failed update.

**Because zero real customers exist AND EIN cleared AND pricing may change AND webhook handlers need restructuring — the right move is NOT to patch the old handlers, but to rewrite the live handler fresh with the silent-update protection baked in.**

### Phase-by-phase plan

#### Phase 1 — Stripe dashboard webhook endpoints check (2 min)

Go to `dashboard.stripe.com/webhooks`. Report:
- How many endpoint entries exist
- The URL of each (expecting `/api/stripe/webhook` and/or `/api/billing/webhook`)
- Which events each listens to

This resolves "File A live vs File B live vs both" in 2 minutes. Do NOT skip this step — everything downstream hinges on it.

#### Phase 2 — orgs schema column inventory (5 min)

Run in Supabase SQL Editor:

```sql
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'orgs'
  and (column_name like 'stripe_%'
       or column_name like '%plan%'
       or column_name like '%subscription%'
       or column_name in ('owner_email'))
order by column_name;
```

Goal: understand which billing columns currently exist on `orgs` vs which need to be added or renamed for the new product lineup.

Known expected columns: `owner_email`, `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`, `plan`, `plan_status`, `localizer_plan`, `localizer_plan_status`, `bundle_plan`, `bundle_plan_status`.

#### Phase 3 — Confirm pricing with Tim (before touching code)

Lock prices before building. Per April 20 state, the Stripe dashboard shows:
- TourRouter Standalone ($29/mo)
- Localizer Agency (2 prices)
- Localizer Pro (2 prices)
- Localizer Basic (2 prices)
- Agency (2 prices)
- Pro (2 prices)

Open questions:
- Are these the final prices? Any changes since EIN came through?
- Do we need to rename or restructure any products for the restructure?
- Basic/Pro/Agency per-artist limits (1/5/12 per memory) — still current?
- Annual plan support — same as monthly, just different price IDs?

Do NOT start Phase 4 until pricing is locked. Mid-build price changes are expensive.

#### Phase 4 — Map Stripe products to DB column writes (30-60 min)

Deliverable: a table that says "for each Stripe event and product combination, what columns get written to what values."

Write this in Claude.ai (not Claude Code) with the pricing model doc and Phase 2 schema dump open. Output goes into this file as an updated Phase 4 section so tomorrow's-Future-Drew has the plan.

#### Phase 5 — Delete the dead webhook file (5 min)

Based on Phase 1's verdict, one of `app/api/stripe/webhook/route.ts` or `app/api/billing/webhook/route.ts` is dead. Delete it.

Single commit. Message: `cleanup(webhook): delete dead [file] route — [justification]`.

#### Phase 6 — Rewrite the live webhook fresh (60-90 min)

Bakes in from the start:
- `.select().maybeSingle()` + null-data 500 on every update (silent-RLS protection by construction)
- Correct idempotency ordering: `stripe_events` insert AFTER successful handler completion, not before
- DB write BEFORE email send (Pattern A anti-pattern eliminated)
- Distinct log prefix per site for greppable Vercel log signal
- Event-type-specific handling per the Phase 4 mapping

Single commit. Message: `feat(webhook): rewrite Stripe webhook for post-EIN product structure`.

#### Phase 7 — Schema cleanup in Supabase SQL Editor (20 min)

Drop or rename legacy columns surfaced in Phase 2 as no-longer-used. Likely candidates based on April 20 data:
- `plan = "starter"` values on 12 test orgs (migrate to null or to whichever new canonical free-tier value)
- `subscription_status` if File A turns out to be the dead route

Manual SQL per standing rule. Paste all blocks into a separate clearly-labeled code block in the session log for audit trail.

#### Phase 8 — Test with Stripe CLI against localhost (30 min)

```bash
stripe login  # if not already
stripe listen --forward-to localhost:3000/api/billing/webhook  # or whatever is live
```

Then in separate terminal:
```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

For each, verify the `orgs` row in Supabase ends up in the expected state. This is where real bugs surface.

#### Phase 9 — Deploy + prod smoke test (15 min)

After Phase 6-8 green, push. Buy a Basic plan with a real card on prod. Immediately refund. Confirm DB state is correct across the full lifecycle.

### Total estimate
4-5 hours with normal debugging overhead.

### Critical rules reminder
- Manual SQL only via Supabase SQL Editor — never migration files
- `tsc --noEmit` after every code change
- One file per Claude Code prompt
- Heredoc with single quotes for multi-line commit messages
- Quote bracketed paths for `git add`
- Recon-first before fix for anything with caller ambiguity
- `git push` (Vercel auto-deploys), not `npx vercel --prod`

---

## Secondary target — Phase 8 platform updates (if Stripe wraps early)

Not urgent, but banking these closes the email migration loose ends:

1. Add `tim@hwy61labs.com` and `drew@hwy61labs.com` to `lib/auth/adminEmails.ts` (Option A from yesterday — keep existing gmails alongside for 2 weeks, clean up later). Single-file commit, ~5 min.

2. Update Stripe account billing email to `billing@hwy61labs.com` (Stripe dashboard → account settings → billing contact). Ties in directly with Phase 4's Stripe work.

3. Confirm ToS and Privacy Policy docs already reference `privacy@hwy61labs.com` and `dmca@hwy61labs.com` correctly. Docs are `.docx` files in the project, not the repo — visual check only.

4. (Low priority) Set Supabase auth sender to a clean `auth@hwy61labs.com` or `noreply@hwy61labs.com` alias. Only if you create the alias first.

---

## Still open (not today)

- Unit D rate limiting (Upstash Redis, 4 priority tiers, ~90 min)
- Remaining expense tabs (Transport, Food, Gear, Misc, Merch, Promo, Other)
- `/api/venue-link` missing auth.getUser() — security hygiene, ~15 min
- `/api/venue-links` possibly dead code — verify Vercel invocation logs
- ~20 lint errors/warnings in public-viewer zones — mechanical, ~30-45 min
- Onboarding wizard completion (blocked on Tim's wizard steps + demo data)
- Two unmigrated custom fonts — well, one now: Pragmatica Extended Extra Bold (BullandRegular migrated April 21)

### Permanently cut from roadmap (do not resurface)
- Stylized PDF exports (Local Poster for Print serves print use case)
- Optional third video slot (two-slot layout + safe-zone overlay covers it)
- Tour-level Download All page `/v/tour/[tourId]` (marketing token hub replaced)
- Merch product
- Agency product

---

## Starting sequence

1. `git pull`, `git status`, confirm clean
2. `npm run dev` in a terminal
3. Stripe dashboard → Webhooks page (Phase 1)
4. Supabase SQL Editor ready (Phase 2)
5. Tim on the line or confirmed via async message on pricing (Phase 3)
6. Then proceed

Do NOT start Phase 5 onward without Phase 1-3 complete and recorded in this doc.
