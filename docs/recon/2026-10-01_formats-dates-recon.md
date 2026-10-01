# Recon: Localizer formats + date format (2026-10-01)

Read-only recon ahead of specs for:
1. FB cover 820×312 → 1920×1005, label "Facebook Event Cover"
2. Short/long date checkbox → dropdown of format keys, with read-time fallback from the old boolean
3. New 9:16 **image** format 1080×1920 labeled "Vertical"; existing 1080×1350 relabeled "Grid/Organic (4:5)" (label only). Video out of scope.

No source files were modified. No DB queries were run (see Open questions for the SQL to run).

---

## A. Format definitions

### A.1 The canonical catalog (exists, but only partly adopted)

`lib/localizer/formats.ts` is the declared single source of truth (`FORMATS`, lines 46–118). Its own header comment (18–20) says *"Nothing imports this file yet"*. That's out of date: three files import it now (below). Most of the ~11 local declarations it was meant to replace are still there.

| Internal key | uploadId (assets vocab) | Catalog label (formats.ts) | w×h | mediaType | category | source column (`tours`) | render column (`venue_links`) |
|---|---|---|---|---|---|---|---|
| `square` | `ig_post` | "Square" (:50) | 1080×1080 | image | static | `image_square_id` | `render_square_url` |
| `story` | `ig_story` | **"Vertical"** (:61) | 1080×1350 | image | static | `image_story_id` | `render_story_url` |
| `landscape` | `facebook` | "FB Cover" (:72) | 820×312 (:73–74) | image | static | `image_landscape_id` | `render_landscape_url` |
| `print` | `print` | "Local Poster" (:83) | 3300×5100 | pdf | rich | `image_print_id` | `render_poster_url` (not `render_print_url`) |
| `tiktok` | `tiktok` | "Vertical Video" (:94) | 1080×1920 | video | rich | `video_tiktok_id` | `render_tiktok_url` |
| `yt_shorts` | `yt_shorts` | "Square Video" (:110) | 1080×1080 | video | rich | `video_yt_shorts_id` | `render_yt_shorts_url` |

Derived lists: `ALL_FORMATS`, `STATIC_FORMATS`, `RICH_FORMATS`, `IMAGE_FORMATS`, `VIDEO_FORMATS` (132–148). `formatFromUploadId()` (125).

Importers of `formats.ts`: `TemplateEditor.tsx:15`, `app/api/renders/generate/route.ts:9`, `lib/localizer/tierGate.ts:1`. Two scripts mention it in comments only (`scripts/invalidate-video-cache.mjs:18,101`).

### A.2 User-facing labels per surface (they differ everywhere)

| Surface | 1080×1350 (`story`) | FB cover (`landscape`) | Square | file:line |
|---|---|---|---|---|
| formats.ts catalog | "Vertical" | "FB Cover" | "Square" | `lib/localizer/formats.ts:61,72,50` |
| Template editor tabs | "Vertical" | "FB Cover" | "Square" | `app/dashboard/tours/[tourId]/template/TemplateEditor.tsx:124–131` (own local `FORMATS` array) |
| Assets upload page | "Instagram Story / Reels / Facebook Story", sub "VERTICAL" | "Facebook Cover Image", sub "LANDSCAPE", aspect `820 / 312` | "Instagram Post / Facebook Post" | `app/dashboard/tours/[tourId]/assets/page.tsx:11–18` |
| Share w/ Marketing download buttons | "Vertical Image" | "FB Cover" (w120×h56 button) | "Square Image" | `app/dashboard/tours/[tourId]/components/ShareWithMarketingButton.tsx:298–302` |
| Venue page `/v/e/[token]` | "Instagram Story / Reels / Facebook Story", shape "VERTICAL", "1080 × 1350" | "Facebook Cover Image", shape "FB COVER", "820 × 312", aspect `820/312` | — | `app/v/e/[token]/page.tsx:93–95` |
| Marketing page `/v/m/[token]` | "Instagram Story / Reels / Facebook Story", "1080 × 1350" | "Facebook Cover Image", "820 × 312", aspect `820/312` | — | `app/v/m/[token]/page.tsx:84–86` |
| download-format zip filename label | `IG_Story` | `FB_Cover` | `IG_Post` | `app/api/tours/[tourId]/download-format/route.ts:12–14` |
| download-all zip filenames | `Social/<prefix>_IG_Story.jpg` | `Social/<prefix>_FB_Cover.jpg` | `_IG_Post.jpg` | `app/api/download-all/route.ts:64–66`; `app/api/download-all/marketing/route.ts:77–79` |

**Note:** on `/v/e` and `/v/m`, the single-file download filename comes from the **label** (`asset.label.replace(/ /g,"_")`, `v/e/[token]/page.tsx:169`, `v/m/[token]/page.tsx:161`). Changing those labels changes the filenames venues/marketers get.

### A.3 Every occurrence of "vertical" (any case)

**No key, DB column, DB value, Cloudinary path, or route segment uses "vertical".** Every occurrence is a display label, a sub-label, or a download filename.

Image contexts (all of them mean the 1080×1350 `story` format):
- `lib/localizer/formats.ts:61` — `label: "Vertical"`
- `TemplateEditor.tsx:126` — tab label `"Vertical"`
- `ShareWithMarketingButton.tsx:299` — `"Vertical Image"`
- `assets/page.tsx:13` — `sub: "VERTICAL"`
- `app/v/e/[token]/page.tsx:94` — `shape: "VERTICAL"`

Video contexts:
- `lib/localizer/formats.ts:94` — `"Vertical Video"` (tiktok); comment at :103
- `TemplateEditor.tsx:130` — `"Vertical Video"`; `:957` upsell copy "Vertical video for TikTok & Reels…"
- `ShareWithMarketingButton.tsx:300` — `"Vertical Video"`
- `assets/page.tsx:17` — `sub: "VERTICAL VIDEO"`
- `app/v/e/[token]/page.tsx:187` — `shape: "VERTICAL VIDEO"`, `filename: "Vertical_Video"` (download filename `…+Vertical_Video.mp4`)

Unrelated: CSS `resize: vertical` / `vertical-align` in several files.

**Implication:** the current "Vertical" label already belongs to 1080×1350. Item 3 needs the relabel and the new format to ship **in the same change**. Otherwise there will be two tabs/cards that read "Vertical", or a gap where neither does.

### A.4 Every place that enumerates or switches on format keys

A new 9:16 image format has to be added to every item below. ★ = hard-coded list that will **silently skip** a new format if it's missed. Nothing will error.

**Catalog / gating**
1. `lib/localizer/formats.ts` — `FormatKey` union (23–29), `FORMATS` record (46–118). `IMAGE_FORMATS`/`STATIC_FORMATS` derive from it.
2. `lib/localizer/tierGate.ts:72–77` — `isFormatAllowedForTier` uses `category`. A new `static` image format becomes Indie-allowed automatically. Decide whether that's intended.

**Upload (source images)**
3. ★ `app/dashboard/tours/[tourId]/assets/page.tsx:11–18` — `FORMATS` cards (uploadId vocab, aspect string, section).
4. ★ `assets/page.tsx:66–73` — load existing uploads (per-column `if` chain).
5. ★ `assets/page.tsx:~79–83` — `FORMAT_DB_COLS` (delete).
6. ★ `assets/page.tsx:88–95` — `FORMAT_CROP_KEY` (uploadId → crop key).
7. ★ `app/api/tours/[tourId]/upload-image/route.ts:14–21` — `FORMAT_COLUMN` (uploadId → `tours` column). An unknown id silently falls back to `image_url` (`:102`).

**Template editor**
8. `TemplateEditor.tsx:40` — `CropFormatKey` type; `:124–131` local `FORMATS` (labels and tab order); `:240–247` `configs` initial state (one line per key); `:436–460` `formatImageIds` (initial and refetch `.select(...)`); `:480` `isVideoFormat`; `:1110` "SET ALL FORMATS" target list ★; `:1143` yt_shorts-only "set all video" guard; `:1191–1197` Preview render dims map ★.
9. `app/dashboard/tours/[tourId]/template/CropModal.tsx:8` — `CropFormatKey` union.
10. `app/dashboard/tours/[tourId]/template/page.tsx:14` — `.select(...)` column list ★.

**Render (the live image path)**
11. `lib/clientRender.ts:53–57` `FORMAT_DIMS` ★ (unknown key falls back to **square** dims, `:149`). `:61–65` `SCALE_FACTORS`.
12. ★ `app/dashboard/tours/[tourId]/components/EventsTable.tsx:227–230` (`preCheckVenues` formats + dims), `:351–361` (`imageIds`, `formatDims`), `:366` (`formats` loop). Column name is built as `"render_" + fmt + "_url"` (`:379,433`).
13. ★ `app/api/renders/save-urls/route.ts:16` — `IMAGE_RENDER_COLUMNS` literal (drives old-render destroy). `:61` select list.
14. `app/api/renders/tour-data/route.ts:12,20–21,64–65` — select plus the "has any image" check and response shape ★.
15. `app/api/renders/generate/route.ts:13–19` (`RenderFormat`/`FORMAT_DIMS`), `:21` (`FORMATS = IMAGE_FORMATS as RenderFormat[]`; the cast hides new keys from the type checker), `:159,198` landscape 0.427 scale, `:433` select, `:534–538` `formatPublicIds`, `:648–651` CDN warm list. See B.3: the image branch of this route is currently dead code.

**Download / share**
16. ★ `app/api/tours/[tourId]/download-format/route.ts:11–17` — `FORMAT_MAP` (column, filename label, ext).
17. ★ `ShareWithMarketingButton.tsx:298–302` — per-format download buttons.
18. ★ `app/api/download-all/route.ts:16,64–67` and `app/api/download-all/marketing/route.ts:42,77–80` — select plus zip file list.
19. ★ `app/api/download/route.ts:22,29–36` and `app/api/download/marketing/route.ts:45,55–62` — select plus `allowedUrls` allowlist. A missing column here means **403 `url_not_allowed`** on download.

**Public token pages**
20. ★ `app/v/e/[token]/page.tsx:17` (select), `:93–96` (`photoAssets`).
21. ★ `app/v/m/[token]/page.tsx:43` (select), `:84–87` (photo assets).

**Ops / cleanup**
22. ★ `scripts/cloudinary-sweep.mjs:138–141` (tours live-set) and `:152–154` (venue_links live-set). See C.4.
23. ★ `lib/admin/deleteOrg.ts:121–140` — tours source-id list for org deletion.
24. `lib/cloudinary/destroyRenderAsset.ts:4` — comment only, enumerates allowed columns.
25. `app/dashboard/tours/[tourId]/page.tsx:29` — tours select (includes `image_*_id`).

Not format-aware (no change needed): `app/api/tours/[tourId]/overlay-config/route.ts` saves `overlay_config` / `crop_config` as whole JSON blobs with no key whitelist (`:23–27`).

---

## B. Rendering

### B.1 How layout works

Layout is **computed from dimensions + per-format fractional config**. There are no hand-built per-format layouts.
- `renderPoster` (`lib/clientRender.ts:139`) sizes the canvas from `FORMAT_DIMS[formatKey]`. Every element is placed at `field.x * w`, `field.y * h` (fractions stored in `tours.overlay_config[formatKey]`). Font sizes are absolute px at output resolution (`field.size * scale`, scale = 1.0 for all formats, `:61–65`).
- Text shrink-to-fit uses `availableWidth()` (`:80–85`) with a 0.95 margin factor.
- The base image is pre-cropped by a Cloudinary URL (`c_crop…/c_fill,w_,h_` or `c_fill,g_center`) built in `EventsTable.tsx:389–392` from `tours.crop_config[formatKey]` (fractional crop regions).
- The editor preview (`TemplateEditor.tsx:476–494`) scales the same fractions to a ≤600px-tall preview, so it's driven by dimensions as well.

Per-format special cases:
- `clientRender.ts:251` — venue `|` line-break support is **disabled for `landscape`**.
- `clientRender.ts:167,190,212,348,354,360` — `print` exclusions. `renderPoster` never actually receives `print`; the PDF goes through `app/api/renders/print-pdf/route.ts`.
- `generate/route.ts:159` — landscape font sizes × 0.427 on the server path only. The client path uses 1.0, and the comment at `clientRender.ts:59–60` describing the 0.427 scaling is stale.

### B.2 What a new 9:16 image layout needs

- A `FORMAT_DIMS` entry (and in every other list in A.4). Defaults for fields come from `DEFAULT_FORMAT` in the editor (`TemplateEditor.tsx:99–112`: venue y .76, city y .84, date y .91, sizes 36/28/28).
- **Crash risk:** `EventsTable.tsx:386` passes `overlayConfig[fmt] ?? {}` into `renderPoster`, and `drawText` reads `cfg.venue.x` / `cfg.date.x` / `cfg.city.x` with no fallback (`clientRender.ts:331,337,344`). On an existing tour whose `overlay_config` has no key for the new format (every tour until someone opens the editor and autosave runs), the client render **throws** for that format if a source image exists. Two ways to fix it: merge defaults inside `renderPoster`, or seed the key. Today this is hidden because every existing format already has a saved config.
- Source-image fallback is inconsistent. The server `generate` path falls back `story`/`landscape` → `image_square_id` (`:536–537`). The client path does **not**: a missing pid writes `null` (`EventsTable.tsx:377–382`). Decide whether 9:16 falls back to square (center crop of a square image to 9:16 is very lossy) or to `story`.
- "SET ALL FORMATS" (`TemplateEditor.tsx:1100–1140`) scales sizes by `targetH / 1080`. For 9:16 that gives ×1.78 font sizes, which is probably too large because width stays 1080. Same issue for the new landscape (1005/1080 ≈ 0.93, versus 0.29 today).

### B.3 Two render paths (surprise)

- **Live image path:** client canvas (`EventsTable.tsx:340–452`) uploads a dedicated JPEG to Cloudinary (unsigned preset `localizer_tours`, random public_id), then `POST /api/renders/save-urls`.
- **`/api/renders/generate`:** the only caller is `EventsTable.tsx:463` with `videosOnly: true`. Its image branch (`:548–559`, Cloudinary text-overlay transformation URLs) is **effectively dead code**, but it still iterates `IMAGE_FORMATS`. If anything ever calls it without `videosOnly` after a new image key is added, `FORMAT_DIMS[format]` is `undefined` and `buildCloudinaryUrl` throws.

### B.4 Safe zones / padding

**None.** The only margin logic is the 0.95 horizontal factor in `availableWidth` (`clientRender.ts:81`, mirrored in `EventsTable.tsx:249–252` and `generate/route.ts`). No vertical safe zone exists for any format. 9:16 Stories/Reels UI covers roughly the top ~14% and bottom ~20%, and that overlaps the current default text block (y .76–.91). The new format needs either different defaults or a safe-zone overlay in the editor.

---

## C. Persistence

### C.1 Rendered assets are stored

They are **not rendered on demand.** Rendered JPEGs are persisted:
- **Cloudinary:** the client uploads each poster as a new asset (unsigned preset, random public_id, no format key in the path; `EventsTable.tsx:424–433`).
- **DB:** one URL column per format on `venue_links` (`render_square_url`, `render_story_url`, `render_landscape_url`, `render_poster_url`, `render_tiktok_url`, `render_yt_shorts_url`). Venue/marketing pages and zips read these columns directly.
- **Source images:** one column per format on `tours` (`image_square_id`, `image_story_id`, `image_landscape_id`, `image_print_id`, `video_*_id`), plus `tours.overlay_config` (JSON keyed by format key) and `tours.crop_config` (JSON keyed by format key).
- Zips are built on request from those URLs (JSZip). The zips themselves are not stored.

### C.2 Stale assets if FB dims change

Yes:
- Every existing `venue_links.render_landscape_url` stays an **820×312 JPEG** until that event is re-rendered. `/v/e` and `/v/m` will show them in a box with whatever new aspect is hard-coded. If `aspect` is changed to `1920/1005` and stale 820×312 images remain, they'll be letterboxed or cropped (depends on objectFit).
- `save-urls` destroys the old render when a new URL replaces it (`save-urls/route.ts:82–97`), so re-rendering cleans up Cloudinary. Nothing re-renders automatically. `events.needs_rerender` exists (cleared at `save-urls:113`) and could be set in bulk to prompt re-renders.
- **Existing `overlay_config.landscape`** stores absolute px font sizes tuned for an 820-wide canvas, and y-fractions laid out for a 2.63:1 strip. At 1920×1005 (1.91:1), text will render at about 43% of the intended visual size, and vertical positions will shift. Existing landscape configs need a migration (scale sizes ×~2.34) or a reset to defaults.
- **Existing `crop_config.landscape`** regions were drawn at 820:312 aspect. Cloudinary will `c_crop` that region and then `c_fill` to 1920×1005, which recrops it differently. These should probably be cleared. The assets page already clears crop on re-upload (`assets/page.tsx:97–125`).
- Existing `image_landscape_id` source images were uploaded for 820×312. They'll be upscaled or cropped to 1920×1005 (low resolution). Users may need a prompt to re-upload.

### C.3 Format keys in DB / Cloudinary paths

- **DB column names embed the keys:** `tours.image_<key>_id`, `venue_links.render_<key>_url` (except print → `render_poster_url`). Client code builds the column name from the key (`"render_" + fmt + "_url"`, `EventsTable.tsx:379,433`; `` `render_${format}_url` `` in `generate/route.ts:552,557`). **A new key `X` therefore requires new columns `tours.image_X_id` and `venue_links.render_X_url`** (plus GRANTs are N/A since they're columns on existing tables).
- **JSON keys:** `tours.overlay_config.<key>`, `tours.crop_config.<key>`.
- **Cloudinary source paths use the *uploadId*:** `localizer/tours/tour_<tourId>_<uploadId>` (`upload-image/route.ts:93`), and the client video path `tour_<tourId>_<formatId>_<ts>` (`assets/page.tsx:155`). A new uploadId (e.g. `vertical` or `ig_vertical`) creates a new path with no collision. `facebook` stays `facebook` with `overwrite: true`, so re-uploading a new FB cover replaces the old source in place.
- Rendered-output public_ids are random (unsigned preset), with no key in the path.

### C.4 `scripts/cloudinary-sweep.mjs` live-set (LOCKSTEP)

- `tours` select (`:138–141`): `image_square_id, image_story_id, image_landscape_id, image_print_id, video_tiktok_id, video_yt_shorts_id`
- `venue_links` select (`:152–154`): `render_square_url, render_story_url, render_landscape_url, render_poster_url`. Video render URLs aren't listed; they're transformation URLs on source videos already covered by `video_*_id`.
- **Adding a 9:16 image format needs both new columns added here** (`image_<key>_id` and `render_<key>_url`). If they're missing, `--destroy` deletes every live 9:16 source and render as an orphan. `lib/admin/deleteOrg.ts:121–140` needs the same `image_<key>_id` addition. The FB dimension change needs no sweep change because it reuses the same columns.
- I couldn't find the "LOCKSTEP RULE" written down in CLAUDE.md, BACKLOG, or code comments. The closest is BACKLOG.md:762–776, "Cloudinary orphan sweep". Recommend codifying it (see Open questions).
- Stale doc: BACKLOG.md:772 says "NEVER destroy from `venue_links.render_*_url` columns — all transformation URLs". Since client render, image render URLs are dedicated uploads, and `save-urls` does destroy them.

---

## D. Date formatting

### D.1 Where the setting lives

- **`tours.overlay_config[<formatKey>].shortDate`**: an optional boolean inside JSON, **per tour, per format**. There's no dedicated column or template table. Saved wholesale via `PATCH/POST /api/tours/[tourId]/overlay-config` (`TemplateEditor.tsx:405,420`).
- **Default mismatch:** the editor's `DEFAULT_FORMAT.shortDate = true` (`TemplateEditor.tsx:107`), but every renderer treats a missing key as **false/long** (`EventsTable.tsx:387`, `TemplateEditor.tsx:1204`, `print-pdf/route.ts:218`, `generate/route.ts:555`). Today it's hidden because opening the editor merges and saves defaults. The read-time fallback for the new dropdown needs to pick one rule and apply it everywhere.
- Video inherits from story: `shortDateVideo = overlay_config[vformat].shortDate || overlay_config.story.shortDate` (`generate/route.ts:573`). Video is out of scope, but the fallback/migration logic touches this line because video text also uses `formatDateForRender`.

### D.2 Every date formatter for rendering, and the UI control

There are **four duplicated copies** of the same formatter, plus one inline preview copy that has already drifted:

| # | Location | Used by |
|---|---|---|
| 1 | `lib/clientRender.ts:113–128` `formatDateForRender` (exported) plus `shortMonth` (:108) and `ordinal` (:97) | `EventsTable.tsx:401` (live image render), `TemplateEditor.tsx:1207` (Preview button) |
| 2 | `app/api/renders/generate/route.ts:30–61` (local copy) | video URLs (`:574`); dead image branch (`:556`) |
| 3 | `app/api/renders/print-pdf/route.ts:38–53` `formatDate` (local copy, `SHORT_MONTHS`) | print PDF (`:240`) |
| 4 | `TemplateEditor.tsx:1459` inline IIFE | live drag preview text in editor |
| — | `TemplateEditor.tsx:1215` hard-coded sample `'APR 26TH'` / `'April 25 2026'` | preview with no events |

Current outputs: short = `JUN 26TH` (custom month table: "March", "Sept", "June", "July" are full words). Long = `June 26 2026` (no comma).
**Drift already present:** copy #4 renders long as `toLocaleDateString(... month long, day numeric, year numeric)` → **"June 26, 2026" with a comma**, while the actual render has no comma. The editor preview doesn't match the output.

UI control: `TemplateEditor.tsx:1748–1756`, a "Short Date Format" custom checkbox (`updateCfg("shortDate", !cfg.shortDate)`), helper text "e.g. JUN 26TH". It's per active format tab. Type: `FormatConfig.shortDate?: boolean` in `TemplateEditor.tsx:57` and `clientRender.ts:21`. "SET ALL FORMATS" copies `shortDate` (`:1125,1169`), and that copy must carry the new key too.

Other date displays (not poster renders, FYI): `/v/e` and `/v/m` headers (`weekday long…`, `v/e:81`, `v/m:72`), `/v/tour/[token]/page.tsx:126`, ShareWithMarketingButton `formatDate` (:19, token dates).

### D.3 Day of week

- **Not passed to the renderer.** `EventData` (`clientRender.ts:38–46`) has only `dateFormatted`. Day of week would need to be derived inside the formatter.
- There is a stored `events.day` text column, but it's unreliable: free text from AI import (`"Friday"`, `"Monday"`, `lib/parseImport.ts:5,64`), `"Fri"` from TourRouter push (`push-to-localizer/route.ts:107–112`), user-editable on its own in EventsTable (`EDITABLE_FIELDS` includes both `date_iso` and `day`, `EventsTable.tsx:28`). Editing the date does not update `day`. **Recommend deriving day of week from `date_iso`** and not using `events.day`.

### D.4 Timezone risk

- All render formatters use `new Date(iso + "T12:00:00")`. That's local-time noon, and `getDate()`/`getMonth()`/`getDay()` are local. This is safe in practice (noon gives a ±12h buffer), but it is the string form of `new Date(...)` that Non-negotiable rule #1 forbids. The new shared formatter should parse `YYYY-MM-DD` into `new Date(y, m - 1, d)`, per rule 1.
- Client render runs in the **user's browser timezone**. Server paths (print-pdf, generate video) run in Vercel's **UTC**. With the noon trick both agree, so don't drop it without switching to the component form.
- `toLocaleDateString("en-US", …)` without `timeZone` is used in the long format and in the editor preview. It's safe with the noon local date. Any new day-of-week code must not use `Date.UTC`/`toISOString` on these values.

---

## E. Tests

**There are no automated tests in this repo.** No `*.spec.*`, `*.test.*`, `playwright.config.*`, or `tests/`/`e2e/` directories, and no test script in `package.json`. QA is manual and agent-run. Reports are in `localizer-qa-reports/` (e.g. `2026-07-13_pre-launch-sweep.md`, `2026-07-13_cross-browser.md`), and Playwright suites (if any) presumably live on the QA Mac mini outside this repo. Nothing in-repo asserts format dimensions, labels, or date output.

---

## Risks / surprises

1. **"Vertical" is already taken.** It's the current label for 1080×1350 in the catalog, editor, share button, and venue page. The relabel and the new format must ship together.
2. **`formats.ts` is only partly adopted.** About 20 hard-coded lists (★ in A.4) will silently skip a new key. The download allowlist (A.4 #19) will 403 a new format's URLs, and the sweep (C.4) would **delete live 9:16 assets** if not updated.
3. **New key ⇒ new DB columns.** The client builds `render_<key>_url` from the key, and the source column is `image_<key>_id`. You need two `ALTER TABLE … ADD COLUMN`s (`tours`, `venue_links`), verified against `information_schema` first.
4. **Client render crash for a new format on existing tours.** `renderPoster` assumes `cfg.venue/date/city` exist, and `overlayConfig[fmt] ?? {}` doesn't provide them.
5. **FB dimension change breaks existing landscape configs.** Absolute px sizes tuned for 820 wide (text ~43% as large), y-fractions laid out for a different aspect, crop regions drawn for 820:312, low-res source images, and stale 820×312 renders in `venue_links` until re-render. Needs a migration/reset decision and probably a bulk `needs_rerender = true`.
6. **Changing FB dims inside `formats.ts` alone is not enough.** 820×312 is also hard-coded in `clientRender.ts:56`, `EventsTable.tsx:229,360`, `assets/page.tsx:14`, `v/e:95`, `v/m:86` (labels and aspect strings).
7. **Dead image branch in `/api/renders/generate`** still iterates `IMAGE_FORMATS` behind an `as` cast that hides new keys, and it carries a landscape-only 0.427 scale the client doesn't use.
8. **Four duplicated date formatters plus an editor preview that has already drifted** (comma). The dropdown work should consolidate them into one shared module first, or the variants will drift further.
9. **`shortDate` default mismatch** (editor true / renderers false). The read-time fallback has to choose one rule.
10. **Video reads `story.shortDate` as a fallback.** A date-key change touches video render text even though video formats are out of scope.
11. **Label-derived download filenames** on `/v/e` and `/v/m`. Relabeling changes filenames venues receive, and "Grid/Organic (4:5)" contains `/` and parentheses, which pass through into the filename unless sanitized.
12. **No vertical safe zones exist.** Default text positions (y .76–.91) sit inside the area that IG/TikTok story UI covers on 9:16.
13. **Indie tier** gets any new `static` image format automatically through `tierGate.ts`.
14. **Marketing copy** mentions "Instagram story" / "Facebook event images" (`app/page.tsx:266,286`; `app/dashboard/support/page.tsx:20,83`; `app/labs/page.tsx:274`). Low risk; review for consistency.

## Open questions for Drew

1. **Internal key for the 9:16 image.** `vertical`? It's unused as a key/column/path, but it collides in reading with the `story` format's history of being called "Vertical". Alternatives: `story_full`, `ig_vertical`. It determines column names (`image_<key>_id`, `render_<key>_url`) and the uploadId / Cloudinary path segment.
2. **Fallback source image** for 9:16 when none is uploaded: none (skip), `story` (4:5 → 9:16 crop), or `square`?
3. **Existing landscape configs** on the FB change: scale sizes/positions automatically, reset to defaults, or leave them and warn? Clear `crop_config.landscape`? Bulk-set `needs_rerender`?
4. **Old 820×312 renders** in `venue_links.render_landscape_url`: leave until the user re-renders, or force a re-render?
5. **Date keys and fallback rule.** Proposed keys: `slash` (8/8), `dot` (8.8), `slash_year` (8/8/26), `long` (June 8 2026), `ordinal` (today's short "JUN 8TH"; the old checkbox's "short" maps here, **not** to 8/8), plus a day-of-week variant (`dow_slash` → "FRI 8/8"). Missing `shortDate`: treat as `true` (editor default) or `false` (renderer default)?
6. **Should the date format stay per-format** (current per-tab behavior) or become per-tour?
7. **Indie access** to the new 9:16 image format: yes (static) or Pro-only?
8. **Safe-zone handling** for 9:16: new default positions only, or an editor overlay too?
9. **"Facebook Event Cover" scope:** does that label replace "FB Cover" / "Facebook Cover Image" on every surface (editor, assets, share, venue/marketing pages), and should the zip filename `FB_Cover` change too?
10. **Codify the LOCKSTEP rule?** Suggest adding it to CLAUDE.md non-negotiables: "any new `tours.image_*_id` / `venue_links.render_*_url` column must be added to `scripts/cloudinary-sweep.mjs` live-set and `lib/admin/deleteOrg.ts` in the same change."
11. **Schema verification SQL to run before speccing** (not run during this recon):

```sql
SELECT table_name, column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'tours' AND (column_name LIKE 'image_%' OR column_name LIKE 'video_%' OR column_name IN ('overlay_config','crop_config')))
    OR (table_name = 'venue_links' AND column_name LIKE 'render_%')
    OR (table_name = 'events' AND column_name IN ('date_iso','day','needs_rerender','render_status'))
  )
ORDER BY table_name, column_name;
```

```sql
-- How many tours have landscape configs/crops/sources that the FB change would affect, and how shortDate is set today
SELECT
  count(*) FILTER (WHERE overlay_config ? 'landscape')                         AS landscape_cfg,
  count(*) FILTER (WHERE crop_config ? 'landscape')                            AS landscape_crop,
  count(*) FILTER (WHERE image_landscape_id IS NOT NULL)                       AS landscape_src,
  count(*) FILTER (WHERE overlay_config -> 'story' ? 'shortDate')              AS story_has_shortdate,
  count(*) FILTER (WHERE (overlay_config -> 'story' ->> 'shortDate')::boolean) AS story_short_true
FROM public.tours;
```
