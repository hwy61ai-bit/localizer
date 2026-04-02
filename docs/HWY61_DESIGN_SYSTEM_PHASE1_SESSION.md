# HWY61 — Design System Phase 1: Foundation
## Claude Code Session Plan — April 2, 2026

**How to use this file:**
1. Paste the SESSION KICKOFF block into Claude Code at the start
2. Then paste each PROMPT one at a time, in order
3. After each prompt completes, verify on localhost:3000 before moving to the next
4. Don't push until end of session

---

## SESSION KICKOFF (Paste this first)

```
I'm building the HWY61 design system foundation. Read the design system spec at docs/HWY61_DESIGN_SYSTEM.md — this is the single source of truth for all visual styling.

Key rules:
- Stack: Next.js 14, TypeScript, React
- border-radius is ALWAYS 0 on everything
- Shadows are flat offset (no blur, no spread): Xpx Ypx 0 color
- Fonts: Bebas Neue (headlines), Space Mono (labels/metadata), DM Sans (body)
- Primary color: crimson #c5535b
- Background: warm cream #F5F0E8
- Cards: 3px black borders, flat shadow on hover
- All CSS uses custom properties prefixed --hw-
- Components go in app/components/hw/ directory
- Each component is a .tsx file with TypeScript props interface
- Use CSS modules (ComponentName.module.css) for component styles
- Dev server is running on localhost:3000
- One file per prompt — don't modify multiple files in one go
```

---

## PROMPT 1 — globals.css Foundation

```
Update app/globals.css to add the HWY61 design system foundation. Keep all existing styles but ADD the following at the TOP of the file:

1. Google Fonts import (must be first line):
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=Space+Mono:wght@400;700&family=Bebas+Neue&display=swap');

2. The full :root CSS custom properties block from docs/HWY61_DESIGN_SYSTEM.md (all the --hw- variables: palette, semantic, backgrounds, text, borders, typography, spacing, border widths, shadows, transitions)

3. Body styles:
body {
  background: var(--hw-bg);
  color: var(--hw-text);
  font-family: var(--hw-font-body);
  -webkit-font-smoothing: antialiased;
}

4. Halftone overlay:
body::after {
  content: '';
  position: fixed;
  inset: 0;
  background-image: radial-gradient(circle, rgba(0,0,0,0.04) 1px, transparent 1px);
  background-size: 4px 4px;
  pointer-events: none;
  z-index: 9999;
}

5. Global border-radius reset (add AFTER the existing styles so it overrides):
*, *::before, *::after {
  border-radius: 0 !important;
}

Do NOT remove any existing styles. Add these at the top (fonts import first, then :root, then body, then halftone, then put the border-radius reset at the bottom).
```

---

## PROMPT 2 — Create components directory

```
Create the directory app/components/hw/ if it doesn't exist:
mkdir -p app/components/hw
```

---

## PROMPT 3 — HwButton.tsx

```
Create app/components/hw/HwButton.tsx — a reusable button component following the HWY61 design system (read docs/HWY61_DESIGN_SYSTEM.md for exact specs).

TypeScript props:
- variant: 'primary' | 'secondary' | 'ghost' | 'destructive' (default: 'primary')
- size: 'default' | 'small' (default: 'default')
- disabled?: boolean
- children: React.ReactNode
- onClick?: () => void
- type?: 'button' | 'submit'
- className?: string
- fullWidth?: boolean

Styling rules (inline styles or CSS module — your choice, but be consistent):
- font-family: var(--hw-font-display) (Bebas Neue)
- text-transform: uppercase
- letter-spacing: 3px (default), 2px (small)
- border: 3px solid
- border-radius: 0
- padding: 14px 28px (default), 8px 16px (small)
- font-size: 16px (default), 12px (small)
- cursor: pointer
- transition: var(--hw-ease)

Variant styles:
- Primary: bg --hw-crimson, color white, border --hw-crimson. Hover: bg --hw-crimson-dark, translateY(-2px), box-shadow var(--hw-shadow-md)
- Secondary: bg white, color --hw-text, border --hw-border-strong. Hover: bg --hw-bg-invert, color white, translateY(-2px), box-shadow var(--hw-shadow-md)
- Ghost: bg transparent, color --hw-text, border transparent. Hover: border --hw-border-strong, translateY(-2px)
- Destructive: bg white, color --hw-crimson, border --hw-crimson. Hover: bg --hw-crimson, color white

Disabled: opacity 0.4, pointer-events none
Full width: width 100%

Use a CSS module file: app/components/hw/HwButton.module.css
Export as default.
```

---

## PROMPT 4 — HwInput.tsx

```
Create app/components/hw/HwInput.tsx — a text input component following the HWY61 design system (read docs/HWY61_DESIGN_SYSTEM.md).

TypeScript props:
- label?: string
- error?: string
- placeholder?: string
- value?: string
- onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
- type?: 'text' | 'email' | 'number' | 'password' | 'tel' | 'url' | 'date'
- disabled?: boolean
- required?: boolean
- name?: string
- className?: string
- id?: string

Structure: label above input, error message below.

Label: font-family var(--hw-font-mono), 11px, uppercase, letter-spacing 1.5px, color var(--hw-text-secondary), margin-bottom 6px, display block

Input: font-family var(--hw-font-body), 15px, font-weight 400, color var(--hw-text), border 3px solid var(--hw-border-strong), border-radius 0, bg var(--hw-bg-surface), padding 12px 16px, width 100%. Focus: border-color var(--hw-crimson), outline none. Error state: border-color var(--hw-crimson).

Error text: font-family var(--hw-font-mono), 11px, color var(--hw-crimson), margin-top 4px

Disabled: opacity 0.5, pointer-events none

CSS module: app/components/hw/HwInput.module.css
Export as default.
```

---

## PROMPT 5 — HwSelect.tsx

```
Create app/components/hw/HwSelect.tsx — a styled select dropdown following the HWY61 design system.

TypeScript props:
- label?: string
- error?: string
- value?: string
- onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
- options: Array<{ value: string; label: string }>
- placeholder?: string
- disabled?: boolean
- required?: boolean
- name?: string
- className?: string

Same label and error styling as HwInput. Select element: appearance none, same border/font/padding as HwInput, custom chevron via background-image (inline SVG data URI — a simple downward-pointing triangle in --hw-text color), background-position right 16px center, background-repeat no-repeat, padding-right 40px.

CSS module: app/components/hw/HwSelect.module.css
Export as default.
```

---

## PROMPT 6 — HwTextarea.tsx

```
Create app/components/hw/HwTextarea.tsx — a styled textarea following the HWY61 design system.

TypeScript props:
- label?: string
- error?: string
- placeholder?: string
- value?: string
- onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
- rows?: number (default: 4)
- disabled?: boolean
- required?: boolean
- name?: string
- className?: string

Same label/error styling as HwInput. Textarea: same font, border, padding, focus, and error styling as HwInput. resize: vertical.

CSS module: app/components/hw/HwTextarea.module.css
Export as default.
```

---

## PROMPT 7 — HwCheckbox.tsx

```
Create app/components/hw/HwCheckbox.tsx — a square checkbox following the HWY61 design system.

TypeScript props:
- label?: string
- checked?: boolean
- onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
- disabled?: boolean
- name?: string
- className?: string

Hidden native checkbox, custom visual: 20x20px square, 3px solid --hw-border-strong border, bg white. Checked: bg --hw-crimson, border --hw-crimson, white checkmark (CSS or inline SVG). Label: font-family var(--hw-font-body), 14px, font-weight 400, margin-left 10px, cursor pointer.

CSS module: app/components/hw/HwCheckbox.module.css
Export as default.
```

---

## PROMPT 8 — HwRadio.tsx

```
Create app/components/hw/HwRadio.tsx — a radio button following the HWY61 design system.

TypeScript props:
- label?: string
- checked?: boolean
- onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
- disabled?: boolean
- name?: string
- value?: string
- className?: string

Same as HwCheckbox but border-radius: 50% (this is the ONE exception to zero radius). Checked: bg --hw-crimson, white dot in center. Same label styling.

CSS module: app/components/hw/HwRadio.module.css
Export as default.
```

---

## PROMPT 9 — HwCard.tsx

```
Create app/components/hw/HwCard.tsx — a card component following the HWY61 design system.

TypeScript props:
- variant: 'standard' | 'dark' | 'accent' (default: 'standard')
- children: React.ReactNode
- className?: string
- onClick?: () => void
- hoverable?: boolean (default: true)

Standard: bg var(--hw-bg-surface), border 3px solid var(--hw-border-strong), padding 32px. Hover (when hoverable): translateY(-4px), box-shadow var(--hw-shadow-lg).

Dark: bg var(--hw-bg-invert). Text inside should be var(--hw-text-invert) or cream. Titles should be --hw-crimson.

Accent: border-color var(--hw-crimson), box-shadow var(--hw-shadow-accent).

Transition: var(--hw-ease). Cursor pointer when onClick provided.

Also export sub-components or provide guidance for card content:
- Card title: Bebas Neue 22px, uppercase, 2px letter-spacing
- Card description: DM Sans 14px, weight 300, --hw-text-secondary
- Card meta: Space Mono 10px, uppercase, 1.5px spacing, --hw-text-muted

CSS module: app/components/hw/HwCard.module.css
Export as default and named sub-components (HwCardTitle, HwCardDesc, HwCardMeta).
```

---

## PROMPT 10 — HwStatCard.tsx

```
Create app/components/hw/HwStatCard.tsx — a stat/metric card for dashboards following the HWY61 design system.

TypeScript props:
- label: string
- value: string | number
- sub?: string
- delta?: number (positive = green with ▲, negative = crimson with ▼)
- className?: string

Container: bg var(--hw-bg-surface), border 3px solid var(--hw-border-strong), padding 24px.

Label: font-family var(--hw-font-mono), 10px, uppercase, letter-spacing 2px, color var(--hw-text-muted)
Value: font-family var(--hw-font-display), 36px, color var(--hw-text), letter-spacing 1px
Sub: font-family var(--hw-font-mono), 11px, color var(--hw-text-muted)
Delta positive: color var(--hw-green), prepend ▲
Delta negative: color var(--hw-crimson), prepend ▼

CSS module: app/components/hw/HwStatCard.module.css
Export as default.
```

---

## PROMPT 11 — HwBadge.tsx

```
Create app/components/hw/HwBadge.tsx — a status badge following the HWY61 design system.

TypeScript props:
- variant: 'confirmed' | 'pending' | 'error' | 'info' | 'neutral' | 'accent'
- children: React.ReactNode
- className?: string

All variants: font-family var(--hw-font-mono), font-size 9px, uppercase, letter-spacing 2px, font-weight 700, border 2px solid, padding 4px 10px, display inline-flex, align-items center.

Variant colors:
- confirmed: bg var(--hw-green-ghost), color var(--hw-green), border-color var(--hw-green-border)
- pending: bg var(--hw-amber-ghost), color var(--hw-amber), border-color var(--hw-amber)
- error: bg var(--hw-red-ghost), color var(--hw-crimson), border-color var(--hw-crimson)
- info: bg var(--hw-blue-ghost), color var(--hw-blue), border-color var(--hw-blue)
- neutral: bg rgba(0,0,0,0.04), color var(--hw-text-muted), border-color var(--hw-border)
- accent: bg var(--hw-crimson), color white, border-color var(--hw-crimson)

CSS module: app/components/hw/HwBadge.module.css
Export as default.
```

---

## PROMPT 12 — HwTable.tsx

```
Create app/components/hw/HwTable.tsx — a data table component following the HWY61 design system.

Export three components: HwTable (wrapper), HwTableHead, HwTableBody, HwTableRow, HwTableHeader (th), HwTableCell (td).

TypeScript — each is a simple wrapper with children and className props.

HwTable wrapper: border 3px solid var(--hw-border-strong), overflow-x auto, width 100%.

HwTableHead: renders thead.
HwTableBody: renders tbody.

HwTableRow: renders tr. Hover: bg var(--hw-crimson-ghost). Accept a 'header' boolean prop — if true, bg var(--hw-bg-invert).

HwTableHeader (th): font-family var(--hw-font-mono), 10px, uppercase, letter-spacing 2px, font-weight 700, color white (inherits dark bg from header row), padding 12px 16px, text-align left.

HwTableCell (td): font-family var(--hw-font-body), 14px, font-weight 300, color var(--hw-text-secondary), padding 12px 16px, border-top 2px solid var(--hw-border). Accept 'strong' prop (color --hw-text, weight 500), 'numeric' prop (font-family var(--hw-font-mono), 13px, text-align right), 'positive' prop (color --hw-green), 'negative' prop (color --hw-crimson).

CSS module: app/components/hw/HwTable.module.css
Export all as named exports.
```

---

## PROMPT 13 — HwTabs.tsx

```
Create app/components/hw/HwTabs.tsx — a tab component following the HWY61 design system.

TypeScript props for HwTabs container:
- children: React.ReactNode
- className?: string

TypeScript props for HwTab item:
- label: string
- active?: boolean
- onClick?: () => void
- className?: string

Container: display flex, border-bottom 3px solid var(--hw-border-strong).

Tab: font-family var(--hw-font-mono), 11px, uppercase, letter-spacing 2px, padding 14px 24px, color var(--hw-text-muted), border-bottom 3px solid transparent, margin-bottom -3px, cursor pointer, transition var(--hw-ease), background none, border-top/left/right none.

Hover: color var(--hw-text)
Active: color var(--hw-crimson), border-bottom-color var(--hw-crimson), font-weight 700

CSS module: app/components/hw/HwTabs.module.css
Export HwTabs and HwTab as named exports.
```

---

## PROMPT 14 — HwToggle.tsx

```
Create app/components/hw/HwToggle.tsx — a toggle switch following the HWY61 design system.

TypeScript props:
- checked?: boolean
- onChange?: (checked: boolean) => void
- label?: string
- disabled?: boolean
- className?: string

Track: 48px wide, 26px tall, bg var(--hw-border), border 3px solid var(--hw-border-strong), no border-radius. Transition var(--hw-ease).

Knob: 16x16px, bg var(--hw-border-strong), positioned 2px from left edge.

On state: track bg var(--hw-crimson), knob bg white, knob slides to right side.

Label: font-family var(--hw-font-mono), 11px, uppercase, letter-spacing 1.5px, margin-left 12px.

CSS module: app/components/hw/HwToggle.module.css
Export as default.
```

---

## PROMPT 15 — HwAlert.tsx

```
Create app/components/hw/HwAlert.tsx — an alert/banner component following the HWY61 design system.

TypeScript props:
- variant: 'success' | 'error' | 'warning' | 'info'
- title?: string
- children: React.ReactNode
- className?: string
- onDismiss?: () => void

Container: padding 16px 20px, border 3px solid [semantic color], bg [semantic ghost color], display flex, align-items flex-start, gap 12px.

Variant mapping:
- success: border/icon var(--hw-green), bg var(--hw-green-ghost)
- error: border/icon var(--hw-crimson), bg var(--hw-red-ghost)
- warning: border/icon var(--hw-amber), bg var(--hw-amber-ghost)
- info: border/icon var(--hw-blue), bg var(--hw-blue-ghost)

Title: font-family var(--hw-font-mono), 11px, uppercase, letter-spacing 1.5px, font-weight 700, color [semantic color]
Body: font-family var(--hw-font-body), 14px, font-weight 300, color var(--hw-text)
Dismiss button: top-right, × character, color --hw-text-muted, hover color --hw-text

CSS module: app/components/hw/HwAlert.module.css
Export as default.
```

---

## PROMPT 16 — HwModal.tsx

```
Create app/components/hw/HwModal.tsx — a modal dialog following the HWY61 design system.

TypeScript props:
- open: boolean
- onClose: () => void
- title: string
- children: React.ReactNode
- footer?: React.ReactNode
- wide?: boolean (default false — 480px, true — 640px)
- className?: string

Backdrop: position fixed, inset 0, bg rgba(0,0,0,0.5), z-index 1000, display flex, align-items center, justify-content center.

Container: bg var(--hw-bg-surface), border 3px solid var(--hw-border-strong), box-shadow var(--hw-shadow-xl), max-width 480px (or 640px if wide), width 90%.

Header: padding 20px 24px, border-bottom 3px solid var(--hw-border-strong), display flex, justify-content space-between, align-items center. Title: font-family var(--hw-font-display), 22px, uppercase, letter-spacing 2px. Close button: × character, color var(--hw-text-muted), hover var(--hw-text), cursor pointer, bg none, border none.

Body: padding 24px. Font: DM Sans 15px, weight 300.

Footer: padding 16px 24px, border-top 3px solid var(--hw-border-strong), bg var(--hw-bg), display flex, justify-content flex-end, gap 12px.

Close on backdrop click. Close on Escape key.

CSS module: app/components/hw/HwModal.module.css
Export as default.
```

---

## PROMPT 17 — HwDropZone.tsx

```
Create app/components/hw/HwDropZone.tsx — a file drop zone following the HWY61 design system.

TypeScript props:
- onDrop?: (files: FileList) => void
- accept?: string (e.g., '.pdf,.xlsx,.csv,.jpg,.png')
- hint?: string (e.g., 'PDF, Excel, CSV, or images')
- label?: string (e.g., 'Drop a document here')
- disabled?: boolean
- className?: string

Default state: border 3px dashed var(--hw-border-light), bg var(--hw-bg-surface), text-align center, padding 48px 24px, cursor pointer.

Icon: upload arrow icon (use a simple inline SVG), 32px, opacity 0.4.
Label: font-family var(--hw-font-body), 15px, color var(--hw-text-secondary), margin-top 12px.
Hint: font-family var(--hw-font-mono), 10px, uppercase, color var(--hw-text-muted), margin-top 8px.

Drag over / hover state: border solid var(--hw-crimson), bg var(--hw-crimson-ghost). Label color var(--hw-crimson). Icon opacity 0.7.

Handle dragover, dragleave, drop events. Also support click to open file picker via hidden input.

CSS module: app/components/hw/HwDropZone.module.css
Export as default.
```

---

## PROMPT 18 — HwBreadcrumb.tsx

```
Create app/components/hw/HwBreadcrumb.tsx following the HWY61 design system.

TypeScript props:
- items: Array<{ label: string; href?: string }>
  Last item (no href) is the current page.
- className?: string

Container: display flex, align-items center, gap 8px.

Link items: font-family var(--hw-font-mono), 11px, uppercase, letter-spacing 1px, color var(--hw-text-muted), text-decoration none, hover color var(--hw-crimson).

Separator: › character, color var(--hw-border-light).

Current item (last): color var(--hw-text), font-weight 700.

Use Next.js Link component for the href items.

CSS module: app/components/hw/HwBreadcrumb.module.css
Export as default.
```

---

## PROMPT 19 — HwPagination.tsx

```
Create app/components/hw/HwPagination.tsx following the HWY61 design system.

TypeScript props:
- currentPage: number
- totalPages: number
- onPageChange: (page: number) => void
- className?: string

Buttons: font-family var(--hw-font-mono), 12px, padding 8px 14px, border 3px solid var(--hw-border-strong), bg var(--hw-bg-surface), cursor pointer, margin-left -3px (overlapping borders). Hover: bg var(--hw-crimson-ghost). Active/current: bg var(--hw-bg-invert), color white, font-weight 700.

Include prev/next arrow buttons. Disabled state for first/last page.

CSS module: app/components/hw/HwPagination.module.css
Export as default.
```

---

## PROMPT 20 — HwAvatar.tsx

```
Create app/components/hw/HwAvatar.tsx following the HWY61 design system.

TypeScript props:
- initials: string (1-2 characters)
- size: 'sm' | 'md' | 'lg' (default: 'md')
- className?: string

Square (NOT round). Border 2px solid var(--hw-border-strong). Color var(--hw-crimson) on bg var(--hw-crimson-ghost). Font-family var(--hw-font-display), uppercase.

Sizes: sm 28px (10px font), md 36px (12px font), lg 48px (16px font). Display flex, align/justify center.

CSS module: app/components/hw/HwAvatar.module.css
Export as default.
```

---

## PROMPT 21 — HwProgress.tsx

```
Create app/components/hw/HwProgress.tsx following the HWY61 design system.

TypeScript props:
- value: number (0-100)
- variant: 'crimson' | 'green' (default: 'crimson')
- className?: string

Track: height 8px, bg var(--hw-border), border 1px solid var(--hw-border-light), no border-radius.
Bar: height 100%, bg var(--hw-crimson) or var(--hw-green), no border-radius, width based on value%, transition var(--hw-ease-slow).

CSS module: app/components/hw/HwProgress.module.css
Export as default.
```

---

## PROMPT 22 — HwToast.tsx

```
Create app/components/hw/HwToast.tsx and a HwToastProvider context following the HWY61 design system.

HwToastProvider: wraps app, provides a `toast(message, variant?)` function via React context.
useToast hook: returns { toast } function.

Toast: positioned fixed, top 24px, right 24px, z-index 10000. Max-width 380px. Border 3px solid var(--hw-border-strong), box-shadow var(--hw-shadow-lg), bg var(--hw-bg-surface), padding 16px 20px.

Same variant styling as HwAlert (success/error/warning/info) but smaller.
Close button: top-right ×.
Auto-dismiss: 5 seconds.
Stack vertically (multiple toasts offset by 8px each).

Title: font-family var(--hw-font-mono), 11px, uppercase, letter-spacing 1.5px, font-weight 700.
Body: font-family var(--hw-font-body), 14px, weight 300.

CSS module: app/components/hw/HwToast.module.css
Export HwToastProvider as default, useToast as named export.
```

---

## PROMPT 23 — HwSkeleton.tsx

```
Create app/components/hw/HwSkeleton.tsx following the HWY61 design system.

TypeScript props:
- variant: 'line' | 'block' | 'circle' (default: 'line')
- width?: string (default: '100%')
- height?: string (default: '14px' for line, '120px' for block, '40px' for circle)
- className?: string

All variants: bg linear-gradient shimmer animation (light gray sweeping left to right, 1.5s infinite). No border-radius (except circle: border-radius 50%).

Line: 14px height, full width.
Block: 120px height, full width.
Circle: 40x40px, border-radius 50%.

Shimmer keyframe: background-position -200% to 200%.

CSS module: app/components/hw/HwSkeleton.module.css
Export as default.
```

---

## PROMPT 24 — HwEmptyState.tsx

```
Create app/components/hw/HwEmptyState.tsx following the HWY61 design system.

TypeScript props:
- icon?: React.ReactNode
- title: string
- description?: string
- actionLabel?: string
- onAction?: () => void
- className?: string

Container: text-align center, padding 48px 24px, border 3px dashed var(--hw-border-light).

Icon: 36px, opacity 0.4, margin-bottom 16px.
Title: font-family var(--hw-font-display), 24px, uppercase, letter-spacing 2px, color var(--hw-text), margin-bottom 8px.
Description: font-family var(--hw-font-body), 14px, weight 300, color var(--hw-text-muted), margin-bottom 20px.
Action: render an HwButton primary (import from ./HwButton).

CSS module: app/components/hw/HwEmptyState.module.css
Export as default.
```

---

## PROMPT 25 — HwSectionTag.tsx

```
Create app/components/hw/HwSectionTag.tsx following the HWY61 design system.

TypeScript props:
- children: React.ReactNode (the label text)
- className?: string

Styling: font-family var(--hw-font-mono), font-size 11px, letter-spacing 4px, text-transform uppercase, color var(--hw-blue), font-weight 400, display inline-block.

This is the blue section label that goes above every major section header.

CSS module: app/components/hw/HwSectionTag.module.css
Export as default.
```

---

## PROMPT 26 — HwTooltip.tsx

```
Create app/components/hw/HwTooltip.tsx following the HWY61 design system.

TypeScript props:
- content: string
- children: React.ReactNode (the trigger element)
- position?: 'top' | 'bottom' | 'left' | 'right' (default: 'top')
- className?: string

Container: position relative, display inline-block.
Tooltip: position absolute, font-family var(--hw-font-mono), 11px, letter-spacing 0.5px, bg var(--hw-bg-invert), color var(--hw-text-invert), padding 6px 12px, white-space nowrap, z-index 100. Arrow: CSS border triangle pointing toward the trigger.

Show on hover with a small delay (150ms). No border-radius.

CSS module: app/components/hw/HwTooltip.module.css
Export as default.
```

---

## PROMPT 27 — HwTag.tsx

```
Create app/components/hw/HwTag.tsx following the HWY61 design system.

TypeScript props:
- children: React.ReactNode
- className?: string
- onRemove?: () => void

A generic tag (no semantic color). Font-family var(--hw-font-mono), 10px, uppercase, letter-spacing 1.5px, font-weight 400, color var(--hw-text-secondary), bg rgba(0,0,0,0.04), border 1px solid var(--hw-border), padding 4px 10px, display inline-flex, align-items center, gap 6px.

If onRemove provided, show × button on right side.

CSS module: app/components/hw/HwTag.module.css
Export as default.
```

---

## PROMPT 28 — HwTopNav.tsx (Layout)

```
Create app/components/hw/HwTopNav.tsx — the fixed top navigation bar following the HWY61 design system.

TypeScript props:
- brandText?: string (default: 'HWY61')
- links?: Array<{ label: string; href: string; active?: boolean }>
- ctaLabel?: string
- ctaHref?: string
- bellCount?: number
- onBellClick?: () => void
- children?: React.ReactNode (for right-side custom content)

Container: position fixed, top 0, left 0, right 0, z-index 100, padding 16px 32px, bg rgba(245,240,232,0.92), backdrop-filter blur(20px), display flex, align-items center, justify-content space-between, border-bottom 3px solid transparent.

On scroll: border-bottom becomes 3px solid var(--hw-border-strong). Use a useEffect with scroll listener that adds a class.

Brand: font-family var(--hw-font-display), 28px, color var(--hw-crimson), letter-spacing 4px, text-decoration none.

Links: font-family var(--hw-font-mono), 11px, uppercase, letter-spacing 1.5px, color var(--hw-text-secondary), text-decoration none. Hover: color var(--hw-text).

Bell icon: 20px, position relative. Badge: position absolute, top -6px, right -8px, bg var(--hw-crimson), color white, font-family var(--hw-font-mono), 9px, font-weight 700, min-width 18px, height 18px, display flex, align/justify center, padding 0 4px. Show only if bellCount > 0.

CTA: render as HwButton primary small.

Mobile (768px): hide links, keep bell + CTA.

CSS module: app/components/hw/HwTopNav.module.css
Export as default.
```

---

## PROMPT 29 — HwSidebar.tsx (Layout)

```
Create app/components/hw/HwSidebar.tsx — a sidebar navigation following the HWY61 design system.

TypeScript props:
- brand?: string (default: 'HWY61')
- sections: Array<{
    label: string;
    items: Array<{ label: string; href: string; icon?: React.ReactNode; active?: boolean }>
  }>
- className?: string

Container: width 240px, bg var(--hw-bg-surface), border-right 3px solid var(--hw-border-strong), height 100vh, position fixed, overflow-y auto.

Brand: font-family var(--hw-font-display), 20px, color var(--hw-crimson), letter-spacing 3px, padding 20px, border-bottom 3px solid var(--hw-border-strong).

Section label: font-family var(--hw-font-mono), 9px, uppercase, letter-spacing 2px, color var(--hw-text-muted), padding 16px 20px 8px.

Item: font-family var(--hw-font-body), 14px, color var(--hw-text-secondary), padding 10px 20px, border-left 3px solid transparent, text-decoration none, display flex, align-items center, gap 10px.
Hover: bg var(--hw-crimson-ghost), color var(--hw-text).
Active: bg var(--hw-crimson-ghost), color var(--hw-crimson), border-left-color var(--hw-crimson).

Icon: 16px, width 20px (for alignment).

Use Next.js Link for items.

CSS module: app/components/hw/HwSidebar.module.css
Export as default.
```

---

## PROMPT 30 — HwPageHeader.tsx (Layout)

```
Create app/components/hw/HwPageHeader.tsx following the HWY61 design system.

TypeScript props:
- title: string
- breadcrumbs?: Array<{ label: string; href?: string }>
- actions?: React.ReactNode (for right-side buttons)
- className?: string

Renders HwBreadcrumb above (if breadcrumbs provided), then the title with optional actions.

Title: font-family var(--hw-font-display), 48px, uppercase, letter-spacing 2px, color var(--hw-text). Margin-top 8px after breadcrumb.

Layout: display flex, justify-content space-between, align-items flex-start.

CSS module: app/components/hw/HwPageHeader.module.css
Export as default.
```

---

## PROMPT 31 — HwSectionHeader.tsx (Layout)

```
Create app/components/hw/HwSectionHeader.tsx following the HWY61 design system.

TypeScript props:
- tag: string (the section tag text, e.g., "FINANCIALS")
- title: string
- description?: string
- actions?: React.ReactNode
- className?: string

Renders HwSectionTag above, then title, then optional description.

Title: font-family var(--hw-font-display), 36px, uppercase, letter-spacing 2px, margin-top 8px.
Description: font-family var(--hw-font-body), 15px, weight 300, color var(--hw-text-secondary), margin-top 4px.

Layout: flex between title area and actions.

CSS module: app/components/hw/HwSectionHeader.module.css
Export as default.
```

---

## PROMPT 32 — Index barrel file

```
Create app/components/hw/index.ts — a barrel file that re-exports all components:

export { default as HwButton } from './HwButton'
export { default as HwInput } from './HwInput'
export { default as HwSelect } from './HwSelect'
export { default as HwTextarea } from './HwTextarea'
export { default as HwCheckbox } from './HwCheckbox'
export { default as HwRadio } from './HwRadio'
export { default as HwCard, HwCardTitle, HwCardDesc, HwCardMeta } from './HwCard'
export { default as HwStatCard } from './HwStatCard'
export { default as HwBadge } from './HwBadge'
export { default as HwTag } from './HwTag'
export { HwTable, HwTableHead, HwTableBody, HwTableRow, HwTableHeader, HwTableCell } from './HwTable'
export { HwTabs, HwTab } from './HwTabs'
export { default as HwToggle } from './HwToggle'
export { default as HwAlert } from './HwAlert'
export { default as HwModal } from './HwModal'
export { default as HwDropZone } from './HwDropZone'
export { default as HwBreadcrumb } from './HwBreadcrumb'
export { default as HwPagination } from './HwPagination'
export { default as HwAvatar } from './HwAvatar'
export { default as HwProgress } from './HwProgress'
export { default as HwToast, useToast } from './HwToast'
export { default as HwSkeleton } from './HwSkeleton'
export { default as HwEmptyState } from './HwEmptyState'
export { default as HwSectionTag } from './HwSectionTag'
export { default as HwTooltip } from './HwTooltip'
export { default as HwTopNav } from './HwTopNav'
export { default as HwSidebar } from './HwSidebar'
export { default as HwPageHeader } from './HwPageHeader'
export { default as HwSectionHeader } from './HwSectionHeader'
```

---

## END OF SESSION

After all prompts are done and verified on localhost:

1. `open -a TextEdit docs/SESSION_LOG.md` → update with:
   - What got done: Design System Phase 1 foundation — globals.css updated, 29 Hw* components created in app/components/hw/
   - What didn't: [note any components that had issues]
   - Next session: Phase 2 — Apply design system to dashboard shell (nav, artist tiles, onboarding)

2. Commit and push:
```
cd ~/localizer && git add -A && git commit -m "Design system Phase 1: CSS foundation + 29 Hw components" && git push
```
