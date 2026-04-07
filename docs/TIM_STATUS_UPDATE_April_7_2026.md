# HWY61 Status Update — April 7, 2026

**To:** Tim
**From:** Drew

---

## Zero Open Bugs

Every bug in the tracker is now closed. Here is the full verified list:

| # | Summary | Status |
|---|---|---|
| BUG-1 | Logo route serving without auth | ✅ Closed |
| BUG-2 | Artist delete leaving orphaned data | ✅ Closed |
| BUG-3 | GET /api/tourrouter/artists returning 405 | ✅ Closed today |
| BUG-4 | Billing gate bypass on sub-routes | ✅ Not a bug — gate is in requireTourRouterAccess() by default |
| BUG-5 | Export routes returning 401 for tour not found | ✅ Closed |
| BUG-6 | shows PUT returning 500 for non-existent show | ✅ Closed |
| BUG-7 | getAuthOrg() returning 401 for missing org | ✅ Closed |
| BUG-8 | Finance report share link with no env var fallback | ✅ Closed |
| BUG-9 | shows PUT not updating updated_at | ✅ Closed |
| BUG-10 | shows DELETE returning 200 when show does not exist | ✅ Closed |
| BUG-11 | tour_roster missing from PUT allowed list | ✅ Closed today |
| NEW-A | Per-leg fuel math using stale single-vehicle formula | ✅ Closed today |
| NEW-B | vehicles_equipment DB default shape mismatch | ✅ Closed today |

---

## What Got Done Today

### Bug Fixes

**BUG-11 — Roster edits silently not saving**
"tour_roster" was missing from the PUT allowed list in the tours API route. Roster changes appeared to save but reverted on reload. One-line fix — roster edits now persist correctly.

**BUG-2 — Artist delete leaving orphaned data**
The artist delete cascade was missing finance_report_links. All other tables (tours, shows, guest lists, advance emails, expenses, intake documents) were already covered. Now fully clean.

**BUG-3 — GET /api/tourrouter/artists returning 405**
The GET handler was a placeholder that rejected all requests. Now returns the org's full artist list ordered by name.

**BUG-4 — Billing gate bypass (investigated, confirmed not a bug)**
The billing gate is built into requireTourRouterAccess() by default. Every route that calls it is automatically gated. The only routes using skipBillingGate: true are billing, demo-seed, and Localizer routes — all intentional.

**NEW-A — Per-leg fuel math using stale single-vehicle formula**
The routing table drive-vs-fly savings label was computing fuel cost using the old single-vehicle formula even on multi-vehicle tours — disagreeing with the summary stat card. Fixed: per-leg calculation now uses calcFuelCostMultiVehicle, gated by whether any active fleet vehicles exist. Legacy tours fall through to the old formula unchanged.

**NEW-B — vehicles_equipment DB default shape mismatch**
The artists table defaulted vehicles_equipment to [] (array) but the app writes {} (object). DB default corrected to {}.

---

### Advance Sheet Drag-Drop — Full Feature Shipped

Dropping a venue advance sheet onto the routing page now fully parses and populates the show drawer. Tested against a realistic Dallas advance sheet — all fields hit the database correctly.

**New fields added to the show drawer — Schedule section:**
- Load In time
- Sound Check time (new — was missing from schema entirely)
- Age Limit moved here from Financials

**New drawer section — Venue Info:**
- WiFi Network
- WiFi Password
- Parking Notes (own field — was previously lumped into Venue Notes)
- Venue Notes (green room, merch table location)
- Backline Notes (PA, monitors, stage specs)
- Hospitality Notes

**What the parser correctly extracted from the test advance sheet:**
- Load In: 3:00 PM
- Sound Check: 4:00 PM
- Doors: 7:00 PM
- Showtime: 8:30 PM
- Curfew: 11:30 PM
- Age Limit: 18+
- WiFi Network and Password
- Parking notes (separated from venue notes)
- Venue notes (green room, merch table)
- Backline notes (PA, monitors, stage dimensions, power)
- Production and settlement contacts with phone and email

**UX improvements:**
- Drag overlay no longer flickers when moving the file over child elements
- Progress bar animates in the processing modal while Claude parses the document

**Bugs fixed along the way:**
- Operator precedence bug in the intake route was silently discarding all parsed fields
- Advance prompt was lumping parking into venue notes and missing soundcheck entirely
- Anthropic API key was corrupted on Anthropic's backend — replaced across local dev and Vercel production

---

### Tim Brief Sent — Hotel / Lodging Financial Integration

A detailed brief has been saved to docs/TIM_HOTEL_LODGING_BRIEF.md. Please read and respond before the next build session.

Short version: hotel confirmation data already populates the show drawer correctly, but has zero financial impact. We want to wire it into calcTourFinancials() so hotel costs show up in the Accommodations tab on the finance page and all summary calculations.

The feature has four parts:
1. Lodging defaults on the Master Artist Profile (rooms, bed config, star rating)
2. Three-state hotel cost calculation: actual receipt > confirmation estimate > planning projection
3. Wiring the existing Accommodations tab on the finance page
4. Receipt intake writing actual costs to the matched show

We need your input on the estimation method and answers to the questions in the brief before any build starts. No build happens on this until you respond.

---

## What Is Next

1. Tim responds to hotel/lodging brief
2. Road App planning session when ready
3. Onboarding wizard (needs Tim's wizard steps and demo tour data)
4. Stripe restructure (blocked on EIN)

---

## One Thing To Know

The Anthropic API key powering document parsing (flight price estimation, deal memo parsing, advance automation, all AI intake) was replaced today. The old key became corrupted on Anthropic's backend — nothing changed on our end. New key is live in both local dev and Vercel production. Everything working normally.
