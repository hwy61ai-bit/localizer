# Hotel / Lodging Financial Integration — Sign-off Required

**To:** Tim
**Re:** Hotel / Lodging Financial Integration — Sign-off Required

---

## What we're building and why

Right now, hotel data lives in the show drawer but has zero financial impact. A TM can drop a hotel confirmation and see the hotel name, rate, and rooms populate correctly — but none of that flows into expenses, the finance page, or any per-show calculations. We want to fix that and extend it into a full lodging cost tracking system.

---

## Part 1 — Lodging Defaults on the Master Artist Profile

We're adding a new **Lodging** section to the Master Artist Profile, sitting below the Roster section. This is where you set the touring party's standard accommodation needs for that artist — information that doesn't change tour to tour.

Fields:
- Number of rooms required per night
- Bed configuration (e.g. 2 kings, 4 queens, mix)
- Preferred star rating (2-star / 3-star / 4-star / 5-star)
- Notes (e.g. "TM always needs a separate room", "no smoking floors")

When a new tour is created for that artist, these defaults seed the tour automatically. The TM can override them per-tour if needed.

**Questions for Tim:**
- Do you think of rooms in terms of headcount (1 room per 2 people) or fixed numbers (this artist always needs exactly 4 rooms)? This affects how we store and display it.
- Should bed configuration be a free-text field or a structured selector? TMs often have specific requirements (no doubles, always kings, etc.)
- Should star rating be 2/3/4/5 star, or would you prefer labels like Budget / Standard / Upscale / Luxury?
- Should there be a "no hotel" flag for shows where the band drives home or stays with locals? This is common on regional tours.
- Should lodging defaults be overrideable per-tour, or do you always want to go back to the artist profile to change them?

---

## Part 1B — How We Calculate Hotel Costs (Options)

When no receipt or confirmation exists yet, we need a way to estimate hotel costs for budgeting purposes. Here are the options — we need Tim to pick one:

**Option A — Static Rate Table (recommended starting point)**
We build a lookup table of average nightly hotel rates by market tier and star rating. For example:

| Market Tier | 2-star | 3-star | 4-star | 5-star |
|---|---|---|---|---|
| Major (NYC, LA, Chicago) | $120 | $180 | $280 | $450 |
| Secondary (Nashville, Austin, Denver) | $90 | $130 | $200 | $320 |
| Small (Fayetteville, Eau Claire, Bozeman) | $70 | $100 | $150 | $240 |

Multiply by rooms x nights. Instant, free to run, no API calls. Numbers are rough but directionally correct for planning. Tim could review and adjust the rate table at any time.

**Option B — AI City Estimation**
For each city on the tour, Claude looks up current average hotel rates via web search and returns an estimate. Same pattern as the existing flight price estimator. More accurate and city-specific — Nashville in CMA week costs very differently than Nashville in January. Results are cached so the same city is not looked up twice. Costs a small amount per lookup (~$0.01-0.02) but the cache means most cities are only ever looked up once.

**Option C — Manual Entry Only**
No estimation at all. The TM enters a budgeted nightly rate per tour (or per show), and that is what drives the projections. Simple, TM-controlled, always intentional. Less automation but zero risk of bad estimates.

**Option D — Hybrid**
Start with the static rate table as the default estimate. Show it as "projected" with a clear note that it is an approximation. The TM can override any show's projected rate manually. When a confirmation or receipt comes in, it replaces the projection automatically.

**Questions for Tim:**
- Which option feels most useful to you as a working TM?
- How much do you trust rate estimates for budgeting? Do you want a number to work from even if it is rough, or would you rather see $0 until you have real data?
- Are there markets where hotel costs vary so wildly by time of year that a static table would be misleading? (e.g. SXSW week Austin, CMA Fest Nashville, Mardi Gras New Orleans)
- If we use a static rate table, would you want to be able to edit the rates? Or is a sensible default good enough?
- Should the projection show a range (e.g. "$120-$160/night") rather than a single number, to communicate uncertainty?
- For the AI estimation option — how important is city-specific accuracy vs. simplicity? Is knowing that Denver averages $140/night for 3-star more useful than a generic "secondary market" estimate?

---

## Part 2 — Hotel Cost in Financial Calculations

We are adding hotel cost as a tracked expense line in calcTourFinancials() — the single source of truth for all financial math. Each show will have one of three states:

**State 1 — Actual receipt uploaded**
The TM drops a hotel receipt onto the routing page. The intake system parses the total and writes it to hotel_cost_actual on that show. This number is used as-is in all financial calculations. Most accurate.

**State 2 — Hotel confirmation uploaded (no receipt yet)**
The TM drops a hotel confirmation. The intake system already parses hotel_rate, hotel_rooms, hotel_checkin, and hotel_checkout into the show. We calculate the estimated cost as hotel_rate x hotel_rooms x nights. This shows as "estimated" in the finance page until a receipt replaces it.

**State 3 — No hotel data yet / using artist defaults**
If neither a receipt nor a confirmation exists, we use the artist's lodging defaults (rooms + star rating) combined with whichever estimation method Tim selects above to generate a rough planning estimate. Shows as "projected" in the finance page.

The priority chain is always: **actual receipt -> confirmation estimate -> planning projection -> $0**

**Questions for Tim:**
- Does this three-state priority chain match how you actually think about hotel costs on a working tour?
- Should off days count as hotel nights in the calculation? Or only show days?
- What about drive-home days — should those be flagged as "no hotel" automatically, or always require manual input?
- Should the finance page show both the estimated and actual side by side for shows where you have both, or just the current best number?
- Should hotel costs roll up into a single "Accommodations" total, or do you want to see them broken out by week or leg of tour?

---

## Part 3 — Finance Page — Accommodations Tab

The Accommodations tab already exists on the finance page but currently has no data wired into it. This work wires it up fully, making it the first of the expense tabs to be fully functional. It will show a per-show hotel cost breakdown:

- Show date, city, venue
- Hotel name (if known)
- Rooms x nights x rate (or actual if receipt uploaded)
- Status flag: Actual / Estimated / Projected
- Tour total accommodation cost
- Average per show

The remaining expense tabs — Transport, Food, Gear, Misc, Merch, Promo, and Other — will follow in future sessions using the same pattern established here.

**Questions for Tim:**
- Should the Accommodations tab show off days separately from show days, since hotel costs often fall on both?
- Do you want a running total that updates as receipts come in, showing how actual spend is tracking against the estimate?
- Should there be an export option for just the accommodations breakdown — useful for end-of-tour expense reporting?

---

## Part 4 — Receipt Intake

When a hotel receipt is dropped on the routing page, the intake system already identifies it as a receipt. We extend the confirm route to write the parsed total to hotel_cost_actual on the matched show. This immediately updates all financial calculations — the confirmation estimate is replaced by the actual, and the finance page reflects the change.

**Questions for Tim:**
- Hotel receipts often cover multiple nights. Should the system split the cost across each night automatically, or apply the full receipt total to the check-in date?
- What if a receipt covers multiple rooms with different rates? Should it just use the total, or try to parse per-room rates?
- Should there be a way to manually enter a hotel cost without dropping a receipt — for cases where the TM pays cash or has a physical receipt they have not scanned?

---

## What we need from you before we build

1. Sign-off on calcTourFinancials() changes — this is the financial core, no changes happen without your approval.
2. Which estimation option (A, B, C, or D) do you want for Part 1B.
3. Answers to as many of the above questions as you can — even rough answers help us make the right architecture decisions before writing code.

No build starts on this until we hear back from you.
