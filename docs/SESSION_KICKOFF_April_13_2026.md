# Session Kickoff — Tour Marketing Hub Build

**Date created:** April 12, 2026 (end of day)
**Status:** Tim has approved the concept. Ready to build.
**Estimated time:** 2.5–3 hours focused. Five steps, each its own Claude Code prompt.

---

## What we're building, in one paragraph

A way to send a marketing contractor a single URL that shows them every show on a tour, lets them click any show, and lets them download that show's marketing assets (social, video, print poster) — without ever exposing the advance materials (W-9, hospitality rider, FOH requirements, stage plot). The existing `/v/e/[token]` venue-facing flow is **not touched**. The marketing flow is a parallel set of pages and endpoints that physically cannot render advance assets because their code does not query those columns.

---

## The five pieces, in build order

1. **Supabase migration** — new `marketing_tokens` table
2. **Marketing-only per-show page** — `/v/m/[token]/page.tsx` (copy of `/v/e/[token]/page.tsx` minus advance materials)
3. **Marketing download endpoint** — `/api/download-all/marketing/route.ts` (copy of `/api/download-all/route.ts` minus advance assets)
4. **Tour marketing hub page** — `/v/tour/[token]/page.tsx` (new, polished, lists all shows on the tour)
5. **"Share with marketing" button + modal** in the existing tour view (create / list / revoke tokens)

Stop after each step. Verify it works. Commit. Move to the next.

---

## Pre-flight checklist

Before starting:

- [ ] `cd ~/localizer && git pull`
- [ ] `git status` clean
- [ ] No tabs open at hwy61labs.com (avoid the `/token` rate-limit trap)
- [ ] On the old Mac Pro
- [ ] Coffee

---

## Step 1 — Supabase migration

**Run this in the Supabase SQL Editor. Not the terminal.**

```sql
CREATE TABLE marketing_tokens (
  token         text PRIMARY KEY,
  tour_id       uuid NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  org_id        uuid NOT NULL,
  created_by    uuid NOT NULL REFERENCES auth.users(id),
  label         text,
  expires_at    timestamptz,
  revoked_at    timestamptz,
  last_used_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_marketing_tokens_tour_id ON marketing_tokens(tour_id);
CREATE INDEX idx_marketing_tokens_org_id ON marketing_tokens(org_id);

ALTER TABLE marketing_tokens ENABLE ROW LEVEL SECURITY;

-- Org members can manage their own tokens
CREATE POLICY "Org members manage marketing tokens"
ON marketing_tokens
FOR ALL
USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()))
WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
```

**Verify with:**

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'marketing_tokens'
ORDER BY ordinal_position;
```

You should see 9 rows. If `org_members` table doesn't exist or has different column names, the policy will fail — paste the error into Claude.ai chat and we'll adjust.

**Token validity:** A marketing token is valid if `revoked_at IS NULL` AND (`expires_at IS NULL OR expires_at > now()`).

---

## Step 2 — Marketing-only per-show page

**Goal:** Copy `/v/e/[token]/page.tsx` to `/v/m/[token]/page.tsx`, then delete the Advance Materials section. Same look, same feel, fewer assets.

**Important — token model:** The marketing per-show page uses the marketing token, NOT the venue_links token. The page validates the token against `marketing_tokens`, then loads the venue_links row by joining through the tour and event.

**Claude Code prompt:**

````
Create a new file: app/v/m/[token]/page.tsx

Base it on app/v/e/[token]/page.tsx — read that file first, then create the new one.

CRITICAL DIFFERENCES from /v/e/[token]/page.tsx:

1. The token is a marketing_tokens.token, not a venue_links.token.
   - First, look up the marketing_tokens row by token.
   - Validate: revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now())
   - If invalid, call notFound()
   - The marketing token is tour-scoped, so it grants access to ALL shows on that tour.

2. The route must accept a show ID via query param: /v/m/[token]?eventId=xxx
   - Use this to load the specific event.
   - Validate the event belongs to the same tour as the marketing token.
   - If not, call notFound()

3. DO NOT query artist.adv_stage_plot_url, adv_hospitality_url, adv_foh_url, adv_w9_url, or adv_custom_materials.
   DO NOT include the Advance Materials section anywhere in the JSX.
   The page should physically not have access to these fields.

4. Update the "Download All" button href to point to /api/download-all/marketing?token=[marketingToken]&eventId=[eventId]
   instead of /api/download-all?token=[venueLinksToken]

5. Update the per-asset download links similarly — they need to use the marketing endpoint and pass the marketing token + event id, not the venue_links token.

6. Update last_used_at on the marketing_tokens row when the page is successfully loaded.

EVERYTHING ELSE stays the same: hero, photos grid, print poster button, video grid, Spotify embed, footer, all styling.

Show me the diff before applying. Run npm run build after applying.
````

**After it builds clean, manually test:**
- Create a marketing token in SQL editor manually for testing:
  ```sql
  INSERT INTO marketing_tokens (token, tour_id, org_id, created_by, label)
  VALUES ('test123', '<some_tour_id>', '<some_org_id>', '<your_user_id>', 'Test')
  RETURNING token;
  ```
- Visit `http://localhost:3000/v/m/test123?eventId=<some_event_id>`
- Confirm: page renders, photos/videos/poster show, **Advance Materials section is gone**
- Confirm: `last_used_at` got updated in the DB

**Commit when verified:**
```bash
git add "app/v/m/[token]/page.tsx"
git commit -m "Add marketing-only per-show viewer page"
git push
```

---

## Step 3 — Marketing download endpoint

**Goal:** Copy `/api/download-all/route.ts` to `/api/download-all/marketing/route.ts`, then delete the `advAssets` array and the `customMaterials` block.

**Claude Code prompt:**

````
Create a new file: app/api/download-all/marketing/route.ts

Base it on app/api/download-all/route.ts — read that file first, then create the new one.

CRITICAL DIFFERENCES:

1. Accept TWO query params: ?token=<marketingToken>&eventId=<eventId>

2. Validate the marketing token against the marketing_tokens table:
   - revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now())
   - If invalid, return 404

3. Look up the event by eventId, then verify event.tour_id matches the marketing token's tour_id.
   If not, return 404.

4. Then fetch the venue_links row for that event_id (events have a venue_links row; if multiple, take the most recent).

5. Keep the existing paid-gate check using getLocalizerAccessLevel(link.org_id) — this stays.

6. DO NOT query artist.adv_stage_plot_url, adv_hospitality_url, adv_foh_url, adv_w9_url, or adv_custom_materials.
   DO NOT include the advAssets array or customMaterials block.
   The zip should ONLY contain imageAssets (Social/) and videoAssets (Video/).

7. Update last_used_at on the marketing_tokens row on successful download.

EVERYTHING ELSE stays the same: filename slug logic, JSZip building, response headers.

Show me the diff before applying. Run npm run build after applying.
````

**Test:**
- Visit the marketing per-show page from Step 2
- Click "Download All"
- Confirm zip downloads, contains `Social/` and `Video/` folders, and **no `Advance/` folder**

**Commit:**
```bash
git add app/api/download-all/marketing/route.ts
git commit -m "Add marketing-only download endpoint (excludes advance materials)"
git push
```

---

## Step 4 — Tour marketing hub page

**Goal:** New page at `/v/tour/[token]/page.tsx` that lists every show on the tour with status indicators.

**Claude Code prompt:**

````
Create a new file: app/v/tour/[token]/page.tsx

This is the tour-level marketing hub — a polished landing page that lists every show on a tour and links to the marketing-only per-show page for each one.

REQUIREMENTS:

1. Token validation: look up token in marketing_tokens.
   - Validate: revoked_at IS NULL AND (expires_at IS NULL OR expires_at > now())
   - If invalid, call notFound()
   - Update last_used_at on successful load.

2. Load tour info: query tours by the marketing token's tour_id.
   - Get: name, band_name, image_url, artist_id, date range
   - Also fetch artist for spotify_url (for the embed at the bottom — same as the per-show page)

3. Load all events for that tour, ordered by date_iso ASC:
   - SELECT id, date_iso, day, city, state, venue, render_status FROM events WHERE tour_id = ? ORDER BY date_iso

4. Layout (Warhol-styled, match /v/e/[token]/page.tsx aesthetics):

   HEADER (same as /v/e/[token]):
   - HWY61 wordmark left, "TOUR MARKETING KIT" small caps right
   - 3px black border bottom

   HERO BLOCK:
   - Big band name display font, all caps, 52px (same as per-show page hero)
   - Date range underneath: "March 14 — April 22, 2026"
   - Show count: "24 shows"
   - 3px border, bg-surface background, 28px padding (same hero style)

   SHOWS SECTION:
   - Section label: "SHOWS" in mono blue uppercase
   - Each show is a card/row in a vertical list:
     - Date on left (mono, prominent)
     - City, State / Venue in middle
     - Status badge on right: "READY" (green) if render_status = 'completed', "RENDERING" (gray) otherwise
     - 3px border, surface background
     - Hover: border becomes crimson
     - If READY: clickable, links to /v/m/[token]?eventId=[event.id]
     - If not READY: not clickable, slightly faded

   SPOTIFY EMBED (if artist has spotify_url) — same as per-show page

   FOOTER — same as /v/e/[token] (HWY61 wordmark + POWERED BY HWY61)

5. Use inline styles with var(--hw-*) CSS variables — same pattern as /v/e/[token]/page.tsx. Do NOT use Hw* components for this page since the existing per-show page doesn't either, and we want consistency.

6. Page must be a server component (async function, no "use client").

Show me the diff before applying. Run npm run build after applying.
````

**Test:**
- Visit `http://localhost:3000/v/tour/test123` (using the test token from Step 2)
- Confirm: hero renders with band name and date range, shows list correctly, status badges work, clicking a "READY" show navigates to the marketing per-show page
- Hard-test: shows with `render_status != 'completed'` should NOT be clickable

**Commit:**
```bash
git add "app/v/tour/[token]/page.tsx"
git commit -m "Add tour marketing hub landing page"
git push
```

---

## Step 5 — Share with Marketing button + modal

**Goal:** Entry point in the existing tour view to create marketing tokens. Name the contractor, set optional expiration, generate URL, copy to clipboard, see active tokens, revoke.

**This step has two sub-pieces:**
- 5a. API routes to create / list / revoke tokens
- 5b. Modal component in the tour view

**Claude Code prompt 5a:**

````
Create three API routes for managing marketing tokens:

1. POST /api/marketing-tokens/create
   Body: { tourId: string, label: string, expiresInDays?: number }
   - Auth: requires session, user must be member of tour's org
   - Generates a random token (32 chars, url-safe)
   - Inserts into marketing_tokens
   - Returns: { token, label, expiresAt, hubUrl: '/v/tour/{token}' }
   - Use .select().maybeSingle() after insert to catch RLS failures

2. GET /api/marketing-tokens/list?tourId=xxx
   - Auth: requires session, user must be member of tour's org
   - Returns active tokens (revoked_at IS NULL) for the tour, ordered by created_at DESC
   - Include: token, label, expires_at, last_used_at, created_at

3. POST /api/marketing-tokens/revoke
   Body: { token: string }
   - Auth: requires session, user must be member of token's org
   - Sets revoked_at = now() on the token
   - Returns: { success: true }

All three routes use supabaseServer() and follow existing patterns from other API routes in this codebase.

Show me each file before creating. Run npm run build after all three are created.
````

**Claude Code prompt 5b:**

````
Add a "Share with marketing" button to the existing tour view at:
app/dashboard/tours/[tourId]/page.tsx

Add the button in a sensible location near the top of the page (alongside other tour-level actions if any exist).

Clicking the button opens a modal (use HwModal from app/components/hw/HwModal.tsx).

Modal contents:
- Title: "Share with Marketing"
- Form section:
  - Label input (HwInput): "Contractor name or label" (e.g., "Sarah at AcmePR")
  - Optional: Expiration dropdown (HwSelect): "Never", "7 days", "30 days", "90 days"
  - HwButton: "Generate Link"
- Below the form, a list of existing active tokens for this tour:
  - Each row: label, expiration, last used, copy URL button, revoke button
  - Use HwTable or HwCard — whichever fits the existing patterns better
- "Generate Link" calls POST /api/marketing-tokens/create
- On success: copies the full URL (window.location.origin + hubUrl) to clipboard, shows HwToast "Link copied to clipboard", refreshes the token list
- "Revoke" calls POST /api/marketing-tokens/revoke with confirm() prompt first
- On mount, fetch the existing tokens via GET /api/marketing-tokens/list

Make this a client component ("use client"). Show me the file before creating. Run npm run build after.
````

**Test:**
- Open an existing tour
- Click "Share with marketing"
- Create a token, copy URL, paste in new browser tab → should land on the hub
- Verify the token appears in the list
- Revoke the token, confirm the hub URL now 404s

**Commit:**
```bash
git add app/api/marketing-tokens app/dashboard/tours/[tourId]/page.tsx
git commit -m "Add Share with Marketing modal and token management API"
git push
```

---

## Final smoke test (after all 5 steps)

End-to-end on production after Vercel deploys:

1. Open a real tour with rendered assets in production
2. Click "Share with marketing", generate a token labeled "Test"
3. Copy URL, open in incognito window (no auth)
4. Confirm hub loads, shows list looks right
5. Click into a ready show
6. Confirm marketing per-show page renders, **no advance materials section visible**
7. Click Download All, confirm zip has Social/ and Video/ folders, **no Advance/ folder**
8. Go back to tour view, revoke the token
9. Reload the incognito window — should 404
10. Done

---

## Things to remember

- **Quote bracket paths in zsh** for git add: `git add "app/v/m/[token]/page.tsx"`
- **Clear `.next` cache** if the dev server gets weird: `rm -rf .next node_modules/.cache`
- **Never modify** `/v/e/[token]/page.tsx` or `/api/download-all/route.ts` — they're for venues, leave them alone
- **`.maybeSingle()`** after every insert/update on marketing_tokens to catch silent RLS failures
- One Claude Code prompt at a time, show diff before applying, verify build, commit, move on
- If anything feels weird, stop and ask in the Claude.ai planning chat before continuing

---

## End of session reminder

After finishing all 5 steps:

```bash
open -a TextEdit docs/SESSION_LOG.md
```

Add an entry covering:
- Marketing hub shipped (5 pieces, list them)
- Any gotchas hit
- Whether anything got deferred
- Next session priority (probably Freemium Unit D, still top of queue)

Then:
```bash
git add docs/SESSION_LOG.md
git commit -m "Session log: marketing hub shipped"
git push
```
