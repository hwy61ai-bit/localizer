# HWY61 Labs / Localizer — Status for Tim

**Date:** April 26, 2026
**Author:** Drew (via Claude session)
**Purpose:** Canonical snapshot of beta-launch readiness. Supersedes the
draft invite email's status claims wherever they conflict.

---

## TL;DR

Two security holes you flagged are fixed and shipped. Beta system is
live and tested end-to-end with two real claims (yours and a test
account). The invite-code system is the actual auth flow — your draft
email describes a whitelist flow that doesn't match what's deployed,
so the email needs revision before send. Three small things you
should know that aren't in your draft.

---

## Auth flow — important correction needed in your invite email

Your draft tells testers to "sign in at [LINK] using this email
address" and they get a magic link. That's not how the system works.

The actual flow:

1. Tester arrives at the sign-in page
2. Tester pastes their HWY61-BETA-XXX code (you assign one per tester)
3. Tester enters their email
4. Magic link is sent
5. Tester clicks the magic link **in the same browser** they entered the
   code in (different browser → "session expired" — confirmed in testing
   today)
6. Tester lands in their org with full access

Codes are not optional. Without a code, the gate blocks them. Tested
end-to-end today: failed magic links do NOT burn codes (claim is
correctly gated on successful auth completion), and the same-browser
constraint is real and bites if you don't warn testers.

**Edits needed in the invite email:**

- Add a line per tester showing their code
- Add the same-browser warning near the sign-in instructions
- Confirm with Drew before send: the [LINK] URL is `https://hwy61labs.com/login`
  pending final verification

---

## Engineering asks from your email — current status

**Video custom text lines** — Already shipped. Working end-to-end on
TikTok and YT Shorts. Pipeline is unified with image overlays, so
fonts and styling carry across formats.

**Beta onboarding glue (skip wizard for beta orgs)** — Done. Wizard is
already skipped. When you hand Drew the tester email list, the comp
script sets `localizer_plan='agency'` and onboarding flags in one pass.

**Tester org creation** — The proper invite-code system is shipped and
tested, not deferred. 10 codes seeded as `HWY61-BETA-001` through
`HWY61-BETA-010`. You claimed `001` April 23. Drew claimed `002` today
in a smoke test. Eight codes still unclaimed.

**Confirm sign-in URL for [LINK]** — Drew will confirm before you send.
Best guess `https://hwy61labs.com/login`.

---

## Open items from your email — current status

**Per-user vs per-org onboarding mismatch** — Confirmed reproducing.
Both your account and the test account have `user_role = null` in
`org_members`. Not a beta blocker since the wizard is skipped, but
it's a data model question that needs resolution before any post-beta
wizard work. Carrying as open.

**Two pre-existing unauth API routes** — Both were exploitable from
outside the app entirely (no session needed). Both fixed and shipped
today.

- `/api/tours/[tourId]/overlay-config` had an inverted security model:
  RLS rejection of an unauthorized write triggered a service-role
  retry that bypassed RLS. Net effect: anyone with a tour ID could
  rewrite any tour's template config. Fixed by adding auth +
  org-membership check, removing the service-role fallback entirely.
  Five smoke tests passing in production.

- `/api/renders/print-pdf` accepted bare event IDs with no validation.
  Anyone with an event ID could generate any tour's print PDF. Fixed
  by requiring a token query param validated against `venue_links`
  (event-scoped) or `marketing_tokens` (tour-scoped). Promoter
  experience unchanged — they receive share links, click download,
  it works. Random people on the internet hitting the API directly
  now get 401. Five smoke tests passing in production.

**Venue-download billing gate caveat** — Still parked. Not a beta
blocker since everyone's comped to Agency tier.

---

## Things you should know that aren't in your draft

**1. Custom text lines is a real Localizer differentiator and your
email doesn't pitch it.**

Two user-editable text fields per tour, render on every non-print
format (square, story, landscape, TikTok, YT Shorts). Use cases:
"w/ The Supporting Band Name", website URLs, sponsor taglines. Tour
managers can position each text line independently per format. This
solves the "I have to rebuild the base image in Photoshop just to
add a tour sponsor tagline" pain. Currently invisible in the invite
copy. Worth a sentence in "What it does" if you want testers to find
and use it.

**2. Sponsor logos have a UX wrinkle.**

They tint to text color on web outputs, but render in native color
on the print PDF. If a tester compares a downloaded JPEG to the print
poster and notices the logos are different colors, that's documented
behavior, not a bug. The UI explains it but testers may not read.
Worth knowing if it comes up on a 1:1 call.

**3. Two orphaned tours in the database, no human owner.**

Pre-launch test data sitting in a "My Workspace" org with zero
members. After today's security fix, those tours are correctly
unreachable to any human — but they exist and Drew may clean them
up before invites go out. Not a blocker, just hygiene.

---

## Beta system data check (run today)

- 10 codes seeded, 2 claimed (`001` Tim, `002` Drew test), 8 available
- 5 distinct users in `org_members` across 5 orgs (one org with 2 members
  is HWY 61 TEST CO.)
- 11 abandoned "My Workspace" orgs with zero members (pre-April-9
  signup orphans, harmless)
- All beta claim flow components verified working

---

## What Drew needs from Tim before invites go out

1. **Final tester list** — emails, with which code each gets
2. **Email revisions** — incorporate the auth flow correction and
   same-browser warning
3. **`[DROPBOX LINK]`** — confirm the sample asset pack is ready
4. **Send timing** — once the above is settled, no code work blocks
   the invites going out

## What Tim needs from Drew before invites go out

1. **`[LINK]` URL confirmation** — Drew will confirm before send
2. **Optional:** brief on the custom-text-lines feature if you want
   to add a sentence to the invite

---

## What's deferred until after beta

- Onboarding wizard Option B (Localizer-only narrative) — needs your
  input on the steps
- Per-user-vs-per-org onboarding data model resolution
- Stripe business setup (parked on bank account decision)
- Public launch gate removal (`COMING_SOON=true` flag)
- Sponsor logo native-color-on-PDF UX rework if testers complain

---

## Where to find more detail

- Full session log: `docs/SESSION_LOG.md` (entry dated 2026-04-26)
- BACKLOG: `docs/BACKLOG.md`
- Beta system docs: `docs/BETA_USER_GUIDE.md`
