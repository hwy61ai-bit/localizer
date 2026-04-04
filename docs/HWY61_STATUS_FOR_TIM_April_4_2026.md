# HWY61 — Status for Tim
**April 4, 2026**

---

## What got built today

### Coming Soon gate for public marketing site
- Added `COMING_SOON=true` env var that gates all public marketing pages (`/`, `/tourrouter`, `/localizer`, `/diy`, `/roadapp`)
- Visitors without a login see a Warhol-styled "Coming Soon" splash page with a Team Login link
- Authenticated users (you and me) bypass the gate automatically — just log in, then navigate to the marketing URLs directly
- Dashboard, API, login, auth, advance forms, and venue share pages all work normally regardless of gate
- To launch publicly: remove `COMING_SOON=true` from Vercel env vars and redeploy
- Live now on hwy61labs.com

### Demo tour seed ("Explore a Demo Tour")
- Built `/api/tourrouter/demo-seed` endpoint that creates the full Beta Test Band demo tour in one click
- Creates: artist, 7-person roster, tour config with all vehicle/fuel/blanket settings, 18 shows across US/Canada/UK/EU with 9 off days, hotel data for 10 shows, settlement data for shows 1-3, advance details for 4 confirmed shows, 12 guest list entries, 12 expense records, commission structure
- Wired to the OnboardingWizard "Explore a Demo Tour" button with loading state and redirect to the new tour
- Users can now click one button and explore a fully-populated tour

### Flight price comparison on Drive/Fly toggle
- Previously: toggling a leg to "fly" did nothing in the financials — flight price cache was hardcoded empty
- Now: toggling to fly fetches a real flight price estimate via Claude with web search, caches it in Supabase, updates tour financials automatically
- Inline cost display shows next to the Drive/Fly buttons: "$890 flights (4 pax)" or "$240/person" if no roster
- Shows savings or premium vs driving cost
- Prices are one-way (not round-trip) — better for touring logistics

### Nearest-airport fallback
- Previously: `getAirport()` only matched exact city names in a small list. Iowa City → null, Asheville → null, etc.
- Now: if the exact city isn't found, it uses city coordinates to find the nearest airport by distance
- Added 60 regional airports for touring cities: CID, AVL, CHA, BHM, BZN, MSO, GTF, HDN, GJT, ASE, JAC, RAP, EUG, RNO, TUS, XNA, TUL, MSN, GRB, GRR, LEX, TYS, CHS, SAV, BTV, PWM, and 35 others
- Touring cities now reliably resolve to their nearest airport

### Dashboard tile cleanup
- Removed the "+ Photo" / "Change photo" button from artist tiles
- Photo uploads live on the Master Artist Profile page now — the tile button was redundant

### Data fix
- Found and deleted duplicate rows on one real tour (every show was in the database twice from a past double-insert bug)
- Cleaned up via SQL, no other tours affected

---

## What's next

- **Demo tour polish**: add leg_choices to the seed so Toronto→London and Manchester→Amsterdam auto-toggle to fly when demo loads
- **Onboarding wizard QA**: end-to-end testing with real data, edge cases
- **Export PDF design**: route reports, day sheets, advance sheets need visual polish (good to do together)
- **Tour Settings expansion**: per diems, commissions, blanket expenses, advance automation settings
- **Product page headers**: tried 6 different visual indicator concepts, none landed — open to ideas
- **Road App** (post-launch phase)

---

## Blocked

- **EIN** — blocks Stripe restructure, blocks final beta launch
- **Beta user list** — need names/emails to generate invite codes

---

## Questions for you

- Any changes you want to see on the Coming Soon splash page copy/design before we invite beta users?
- Want me to add leg_choices (the fly legs for the transatlantic jumps) to the demo seed?
- Do you want to review the flight price estimates for accuracy? The prompt asks Claude to web-search real fares, but the estimates could drift.
