# Tim Status — 2026-05-27

Six items waiting on you. Welcome email drafts are the big one — Day 6 unblocks the moment you pick (or merge) and voice them.

## 1. Welcome email — pick + voice (PRIMARY UNBLOCK)

Four drafts below. Two voice splits ("Get to work" peer-direct vs "Friendly steps" structured) × two framing variants (marketing-asset framing vs docs-inclusive framing).

The framing split happened because we realized Localizer's docs-delivery feature (W-9, stage plot, FOH via venue share link) is almost never mentioned in marketing surfaces. That's a positioning gap. Variants 2A and 2B include docs in the value prop; 1A and 1B stick to the prior marketing-asset framing.

**What we need:** pick one (or merge two), edit to voice, send back. We'll wire it into the webhook on the next pass.

Template variables to keep intact when editing:
- `{{first_name}}` — customer's first name, blank if not on file
- `{{TIER}}` — "Solo" / "Pro" / "Agency"
- `{{PRICE}}` — "29" / "59" / "129"
- `{{TRIAL_END_DATE}}` — readable date (only used in variants B)

From-address proposed: `Tim Regan <tim@hwy61labs.com>` (replies route to your inbox naturally). CTA target: `/dashboard` (the existing redirect handles welcome page routing for new users).

---

### Variant 1A — "Get to work" + marketing-asset framing

**Subject:** You're in — your tour starts here

**Body:**

Welcome to Localizer.

The five-minute version: add your artist, drop in your schedule (CSV, PDF deal memo, an Excel from your tour manager — Localizer reads all of it), upload your tour art, click generate. Every show on your tour gets its own venue link with every format every platform expects.

You're on a 7-day trial of {{TIER}}. After that, ${{PRICE}}/mo unless you cancel. You can switch tiers or cancel any time from Account Settings — no calls, no email back-and-forth.

[Open Localizer →] (links to /dashboard)

If anything's broken or unclear, hit reply. Comes straight to me.

— Tim
HWY61 Labs

---

### Variant 1B — "Friendly steps" + marketing-asset framing

**Subject:** Welcome to Localizer

**Body:**

Thanks for signing up. You're on Localizer {{TIER}} — ${{PRICE}}/mo after a 7-day free trial. You can cancel any time before {{TRIAL_END_DATE}} from Account Settings and you won't be charged.

Quick start:

1. Add your artist
2. Drop in your tour schedule (CSV, PDF deal memo, or Excel — all parsed automatically)
3. Upload your tour art (landscape, square, vertical)
4. Click Generate

Every show gets its own venue link. Send the link to the venue, they download what they need in the format they want. No more 11pm story-resend emails.

[Open Localizer →] (links to /dashboard)

Questions, bugs, or something that should work differently? Reply to this email. Comes straight to me.

— Tim
HWY61 Labs

---

### Variant 2A — "Get to work" + docs-inclusive framing (Drew's recommendation)

**Subject:** You're in — one link per show, everything inside

**Body:**

Welcome to Localizer.

Here's the pitch in one line: every show on your tour gets a single share link, and that link carries everything the venue or promoter needs to do their job. Posters and social art in every format, sure — but also your W-9, your stage plot, your FOH requirements. One link, one source of truth, no more "can you resend that W-9?" emails the week of the show.

The 5-minute version: add your artist, drop in your schedule, upload your art and your tech docs, click generate. Every show gets its link. Done.

You're on a 7-day trial of {{TIER}}. After that, ${{PRICE}}/mo unless you cancel. Switch tiers or cancel any time from Account Settings — no calls, no email back-and-forth.

[Open Localizer →] (links to /dashboard)

If anything's broken or unclear, hit reply. Comes straight to me.

— Tim
HWY61 Labs

---

### Variant 2B — "Friendly steps" + docs-inclusive framing

**Subject:** Welcome to Localizer

**Body:**

Thanks for signing up. You're on Localizer {{TIER}} — ${{PRICE}}/mo after a 7-day free trial. Cancel any time before {{TRIAL_END_DATE}} from Account Settings and you won't be charged.

Quick start:

1. Add your artist
2. Drop in your tour schedule (CSV, PDF deal memo, or Excel — all parsed automatically)
3. Upload everything venues will need: tour art (landscape, square, vertical), W-9, stage plot, FOH requirements
4. Click Generate

Every show gets one share link. Send it to the venue, they download what they need — every format every platform expects, plus the tech docs and paperwork they always ask for. No more 11pm "can you resend the stage plot?" emails.

[Open Localizer →] (links to /dashboard)

Questions, bugs, or something that should work differently? Reply to this email. Comes straight to me.

— Tim
HWY61 Labs

---

## 2. FAQ positioning copy — voice pass

Both lines in `app/dashboard/support/page.tsx` still scope Localizer narrowly. Need your rewrite for consistency with the landing hero shift (see item 3).

**Line 56 — the pricing FAQ answer:**

Currently includes: `"Localizer (tour marketing automation): $29–$129/mo"`

The pricing numbers are now correct (fixed May 27). The parenthetical "(tour marketing automation)" is the undersell. Suggested rewrite: "(every show asset + tech docs delivered to venues)" — or your voice.

**Line 145 — the Localizer description FAQ answer:**

Currently reads:

> Localizer is tour marketing automation. Upload one promo image and Localizer generates every show asset for every platform — Instagram story, Facebook event, X post, poster, web graphic — branded with your fonts, your colors, your layout. Then send the entire tour's assets to every promoter in one link. No more emailing individual files.

Needs the same positioning shift as the hero — docs-inclusive. Suggested direction (your voice): lead with the share-link-carries-everything frame, mention W-9 / stage plot / FOH as peer to social art.

---

## 3. Landing hero copy diff — informational

Shipped May 27 (no approval needed, but you should see it). The hero subhead on `/` changed from:

**Before:**

> Localizer is tour marketing automation. Upload one promo image and generate every show asset for every platform — Instagram, Facebook, X, poster, web — branded with your fonts, your colors, your layout. Then send the whole tour to every promoter in one link.

**After:**

> Upload one promo image and generate every show asset for every platform — Instagram, Facebook, X, poster, web — branded with your fonts, your colors, your layout. Drop in your W-9, stage plot, and FOH requirements too. Every promoter gets one link with everything they need.

Three changes: dropped the "tour marketing automation" undersell line, added the W-9 / stage plot / FOH sentence, refreshed the closer to emphasize "everything they need." Headline ("One image. Every asset. Every platform. Every show.") and CTAs unchanged.

If anything reads off-voice, flag it and we'll revise.

---

## 4. Canned support responses — Day 7

Still owe 5 canned responses for the support flow. Topics flagged in the 30-day plan; bump me if you want the list re-shared.

---

## 5. Onboarding video script — your v1 notes

Waiting on your review of the v1 script (`docs/LOCALIZER_ONBOARDING_VIDEO_SCRIPT.md`). Once your notes land, Drew has a proposed addition to flag the docs-delivery feature (W-9 / stage plot / FOH) in the asset-upload beat — deferred until after your v1 review so we're not piling edits.

---

## 6. Onboarding wizard per-user vs per-org mismatch — pre-launch decision

`orgs.onboarding_completed` is org-level; `org_members.user_role` is per-user. New users joining an existing onboarded org never get their role set. Three possible fixes (full detail in `docs/BACKLOG.md`):

1. Move onboarding state to `org_members` so each user onboards independently
2. Add a lightweight role-picker prompt that fires on first login for any member with `user_role = null`
3. Accept the gap — assume your beta invites go to users creating fresh orgs

Need your call before beta launch.

---

*Generated 2026-05-27 from Drew's working state. Reply on whichever items move first — no need to address them in order.*
