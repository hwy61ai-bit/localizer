# HWY61 — Build Status & Tim Deliverables
**April 1, 2026**

---

## What Got Built Today

### 1. Default Roster → Tour Roster Population
When you create a new tour for an artist, the tour automatically inherits the artist's default roster from their Master Profile. Names, roles, and pay rates carry over. Tour-level edits stay on the tour — they never write back to the profile unless the user explicitly chooses to update the default.

### 2. Notification System (Phase 7F)
Full in-app notification center is live:
- **Bell icon** in the dashboard header with unread count badge
- **Dropdown panel** showing recent notifications with click-through to relevant pages
- **"Mark all as read"** button
- **Polls every 60 seconds** for new notifications
- **Four triggers wired up:**
  - Tour created → notifies all org members
  - Document parsed via AI Intake → notifies all org members
  - Advance email bounced → notifies all org members
  - Advance escalated (final nudge, venue unresponsive) → notifies all org members

### 3. Onboarding Wizard — Choice Screen (Phase 7H)
New users with zero artists now see a welcome screen with three options:
- **"Get Started"** — guided setup wizard (steps need to be built — see below)
- **"Explore a Demo Tour"** — placeholder, needs demo tour data (see below)
- **"Skip — I'll start fresh"** — dismisses onboarding, goes to empty dashboard

The shell is built. The wizard steps and demo tour content need your input.

### 4. Navigation & Branding Fixes
- **Fixed:** Clicking artist → tour was showing "Localizer" title instead of "TourRouter" on client-side navigation. Now updates correctly without needing a refresh.
- **Removed:** The old "YOUR TOURS" page (`/dashboard/routing`) that showed all tours across all artists. This was redundant now that tours live under each artist in the hub. That URL now redirects to `/dashboard`.
- **Fixed:** Back button from inside a tour now goes to the correct artist hub page, not the old tours list.

### 5. Master Artist Profile Polish
- Logo upload field is now a square with rounded corners (was a circle) with hint text: "Upload a transparent .PNG for best results"
- Artist/band name at top is now uppercase, bold, matching the dashboard title weight, with a subtle fade-slide animation on page load

---

## Updated Phase Status

| Sub-phase | Status |
|---|---|
| 7A Domain migration | ✅ Done |
| 7B Mapbox integration | ✅ Done |
| 7C Stripe restructure | 🚫 Blocked on EIN |
| 7D Feature flags + mobile | ✅ Done |
| 7E Road App | 🔲 Not started |
| 7F Notifications | ✅ Core done (table, API, bell UI, 4 triggers) |
| 7G PostHog analytics | ✅ Done |
| 7H Onboarding wizard | 🟡 Shell built — needs wizard steps + demo tour |
| 7I Beta invites | ✅ Done |
| 7J Support infrastructure | 🔲 Needs Tim's FAQ content |
| 7K Marketing site | 🔲 Needs Tim's copy/direction |
| 7L Legal updates | ✅ Done |
| 7M Final QA + beta launch | 🔲 Not started |

---

## What Drew Needs From Tim

### 1. Onboarding Wizard Steps (Priority: HIGH)
The choice screen is built. Now we need the actual guided setup flow — what a brand new user walks through step by step. Here's what we need you to define:

**How many steps?** We're thinking 3–5 steps max. Keep it tight — nobody wants a 10-step wizard.

**Proposed flow (confirm, modify, or replace):**

**Step 1: Create Your First Artist**
- User enters: artist name (required), uploads a logo (optional)
- What it does: creates the artist record

**Step 2: Add Your Team (Roster)**
- User adds at least one roster member: name + role
- Show day rate and off day rate optional at this stage
- What it does: saves as the artist's default roster

**Step 3: Create Your First Tour**
- User enters: tour name, start and end date range
- What it does: creates a tour linked to the artist, copies the default roster in

**Step 4: Add Your First Show**
- User enters: date, city, venue (minimum)
- Or: drag and drop a document (route sheet, deal memo) and let AI Intake parse it
- What it does: creates the first show on the tour

**Step 5: Done — Here's What You Can Do Next**
- Summary screen showing what was created
- Links to: "Add more shows," "Upload a document," "Set up vehicle," "Explore your tour"

**Questions for you:**
- Is this the right order? Should roster come before or after tour creation?
- Do we want the AI Intake drop zone available during the wizard? (e.g., "Or just drop a route sheet and we'll handle it")
- Any steps missing? Any steps that should be cut?
- What's the tone? Friendly/casual? Professional? Quick tips at each step?

### 2. Demo Tour Data (Priority: HIGH)
We need a realistic but anonymized tour to pre-load for the "Explore a Demo Tour" option. This lets new users click around a fully populated account before entering their own data.

**What we need from you:**
- ~15 show dates (mix of markets — clubs, theaters, a festival or two)
- Venue names and cities (can be real venues, fake band name)
- Mix of show statuses: some confirmed, some with settlements, some pending advances
- Hotel info for at least half the shows (name, address, confirmation number)
- A roster of 5–7 people with roles and pay rates
- Vehicle setup (van? bus? mix?)
- At least 2–3 different deal types across the shows (flat guarantee, door deal, vs deal)
- Some guest list entries on a few shows
- Some advance data (a couple confirmed, a couple pending, one escalated)

**Format:** A spreadsheet, a doc, or even just a detailed text file. We'll convert it into database seed data.

**Important:** This also serves as a sales tool during free trials — people will judge the product partly based on how real this demo data feels. It should look like an actual tour a working band would run.

### 3. Tutorial Video Scripts (Priority: MEDIUM — need before beta)
Short videos (1–3 min each) covering core workflows. We'll link these from inside the app. Topics:

1. Creating a tour and adding dates
2. Dropping a document into AI Intake
3. Using the routing map and drive times
4. Running a settlement
5. Generating day sheets
6. Managing the advance pipeline
7. Reading the finance dashboard
8. Setting up the Master Artist Profile

**You record these.** If helpful, we can generate draft scripts from the codebase so you're not starting from scratch.

### 4. FAQ Content (Priority: MEDIUM — need before beta)
First drafts of common questions and answers for a knowledge base / support page. Categories:

- Getting started (account setup, first tour, inviting team)
- Billing (plans, upgrades, cancellation, data export)
- Features (how settlement works, how AI Intake works, how advancing works)
- Troubleshooting (common issues, data questions)

**We can generate first drafts from the codebase and specs** — you'd edit for voice and accuracy. Let us know if you want us to do that.

### 5. Marketing Site Copy (Priority: HIGH — blocks 7K)
We need copy for:
- Landing page headline, subhead, and value props
- Localizer product page
- TourRouter product page
- DIY product page
- Pricing page descriptions

**You mentioned you're working on mockups** — send whatever you have, even rough, and we'll build from there.

### 6. Beta User List (Priority: HIGH — blocks 7M)
- Who gets the first 5–10 invite codes?
- We have 10 codes ready (HWY61-BETA-001 through 010)
- Need names/emails so we can be ready to send the moment QA is done

### 7. Real Tour Data for QA (Priority: HIGH — blocks 7M)
- 3+ complete tours with real documents (anonymized if needed)
- Settlement sheets, deal memos, route sheets, hotel confirmations
- This is what we test the full system against before beta

### 8. Legal Sign-Off (Priority: MEDIUM)
- Updated ToS and Privacy Policy are live (effective April 1, 2026)
- Need your review and sign-off

---

## Current App Architecture (Quick Reference)

```
/dashboard (HWY61 LABS)
  └── Artist tiles
        ├── Gear icon → Master Artist Profile
        └── Click tile → Artist Hub (tabbed)
              ├── TourRouter tab → tour tiles → click → tour detail page
              ├── Localizer tab → asset management
              └── DIY → TourRouter tab + upgrade banner
```

- Bell icon with notifications in header (all dashboard pages)
- New users with 0 artists → onboarding choice screen
- Back button from tour detail → artist hub (not old tours list)

---

*Send whatever you have whenever you have it — we'll keep building everything we can in parallel.*
