# HWY61 Status Update — April 6, 2026

**For:** Tim
**From:** Drew
**Re:** BUG-4 done + full QA bug sweep + import pipeline fixes

---

## Headline

BUG-4 (TourRouter billing gate rollout) is complete. Every authenticated TourRouter route is now protected by a shared access helper. Combined with everything else fixed today, the QA bug list from April 5 is fully cleared and four additional pre-existing bugs that would have hit us in beta got caught and squashed.

The only Phase 7M blockers remaining are non-code: your EIN (for the Stripe restructure) and your beta user list.

---

## What shipped today

### BUG-4 — Full billing gate rollout
- New shared helper `requireTourRouterAccess()` with a discriminated-union return pattern.
- Rolled out to all 35 authenticated TourRouter routes (was 6 protected, now all 38 — everything except the 3 public token-based routes for advance forms and shareable finance reports).
- Lapsed subscribers can still reach `/billing/status`, `/billing/checkout`, `/billing/portal`, demo-seed, and the two Localizer cross-product routes — so they can reactivate without getting locked out of the billing screens themselves.
- Soft lockout verified: 401 for unauthenticated, 403 for authenticated-but-no-org, 403 for authenticated-but-no-subscription.

### Every numbered QA bug from April 5 — closed
- **BUG-3**: GET `/api/tourrouter/artists` now returns proper 405 with `Allow: POST` header
- **BUG-6**: Show PUT now returns 404 (not 500) when the show doesn't exist
- **BUG-7**: 401-vs-403 convention now consistent everywhere
- **BUG-9**: `updated_at` migration applied to `tour_shows` and the write re-added
- **BUG-10**: Show DELETE now returns 404 (not silent 200) on no-op deletes

### Import pipeline — major bug fixes (this is the big one for you)
The import pipeline had a quietly broken column mapper that's been silently dropping fields since Phase 6. Found it while testing your TeamWass / Beta Test Band Dust & Neon Tour spreadsheet.

- **Greedy substring bug**: the `bestGuess` function in `columnMapper.ts` was using `.includes()` for partial matching, which meant `"contact".includes("act")` was true — so "act" (a shorthand alias for `event`/`artist`) was matching the word "Contact" via substring, and your "Contact" column was getting mapped to the `event` field. That's why "Mike Torres" was showing up as the venue name in the routing table. Fixed: aliases of 3 characters or fewer now require exact match.
- **`promoter_contact` is now a real first-class field** in the import pipeline. Added to FIELD_ALIASES, MAPPER_FIELDS, ParsedShow type, and the POST /shows handler. Your "Contact" column now correctly flows to `tour_shows.promoter_contact` and shows up in the side drawer as "Promoter Contact."
- Re-imported your test file end-to-end and verified everything lands in the right columns.

### Offer / currency display fixes
- **The "USD" column on the routing table was a lie.** It was just reformatting `offer_amount` as `$X` with no currency conversion. A CA$9,000 show was displaying as `$9,000` instead of the converted ~$6,470. Now uses the live currency rates and `toUSD()` helper, same as the financials page.
- **`offer_display` was going stale.** Editing the offer amount in the side drawer was updating the underlying number but not regenerating the display string, so the OFFER column would show the old value while the USD column showed the new one. Fixed by regenerating `offer_display` whenever amount or currency changes.
- **New `formatOfferDisplay()` helper** with proper symbols ($, CA$, £, €, A$). Replaced three duplicated formatting implementations across import / intake / Add Show modal.
- **`currency_rates` now auto-populates** on tour creation. Previously, brand new tours had `currency_rates: {}`, which meant the routing page silently fell back to rate=1 for everything until someone visited the financials page and clicked "Fetch Live Rates." Now POST /tours seeds rates at creation time, and the routing page also has a defensive fallback that fetches rates on first load if they're missing (so existing tours get repaired automatically).

### UX improvements you'll notice
- **Currency dropdown** instead of a free-text input on the offer field. 8 touring currencies: USD, CAD, EUR, GBP, AUD, JPY, CHF, MXN. Both in the side drawer and the Add Show modal.
- **Side drawer header** now shows the venue name instead of "SHOW DETAIL" as the default. Falls through to event name and finally to "SHOW DETAIL" only if both are empty.
- **Guest List section moved up** in the side drawer — was at the very bottom, now sits between Financials and Schedule. This is something you and I might want to revisit together for a final ordering pass, but it's much better than having it buried.
- **Routing table venue cell** now prioritizes the venue name over the event name. If `event` ever gets bad data again (like the Mike Torres bug), the venue column won't get hijacked.
- **"+ New Tour" now redirects to the import page** instead of dropping you on an empty routing screen. Almost no one is going to type 30 shows in by hand.
- **Drag-and-drop** now works on the master artist profile for stage plot, hospitality rider, FOH requirements, and W-9. Previously dragging a file onto those cards would open it in a new browser tab (no drop handler intercepting the browser default). Click-to-upload still works alongside drag-and-drop.

### Other fixes caught during the sweep
- **Guest list 500s**: the guest_list table's actual schema (no `org_id` column, scoping enforced via RLS through `show_id -> tour_shows.org_id`) didn't match what the route handlers and demo-seed were trying to write. Reverted to the real column names, removed the bogus filters.
- **Demo-seed guest_list insert** silently broken since Phase 7D — was inserting into nonexistent columns. Fixed.
- **Demo-seed is now idempotent**. Calling it twice returns the existing demo tour ID instead of creating duplicates. Onboarding users (and me, during testing) can't accidentally end up with five Beta Test Bands anymore.

### Supabase migrations run today
- `ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();`

---

## Phase 7M status

| Item | Status |
|---|---|
| BUG-4 full rollout | Done |
| All numbered QA bugs | Closed |
| Import pipeline | Fixed |
| Currency conversion | Fixed |
| Drag-and-drop uploads | Fixed |
| Stripe restructure | Blocked on EIN |
| Beta user list | Waiting on you |
| Coming Soon gate removal | Ready when EIN + beta list arrive |

---

## What I still need from you

1. **EIN** — biggest single blocker. The Stripe restructure can't move until this lands.
2. **Beta user list** — names + emails for invite codes.
3. **Tutorial videos** — scripts are ready, you just need a clean live site to record against.
4. **Lawyer review** of ToS and Privacy Policy.
5. **Logo files** — SVG + PNG.
6. **Export PDF design review** — route report, day sheets, and advance sheets need polish.
7. **Product page review** — copy accuracy on all 4 pages.
8. **Onboarding path discussion** — should Localizer have its own onboarding flow separate from TourRouter?
9. **Coming Soon splash page review** — copy/design approval before public launch.

---

## Known minor issues (not blockers)

- Drawer section ordering in the side panel is "good enough" but you and I might want to do a final pass together once you've used it on a real tour.
- Schema fragmentation on the artist profile: `adv_stage_plot_url` is a flat column but `artistProfileTypes.ts` defines a `technical_production.stagePlotUrl` JSONB path that's currently unused. Worth a conversation about which one we want to be the source of truth, but nothing is broken right now.

---

## Bottom line

Code-side, we're ready for beta. Every blocker that was on me is cleared. Ball's in your court on EIN and the beta list.
