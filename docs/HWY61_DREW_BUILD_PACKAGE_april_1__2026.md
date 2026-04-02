# HWY61 — Drew Build Package
**Date:** April 1, 2026
**From:** Tim
**Instructions:** Paste this entire document at the start of your Claude Code session. It contains everything you need from today's working session — design system, onboarding wizard spec, demo tour data, FAQ content, tutorial video scripts, and updated status.

---

---

# SECTION 1: Design System — Warhol

**What this is:** The single source of truth for all visual styling across the HWY61 platform. Every page, every component, every state.

---

## The 10 Rules (Never Break These)

1. **Border radius is always zero.** Not 2px. Not 4px. Zero. On everything — buttons, inputs, cards, modals, badges, avatars, progress bars. No exceptions.
2. **Shadows are flat offset.** No blur. No spread. Just `Xpx Ypx 0 color`. Screen-print style.
3. **Headlines are Bebas Neue.** Always uppercase. Always letter-spaced (minimum 1px). Used for page titles, section headers, card titles, button labels, prices.
4. **Labels are Space Mono.** Always uppercase. Always letter-spaced. Used for section tags, form labels, table headers, badges, timestamps, metadata.
5. **Body text is DM Sans.** Weight 300 (light) for body copy. Weight 500 for emphasis. Normal case.
6. **Primary action color is muted crimson `#c5535b`.** Not blue. Not purple. Crimson is the CTA color, nav highlight, active state, and primary badge.
7. **Page background is warm cream `#F5F0E8`.** Not white. Not gray. Cards and inputs are white `#FFFFFF` on cream.
8. **Cards get 3px black borders** and lift 4px with flat shadow on hover.
9. **Section tags are steel blue `#456ca9`**, Space Mono 11px, 4px letter-spacing, uppercase. Every major section gets one.
10. **Halftone dot overlay on `body::after`** — radial-gradient circles, 4px grid, 0.04 opacity. Subtle but essential.

---

## CSS Custom Properties (Copy to globals.css)

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=Space+Mono:wght@400;700&family=Bebas+Neue&display=swap');

:root {
  /* ---- Brand Palette ---- */
  --hw-crimson:       #c5535b;   /* Primary — CTAs, nav, badges, active states */
  --hw-crimson-dark:  #a8444b;   /* Hover/pressed for crimson */
  --hw-crimson-ghost: rgba(197,83,91,0.08); /* Crimson tint backgrounds */
  --hw-blue:          #456ca9;   /* Secondary — section tags, labels, info states */
  --hw-blue-ghost:    rgba(69,108,169,0.08);
  --hw-gray:          #c7c1bf;   /* Warm gray — subtle accents, active doc cards */
  --hw-purple:        #966c9a;   /* Tertiary — audience tints, category badges */
  --hw-purple-ghost:  rgba(150,108,154,0.08);
  --hw-rose:          #c19795;   /* Soft accent — secondary badges, highlights */

  /* ---- Semantic Colors ---- */
  --hw-green:         #5a9e6a;   /* Success / confirmed */
  --hw-green-ghost:   rgba(90,158,106,0.1);
  --hw-green-border:  rgba(90,158,106,0.25);
  --hw-amber:         #c49a3c;   /* Warning */
  --hw-amber-ghost:   rgba(196,154,60,0.1);
  --hw-red:           #c5535b;   /* Error / destructive (same as crimson) */
  --hw-red-ghost:     rgba(197,83,91,0.08);

  /* ---- Backgrounds ---- */
  --hw-bg:            #F5F0E8;   /* Page background — warm cream */
  --hw-bg-warm:       #FFFDF8;   /* Alternate section background */
  --hw-bg-surface:    #FFFFFF;   /* Cards, inputs, modals */
  --hw-bg-invert:     #1A1A1A;   /* Dark cards, footer, inverted sections */

  /* ---- Text ---- */
  --hw-text:          #1A1A1A;   /* Primary */
  --hw-text-secondary:#4A4540;   /* Body / secondary */
  --hw-text-muted:    #8A8580;   /* Muted / placeholder */
  --hw-text-invert:   #F5F0E8;   /* On dark backgrounds */

  /* ---- Borders ---- */
  --hw-border:        #E0D8CC;   /* Default / light border */
  --hw-border-strong: #1A1A1A;   /* Cards, inputs, section dividers */
  --hw-border-light:  #CCC4B8;   /* Inner borders, subtle dividers */

  /* ---- Typography ---- */
  --hw-font-display:  'Bebas Neue', sans-serif;
  --hw-font-mono:     'Space Mono', monospace;
  --hw-font-body:     'DM Sans', sans-serif;

  /* ---- Spacing (8px base grid) ---- */
  --hw-space-1: 4px;
  --hw-space-2: 8px;
  --hw-space-3: 12px;
  --hw-space-4: 16px;
  --hw-space-5: 20px;
  --hw-space-6: 24px;
  --hw-space-7: 32px;
  --hw-space-8: 40px;
  --hw-space-9: 48px;
  --hw-space-10: 64px;
  --hw-space-11: 80px;
  --hw-space-12: 120px;

  /* ---- Borders ---- */
  --hw-border-w: 3px;          /* Standard — cards, inputs, sections */
  --hw-border-w-thin: 2px;     /* Secondary — inner dividers, table rows */
  --hw-border-w-rule: 1px;     /* Hairline — list separators inside cards */
  --hw-radius: 0px;            /* ALWAYS ZERO */

  /* ---- Shadows (flat offset, no blur) ---- */
  --hw-shadow-sm:     3px 3px 0 var(--hw-border-strong);
  --hw-shadow-md:     4px 4px 0 var(--hw-border-strong);
  --hw-shadow-lg:     6px 6px 0 var(--hw-border-strong);
  --hw-shadow-xl:     8px 8px 0 var(--hw-border-strong);
  --hw-shadow-accent: 6px 6px 0 var(--hw-crimson);

  /* ---- Transitions ---- */
  --hw-ease:      all 0.15s ease;
  --hw-ease-slow: all 0.3s ease;
}

body {
  background: var(--hw-bg);
  color: var(--hw-text);
  font-family: var(--hw-font-body);
  -webkit-font-smoothing: antialiased;
}

body::after {
  content: '';
  position: fixed;
  inset: 0;
  background-image: radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px);
  background-size: 4px 4px;
  pointer-events: none;
  z-index: 9999;
}
```

---

## Typography Scale

### Bebas Neue — Display (`--hw-font-display`)
Always uppercase, letter-spacing ≥ 1px, font-weight 400.

| Use | Size | Letter-spacing |
|-----|------|---------------|
| Page title | 72px | 3px |
| Section header | 48px | 2px |
| Sub-header | 36–40px | 2px |
| Card title | 22px | 2px |
| Modal title | 22px | 2px |
| Price (large) | 52px | 1px |
| Button | 16px | 3px |
| Button (small) | 12px | 2px |

### Space Mono — Labels & Metadata (`--hw-font-mono`)
Almost always uppercase + letter-spaced.

| Use | Size | Letter-spacing | Weight | Color |
|-----|------|---------------|--------|-------|
| Section tag | 11px | 4px | 400 | `--hw-blue` |
| Form label | 11px | 1.5px | 400 | `--hw-text-secondary` |
| Table header | 10px | 2px | 700 | white on `--hw-bg-invert` |
| Badge | 9px | 2px | 700 | semantic color |
| Nav link | 11px | 1.5px | 400 | `--hw-text-secondary` |
| Metadata | 10px | 1px | 400 | `--hw-text-muted` |

### DM Sans — Body (`--hw-font-body`)
Normal case. Never uppercase.

| Use | Size | Weight | Color |
|-----|------|--------|-------|
| Body paragraph | 15–16px | 300 | `--hw-text-secondary` |
| Card description | 14px | 300 | `--hw-text-secondary` |
| Form input text | 15px | 400 | `--hw-text` |
| Small / helper | 13px | 300 | `--hw-text-muted` |

---

## Component Patterns

### Buttons
`font-family: var(--hw-font-display)`, uppercase, `letter-spacing: 3px`, `border-radius: 0`, `border: 3px solid`. Hover lifts 2px with flat shadow.

- **Primary:** bg crimson, text white, border crimson → hover: crimson-dark + shadow-md
- **Secondary:** bg white, text black, border black → hover: bg black, text white + shadow-md
- **Ghost:** bg transparent, border transparent → hover: border black, lift 2px
- **Destructive:** bg white, text crimson, border crimson → hover: bg crimson, text white
- **Small:** font-size 12px, letter-spacing 2px, padding 8px 16px
- **Disabled:** opacity 0.4, pointer-events none

### Form Inputs
`font-family: var(--hw-font-body)`, 15px, `border: 3px solid var(--hw-border-strong)`, `border-radius: 0`. Focus: `border-color: var(--hw-crimson)`. Error: crimson border + crimson error text below in Space Mono 11px.

Labels: `var(--hw-font-mono)`, 11px, uppercase, 1.5px letter-spacing, above the input.

Checkbox: 20x20px square, 3px black border. Checked: crimson bg + white checkmark.
Radio: same but border-radius 50%. Checked: crimson bg + white dot.

### Cards
- **Standard:** bg white, 3px black border, padding 32px. Hover: translateY(-4px) + shadow-lg
- **Dark:** bg #1A1A1A, title in crimson, text in cream (opacity .85)
- **Accent:** border crimson, shadow-accent (6px 6px 0 crimson)
- **Title:** Bebas Neue 22px. **Desc:** DM Sans 14px wt 300. **Meta:** Space Mono 10px muted.

### Stat Cards
Label: Space Mono 10px muted. Value: Bebas Neue 36px. Sub: Space Mono 11px. Positive: `--hw-green`. Negative: `--hw-crimson`.

### Badges
Space Mono, 9px, uppercase, 2px letter-spacing, 700 weight, 2px border, padding 4px 10px.
- **Confirmed:** green-ghost bg, green text/border
- **Pending:** amber-ghost, amber
- **Error:** red-ghost, crimson
- **Info:** blue-ghost, blue
- **Neutral:** rgba(0,0,0,0.04), muted
- **Accent:** crimson bg, white text

### Data Tables
Wrapper: 3px black border. Header: bg #1A1A1A, Space Mono 10px uppercase 700 white. Body: DM Sans 14px wt 300. Row hover: crimson-ghost. Numbers: Space Mono 13px right-aligned. Positive: green. Negative: crimson.

### Tabs
Container: flex, border-bottom 3px black. Tab: Space Mono 11px uppercase. Active: crimson text, crimson bottom border, weight 700.

### Toggle Switch
Track: 48x26px, 3px black border, no radius. On: crimson bg, knob slides right.

### Alerts
Full-width. Ghost bg tint + colored border. Title: Space Mono 11px uppercase 700. Body: DM Sans 14px wt 300. Variants: success (green), error (crimson), warning (amber), info (blue).

### Modal
White bg, 3px black border, shadow-xl. Header: 20px 24px padding, bottom border. Title: Bebas Neue 22px. Footer: cream bg, right-aligned buttons.

### Drop Zone
Default: 3px dashed border-light, bg white. Hover/drag: solid crimson border, crimson-ghost bg.

### Navigation — Top Bar
Fixed, padding 16px 32px, bg cream 0.92 opacity, backdrop blur. Brand: Bebas Neue 28px crimson. Links: Space Mono 11px. Bell: crimson count badge.

### Navigation — Sidebar
240px, bg white, 3px black border. Items: 14px, 10px 20px padding, 3px left border. Active: crimson-ghost bg, crimson text, crimson left border.

### Other Components
- **Breadcrumb:** Space Mono 11px uppercase. Links muted → hover crimson. Current: primary text, weight 700.
- **Pagination:** Space Mono 12px, 3px black border, overlapping margins. Active: invert bg.
- **Avatars:** Square (not round). Monogram. Crimson on crimson-ghost. Sizes: sm 28px, md 36px, lg 48px.
- **Progress bars:** 8px track, crimson or green fill, no radius.
- **Tooltips:** Space Mono 11px, invert bg, CSS arrow.
- **Toasts:** Top-right, 3px border, shadow-lg, auto-dismiss 5s.
- **Empty states:** Dashed border, icon at .4 opacity, Bebas title, CTA button.
- **Skeletons:** Shimmer gradient animation, no radius.

---

## Color Usage Quick Reference

| Context | Color | Variable |
|---------|-------|----------|
| CTA buttons, primary actions | Muted crimson | `--hw-crimson` |
| Section tags, info badges | Steel blue | `--hw-blue` |
| Active/selected doc cards | Warm gray | `--hw-gray` |
| Category badges, tertiary | Dusty purple | `--hw-purple` |
| Soft highlights | Dusty rose | `--hw-rose` |
| Confirmed, settled, positive | Green | `--hw-green` |
| Warning, pending | Amber | `--hw-amber` |
| Error, over budget, escalated | Crimson | `--hw-crimson` |
| Page background | Warm cream | `--hw-bg` |
| Cards, inputs, modals | White | `--hw-bg-surface` |
| Dark cards, footer, table headers | Near black | `--hw-bg-invert` |

---

---

# SECTION 2: Design System Implementation To-Do List

---

## Phase 1 — Foundation (Do This First)

### 1.1 Install Fonts
- [ ] Add Google Fonts import to `app/layout.tsx` or `globals.css` (Bebas Neue, Space Mono, DM Sans)
- [ ] Remove any conflicting font imports
- [ ] Verify fonts load on deployed Vercel build

### 1.2 Set Up CSS Custom Properties
- [ ] Copy the full `:root` block into `globals.css`
- [ ] Add halftone overlay on `body::after`
- [ ] Set body background to `--hw-bg`, font-family to `--hw-font-body`
- [ ] Add global `border-radius: 0` reset

### 1.3 Create Base Component Files (`components/ui/` or `components/hw/`)
- [ ] `HwButton.tsx` — primary, secondary, ghost, destructive, small, disabled
- [ ] `HwInput.tsx` — text input with label, error state, disabled
- [ ] `HwSelect.tsx` — styled select with custom chevron
- [ ] `HwTextarea.tsx` — styled textarea with label
- [ ] `HwCheckbox.tsx` — square checkbox, crimson checked state
- [ ] `HwRadio.tsx` — round radio, crimson checked state
- [ ] `HwCard.tsx` — standard, dark, accent variants
- [ ] `HwStatCard.tsx` — label, value, sub/delta
- [ ] `HwBadge.tsx` — confirmed, pending, error, info, neutral, accent
- [ ] `HwTag.tsx` — generic tag
- [ ] `HwTable.tsx` — wrapper, header, body with hover
- [ ] `HwTabs.tsx` — tab container with active state
- [ ] `HwToggle.tsx` — square switch
- [ ] `HwAlert.tsx` — success, error, warning, info
- [ ] `HwModal.tsx` — header/body/footer with backdrop
- [ ] `HwDropZone.tsx` — default/active states
- [ ] `HwBreadcrumb.tsx` — linked crumbs + current
- [ ] `HwPagination.tsx` — page buttons with active
- [ ] `HwAvatar.tsx` — square monogram, sm/md/lg
- [ ] `HwProgress.tsx` — crimson or green bar
- [ ] `HwToast.tsx` — positioned notification with auto-dismiss
- [ ] `HwSkeleton.tsx` — line, block, circle shimmer
- [ ] `HwEmptyState.tsx` — icon, title, description, CTA
- [ ] `HwSectionTag.tsx` — blue section label
- [ ] `HwTooltip.tsx` — dark tooltip with arrow

### 1.4 Create Layout Components
- [ ] `HwTopNav.tsx` — fixed nav with brand, links, bell, CTA, scroll border
- [ ] `HwSidebar.tsx` — sidebar with brand, sections, items, active state
- [ ] `HwPageHeader.tsx` — breadcrumb + page title + optional actions
- [ ] `HwSectionHeader.tsx` — section tag + title + optional description

---

## Phase 2 — Core Layout

- [ ] Replace current nav bar with `HwTopNav`
- [ ] Update page background to cream
- [ ] Style notification bell with crimson count badge
- [ ] Convert artist tiles to `HwCard` pattern
- [ ] Style onboarding choice screen with Warhol components
- [ ] "New Artist" empty state: `HwEmptyState`

---

## Phase 3 — TourRouter Pages

- [ ] `HwTabs` on Artist Hub (TourRouter / Localizer)
- [ ] Tour tiles as `HwCard` with Bebas title, Space Mono meta, `HwBadge` status
- [ ] Routing table: `HwTable` with black header, mono financial columns, crimson-ghost row hover
- [ ] Stat cards row above table: `HwStatCard`
- [ ] Import page: `HwDropZone` + `HwTable` column mapper + confidence badges
- [ ] Financials page: `HwStatCard` row, P&L table, projected/actual toggle
- [ ] Export page: format cards + download buttons
- [ ] Public advance form: full Warhol styling (this is product-facing for venues)

---

## Phase 4 — Localizer Pages

- [ ] Asset grid as `HwCard` pattern
- [ ] Upload area: `HwDropZone`
- [ ] Venue share links: `HwInput` readonly + copy + `HwBadge` status

---

## Phase 5 — Supporting Pages

- [ ] Master Artist Profile: `HwSectionTag` headers, all `HwInput`/`HwSelect` forms, square logo upload
- [ ] Settings / Billing: plan cards, `HwBadge` current plan, upgrade buttons
- [ ] Notification panel: `HwCard` dropdown, crimson unread indicators
- [ ] Onboarding wizard: `HwProgress` bar, Bebas headers, `HwInput` forms (see Section 3 below)

---

## Phase 6 — Global Polish

- [ ] Add `HwSkeleton` to every data-fetching page
- [ ] Add `HwEmptyState` to every list/table page
- [ ] Wire up `HwToast` for save/add/delete/upload/error actions
- [ ] Style all confirmation modals with `HwModal`
- [ ] Responsive pass: test at 900px, 768px, 480px
- [ ] Final audit: search for any border-radius > 0, hardcoded hex colors, non-`--hw-font-*` declarations, box-shadow with blur

**Estimated: 7–12 Claude Code sessions. No backend changes. No schema changes. No business logic changes.**

---

---

# SECTION 3: Onboarding Wizard Spec

---

## Overview

New user with zero artists clicks "Get Started" → enters this 5-step wizard. Goal: zero to looking at a real tour in under 3 minutes.

**Flow:** Create Artist → Add Roster → Create Tour → Add Shows → Done
**Tone:** Friendly, casual, encouraging.
**Route:** `/dashboard/onboarding`

---

## Step 1 — Create Your First Artist

**Headline:** Let's get your act on the road.
**Subhead:** We just need a name to get started. You can add everything else later.

| Field | Type | Required | Placeholder |
|-------|------|----------|-------------|
| Artist / Band Name | text input | Yes | "The War on Drugs" |
| Logo | image upload (square drop zone) | No | "Drop a logo here — transparent PNG works best" |

- Creates `artists` record on submit
- Logo → `tour-assets/{org_id}/{artist_id}/logo.png`
- No logo → monogram avatar
- **Next button:** "Next — Add Your Team"

---

## Step 2 — Add Your Team

**Headline:** Who's coming on the road?
**Subhead:** Add the people on your tour — band, crew, management, whoever. You can add pay rates later.

| Field | Type | Required | Placeholder |
|-------|------|----------|-------------|
| Name | text input | Yes | "Jamie" |
| Role | select | Yes | TM, BM, FOH, Monitor, Guitar Tech, Drum Tech, Bass Tech, Keys Tech, Backline, Merch, Bus Driver, PM, LD, Stage Mgr, Photographer, Band Member, Other |
| Day Rate | number | No | "$0" |
| Off Day Rate | number | No | "$0" |

- Repeatable rows. "+ Add another person" link.
- 0 people is fine — skip allowed
- Saves as artist's `default_roster` JSONB
- **Next button:** "Next — Create Your Tour"

---

## Step 3 — Create Your First Tour

**Headline:** Name your tour.
**Subhead:** This is where everything lives — your routing, budget, shows, and documents.

| Field | Type | Required | Placeholder |
|-------|------|----------|-------------|
| Tour Name | text input | Yes | "Spring 2026 US Run" |
| Start Date | date picker | No | "Rough dates are fine" |
| End Date | date picker | No | |
| Vehicle Type | select | No | Van (default), Bus, Fly, Mix |

- Creates `tours_routing` record
- Copies `default_roster` → `tour_roster`
- Vehicle defaults: Van 12mpg/$3.50, Bus 6mpg/$4.00
- **Next button:** "Next — Add Shows"

---

## Step 4 — Add Your Shows

**Headline:** Now the fun part.
**Subhead:** Add dates manually or drop a route sheet and let HWY61 do the work.

**Two paths, side by side on the same screen:**

**Path A — Manual Entry** (repeatable rows):
Date (required), City (required), Venue (optional), Offer (optional)

**Path B — Drop a Document:**
Full `HwDropZone`. Accepts PDF, Excel, CSV, images. Calls `/api/tourrouter/intake`. Shows preview table of parsed shows for review before confirming.

- Both paths visible simultaneously
- 0 shows is fine — skip allowed
- **Next button:** "Finish Setup"

---

## Step 5 — Done

**Headline:** You're on the road.
**Subhead:** Here's what we set up for you. Everything is editable — go explore.

Summary card: artist name, tour name, show count, roster count, vehicle type, date range.

**Links:**
- "View your tour" → routing table
- "Upload a document" → import page
- "Set up your vehicle" → tour settings
- "Update your Artist Profile" → profile page

**Primary CTA:** "View Your Tour" (big crimson button)

Sets dismissal flag so wizard doesn't show again.

---

## Edge Cases
- User closes browser mid-wizard → partial data exists, dashboard handles gracefully
- Document parsing fails at Step 4 → show error, keep manual entry available
- Document returns 20 shows → show all in scrollable preview
- Back navigation → preserves previously entered data

---

---

# SECTION 4: Demo Tour Data

**Purpose:** Pre-loaded demo tour for "Explore a Demo Tour" onboarding option. Also a sales tool.

---

## Artist
**Name:** Beta Test Band | **Monogram:** BTB

## Roster (7 People)

| Name | Role | Day Rate | Off Day Rate |
|------|------|----------|-------------|
| Casey Muller | Tour Manager | $350 | $200 |
| Raj Patel | FOH Engineer | $300 | $150 |
| Shea Donovan | Monitor Engineer | $275 | $150 |
| Marco Ruiz | Guitar Tech | $225 | $125 |
| Dani Cho | Merch | $150 | $100 |
| Alex Brewer | Band Member | $0 (pct_net) | $0 |
| Jordan Cross | Band Member | $0 (pct_net) | $0 |

## Tour Settings
**Name:** Fall 2026 — North America + UK | **Vehicle:** Van | **PAX:** 7 | **MPG:** 14 | **Fuel:** $3.45 | **Flight threshold:** 6h | **Per diem show:** $35 | **Per diem off:** $25

**Fly legs:** Toronto → London (Show 13→15), Manchester → Amsterdam (Show 16→17)

---

## Shows (18 Dates)

### US Leg 1

| # | Date | City | Venue | Cap | Deal | Guarantee | Currency | Status | Advance |
|---|------|------|-------|-----|------|-----------|----------|--------|---------|
| 1 | Sep 10 | Brooklyn, NY | Music Hall of Williamsburg | 550 | Flat | $4,500 | USD | Settled | Confirmed |
| 2 | Sep 11 | Philadelphia, PA | Union Transfer | 700 | Vs gross 80/20 after $8K | $5,000 | USD | Settled | Confirmed |
| 3 | Sep 13 | Washington, DC | 9:30 Club | 1,200 | Vs gross 85/15 after $12K | $7,500 | USD | Settled | Confirmed |
| 4 | Sep 14 | Richmond, VA | The National | 1,500 | Flat | $4,000 | USD | Confirmed | Confirmed |
| 5 | Sep 16 | Asheville, NC | The Orange Peel | 1,050 | Flat | $3,500 | USD | Confirmed | Follow-up 1 |
| 6 | Sep 17 | Atlanta, GA | Terminal West | 600 | Door 70/30 | $3,000 | USD | Confirmed | Sent |
| 7 | Sep 19 | Nashville, TN | Mercy Lounge | 500 | Flat | $3,000 | USD | Confirmed | Not started |
| 8 | Sep 20 | Louisville, KY | Headliners Music Hall | 800 | Flat | $2,500 | USD | Confirmed | Not started |

### US Leg 2

| # | Date | City | Venue | Cap | Deal | Guarantee | Currency | Status | Advance |
|---|------|------|-------|-----|------|-----------|----------|--------|---------|
| 9 | Sep 22 | Chicago, IL | Thalia Hall | 800 | Vs gross 80/20 after $10K | $5,500 | USD | Confirmed | Escalated |
| 10 | Sep 23 | Detroit, MI | El Club | 350 | Flat | $2,000 | USD | Confirmed | Final nudge |
| 11 | Sep 25 | Columbus, OH | A&R Music Bar | 400 | Flat | $2,000 | USD | Pending | Not started |
| 12 | Sep 26 | Pittsburgh, PA | Mr. Smalls Theatre | 600 | Flat | $2,500 | USD | Pending | Not started |

### Canada

| # | Date | City | Venue | Cap | Deal | Guarantee | Currency | Status | Advance |
|---|------|------|-------|-----|------|-----------|----------|--------|---------|
| 13 | Sep 28 | Toronto, ON | Danforth Music Hall | 1,500 | Vs gross 80/20 after $14K CAD | $9,000 | CAD | Confirmed | Confirmed |
| 14 | Sep 29 | Montreal, QC | La Tulipe | 450 | Flat | $4,500 | CAD | Confirmed | Sent |

### UK/EU

| # | Date | City | Venue | Cap | Deal | Guarantee | Currency | Status | Advance |
|---|------|------|-------|-----|------|-----------|----------|--------|---------|
| 15 | Oct 2 | London, UK | Electric Brixton | 1,500 | Vs gross 80/20 after £10K | £6,000 | GBP | Confirmed | Confirmed |
| 16 | Oct 3 | Manchester, UK | Gorilla | 600 | Flat | £3,500 | GBP | Confirmed | Follow-up 2 |
| 17 | Oct 5 | Amsterdam, NL | Paradiso (Small Hall) | 450 | Flat | €4,000 | EUR | Pending | Not started |
| 18 | Oct 6 | Brussels, BE | Ancienne Belgique (Club) | 400 | Flat | €3,000 | EUR | Pending | Not started |

---

## Settlement Data (Shows 1–3)

**Show 1 — MHOW:** Flat deal. Gross $5,180 (490 tickets). Artist payment: $4,500.

**Show 2 — Union Transfer:** Vs deal kicked in. Gross $11,200 (640 tickets). Expenses $1,200. Overage: 80% of ($10,000 - $8,000) = $1,600. Artist takes higher: $5,640.

**Show 3 — 9:30 Club:** Big night. Gross $18,400 (1,100 tickets). Expenses $1,800. Overage: 85% of ($16,600 - $12,000) = $3,910. Final payout: $8,810.

---

## Hotel Data (10 of 18 Shows)

| # | Hotel | City | Rooms | Rate | Currency | Conf # |
|---|-------|------|-------|------|----------|--------|
| 1 | The Hoxton, Williamsburg | Brooklyn | 4 | $189 | USD | HXT-449281 |
| 2 | Lokal Hotel | Philadelphia | 4 | $169 | USD | LOK-882103 |
| 3 | The Line DC | Washington | 4 | $205 | USD | LDC-337820 |
| 5 | Aloft Asheville | Asheville | 4 | $149 | USD | ALF-209384 |
| 6 | Home2 Suites | Atlanta | 4 | $139 | USD | H2S-559102 |
| 9 | The Robey | Chicago | 4 | $179 | USD | ROB-104488 |
| 13 | The Drake Hotel | Toronto | 4 | $210 | CAD | DRK-773291 |
| 14 | Hotel 10 | Montreal | 4 | $185 | CAD | H10-498201 |
| 15 | The Hoxton, Southwark | London | 4 | £179 | GBP | HXT-UK-881204 |
| 16 | The Cow Hollow Hotel | Manchester | 4 | £129 | GBP | CHH-330122 |

---

## Commission Structure
- Northside Management: 15% of gross (all income)
- Raven Agency: 10% of gross (guarantees only)

---

## Also Seed
- Guest list entries on shows 1, 3, 9 (4–6 names each, mix of Guest/Industry/Press/Photo)
- 12 expense records (fuel, tolls, parking, oil change, guitar strings, airport transfer)
- Advance detail for shows 1, 3, 13, 15 (load-in, soundcheck, doors, WiFi, contacts, parking, venue notes)

**Full details for all of the above are in the standalone `HWY61_DEMO_TOUR_DATA.md` file.**

---

---

# SECTION 5: What Drew Still Needs From Tim

These items are in Tim's hands — Drew can't build without them:

1. **Beta user list** — names/emails for the 10 invite codes (HWY61-BETA-001 through 010)
2. **QA test documents** — 22 real touring documents across 7 categories (checklist provided separately)
3. **Legal sign-off** — review ToS and Privacy Policy (live as of April 1, 2026)
4. **Marketing site copy** — product page descriptions (landing page design is done)
5. **EIN** — still blocking Stripe restructure (Phase 7C)

---

---

# SECTION 6: Updated Phase Status

| Sub-phase | Status |
|---|---|
| 7A Domain migration | ✅ Done |
| 7B Mapbox integration | ✅ Done |
| 7C Stripe restructure | 🚫 Blocked on EIN |
| 7D Feature flags + mobile | ✅ Done |
| 7E Road App | 🔲 Not started |
| 7F Notifications | ✅ Core done |
| 7G PostHog analytics | ✅ Done |
| 7H Onboarding wizard | 🟡 Shell built — spec ready (Section 3 above) |
| 7I Beta invites | ✅ Done |
| 7J Support / FAQ | 🟡 Draft content ready — Tim reviewing |
| 7K Marketing site | 🟡 Landing page design done — needs product page copy from Tim |
| 7L Legal updates | ✅ Done — needs Tim sign-off |
| 7M Final QA + beta launch | 🔲 Blocked on QA documents from Tim |

---

---

# SECTION 7: Important Notes

## No AI Language in Product Marketing
Across all user-facing copy, marketing, and product descriptions: never say "AI." It's always "HWY61 reads it" / "HWY61 figures it out" / "the system matches it." The internal codebase can reference Anthropic API and AI parsing — but the user never sees the word "AI."

## Landing Page Updates Completed
- TourRouter moved to first product position ✅
- Pricing section added with monthly/yearly toggle and bundle ✅
- Drop zone already above products in Warhol version ✅
- Section order: Hero → Problem → Drop Zone → Products → Road App → Who It's For → Pricing → CTA ✅
- File: `HWY61_WARHOL_CUSTOM_PALETTE.html`

## Reference Files (Not Included Here — Delivered Separately)
- `HWY61_DESIGN_SYSTEM.html` — visual component reference (open in browser side-by-side while building)
- `HWY61_WARHOL_CUSTOM_PALETTE.html` — final landing page with all updates
- `HWY61_DEMO_TOUR_DATA.md` — full demo tour data with all settlement JSON, advance details, expenses
- `HWY61_FAQ_CONTENT.md` — full FAQ with all 34 Q&As
- `HWY61_TUTORIAL_VIDEO_SCRIPTS.md` — 8 video scripts for Tim to record
- `HWY61_QA_Documents_Checklist.pdf` — printable checklist for Tim

---

*This document contains everything from the April 1, 2026 working session. Paste it at the start of any Claude Code session alongside the Master Context v4 doc. Build in the order listed: Foundation → Layout → TourRouter → Localizer → Supporting → Polish.*
