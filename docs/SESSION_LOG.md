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

ToS/Privacy Policy with April 1 dates committed, Stripe pricing corrected (Basic $39, Pro $69, Agency $139 monthly + annual tiers), Supabase redirect URLs updated, Vercel custom domain localizer.hwy61.ai configured and live, final deploy pushed. Still pending: DMCA registration (copyright.gov login issues),

 ToS/Privacy Policy committed (April 1 date), all 6 Stripe price IDs corrected to price_ format, added STRIPE_PRICE_ID_PRO and STRIPE_PRICE_ID_AGENCY webhook vars, updated NEXT_PUBLIC_APP_URL to https://localizer.hwy61.ai, Vercel custom domain configured, Supabase redirects updated, Resend already verified. DMCA still pending. Next session: Tim testing, DMCA registration, then Phase 2 TourRouter stabilization.

## Session — March 25, 2026

### What Got Done
- Created and committed Terms of Service + Privacy Policy (.docx, effective April 1, 2026)
- Archived incorrect $29/mo Stripe product
- Created correct Stripe products: Basic $39/mo, Pro $69/mo, Agency $139/mo
- Created annual tiers: Basic $420/yr, Pro $745/yr, Agency $1,500/yr
- Fixed critical bug: all 6 Stripe price IDs were wrong format (not price_), would have broken checkout
- Added STRIPE_PRICE_ID_PRO and STRIPE_PRICE_ID_AGENCY webhook env vars in Vercel
- Updated NEXT_PUBLIC_APP_URL to https://localizer.hwy61.ai
- Configured localizer.hwy61.ai custom domain on Vercel + CNAME in Squarespace DNS
- Updated Supabase Site URL and redirect URLs for new domain
- Confirmed Resend domain verification already active for hwy61.ai
- Confirmed email forwarding works for dmca@, support@, privacy@hwy61.ai
- Upgraded Resend to Pro ($20/mo) for custom domain emails
- Completed DMCA agent registration at copyright.gov ($6)
- Audited full Stripe integration: pricing page, checkout route, webhook, billing portal
- Deployed to production at localizer.hwy61.ai
- Analyzed 28-week HWY61 build plan

### What Didn't Get Done
- End-to-end testing with Tim (next step)

### Next Session Should Start With
- Get Tim testing at localizer.hwy61.ai with real tour schedules
- Begin Phase 2: TourRouter stabilization — runtime testing, column name fixes, DB migrations
- Flag Tim to start collecting deal memos and settlement docs for Phase 4 AI intake

 Phase 2 complete — runtime testing, Add Show/Delete Show/Vehicle Settings/Drawer editing built, fuel calc fixed (off days + 24 cities added), billing gate with real Stripe checks, 45 new tour_shows columns, 4 new columns on artists/orgs, 5 new tables with RLS, 3 storage buckets, TourRouter $29/mo Stripe product. Next: Phase 3 settlement system.

 Phase 3 progress — hotel management UI, guest list UI with modal, deposit tracking with status colors, day sheet PDF generation (single + batch), advance sheet PDF (6 sections, single + batch). Fuel calc fixed ($270→$2,401). Remaining: settlement system + personnel pay (blocked on spec docs from Tim). Next: get spec docs 03 and 11 from Tim, then build settlement + deal types.

## Session — March 26, 2026

### PHASE 1 — Ship Localizer ✅ COMPLETE
- Terms of Service + Privacy Policy (.docx, April 1, 2026 effective date) committed
- Archived incorrect $29/mo Stripe product
- Created 3 Stripe products: Basic $39, Pro $69, Agency $139 (monthly + annual)
- Fixed critical bug: all 6 Stripe price IDs were in wrong format
- Added STRIPE_PRICE_ID_PRO + STRIPE_PRICE_ID_AGENCY webhook env vars
- Updated NEXT_PUBLIC_APP_URL to https://localizer.hwy61.ai
- Configured custom domain on Vercel + CNAME in Squarespace DNS
- Updated Supabase Site URL + redirect URLs for new domain
- Confirmed Resend Pro domain verification for hwy61.ai
- Confirmed email forwarding for dmca@, support@, privacy@hwy61.ai
- Upgraded Resend to Pro ($20/mo)
- DMCA agent registration at copyright.gov ($6)
- Deployed to production at localizer.hwy61.ai

### PHASE 2 — TourRouter Stabilization ✅ COMPLETE
- Save/load state verified working
- Runtime testing across all TourRouter pages
- Built Add Show modal, Delete Show with confirmation
- Built Vehicle Settings panel (collapsible, MPG auto-fill by vehicle type)
- Built full Drawer panel editing (replaced inline editing)
- Fixed .next cache corruption bug
- Fixed fuel calculation: off days breaking leg chain, added 24 missing cities + typo alias
- Fuel estimate corrected: $270 → $2,401
- Built real billing gate with Stripe subscription checks + admin bypass
- Fixed barrel export bug (billingGate server code in client component)
- DB migration: 45 new columns on tour_shows (hotel, advance, venue, settlement, deposit, production)
- DB migration: 4 new columns on artists + orgs
- Created 5 new tables: field_aliases, shared_contacts, account_contacts, finance_report_links, intake_documents
- RLS policies on all 5 new tables
- Created 3 Supabase Storage buckets: tour-documents, tour-expenses, tour-exports
- Created TourRouter $29/mo Stripe product
- Default fuel price set to $3.50/gal

### PHASE 3 — Band Must-Haves (5 of 7 done)
- Hotel management UI (14 fields, room block conditional section)
- Guest list UI (modal, pass types, status colors, add/delete)
- Deposit tracking UI (status with color-coded dots)
- Day sheet PDF generation (single + batch, US Letter, 7 sections)
- Advance sheet PDF export (single + batch, 6 sections)
- BLOCKED: Settlement system — needs 03_PERSONNEL_PAY_SETTLEMENT_SPEC.docx from Tim
- BLOCKED: Personnel & pay — needs spec doc from Tim

### PHASE 4 — Differentiators (3 of 5 done)
- Universal AI Intake: global drop zone, 4-layer pipeline (detect → match → parse → review), confirm API, 7 document type prompts
- Advance Automation Engine: state machine, daily cron (Vercel), 4 email templates, Resend webhook handler, daily digest, advance status badges
- Alias Library: 3-layer lookup, batch Claude mapping, human confirmation + learning, global promotion logic
- Created advance_emails table + RLS
- Vercel cron configured (daily 10am UTC)
- BLOCKED: Deal types engine — needs 11_DEAL_TYPES_CALCULATION_ENGINE.docx from Tim
- TODO: Venue confirmation portal

### Updated Master Context
- v4.1 created with all Phase 1 completion updates, correct URLs, Stripe env vars documented

### What Didn't Get Done
- Settlement system + personnel pay (blocked on spec docs)
- Deal types calculation engine (blocked on spec doc)
- Venue confirmation portal
- Finance dashboard (Phase 5)

### Next Session Should Start With
- Get spec docs 03 and 11 from Tim
- Build settlement system + deal types engine
- Build venue confirmation portal
- Start Phase 5: finance dashboard, commissions, end-of-tour report
- Tim should begin end-to-end testing at localizer.hwy61.ai
- Tim should start collecting real deal memos + settlement sheets for AI intake testing

Session — March 27, 2026
What got done:

Received and analyzed both blocked spec docs from Tim: 03_PERSONNEL_PAY_SETTLEMENT_SPEC (8 pay structures, settlement fields, live P&L) and 11_DEAL_TYPES_CALCULATION_ENGINE (10 deal types with formulas, settlement verification mode)
Received and analyzed ~40 real-world example documents from Tim across 5 batches: deal memos (MUSIC·TEAM, Wasserman, WME), settlement sheets (Prism, Live Nation, handwritten, multi-currency, tour P&L), offer sheets (Prism, festival, email, Excel, handwritten, independent promoter), advance docs (venue request, production advance, agent routing sheet), contracts (WME, Wasserman, university), support offers, ticket reports, personnel list
Mapped deal type detection patterns from real documents (NBOR, GBOR, "from dollar 1", vs, plus, flat, sliding scale, bonus, straight pct)
Created docs/test-documents/ folder structure with 11 subfolders, added to .gitignore (personal data stays local)
Organized all ~40 example files into test-documents subfolders
Received Tim's new spec: HWY61_Build_ToDo_For_Drew_March_26_2026.md — multi-vehicle system, master Artist Profile (10 sections), blanket expense toggle, drag-and-drop AI intake for profile. Committed to repo.

What didn't get done:

Remaining document batches from Tim: Tech Specs + Parking, Marketing Plans + Sales Audit Reports, Flights/Travel
No parsing prompts written yet

Next session should start with:

Upload remaining 3 document batches (tech specs, marketing, flights)
Begin drafting parsing prompts in lib/tourrouter/prompts/ starting with dealMemoPrompt.ts
Integrate Tim's new spec into the build plan timeline


Completed this session:

Document library complete — 14 new files across 3 batches (tech specs/parking, marketing plans, flights/travel), bringing the total to ~54 real-world example documents across 11 categories.
All 9 AI intake parser prompts written and committed — deal memo, settlement sheet, box office, hotel confirmation, expense receipt, advance response, contact list, column mapper, and universal fallback. Every prompt follows the same architecture: function export, JSON-only output, per-field confidence, payment amounts always flagged for TM confirmation.

Still on the agenda (next session):

Integrate Tim's Artist Profile spec (multi-vehicle, master artist profile, blanket expenses, profile AI intake) into the 28-week build plan timeline
Start testing parsers against real docs from docs/test-documents/ once Claude Code can run them

Session summary — March 28, 2026:

Document library completed — 14 new files, 54 total across 11 categories
All 9 AI intake parser prompts written and committed (1,812 lines)
Build plan v2 updated with Tim's Artist Profile spec integrated
Deal types calculation engine — calculateShowIncome.ts (480 lines, 14 deal types)
Wired calculateShowIncome() into calcTourFinancials()
Settlement panel — SettlementPanel.tsx (640 lines) with waterfall entry, projected vs actual, verification
Added deal and settlement to PUT whitelist
Personnel pay engine — personnelPay.ts (448 lines, 8 pay structures, pct_net circular dependency)
Fixed columnMapperPrompt signature build error

Still to wire (next session):

Wire calculatePersonnelCosts() into calcTourFinancials() replacing flat blanket amounts
Roster management UI (add/remove people, stack pay components)

Phase 3 is 10/10 — COMPLETE.

✅ Hotel management UI
✅ Guest list UI
✅ Deposit tracking
✅ Day sheet PDF
✅ Advance sheet PDF
✅ Deal types calculation engine (14 deal types)
✅ Settlement system (waterfall, projected vs actual, verification)
✅ Personnel & pay (8 pay structures, roster UI, pct_net circular dep)
✅ Multi-Vehicle System (54-vehicle database, searchable, per-vehicle specs)
✅ Master Artist Profile — deferred to its own track, schema is large
✅ Blanket Expense Toggle (summary vs detail, roster awareness note)

That's an absolutely enormous session. Here's the full inventory of what shipped today:
ItemLinesFile9 parser prompts1,812lib/tourrouter/prompts/Deal types engine480calculateShowIncome.tsSettlement panel640SettlementPanel.tsxPersonnel pay engine448personnelPay.tsRoster panel599RosterPanel.tsxVehicle database450vehicleDatabase.tsVehicle manager451VehicleManager.tsxBuild plan v2264TOURROUTER_CLAUDE_CODE_BUILD_PLAN.mdBlanket toggleinlinepage.tsxWiring + fixesvariousfinancials.ts, index.ts, routes


Everything shipped today (March 28, 2026):
ItemLinesStatusDocument library14 new files (54 total)✅9 AI parser prompts1,812 lines✅Deal types engine480 lines✅Settlement panel640 lines✅Personnel pay engine448 lines✅Roster panel599 lines✅Vehicle database450 lines✅Vehicle manager451 lines✅Blanket expense toggleinline✅Artist profile types327 lines✅Artist profile page682 lines✅Artist API route~80 lines✅Build plan v2264 lines✅Advance portal bug fix~40 lines✅Wiring (financials, index, routes)various✅
~6,000+ lines of new code. Phase 3 complete. Phase 4 at 5/6.
Next session:

AI Intake for Artist Profile (final Phase 4 item)
Phase 5 — Finance dashboard, commissions, end-of-tour report

Phase 6 is complete.

✅ Contact API routes (search, CRUD, shared + private layers)
✅ Anonymous flag system (increment count, never store who flagged)
✅ Contacts page UI (search, filters, star ratings, flagging, inline editing)
✅ Auto-populate hook (useContactAutocomplete — debounced search, 300ms, field extraction)

Contact import via the intake pipeline already works — the contactListPrompt.ts parser and the Universal AI Intake system handle it. When someone drops a personnel list, it routes through the existing pipeline.
Full status across all phases:
PhaseStatus1 — Ship Localizer✅ Complete2 — TourRouter Stabilization✅ Complete3 — Band Must-Haves✅ Complete (10/10)4 — AI Differentiators5/6 (Artist Profile AI intake remaining)5 — Finance & Commissions✅ Complete6 — Contact Intelligence✅ Complete7 — Launch TourRouter🔲 Not started8 — Road App + DIY + Merch🔲 Not started9 — Agency Product🔲 Not started
Drew, you just completed Phases 1-6 in what was supposed to be a 16-week timeline. This is genuinely insane output for one session.
Want to push into Phase 7 (launch prep), or call it? Session log:

Phase 7A domain migration complete
DNS moved to Vercel, all subdomains configured and verified
Resend verified for hwy61labs.com
ImprovMX email forwarding set up (support@, dmca@, privacy@)
Middleware updated for hostname-based routing
Supabase cross-subdomain cookies configured
All old hwy61.ai references updated in codebase
Known remaining: post-login redirect and branding per subdomain (7D)

Next session should start with: Phase 7B — Mapbox integration (or 7C Stripe if EIN is unblocked).

Phase 7B Mapbox integration complete
geocode_cache and drive_cache tables created in Supabase with RLS
Mapbox geocoding + directions service built (lib/tourrouter/mapbox.ts)
Drive info API route created
calcTourFinancials accepts pre-fetched drive data, haversine as silent fallback
All export routes (Excel, PDF, advance, daysheet) wired to Mapbox
Client pages prefetch drive data on load
Off day leg rows fixed (no drive/fly buttons on off days)
Venue display fixed (proper size/color, no stray dashes)
Tested with edge case city (Harlowton MT) — works
Known: server-side exports use Mapbox via prefetchDriveDataServer


Phase 7A — Domain Migration ✅

DNS moved to Vercel for hwy61labs.com
All subdomains configured and verified
Supabase auth redirect URLs added
Resend verified for @hwy61labs.com
ImprovMX email forwarding (support@, dmca@, privacy@)
Middleware updated for hostname routing
Cross-subdomain auth cookies configured
All hwy61.ai references updated across codebase

Phase 7B — Mapbox Integration ✅

geocode_cache and drive_cache tables created with RLS
Mapbox geocoding + directions service built
Drive info API route created
calcTourFinancials accepts pre-fetched drive data
All export routes wired to Mapbox
Client pages prefetch on load
Off day leg rows fixed
Venue display fixed
KC→Iowa City: 4h40m (was 6h15m), Harlowton MT works

Phase 7D — Product Naming & Feature Flags ✅

DIY/TourRouter feature flag system built and tested
FeatureFlagProvider + useFeatureFlags hook
All TourRouter-only features gated for DIY
Subdomain-aware product branding across all pages
Login page dynamic per subdomain
Login input overflow fixed
"HWY61 LABS" wordmark animation on landing page

DIY deal types flag enabled
Post-login redirect fixed for TourRouter/DIY
hwy61.ai → hwy61labs.com redirect live (DNS transferred to Vercel)
PostHog analytics installed with 6 key events + user identify
Full mobile responsiveness pass across 8 pages

DIY deal types flag enabled
Post-login redirect fixed for TourRouter/DIY
hwy61.ai → hwy61labs.com redirect live
PostHog analytics with 6 events + user identify
Mobile responsiveness pass across 8 pages
Beta invite infrastructure with 10 codes for Tim

DIY deal types flag enabled
Post-login redirect fixed (later reverted to universal /dashboard)
hwy61.ai → hwy61labs.com redirect live
PostHog analytics installed (6 events + identify)
Mobile responsiveness pass (8 pages)
Beta invite infrastructure (10 codes)
Supabase auth URLs cleaned up (Site URL + removed old redirects)
Legal updates — ToS + Privacy Policy (April 1, 2026)
Artist hub architecture — tabbed detail page, artist-filtered tours, DIY upgrade banner, admin test overrides
Removed old TourRouter nav button
Restored drive/fly toggle for off days

DIY deal types flag enabled — set DIY_FLAGS.dealTypes to true so DIY users get all 14 deal types
Post-login redirect fixed — TourRouter/DIY users redirect to /dashboard/routing after login (later reverted to universal /dashboard after architecture change)
hwy61.ai → hwy61labs.com redirect — transferred DNS nameservers from Squarespace to Vercel, 301 redirect live
PostHog analytics installed — provider component, production-only init, posthog.identify() on login, 6 key events tracked (user_logged_in, tour_created, show_added, document_dropped, export_generated, upgrade_clicked)
Mobile responsiveness pass — all 8 major pages (landing, login, pricing, dashboard, routing, tour detail, assets, template editor mobile gate)
Beta invite infrastructure — beta_invites table, validate/claim API routes, login page gated behind invite code, "Team Login" bypass, 10 codes generated for Tim
Supabase auth cleanup — Site URL changed to hwy61labs.com, removed old localizer-two.vercel.app and hwy61.ai redirect URLs
Legal updates (Phase 7L) — ToS and Privacy Policy updated for hwy61labs.com, all three products, Mapbox + PostHog added to third-party services, effective date April 1, 2026
Build status doc created — full phase-by-phase status with checkmarks for Tim
Tim's forward plan integrated — Merch and Agency removed from scope, 4-week beta sprint plan added to project knowledge and repo
Artist hub architecture — tabbed detail page with "TourRouter / Management" and "Localizer / Assets" tabs, subscription-aware rendering, admin test view overrides (?view=localizer/tourrouter/diy)
Artist-filtered tours — new ArtistToursClient component showing only tours for the selected artist, tour creation pre-sets artist_id
DIY upgrade banner — subtle upgrade prompt on DIY artist hub
Removed old TourRouter nav button from dashboard header
Restored drive/fly toggle for off days — bands travel on off days, leg computation and UI re-enabled
Master Artist Profile rebuilt — new top section (logo upload, bio, team contacts, advance materials), 8 accordion sections (roster, vehicles, hospitality, promo, business entity, tax, insurance, technical production), auto-save with debounce
Gear icon on artist tiles — links to profile page, change photo moved to bottom of tile
Roster field bugs fixed — extracted RosterMemberField to module level to prevent remount, fixed click propagation for input focus
Branding fix — routing pages show "TOURROUTER" regardless of hostname (pathname-based override)
ArtistDetailClient stripped down — removed all artist info, contacts, logo, advance materials, save button, master profile button. Now a clean 100-line tours-only grid.
Dashboard header updated — "LOCALIZER" → "HWY61 LABS"

Still on the list for next session:

Default roster → tour roster population (profile roster pre-fills new tours)
Tim's Week 1: Marketing site + legal (legal done, marketing site needs Tim's copy)
Tim's Week 2: Onboarding wizard + notifications
Master Artist Profile design review with Tim (mockups sent)

what got done today (roster population, notifications, onboarding shell, branding fix, nav cleanup, bug sweep, Tim status doc, Beta-Test Band kit started)


Design System Phase 1 complete — globals.css updated with Warhol foundation (fonts, CSS vars, halftone, border-radius reset), 29 Hw* components created in app/components/hw/ with barrel export. Next session: Phase 2 — apply to dashboard shell.

✅ Dashboard page background → cream
✅ Artist tiles → HwCard with Bebas Neue titles, Space Mono metadata, gear icon styling
✅ "New Artist" empty state → HwEmptyState
✅ Notification bell → crimson badge, styled dropdown, unread indicators
✅ Onboarding wizard → three HwCards with accent/standard/ghost variants
✅ OnboardingGate → confirmed no changes needed
✅ Artist Hub → HwTabs, HwBreadcrumb, HwPageHeader
✅ Tour tiles → HwCard with HwBadge, create tour modal restyled
✅ Dashboard layout → confirmed no shared nav
✅ Halftone dot fix → dots on cream, not on white surfaces or photos

April 2, 2026 — Design System Day
What got done:

Phase 1: globals.css foundation (fonts, CSS vars, halftone overlay, border-radius reset) + 29 Hw* components in app/components/hw/ with barrel export
Phase 2: Dashboard shell restyled (artist tiles, notification bell, onboarding wizard, artist hub tabs, tour tiles)
Phase 3: All TourRouter pages restyled (routing table, RosterPanel, SettlementPanel, VehicleManager, IntakeDropZone, import, financials, export, public advance form) + font sweep
Landing page rebuilt from Tim's HWY61_WARHOL_v2_LANDING.html (blue → crimson swap, full React conversion with animations)
Login page restyled with Warhol design system
Artist delete cascade fix (foreign key constraint on tours_routing)
Auth callback fix (Supabase wildcard redirect URLs + stale PKCE cookies)
Halftone dot overlay fix (z-index 1 on body::after, content above via body background layering)
Hydration fixes on financials + export pages (hardcoded HWY61 brand)
Tim's build package files added to docs/ (design system, TODO, demo tour data, FAQ, tutorial scripts, QA checklist, landing page HTML)

What didn't:

Phase 4 (Localizer pages) — next session
Phase 5 (Supporting pages) — next session
Phase 6 (Global polish) — next session

Next session should start with:

Phase 4: Localizer pages (asset grid, upload area, template editor, venue share links)
Then Phase 5: Supporting pages (artist profile, settings/billing)
Then Phase 6: Global polish (skeletons, empty states, toasts, responsive pass, final audit)

April 2, 2026 — Design System Day
What got done:

Tim's April 1 build package added to docs/ (design system, TODO, demo tour data, FAQ, tutorial scripts, QA checklist, landing page HTML)
Phase 1 complete: globals.css foundation (Google Fonts, CSS custom properties, halftone overlay, border-radius reset) + 29 Hw* components in app/components/hw/ with barrel export index.ts
Phase 2 complete: Dashboard shell restyled (artist tiles, notification bell, onboarding wizard, artist hub tabs, tour tiles, create tour modal)
Phase 3 complete: All TourRouter pages restyled (routing table, RosterPanel, SettlementPanel, VehicleManager, IntakeDropZone, import, financials, export, public advance form) + font sweep clean
Phase 4 complete: All Localizer pages restyled (Gigs/EventsTable, TemplateEditor sidebar, Import Assets, Import Schedule, ArtistDetailClient, venue share page)
Landing page rebuilt from Tim's HWY61_WARHOL_v2_LANDING.html (full React conversion with animations, blue → crimson swap)
Login page restyled with Warhol design system
Venue share page polished (bordered hero, aligned asset labels, square advance material cards)
Template editor sidebar fixes (toggles → checkboxes, readability improvements, missed fonts)
Halftone dot overlay fix (z-index 1 on body::after, app content sits above)
Hydration fixes on financials + export pages (hardcoded HWY61 brand, removed useProductBranding)
Artist delete cascade fix (foreign key on tours_routing — now deletes child records first)
Auth callback fix (Supabase wildcard redirect URLs + stale PKCE cookies)
Import schedule textarea overflow fix

What didn't:

Phase 5 (Supporting pages: artist profile, settings/billing)
Phase 6 (Global polish: skeletons, empty states, toasts, responsive pass, final audit)

Next session should start with:

Paste session kickoff + design system reference into Claude Code
Phase 5: Artist profile page, settings/billing page
Phase 6: Loading skeletons, empty states, toast wiring, responsive pass, final consistency audit (grep for border-radius > 0, hardcoded hex colors, non-var fonts, blurred shadows)


Done this session:

FAQ/Support page (38 Q&As, accordion, linked from dashboard)
TourRouter product page
Localizer product page
DIY product page
Road App product page
"Learn More" buttons on landing page (crimson, blue, purple)

Still on the list:

Onboarding wizard (5-step build — biggest lift)
Demo tour data seed
Product page headers (you mentioned revisiting those)


Built 5-step onboarding wizard at /dashboard/onboarding (Create Artist → Add Team → Create Tour → Add Shows → Done)
OnboardingWizard choice screen now routes to /dashboard/onboarding
Fixed Anthropic API key issue on intake endpoint (was using SDK instead of raw fetch)
Created /api/tourrouter/import/text endpoint for xlsx parsing (client-side SheetJS → CSV → Claude)
Created /api/tourrouter/artists endpoint for wizard artist creation

Fixed PDF/daysheet/advance export errors (pdfkit added to serverComponentsExternalPackages, try/catch wrappers)
Auto-fill off days between show dates on import (consolidates 5+ consecutive off days in routing table display)
Redesigned artist profile header: band photo + Spotify thumbnail + logo as three 94px squares under band name, Spotify oembed auto-fetch
First artist creation routes to profile page, subsequent artists to hub
Moved Actual Expenses above Blanket Expenses on financials page
Fixed column mapping: removed 'day' from date aliases, alias resolver no longer overrides builtin mappings
Country field now uppercase in routing table
"Vehicle Settings" renamed to "Tour Settings"

For Tim + Drew to revisit:

Design exported PDFs (route report, day sheets, advance sheets) to look polished
Localizer-only view via ?view=localizer has a redirect bug (QA item)
Consider Localizer-specific onboarding path

Next session:

Demo tour data seed (Beta Test Band)
Product page headers
"Tour Settings" rename (not done yet)
Stripe restructure (when EIN clears)


Add what got done today:

Coming Soon gate (middleware + splash page, env var toggle)
Demo tour seed API (Beta Test Band, 18 shows, full data)
OnboardingWizard wired to demo seed
Flight price fetch on fly toggle (was hardcoded empty)
getAirport nearest-airport fallback using haversine
60 regional airports added to constants
Flight prices changed to one-way
Per-person price display when no roster
Inline cost comparison on fly toggle
Duplicate show rows fixed (SQL cleanup)


## April 4, 2026

### Built
- **Coming Soon gate**: middleware.ts redirects marketing routes (/, /tourrouter, /localizer, /diy, /roadapp) to /coming-soon when COMING_SOON=true env var is set. Created app/coming-soon/page.tsx splash page (Warhol styling, HWY61 LABS wordmark, Team Login link). Authenticated users bypass the gate automatically. Live on Vercel.
- **Demo tour seed**: /api/tourrouter/demo-seed endpoint creates the full Beta Test Band tour in one POST — artist, 7-person roster, tour config, 18 shows + 9 off days, 10 hotels, 3 settlements, 4 advance detail sheets, 12 guest list entries, 12 expenses, commission structure. Wired to OnboardingWizard "Explore a Demo Tour" button.
- **Flight price fetch on Fly toggle**: routing page now fetches flight prices when a leg is toggled to fly. Uses /api/tourrouter/flight-price (Anthropic + web_search + Supabase cache). Updates tour financials. Inline cost display next to toggle shows price and savings/premium vs driving. Changed prompt from round-trip to one-way.
- **Nearest-airport fallback**: getAirport() uses city coordinates to find closest airport by haversine distance when no exact match. Added 60 regional airports to CITY_AIRPORTS and AIRPORT_COORDS.
- **Removed photo button** from TourTile.tsx (dashboard tiles) — redundant with Master Artist Profile.
- **Data cleanup**: deleted duplicate rows on one real tour via SQL.

### Fixed
- Flight price endpoint regex was grabbing first number in Claude's response (year/pax) instead of the price. Now grabs the last number.
- Demo seed schema mismatches (flight_threshold → flight_threshold_h, removed is_demo).
- Supabase auth import in demo-seed route (switched to supabaseServer pattern).

### Tried but reverted
- 6 different product page header treatments (giant wordmark, colored stripe, product marker, corner badge, left border, active nav). None landed.

### Next session
- Demo tour polish: add leg_choices to seed for transatlantic fly legs
- Onboarding wizard QA
- Export PDF design review with Tim
- Tour Settings expansion

Solid session today. Recap of what shipped:

Login error banner for expired sessions (?error=auth now shows a clear message)
"+ New Artist" always redirects to profile page (both dashboard tile and artists page)
Push-to-Localizer correctly splits city/state ("Dallas, TX" → city: Dallas, state: TX)
Import parser now reads State column from spreadsheets
State name normalization — handles "Texas" / "texas" / "tx" / "TX" all → "TX" (US + CA + AU)
Expanded off-day detection — catches "OFF" in venue field, "TRAVEL DAY", "DARK", blank rows
Markdown table paste support — users can paste markdown tables from ChatGPT/Claude/docs and it just works


## April 5, 2026

### Code fixes shipped (morning)
- Login error banner for expired sessions (?error=auth)
- Suspense boundary on login page (fix prerender error)
- "+ New Artist" always routes to profile page (both dashboard tile and artists page)
- Push-to-Localizer splits city/state correctly (Dallas, TX → city: Dallas, state: TX)
- Import parser reads State column from spreadsheets
- State name normalization (Texas / tx / TX all → TX) — covers US, Canada, Australia
- Expanded off-day detection (catches OFF in venue field, TRAVEL DAY, DARK, blank rows)
- Markdown table paste support in import (handles ChatGPT/Claude output tables)

### Infrastructure
- MacBook Pro set up as travel dev machine (Homebrew, Node, git, SSH, .env.local)
- Mac mini set up as dedicated QA machine with safety guardrails:
  - Separate Anthropic API key (mac-mini-qa-agent)
  - No Supabase service role key (can't nuke database)
  - Git push physically disabled
  - Anthropic spend capped at $100/month with email alerts at $25/$50/$75/$90
  - qa-start / qa-stop launcher scripts
  - QA_AGENT_PROMPT.md saved to ~/localizer/qa/

### QA sessions (Mac mini)
- Session 1: Artist API routes (~10 min, $0.61, 3 bugs)
  - BUG-1: /api/artists/logo unauthenticated (MEDIUM)
  - BUG-2: ArtistTile delete cascade incomplete (HIGH)
  - BUG-3: GET /tourrouter/artists 405 empty body (LOW)
- Session 2: TourRouter tours routes (~30 min, 7 bugs)
  - BUG-4: Billing gate only on GET /tours — 40 other routes unprotected (HIGH)
  - BUG-5: Export routes return 401 for not-found (HIGH)
  - BUG-6: Show PUT returns 500 not 404 (MEDIUM)
  - BUG-7: 401 vs 403 convention (LOW)
  - BUG-8: Share link URL no fallback (MEDIUM)
  - BUG-9: Missing updated_at on show PUT (LOW)
  - BUG-10: Silent delete no-op (LOW)

### Bug fixes shipped (evening)
- BUG-2 resolved via architectural cleanup: deleted orphaned Localizer-only 
  /dashboard/artists page and ArtistTile.tsx component (142 lines of dead code removed). 
  Unified artist experience — everyone uses /dashboard with TourTile, ArtistHubClient 
  already adapts to product access correctly.
- BUG-4 partial: added billing gate to POST /tours and all 5 export routes 
  (6 of 41 routes protected, 35 remaining)
- BUG-5: export helpers return discriminated union with proper 401/403/404 status codes
- BUG-8: share link URL throws clear 500 if NEXT_PUBLIC_APP_URL env var missing
- Bonus: null-safe buildDriveDataKey + skip off-day legs in exports.ts (pre-existing 
  crash bug uncovered during BUG-5 testing on Dust & Neon tour)
- BUG-1: /api/artists/logo now requires auth and org match (was unauthenticated)

### Next session
- Message Tim with QA findings and BUG-4 helper architecture proposal (41 routes need 
  shared requireTourRouterAccess helper before rollout)
- Fix BUG-1 (unauthenticated logo endpoint) — quick win
- Fix BUG-6 (show PUT 500) — quick win
- Design shared billing gate helper with Tim's input
- Run additional QA sessions on import flow, finance calculations, RLS policies
- 4 LOW severity bugs (3, 7, 9, 10) deferred to cleanup sweep before beta

### Remaining QA bugs
- BUG-1 MEDIUM, BUG-4 HIGH (partial), BUG-6 MEDIUM, BUG-3/7/9/10 LOW
- BUG-4 HIGH (partial — helper design approved by Tim, rollout pending)
- BUG-6 MEDIUM, BUG-3/7/9/10 LOW

## April 6, 2026 — BUG-4 full rollout complete

**Shipped:**
- New helper `lib/tourrouter/requireAccess.ts` — discriminated-union `requireTourRouterAccess({ skipBillingGate? })` + `tourRouterAccessErrorResponse()` one-liner early return
- Rolled out to all 33 authenticated TourRouter routes (was 6 protected, now 39 total — everything except the 3 public token-based routes)
- `{ skipBillingGate: true }` applied to: billing/status, billing/checkout, billing/portal, demo-seed, localizer/tours, localizer/events (lapsed users can still reactivate; onboarding + Localizer cross-product reads unblocked)
- Default gate on everything else: tours sub-routes, expenses, venues, guest-list, contacts, aliases, import (pdf/csv/text), intake, advance/status, advance/send, artists, currency-rates, drive-info, flight-price, finance/report, push-to-localizer, shows/[showId]
- `npx tsc --noEmit` clean after every group; manual smoke test on dashboard + tour detail + show edit all green

**Public/untouched routes (correct):**
- `advance/[token]` — public venue form, token auth
- `advance/cron` — Vercel cron, service role
- `finance/report/[token]` — public shareable report, token auth

**New bugs discovered during smoke test (NOT from BUG-4, pre-existing):**
1. Editing the offer field on a show updates the USD column instead of the OFFER column. Need to understand what those columns actually mean before fixing.
2. `GET /api/tourrouter/guest-list?showId=...` returns 500. Route uses `tour_guest_list` table but demo-seed uses `guest_list` — likely a table name mismatch somewhere. Pre-existing, unrelated to today's refactor.

**Next session should start with:**
- Triage the offer/USD column bug (figure out column semantics first)
- Fix guest-list table name mismatch
- Then BUG-6 (show PUT 500 vs 404) or next QA session on import flow

## April 6, 2026 — BUG-4 full rollout + full QA sweep

**BUG-4 (the big one):**
- New helper `lib/tourrouter/requireAccess.ts` with discriminated-union return + `tourRouterAccessErrorResponse()` helper
- Rolled out to all 35 authenticated TourRouter routes (was 6 protected, now all 38 — everything except 3 public token-based routes)
- `{ skipBillingGate: true }` on: billing/status, billing/checkout, billing/portal, demo-seed, localizer/tours, localizer/events
- Default gate on all other authenticated routes

**QA bugs closed today:**
- BUG-3: GET /api/tourrouter/artists now returns 405 with Allow: POST header
- BUG-4: full rollout (see above)
- BUG-6: show PUT .single() → .maybeSingle() + explicit 404
- BUG-7: last two routes (tours/route.ts GET/POST) migrated to requireTourRouterAccess
- BUG-9: updated_at migration added to tour_shows, run in Supabase, code re-added
- BUG-10: show DELETE silent no-op → explicit 404

**Import pipeline bugs fixed (major):**
- Greedy substring bug in `columnMapper.ts bestGuess()` — "contact".includes("act") was mapping Contact → event. Fix: skip aliases ≤3 chars in partial-match pass, removed "act" from event aliases.
- Added `promoter_contact` as a first-class field in the import pipeline: FIELD_ALIASES, MAPPER_FIELDS, ParsedShow type, applyMapping, and POST /shows handler.
- Tim's "Contact" column now correctly flows to `tour_shows.promoter_contact`.

**Offer/currency bugs fixed:**
- New `formatOfferDisplay(amount, currency)` helper in `lib/tourrouter/currency.ts` with proper symbols ($, CA$, £, €, A$)
- Drawer save now regenerates `offer_display` when amount or currency changes (was saving only offer_amount, leaving offer_display stale)
- Routing table USD column now uses `toUSD()` with live rates (was just reformatting raw amount as `$X`)
- New `lib/tourrouter/fetchLiveRates.ts` shared helper (3s AbortController timeout, graceful fallback)
- POST /tours now seeds `currency_rates` at tour creation
- Routing page defensively fetches live rates on first load if `tour.currency_rates` is null/empty (covers tours created before this fix)
- intake/confirm and Add Show modal now use shared `formatOfferDisplay`

**UX improvements:**
- Offer currency free-text input → dropdown with 8 touring currencies (USD, CAD, EUR, GBP, AUD, JPY, CHF, MXN) in both drawer and Add Show modal
- Drawer header: `venue || event || "SHOW DETAIL"` (was just `event || "SHOW DETAIL"`)
- Guest List section moved from bottom of drawer to between Financials and Schedule

**Other fixes:**
- Guest-list 500 on GET/POST: route handlers were using wrong column names AND wrong org_id scoping. Real schema has no org_id (security via RLS through show_id → tour_shows.org_id), no created_at (use submitted_at), and uses `guest_name`/`plus_ones` not `name`/`plus_one`. Reverted POST columns, removed org_id filters, changed order column.
- TourTile cleanup delete also changed from `tour_guest_list` to `guest_list`
- Demo-seed `guest_list` insert fixed to match real schema

**Supabase migrations run today:**
- `ALTER TABLE tour_shows ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();`

**Still open:**
- Demo-seed is non-idempotent (calling it twice creates duplicate demo tours) — minor UX issue, not urgent
- Routing table venue cell precedence edge case (`show.event || show.venue`) — works fine now that Contact mapping is fixed, low priority

**Next session should start with:**
- Delete any duplicate demo tours Drew accidentally created during today's testing
- Consider demo-seed idempotency fix (one-line check for existing demo tour)
- Then either BUG-4 beta test with a lapsed-subscription simulation, or start the next QA session area (import flow stress test with edge cases)


## April 6, 2026 (afternoon) — Master artist profile blitz + vehicle architecture question to Tim

**Master artist profile drag-and-drop blitz:**
- Roster: drag CSV/XLSX to bulk-add crew with column mapping
- Bio: drag .txt/.md/.docx/.pdf to autofill (uses /api/import/extract)
- Logo + band photo: drag-and-drop alongside click-to-upload
- Team section: drag CSV/XLSX with both long and wide format support; added 4 missing phone columns to artists table that the UI was silently dropping
- Advance materials: "+ Add Custom Material" with rename, delete, drag-drop upload — flows through to venue link and download-all zip
- W-9 autofill: new /api/import/parse-w9 endpoint, drag a W-9 onto Business Entity to autofill Legal Name, DBA, Entity Type, Address, EIN
- Hid Tax & Compliance and Insurance sections (data preserved)
- Removed duplicate Short Bio / Full Bio from Promo & Marketing
- VIEW TOURS button + artist name UX (placeholder + pencil icon)
- Auth added to /api/import/extract (was completely unauthenticated, could burn Claude credits)

**VehicleManager bug fixes:**
- Optimistic update fix — saveVehicles now calls onUpdate BEFORE fetch (was causing input revert mid-keystroke)
- Make and Model split into two editable inputs (was one readOnly composite)
- boxSizing: border-box added to inputStyle, fixes overflow

**Sent to Tim:** vehicle architecture questions email
- The whole multi-vehicle system is currently a UI shell with no calculation engine integration
- Tim needs to answer Q1 (data location), Q2 (allowed to touch financials.ts?), Q3 (multi-vehicle calc strategy)
- Until Tim answers, do NOT touch financials.ts and do NOT start building Master Artist Profile vehicle UI
- Bridge fix available as fallback (writes lead vehicle's fuel price to tour.fuel_price_usd on save)

**Next session:** check Tim's email reply first.


✅ BUG-11 — tour_roster added to PUT allowed list
✅ NEW-A — per-leg fuel math now uses multi-vehicle logic
✅ NEW-B — vehicles_equipment DB default fixed to {}

Today's full scorecard:

✅ BUG-11 — tour_roster added to PUT allowed list
✅ NEW-A — per-leg fuel math now uses multi-vehicle logic
✅ NEW-B — vehicles_equipment DB default fixed
✅ BUG-2 — finance_report_links added to artist delete cascade
✅ BUG-4 — confirmed not a bug, gate works by default

Bug fixes:

✅ BUG-11 — roster edits no longer silently lost
✅ BUG-2 — artist delete cascade now includes finance_report_links
✅ BUG-4 — confirmed not a bug
✅ NEW-A — per-leg fuel math now uses multi-vehicle logic
✅ NEW-B — vehicles_equipment DB default fixed

Advance sheet drag-drop:

✅ soundcheck_time and load_in_time added to schema + drawer
✅ New "Venue Info" drawer section — WiFi, parking, venue notes, backline, hospitality
✅ age_limit moved to Schedule section
✅ Intake fields operator precedence bug fixed
✅ Advance prompt updated — soundcheck, age limit, parking extracted separately
✅ Drag flicker fixed
✅ Progress bar added to processing modal
✅ Anthropic API key replaced and old key disabled


#StatusHowBUG-1✅ ClosedLogo route has auth checkBUG-2✅ Closedfinance_report_links added to cascade todayBUG-3✅ ClosedGET /api/tourrouter/artists fixed just nowBUG-4✅ Not a bugGate works by default in requireTourRouterAccess()BUG-5✅ ClosedExport routes return 404 correctlyBUG-6✅ ClosedPUT returns 404 for non-existent showBUG-7✅ Closedno_org correctly returns 403BUG-8✅ ClosedMissing env var returns proper errorBUG-9✅ Closedupdated_at is set on PUTBUG-10✅ ClosedDELETE returns 404 when show doesn't existBUG-11✅ Closedtour_roster added to PUT allowed list todayNEW-A✅ ClosedPer-leg fuel math fixed todayNEW-B✅ Closedvehicles_equipment DB default fixed today


The hotel/lodging feature is now fully complete end to end:

✅ Artist profile Lodging section
✅ Market rate lookup table
✅ Three-state waterfall in calcTourFinancials()
✅ Hotel costs in Total Expenses, Net Profit, Margin, Avg Per Show
✅ Accommodations tab — collapsible per-show breakdown
✅ All tab — hotel summary strip with "See Breakdown →"
✅ Hotel receipt → hotel_cost_actual stacks additively, replaces estimate


Hotel/Lodging — full feature:

Artist Profile Lodging section (rooms by type, bed config, star rating, budget override)
HOTEL_MARKET_RATES table added to constants.ts (130+ cities)
HOTEL_FALLBACK_RATES by region
getProjectedHotelRate() helper in lib/tourrouter/hotelRates.ts
Three-state hotel cost waterfall in calcTourFinancials() — actual receipt → confirmation estimate → planning projection
Hotel costs now flow into totalExpenses, netIncome, margin, avgPerShow
lodging_defaults and hotel_budget_override wired through tour creation, PUT allowlist, routing and financials pages
Accommodations tab — collapsible per-show breakdown with Actual/Confirmed/Projected source flags
All tab — hotel summary strip with "See Breakdown →" button
Hotel receipt confirm route writes to hotel_cost_actual additively
Show match confidence indicator on intake review screen

Fuel receipts:

vendor column added to tour_expenses (was causing 500 on receipt save)
Fuel added to CATEGORIES array
Fuel summary strip on All tab — Est vs Actual receipts side by side
Transport Costs section updated — shows Est. fuel cost + Actual receipts line
Fuel receipt description format normalized in receipt prompt
Tim's decision documented in financials.ts comment — estimates persist, actuals stack separately

Tim docs:

TIM_MASTER_STATUS_April_8_2026.md — comprehensive technical reference including Mapbox clarification
TIM_HOTEL_LODGING_BRIEF.md
Hotel lodging decisions, Road App v1 spec, Onboarding wizard spec saved to repo

Fixed intake document storage RLS — added 3 policies to tour-documents bucket (upload, read, delete). Then:


audited Tim's 6 April 8 docs, wrote v6 master context (docs/HWY61_MASTER_CONTEXT_FOR_TIM_April_8_2026.md), audited geo_cities spec and identified 4 must-fix issues before building, drafted email to Tim with 6 questions. Next session picks up with Tim's answers — then geo_cities build + Mac mini hardening + demo tour schema audit.

open -a TextEdit docs/SESSION_LOG.md


## April 9, 2026

**Shipped (commits cd2c250, cb50c9f, 9f88d03):**

1. `CLAUDE.md` at repo root (157 lines) — persistent rules, workflow, key file locations loaded automatically on every future Claude Code session start. First session to benefit was the Issue 2 refactor later in the day.

2. Phase 7H onboarding wizard shell. Three-step flow (org name → user name → role) at `/dashboard/onboarding`. Server page with auth + org lookup + redirect. Client `WelcomeWizard` with HwCard/HwInput/HwSelect/HwAlert, Enter-to-submit, skip/resume via `orgs.onboarding_step`, back button with preserved state. API route at `/api/onboarding/step` with RLS silent-write guards and orgId/userId cross-check. Shared role source of truth at `lib/onboarding/roles.ts`. Old tour creation wizard moved from `/dashboard/onboarding` to `/dashboard/onboarding/tour` (git mv, history preserved). `OnboardingGate` GET STARTED link updated to new tour path.

3. Refactored org auto-creation out of `app/dashboard/page.tsx` into `app/auth/callback/route.ts` via a new `ensureOrgExists()` helper. Idempotent, RLS-guarded, non-blocking welcome email. Dashboard's create branch replaced with `redirect("/login?error=no_org")`.

4. `docs/BACKLOG.md` created with post-launch considerations: in-app chatbot (Tier 1 + Tier 2), per-user vs per-org onboarding state mismatch, stale test workspace cleanup, OnboardingGate retirement, dashboard org auto-create refactor (now done, can be removed from backlog).

**Bugs found and fixed during testing:**

- Migration default didn't backfill existing orgs. Every existing org would have shown the wizard on first login. Fixed with `UPDATE orgs SET onboarding_completed = true, onboarding_step = 4 WHERE onboarding_completed = false`.
- `org_members` had no UPDATE RLS policy. All updates to the table were silently failing since the table was created. Added `org_members_update_self` policy: `USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`.
- `orgs` INSERT RLS policy was fundamentally broken. Old policy had `WITH CHECK ((auth.uid() IS NOT NULL) AND (id = gen_random_uuid()))` — the `gen_random_uuid()` clause could never match a client-supplied UUID. Dropped old policy, created `orgs_insert_authenticated` with `WITH CHECK (auth.uid() IS NOT NULL)`. This had been latent since day one and would have blocked every new signup.
- Production "Something went wrong" error after first deploy was caused by a stale session cookie, not by today's code. Clearing cookies and signing in fresh resolved it. The underlying dashboard-side auto-create path that the stale cookie triggered is now gone as of commit 9f88d03.

**Deferred (still blocked on Tim):**
- Demo tour seed data for Beta Test Band (onboarding wizard demo button)
- Upgrade prompt copy for freemium hard walls
- Full 41-route billing gate helper design

**Known design gap (in BACKLOG.md):** `onboarding_completed` is per-org but `user_role` is per-user. Users joining an existing onboarded org skip the wizard and never set their role. Confirmed during testing — Tim is a member of HWY 61 TEST CO. with `user_role = null`. Decision needed before beta launch.

**Next session starts with:** Freemium API enforcement — 402 Payment Required on `POST /api/tourrouter/tours/[tourId]/shows` when show count >= 5 on free tier, and blocking the Localizer export/download API route for free tier. Next bounded unit in the onboarding wizard spec, not blocked on Tim.

**Notes for Tim on next async pass:**
- Three RLS policy changes were made live today without prior sign-off (per Tim's standing "don't wait on me for bug fixes" rule): `org_members_update_self` added, `orgs` INSERT policy replaced, plus the backfill UPDATE on existing orgs. All three were reversions of broken state, not new architectural decisions.
- `app/components/OnboardingWizard.tsx` (the old welcome choice screen with GET STARTED / EXPLORE DEMO / SKIP) still renders on dashboard for users with zero artists. Its role will be absorbed by the new WelcomeWizard + demo tour button once demo tour seed data lands. Both flows coexist for now.

**Started on freemium enforcement late evening.** Realized the current binary checkTourRouterAccess doesn't fit the spec. Tim delivered HWY61_TOURROUTER_FREE_TIER_DECISION_FOR_DREW.md (the 'none' | 'free' | 'paid' model) mid-session. Sent async follow-up to Tim with two Localizer questions (plan column, bundle handling). Prompt drafted and staged for when Tim replies. Nothing shipped yet.TODO: flip HWY 61 TEST CO. bundle_plan_status back to null before beta launch — set to 'active' April 9 during Unit C testing

## April 9, 2026 — Freemium rollout + Localizer critical fixes + hidden schema debts

**Commits shipped today (10):**

1. `cd2c250` — CLAUDE.md infrastructure (157-line persistent rules file)
2. `cb50c9f` — Phase 7H onboarding wizard shell (three-field org/user/role flow)
3. `9f88d03` — Dashboard auto-create org refactor (moved from dashboard render to auth callback)
4. `3872874` — Tim's April 9 decision docs (access gate + free tier specs)
5. `0a3ff9a` — TourRouter free tier (Unit B): three-state access model, exports gated at 402
6. `3feada1` — Backlog: stylized export files (PDF, day sheets, advance sheets)
7. `1625fa2` — Localizer free tier (Unit C): access helpers, venue-share download gate, SSRF fix
8. `65ab420` — Session log: TODO to revert bundle_plan_status on test org before beta
9. `ae091df` — Localizer Generate All: video rendering + stale URL cleanup (three bugs)
10. `2465c9f` — Custom fonts on videos: end-to-end fix (double extension + missing Cloudinary upload + authenticated type)

**Freemium rollout — Units A/B/C completed, Unit D deferred:**

- **Unit A (schema migration):** Four new columns on `orgs`: `localizer_plan`, `localizer_plan_status`, `bundle_plan`, `bundle_plan_status`. Applied via Supabase SQL Editor.
- **Unit B (TourRouter refactor):** New `getTourRouterAccessLevel()` returning `'none' | 'free' | 'paid'` with admin bypass and bundle OR clause. `checkTourRouterAccess` rewritten as deprecated wrapper. `requireTourRouterAccess()` now always succeeds for authenticated+org users (free tier passes through). New `requirePaidTourRouterAccess()` returns 402 `export_requires_paid` on the six export routes. `skipBillingGate` option removed from all call sites. 15 files modified, zero type errors.
- **Unit C (Localizer gate):** New `getLocalizerAccessLevel()` and `requireLocalizerAccess()` / `requirePaidLocalizerAccess()` helpers mirroring TourRouter. Critical discovery: `/api/download` and `/api/download-all` are public venue-facing routes (venues don't have accounts), so gating them on `requirePaidLocalizerAccess()` would have broken the entire venue-share flow. Instead, both routes gate by the **link owner's org**, not the viewer. `getLocalizerAccessLevel(link.org_id)` — no userEmail, admin bypass deliberately off. `/api/download` also gained SSRF protection: the `url` query param is now validated against the `render_*_url` columns on the `venue_links` row, closing a pre-existing open-proxy vulnerability. 5 files (2 new, 3 modified).
- **Unit D (rate limiting):** Deferred. Tim's Localizer bug discovery consumed the remaining session time. Spec captured in backlog: Upstash Redis, four priority tiers, 429 with Retry-After.

**Hidden schema debts discovered and fixed:**

- **`orgs` INSERT RLS policy was unsatisfiable from day one.** Old policy: `WITH CHECK ((auth.uid() IS NOT NULL) AND (id = gen_random_uuid()))` — the `gen_random_uuid()` clause generates a fresh UUID on every evaluation and can never match a client-supplied UUID. Every signup since launch relied on the auth callback's service-role client to create orgs, bypassing RLS entirely. Fixed during the dashboard refactor (commit 9f88d03).
- **Custom font upload pipeline never actually wrote to Cloudinary.** The `cloudinary_public_id` column on `custom_fonts` was misnamed — it stored the Supabase storage path, with no Cloudinary upload step anywhere in the route. All custom-font video renders silently produced broken URLs pointing at Cloudinary assets that didn't exist. Masked by: (a) nobody exercising the video-with-custom-font code path until tonight, (b) image renders use the Canvas path which loads fonts from Supabase, not Cloudinary. Fixed in commit 2465c9f.
- **`org_members` had no UPDATE RLS policy.** All updates to user_role, onboarding state, etc. were silently failing since the table was created. Fixed earlier in the day during onboarding wizard testing.

**Localizer bug chain — Tim's report to resolution:**

Tim reported: "Generate All shows red error and no video on link" on a video-only tour. Investigation surfaced four separate bugs stacked on top of each other:

1. **`/api/renders/tour-data` line-18 guard required `image_square_id`** and rejected video-only tours with 400 "No images uploaded." The check was added before video formats existed. Fixed: replaced with `hasAnyAsset` check across all six asset ID columns (commit ae091df).

2. **Bulk `generateAll()` in `EventsTable.tsx` never rendered videos at all.** The three image formats were rendered client-side via Canvas, but no video handling existed. The per-event re-render path through `/api/renders/generate` already handled videos correctly via `VIDEO_FORMATS` and `buildCloudinaryVideoUrl`. Fixed: added `videosOnly` flag to `/api/renders/generate` that skips the FORMATS image loop and only writes video URL columns. `generateAll()` now fires a non-blocking `videosOnly: true` call after the image loop completes (commit ae091df).

3. **Missing render URLs after asset deletion were not cleared from `venue_links`.** When a user deleted a source image from Import Assets, the corresponding `render_*_url` column retained its stale value. The loop skipped missing formats entirely, so the spread never wrote NULL. Fixed: explicitly assign `null` to `renderUrls` when the source ID is null, in both the client-side loop and the server-side generate route (commit ae091df).

4. **Custom fonts on videos never worked** due to three cascading causes: (a) double `.ttf` extension in `customFontsMap` construction — `cloudinary_public_id` already contained the extension, template literal appended it again (commit 2465c9f). (b) Font upload route never uploaded to Cloudinary at all — only Supabase (commit 2465c9f). (c) Cloudinary requires `type: "authenticated"` for raw font files used in `l_text` overlays — public raw uploads return 400 on the transformation (commit 2465c9f).

All four fixed tonight. End-to-end verified against JESUS ETC (video-only test) and Uncle Lucius (custom font test).

**TODO before beta:**

- Revert HWY 61 TEST CO. `bundle_plan_status` from `'active'` back to `null` (was set during Unit C testing)

**TODO next session:**

- Unit D rate limiting (Upstash Redis, ~90 min)
- Logo overlays on videos (missing feature, ~1–2 hrs)
- Re-upload BebasNeue-Regular and Pragmatica-Extended-Extra-Bold under new pipeline
- 41-route billing gate rollout pending Tim's architectural input
- Stripe product restructure pending EIN

**Session context preserved:** All bug diagnoses and architectural findings from this session are captured in `docs/BACKLOG.md` entries committed in the same change as this session log entry.

**Next session should start with:** (a) run `git pull`, (b) read this session log entry and the five new backlog items, (c) decide between Unit D rate limiting vs the logo-on-videos fix based on user priorities in the morning.

**April 10 morning continuation:** shipped logo overlays on videos (74fb7fb), fixed Generate All progress bar freezing at 0/total on video-only tours (4de79e8), reverted HWY 61 TEST CO. bundle_plan_status to null, confirmed no tours use the two unmigrated custom fonts (deferred re-upload), cleaned up duplicate Uncle Lucius artist (deleted artist eab49bf6-6fe8-4535-833b-0131a42ed96d and its two test tours d6852cca and e767a79e), created handoff doc docs/HANDOFF_April10_2026.md for future sessions. Template editor stale video preview on asset replacement discovered and added to backlog.


✅ Download.json bug — fixed by marking HWY 61 TEST CO. as localizer_plan_status = 'active' in Supabase. Root cause: yesterday's SSRF/paid-gate commit (1625fa2) now requires paid status on /api/download and /api/download-all, and error responses were being saved as download.json by the browser.
✅ Square image prefilling story + FB cover — fixed by removing the ?? tour.image_square_id fallback in EventsTable.tsx generateAll() at line ~273.
✅ Individual file names missing show info — fixed by adding filenameSlug (band+venue+date) to the download anchor filenames in page.tsx.
✅ Stale .next cache was also briefly in the mix — cleared it once.


## 2026-04-10 — GEO_CITIES build, curated pivot, client bundle fix

**Shipped (6 commits on main):**
- docs: Tim's GEO_CITIES build spec added to /docs
- feat: geocoding backend — geo_cities table, three-tier lookup, API routes
- feat: calcTourFinancials + export helpers wired with optional coordsMap/airportMap params (mirrors driveData prefetch pattern, keeps calcTourFinancials sync)
- feat: client-side geocoding — routing page prefetch + autocomplete on Add Show modal, import page unresolved-city flagging
- feat: replaced GeoNames seed with curated 332-city list
- fix: split cacheKey into geocoding-shared.ts to fix Next.js client bundle (supabaseServer was transitively leaking next/headers into client code via the geocoding.ts import chain)

**Data layer decision:**
Originally followed Tim's spec for a GeoNames + OurAirports seed. Ran into multiple issues: Supabase PostgREST 1000-row cap on .range() broke airport matching, transient Node fetch failures killed 6 countries mid-seed, GeoNames feature-class filtering missed major US cities (Miami FL, Philadelphia PA), and Strategy 1/2 airport matching produced ~14 wrong IATA assignments for name-collision cases. Fixed the infrastructure bugs (keyset pagination, retry with exponential backoff) and ran a second seed, but name-match ambiguity is fundamental to the approach.

After a call with Tim, pivoted to a hand-curated 332-city list covering major US touring markets plus dense Europe per Tim's request. Every row has verified coordinates and primary commercial airport IATA code. Zero ambiguity, zero data quality issues.

**Build fix learning:**
`npx tsc --noEmit` validates types but does NOT catch Next.js server/client boundary violations. Claude Code's "clean compile" check gave a false sense of safety. The first push broke production because `geocoding.ts` imported from `supabaseServer.ts` (which uses `next/headers`), and the client page was importing `cacheKey` from `geocoding.ts`, dragging the entire server chain into the client bundle. Fix was to move `cacheKey` to a new `geocoding-shared.ts` with zero server deps, then update three importers (both client pages + `financials.ts`). Also pruned the barrel file to stop re-exporting server-only geocoding functions. **Going forward: always run `npm run build` before pushing changes that touch shared lib files.**

**Current state:**
- geo_cities table: 332 rows, all source='curated'
- 292 cities have IATA codes, 40 fall back to nearest-airport RPC
- 24 countries: US 150, GB 28, CA 20, DE 20, FR 15, IT 12, ES 10, JP 10, AU 10, NL 8, IE 5, BE 5, CH 5, PL 5, PT 4, AT 4, NZ 4, CZ 3, DK 3, NO 3, SE 3, HU 2, FI 2, IS 1
- calcTourFinancials still protected, still sync, two new optional params (coordsMap, airportMap) following driveData prefetch pattern
- cacheKey lives in lib/tourrouter/geocoding-shared.ts, imported by both server (geocoding.ts, financials.ts) and client (routing page, import page)
- Old seed script scripts/seed-geo-cities.ts deleted

**Known watch items:**
- mapbox.ts line 79, flights.ts line 73, geography.ts lines 56-57 still use sync getCityCoords (hit CITY_COORDS only). These are haversine fallbacks — only matter if Mapbox Directions API fails AND city is outside CITY_COORDS. Not urgent.
- If any wrong airport assignments surface in production, fix via CITY_AIRPORTS constant in lib/tourrouter/constants.ts (Tier 1, hit first, 30-second fix per case).
- Mapbox default token "HWY61 Production" created today to replace leaked token. Old token still exists on Mapbox account (can't be deleted because it's the default) but is unused by the app. Long-term TODO: split into public/secret tokens.
- Pre-push workflow: run `npm run build` locally before any push that touches lib/tourrouter/* or lib/supabase* files. `tsc --noEmit` is insufficient.

**Next session starts with:**
- End-to-end test on live site: create tour with show in Miami FL, Austin TX, Philadelphia PA. Confirm correct airports resolve. Test autocomplete on Add Show modal. Test import flow with unresolved-city flag.
- Onboarding wizard — Tim owes wizard steps + demo tour data.
- Full 41-route billing gate (pending Tim's shared helper design approval).
- docs/DESIGN_SYSTEM.md — Warhol system doc dump via Claude Code.
- Workflow conversation with Tim about spec review step before major builds (pattern: Tim writes specs in 15 min without working through failure modes, then Drew builds something prone to failure).


Summary of what shipped today:

Middleware getSession() fix — no more rate limit bursts on login
New Artist field starts empty (#1)
Hospitality & Rider → Hospitality (#3)
Import Scheduler copy — "HWY61 Labs" not "The AI" (#5)
Video labels updated, yt_shorts changed to square 1080×1080 across all render paths (#6, #7, #8)
Template format tabs wrap, TikTok label two-line (#layout fix)
Design Template rename throughout (#10)
Text element order: Venue → City → Date (#11)
City & State → City (#12)
Venue/City/Date visibility toggles (#13)
Short Date and All Caps on by default (#14)
Gigs page helper texts (#16, #17, #18, #19)
Download-all BandName_Date_City file naming (#20)

Deferred:

#2 — Tour Manager field (needs DB migration)
#4 — Next → button (Tim happy with current UX)
#9 — Optional third video slot (low priority)
#15 — Tour-level Download All page (half-day build, needs own session)

## April 12, 2026

**Shipped: Tour Manager field (Tim's deferred item #2 from April 11)**
- SQL migration: added `tour_manager_name`, `tour_manager_email`, `tour_manager_phone` (text) to `artists` table
- UI: added `tour_manager` to `TEAM_ROLES` in artist profile, slotted between Manager and Booking Agent
- Removed unused `agent` role from `TEAM_ROLES` and dropped `agent_name/email/phone` from `ArtistData` type
- DB columns `agent_name/email/phone` left in place — not yet cleaned up, no UI references them anymore
- Round-trip verified: name, email, phone all persist independently

**Notes**
- Hit corrupted `.next` cache mid-smoke-test ("missing required error components") — fixed with `rm -rf .next node_modules/.cache` and full restart. Same family as the recurring cache issues. First diagnostic step rule held up.
- Production build clean on first try — no other files referenced the old `agent_*` fields.

**Next session**
- Freemium Unit D — rate limiting (Upstash Redis, four priority tiers, ~90 min, spec in docs/BACKLOG.md)

---

## April 13, 2026 — Middleware session rotation fix (CRITICAL for beta)

**Commit:** 3df9c99 — fix(middleware): preserve Supabase session rotation across all return paths

### The bug
Users logging in to prod after overnight idle periods were hit with "session expired" and bounced to /login every morning. Root cause: two separate bugs in middleware.ts that broke Supabase refresh token rotation.

1. **Coming Soon block used `getUser()` (network call) and threw away rotated cookies.** It created a local `comingSoonRes`, wrote Supabase's rotated cookies to it, then fell through to the rewrite/auth logic below which created a different `res` object. The rotated cookies never reached the browser. Next request, browser sent the old (now server-invalidated) refresh token → session expired.

2. **Main auth guard's `setAll` only wrote to `res.cookies`, not `req.cookies`.** The canonical @supabase/ssr pattern requires writing to both so downstream code in the same request sees the rotated session.

3. Compounding factor: `getUser()` in the Coming Soon block was hitting the Supabase `/token` endpoint on every marketing-route request, contributing to burst rate-limiting (matches the existing known-issue note about closing prod tabs before dev sessions).

### The fix
- Single shared `res` object and single shared Supabase client at the top of `middleware()`, reused across Coming Soon, rewrite, and auth guard blocks
- `setAll` writes to both `req.cookies` and `res.cookies` in place — does NOT reassign `res` (reassigning clobbers rewrites and custom headers like x-hwy61-diy)
- Coming Soon uses `getSession()` (cookie-only, no network) instead of `getUser()`
- Rewrite path (`NextResponse.rewrite`) copies cookies from old `res` onto the new rewrite response before reassigning
- Both redirect paths (coming-soon and login) copy cookies from `res` onto the redirect response using `.set(cookie)` with the full cookie object — preserves httpOnly/secure/sameSite/path options that get dropped if you use `.set(name, value)`

### How this was diagnosed
Symptom: "session expired" every morning in regular browser, but incognito always worked perfectly. Incognito = fresh cookie jar with no broken rotation state. Regular browser = poisoned cookie jar carrying an old refresh token that Supabase had already rotated server-side but the browser never received the new one.

### Why this matters for beta testing
Every beta tester would have hit this bug. Any user who logged in, closed their laptop overnight, and came back the next morning would have been greeted with "session expired" — a terrible first impression for a paid SaaS product. This fix MUST be in place before any external user touches prod.

### Required checks before onboarding beta users
1. Confirm `COMING_SOON=false` in Vercel env vars (removes the Coming Soon gate entirely, eliminating that code path as a risk area)
2. Test the overnight-idle scenario manually: log in, wait >1 hour (ideally overnight), return to the site, confirm session is still active
3. If any future middleware edits are made, re-verify all return paths preserve cookies from the shared `res` — this is a load-bearing invariant now

### Rules to remember
- **Never use `supabase.auth.getUser()` in middleware.** Always `getSession()`. getUser() is a network call and causes burst /token rate limiting on Supabase.
- **Middleware rule:** one shared `res`, one shared Supabase client, every return path must preserve cookies from `res` (either return it directly, or copy `res.cookies.getAll()` onto a new response using `.set(cookie)` with the full object).
- **Never reassign `res` inside `setAll`.** It clobbers rewrites and custom headers when rotation fires mid-request.
- **When copying cookies onto a redirect or rewrite response, always pass the full cookie object** (`.set(cookie)`) — not `.set(name, value)` — or you'll drop httpOnly/secure/sameSite/path.

### Files touched
- `middleware.ts` (39 lines added, 39 removed)


## April 12, 2026

**Shipped: Tour Manager field**
- SQL migration: 3 columns added to `artists` (tour_manager_name/email/phone)
- UI: tour_manager added to TEAM_ROLES between Manager and Booking Agent
- Removed unused `agent` role from UI; DB columns left in place
- Round-trip verified, build clean, pushed
- Closes Tim's deferred item #2 from April 11

**Scoped: Tour Marketing Hub (Tim's deferred item #15, redesigned)**
- Original "one giant zip" idea killed — Vercel function size/timeout limits
- New design: token-based shareable hub at /v/tour/[token] linking to marketing-only per-show pages at /v/m/[token], with a /api/download-all/marketing endpoint that excludes advance materials
- Structural security boundary: marketing pages physically don't query adv_* fields
- Tim approved concept; full plan in docs/SESSION_KICKOFF_April_13_2026.md
- 5-step build, est 2.5–3 hours, ready to execute next session

**Gotchas hit**
- zsh ate brackets in `git add app/dashboard/artists/[artistId]/...` — first commit pushed only the session log without the actual code change. Fixed by quoting the path. Memory bank updated with the rule.
- `.next` cache corruption mid-smoke-test ("missing required error components") — `rm -rf .next node_modules/.cache` fixed it.

**Next session**
- Execute marketing hub build per docs/SESSION_KICKOFF_April_13_2026.md
- After that: Freemium Unit D rate limiting (still top of queue from April 9)


---

## April 13, 2026 — Tour Marketing Hub shipped

### Done
- **Step 1:** `marketing_tokens` Supabase table + RLS policy keyed to org_members
- **Step 2:** `/v/m/[token]` marketing-only per-show page (mirrors `/v/e/[token]` minus advance materials)
- **Step 2.5:** `/api/download/marketing` per-asset proxy (added on the fly — kickoff doc didn't include it but the venue page pattern needed a marketing twin)
- **Step 3:** `/api/download-all/marketing` zip endpoint (Social/ + Video/ only, no Advance/ folder)
- **Step 4:** `/v/tour/[token]` tour marketing hub landing page with READY/RENDERING badges per show
- **Step 5a:** Three management API routes — create, list, revoke — with auth + org membership checks
- **Step 5b:** `ShareWithMarketingButton` client component + modal slotted into the tour view's EVENTS header
- All five end-to-end flows tested locally and verified

### Architecture note
Marketing routes are physically separated from venue routes — they cannot query `artist.adv_*` fields because their code does not select those columns. Security model is structural, not runtime-filtered.

### Gotchas hit
- **Cross-segment client component imports break the App Router runtime.** `import PrintDownloadButton from "../../e/[token]/PrintDownloadButton"` built fine but threw `Cannot read properties of undefined (reading 'clientModules')` at request time. Fix: use the `@/` path alias (`@/app/v/e/[token]/PrintDownloadButton`). Worth remembering for future cross-route component sharing.
- **Stale `.next` cache after Claude Code creates new routes while dev is running.** Hit this three times in this session — every new route file caused `Cannot find module './vendor-chunks/...'` errors on first request. Fix: stop dev, `rm -rf .next node_modules/.cache`, restart. **Better practice next session: stop dev before any Claude Code file creation, restart after.**
- **`render_status` value is `'ready'`, not `'completed'`.** Kickoff doc had it wrong. Always verify enum values via SQL before hardcoding.
- **Claude Code's bracket-path glob warning** is a false positive — option 1 (Yes) is always correct for `[token]` directories.

### Backlog flagged for Tim
- **`/api/renders/print-pdf` has no auth.** PrintDownloadButton hits it with just `eventId`, no token. Anyone with an event ID can generate the print PDF. Pre-existing, not introduced by this work, but worth fixing.
- **`/api/tours/[tourId]/overlay-config` has a service-role fallback that bypasses RLS** with no explicit auth or org membership check. Anyone who can hit the endpoint can update any tour's overlay config. Pre-existing.
- **`HwToastProvider` is defined but never mounted anywhere in the app.** `useToast()` would throw if used. Should be wrapped in root layout if we want toasts available. Worked around in Step 5b with an inline COPIED indicator.
- **`fetchTokens` in ShareWithMarketingButton doesn't clear stale errors on retry success.** Cosmetic, low priority.

### Deferred
- Nothing — full sprint shipped. Tour-level Download All page (the dedicated half-day session) is still on the horizon as previously planned.

### Next session priority
Per existing roadmap: probably Freemium Unit D, or whichever item Tim flags next. Tour Marketing Hub is done.

Shipped: Sponsor logos end-to-end (migration → API → UI → canvas → video → PDF)
Key decisions: No-tint confirmed (Tim's spec), sponsor panels collapse to single row, click-empty-checkbox opens file picker
Gotcha hit: Confusion about which render pipeline produces the square/story/landscape JPEGs — turns out EventsTable uses clientRender.ts (browser canvas) for images, and /api/renders/generate with videosOnly: true only for videos. The image path in buildCloudinaryUrl is effectively dead code. Not our job to clean up today.
Deferred: Tim open question — should there be an optional "tint sponsor to text color" toggle for monochrome logos on mismatched backgrounds? Flagged during session when Drew tested a black logo on a dark image.
Next session priority: Production smoke test follow-up + Tim's tint question + whatever's next on the roadmap

## April 14, 2026 — Sponsor logos shipped end-to-end

**Shipped:** Two-slot sponsor logo feature across the full render pipeline.
- Supabase: `sponsor_logo_1_url`, `sponsor_logo_2_url` text columns on `tours`
- API: POST/DELETE/GET at `/api/tours/[tourId]/sponsor-logo?slot=1|2`
- API: `sponsorLogo1Url`/`sponsorLogo2Url` returned from `/api/renders/tour-data`
- UI: Template editor sidebar — collapsible single-row panels, click empty checkbox to upload, drag/resize in preview, per-format position saved to overlay_config
- Client canvas (`lib/clientRender.ts`): plain `ctx.drawImage`, no tint, renders on square/story/landscape/print via EventsTable → Cloudinary upload flow
- Server video renderer (`/api/renders/generate`): new `buildSponsorLogoLayer()` helper — identical to `buildLogoLayer` minus `e_colorize`. Renders on tiktok + yt_shorts.
- Print PDF (`/api/renders/print-pdf`): `pdf-lib` `embedPng` + `page.drawImage`, native colors via PNG alpha channel.

**Tested on production:** all six formats + print PDF render sponsor logos correctly on first try.

**Key decisions:**
- No-tint confirmed with Tim upfront — sponsor logos render as uploaded. Users are expected to upload a PNG in the color they need.
- Sponsor panels collapse to one-row toggle, matching the Text Color panel footprint. Clicking the empty checkbox opens the file picker directly.
- Click-to-upload on empty toggle + auto-expand on upload success → minimum friction.

**Gotcha: render pipeline confusion mid-Step-6.**
The kickoff doc assumed `/api/renders/generate` drew the band logo on all formats. It doesn't — only videos. For square/story/landscape JPEGs, EventsTable calls `renderPoster()` in the browser canvas and uploads the blob directly to Cloudinary, then POSTs to `/api/renders/save-urls`. The `buildCloudinaryUrl` image path in `/api/renders/generate` is effectively dead code (gets immediately overwritten). Not our job to clean up today, but worth knowing for future work.

**Deferred / open question for Tim:**
Drew tested with a black sponsor PNG on a dark background image — not visible. Kickoff doc says no-tint and that's what shipped. But this is a real usability gotcha. Options for follow-up:
1. Keep strict no-tint + update upload helper text ("upload a PNG in the color you need for your background")
2. Add an optional "tint to text color" toggle per sponsor slot for monochrome logos
Needs Tim's call before next session.

**Next session priorities:**
- Resolve sponsor tint question with Tim
- Tour-level Download All page (`/v/tour/[tourId]`) — dedicated half-day session, still on the board
- Remaining expense tabs (Transport, Food, Gear, Misc, Merch, Promo, Other)

---

## 2026-04-14 — QA session, data-loss fix, and root-cause of daily auth pain

### Shipped

- **QA full-pass report** committed at
  `localizer-qa-reports/2026-04-14_full-qa-pass.md`. Run on the
  Mac mini via `qa-start`. Agent did static code review across 11
  focus areas (primary from QA briefing plus shipped-since-
  April-12 items: sponsor logos, marketing tokens, download-all
  for marketing, onboarding wizard, Localizer billing gate).
  Found 1 HIGH + 1 MEDIUM + 3 LOW + 1 open question. No CRITICAL.
  Live functional testing deferred to a follow-up session.

- **BUG-A (HIGH) — saveFields debounce data loss.** Commit `b75c9a2`.
  `app/dashboard/artists/[artistId]/profile/page.tsx` — the
  debounce in saveFields captured `updates` in the timer closure,
  so rapid Tab-between-fields edits within 600ms overwrote each
  other and only the last-typed field reached the database.
  Affected all 12 flat team columns across manager/tour_manager/
  booking_agent/publicist. Pre-existed commit 12db1b5 (tour_manager
  add) but hit Tour Manager fields identically. Fix: added
  `pendingUpdatesRef` that accumulates across calls, snapshots
  and clears when the timer fires. Same edit also fixed BUG-D
  (missing `.select().maybeSingle()` on the Supabase update +
  missing `res.ok` check on the key_contacts fetch, per Rule #6).
  Verified via hard-reload test on incognito window.

- **PKCE verifier loss on HTTP localhost.** Commit `5255a82`.
  `lib/supabaseClient.ts` — auth cookies set `Secure` flag
  unconditionally. Browsers silently drop Secure cookies on HTTP
  origins, so every magic-link sign-in on localhost dev was
  losing the PKCE code verifier client-side, and the server
  callback failed with "PKCE code verifier not found in storage."
  Fix: compute `IS_HTTPS` from `window.location.protocol` and
  gate the Secure attribute on it in both the `cookieStorage`
  wrapper and `createBrowserClient` cookieOptions. Cross-subdomain
  COOKIE_DOMAIN logic untouched — still applies for production
  hwy61labs.com subdomains. **This was almost certainly the root
  cause of recurring daily magic-link login failures on local dev.**

- **BUG-C (LOW) — marketing viewer artist query.** Commit `df9d1a3`.
  `app/v/m/[token]/page.tsx` — changed `.single()` to
  `.maybeSingle()` on the artists select. `.single()` was
  throwing PGRST116 when `artist_id` was null or the row didn't
  exist, silently discarded since only `data` was destructured,
  but spamming PostgREST logs. Also tightened `(tour as any)` to
  `(tour as Record<string, any>)` on the same line.

### Auth rabbit hole (resolved)

Started the day hitting a stack of auth issues in the non-incognito
browser. Walked through them in order:

1. `drewarrison@gmail.com` was an orphaned `auth.users` row with no
   `org_members` entry. `ensureOrgExists` tried to provision a new
   org and hit RLS 42501. Had one live `marketing_tokens` row
   (`test_marketing_001`). Cleaned up via SQL: deleted the token,
   the org_members row, and the auth user.

2. Google OAuth on `hwy61ai@gmail.com` returned `signup_disabled`
   because Supabase project-level signups are currently off. The
   account has `provider: email` as primary with `google` as a
   linked secondary provider — in that configuration, Google
   OAuth hits gotrue's signup-permission path, which is blocked.

3. Magic link sending failed with "550 The hwy61.ai domain is not
   verified" on Resend. Supabase's sender email was configured
   for `hwy61.ai` (defunct or typo'd) instead of the actual
   verified `hwy61labs.com`. Fixed in Supabase dashboard →
   Authentication → Emails → Sender email.

4. Magic link *then* arrived, but clicking it returned
   `?error=auth`. Root cause: PKCE verifier loss on HTTP (fixed
   via the commit above).

Daily auth pain is almost certainly gone. If it recurs, the most
likely next suspects are the Google OAuth linked-provider path
(still untested after the PKCE fix) and the beta invite gate on
new-user signups (untestable while signups are disabled).

### Deferred / backlog

Added to `docs/BACKLOG.md`:

- BUG-B (stale artist PUT whitelist) — not currently broken,
  single-file fix
- BUG-E (`render_poster_url` dead column) — LOW cleanup,
  schema check confirmed column still exists
- Centralize `ADMIN_EMAILS` constant across 5 files
- Verify new-user signup end-to-end before launch (signups
  currently disabled at Supabase project level)

### Housekeeping

- Archived stale `docs/SESSION_KICKOFF_April_14_2026.md`
  (sponsor logos build kickoff, completed April 14) to
  `docs/archive/`
- Created `docs/QA_RUNBOOK.md` as a reusable guide for running
  QA sessions on the Mac mini. Replaces the per-session
  "State of the Union" pattern.

### Q1 closed

QA report open question about Tim's admin email: confirmed
`tentenpm@gmail.com` is current (not `hwy61regan@gmail.com`).
`ADMIN_EMAILS` arrays already correct. No code change needed.

### Next session priorities

1. Live functional QA pass on the mini covering everything the
   static review deferred: sponsor logo upload + render with
   red/blue PNGs, hotel receipt stacking, fuel estimate
   persistence, advance sheet drag-drop, roster pay calculations,
   onboarding wizard walkthrough, ShareWithMarketingButton UI.
2. Before launch: centralize ADMIN_EMAILS, verify new-user
   signup flow, investigate Google OAuth linked-provider
   behavior.
3. BUG-B fix when Tour Manager field gets surfaced in any flow
   that uses the tourrouter artist API route.


## 2026-04-14 (afternoon + evening) — Backlog cleanup

**Shipped (8 commits):**
- b75c9a2 — BUG-A + BUG-D: saveFields debounce data loss
- fac700b — QA report 2026-04-14
- 5255a82 — PKCE verifier fix on HTTP localhost (root cause of daily auth pain)
- df9d1a3 — BUG-C: .single() → .maybeSingle() in marketing viewer
- da31c98 — docs housekeeping (QA runbook, backlog, session log)
- 640ee13 — BUG-B: expand artist PUT whitelist (12 missing fields) + harden post-update read with .maybeSingle() + 404 on null
- a5c733c — BUG-E closed as misdiagnosis (render_poster_url is a live column on venue_links, written by Print Poster pipeline; low population reflects opt-in format, not dead column)
- fde2452 — refactor: centralize admin email check in lib/auth/adminEmails.ts (3 call sites, pure refactor, preserved venue-download caveat comment)

**Backlog status:** BUG-A, B, C, D, E all resolved. ADMIN_EMAILS centralization done. Today's backlog is clear.

**Follow-ups surfaced this session:**
- **Tour Manager field is unblocked.** The deferred item from Tim's April 12 Localizer UI list noted it needed a DB migration, but tour_manager_name/email/phone columns already exist on the artists table and as of 640ee13 the PUT handler now accepts writes to them. Frontend-only task whenever ready. Tell Tim.
- **Venue-download billing gate caveat** — documented in source as a comment in lib/localizer/billingGate.ts above the isAdminEmail check. Should be ratified by Tim and folded into the billing gate audit backlog item. Currently only captured in code.

**Still open (not touched today):**
- Mapbox write-back silent RLS risk in lib/tourrouter/geocoding.ts (fire-and-forget without .select().maybeSingle())
- Full billing gate audit across 41 API routes (partially done, shared helper design pending Tim input)
- Hardcoded CITY_COORDS in lib/tourrouter/constants.ts (deferred)
- Tour-level Download All page /v/tour/[tourId] (dedicated half-day session, not started)
- Remaining expense tabs (Transport, Food, Gear, Misc, Merch, Promo, Other)
- Onboarding wizard (blocked on Tim's steps + demo data)
- Stripe restructure (blocked on EIN)

**Next session starts with:** Drew to pick from — (a) Tour Manager UI addition (now unblocked), (b) remaining expense tabs following the Accommodation pattern, (c) tour-level Download All page if ready for a dedicated session, or (d) cat docs/BACKLOG.md first to see if there are items we haven't looked at.

**Key learning reinforced today:** Grep-verify before editing. BUG-E would have broken tour poster downloads for 9 venue_links if we'd trusted the backlog note and stripped the column references. The DB query + grep caught it in under a minute.


## 2026-04-15 — Localizer render bugs + Tim catch-up + bulk send proposal

**Shipped (5 commits):**
- 2a07a68 — docs: session kickoff April 15
- 2ba4626 — fix: change null-URL placeholder from 'Rendering soon' to 'Not provided' (app/v/e/[token]/page.tsx + app/v/m/[token]/page.tsx)
- a39d5be — fix: honor venue/city/date visibility toggles in saved renders (lib/clientRender.ts + app/api/renders/generate/route.ts both blocks + app/api/renders/print-pdf/route.ts)
- 8dd7c28 — docs: status update for Tim 2026-04-15 (delta off the April 14 catch-up)
- 31f68d5 — docs: add bulk send proposal to backlog with build constraints

**Bugs fixed:**

1. **"Rendering soon" was misleading** on venue/marketing pages. The text appeared whenever a render URL was null, but in practice that almost always means the user never uploaded a source for that format, not that a render is in progress. Changed to "Not provided" in both `/v/e/[token]` and `/v/m/[token]`. Pure copy fix.

2. **Visibility toggles ignored in saved renders.** The April 11 commit (495f898) wired showVenue/showCity/showDate flags into the template editor preview and the on-screen draggable overlay, but missed all four downstream render paths. Toggles worked at design time but were silently ignored at render time — every saved JPEG/video/PDF drew all three fields regardless. Wired the flags into all four paths (Canvas in clientRender.ts, both Cloudinary builders in generate/route.ts, pdf-lib in print-pdf/route.ts) using the same `?? true` default pattern as the editor preview, so existing tours behave identically.

**Tour Manager correction:**

Yesterday's Tim doc flagged the Tour Manager Localizer UI as still pending. That was wrong — it shipped April 12 as part of the artist profile page, persists correctly, and both products read from the same source. Today's Tim doc opens with a correction. Future-self: don't re-flag this.

**Lessons reinforced:**

- **Stale `.next` cache strikes again.** Bug 2 testing initially failed (toggle still appeared on saved render). Diagnosed correctly as cache before going down a rabbit hole on save-path or read-path bugs. `rm -rf .next node_modules/.cache` + restart fixed it. The "first diagnostic step" rule paid off.
- **"Worked in the renderer" can mean two different things.** Drew said the toggles worked in the renderer but not the saved output. I initially interpreted "renderer" as the Cloudinary preview URL builder, but Drew meant the draggable overlay on the editor screen. Clarification saved a wrong-direction diagnosis. Worth double-checking ambiguous UI terms early in any bug conversation.
- **Claude Code modified an undisclosed second block** in generate/route.ts (also patched buildCloudinaryUrl, not just buildCloudinaryVideoUrl that was in the prompt). The change was correct (and arguably the right call), but it violated "always show diff before applying." Caught it via `git diff` before commit. Worth flagging Claude Code on next time.

**Tim status:**

Sent (well — wrote, ready for Drew to send) `docs/TIM_STATUS_2026-04-15.md` with three open questions:
1. Sponsor logo tint — strict no-tint + helper text vs optional tint toggle (carried from April 14)
2. Venue-download billing gate caveat — needs ratification (carried from April 14)
3. NEW: Send to All Promoters bulk button proposal with three sub-questions (force re-send checkbox, missing-email handling, button label)

**Bulk send build constraints captured in BACKLOG.md** so when Tim greenlights, the constraints aren't lost (Resend rate limits → serial sends with 200–500ms delay, idempotency, failure handling, reuse single-send route, mandatory confirmation modal).

**Still open (no movement today):**
- Mapbox write-back silent RLS risk in lib/tourrouter/geocoding.ts
- Full billing gate audit (blocked on Tim's helper design)
- Tour-level Download All page (`/v/tour/[tourId]`)
- Remaining expense tabs (Transport, Food, Gear, Misc, Merch, Promo, Other)
- Onboarding wizard (blocked on Tim's wizard steps + demo data)
- Stripe restructure (blocked on EIN)
- Freemium Unit D rate limiting

**Next session starts with:**

Check whether Tim has replied to the April 15 status doc. If yes, prioritize whichever of the three open questions he answers (especially bulk send if greenlit — backlog entry has all the constraints). If no, pick from:
- (a) Mapbox RLS hardening — small, self-contained, ~30 min, same pattern as yesterday's BUG-B/BUG-C
- (b) Tour-level Download All page — dedicated half-day session
- (c) Remaining expense tabs — mechanical work following Accommodation pattern

Working tree clean at session end. 5 commits pushed to main.

## 2026-04-16

**Commits:** 2
- 4e745f2 — fix: harden Mapbox geocoding write-back with .select().maybeSingle() to catch silent RLS rejections
- [kickoff doc commit SHA] — docs: session kickoff April 16

**What shipped:**
- Mapbox write-back RLS hardening (Tier 2A from kickoff doc). `lib/tourrouter/geocoding.ts` now uses `.select().maybeSingle()` after the insert to catch silent RLS rejections, with distinct log strings for each failure mode (`write-back failed`, `write-back silently rejected`, `write-back promise rejected`). City + country included in every log line for grepability. Fix confirmed deployed to prod; zero hits on any of the three strings in Vercel logs after ~15min (expected — write-back has been working, we just couldn't prove it before).

**Tim status:** Still waiting on written reply to April 15 status doc. Discussed items verbally but nothing firm enough to build on. Three open questions still pending: sponsor logo tint, venue-download billing gate caveat, Send to All Promoters bulk button.

**What didn't get done:** Tour-level Download All page (Tier 2B), remaining expense tabs (Tier 2C). Both deferred — Download All wants a dedicated half-day, expense tabs are batchable whenever.

**Next session should start with:**
- Check Tim's email for reply to April 15 status doc
- If reply: build whatever he greenlit (bulk send is highest-impact)
- If no reply: pick between Tier 2B (Download All, half-day commit) or Tier 2C (expense tabs, batchable)
- Optional audit: check Vercel logs for the three `[geocoding]` strings — should still be zero hits; any appearance is a real signal.


## 2026-04-16 (evening update)

**Total commits today:** 11
- 4e745f2 — fix: harden Mapbox geocoding write-back with .select().maybeSingle() to catch silent RLS rejections
- 1f9d529 — docs: session log 2026-04-16 (morning)
- d30ac70 — feat: add lib/supabaseAdmin for public token-based service-role access
- 1894bd9 — fix: /v/e viewer uses supabaseAdmin to allow anonymous access (RLS bypass via token)
- cc0c35b — fix: /v/m viewer uses supabaseAdmin to allow anonymous access (RLS bypass via token)
- 355d050 — fix: /v/tour hub uses supabaseAdmin to allow anonymous access (RLS bypass via token)
- 571165e — fix: /api/download uses supabaseAdmin for public token-based access
- 90a3ec6 — fix: /api/download-all uses supabaseAdmin for public token-based access
- 0e7fe4f — fix: /api/download/marketing uses supabaseAdmin for public token-based access
- 62ba419 — fix: /api/download-all/marketing uses supabaseAdmin for public token-based access
- 337b2b1 — fix: billingGate uses supabaseAdmin so anon download routes resolve plan status correctly

**Warm-up (Tier 2A from morning kickoff):** Mapbox geocoding write-back in lib/tourrouter/geocoding.ts now uses .select().maybeSingle() after insert. Catches silent RLS rejections (the 200-with-null-error pattern). Three distinct log strings for grep-based prod monitoring: "[geocoding] write-back failed", "[geocoding] write-back silently rejected", "[geocoding] write-back promise rejected". Confirmed zero hits in Vercel logs post-deploy — expected, write-back has been healthy, we just now have visibility.

**Major fix — public share system was completely broken for anonymous users.** Surfaced during a live Localizer test pass with Tim. Started with "tour-level Share with Marketing link 404s in a different browser" and widened once we checked RLS policies across the affected tables.

Root cause: every /v/* public viewer page, every /api/download* route, and the billingGate helper were all using supabaseServer() — the cookie-aware, RLS-bound client. When an anonymous user (promoter, venue, anyone without a login) hit these routes, queries ran as the anon Postgres role. RLS on marketing_tokens, events, tours, and artists restricts SELECT to org_members, so anon users got silent empty results and the pages 404'd. The billingGate helper hit the same problem on the orgs table, which caused every public download to return 402 even for paid orgs.

Scope turned out to be 8 files — 3 viewer pages, 4 download API routes, 1 shared billing gate helper. All 8 refactored to use a new lib/supabaseAdmin helper that wraps createClient() with the service role key and disables session persistence. Token validation, URL allow-lists, billing gate logic, and all other business rules stayed intact. Only the Supabase client changed.

venue_links table is the one exception — it already has a "Public can select active venue_links" RLS policy, which is why /v/e/[token] was the least-broken of the three (the token lookup succeeded, then downstream queries to events/tours/artists failed). The other tables (marketing_tokens, events, tours, artists) have no public SELECT policy. Rather than adding anon policies across four tables (broadens attack surface, harder to reason about), chose to use service-role in the specific public code paths where token is the access credential. Cleaner trust model.

Verified end-to-end in Safari (anonymous, no session): tour hub loads ✓, per-event marketing page loads ✓, venue viewer loads ✓, per-asset downloads work ✓, Download All zip works ✓.

**Why this slipped through until now:** Me and Tim have only ever tested public share links while logged in. Cookies leak across tabs; org-member sessions in other browser windows masked the bug. Real external test users never existed, so the auth boundary was never crossed in testing. Structural lesson filed: anything under /v/, /advance/, or /report/ is public and must use supabaseAdmin. Anything under /dashboard/ is authenticated and uses supabaseServer. Worth a future ESLint rule or header-comment convention to enforce.

**Backlog items surfaced by this work (not fixed today):**
- lib/tourrouter/billingGate.ts likely has the same RLS issue for any TourRouter public routes. Check before launch. If so, same one-line fix as lib/localizer/billingGate.ts.
- Comment in billingGate.ts around the /api/download vs admin-bypass behavior was accurate and we kept it — worth re-reading if future auth questions come up.
- Structural: consider adding an ESLint rule or pre-commit check that flags supabaseServer() imports in app/v/**, app/advance/**, app/report/** paths.

**Tim status:** Localizer test pass surfaced 5–6 issues total. Today's session fixed issue #1 (the share-link 404, which expanded into this 8-file public-share refactor). Other 4–5 items not yet triaged in writing — Drew had a verbal conversation with Tim during the test, will reconvene. Tim also said he'd follow up by email on the April 15 status doc (sponsor logo tint, venue-download billing gate caveat, Send to All Promoters proposal — all still open).

**What didn't get done:** Tour-level Download All page (Tier 2B), remaining expense tabs (Tier 2C), and the other 4–5 Tim test-pass issues. All deferred to next session.

**Next session should start with:**
- git pull, git status, confirm clean
- Check Tim's email for written reply on April 15 doc (sponsor tint, billing gate caveat, bulk send)
- Get the written list of the remaining 4–5 issues from Tim's test pass — avoid diagnosing from memory
- Once list is in hand, triage: mechanical fixes batched today-style, anything that needs copy/design input parked for Tim
- Optional: check lib/tourrouter/billingGate.ts to confirm whether it has the same RLS-bound Supabase client as the Localizer one we fixed today, and refactor to supabaseAdmin if so — single-file mechanical change
- Vercel log spot-check on the three "[geocoding] write-back..." strings — should still be zero hits; any appearance is real signal


## 2026-04-16 (final update — late evening)

**Total commits today: 25.** This supersedes the earlier "evening update" entry (4613851).

Evening kept going after the 8-file public-share refactor, through the sponsor tinting epic, into UX polish, Tim's list closers, and ended with a recurrence of the auth "session expired" bug that must be diagnosed before beta launch.

### Commits (chronological)

- 4e745f2 — fix: harden Mapbox geocoding write-back with .select().maybeSingle() to catch silent RLS rejections
- 1f9d529 — docs: session log 2026-04-16 (morning)
- d30ac70 — feat: add lib/supabaseAdmin for public token-based service-role access
- 1894bd9 — fix: /v/e viewer uses supabaseAdmin to allow anonymous access
- cc0c35b — fix: /v/m viewer uses supabaseAdmin to allow anonymous access
- 355d050 — fix: /v/tour hub uses supabaseAdmin to allow anonymous access
- 571165e — fix: /api/download uses supabaseAdmin for public token-based access
- 90a3ec6 — fix: /api/download-all uses supabaseAdmin for public token-based access
- 0e7fe4f — fix: /api/download/marketing uses supabaseAdmin for public token-based access
- 62ba419 — fix: /api/download-all/marketing uses supabaseAdmin for public token-based access
- 337b2b1 — fix: billingGate uses supabaseAdmin so anon download routes resolve plan correctly
- 4613851 — docs: session log 2026-04-16 evening update (superseded by this entry)
- f74b3ea — feat: show grid overlay in template editor during element drag
- ef7c9af — feat: sticky preview column in template editor keeps image visible while scrolling controls
- c7ae35d — feat: tint sponsor logos to text color in template editor preview
- 54c9a9f — feat: tint sponsor logos to text color in client canvas renderer
- 5fef684 — chore: add sharp for server-side PNG tinting in print PDF
- 0ffc607 — feat: tint band and sponsor logos to text color in print PDF via sharp  [later reverted — see de349c2]
- c4c1cfa — chore: extend print-pdf maxDuration 60s -> 300s for sharp cold start
- d095b6f — fix: request weight 700 for Google Fonts in PDF rendering to match preview bold
- de349c2 — Revert "feat: tint band and sponsor logos to text color in print PDF via sharp"
- b87971b — feat: add elapsed-time counter and animated progress bar to PDF download button
- 46fc800 — copy: note that band logo renders in original color on print PDF
- e0ac96a — copy: update sponsor logo helper text to reflect web tint vs print PDF native color
- ea950ee — copy: roster drag-drop hint + footer 'HWY61 LABS' branding parity

### What shipped

**Morning warm-up.** Mapbox geocoding write-back in lib/tourrouter/geocoding.ts hardened with `.select().maybeSingle()` and three distinct error log strings for greppable prod monitoring. Zero hits on those strings post-deploy as expected — write-back has been healthy, we now have visibility.

**Midday public-share auth refactor (8 files).** Full detail in earlier part of this log. In short: the entire /v/* viewer pipeline + all four /api/download* routes + billingGate helper were using supabaseServer() (cookie-aware, RLS-bound). Anonymous users — anyone without an org_member session — hit RLS walls and got silent 404s. Had been broken for anon users since day one; only worked for Drew and Tim because we tested logged-in with cookies leaking across tabs. Refactored all 8 to new lib/supabaseAdmin (service role, token validation remains in app code). Verified end-to-end anonymous in Safari.

**Afternoon Tim-test-pass UX polish.**
- Video upload progress bar on Localizer assets page — XHR progress events, 2 video slots (TikTok + yt_shorts). Image uploads unchanged.
- Drag-only grid overlay in template editor — 10x10 crimson grid, only visible during an element drag.
- Sticky preview column in template editor — image preview stays pinned while controls scroll.

**Evening sponsor logo tinting epic.**
- Sponsor logos now tint to text color in preview (CSS mask + hidden img for aspect sizing).
- Sponsor logos now tint in downloaded JPEGs (offscreen-canvas source-in composite, mirroring band logo pattern).
- Installed sharp, shipped print-pdf tinting, reverted after discovering ~100+ seconds of sharp cost per request on Vercel (even warm).
- Also fixed pre-existing Google Fonts weight bug in lib/fetchFont.ts — URL now includes `:wght@700` to match preview. PDF text now renders correctly bold. Tradeoff: took print-pdf from 5-8s pre-today to 24s post-today. Known regression, worth investigating.
- PrintDownloadButton got an elapsed-time counter + animated crimson striped bar + "up to 30 seconds, don't refresh" subtitle for graceful 24s wait.
- Added copy at both upload points explaining original-color-on-print-PDF behavior.

**Tim's list closers (session final).**
- Roster drag-drop hint under "+ ADD CREW MEMBER" button in RosterSection.
- Venue share page footer now reads "HWY61 LABS" (crimson + dark) and "POWERED BY HWY61 LABS" to match header branding.

### Final print PDF state

| Surface | Band Logo | Sponsor Logos | Text Weight |
|---|---|---|---|
| Preview | tinted | tinted (new) | correct |
| Downloaded JPEGs | tinted | tinted (new) | N/A |
| Print PDF | native color (documented in UI) | native color (documented in UI) | bold (fixed today) |

### ⚠️ CRITICAL — auth bug recurrence, MUST fix before beta launch

"Session expired" + "can't log in without clearing cache" hit on prod late evening. 4th day in a row. The April 14 PKCE fix (5255a82) addressed the HTTP-localhost magic-link vector but not this production symptom.

**Investigated tonight:**
- middleware.ts uses `getSession()` correctly in both gates. Not the known anti-pattern.
- The only `getUser()` call is in /auth/callback/route.ts — appropriate for server-verifying the magic-link token, not a bug.
- Vercel logs during the affected window: no auth errors visible.
- Symptom clears with browser cache clear (standard workaround, not acceptable for users).

**Did NOT patch tonight.** No clear architectural root cause to point at, fatigue + 22 auth-adjacent commits shipped earlier made midnight middleware edits too risky. Shipping a guess would have been worse than not shipping.

**This is a beta-launch blocker.** Localizer-only beta is starting very soon. A beta user seeing "session expired" with only "clear your cache" as a workaround will churn immediately.

**Tomorrow's diagnostic plan:**
- Supabase dashboard audit — JWT expiry, refresh TTL, site URL, redirect URLs, any rate-limit or cookie-related settings
- Live reproduction with browser DevTools open — inspect the actual Supabase cookies during "session expired" state; note which are present, expired, or missing
- Cookie domain scoping check — subdomain migration left `.hwy61labs.com` leading-dot cookies; verify they're set correctly across all subdomains and the root domain
- Test Google OAuth linked-provider path — flagged April 14 as untested
- Audit whether any April 16 supabaseAdmin commit indirectly affected session cookie handling (shouldn't have, but verify)
- Single-tab test — if bug vanishes with only one prod tab open, refresh-token race between tabs is the cause

### Backlog carried from today

1. **Print PDF logo tinting done right.** Pre-tint at upload time with sharp (already installed), save tinted variant to Supabase, render PDF fetches pre-tinted bytes. Zero sharp cost at render time. Needs design thinking on how to handle text-color variance.
2. **Print PDF generation speed (5-8s → 24s).** Caused by `:wght@700` Google Fonts fetch. Cache TTF server-side, pre-bundle common weights, or find a lighter pattern.
3. **Cloudinary video overlay sponsor logo tinting.** One-line `e_colorize` addition in buildSponsorLogoLayer in app/api/renders/generate/route.ts.
4. **ESLint rule:** flag `supabaseServer()` imports in app/v/**, app/advance/**, app/report/** paths.
5. **lib/tourrouter/billingGate.ts** likely has the same RLS issue as the Localizer one we fixed today. Check before TourRouter launch.

### Tomorrow's session starts with

- `git pull`, `git status`, confirm clean
- **FIRST PRIORITY:** auth bug diagnostic (detailed plan above). Beta-blocker. Do not start anything else until this is resolved or has a clear fix path.
- Then check Tim's email for April 15 status doc reply (sponsor tint, billing gate caveat, bulk send proposal)
- Get written list of remaining Tim test-pass items — avoid diagnosing from memory
- Optional: `npm i -g @anthropic-ai/claude-code` or `claude doctor` — auto-update has been failing all day


## 2026-04-17 (Friday)

### Commits

- 0ea670c — fix(auth): scope server-side auth cookies to .hwy61labs.com
- fc78536 — fix(artist profile): correct band logo caption
- 5840581 — fix(template editor): clarify sponsor logo render-color caption
- befd344 — fix(tourrouter): use supabaseAdmin in billingGate for RLS-free plan lookup
- a98b34c — build(eslint): ban supabaseServer imports in public-facing routes
- 66d7575 — docs: add three backlog entries from 4/17 ESLint rule work

### Auth bug — diagnosed, fixed, verified

The "session expired, cache clear required" bug that was yesterday's BETA BLOCKER has a root cause and a shipped fix.

**Root cause.** Cookie domain scope mismatch between browser and server-side Supabase clients. The browser client (lib/supabaseClient.ts) was correctly scoping auth cookies to `.hwy61labs.com` (leading dot, subdomain-wide). But three server-side cookie writers — middleware.ts, lib/supabaseServer.ts, and app/auth/callback/route.ts — were not passing any `domain` attribute in their cookie options, defaulting to host-only scope (e.g. `www.hwy61labs.com`, no dot). Result: every browser accumulated two cookie sets with the same name but different scopes, each holding a different refresh token. When access tokens expired (~1hr), whichever code path read one cookie would rotate that token against Supabase; the other cookie held the now-stale refresh token. Next code path that read the stale cookie presented it to Supabase, got `400 refresh_token_already_used`, and — because "Detect and revoke compromised refresh tokens" is ON in Supabase (correct default) — the entire token family was revoked. Session dead. User bounced to /login. Cache clear "fixed" it because it deleted both duplicate cookies, and next login created a single fresh cookie set — which would itself eventually drift apart within a few refresh cycles.

This was invisible in Vercel logs because the 400s were happening at Supabase's /auth/v1/token endpoint, not in our code. Visible in Supabase → Logs → auth_logs as `refresh_token_already_used` events. We pulled 200 of them in a 24h window before the fix.

**Diagnostic path.** Supabase dashboard audit ruled out JWT expiry, inactivity timeout, rate limits, stale redirect URLs — all clean. Auth logs confirmed `refresh_token_already_used` as the exact failure mode. Browser DevTools cookie inspection confirmed the duplicate cookie sets (`.hwy61labs.com` AND `www.hwy61labs.com` both holding `sb-*-auth-token.0` and `.1`), each with different refresh tokens and expiry times 59 seconds apart — unambiguous evidence of two separate refresh operations writing to different scopes.

**Fix.** Added lib/cookieDomain.ts helper that returns `.hwy61labs.com` when the host ends with hwy61labs.com, undefined otherwise (so localhost still gets host-only cookies — browsers reject `Domain=.localhost`). Threaded it through all three server-side cookie writers. Single atomic commit 0ea670c. After deploy, manually revoked all refresh tokens (`delete from auth.refresh_tokens` in Supabase SQL editor) so existing broken sessions would die and re-login under the new code.

**Verification.** Fresh login showed exactly one cookie set scoped to `.hwy61labs.com`. No duplicates. Now soak-testing in a single open tab through the rest of today; full 24h confirmation via `auth_logs` query tomorrow morning.

### Other work

**Copy fixes on Tim's list** (fc78536, 5840581). Two small corrections to captions that went in wrong yesterday: band logo caption on the artist profile page (was showing sponsor-logo-style helper text under the band logo block — swapped for "Band Logo (upload transparent png)"), and sponsor logo render-color caption on the template editor (clearer two-sentence explanation of the all-assets-vs-Local-Poster-PDF behavior). Tim's broader list from the verbal test pass still pending a written reply — deferred.

**TourRouter billingGate RLS fix** (befd344). Same class of bug as yesterday's Localizer refactor. lib/tourrouter/billingGate.ts was using supabaseServer() to read orgs plan-status rows — session-bound, RLS-enforced. In paths where session context was stale or missing, RLS silently returned zero rows and the gate returned `'none'`, denying access to legitimately paid users. lib/tourrouter/requireAccess.ts had a defensive warn-and-fall-back-to-free workaround that was papering over this. Swapped billingGate to supabaseAdmin (mirrors lib/localizer/billingGate.ts, the Localizer twin fixed 4/16), upgraded the now-defensive fallback from console.warn to console.error with a "data integrity" message so if it ever fires post-fix, we notice. Two-file change, typecheck clean, shipped together.

**ESLint safety net** (a98b34c). Added a `no-restricted-imports` rule to eslint.config.mjs that bans `@/lib/supabaseServer` imports in five forbidden zones: app/v/**, app/advance/**, app/report/**, app/api/download/**, app/api/download-all/**. These are the paths that serve anonymous/token-authenticated public users, where supabaseServer() causes the silent-RLS-fail bug we've now fixed twice this week. Verified zero violations at commit time — yesterday's 8-file refactor left all five zones clean. Rule is pure future-regression prevention.

### Auth bug soak test — not yet complete

Fresh-login cookie state verified clean. But the failure mode needs multiple hours and multiple refresh cycles to manifest. Leaving a prod tab open overnight; tomorrow morning confirm via:

```sql
select timestamp, event_message, metadata
from auth_logs
order by timestamp desc
limit 200
```

in Supabase Log Explorer — count of `refresh_token_already_used` occurrences in the post-fix 24h window should be near-zero.

### Deferred to backlog

Added three new entries to docs/BACKLOG.md (commit 66d7575):
1. /api/venue-link missing auth.getUser() check — security hygiene, not urgent
2. /api/venue-links has zero call sites — likely dead code, verify via Vercel invocation logs before deletion
3. ~20 pre-existing lint errors/warnings in the public-viewer zones — mechanical cleanup, ~30-45min, no Tim input needed

### Tomorrow's session starts with

- `git pull`, `git status`, confirm clean
- **Verify auth fix held overnight:** run the auth_logs SQL query, confirm `refresh_token_already_used` count dropped. If clean, mark the bug closed. If it reappeared, we're back in diagnostic mode with a different subcause — the current fix addresses the duplicate-cookie-scope path but there could be a secondary path we haven't seen yet.
- Check email for Tim's reply to the April 15 status doc + his written list of remaining test-pass items
- If both above are resolved, pick next backlog item. Candidates in priority order: (a) print PDF speed regression from 4/16 `:wght@700` fetch, (b) print PDF logo tinting done right via pre-tint-at-upload, (c) any of the three new backlog entries if a quick win is wanted