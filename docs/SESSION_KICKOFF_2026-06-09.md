# Session Kickoff — June 9, 2026

## Start here (in order)

### 1. Watermark hero fix (~5 min, do first)
The landing hero (app/page.tsx) still shows "1 artist, watermarked" on the free/trial tile. We no longer watermark — the watermark/shows-per-month/feature-gate model was cut May 28 and replaced by the no-card 7-day full-access trial. Change to "7-day free trial, full access" (approved wording).
- Recon: grep -n "watermark\|Watermark\|1 artist\|1 Artist" app/page.tsx
- Stale-WRONG copy on the highest-traffic public page. Deferred multiple sessions — clear it first.

### 2. Venue-link page "Share" / copy-link button
On the venue link viewer (app/v/e/[token]/page.tsx), add a Share button directly below the existing "Download All" button. Copies the page link to clipboard, shows "Copied" on click — so the user can share the link easily.
- Simple client-side copy. Mirror the existing pattern: ShareWithMarketingButton.tsx handleCopy does navigator.clipboard + a "Copied ✓" timeout state.
- NOTE: the venue page is a server component — the copy button must be a small client component / island, since clipboard access is client-side. Don't try to make the whole page client.
- This is customer-facing (a promoter sees the venue page), so it's real UX polish, not internal.

## Context
- HWY61/Localizer launch, target ~June 19. Most engineering done; remaining work is small fixes + Tim-blockers.
- Two-terminal workflow: claude.ai for planning/recon/diffs, Claude Code for edits. One file per prompt. tsc before committing; npm run build for lib/* or middleware/routing changes. Vercel auto-deploys on push to main. Quote bracketed paths for zsh.
- COMING_SOON gate verified working (band-aid removed June 5) — flipping COMING_SOON=false at launch will correctly show the site.

## Tim-blockers (waiting on him, longest pole = legal)
- Legal-review attorney recipient (3 docs ready, external clock not started — longest pole)
- Q5 cancellation copy (last open email question)
- Demo video script review (Day 12; also now carries getting-started coverage)
- Live Stripe verification screen-share (also unblocks 2 gated pricing-FAQ copy upgrades)

## ⚠️ Launch-day dependency (don't forget)
/labs is hidden only via the COMING_SOON gate and has NO noindex (confirmed). Before flipping COMING_SOON=false at launch, fix its stale "unlimited artists" copy or hide it permanently — else it reappears with wrong pricing. (Also tracked in LAUNCH_PROGRESS open items.)

## Recently shipped (June 8)
- Download All Full Tour (bulk zip one format across all shows)
- SEND-no-email bug fix (no longer marks "sent" without emailing)
