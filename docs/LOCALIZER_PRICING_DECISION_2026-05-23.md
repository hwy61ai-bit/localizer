# Localizer Pricing Decision — May 23, 2026

**From:** Tim
**To:** Drew
**Purpose:** Unblock Stripe Days 1–2 + flag new Free-tier scope for the 30-day launch plan

---

## TL;DR

Final pricing locked: **Free / Solo $29 / Pro $59 / Agency $129**.

Free tier is net-new scope that wasn't in the original 30-day plan — engineering work flagged below. Stripe Days 1–2 are unblocked. Landing page `$XX` placeholders can go to real numbers.

---

## Pricing structure

| Tier | Artists | Shows/mo | Formats | Custom fonts | Video | PDF parsing | Watermark | Monthly | Annual |
|---|---|---|---|---|---|---|---|---|---|
| **Free** | 1 | 5 | 3 (IG square, IG story, FB) | ❌ | ❌ | ❌ | `localizer.hwy61labs.com` | $0 | — |
| **Solo** | 1 | Unlimited | All | ✅ | ✅ | ✅ | None | $29 | $290 (save $58) |
| **Pro** | up to 5 | Unlimited | All | ✅ | ✅ | ✅ | None | $59 | $590 (save $118) |
| **Agency** | up to 12 | Unlimited | All + team seats | ✅ | ✅ | ✅ | None | $129 | $1,290 (save $258) |

### Trial & upgrade behavior

- **7-day free trial** on all paid tiers (works alongside the Free tier — different audiences)
- **Annual = pay 10 months, get 12** across all paid tiers
- **Free users hitting an upgrade wall** see monthly and annual side-by-side, with annual highlighted as the default option (frame: "$29/mo or $290/yr — save $58")
- **Free-tier watermark:** `localizer.hwy61labs.com` rendered as a footer/corner mark on every generated asset

---

## Why this pricing — the reasoning

### Competitor anchors (May 2026)

| Tool | What it does | Price | Why it matters |
|---|---|---|---|
| Canva Free | General design | $0 | Anchor in buyer's head |
| Canva Pro | + brand kit, magic resize | $12.99–15/mo | Closest "I could just use this" alternative |
| Canva Teams | + collaboration (3 user min) | $30/mo+ | What management teams might use |
| Photoshop single app | Pro pixel design | $22.99/mo | Designers use it, not managers |
| Bannerbear | API templated bulk image gen | $49–299/mo | Closest *functional* twin to Localizer's engine |
| Placeit / poster generators | Single posters | $0–$10/mo | Different job entirely |

None of these do per-stop, per-show, multi-format batch generation with editable overrides and venue share links. That's Localizer's category.

### Why $29 isn't too high for Solo

ROI math from the buyer's seat: one artist, 20-show tour, 5 formats per show = 100 assets. Even with a Canva template, ~3 min per asset = ~5 hours per tour of pure tedium. Two tours a year = 10 hours. At $30/hr time value, that's $300/year of pain. Solo at $348/year is break-even at one tour, winning at two. The Pro tier covering 5 artists is conspicuously cheap ROI for a management company.

The risk of going lower (e.g., $19): we'd be telling the buyer "this is a poster tool." Canva wins that fight on price and installed base. We can't out-Canva Canva. We can out-tour-operations Canva, because Canva doesn't play that game. The lift is **positioning**, not price.

### Why a Free tier (the change from the original plan)

The Free tier isn't because $29 is too high. It's because:

1. **Distribution is the hard problem.** Indie touring is a fragmented, word-of-mouth market. Free users posting watermarked assets to socials is zero-CAC marketing — every `localizer.hwy61labs.com` footer is a small ad.
2. **Trust is the gating factor, not money.** Tour managers are burned by every tool they try. A free tier lets them get a real value moment with their real tour before paying — worth more than a 7-day card-required trial.
3. **COGS are containable.** Cloudinary scales with usage. Throttling Free to 5 shows/mo, 3 formats, no video keeps the variable cost bounded.

The gating is on **scale and professionalism**, not crippled features. Free users get a working product; they just can't run it at touring-pro scale or remove the watermark.

### Why the Free limit is 5 shows per month (not per tour or lifetime)

Most generous of the three options considered. A DIY artist with a few one-off shows can live on Free forever, which is fine — they're posting watermarked assets to socials, doing distribution work for us. Real touring artists will blow through 5/mo immediately and convert.

### Why Pro is $59 (not $79)

Clean 2x of Solo makes the upgrade prompt easy to read. Pro is the tier most management-company buyers will land on; gentler on-ramp from Solo helps conversion at launch. Easier to raise later with data than to discount aggressively at launch.

Real argument exists for $79 (5 artists × $59 = $11.80/artist is conspicuously cheap), but we'd rather see real tier-distribution data first. **Pro price review at 60 days post-launch.**

### Why monthly+annual side-by-side with annual highlighted

Annual revenue is significantly more valuable (less churn risk, cash upfront, two months of free working capital). Annual highlighted at the wall captures committed buyers without forcing them. Monthly stays visible so we don't lose the hesitant buyer.

---

## New scope: Free-tier engineering work

This wasn't in the May 19 30-day plan (which was Solo/Pro/Agency only). Adding the Free tier creates engineering work beyond the price ID changes:

- **Watermark renderer** on the Cloudinary pipeline — Free users only. Plain text overlay, bottom-right or footer position, `localizer.hwy61labs.com`. Needs to apply uniformly across image and video outputs.
- **Shows-per-month counter** on the org — tracks shows touched this billing month, resets monthly. Enforcement at asset-generation time (block + show upgrade prompt at the 6th show).
- **Feature gates** on Free accounts:
  - Format count limit (3 of N available)
  - Custom font upload disabled
  - Video asset generation disabled
  - PDF routing parser disabled
  - Show counter as above
- **Upgrade wall UI** — shown at every gated action. Shows both monthly and annual prices side-by-side, annual highlighted. Targets the specific paid tier appropriate to the user's need (probably Solo for individual artists hitting limits, with Pro/Agency visible).
- **Plan-status check on auth/onboarding** — extension of the existing eligibility-gate pattern from the master artist page. Free is now a real plan status, not just "no plan."

**Rough estimate:** probably 2–3 days of work on top of the existing Day 1–2 Stripe lift. Worth scoping properly before locking the timeline — this might push the 30-day plan by a few days.

---

## Stripe price IDs to create

Six new prices on the existing Localizer product (or three new products with monthly + annual prices on each — your call on product/price modeling).

| Price ID (suggested name) | Tier | Interval | Amount |
|---|---|---|---|
| `LOCALIZER_SOLO_MONTHLY` | Solo | month | $29 |
| `LOCALIZER_SOLO_ANNUAL` | Solo | year | $290 |
| `LOCALIZER_PRO_MONTHLY` | Pro | month | $59 |
| `LOCALIZER_PRO_ANNUAL` | Pro | year | $590 |
| `LOCALIZER_AGENCY_MONTHLY` | Agency | month | $129 |
| `LOCALIZER_AGENCY_ANNUAL` | Agency | year | $1,290 |

All paid tiers: 7-day free trial enabled at the price level.

Capture into `LOCALIZER_PRICE_MAP` constant per the Day 1 plan. Free tier doesn't need a Stripe price ID — it's the default state for any account without an active subscription.

---

## Open items parked for later

- **Pro price review at 60 days** based on tier distribution and conversion data
- **Pro price increase to $79** is the most likely change if conversion data supports it
- **Annual conversion prompts to Free users at 60–90 days** — separate motion from the upgrade wall, more of a "you've been with us a while, here's what you'd unlock" email
- **Promoter Edition pricing** — still parked until post-launch
- **TourRouter / DIY / Bundle pricing** — out of scope for this decision, still parked on broader Stripe restructure

---

## What this unblocks

- Day 1: Archive legacy Stripe SKUs, create the six prices above, capture into `LOCALIZER_PRICE_MAP`
- Day 2: Webhook update + Vercel env var rotation + sandbox test through each tier
- Landing page: `$XX` placeholders → real numbers, monthly/annual toggle activated
- Day 10 standalone `/pricing` page: tier comparison table can be built against real data

---

*Locked May 23, 2026 after a deep-dive pricing session. Decision logic preserved here so we don't relitigate it mid-launch.*
