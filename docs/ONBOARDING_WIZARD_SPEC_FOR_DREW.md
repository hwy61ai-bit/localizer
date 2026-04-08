# Onboarding Wizard + Freemium Spec — Tim's Decisions
**Date:** April 7, 2026
**Status:** All product decisions made. Ready to build.

---

## Scope

The onboarding wizard is designed to scale across all products. It has a shared core and product-specific setup surfaces when the user first opens each product. No product selection step in the wizard — users discover products organically.

---

## Wizard Behavior

- **Trigger:** Optional. Not required after signup. Users can skip and explore freely.
- **Availability:** Accessible anytime from settings or a persistent "Setup Guide" link.
- **Progress:** Wizard remembers where the user left off if they skip and come back later.

---

## Wizard Steps (Shared Core)

Three fields. That's it. Minimal friction.

1. **Org name** — "What's your company or project name?"
2. **User name** — "What's your name?"
3. **Role** — "What's your role?"
   - Agent
   - Manager
   - Tour Manager
   - Business Manager
   - Band Leader
   - Self-managed Artist
   - Venue / Promoter

After these three fields, the user lands on the dashboard. Product-specific setup (artist profile, tour creation, etc.) surfaces inline when they first open each product.

---

## Demo Tour

- **Band:** Beta Test Band (existing demo data Tim and Drew have assembled)
- **Size:** 8-10 dates — enough to see features without overwhelming
- **Venues/Cities:** Real venue names and real cities
- **Content richness:** Full showcase:
  - Mix of deal types (flat guarantees + versus deals)
  - Some shows settled, some pending
  - Hotel confirmations on some dates
  - Advance statuses at various stages (not started, sent, confirmed)
  - Sample guest list entries
  - Sample expenses
- **Deletable:** Auto-deletes after 30 days to keep accounts clean
- **Offer path:** After wizard, user sees two options: "Explore Demo Tour" or "Create Your Own Tour"

---

## Freemium Model

### Hard Wall
When a user hits the free tier limit, they are blocked from the action (can't add show #6, can't add artist #2). Upgrade prompt appears at the point of friction with clear pricing and a direct path to Stripe checkout.

### Per-Product Free Tier Limits

#### Localizer
| Free | Paid |
|---|---|
| 1 artist | Unlimited (per tier) |
| Full product access — create events, customize assets, see rendered output | Same |
| **Preview-only exports — can see everything rendered, cannot download** | **Full downloads, all formats, no watermark** |

The upgrade prompt lives on the export/download button: "This looks great. Subscribe to download."

This approach is abuse-proof: creating multiple free accounts doesn't help because you still can't download on any of them.

#### TourRouter (Band)
| Free | Paid |
|---|---|
| 1 tour | Unlimited tours |
| 5 shows max | Unlimited shows |
| Full features within limit | Full features |

Hard wall at show #6: "Upgrade to add more shows to this tour."

#### HWY61 DIY
| Free | Paid ($19/mo) |
|---|---|
| 1 tour | Unlimited tours |
| 5 shows max | Unlimited shows |
| Full features within limit (minus feature-flagged items: no advancing, settlement, finance, personnel pay, guest list, multi-tour) | Full DIY features |

Same limit as Band free tier. Hard wall at show #6.

---

## Implementation Notes for Drew

### Wizard State
```
-- Add to orgs table or a new onboarding_state table:
onboarding_completed  boolean default false
onboarding_step       integer default 0  -- 0=not started, 1=org name, 2=user name, 3=role, 4=done
demo_tour_created_at  timestamptz        -- null if not created; auto-delete when 30 days old
```

### Demo Tour Seeding
- API route: `POST /api/onboarding/demo-tour` — creates Beta Test Band artist + demo tour + all sample data
- Seed data lives in a JSON fixture file: `lib/onboarding/demo-tour-seed.json`
- Tim to provide final Beta Test Band data (dates, venues, deals, hotels, advance statuses, expenses, guest list entries)
- Demo tour has a `is_demo` flag so the system knows to auto-delete at 30 days

### Freemium Enforcement
- Check limits at the API route level, not just UI. A user shouldn't be able to bypass limits via API calls.
- Localizer: block the export/download API route for free tier. Rendering and preview remain fully functional.
- TourRouter/DIY: block `POST /api/tourrouter/tours/[tourId]/shows/` when show count >= 5 on free tier.
- Return a specific error code (e.g., 402 Payment Required) with a message the UI can display as an upgrade prompt.

### Role Usage
- Store on `org_members.role` (or a new `user_role` field if `role` is already used for access control)
- Role informs which product features/tips are highlighted in the UI — not access control
- Role can be changed anytime in settings

---

## What Tim Still Needs to Provide

- [ ] Final Beta Test Band demo tour data (8-10 dates with venues, deals, hotels, advance statuses, guest list, expenses)
- [ ] Upgrade prompt copy for each product's hard wall
- [ ] Any specific language for the wizard screens (or Drew can draft and Tim reviews)

---

**No build blockers remain on product decisions. Blocked on demo tour seed data from Tim.**
