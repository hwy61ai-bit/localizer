# HWY61 / Localizer — Handoff for Next Session

**Drafted:** May 2026, end of session that shipped the image crop feature
**For:** Drew, starting a new chat after a few small edits in Localizer

---

## 1. Where we are right now

### Just shipped (this session)

**Per-format image crop feature for Localizer — five commits on `feature/image-crop`, merged to main, auto-deployed to production.**

- New `crop_config jsonb` column on `tours` (nullable, per-format, fractions 0–1).
- Read paths updated across six files (template page, tour-data API, print-pdf API, generate API, TemplateEditor, overlay-config API).
- Server-side and client-side Cloudinary URL builders apply per-format crop via `c_crop,x,y,w,h/c_fill,h,w` chain when crop is set, byte-identical fallback when not.
- `CropModal.tsx` built with `react-easy-crop`, two-column layout (cropper + framing preview), zoom slider, save/reset/cancel.
- Per-format trigger button beneath format-tab strip with status indicator stacked beneath it ("✓ Custom crop" / "Default center"). Hidden on video formats.
- Red-dot indicator on format tabs that have a saved crop.
- Image upload and delete on assets page now clear the corresponding format's crop.
- Follow-up tweak landed: the trigger row was originally a full-width bordered row with status on the left and button on the right; restyled to a tight right-aligned cluster (button on top, status indicator beneath, no surrounding border).

### Open items as of session end

You said you'd make a few more small edits in Localizer before opening a new chat. Drop them in the new chat alongside this handoff so the next session has the actual current state.

---

## 2. Lessons captured this session (write down before they fade)

- Wrapping a single `ALTER TABLE` in `BEGIN ... COMMIT` blocks is footgun-prone. The verify query inside the transaction returned a phantom result, the column wasn't actually persisted until the bare `ALTER` ran in a fresh session. **For one-statement migrations, just run the bare DDL — it auto-commits.** Save `BEGIN/COMMIT` for genuinely multi-statement atomic migrations.
- **Validate Cloudinary fraction syntax (or any new transformation pattern) manually in the browser before threading it through routes.** Saved a debugging cycle when the docs turned out to be right; would have saved a much bigger one if they hadn't been.
- **`userMemories` says Warhol headings use Pragmatica Extended. The actual `--hw-font-display` token in `globals.css` is Bebas Neue.** Memory is stale. This kind of token-level drift is exactly why generating a real `DESIGN_SYSTEM.md` from `globals.css` + `app/components/hw/` matters (already on the backlog).

---

## 3. Three viable paths for the next session

These are reasonable next moves given the state of the backlog and recent session log. Pick one when you start the new chat.

### Path A — Localizer public-launch readiness sprint

The unfinished business between "beta with one user" and "remove the Coming Soon gate, launch publicly."

**The blocking items:**
- **Onboarding wizard Option B (Localizer-specific narrative).** Option A shipped April 22 (hides TourRouter options for non-TR users). Option B is the proper fix — dedicated narrative, add artist → add show → generate asset. *Blocked on Tim's input.* Flagged as critical-for-public-launch UX.
- **Stripe restructure** — three steps in one Stripe session: (1) enter EIN in business details, (2) finish business setup / bank account selection, (3) update billing contact to billing@hwy61labs.com. *All three blocked on bank account decision.*
- **Coming Soon gate removal.** Mechanically trivial: remove `COMING_SOON=true` from `.env.local` (local) and Vercel Environment Variables (production), then redeploy. Routes `/`, `/tourrouter`, `/localizer`, `/diy`, `/roadapp` will stop redirecting to `/coming-soon`. Happens after the above are sorted.
- **Auth bug recurrence verification.** The April 16 evening session log flagged a "session expired" recurrence as a MUST-FIX before beta launch. Worth confirming it's actually settled before opening up to new users — test the overnight-idle scenario manually (log in, wait >1 hour, return, confirm session is still active).

**Pros:** highest business value. **Cons:** several items blocked on Tim or on you (bank account decision). May not have enough non-blocked work to fill a session unless those decisions are unblocked first.

**Pick this if:** you've made the bank account decision since this handoff was written, OR Tim has weighed in on Onboarding Option B, OR you want to focus the session on the auth bug verification + Coming Soon removal alone.

---

### Path B — Loose-change cleanup (high-value, low-friction)

A grab-bag session. Each item is bounded enough to ship cleanly in 30–90 minutes.

1. **Stale video preview on asset replacement** (backlog from April 10). When a user replaces a video in Import Assets and navigates to the template editor without a hard refresh, the editor displays the old video. Same shape as the crop feature's image-replace bug we just shipped a fix for. Probably an hour.
2. **Re-upload BebasNeue-Regular and Pragmatica-Extended-Extra-Bold** under the new font pipeline (deferred since April 9). Two `custom_fonts` rows still point at Cloudinary assets that don't exist; render code will silently fail on any tour using these fonts on a video overlay. Manual but bounded — delete via UI, re-upload from original font files.
3. **DESIGN_SYSTEM.md generation.** Claude Code dump of `globals.css` + `app/components/hw/`. The image-crop session surfaced the gap (memory said "Pragmatica Extended" but actual token is Bebas Neue). Documentation that pays dividends every subsequent session.
4. **Mapbox geocoding write-back monitoring follow-up** — April 16 added grep-able log strings (`write-back failed`, `write-back silently rejected`, `write-back promise rejected`); check Vercel logs to confirm zero hits in the weeks since, then decide if anything more is needed.

**Pros:** visible progress, no external blockers, real debt chipped away. **Cons:** four small things in a session is harder to keep tight than one bounded thing.

**Pick this if:** you want a lighter day, or you want to keep the technical debt list short ahead of public launch.

---

### Path C — Unit D rate limiting (RECOMMENDED)

**Upstash Redis rate limiting.** Deferred since April 9. ~90 minutes per Tim's spec. Four priority tiers, 429 with `Retry-After` header on limit:

- AI parsing routes: 50/hr/org
- Venue/contact reads: 200/hr/org
- Exports: 30/hr/org
- Everything else: 500/hr/org

**Pros:** discrete spec, clear scope, single bounded session, no external blockers. Ships real infrastructure that benefits both Localizer and TourRouter. Crosses an old item off the deferred list (it's been sitting longer than anything else).

**Cons:** none significant. New external dependency (Upstash Redis) but that's part of the spec.

**Pick this if:** you want one thing with shape that ships cleanly in one session.

---

## 4. Recommendation

**Path C — Unit D rate limiting.**

Reasoning:
- Path A's launch items mostly need Tim or your bank account decision; you'd risk burning the session trying and pivoting.
- Path B is real value but four small things in a session is harder to keep tight than one focused thing — and the previous session was already loose-change cleanup. Time for something with shape.
- Path C is bounded, has a clear spec, ships real infra, and clears the longest-deferred item.

**Fallback:** Path B with one or two items picked. Path A is right only if you've already gotten Tim's input on Onboarding B and made the bank account decision since this handoff was written.

---

## 5. Don't forget when starting the new chat

- Mention any small edits you made between this session and the new chat — they may have introduced new state worth knowing.
- Confirm the auth bug recurrence flagged April 16 is actually settled (cheap test: log in, wait >1 hour, return, confirm session is alive). Worth doing early in any path.
- Two-terminal workflow as always: this chat for planning, Claude Code in terminal for file edits. One file per Claude Code prompt. `npx tsc --noEmit` after every code change. Commit after each logical unit of work.
- Close out with a `docs/SESSION_LOG.md` entry. Today's image crop entry should already be in (or about to be — if you skipped it last night, write it before this new session ends).

---

## 6. Reference — current Localizer state at a glance

- **Beta:** active, one user.
- **Production:** hwy61labs.com (auto-deploys from main on `git push`).
- **Branch hygiene:** feature branches for non-trivial work, merge to main after sign-off. Image crop branch was `feature/image-crop`, merged and can be deleted (`git branch -d feature/image-crop && git push origin --delete feature/image-crop` — do this after confirming the prod deploy was green).
- **Active blockers on launch readiness:** Onboarding Option B (Tim), Stripe (bank account decision), Coming Soon gate (mechanical, do last).
- **Open backlog at-a-glance:** Unit D rate limiting, video overlay (Cloudinary l_fetch + e_colorize) per backlog spec, Road App (greenfield, ~14–19 days, post-launch), 41-route billing gate rollout (Tim input pending), DESIGN_SYSTEM.md, two custom font re-uploads, stale video preview bug, LLC operating agreement (needs Texas attorney review).
