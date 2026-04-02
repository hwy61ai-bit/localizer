# HWY61 Design System — Implementation To-Do List for Drew
**April 2026**
**Reference file:** `HWY61_DESIGN_SYSTEM.md` (paste into every Claude Code session that touches UI)
**Visual reference:** `HWY61_DESIGN_SYSTEM.html` (open in browser side-by-side while building)

---

## Phase 1 — Foundation (Do This First, Before Any Page Work)

### 1.1 Install Fonts
- [ ] Add Google Fonts import to `app/layout.tsx` or `globals.css`:
  - Bebas Neue (400)
  - Space Mono (400, 700)
  - DM Sans (300, 400, 500, 700)
- [ ] Remove any existing font imports that conflict (Inter, system fonts, etc.)
- [ ] Verify fonts load on deployed Vercel build (not just localhost)

### 1.2 Set Up CSS Custom Properties
- [ ] Copy the full `:root` block from `HWY61_DESIGN_SYSTEM.md` into `globals.css`
- [ ] Prefix all variables with `--hw-` to avoid collisions with existing styles
- [ ] Add the halftone overlay on `body::after` (radial-gradient, 4px grid, 0.04 opacity, pointer-events none, z-index 9999)
- [ ] Set `body` background to `--hw-bg` (#F5F0E8)
- [ ] Set `body` font-family to `--hw-font-body`
- [ ] Set global `border-radius: 0` reset — add `*, *::before, *::after { border-radius: 0 !important; }` temporarily to catch any existing rounded corners, then remove the `!important` once components are updated

### 1.3 Create Base Component Files
Create these as reusable React components in `components/ui/` (or `components/hw/` if you want to namespace them):

- [ ] `HwButton.tsx` — primary, secondary, ghost, destructive, small, disabled variants
- [ ] `HwInput.tsx` — text input with label, error state, disabled state
- [ ] `HwSelect.tsx` — styled select with custom chevron
- [ ] `HwTextarea.tsx` — styled textarea with label
- [ ] `HwCheckbox.tsx` — square checkbox with crimson checked state
- [ ] `HwRadio.tsx` — round radio with crimson checked state
- [ ] `HwCard.tsx` — standard, dark, accent variants + title/desc/meta slots
- [ ] `HwStatCard.tsx` — label, value, sub/delta (up/down coloring)
- [ ] `HwBadge.tsx` — confirmed, pending, error, info, neutral, accent variants
- [ ] `HwTag.tsx` — generic tag (no semantic color)
- [ ] `HwTable.tsx` — wrapper, header, body with hover and number alignment
- [ ] `HwTabs.tsx` — tab container + tab items with active state
- [ ] `HwToggle.tsx` — square switch with on/off state
- [ ] `HwAlert.tsx` — success, error, warning, info variants
- [ ] `HwModal.tsx` — header/body/footer with backdrop
- [ ] `HwDropZone.tsx` — default/active states, file type hints
- [ ] `HwBreadcrumb.tsx` — linked crumbs + current item
- [ ] `HwPagination.tsx` — page buttons with active state
- [ ] `HwAvatar.tsx` — square monogram, sm/md/lg
- [ ] `HwProgress.tsx` — crimson or green bar
- [ ] `HwToast.tsx` — positioned notification with auto-dismiss
- [ ] `HwSkeleton.tsx` — line, block, circle shimmer loading states
- [ ] `HwEmptyState.tsx` — icon, title, description, CTA button
- [ ] `HwSectionTag.tsx` — blue section label (Space Mono 11px, uppercase, 4px spacing)
- [ ] `HwTooltip.tsx` — dark tooltip with arrow

### 1.4 Create Layout Components
- [ ] `HwTopNav.tsx` — fixed nav bar with brand, links, bell icon, CTA button, scroll border
- [ ] `HwSidebar.tsx` — sidebar with brand, sections, items, active state
- [ ] `HwPageHeader.tsx` — breadcrumb + page title (Bebas Neue) + optional action buttons
- [ ] `HwSectionHeader.tsx` — section tag + section title + optional description

---

## Phase 2 — Apply to Core Layout (Do This Second)

### 2.1 Dashboard Shell
- [ ] Replace current nav bar with `HwTopNav`
- [ ] Update page background to `--hw-bg` (cream, not white)
- [ ] Style notification bell with crimson count badge
- [ ] Verify nav links use Space Mono uppercase styling
- [ ] Make "HWY61" brand mark use Bebas Neue in crimson with letter-spacing
- [ ] Add scroll behavior: transparent bottom border → solid on scroll

### 2.2 Dashboard — Artist Tiles
- [ ] Convert artist tiles to `HwCard` pattern (3px black border, flat shadow hover)
- [ ] Artist name: Bebas Neue 22px, uppercase
- [ ] Metadata (tour count, date): Space Mono 10px, muted
- [ ] Gear icon → settings: use secondary color, hover crimson
- [ ] "New Artist" empty state: use `HwEmptyState` pattern with dashed border

### 2.3 Dashboard — Onboarding Choice Screen
- [ ] Apply Bebas Neue for "Welcome" headline
- [ ] Style the three option cards (Get Started / Demo Tour / Skip) as `HwCard` variants
- [ ] Primary CTA card: use accent border variant
- [ ] "Skip" option: ghost style

---

## Phase 3 — TourRouter Pages

### 3.1 Tour List (Artist Hub → TourRouter Tab)
- [ ] Apply `HwTabs` to the Artist Hub tabs (TourRouter / Localizer)
- [ ] Style tour tiles as `HwCard` with:
  - Tour name: Bebas Neue 22px
  - Date range + show count: Space Mono 10px
  - Status badge: `HwBadge`
  - Tour photo: 3px black border, no radius
- [ ] "Create Tour" button: `HwButton` primary
- [ ] Empty state: `HwEmptyState`

### 3.2 Routing Table (`/dashboard/routing/[tourId]`)
- [ ] Page title: Bebas Neue 48px, uppercase
- [ ] Breadcrumb: `HwBreadcrumb` (Dashboard › Artist › Tour)
- [ ] Replace table with `HwTable` pattern:
  - Black header row, Space Mono
  - DM Sans body cells
  - Financial columns right-aligned in mono
  - Status column with `HwBadge`
  - Row hover: crimson-ghost tint
  - Positive/negative amounts: green/crimson
- [ ] Stat cards row above table: `HwStatCard` (total shows, total income, avg drive, etc.)
- [ ] Drive time warnings: `HwAlert` warning variant
- [ ] "Add Show" button: `HwButton` primary
- [ ] Vehicle settings panel: `HwSelect`, `HwInput`, `HwToggle` for drive-vs-fly

### 3.3 Import Page (`/dashboard/routing/[tourId]/import`)
- [ ] Drop zone: `HwDropZone` component
- [ ] Column mapper: `HwTable` with `HwSelect` dropdowns per row
- [ ] Confidence indicators: `HwBadge` (green for auto-confirmed, amber for review, crimson for unmapped)
- [ ] "Import" button: `HwButton` primary
- [ ] "Cancel" button: `HwButton` ghost

### 3.4 Financials Page (`/dashboard/routing/[tourId]/financials`)
- [ ] Page title: Bebas Neue
- [ ] Stat cards row: `HwStatCard` × 4–6 (gross, expenses, net, commissions, etc.)
- [ ] P&L table: `HwTable` with green/crimson for positive/negative
- [ ] Commission waterfall: styled list or table
- [ ] Per-show breakdown: `HwTable` with expandable rows
- [ ] Toggle: projected vs. actual — `HwToggle`

### 3.5 Export Page (`/dashboard/routing/[tourId]/export`)
- [ ] Export format cards: `HwCard` (CSV / Excel / PDF)
- [ ] Download buttons: `HwButton` secondary per format
- [ ] Options: `HwCheckbox` for what to include

### 3.6 Public Advance Form (`/advance/[token]`)
- [ ] This is a public-facing page — it IS the product's face for venues
- [ ] Apply Warhol styling: cream background, Bebas header, all form inputs styled
- [ ] Use `HwInput`, `HwSelect`, `HwTextarea` for all form fields
- [ ] Section dividers: 3px black border-top
- [ ] Section tags: `HwSectionTag` (blue, Space Mono)
- [ ] Submit button: `HwButton` primary (full width)
- [ ] Success confirmation: `HwAlert` success

---

## Phase 4 — Localizer Pages

### 4.1 Localizer Tab (in Artist Hub)
- [ ] Asset grid/tiles: `HwCard` pattern
- [ ] Upload area: `HwDropZone`
- [ ] Template selector: `HwSelect`
- [ ] Generate button: `HwButton` primary
- [ ] Batch export: `HwButton` secondary

### 4.2 Venue Share Links
- [ ] Link generation UI: `HwInput` (readonly) + copy button
- [ ] Status: `HwBadge` (active / expired)

---

## Phase 5 — Supporting Pages

### 5.1 Master Artist Profile
- [ ] Page title: Bebas Neue, artist name uppercase
- [ ] Section headers: `HwSectionTag` + `HwSectionHeader`
- [ ] All form fields: `HwInput`, `HwSelect`, `HwTextarea`
- [ ] Logo upload: square `HwDropZone` (no border-radius)
- [ ] Roster table: `HwTable`
- [ ] Save button: `HwButton` primary
- [ ] Commission config: `HwInput` for percentages, `HwSelect` for type

### 5.2 Settings / Billing
- [ ] Plan cards: `HwCard` with pricing in Bebas Neue
- [ ] Current plan badge: `HwBadge` accent
- [ ] Form fields: `HwInput`
- [ ] "Upgrade" / "Manage" buttons: `HwButton` primary / secondary
- [ ] Billing portal link: `HwButton` ghost

### 5.3 Notification Panel (Bell Dropdown)
- [ ] Panel: `HwCard` dark or white with 3px border + shadow-xl
- [ ] Each notification: DM Sans body, Space Mono timestamp
- [ ] Unread indicator: crimson dot or crimson left-border
- [ ] "Mark all read" link: Space Mono, crimson
- [ ] Click-through: navigates to relevant page

### 5.4 Onboarding Wizard Steps (When Tim Provides Content)
- [ ] Step indicator: `HwProgress` bar at top
- [ ] Step number + title: `HwSectionTag` + Bebas header
- [ ] Forms per step: `HwInput`, `HwSelect`
- [ ] Navigation buttons: "Back" ghost, "Next" primary
- [ ] Completion screen: Bebas headline + `HwCard` summary + action links

---

## Phase 6 — Global Polish

### 6.1 Loading States
- [ ] Add `HwSkeleton` to every page that fetches data (tour list, routing table, financials)
- [ ] Skeleton should match the layout shape of the actual content

### 6.2 Empty States
- [ ] Every list/table page needs an `HwEmptyState` (no tours, no shows, no expenses, no guest list entries)
- [ ] Each empty state should have a specific CTA (not just "add something")

### 6.3 Error States
- [ ] API errors: `HwAlert` error at top of page
- [ ] Form validation: crimson border + `HwInput` error message
- [ ] 404 page: `HwEmptyState` with "Go back to dashboard" CTA

### 6.4 Toast Notifications
- [ ] Wire up `HwToast` for:
  - Tour saved
  - Show added/updated/deleted
  - Document uploaded + parsed
  - Settlement confirmed
  - Export ready for download
  - Error (upload failed, API error)
- [ ] Position: fixed top-right, stack vertically
- [ ] Auto-dismiss: 5 seconds, manual close button

### 6.5 Modals
- [ ] Confirm delete (tour, show, expense): `HwModal` with destructive CTA
- [ ] Confirm settlement: `HwModal` with primary CTA
- [ ] Document review (AI Intake staged data): wider `HwModal` (640px)
- [ ] All modals: cream footer, right-aligned buttons

### 6.6 Responsive Pass
- [ ] Every page: test at 900px, 768px, 480px
- [ ] Cards stack to single column at 900px
- [ ] Nav links hide at 768px (keep bell + CTA)
- [ ] Tables get horizontal scroll wrapper at 768px
- [ ] Forms go full-width at 768px
- [ ] Sidebar collapses to hamburger at 900px

### 6.7 Final Consistency Audit
- [ ] Search codebase for any `border-radius` > 0 — fix all to 0
- [ ] Search for any hardcoded hex colors — replace with CSS variables
- [ ] Search for any `font-family` declarations not using `--hw-font-*` — replace
- [ ] Search for any `box-shadow` with blur > 0 — replace with flat offset
- [ ] Verify every `<button>` and `<input>` is using the HW components
- [ ] Verify every table is using the HW table pattern
- [ ] Verify every status indicator is using `HwBadge`

---

## Implementation Notes

### Order of Operations
Phases 1–2 are the foundation — do them first and everything else becomes faster. Phase 3 is the most complex (TourRouter has the most pages). Phases 4–5 are smaller. Phase 6 is the final polish pass before beta.

### How to Use in Claude Code Sessions
1. Paste `HWY61_DESIGN_SYSTEM.md` at the start of the session
2. Tell Claude which page or component you're working on
3. Reference the component patterns by name (e.g., "style this table as HwTable", "use HwStatCard for these numbers")
4. Claude will have all the tokens, rules, and patterns it needs to match the Warhol language exactly

### Estimated Effort
- Phase 1 (Foundation): 1 Claude Code session (2–4 hours)
- Phase 2 (Core Layout): 1 session
- Phase 3 (TourRouter): 2–3 sessions (most pages, most components)
- Phase 4 (Localizer): 1 session
- Phase 5 (Supporting): 1 session
- Phase 6 (Polish): 1–2 sessions
- **Total: 7–12 Claude Code sessions**

### What NOT to Change
- Database schema — this is purely visual
- API routes — no backend changes needed
- Business logic — `calcTourFinancials()` and all calculation functions stay untouched
- Component data flow / props — just styling, not restructuring

---

*This to-do list + the design system MD file = everything Drew needs to make the entire app look like the landing page. One voice, one visual language, every page.*
