# TourRouter Session Log

## Session March 23, 2026 — Phase 0

### Completed
- [x] Committed 32 Localizer files from March 19-22 session
- [x] Verified .gitignore covers all .env files
- [x] Security scan: no leaked keys in source code
- [x] Added v35 reference file to reference/tour-manager_35.html
- [x] Added reference/ to .gitignore
- [x] All changes pushed to GitHub

### Next Session Should Start With
- Phase 1: Create TourRouter database tables in Supabase SQL Editor
- Use HWY61_MASTER_CONTEXT_FOR_DREW.md as primary context doc for Claude Code

## Session March 23, 2026 — Phase 1

### Completed
- [x] Created 8 TourRouter tables in Supabase: tours_routing, tour_shows, shared_venues, shared_contacts, flight_price_cache, guest_list, tour_expenses, advance_emails
- [x] Enabled RLS on all 8 tables
- [x] Created RLS policies: org-scoped for tour data, authenticated-user for shared data
- [x] Created tour_shows_crew view (financial fields stripped for crew access)

### Next Session Should Start With
- Phase 2: Port v35 utility functions to lib/tourrouter/ using Claude Code
- Paste HWY61_MASTER_CONTEXT_FOR_DREW.md + Phase 2 section from build plan into Claude Code
- Claude Code will read reference/tour-manager_35.html for the v35 source

## Session March 23, 2026 — Phases 1-12

### Completed
- [x] Phase 1: Created 8 database tables + RLS policies + crew-safe view in Supabase
- [x] Phase 2: Ported v35 utility functions to lib/tourrouter/ (8 TypeScript modules)
- [x] Phase 3: Created 10 API routes (tours CRUD, shows, import, flights, currency, venues)
- [x] Phase 4: Built 5 page shells (tour list, route, import, financials, export)
- [x] Phase 5: Built full import layer (CSV/Excel/PDF + column mapper + review/save)
- [x] Phase 6: Built route table with stat cards, drive legs, drive/fly toggle, show detail drawer
- [x] Phase 7: Built financial panel with summary cards, blanket expenses, per-show P&L, currency, transport
- [x] Phase 8: Built export system with PDF, Excel, CSV generation + download page
- [x] Phase 9: Built advancing system with email sending, public venue form, status tracking
- [x] Phase 10: Added guest list to show drawer + expense tracking to financials page
- [x] Phase 11: Built Localizer integration — push-to-localizer, read-only API, tour card badges
- [x] Phase 12: Added Stripe billing routes, billing gate, checkout/portal/status

### Not Done
- Phase 13: Crew mobile app (React Native/Expo — separate project, needs own planning session)

### Next Session Should Start With
- Deploy to Vercel and test TourRouter pages in browser
- Fix any runtime errors / broken imports
- Start testing the import → route → financials → export flow with real data
- Plan Phase 13 (crew mobile app) as a separate project

## Session March 23, 2026 — Bug Fixes + Polish

### Completed After Phases
- [x] Fixed useSearchParams Suspense boundary error
- [x] Fixed table name: routing_tours → tours_routing in all API routes
- [x] Fixed org lookup: profiles → org_members in 14 API routes
- [x] Fixed column names: created_by, blanket_show_amt, blanket_off_amt mismatches
- [x] Added TourRouter ↔ Localizer navigation links
- [x] Added error logging to tours route for debugging

### Known Bugs Still Open
- Tour creation may still have issues — needs testing after latest deploy
- All TourRouter features need end-to-end testing with real data
- localhost vs production URL confusion — test on production

### Next Session Should Start With
- Test tour creation on production URL
- If 500 persists, check Vercel logs for exact error
- Import a real CSV/PDF and test the full flow
- Fix any runtime errors found during testing