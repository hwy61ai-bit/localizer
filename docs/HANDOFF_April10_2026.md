# HWY61 Session Handoff — April 10, 2026 (morning)

## Quick orientation

This document is a handoff from the April 9 evening session + April 10 morning continuation. Paste this into a new chat to get fully caught up in under a minute. All commits below are live on `origin/main` at `hwy61ai-bit/localizer`.

**Repo:** `~/localizer` (Next.js 14, TypeScript, Supabase, Vercel, Stripe, Cloudinary, Anthropic API)
**Live at:** https://hwy61labs.com
**CLAUDE.md:** loaded automatically in every Claude Code session at repo root; read it first.

## What shipped in the last 24 hours

Thirteen commits. Each landed with its own verification before pushing.

**Freemium rollout (Units A–C):**
- `cd2c250` — CLAUDE.md infrastructure (16 non-negotiable rules, 12 workflow rules, design system notes)
- `cb50c9f` — Phase 7H onboarding wizard (org_members.user_role column, wizard shell, RLS fix)
- `3872874` — Tim's April 9 access gate decision docs committed to the repo
- `9f88d03` — Dashboard auto-create org refactor + broken orgs INSERT RLS policy fixed
- `0a3ff9a` — TourRouter free tier: three-state enum, exports gated at 402, tourrouter_plan_status/tourrouter_plan/tourrouter_current_period_end columns added (they never existed)
- `3feada1` — Backlog entry for stylized export files
- `1625fa2` — Localizer free tier gate + venue-share download SSRF closure
- `65ab420` — Session log TODO for bundle_plan_status reversion

**Localizer Generate All bug chain (four bugs stacked):**
- `ae091df` — Videos rendering through videosOnly flag, stale image URL cleanup, API guard relaxed for video-only tours
- `2465c9f` — Custom fonts on videos end-to-end (double .ttf fix, Cloudinary upload pipeline rewrite, type: authenticated fix)
- `8c63ff8` — Session wrap April 9: Co-Authored-By rule added to CLAUDE.md, five backlog entries, full day session log

**April 10 morning continuation:**
- `74fb7fb` — Logo overlays on videos via l_fetch + e_colorize (first time logos have ever rendered on videos)
- `4de79e8` — Progress bar fix: advances counter for null-pid formats, no longer freezes at 0/total on video-only tours

## Three hidden bugs fixed, silently broken for weeks or months

Worth knowing about because the diagnostic pattern might come up again:

1. **Phantom `tourrouter_plan_status` column** — referenced in code since day one, never existed in the database. Every non-admin TourRouter code path was silently broken, masked by admin bypass.
2. **Custom font upload pipeline** — the `cloudinary_public_id` column stored Supabase paths, no Cloudinary upload step ever existed. Custom fonts worked in browser Canvas previews but had never actually rendered on any video in production.
3. **`orgs` INSERT RLS policy** — unsatisfiable from day one. Masked because admins never hit the dashboard auto-create branch.

Common disease: narrow usage + admin bypass hiding bugs from the only people who'd notice them. Worth auditing for more of this pattern when time allows.

## State of key systems

**Custom fonts on videos:** Working for `BullandRegular-d91g6` (re-uploaded under new pipeline, verified end-to-end). `BebasNeue-Regular` and `Pragmatica-Extended-Extra-Bold` still point at broken Cloudinary paths — but a database query on April 10 morning confirmed zero tours currently use those fonts on a video overlay, so the re-upload is deferred until someone actually needs them.

**Logos on videos:** Working. Uses Cloudinary `l_fetch` + `c_scale` + `e_colorize` to mirror the Canvas renderer's color-tint behavior. Verified on Uncle Lucius tour.

**Progress bar on Generate All:** Fixed. Previously froze at 0/total on video-only tours because the null-pid skip branch never incremented the counter.

**Freemium gate:**
- TourRouter: non-admin users get full free access to routing/finance/advancing; exports (csv/excel/pdf/daysheet/advance/finance report POST) return 402 `export_requires_paid` unless the org has `tourrouter_plan_status` or `bundle_plan_status` in ('active', 'past_due'). Admin bypass in place.
- Localizer: free users get full access to preview/render/venue-link creation; downloads through `/api/download` and `/api/download-all` return 402 `download_requires_paid` unless the owning org is paid. Admin bypass deliberately OFF on venue-facing download routes (venues aren't admins).
- Bundle: `bundle_plan_status` grants paid access to both products.

**Test org state:** `HWY 61 TEST CO.` (`d38702d7-ea6b-49f1-bc8b-4a21b439642b`) has all three plan_status columns as NULL. Clean free-tier state, safe for beta. Reverted from 'active' on the morning of April 10 after Unit C testing was complete.

## Files that are protected

Do not touch these without deliberate, scoped intent:
- `lib/clientRender.ts` — Canvas text overlay rendering. User calls this "precious work."
- `buildCloudinaryUrl` in `/api/renders/generate/route.ts` — image URL builder.
- `buildCloudinaryVideoUrl` in `/api/renders/generate/route.ts` — video URL builder. Modified in commit `74fb7fb` to add logo support, otherwise treat as protected.
- `buildTextLayer` in the same file — the l_text overlay assembly function.

Scoped changes to these functions are possible (see the April 10 logo fix as an example of how to do it safely) but require an explicit reason and a plan that doesn't restructure anything that's already working.

## Open backlog items, in rough priority order

From `docs/BACKLOG.md`:

1. **Unit D: rate limiting (Upstash Redis).** Tim's spec: four priority tiers (AI parsing 50/hr/org, venue/contact reads 200/hr/org, exports 30/hr/org, everything else 500/hr/org). Returns 429 with Retry-After. Scoped for ~90 minutes. Deferred from April 9 because Localizer bug investigation consumed the budget.

2. **Re-upload two remaining custom fonts when needed.** `BebasNeue-Regular` and `Pragmatica-Extended-Extra-Bold` still point at Cloudinary assets that don't exist (old pipeline). Confirmed zero tours currently use them. One-minute UI task per font when first needed.

3. **41-route billing gate rollout.** Pending Tim's architectural input on a shared helper design. TourRouter side is done (Unit B), Localizer side is done (Unit C), but there are 41 other routes across the codebase using ad-hoc `supabaseServer().auth.getUser()` checks that should migrate to `requireLocalizerAccess` / `requireTourRouterAccess`.

4. **Font upload route uses old plan schema.** `app/api/fonts/upload/route.ts` lines 37–54 check `org.plan` against `"pro"` or `"agency"` — the pre-freemium billing column. Should migrate to `requirePaidLocalizerAccess()` or the three-state enum when the 41-route rollout happens.

5. **Stylized export files (PDF, day sheets, advance sheets).** Apply Warhol design system to PDF exports. Medium priority, conversion lever, post-launch.

6. **Stripe product restructure.** Blocked on EIN.

7. **Custom font architectural consolidation.** Post-launch consideration: move fonts to Cloudinary-only storage, eliminate the dual Supabase/Cloudinary pipeline. Cleaner but requires touching clientRender.ts.

## How the user works

Quick primer for a new chat:

- **Claude.ai window:** planning, architecture discussion, debugging, generating docs, drafting messages for Tim
- **Claude Code (terminal):** all file creation and edits, one file per prompt
- **Never mix** Claude Code prompts, SQL, and terminal commands in the same block — each gets its own labeled block
- **Supabase SQL** always in its own block, run manually in the SQL Editor
- **Show plan before editing.** Confirm before proceeding. Work one step at a time. User pastes output back for verification before next step.
- **Commit messages:** write to `.git/COMMIT_MSG_TMP` via Write tool, never use bash heredocs (smart quote corruption), never add Co-Authored-By trailers. This is a CLAUDE.md rule.
- **Machine discipline:** before leaving a machine, git add/commit/push. Before starting elsewhere, git pull. Mac Pro is primary dev, MacBook Pro is travel dev, Mac mini is QA-only.
- **At the end of every session:** remind user to update `docs/SESSION_LOG.md` with what shipped, what didn't, and what the next session should start with. Then git add/commit/push the log.

## What to start with in the next chat

1. Run `git pull` in the repo
2. Read `docs/SESSION_LOG.md` (the April 9 entry at the bottom, plus any April 10 entries added later)
3. Read `docs/BACKLOG.md` for context on deferred items
4. Ask the user what they want to tackle first — likely Unit D rate limiting, the 41-route billing gate rollout, or whatever emerges from user testing of the shipped Localizer fixes.

Do NOT start fixing things without a conversation. The last 24 hours surfaced a lot of latent bugs and it's possible more will appear in the coming days. When a bug report comes in, diagnose before guessing — the "search Cloudinary docs before theorizing" lesson from April 9 evening applies broadly.
