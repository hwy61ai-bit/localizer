# Status update — April 18, 2026

Hey Tim,

Update covering everything since the April 15 status doc. Three days of work — here's what changed, grouped by theme rather than day-by-day. Ahead of our meeting tomorrow.

---

## Headline: Custom text lines (your must-have) — shipped for image formats

The two user-editable text fields you signed off on are live in the template editor and rendering correctly on Square, Story, and Landscape JPEGs.

How it works:
- Two fields ("Custom Text 1" and "Custom Text 2") in the editor sidebar, each with its own checkbox to enable per-format
- Matches the Sponsor Logo pattern — checkbox collapses the block when off
- Free text input, 35-char limit, same font and color as the rest of the overlay
- Drag to position, resize, and align (left/center/right)
- Per-format independence — enable on Square doesn't enable on Story
- 35-char limit per line, empty input skips render entirely
- Hidden on the Local Poster for Print tab by design (matches our earlier decision to keep the print format logo-free and text-free for pre-designed posters)

**Videos (TikTok + YT Shorts) are next up** — about an hour of remaining work. I'll knock that out tomorrow or in our next session. I wanted to get you something working on images first since that covers the most use cases you described.

One thing to flag: a user hitting Re-Generate All only regenerates **unsent** venue links. Sent links keep their original assets (which is correct — we don't want assets changing out from under promoters who already received a link). For tomorrow's demo I'll use a fresh tour with unsent links.

---

## Auth bug (beta blocker from the 15th) — diagnosed, fixed, closed

The "session expired, clear your cache" bug that had been hitting daily is fixed. Root cause was a cookie-scoping mismatch between browser and three server-side auth writers — browsers ended up with two sets of Supabase auth cookies at different scopes, and refresh-token rotation was racing between them.

Fix shipped on the 17th. Verified clean on the 18th via 24-hour auth log soak test — zero `refresh_token_already_used` events in the post-fix window (we had 200+ of them in the 24 hours before).

This was the biggest risk item blocking beta onboarding. It's done.

---

## Public link pipeline refactor (bigger than it sounds — silent data bug)

While you were testing on the 16th, we caught that the entire public share pipeline had a latent bug: `/v/e`, `/v/m`, `/v/tour` viewers plus all four `/api/download*` routes were using a session-authenticated Supabase client instead of an anonymous-safe one. Anyone clicking a share link from a fresh browser (no login, no cookies) was getting silent 404s.

The reason it worked in our testing: you and I were always logged in when we opened shared links, so the auth happened invisibly. Real external recipients would have hit the wall.

Refactored 8 files to use a service-role client on public routes. Verified end-to-end anonymous in a clean browser. Also added an ESLint rule preventing this mistake from re-occurring (bans the auth-bound client from public-facing route folders).

Found and fixed the same pattern in TourRouter's billing gate on the 17th.

---

## Print poster — final state + Tim decision on logos

After a lot of back-and-forth on print PDF logo tinting (trying pre-tint at upload, client-side tinting, server-side sharp tinting), on the 17th we landed on the simpler answer: **no band logo and no sponsor logos on the Local Poster for Print tab at all.**

Rationale: 11×17 print posters are usually pre-designed with branding baked into the artwork already. Adding our own overlay branding on top invites visual doubling.

This is live across all four surfaces — control sidebar, live preview, canvas renderer, and the PDF output. Clean.

**Print PDF text rendering** now correctly uses bold weight to match the preview (small typography bug we caught along the way). Tradeoff: print PDF generation went from ~5-8s to ~24s because of the font-weight fetch cost. We added an elapsed-time counter + progress bar to the download button so users know to wait. Longer-term we can cache the font bytes server-side to reclaim some of that time (backlogged).

---

## Sponsor logo tinting

Now working in the editor preview AND in downloaded JPEGs — they tint to match the overlay text color, matching how band logos already worked. On video formats the Cloudinary tint is a one-line addition (backlogged, not urgent).

Print PDF keeps sponsor logos in their native colors (for the same reason we removed them outright — print posters should respect their source artwork).

---

## Small UX polish (misc)

- Video upload progress bar on the assets page — no more wondering if a TikTok video is actually uploading
- 10×10 grid overlay appears in the template editor only while you're dragging an element — helps with alignment
- Sticky preview column in the template editor — the image stays visible while you scroll sidebar controls
- Roster drag-drop hint ("drag to reorder") under the add-crew button
- "HWY61 LABS" / "POWERED BY HWY61 LABS" branding parity in venue-share page footer
- Small copy fixes on your list from the 15th: band logo caption on artist profile, sponsor logo render-color helper text

---

## Backlog / deferred (not blocking your use of the app)

A few items I'm aware of and tracking:

- **Cloudinary video overlays for custom text** — Step 6 of the custom text build. ~1 hour. Next session.
- **Template editor stale UI on back-navigation** — if you save changes, navigate away, then navigate back in the same browser session, the editor can show cached state until you hard-refresh. Attempted fix yesterday introduced a worse prod bug so I reverted. Needs a different approach. Affects returning-in-same-session users only, not fresh visits. Workaround: hard refresh.
- **Print PDF speed regression** — mentioned above, known, plan in place.
- **Send to All Promoters bulk button** — your proposal from the 15th. Build constraints captured in the backlog (rate limits, idempotency, failure handling, confirmation modal) so when you greenlight, it doesn't take a lot of setup.
- **Venue-download billing gate caveat** — documented in source as a code comment; should be ratified as a conscious decision at some point.
- **Sponsor logo tinting toggle on/off** — the April 14 question about whether to make the tint an option vs. always-on. Currently always-on. Still awaiting your read on that.
- **Remaining 4–5 items from your verbal test pass on the 16th** — you said you'd send a written list. Not urgent, just flagging so it doesn't fall off the radar.

---

## Questions open from the April 15 doc

Three things I'd asked about and still haven't gotten a definitive answer on (no rush, but parking them here so they don't disappear):

1. **Sponsor logo tint** — strict no-tint + helper text vs. optional tint toggle. Currently the code tints by default.
2. **Venue-download billing gate** — there's a caveat in how the billing gate handles venue downloads for admin emails; worth ratifying as a deliberate decision rather than leaving as an undocumented code comment.
3. **Send to All Promoters** — want this as a bulk button? Three sub-questions: force re-send checkbox, missing-email handling, button label.

Any reads on those before tomorrow would be useful, but if not we can cover in the meeting.

---

## For tomorrow

See you in the meeting. I'll demo the custom text lines on a fresh tour (fresh = unsent links so we can re-generate freely). Happy to walk through any of the other items above if you want to see them in practice.

Drew