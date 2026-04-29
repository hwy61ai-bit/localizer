# Renderer Text Drift Investigation

**Status:** Open. Investigation paused after 2026-04-29 session. Diagnostic data captured below; next attempt should start here, not from scratch.

**Symptom:** Text rendered on canvas-based formats (IG Square 1080×1080, IG Story 1080×1350, FB Cover/landscape 820×312) appears slightly higher than where it sits in the editor preview, by an amount that varies per font. Small for geometric sans (Poppins ~5px). Larger for display fonts (Bulland Regular and Bungee both visibly more). Permanent Marker shows no visible drift (likely because the font's hand-drawn irregularity is bigger than the bug). Print PDF and video formats (TikTok, YT Shorts) do NOT drift — different code paths.

**Beta-eve note (2026-04-29):** Six hours of investigation. Attempted fix overshot in the opposite direction (~25px south of correct) and was rolled back to clean main. No production changes shipped. Drift remains at original magnitude for the tester. Branch `fix/canvas-text-baseline` (commit `92548c0`) preserved with the renderer-only baseline correction; do not assume it's a working fix — see "Why the 2026-04-29 attempt failed" below.

---

## How the rendering pipeline actually works

There are at least three separate text-positioning systems that all need to agree, and they currently don't:

### System 1: Editor HTML overlay (what the user designs against)
- File: `app/dashboard/tours/[tourId]/template/TemplateEditor.tsx`
- Each text field (venue, city, date, customText1, customText2, band) is rendered as an absolutely-positioned `<div>` on top of the editor's preview image.
- Positioning: `style={{ position: "absolute", left: \`${fc.x * 100}%\`, top: \`${fc.y * 100}%\`, transform: getTransform(align) }}` where `getTransform` returns `translate(-50%, -50%)` for center-aligned text.
- This is what the user *visually* designs against — they drag these divs around to position text.
- The browser's CSS engine centers the *line-box*, not the visual glyph extent. Line-box center sits a few pixels off from visual glyph center for most Latin fonts.

### System 2: Canvas renderer (what the rendered PNG actually shows)
- File: `lib/clientRender.ts`
- Function: `renderPoster()`. Inner function `drawText()` handles all text fields.
- Currently uses `ctx.textBaseline = "middle"` and `ctx.fillText(text, x, y)`.
- `textBaseline = "middle"` puts the *midpoint of font ascent and descent metrics* on `y`. For most fonts this is NOT the visual center of the glyph — it's typically ~5-25 pixels above visual center, varying by font metrics.
- This is the actual final render output the user gets when they click "render".

### System 3: Cloudinary text overlay (in the editor preview's background image)
- Built by `buildPreviewUrl()` at line 145 of `TemplateEditor.tsx`.
- The function `toLayerParams` (line 145) converts y values to Cloudinary-style `g_${gravity}, x_, y_` URL parameters.
- For center-aligned: `g_center, y_${(field.y - 0.5) * fmtDims.h}`. Cloudinary's gravity-based positioning is a third coordinate system, distinct from CSS line-box and canvas baseline.
- **CRITICAL UNRESOLVED QUESTION:** Where in the editor JSX is this Cloudinary URL actually displayed? Line 824 shows `<img src={imageUrl}>` where `imageUrl` is built without text overlays (lines 382-385) — just the bare cropped background image. If `buildPreviewUrl` is only used for download/export and NOT shown in the editor, then System 3 is irrelevant to editor↔render comparison. If it IS displayed somewhere in the editor, then the user sees TWO copies of text in the editor (Cloudinary-baked + HTML overlay) and any drift between those two is a separate bug. **Verify this first thing in the next session.**

---

## Confirmed facts (don't re-verify these — they're empirically established)

- **Underlying images are identical between editor and render for IG Square.** Both use `c_fill,g_center,w_1080,h_1080/${publicId}`. The baked content (e.g., orange "THE BETA TEST BAND" text in the test template) sits at the same pixel position in both.
- **Editor container at IG Square is 600×600px** (img and parent both). `top: 50%` of overlay div lands at display pixel 300 = source pixel 540 of a 1080-tall source. Container is not stretched; positioning math from CSS to source pixels is clean.
- **For Poppins all-caps "TEST VENUE" at 70px in Chrome:** `actualBoundingBoxAscent` = 51.85, `actualBoundingBoxDescent` = 1.30. `(ascent - descent) / 2` = 25.28px (~36% of font size). MUCH larger than the typical "5-10% of font size" mental model.
- **Editor `divCenter` measured via `getBoundingClientRect`** (after the 2026-04-29 editor-side fix was applied): 314.2 in display space → ~565 source pixels. (That fix is in the branch but not on main.)
- **Render measured top-of-letters at pixel 540 after fix.** With cap-height ~52, visual center ≈ 566 source pixels.
- The two measurements (editor 565, render 566) said the systems agreed numerically AFTER the 2026-04-29 fix, but visual screenshot comparison showed they didn't agree visually. **This contradiction was never resolved.** Possible explanations: stale browser state during measurement, an intermediate compile that hadn't finished, or a third positioning system (Cloudinary, see above) that was the actual source of the visible disagreement.

---

## Code locations (file:line — do NOT re-grep these)

- Renderer: `lib/clientRender.ts`
  - `renderPoster()` entry: line 131
  - `drawText()` inner function: line 244
  - Current `textBaseline = "middle"` line: 254
  - Multi-line venue branch: 257-278 (with `lh = fitSize * 0.85`, `blockTop = y - ((lines.length - 1) * lh) / 2`)
  - Single-line shrink-to-fit: 280-287
  - Last-resort 12px fallback: 290-291
  - `FORMAT_DIMS` table: line 45-50
- Editor: `app/dashboard/tours/[tourId]/template/TemplateEditor.tsx`
  - `getTransform(align)` helper: line 126
  - `buildPreviewUrl()` (Cloudinary URL builder): line 132+
  - `toLayerParams()` inside `buildPreviewUrl`: line 145
  - HTML `<img>` for editor preview background: line 824 (uses `imageUrl` from lines 382-385, which has NO text overlays)
  - Venue/city/date overlay divs: line 956-1004
  - Custom text 1 overlay: line ~1018
  - Custom text 2 overlay: line ~1036
  - Band name overlay: line ~873
  - Render button (renderPoster call): line 793, with `baseUrl` built at line 775
  - **Note:** `fd` dimensions table at line 770-772 disagrees with `buildPreviewUrl`'s `fmtDims` table at line 132-140 for `landscape` (820×312 vs 1920×1080). For square and story they match. Investigate whether this matters.
- Editor server page: `app/dashboard/tours/[tourId]/template/page.tsx` (server component, fetches tour from Supabase, passes as prop)

---

## Theories already tried and disproven

1. **Multi-line `lh` math (`lh = fitSize * 0.85`).** Looked suspicious. Wasn't the cause — the symptom appears on single-line text too, and on the `landscape` format which doesn't enter the multi-line branch.

2. **Container stretching (editor parent taller than image).** Disproved by `getBoundingClientRect` measurement: container is exactly 600×600 for a 1080×1080 source format.

3. **Cloudinary URL or dimension mismatch.** Disproved by inspecting the URLs built in `imageUrl` (line 384-385) vs `baseUrl` (line 775). Both use identical `c_fill,g_center,w_1080,h_1080` for IG Square. Underlying images confirmed identical.

4. **Canvas `textBaseline = "middle"` is the bug.** Partially right — switching to `textBaseline = "alphabetic"` with `(ascent - descent) / 2` correction is mathematically what canvas needs to put visual glyph center on `y`. But: this overcorrected by ~25 pixels because the editor was never trying to put visual glyph center on `y` either. The editor's CSS line-box-center is closer to canvas's middle-baseline-center than it is to visual-glyph-center. We made the renderer "more correct" by a definition that didn't match what the editor was doing.

5. **CSS line-box-vs-glyph offset is small enough that fixing renderer-only would help.** Disproved when `actualBoundingBoxAscent` came back at ~52 and the implied correction was 25px, but the editor↔render gap was only ~5-10px. The correction is much larger than the gap, meaning fixing the renderer in the visual-center direction makes it overshoot the editor by far more than the original drift.

---

## What the right fix probably looks like

**The goal is editor↔render visual agreement, not mathematical correctness in either system alone.**

The editor's HTML overlay is the user's design surface — that's the ground truth they design against. The renderer should produce a PNG where text lands at the same visible position as it did in the editor preview. Mathematical "visual center on y" is irrelevant if it doesn't match what the user designed.

To do this right:

1. **First confirm that the editor preview is actually showing only the HTML overlay text, not also Cloudinary-baked text.** Inspect the editor DOM — look for any `<img>` element whose `src` includes `l_text:` (the Cloudinary text overlay parameter). If yes, there are two text layers in the editor and we need to deal with both.

2. **Empirically measure the CSS line-box-center offset for several fonts.** The browser console snippet from the previous session works:
```javascript
   const div = [...document.querySelectorAll('div')].find(d => d.textContent === 'TEST VENUE' && d.style.position === 'absolute');
   const r = div.getBoundingClientRect();
   const img = document.querySelector('img[alt="Base"]');
   const ir = img.getBoundingClientRect();
   console.log({ divCenter: (r.top + r.bottom)/2 - ir.top, expectedCenter: ir.height / 2 });
```
   Run this with the venue overlay at `top: 50%` for: Poppins, Bulland Regular, Bungee, Anton, Oswald, Permanent Marker. The `divCenter - expectedCenter` value (in display pixels) is the per-font CSS line-box offset. Convert to source pixels by multiplying by `imgHeight / displayImgHeight` (e.g., 1080/600 = 1.8 for IG Square).

3. **Modify the renderer to apply the SAME offset, not a different one.** The renderer should compute the same offset for the same font and apply it. This is achievable because both systems can call `measureText` — but the renderer needs to use whatever metric the editor's CSS line-box happens to use. Possibly that's just `actualBoundingBoxDescent` alone, or some specific combination of font metrics. Empirical calibration tells you which.

4. **Cross-check on multiple fonts before declaring victory.** If the calibration produces editor↔render agreement on Poppins but not on Bulland, the formula is wrong — fonts with different metrics need to all converge on the same offset behavior.

5. **Test on all three formats** (square, story, landscape) and at least one wrapped venue (text with `|`) to verify the multi-line branch handles correction the same way.

---

## Pitfalls observed in the previous session

- **Hot-reload timing.** Several confusing measurements during the previous session were caused by Next.js dev server not having recompiled the latest source by the time a screenshot was taken. After every code change, hard-reload (Cmd+Shift+R) before taking measurements. Wait for the terminal to confirm compilation finished.
- **Stale browser screenshots.** Comparing screenshots taken at different times across `git stash` / `git stash pop` cycles is unreliable. Always take fresh screenshots from the same code state.
- **`actualBoundingBoxAscent` is bigger than cap-height.** It includes font ascent metadata that extends above where capital letters visually reach. For Poppins all-caps it's ~52 for a 70px font; cap-height is closer to 50. Don't assume `actualBoundingBoxAscent` ≈ cap-height.
- **The `0.85` line-height in the multi-line branch may need re-tuning** if the baseline correction approach changes. Currently `lh = fitSize * 0.85` was tuned against `textBaseline = "middle"`. A different baseline + correction approach probably wants a different `lh` factor.
- **zsh bracket gotcha:** paths containing `[tourId]` must be quoted in shell commands, or zsh treats them as glob patterns. `git checkout "app/dashboard/tours/[tourId]/template/TemplateEditor.tsx"`.

---

## Definitively NOT the bug

- Image dimensions (verified)
- Cloudinary cropping/scaling of the underlying image (verified identical)
- Container CSS sizing (verified square 600×600 for IG Square)
- The `formatImageIds` data flow from server prop to editor (works correctly)
- React state staleness (the editor reads from a server-rendered prop, not from client fetch)
- The font-loading race (`document.fonts.ready` already awaits before any measureText call in `clientRender.ts`)

---

## Branch state

- `fix/canvas-text-baseline` exists with one commit `92548c0` ("Fix canvas text baseline drift in clientRender.ts").
- That commit changes `textBaseline = "middle"` → `"alphabetic"` and adds `centerYCorrection` helper applied at three `fillText` call sites in `lib/clientRender.ts`.
- The corresponding editor-side change in `TemplateEditor.tsx` was applied locally during the session but never committed.
- **Before re-using `92548c0` as a starting point, decide whether visual-glyph-center is the right target.** Per "Theories already tried" #4 above, it probably isn't — the editor's CSS doesn't put visual glyph center on y, so making the renderer do so produces overshoot. The right calibration target is whatever the editor's CSS *actually* puts on y, not what's mathematically "correct."
