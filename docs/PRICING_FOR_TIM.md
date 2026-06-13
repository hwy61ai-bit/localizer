# Localizer Pricing — Reference for Tim

**Last updated:** June 12, 2026
**Source of truth:** `lib/stripe/localizerPrices.ts` (the `LOCALIZER_PRICE_MAP` constant) for price IDs; `docs/LAUNCH_PROGRESS.md` Day 1 for the dollar amounts. If this doc and the code/repo ever disagree, the repo wins.

> **Scope note:** This covers **Localizer only** — the product launching ~June 19, 2026. TourRouter, DIY, bundles, and the "Band/Full Suite" pricing from older planning docs and PDFs are **not** part of this launch and are not reflected here. Those older docs are stale — ignore their pricing.

---

## The Three Paid Tiers

| Tier | Monthly | Annual | Annual savings | Artists | Tours |
|------|---------|--------|----------------|---------|-------|
| **Solo** | $29/mo | $290/yr | 2 months free | 1 | 3 |
| **Pro** | $59/mo | $590/yr | 2 months free | up to 5 | unlimited |
| **Agency** | $129/mo | $1,290/yr | 2 months free | up to 12 | unlimited |

Annual = 10× the monthly rate (pay for 10 months, get 12). "Most Popular" badge sits on **Pro**.

### Tier feature lists (as shown on the live pricing page)

**Solo** — Perfect for a single artist or band.
- 1 band
- 3 tours
- AI import parser
- Venue share links
- All asset formats

**Pro** — For managers handling multiple artists.
- Up to 5 bands
- Unlimited tours
- AI import parser
- Venue share links
- All asset formats
- Priority support

**Agency** — For agencies and large rosters.
- Up to 12 bands
- Unlimited tours
- AI import parser
- Venue share links
- All asset formats
- Priority support
- Dedicated onboarding

---

## The Free Trial (not a free tier)

There is **no permanent free tier.** The "Free" card on the pricing page is a **7-day free trial**:

- **$0 for 7 days, full access, no credit card required.**
- After 7 days, the user must pick a paid tier to keep using Localizer (account is blocked until they do; data is preserved).
- For logged-in users, the trial card is hidden (they're already past it), and tier buttons read "Select plan" instead of "Start free trial."

A trial account is treated as **Solo-tier** for limit purposes (1 artist, 3 tours) until they subscribe. The gate keys on the org's `trial_ends_at` date.

> Historical note: an earlier plan had a permanent free tier (watermarked assets, 5 shows/month, 3 formats). That was **cut May 28, 2026** — watermarks, show-count limits, and format gates were never built and don't exist. Don't reference them.

---

## What's Actually Enforced (in the live code)

Real, server-enforced, tested in production — not aspirational copy:

| Limit | Solo | Pro | Agency | Trial |
|-------|------|-----|--------|-------|
| **Artists** ("bands") | 1 | 5 | 12 | 1 (Solo rules) |
| **Tours** | 3 | unlimited | unlimited | 3 (Solo rules) |

- **Artist limits** — enforced since June 4 (`lib/localizer/artistLimits.ts`).
- **Tour limits** — enforced June 11 (`lib/localizer/tourLimits.ts`). A Solo/trial account is blocked from creating a 4th tour with: *"Your plan includes 3 tours — upgrade for unlimited."*
- Admin accounts bypass all limits.

---

## Billing Mechanics

- **Processor:** Stripe. Checkout validates against the `LOCALIZER_PRICE_MAP` price IDs in `lib/stripe/localizerPrices.ts`.
- **Free trial:** 7 days, configured in code as `subscription_data.trial_period_days = 7` on every tier (not via the Stripe dashboard).
- **Annual discount:** all three tiers price annual at 10× the monthly rate — two months free.
- **Cancellation:** via the Account page or the Stripe Customer Portal; access runs to the end of the billing period.

---

## Legal Entity (for any contract/policy copy)

- Registered entity: **HWY61 LLC**
- Brand / trade name: **HWY61 Labs** (domain hwy61labs.com)
- "HWY61 Labs LLC" and "HWY61 AI" are both **incorrect** for legal use — use **HWY61 LLC** in legal documents.

---

## Known Future Pricing Considerations (not yet decided)

These are parked decisions, NOT current pricing — flagged so nobody treats today's numbers as permanent:

- **Pro tier price review at ~60 days post-launch** — possible $59 → $79 if conversion data supports it. Not decided; Tim's call when the data is in.
- **Annual-upgrade nudge for trial/monthly users at 60–90 days** — a "you've been with us a while" email inviting annual upgrade. Marketing motion, not a price change.

---

## Quick-Reference Summary (for an AI assistant reading this)

Localizer has three paid tiers — Solo $29/mo ($290/yr), Pro $59/mo ($590/yr), Agency $129/mo ($1,290/yr); annual is 10× monthly (two months free). Tiers differ by artist count (1 / 5 / 12) and tour count (3 / unlimited / unlimited), both server-enforced in production. There is no free tier — only a 7-day, no-card free trial that behaves as Solo-tier until conversion, gated on `trial_ends_at`. The 7-day trial is set in code, not the Stripe dashboard. Registered legal entity is HWY61 LLC; brand is HWY61 Labs. Authoritative price source: `lib/stripe/localizerPrices.ts` + `docs/LAUNCH_PROGRESS.md` Day 1.
