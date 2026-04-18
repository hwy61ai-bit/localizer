# HWY61 — Complete Platform Vision
**For:** Drew and any AI assistant working on this codebase  
**Last updated:** March 2026  
**Co-founders:** Tim (industry / product) + Drew (engineering)

---

## What HWY61 Is

HWY61 is a modular SaaS platform for the touring music industry. It is the first end-to-end "Tour Suite" — a set of products that work independently or together to handle every operational need of a touring act, from a self-funded independent artist playing 200-cap clubs to a major artist selling out arenas and stadiums.

The platform is built on the insight that touring has never had a single integrated toolset. Band managers use spreadsheets. Booking agents use routing sheets emailed back and forth. Tour managers carry binders. Marketing assets get made manually or outsourced. Advancing is done via email chains. Settlements are paper documents. HWY61 replaces all of it.

---

## The Three Products

### 1. Localizer — Tour Marketing Automation
**Pillar:** Marketing  
**Status:** Built. Nearly launch-ready.  
**Who buys it:** Independent artists, self-released acts, small management companies, indie labels, DIY touring bands.

Localizer automates tour marketing asset creation. The manager imports a tour schedule (paste text, upload PDF/CSV/image — AI extracts dates, venues, cities), uploads base background images per format, positions text overlays once in a drag-and-drop editor, and the system generates finished poster JPEGs for every show × every format. Each venue gets a unique shareable link to download their assets. No design skills required. No manual resizing. One template, every show, every format.

**Core formats:** Instagram Post (1080×1080), Instagram Story (1080×1350), Facebook Cover (820×312), TikTok (1080×1920), YouTube Shorts (1080×1920)

**Pricing:** Basic $39/mo · Pro $69/mo · Agency $139/mo

---

### 2. TourRouter — Routing, Budgeting, Operations & Advancing
**Pillars:** Routing & Budgeting, Operations, Advancing  
**Status:** Exists as a proven single-file browser app (v35, ~5,100 lines). Needs to be rebuilt on the Localizer stack (Next.js + Supabase).  
**Who buys it:** Band managers, booking agents, tour managers, accountants, small-to-mid agencies. Club and theater level touring acts.

TourRouter is the operational engine of a tour. It handles:
- Routing — drive times, distances, brutal leg flags, drive vs fly decisions
- Budgeting — guarantees, backend deals, fuel costs, flight costs, band pay, hotel costs, net profit
- Multi-currency — 20+ currencies, live rate fetch
- AI parsing — PDF deal memos (WME + High Road Touring formats) parsed automatically
- Operations — show detail drawer with venue, contacts, hospitality, production info per show
- Advancing — advance sheet export per show, venue link delivery
- Exports — polished PDF, Excel, CSV financial and routing reports
- Crew mobile app — free iOS/Android app, read-only advance info for crew

**Pricing:** Solo $49/mo · Pro $79/mo · Agency $99/mo

---

### 3. TourCommand — Arena & Stadium Scale Touring
**Pillars:** Routing & Budgeting, Revenue, Operations, Advancing  
**Status:** Not yet built. Architecture depends on real arena-level documents (in progress — sourcing from The Killers' tour manager).  
**Who buys it:** Major tour managers, large agencies, business managers, arena and stadium acts, acts with Live Nation / AEG deals.

TourCommand inherits everything from TourRouter and extends it for the complexity of large-scale touring:
- Multi-vehicle transport — band buses, crew buses, production trucks, charter flights
- Production cost budget — trucking, bus leases, backline, rigging, pyro, catering contracts
- Per-ticket splits + ancillary income — merch %, VIP packages, sponsorship, tour-wide deal structures
- Hotel room block management — block size, rate, cutoff date, attrition liability
- Arena settlement documents — multi-party (venue, ticketing, merch, promoter)
- Multi-department advancing — separate advance docs for audio, lighting, video, security, catering
- Tour P&L — final vs projected, end-of-tour report

**Pricing:** Pro $199/mo · Enterprise $299/mo

---

## HWY61 Bundle Pricing

| Bundle | Price | Includes | Savings |
|--------|-------|----------|---------|
| Indie | $79/mo | Localizer Basic + TourRouter Solo | Save $9/mo |
| Pro | $129/mo | Localizer Pro + TourRouter Pro | Save $19/mo |
| Agency | $199/mo | Localizer Agency + TourRouter Agency | Save $39/mo |
| Command | $349/mo | All three products | Save $49/mo |

The bundle unlocks the TourRouter → Localizer integration: confirmed tour dates flow from TourRouter directly into Localizer with one click. No re-entry, no CSV export.

---

## The Five Pillars

Every feature in HWY61 maps to one of five operational pillars:

1. **Marketing** — Localizer. Tour poster and asset generation.
2. **Operations** — TourRouter. Day sheets, crew app, hotel management, daily logistics.
3. **Routing & Budgeting** — TourRouter core. The financial and routing engine.
4. **Revenue** — TourRouter + TourCommand. Settlement tracking, actual vs projected, tour P&L.
5. **Advancing** — TourRouter + TourCommand. Advance sheet creation and delivery to venues.

Routing & Budgeting is the hub. Every other pillar either feeds into it or pulls from it.

---

## The Users

| Role | Primary Product | What They Do With It |
|------|----------------|---------------------|
| Band manager | TourRouter + Localizer | Route tours, build budgets, generate marketing assets |
| Booking agent | TourRouter | Route tours, parse deal memos, flag brutal legs |
| Tour manager | TourRouter | Day sheets, advancing, crew app management |
| Accountant / BM | TourRouter | Financial exports, settlement tracking, tour P&L |
| Independent artist | Localizer | Generate show posters without a marketing team |
| Crew member | HWY61 mobile app (free) | Read advance info, schedule, venue details, travel |

---

## Tim's Background

Tim runs a small management company and touring agency and has years of experience at a record label. He has direct relationships with booking agents, tour managers, band managers, and major label executives across the industry. TourRouter v35 was built to solve his own daily operational problems. The products are designed from deep industry experience, not assumptions.

---

## Key Differentiators vs. Competition

**Master Tour** (main competitor, $65/mo, 20+ years in market):
- Master Tour does operations and crew management well
- Master Tour has no meaningful financial engine
- Master Tour has no marketing component
- Master Tour has no AI parsing of deal memos
- Master Tour's advancing is basic
- HWY61 wins on: financial depth, AI integration, marketing automation, and the integrated platform story

**The real gap in the market:** Nobody does advancing well at the club/theater level. Nobody integrates routing + budgeting + marketing in one platform. Nobody has AI-powered deal memo parsing. These are HWY61's white space opportunities.

---

## The Crew Mobile App

Free. Read-only. iOS + Android. Launches simultaneously with TourRouter web.

**What crew sees:**
- Today's show — venue, address, capacity, age limit
- Daily schedule — van call, load-in, soundcheck, doors, showtime, curfew
- Travel info — drive leg details or flight info, hotel name and address
- Full tour calendar — all dates and cities
- Contacts — promoter, production contact, venue phone
- Hospitality + backline notes

**What crew cannot do:** Edit anything. See financials. Submit guest requests.

**Critical requirement:** Offline mode. Crew work in basements and rural venues with no cell signal. The app must cache the current tour on first load.

**Access:** Tour manager shares a code or invite link from the web app. Zero friction for crew.

**Build path:** React Native (Expo) — one codebase for iOS and Android, shares React logic with the web app.

---

## The Venue & Contact Database

A crowd-sourced, shared database seeded with Tim's existing industry data.

**How it works:**
- When a user enters a venue during import or in the show drawer, the system checks the shared database first
- If found — auto-populates address, capacity, coordinates, contacts
- If not found — saves the entry to the shared database the moment the tour is saved
- Quality control: single "flag this entry" button surfaces bad data to HWY61 admins

**What's stored per venue:** Name, address, city, state/country, capacity, phone, website, production contact, nearest airport, lat/lng coordinates, backline notes, hospitality notes

**What's stored per contact:** Name, role, email, phone, company, market, associated venues

This database becomes a competitive moat — every tour routed makes it better for every future user.

---

## The TourRouter → Localizer Integration

The bundle's killer feature. When a tour manager routes and confirms a tour in TourRouter, one click sends all confirmed show dates — with venues, cities, and dates — directly into Localizer as the schedule. No CSV export, no copy-paste, no re-entry.

This integration is only available on bundle plans. It is the primary reason to upgrade from a single product to the full suite.

---

## Build Sequence

1. **Finish Localizer** — days away from testable
2. **Rebuild TourRouter on Next.js/Supabase** — in parallel with Localizer final polish
3. **Launch both simultaneously under HWY61**
4. **Beta with industry contacts** — pricing finalized from real feedback
5. **Advance sheet delivery + settlement tracking** — first post-launch features
6. **Receive arena-level documents from Killers contact** — unlocks TourCommand architecture
7. **Build TourCommand** — after real documents are in hand

---

## What's Not Being Built (Deliberately Cut)

- Set list management — not routing or budgeting
- Radius conflict checker — edge case, not a buying reason
- Real-time collaboration — WebSocket infrastructure, not a v1 fight
- Push notifications — deferred to mobile v2
- Crew guest list approval workflow — not the reason anyone buys TourRouter
- Venue database with 15,000 entries from scratch — crowd-sourced approach instead

---

*This document covers the complete HWY61 platform vision as of March 2026.*
