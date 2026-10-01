-- 2026-10-01 — Facebook Event Cover reset (820x312 -> 1920x1005)
-- DO NOT RUN BLINDLY. Run by hand in the Supabase SQL Editor, one statement at a time.
-- Each statement is standalone (no BEGIN/COMMIT). Run the SELECT preview above each UPDATE first.
--
-- Why: saved landscape overlay sizes/positions and crop regions were tuned for the
-- 820x312 strip. Removing the keys makes the editor and renderer fall back to the
-- shared defaults (lib/localizer/formatDefaults.ts) and an uncropped c_fill.
--
-- Pre-check: confirm overlay_config / crop_config are jsonb (the `?` and `-` operators below are jsonb-only).
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tours'
  AND column_name IN ('overlay_config', 'crop_config');


-- ── a. Remove `landscape` from tours.overlay_config ────────────────────────────

-- Preview
SELECT count(*) AS tours_with_landscape_overlay
FROM public.tours
WHERE overlay_config ? 'landscape';

UPDATE public.tours
SET overlay_config = overlay_config - 'landscape'
WHERE overlay_config ? 'landscape';


-- ── b. Remove `landscape` from tours.crop_config ───────────────────────────────
-- An emptied crop_config is set to NULL, matching the app convention
-- (assets/page.tsx clearCropForFormat writes null when no crops remain).

-- Preview
SELECT count(*) AS tours_with_landscape_crop
FROM public.tours
WHERE crop_config ? 'landscape';

UPDATE public.tours
SET crop_config = CASE
    WHEN (crop_config - 'landscape') = '{}'::jsonb THEN NULL
    ELSE crop_config - 'landscape'
  END
WHERE crop_config ? 'landscape';


-- ── c. Flag events with a stale 820x312 render for re-render ───────────────────
-- Join: venue_links.event_id = events.id. The app reads only the active link
-- (is_active = true) for an event — see app/api/renders/generate/route.ts and
-- app/api/renders/save-urls/route.ts (.eq("event_id", ...).eq("is_active", true)).
-- Inactive links are never displayed, so they are excluded here.

-- Preview
SELECT count(DISTINCT e.id) AS events_to_flag
FROM public.events e
JOIN public.venue_links vl ON vl.event_id = e.id
WHERE vl.is_active = true
  AND vl.render_landscape_url IS NOT NULL;

UPDATE public.events e
SET needs_rerender = true
WHERE EXISTS (
  SELECT 1 FROM public.venue_links vl
  WHERE vl.event_id = e.id
    AND vl.is_active = true
    AND vl.render_landscape_url IS NOT NULL
);
