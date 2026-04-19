# Stale URL Bug — Evidence Capture

**Date captured:** 2026-04-19
**Captured by:** Drew
**Context:** pre-Tim-demo investigation per SESSION_KICKOFF_April_19_2026.md instructions.

## The bug

`/api/download` returns `403 url_not_allowed` because the client-side page is displaying a render URL that no longer matches the DB value. The allow-list in `app/api/download/route.ts` does byte-equal string comparison of the `?url=` query param against the six `render_*_url` columns on the matching `venue_links` row. When the client URL diverges from the DB URL, every download attempt 403s.

## Evidence

**Tour:** bc8ac6af-7efe-4af1-add5-e6407b5af51b
**Event:** THE COMMISSARY, Germantown TN, 2027-04-03
**Venue link token:** fbef4c39dc8883330500cb48a167f8660dd3dec02e34e13265edc0a23bf841b0
**sent_at:** NULL (fresh, unsent link — regeneration SHOULD have updated it)

### Client-side URL (what the venue page tried to download)

https://res.cloudinary.com/dlhrc91ne/image/upload/v1776617315/k7mswcwiz3j1ozqyra79.jpg

### DB-side URL (what was in venue_links.render_square_url at time of download)

https://res.cloudinary.com/dlhrc91ne/image/upload/v1776617996/hif8btjwsu8px7as2enf.jpg

### Observations

- Two different Cloudinary public IDs (k7msw... vs hif8b...).
- Two different version timestamps (v1776617315 vs v1776617996) — the DB URL is ~681s newer.
- `sent_at` is NULL — allow-list enforcement should still allow fresh regens.
- Other image-format URLs on this row (render_story_url, render_landscape_url, render_poster_url) are NULL. Either never rendered, or a regen cleared them without repopulating.
- Video URLs (render_tiktok_url, render_yt_shorts_url) ARE populated and contain the sponsor-logo-1 layer (via l_fetch of sponsor-logo-1.png from Supabase). Sponsor logos on videos are being written into the URL builder correctly.

## Root cause hypothesis (not yet confirmed)

The client page that renders the download button is not reading fresh data after regeneration. Suspect places to investigate:

1. The venue link page component — is it using server-side cache (`cache: "default"`) instead of `cache: "no-store"` on its Supabase fetch?
2. Next.js router cache — is the page being served from the client-side router cache after a stale-while-revalidate window?
3. The `/api/renders/save-urls` endpoint — is it successfully writing the new URL before the client re-renders?
4. Is there a client-side state that holds the old URL after regeneration completes?

## Do NOT delete anything

Do NOT mass-delete test data, do NOT regenerate this tour's assets, do NOT touch venue_links or events rows related to this tour until Drew explicitly decides to discard the evidence. This captured state is the reproduction.
