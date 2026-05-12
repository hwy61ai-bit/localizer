# HWY61 Status for Tim — 2026-05-12

Snapshot of current Localizer and TourRouter state. Use this to ground any TourRouter design decisions you're working on.

## TL;DR

- **Localizer** is in active beta with Kurt. All ten of Kurt's first-round feedback notes shipped today — buttons, contrast, fonts, instruction copy, format hints, label hierarchy, panel dividers. Kurt sent a second small batch (sidebar UX, workflow stepper direction) which is now logged for a focused design session.
- **TourRouter** is held while Localizer beta runs but stable for the work that exists. The advancing feature is sitting in a disabled state pending a full audit. Drive-time caching was unfrozen yesterday and today — historical drive times now refresh correctly. One newly logged bug: the paste-text/CSV drop zone on the TourRouter import page isn't accepting drags (suspected pre-existing, not a regression from today).
- **Marketing site** is gated behind `COMING_SOON=true`. The engineering path to public Localizer launch is unblocked — waiting on your inputs for onboarding wizard Option B and the Stripe bank account decision.

---

## Localizer

### What it does today

Generates localized marketing assets for tour dates. Promoters and venues drop in show data; Localizer renders ready-to-post images, videos, and print posters customized per market.

### Asset formats currently shipping

| Format | Type | Dimensions | Render path |
| ------ | ---- | ---------- | ----------- |
| Square | Image | 1080 × 1080 | Client-side (browser canvas, `lib/clientRender.ts`) |
| Story | Image | 1080 × 1920 | Client-side |
| Landscape | Image | 1920 × 1080 | Client-side |
| Local Poster for Print | PDF | 11 × 17 (3300 × 5100 recommended) | Server-side via pdf-lib |
| TikTok / IG Reels / FB Stories | Vertical video | 1080 × 1920 | Server-side via Cloudinary URL transformation |
| Square Video (YouTube Shorts target) | Square video | 1080 × 1080 | Server-side via Cloudinary URL transformation |

Stylized PDF exports and an optional third video slot are **permanently cut**. Merch and Agency as separate product lines are also cut — only Localizer and TourRouter (with DIY as a feature-gated TourRouter tier) remain.

### What's shipped in the last ~30 days

- Per-field color overrides (`venueColor`, `cityColor`, `dateColor`) mirror the existing `bandTextColor` pattern across all render paths.
- Per-format image cropping via `react-easy-crop` with a `crop_config` JSON column on the `tours` table.
- Custom text overlays on both image and video render paths (the latter completing today).
- Auth cookie `max-age` fixed — was 1 hour, now 30 days. Users no longer get logged out mid-session.
- Today's full Kurt note pass: contrast tokens to WCAG AA, HwModal viewport overflow fix, primary-button color decoupled from brand crimson (new `--hw-action-primary` token, brand crimson reserved for marketing-page accents and destructive actions), font-size bumps across dashboard surfaces, dismissible Upload Tips, more accurate instruction copy, file-format hints on uploads, bolder field labels in the template editor sidebar, thin dividers between Venue/City/Date sub-fields.

### What's still needed before public launch

- **Onboarding wizard Option B** — Localizer-only narrative for Localizer-only beta users. Option A (hide TourRouter sections from non-TR users) shipped April 22. Option B is the dedicated "add artist → add show → generate asset" flow that would replace the multi-product onboarding for solo-Localizer signups. **Waiting on you.**
- **Stripe business setup** — three sub-tasks (EIN entry, business setup / bank account selection, billing contact change to `billing@hwy61labs.com`) all gated on choosing which bank account to attach. **Waiting on you.** Once decided, all three close in one Stripe session.
- **Verify new-user signup end-to-end.** Quick smoke test before launch.
- **Re-upload custom fonts** that were lost in an earlier migration.
- **Audit stale test workspaces** so production data is clean on day one.

Once those land, flipping `COMING_SOON=false` in `.env.local` and Vercel takes the marketing routes (`/`, `/tourrouter`, `/localizer`, `/diy`, `/roadapp`) live.

### Kurt's batch 2 (logged today, not yet started)

Tracked in `docs/BACKLOG.md` under 🟢 Ready to build. Quick preview so you have it in your head:

1. **Checkbox-to-reveal pattern.** Currently field-visibility checkboxes (Venue / City / Date) sit separately from field controls. Kurt wants them folded: checking the box reveals that field's full control set. Also consolidate the Band Name panel into the same card as City/Venue/Date.
2. **Group related options near what they modify.** "Short date" and "All caps" currently live in their own panels at the bottom of the sidebar. Should move adjacent to City/Venue/Date.
3. **Wide horizontal stepper vs stacked vertical.** Kurt's design background is library software; he's biased toward compact horizontal flow. His argument: horizontal communicates linear progress through a process, while stacked vertical reads as a single-page outline. Real trade-off on narrow laptops — needs a sketch before committing.

A half-day to full-day design session in total scope.

---

## TourRouter

### What it does today

Routing, logistics, finance, and advancing for active tours. The DIY tier (a feature-gated TourRouter mode) caps capability for self-managing artists who don't need the full suite.

### What's working

- **Tour routing with live drive times** via Mapbox. Drives are cached in the `drive_cache` Postgres table and refresh correctly on each upsert. `fetched_at` is now written on every write (was previously frozen at first-write per a silent PostgREST `Prefer: resolution=merge-duplicates` quirk — fix verified in production yesterday).
- **Country-aware geocoding** for cross-border legs. Phase 1 shipped this week. Phase 2 (adding `origin_country` / `dest_country` columns on `drive_cache` for unique-key disambiguation) is logged but not started.
- **Financial model** (`lib/tourrouter/financials.ts`) is stable. This file is protected — neither I nor Claude Code edit it.
- **Roster, settlement, intake panels** are all working as intended.
- **Document parsing via the Anthropic API.** Drop a PDF or image of an advance sheet and it parses to structured fields — this is the magical bit users react to most.

### What's known broken or on hold

- **Advance feature is disabled** pending a full audit. Was producing inconsistent state under some flows; needs a focused session to walk through every entry point and decide what's safe to re-enable. In 🟡 Pre-launch gates as a TourRouter-side blocker.
- **Paste-text / CSV drop zone on the TourRouter import page is broken** as of today's surfacing — dragging a CSV file produces no visual highlight, dropping does nothing, and the paste-text window also rejects dragged input. Suspected pre-existing, not a regression from today's CSS-only edits. Logged in 🟡 alongside the Advance audit.
- **Hotel advance document address parsing.** When a hotel advance document is dropped through TourRouter intake, the address field doesn't parse into the sidebar. Logged.

### Things to know if you're redesigning

The highest-leverage facts about how TourRouter currently behaves under the hood:

- **Public viewer routes** (`/v/**`, `/advance/**`, `/report/**`) use the service-role Supabase client because they're not authenticated. **Authenticated dashboard routes** (`/dashboard/**`) use the user-scoped client. That boundary is structural — any TourRouter view that needs unauthenticated access (e.g., a venue confirming details, a promoter checking settlement) needs to live on a `/v/`-style path.
- **`drive_cache` reads are read-through.** A miss triggers a Mapbox fetch and a cache write. The `fetched_at` column is now reliable, so any "drive time updated N days ago" UI you sketch will have real data behind it.
- **Document ingestion is via Anthropic API.** Any new advancing UX should preserve or build on this — it's the path users find magical and is a real differentiator.
- **No real-time collaboration currently.** If your redesign assumes multi-user concurrent editing on a tour, that's a meaningful backend lift, not a UI tweak.
- **TourRouter has no public beta yet.** Localizer has Kurt; TourRouter has zero outside testers. Whatever you sketch can be designed without backwards-compatibility constraints from real users — only against the data model and existing tour data in our own test orgs.

---

## Stack quick-reference

- Next.js 14 App Router, TypeScript
- Supabase (Postgres + Auth + Storage)
- Cloudinary (image and video rendering)
- Vercel (auto-deploy on push to `main`)
- Mapbox (live drive times, geocoding)
- PostHog (analytics + session replay)
- Resend (transactional email)
- Stripe (billing — setup in progress)
- Anthropic API (document parsing)

Repo: `hwy61ai-bit/localizer`. Marketing site, Localizer dashboard, and TourRouter dashboard all live in this single repo.

---

## What's awaiting your input

In rough priority order:

1. **Onboarding wizard Option B narrative** — blocks Localizer public launch.
2. **Stripe bank account decision** — blocks EIN entry, business setup, and billing contact update (all close in one session once you decide).
3. **In-app chatbot** scope — is this Phase 7 or post-launch?
4. **OnboardingGate / old welcome choice screen retirement** — should the old gate come down once Option B ships?
5. **Stylized export files** (PDFs, day sheets, advance sheets) — design direction needed before engineering can scope.
6. **Font upload route schema migration** — old plan schema still referenced; quick fix once Stripe plan model is finalized.
7. **Bulk "Send to All Promoters" button on Gigs page** — feature scope and copy.

All tracked in `docs/BACKLOG.md` under ⚪ Awaiting Tim.

---

## What's permanently cut

So nothing accidentally gets re-scoped:

- Merch (separate product line)
- Agency (separate product line)
- Stylized PDF exports
- Optional third video slot per asset
- Anything beyond Phase 7 in the build plan except Road App (React Native/Expo), which is the only sanctioned post-launch roadmap item

---

## Today's session arc (for context if you want it)

Full play-by-play is in `docs/SESSION_LOG.md` under the `2026-05-12` entry. Eighteen commits, all on `main`, all auto-deployed.

Headline: every piece of Kurt's first-round feedback shipped, plus a meaningful BACKLOG.md restructure into seven readiness tiers (🔴 Active / 🟡 Pre-launch / 🟢 Ready to build / ⚪ Awaiting Tim / ⏳ Soak / 🧹 Hygiene / 💭 Future) so anyone — including your Claude — can scan what's lined up by what each item needs, not by topic.

Two new workflow rules also added to `CLAUDE.md` to keep BACKLOG.md from drifting: a session-end grep-reconciliation pass, and a 20-minute audit every 2–3 weeks.

---

*Drew, 2026-05-12*
