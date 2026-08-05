# Cloudinary Per-Entity Cleanup — Recon & Scoping

**Date:** 2026-08-05
**Purpose:** Scope the BACKLOG "Cloudinary / Storage orphan-file sweep across delete and replace paths" item by mapping exactly where Cloudinary assets are created, destroyed, and orphaned.
**Method:** Read-only grep + code trace. No files modified.

---

## TL;DR

Cloudinary has **4 destroy call sites** in the codebase, covering **image renders on save-urls replace**, **custom fonts on delete**, **custom fonts on upload-rollback**, and **org-wide batch deletion via `deleteOrg`**. Every other path that removes or replaces a Cloudinary-backed entity **orphans the asset** — tour delete, event delete, artist delete, and image/video source replacement (e.g. re-uploading a tour poster) all leave the previous Cloudinary asset live.

The working hypothesis ("destroy-on-replace in Import Assets is the ONLY path that destroys Cloudinary assets") is **partially refuted**: the image save-urls path exists, but so do three other destroy paths — the font-delete route, the font-upload rollback, and `deleteOrg`.

A future sweep should target four entity delete paths currently missing Cloudinary cleanup: **tour delete**, **event delete cascade**, **artist delete**, and **image/video source replacement on `/api/tours/[tourId]/upload-image`**.

---

## 1. DESTROY CALL SITES

Full repo grep for `uploader.destroy`, `api.delete_resources`, `.destroy(`. Four hits — all listed.

### A. Image render replace via save-urls
- **`lib/cloudinary/destroyRenderAsset.ts:31`** — `cloudinary.uploader.destroy(publicId, { resource_type: "image" })`
- **Called from `app/api/renders/save-urls/route.ts:89`** inside a loop over `IMAGE_RENDER_COLUMNS = ["render_square_url", "render_story_url", "render_landscape_url"]` (line 16).
- **User action:** re-render a venue link — `/api/renders/save-urls` receives new image render URLs, and any prior URL in the three image columns has its underlying source public_id destroyed.
- **Public ID shape:** bare public_id extracted from the URL via regex `\/image\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$` (line 15). `resource_type: "image"`, default `type: "upload"`.
- **Video guard:** `destroyRenderAsset.ts:21` explicitly refuses any URL containing `/video/upload/` — comment on lines 1–4 notes video render URLs are transformations on user-uploaded source videos, so destroying their public_id would erase the source. This is defense-in-depth over the already-narrow `IMAGE_RENDER_COLUMNS` list.
- **Failure mode:** fire-and-forget-with-log. Destruction failures logged at `save-urls/route.ts:91–96`, never fail the save.

### B. Custom font delete
- **`app/api/fonts/delete/route.ts:61`** — `cloudinary.uploader.destroy(storagePath, { resource_type: "raw", type: "authenticated" })`
- **User action:** delete a custom font from the fonts panel.
- **Public ID shape:** `{orgId}/{fontName}.{ext}` (bare — no folder prefix). `resource_type: "raw"`, `type: "authenticated"`.
- **Failure mode:** non-blocking — the DB row is deleted regardless of Cloudinary success.

### C. Custom font upload rollback
- **`app/api/fonts/upload/route.ts:152`** — `cloudinary.uploader.destroy(storagePath, { resource_type: "raw", type: "authenticated" })`
- **User action:** upload a font whose DB insert then fails — the just-uploaded Cloudinary asset is destroyed to prevent a permanent orphan.
- **Public ID shape:** identical to (B).
- **Failure mode:** try/catch-swallow — best-effort cleanup only.

### D. Org-wide batch destroy via `deleteOrg`
- **`lib/admin/deleteOrg.ts:253`** — `cloudinary.api.delete_resources(batch, group.options)` (admin API, batches of 100 via `chunk()` at lines 251–264).
- **User action:** admin invokes `POST /api/admin/delete-org` (dual-gated).
- **Public ID shapes destroyed:** grouped by resource type/type combo:
  - `{ resource_type: "image", type: "upload" }` — from `tours.image_square_id`, `image_story_id`, `image_landscape_id`, `image_print_id`.
  - `{ resource_type: "video", type: "upload" }` — from `tours.video_tiktok_id`, `video_yt_shorts_id`.
  - `{ resource_type: "raw", type: "authenticated" }` — from `custom_fonts.cloudinary_public_id`.
- **Failure mode:** per-batch error capture; DB deletion is authoritative and runs first (per file header comment at line 12).

### Verdict on the "Import Assets is the only destroy path" hypothesis
**Partially refuted.** The image-render save-urls path (A) matches the spirit of the hypothesis but is not the Import Assets flow — Import Assets is `POST /api/tours/[tourId]/upload-image`, which does **not** destroy the previous asset (it relies on Cloudinary's `overwrite: true` for public_ids that happen to match; anything else orphans). The three other destroy paths (B, C, D) all exist. No other destroys were found anywhere.

---

## 2. UPLOAD CALL SITES

### Cloudinary uploads
| # | File:line | Trigger | Persisted to | Stored as |
|---|---|---|---|---|
| U1 | `app/api/tours/[tourId]/upload-image/route.ts:92` (`cloudinary.uploader.upload_stream`) | POST /api/tours/[tourId]/upload-image with a file + formatId | `tours` row, column per format: `image_square_id` / `image_story_id` / `image_landscape_id` / `image_print_id` / `video_tiktok_id` / `video_yt_shorts_id` (line ~103–106 FORMAT_COLUMN mapping) | **Bare public_id** — deterministic name `tour_{tourId}_{formatId}` in folder `localizer/tours/`; `overwrite: true` |
| U2 | `app/api/fonts/upload/route.ts:109` (`cloudinary.uploader.upload_stream`, `resource_type: "raw"`, `type: "authenticated"`) | POST /api/fonts/upload with a font file | `custom_fonts` row, column `cloudinary_public_id` (line ~144) — dual-stored: also uploaded to Supabase Storage `fonts` bucket, URL stored in `storage_url` | **Bare path** `{orgId}/{fontName}.{ext}` |

### Non-Cloudinary uploads (mentioned for completeness — NOT in scope for a Cloudinary sweep)
| # | File:line | Trigger | Persisted to | Store |
|---|---|---|---|---|
| U3 | `app/api/tours/[tourId]/sponsor-logo/route.ts:136` | Tour sponsor logo upload | `tours.sponsor_logo_1_url` / `sponsor_logo_2_url` (full Supabase URL, line ~152–156) | Supabase Storage `localizer-assets` |
| U4 | `app/api/artists/[artistId]/advance-upload/route.ts:146` | Artist advance doc upload (stage plot, hospitality, FOH, W-9) | `artists.adv_stage_plot_url` / `adv_hospitality_url` / `adv_foh_url` / `adv_w9_url` (bare Storage path, line ~187) | Supabase Storage `advance-docs` (private) |
| U5 | Client-side, no dedicated API route (managed via artist profile page) | Custom advance materials | `artists.adv_custom_materials` — JSON array of `{ id, label, url }` objects; each `url` is a bare Storage path | Supabase Storage `advance-docs` |

**No other Cloudinary upload sites found.** No client-side unsigned-upload flow. No direct POSTs to `api.cloudinary.com`. No signature route. All uploads route through the two server endpoints (U1, U2).

---

## 3. DELETE HANDLERS WITH NO CLOUDINARY CLEANUP

For each entity that can own Cloudinary assets:

| Entity | Handler | Verdict | Orphans what |
|---|---|---|---|
| **Tour delete** | Client-only: `app/dashboard/TourTile.tsx:82` and `app/dashboard/artists/[artistId]/ArtistDetailClient.tsx:59` (direct `supabase.from("tours").delete()`). No API route. | **Orphans** | `tours.image_square_id`, `image_story_id`, `image_landscape_id`, `image_print_id`, `video_tiktok_id`, `video_yt_shorts_id` — all Cloudinary. Also `sponsor_logo_1_url`, `sponsor_logo_2_url` (Supabase Storage). |
| **Event / venue-link delete** | `app/api/events/[eventId]/route.ts` (DELETE handler) + client hits at `TourTile.tsx:80,90` and `ArtistDetailClient.tsx:58`. FK cascades to `venue_links` (per `docs/VENUE_LINKS_DELETION_AUDIT.md`). | **Orphans indirectly** | Events themselves hold no Cloudinary columns, but venue_links.render_*_url values reference Cloudinary transformations of tour source assets. Deleting the row leaves the source assets intact (correct — they're shared) but leaves no accounting trail for renderer intermediates. Not a Cloudinary orphan in itself. |
| **Artist delete** | Client-only: `TourTile.tsx:87` (`supabase.from("artists").delete()`). No API route. | **Orphans (but not Cloudinary)** | Artists table holds only Supabase Storage refs (`image_url`, `logo_url`, `adv_*_url`, `adv_custom_materials`). No Cloudinary columns to orphan directly — but any tours owned by the artist orphan their Cloudinary assets per the row above. |
| **Sponsor logo "delete" (null the column)** | `app/api/tours/[tourId]/sponsor-logo/route.ts:172–243` (DELETE method) | **Cleans up** (Supabase Storage) | N/A — no Cloudinary involved. Storage file is removed (line ~221), column nulled (line ~229). |
| **Custom font delete** | `app/api/fonts/delete/route.ts` (see destroy site B above) | **Destroys** | N/A — the only per-entity delete handler that actually calls `cloudinary.uploader.destroy`. |
| **Tour image / video "replace"** | `POST /api/tours/[tourId]/upload-image` uses `overwrite: true` + deterministic public_id (`tour_{tourId}_{formatId}`) | **Cleans up in the common case, orphans in edge cases** | If the same format slot is re-uploaded, Cloudinary overwrite handles the swap (no orphan). But nothing enforces the deterministic naming — if a stale row ever pointed at a differently-named public_id (e.g. a migration or manual edit), the overwrite doesn't touch it. Low-risk in practice; document as "assumed clean." |
| **Artist logo / photo replace (via TourRouter PATCH)** | `app/api/tourrouter/artists/[artistId]/route.ts` allows updating `image_url` and `logo_url` in-place | **N/A — Supabase Storage only** | These fields aren't Cloudinary; the replace pattern needs a separate Storage-sweep story. |
| **`deleteOrg`** | `lib/admin/deleteOrg.ts` (destroy site D) | **Destroys** | N/A — the org-wide sweep everything else lacks. |

**Summary:** the four entity paths currently missing Cloudinary cleanup are **tour delete**, **event delete cascade** (indirect), **artist delete** (via cascaded tours), and **tour image/video source re-upload with different public_id** (edge case). Adding a destroy step to each — or moving the delete flows through a shared helper that calls `cloudinary.api.delete_resources` after the DB delete — resolves the entire per-entity orphan story.

---

## 4. ORPHAN INVENTORY SHAPE

A sweep job needs to build a "known-live public_ids" set from the DB, then diff against Cloudinary's listing. The set is a union over the following `(table, column)` pairs — **only bare-public_id columns are usable directly**; transformation-URL columns must be excluded (they reference source assets already in the set) and Supabase-Storage columns are not Cloudinary.

### Cloudinary bare public_ids (destroyable — must be in the union)
| Table | Column | Resource type | Type | Notes |
|---|---|---|---|---|
| `tours` | `image_square_id` | `image` | `upload` | Folder prefix `localizer/tours/` |
| `tours` | `image_story_id` | `image` | `upload` | Folder prefix `localizer/tours/` |
| `tours` | `image_landscape_id` | `image` | `upload` | Folder prefix `localizer/tours/` |
| `tours` | `image_print_id` | `image` | `upload` | Folder prefix `localizer/tours/` |
| `tours` | `video_tiktok_id` | `video` | `upload` | Folder prefix `localizer/tours/` |
| `tours` | `video_yt_shorts_id` | `video` | `upload` | Folder prefix `localizer/tours/` |
| `custom_fonts` | `cloudinary_public_id` | `raw` | `authenticated` | Path shape `{orgId}/{fontName}.{ext}` — no folder prefix |

### Cloudinary transformation URLs (**exclude — reference the sources above**)
| Table | Column | Why excluded |
|---|---|---|
| `venue_links` | `render_square_url` / `render_story_url` / `render_landscape_url` | Transformation URLs on `tours.image_*_id`; destroying their public_id via `extractPublicIdFromRenderUrl` is the **image-render replace** path (site A) — appropriate on replace, dangerous during a sweep because the source may still be in use. |
| `venue_links` | `render_tiktok_url` / `render_yt_shorts_url` | Transformation URLs on `tours.video_*_id`. Video sources are user-uploaded; a sweep must NOT touch these. |
| `venue_links` | `render_poster_url` | Unclear origin — no upload or destroy path found. Possibly vestigial. Sweep should not assume this is a destroyable public_id. |

### Union query sketch
```sql
SELECT 'image' AS resource_type, 'upload' AS type, image_square_id AS public_id FROM tours WHERE image_square_id IS NOT NULL
UNION ALL SELECT 'image', 'upload', image_story_id FROM tours WHERE image_story_id IS NOT NULL
UNION ALL SELECT 'image', 'upload', image_landscape_id FROM tours WHERE image_landscape_id IS NOT NULL
UNION ALL SELECT 'image', 'upload', image_print_id FROM tours WHERE image_print_id IS NOT NULL
UNION ALL SELECT 'video', 'upload', video_tiktok_id FROM tours WHERE video_tiktok_id IS NOT NULL
UNION ALL SELECT 'video', 'upload', video_yt_shorts_id FROM tours WHERE video_yt_shorts_id IS NOT NULL
UNION ALL SELECT 'raw', 'authenticated', cloudinary_public_id FROM custom_fonts WHERE cloudinary_public_id IS NOT NULL;
```

**Orphan set** = Cloudinary listing (scoped by folder + resource_type + type combos above) MINUS this union. See §5.D for folder scoping.

---

## 5. EDGE CASES

### A. Authenticated-type font assets (commit `2465c9f`)
Custom fonts are uploaded with `resource_type: "raw"`, `type: "authenticated"` (`app/api/fonts/upload/route.ts:114` and `app/api/fonts/delete/route.ts:61`). **The Cloudinary Admin API `resources` listing endpoint filters by type — the default query returns `type=upload`, so authenticated raw assets will not appear** unless the sweep explicitly queries with `resource_type=raw` + `type=authenticated`. A sweep that only enumerates `type=upload` will miss the entire font namespace and never see font orphans.

**Recommendation:** either (a) treat the `custom_fonts` table as source-of-truth for authenticated raw assets and never diff-sweep them (rely on the delete-route + upload-rollback destroys), or (b) run a separate sweep pass with the authenticated-type filter.

### B. Public ID vs URL storage divergence
The union in §4 works because every Cloudinary column stores **bare public_ids**. In contrast, several columns store **transformation URLs** (venue_links.render_*_url) or **Supabase Storage URLs** (tours.sponsor_logo_*_url, artists.image_url/logo_url), which require parsing before use. **Do not conflate these in the union** — parsing a `venue_links.render_square_url` yields the same public_id already present in `tours.image_square_id`, so the union stays coherent, but destroying via the URL branch (image-render replace path A) mid-sweep would break other events pointing at the same source.

### C. Asset sharing across entities
A single Cloudinary public_id can be referenced from multiple rows:
- **Tour image/video sources** are referenced by every `venue_links` row for that tour (via transformation URLs). The union already captures the source once per tour — sweep behavior is correct.
- **Cross-tour reuse:** a Cloudinary public_id is deterministic per tour+format (`tour_{tourId}_{formatId}`), so the same asset can't naturally end up on two tour rows without a manual edit / migration. Low-risk, but worth checking with `SELECT public_id, COUNT(*) FROM (union query) GROUP BY public_id HAVING COUNT(*) > 1` before any destroy operation.
- **Per-entity delete risk:** adding a naive destroy to tour-delete without a reference-count check could clobber a shared asset in the edge case. The `deleteOrg` pattern (which globally enumerates then destroys) is naturally safe because it deletes everything.

### D. Folder conventions in Cloudinary
Two folder prefixes in use:
- **`localizer/tours/`** — all tour images and videos (`app/api/tours/[tourId]/upload-image/route.ts:93`, `folder: "localizer/tours"`).
- **No folder** — custom fonts use `{orgId}/{fontName}.{ext}` as the public_id, with `{orgId}` effectively acting as a per-org prefix but not a Cloudinary folder.

**Sweep should scope by folder** to avoid touching anything uploaded outside the app's namespace (test uploads, other apps sharing the Cloudinary account, historical assets). Recommended scoping:
- `folder:localizer/tours + resource_type=image + type=upload`
- `folder:localizer/tours + resource_type=video + type=upload`
- (Fonts: skip diff-sweep or query authenticated separately per §5.A)

### E. `save-urls` guarantees
The `IMAGE_RENDER_COLUMNS` constant at `app/api/renders/save-urls/route.ts:16` is a hardcoded literal list — the comment above it explicitly frames this as "the guarantee that video URLs can never reach destroyRenderAsset." If someone adds a new render column later (e.g. a `render_poster_url` promotion), this list must be updated in lockstep or the new column silently opts out of destroy-on-replace.

### F. Renderer intermediates in `/api/renders/generate`
The render pipeline (`/api/renders/generate`) writes **image** transformation URLs (persisted to `venue_links.render_square_url` / `story` / `landscape`) and **video** transformation URLs (persisted to `venue_links.render_tiktok_url` / `yt_shorts_url`). The image variants get destroyed on save-urls replace via path A; the video variants **do not** — and correctly so, because the video renders are transformations on the user-uploaded source, not net-new Cloudinary uploads. There's nothing to destroy on the video side.

### G. `render_poster_url` mystery column
`venue_links.render_poster_url` is referenced in download routes but no upload path was found for it, and it's not in `IMAGE_RENDER_COLUMNS`. Possibly a vestigial or dead column. **A sweep should not treat any URL parsed from this column as a destroyable public_id without further investigation.**

### H. Font upload dual-storage
Custom fonts live in **both** Cloudinary (authenticated raw) and Supabase Storage `fonts` bucket. The delete route (`app/api/fonts/delete/route.ts`) destroys from both (Cloudinary at line 61, Supabase Storage at line 67). A future orphan sweep on **Supabase Storage** must know these are dual-stored so a Cloudinary-only diff doesn't false-positive them.

### I. Rate limits
All upload/delete API routes are rate-limited to ~30/min per org. A production sweep must **bypass** the app routes (use `cloudinary.api.delete_resources` directly, mirroring `deleteOrg.ts:253`) rather than looping through the per-entity endpoints.

---

## Appendix: Cited files

- `lib/cloudinary/destroyRenderAsset.ts` — image-render destroy helper
- `lib/admin/deleteOrg.ts` — org-wide destroy pattern (use as sweep template)
- `app/api/renders/save-urls/route.ts` — image-render replace path
- `app/api/fonts/upload/route.ts` — font upload + rollback destroy
- `app/api/fonts/delete/route.ts` — font delete destroy
- `app/api/tours/[tourId]/upload-image/route.ts` — tour image/video upload (no destroy)
- `app/api/tours/[tourId]/sponsor-logo/route.ts` — sponsor logo upload/delete (Supabase, not Cloudinary)
- `app/api/artists/[artistId]/advance-upload/route.ts` — artist advance-doc upload (Supabase)
- `app/api/events/[eventId]/route.ts` — event delete cascade
- `app/dashboard/TourTile.tsx` — client-side tour/artist/event delete calls
- `app/dashboard/artists/[artistId]/ArtistDetailClient.tsx` — client-side tour delete calls
- `docs/VENUE_LINKS_DELETION_AUDIT.md` — prior audit of the event-cascade path
