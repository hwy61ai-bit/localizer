# Road App v1 — Complete Build Spec (Tim's Decisions)
**Date:** April 7, 2026
**Status:** All product decisions made. Ready to build.

---

## Scope

All five screens ship together in v1: Home, Show Detail, Calendar, Travel, Settings. It's not useful without the full set.

---

## Access & Auth

- **Tour code generation:** TM, Manager, or Band Leader can generate 6-char codes or invite links
- **Multiple tours:** Yes — a crew member can be on multiple tours simultaneously. App needs a tour switcher.
- **Role assignment:** TM sets a default role when generating the code. Crew member can adjust from the full role list.
- **Auth method:** Token-based, no Supabase account needed (unchanged from master context)

### Role List
- Band Member
- FOH Engineer
- Monitor Engineer
- Guitar Tech
- Drum Tech
- Bus Driver
- Merch Manager
- Production Manager
- Lighting Director
- Tour Photographer
- Other

---

## Write Features in v1

| Feature | In v1? | Notes |
|---|---|---|
| Guest list submissions | ✅ Yes | Crew submits requests, TM approves/denies |
| Document/photo capture | ✅ Yes | Snap a photo → intake system. Photo saves locally, uploads when signal returns |
| Merch sales entry | ❌ v2 | Ships with HWY61 Merch product buildout |

---

## Connectivity

- **Light offline mode:** Cache today's show + next 3 days, read-only when offline
- **Photos save locally** and upload in background when connectivity returns (Expo native behavior)
- **Guest list submissions** require connectivity — no offline queue for writes
- **Push notifications:** v2. In-app badges only for v1.

---

## Branding

- **Subtle HWY61:** HWY61 logo in Settings screen only
- **Main experience** shows tour name, artist photo, tour branding
- Each tour feels like "my tour's app"

---

## Crew Directory

- All crew can see each other's **names, roles, and phone numbers**
- No opt-in gating — if you're on the tour, your info is visible to the crew

---

## Announcement Feed

- **One-way feed:** TM (and Manager/Band Leader) can post updates visible to all crew
- Not a chat — no replies, no threads
- Displays as a simple chronological feed
- Use cases: "Van call moved to 7am", "After-show hang at the bar next door", "Merch load-out from stage left tonight"

---

## Home Screen — "Today"

### Schedule Times Displayed
1. Van/Lobby Call
2. Load In
3. Sound Check
4. Catering/Meal times (if available)
5. Doors
6. Set Time + Set Length (for multi-act bills, if available)
7. Showtime
8. Curfew

**No countdown timer.** Just the times.

### Also on the Home Screen
- Venue name + city
- Hotel name + address (if assigned)
- Any announcements from TM
- **Tomorrow preview at the bottom:** next city, drive time, van call time

### Role-Specific Content (from master context, confirmed)
| Role | Additional Content |
|---|---|
| FOH Engineer | Production notes, input list link |
| Monitor Engineer | Production notes, monitor specs |
| Bus Driver | Routing only — next city, estimated arrival, parking info |
| Merch Manager | Show info + venue merch notes (load-in location, table position) |
| Production Manager | Full production notes, all venue contacts |
| All others | Standard schedule, hotel, travel info |

---

## Other Screens

### Show Detail
- Full show info for any date on the tour
- All schedule times + venue info (WiFi, parking, backline, hospitality notes)
- Production and settlement contacts visible by role
- Guest list submission button (for crew adding their own guests)

### Calendar
- All tour dates in a scrollable list or calendar view
- Show days, off days, travel days visually distinguished
- Tap any date → Show Detail

### Travel
- Drive time and distance to next city
- Hotel info (name, address, check-in time, confirmation number)
- Flight info (if applicable for fly dates)
- Map/directions link (open in native maps app)

### Settings
- Tour code entry (join new tour)
- Tour switcher (if on multiple tours)
- Role selection (adjust from TM's default)
- Display preferences
- HWY61 branding / about / support link

---

## Data Rules (Unchanged from Master Context)

- **Financial fields NEVER reach the Road App.** No offer, guarantee, settlement, deal, commission, personnel pay, or deposit data. Excluded at the API route level, not in the UI.
- **Crew view uses `tour_shows_crew` view** which strips all financial columns.
- **API routes for crew use service_role key** with manual org check. Never anon key.

---

## Technical Stack (Unchanged from Master Context)

- React Native + Expo
- AsyncStorage for light offline cache
- expo-camera for document capture
- EAS Build for iOS + Android submission
- Token-based auth via `crew_access` table

---

## New Backend Needs

| What | Where |
|---|---|
| Announcement feed table | `tour_announcements` — tour_id, posted_by, message, created_at |
| Crew directory endpoint | `GET /api/crew/directory` — returns names, roles, phone for tour |
| Guest list crew endpoint | `POST /api/crew/guest-list` — crew submits, TM approves |
| Document capture endpoint | `POST /api/crew/intake` — wraps existing intake API with crew auth |
| Announcement post endpoint | `POST /api/crew/announcements` — TM/Manager/Band Leader only |
| Catering/meal times fields | Add `catering_time`, `meal_notes` to `tour_shows` if not present |
| Set time/length fields | Add `set_time`, `set_length`, `bill_position` to `tour_shows` if not present |

---

## Build Estimate

| Component | Estimate |
|---|---|
| Five screens (read-only) | 5-7 days |
| Light offline caching | 1 day |
| Guest list submissions | 1-2 days |
| Document/photo capture | 1-2 days |
| Announcement feed | 1 day |
| Crew directory | 0.5 days |
| Tour switcher | 0.5 days |
| Auth flow + tour code | 1-2 days |
| Testing + polish | 2-3 days |
| App Store submission | 1 day |
| **Total** | **~14-19 days** |

---

**No build blockers remain. All product decisions made.**
