# HWY61 LABS — Brand Guidelines
**Version 1.0 — April 2026**
**Status:** Active — applies to all HWY61 products and marketing

---

## Brand Overview

HWY61 LABS is the first complete operating system for touring. The brand identity is rooted in **Warhol Pop Art** — screen-print energy, bold typography, flat graphic elements, and zero visual softness. Every surface should feel like a poster, not a software app.

**Products under the HWY61 LABS brand:**
- **TourRouter** — the complete OS for touring (routing, budgeting, settlement, advancing, finance)
- **Localizer** — tour marketing automation (asset generation + promoter distribution)
- **DIY** — pro routing and budgeting tools at an indie price
- **Road App** — free mobile schedule for band and crew

**Domain:** hwy61labs.com (subdomains: localizer, tourrouter, diy)

---

## The 10 Visual Rules

These are non-negotiable. Every page, every component, every state must follow them.

1. **Border radius is always zero.** Not 2px. Not 4px. Zero. On everything — buttons, inputs, cards, modals, badges, avatars, progress bars. The only exception is radio buttons (circle by nature).
2. **Shadows are flat offset.** No blur. No spread. Just `Xpx Ypx 0 color`. Screen-print style.
3. **Headlines are Bebas Neue.** Always uppercase. Always letter-spaced (minimum 1px). Page titles, section headers, card titles, button labels, prices.
4. **Labels are Space Mono.** Always uppercase. Always letter-spaced. Section tags, form labels, table headers, badges, timestamps, metadata.
5. **Body text is DM Sans.** Weight 300 (light) for body copy. Weight 500 for emphasis. Normal case — never uppercase.
6. **Primary action color is muted crimson `#c5535b`.** CTAs, nav highlights, active states, primary badges. Not blue. Not purple.
7. **Page background is warm cream `#F5F0E8`.** Not white. Not gray. Cards and inputs are white `#FFFFFF` on cream.
8. **Cards get 3px black borders** and lift 4px with flat shadow on hover.
9. **Section tags are steel blue `#456ca9`**, Space Mono 11px, 4px letter-spacing, uppercase. Every major content section gets one.
10. **Halftone dot overlay on the page background.** Radial-gradient circles, 4px grid, 0.04 opacity. Subtle but essential — it's what makes the whole thing feel like a print. Dots appear on cream areas only, never on white surfaces or photos.

---

## Color Palette

### Primary Brand Colors

| Color | Hex | CSS Variable | Usage |
|-------|-----|-------------|-------|
| Muted Crimson | `#c5535b` | `--hw-crimson` | CTAs, primary buttons, active states, nav highlights, badges |
| Crimson Dark | `#a8444b` | `--hw-crimson-dark` | Hover/pressed state for crimson elements |
| Crimson Ghost | `rgba(197,83,91,0.08)` | `--hw-crimson-ghost` | Tint backgrounds, row hover, subtle fills |
| Steel Blue | `#456ca9` | `--hw-blue` | Section tags, info badges, secondary labels |
| Blue Ghost | `rgba(69,108,169,0.08)` | `--hw-blue-ghost` | Info alert backgrounds |
| Warm Gray | `#c7c1bf` | `--hw-gray` | Subtle accents, active document cards |
| Dusty Purple | `#966c9a` | `--hw-purple` | Tertiary — audience tints, category badges |
| Dusty Rose | `#c19795` | `--hw-rose` | Soft accent — secondary badges, highlights |

### Semantic Colors

| Color | Hex | CSS Variable | Usage |
|-------|-----|-------------|-------|
| Green | `#5a9e6a` | `--hw-green` | Success, confirmed, settled, positive values |
| Green Ghost | `rgba(90,158,106,0.1)` | `--hw-green-ghost` | Success alert backgrounds |
| Amber | `#c49a3c` | `--hw-amber` | Warning, pending, needs review |
| Amber Ghost | `rgba(196,154,60,0.1)` | `--hw-amber-ghost` | Warning alert backgrounds |
| Red | `#c5535b` | `--hw-red` | Error, destructive, over budget (same as crimson) |

### Background Colors

| Color | Hex | CSS Variable | Usage |
|-------|-----|-------------|-------|
| Warm Cream | `#F5F0E8` | `--hw-bg` | Page background — the default surface |
| Warm White | `#FFFDF8` | `--hw-bg-warm` | Alternate section background |
| White | `#FFFFFF` | `--hw-bg-surface` | Cards, inputs, modals, table cells |
| Near Black | `#1A1A1A` | `--hw-bg-invert` | Dark cards, footer, table headers |

### Text Colors

| Color | Hex | CSS Variable | Usage |
|-------|-----|-------------|-------|
| Primary | `#1A1A1A` | `--hw-text` | Headlines, strong labels, primary content |
| Secondary | `#4A4540` | `--hw-text-secondary` | Body text, descriptions, form values |
| Muted | `#8A8580` | `--hw-text-muted` | Placeholders, timestamps, helper text |
| Inverted | `#F5F0E8` | `--hw-text-invert` | Text on dark backgrounds |

### Border Colors

| Color | Hex | CSS Variable | Usage |
|-------|-----|-------------|-------|
| Default | `#E0D8CC` | `--hw-border` | Light borders, inner dividers |
| Strong | `#1A1A1A` | `--hw-border-strong` | Cards, inputs, section dividers — 3px |
| Light | `#CCC4B8` | `--hw-border-light` | Subtle dividers, dashed drop zones |

### Landing Page Accent Colors

The marketing landing page uses additional accent colors for visual punch. These are scoped to the landing page only and do not appear in the dashboard product UI.

| Color | Hex | Usage |
|-------|-----|-------|
| Yellow | `#E8C820` | Hero badge, active drop zone card, bottom CTA accents |
| Rose | `#C85068` | Localizer product name accent |

---

## Typography

### Font Stack

| Font | CSS Variable | Role |
|------|-------------|------|
| Bebas Neue (400) | `--hw-font-display` | Headlines, titles, buttons, prices — always uppercase |
| Space Mono (400, 700) | `--hw-font-mono` | Labels, metadata, table headers, badges, timestamps — almost always uppercase |
| DM Sans (300, 400, 500, 700) | `--hw-font-body` | Body text, descriptions, form inputs, paragraphs — normal case |

### Google Fonts Import

```
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=Space+Mono:wght@400;700&family=Bebas+Neue&display=swap');
```

### Typography Scale — Bebas Neue (Display)

Always uppercase. Always letter-spaced. Font-weight 400 (only weight available).

| Use | Size | Letter-spacing |
|-----|------|---------------|
| Page title | 72px | 3px |
| Section header | 48px | 2px |
| Sub-header | 36–40px | 2px |
| Card title | 22px | 2px |
| Modal title | 22px | 2px |
| Price (large) | 52px | 1px |
| Button (default) | 16px | 3px |
| Button (small) | 12px | 2px |

### Typography Scale — Space Mono (Labels & Metadata)

Almost always uppercase and letter-spaced. Small sizes only.

| Use | Size | Letter-spacing | Weight | Color |
|-----|------|---------------|--------|-------|
| Section tag | 11px | 4px | 400 | Steel blue `--hw-blue` |
| Form label | 11px | 1.5px | 400 | `--hw-text-secondary` |
| Table header | 10px | 2px | 700 | White (on dark bg) |
| Badge | 9px | 2px | 700 | Semantic color |
| Nav link | 11px | 1.5px | 400 | `--hw-text-secondary` |
| Metadata / timestamp | 10px | 1px | 400 | `--hw-text-muted` |

### Typography Scale — DM Sans (Body)

Normal case. Never uppercase.

| Use | Size | Weight | Color |
|-----|------|--------|-------|
| Body paragraph | 15–16px | 300 | `--hw-text-secondary` |
| Card description | 14px | 300 | `--hw-text-secondary` |
| Form input text | 15px | 400 | `--hw-text` |
| Small / helper | 13px | 300 | `--hw-text-muted` |
| Sidebar labels (when readability matters) | 12px | 500 | `--hw-text` |
| Error message | 11px | 400 (mono) | `--hw-crimson` |

### Typography Rules

- **Bebas Neue** is for display only — never use below 12px. At small sizes it becomes illegible.
- **Space Mono** works for short labels and metadata but gets hard to read on longer text. For sidebar section headers and multi-word labels, use DM Sans 12px weight 500 uppercase instead.
- **DM Sans weight 300** is the default body weight. Use 500 for emphasis within body text. Use 400 for form inputs.
- **Never mix fonts within a single text element.** Each element gets one font family.

---

## Spacing

Based on an 8px grid system.

| Token | Value | CSS Variable |
|-------|-------|-------------|
| Space 1 | 4px | `--hw-space-1` |
| Space 2 | 8px | `--hw-space-2` |
| Space 3 | 12px | `--hw-space-3` |
| Space 4 | 16px | `--hw-space-4` |
| Space 5 | 20px | `--hw-space-5` |
| Space 6 | 24px | `--hw-space-6` |
| Space 7 | 32px | `--hw-space-7` |
| Space 8 | 40px | `--hw-space-8` |
| Space 9 | 48px | `--hw-space-9` |
| Space 10 | 64px | `--hw-space-10` |
| Space 11 | 80px | `--hw-space-11` |
| Space 12 | 120px | `--hw-space-12` |

---

## Borders & Shadows

### Border Widths

| Weight | Value | CSS Variable | Usage |
|--------|-------|-------------|-------|
| Standard | 3px | `--hw-border-w` | Cards, inputs, section dividers |
| Secondary | 2px | `--hw-border-w-thin` | Inner dividers, table rows, badges |
| Hairline | 1px | `--hw-border-w-rule` | List separators inside cards |

### Border Radius

**Always zero.** `--hw-radius: 0px`

The only exception is radio buttons (border-radius: 50% by nature).

### Shadows (Flat Offset — No Blur)

| Size | Value | CSS Variable |
|------|-------|-------------|
| Small | `3px 3px 0 #1A1A1A` | `--hw-shadow-sm` |
| Medium | `4px 4px 0 #1A1A1A` | `--hw-shadow-md` |
| Large | `6px 6px 0 #1A1A1A` | `--hw-shadow-lg` |
| XL | `8px 8px 0 #1A1A1A` | `--hw-shadow-xl` |
| Accent | `6px 6px 0 #c5535b` | `--hw-shadow-accent` |

**Never use blur or spread on shadows.** The flat offset is what gives the brand its screen-print character.

---

## Component Patterns

### Buttons

All buttons use Bebas Neue, uppercase, 3px letter-spacing, 3px border, zero radius. Hover lifts 2px with flat shadow.

| Variant | Default | Hover |
|---------|---------|-------|
| Primary | Crimson bg, white text, crimson border | Crimson-dark bg, translateY(-2px), shadow-md |
| Secondary | White bg, black text, black border | Black bg, white text, translateY(-2px), shadow-md |
| Ghost | Transparent bg, transparent border | Black border, translateY(-2px) |
| Destructive | White bg, crimson text, crimson border | Crimson bg, white text |

Disabled state: opacity 0.4, pointer-events none.

### Cards

| Variant | Style |
|---------|-------|
| Standard | White bg, 3px black border, 32px padding. Hover: translateY(-4px), shadow-lg |
| Dark | Near-black bg, crimson titles, cream text |
| Accent | Crimson border, shadow-accent (crimson flat shadow) |

### Data Tables

- Wrapper: 3px black border, overflow-x auto
- Header row: near-black bg, Space Mono 10px white uppercase, 700 weight
- Body cells: DM Sans 14px, weight 300, secondary text color
- Row hover: crimson-ghost background
- Row borders: 2px solid default border
- Financial numbers: Space Mono 13px, right-aligned
- Positive values: green
- Negative values: crimson

### Badges

Space Mono 9px, uppercase, 2px letter-spacing, 700 weight, 2px border, 4px 10px padding.

| Variant | Background | Text/Border |
|---------|-----------|-------------|
| Confirmed | Green ghost | Green |
| Pending | Amber ghost | Amber |
| Error | Red ghost | Crimson |
| Info | Blue ghost | Blue |
| Neutral | rgba(0,0,0,0.04) | Muted |
| Accent | Crimson solid | White |

### Form Inputs

- Border: 3px solid black
- Font: DM Sans 15px, weight 400
- Focus: border-color crimson
- Error: crimson border + crimson error text (Space Mono 11px)
- Labels: Space Mono 11px, uppercase, 1.5px letter-spacing, above the input
- Disabled: opacity 0.5

### Stat Cards (Financial Dashboards)

- Container: white bg, 3px black border, 24px padding
- Label: Space Mono 10px, uppercase, muted
- Value: Bebas Neue 36px
- Delta positive: green with ▲
- Delta negative: crimson with ▼

---

## Page Structure

### Section Pattern

Every major content section follows this structure:

```
[Section Tag]     ← Space Mono 11px, steel blue, 4px letter-spacing, uppercase
[Section Title]   ← Bebas Neue, large, uppercase
[Description]     ← DM Sans, weight 300, secondary color (optional)
[Content]
```

### Section Dividers

3px solid black border-top between major sections.

### Content Max Widths

- Narrow content (text, forms): 640–680px
- Standard content (cards, tables): 860–960px
- Full-width (hero, nav): 100%

### Mobile Breakpoints

| Breakpoint | Changes |
|-----------|---------|
| 900px | Cards stack single column, sidebar collapses, grids → 1 col |
| 768px | Nav links hide (keep CTA + bell), padding shrinks, forms full-width |
| 480px | Smallest layout adjustments |

---

## Navigation

### Top Nav Bar

- Fixed position, frosted glass effect (cream at 0.92 opacity + backdrop blur 20px)
- Border-bottom: 3px solid transparent → solid black on scroll
- Brand: Bebas Neue 28px, crimson, 4px letter-spacing
- Links: Space Mono 11px, uppercase, 1.5px letter-spacing
- Notification bell: 20px icon, crimson count badge (Space Mono 9px, 18x18)
- CTA button: crimson primary, small size

### Sidebar (If Used)

- 240px width, white bg, 3px black right border
- Brand: Bebas Neue 20px, crimson
- Section labels: Space Mono 9px, muted
- Items: DM Sans 14px, 3px left border (transparent → crimson on active)
- Active: crimson-ghost bg, crimson text, crimson left border

---

## Halftone Overlay

The halftone dot pattern is applied to the `body` background as a layered CSS background:

```css
body {
  background: 
    radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px),
    #F5F0E8;
  background-size: 4px 4px, 100%;
}
```

- Dots are visible on cream-colored areas only
- White surfaces (cards, tables, inputs, modals) naturally sit above the dots
- Photos and images are never overlaid with dots
- The dot grid is 4px spacing at 0.04 opacity — subtle but essential

---

## Animation & Motion

### Transitions

- Default: `all 0.15s ease` (`--hw-ease`)
- Slow: `all 0.3s ease` (`--hw-ease-slow`)

### Hover Patterns

- Buttons: translateY(-2px) + flat shadow
- Cards: translateY(-4px) + shadow-lg
- Links: color change only
- Table rows: crimson-ghost background

### Page Load

- Fade-in-up animation: opacity 0 → 1, translateY(12px) → 0, 0.8s ease-out
- Staggered delays for sequential elements

### Loading States

- Skeleton shimmer: linear gradient sweep, 1.5s infinite, no border-radius
- Progress bars: 8px height, crimson or green fill, no border-radius

---

## Voice & Language

### Product Copy Rules

- **Never say "AI."** User-facing copy always says "HWY61 reads it" / "HWY61 figures it out" / "the system matches it." Internal code can reference Anthropic API and AI parsing, but the user never sees the word "AI."
- **Tone:** Confident and casual. Like showing a friend how you do something — not a software demo.
- **No jargon:** "Your tour" not "your touring operation." "Drop it in" not "upload your document."
- **Active voice:** "HWY61 calculates the drive time" not "Drive times are calculated by the system."

### Button Labels

Always uppercase (Bebas Neue enforces this). Short and direct:
- "GET STARTED" not "Click here to begin"
- "ADD SHOW" not "Add a new show"
- "GENERATE ALL" not "Generate all assets"
- "SAVE" not "Save changes"

---

## Logo & Wordmark

### Wordmark

- Text: **HWY61 LABS**
- Font: Bebas Neue
- Color: Crimson `#c5535b` (on light backgrounds) or Cream `#F5F0E8` (on dark backgrounds)
- Letter-spacing: 3–4px
- Always uppercase (Bebas Neue only has one case)

### Usage Rules

- The wordmark is text-based — no logo image file required
- Always render in Bebas Neue, never substitute fonts
- Minimum size: 14px
- Never rotate, distort, or apply effects
- On dark backgrounds, use cream/inverted text color
- On the landing page nav: "HWY61 LABS" in near-black
- In the dashboard: "HWY61" in crimson

---

## Do's and Don'ts

### Do

- Use flat offset shadows on all elevated elements
- Use 3px borders on cards, inputs, and containers
- Use Bebas Neue for anything that should feel bold and assertive
- Use Space Mono for metadata, labels, and anything that should feel systematic
- Use DM Sans weight 300 for body text that should feel approachable
- Use the halftone dot pattern on cream backgrounds
- Keep financial numbers in Space Mono, right-aligned, with green/crimson coloring
- Use semantic badge colors consistently (green=confirmed, amber=pending, crimson=error)

### Don't

- Use border-radius on anything (except radio buttons)
- Use blur or spread on shadows
- Use Bebas Neue below 12px — it becomes illegible
- Use blue as a primary action color — blue is for section tags and info states only
- Use gradients anywhere
- Say "AI" in any user-facing copy
- Use white as a page background — always cream
- Mix fonts within a single text element
- Use rounded corners on avatars — they're square
- Use soft/blurred drop shadows — always flat offset

---

*This document is the definitive brand reference for HWY61 LABS. Every UI element, marketing asset, and public-facing page must follow these guidelines. When in doubt: zero radius, thick black borders, flat shadows, Bebas for headlines, Space Mono for labels, DM Sans for body, crimson for actions, cream for background.*
