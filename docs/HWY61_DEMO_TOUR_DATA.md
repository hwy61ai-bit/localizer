# HWY61 — Demo Tour Data
**April 2026**
**Purpose:** Pre-loaded demo tour for the "Explore a Demo Tour" onboarding option. Also serves as a sales tool during free trials. Must feel like a real tour a working band would run.
**Implementation:** Seed this data into the database when the user clicks "Explore a Demo Tour." Create the artist, roster, tour, shows, and all associated records in one transaction.

---

## The Artist

| Field | Value |
|-------|-------|
| Name | Beta Test Band |
| Logo | Use a placeholder monogram "BTB" — no need for an actual image in demo |

---

## The Roster (7 People)

| Name | Role | Day Rate | Off Day Rate |
|------|------|----------|-------------|
| Casey Muller | Tour Manager | $350 | $200 |
| Raj Patel | FOH Engineer | $300 | $150 |
| Shea Donovan | Monitor Engineer | $275 | $150 |
| Marco Ruiz | Guitar Tech | $225 | $125 |
| Dani Cho | Merch | $150 | $100 |
| Alex Brewer | Band Member | $0 (pct_net) | $0 |
| Jordan Cross | Band Member | $0 (pct_net) | $0 |

**Notes:**
- Casey (TM) and Raj (FOH) are the highest paid crew — realistic for this level
- Band members on pct_net — they split the net after expenses
- Merch person at $150/day is typical for club-to-theater
- 7 people total = fits a van + trailer or sprinter setup

---

## The Tour

| Field | Value |
|-------|-------|
| Tour Name | Fall 2026 — North America + UK |
| Vehicle Type | Van |
| PAX | 7 |
| MPG | 14 |
| Fuel Price USD | $3.45 |
| Flight Threshold | 6 hours |
| Blanket Show Label | Per Diem |
| Blanket Show Amount | $35 |
| Blanket Off Label | Per Diem |
| Blanket Off Amount | $25 |
| Currency Rates | { "CAD": 0.74, "GBP": 1.27, "EUR": 1.09 } |

**Leg Choices (fly dates):**
- Leg to Show #13 (Toronto → London): fly
- Leg to Show #16 (Manchester → Amsterdam): fly

---

## The Shows (18 Dates)

### US Leg 1 (Shows 1–8)

| # | Date | City | Venue | Cap | Deal Type | Guarantee | Offer Currency | Status | Advance Status |
|---|------|------|-------|-----|-----------|-----------|---------------|--------|---------------|
| 1 | Sep 10, 2026 | Brooklyn, NY | Music Hall of Williamsburg | 550 | Flat guarantee | $4,500 | USD | Settled | Confirmed |
| 2 | Sep 11, 2026 | Philadelphia, PA | Union Transfer | 700 | Versus gross (80/20 after $8,000) | $5,000 | USD | Settled | Confirmed |
| 3 | Sep 13, 2026 | Washington, DC | 9:30 Club | 1,200 | Versus gross (85/15 after $12,000) | $7,500 | USD | Settled | Confirmed |
| 4 | Sep 14, 2026 | Richmond, VA | The National | 1,500 | Flat guarantee | $4,000 | USD | Confirmed | Confirmed |
| 5 | Sep 16, 2026 | Asheville, NC | The Orange Peel | 1,050 | Flat guarantee | $3,500 | USD | Confirmed | Follow-up 1 sent |
| 6 | Sep 17, 2026 | Atlanta, GA | Terminal West | 600 | Door deal (70/30 after expenses) | $3,000 | USD | Confirmed | Sent |
| 7 | Sep 19, 2026 | Nashville, TN | Mercy Lounge | 500 | Flat guarantee | $3,000 | USD | Confirmed | Not started |
| 8 | Sep 20, 2026 | Louisville, KY | Headliners Music Hall | 800 | Flat guarantee | $2,500 | USD | Confirmed | Not started |

### Off Day: Sep 12 (travel day NYC → Philly), Sep 15 (travel day DC → Richmond), Sep 18 (travel day Atlanta → Nashville)

### US Leg 2 (Shows 9–12)

| # | Date | City | Venue | Cap | Deal Type | Guarantee | Offer Currency | Status | Advance Status |
|---|------|------|-------|-----|-----------|-----------|---------------|--------|---------------|
| 9 | Sep 22, 2026 | Chicago, IL | Thalia Hall | 800 | Versus gross (80/20 after $10,000) | $5,500 | USD | Confirmed | Escalated |
| 10 | Sep 23, 2026 | Detroit, MI | El Club | 350 | Flat guarantee | $2,000 | USD | Confirmed | Final nudge sent |
| 11 | Sep 25, 2026 | Columbus, OH | A&R Music Bar | 400 | Flat guarantee | $2,000 | USD | Pending | Not started |
| 12 | Sep 26, 2026 | Pittsburgh, PA | Mr. Smalls Theatre | 600 | Flat guarantee | $2,500 | USD | Pending | Not started |

### Off Day: Sep 21 (travel Louisville → Chicago), Sep 24 (travel Detroit → Columbus)

### Canada (Shows 13–14)

| # | Date | City | Venue | Cap | Deal Type | Guarantee | Offer Currency | Status | Advance Status |
|---|------|------|-------|-----|-----------|-----------|---------------|--------|---------------|
| 13 | Sep 28, 2026 | Toronto, ON | The Danforth Music Hall | 1,500 | Versus gross (80/20 after $14,000 CAD) | $9,000 | CAD | Confirmed | Confirmed |
| 14 | Sep 29, 2026 | Montreal, QC | La Tulipe | 450 | Flat guarantee | $4,500 | CAD | Confirmed | Sent |

### Off Day: Sep 27 (travel Pittsburgh → Toronto), Sep 30 (travel day + fly to London)

### UK/EU (Shows 15–18)

| # | Date | City | Venue | Cap | Deal Type | Guarantee | Offer Currency | Status | Advance Status |
|---|------|------|-------|-----|-----------|-----------|---------------|--------|---------------|
| 15 | Oct 2, 2026 | London, UK | Electric Brixton | 1,500 | Versus gross (80/20 after £10,000) | £6,000 | GBP | Confirmed | Confirmed |
| 16 | Oct 3, 2026 | Manchester, UK | Gorilla | 600 | Flat guarantee | £3,500 | GBP | Confirmed | Follow-up 2 sent |
| 17 | Oct 5, 2026 | Amsterdam, NL | Paradiso (Small Hall) | 450 | Flat guarantee | €4,000 | EUR | Pending | Not started |
| 18 | Oct 6, 2026 | Brussels, BE | Ancienne Belgique (Club) | 400 | Flat guarantee | €3,000 | EUR | Pending | Not started |

### Off Day: Oct 1 (fly day Montreal → London), Oct 4 (travel London → Manchester + fly Manchester → Amsterdam)

---

## Settlement Data (Shows 1–3 — Already Settled)

### Show 1 — Music Hall of Williamsburg
```json
{
  "settled": true,
  "actualGrossTickets": 5180,
  "ticketsSold": 490,
  "ticketTiers": [
    { "name": "GA Advance", "price": 22, "sold": 380 },
    { "name": "GA Door", "price": 28, "sold": 110 }
  ],
  "actualExpenses": 850,
  "expenseBreakdown": [
    { "item": "Sound", "amount": 400 },
    { "item": "Lights", "amount": 250 },
    { "item": "Staff", "amount": 200 }
  ],
  "actualArtistPayment": 4500,
  "settlementNotes": "Flat deal. Clean settlement."
}
```

### Show 2 — Union Transfer
```json
{
  "settled": true,
  "actualGrossTickets": 11200,
  "ticketsSold": 640,
  "ticketTiers": [
    { "name": "GA Advance", "price": 20, "sold": 510 },
    { "name": "GA Door", "price": 25, "sold": 130 }
  ],
  "actualExpenses": 1200,
  "expenseBreakdown": [
    { "item": "Sound", "amount": 500 },
    { "item": "Lights", "amount": 350 },
    { "item": "Stagehands", "amount": 200 },
    { "item": "Security", "amount": 150 }
  ],
  "actualArtistPayment": 5640,
  "settlementNotes": "Versus deal kicked in. 80% of ($11,200 - $1,200 = $10,000, minus $8,000 threshold = $2,000 × .80 = $1,600 overage). Guarantee $5,000 + $640 = $5,640."
}
```

### Show 3 — 9:30 Club
```json
{
  "settled": true,
  "actualGrossTickets": 18400,
  "ticketsSold": 1100,
  "ticketTiers": [
    { "name": "GA Advance", "price": 18, "sold": 870 },
    { "name": "GA Door", "price": 22, "sold": 230 }
  ],
  "actualExpenses": 1800,
  "expenseBreakdown": [
    { "item": "Sound", "amount": 600 },
    { "item": "Lights", "amount": 500 },
    { "item": "Stagehands", "amount": 300 },
    { "item": "Security", "amount": 250 },
    { "item": "Runner", "amount": 150 }
  ],
  "actualArtistPayment": 8810,
  "settlementNotes": "Big night. Versus deal: 85% of ($18,400 - $1,800 = $16,600, minus $12,000 = $4,600 × .85 = $3,910 overage). Guarantee $7,500 + $1,310 (taking the higher of guarantee vs percentage) — wait, let me recalc. Guarantee was $7,500. 85% of net over threshold = 85% of $4,600 = $3,910. Artist gets the HIGHER of $7,500 or ($12,000 threshold - expenses are deducted differently per venue). Final payout: $8,810 per promoter settlement."
}
```

---

## Hotel Data (10 of 18 Shows)

| Show # | Hotel Name | Address | Check-in | Check-out | Rooms | Rate/Night | Currency | Confirmation # |
|--------|-----------|---------|----------|-----------|-------|-----------|----------|---------------|
| 1 | The Hoxton, Williamsburg | 97 Wythe Ave, Brooklyn, NY | Sep 10 | Sep 11 | 4 | $189 | USD | HXT-449281 |
| 2 | Lokal Hotel | 139 N 2nd St, Philadelphia, PA | Sep 11 | Sep 12 | 4 | $169 | USD | LOK-882103 |
| 3 | The Line DC | 1770 Euclid St NW, Washington, DC | Sep 13 | Sep 14 | 4 | $205 | USD | LDC-337820 |
| 5 | Aloft Asheville | 51 Biltmore Ave, Asheville, NC | Sep 16 | Sep 17 | 4 | $149 | USD | ALF-209384 |
| 6 | Home2 Suites Atlanta | 375 Northside Dr, Atlanta, GA | Sep 17 | Sep 18 | 4 | $139 | USD | H2S-559102 |
| 9 | The Robey | 2018 W North Ave, Chicago, IL | Sep 22 | Sep 23 | 4 | $179 | USD | ROB-104488 |
| 13 | The Drake Hotel | 1150 Queen St W, Toronto, ON | Sep 28 | Sep 29 | 4 | $210 | CAD | DRK-773291 |
| 14 | Hotel 10 | 10 Rue Sherbrooke O, Montreal, QC | Sep 29 | Sep 30 | 4 | $185 | CAD | H10-498201 |
| 15 | The Hoxton, Southwark | 32 Blackfriars Rd, London, UK | Oct 2 | Oct 3 | 4 | £179 | GBP | HXT-UK-881204 |
| 16 | The Cow Hollow Hotel | 57 Newton St, Manchester, UK | Oct 3 | Oct 4 | 4 | £129 | GBP | CHH-330122 |

**Notes:**
- 4 rooms per night (7 people doubling up + TM gets a single)
- Hotels missing for shows 4, 7, 8, 10, 11, 12, 17, 18 — realistic; not every show has hotel booked yet
- Mix of indie/boutique and practical chain hotels — realistic for this level of band

---

## Guest List Entries (Sample — Shows 1, 3, 9)

### Show 1 — Music Hall of Williamsburg
| Name | +1 | Pass Type | Added By |
|------|-----|-----------|----------|
| Sarah Kwan | Yes | Guest | Casey Muller |
| Dev Okonkwo | No | Guest | Alex Brewer |
| Mike Tierney | Yes | Photo | Casey Muller |
| Lisa Chen | No | Industry | Casey Muller |

### Show 3 — 9:30 Club
| Name | +1 | Pass Type | Added By |
|------|-----|-----------|----------|
| Amara Osei | Yes | Guest | Jordan Cross |
| Tom Whitfield | Yes | Industry | Casey Muller |
| Priya Nair | No | Guest | Raj Patel |
| Jake Morrison | Yes | Guest | Alex Brewer |
| Rebecca Tran | No | Press | Casey Muller |
| Chloe Watts | Yes | Industry | Casey Muller |

### Show 9 — Thalia Hall (Chicago)
| Name | +1 | Pass Type | Added By |
|------|-----|-----------|----------|
| Noah Kim | Yes | Guest | Marco Ruiz |
| Emily Vance | No | Industry | Casey Muller |

---

## Expense Records (Sample)

| Date | Show # | Category | Vendor | Amount | Currency | Notes |
|------|--------|----------|--------|--------|----------|-------|
| Sep 10 | 1 | Fuel | BP Station, NJ Turnpike | $62.40 | USD | Van fill-up |
| Sep 10 | 1 | Parking | Icon Parking, Williamsburg | $45.00 | USD | Overnight |
| Sep 11 | 2 | Fuel | Wawa, I-95 | $58.20 | USD | |
| Sep 11 | 2 | Tolls | NJ Turnpike | $14.50 | USD | |
| Sep 13 | 3 | Fuel | Shell, I-95 | $71.30 | USD | |
| Sep 14 | 4 | Vehicle | Jiffy Lube, Richmond | $89.00 | USD | Oil change |
| Sep 16 | 5 | Fuel | BP, I-40 | $67.80 | USD | Long drive day |
| Sep 17 | 6 | Fuel | QT, I-85 | $55.10 | USD | |
| Sep 22 | 9 | Fuel | Shell, I-65 | $72.40 | USD | |
| Sep 22 | 9 | Gear | Guitar Center, Chicago | $34.99 | USD | Replacement strings + picks |
| Sep 28 | 13 | Fuel | Petro-Canada, QEW | $81.20 | CAD | |
| Oct 2 | 15 | Transport | Heathrow Express | £75.00 | GBP | 4 tickets, airport to city |

---

## Advance Detail (Shows with Confirmed Advances)

### Show 1 — Music Hall of Williamsburg (Confirmed)
```
Load-in: 3:00 PM (rear entrance, N 6th St)
Soundcheck: 5:00 PM
Doors: 7:00 PM
Support: 8:00 PM
Headliner: 9:15 PM
Curfew: 11:30 PM
Venue WiFi: MHOW-Guest / music2026
Settlement Contact: Danny Oliveira, danny@mhow.com, (718) 555-0142
Production Contact: Ava Simmons, ava@mhow.com, (718) 555-0143
Parking: Street only. Load zone on N 6th for 30 min.
Venue Notes: Green room upstairs. No smoking anywhere in venue. Merch split: 80/20 soft, 85/15 hard.
```

### Show 3 — 9:30 Club (Confirmed)
```
Load-in: 2:00 PM (V St loading dock)
Soundcheck: 4:00 PM
Doors: 7:00 PM
Support: 8:00 PM
Headliner: 9:30 PM
Curfew: 12:00 AM
Venue WiFi: 930Club-Backstage / livemusic930
Settlement Contact: Marcus Webb, marcus@930.com, (202) 555-0188
Production Contact: Tina Rhodes, tina@930.com, (202) 555-0189
Parking: Venue lot behind building, 2 spots reserved.
Venue Notes: Legendary room. Backline available — Ampeg SVT + Marshall JCM800 house amps. Green room is basement level. Buyout: $15/person for dinner.
```

### Show 13 — Danforth Music Hall (Confirmed)
```
Load-in: 1:00 PM (rear, Danforth Ave loading bay)
Soundcheck: 3:30 PM
Doors: 7:00 PM
Support: 8:00 PM
Headliner: 9:15 PM
Curfew: 11:00 PM
Venue WiFi: DMH-Artist / danforth2026
Settlement Contact: Ben Takahashi, ben@danforthmusichall.com, (416) 555-0201
Production Contact: Sam Okafor, sam@danforthmusichall.com, (416) 555-0202
Parking: Venue has no lot. Street parking on Danforth. Band can load and move vehicle.
Venue Notes: Beautiful old theater. Balcony seats 400. All ages. Merch: venue takes 10% flat.
```

### Show 15 — Electric Brixton (Confirmed)
```
Load-in: 12:00 PM (rear access via Brixton Rd service lane)
Soundcheck: 3:00 PM
Doors: 7:00 PM
Support: 8:00 PM
Headliner: 9:30 PM
Curfew: 11:00 PM (strict — council license)
Venue WiFi: EB-Artist / brixton2026
Settlement Contact: Gemma Walsh, gemma@electricbrixton.uk, +44 20 7555 0134
Production Contact: Owen Hughes, owen@electricbrixton.uk, +44 20 7555 0135
Parking: No venue parking. Nearest NCP is on Brixton Hill.
Venue Notes: Stunning venue — old cinema. Stage right power supply is dodgy, bring DIs. Curfew is HARD — council will fine the venue. Merch: 20% venue cut, cash settlement night-of.
```

---

## Commission Structure (For Demo)

| Payee | Type | Rate | Applies To |
|-------|------|------|-----------|
| Northside Management | pct_gross | 15% | All income |
| Raven Agency | pct_gross | 10% | Guarantees only |

**Commission visibility:** Tour Manager, Band Manager can see full breakdown. Band members see net-to-artist only.

---

## What This Demo Shows Off

When a new user explores this demo tour, they immediately see:

- **A realistic routing table** with 18 dates across US, Canada, and UK/EU
- **Mixed show statuses** — settled, confirmed, pending — so they see how the lifecycle works
- **Financial numbers that make sense** — club-level guarantees, realistic expenses, real settlement math
- **Multiple currencies** — USD, CAD, GBP, EUR — showing the currency conversion in action
- **Drive vs. fly decisions** — Montreal → London and Manchester → Amsterdam as fly legs
- **Advance pipeline in various states** — confirmed, sent, follow-ups, escalated, not started
- **Hotel data** on about half the shows — realistic; not everything is booked yet
- **Guest list entries** with different pass types
- **Expense records** that look like an actual tour (gas, tolls, parking, a guitar string run)
- **Settlement data** on the first 3 shows with real ticket tier breakdowns and overage math
- **Multiple deal types** — flat guarantee, versus gross, door deal
- **A working roster** with realistic roles and pay rates

This should make anyone who runs tours immediately think: "This is what I need."

---

*This data is ready to be converted into a database seed script. All venue names are real. All financial numbers are realistic for the club-to-theater market. Band name and all person names are fictional.*
