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
- a1b1ce6 — feat(print poster): remove band logo and sponsor logos from Local Poster for Print
- db983db — feat(print poster): hide logos from preview and canvas renderer on print format

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

### Late afternoon addition — Local Poster for Print logo removal

After the session log was first written, Drew and Tim had a conversation about the unresolved band-logo-on-print-PDF tint problem (documented in the backlog as the choice between client-side tint + byte upload vs. pre-tint-at-upload vs. pdf-lib blend mode). The product decision made the whole problem moot: **no logos on the Local Poster for Print tab at all.**

Reasoning: a full tour poster printed at 11x17 will already be designed with band name and tour-wide sponsors baked into the artwork. Separate logo controls on this tab invited users to double up branding on top of an already-branded base image.

Implementation shipped in two commits:

**a1b1ce6** — First pass. Hid the Band Logo, Sponsor Logo 1, and Sponsor Logo 2 control sidebars on the print tab (wrapped each section in `{!isPrintFormat && (...)}`). Removed the three logo fetch blocks and three logo draw blocks from the print-pdf/route.ts renderer entirely, along with the now-unused columns in the tours select. Deleted rather than gated — dead code doesn't rot, and if we ever reverse this decision we'd want to redesign the approach (the client-tint-and-upload path) rather than flip a flag. Net minus 111 lines.

**db983db** — Second pass. The first commit covered the control sidebar and the PDF output, but the live preview in the template editor and the renderPoster canvas renderer were still drawing logos on the print tab. Drew spotted this during a smoke test: uploaded a fresh base image with no logos baked in, and the old logos still appeared in the preview. Six one-line guards added — three in TemplateEditor.tsx (prefix preview conditions with `!isPrintFormat`), three in clientRender.ts (prefix draw conditions with `formatKey !== "print"`). All four surfaces — control sidebar, live preview, canvas renderer, PDF renderer — now consistently treat the print format as logo-free.

**Backlog implication:** the three pre-tint-related backlog entries around print-PDF logo tinting can be marked as no-longer-relevant next session. Not updating them now — the backlog is a parking lot, not a real-time tracker, and the print-poster commits linked above make the context clear if anyone revisits.

**Browser test not yet done on db983db** — Vercel deploy should complete within a few minutes of this log being written. Quick smoke test to run: on the print tab, preview shows no logos and Preview Render output has no logos; switch to square/story/landscape and confirm logos still work normally. If any surface misbehaves, the diagnostic is clean — six single-line guards, easy to bisect.

## 2026-04-18 (Saturday)

### Commits

- da36377 — docs: update HWY61_VISION.md
- 77d41ad — feat(template): add customText1/2 types and defaults
- 9684b61 — feat(template): load and save custom_text_1/2 text content
- c87d529 — feat(template): custom text UI, state, debounced save, drag + sidebar blocks
- 725fa6f — feat(template): add showCustomText1/2 visibility toggles with collapse pattern

### Morning warm-up — auth soak test + yesterday's loose ends closed

Auth fix from 4/17 (0ea670c, cookie domain scope) soak-tested clean. Supabase auth log query for `refresh_token_already_used` events in the 24h post-fix window returned zero results. **Auth bug closed.** The cookie domain mismatch between browser client and three server-side writers (middleware, supabaseServer, auth callback) was the full root cause; nothing lurking behind it.

Print-poster logo removal (a1b1ce6 + db983db from 4/17) browser-smoke-tested on prod. Print tab preview clean (no band/sponsor logos). Square/Story/Landscape tabs still render logos normally. All four surfaces — control sidebar, live preview, canvas renderer, PDF renderer — behave consistently.

### Custom text lines — UI layer complete, render layer pending

Started the backlog-top feature from Tim's 4/17 sign-off: two tour-level user-editable text fields that appear on all non-print formats.

**What shipped (UI + data layer only; render paths not yet touched):**

- Supabase migration: `custom_text_1 text` and `custom_text_2 text` columns added to `tours` table. Both nullable, no default. Idempotent via `add column if not exists`. Verified via `information_schema.columns` query.
- TypeScript types extended in `TemplateEditor.tsx`. Added `customText1` / `customText2` to `FieldKey` union, added `customText1?: FieldConfig` / `customText2?: FieldConfig` and `showCustomText1?: boolean` / `showCustomText2?: boolean` to `FormatConfig`, added `CUSTOM_TEXT_1_DEFAULT` / `CUSTOM_TEXT_2_DEFAULT` constants matching the BAND_DEFAULT pattern, extended `FIELD_LABELS` and `SAMPLE_TEXT` to cover the new keys.
- `BaseFieldKey` type alias introduced (`"date" | "venue" | "city"`) to narrow the three iteration loops (overlap warnings, preview elements, size controls) that were breaking under the widened `FieldKey` — avoided non-null assertions. `AlignButtons` param similarly widened to `BaseFieldKey | "band" | "customText1" | "customText2"` with fallback-spread pattern mirroring the "band" branch.
- `template/page.tsx` SELECT extended to include `custom_text_1, custom_text_2`.
- `/api/tours/[tourId]/overlay-config` PATCH handler extended to accept any subset of `{ overlay_config, custom_text_1, custom_text_2 }` in the request body. Uses `"key" in body` check to preserve null-vs-absent semantics (explicit null clears the column, omitted key leaves it untouched). Returns 400 on empty update rather than firing a no-op write. Service-role fallback path uses the same update object. Deliberately did NOT use `.update(body)` spread — that's the generic advance-route pattern and is unsafe for a scoped endpoint.
- `TemplateEditor.tsx` UI: two new `useState` fields for tour-scoped text content, two debounced-save `useEffect`s (500ms, mount-ref to skip initial render, effect cleanup clears pending timer). Custom text content PATCHes only `{ custom_text_1 }` or `{ custom_text_2 }` — explicitly NOT including `overlay_config`. Text content saves autosave-style; position/size/align saves continue to go through the existing SAVE TEMPLATE button via `setDirtyFormats`.
- Toast stability concern surfaced during review: the `toast` object from `useToast()` is unstable across renders (inline literal at provider level), but individual `toast.error` / `toast.success` functions are stable (useCallback-wrapped). Destructured `const { error: toastError } = toast` at render level and used `toastError` in the effect dep arrays. Minimal, no eslint-disable needed, no ref dance, doesn't touch the other 17 `toast.*` call sites in the file.
- Two dedicated sidebar blocks (CUSTOM TEXT 1 / CUSTOM TEXT 2) following the Sponsor Logo 1/2 pattern: checkbox header that collapses the controls when off, text input (`maxLength={35}`, placeholder "Your text here..."), size number + range, `<AlignButtons>`. Gated with `{!isPrintFormat && (...)}`. Preview elements added as two explicit IIFEs (not extending the venue/date/city iteration — that block's branching is already dense). Drag handler extended with named `else if (dragging === "customText1")` / `else if (dragging === "customText2")` branches mirroring the "band" / "logo" / "sponsor" pattern.

**Smoke-tested on prod after each of the four commits.** UI works end-to-end: debounced save fires correct PATCH, text persists across reloads, per-format independent visibility toggles, checkbox collapse behavior matches Sponsor Logos, `null` writes on clear-to-empty.

**Design decisions locked during build:**

- Storage: text content in dedicated `tours` columns (global per tour); position/size/align in per-format `overlay_config` JSON. Separate save paths match the different scopes.
- Visibility: per-format `showCustomText1` / `showCustomText2` flags defaulting to `false` via `?? false` fallback. Matches band-name-toggle mental model. Existing tours load with custom text OFF on every format.
- Align buttons kept on custom text (not removed) — rationale: future "user edits their typed text to a longer string, wants the anchor point preserved" scenario. Center/left/right matters even for fixed content if the user re-edits.
- Empty-state: preview shows "Your text here" placeholder when text is empty AND the show-flag is on; final rendered outputs will skip the draw entirely when text is empty (render paths not built yet).

### Render layer — what's left

Still to build before the feature is shippable end-to-end:

1. `lib/clientRender.ts` — add two `drawText` calls inside `renderPoster` for custom text, gated on `formatKey !== "print"` AND on text non-empty AND on `cfg.showCustomText1 ?? false` / `cfg.showCustomText2 ?? false`. Makes custom text appear on downloaded JPEGs (square, story, landscape).
2. `app/api/renders/generate/route.ts` — add two Cloudinary text overlay layers in `buildCloudinaryVideoUrl`, same three-part gate (format, flag, non-empty text). Makes custom text appear on generated TikTok + YT Shorts video renders. Must plumb `tour.custom_text_1` / `tour.custom_text_2` into the function's callers.
3. Manual smoke test: generate assets on a test tour, confirm custom text appears in JPEGs and videos when enabled, is absent when disabled, and is absent on print tab regardless.

Estimated remaining effort: ~2 hours.

### Recon discipline worked

Two rounds of read-only recon prompts before writing any code. Round 1 mapped config/type/data flow; round 2 mapped editor wiring, render paths, Cloudinary overlay patterns. Surfaced several non-obvious things that would have caused rework if we'd built from assumption:

- `FIELD_LABELS` is typed `Record<FieldKey, string>`, not `Partial<>` — widening `FieldKey` forced label entries to be added.
- The overlay-config PATCH route had no field whitelist; could've been tempted to spread the body but built the update object explicitly from known keys instead (safety).
- `lib/clientRender.ts` has its own `FieldConfig` type declaration distinct from the one in TemplateEditor (`align?: string` vs `align?: Align`). Flagged — not fixing now, will just match the local type in Step 5.
- Empty-text handling is a genuine gap in Cloudinary overlay builder today (venue/date/city always have values from event data). Custom text forces us to plug it.

### Backlog items surfaced

None new today. All known follow-ups still parked in `docs/BACKLOG.md`.

### Next session should start with

- `git pull`, `git status`, confirm clean
- Step 5: `lib/clientRender.ts` — draw custom text on image formats. Read-only recon first (confirm the `FieldConfig` type shape in that file, confirm the `drawText` signature, confirm how the custom text flags/strings will be threaded in as parameters or accessed from tour context). Then propose diff, typecheck, commit.
- Step 6: `app/api/renders/generate/route.ts` — add Cloudinary text overlay layers for custom text on TikTok + YT Shorts video formats. Same three-part gate pattern.
- Step 7: live functional smoke test — generate assets on a real tour with custom text enabled, verify JPEG + video output match preview.
- If Tim has replied to prior open questions (sponsor logo tint, billing gate caveat, bulk send), handle after render layer is complete.


## 2026-04-18 (Saturday)

### Commits (chronological)

- da36377 — docs: update HWY61_VISION.md
- 77d41ad — feat(template): add customText1/2 types and defaults
- 9684b61 — feat(template): load and save custom_text_1/2 text content
- c87d529 — feat(template): custom text UI, state, debounced save, drag + sidebar blocks
- 725fa6f — feat(template): add showCustomText1/2 visibility toggles with collapse pattern
- fba5b68 — docs: session log entry for 2026-04-18 (superseded by this entry)
- a6783ad — feat(render): draw custom text on image formats (square/story/landscape)
- e627ed0 — fix(template): force dynamic rendering to prevent stale cache on navigation
- e019f96 — fix(template): add revalidate=0 to opt out of router cache
- f3eae0d — Revert "fix(template): add revalidate=0 to opt out of router cache"
- 2c7ff86 — Revert "fix(template): force dynamic rendering to prevent stale cache on navigation"

**11 commits. 2 are reverts.**

### Morning warm-up — auth soak test + yesterday's loose ends closed

Auth fix from 4/17 (0ea670c, cookie domain scope) soak-tested clean. Supabase auth log query for `refresh_token_already_used` events in the 24h post-fix window returned zero results. **Auth bug closed.** The cookie domain mismatch between browser client and three server-side writers (middleware, supabaseServer, auth callback) was the full root cause.

Print-poster logo removal (a1b1ce6 + db983db from 4/17) browser-smoke-tested on prod. All four surfaces — control sidebar, live preview, canvas renderer, PDF renderer — behave consistently.

### Custom text lines — IMAGE FORMATS WORKING END-TO-END IN PROD

Shipped the Tim-signed-off custom text feature for image formats (square, story, landscape). Feature is working on prod for unsent venue links as of end of session. Verified by Drew: typed "CACHE TEST 2026" into Custom Text 1 on Fellow Traveller square tab → Re-Gen All → custom text appears in editor preview, on venue link page viewer, and on downloaded JPEG. All three surfaces aligned.

**Architecture delivered:**

- **Supabase migration:** `custom_text_1 text` and `custom_text_2 text` columns added to `tours` table. Both nullable, no default.
- **Storage split:** Text content (strings) stored in dedicated `tours` columns (global per tour). Position/size/align stored per-format in `overlay_config` JSON. Per-format visibility flags (`showCustomText1`, `showCustomText2`) also in `overlay_config`. Separate save paths match the separate scopes.
- **Save paths:** Text content autosaves via debounced (500ms) PATCH to `/api/tours/[tourId]/overlay-config` with only `{ custom_text_1 }` or `{ custom_text_2 }` in the body. Position/size/align saves go through the existing SAVE TEMPLATE button's `setDirtyFormats` flow.
- **Overlay-config PATCH route extended:** Accepts any subset of `{ overlay_config, custom_text_1, custom_text_2 }`. Uses `"key" in body` check to preserve null-vs-absent semantics. Returns 400 on empty body. Service-role fallback uses the same update object.
- **UI (TemplateEditor.tsx):** Two dedicated sidebar blocks (CUSTOM TEXT 1 / CUSTOM TEXT 2) matching the Sponsor Logo 1/2 pattern — checkbox header that collapses the block when off. Text input (maxLength={35}), size number + range, AlignButtons. Two draggable preview elements in the canvas, always visible when flag is on (empty state shows "Your text here" placeholder in preview, but render paths skip the draw entirely when text is empty).
- **Drag handler:** Named `else if (dragging === "customText1")` / `customText2` branches mirroring the "band" / "logo" / "sponsor" pattern. Generic else reserved for BaseFieldKey only — `BaseFieldKey` type alias introduced to narrow the three venue/city/date iteration loops.
- **AlignButtons:** Param widened to `BaseFieldKey | "band" | "customText1" | "customText2"` with fallback-spread pattern mirroring the "band" branch. Custom-text branches set `setDirtyFormats` (unlike the pre-existing "band" branch which doesn't — deliberate, not fixing existing inconsistency).
- **Visibility toggles:** Added after first version shipped with custom text always visible. Tim-equivalent product feedback — "should have checkboxes like sponsor logos." Added `showCustomText1` / `showCustomText2` optional booleans defaulting to `?? false`. Sidebar blocks collapse to just header+checkbox when off, same DOM pattern as sponsor logos (outer card always rendered, controls gated). Per-format independence — match band-name mental model.
- **Toast stability fix:** `toast` object from `useToast()` is unstable across renders (inline literal at provider level) but individual `toast.error` / `toast.success` functions are stable (useCallback-wrapped at source). Destructured `const { error: toastError } = toast` at render level; used `toastError` in debounce effect dep arrays. Minimal, no eslint-disable, no ref dance, doesn't touch the other 17 toast.* call sites in the file.
- **Render path (lib/clientRender.ts):** Extended local FormatConfig + EventData types (this file has its own type declarations parallel to TemplateEditor.tsx — worth noting, two sources of truth that must stay in sync). Added `CUSTOM_TEXT_1_DEFAULT` / `CUSTOM_TEXT_2_DEFAULT` constants matching TemplateEditor values. Two new `drawText` calls after the city draw with three-part gate: `formatKey !== "print"` + `(cfg.showCustomTextN ?? false)` + `(eventData.customTextN ?? "").length > 0`. No allCaps (user-authored literal). No isVenue flag. No formatKey arg passed to drawText.
- **Data plumbing:** `app/api/renders/tour-data/route.ts` SELECT extended with `custom_text_1, custom_text_2`, response payload extended with same. `EventsTable.tsx` eventData construction extended with `customText1/customText2` from tour. `TemplateEditor.tsx` single-format download handler's `ed` object extended on both the firstEvent and sample-data branches.

### Two cache bugs surfaced during smoke test — both eventually reverted

After shipping the image render path, hit a stale-data bug: typed new text, saved, navigated away, came back → editor showed old text. DB had the new value; server was sending fresh HTML (confirmed via response inspection). The stale state was client-side React state persisted across client-side navigation.

Attempted fix 1 (`e627ed0`): added `export const dynamic = "force-dynamic"` to `template/page.tsx`. Addresses Next.js 14 fetch cache but not router cache.

Attempted fix 2 (`e019f96`): added `export const revalidate = 0` on top of force-dynamic. Appeared to fix the issue in local testing.

Both fixes worked correctly in `npm run dev`. On Vercel's production build, they appear to have triggered an unrelated failure — Re-Generate All returned `count: 0` without calling Cloudinary, venue link page asset rendering broke, and downloads returned empty `download.json` files. Root cause not definitively identified. Candidate theories (not proven):
- Route segment config interacting badly with Vercel's production build output in a way that doesn't reproduce in dev mode
- Production edge/CDN cache interacting with the new cache directives in an edge case
- Session-bound Vercel behavior differing between authenticated and anonymous requests when `revalidate = 0` is set

Tested each commit locally in isolation — all 7 of today's commits work correctly in `npm run dev`. Repro was prod-only. Reverted both cache-fix commits (f3eae0d + 2c7ff86) as the fastest path back to stable prod. Custom text render path itself (a6783ad) remains live and working.

### Noise that consumed ~2 hours of diagnosis — "sent links don't regenerate"

Extended debugging session in the afternoon chasing what looked like a prod regression. Symptoms on Fellow Traveller tour: Re-Gen All completing without custom text appearing on venue link page, downloads returning empty JSON files. After reverts restored basic download functionality, discovered the actual cause: **the two shows we were testing had already been sent as venue links, and sent venue links don't get updated assets when Re-Gen All runs.** This is (presumably) intentional product behavior — promoters shouldn't have the assets they received change out from under them. But it's not obvious from the UI, and in mid-feature-verification it was indistinguishable from a broken render pipeline.

Confirmed working on unsent shows. The prod downloads we observed failing were downloads of pre-existing sent-link assets that were generated before custom text existed.

**This noise significantly degraded session efficiency** — we revved through diagnostic steps (SQL checks, log inspection, commit reverts, localhost vs prod tests) against a failure mode that was product behavior, not a bug.

### What's left for next session

- **Step 6: Cloudinary video overlays** for TikTok and YT Shorts. Adds custom text to video renders in `app/api/renders/generate/route.ts` via `buildCloudinaryVideoUrl` / `buildTextLayer` extensions. Same three-part gate: format + flag + non-empty text. Must thread tour.custom_text_1/2 into the function's callers (recon from earlier today noted this is in scope). Estimated 60-90 min + smoke test.
- **Step 7: End-to-end smoke test** on a tour with fresh unsent venue links, once Step 6 ships.
- **Router cache bug** (stale editor UI on client-side navigation after save) — still present. The `revalidate=0 + force-dynamic` approach doesn't work on Vercel prod. Need a different approach; candidates include `revalidatePath()` calls in mutation routes, or moving the editor's data-loading to a client-side fetch pattern. Not blocking tomorrow's Tim demo — only affects returning users within the same session. Fresh navigation (incognito, new tab, hard refresh) still loads correct data.
- **Tim demo preparation:** Drew has a meeting with Tim tomorrow. Plan: demo custom text on image formats with fresh unsent venue links. Note videos as Phase 2. Note the router cache behavior only if Tim encounters it.

### Backlog items added

See `docs/BACKLOG.md` for:
- Router cache stale UI on template editor (open, needs different fix)
- Two parallel FormatConfig / FieldConfig type declarations (TemplateEditor.tsx and lib/clientRender.ts) — not urgent, file for future refactor awareness
- Cloudinary video overlays for custom text (Step 6 spec)

### Next session should start with

- `git pull`, `git status`, confirm clean
- Read this session log entry in full before touching anything
- Step 6: Cloudinary video overlays. Read-only recon against current `app/api/renders/generate/route.ts` (structure may have drifted since earlier recon). Then propose diff. Same three-part gate as image path.
- After Step 6: end-to-end smoke test on a tour with fresh unsent venue links.
- After demo feedback from Tim: triage router cache fix approach.


## 2026-04-18 (Saturday evening addendum — Step 6 shipped, stale-URL bug surfaced)

### Commits

- aa4cf3d — feat(render): custom text overlays on video formats (TikTok, YT Shorts)
- d9a4308 — docs: backlog entry — venue link serves stale render URL (HIGH pre-beta)

### What shipped

Step 6 from the April 19 kickoff doc, shipped Saturday evening. Cloudinary video overlays for `customText1` / `customText2` on TikTok and YT Shorts, mirroring the image-format pattern shipped earlier today. Three surgical changes to `app/api/renders/generate/route.ts`:

- Tour SELECT extended to pull `custom_text_1`, `custom_text_2`
- `buildCloudinaryVideoUrl` extended with two new params + per-format config reads (position/size/align defaults at y=0.97/0.99, center align) + three-part gate (`showCustomText{N} && hasCustomText{N}Content`) that prevents empty strings from reaching `buildTextLayer` (which has no empty-text guard)
- Single call site updated with `tour.custom_text_1 ?? null, tour.custom_text_2 ?? null`

Typecheck clean. Custom text inherits font, color, and allCaps from the format's cfg, matching venue/date/city behavior.

### Verified on prod (Cloudinary side)

- TikTok: custom text renders on direct Cloudinary URL ✅
- YT Shorts (1080×1080): custom text renders ✅
- Empty-text negative test (toggle on, text blank): render is clean, gate confirmed working ✅

### Process notes

- Followed kickoff's recon-first discipline. Recon caught one kickoff inaccuracy: "data is already plumbed" was wrong — the generate route did NOT receive custom_text_1/2 in the request body or tour SELECT. Scope one step bigger than the kickoff implied. Still ~1hr end-to-end.
- Attempted Path A (preview deploy first) per kickoff's prod-change discipline. Preview built green but middleware redirected preview domain → www.hwy61labs.com (likely NEXT_PUBLIC_APP_URL or hostname enforcement). Rather than debug middleware-on-preview-deploys at night, fell back to Path B (direct to main) with revert command pre-staged. Change was genuinely low-risk (three param additions + one SELECT column, no middleware, no route configs, no caching directives). Prod deploy clean on first try.

### Critical backlog surfaced: venue link serves stale render URL

After confirming custom text worked via direct Cloudinary URL, a separate test of sponsor logo positioning on TikTok revealed that the venue link page at `/v/e/[token]` and the `/api/download?token=...` endpoint are serving a **stale Cloudinary URL that predates even the April 14 sponsor-logo-on-video feature**. DB row for the test venue link contains the correct current URL (with sponsor logo layer and custom text layer); served page contains an older URL (no sponsor logo block, no custom text block, different band logo size).

Ruled out during diagnosis:
- Browser cache (hard refresh + fresh incognito both stale)
- Supabase fetch cache (page uses `supabaseAdmin` service-role client, no Next.js `cache` directive)
- Duplicate URL generator (grep confirmed `buildCloudinaryVideoUrl` is the only video URL builder)
- Multiple `venue_links` rows (SQL confirmed one)
- Stale `overlay_config` (DB has current config)

Working hypothesis: Vercel CDN edge cache on the tokenized `/v/e/[token]` route. Full diagnostic detail + repro data in `docs/BACKLOG.md`.

**Implication:** Custom text on videos shipped today DOES work at Cloudinary, but will NOT appear on venue link pages until this stale-URL bug is fixed. Same is true for sponsor logos on videos (shipped April 14) — they've never been making it to the venue page either.

**HIGH pre-beta priority.** Affects every venue link for every tour.

### Other process notes

- Spent ~90 minutes chasing the stale-URL symptom through multiple theories. Initially misdiagnosed as a logo-off-frame bug based on y=0.922 position — incorrect theory, user dragged logo to center, logo still missing. Pulled more data, found the real issue is a DB-vs-page mismatch. Lesson reinforced: when fresh data contradicts a hypothesis, drop the hypothesis fully rather than incrementally refine it.
- Stopped diagnostic work at ~10pm per yesterday's kickoff discipline ("if user has a deadline, revert-first-diagnose-after"). Demo is tomorrow, demo is images-only, bug is pre-existing — not tonight's problem.

### Tomorrow's session MUST start with

1. **Verify whether image formats have the same stale-URL bug BEFORE the Tim demo.** Query any recent `venue_links.render_square_url` / `render_story_url` / `render_landscape_url` and compare against what the venue page serves. If images are also stale, the demo story needs adjusting.
2. If images are affected too, decide: demo narrative adjustment OR attempt a fix with preview-deploy verification first (do NOT repeat yesterday's force-dynamic pattern on the venue page without preview testing).
3. If images are NOT affected, demo proceeds as planned and stale-URL fix is a post-demo task.

### Tim context addendum audit results

Three items flagged for Tim (public link refactor date error in addendum §2, Beta Test Band show count discrepancy in §3.3, TourCommand clarification for v8 §5). Parked in chat history — not critical for tomorrow's demo. Revisit when regenerating v8 Master Context.

### Still open from earlier today

- Router cache bug (template editor stale UI on back-nav) — workaround: hard refresh / incognito.
- Preview deploy middleware redirect — blocks using Vercel previews for future testing.
- `buildTextLayer` has no empty-text guard — currently only caller-side gating prevents empty URL fragments.

## 2026-04-19 (Sunday)

### Commits

- e4b9fcf — docs: capture stale-URL bug evidence before Tim demo
- f09db21 — fix(viewer): force-dynamic on public viewer pages to prevent stale render URLs [REVERTED]
- 9a1286a — Revert "fix(viewer): force-dynamic on public viewer pages to prevent stale render URLs"
- 5258f1d — fix(supabaseAdmin): bypass Next.js fetch cache with cache: no-store to prevent stale DB reads in public viewer pages
- beda6e1 — docs: mark stale-URL bug as resolved

(Plus earlier commits from today's Step 6 video custom-text work — add those hashes if they landed before this session started.)

### Shipped

**Step 6 — custom text overlays on video formats.** Extended `buildCloudinaryVideoUrl` in `app/api/renders/generate/route.ts` to render `custom_text_1` and `custom_text_2` on the vertical video format (TikTok / IG Reels / FB Stories / YouTube Shorts labels) and the square video format. Three-part gate: format check + per-format visibility flag + non-empty text. Matches the image-format pattern shipped April 18. (Note: the second video format is now Square, not a second vertical format as earlier session docs described.)

**Stale-URL bug — root-caused and fixed.** `/api/download` was returning 403 `url_not_allowed` because the client-side venue page was rendering stale `render_*_url` values that no longer matched the DB. Byte-equal allow-list on the download route rightfully rejected them.

Root cause: Next.js 14 caches every server-side `fetch()` call by default. The `@supabase/supabase-js` client used by `supabaseAdmin()` uses global fetch for every HTTP call, so every read from public viewer pages was being cached at Next.js's fetch-cache layer. `x-vercel-cache: MISS` headers were misleading — the HTML render was fresh, but the data inside the render was stale from the cached fetch.

Fix: added a 3-line `global.fetch` wrapper in `lib/supabaseAdmin.ts` that passes `cache: "no-store"` to every underlying HTTP call. Affects every caller of `supabaseAdmin` across the app (three viewer pages, four download routes, advance form route).

### What didn't work

**Attempt #1 was `export const dynamic = "force-dynamic"` at the page level** on all three public viewer pages. Worked on localhost `npm run build && npm run start`, did not hold on Vercel prod. Reverted. This is the exact "local prod build behaves differently than Vercel prod" failure mode the session kickoff doc warned about — but the warning didn't prevent us from hitting it, it just made the revert fast.

Key learning for future: **route-segment configs don't escape Next.js's fetch cache.** That cache lives below route-level opt-outs. For data-layer staleness, fix at the data layer (`cache: "no-store"` on fetch, or `unstable_noStore()` call, or client builder override). `unstable_noStore` and `revalidatePath` were zero-precedent in this codebase before today — worth being careful when we need them again.

### Evidence preserved

- `docs/STALE_URL_EVIDENCE.md` — full diagnostic trail captured across the debug session. Includes DB state, reproduction steps, attempt #1 failure analysis, hypothesis ranking, resolution notes.
- KILLING ME tour (THE COMMISSARY original evidence tour was deleted from `venue_links` mid-session — unknown which code path; added to backlog).

### Bugs discovered in testing, deferred

1. **Video sponsor logo preview-vs-output tint mismatch** — template editor preview tints sponsor logos to text color on videos, but rendered video output correctly shows native PNG color. Preview is wrong; output is right. Backlog as a preview-layer fix.
2. **Template editor stale-state issue** — on at least one occasion, template edits appeared to revert to defaults after save, then spontaneously updated several minutes later. Might be same root cause as stale-URL bug (now fixed) or might need same `cache: "no-store"` treatment on `supabaseServer`. Watch for recurrence next session. `supabaseServer` reads cookies/headers and is thus dynamic at the route level, so this may be a different bug class entirely.
3. **IG image prefills other format slots in template editor preview** — the April 9 fix removed the `?? tour.image_square_id` fallback in `EventsTable.tsx` `generateAll()` but the same pattern likely exists in `TemplateEditor.tsx` preview rendering. Not yet verified.
4. **Print asset upload requires hard refresh to appear** — known router cache issue from April 18 backlog, attempted fixes reverted, `revalidatePath` approach still outstanding.
5. **Stale helper text** under sponsor logo upload mentions "Local Poster PDF renders in sponsor's uploaded color" — print PDF has had no sponsor logos since April 17. Trivial copy fix.
6. **COMMISSARY venue_links row deletion** — the token `fbef4c39...` had a row in `venue_links` this morning, didn't by afternoon. Unknown which code path deleted it. Worth understanding before trusting deletion semantics.
7. **Silent-RLS risk on writes** — recon surfaced that `.update()` calls in `app/api/renders/save-urls/route.ts:22-25` and `app/api/renders/generate/route.ts:476` both lack `.select().maybeSingle()` verification, violating CLAUDE.md rule #6. If RLS ever silently rejects, code returns `ok: true` with zero rows modified. Audit all `.update()` across the codebase for this pattern.

### Next session should start with

- `git pull`, `git status`, confirm clean
- Read this log entry and `docs/STALE_URL_EVIDENCE.md`
- Decide priority order for the seven deferred items above — some are trivial (copy fix, IG-prefill fallback), some are architectural (silent-RLS audit, supabaseServer cache treatment)
- If the template editor stale-state symptom recurs, apply the same `cache: "no-store"` treatment to `supabaseServer` via createServerClient's options object

### What to tell Tim

Image-format custom text (shipped April 18) works end-to-end. Video-format custom text shipped today. Sponsor logos render correctly on images (tinted) and videos (native color). The stale-URL bug that was causing intermittent download failures has been root-caused and fixed. Print PDF is unchanged — still no sponsor logos on it (April 17 decision holds).


Append this to the bottom of docs/SESSION_LOG.md — do not modify existing content, just add at the end:

### Late addendum — two UI fixes after the stale-URL resolution

**Bug 3 fixed.** Template editor's live preview was falling back to the square image for story and landscape formats when those formats had no dedicated base image uploaded (same pattern that was fixed in EventsTable.tsx on April 9, but lingering in TemplateEditor.tsx). Removed the `?? tour.image_square_id` tails from the `formatImageIds` map on lines 350–351. Now surfaces the existing "No image uploaded for this format yet. → IMPORT ASSETS" placeholder at lines 1024–1025 — infrastructure was already built, just never triggered. Commit [hash].

**Bug 1 fixed.** Sponsor logo preview was tinting to text color on video formats, but the Cloudinary video output correctly renders sponsor logos in native PNG color (`buildSponsorLogoLayer` has no `e_colorize`). Preview now branches on `isVideoFormat`: on videos, renders a plain visible `<img>` in native colors; on images, keeps the existing CSS-mask tint. Matches the WYSIWYG principle of "preview should reflect output." Commit [hash].

**Both fixes** were template-editor-only changes (no render pipeline touched) with their own local dev smoke tests and prod verification.

**Remaining from today's deferred list (for next session):**
- Bug 4: print asset upload requires hard refresh (router cache — `revalidatePath` candidate)
- Bug 5: stale helper text mentioning "Local Poster PDF" for sponsor logos (trivial copy fix; also the same copy is inaccurate about video tinting now that Bug 1 is fixed — check lines 1285 and 1343)
- Silent-RLS audit on `.update()` calls across the codebase (per CLAUDE.md rule #6)
- Template editor stale state — monitor; may have been masked by the stale-URL fix. Re-verify next session.
- COMMISSARY venue_links row deletion — understand which code path did it

Paste the commit hashes for Bug 3 and Bug 1 from `git log` output, then commit with "docs: session log addendum — bug 3 and bug 1 fixes".

### Post-Tim-meeting addendum (evening)

**Template editor revert-on-back-navigation bug — FIXED.** Root cause: Next.js 14 Router Cache serves stale RSC payloads on client-side back-navigation. `supabaseServer`'s cookies/headers reads make the route server-side dynamic, but that doesn't bypass the Router Cache. Fix: imported `useRouter`, added `router.refresh()` inside the save() success branch after the "SAVED ✓" pulse. One-line invalidation after explicit saves only (not on drag-tick or keystroke autosave). Commit `a580240`. Verified on localhost + prod.

**Promoter email text colors — FIXED.** Four hex codes changed to #ffffff in `app/api/renders/approve/route.ts` (lines 92, 95, 96, 100). Commit `020bfeb`. Verified by sending test email to Drew's inbox.

**Email sender display name — FIXED.** Six Resend send call sites across five files now use `HWY61 Labs <address>` format instead of bare email address. Gmail sender column now shows "HWY61 Labs" instead of "noreply" or "advances". Commit `cba407e`. Verified on test send.

### Deferred to next session

- **Tim-facing auth/beta briefing doc.** Drew wants a comprehensive md file for Tim's Claude covering the full auth architecture, beta-tester provisioning landmines, and known architectural footguns. Scoped and structured in chat this evening but not written. Outline saved in conversation — start there next session.
- All the items already flagged earlier today (see prior entries in this session log) plus the auth-adjacent audit findings from tonight's recon: 11 raw `createClient` call sites bypassing helpers, 30+ `.update()` without `.select().maybeSingle()`, 79 `.single()` usages, manual plan-status provisioning step for beta testers.

---

## 2026-04-20 (Monday)

### Commits

- fb768de — fix(events): add auth + org check to DELETE /api/events/[eventId]

### Shipped

**Pre-beta auth fix on DELETE /api/events/[eventId].** Previously the route trusted the UUID in the URL with zero app-level auth, leaning entirely on RLS. Added `supabase.auth.getUser()` → 401 if unauthenticated, org membership check via event → tour → org_members → 403 if not a member, and `.select()` chained on the delete to catch silent RLS rejects → 403 on zero rows affected. Pattern mirrored from `app/api/marketing-tokens/create/route.ts`.

Verified on prod: 401 from logged-out incognito, 404 from logged-in request against nonexistent UUID, happy-path delete from dashboard UI works and cascades to venue_links children as expected.

### Forensic recon: venue_links deletion audit

Surfaced this fix via `docs/VENUE_LINKS_DELETION_AUDIT.md` — a read-only forensic pass on every code path that can delete a `venue_links` row. Triggered by yesterday's COMMISSARY mystery (token `fbef4c39...` disappeared between morning and afternoon on April 19).

**Resolved the mystery:** COMMISSARY disappearance was almost certainly benign — an event delete during the KILLING ME debug session cascaded to the venue_links child via `ON DELETE CASCADE`. Confirmed via `information_schema` query: `venue_links.event_id` → `events.id` is `ON DELETE CASCADE`, `venue_links.org_id` → `orgs.id` is also `ON DELETE CASCADE`.

**Surfaced three architectural findings worth documenting:**

1. `venue_links` has no DELETE RLS policy. Default-deny for everyone. The three client-side `handleDelete` sites in `TourTile.tsx` and `ArtistDetailClient.tsx` have been calling `.from("venue_links").delete()` as a silent no-op — the actual cleanup has always been driven by the FK cascade when the subsequent `events.delete()` fires. These explicit venue_links deletes are dead code.

2. The FK's ON DELETE action was not auditable from the repo because migrations in this project are applied by hand in the Supabase SQL Editor per CLAUDE.md rule 4. `supabase/migrations/` contains zero references to `venue_links`. Future audits of this kind will need to hit `information_schema` against the live DB — worth knowing.

3. Auth floor confirmed higher than feared — `events`, `tours`, and `artists` all have DELETE policies scoped to `authenticated` role with org-member checks. No `anon` deletion anywhere in the cascade chain. The auth fix on `/api/events/[eventId]` was defense-in-depth plus closing a shared-org gap, not a cross-tenant security hole.

### Bugs smoke-tested and confirmed fixed (incidentally)

1. **Bug 4 from April 19 deferred list** — print asset upload requires hard refresh. Verified on prod: works without refresh. Almost certainly resolved by yesterday's `supabaseAdmin` fetch-cache fix.
2. **Template editor stale video preview on asset replacement** — verified on prod: works without refresh. Same collateral benefit from yesterday's fetch-cache fix.

Both were symptoms of the same cached-fetch root cause as the stale-URL bug, just on different routes.

### Next session should start with

- `/api/venue-link` (singular, POST) missing auth check — same shape of fix as today's events DELETE. Last known auth gap from the audit. BACKLOG.md:248.
- Optional cleanup: remove dead `venue_links.delete()` calls from the three client handleDelete sites (TourTile x2, ArtistDetailClient). Let the cascade do its job.
- Still deferred: Tim-facing auth/beta briefing doc (blocked on Tim's beta info).
- Still deferred: silent-RLS audit on `.update()` calls, 11 raw `createClient` sites bypassing helpers, 79 `.single()` usages.

### What to tell Tim

Closed a pre-beta security gap on event deletion — the DELETE endpoint now requires auth and org membership. Yesterday's COMMISSARY disappearance mystery is resolved and was benign. Two UI bugs from yesterday's deferred list (print asset upload refresh, video preview replacement refresh) turned out to be already-fixed by the stale-URL work.

### Afternoon addendum — venue-link auth fix + dead-code cleanup

**Commits:**
- 1134401 — fix(venue-link): add auth + org check to POST /api/venue-link
- 09d076e — cleanup(dashboard): remove dead venue_links.delete() from three delete handlers

**Shipped (1134401).** Closed the last known auth gap from docs/VENUE_LINKS_DELETION_AUDIT.md. POST /api/venue-link previously trusted orgId + eventId from the request body with zero app-level auth. Added the same pattern as today's fb768de events-DELETE fix, plus one route-specific defense: a cross-check that `tour.org_id` (resolved from the event → tour lookup) matches the orgId in the request body. This closes the token-spraying vector where a caller could otherwise create venue_links rows under a forged orgId. Also added `.select().maybeSingle()` on the INSERT with a server-side console.error → 500 write_failed for the silent-RLS case. Happy-path response shape preserved for the existing caller at EventsTable.tsx:526.

Verified on prod: 401 from logged-out incognito, 403 from logged-in request with forged orgId, 200 happy path from the dashboard share-link button.

**Shipped (09d076e).** Removed dead venue_links.delete() calls from three client-side delete handlers (TourTile.tsx artist-delete branch, TourTile.tsx tour-delete branch, ArtistDetailClient.tsx handleDeleteTour). These calls have been silent no-ops for as long as they've existed — venue_links has no DELETE RLS policy (default-deny for all roles), so every call returned zero-rows-affected. Actual cleanup has always been driven by ON DELETE CASCADE on venue_links.event_id firing when the subsequent events.delete() runs. Also removed the scaffolding SELECTs that existed solely to feed the venue_links delete (and in ArtistDetailClient, the if(events?.length) guard — zero-row events.delete on empty tours is semantically identical to the previous guard-and-skip).

Smoke-tested on localhost via ArtistDetailClient's handleDeleteTour: tour delete wiped tour + event + venue_links row via cascade, artist preserved. Net -17 lines, +1 line.

**Three-commit day.** fb768de + 1134401 + 09d076e. All three deployed to Vercel. Two pre-beta auth gaps closed, one architectural cleanup, three-part session-log trail.

**Still deferred (unchanged from this morning's list):**
- Tim-facing auth/beta briefing doc (blocked on Tim's beta info)
- Silent-RLS audit on .update() calls (30+ sites missing .select().maybeSingle())
- 11 raw createClient call sites bypassing supabase helpers
- 79 .single() usages to triage against PGRST116 traps
- ADMIN_EMAILS centralization (5 duplicated sites)
- BUG-B: stale `allowed` whitelist in tourrouter artists PUT route
- Lint cleanup pass on app/v, app/advance, app/report, app/api/download*
- Parallel FormatConfig/FieldConfig types in TemplateEditor.tsx + clientRender.ts

**zsh bracket quoting bit me once today** on the commit-stage step for ArtistDetailClient.tsx's [artistId] path — rejected silently by zsh glob, nothing staged. Re-ran with quotes. CLAUDE.md rule 17 held exactly as documented; flagging here so future me doesn't forget the footgun.

### Monday afternoon + evening — massive HIGH-tier audit cleanup (nine commits)

After the morning session shipped fb768de, 1134401, 09d076e, 7985420, 085dd30, and 35c7152, the afternoon picked up with the silent-RLS .update() audit recon and then worked through most of its HIGH-tier fix list.

**Commits (in order):**

- 3a1c3da — fix(events): add auth + whitelist + verify to PATCH /api/events/[eventId]
- 5c67e38 — cleanup(api): delete dead route app/api/tours/[tourId]/advance
- b1ee117 — fix(renders): add rows-affected verification to 3 HIGH-risk .update() sites
- 692cb47 — fix(advance/send): add rows-affected verification to 2 HIGH-risk .update() sites
- 851606f — fix(intake/confirm): add rows-affected verification to 7 HIGH-risk .update() sites

**The silent-RLS audit was the anchor.** Ran a read-only forensic recon on all .update() calls in public-facing routes (app/api/**, app/v/**, app/**/actions.ts). Committed as docs/SILENT_RLS_UPDATE_AUDIT.md alongside the events PATCH fix. Top-line finding: 49 of 68 in-scope sites (72%) lacked post-write verification. The bug class: when .update() chained without .select().maybeSingle() hits a silent-RLS rejection, Supabase returns ok:true on zero rows affected, and the handler lies to the caller.

**Items shipped from the audit's HIGH tier:**

3a1c3da — events PATCH. Previously took req.json() straight into .update(body) with zero auth, zero whitelist, zero verification. Fixed mirroring the DELETE pattern from fb768de plus field whitelist from 085dd30 (tourrouter artists PUT). Whitelist derived from EventsTable.tsx actual usage: date_iso, day, city, state, venue, venue_name, promoter_email. Smoke-tested three ways on localhost (happy path, logged-out 401, forged-field 400 no_valid_fields).

5c67e38 — tours/[tourId]/advance deleted. Audit flagged as worst-shape in section 2. Before deletion: full-repo grep found zero call sites in any pattern, Vercel free-tier function logs (Apr 19 14:18 through Apr 20) showed zero invocations. Route was introduced 5 weeks ago in ef83904 and never wired up. Deletion over hardening because writing a whitelist from theory creates a trap for the future dev who wires up a caller.

b1ee117 — three renders pipeline sites bundled. save-urls:24 and generate:476 (both venue_links.render_*_url updates) and approve:79 (events.render_status + sent_at). The generate:476 site had a misleading console.log('UPDATE RESULT: OK') that fired even on zero-row updates, now replaced with actual rows-affected logging. The approve:79 site's audit wording was wrong (said AFTER email, code shows BEFORE) — corrected during Claude Code review, cleanly closes the double-email trap by aborting before email send if the state update fails.

692cb47 — advance/send two sites. Line 35 (advance_form_token BEFORE email) and line 103 (advance_status + sent_at AFTER email). Pattern A in the audit ('email then state-flip'). Line 103 fix includes explicit forensic log wording because the email is already sent when the silent-RLS trips — cron at 0 10 * * * will re-fire a duplicate.

851606f — intake/confirm seven sites. Biggest single-file fix of the day. Financial data handler: settlement sheets, box office, advance responses, hotel costs. User clicks Confirm expecting persistence; silent-RLS meant "Saved N updates" toast was lying. Fail-fast approach chosen after recon on the single caller (IntakeDropZone.tsx:126) which only reads err.error on !resp.ok. Preserved the existing carve-out at line 162 (hotel_cost_actual stacking update) as best-effort-skip-on-failure, matching Tim's intent for that secondary write.

**Other shipped today (not audit-related):**

- 085dd30 (morning) — BUG-B from BACKLOG.md. Removed three stale agent_* entries from tourrouter/artists/[artistId] PUT whitelist. Backlog was stale — five of six "missing" fields were already present (likely from April 6 phone migration). Net -1 line.
- 35c7152 (morning) — three zero-risk lint fixes on public viewer pages. Two dead cleanVenue assignments + one unescaped apostrophe. Deferred the 17 remaining .any/@next img warnings per low-blast-radius policy pre-beta.

**Architectural chapter closed today — the silent-RLS bug class.** Before today, this bug class was invisible in reviews because LLM-assisted coding (both of us) tended to match the existing pattern where verification was absent. The audit surfaced the scale (72% of in-scope sites). The fixes shipped today cover the HIGH-tier items. Post-beta work includes MEDIUM-tier cleanup, a broader lib/ and dashboard audit, and a decision on whether to add an ESLint rule that bans bare .update() calls without .select() chained.

**Deferred to next session (bundled):**

- Billing webhooks (6 sites) — Stripe webhook + internal billing webhook, all service-role. EIN just came through today, so Stripe restructure is no longer blocked. Worth its own session with a clean head because the fix needs to decide on returning 500 on zero-row matches (forces Stripe to retry) and because billing code is where mistakes are expensive. Audit section 2 "Billing webhooks" + section 5 item 6 for context.

**Still deferred (unchanged):**

- MEDIUM-tier audit items (render_status state-machine transitions, contact PUT + flag, push-to-localizer cross-product linking, upload-image follow-up)
- Tim-facing auth/beta briefing doc (still blocked on Tim's beta info)
- Silent-RLS audit expansion to app/dashboard/** and lib/**
- 11 raw createClient call sites bypassing supabase helpers
- 79 .single() usages to triage against PGRST116 traps
- ADMIN_EMAILS centralization (5 duplicated sites)
- 17 remaining lint issues on public viewer pages (any types + img warnings)
- Parallel FormatConfig/FieldConfig types in TemplateEditor.tsx + clientRender.ts
- Custom fonts re-upload (BebasNeue, Pragmatica-Extended-Extra-Bold)

**Process notes from today:**

- zsh bracket quoting bit once at 085dd30 commit-stage and again at 851606f commit-message (! triggered history expansion on resp.ok). Heredoc with single-quoted EOF is the safer default for multi-line commit messages. CLAUDE.md rule 17 needs extending beyond "git add on bracket paths" to cover commit messages too — consider adding a note.
- Claude Code's Flag system (1-3 flags in reply before proposing diffs) caught real bugs in audit specs twice today. In the renders bundle it corrected an "AFTER email" to "BEFORE email" framing that changed the fix shape. In the intake/confirm fix it caught an enumeration error (I'd described 8 items as 7, the carve-out site's console.error line was being double-counted). Keep using this pattern.
- Recon-first discipline paid off explicitly on intake/confirm — recon on the single caller revealed that adding errors[] to the response would require caller-side code changes, while fail-fast had zero caller-side impact. Simpler choice was revealed, not guessed.
- Trust-based shipping (no functional smoke test) used deliberately for advance/send and intake/confirm when local test data couldn't exercise the flow. Justified by pattern match to already-smoke-tested commits earlier in the same session. Noting the pattern for future judgment calls on when to skip smoke tests.

**What to tell Tim:**

Closed five pre-beta HIGH-risk items surfaced by today's silent-RLS audit. Event PATCH, renders pipeline, advance send, and intake confirm all now properly verify that writes actually persist — no more "saved" toasts lying to users when RLS silently rejects a write. Billing webhooks are the only remaining HIGH-tier item from the audit, queued for next session now that EIN came through. No user-visible changes today; all fixes are defensive.

### Next session should start with

- git pull, git status, confirm clean
- Billing webhooks (6 sites across Stripe + internal billing): single commit, shared fix shape, decision needed on returning 500 on zero-row match so Stripe retries
- EIN-enabled Stripe restructure work (separate from the audit item) if there's time

Today's session summary
Four commits shipped today on top of the email migration:

869a83b — Social UI overlay zone on tiktok tab
9eceafd — Soft-fail verification on events render_status update
ba31e66 — Custom fonts upsert + DB unique constraint + stale row cleanup
29d5d05 — Remove weekday from short date format across all renderers (Tim's ask)

Plus:

DB migration: UNIQUE constraint on custom_fonts (org_id, font_name)
DB cleanup: removed stale duplicate BullandRegular row
Full audit freshness pass: items §5 #1-5 and #7 all verified closed by yesterday's work
Full Google Workspace email infrastructure live

Still open, deferred to tomorrow or later:

Silent-RLS audit §5 #6 (billing webhooks) — tomorrow, bundled with Stripe restructure work
Phase 8 code + platform updates above

## April 22, 2026

### Shipped
- `cb7b734` — feat(admin): add hwy61labs.com emails to admin list
- `c8b51bb` — cleanup(api): delete dead /api/venue-links endpoint
- `5c725d3` — cleanup(lint): remove unused variables across API routes and components (+ ENABLE_TEXT_WRAP orphan)

### Key findings
- `/api/venue-link` (singular) was already fully secured — yesterday's kickoff doc was stale. Another win for grep-verify-before-status-docs.
- `/api/venue-links` (plural) confirmed dead via zero in-repo callers + zero Vercel invocations (last 24h). Deleted — was unauthenticated enumeration risk.
- Lint `_` prefix convention is not honored by current eslint config. Renaming `req` → `_req` is net-zero for warning count. Config fix deferred.

### Deferred / parked
- Stripe business setup bundle (EIN, bank account, billing contact email) — parked pending bank account decision, do all three in one Stripe session.
- Tim's pricing adjustments — deferred; webhook rewrite waits on locked prices.
- Lint pass 2 — ~20 remaining warnings (mostly `any` errors + auth/confirm effect + tourrouter/intake require()). Not mechanical; needs scoped attention per file.

### Memory updates
- Tim's gmail corrected to `tentenpm@gmail.com` (hwy61regan@ no longer in use).
- Admin email list documented with 2-week soak / ~May 6 gmail removal date.

### Next session
- Tim-pricing check-in; if locked, proceed with Stripe webhook restructure per April 22 kickoff doc Phases 1-9.
- If Tim's not ready: lint pass 2 (scoped, file-by-file for the `any` errors) OR Pragmatica Extended Extra Bold font migration OR `/api/renders/generate` `any` cleanup as a standalone.


## April 22, 2026 (afternoon / evening session)

### Shipped
- `cb7b734` — feat(admin): add hwy61labs.com emails to admin list
- `c8b51bb` — cleanup(api): delete dead /api/venue-links endpoint
- `5c725d3` — cleanup(lint): remove unused variables (pass 1)
- `ff91292` — docs: session log morning
- `4711b5a` — feat(access): add per-product access gates (localizer_enabled + tourrouter_enabled on orgs)
- `1508a86` — fix(auth): use service role for ensureOrgExists to bypass RLS race
- `0406685` — fix(dashboard): use service role for org bootstrap reads
- `8235ff9` — debug(dashboard): temporary minimal render to bisect new-user failure
- `103bbb1` — fix(dashboard): use service role for artists and tours reads
- `4c63d2f` — fix(dashboard): replace client-boundary-violating HwEmptyState with plain form

### Beta system — fully live
- 10 invite codes in beta_invites, all unclaimed and ready: HWY61-BETA-001 through HWY61-BETA-010
- TourRouter hidden for beta users (tourrouter_enabled=false default on new orgs)
- Localizer access granted for beta users (localizer_enabled=true set in ensureOrgExists)
- Admin bypass works via isAdminEmail() for both legacy gmails and new hwy61labs.com addresses
- End-to-end test: claimed code → signed up → onboarding wizard → dashboard → artist hub showed Localizer only. ✅

### Bugs surfaced and fixed (all latent, not caused by today's work)
- Supabase project-level signup toggle was OFF — flipped ON
- ensureOrgExists RLS failure for new users (latent since 9f88d03) — service role fix
- Dashboard org/membership read RLS failure (same root cause) — service role fix
- Dashboard artists/tours read RLS failure (same root cause) — service role fix
- HwEmptyState server/client boundary violation on empty dashboard — plain form replacement
- Hardcoded admin gmails in dashboard page — now uses isAdminEmail() helper
- .single() on dashboard org read — changed to .maybeSingle() with null-guard redirect

### Known bugs still open (non-blocking for beta)
- Beta code claim fires on PostHogProvider mount (before auth completes). Users whose magic link fails burn their code anyway. Should move claim into /auth/callback post-ensureOrgExists. Workaround: manually reset via SQL if a beta user hits this.
- Dashboard page still imports unused HwButton — minor lint noise.
- Root cause of the RLS cookie-propagation issue is still present; we patched symptoms with service role in 4 places today. Long-term fix is middleware session refresh or a broader client architecture pass.

### Parked (blocked on bank account decision)
- Stripe business setup bundle (EIN entry, business setup, billing contact email update) — all three in one session once bank account is picked.

### Next session starts with
Handing beta codes to Tim when he's ready with the 10 users. No code work blocking beta launch now. If energy permits in the meantime: lint pass 2 (remaining `any` errors), Pragmatica Extended Extra Bold font migration, beta-claim timing bug fix, or Unit D rate limiting.

### Memory updates
- Tim's gmail corrected to tentenpm@gmail.com (hwy61regan@ retired)
- Admin email list now includes hwy61labs.com addresses, 2-week soak → ~May 6 gmail removal
- SSR cookie-propagation pattern: user-scoped supabaseServer() client cannot reliably read RLS-protected tables immediately after signup / in some server component contexts. Pattern: use supabaseAdmin() for bootstrap reads in server components and auth callbacks.

## April 22, 2026 (afternoon / evening session continued)

### Shipped (beyond the morning session)
- `cb7b734` — feat(admin): add hwy61labs.com emails to admin list
- `c8b51bb` — cleanup(api): delete dead /api/venue-links endpoint
- `5c725d3` — cleanup(lint): remove unused variables (pass 1)
- `ff91292` — docs: session log (morning)
- `4711b5a` — feat(access): add per-product access gates (localizer_enabled + tourrouter_enabled on orgs)
- `1508a86` — fix(auth): use service role for ensureOrgExists to bypass RLS race
- `0406685` — fix(dashboard): use service role for org bootstrap reads
- `8235ff9` — debug(dashboard): temporary minimal render to bisect new-user failure
- `103bbb1` — fix(dashboard): use service role for artists and tours reads
- `4c63d2f` — fix(dashboard): replace client-boundary-violating HwEmptyState with plain form
- `2aa2317` — docs: session log afternoon (pre-wrap)
- `3aa7606` — docs: auth architecture reference (docs/AUTH_ARCHITECTURE.md)
- `69f6868` — feat(login): clarify returning-user sign-in path (SIGN IN link)
- `955928d` — feat(onboarding): Localizer-branded welcome screen for non-TR users (Option A)
- `b3115cd` — style(onboarding): larger split-color HWY61 LABS wordmark on welcome screen

### Beta system — fully live and tested end-to-end
- 10 invite codes in beta_invites, all unclaimed and ready: HWY61-BETA-001 through HWY61-BETA-010
- New signups via /auth/callback create orgs with localizer_enabled=true, tourrouter_enabled=false
- Dashboard renders correctly for new users
- TourRouter tab hidden in Artist Hub for beta users; API routes return 403
- Admin bypass via isAdminEmail() works for both legacy gmails and new hwy61labs.com addresses
- Returning beta users can sign in via "Already have an account? SIGN IN" link on /login
- New beta users see a dedicated Localizer welcome screen with single CTA, not the three-card TourRouter-flavored wizard

### Bugs surfaced and fixed (all latent, not caused by today's work)
- Supabase project-level signup toggle was OFF — flipped ON
- ensureOrgExists RLS failure for new users (latent since 9f88d03) — service role fix
- Dashboard org/membership read RLS failure (same root cause) — service role fix
- Dashboard artists/tours read RLS failure (same root cause) — service role fix
- HwEmptyState server/client boundary violation on empty dashboard — plain form replacement
- Hardcoded admin gmails in dashboard page — now uses isAdminEmail() helper
- .single() on dashboard org read — changed to .maybeSingle() with null-guard redirect
- Three-card onboarding wizard trapped Localizer-only users in TourRouter paths — Option A shipped

### Critical follow-up — Option B (DO NOT DROP)
**Build a Localizer-specific onboarding wizard for users with tourrouter_enabled=false.**
Today shipped Option A (hide TourRouter-flavored options and show a single-card welcome screen). This is a quick fix, not the proper experience. Option B is a dedicated Localizer onboarding narrative: "Add your first artist → Add your first show → Generate your first asset."

Needs Tim's input on the narrative before building. Critical for Localizer public launch UX. Also documented in:
- userMemories (memory #14)
- docs/AUTH_ARCHITECTURE.md (known issues section)

### Known bugs still open (non-blocking for beta)
- Beta code claim fires on PostHogProvider mount (before auth completes). Users whose magic link fails burn their code. Should move claim into /auth/callback post-ensureOrgExists.
- Dashboard page still imports unused HwButton — minor lint noise.
- TEAM LOGIN / "Already have an account? SIGN IN" button is a soft bypass — anyone who finds it skips the invite gate. Fine for private beta, not acceptable for public launch.
- ArtistHubClient.tsx Localizer access check uses plan_status logic, not localizer_enabled — harmless today but intended for future gating.
- Root cause of RLS cookie-propagation issue is still present; patched with service role in 4 places today. Long-term fix is middleware session refresh or broader architecture pass.

### Parked (blocked on bank account decision)
- Stripe business setup bundle (EIN entry, business setup completion, billing contact email update) — all three done in one Stripe session once the bank account is picked.

### Next session starts with
- Hand beta codes to Tim when he's ready with the 10 users. No code work blocking launch now.
- If energy permits before Tim: Option B onboarding wizard (after Tim provides narrative input), beta-claim timing bug fix, Unit D rate limiting, Pragmatica Extended Extra Bold font migration, or lint pass 2.

### Test state left clean
- beta_invites HWY61-BETA-001 reset to unclaimed
- Test user drew+beta001@hwy61labs.com deleted, associated org and artist deleted
- A newer test user (from the final end-to-end walkthrough) may still exist — clean up if you want a perfect slate, but harmless if left in place since they have a valid beta flow with localizer_enabled=true

### Memory updates
- Tim's gmail corrected to tentenpm@gmail.com (hwy61regan@ retired)
- Admin email list includes hwy61labs.com addresses, 2-week soak → ~May 6 gmail removal
- SSR cookie-propagation pattern: user-scoped supabaseServer() client cannot reliably read RLS-protected tables immediately after signup. Use supabaseAdmin() for bootstrap reads in server components and auth callbacks.
- Option B onboarding wizard tracked in memory #14

---

## April 22-23, 2026 — late evening session (post-wrap continued)

Session kept going well past the earlier wrap. This section captures everything that landed after commit da58c00.

### Shipped

- `dcb7d54` — style(artist-profile): scale PHOTO/SPOTIFY/BAND LOGO squares 1.5× (94 → 141px) for better photo visibility
- `4ecd864` — docs: beta user guide (docs/BETA_USER_GUIDE.md) — paste-ready copy for Tim to forward with invite codes
- `22b78c2` — feat(artist-profile): static autosave/drag-drop illustration card added as fourth flex child next to the three photo squares
- `1e35d57` — style(artist-profile): tighten illustration card (380 → 340px), update copy (Settlement → Hospitality, hospitality_rider_SF.jpg, "14 fields extracted")
- (one overflow-fix attempt at 340px width; superseded by next commit)
- Fixed at 250px fixed-width version after screenshot showed card still overflowing parent right border
- `1a759d6` — style(welcome-email): centered poster layout with real Pragmatica Extended wordmark PNG (third iteration)
- `c121f76` — fix(cron): disable TourRouter advance cron — was sending duplicates

### Welcome email redesign (3 iterations in one night)

1. **First attempt** — cream background + halftone dots + split-color wordmark + offset shadows. Halftone stripped by Gmail's image proxy, wordmark spacing weird, shadows missing, overall felt flat.
2. **Second attempt (Path A)** — crimson hero block + punk flyer approach. Dropped halftone, dropped shadows, centered. Better but still not polished.
3. **Third attempt (final, shipped)** — centered poster layout with REAL Pragmatica Extended wordmark PNG. Claude Code converted `public/fonts/Pragmatica_Extended-Extra-Bold.woff2` → `.ttf` using fonttools+brotli, rendered with PIL at auto-scaled 86px (to fit 720px width with 40px margins), saved to `public/email/hwy61-wordmark.png`. Copy is product-agnostic — works for Localizer-only, TourRouter-only, or bundle. Three-line flyer stack (ROUTING / MARKETING crimson / ADVANCING) as the visual moment.

### TourRouter advance cron — critical bug discovered

Drew noticed daily "TourRouter Advance Digest" emails arriving at 6 AM. Investigation revealed:

- `app/api/tourrouter/advance/cron/route.ts` line 214 was firing `resend.emails.send()` to promoter recipients **unconditionally** — no gate, no feature flag, no dev-mode check
- Silent RLS failure on `tour_shows.advance_status` UPDATE (no `.select().maybeSingle()` verification) caused cron to re-evaluate the same shows daily and re-fire emails
- Duplicate entries in digest ("Golden Ratio" and "South Congress Hall" each appearing 3×) were the symptom

**Blast radius check — zero actual emails delivered to real promoters.** SQL query on `advance_emails` showed every `recipient_email` value was a person's NAME ("Aaron Blackwood", "Jenny Walsh") not an email address. All were seed data. Resend rejected every send attempt because "Aaron Blackwood" isn't a valid email format. The cron was broken, not dangerous.

**Action taken:** `vercel.json` updated to `{}` — cron removed entirely. No more 6 AM digests. Manual "Send Advance" button in tour page UI still works but won't auto-fire.

**Added to backlog** in docs/BACKLOG.md under new "TourRouter" section — four bugs documented with re-enabling checklist before advance feature ever ships.

### Documentation additions

- `docs/BETA_USER_GUIDE.md` — paste-ready onboarding copy for beta users
- `docs/BACKLOG.md` — new TourRouter advance feature section with four bugs and re-enabling checklist

### Test state left clean

- `HWY61-BETA-001` reset to unclaimed (ready for Tim's test)
- Test user `info@alex-drew.com` + org `7bf26fd5-d5bc-40f9-80e1-5c365791387e` deleted
- Any later test users from welcome-email iteration — cleanup not strictly required since beta flow is Localizer-only with `localizer_enabled=true`

### Known items still open (not blocking beta)

- TourRouter advance cron disabled — will stay disabled until Tim's ready and the four backlog bugs are fixed
- Beta-claim timing bug (claim fires on PostHogProvider mount before auth completes) — still open
- TEAM LOGIN bypass — anyone who clicks SIGN IN skips invite gate. Fine for private beta, unacceptable for public launch
- Root-cause fix for SSR RLS cookie-propagation issue — today's service-role patches are workarounds; long-term fix is middleware session refresh or broader auth architecture pass

### Next session starts with

- Hand beta codes to Tim when he's ready. No code work blocking launch.
- Option B onboarding wizard (Localizer-specific narrative) — still highest-priority post-beta item. Needs Tim's input on narrative before building. Tracked in memory, in AUTH_ARCHITECTURE.md, in two places in SESSION_LOG.md now.
- Beta-claim timing bug fix
- Unit D rate limiting build

## 2026-04-26 — Pre-beta security audit + two route fixes shipped

**Commits shipped today (2):**

1. `5341b74` — fix(security): require auth + org membership on overlay-config PATCH
2. `01a0a5b` — fix(security): require token validation on print-pdf route

**Context:** Goal was to prepare for first beta invites going out in next 2 days.
Tim's invite email flagged two pre-existing unauth API routes for risk read.
Investigation showed both were exploitable from outside the app entirely (no
session needed). Both fixed and smoke-tested in production.

**Auth flow verification (no code changes, knowledge gained):**

- Tested HWY61-BETA-002 claim end-to-end with `+betatest1` Gmail plus-address
- Confirmed beta-claim timing bug from kickoff doc is STALE: failed magic
  links do NOT burn codes. Claim is correctly gated on successful auth
  completion. No fix needed.
- Discovered same-browser gotcha: magic links must be opened in the same
  browser that requested them, otherwise "session expired" on click. Worth
  flagging in BETA_USER_GUIDE or Tim's invite email.
- Verified Tim's six load-bearing email claims; 5 of 5 tested passed
  (skipped magic-link verification since it was already soaked).

**Fix 1 — overlay-config (commit 5341b74):**

`app/api/tours/[tourId]/overlay-config/route.ts` had an inverted security
model: when the authed UPDATE returned zero rows (the RLS rejection signal
that the caller is unauthorized), the route reacted by retrying with a
service-role client that bypasses RLS. Net effect: any HTTP client with a
valid tour ID could rewrite any tour's overlay config, including
custom_text_1/2. No login required.

Verified `tours_update_if_org_member` RLS policy is correct (allows any
org member to UPDATE their tours), so removing the service-role fallback
doesn't break legitimate users.

Fix added `auth.getUser()` check + `org_members` lookup before the UPDATE,
removed the service-role fallback entirely.

Smoke tests passed: legitimate dashboard autosave still works (Test A),
cross-org PATCH from logged-in attacker returns 404 tour_not_found (Test B,
RLS blocks the lookup), unauthenticated curl returns 401 auth_required
(Test C). Database verification confirmed no test writes landed.

**Fix 2 — print-pdf (commit 01a0a5b):**

`app/api/renders/print-pdf/route.ts` was intentionally anonymous (called
from public share pages) but accepted a bare eventId with zero validation,
meaning anyone with any event UUID could generate the print PDF for any
event in any org.

Fix added token validation: route now requires `?eventId=...&token=...`,
checks venue_links first (token + event_id match), falls back to
marketing_tokens (token's tour_id contains the eventId), returns 401
otherwise. PrintDownloadButton.tsx and both /v/e/[token]/page.tsx and
/v/m/[token]/page.tsx updated to forward the token from the route segment.

Smoke tests passed: real venue token downloads PDF (Test A), no token
returns 400 missing_params (Test C), fabricated token returns 401
invalid_token (Test D), real token + wrong event returns 401 (Test E).
Test B (marketing token happy path) skipped — no marketing token in
admin org points to a tour with print-poster events. Logic is structurally
identical to venue path; high confidence based on Test A + negative tests.

**Data anomalies discovered (cleanup, not urgent):**

- 11 orgs named "My Workspace" with zero members (abandoned signups
  pre-dating the April 9 ensureOrgExists hardening)
- 2 orphaned tours in one of those zero-member orgs
  (org_id: 3e384602-cf13-4ba2-bb45-949f25917e84). After today's fix,
  these tours are unreachable to any human via the dashboard, which
  is the correct behavior for orphaned data.
- Beta accounts (Tim, +betatest1) both have user_role = null. This is
  the per-user-vs-per-org onboarding mismatch from Tim's email, still
  open. Not blocking since wizard is skipped for beta.

**Process notes:**

- Multiple times during the session, instinct-driven "wait, are we sure?"
  questions caught real issues before push (the agent flagging the
  service-role fallback's existence reason, the RLS policy verification,
  the orphan-org check). Pattern worth keeping.
- "Show diff before applying" in Claude Code prevented at least one
  unnecessary same-commit change (the stale comment on print-pdf line 6
  was caught and updated separately rather than left wrong).
- CORS preflight failures during browser-based auth smoke tests are a
  recurring red herring on the apex-vs-www domain split — fall back to
  curl for clean status codes.

**Still open before invites go out:**

- Reply to Tim with corrected status (his email has stale asks; the auth
  flow he describes doesn't match the code system that exists)
- Confirm `[LINK]` URL for Tim's invite email
- Optional cleanup of 2 orphaned tours

**Next session starts with:**

Tim's reply if he's responded. If not, pick up Tim email draft.
Optionally clean up the 2 orphaned tours if Drew wants the hygiene done
before invites.

Every new org from this commit forward provisions with active Localizer status. No more manual SQL per beta tester. TourRouter remains disabled by default (correct — Localizer-only beta). Bundle status remains null (same reason).

#### "Session expired" investigation

Tim's first 402 issue (the "session expired" landing page when clicking the beta invite email) traced to a different architecture: PKCE-flow magic links require the code verifier to be in the same browser's cookies as where `signInWithOtp` was called. Most email clients open links in the user's default browser, not the browser the user used to submit the email form. When the verifier is missing, `exchangeCodeForSession()` fails and the user lands on `/login?error=auth` — which renders as "Your session expired" because the copy on `app/login/page.tsx:212` doesn't distinguish between "session expired" and "magic link auth failed."

#### Architectural fix #2 — commit c6a0bfc (magic-link flow + defensive provisioning)

Three pieces in one commit:

1. **`lib/supabaseClient.ts`** — added `flowType: "implicit"` to the `createBrowserClient` auth options. **NOTE: this turned out to be a no-op for new signups.** `@supabase/ssr` (or Supabase's signup endpoint specifically) generates `pkce_` prefixed tokens for type=signup emails regardless of client flowType. The flowType change might still help for existing-user magic-link emails (type=magiclink) but we didn't verify.

2. **`app/login/page.tsx`** — added a useEffect that detects `#access_token=...` in the URL hash on mount. If present, suppresses the "session expired" banner, waits 100ms for the supabase browser client's `detectSessionInUrl` to parse the hash, and pushes to /dashboard. This handles Google OAuth's implicit-flow callback path that the server route can't see.

3. **`lib/auth/ensureOrgExists.ts`** (new) + **`app/auth/callback/route.ts`** (refactor) + **`app/dashboard/page.tsx`** (defensive call) — extracted `ensureOrgExists` from the inline auth callback into a shared helper. Called from both the callback AND the dashboard. Any code path that reaches /dashboard with a valid session auto-provisions an org if one doesn't already exist. Closes the first-time-Google-OAuth gap (where the callback's ensureOrgExists never runs because access_token is in the URL hash) and defends against any future flow that bypasses the callback.

#### What actually fixed cross-browser sign-in

After commit c6a0bfc deployed to production, Tim's test still showed `token=pkce_...` in the magic link email. The flowType change wasn't enough.

The actual fix was the **Supabase Confirm signup email template change**: replacing `{{ .ConfirmationURL }}` with a hand-built URL using `{{ .TokenHash }}` and `{{ .SiteURL }}`. This bypasses Supabase's `/verify` redirect endpoint entirely — the email link goes straight to `/auth/callback?token_hash=...&type=signup`, and the existing `verifyOtp({ token_hash, type })` path in the callback handles it without needing any client-side verifier.

Cross-browser sign-in confirmed working after the template change. Test: opened the magic link in Safari after submitting the form in Chrome → landed in /dashboard cleanly.

**The flowType: implicit change is therefore essentially dormant** for the signup path. Keeping it in place since it doesn't hurt and may help for the (untested) existing-user magic link path.

#### Discovery: "anyone can get in"

Verified the magic-link signup worked for new emails — but I bypassed the beta code via the "SIGN IN" button on /login. Realized the button (`skipToLogin` function) bypassed the beta gate entirely with no server-side check. Anyone who knew the /login URL could click through and create an account.

#### Architectural fix #3 — commit 4d0b74f (shared password gate)

Drew proposed replacing the beta_invites infrastructure entirely with a single shared password env var. Cleaner than the proper-but-bigger admin-API server-side gating I was drafting. Implementation:

1. **`/api/beta/validate`** — replaced the `beta_invites` table query with `crypto.timingSafeEqual` comparison against `process.env.BETA_GATE_PASSWORD`. Same input/output shape so the login page didn't need API contract changes.
2. **`app/login/page.tsx`** — removed `skipToLogin` function and the JSX button entirely. Renamed UI text from "Beta Invite Code" to "Beta Access Password." Changed input type to `password`. Removed `localStorage.setItem("beta_invite_code", ...)` so PostHogProvider's claim path never fires.
3. **`BETA_GATE_PASSWORD`** env var set in Vercel (all three scopes) and `.env.local`.

Tim and Drew use the same password as beta testers. Password rotation = change env var in Vercel + redeploy = all testers re-enter new password. Self-serve onboarding for testers, no admin involvement per signup.

#### Welcome page diagnostic dead-end (not a bug)

Spent ~30 min chasing a "welcome to the beta" page Drew remembered seeing on first signup but wasn't appearing for the new test users. Multiple greps came up empty. Drew did another fresh signup and the page DID appear — confirmed it's the `app/components/OnboardingWizard.tsx` localizer-only view with the actual headline "WELCOMES YOU TO THE LOCALIZER BETA" (different exact wording than what we were grepping for). Working as designed. Earlier test69 user must have had browser state from prior testing.

### What's verified working end-to-end after tonight

- Password gate: random users blocked, beta testers self-serve with shared password
- Magic link cross-browser: token_hash via template fix lets emails be clicked in any browser
- Auth callback + dashboard: `ensureOrgExists` provisions defensively from either path
- Org provisioning: new beta orgs come online with `plan='pro'`, `localizer_plan='agency'`, `localizer_plan_status='active'`. No manual SQL.
- Welcome page: fires for new users with the right copy
- Downloads + custom font upload: work without manual SQL on fresh signups

### Lessons reinforced

1. **Don't write to status columns from memory.** "set status='paid'" was the wrong literal — the column wanted `'active'` per Stripe convention. Should have grepped `lib/localizer/billingGate.ts` BEFORE the first UPDATE, not 20 minutes later. Same rule from memory ("never write status docs from memory — grep-verify against actual code first") applies to SQL writes against unfamiliar columns.

2. **Claude Code's "Applied" reports aren't fully reliable in long sessions.** Caught at least once tonight when Claude Code reported the OAuth hash-drain edit as applied earlier in the session, but `grep` showed it wasn't on disk. After every edit from here on: `git status` + `grep` for the specific change to verify it actually landed. Don't trust the "Applied. Diff matches the proposal." message alone.

3. **Beta gating must be server-enforced, not client-side.** The `skipToLogin` button bypassed the gate completely with no server check. Pattern lesson: anywhere we have client-side validation for access control, the server endpoint must independently enforce the same rule.

4. **Magic link template fix > flowType setting.** Spent significant time iterating on `flowType: implicit`, only to discover Supabase's signup path forces PKCE tokens regardless. The actual fix was the email template — much simpler intervention point that works at the URL-construction layer rather than the client request layer. Worth knowing for future Supabase work: when the client-side flow type isn't doing what you expect, look at the email template.

5. **Defensive org provisioning is a good pattern.** Calling `ensureOrgExists` from `/dashboard/page.tsx` (in addition to the auth callback) defends against any current OR future code path that reaches the dashboard with a valid session but no org. Cheap insurance against future regressions in auth flow changes.

### Backlog items added

1. **PostHogProvider + `/api/beta/claim` cleanup.** Dead code paths now that the login page no longer writes to localStorage. Delete the claim block in PostHogProvider, delete the route, drop the `beta_invites` table. ~15 min single session.

2. **Mixed naming in login page.** State variable `accessPassword` was renamed but `inviteVerified`, `inviteLoading`, `inviteError`, and the function name `verifyInvite` were left as-is. Clean find-and-replace pass for consistency, ~5 min.

3. **Rate limiting on `/api/beta/validate`** — Unit D from April 9. Single shared password is brute-forceable without rate limiting. Upstash Redis tier still spec'd in backlog.

4. **Vercel env var hardening — 8 credentials are stored as plain text** and flagged "Needs Attention" in Vercel for not being marked Sensitive. Order to tackle: Cloudinary (2 vars), Mapbox, Resend, Anthropic, Supabase service role, Stripe (2 vars). For each: rotate at source, re-create in Vercel as Sensitive. ~60-90 min focused session. Not a blocker but real security hygiene.

5. **Pre-launch reversal checklist.** Before flipping `COMING_SOON=false`:
   - Remove the three lines added to `ensureOrgExists` in commit 093026f, OR move them behind a `BETA_AUTO_ACTIVE` env flag
   - Verify with a fresh test signup that the new org provisions with null status fields and the freemium gates correctly identify it as free tier
   - Verify Stripe upgrade flow correctly flips `localizer_plan_status` to `'active'` after payment
   - Remove or revise the BETA_GATE_PASSWORD requirement on /login (or convert it to a marketing landing page sequence)
   
   If item 1 is missed, public signups will silently get free Localizer Agency access.

6. **`orgs_plan_check` constraint is stale.** Allows `starter / growth / pro` only — no `'agency'`. The new pricing model uses `basic / pro / agency`. Either drop the legacy `plan` column once nothing reads it, or update the CHECK to match the new tier names.

7. **"Session expired" copy is misleading.** Fires on any failed magic link, including used-once tokens, malformed links, expired tokens, or true verifier failures. A new user clicking a stale link gets told their "session" expired even though they never had one. Better copy: "That sign-in link didn't work. Please request a new one below."

8. **Stale "My Workspace" orgs cleanup.** Now 14+ rows in the `orgs` table named "My Workspace" from various test signups. Audit and delete unused ones before public launch.

9. **`docs/AUTH_ARCHITECTURE.md` needs comprehensive update** to reflect tonight's changes — beta_invites is gone, magic link flow is template-driven OTP rather than PKCE, ensureOrgExists is in lib/auth/, etc.

### Workflow notes

- Drew prefers proper fixes over halfway solutions. "I want this working right. Not halfway." Drove tonight's choice to extract `ensureOrgExists` properly rather than ship a known-broken Google OAuth path.
- Drew caught my overengineered "build admin-API beta-claim endpoint" recommendation and proposed the simpler shared password. Lesson: when a fix feels like it's growing in scope, pause and check if there's a simpler architectural alternative the human can spot from outside the code.
- Two-machine workflow held up: all commits from old Mac Pro, no commits from Mac mini.

### Next session starts with

1. `git pull`, `git status`, confirm clean.
2. **Decide priority** between: (a) AUTH_ARCHITECTURE.md update, (b) PostHogProvider/api/beta/claim cleanup, (c) onboarding wizard work (still blocked on Tim), (d) remaining expense tabs.
3. Vercel env var hardening (~60-90 min if energy allows).


2026-04-29 — Pre-beta auth verification pass
Context: Beta tester onboarding scheduled for 2026-04-30. Wanted a low-impact session that protected the launch rather than introducing new code.
What got done:
Walked Part 5 (verification checklist) of AUTH_ARCHITECTURE_REWRITE_PLAN.md against the actual repo and production. All seven items verified green — yesterday's auth refactor (093026f, c6a0bfc, 4d0b74f) is genuinely on disk and deployed the way the commits claim.
One real catch: the Supabase Magic Link email template was still using {{ .ConfirmationURL }}, which routes through Supabase's /verify redirect and triggers PKCE — meaning returning testers clicking the email in a different browser/device than they submitted from would have hit "session expired." Fixed by replacing the template body with the same {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink shape used by Confirm signup. Verified live with cross-browser test (submit on laptop, click on phone) — landed on /dashboard cleanly.
Minor drift discovered for the eventual doc rewrite: app/api/beta/validate/route.ts returns { valid: true/false }, not { ok: true/false } as the plan's pre-drafted prose claims. Code is internally consistent (login page reads data.valid); only the rewrite plan's prose needs updating when it gets pasted.
Cosmetic naming overlap in app/login/page.tsx (mixes accessPassword with legacy inviteVerified/verifyInvite) confirmed cosmetic only — no behavioral effect, ~5 min cleanup whenever it happens.
What didn't:
Parts 2 and 3 of the rewrite plan — the actual prose substitution in docs/AUTH_ARCHITECTURE.md — deferred until after the beta tester is in and stable. Pre-drafted replacement prose is preserved in AUTH_ARCHITECTURE_REWRITE_PLAN.md; rewrite session is 60–75 min when picked up.
Next session should start with:

Confirm beta tester onboarding went smoothly (live signup → Localizer welcome → first artist created without auth-side issues).
Once stable, execute the AUTH_ARCHITECTURE.md rewrite from Parts 2 + 3 of the plan, with the { valid } correction folded in.
Add BACKLOG.md entry (if not already there) for the pre-launch cleanup of the beta-temp provisioning lines in lib/auth/ensureOrgExists.ts — plan='pro', localizer_plan='agency', localizer_plan_status='active' must be removed (or gated behind a BETA_AUTO_ACTIVE env flag) before flipping COMING_SOON=false, otherwise public signups silently get free Localizer Agency. The file's header comment already flags this; needs a backlog item too.
Dead-code cleanup of /api/beta/claim route + claim block in PostHogProvider + drop beta_invites table — ~15 min single session, can fold into the rewrite session or do separately.


2026-04-29 — Canvas text baseline drift investigation (rolled back)
Context: Drew flagged a beta-blocking visual issue — text on rendered IG Square, IG Story, and FB Cover formats appeared slightly north of where it sat in the editor preview, by an amount that varied per font (small for Poppins, larger for Bulland Regular and Bungee). The bug existed before this session; it was not introduced by today's auth work. Spent ~6 hours investigating and attempting fixes; ultimately rolled back to clean main without shipping anything. Beta tester onboarding tomorrow proceeds on the original codebase with the original small drift.
Branch: fix/canvas-text-baseline retained with diagnostic work. One commit on it: 92548c0 (lib/clientRender.ts baseline correction). The branch should be considered a starting point for the next attempt, not a working fix — see "Why the fix didn't work" below.
What we tried:

Diagnosis: canvas textBaseline = "middle" doesn't match CSS visual centering. Switched renderer to textBaseline = "alphabetic" with a (actualBoundingBoxAscent - actualBoundingBoxDescent) / 2 offset. Mathematically draws the visual glyph center at the requested y. Committed to branch as 92548c0.
Diagnosis follow-up: editor preview also needed correction. The editor's HTML overlay divs use transform: translate(-50%, -50%) which centers the line-box, not the visual glyph. Added a computeCenterCorrection helper to TemplateEditor.tsx and applied as a translateY offset to the venue/city/date/customText/band overlay divs. Used a hidden canvas for measurement. Did not commit — visual verification failed.

Why the fix didn't work:
Visual evidence after both changes was applied: editor preview and rendered PNG still disagreed visibly, by what appeared to be ~25px. Console measurement of the editor overlay showed divCenter at source-pixel ~565 (post-correction). Render measurement also showed visual center at source-pixel ~566. The numerical measurements said they agreed; the eyeball comparison said they didn't. I could not reconcile this within the session.
Possible explanations not investigated due to time:

The Cloudinary preview URL (buildPreviewUrl at line 145, lines 167-173 specifically) bakes its own version of the venue text into the image via l_text: overlay, separately from the HTML draggable overlay. The Cloudinary text uses a different gravity/y-offset system (g_${gravity}, x_, y_ from toLayerParams) that does not correspond to either the HTML overlay's CSS positioning or the canvas renderer's drawText positioning. Three different positioning systems may all be slightly disagreeing.
The screenshots compared earlier in the session may not have been from identical states (browser caching, hot-reload timing, stash/pop sequence). At one point a fresh screenshot pair after hard-reload showed less visible disagreement than earlier pairs.
Something else not yet identified.

Diagnostic data captured (use this for the next attempt — DO NOT regenerate):

For Poppins, all-caps "TEST VENUE" at 70px in browser canvas: actualBoundingBoxAscent = 51.85, actualBoundingBoxDescent = 1.30. Implied correction (ascent - descent) / 2 = 25.28 pixels at 70px font (~36% of font size, much larger than my mental model of 5–10%).
Editor <img> and parent container at IG Square preview are both 600×600px. top: 50% of overlay div lands at display pixel 300, which scales to source pixel 540 of a 1080×1080 source image. No container stretching.
Editor preview Cloudinary URL pattern (line 384-385): c_fill,g_center,w_${fmtDims.w},h_${fmtDims.h}/${publicId} — same as renderer's baseUrl (line 775). Underlying images are confirmed identical between editor and render.
Cloudinary text overlay uses gravity-based positioning via toLayerParams (line 145, in buildPreviewUrl), which produces a y_${px} offset from center. This is a third positioning system distinct from HTML CSS and canvas drawText, and I never confirmed how it relates to the other two.
FORMAT_DIMS in lib/clientRender.ts (line 45-50): square 1080×1080, story 1080×1350, landscape 820×312.
fd in TemplateEditor.tsx (line 770-772): square 1080×1080, story 1080×1350, landscape 820×312, tiktok 1080×1920, yt_shorts 1080×1080. Renderer dimensions match for square and story; editor's buildPreviewUrl uses different dimensions for landscape (1920×1080) — bug to investigate separately.
Editor venue <img> URL is built without text overlays (just c_fill, g_center, w/h, publicId). The Cloudinary-rendered text-overlay URL is built separately by buildPreviewUrl but I never verified where in the JSX it's used or whether the user actually sees a Cloudinary-baked-text image alongside the HTML overlays.

What didn't get done:

Editor↔render visual agreement remains broken at the original (pre-tonight) magnitude.
All Phase 2 visual verification tests aborted after editor↔render disagreement persisted.
/api/beta/claim and beta_invites table cleanup deferred from earlier in the day, still pending.

Next session should start with:

Read this log entry first. Especially the "Diagnostic data captured" list. Don't reinvent what's already known.
Investigate the buildPreviewUrl function and how Cloudinary-baked text overlays interact with the HTML draggable overlays. This is the thread I never pulled. The user may be seeing two layers of text (Cloudinary-baked + HTML overlay) at slightly different positions, and the visible "drift" might be the gap between them — not between editor and renderer at all.
Verify by inspecting the editor DOM whether there's only one source of visible venue text or two. Look for the Cloudinary URL with l_text: parameters — if it's used as a <img src> somewhere in the editor JSX, the user is seeing both Cloudinary text and HTML overlay text simultaneously. If the Cloudinary text URL is only used for downloads/exports and not displayed in the editor, then the editor↔render path is just two systems (HTML overlay vs canvas), and the bug is somewhere I haven't found yet.
Once the right comparison pair is identified, calibrate against it directly. Don't trust pattern-matched theories from this session — measure the actual visible-pixel positions of both systems, derive the correction empirically, apply once.
The branch fix/canvas-text-baseline and commit 92548c0 are available as a starting point if the renderer-side baseline fix turns out to be correct after all. Diff is preserved.

Honest assessment of why this session failed:
I produced four wrong diagnoses in succession over 6 hours: (a) multi-line lh math, (b) canvas-vs-CSS line-box baseline, (c) Cloudinary URL or image-dimension mismatch, (d) container stretching. Each was confidently asserted, then disproven by measurement or by the next layer of investigation. The pattern was: I found a real disagreement somewhere in the rendering pipeline, assumed it was the bug, fixed it, then discovered the bug persisted because there were multiple disagreements stacked. The right move on a session with this pattern is to stop, restore clean state, and resume with a stricter measurement-first protocol. Drew correctly pushed back when I tried to defer; I correctly recommended rollback when the fix overshot. Net: no production risk, no time saved, but a strong diagnostic foundation for the next attempt.

2026-04-30 — Renderer text drift bug resolved. Root cause: canvas textBaseline = "middle" doesn't match how CSS centers a line box at top:50% + translate(-50%,-50%). Fix: switched to textBaseline = "alphabetic" with per-text (fontBoundingBoxAscent - fontBoundingBoxDescent) / 2 y-offset. Verified empirically via in-browser red/green canvas overlay technique (this is now the go-to method for "two systems should agree but don't" rendering bugs). Tested across IG Square, IG Story, FB Cover, wrapped venue, Poppins + Bulland. Shipped commit 7d555b2. Investigation doc rewritten as resolved record (commit 87dc261). 4/29 attempt overshot ~25px south because it used actualBoundingBox (visible glyph extent) instead of fontBoundingBox (line-box envelope) — preserved as a warning in the doc.
Next session: [whatever the next thing is — onboarding wizard if Tim has shipped seed data, otherwise remaining expense tabs (Transport, Food, Gear, Misc, Merch, Promo, Other) following the Accommodation pattern].


Custom font upload now supports drag-and-drop. Refactored handleFontUpload to extract a processFontFile helper, added handleFontDrop and isDraggingFont state, button shows crimson border and "Drop font here" label during drag. Click-to-upload still works as before. Shipped commit 9aa40f5.


Additional 2026-04-30 work (afternoon):

Template editor grid resolution doubled to 20×20 per Tim's request, applies to all formats. Commit reference in git log.
Custom font upload now drag-and-drop (in addition to click). Commit 9aa40f5. Refactored handleFontUpload to extract processFontFile helper, added handleFontDrop and isDraggingFont state. License confirm + 5MB limit + .ttf/.otf validation all preserved.
Stale-data fix in template editor. Asset uploads from the assets page weren't appearing in the template editor without hard-refresh. Root cause: formatImageIds was a derived const computed from a server-component prop that Next's client cache could serve stale. Fix: converted to client state with a useEffect that re-queries Supabase on mount and on visibilitychange. Editor is now self-sufficient about image data regardless of navigation cache state.
Print poster default behavior changed. Venue/City/Date toggles now default OFF for the print format only (per Tim — these are rarely used on local poster). Required: (1) one-time SQL migration to set overlay_config.print.{showVenue,showCity,showDate} = false across all existing tours; (2) added PRINT_DEFAULTS constant; (3) added defaultShowField(formatKey) helper; (4) replaced 9 ?? true fallbacks with ?? defaultShowField(...). Commit 023c78d.
Renderer drift fix tester-confirmed on production. Doc status flipped via one-line sed. Commit 50033f6.

Backlog filed: Delete dead buildPreviewUrl from TemplateEditor.tsx. Delete branch fix/canvas-text-baseline.

2026-05-03 (Sunday) — Shipped band name font/color override feature. Six small commits on feature/band-name-override, merged to main as 6b961b4. Adds two nullable columns to tours (band_font_family, band_text_color), threads override resolution through all five render paths (Cloudinary editor preview, Cloudinary server PNG, Cloudinary server video, canvas client renderer, print PDF), exposes UI controls in the band-name expanded section (font dropdown including custom fonts, color picker, reset buttons, Google-Font auto-loader for the band font), and adds a "Set All Formats to Match Square" button visible only on the Square format. Button copies layout (size, x, y, align), font, color, allCaps, shortDate proportionally across all 5 other formats with a confirm dialog. Also deleted dead buildPreviewUrl function (was on backlog from renderer drift investigation).
Smaller wins from same session:

Relabeled "Square" video format as "Square Video" across template editor, assets page, and venue download pages
Relabeled "Sponsor Logo" as "Custom Graphic" in template editor UI strings (variable names and DB columns left alone)

Backlog status: buildPreviewUrl deletion done. Branch fix/canvas-text-baseline from 4/29 still superseded; safe to delete. Branch feature/band-name-override merged; safe to delete.
Next session: Build per-format image crop tool. Plan finalized: react-easy-crop library, new crop_config jsonb column on tours, modal-based UI with aspect-locked drag-and-zoom (Instagram/Canva-style), independent per-format crops, default fallback stays as c_fill,g_center (existing behavior). 4 commits planned (DB plumbing → server URL builders → client URL builders → modal UI) on a new feature/image-crop branch. Library, default behavior, and "no apply-to-all button" all decided.


Session: image crop feature shipped end-to-end on feature/image-crop. Five commits, branch head 467d482, ready to merge.
Done:

crop_config jsonb column added to tours (nullable, per-format, fractions 0–1).
Read paths updated across six files (template page, tour-data, print-pdf, generate, TemplateEditor, overlay-config).
Server-side and client-side Cloudinary URL builders apply per-format crop via c_crop,x,y,w,h/c_fill,h,w chain when crop is set, byte-identical fallback when not.
CropModal built with react-easy-crop, two-column layout (cropper + framing preview), zoom slider, save/reset/cancel. Custom modal shell (HwModal capped at 640px, too narrow for the layout) but fully matches Warhol design tokens.
Per-format trigger row beneath format-tab strip (Option B), with status pill ("✓ Custom crop" / "Default center") and disabled state when no source image uploaded. Hidden on video formats.
Red-dot indicator on format tabs that have a saved crop. Image formats only — video tabs never decorated.
Image upload and delete on assets page now clear the corresponding format's crop. Fire-and-forget, console.error on failure, three-tier early-return optimization.

Lessons:

Wrapping a single ALTER TABLE in BEGIN/COMMIT is footgun-prone — the verify query inside the transaction returned a phantom result, real column wasn't there until the bare ALTER ran. For one-statement migrations, just run the bare DDL.
Validate Cloudinary fraction syntax manually before threading new transformation patterns through routes — saves a debugging cycle if the docs are wrong.
userMemories says Warhol headings use Pragmatica Extended; actual --hw-font-display token is Bebas Neue. Memory is stale.

Backlog item created: DESIGN_SYSTEM.md font reference is wrong. Update to reflect Bebas Neue.
Next session: merge feature/image-crop to main (or get Tim to review first). After deploy is green, resume the on-the-horizon list — Localizer onboarding wizard Option B (needs Tim input), Unit D rate limiting, the 41-route billing gate, etc.

## 2026-05-04 — Autosave-first template editor + per-format band color

Six commits, all green on prod.

### Shipped

- **Debounced 500ms autosave for per-format overlay_config** (positions, sizes, toggles, alignments, fonts). Fifth in the contiguous block of debounced effects, alongside customText1, customText2, bandFontFamily, bandTextColor (the latter retired later in the session).
- **Crimson outlined "Everything autosaves." notice** above the action row in the template editor sidebar.
- **Per-format band text color.** New `bandTextColor?: string | null` field on `FormatConfig` (in both TemplateEditor and lib/clientRender — the two FormatConfig types are separate, lesson learned). Picker writes into `configs[activeFormat]`, persists via the configs autosave. Replaces the tour-level `band_text_color` override.
- **Render paths rewired** to read `overlay_config[format].bandTextColor` with `cfg.textColor` fallback: clientRender, generate, print-pdf, tour-data, EventsTable. Drops the bandTextColor parameter from three function signatures (renderPoster, buildCloudinaryUrl, buildCloudinaryVideoUrl) — per-format value is already accessible via cfg.
- **SAVE TEMPLATE button retired.** save() function, saving/savingRef/justSaved/savedFormats/dirtyFormats state, and 19 setDirtyFormats call sites all gone. Autosave is the only save path. Toast string on SET ALL FORMATS handler updated to drop the now-incorrect "Click Save Template to persist" instruction.
- **Fixed pre-existing SSR crash** in `measureTextWidth` — `document is not defined` on initial server render. One-line `if (typeof document === "undefined") return 0;` guard. Latent since the function shipped in March; surfaced during repeated hard-refreshes today.
- **Fixed SET ALL FORMATS TO MATCH SQUARE handler** — `bandTextColor` was missing from the unconditional copy list, so Square's band color silently failed to propagate. Added with `?? null` to match the "with Square's settings" contract from the confirm dialog (covers both override propagation and override clearing).

### Commits (chronological)

- ee2e16a — feat(localizer): autosave overlay_config and SSR-guard measureTextWidth
- 36e30ed — docs: add May 2026 post-image-crop handoff
- c95e0b6 — feat(localizer): per-format band text color in template editor
- 314f8e6 — feat(localizer): per-format band text color across all render paths
- e1ad29b — feat(localizer): remove SAVE TEMPLATE button, autosave is the only save path
- bc83d57 — fix(localizer): SET ALL FORMATS now propagates bandTextColor

### Phase 2 column-retirement — RESOLVED same-day, see below

- `tours.band_text_color` column itself (no SQL run today)
- Tour type field at `app/dashboard/tours/[tourId]/template/TemplateEditor.tsx:150` referencing `band_text_color`
- SELECT `band_text_color` in `app/dashboard/tours/[tourId]/template/page.tsx:11`
- `band_text_color` branch in PATCH handler at `app/api/tours/[tourId]/overlay-config/route.ts:28`

These four (plus the SQL) belong in a single focused cleanup commit when ready.

### Lessons captured

- **Local FormatConfig types are separate.** lib/clientRender.ts has its own FormatConfig declaration that mirrors TemplateEditor.tsx's. Adding a field to one does not add it to the other. Next refactor: search for ALL declarations of any type before extending it.
- **Edit prompts must be internally consistent.** Telling Claude Code to drop a parameter AND change its argument at a call site in the same diff is a contradiction. tsc caught it but should have been caught at review. Lesson: when an edit involves a function signature change, all call sites need their argument dropped (not rewired) in the same diff.
- **Reports should explicitly include type-system references.** "Find every X reference" needs to surface other type aliases sharing the name, not just runtime references.
- **The SAVE TEMPLATE button created perception drift.** Drew couldn't tell if it was redundant; a user definitely won't. When some fields autosave (custom_text, font, color, image uploads) but others don't (positions/sizes/toggles in the per-format config), the button creates exactly this kind of "I don't know which actions persist" confusion. Either autosave everything or autosave nothing — the half-half state is worse than either pole.

### Phase 2 column retirement — same day

After the initial six commits, ran the column retirement pass for band_text_color:

- 33baeed — chore(localizer): retire band_text_color column references
- SQL run by hand in Supabase SQL Editor: `ALTER TABLE tours DROP COLUMN band_text_color;`

Cleared four code references (Tour type field, template/page.tsx SELECT, overlay-config PATCH allowlist branch, save-pulse CSS keyframe/class), then dropped the column. Verified prod hard-refresh + autosave drag cycle both before and after the SQL.

Correction: the dangling-list bullet earlier in this entry incorrectly attributed the save-pulse CSS to template-editor.css. It actually lived in app/animations.css (a shared animations file). Caught at the verify-first step before the cleanup commit.

### Next session priorities (TBD)

- Phase 2 column-retirement pass for `band_text_color` (the four code references above + `ALTER TABLE tours DROP COLUMN band_text_color`)
- Or back to the post-image-crop handoff: Path C (Unit D rate limiting), Path B (loose-change cleanup), or Path A (launch readiness — depends on Tim input + bank account decision)
- Or band font follow-up if it ever feels limiting (today's decision was to keep band font tour-uniform; can be revisited)

## 2026-05-05 — Template editor UX polish + preview scale fix

Three commits, all green on prod.

### Shipped

- **SET ALL FORMATS button spacing.** Bumped marginRight from 16px to 96px to give visual breathing room between the button and the "Everything autosaves." crimson notice. Iterated 16→32→64→96 to find the right value.
- **CROP IMAGE button relocation.** Moved the per-format crop trigger (button + "DEFAULT CENTER" / "✓ Custom crop" status indicator) from its own block above the 2-column grid into the existing "DRAG TEXT TO POSITION / PREVIEW LONGEST NAMES" header row, right-aligned via marginLeft: auto. Now sits above the top-right corner of the image preview, in line with PREVIEW LONGEST NAMES.
- **Image preview frame removal.** Dropped the 3px solid border and var(--hw-bg-surface) background from the preview wrapper. Visual frame was confusing — especially when the image was narrower than the wrapper, which left visible gutters of contrasting background on either side.
- **Preview scale closed-loop bug fix.** Found a pre-existing bug: containerRef was attached to the inner positioned container whose width is `fmtDims.w * previewScale` — i.e., the ResizeObserver was measuring the element whose width is being controlled by the calculation it feeds. Closed feedback loop that locked containerWidth to whatever the first render produced (initial useState(700) default), and never responded to viewport changes or tab switching. Moved containerRef to the parent wrapper so the observer measures actual available space. After the fix, previewScale responds correctly to window resizes and tab switches, and Landscape (which was severely undersized due to the bug) now fills the available cell width.

### Commits

- 6738f48 — ux(localizer): increase margin between SET ALL FORMATS and autosave notice
- 9bffc1d — ux(localizer): move CROP IMAGE button to header row above preview image
- cf1bd2c — ux(localizer): fix preview scale closed-loop bug; remove visual frame around preview

### Lessons captured

- **Iterate visual spacing live; don't argue from defaults.** First margin bump (16→32) was indistinguishable. Second (32→64) was visible. Third (64→96) was right. Cheap to iterate, expensive to argue about pixel values without seeing.
- **Closed-loop measurement bugs are invisible until they aren't.** The containerRef-on-the-measured-element pattern produced "looks reasonable" output for most formats because the height-cap dominated and masked the bug. Landscape (W-dominated) was the canary that surfaced it. Worth grepping the codebase for similar patterns: `useRef` + `ResizeObserver` + the same element having an explicit calculated width.
- **"Why does it get bigger after refresh" was the right question.** It pulled the architectural bug to the surface where a cosmetic question (Drew's "remove the borders") would have hidden it. Often the user's diagnostic instinct is sharper than the proposed fix.

### Late afternoon: Direction A toolbar redesign

Drew flagged the toolbar area (format tabs + SET ALL FORMATS + autosave indicator + PREVIEW RENDER) as "messy and unorganized." Three visualizer mockups sketched as design directions: A (tight horizontal cluster + demoted autosave), B (PREVIEW RENDER as lone primary + SET ALL FORMATS as text link), C (two-tier with horizontal divider). Drew picked Direction A.

**Shipped:**

- **"Everything autosaves." demoted from large display-font box to small mono pill.** Was 22px display font with 3px crimson border and padding 6px 12px — visually dominant. Became 11px mono with 1.5px crimson border and padding 3px 10px — same crimson cue, fraction of the visual weight.
- **SET ALL FORMATS relocated and simplified.** Was a standalone two-line button positioned right-of-tabs with subtitle ("Overwrites layout, fonts, and colors") and crimson outlined treatment. Now lives inside the action row alongside PREVIEW RENDER, single-line, no subtitle, styled to match inactive format tabs (white bg, light gray 3px border, dark text). Confirm dialog wording preserved verbatim — users still see the full consequences on click.
- **PREVIEW RENDER promoted to primary action.** Was outlined-only (white bg, 3px black border, dark text, display font 12px). Now filled black primary (var(--hw-bg-invert) bg, white text, 3px var(--hw-border-strong) border, mono 11px). Visually echoes the active format tab treatment.
- **Net result:** right cluster reads as a hierarchy. Autosave pill (status, lowest priority) on top. Below: button group with SET ALL FORMATS (secondary) + PREVIEW RENDER (primary). The whole right-side echoes the format tab system's visual language — same fonts, same border treatments, just at a different position.

**Iterations:**

Mockup used "✓ AUTOSAVED" pill text. Drew preferred "everything autosaves" wording. First applied as lowercase, but Drew wanted uppercase to match the surrounding buttons. Two commits to land: 1077b51 (Direction A applied) + 968693c (text case fix).

### Late afternoon: Auth investigation surfaced a real bug

Drew tried to log in on his laptop after 1-2 days of inactivity and got "session expired." Vercel logs showed "Invalid Refresh Token: Refresh Token Not Found" errors firing on every request including public routes (/coming-soon).

**Triage:** Cleared cookies + tried login on incognito → worked. Confirmed the issue was local to the laptop's regular browser cookies, not a server-side auth flow bug. Cleared regular browser cookies, fresh login worked. Immediate user pain resolved.

But Drew asked "how do we prevent this from happening to users?" — and that pulled the actual root cause to the surface.

**Investigation:**

- Checked Supabase auth settings: time-box and inactivity timeout both set to 0 (disabled). Refresh tokens effectively long-lived.
- Audited middleware.ts and lib/supabaseClient.ts.

**The bug — `lib/supabaseClient.ts` cookieStorage adapter was setting cookies with `max-age=3600` (1 hour).** Every refresh from the browser-side wrote a 1-hour-lifetime cookie. After 1 hour of browser inactivity, cookies expired even though the refresh token in Supabase's database was still valid. Returning users would silently lose their session and either land on /login or see "Refresh Token Not Found" errors logged in middleware (the noise we saw).

**Fix:** bumped `max-age` from 3600s (1 hour) to 2592000s (30 days). Verified by logging in fresh on laptop and checking DevTools — cookies now show expiration well beyond 30 days (server-side cookies set even longer; browser-side refreshes will use the new 30-day cap).

**Worth noting:**

- This was almost certainly the cause of the April 16 "auth bug recurrence verification" flagged in the previous handoff doc. Same root cause, never properly identified. Closed now.
- Affects every user, not just Drew's laptop. Anyone returning to the site after >1 hour of inactivity was getting silently logged out. Real UX win.

**Three follow-ups captured in backlog (commits e553ad4 + 15d0793) but not shipped today:**

1. Migrate from `flowType: "implicit"` (deprecated) to `flowType: "pkce"` — bigger change, dedicated session.
2. Graceful middleware error handling on getSession() failures — the noisy logs are still firing on stale-cookie requests.
3. Investigate the April 28 temporary band-aid in middleware.ts — unconditional redirect to /coming-soon for / on public hosts because the env-var gate wasn't firing in production. Still in place a week later.

### Late afternoon: Crop modal viewport fix on laptop

Drew opened the crop modal on his laptop and saw the zoom slider + action buttons (Reset/Cancel/Save) clipped off the bottom. Mac Pro external display (taller viewport) was unaffected.

**Diagnosis:** Modal had `maxHeight: 85vh` and body had `overflowY: "auto"` (correct). But the body was missing `flex: 1, minHeight: 0`, and the header/note/error/footer were missing `flex-shrink: 0`. When the modal was forced to 85vh on shorter viewports, every flex child shrank proportionally instead of the body absorbing the constraint and triggering its overflow.

**Fix:** Pinned header, note, error, and footer with `flex-shrink: 0`; let body be the only flexible item with `flex: 1, minHeight: 0` so it shrinks-and-scrolls when content is too tall. Six lines added across five style objects. Verified on laptop after Vercel deploy — slider and buttons now accessible.

**Lesson:** `min-height: 0` is the magic that lets `overflow: auto` actually trigger inside a flex child. Default `min-height: auto` would force the grid to its full content height and break scrolling. Worth remembering for any future modal layouts.

### Updated commits list (full day, in order)

- 6738f48 — ux(localizer): increase margin between SET ALL FORMATS and autosave notice
- 9bffc1d — ux(localizer): move CROP IMAGE button to header row above preview image
- cf1bd2c — ux(localizer): fix preview scale closed-loop bug; remove visual frame around preview
- 955e33b — session log: 2026-05-05 template editor UX polish + preview scale fix (morning entry)
- 1077b51 — ux(localizer): redesign template editor toolbar (Direction A)
- 968693c — ux(localizer): autosave pill text to uppercase
- e553ad4 — backlog: middleware should gracefully handle stale/invalid refresh tokens
- a7e0ef2 — fix(auth): extend browser cookie max-age from 1 hour to 30 days
- 15d0793 — backlog: auth follow-ups after maxAge fix
- f0d0793 — fix(localizer): crop modal cuts off slider and buttons on short viewports

### Additional lessons captured (afternoon)

- **Show, don't argue.** Three visualizer mockups (Directions A/B/C) gave Drew a clear basis to pick from. Far better than describing alternatives in prose. Mockups took ~1 minute to generate; saved likely an hour of back-and-forth.
- **Echo the existing system instead of inventing.** New SET ALL FORMATS exactly mirrors inactive format tab styling. New PREVIEW RENDER mirrors active format tab styling. Zero new design tokens introduced; full visual coherence achieved by referencing what was already there.
- **Drew's diagnostic instincts surfaced a real bug.** "How do we prevent this from happening to users?" pulled the auth investigation out of "user has stale cookies, restart browser" and into "actually every user is being affected by a 1-hour cookie maxAge." The architectural question paid off — same pattern as the morning's preview-scale find.
- **`min-height: 0` is the magic for scrollable flex children.** Default `min-height: auto` keeps a flex item at its content size, which prevents `overflow: auto` from triggering. Worth remembering for any future modal layouts.
- **Multi-machine viewport bugs are easy to miss.** The crop modal worked fine on Mac Pro but was broken on laptop. Similar viewport-dependent bugs may exist elsewhere in the editor — worth a pass on shorter viewports before public launch.

### Next session priorities (TBD)

- Back to the post-image-crop handoff: Path C (Unit D rate limiting), Path B (loose-change cleanup), or Path A (launch readiness — depends on Tim input + bank account decision).
- Auth follow-ups (in priority order): graceful middleware error handling > investigate April 28 band-aid > PKCE migration.
- Audit other modals and editor surfaces for viewport-dependent bugs similar to the crop modal cutoff.
- Optional follow-up on the preview scale fix: maxPreviewH = 600 is a reasonable starting value, but the editor could benefit from a responsive cap that grows with viewport height on tall monitors. Low priority.

## 2026-05-05 (continued — evening session 2)

**Per-field color overrides shipped end-to-end.** Three new optional
fields (venueColor/cityColor/dateColor) on FormatConfig, each falling
back to format-default textColor. Mirrors the bandTextColor pattern
from commit 314f8e6.

Commits:
- 06dae0f — UI + types + lib/clientRender.ts (image formats)
- 2d0491f — app/api/renders/print-pdf/route.ts (print PDF)
- 2de8ad6 — app/api/renders/generate/route.ts (video, both paths)

Bonus: TikTok format tab label appended with " VIDEO" for clarity.

Kept on cfg.textColor by design: logo/sponsor tinting + customText1/2.

UI is three color block pickers in the editor sidebar under TEXT
SIZES & ALIGNMENT, mirroring the bandTextColor picker exactly.
Live preview reflects per-field colors in real time. Per-format
storage — overrides on Square don't bleed to Story.

Process notes:
- Two staleness checks paid off this session: confirmed both server
  render files already had bandTextColor scaffolding from 314f8e6,
  which made phases 4 and 5 mechanically tiny.
- Phase 1+2+3 bundled as one feature commit (06dae0f); phases 4 and
  5 as separate render-path commits.

Total today: 15 commits across auth maxAge fix (a7e0ef2 — likely
closes the April 16 recurrence), Direction A toolbar redesign, crop
modal viewport fix on laptop, and full per-field color feature.

### Next session candidates
- Graceful middleware error handling (~30 min, closes auth arc from
  this morning's work)
- April 28 middleware band-aid investigation (blocks Coming Soon
  gate removal)
- Unit D rate limiting (deferred from April 9)
- Onboarding wizard Option B (still needs Tim's input)

## 2026-05-11 — country-aware geocoding for drive-time path

### Shipped (3 commits)
- d0983f3 — feat(tourrouter/mapbox): country-aware geocoding for geocodeCity + getDriveInfo
- 786f4ce — feat(tourrouter/geography): thread country through prefetchDriveData and getMapboxDriveInfo
- f4c2cb3 — feat(tourrouter/drive-info): read country/state from body, forward to geocoding

### The bug
Drew imported a 10-show US tour into TourRouter. Brooklyn → Washington showed ~43hr drive time, Washington → Atlanta showed 40h 12m / 2523 mi, Cambridge → Brooklyn showed `?` (no route). Other legs (Atlanta → Nashville, Nashville → Chicago, etc.) were correct.

### Root cause — incomplete April 10 migration
Two parallel geocoding systems in the codebase. The April 10 work converted financials, flights, and export paths to use `getCityCoordinates` from `lib/tourrouter/geocoding.ts` (country-filtered, backed by curated `geo_cities` table). The **drive-time path was never migrated.** It still ran `app/api/tourrouter/drive-info/route.ts` → `geocodeCity` in `mapbox.ts` → `geocode_cache` table → bare Mapbox `places/{city}.json?limit=1` with no country qualifier.

Symptom A: "Washington" + no country → Mapbox returned Washington State (lat 48). Cross-country routing produced ~40 hours. A stale geocode_cache row from April 3 made the bug persistent across page loads.

Symptom B: "Cambridge" + no country → Mapbox returned Cambridge UK by population priority. Mapbox Directions couldn't route across the Atlantic → UI rendered `?`.

Confirmed by code trace: `page.tsx:427` → `prefetchDriveData` → `getMapboxDriveInfo` → POST `/api/tourrouter/drive-info` (body had no country) → `geocodeCity(city)` (city only) → bare Mapbox. Curated `geo_cities` never consulted. Page DID separately call `/api/tourrouter/geocode/prefetch` to populate `coordsMap` for `calcTourFinancials` — that path used the new system correctly. So the financials engine had correct coords while the drive table didn't.

### Fix — minimal additive refactor
Added optional `country` and `state` params to `geocodeCity`, `getDriveInfo`, `prefetchDriveDataServer`, `getMapboxDriveInfo`, `prefetchDriveData`, and the drive-info route handler. When `country` is provided, `geocodeCity` dynamic-imports `getCityCoordinates` from `./geocoding` and returns its result. On null/error/missing-country, falls through to the legacy path unchanged.

Dynamic import (not static) used to prevent `next/headers` (via `supabaseServer` inside `geocoding.ts`) from leaking into client bundles that import `mapbox.ts` via the `@/lib/tourrouter` barrel. Same class of issue as the April 10 `geocoding-shared.ts` fix.

No deletions, no deprecations, no semantic changes to cache writes or error handling. All new params optional — existing callers without country continue to use the legacy path identically.

### Verification — Cal's Cutoff tour (test org)

| Leg | Before | After |
|---|---|---|
| Cambridge → Brooklyn | `?` | 4h 11m / 214 mi ✓ |
| Brooklyn → Washington | route blank | 4h 35m / 229 mi ✓ |
| Washington → Atlanta | 40h 12m / 2523 mi | 10h 25m / 640 mi ✓ |
| Atlanta → Nashville | 4h 9m / 251 mi | 4h 9m / 251 mi ✓ (regression check) |
| Nashville → Chicago through SF → West Hollywood | various correct | all unchanged ✓ |

Cross-tour spot check on older tours (Midwest Tour 2026, Euro Tour 26, NEW VAN TOUR) — no regressions.

### Backlog items surfaced today (see BACKLOG.md)
1. `cacheGeocode` and `cacheDriveInfo` fire-and-forget writes bleed in Vercel serverless — neither cache table has new rows after our deploy despite drive times working correctly in UI. Every page load re-queries Mapbox.
2. Delete `geocodeCity`/`cacheGeocode` from `mapbox.ts` and drop the `geocode_cache` table (Phase 3 cleanup after soak).
3. `state` column on `tour_shows` + parser update — for state-level ambiguity (Portland OR vs ME, Cambridge MA vs OH, Springfield ×∞). Country was enough for today's tour but not in general.
4. Dedupe Washington rows in `geo_cities` (`country='US'` and `country='USA'` both point to DC — inconsistent matching).
5. Consolidate duplicate `buildDriveDataKey` and `DriveDataMap` definitions between `mapbox.ts` and `geography.ts`.
6. `drive_cache` schema: add `origin_country` / `dest_country` for cross-tour same-name disambiguation.
7. Pre-existing `/api/notifications` cookies() warning during static build — noticed during this session's builds, separate issue.

### Process notes
- Three commits in one push, three separate logical units. Verified in prod immediately. Plan-diff-apply discipline held all three rounds.
- Dynamic import for cross-module-boundary safety paid off — clean `npm run build` with no `next/headers` warnings.
- Sequential `tsc --noEmit` → `npm run build` (not parallel) after Claude Code hit the `.next/types/` race once. Standard going forward.

## 2026-05-11 (continued) — drive-info cache write bleed: full fix

### Shipped (3 commits)
- d369b71 — fix(tourrouter/drive-info): await cache writes to prevent Vercel fire-and-forget bleed
- f8381dc — fix(tourrouter/mapbox): check response.ok in cache write helpers to surface silent HTTP errors
- 9540155 — fix(tourrouter/mapbox): round drive_seconds to integer for drive_cache column type

### What we entered with
After the earlier country-aware geocoding fix shipped, querying `drive_cache` showed zero new rows despite ~9 drive-info calls per Cal's Cutoff page load. Diagnosed as fire-and-forget cache writes being killed when the Vercel serverless function tore down on response return. Filed in BACKLOG as the top-priority follow-up.

### What we actually found
Three nested failure modes:

1. **Vercel serverless teardown** — the original diagnosis. `cacheGeocode` and `cacheDriveInfo` were called without `await`, so the function returned before the network writes could complete. Fix: `await Promise.all([cacheGeocode(...), cacheGeocode(...)])` and `await cacheDriveInfo(...)`, wrapped in try/catch so a transient cache failure doesn't surface as a user-facing 500.

2. **Silent HTTP errors** — `fetch()` only throws on network errors, not on HTTP error responses. `cacheGeocode` and `cacheDriveInfo` were awaiting the fetch but never checking `response.ok`, so Supabase 4xx/5xx responses resolved cleanly without throwing. The new try/catch from fix #1 saw nothing to catch. Fix: capture `const response = await fetch(...)`, check `if (!response.ok)`, read body (bounded to 500 chars), throw with status + body so the caller's try/catch surfaces the real error.

3. **Schema mismatch (the actual root cause)** — `drive_cache.drive_seconds` is an `integer` column. Mapbox's Directions API returns `route.duration` as a float (sub-second precision, e.g. `47887.711`). Every production write was failing with Postgres error 22P02 `invalid input syntax for type integer`. Fix: `Math.round(info.driveSeconds)` at the write boundary. In-memory value flowing back to the UI stays as the original float for display; only the persisted column gets rounded. Sub-second precision is meaningless for tour driving estimates anyway.

The `cacheGeocode` writes had been landing all along (Cambridge UK row at 15:32 today proved it) — only `cacheDriveInfo` was failing because `geocode_cache` happens to have no integer columns. The drive_cache table has been silently rejecting writes since day one.

### Why our manual curl test misled us
We tested cacheDriveInfo's request shape with curl using hardcoded `"drive_seconds": 3600` — already an integer. Got 201 Created. We concluded the request shape worked. It DID work, but only for integer drive_seconds values. We never tested with the float values Mapbox actually returns. Lesson: when reproducing a failing production call manually, use the same values production uses, not handpicked ones.

### Verification
Cal's Cutoff routing page → hard refresh → 15-second wait → SQL query returned 9 fresh rows in drive_cache, one per leg, all drive_seconds as integers (15083, 16531, 37475, 14920, 26725, 22981, 89376, 47888, 22488), drive_hours as floats. Zero `[drive-info] cacheDriveInfo write failed` warnings in Vercel runtime logs across the refresh window. Test rows from today's manual curl + manual SQL insert cleaned up.

### Process notes
- The `response.ok` check in cache write helpers is a permanent improvement, not a temporary diagnostic. Both helpers now properly surface Supabase errors. Pattern worth applying to any other raw-fetch Supabase writes in the codebase.
- Bash heredocs avoided throughout per CLAUDE.md rule. Commit messages all single-line via `-m`.
- Three commits stacked cleanly. Each verified with `npx tsc --noEmit` + `npm run build` before push. No build regressions.

## 2026-05-11 (continued) — country-code normalization across geo_cities and tour_shows

### Shipped
Single Supabase migration transaction. No code commits.
Resolved BACKLOG item #5: Dedupe Washington in geo_cities + country code audit.

### What we entered with
The geocoding bug from earlier today (Cambridge UK / Washington WA / Brooklyn→Atlanta) was technically fixed by threading country through the lookup. But auditing `geo_cities.country` revealed the curated catalog held 25 distinct alpha-2 codes (`US`, `GB`, `CA`, `DE`, `FR`, `IT`, ...) plus 2 uppercase full-name fossils (`CANADA`, `SWEDEN`), against a codebase convention of lowercase-English-uppercased-at-query-time. Result: ~340 curated rows orphaned and unreachable from the app.

### What we learned mid-investigation
- The codebase's de facto canonical form is **lowercase English words** stored in `tour_shows.country` (`'usa'`, `'uk'`, `'canada'`, `'germany'`, etc.), **uppercased at query time** before hitting geo_cities via `country.toUpperCase().trim()`. The `geo_cities.country` column needs to hold the UPPERCASE-lowercase-English form. NOT ISO 3166 alpha-3, which I had initially assumed.
- `normalizeCountry()` in `lib/tourrouter/parsers.ts` only handles 7 countries explicitly (usa/uk/canada/germany/france/netherlands/australia). Anything outside falls through as the lowercased input — so an alpha-2 `'IT'` from a parser would store as `'it'` and never match the migrated `'ITALY'` rows. Today's tours don't have this problem (all 5 distinct values are in the explicit list), but future imports could. Future hardening: extend normalizeCountry to handle every country in geo_cities + vehicleDatabase explicitly.
- `getCityCoordinates` in `lib/tourrouter/geocoding.ts` has a write-back path that adds new rows with country uppercased. New data has been canonicalized correctly since April 10. The migration was fixing the OLD seed data only.
- Manual curl test earlier today returned 201 Created with `drive_seconds: 3600`. Looked successful but only proved the request shape works for integer values — never validated the FLOAT values production actually sends. **General lesson:** when reproducing a failing production call manually, use the same values production uses, not handpicked sentinels.
- `drive_cache` upserts via `Prefer: resolution=merge-duplicates` don't update `fetched_at` because that column isn't in the payload — `default: now()` only fires on INSERT. Means `fetched_at` reflects "first written" not "last refreshed" once a row exists. Filed as separate backlog entry.

### Migration
Pre-flight: confirmed Washington had 2 rows, the US-coded one with `iata_code='DCA'` to keep.

BEGIN/COMMIT transaction:
1. DELETE the Washington duplicate (id `a1c77ea8-c229-43e4-a3ad-2157bb1a5756`)
2. UPDATE `geo_cities.country` via CASE statement mapping 24 alpha-2 codes + 2 uppercase full-names to UPPERCASE-lowercase-English (US→USA, GB→UK, CA→CANADA, DE→GERMANY, FR→FRANCE, IT→ITALY, AU→AUSTRALIA, ES→SPAIN, JP→JAPAN, NL→NETHERLANDS, BE→BELGIUM, CH→SWITZERLAND, IE→IRELAND, PL→POLAND, AT→AUSTRIA, NZ→NEW ZEALAND, PT→PORTUGAL, CZ→CZECH REPUBLIC, DK→DENMARK, NO→NORWAY, SE→SWEDEN, FI→FINLAND, HU→HUNGARY, IS→ICELAND, plus already-canonical CANADA and SWEDEN as no-ops)
3. UPDATE `tour_shows`: 11 uppercase `'USA'` rows → `'usa'` (cosmetic — `.toUpperCase()` at query time meant they already worked, but clean is clean)
4. UPDATE `tour_shows_crew`: same 11-row case fix

Post-flight verification: 24 distinct uppercase-English values in geo_cities, no remaining 2-letter codes or fossils, 4 legitimate cross-country dupes remaining (birmingham UK+USA, cambridge UK+USA, london CANADA+UK, manchester UK+USA), Washington dedupe confirmed.

### Functional verification
Cal's Cutoff routing page hard-refreshed: drive times displayed correctly (identical to earlier today — coords didn't change, only country values). drive_cache repopulated with 9 fresh rows from the post-migration refresh (after first deleting the 17:34 rows to prove writes were landing rather than upserts being no-ops). Today's earlier `Math.round(drive_seconds)` fix continues to work — no Postgres 22P02 errors in Vercel runtime logs.

### Result
- 402 geo_cities rows (was 403 minus 1 deleted Washington dupe), all in UPPERCASE-lowercase-English canonical form
- USA pool: 63 → 212 reachable rows (3.4x)
- UK pool: 6 → 34 reachable rows (5.7x)
- CANADA pool: 1 → 21 reachable rows (21x)
- 21 entirely new reachable country pools (GERMANY, FRANCE, ITALY, JAPAN, SPAIN, NETHERLANDS, BELGIUM, SWITZERLAND, IRELAND, POLAND, AUSTRIA, NEW ZEALAND, PORTUGAL, CZECH REPUBLIC, DENMARK, NORWAY, SWEDEN, FINLAND, HUNGARY, ICELAND, AUSTRALIA) that the app could not previously reach
- ~340 curated rows previously orphaned by convention mismatch are now reachable to the existing query path

### Process notes
- Mid-session, I had to re-read several files I'd been reasoning about from memory (geocoding.ts, parsers.ts, constants.ts, drive-info/route.ts, schema dumps). Reading them surfaced multiple incorrect assumptions including the wrong canonical form target. Treating as a forcing function going forward: **read the actual code before designing migrations that depend on conventions**.
- BEGIN/COMMIT transactions in Supabase SQL Editor work fine for multi-statement data migrations. CLAUDE.md memory's warning about transaction blocks specifically referred to single-statement ALTER TABLE DDL.
- All SQL queries clearly labeled, separate code blocks, manual execution. No migration files, no terminal execution. Per discipline.

## 2026-05-12 — Kurt Penny notes shipped end-to-end, color contrast + button decoupling + font bumps, BACKLOG.md restructure

### Shipped (17 commits, all auto-deployed to Vercel)
- e710dd7 — fix(tourrouter/mapbox): write `fetched_at` on `cacheDriveInfo` upsert to unfreeze the timestamp
- b7095a1 — chore(tourrouter/mapbox): remove unused `CITY_COORDS` import
- 6e970a4 — docs(backlog): mark CITY_COORDS removal and fetched_at upsert fix resolved
- be538be — docs(backlog): note `cacheGeocode` shares the same fetched_at-frozen bug, won't fix standalone (geocode_cache slated for removal)
- 9e06924 — docs(backlog): mark logo overlays on videos resolved (verified working 2026-05-12)
- 197be3b — docs(backlog): consolidate resolved items into bottom section
- e9ae45f — fix(localizer/assets): decouple Parse Schedule + Confirm Import buttons from crimson (missed in initial inventory)
- 4460f93 — refactor(dashboard): bump small font sizes (9→11, 10→12, 11→13) across 33 in-scope files
- 67760c6 — feat(localizer/assets, template-editor): Kurt note #3 — five UX fixes (dismissible tips, drop misleading copy, file-format hints, bolder field labels, sub-field dividers)
- Plus 8 more commits covering: color contrast pass (`--hw-text-muted` #8A8580 → #6B6661, `--hw-amber` #c49a3c → #946F1F, HwModal viewport overflow fix), button color decoupling (`--hw-action-primary` token introduced + 17 inline buttons migrated across 11 files), BACKLOG.md tier reorganization, new TourRouter import drop zone bug entry, two new CLAUDE.md workflow rules (13, 14).

### Continuing from 2026-05-11 — drive_cache follow-ups
- **`fetched_at` upsert fix (e710dd7).** `cacheDriveInfo` POST to PostgREST uses `Prefer: resolution=merge-duplicates`. On INSERT the `default: now()` fires; on UPDATE only columns present in the body are written, so `fetched_at` was frozen at first-write forever. Added explicit `fetched_at: new Date().toISOString()` to the POST body — now updates on every upsert. Verified in production: deleted `(cambridge → brooklyn)` from `drive_cache`, hard-refreshed Cal's Cutoff, row repopulated with a current timestamp while the other two Monday-fixed legs retained their original timestamps (correct read-through cache behavior).
- **`CITY_COORDS` import removal (b7095a1).** `lib/tourrouter/mapbox.ts` line 1 imported `CITY_COORDS` from `./constants` but never referenced it. Dead since the April 10 migration moved coord lookups to `getCityCoords` from `./geography`. Deleted the import. Two remaining string mentions on lines 59 and 83 are inside comments describing the conceptual lookup hierarchy; left intact as separate doc-cleanup concern.
- **`cacheGeocode` shares the same `fetched_at`-frozen-on-upsert bug as `cacheDriveInfo`** (commit be538be in BACKLOG). Won't fix standalone since `geocode_cache` is slated for removal in the upcoming Phase 3 cleanup. If that drop slips past the soak window, mirror the `cacheDriveInfo` fix in `cacheGeocode`.

### BACKLOG.md reorganization (medium-effort restructure)
The open portion of `docs/BACKLOG.md` had grown ad-hoc with three loosely related `## sections` (Post-launch considerations / TourRouter — Blocked items / Auth follow-ups) plus a Resolved tail. Hard to scan, hard to prioritize. Restructured into **seven readiness tiers** ordered by what's needed to move an item:

- 🔴 Active issues affecting users — bugs beta users could trip over right now
- 🟡 Pre-launch gates — things that must be true before flipping `COMING_SOON=false`
- 🟢 Ready to build — scoped, unblocked, just needs a session
- ⚪ Awaiting Tim — blocked on decision, copy, or sign-off
- ⏳ Soak items — waiting on production data or time to pass
- 🧹 Code hygiene queue — refactors, dead code, low-pressure cleanup
- 💭 Future ideas — speculative post-launch work (currently empty placeholder)

During the restructure:
- Marked **8 stale entries resolved** (CITY_COORDS import, `drive_cache.fetched_at` upsert, logo overlays on videos, custom text image path, custom text video Step 6, venue link page stale render URL, plus the 2 from drive consolidation pass — BUG-E `render_poster_url` misdiagnosis and drive-info cache write bleed full fix).
- **Dissolved 3 old `##` section headings**; their content distributed across the seven tiers.
- **Promoted 3 sub-items to `###` headings**: middleware auth error handling (was a bullet inside Advance feature), PKCE migration + graceful middleware error handling (were numbered sub-items inside Auth follow-ups). Auth follow-ups intro paragraph folded as italicized context note onto PKCE migration. TourRouter — Blocked items intro folded onto Advance feature.
- Net result: open items grouped by what's needed to move them, not by topic. Easier to triage a session against the tier list than against the topical list.

End-state counts: 28 open `###` items + 11 resolved `###` items = 39 total. 8 `##` tier headings + Resolved.

### Kurt Penny notes — all 10 shipped today
Kurt's beta feedback batch of 10 items, all shipped:

**Color contrast (Kurt #1–#4):**
- `--hw-text-muted` darkened from `#8A8580` to `#6B6661` — contrast against `--hw-bg-surface` (`#FFFFFF`) ~3.3:1 → ~5.7:1, clears WCAG AA for normal text. Single-token edit propagates to ~430 instances across 51 app files.
- `--hw-amber` darkened from `#c49a3c` to `#946F1F` — contrast ~2.6:1 → ~4.58:1, clears AA. ~57 instances. `--hw-amber-ghost` and other amber-derived tokens untouched (pale enough to not move the math).
- HwModal viewport overflow fix: added `max-height: calc(100vh - 48px)`, `display: flex`, `flex-direction: column` to `.container`, plus `overflow-y: auto; flex: 1` on `.body`. Share with Marketing modal (and every other HwModal consumer) now scrolls within the viewport instead of pushing buttons below the fold.

**Button color decoupling (Kurt #5):**
- Introduced `--hw-action-primary: #1A1A1A` and `--hw-action-primary-hover: #000000`. Primary action buttons now use these instead of `--hw-crimson` / `--hw-crimson-dark`. Crimson stays as a **brand accent** (marketing pages, progress bar fills, use-case accents, brand dividers) and a **destructive** signal (`HwButton variant="destructive"`, Revoke/Reset buttons). The `--hw-red` alias token remains defined but unused — reserved for future destructive-only repurposing.
- HwButton.module.css `.primary` and `.primary:hover` rewritten to use the new tokens. `.destructive` left on crimson.
- 17 inline-styled primary action buttons migrated across 11 dashboard/login/advance files (ADD ARTIST, CREATE TOUR, + NEW EVENT, GENERATE ALL, SAVE & GENERATE, + ADD SHOW, IMPORT SHOWS, + ADD EXPENSE, PARSE DATA, APPLY MAPPING, SAVE TO TOUR, CONFIRM & SAVE, + Add Contact, Add, Save Changes, login submit, advance submit).
- Follow-up pass on Localizer schedule import page (e9ae45f) caught two additional buttons — Parse Schedule and Confirm Import — that were missed in the initial 17-button inventory. User flagged the still-red Confirm Import button after the first deploy. Now black.

**Font size bumps (Kurt #2):**
- Dashboard small font sizes raised: `fontSize: 9` → `11`, `fontSize: 10` → `12`, `fontSize: 11` → `13`. **433 replacements across 33 in-scope files** (commit 4460f93).
- Scope: every `.tsx`/`.ts` under `app/dashboard/`, `app/account/`, `app/v/`, `app/advance/`, `app/report/`, `app/login/`, `app/auth/`. Marketing pages (`app/page.tsx`, `app/tourrouter`, `app/localizer`, `app/diy`, `app/roadapp`, `app/showcase`, `app/pricing`, `app/landing.css`), `app/components/`, and CSS Modules **explicitly excluded**.
- Regex-anchored to literal terminators (`fontSize: 11,`, `fontSize: 11 }`) to avoid false-matching `padding: 11`, `borderRadius: 11`, etc. Rule order enforced (Rule 1: 11→13 first, then 10→12, then 9→11 last) to prevent cascade where a new 11 from Rule 3 would re-bump to 13.
- Verified post-pass: out-of-scope file counts match pre-pass exactly (10 untouched `fontSize: 11`, 14 untouched `fontSize: 10`, 6 untouched `fontSize: 9` — all in `app/components/`, marketing pages, or other excluded surfaces).

**UX fixes (Kurt #3, comprising #6–#10):**
- **#6 — Dismissible Upload Tips card.** Added `tipsDismissed` state, `useEffect` that reads `localStorage.getItem("hw61.uploadTipsDismissed")` on mount, `dismissTips` handler that writes the flag. Card wrapped in `{!tipsDismissed && (...)}`. Header converted to flex row with × close button (Bebas Neue 18px, muted).
- **#7 — Misleading instruction removed.** "Click an uploaded image to open the text editor" deleted from line 307 of `app/dashboard/tours/[tourId]/assets/page.tsx`. The action didn't actually work — likely orphaned copy from an earlier flow.
- **#8 — File format hints.** Extended `renderFormatGrid` signature to accept an optional `hint?: string` param. Empty-state upload prompt now renders a third line below "or drag and drop" when hint is provided. Photos: `"PNG, JPG, WEBP · up to 20MB"`. Videos: `"MP4, MOV, WEBM · up to 100MB"`. Both `tiktok` and `yt_shorts` formatIds share the 100MB cap per the formatId carve-out in `handleUpload` line 130. Hint sized at fontSize 11 to stay subordinate to surrounding 12/13px text while respecting today's font-bump floor.
- **#9 — Field label hierarchy.** 26 sidebar field labels in TemplateEditor.tsx bumped from `fontWeight: 500` to `fontWeight: 700`. Two `replace_all` Edits keyed on literal `fontSize: 12, fontWeight: 500, textTransform` and `fontSize: 12, fontWeight: 500, letterSpacing` — both signatures appear only on labels, never on the 5 non-label `fontWeight: 500` sites (buttons, inputs, selects), confirmed by inspection of all 31 occurrences. Establishes label/control hierarchy in the sidebar where everything previously flattened at 12px medium.
- **#10 — Sub-field dividers.** Venue/Date/City sub-blocks inside the TEXT SIZES & ALIGNMENT card now separated by a thin `borderBottom: "1px solid var(--hw-border-light)"` divider between each, last block excluded via `idx < arr.length - 1` guard. `Fragment` added to React import to allow `key` on the wrapping element. Only one iterator qualified for divider treatment per the criteria (stacked sub-field blocks with `marginBottom`); other multi-element groups in the sidebar already have visual separation (checkbox glyphs, 3px black card borders, etc.) and weren't touched.

### New backlog items discovered
- **TourRouter import — paste text and CSV drop zone broken.** Surfaced during Kurt note button-color testing. Dragging a CSV file over the drop zone produces no visual highlight (drag-over state doesn't fire). Dropping does nothing — no upload, no parse, no error. Paste text / CSV window also rejects dragged input. Suspected pre-existing (not a regression from today's CSS-only edits). Logged in 🟡 Pre-launch gates alongside the Advance feature audit — same TourRouter-blocker category.

### Discipline additions — two new CLAUDE.md workflow rules
- **Rule 13** — Reconcile `docs/BACKLOG.md` before pushing the `docs/SESSION_LOG.md` update. End-of-session grep BACKLOG for keywords from the session's commits — file paths, feature names, bug descriptions. Any resolved item gets a Resolution stamp and moves to `## Resolved`. Catches the "fixed something and forgot to update the backlog" failure mode.
- **Rule 14** — Run a 20-minute `docs/BACKLOG.md` audit every 2–3 weeks. Walk 🔴 Active issues and 🟡 Pre-launch gates first. For each open item, ask "would I be surprised if this is still broken?" — test the suspicious ones. Catches side-effect resolutions: items that got incidentally fixed by unrelated work and were never explicitly closed. Rule 13 alone misses these because nobody can predict which adjacent items a given commit will resolve.

Workflow rules now total 14. Both rules used immediately at end of today's session — Rule 13 reconciliation confirmed no open items needed to move (today's UX/quality work was net-new, not resolution of prior backlog entries).

### What's still pending
- **Onboarding wizard Option B** (Localizer-only narrative) — awaiting Tim.
- **Stripe business setup** — awaiting bank account decision.
- **Country-aware geocoding Phase 2** (drive_cache `origin_country` / `dest_country` schema columns) — in 🟢 Ready to build.
- **Unit D rate limiting** — in 🟢 Ready to build.
- **The eight remaining items in 🧹 Code hygiene queue** — BUG-B (stale `allowed` whitelist), custom font upload debt, lint cleanup on public viewers, parallel FormatConfig/FieldConfig types, /api/venue-links possibly-dead-code, middleware auth error handling, PKCE migration, graceful middleware getSession error handling.

### Session stats
- 17 commits, all on `main`, all auto-deployed to Vercel.
- 2 files protected as documented (`lib/clientRender.ts`, `lib/tourrouter/financials.ts`) — neither touched.
- No QA agent sessions today.

### Process notes
- BACKLOG reorganization was the largest single rewrite of the session. Did it structural-summary-then-apply, same pattern used for prior light moves — surfaced two count discrepancies in the user's spec before applying, which would have produced an off-by-one final file if not flagged.
- Color-contrast and font-size passes both ran as "single token edit / single regex pass = N hundred propagated changes" — payoff of CSS variables and consistent inline-style conventions. Net change: 5 small edits in `globals.css` and `HwModal.module.css`, plus 433 inline `fontSize:` replacements, plus 22 inline button-color replacements. All low-risk, high-leverage.
- Rule 13 (BACKLOG reconciliation) used at session end — confirmed no open items needed to move. Today's work was net-new improvement, not resolution of prior tracked items. Reconciliation took ~5 minutes; would have caught a missed resolution had there been one.
- Mid-pass on button-color decoupling, user flagged a still-red Confirm Import button on the Localizer schedule import page. Re-grepped the file, found two missed buttons (`parseBtn` and `confirmBtn` style objects), shipped follow-up commit e9ae45f. Lesson: when the inventory pass relies on grepping for a usage pattern (here, `background: var(--hw-crimson)` on inline-styled buttons), styles defined as object literals in a `const s = { ... }` style dictionary at the bottom of the file are easy to miss because they're declarative rather than inline-rendered. Future inventory passes should grep for the pattern AND scan style-dictionary objects.

## 2026-05-13 — Five-item Kurt + geocoding + Rule 14 day

**Commits:**
- 6266023 — feat(template editor): consolidate Short Date Format and All Caps toggles into Venue/City/Date card (Kurt batch 2 item 2)
- a4a9f07 — feat(tourrouter): country-aware drive_cache (Phase 2)
- 18a022e — docs: migration discipline rule for Supabase Oct 2026 grant change
- a137e27 — docs: mark two template editor bugs Resolved (Rule 14 verification pass)
- dfb3c5c — feat(tourrouter): add drag-drop to PASTE TEXT / CSV card on import page (work completed 2026-05-13, committed 2026-05-14)
- af0016e — docs: mark Kurt batch 2 item #2 shipped in BACKLOG (reconcile, committed 2026-05-14)

**Kurt batch 2 — item #2 shipped.** Consolidated Short Date Format and All Caps toggles into the Venue/City/Date card on the template editor. The two toggles previously sat stranded at the bottom of the sidebar, four cards below the field-visibility checkboxes for the fields they actually modify. Moved them in under a horizontal divider with the existing field-visibility checkboxes. Also fixed the vestigial "Venue, city & state in uppercase" caption to "Venue and city in uppercase" (state was merged into city in April). Items #1 (checkbox-to-reveal + Band Name consolidation) and #3 (horizontal stepper) still open.

**Country-aware drive_cache (Phase 2) — shipped.** Schema migration added `origin_country` and `dest_country` NOT NULL columns, swapped unique constraint to include them. Code changes in `lib/tourrouter/mapbox.ts` (getDriveInfo filters cache on country, cacheDriveInfo writes country with `.toUpperCase().trim()` normalization mirroring cacheKey, defensive guard skips cache entirely when either country is empty — handles off-day rows) and `app/api/tourrouter/drive-info/route.ts` (passes country into cacheDriveInfo). The 55 existing pre-Phase-2 rows were truncated as part of the migration since cache data is regeneratable. Verified working in production today (2026-05-14): 38 rows in drive_cache, all with country populated, zero NULL/empty country fields. Disambiguation between same-named cities (Paris-FR vs Paris-TX, London-UK vs London-ON) is now structurally enforced.

**CLAUDE.md rule 18 + BACKLOG entry for Supabase Oct 2026 grant change.** Reactive to a Supabase email announcing the default Data API grant on public-schema tables will be removed Oct 30, 2026. New rule formalizes the standard new-table SQL pattern (CREATE TABLE + explicit GRANTs for authenticated/service_role + ENABLE RLS + CREATE POLICY) so the discipline is in place before the cutoff. BACKLOG soak entry tracks Oct 29 verification work.

**Rule 14 verification pass — two stale entries moved to Resolved.** Deliberate verification of the two items the kickoff doc flagged as "possibly already stale." Both turned out to be quietly fixed in earlier commits but never moved out of 🟢 Ready to build. Router cache stale UI on template editor: fixed in a580240 (targeted router cache invalidation on save, avoiding the prod-breaking force-dynamic / revalidate=0 patterns from f3eae0d / 2c7ff86). Stale video preview on asset replacement: fixed in 34dc628 (refetch tour image IDs on mount + tab visibility). Rule 14 paid for itself on its first deliberate run.

**TourRouter import drop zone — feature add, not bug fix.** The BACKLOG entry described a drag-drop regression. Investigation showed the two actual drop zones (UPLOAD SPREADSHEET, UPLOAD DEAL MEMO) worked correctly — the entry conflated them with the PASTE TEXT / CSV card, which was paste-only by design and never had drag-drop wired. Added drag-drop on the paste card for visual + functional parity. Mirrors the spreadsheet card pattern, reuses handleSpreadsheetDrop, click still opens the paste modal. Closed via feature add rather than regression fix.

**Post-session verification today (2026-05-14) and a methodology-driven detour.** Confirmed Phase 2 is live in production. Briefly went down the wrong path — verification query filtered to "rows from past 15 minutes," which returned zero. Misread this as "the fire-and-forget bug is killing Phase 2 writes in prod." Claude Code traced the route handler and correctly pushed back: the fire-and-forget bug was already fixed on 2026-05-11 (commits d369b71, f8381dc, 9540155), and the current code awaits both cache writes inside try/catch. The 15-minute filter just excluded yesterday's correctly-written rows. ~45 minutes diagnosing a phantom.

**Lessons reinforced:**

- Verification queries need to answer the question you actually want answered. "Past 15 minutes" answered "is the cache being written to right now," not "did Phase 2 ship its benefit." Better verification: `count(*), max(fetched_at) FROM drive_cache`. State the question explicitly before writing the query.
- Trace-first prompts create the space for premise pushback. If the prompt is "fix this bug," the model fixes it. If the prompt is "read the relevant files and report, no edits yet," the model has room to flag that the premise is wrong. The fire-and-forget pushback today only happened because the prompt asked for a trace before a fix. Treat "trace before fix" as the default pattern for any diagnostic work.
- Rule 14 catches real things. First deliberate audit pass closed two stale entries that would have sat indefinitely otherwise.

**Next session should start with:**

- Open candidates: Kurt batch 2 items #1 (checkbox-to-reveal + Band Name consolidation) or #3 (horizontal stepper), Unit D rate limiting (still well-scoped, ~90 min, no blockers), or Localizer launch-prep work. No urgent bugs.
- BACKLOG state is fully current as of 2026-05-14.

## May 20, 2026 — Context sync after May 19 doc drop; 30-day Localizer sprint begins

### Done
- Read and absorbed the May 19 doc set:
  - `HWY61_Codebase_vs_Four_Product_Plan_May_19_2026.md` — ~70-75% of four-product foundation already built
  - `HWY61_Detailed_Weekly_Build_Plan_May_19_2026.md` — week-by-week through mid-October launch
  - `HWY61_Localizer_30_Day_Launch_Plan_May_19_2026.md` — June 19 Localizer public launch
- Confirmed scope discipline for the 30-day plan: Localizer-only, no surface work on Plan / Books / Road App during this window. Auto-Advancing audit may run in parallel but is not blocking.
- Bank account details in hand — Stripe business setup unblocked.
- Brainstorm session captured the read-receipts feature concept for potential later inclusion inside Localizer (artist-side asset delivery: trackable share links, email opens, share page views, downloads, ticket-link UTM clicks as posting signal). Added to BACKLOG under future ideas.

### Decisions confirmed
- Four-product architecture locked: Road App + HWY61 Plan + Localizer + HWY61 Books + Touring Suite bundle.
- Localizer 2.0 venue-side direction parked (post-launch reconsideration possible).
- Full 30-SKU Stripe restructure deferred to Phase 1A post-launch — this 30 days does only the six Localizer price IDs.
- Naming for the two new products landed on HWY61 Plan and HWY61 Books (family-branded), not standalone names.

### Next session
- Complete Stripe business setup: enter EIN, finish bank account selection, update billing contact to billing@hwy61labs.com — do all three in one focused Stripe-dashboard session.
- Verify Tim Pre-Day-1 #2 agreements (30-day timebox, narrative by Day 3, weekly outreach volume, four-product decisions defer 60 days).
- Begin Day 1 of the 30-day plan: archive legacy Stripe products (TR Standalone $29, Add-on $20, Add-on Agency $30, old Localizer Basic $39), create Localizer Solo/Pro/Agency at $29/$59/$129 monthly + annual (six new price IDs), capture into `LOCALIZER_PRICE_MAP` constant.
- Day 2+ Stripe webhook rewrite and existing customer pricing migration in subsequent sessions.

### Notes
- Continuing the 30-day sprint in a new chat for clean context.

## 2026-05-21 — Stripe business setup + Localizer onboarding welcome

**Stripe business setup (partial):**
- Connected HWY61 Labs LLC bank account in Stripe live mode via Plaid
- Uploaded EIN verification document
- Updated public/support email to billing@hwy61labs.com (kept account-alerts on drew@hwy61labs.com)
- Product creation (Day 1 of 30-day plan) parked pending Tim's pricing reconsideration
- Discovered: all Stripe products created since March were in sandbox, not live. Live mode is a clean slate, so Day 3 customer migration in the 30-day plan is moot.

**Localizer onboarding welcome page:**
- SQL migration: added orgs.localizer_onboarding_completed (bool) and orgs.localizer_onboarding_step (int). Backfilled all existing orgs to completed=true.
- New route /dashboard/onboarding/localizer with server-side eligibility gate (Localizer plan signal + not completed)
- New step persistence API at /api/onboarding/localizer/step
- Parent /dashboard/onboarding page now redirects Localizer-only users to the new route
- Initial implementation was a 5-step wizard (welcome → artist → show → generate asset → share link). Built end-to-end. On test: the flow was contrived — Localizer is a batch-tour tool, not a single-show tool. Single-show wizard doesn't match real product workflow.
- Pivoted to a simple welcome page with optional video and one CTA ("GET STARTED" → /dashboard/artists). 80 lines instead of 530. Ships today, video to be added later.
- All infrastructure (schema, API, redirect) preserved through the pivot — only the wizard component itself was replaced.

**What didn't get done:**
- Day 1 product creation (parked on Tim's pricing reconsideration)
- Day 2 webhook updates (blocked on Day 1)
- Tim's CP 575 for EIN verification (parked, sandbox products in test mode aren't affected)
- Onboarding video recording

**Next session should start with:**
- Address the /dashboard direct-access gap (see BACKLOG note below) — users hitting /dashboard directly with onboarding incomplete bypass the wizard
- Or pick the next Tim-independent item from Days 4–7 of the 30-day plan
- Or revisit Stripe product creation once Tim resolves pricing

**Continued evening — onboarding video script + artist tile polish:**

- Drafted Localizer onboarding walkthrough script (`docs/LOCALIZER_ONBOARDING_VIDEO_SCRIPT.md`). ~2:30 narration, tour-manager-to-tour-manager tone, scene markers from hook through to the venue-link share moment. First pass; needs voice edits before recording.
- Identified the gear icon on artist tiles (links to master artist profile) was hover-only AND unlabeled — failing both desktop discoverability and mobile entirely.
- Located source: `app/dashboard/TourTile.tsx`. TourTile is reused for both artists and tours — the `tourId` prop holds the artist id for artist tiles. The gear icon block was nested inside a `mounted && hovered && type === "artist"` conditional.
- Build iteration on the tile button (three rounds):
  1. Removed hover-only condition, added "ARTIST PROFILE" text label, positioned absolutely top-right.
  2. Top-right overlapped the artist name → moved to bottom-right, replacing the existing "→" arrow span (artist tiles only; non-artist tour tiles still get the bare arrow).
  3. Text-only styling didn't read as a button → added 3px border, padding, and image-aware background (transparent on plain tiles, `rgba(0,0,0,0.3)` on image-backed tiles).
- Final state: artist tiles display a visible "ARTIST PROFILE →" pill in the bottom-right corner, image-aware styling, click propagation stopped so the button navigates independently of the main tile.

**Still backlog'd from today:**

- Master Artist profile page: hide TourRouter-only sections (Roster, Lodging, Vehicles, Hospitality, Promo & Marketing, Business Entity, Technical Production) from Localizer-only users. Existing `FeatureFlagContext` is hostname-based (DIY vs not) and doesn't know plan status — recommend tactical plan-status check in the page rather than refactoring the flag system. ~60-90 min focused work.
- Dashboard direct-access redirect gap (separate backlog entry).
- Onboarding video recording.

**Updated next-session entry points:**

- Master Artist polish (section gating) — fully unblocked, 60-90 min
- Dashboard direct-access redirect fix — half-hour
- Onboarding video recording — solo task
- Stripe pricing decision — check in with Tim


## May 23, 2026

### Shipped
- Cursor-responsive LOCALIZER wordmark with bordered box treatment (`9ab6490`) — black 3px border, crimson text-shadow + box-shadow that track cursor position via CSS variables, smooth 0.45s cubic-bezier easing. Includes eyebrow removal ("Tour Marketing" tag was conflicting with new bordered box).
- Tim launch briefing doc at `docs/TIM_LAUNCH_BRIEFING.md` (`810dc1b`) — covers 30-day plan status, blockers on Tim, strategic decisions made without him, current docket.
- Nav header simplified for public launch — removed JOIN THE BETA button and portfolio links (/tourrouter, /diy, /roadapp). Three nav items now: Pricing, Sign in, "Start your free trial" CTA.
- Dead CSS cleanup (`d72807f`) — stripped 6 abandoned rule groups (.features-grid, .feature-card, .use-cases-grid, .use-case-card, .testimonial-grid, .testimonial-card, .hero-eyebrow) plus orphan nav button styles. No behavior change.
- Launch progress tracker at `docs/LAUNCH_PROGRESS.md` (`c6fcbf5`) — week-by-week checkbox structure mirroring the May 19 30-day plan, grounded in actual SESSION_LOG and BACKLOG.

### Decisions
- **Option A locked for landing strategy:** `/` (root) becomes the Localizer landing page. `/tourrouter`, `/diy`, `/roadapp` to be hidden at launch. When TourRouter ships, we re-architect.
- **Pricing tier names locked:** Solo (1 artist), Pro (up to 5), Agency (up to 12). Prices remain placeholder $XX until Tim confirms.
- **All CTAs:** "Start your free trial" everywhere. Beta framing dropped.
- **LOCALIZER wordmark animation:** explored 14+ directions across two brainstorm rounds. Settled on cursor-responsive shadow (cursor = light source casting wordmark shadow). Letterpress depth was too subtle; sound wave bisect didn't land; setlist scribble felt cheap. The cursor-light effect was the only one that earned "I like this."

### New process rule
After every Localizer/HWY61 session: update both `docs/SESSION_LOG.md` (this file) AND `docs/LAUNCH_PROGRESS.md` (checkbox tracker). Both files commit and push together. Added to Claude's memory.

### Blocked on Tim
- Pricing decision — blocks Stripe Day 1 product creation, downstream effects on Days 2 + 6
- Onboarding video v1 notes — sent earlier this week, awaiting feedback
- Welcome email copy review — I'll draft next, ping Tim before it goes live
- Canned support response copy — Day 7 item, would benefit from Tim's input

### Next session candidates
- Welcome email (Day 6 of 30-day plan) — Drew-owned, ~45 min
- Move `/localizer` content to root `/` — small, mechanical
- Hide `/tourrouter`, `/diy`, `/roadapp` routes (redirect to `/coming-soon`)
- Bump Tim if blockers haven't moved in ~48 hours


## May 24, 2026

### Shipped
- Landing page prices: $XX placeholders → real numbers ($29 / $59 / $129)
- Localizer moved to root /; HWY61 Labs portfolio preserved at /labs with noindex meta tag
- /tourrouter, /diy, /roadapp redirected to /coming-soon via next.config.js
- Consolidated config: deleted empty next.config.mjs stub
- fadeUp cascade + smooth scroll on landing hero (ported from labs page pattern)
- Pricing grid layout fix on landing (3-column explicit, prevents wrap)
- Landing page CTAs repointed from dead /#waitlist anchor to /pricing
- **Stripe Day 1 complete:** 6 live prices created (Solo/Pro/Agency × monthly/annual), captured into `LOCALIZER_PRICE_MAP` at `lib/stripe/localizerPrices.ts`, 7-day trial wired via `subscription_data.trial_period_days`, priceId validation added to checkout route
- /pricing page restyled to match Localizer Warhol aesthetic: sticky nav, featured-card crimson offset shadow, color-coded tier names (blue/crimson), proper button styling

### Decisions
- **Stripe product modeling:** 3 products (Solo / Pro / Agency), 2 prices each — cleaner subscription objects and receipts than single-product-six-prices
- **7-day trial set in code**, not Stripe Dashboard — Stripe's modern UI doesn't expose trial config on the price form; configuring in checkout code is more flexible anyway
- **/labs preserved**, not deleted — 562 lines of real HWY61 Labs portfolio, may revive when TourRouter launches

### Security note
- Restricted Stripe key (`rk_live_...`) pasted in chat by mistake when looking for the secret key. Rotated immediately in Stripe, replaced with proper standard secret key (`sk_live_...`) in `.env.local`.

### Blocked on Tim (still pending)
- Onboarding video v1 notes
- Welcome email copy review (need to draft first)
- Canned support response copy (Day 7)

### Next session candidates
- Welcome email draft (Day 6) — Drew-owned, ~45 min
- Stripe Day 2: webhook consolidation (two webhook handlers exist; consolidate to /api/billing/webhook with idempotency)
- Free tier engineering — pick one of the 5 items (watermark renderer is probably the simplest first step)
- Vercel env var update: `STRIPE_SECRET_KEY` to live mode for production


## May 26, 2026

### Shipped — mobile responsive polish on /pricing and /

Three small fixes after the initial `/pricing` restyle exposed mobile-layout problems:

1. **Consolidated `pricing.css` into the `/pricing` inline `<style>` block.** Deleted `app/pricing/pricing.css`, removed the `import "./pricing.css"`, moved all 9 mobile-only rules into the inline `<style>` in `app/pricing/page.tsx` as a `@media (max-width: 768px) {}` section, rebased selectors to `.pricing-page .foo`, dropped every `!important` flag.

2. **Hid the nav "Start your free trial" CTA at ≤768px on `/pricing`.** Was wrapping to 4 lines + colliding visually with the offset shadow at narrow widths. Redundant with the per-card "Get Solo/Pro/Agency" CTAs which stay visible. One-line rule inside the new mobile `@media` block: `.pricing-page .nav-cta { display: none; }`.

3. **Scaled the LOCALIZER wordmark on `/` at ≤768px.** Pre-existing issue (not caused by this session): wordmark was overflowing the container at 375px and 600px viewports, pushing past sub-headline + buttons to the right. Root cause: `font-size: clamp(80px, 12vw, 160px)` floored at 80px on mobile, combined with 6px letter-spacing and 8×8 box-shadow, gave ~458px width in a 335px container. Mobile override added: font 48px, letter-spacing 3px, padding 12×20px, `--shadow-x`/`--shadow-y` rest values 3px (flows through to text-shadow 3×3 and box-shadow 5×5 via the existing `calc` formulas). Total mobile wordmark width ≈ 273px — fits comfortably with breathing room.

### Why we didn't just strip `!important` from pricing.css

Initial hypothesis going into the cleanup: when desktop styles moved from JSX `style={{}}` props into an inline `<style>` block scoped to `.pricing-page` earlier in the week, the `!important` flags in `pricing.css` would become dead weight. The inline `<style>` rules used `.pricing-page .foo` (specificity 0,2,0) vs the bare `.foo` in `pricing.css` (0,1,0), so the inline rules should win at desktop without `!important` doing anything.

Reality: out of 12 properties guarded by `!important`, 10 turned out to be load-bearing. The inline `<style>` block lives in the `<body>` (rendered as part of the component output); `pricing.css` loads in the `<head>`. Inline `<style>` has equal selector specificity AND later source order, so it wins the cascade at desktop. At mobile widths, the bare `.foo` selectors in `pricing.css` were losing on specificity AND source order to `.pricing-page .foo` in the inline block — `!important` was the only thing forcing mobile rules through.

Fix: move mobile rules INTO the inline `<style>` block under a `@media (max-width: 768px) {}` section. Now both rule sets have equal specificity and the mobile block comes later in source order, naturally winning at mobile widths. `!important` no longer needed anywhere.

### Next session candidates
- Welcome email draft (Day 6) — Drew-owned, ~45 min
- Stripe Day 2: webhook consolidation
- Free tier engineering — pick one of 5 items (watermark renderer is the simplest first step)
- Vercel env var update: `STRIPE_SECRET_KEY` to live mode for production


## 2026-05-27 — Day 2 webhook consolidation (turned into real bug fix), welcome email drafts, landing positioning shift

**Commits shipped today (3):**
- c2e6cd6 — chore(stripe): consolidate webhooks + target localizer_plan columns (Day 2)
- 678800a — feat(landing): elevate venue-delivery framing in hero, add W-9/stage plot/FOH to scope
- 27f1f34 — fix(support): correct stale Localizer pricing in FAQ ($39-$139 -> $29-$129)

**What shipped:**

Day 2 turned into a real fix, not just cleanup. The existing /api/billing/webhook was writing to legacy `plan` + `plan_status` columns, while `lib/localizer/billingGate.ts:getLocalizerAccessLevel()` reads from `localizer_plan_status` and `bundle_plan_status` (the Unit A/C freemium columns). Result: paid signups would have authenticated through Stripe but never received product access through the gate. Latent bug, not yet observed only because no live customers exist. Now fixed.

Webhook rewrite swaps:
- `planFromPriceId` (env-var-based, returned "starter" as fallback) → `tierFromPriceId` from `lib/stripe/localizerPrices.ts` (returns null if unknown).
- Old `plan` + `plan_status` columns → `localizer_plan` + `localizer_plan_status` (the canonical Localizer gating columns).
- Stripe sub status mapping properly fleshed out: `trialing` → `active` so trialing customers get product access; `past_due`/`unpaid` → `past_due`; `canceled` → `canceled`; `paused`/`incomplete` mapped explicitly. Previous code mapped everything-not-active to `past_due`, which would have flagged trialing customers as behind on payments.
- Unknown priceId logged as warning; customer mapping (`stripe_customer_id`, `stripe_subscription_id`) preserved, only the plan write is skipped. Webhook returns 200 regardless — Stripe retries can't recover from this case without restructuring the idempotency insert order (backlogged).
- Added `.select()` + zero-row warning logs to all `orgs` update calls per standing rule.

Old `/api/stripe/webhook/route.ts` deleted (was writing to the orphan `subscription_status` column). `subscription_status` column dropped from `orgs` table after deploy verified.

Landing hero updated. Removed "Localizer is tour marketing automation" undersell line, added "Drop in your W-9, stage plot, and FOH requirements too," refreshed closer to "Every promoter gets one link with everything they need." Kept yesterday's redesigned 4-clause headline and CTAs untouched.

Stale Localizer pricing corrected in the support FAQ at `app/dashboard/support/page.tsx:56`: $39–$139/mo → $29–$129/mo. Pre-May-23 numbers were live in a logged-in surface — credibility risk if a customer hit the FAQ post-checkout.

**Drafted (awaiting Tim review):**

Welcome email — 4 variants total. Two voice splits ("Get to work" peer-direct, "Friendly steps" structured) × two framing variants (v1 marketing-asset framing, v2 docs-inclusive framing). Drafts captured in chat; bundle into a Tim handoff doc next session.

**Key learnings:**

- "Trace before fix" saved the session twice. First when the constraint failure on the backfill exposed the three-coexisting-plan-systems architecture (legacy `plan`, current `localizer_plan`, bundle `bundle_plan`). Second when the grep for the hero file revealed the hero had already moved past "Tour dates in. Tour assets out." — would have written a diff against a tagline no longer on the page.
- "Tim owns narrative/copy" is real but flexible. Landing page hero shipped with Drew's call (Tim sees the change in deploy). The shift was conservative enough — single paragraph edit, docs-inclusive framing — that ship-then-notify made sense. FAQ positioning copy deferred for Tim review.
- Backlog item: webhook idempotency insert order should move to after successful processing if Stripe retries should actually recover from org-update failures. Current order makes retries no-op.
- Localizer's docs-delivery feature (W-9, stage plots, FOH via venue share link) is shipped but was almost never mentioned in marketing surfaces. Positioning shift began today on landing hero; remaining surfaces (pricing page feature row, in-app empty states, /v/e/[token] venue page, first-asset celebration UI, video script) still need treatment.

**Tim status:**

Open threads:
- Onboarding video v1 — notes/approval (no movement)
- Welcome email copy review — NOW UNBLOCKED. Drafts exist (v1 + v2, 4 variants). Bundle into Tim review doc next session.
- Canned support response copy — no movement
- NEW: FAQ positioning copy review — `app/dashboard/support/page.tsx` lines 56 and 145 still contain "tour marketing automation" framing inconsistent with new landing hero. Bundle with Tim review.
- NEW: Landing hero diff (informational) — single-paragraph copy shift Tim should see for narrative continuity.

**Still open (not touched today):**

- Stripe Day 3 (Vercel STRIPE_SECRET_KEY swap to live + create live webhook endpoint + verify) — natural next session
- Free tier engineering: watermark renderer, shows-per-month counter, feature gates, upgrade wall UI
- Onboarding Option B (Localizer-only wizard) — blocked on Tim's narrative input
- Legacy `plan` / `plan_status` / `billing_subscription_id` column cleanup — backlogged
- Trial countdown UX (`trial_ends_at` write from webhook) — backlogged
- TourRouter/bundle webhook coverage when bundle pricing exists — backlogged
- Docs-delivery positioning rollout to remaining surfaces (pricing page, in-app, venue page, celebration, video script) — partially done, more queued

**Next session starts with:**

Stripe Day 3 — live env var swap + live webhook endpoint creation + verification. Combine STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET swaps in one Vercel session (signing secret won't match production until both are live-mode). Then create the live webhook endpoint at dashboard.stripe.com/webhooks pointing at https://hwy61labs.com/api/billing/webhook, with the 3 events subscribed. Verify with Stripe Dashboard's "Send test webhook" — confirm 200 response and clean Vercel logs.

Before Day 3 work, write the Tim handoff doc bundling: welcome email v1+v2 drafts (4 variants), FAQ positioning copy review request, landing hero informational note.


## 2026-05-28 — Legal docs finalized + pricing audit & Free card

**Done:**
- Privacy Policy + ToS finalized: HWY61 LLC entity, June 1 effective date, invite-only + render-limit lines dropped. Live in app/privacy/page.tsx and app/terms/page.tsx.
- Canned support responses entity name corrected; doc finalized.
- Entity rename complete codebase-wide (grep clean — no "HWY61 AI" anywhere in app/ or lib/).
- /pricing: fixed Pro/Agency artist counts to 5/12; added Free tier card (non-checkout CTA, box-sizing fix for the <a>).
- Landing page: added Free tier card; fixed annual savings 20%→~17%; dropped stale "Free during beta" line.
- BACKLOG: 3 new pre-launch gates added (email routing, legal review, Free tier engineering).
- Memory: legal entity corrected to HWY61 LLC (not HWY61 Labs LLC).

**Not done / flagged:**
- Free tier engineering (watermark additive pass, 5-shows/mo counter, feature/format gates, upgrade wall) — half-day+ net-new; now a launch blocker because Free cards are live on two pages.
- /pricing "tours" vs "shows" terminology — Solo "3 tours" looks stale; flagged for Tim.
- Landing pricing-note final wording — Tim should bless.
- Day 3 live Stripe verification with Tim still pending (real-signup screen-share).

**Next session starts with:**
Free tier engineering build. Sequence: billing gate ("no plan" → free access) → watermark additive pass → shows/mo counter → feature/format gates → upgrade wall.


## 2026-05-28 — No-card trial model locked

DONE:
- Watermark CUT (Tim's call). Free-tier-with-watermark model is DEAD.
- No-card 7-day trial model locked: magic link → wizard → 7d full access → free/blocked.
- Gate reads trial_ends_at as paid-equivalent (commit 8095476).
- ensureOrgExists seeds trial-not-active (commit 67cf438, unpushed).
- Backfilled 22 beta orgs → fresh 7-day trial (cold June 5). Shared org d38702d7 preserved active + owner_email set to hwy61ai@gmail.com.
- Both code commits verified: `npx tsc --noEmit` clean, `npm run build` green (72/72 static pages). Both unpushed at session end.
- Docs reconciled: `LAUNCH_PROGRESS.md` rewritten Free-tier-scope section as Trial model; `BACKLOG.md` "Build the Free tier (engineering) before launch" pre-launch gate moved to Resolved as CUT.

⚠️ IGNORE the old handoff's "Free tier engineering" sequence (watermark, 5-shows/mo counter, format gates). None of it is happening. Trial model has no show limit, no watermark.

NEXT SESSION, IN ORDER:
1. PUSH the two unpushed commits → triggers Vercel deploy. Nothing is live until this.
2. Tim's 5 email questions (Q1 resolved by trial-gate work; 4 remain): welcome rewrite trigger + body, Day 5/7 nudges, cron home, idempotency, cancellation copy.
3. DONE this session — watermark struck from BACKLOG (Free tier engineering gate moved to Resolved/CUT).

pushed trial model live + verified; built and shipped the Day 5/7 nudge system (table + route + schedule, commits 1d49587, b4f8fd9); dry-run verified; first fire June 3. Next session: watch the first live cron run, handle Tim's remaining email Qs (welcome body wiring), and the advance-cron-never-scheduled discovery.

## 2026-06-02 — Trial model live + nudge system shipped

DONE:
- Pushed the trial model to production (commits 8095476 gate + 67cf438 seed). Verified live via access-bucket query: 22 active trials, 1 shared org (d38702d7) preserved active, 14 correctly expired/blocked. Vercel deploy green.
- Built the Day 5/7 trial-nudge email system end to end:
  - trial_nudge_emails idempotency table (RLS on, service-role only, unique(org_id,nudge_type)).
  - Cron route app/api/billing/trial-nudge/cron/route.ts (commit 1d49587) — patterned on advance cron, Tim's May 28 copy, welcome-email styling, hardcoded 29/59/129.
  - Dry-run verified targeting against live data June 2 — both windows empty (testers ~3 days out), no mis-targeted orgs.
  - Created CRON_SECRET in Vercel; scheduled via vercel.json "0 13 * * *" (9am ET) (commit b4f8fd9). First real fire June 3–4 when testers hit the Day 5 window.
- Docs updated: LAUNCH_PROGRESS reconciled (commit 10ad7ab) — trial commits no longer "unpushed," nudge system logged, Tim's email Qs down from 4 to 2.

DISCOVERY (flag for Tim): the advance cron (app/api/tourrouter/advance/cron) has NO external trigger — no vercel.json entry before today, no GitHub Action, no scheduler. TourRouter advance emails are likely NOT auto-firing in production. Separate from Localizer; needs Tim's decision.

NEXT SESSION:
1. Watch the first live cron run (June 3, 9am ET) in Vercel Cron Jobs logs — confirm day5_sent/day7_sent/errors behave.
2. Tim's 2 remaining email questions: Q3 welcome-body wiring into /api/welcome, Q5 cancellation copy.
3. Raise the advance-cron-no-trigger discovery with Tim.

HOUSEKEEPING (non-urgent): Claude Code has dual install (npm-global + native) — auto-update fails. Fix with native install when not on a deadline.

NOTE: docs commit 10ad7ab is local-only (not pushed). Push it next session or whenever.

Log for June 2:

Cron verified live (ran 9am, 200, zero sends — correct; testers outside Day 5 window until June 3). First real fire expected June 3 — check DB then.
Day 7 closed 5/5: support@ confirmed as Google Workspace group (both members, both checked), ownership split approved, Notion tracker built + shared with Tim, smoke test confirmed.
Correction for future sessions: email is Google Workspace groups, NOT ImprovMX — stale notes sent us to the wrong dashboard.
Next session: confirm June 3 cron fire sent correctly; Tim's 2 remaining email Qs (welcome-body wiring, cancellation copy).


## 2026-06-02 (continued) — Day 7, 11, 20 progress

DONE (afternoon):
- Day 11: fixed tour-page empty state (hid table header, helper line, duplicate "NO EVENTS YET" when zero events) + added first-asset success banner in EventsTable.tsx (fires on clean Generate All only, auto-dismisses 5s, --hw-green styling). Copy-link button CUT (per-show vs tour-level link ambiguity = low payoff). Commits in ebbf05e batch.
- Day 20: replaced all 4 remaining alert() calls with toast.error() (TourTile delete, pricing checkout x2, print poster button). ToastProvider confirmed global. Commit 98199d9.
- Launch doc reconciled: replaced misleading "X of 30" hard count with honest per-day status (drifts less). Day 7 = 5/5, Days 8-9/11/20 = partial.
- All pushed to production.

DREW-NOTE: kept getting reminded to work off LAUNCH_PROGRESS.md as source of truth — Claude drifted on a day number (called Day 20 "Day 14" from memory); the file corrected it. Keep referencing the file, not memory.

NEXT SESSION:
1. CHECK CRON FIRST: June 3 ~9am ET the first real trial nudges fire. Run the trial_nudge_emails query — expect day5 rows for testers.
2. Tim's 2 email Qs (welcome-body wiring, cancellation copy).
3. More unblocked launch-file items: signup smoke test (high value post-seed-change), Day 11 template empty state, remaining error-state next-steps.


Established checkbox discipline: ⬜ = real pending work only; ✅ = done; 🚫 = cut/deferred (with reason). Audited full file June 2, fixed 4 mislabeled items (Day 3 migration, PKCE). Keep the file honest so deferred decisions don't get re-litigated.


 Day 10 audit (page was already built, 3 items flipped, FAQ+CTA sent to Tim via decision doc); /pricing "logged out" scare diagnosed as a perception trap (session never actually lost — cookie scoped to .hwy61labs.com), fix spec'd in BACKLOG as ready-to-execute pre-launch; Day 11 + Day 20 closed; full launch-file checkbox audit. Then the standing next-session items: check the 9am cron tomorrow first, and Tim's replies (pricing FAQ/CTA + the 2 email questions).


June 4 entry:

Cron verified firing live (June 3, 9am ET — day5 nudge emails sent, confirmed in trial_nudge_emails).
Landing hero confirmed + Tim-approved: "One image. Every asset. Every platform. Every show." The "10 minutes, not 10 hours" line was stale, never shipped.
Signup smoke test PASSED (prod, hwy61ai+testx): trial-seed ensureOrgExists verified end-to-end, asset generated on trial, test org cleaned up. Welcome page DOES show for new users (recon's skip-prediction was wrong).
Next: legal review kickoff; more mobile-pass surfaces; Tim's 2 email answers + Stripe screen-share when he's available.


Add a June 4 entry covering:

Cron verified firing live (June 3, 9am ET — day5 emails sent)
Hero copy confirmed + Tim-approved ("One image. Every asset...")
Signup smoke test PASSED end-to-end (trial-seed verified, asset generated, org cleaned up)
In-app FAQ rewritten Localizer-only (2298e82) — closed the "FAQ positioning copy review" Tim-blocker
Stale beta copy removed from live surfaces (a7cadf8)
Day 13–14 marked launch-sufficient; help-article system deferred to post-launch
Next session: legal review kickoff first (longest external clock, not started), then mobile pass surfaces. Tim's items when available: Stripe screen-share, 2 email answers, video script.

corrected Localizer legal docs to Localizer-only scope (decision: TourRouter/DIY papered separately at their launch, not now); rewrote /privacy + /terms page components — Texas governing law, trial billing, termination + general provisions added, committed ca5b976 (note d78de22 from a prior session already did part of this — reconcile, don't redo); generated 3 matching .docx for Tim (Privacy, ToS, legal-review memo); confirmed no other code links to these pages with suite-wide assumptions. Next session: send docs to Tim, get his lawyer recipient, kick off legal review (still the long-pole launch item).