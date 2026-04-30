# Renderer Text Drift Investigation

**Status:** Resolved 2026-04-30 (pending tester confirmation on production). Fix shipped in commit `7d555b2` on main. Branch `fix/canvas-text-baseline` (commit `92548c0`) is superseded and can be deleted.

**Symptom (now fixed):** Text rendered on canvas-based formats (IG Square 1080×1080, IG Story 1080×1350, FB Cover/landscape 820×312) appeared slightly higher than where it sat in the editor preview, by an amount that varied per font. Small for geometric sans (Poppins ~5px display / ~9px source). Larger for display fonts (Bulland Regular and Bungee both visibly more). Permanent Marker showed no visible drift because the font's hand-drawn irregularity exceeded the bug's magnitude. Print PDF and video formats (TikTok, YT Shorts) did NOT drift — different code paths.

---

## The fix

In `lib/clientRender.ts`'s `drawText()`, the renderer was using `ctx.textBaseline = "middle"` and calling `ctx.fillText(text, x, y)`. Chrome's `middle` computes its midpoint against font ascender/descender metadata in a way that does NOT match how CSS centers a line box when an absolutely-positioned element uses `top: 50% + transform: translate(-50%, -50%)`.

The corrected pattern is:

```typescript
ctx.textBaseline = "alphabetic";
const m = ctx.measureText(text);
const lineBoxOffset = (m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2;
ctx.fillText(text, x, y + lineBoxOffset);
```

This places the line-box center at `y` — the same envelope CSS uses for `line-height: normal`. The offset is computed per-text from canvas font metrics, so it adapts automatically to font and size and works uniformly across formats.

Applied at all four `fillText` call sites in `drawText`:
- The single `textBaseline` declaration at the top of the function
- The multi-line venue branch (with `|` line break)
- The single-line shrink-to-fit loop
- The last-resort 12px fallback

Verified empirically on Poppins and Bulland Regular at IG Square (in-browser overlay test — see "How we found it" below), then end-to-end render verified on IG Square, IG Story, FB Cover/landscape, a wrapped venue (`|`-delimited), and a non-Poppins font. All three canvas formats share `drawText`, so the fix is format-agnostic by construction.

---

## How we found it

The investigation on 2026-04-29 spent six hours reasoning from font-metric theory and produced an overshoot fix using `actualBoundingBox` (visible glyph extent), which was rolled back. On 2026-04-30 we resolved it in ~45 minutes by switching from theory to direct in-browser measurement.

The breakthrough technique: **draw the candidate canvas-rendered text as a colored overlay on top of the live editor preview, at the same y-coordinate the renderer would use, and visually compare to the live HTML overlay text.** Code in the "Diagnostic snippets" section below.

The overlay test made the bug reproducible inside the editor's own browser context — no need to render a PNG and screenshot-compare. We:

1. Drew a red overlay using the buggy `textBaseline = "middle"` at the editor's div-center y. It floated north by the same amount as the production drift, confirming `middle` is the bug and reproducing it without going through the renderer.
2. Drew a green overlay using the proposed fix (`alphabetic` + `(fontBoundingBoxAscent - fontBoundingBoxDescent)/2`) at the same y. It landed exactly on top of the live editor text.
3. Repeated both for Bulland (the worst-drifter). Same result — red drifted, green landed.

That collapsed all the theoretical uncertainty into a yes/no test.

---

## Why earlier attempts overshot

The 2026-04-29 fix used `actualBoundingBox` metrics (visible glyph extent — where actual ink is). For Poppins at 70px the implied correction was ~25 source px, but the actual editor↔render gap was only ~5-10 source px. Result: the renderer overshot 25px south of correct.

The mistake was conflating **visible glyph center** with **line-box center**. CSS does not center the visible glyphs at `top: 50%`; it centers the *line box* (the typographic envelope determined by font ascent + descent metadata, which is taller than the visible glyphs because it includes ascender/descender headroom). The right calibration target is the line box, not the glyph extent — `fontBoundingBox` not `actualBoundingBox`.

---

## How the rendering pipeline works (post-fix)

There are two text-positioning systems that need to agree:

### System 1: Editor HTML overlay (the user's design surface)
- File: `app/dashboard/tours/[tourId]/template/TemplateEditor.tsx`
- Each text field (venue, city, date, customText1, customText2, band) is rendered as an absolutely-positioned `<div>` on top of the editor's preview image.
- Positioning: `style={{ position: "absolute", left: \`${fc.x * 100}%\`, top: \`${fc.y * 100}%\`, transform: getTransform(align) }}` where `getTransform` returns `translate(-50%, -50%)` for center-aligned text.
- This is the user's ground truth — they drag these divs around to position text.
- The browser's CSS engine centers the *line-box*, not the visual glyph extent.

### System 2: Canvas renderer (the rendered PNG)
- File: `lib/clientRender.ts`
- Function: `renderPoster()`. Inner function `drawText()` handles all text fields.
- Now uses `ctx.textBaseline = "alphabetic"` with per-text `(fontBoundingBoxAscent - fontBoundingBoxDescent) / 2` y-offset.
- The y-offset places the line-box center at `y`, matching System 1's CSS line-box centering.

### System 3: Cloudinary text overlay — confirmed dead code
- `buildPreviewUrl()` at line 132 of `TemplateEditor.tsx` builds Cloudinary `l_text:` URLs.
- Grep across the repo (excluding `.next`) returned only the function definition — zero call sites.
- The editor's `<img>` background (line 824) uses `imageUrl` (lines 382-385), which is `c_fill,g_center,w_X,h_Y/${publicId}` with no text overlays.
- **`buildPreviewUrl` is unused.** It can be deleted in a future cleanup commit.

---

## Confirmed facts (preserved from original investigation)

- **Underlying images are identical between editor and render for IG Square.** Both use `c_fill,g_center,w_1080,h_1080/${publicId}`. Baked content (e.g., the orange "THE BETA TEST BAND" in the test template) sits at the same pixel position in both.
- **Editor container at IG Square is 600×600 display px** (img and parent both). `top: 50%` of overlay div lands at display pixel 300 = source pixel 540 of a 1080-tall source. Container is not stretched; positioning math from CSS to source pixels is clean.
- **Display-to-source scale factor for IG Square: 1.8×** (1080 source / 600 display).

---

## Diagnostic snippets (kept for future investigations)

These were the tools that cracked it. Useful any time you have a "two rendering systems should agree but don't" bug.

### Find the venue text leaf in the editor DOM

```javascript
const overlays = [...document.querySelectorAll('div')].filter(d =>
  d.style.position === 'absolute' && d.textContent.trim().length > 0 && d.children.length < 3
);
overlays.forEach((d, i) => console.log(i, JSON.stringify(d.textContent.slice(0, 40)), d.style.top, d.style.left));
```

The venue field will have a `top` percentage that varies (default ~62.6% for IG Square). To get the actual text-bearing leaf (font-size lives there, not on the absolute-positioned wrapper):

```javascript
const leaf = [...document.querySelectorAll('*')].find(el =>
  el.textContent.replace(/\s+/g, '') === "TIM'SHOUSE" && el.children.length === 0
);
```

(Adjust the text constant to whatever your venue actually contains, with whitespace stripped.)

### Overlay test — reproduce the bug AND verify the fix

This is the breakthrough technique. Draws red (current behavior) and green (candidate fix) canvases on top of the live editor preview at the editor's div-center y. Whatever doesn't overlap the live HTML text is wrong.

```javascript
// Clear previous overlays
document.querySelectorAll('canvas[data-drift-test], canvas[data-drift-test-fix]').forEach(el => el.remove());

const leaf = [...document.querySelectorAll('*')].find(el =>
  el.textContent.replace(/\s+/g, '') === "TIM'SHOUSE" && el.children.length === 0
);
const cs = getComputedStyle(leaf);
const r = leaf.getBoundingClientRect();
const img = document.querySelector('img');
const ir = img.getBoundingClientRect();
const divCenter = (r.top + r.bottom) / 2 - ir.top;

function overlay(color, yOffset, label) {
  const c = document.createElement('canvas');
  c.setAttribute('data-drift-test-fix', '1');
  c.width = ir.width;
  c.height = ir.height;
  c.style.cssText = `position:absolute;left:${ir.left + window.scrollX}px;top:${ir.top + window.scrollY}px;pointer-events:none;z-index:9999;`;
  document.body.appendChild(c);
  const ctx = c.getContext('2d');
  ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = color;
  if (yOffset === null) {
    ctx.textBaseline = 'middle';
    ctx.fillText("TIM'S HOUSE", ir.width / 2, divCenter);
  } else {
    ctx.textBaseline = 'alphabetic';
    ctx.fillText("TIM'S HOUSE", ir.width / 2, divCenter + yOffset);
  }
  const data = ctx.getImageData(0, 0, ir.width, ir.height);
  let minY = ir.height, maxY = 0;
  for (let y = 0; y < ir.height; y++) {
    for (let x = 0; x < ir.width; x++) {
      if (data.data[(y * ir.width + x) * 4 + 3] > 0) {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  console.log(label, { drift: ((minY + maxY) / 2) - divCenter });
}

const m = (() => {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  return ctx.measureText("TIM'S HOUSE");
})();
const lineBoxOffset = (m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 2;

console.log('Font:', cs.fontFamily, 'lineBoxOffset:', lineBoxOffset);
overlay('rgba(255,0,0,0.6)', null, 'RED (current bug)');
overlay('rgba(0,150,0,0.6)', lineBoxOffset, 'GREEN (proposed fix)');
```

Verified results during the fix session:

| Font | Red drift (display px) | Green drift (display px) |
|------|------------------------|--------------------------|
| Poppins 700 @ 44px (IG Sq) | -7 (above) | ~0 |
| Bulland Regular | (matched bug magnitude) | ~0 |

---

## Theories tried during 2026-04-29 (preserved as a record)

1. **Multi-line `lh = fitSize * 0.85` math.** Wasn't the cause — symptom appeared on single-line text and on landscape (which doesn't enter the multi-line branch).
2. **Container stretching.** Disproved by `getBoundingClientRect`: container is exactly 600×600 for a 1080×1080 source format.
3. **Cloudinary URL or dimension mismatch.** Disproved by inspecting `imageUrl` vs `baseUrl` — both use `c_fill,g_center,w_1080,h_1080` for IG Square.
4. **`textBaseline = "middle"` is the bug, fix with `actualBoundingBox` correction.** Half-right. The baseline was indeed the bug, but `actualBoundingBox` (visible glyph extent) is the wrong calibration target — using it overshot ~25px south. The right target is `fontBoundingBox` (line-box envelope), which is what CSS uses.

---

## Pitfalls that wasted time

- **Hot-reload timing.** Several confusing measurements during the 2026-04-29 session were caused by Next.js dev server not having recompiled yet. Always hard-reload (Cmd+Shift+R) and wait for terminal confirmation after a code change. (Re-confirmed during 2026-04-30 — the first measurement run returned `fontSize: 0px` because we hit the page mid-recompile.)
- **Stale browser screenshots across `git stash` cycles** are unreliable. Take fresh screenshots from the same code state.
- **`actualBoundingBoxAscent` is bigger than cap-height.** It includes font ascent metadata that extends above where capital letters visually reach. For Poppins all-caps it's ~52 for a 70px font; cap-height is closer to 50.
- **The `0.85` line-height multiplier in the multi-line branch was preserved through the fix** and visual checks confirm wrapped venues still look correct. If line-height ever needs re-tuning, do it as a separate change.
- **zsh bracket gotcha:** paths containing `[tourId]` must be quoted in shell commands.

---

## Code locations (post-fix line numbers approximate)

- Renderer: `lib/clientRender.ts`
  - `renderPoster()` entry: line 131
  - `drawText()` inner function: line 244
  - `textBaseline = "alphabetic"`: line 254
  - Multi-line venue branch with `lineBoxOffset`: lines 257–278
  - Single-line shrink-to-fit with `lineBoxOffset`: lines 281–290
  - Last-resort 12px fallback with `lrLineBoxOffset`: lines 293–297
- Editor: `app/dashboard/tours/[tourId]/template/TemplateEditor.tsx`
  - `getTransform(align)` helper: line 126
  - `buildPreviewUrl()` (DEAD CODE — unused): line 132+
  - HTML `<img>` for editor preview background: line 824 (uses `imageUrl` from lines 382–385, no text overlays)

---

## Followups

- **Tester confirms production deploy.** Send Vercel URL post-deploy and verify Bulland Regular and Bungee across IG Square, IG Story, FB Cover. Once confirmed, flip status header to "Resolved 2026-04-30 (tester confirmed)".
- **Delete `buildPreviewUrl` and related dead code in `TemplateEditor.tsx`.** Confirmed unused. Not blocking but worth cleaning so future debuggers don't re-investigate Cloudinary as a third coordinate system.
- **Delete branch `fix/canvas-text-baseline`** once tester confirms — superseded by main commit `7d555b2`.
