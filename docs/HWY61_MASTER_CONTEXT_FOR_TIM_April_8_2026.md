# HWY61 — Master Context for Tim (v6)
**Date:** April 8, 2026
**From:** Drew
**Purpose:** Single source of truth for the current state of the HWY61 build. Paste this at the start of any Claude chat to bring the model up to speed. **This supersedes v4 (March 25) and v5 (March 28).** Several things have changed, been cut, or shipped since those docs were written — this reconciles everything.

---

## Why This Doc Exists

Recent specs and decision memos (upgrade wall copy, Mac Mini agent guide, demo tour seed data, geo_cities build) were written against v4/v5 context, which is now materially out of date. Some examples of drift I've seen in the last few docs:

- **Merch and Agency** treated as live products with pricing tiers and upgrade walls — they're cut from current build scope.
- **"HWY61 Band"** used as a current product name — internally and in the codebase this is still **TourRouter**. The customer-facing "Band" rename was discussed but hasn't been executed.
- **Mac Mini setup** specced as a greenfield build — the Mac mini is already configured and running as a read-only QA agent.
- **Stripe checkout** assumed to be wired to new products — Stripe restructure is still blocked on the EIN.
- **Phase 8/9** (Road App, Merch, Agency) still referenced as active phases — only Road App survives post-Phase 7.

This doc fixes all of that. Use this going forward.

---

## Part 1 — The Product Lineup (Current, Final)

### Shipping Now
| Product | Codebase Name | Customer-Facing Name | Status |
|---|---|---|---|
| **TourRouter** | `tourrouter` | TourRouter *(Band rename deferred — see note)* | Phase 7 launch prep |
| **Localizer** | `localizer` | Localizer | Built, behind Coming Soon gate |
| **DIY** | `diy` (feature-flagged TourRouter) | DIY | Built as feature-gated tier of TourRouter |
| **Road App** | *(Phase 8 — post-Phase 7)* | Road App | Not started. Planned as free native iOS/Android for crew. |

### Cut from Current Scope
- **HWY61 Merch** — Cut. No inventory tracking, no merch settlement, no `/merch` routes. Not in Stripe, not in the codebase, not in the launch plan.
- **HWY61 Agency** — Cut. No agency dashboard, no offer pipeline UI, no roster-based tiers, no agent↔manager handoff. Not in Stripe, not in the codebase.

**If a spec or upgrade wall references Merch or Agency, it is out of date.** These were in v4 (March 25) but were cut shortly after. The v5 doc listed them as "deferred" — they should now be considered **cut from Phase 7 launch entirely**. They may return as future products after Road App, but they are not on the current roadmap and do not need copy, walls, Stripe products, or cross-sell prompts.

### Note on the "Band" Rename
The March 28 Showcase Site Brief proposed renaming TourRouter → Band in all customer-facing contexts. **This rename has not been executed.** The codebase, URL routes (`/tourrouter`, `/dashboard/tourrouter/*`), product page, and all internal docs still say TourRouter. If you want the rename to happen for launch, it needs to be its own discrete phase (Phase 7D in v5, or a new sub-phase) with a full find-and-replace pass through UI copy, route redirects, email templates, marketing site, and Stripe product names. Until then, all docs and specs should say **TourRouter**, not Band.

---

## Part 2 — Pricing (Current, Final)

This is the pricing model currently reflected in code and env vars. It matches the March 28 v5 doc.

### Standalone Monthly

| Product | Basic | Pro | Agency |
|---|---|---|---|
| **Localizer** | $39/mo (1 artist) | $69/mo (up to 5) | $139/mo (up to 12) |
| **TourRouter** | $49/mo (1 artist) | $99/mo (up to 5) | $179/mo (up to 12) |
| **DIY** | $19/mo (flat, one tier) | — | — |
| **Road App** | Free (post-launch) | — | — |

### Bundles (Localizer + TourRouter)

| Tier | Separate | Bundle | Savings |
|---|---|---|---|
| Basic | $88 | **$59/mo** | $29 |
| Pro | $168 | **$139/mo** | $29 |
| Agency | $318 | **$249/mo** | $69 |

### Annual
All plans: pay for 10 months, get 12.

### Tier Differentiator
Across Localizer and TourRouter, tiers are based on **number of artists on the account**: Basic = 1, Pro = up to 5, Agency = up to 12. Consistent everywhere. No roster-based tiers (that was the cut Agency product).

### What's NOT in Pricing Anymore
- ❌ "Band Solo / Band Pro / Band Agency" at $49/$79/$149 (from the Showcase Brief) — this was a proposed rename of TourRouter tiers, not executed.
- ❌ "Agency Starter / Growth / Pro" at $49/$99/$179 (from v4 and the new upgrade copy) — this was the cut Agency product.
- ❌ "Merch $19/mo" — cut product.
- ❌ "The Full HWY61 Suite" at $249 bundling Band + Agency + Localizer + Merch + Road App — the $249 tier is the **Agency Bundle** (Localizer Agency + TourRouter Agency), not a suite of five products.

### Stripe Status
**Stripe product restructure is blocked on the EIN.** Currently in Stripe:
- ✅ Localizer Basic/Pro/Agency (monthly + annual) — live, working
- ❌ TourRouter Basic/Pro/Agency — not yet created
- ❌ DIY standalone — not yet created
- ❌ Bundle products — not yet created

Any spec that assumes "the CTA triggers `/api/billing/checkout` with the correct Stripe price ID" is writing against products that don't exist yet. The upgrade walls, checkout flows, and DIY→TourRouter upgrade paths all depend on Stripe restructure completing first. **The EIN is the blocker** — we can't create new Stripe products under a personal account without the entity set up properly.

---

## Part 3 — The Stack (Current)

```
Next.js 14 App Router + TypeScript
Supabase (PostgreSQL + Auth + Storage + RLS)
Vercel (hosting + serverless functions)
Stripe (billing)
Resend Pro (transactional email, custom domain)
Mapbox (drive times + geocoding) ← live
PostHog (analytics) ← live
Anthropic API (Claude — document parsing + automation)
Cloudinary (Localizer image rendering)
```

**Repo:** `github.com/hwy61ai-bit/localizer`
**Local:** `~/localizer`
**Production:** `hwy61labs.com` (auto-deploys on `git push` to main)
**Prior domain:** `hwy61.ai` redirects to `hwy61labs.com`
**Auth:** Supabase magic link OTP via Resend — no passwords

### Deployment Rule
**Never run `npx vercel --prod`.** Vercel auto-deploys on `git push`. Manual deploys cause conflicts.

### Coming Soon Gate
`COMING_SOON=true` env var in middleware redirects marketing routes (`/`, `/tourrouter`, `/localizer`, `/diy`, `/roadapp`) to `/coming-soon`. Dashboard, login, and API routes stay live. **To launch:** remove `COMING_SOON` from `.env.local` and Vercel env vars, then redeploy.

---

## Part 4 — What's Actually Built (as of April 8, 2026)

### Phases 1–6 — Complete

| Phase | Scope | Status |
|---|---|---|
| **1. Ship Localizer** | ToS, Privacy, Stripe, custom domain, Resend, DMCA, deployed | ✅ |
| **2. TourRouter Stabilization** | Save/load state, full UI, billing gate, 45 new columns, 5 new tables, 3 storage buckets | ✅ |
| **3. Band Must-Haves** | 14 deal types, settlement, 8 personnel pay structures, roster, 54 vehicles, Master Artist Profile (10 sections), hotel management, guest list, deposit tracking, day sheets, advance sheets | ✅ |
| **4. AI Differentiators** | Universal AI Intake (4-layer parser, 9 doc types), advance automation engine (state machine, cron, 4 email templates, webhooks), alias library, venue confirmation portal | ✅ |
| **5. Finance Layer** | Commission engine (9 types), income waterfall, multi-tour dashboard, end-of-tour report (PDF + share token) | ✅ |
| **6. Contact Intelligence** | Contact API, anonymous flagging, contacts page, autocomplete | ✅ |

### What Shipped April 8 (Most Recent)

- **All 13 QA tracker bugs closed.** Zero open bugs going into this session.
- **Roster pay wired into financials.** `tour_roster` correctly passed to `calcTourFinancials()` — personnel pay now flows into `totalExpenses` on both routing and financials pages.
- **Advance sheet drag-drop** — drop a venue advance anywhere on the routing page, extracts schedule fields, wifi, parking, venue notes, backline, hospitality, production + settlement contacts with phone/email.
- **Hotel / Lodging — full end-to-end:**
  - Artist Profile Lodging section (room types, bed config, star rating, nightly budget override)
  - `HOTEL_MARKET_RATES` — 130+ cities in `constants.ts` + regional fallbacks
  - **Three-state waterfall in `calcTourFinancials()`** — actual receipt → confirmation estimate → planning projection
  - Accommodations expense tab with collapsible per-show breakdown, Actual/Confirmed/Projected source flags
  - Hotel receipt intake writes additively to `hotel_cost_actual` (multiple receipts stack)
- **Fuel receipts**
  - `vendor` column added to `tour_expenses` (was causing 500s on save)
  - Fuel tab on financials with Est vs Actual receipts side by side
  - **Fuel receipts stack separately from leg estimates** — they do NOT replace leg fuel in `calcTourFinancials()`. Both values show side by side. (This is the decision from April 8.)

### Also Live (Not in v4/v5)

- **Mapbox Directions API** — drive times cached in `drive_cache` table
- **Mapbox Geocoding API** — results cached in `geocode_cache` table
- **PostHog analytics** — instrumented across key events
- **Warhol design system** — `globals.css` with `--hw-*` CSS custom properties, 29 `Hw*` components in `app/components/hw/`, halftone dot overlay
- **In-app notifications** — bell icon + 4 triggers (advance confirmations, escalations, settlement reminders, tour updates)
- **Onboarding wizard shell** — built, blocked on demo tour seed data (now received) + Tim's wizard steps
- **`tour_vehicles` JSONB on `tours_routing`** — evolved beyond the simple `vehicle_type` field
- **New artist columns:** `vehicles_equipment`, `hospitality_rider`, `technical_production`, `business_entity`, `lodging_defaults`

---

## Part 5 — What's Still Open (Phase 7 — Launch Prep)

Phase 7 is broken into sub-phases. Some are done, some are in flight, some are blocked.

| Sub-phase | Scope | Status |
|---|---|---|
| **7A** | Domain migration to hwy61labs.com | ✅ Done |
| **7B** | Mapbox integration | ✅ Done |
| **7C** | Stripe restructuring | ⏸ **Blocked on EIN** |
| **7D** | TourRouter/Band rename + UI cleanup | ⬜ Not started |
| **7E** | Road App build | ⬜ Not started (Phase 8) |
| **7F** | Notifications (in-app + email expansion) | 🟡 In-app done, email expansion pending |
| **7G** | PostHog analytics | ✅ Done |
| **7H** | Onboarding wizard | 🟡 Shell built, blocked on demo tour data (received) + wizard steps from Tim |
| **7I** | Beta infrastructure (invite codes) | ⬜ Not started |
| **7J** | Support infrastructure (FAQ, Claude support agent) | ⬜ Not started |
| **7K** | Marketing site (hub + product pages + pricing) | ⬜ Not started |
| **7L** | Legal updates (ToS/Privacy for hwy61labs.com) | ⬜ Not started |
| **7M** | Final pre-launch QA + beta invites | ⬜ Not started |

After Phase 7: **Road App only.** No Phase 8C (Merch) or Phase 9 (Agency).

---

## Part 6 — The Mac Mini Situation (Redo or Not?)

**Short answer: do not redo from scratch. The Mac mini is already configured and working.** Tim's new "Complete Setup Guide" is a greenfield build spec — it doesn't account for what's already running. Here's the current state and what actually needs to happen.

### What's Already Done

- ✅ Mac mini is physically set up and running
- ✅ Repo cloned and kept in sync via `git pull`
- ✅ **Separate Anthropic API key** (`mac-mini-qa-agent`) in use — not the main dev key
- ✅ **Git push physically disabled** on the Mac mini — it cannot push to GitHub regardless of what the agent tries
- ✅ **`QA_AGENT_PROMPT.md`** exists at the repo root with hard rules for QA sessions
- ✅ **`qa-start` and `qa-stop` shell scripts** for session management
- ✅ Mac mini is read-only in practice — QA sessions produce reports, they don't modify source

### What Tim's New Guide Proposes (and Whether It's Worth Doing)

| Tim's proposal | Already done? | Worth adding? |
|---|---|---|
| Two macOS accounts (`drew` + `qa`) | ❌ | Probably not — adds complexity. Current single-user setup with git-push disabled + separate API key achieves the same goals. |
| OS-level file permissions (chmod source dirs read-only for `qa`) | ❌ | **Yes, optional.** This is a nice belt-and-suspenders layer. Low effort if we skip the two-account thing and just lock permissions directly. |
| `/Users/qa/.claude/settings.json` with allow/deny lists | ❌ | **Yes, definitely.** This is the one piece Tim's guide gets most right. A hard allow/deny list in `settings.json` is enforced by Claude Code itself regardless of prompt instructions, and we don't currently have this. Worth adding to the existing setup. |
| `CLAUDE.md` at repo root with agent rules | 🟡 | We have `QA_AGENT_PROMPT.md` which is similar. Could rename or add a `CLAUDE.md` that Claude Code reads on session start — minor effort. |
| Limited env file (no service role, no Stripe, no Resend) | ❌ | **Yes, definitely.** Right now the Mac mini has full `.env.local`. Creating a restricted env and using it for QA sessions only would close a real gap. |
| Auto mode (`--permission-mode auto`) for autonomous operation | ❌ | **Maybe.** This is how Tim wants to run headless overnight sweeps. Worth trying once the settings.json + limited env are in place. |
| Fresh `/opt/hwy61/repo` clone | ❌ | **No.** The repo is already at `~/localizer` on the Mac mini, matching the other dev machines. Moving it would break the workflow and gain nothing. |
| Nightly cron sweep + Slack notifications | ❌ | **Later.** Nice-to-have after the core safety layers are in place. |

### Recommended Approach (Instead of a Full Redo)

Three discrete additions to the existing Mac mini setup, in order:

1. **Add `settings.json` to Claude Code on the Mac mini** with a hard deny list (Edit, MultiEdit, Write to source dirs, git commit/push, sudo, Read `.env*`) and a hard allow list (Read, Glob, Grep, curl, git log/diff/status, Write to `qa/` only). This is the single highest-value change — it enforces restrictions at the tool level regardless of what any prompt says.
2. **Create a restricted `.env.qa`** with only `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_APP_URL` — no service role key, no Stripe, no Resend, no Cloudinary, no Mapbox. Modify `qa-start` to load `.env.qa` instead of `.env.local`.
3. **Optional: lock file permissions** on source directories so even if step 1 were bypassed, the OS would still block writes. This is the "belt and suspenders" layer.

None of this requires creating a new macOS user, moving the repo, or changing any existing scripts. It's additive, low-risk, and closes the real gaps in the current setup without throwing away what's working.

**If you want the full autonomous auto-mode headless nightly QA sweep that Tim's guide is pointed at, that's a separate project** — worth doing after the three steps above are in place and we've verified them for a week. Start from the existing setup; don't redo it.

---

## Part 7 — The Three Decisions Tim Made on April 8

These are answered and ready for build. Noting here so they're captured in the master doc.

### Decision 1 — Fuel Receipt Behavior: **Stack separately** (Option B)
Dropped fuel receipts go into `tour_expenses` with `category = 'fuel'`. They do **NOT** replace estimated leg fuel in `calcTourFinancials()`. Both values show side by side in the UI — estimated fuel from the routing calc and actual receipts from the expenses table. This is different from how hotel costs work (hotel receipts replace confirmation estimates via the three-state waterfall).

### Decision 2 — Demo Tour Seed Data: **Received** (Beta Test Band "Dust & Neon Tour")
10 shows across TX/OK/AR/TN/AL/LA, May 2026. 7-person personnel list, 2 commissions (agent 10%, manager 15%), mixed advance statuses (confirmed / followup_1 / followup_2 / sent / escalated / not_started), 9 guest list entries, 11 fuel receipts, 6 restaurant receipts.

**Before wiring this up as `seedDemoTour(orgId)`:** audit the seed data against the actual schema. Tim's memo explicitly hedges — "if a column doesn't exist yet, skip that field." Specific columns to verify against production:
- `tour_roster` — does it have `show_rate`, `off_day_rate`, `per_diem`?
- `tour_commissions` — does it exist as a separate table, or is this `artists.default_commissions` JSONB?
- `tour_expenses.category` — confirm enum values match (`fuel`, `food`, etc.)
- `guest_list.pass_type` — confirm enum values (`Industry`, `Guest`, `Photo`, `Artist`)
- `tour_shows.advance_status` — confirm enum values (`not_started`, `sent`, `followup_1_sent`, `followup_2_sent`, `escalated`, `confirmed`)

### Decision 3 — Upgrade Prompt Copy: **Needs revision**
Tim's upgrade wall copy doc references Merch, Agency, and "Band" product names that don't match current scope. Before implementing the walls, the copy needs to be rewritten against the actual product lineup:
- **DIY → TourRouter walls** — currently written as "DIY → Band $49." Should be "DIY → TourRouter Basic $49" (and ideally route to the correct tier based on the user's artist count, not always to Basic).
- **Localizer tier walls** — Basic → Pro and Pro → Agency copy is mostly fine, just needs "Localizer" instead of any bundle references.
- **Agency tier walls** — delete entirely. Cut product.
- **Cross-sell: Band → Add Localizer** — fine, rename to "TourRouter → Add Localizer."
- **Cross-sell: Band → Add Merch** — delete. Cut product.
- **Cross-sell: Localizer → Add TourRouter** — fine as-is.
- **Cross-sell: Agency → Add Band** — delete. Cut product.
- **Cross-sell: Full Suite** — rework. The "Full Suite" is the Agency Bundle at $249 (Localizer Agency + TourRouter Agency), not a five-product bundle.

None of the walls can actually fire until Stripe restructure unblocks (Decision 1 dependency → EIN).

---

## Part 8 — Architectural Rules (Do Not Violate)

1. **`calcTourFinancials()` is the single source of truth.** Never recalculate totals inline.
2. **`calculateShowIncome(show, useActuals)` is the single source of truth for per-show income.** Switch on `deal.dealType`. Never inline.
3. **`parseDate()` uses `new Date(year, month-1, day)`.** Never `new Date(string)`.
4. **Excel parsing: `raw:true, cellDates:true`.** Always.
5. **`legCtry` not `legCountry` in renderTable fuel block.** Do not revert.
6. **Staged preview always.** No import or inbound data writes directly to DB without user review.
7. **RLS is the silent killer.** Test every new table's RLS before marking done. Use `.select().maybeSingle()` and verify rows affected — RLS can silently return 200 with zero rows written.
8. **Financial fields never reach crew or label API responses.** Excluded at the API route level. `tour_shows_crew` view strips financial data.
9. **Idempotency on all cron/background jobs.** Check before acting.
10. **Payment amount always manually confirmed by TM.** Claude pre-fills, TM must confirm.
11. **Co-headliner split stored per show.** Never tour-level.
12. **Commission visibility checked in API route.** Never rely on UI gates alone.
13. **Feature flags checked before rendering any gated feature.** DIY users never see TourRouter-only features.
14. **One Claude Code session, one well-defined feature.** Context quality degrades with scope creep.
15. **Never use `npx vercel --prod`.** Vercel auto-deploys on `git push`.
16. **Never use bash heredocs.** Smart quote corruption risk.
17. **Next.js 14 server-side fetch caches aggressively.** Use `cache: "no-store"` on Supabase `fetch()` calls to prevent stale reads.
18. **Google Fonts `.ttf` fetching requires `User-Agent: Mozilla/5.0` header.** Without it, Google returns `.woff2` which pdf-lib cannot embed.
19. **Clear `.next` cache first when diagnosing** missing styles, 404s on `_next/static/*` chunks, or hydration errors.
20. **`git pull` before starting on any machine.** `git push` before leaving.

---

## Part 9 — The Operating Rhythm

- **Drew works in Claude Code (terminal, Opus)** for all file creation and editing.
- **Tim and Drew talk async via chat.** Tim writes specs and decision memos as MD files; Drew pastes them into planning sessions (this project) and implements via Claude Code.
- **One file per Claude Code prompt.** Never batch multiple file edits.
- **Always show diff before applying. Always confirm before proceeding.**
- **Sessions start with a kickoff MD file.** Drew uploads to the planning project to set context.
- **Sessions end with a SESSION_LOG update** — what got done, what didn't, what next session should start with. Then git add/commit/push.
- **Multi-machine discipline:** `git push` before leaving any machine, `git pull` before starting on another. Mac mini is pull-only.

---

## Part 10 — Machines

| Machine | Role | Git |
|---|---|---|
| **Old Mac Pro** | Primary dev (Drew's main) | Full push/pull |
| **MacBook Pro** | Travel dev (fully configured) | Full push/pull |
| **Mac mini** | QA agent only | **Pull only — push physically disabled** |

---

## Part 11 — Document Reference (Still Valid)

These spec docs from v4/v5 are still the source of truth for the features they cover. Ignore any product lineup or pricing references in them that contradict this doc.

| Doc | Use For |
|---|---|
| `03_PERSONNEL_PAY_SETTLEMENT_SPEC.docx` | Personnel pay structures, settlement |
| `06_ADVANCE_PIPELINE_SPEC_v2.docx` | Advance pipeline, venue portal |
| `07_ADVANCE_AUTOMATION_ENGINE.docx` | Cron logic, daily digest |
| `08_COMMISSIONS_NET_TO_ARTIST_SPEC.docx` | Commission engine |
| `09_TOUR_FINANCE_LAYER_SPEC.docx` | Finance module, P&L |
| `10_UNIVERSAL_DOCUMENT_INTELLIGENCE_SPEC.docx` | Alias library, translation |
| `11_DEAL_TYPES_CALCULATION_ENGINE.docx` | 14 deal types |
| `13_UNIVERSAL_AI_INTAKE.docx` | Intake API |
| `14_CONTACT_INTELLIGENCE_AGENCY_INTEGRATION.docx` | Contact DB (ignore the agency integration sections — agency is cut) |

### Docs to Discard or Treat Cautiously
- `HWY61_MASTER_CONTEXT_FOR_DREW_v4.1_March_26_2026.md` — superseded by this doc
- `HWY61_MASTER_CONTEXT_FOR_DREW_v5_March_28_2026.md` — superseded by this doc
- `HWY61_Showcase_Site_Brief_For_Drew.md` — pricing is stale (proposed Band rename never executed, suite definition wrong). Use this doc's Part 2 instead.
- `02_HWY61_Pricing_Model.pdf` — stale. Use Part 2 of this doc.
- `HWY61_UPGRADE_PROMPT_COPY_FOR_DREW.md` (April 8) — needs revision per Part 7 Decision 3 before implementing.
- `HWY61_MAC_MINI_AGENT_COMPLETE_GUIDE.md` (April 8) — treat as reference, not a build spec. See Part 6.

### Active Specs (April 8)
- `HWY61_DEMO_TOUR_SEED_DATA_FOR_DREW.md` — good, needs schema audit before implementing
- `GEO_CITIES_BUILD_SPEC_FOR_DREW.md` — good, ready to build (cleanest of the new specs)

---

## Part 12 — Immediate Priorities

In order:

1. **geo_cities build** (spec is ready, ~2–3 hours of agent work + Drew's manual seed run from the Mac mini)
2. **Schema audit of the demo tour seed data** before wiring `seedDemoTour(orgId)`
3. **Mac mini hardening** — three additive steps in Part 6 (settings.json, .env.qa, optional file permissions)
4. **Onboarding wizard steps from Tim** — the wizard shell is built and waiting
5. **Revised upgrade wall copy** against the real product lineup (Part 7 Decision 3)
6. **Stripe restructure** — unblocks when the EIN lands
7. **Phase 7D–7M** launch prep (rename TourRouter → Band if still desired, beta invites, marketing site, legal updates, final QA, launch)

---

*This document is current as of April 8, 2026. It supersedes all prior master context docs. If any other HWY61 doc contradicts this one, this one is correct.*
