# Session Kickoff — April 19, 2026 (Sunday)

## Read this before anything else

Start of session checklist (don't skip):
1. `cd ~/localizer`
2. `git pull`
3. `git status` — confirm clean, on main
4. Read `docs/SESSION_LOG.md`, specifically the `## 2026-04-18 (Saturday)` entry at the bottom. Pay attention to the "What's left for next session" and "Noise that consumed ~2 hours" sections.
5. Read this whole file before touching code.

---

## State of the world at session start

### What shipped yesterday and is live in prod

Custom text lines feature — IMAGE FORMATS ONLY:
- Two tour-level user-editable text fields (`custom_text_1`, `custom_text_2`)
- Per-format visibility toggles (`showCustomText1`, `showCustomText2`)
- Per-format position/size/align stored in `overlay_config` JSON
- Draws on Square, Story, Landscape JPEGs end-to-end
- Does NOT draw on Print PDF (by design)
- Does NOT draw on TikTok or YT Shorts videos (Step 6 — today's work)

Working-as-of-end-of-session-April-18 verification: typed "CACHE TEST 2026" into Fellow Traveller Custom Text 1 on Square → Re-Gen All → text appeared in editor preview, venue link page viewer, and downloaded JPEG.

### What's deferred

- **Step 6:** Cloudinary video overlays for TikTok + YT Shorts (~60–90 min)
- **Router cache bug:** Template editor shows stale UI on client-side return navigation. Workaround = hard refresh or incognito. Two attempted fixes (`force-dynamic` + `revalidate = 0`) triggered a prod-only failure and were reverted. Needs a different approach — see `docs/BACKLOG.md`.

### Tim meeting

Drew has a meeting with Tim scheduled. Demo plan: image formats only. Videos framed as Phase 2 (under 1 hour of remaining work). Use a tour with fresh, unsent venue links.

---

## The most important thing learned yesterday

**Sent venue links do not regenerate when Re-Gen All is clicked.**

This is (presumably) intentional: once a link has been sent to a promoter, its rendered assets shouldn't change underneath them.

But it took us 2 hours to figure out because symptoms looked identical to a broken render pipeline. The diagnostic path was: `count: 0` in Vercel logs → reverts → incognito testing → "wait, these shows were already sent."

**Rule for any future render-pipeline debugging:** before assuming a regression, check if the specific link/event has already been sent. If yes, that's why it's not updating.

---

## Discipline for today

### Before writing any code

- **ALWAYS do read-only recon first.** Yesterday's recon discipline paid off on Steps 2–5. Step 6 should start with recon of `app/api/renders/generate/route.ts` structure — it may have drifted since the earlier recon, and the Cloudinary video URL builder is a specific pattern that deserves careful reading before modification.
- Claude MUST show diffs before applying. User confirms; Claude applies.
- `npx tsc --noEmit` after every change before committing.
- Each logical unit gets its own commit with a clear message.

### Prod changes require extra care

Yesterday taught a hard lesson: **directives that work in `npm run dev` don't always behave identically on Vercel's production build.** Specifically, route segment configs like `force-dynamic` and `revalidate = 0` can interact with Vercel's edge/CDN/auth layer in ways dev mode doesn't reveal.

**Mitigations for today:**
- For any new route segment config or caching directive, test on a preview deployment first if possible (Vercel creates preview deploys for non-main branches).
- If that's not feasible, deploy to prod during a low-risk window with an immediate smoke test plan.
- If smoke test fails → revert first, diagnose second. Don't try to fix forward under pressure.

### When symptoms look bad, slow down

Yesterday's debugging spiral was triggered by real user-visible failures on prod. Under time pressure, Claude (me) jumped between theories: stale cache? → RLS issue? → env vars? → Vercel build? → reverts? → more diagnostics.

**Better pattern:**
1. Gather diagnostic data (Console, Network, Vercel logs, DB state) before proposing ANY theory.
2. One theory at a time. Verify or eliminate before moving on.
3. If user has a deadline, the safe move is revert-first-diagnose-after, not the reverse.
4. Ask early: "has this ever worked? when did it last work?" — answers the pre-existing-vs-regression question without any code inspection.

---

## Today's plan

### Primary goal: Step 6 — Cloudinary video overlays for custom text

Scope: extend `buildCloudinaryVideoUrl` in `app/api/renders/generate/route.ts` to add two text overlays for `customText1` and `customText2` on TikTok and YT Shorts video renders. Same three-part gate as image path: format check + per-format visibility flag + non-empty text.

**Data is already plumbed.** From yesterday's Step 5:
- `tour-data/route.ts` already returns `custom_text_1` / `custom_text_2`
- `EventsTable.tsx` already passes them through to the generate route
- Generate route receives them — just needs to wire them into the Cloudinary URL builder

**Critical implementation detail:** the existing Cloudinary layer builder (`buildTextLayer`) has NO empty-text guard. It assumes venue/date/city always have values (true today because those come from event data). Custom text CAN be empty — so our new layer construction must check non-empty-text BEFORE calling `buildTextLayer`. Otherwise an empty-string `l_text:Font_size_bold:,co_rgb:...` fragment will be appended to the Cloudinary URL and produce broken output.

**Plan:**
1. Read-only recon on current state of `app/api/renders/generate/route.ts`, specifically `buildCloudinaryVideoUrl` function and its callers. Confirm structure hasn't drifted. Estimate 15 min.
2. Design prompt specifying the three-part gate and non-empty text check.
3. Claude Code diff → review → apply → typecheck → commit.
4. Smoke test: pick a tour with TikTok and YT Shorts video assets, fresh unsent venue links, and Custom Text 1 enabled on those video formats. Generate → verify text appears on the Cloudinary-rendered video.

**Commit message:** `feat(render): custom text overlays on video formats (TikTok, YT Shorts)`

### Secondary (only if primary is clean and time remains)

**Router cache fix attempt #2.** The forward-looking candidates in `BACKLOG.md`:

- `revalidatePath("/dashboard/tours/[tourId]/template")` called from the overlay-config mutation route after successful update
- Client-side fetch pattern for the editor's initial data load (more involved)

Start with the `revalidatePath` approach since it's surgical. Test on a preview deploy first if possible.

**Only tackle this if Step 6 is done AND Tim demo went well AND energy remains.** Not urgent.

---

## Key files and their purposes (as of end of April 18)

### Files touched during yesterday's custom-text build

| File | Purpose |
|---|---|
| `app/dashboard/tours/[tourId]/template/TemplateEditor.tsx` | Editor UI, state, debounced save, drag handler, sidebar blocks |
| `app/dashboard/tours/[tourId]/template/page.tsx` | Server component — fetches tour + events, passes to TemplateEditor |
| `app/dashboard/tours/[tourId]/components/EventsTable.tsx` | Generate All handler — calls `renderPoster` per event × format |
| `app/api/tours/[tourId]/overlay-config/route.ts` | PATCH route for saving overlay_config + custom_text_1/2 |
| `app/api/renders/tour-data/route.ts` | Fetches tour + events + custom fonts + logo URLs for the generate pipeline |
| `lib/clientRender.ts` | Browser-side Canvas renderer — called by TemplateEditor and EventsTable |
| `app/api/renders/generate/route.ts` | Server-side render endpoint — batch regenerates assets for a tour. **THIS IS TODAY'S FILE** |

### Parallel type declarations

Worth knowing: `FieldConfig` and `FormatConfig` are declared **independently** in both `TemplateEditor.tsx` and `lib/clientRender.ts`. They drift (e.g. `align?: Align` vs `align?: string`). Any FormatConfig extension must be applied to both files. Backlogged for a future shared-types refactor.

---

## Commit log from April 18 (for quick reference)

- `da36377` — docs: update HWY61_VISION.md
- `77d41ad` — feat(template): add customText1/2 types and defaults
- `9684b61` — feat(template): load and save custom_text_1/2 text content
- `c87d529` — feat(template): custom text UI, state, debounced save, drag + sidebar blocks
- `725fa6f` — feat(template): add showCustomText1/2 visibility toggles with collapse pattern
- `fba5b68` — docs: session log entry (superseded)
- `a6783ad` — feat(render): draw custom text on image formats (square/story/landscape)
- `e627ed0` — fix(template): force dynamic rendering [REVERTED]
- `e019f96` — fix(template): add revalidate=0 [REVERTED]
- `f3eae0d` — Revert revalidate=0
- `2c7ff86` — Revert force-dynamic
- `4abf4ac` — docs: session log + backlog entries for 2026-04-18

---

## What to tell Claude at session start

After reading this file, open a fresh Claude conversation and paste this as the first message:

> "Good morning. Before we start, please read `docs/SESSION_KICKOFF_April_19_2026.md` in full and `docs/SESSION_LOG.md` bottom entry for April 18. Then summarize back to me in 3-4 sentences: what shipped yesterday, the main lesson from the debugging session, and what we're building today. Don't start coding — I want to confirm context before we begin."

---

## Final note to self

Yesterday you worked a long day on a hard feature, hit a prod scare, recovered cleanly, and shipped a real user-facing capability. That's real progress, even though it was messy. Today is video overlays — a smaller, more contained piece. Start with recon, trust the pattern from yesterday, and keep commits small.

Good luck with Tim.
## Pre-demo FIRST TASK (do before any mass-delete with Tim)

Capture stale-URL bug evidence before wiping data:
1. Pick ONE existing problem tour (the Memphis one from tonight works) and ONE fresh-tonight tour
2. For each: query DB render_tiktok_url from venue_links, and grab served URL from venue page source in incognito
3. Save the 4 URLs in docs/STALE_URL_EVIDENCE.md before deleting anything
4. If fresh matches DB and old doesn't, that's the confirmation — bug is data-side, not code-side

