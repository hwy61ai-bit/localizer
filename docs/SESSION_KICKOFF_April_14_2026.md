# Session Kickoff — Sponsor Logos on Template Editor

**Date created:** April 14, 2026
**Status:** Confirmed with Tim. Ready to build.
**Estimated time:** 3–4 hours focused. Seven steps, each its own Claude Code prompt.

---

## What we're building, in one paragraph

Two sponsor logo slots on every tour, uploaded from the template editor sidebar. Each slot behaves like the existing band logo — per-format toggle, drag-to-position, size slider, applies to digital formats AND the print poster PDF — with two key differences: (1) sponsor logos render in their native colors (no color tinting), and (2) slots are disabled until a logo is uploaded. Default positions place both slots side-by-side below the ALL CAPS section.

---

## Design decisions (confirmed with Tim)

| Decision | Answer |
|---|---|
| Tint? | **No tint.** Sponsor logos render as-is. Upload instructions: "upload a transparent PNG in the exact colors you want displayed." |
| Number of slots | **Two** (sponsor_logo_1, sponsor_logo_2) |
| Applies to print poster PDF? | **Yes** |
| Upload UI | **Inline button in template editor sidebar**, matches custom font upload pattern |
| Empty state | **Grayed out toggles** until upload |
| Per-format positioning? | **Yes** — x/y/size stored per format in overlay_config, same as band logo |

---

## The seven pieces, in build order

1. **Supabase migration** — two new columns on `tours`
2. **Upload/delete API route** — `/api/tours/[tourId]/sponsor-logo`
3. **Tour-data API update** — return sponsor URLs alongside existing data
4. **Template editor UI** — two upload buttons, two toggles, drag/size/position
5. **Canvas renderer** — draw sponsor logos in `lib/clientRender.ts` (no tint)
6. **Server generate route** — mirror canvas render in `app/api/renders/generate/route.ts`
7. **Print poster PDF** — draw sponsor logos in print PDF generation

Stop after each step. Verify it works. Commit. Move to the next.

---

## Pre-flight checklist

Before starting:

- [ ] `cd ~/localizer && git pull`
- [ ] `git status` clean
- [ ] No tabs open at hwy61labs.com (avoid the `/token` rate-limit trap)
- [ ] On the old Mac Pro
- [ ] **Stop `npm run dev` before Claude Code creates new route files.** Restart with `rm -rf .next node_modules/.cache && npm run dev` after each new route is created. (Lesson from the Marketing Hub session — creating new routes while dev is running causes stale vendor-chunk errors three times in a row.)
- [ ] Have two test PNG logos ready to upload — ideally branded ones with distinct colors (e.g. a red logo and a blue logo) so the "no tint" verification is obvious.
- [ ] Coffee

---

## Step 1 — Supabase migration

**Run this in the Supabase SQL Editor. Not the terminal.**

```sql
ALTER TABLE tours
  ADD COLUMN IF NOT EXISTS sponsor_logo_1_url text,
  ADD COLUMN IF NOT EXISTS sponsor_logo_2_url text;
```

**Verify with:**

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tours' AND column_name LIKE 'sponsor_logo%'
ORDER BY column_name;
```

You should see 2 rows.

**Storage path note:** We'll use the existing `localizer-assets` bucket, path `tour-assets/{tourId}/sponsor-logo-1.png` and `.../sponsor-logo-2.png`. No new bucket needed. The existing bucket RLS policies apply to all paths under `localizer-assets/`, so uploads should just work if `artist-assets/` already works. If the upload in Step 2 fails with an RLS error, check whether `tour-assets/` specifically needs a policy added — paste the error into the Claude.ai chat and we'll adjust.

---

## Step 2 — Upload/delete API route

**Goal:** Create a single route file that handles both POST (upload) and DELETE (remove) for both sponsor slots. Slot is determined by a query param `?slot=1` or `?slot=2`.

**Before writing the prompt, read the existing artist logo route so Claude Code can mirror it exactly:**

```bash
sed -n '1,120p' "$HOME/localizer/app/api/artists/logo/route.ts"
```

Paste the output into the Claude.ai chat if anything looks surprising, so we can tweak the prompt before running it.

**Claude Code prompt:**

````
Create a new file: app/api/tours/[tourId]/sponsor-logo/route.ts

Read app/api/artists/logo/route.ts in full first and match its auth, error handling, and Supabase Storage upload patterns exactly — same client setup, same upload path construction, same public URL generation. Mirror it so we don't drift from the working pattern.

Differences from /api/artists/logo:

1. This route accepts two HTTP methods: POST (upload) and DELETE (remove).
2. Both methods require ?slot=1 or ?slot=2 as a query param. Return 400 if missing or not "1"/"2".
3. Tour ID comes from the dynamic route param [tourId], not from the body.
4. Auth: require session via supabase.auth.getUser(). 401 if no user.
5. Org membership check: query tours by tourId to get org_id, then verify user is a member of that org via org_members. 403 if not.
6. Storage path: `tour-assets/{tourId}/sponsor-logo-{slot}.png`
7. Bucket: `localizer-assets` (same as artist logo).
8. File type: accept .png only. Reject others with 400.
9. After successful upload, update tours table: set sponsor_logo_1_url OR sponsor_logo_2_url (based on slot) to the public URL returned by Supabase Storage. Use .select().maybeSingle() to catch silent RLS failures.
10. DELETE removes the file from storage AND sets the appropriate column back to null on the tours row.
11. Return { success: true, url: <publicUrl or null> } on success.
12. Use try/catch around the whole handler with 500 fallback, following the notifications route pattern.

Show me the full file before applying. Run npm run build after.
````

**Test curl (just auth wall — full upload test via the UI in Step 4):**

```bash
curl -s -X POST "http://localhost:3000/api/tours/FAKE_TOUR_ID/sponsor-logo?slot=1"
```

Should return `{"error":"Unauthorized"}`. If yes, auth wall is working.

**Commit when build passes:**

```bash
git add "app/api/tours/[tourId]/sponsor-logo" && git commit -m "Add sponsor logo upload/delete API route" && git push
```

---

## Step 3 — Tour-data API update

**Goal:** Add `sponsor_logo_1_url` and `sponsor_logo_2_url` to the response from the tour-data API that the template editor calls on load.

**First, peek at the existing route to see the select statement and response shape:**

```bash
sed -n '1,80p' "$HOME/localizer/app/api/renders/tour-data/route.ts"
```

**Claude Code prompt:**

````
In app/api/renders/tour-data/route.ts, update the tours query to also select sponsor_logo_1_url and sponsor_logo_2_url.

Then update the response payload to include these two new fields alongside the existing tour data. Match the naming convention of the existing logoUrl field (e.g. if it returns logoUrl: artist.logo_url, return sponsorLogo1Url: tour.sponsor_logo_1_url and sponsorLogo2Url: tour.sponsor_logo_2_url).

Show me the diff before applying. Run npm run build after.
````

**Commit:**

```bash
git add app/api/renders/tour-data/route.ts && git commit -m "Return sponsor logo URLs from tour-data API" && git push
```

---

## Step 4 — Template editor UI (the big one)

**Goal:** Add two upload slots, two toggles, drag handlers, and size sliders for the sponsor logos in the template editor sidebar, below the existing ALL CAPS section.

**Before writing the prompt, scout the existing band logo and custom font upload code so Claude Code has concrete patterns to copy:**

```bash
grep -n "showLogo\|logo:\|BAND LOGO\|font" "$HOME/localizer/app/dashboard/tours/[tourId]/template/TemplateEditor.tsx" | head -40
```

```bash
wc -l "$HOME/localizer/app/dashboard/tours/[tourId]/template/TemplateEditor.tsx"
```

Paste both outputs into the Claude.ai chat before running the prompt — this file is probably the largest in the codebase we'll touch, and we want to know where things are before Claude Code goes in.

**Claude Code prompt (expect a long diff — this is the biggest step):**

````
Update app/dashboard/tours/[tourId]/template/TemplateEditor.tsx to add sponsor logo controls.

Read the file in full first. Identify:
- How the band logo toggle, drag, and size slider currently work (showLogo, logo.x/y/size, drag handler "logo" case)
- How the custom font upload button currently works (inline upload button pattern, file picker, POST to fonts/upload route)
- The existing ALL CAPS section in the sidebar (where the new SPONSOR LOGOS section will go immediately below)
- How overlay_config defaults are initialized for new formats

REQUIREMENTS:

1. Below the existing ALL CAPS section in the sidebar, add a new section titled "SPONSOR LOGOS" with the same section-label styling as other sections (font-mono uppercase, letterSpacing, blue or muted color — match what's there).

2. Inside the SPONSOR LOGOS section, add two sub-sections: "SPONSOR 1" and "SPONSOR 2". Each sub-section contains:
   a) An upload slot:
      - If no logo uploaded for this slot: a button reading "+ Upload Sponsor Logo (.png)" that opens a file picker. Match the inline style of the existing custom font upload button.
      - If a logo is uploaded: a small thumbnail preview (~60x60) of the PNG, with Replace and Delete buttons appearing on hover. Match the artist logo upload pattern on the artist detail page.
   b) A toggle: "SHOW SPONSOR LOGO" — grayed out and disabled if no logo uploaded. When no logo exists, clicking does nothing but the label shows helper text below: "Upload a sponsor logo to enable." When a logo exists, toggle works normally.
   c) A drag handler for positioning — add new cases "sponsorLogo1" and "sponsorLogo2" to the existing drag switch (mirror how the band logo's "logo" case works).
   d) A size slider with companion number input, range 20–400, default 60. Mirror the band logo size slider pattern exactly.

3. Upload flow:
   - POST /api/tours/[tourId]/sponsor-logo?slot=1 (or ?slot=2) with the file as multipart FormData
   - On success: refetch tour data and update state so the new URL appears and the toggle becomes enabled
   - On error: show a toast (use the existing Localizer toast system — `import { toast } from ...` wherever it's currently imported in this file)

4. Delete flow:
   - DELETE /api/tours/[tourId]/sponsor-logo?slot=1 (or ?slot=2)
   - On success: refetch tour data, set the toggle to false for all formats, clear the thumbnail
   - Confirm dialog before delete: confirm("Remove this sponsor logo? It will be deleted from all formats.")

5. Config shape additions — add to the default overlay_config for EVERY format (square, story, landscape, tiktok, yt_shorts, print):
   - showSponsorLogo1: false
   - sponsorLogo1: { x: 0.35, y: 0.88, size: 60 }
   - showSponsorLogo2: false
   - sponsorLogo2: { x: 0.65, y: 0.88, size: 60 }

   Existing tours loaded from the DB without these fields must fall back to these defaults when read — do NOT crash or render incorrectly for tours that were saved before this migration.

6. Preview rendering in the editor:
   - When showSponsorLogo1 is true AND tour.sponsorLogo1Url exists, render an <img> at the configured x/y/size.
   - CRITICAL: NO color tinting. Do NOT use WebkitMaskImage, do NOT use backgroundColor overlay, do NOT mimic the band logo's color-tint trick. Render the image with plain `<img src={...} />` and absolute positioning. The PNG must show its native colors and transparency.
   - Same pattern for sponsorLogo2.

7. Save dirty state: mark the format as dirty on any sponsor logo change (toggle, drag, size slider change, upload, delete). Use the existing setDirtyFormats pattern.

8. DO NOT modify any existing band logo code. The band logo still uses its color tint. Do not refactor it to share with sponsor logos — the two have intentionally different rendering.

Show me the full diff before applying. This is the largest step of the session — the diff will be long. Run npm run build after.
````

**Test after build passes:**

- Stop dev server, clear cache, restart: `rm -rf .next node_modules/.cache && npm run dev`
- Open template editor for a tour: `http://localhost:3000/dashboard/tours/<tourId>/template`
- Before uploading: confirm SPONSOR LOGOS section exists, toggles are grayed out
- Click "+ Upload Sponsor Logo" for slot 1, pick a test PNG
- Confirm: toggle enables, thumbnail appears, toggle defaults off
- Flip toggle on — sponsor logo should appear in preview in **its native colors** (not tinted to match the text)
- Drag it around — position updates
- Change size slider — size updates
- Switch formats (square → story) — confirm per-format position works independently
- Repeat for slot 2
- Save — reload page — confirm everything persists
- Delete slot 2 — confirm toggle grays out, preview updates

**Commit:**

```bash
git add "app/dashboard/tours/[tourId]/template/TemplateEditor.tsx" && git commit -m "Add sponsor logo controls to template editor" && git push
```

---

## Step 5 — Canvas renderer (clientRender.ts)

**Goal:** Draw sponsor logos in the client-side canvas renderer used for generating final JPEGs. Plain `drawImage` after the band logo is drawn — no tinting.

**First check where the band logo is drawn and what the render function signature looks like:**

```bash
grep -n "showLogo\|logo\.\|source-in\|drawImage" "$HOME/localizer/lib/clientRender.ts" | head -30
```

**Claude Code prompt:**

````
Update lib/clientRender.ts to render sponsor logos.

Read the full file first. Find:
- Where the band logo is drawn (grep for showLogo / source-in / WebkitMaskImage)
- The render function signature — specifically how tour data / logo URLs are passed in

REQUIREMENTS:

1. After the existing band logo draw block, add two new draw blocks — one for sponsorLogo1 and one for sponsorLogo2.

2. Each block:
   - Check if cfg.showSponsorLogo1 (or 2) is true AND the sponsor logo URL exists (passed in via tourData or as a separate arg — match the existing band logo pattern)
   - Load the PNG image using the same async-load helper the band logo uses
   - Calculate position from cfg.sponsorLogo1.x, y, size — x and y are relative (0–1), size is in pixels relative to the canvas dimensions (same formula as band logo)
   - Draw with plain ctx.drawImage — NO ctx.globalCompositeOperation change, NO "source-in", NO tinting
   - The PNG's native colors and alpha channel come through naturally

3. The render function signature needs to accept sponsor_logo_1_url and sponsor_logo_2_url. Add them to the tourData parameter shape or as separate args — match whatever pattern the existing band logo uses.

4. Do NOT change anything about how the band logo renders. It still uses source-in composite for tinting. Leave that code completely alone.

5. Draw order: sponsor logos AFTER the band logo so they layer on top if positions overlap.

Show me the diff before applying.
````

**Commit:**

```bash
git add lib/clientRender.ts && git commit -m "Render sponsor logos in client canvas (no tint)" && git push
```

---

## Step 6 — Server generate route

**Goal:** Mirror the canvas renderer changes in the server-side JPEG generator at `app/api/renders/generate/route.ts`.

**First peek to find the band logo draw and the tours select statement:**

```bash
grep -n "showLogo\|logo_url\|source-in\|drawImage" "$HOME/localizer/app/api/renders/generate/route.ts" | head -20
```

**Claude Code prompt:**

````
Update app/api/renders/generate/route.ts to render sponsor logos, mirroring the changes just made to lib/clientRender.ts.

REQUIREMENTS:

1. The tours select query needs to also fetch sponsor_logo_1_url and sponsor_logo_2_url.

2. Mirror the draw logic from lib/clientRender.ts — same position math, same plain drawImage with no tinting, same check on cfg.showSponsorLogo1/2.

3. Draw order: sponsor logos AFTER the band logo.

4. Do NOT touch band logo rendering.

Show me the diff before applying. Run npm run build after.
````

**Test:**

- Click "Preview Render" in the template editor on a format where a sponsor logo is enabled
- Verify the rendered JPEG has the sponsor logo in the right place with native colors

**Commit:**

```bash
git add app/api/renders/generate/route.ts && git commit -m "Render sponsor logos in server JPEG generator" && git push
```

---

## Step 7 — Print poster PDF

**Goal:** Draw sponsor logos in the print poster PDF generation via pdf-lib.

**First find the print PDF route:**

```bash
find "$HOME/localizer/app/api" -path "*print-pdf*" -name "route.ts"
```

**Then peek at the top of it:**

```bash
sed -n '1,100p' "$HOME/localizer/app/api/renders/print-pdf/route.ts"
```

(Adjust path if the find returns a different location — could be under `app/api/tours/` or elsewhere.)

**Claude Code prompt:**

````
Update the print poster PDF route at app/api/renders/print-pdf/route.ts (or wherever print-pdf lives) to draw sponsor logos.

Read the file in full first. Find where the band logo is drawn in the pdf-lib code (look for embedPng, drawImage on the page object, or references to logo_url in the tour select).

REQUIREMENTS:

1. The tours select query needs to also fetch sponsor_logo_1_url and sponsor_logo_2_url.

2. After the existing band logo draw call in the pdf-lib code, add two conditional blocks — one per sponsor slot.

3. Each block:
   - Check overlay_config.print.showSponsorLogo1 (or 2)
   - If true AND the sponsor URL exists, fetch the PNG via fetch(), convert to arrayBuffer, embed with await pdfDoc.embedPng(pngBytes)
   - Calculate position and size from the print format's sponsorLogo1 (or 2) config — same relative math as band logo, but applied to 11x17 print dimensions
   - page.drawImage(embeddedPng, { x, y, width, height }) — NO alpha/opacity changes, NO mask, NO tint. PDF-lib handles PNG transparency natively.

4. Do NOT modify the band logo PDF rendering.

Show me the diff before applying. Run npm run build after.
````

**Test:**

- On a tour where sponsor logos are enabled for the print format specifically, click "Download Print Poster" from a venue page
- Verify the PDF shows both sponsor logos in the correct position with correct colors and transparency

**Commit:**

```bash
git add app/api/renders/print-pdf/route.ts && git commit -m "Render sponsor logos in print poster PDF" && git push
```

---

## Final smoke test (after all 7 steps)

End-to-end on localhost, then production after Vercel deploys:

1. Open the template editor for a real tour
2. Upload a recognizable PNG (e.g. a red logo) to sponsor slot 1
3. Toggle "SHOW SPONSOR LOGO 1" on
4. Drag, resize — positioning works
5. Upload a different-colored PNG (e.g. a blue logo) to sponsor slot 2
6. Toggle on, position
7. Save the square format
8. Switch to story format — confirm per-format position works independently (each format has its own x/y/size)
9. Confirm the same for landscape, tiktok, yt_shorts, print
10. Click "Preview Render" — confirm server render matches the editor preview
11. Generate final assets
12. Open a venue link, confirm sponsor logos appear on all digital formats **in their native red/blue colors — not tinted**
13. Click "Download Print Poster" — confirm the PDF shows both sponsor logos with correct colors and transparency
14. Back in the editor, delete sponsor logo 2 — confirm toggle grays out across all formats
15. Reload — confirm state persists
16. Done

---

## Things to remember

- **NO tint on sponsor logos.** This is the one thing that's different from band logos. Do NOT copy the WebkitMaskImage / source-in pattern.
- **Stop dev server before Claude Code creates new route files.** Hit this three times last session. `rm -rf .next node_modules/.cache && npm run dev` after each new route file is created.
- **Quote bracket paths in zsh:** `git add "app/api/tours/[tourId]/sponsor-logo/route.ts"`
- **`.select().maybeSingle()`** after every update on tours (project rule)
- **Bracket-path glob warning in Claude Code** is a false positive — option 1 (Yes) is always correct
- **Default position:** sponsor 1 at x: 0.35, sponsor 2 at x: 0.65, both at y: 0.88 — side by side below the ALL CAPS section
- **Default size:** 60 pixels (range 20–400)
- **Never modify band logo rendering** — it still uses color tint, leave that code alone
- **Existing tours without the new columns:** the API returns null, the UI should gracefully render "no logo uploaded" state. Test this on an old tour.
- One Claude Code prompt at a time, show diff before applying, verify build, commit, move on
- If anything feels weird, stop and ask in the Claude.ai planning chat before continuing

---

## End of session reminder

After finishing all 7 steps:

```bash
open -a TextEdit docs/SESSION_LOG.md
```

Add an entry covering:
- Sponsor logos shipped (list all 7 pieces)
- Any gotchas hit (especially around per-format config, render pipeline, pdf-lib PNG embedding)
- Whether anything got deferred
- Next session priority

Then:

```bash
git add docs/SESSION_LOG.md && git commit -m "Session log: sponsor logos shipped" && git push
```
