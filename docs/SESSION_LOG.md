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

### UI Polish
- [x] TourRouter tour tiles now match Localizer square tile design
- [x] Hover shows photo upload + delete buttons
- [x] Artist image background with dark overlay
- [x] Codebase health check: all clean (zero TS errors, no broken imports, no wrong table/column names)

### Coming Back To
- Test tour creation on production
- Test full flow: create tour → import CSV → route table → financials → export
- Fix any runtime bugs found during testing

## Session March 23, 2026 — Full TourRouter Build

### Phases Completed (0-12)
- [x] Phase 0: Security & setup — git commit, .gitignore, security scans, v35 reference file
- [x] Phase 1: 8 database tables + RLS policies + crew-safe view in Supabase
- [x] Phase 2: Ported v35 utility functions to lib/tourrouter/ (8 TypeScript modules)
- [x] Phase 3: 14 API route files (tours, shows, import, flights, currency, venues, advance, guest list, expenses, export, billing)
- [x] Phase 4: 5 page shells (tour list, route, import, financials, export)
- [x] Phase 5: Import layer (CSV/Excel/PDF + column mapper + review/save)
- [x] Phase 6: Route table + stat cards + drive legs + drive/fly toggle + show detail drawer
- [x] Phase 7: Financial panel + blanket expenses + per-show P&L + currency + transport
- [x] Phase 8: Export system (PDF/Excel/CSV routes + download page)
- [x] Phase 9: Advancing system (email sending, public venue form, status tracking)
- [x] Phase 10: Guest list in drawer + expense tracking on financials page
- [x] Phase 11: Localizer integration (push-to-localizer, read-only API, tour card badges)
- [x] Phase 12: Stripe billing (checkout, portal, status, billing gate)

### Bug Fixes
- [x] useSearchParams Suspense boundary error
- [x] Table name: routing_tours → tours_routing in all API routes
- [x] Org lookup: profiles → org_members in 14 API routes
- [x] Column names: created_by, blanket_show_amt, blanket_off_amt mismatches
- [x] Added image_url column to tours_routing table
- [x] Tour image upload not persisting (added to PUT whitelist)
- [x] Added TourRouter ↔ Localizer nav links
- [x] Fixed ← Localizer link pointing to wrong route

### Localizer Improvements
- [x] .xlsx file upload support on import page
- [x] AI parser restricted to core fields only (no junk in notes)
- [x] International tour support (European dates, foreign cities, countries)
- [x] Date display format: MM/DD/YYYY throughout UI
- [x] Parse button loading state
- [x] TourRouter import: drag and drop, country auto-detection

### Codebase Health Check — All Clean
- [x] TypeScript: zero errors
- [x] No broken imports
- [x] All API routes: correct table/column names
- [x] No v35 DOM references in lib/tourrouter/

### Not Done
- Phase 13: Crew mobile app (React Native/Expo — separate project)
- TourRouter landing page
- Print poster PDF export (300 DPI vector text)
- Full end-to-end runtime testing

### Next Session Should Start With
- Test tour creation on production with real data
- Import a real CSV/Excel and test the full flow: import → route table → financials → export
- Fix any runtime bugs found during testing
- Plan crew mobile app as separate project

## Session — March 25, 2026

### What Got Done

**300 DPI Print Poster — On-Demand PDF Generation (Major Feature)**
- Added `image_print_id` column to `tours` table (run in Supabase SQL editor)
- New upload slot on assets page: "Local Poster For Print (PDF)" — 11×17 / 300 DPI / 3300×5100px
- New PRINT tab in template editor with higher max slider values (360px text, 600px band name, 1800px logo) to account for the larger canvas
- New API route: `GET /api/renders/print-pdf?eventId={id}` — generates PDF on-demand using pdf-lib with vector text overlays
- New utility: `lib/fetchFont.ts` — fetches .ttf bytes from Supabase Storage (custom fonts) or Google Fonts API (with User-Agent trick to get .ttf instead of .woff2)
- New client component: `PrintDownloadButton.tsx` on venue link page — "Download Print Poster (11×17 PDF)" with loading spinner
- Installed `pdf-lib` and `@pdf-lib/fontkit`

**Removed Old Tour Poster Format**
- Removed `tour_poster` from: assets page, template editor (FORMATS array, FormatKey type, configs init, formatImageIds), venue link page, upload-image route, EventsTable.tsx render loops, clientRender.ts FORMAT_DIMS/SCALE_FACTORS
- The "Local Poster For Print" PDF replaces the old tour poster entirely

**Bugs Fixed Along the Way**
- pdf-lib + @pdf-lib/fontkit webpack bundling error — dynamic import for fontkit inside handler function
- Canvas-to-PDF coordinate mismatch — canvas uses textBaseline: "middle", pdf-lib draws from baseline. Fixed with actual font.heightAtSize() metrics
- Next.js 14 fetch caching — Supabase queries in the print-pdf route were returning stale cached data. Fixed with `cache: "no-store"` on the Supabase client fetch options
- RLS silent write failure — overlay_config PATCH route returned 200 with error: null while writing zero rows. Added .select().maybeSingle() check and service role fallback
- Double-save guard — added savingRef (useRef) to prevent duplicate PATCH calls
- Text shadow in template editor preview — removed so editor matches rendered output
- .next cache corruption — required rm -rf .next multiple times during session

### Key Lessons
- `cache: "no-store"` is REQUIRED on any Supabase query in a Next.js API route that reads data the user just wrote. Next.js 14 caches fetch() by default on the server.
- RLS rule #9 is real: missing policies return empty results with NO errors. Always check if the update actually affected a row.
- pdf-lib coordinate system is bottom-left origin (opposite of canvas). Every y-coordinate: yPt = pageHeight - (fraction * pageHeight)
- Google Fonts returns .woff2 by default. Send User-Agent: "Mozilla/5.0" to get .ttf for pdf-lib embedding.
- fontkit must be registered via pdfDoc.registerFontkit(fontkit) before embedding custom fonts.

### Files Created
- `app/api/renders/print-pdf/route.ts` — PDF generation endpoint
- `lib/fetchFont.ts` — Font byte fetcher for pdf-lib
- `app/v/e/[token]/PrintDownloadButton.tsx` — Venue page PDF download button

### Files Modified
- `app/dashboard/tours/[tourId]/assets/page.tsx` — added print upload card, removed tour_poster
- `app/dashboard/tours/[tourId]/template/TemplateEditor.tsx` — added PRINT tab, removed tour_poster, higher slider maxes, shadow removal, double-save guard
- `app/dashboard/tours/[tourId]/template/page.tsx` — added image_print_id to query
- `app/api/renders/tour-data/route.ts` — added image_print_id to response
- `app/api/tours/[tourId]/upload-image/route.ts` — added print to FORMAT_COLUMN, removed tour_poster
- `app/api/tours/[tourId]/overlay-config/route.ts` — RLS fallback fix, row-affected check
- `app/v/e/[token]/page.tsx` — removed old tour poster display, added PrintDownloadButton
- `app/dashboard/tours/[tourId]/components/EventsTable.tsx` — removed poster from render loops
- `lib/clientRender.ts` — removed poster from FORMAT_DIMS/SCALE_FACTORS

### Database
- `ALTER TABLE tours ADD COLUMN IF NOT EXISTS image_print_id text;`

### What Didn't Get Done
- Tim's v2 master context (HWY61 expansion to 6 products) — analyzed but not started. Waiting on reference spec docs from Tim.

### Next Session Should Start With
- Review Tim's numbered spec docs (01-14) when available
- Begin Phase 1 of HWY61 expansion: new Supabase tables for TourRouter
- Consider removing debug console.logs if any remain in production code