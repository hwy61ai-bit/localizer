# SPEC — Opening Act + Per-Show Re-Render + Staleness Flag
**Ratified by Tim July 8, 2026. Build in three phases; each phase ships independently.**

## Feature summary
1. Per-event `opener` text field, edited inline on the gigs page (sub-line inside the venue cell, no new column).
2. `needs_rerender` staleness flag set when any render-affecting field changes (venue, date, city, state, opener), cleared when renders save.
3. Per-row re-render action in the LINK cell ("Preview assets" microcopy swaps to crimson ↻ RE-RENDER when stale) + toolbar banner with "re-render flagged shows only" bulk action.

## Locked product decisions
- Opener renders exactly as typed — no auto "w/" prefix. Placeholder in template editor: "w/ Opening Act Name".
- One opener line per show (single free-text field).
- Empty opener = skip the draw entirely on all render paths. No placeholder ever renders.
- Manual re-render only — no auto re-render on save.
- Template editor changes do NOT set the staleness flag (launch scope). Gigs-page field edits only. Template-level staleness is a BACKLOG item.
- Badge/action suppressed on rows that have never been rendered.

## Phase 1 — Opener end-to-end
**Migration (run manually in Supabase SQL Editor, single statement):**
ALTER TABLE events ADD COLUMN IF NOT EXISTS opener text;

**Files:**
- Overlay config type: add `opener` FieldConfig (position/size/align per format) + `showOpener` toggle, matching venue/date/city pattern. Verify graceful defaults for pre-existing tours.
- `app/dashboard/tours/[tourId]/template/TemplateEditor.tsx`: OPENING ACT sidebar section — toggle, draggable preview element with placeholder "w/ Opening Act Name", size slider + number input, align. Font/color inherited.
- `lib/clientRender.ts`: drawText call for opener in renderPoster, gated on showOpener and non-empty opener. (PROTECTED-ADJACENT: this file is on the careful-edit list — diff review mandatory.)
- `app/api/renders/tour-data/route.ts`: include opener per event.
- `app/api/renders/generate/route.ts`: Cloudinary text overlay layer for opener on tiktok/yt_shorts, skipped when empty.
- `app/api/renders/print-pdf/route.ts`: OPEN QUESTION — see below.
- Gigs page (`EventsTable.tsx` + event save path): opener sub-line in venue cell (smaller, muted text below venue name). Empty state: muted "+ opener" hint on row hover, reusing the promoter-email + affordance pattern. Click to inline-edit, save on blur/Enter.
- `app/api/events/[eventId]/route.ts`: persist opener. All writes use .select().maybeSingle() post-write verification.

**Phase 1 verification:** opener typed on gigs page → appears on square/story/landscape render + videos for that event; empty opener renders identically to today; template editor position persists per format.

## Phase 2 — Staleness flag
**Migration (single statement, run manually):**
ALTER TABLE events ADD COLUMN IF NOT EXISTS needs_rerender boolean NOT NULL DEFAULT false;

**Logic:**
- `app/api/events/[eventId]/route.ts`: on update, if any of venue, date, city, state, opener changed vs stored values, set needs_rerender = true in the same write. NOTE: verify which columns actually feed renders in tour-data (events table has both `venue` and `venue_name` — watch whichever the render reads; if both are written, watch both).
- `app/api/renders/save-urls/route.ts`: when saving an event's render URLs, set needs_rerender = false on that event. Both the future per-row path and existing generateAll funnel through here, so both clear the flag with no extra wiring.
- Both writes verified with .select().maybeSingle() — an RLS-rejected flag write must surface, not silently no-op.
- Known accepted tradeoff: editing an opener while that event's render is mid-flight clears the flag against the old value. Single-operator workflow; not engineering around it.

**UI:** LINK cell "Preview assets" microcopy swaps to crimson ↻ RE-RENDER (mono font, matches badge family) when needs_rerender is true AND the event has at least one render URL. Non-functional in this phase is acceptable if Phase 3 ships same day; otherwise wire it to full Generate All as interim.

## Phase 3 — Re-render actions
- Per-row: clicking ↻ RE-RENDER runs the renderPoster image loop scoped to that single event (same code path generateAll uses — extract a renderEvents(events[]) helper from generateAll rather than duplicating), plus the videosOnly generate call for that event, then save-urls. Inline "Rendering…" state during the ~5s run, then reverts to "Preview assets".
- Toolbar banner: when any events are flagged, the "Hit Generate to create all localized assets" copy swaps to "N shows have changes not in their assets" with a re-render-flagged-only action that calls renderEvents(events.filter(e => e.needs_rerender)).
- RE-GENERATE ALL unchanged; still re-renders everything and clears all flags via save-urls.

## Open question for Tim (non-blocking for Phase 1 image/video scope)
Should the opener draw on the Local Poster for Print PDF? Recommendation: YES — opener is per-show info like venue/date/city (which do draw on print), unlike tour-level custom text (which is excluded from print). If yes, add a pdf-lib drawText in /api/renders/print-pdf/route.ts, skipped when empty. Can ship as Phase 1b.

## Build rules reminders (from standing workflow)
- One file per Claude Code prompt, diff before apply, grep-verify after.
- npm run build after any lib/ change (clientRender.ts is lib/).
- SQL run manually in Supabase SQL Editor only, one statement at a time.
- No git commands from Claude Code; Drew commits manually.
