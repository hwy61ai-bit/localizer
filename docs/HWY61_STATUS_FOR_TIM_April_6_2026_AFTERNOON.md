# HWY61 Status Update — April 6, 2026 (Afternoon)

**For:** Tim
**From:** Drew
**Re:** Master Artist Profile blitz + vehicle architecture decision needed

---

## TL;DR

After sending you the morning update (BUG-4 + QA sweep), I kept going. Spent the afternoon turning the Master Artist Profile into something that's actually fast to fill out — drag-and-drop everywhere, bulk imports, W-9 autofill, the whole nine. Then I hit a real architectural problem with the multi-vehicle system that I need your input on before I can build the next thing. Email with the questions is in your inbox (subject: "Need your input: vehicle data architecture"). Read that one first.

---

## What shipped this afternoon

### Master Artist Profile — drag-and-drop blitz

The master profile used to be a wall of empty form fields. Now it's a "drop your stuff and HWY61 fills it in" experience for almost everything. Eight new drag-and-drop targets in one afternoon:

**Roster** — Drop a CSV or Excel file with crew info, get crew members back. Column mapper handles Name / Role / Show Day Rate / Off Day Rate / Per Diem / Email / Phone. Tested against the Beta Test Band roster spreadsheet — picked up all 7 crew members with rates and contact info, ignored the totals row.

**Bio** — Drop a `.txt`, `.md`, `.docx`, or `.pdf` and the contents become the bio. PDFs go through Claude Vision for text extraction. Replaces the existing bio text. Also removed the duplicate "Short Bio" / "Full Bio" fields from Promo & Marketing — those were confusing because the actual bio field was elsewhere.

**Logo and band photo** — drag images onto the squares at the top of the page. Click-to-upload still works alongside drag-and-drop.

**Team section** — Drop a CSV with team info. Supports two formats: long (Role / Name / Email / Phone, one row per role) or wide (Manager Name / Manager Email / Booking Agent Name / etc, one big row). Maps to the four fixed cards (Manager / Booking Agent / Publicist / Agent).

**Advance materials** — In addition to the 4 fixed cards (Stage Plot, Hospitality Rider, FOH Requirements, W-9), there's now a "+ Add Custom Material" button. Add a card with any label, drag-and-drop to upload. These flow through to both the public venue link and the download-all zip alongside the standard four. Each custom card can be renamed or deleted.

**W-9 autofill** — This is the cool one. Drag a W-9 PDF onto the Business Entity section and Claude Vision reads the form, extracts Legal Name, DBA, Entity Type, Address, and EIN, and fills the matching fields. New endpoint at `/api/import/parse-w9`. I tested it against a few W-9s and it nails the standard layout. For users with weird scanning quality it'll occasionally miss a field — those just stay empty for the user to fill manually.

### Pre-existing bugs caught while building

- **Team phone fields were silently dropping data.** The UI had phone inputs for Manager / Booking Agent / Publicist / Agent, but none of those columns existed in the database. Every phone number a user typed was getting silently dropped on save. Caught it because the bulk-import was getting back errors. Added the four columns and the type definition; existing UI now actually saves phone numbers.
- **`/api/import/extract` was completely unauthenticated.** That endpoint takes a file, sends it to Claude Vision, returns text. Anyone with the URL could spam it and run up our Claude bill. Added auth check before wiring the bio drag-and-drop to it.

### UX polish

- **VIEW TOURS button** added to top right of master artist profile, links to the artist hub.
- **"Click to add band name" placeholder** + pencil icon next to the artist name field. Was previously just "Artist Name" placeholder which made it look like a heading, not an editable input. Users were confused that they couldn't change the band name.
- **Hid Tax & Compliance and Insurance sections** from the master profile. We had talked about cutting these. Data is preserved in the database, just not shown in the UI — easy to restore if you change your mind.

### VehicleManager bug fixes (routing page)

While testing vehicles I hit three bugs:

1. **Inputs were reverting mid-keystroke.** The "Add custom vehicle" form would lose what you typed on every character. Root cause: `saveVehicles()` was calling `setSaving(true)` synchronously and `onUpdate(updated)` only after the network round-trip — so the parent state lagged behind by 100-500ms and React kept reverting the input to the stale prop value. Fix: optimistic update — call `onUpdate()` first, then fire the fetch in the background.
2. **Make/Model field was readOnly.** It was a single composite display field showing `${vehicle.make} ${vehicle.model}` with no way to edit it. Custom vehicles had no way to set make/model at all. Split into two separate editable inputs side-by-side.
3. **Inputs were overflowing the container.** Missing `boxSizing: 'border-box'` on the shared `inputStyle` constant, so width: 100% inputs were 26px wider than their grid cells.

---

## The vehicle architecture problem (READ THE EMAIL)

The good news: the routing page Vehicle Manager has a clean UI for adding multiple vehicles to a tour, with per-vehicle MPG, fuel price, fuel type, ownership, etc.

The bad news: **none of that data is wired into the financial calculation.** I dug into it because Drew reported "I edit Fuel $/gal and the Est. Fuel Cost total doesn't update." Turns out:

- `tour_vehicles` JSONB stores `fuelPricePerGallon` and `mpg` per vehicle
- `calcTourFinancials()` only reads the legacy `tour.fuel_price_usd` flat column
- And it uses a hardcoded `VEHICLE_MPG` lookup table based on vehicle type strings ("van", "bus", "sprinter") — never reads per-vehicle MPG

So the multi-vehicle system has been a UI shell this whole time. People can add vehicles, edit them, save them — but the financial engine is still computing fuel cost based on the old single-vehicle assumptions.

On top of that, Drew wants to mirror this Vehicle Manager onto the Master Artist Profile so artists can maintain a default fleet across tours.

Both of these need architectural decisions that I won't make on my own:

1. **Where does the data live?** On the artist as a template? On the tour? Both with sync rules?
2. **Are we allowed to modify `lib/tourrouter/financials.ts`?** It's our NO-GO file. To make per-vehicle MPG actually feed `calcTourFinancials`, we have to change it.
3. **How does the calc handle multiple vehicles?** Lead vehicle? Sum across all? Weighted average?

The full questions and my recommendations are in the email. Once you reply, I can build the real solution next session — estimate is 2-4 hours depending on whether you let me touch `financials.ts`.

In the meantime I have a 15-minute bridge fix ready that stops the immediate fuel cost bug from biting users. It's reversible and doesn't touch the no-go file. I'll apply it tomorrow morning if you haven't replied yet.

---

## Phase 7M Status (unchanged from morning report)

| Item | Status |
|---|---|
| BUG-4 + QA bugs | ✅ All closed |
| Import pipeline + currency | ✅ Fixed |
| Master Artist Profile UX | ✅ Massively upgraded |
| Vehicle architecture | 🟡 Waiting on your email reply |
| Stripe restructure | 🚫 Blocked on EIN |
| Beta user list | 🚫 Waiting on you |

---

## What I still need from you

**Most urgent:**
1. **Vehicle architecture email** (sent today) — three short questions, blocks the next build
2. **EIN** — biggest single blocker for Phase 7M launch
3. **Beta user list**

**Less urgent (still pending from morning report):**
4. Tutorial video recording (scripts ready)
5. Lawyer review on ToS / Privacy Policy
6. Logo files (SVG + PNG)
7. Export PDF design review
8. Product page review
9. Onboarding path discussion (Localizer-specific?)
10. Coming Soon splash page review

---

## Bottom line

Master Artist Profile is now genuinely good. The hard part of beta launch on the code side keeps shrinking. Next blocker is your call on the vehicle questions. After that it's mostly your deliverables (EIN, beta list) standing between us and a public launch.

Email me back on the vehicle stuff when you can. Happy to hop on a call if it's faster.
