# QA Report — Cross-Browser Pass
**Date:** 2026-07-13
**Machine:** MacBook (Drew) + iPhone
**Branch:** main
**Method:** Live app on production Supabase + Cloudinary. Manual click-through per browser on the launch-critical surfaces; static code review used only to locate the layout bug's root cause.

---

## Summary

| Browser | Status |
|---|---|
| Safari desktop (macOS) | ✅ PASS after 1 fix |
| Chrome desktop | ✅ PASS (regression check on the same fix) |
| Firefox desktop | ✅ PASS |
| iPhone Safari (venue link page) | ✅ PASS |

One layout bug found and fixed on venue link page. No render pipeline / data / auth issues surfaced.

---

## Safari desktop (macOS) — ✅ PASS

Tested against production data, with an incognito/private window to guarantee an uncached first load for every surface.

### Verified working

- **Generate All (client-side canvas pipeline).** Full 3-format image render + video generate pass on a real tour. `renderPoster()` blob export, FontFace loading (both Google fonts + custom `.ttf` uploads), Cloudinary unsigned upload, `save-urls` write, video pass via `/api/renders/generate` — all completed without error. Progress bar advanced smoothly, `render_status` transitioned rendering → ready, no console noise.
- **Template editor.** Drag-to-position for band/venue/city/date/opener/logo/sponsor previews — smooth, snaps to center at 0.5. Size sliders and companion number inputs stayed in sync across all fields. Warning chip (⚠ LONGEST X SHRINKS N%) fired at the correct 20% advisory threshold on a rigged long-venue test tour; clicking flipped into longest-names preview and re-measured correctly.
- **Gigs inline edit + per-row re-render.** Venue, date, city, promoter email, and opener sub-line edits all committed via `PATCH /api/events/[id]`, optimistic state matched server response merge (`needs_rerender` flag flipped instantly), LINK-cell microcopy swapped to `↻ RE-RENDER` on the edited row without a page reload. Clicking RE-RENDER used the canvas pipeline via `renderEvents([id])` — custom fonts + opener overlay both intact on the re-rendered output.
- **Downloads.** DOWNLOAD ALL zip (all 5 formats + poster PDF), per-format zip from SHARE & DOWNLOAD FULL TOUR, per-asset download from venue link page, print poster PDF generation via `/api/renders/print-pdf`. All returned correctly-named files with the render-time text overlays intact.

### Bug found and fixed

**BUG — MEDIUM — Venue link page photo/video cards collapsed or mis-shaped on first uncached load.**

**Files:** `app/v/e/[token]/page.tsx` (photos ~line 152, videos ~line 192)
**Commit:** `7c63135`
**Verified fixed in:** Safari private window (cache-cleared), Chrome desktop, Firefox desktop, iPhone Safari.

**What happened:**
The media cards' layout depended on the loaded media's intrinsic dimensions. The `<img>` and `<video>` elements had `width: 100%` with no height reservation, so on first paint (before any bytes arrived), Safari laid out the cards as collapsed rows in the grid. The grid row's `stretch` alignment then locked cards to a shared row height, so mixed-aspect media within the same row (e.g. square photo + vertical photo, or square video next to vertical video) either got white-banded top-and-bottom or crushed into a wrong aspect. Chrome happened to reflow gracefully on load; Safari did not.

Second refresh worked fine because HTTP cache short-circuited the intrinsic-size race.

**Root cause:** layout ownership was implicit — the media element owned the ratio via its intrinsic dimensions, and only after network + decode. Nothing in CSS reserved the correct box up front.

**Fix (four related edits):**
1. Photo asset objects already carried an `aspect` field (`"1/1"`, `"4/5"`, `"820/312"`) but the `<img>` didn't use it. Added `aspect` field to the two video entries (`"9/16"` for vertical, `"1/1"` for square).
2. Moved `aspectRatio: X, width: 100%` onto the media wrapper `<div>` — the wrapper now owns the shape before any bytes arrive. Removed `flex: 1` from the wrapper (the ratio now sizes it, no need to fill parent height).
3. Changed `<img>` and `<video>` to `width: 100%, height: 100%, objectFit: "cover"` — child fills the wrapper.
4. Swapped the outer card `<div>`'s `height: "100%"` for `alignSelf: "start"` on both photo + video cards — so a shorter card no longer stretches to match the tallest card in its grid row (was leaving white space between the media and the label strip on square videos sitting next to vertical videos).

Card outer flex column, label-strip `marginTop: "auto"`, and the "Not provided" placeholder branch all continue to work as before. Placeholder now inherits its ratio from the wrapper instead of setting its own.

---

## Firefox desktop — ✅ PASS

Full click-through on the same Safari-desktop surfaces — no differences from Chrome or Safari. `aspectRatio` CSS renders correctly on venue link page media cards; `document.fonts.ready` timing behaved identically to Chrome (canvas Generate All completed cleanly with both Google fonts and a custom `.ttf`); custom font upload + editor preview worked without issue. No console noise. No Firefox-specific fixes needed.

---

## iPhone Safari (venue link page) — ✅ PASS

Venue link page verified on iPhone Safari — layout reads correctly at phone widths, aspect-ratio-owned media wrappers render photo/video cards cleanly on first uncached load, no collapse or mis-shape. This is the promoter-facing surface at launch, so the important iPhone check is green.

Not tested on iPhone this pass (desktop-primary surfaces — a TM won't be running these from a phone in practice):
- Gigs page inline opener editor (`+ opener` affordance depends on hover — degrades on touch to always-visible or tap-to-edit; not launch-blocking either way).
- Template editor drag-to-position (drag interactions were designed desktop-primary).

---

## Not tested this pass

- Windows Chrome / Edge (no Windows machine available today).
- Android Chrome (no Android device available today).
- Older Safari versions (Safari 15 and below have partial `aspectRatio` support — not a launch target per Tim's device assumptions, but worth flagging for post-launch if any customer complains).
