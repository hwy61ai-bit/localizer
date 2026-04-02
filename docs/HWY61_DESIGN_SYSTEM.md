# HWY61 Design System — Warhol
**Version:** 1.0 — April 2026
**Style:** Warhol Pop Art — screen-print energy, flat offset shadows, zero border-radius
**Usage:** Paste this at the start of any Claude Code session that touches UI. This is the single source of truth for all visual styling across the HWY61 platform.

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
10. **Halftone dot overlay on `body::after`** — radial-gradient circles, 4px grid, 0.04 opacity. Subtle but essential. It's what makes the whole thing feel like a print.

---

## CSS Custom Properties (Copy to globals.css)

```css
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
```

### Halftone Overlay (Required — Add to Global Styles)
```css
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

### Google Fonts Import
```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=Space+Mono:wght@400;700&family=Bebas+Neue&display=swap');
```

---

## Typography Scale

### Bebas Neue — Display (`--hw-font-display`)
Use for: page titles, section headers, card titles, prices, tier names, button labels, modal titles.
Always: uppercase, letter-spacing ≥ 1px, font-weight 400 (Bebas only has one weight).

| Use | Size | Letter-spacing | Example |
|-----|------|---------------|---------|
| Page title | 72px | 3px | `SPRING TOUR 2026` |
| Section header | 48px | 2px | `TOUR FINANCIALS` |
| Sub-header | 36–40px | 2px | `SETTLEMENT DETAILS` |
| Card title | 22px | 2px | `BOWERY BALLROOM — NYC` |
| Modal title | 22px | 2px | `CONFIRM SETTLEMENT` |
| Price (large) | 52px | 1px | `$4,500` |
| Button | 16px | 3px | `GET STARTED` |
| Button (small) | 12px | 2px | `CANCEL` |

### Space Mono — Labels & Metadata (`--hw-font-mono`)
Use for: section tags, form labels, table headers, badges, timestamps, status text, breadcrumbs, nav links.
Almost always: uppercase, letter-spaced, small (9–12px).

| Use | Size | Letter-spacing | Weight | Color |
|-----|------|---------------|--------|-------|
| Section tag | 11px | 4px | 400 | `--hw-blue` |
| Form label | 11px | 1.5px | 400 | `--hw-text-secondary` |
| Table header | 10px | 2px | 700 | white (on `--hw-bg-invert`) |
| Badge | 9px | 2px | 700 | semantic color |
| Nav link | 11px | 1.5px | 400 | `--hw-text-secondary` |
| Metadata / timestamp | 10px | 1px | 400 | `--hw-text-muted` |
| Tooltip | 11px | 0.5px | 400 | white (on `--hw-bg-invert`) |

### DM Sans — Body (`--hw-font-body`)
Use for: paragraphs, descriptions, form inputs, helper text, error messages.
Normal case. Never uppercase.

| Use | Size | Weight | Color |
|-----|------|--------|-------|
| Body paragraph | 15–16px | 300 | `--hw-text-secondary` |
| Card description | 14px | 300 | `--hw-text-secondary` |
| Form input text | 15px | 400 | `--hw-text` |
| Small / helper | 13px | 300 | `--hw-text-muted` |
| Error message | 11px (mono) | 400 | `--hw-crimson` |

---

## Component Patterns

### Buttons
All buttons: `font-family: var(--hw-font-display)`, uppercase, `letter-spacing: 3px`, `border-radius: 0`, `border: 3px solid`. Hover lifts 2px with flat shadow. Active snaps back.

```
Primary:     bg crimson, text white, border crimson → hover: crimson-dark + shadow-md
Secondary:   bg white, text black, border black → hover: bg black, text white + shadow-md
Ghost:       bg transparent, border transparent → hover: border black, lift 2px
Destructive: bg white, text crimson, border crimson → hover: bg crimson, text white
Small:       font-size 12px, letter-spacing 2px, padding 8px 16px
Disabled:    opacity 0.4, pointer-events none
```

### Form Inputs
`font-family: var(--hw-font-body)`, 15px, `border: 3px solid var(--hw-border-strong)`, `border-radius: 0`, `bg: var(--hw-bg-surface)`. Focus: `border-color: var(--hw-crimson)`. Error: crimson border + crimson error text below in Space Mono 11px.

Labels: `font-family: var(--hw-font-mono)`, 11px, uppercase, 1.5px letter-spacing, `color: var(--hw-text-secondary)`, above the input.

Select: same as input + custom SVG chevron via `background-image`, `appearance: none`.

Checkbox: 20x20px square, 3px black border. Checked: crimson bg + white checkmark.
Radio: same but `border-radius: 50%`. Checked: crimson bg + white dot.

### Cards
```
Standard:  bg white, 3px black border, padding 32px
           Hover: translateY(-4px) + shadow-lg
Dark:      bg #1A1A1A, title in crimson, text in cream (opacity .85)
Accent:    border crimson, shadow-accent (6px 6px 0 crimson)

Card title:  Bebas Neue, 22px, uppercase, 2px spacing
Card desc:   DM Sans, 14px, weight 300, secondary color
Card meta:   Space Mono, 10px, uppercase, 1.5px spacing, muted color
```

### Stat Cards (Finance Dashboard)
```
Container:  bg white, 3px black border, padding 24px
Label:      Space Mono 10px, uppercase, 2px spacing, muted
Value:      Bebas Neue 36px, primary text
Sub:        Space Mono 11px, muted
            Positive delta: --hw-green with ▲
            Negative delta: --hw-crimson with ▲
```

### Badges & Status Tags
`font-family: var(--hw-font-mono)`, 9px, uppercase, 2px letter-spacing, `font-weight: 700`, `border: 2px solid`, `padding: 4px 10px`.

```
Confirmed:  bg green-ghost, text green, border green-border
Pending:    bg amber-ghost, text amber, border amber
Error:      bg red-ghost, text crimson, border crimson
Info:       bg blue-ghost, text blue, border blue
Neutral:    bg rgba(0,0,0,0.04), text muted, border default
Accent:     bg crimson, text white, border crimson
```

### Data Tables
```
Wrapper:    3px black border, overflow-x auto
Header row: bg #1A1A1A, text white
            Space Mono 10px, uppercase, 2px spacing, weight 700
Body cells: DM Sans 14px, weight 300, secondary color
            padding 12px 16px
            Top border: 2px solid --hw-border
Row hover:  bg crimson-ghost
Strong:     color primary, weight 500 (for date/name columns)
Numbers:    Space Mono 13px, right-aligned, primary color
Positive:   color --hw-green
Negative:   color --hw-crimson
```

### Tabs
```
Container:  flex row, border-bottom 3px solid black
Tab:        Space Mono 11px, uppercase, 2px letter-spacing
            padding 14px 24px, color muted
            border-bottom: 3px solid transparent, margin-bottom: -3px
Hover:      color primary text
Active:     color crimson, border-bottom-color crimson, weight 700
```

### Toggle Switch
```
Track:      48x26px, bg border color, 3px black border, no radius
Knob:       16x16px, bg black, 2px from edge
On:         track bg crimson, knob bg white, knob slides right
```

### Alerts
Full-width banners. Ghost background tint + colored left border or full border.
```
Container:  padding 16px 20px, border 3px solid [semantic color]
            bg: semantic ghost color
Icon:       16px, semantic color, flex-shrink 0
Title:      Space Mono 11px, uppercase, 1.5px spacing, 700, semantic color
Body:       DM Sans 14px, weight 300, primary text

Variants:   success (green), error (crimson), warning (amber), info (blue)
```

### Modal / Dialog
```
Backdrop:   rgba(0,0,0,0.5)
Container:  bg white, 3px black border, shadow-xl
            max-width 480px (confirm) or 640px (review)
Header:     padding 20px 24px, bottom border 3px black
            Title: Bebas Neue 22px
            Close: × button, muted → hover primary
Body:       padding 24px, DM Sans 15px, weight 300
Footer:     padding 16px 24px, top border 3px black, bg cream
            Right-aligned buttons
```

### Drop Zone
```
Default:    border 3px dashed --hw-border-light, bg white
            Icon: upload arrow, 32px, opacity .4
            Text: DM Sans 15px, secondary
            Hint: Space Mono 10px, uppercase, muted
Hover/drag: border solid crimson, bg crimson-ghost
            Text color: crimson
            Icon opacity: .7
```

### Navigation — Top Bar
```
Container:  fixed top, padding 16px 32px, bg cream (0.92 opacity)
            backdrop-filter: blur(20px)
            border-bottom: 3px solid transparent → solid on scroll
Brand:      Bebas Neue 28px, crimson, 4px letter-spacing
Links:      Space Mono 11px, uppercase, 1.5px spacing, secondary
CTA button: crimson bg, white text, no border-radius
Bell:       20px icon, crimson badge count (18x18, mono 9px)
```

### Navigation — Sidebar
```
Container:  240px width, bg white, 3px black border
Brand:      Bebas Neue 20px, crimson, 3px spacing
Section:    Space Mono 9px, uppercase, 2px spacing, muted, 16px top padding
Item:       14px, secondary, padding 10px 20px
            Left border: 3px transparent
Hover:      bg crimson-ghost, text primary
Active:     bg crimson-ghost, text crimson, left border crimson
Icon:       16px, 20px width (for alignment)
```

### Breadcrumbs
`Space Mono 11px, uppercase, 1px letter-spacing`. Links in muted → hover crimson. Current item in primary text, weight 700. Separator: `›` in border-light color.

### Pagination
Buttons: `Space Mono 12px`, `padding 8px 14px`, `3px black border`, margin-left -3px (overlapping borders). Hover: crimson-ghost bg. Active: invert bg + white text + bold.

### Avatars
Square (not round). Monogram initials. Crimson text on crimson-ghost bg. 2px black border.
Sizes: sm (28px, 10px font), md (36px, 12px font), lg (48px, 16px font).

### Progress Bars
Track: 8px height, bg `--hw-border`, 1px border-light border. Bar: `--hw-crimson` or `--hw-green`. No border-radius.

### Tooltips
`Space Mono 11px`, bg invert, text invert, `padding 6px 12px`. Arrow: CSS border triangle. No border-radius.

### Toast Notifications
Positioned top-right. `3px black border, shadow-lg`. Same structure as alerts but smaller (max-width 380px) with close button. Auto-dismiss 5s.

### Empty States
Centered. Dashed 3px border in border-light. Icon at 36px, opacity .4. Title: Bebas Neue 24px. Desc: 14px muted. CTA button below.

### Loading Skeletons
Shimmer animation: linear gradient sweep, 1.5s infinite. No border-radius. Use for line (14px height), block (120px height), and circle (40x40).

---

## Page Structure Patterns

### Section Spacing
- Major sections: `padding: 120px 48px` (desktop), `80px 24px` (mobile)
- Section dividers: `border-top: 3px solid var(--hw-border-strong)`
- Alternating sections: cream bg → warm bg → cream bg

### Section Headers
Every section starts with:
```html
<div class="section-tag">SECTION LABEL</div>   <!-- Space Mono, blue -->
<h2>Section Title</h2>                          <!-- Bebas Neue, large -->
```

### Content Max Widths
- Narrow content (text, forms): 640–680px
- Standard content (cards, tables): 860–960px
- Full-width (hero, nav): 100%

### Mobile Breakpoints
```
900px: cards stack single column, sidebar collapses, grids → 1 col
768px: nav links hide (keep CTA), padding shrinks, forms full-width
480px: smallest layout adjustments
```

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
| Alternate sections | Warm white | `--hw-bg-warm` |
| Cards, inputs, modals | White | `--hw-bg-surface` |
| Dark cards, footer, table headers | Near black | `--hw-bg-invert` |

---

*This file is the definitive design reference. Every UI element in every HWY61 product must follow these patterns. When in doubt: zero radius, thick black borders, flat shadows, Bebas for headlines, Space Mono for labels, DM Sans for body, crimson for actions, cream for background.*
