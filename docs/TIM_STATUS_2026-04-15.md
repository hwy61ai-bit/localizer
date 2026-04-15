# Status Update for Tim — April 15, 2026

**From:** Drew
**Period covered:** April 15, 2026 (delta since yesterday)
**Previous status doc:** docs/TIM_STATUS_2026-04-14.md (April 9–14 catch-up)

---

## Read this first if you haven't seen yesterday's doc

Yesterday I shipped a six-day catch-up at `docs/TIM_STATUS_2026-04-14.md` covering everything from April 9 through April 14 — Freemium gate refactor, Localizer critical fixes, GEO_CITIES geocoding backend, your April 11 UI spec (16/20 items), Tour Marketing Hub, middleware session rotation fix, sponsor logos, and the bug backlog cleanup. If you haven't read it yet, start there. This doc only covers what's new since yesterday afternoon.

---

## One correction from yesterday's doc

Yesterday's doc flagged the **Tour Manager field in the Localizer UI as still pending** — that was wrong. It actually shipped April 12 as part of the artist profile page (`app/dashboard/artists/[artistId]/profile/page.tsx`), and it persists correctly. Both TourRouter and Localizer read from the same artist profile screen, so adding it once added it everywhere it needed to go. My earlier note that it needed a separate Localizer-side build was incorrect — apologies for the noise.

So that question is resolved. Nothing for you to do on Tour Manager.

---

## Shipped today (3 commits)

### 1. Session kickoff doc (2a07a68)

Routine session-start doc at `docs/SESSION_KICKOFF_April_15_2026.md`. No code changes.

### 2. Fix: misleading "Rendering soon" copy on venue/marketing pages (2ba4626)

When a render URL was null on the venue link page or marketing viewer page, it showed "Rendering soon" — which was misleading because the actual cause is almost always "user never uploaded a source for that format," not "render is in progress." Changed the placeholder text to "Not provided" in both `app/v/e/[token]/page.tsx` and `app/v/m/[token]/page.tsx`. Pure copy change, no behavior change.

If you have a strong opinion on the wording ("Not provided" vs "Not included" vs "Skipped" vs something else), let me know — happy to swap it.

### 3. Fix: visibility toggles ignored in saved renders (a39d5be) — important one

**The bug:** When you uncheck Venue, City, or Date in the Design Template editor, the field correctly disappears from the on-screen draggable overlay. But the actual saved render (the JPEG that ends up on the venue link page) was ignoring the toggle and drawing all three fields every time.

**Root cause:** Your April 11 commit (`495f898`) wired the `showVenue` / `showCity` / `showDate` flags into the template editor's preview-URL builder and the on-screen overlay, but missed all four downstream code paths that actually generate the saved renders:

- `lib/clientRender.ts` (Canvas API — square, story, landscape JPEGs)
- `app/api/renders/generate/route.ts` `buildCloudinaryUrl` (Cloudinary image URL builder — also images)
- `app/api/renders/generate/route.ts` `buildCloudinaryVideoUrl` (Cloudinary video URL builder — TikTok, YT Shorts)
- `app/api/renders/print-pdf/route.ts` (pdf-lib — print poster PDF)

So the toggles were honored at design time but ignored at render time. Six render paths total visible to users (square / story / landscape / tiktok / yt_shorts / print PDF), and every single one was drawing fields you'd toggled off.

**Fix:** Wired the three flags into all four code paths using the same `?? true` default pattern as the editor preview, so existing tours without these flags set behave identically to before. Tested locally on all four paths — toggles now correctly hide fields in saved renders.

**How long this bug was live:** Since April 11, when the toggles shipped. Anyone who tried to use the toggles between April 11 and today saw them work in the editor and silently fail in the actual rendered output.

---

## Open questions for you (carried forward, plus one new one)

### 1. Sponsor logo tint question (carried from yesterday)

Black PNG on dark background isn't visible. Two options:

- **Option A:** Keep strict no-tint and update the upload helper text ("upload a PNG in the color you need for your background")
- **Option B:** Add an optional "tint to text color" toggle per sponsor slot for monochrome logos

Need your call before the next sponsor logo iteration.

### 2. Venue-download billing gate caveat (carried from yesterday)

There's an architectural decision currently documented only as a source-code comment in `lib/localizer/billingGate.ts`:

> Venue-facing download routes (`/api/download`, `/api/download-all`) deliberately omit the `userEmail` argument when calling the billing gate, so admin-owned venue shares are gated like any other org for the public download flow.

In other words: even if I (an admin) own a tour, the public venue download page for that tour gets gated based on the org's plan, not my admin status. I think this is correct (otherwise admins testing the public flow get a meaningless test), but worth ratifying so we can fold it into the billing gate audit doc.

### 3. NEW — "Send to All Promoters" button on the gigs page

This is a new proposal. Right now you have to hit Send individually on every show row, which is fine for a 5-show tour but tedious for a 25-date one.

**Proposed behavior:**
- Button placement: top of the gigs page next to the existing controls
- Default behavior: skip rows that have already been sent (don't re-spam promoters who already got the link)
- Confirmation modal before firing: "Will send to N of M promoters. K already sent (skipped). L missing promoter email (skipped)." with Cancel / Confirm
- Sends fire serially with a small delay between them (avoid Resend rate limits and spam-folder clustering)
- Same per-promoter send mechanism as the existing single-send button — no new email path, just a loop over the existing one
- Show a progress indicator while sending; show a final summary when done ("Sent to 18 promoters, 4 skipped, 2 failed — see details")

**Specific questions:**
- Should there be a way to force re-send to a promoter who already got the link? (Maybe a checkbox in the confirmation modal: "Re-send to promoters who already received the link" — off by default.)
- What should we do about rows missing a promoter email? Silently skip, or surface them in the confirmation so the user can fix them first?
- Any UX preference on button label? "Send to all promoters" vs "Send to all" vs something else?

Bulk-send features have an outsized blast radius if anything's off (a misclick at 2am could send dozens of promoters the wrong link or duplicate emails), so I'd rather wait for your sign-off than build it cold and ask forgiveness.

---

## Still open from earlier (no movement today)

Carried forward from yesterday's doc. Repeating only for visibility:

- Mapbox write-back silent RLS risk in `lib/tourrouter/geocoding.ts`
- Full billing gate audit across 41 API routes (blocked on your input for shared helper design)
- Hardcoded `CITY_COORDS` in `lib/tourrouter/constants.ts`
- Tour-level Download All page (`/v/tour/[tourId]`) — needs a dedicated half-day session
- Remaining expense tabs (Transport, Food, Gear, Misc, Merch, Promo, Other)
- Onboarding wizard completion (blocked on your wizard steps + Beta Test Band demo data)
- Stripe restructure (blocked on EIN)
- Freemium Unit D rate limiting
- Per-user vs per-org onboarding state mismatch
- `/api/renders/print-pdf` has no auth (pre-existing)
- `/api/tours/[tourId]/overlay-config` service-role fallback bypasses RLS (pre-existing)

---

## Commit log (April 15)

| SHA | Description |
|-----|-------------|
| 2a07a68 | docs: session kickoff April 15 |
| 2ba4626 | fix: change null-URL placeholder from 'Rendering soon' to 'Not provided' |
| a39d5be | fix: honor venue/city/date visibility toggles in saved renders |

---

## Questions summary

1. **Sponsor logo tint** — strict no-tint + helper text, or add an optional tint toggle per slot?
2. **Venue-download billing gate caveat** — does my description match your intent?
3. **Send to All Promoters button** — yes/no on the proposal, plus answers to the three sub-questions (force re-send checkbox, missing-email handling, button label)?
4. **Next session focus** — bulk send (if you greenlight), Mapbox RLS hardening, tour-level Download All page, remaining expense tabs, Freemium Unit D, or something else?
5. **Onboarding wizard** — do you have wizard steps and Beta Test Band demo data ready?

Let me know which threads to pull on.
