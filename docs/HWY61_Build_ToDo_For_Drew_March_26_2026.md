# HWY61 Build To-Do List for Drew
**From Tim's Review — March 26, 2026**
**Covers: multi-vehicle system, master Artist Profile (full business record + roster), drag-and-drop AI intake for all profile documents, and blanket expense rework.**

**Note: HWY61 does not store bank account numbers, routing numbers, wire details, or any payment account information. Payment processing and banking data should be managed through the user's own financial tools.**

---

## 1. Multi-Vehicle System

The current vehicle setup assumes one vehicle per tour. Real tours use anywhere from 1 to 20+ vehicles. Vans, trailers, buses, trucks, rental cars — all on the same tour.

### What to Build

- **Add a "+" button** to allow adding multiple vehicles to a tour. Each vehicle is its own entry with its own specs.
- **Build a comprehensive vehicle database** using Claude to generate a master list of touring vehicles across all major touring regions: USA, Mexico, Canada, South America, Europe, UK, Ireland, Japan, Australia, New Zealand — anywhere bands tour. Sprinter vans, Ford E-350s, 18-wheelers, lorries, sleeper buses, box trucks, trailer rigs, etc.
- **Add a search bar for vehicle selection.** When the user clicks "+" to add a vehicle, they type (e.g. "Ford E…") and get an autocomplete list of matching vehicles so they're picking the exact vehicle they're actually using.
- **Each vehicle carries its own specs:** fuel type, MPG or L/100km, passenger capacity, cargo capacity, rental vs. owned, and any notes.

*This is independent of items 2, 3, and 4 — can be built in parallel.*

---

## 2. The Master Artist Profile

The Artist Profile is the single source of truth for everything about an artist's business and touring operation. It's not just a roster — it's the legal entity, representation, insurance, production requirements, promo assets, merch defaults, and every person who works for the act. Set it up once. It flows into every tour and every HWY61 product automatically.

### Core Behavior

- **Progressive entry:** nothing has to be completed all at once. Users can revisit the Artist Profile at any time to add more information as they have it.
- **Minimum to create an Artist Profile:** artist name + at least one roster member (name + role). Everything else is optional and progressive.
- **Auto-populates into every new tour** created for that artist. Tour-level overrides are always available.
- **Tour-level edits do NOT change the profile defaults** unless the user explicitly chooses "update default."
- **Every section supports drag-and-drop AI intake.** Users can drop documents (PDFs, images, spreadsheets) onto any section — or onto the profile page itself — and Claude identifies the document type, parses the fields, matches to the correct section and/or roster member, and stages everything for user confirmation before writing to the database.
- **Multi-document drops:** a manager drops 6 passport scans at once → Claude identifies each, matches to roster members by name, stages all 6 for batch review and confirmation.

### Confidence Thresholds (Same as Universal Intake Spec)

- **≥ 0.95 → Auto-confirmed:** populated silently, shown in review for reference.
- **0.75–0.94 → Review required:** populated but highlighted — "please review."
- **0.50–0.74 → Confirmation required:** suggestion shown, user must confirm.
- **< 0.50 → Unmapped:** best guess greyed out, user enters manually.

*Original documents are always stored in Supabase Storage under the artist's profile regardless of parse confidence.*

---

### Section A: Business Entity

The legal and financial identity of the act. Needed for contracts, settlements, tax reporting, and insurance.

| Field | Notes |
|---|---|
| Legal business name | As registered with state/country — appears on contracts and tax docs |
| DBA / artist name | The name the public knows; may differ from legal name |
| Entity type | LLC / S-Corp / C-Corp / Sole Proprietor / Partnership |
| EIN / Tax ID | Federal tax identification number |
| State / country of formation | Where the entity was legally formed |
| Business address | Official registered address |
| Mailing address | If different from business address |
| Business phone | Main business line |
| Business email | Main business email |
| Year formed | For reference |
| Registered agent | If applicable (LLC/Corp requirement in most states) |

**📥 Documents that auto-fill this section:**
- **W-9** → EIN, legal name, entity type, address
- **Articles of incorporation / business license** → entity type, state of formation, legal name
- **State registration** → registered agent, formation date

---

### Section B: Key Contacts & Representation

Every person on the business side of the artist. Not touring crew — business team.

| Field | Notes |
|---|---|
| Contact name | Full name of the representative |
| Company | Management company, agency, law firm, label, etc. |
| Role | Manager / Booking Agent / Business Manager / Attorney / Publicist / Label Rep / Publisher / etc. |
| Email | Primary contact email |
| Phone | Primary phone |
| Commission rate | If applicable — feeds into `calcTourFinancials()` commission waterfall |
| Agreement term dates | Start and end date of the representation agreement |
| Territory | Worldwide / North America / Europe / etc. |
| Notes | Free text |

**📥 Documents that auto-fill this section:**
- **Management agreement PDF** → manager name, company, commission rate, term dates, territory
- **Booking agency agreement PDF** → agent name, agency, commission rate, term dates, territory
- **Business management agreement PDF** → BM name, firm, fee structure
- **Any signed representation contract** → Claude parses parties, role, terms, commission

---

### Section C: Tax & Compliance

Tax status for the business entity and compliance docs needed for international touring.

| Field | Notes |
|---|---|
| Tax filing status | How the entity files taxes |
| Fiscal year end | Calendar year or custom |
| W-9 on file | Yes/No + date collected |
| State tax registrations | List of states where registered |
| VAT number | For EU/UK touring |
| Withholding tax exemptions | Any treaty-based exemptions |
| ATA Carnet number | For equipment crossing international borders |
| Carnet expiration | Auto-alert when approaching expiration |
| Carnet covered equipment list | Itemized list of what's covered |
| Work permit notes per country | Free text — ongoing reference for future tours |

**📥 Documents that auto-fill this section:**
- **W-9** → tax classification, TIN, address, certification date
- **W-8BEN / W-8BEN-E** → foreign tax status, treaty country, FTIN
- **VAT registration certificate** → VAT number, country
- **ATA Carnet** → carnet number, expiration, itemized equipment list
- **State tax registration** → state, registration number
- **Work permits / visa approvals** → country, validity dates, restrictions

---

### Section D: Insurance

COIs are requested constantly by venues and promoters. Having them on file and parseable is a huge time saver for advancing.

| Field | Notes |
|---|---|
| General liability provider | Insurance company name |
| GL policy number | Policy ID |
| GL policy limits | Per occurrence and aggregate |
| GL expiration date | Auto-alert when approaching expiration |
| Additional insured process / contact | How to add a venue as additional insured |
| Equipment / instrument insurance provider | Often a separate policy |
| Equipment policy number | Policy ID |
| Equipment coverage amount | Total coverage |
| Equipment deductible | Per-claim deductible |
| Vehicle insurance | If artist-owned vehicles — provider, policy, coverage |
| Workers comp | If W-2 employees — provider, policy, coverage dates |
| Umbrella policy | If applicable — provider, limits |

**📥 Documents that auto-fill this section:**
- **Certificate of Insurance (COI) PDF** → provider, policy number, limits, expiration, named insured
- **Equipment insurance declaration page** → provider, coverage, deductible, itemized schedule
- **Vehicle insurance card** → provider, policy number, covered vehicles
- **Workers comp certificate** → provider, policy number, coverage dates

---

### Section E: Technical Production

Everything a venue or production manager needs. This is what gets sent during advancing. Having it on the profile means it auto-attaches to every advance email.

| Field | Notes |
|---|---|
| Stage plot | File upload — PDF or image |
| Input list | File + parsed table (channel, instrument, mic/DI, stand, notes) |
| Backline requirements | File + parsed list |
| Monitor requirements | IEM vs. wedges, mix count, stereo/mono |
| Lighting requirements | File or notes |
| FOH console preference | Preferred console make/model |
| Monitor console preference | Preferred console make/model |
| PA requirements / minimums | Minimum system specs |
| Power requirements | Circuit count, amperage, distro needs |
| Rigging requirements | Points, weight limits, bridle specs |
| Video / screen requirements | If applicable |
| Set length | Headline / Support / Festival — may vary, default here |
| Changeover time needed | Minutes required |
| Load-in requirements | Dock / ground level / stairs / elevator / notes |
| Production contact | Links to roster member |
| Production notes | Free text |

**📥 Documents that auto-fill this section:**
- **Tech rider PDF** → backline, monitors, consoles, PA, power, staging, load-in notes
- **Stage plot PDF/image** → stored as file; key dimensions parsed
- **Input list PDF/spreadsheet** → parsed into channel-by-channel table
- **Lighting plot** → stored as file

---

### Section F: Hospitality & Rider

The non-technical rider. Catering, dressing room, green room, buyouts.

| Field | Notes |
|---|---|
| Dressing room requirements | Size, furniture, temperature, privacy needs |
| Green room requirements | If separate from dressing room |
| Catering requirements | Headcount, meal types — pulls dietary info from roster automatically |
| Beverage requirements | Specific beverage list or general preferences |
| Buyout amount | Dollar amount if no catering provided |
| Towels / laundry | Count and specifics |
| Shower access required | Yes/No + notes |
| Hospitality contact | Links to roster member |
| Hospitality notes | Free text |
| Rider file | The actual hospitality rider document |

**📥 Documents that auto-fill this section:**
- **Hospitality rider PDF** → dressing room specs, catering, beverages, buyout, special requests
- **Any rider document** → Claude classifies as tech or hospitality (or both) and routes accordingly

---

### Section G: Promo & Marketing Assets

Press photos, logos, bios, one-sheets — everything Localizer and marketing teams need.

| Field | Notes |
|---|---|
| Press photos | Multiple uploads with usage rights notes — tagged by orientation |
| Band logo | Multiple formats: PNG, SVG, EPS |
| Artist bio (short) | One-paragraph version |
| Artist bio (long) | Full press bio |
| One-sheet / EPK | File upload |
| Social media links | Instagram, TikTok, X, YouTube, Facebook, Spotify, Apple Music, Bandcamp, website |
| Streaming profile URLs | Direct links to streaming profiles |
| Bandsintown artist ID | For sync with Bandsintown |
| Songkick ID | For sync with Songkick |
| Genre tags | Multiple tags |
| Hometown | City, State/Country |
| Label affiliation | Current label(s) |
| Booking territory map | Which agent covers which region |

**📥 Documents that auto-fill this section:**
- **EPK / one-sheet PDF** → bio text, genre, hometown, social links, label, agent/manager info
- **Press photos (drag multiple)** → stored with filenames, tagged by orientation
- **Logo files** → stored by format (PNG, SVG, EPS)
- **Any marketing PDF** → Claude extracts bio text, social handles, streaming links

---

### Section H: Merch Defaults

Default merch inventory and vendor info. Feeds HWY61 Merch product.

| Field | Notes |
|---|---|
| Merch vendor / printer name | Primary merch supplier |
| Vendor contact info | Email, phone, address |
| Default inventory items | Item name, category, sizes available, wholesale cost, retail price, image |
| Merch commission structure | Typical venue cut (15–25%) — overridable per show |
| Merch manager contact | Links to roster member |
| Merch settlement preference | Cash / Check / Wire / etc. |
| Merch storage / shipping address | Where inventory ships from |

**📥 Documents that auto-fill this section:**
- **Merch vendor invoice / packing list** → item names, quantities, wholesale costs
- **Merch agreement with venue** → commission percentage, settlement terms
- **Merch catalog PDF** → item list with prices and images

---

### Section I: Vehicles & Equipment

Artist-owned or leased vehicles and major equipment. Connects to the multi-vehicle system (Item 1).

| Field | Notes |
|---|---|
| Vehicles | Make, model, year, plate, VIN, owned/leased/rented, insurance info — multiple entries |
| Trailers | Same fields as vehicles |
| Major equipment list | For carnet and insurance purposes — itemized with values |
| Storage location | Where vehicles and equipment are stored between tours |

**📥 Documents that auto-fill this section:**
- **Vehicle registration** → make, model, year, VIN, plate, registered owner
- **Lease agreement** → vehicle details, term, monthly cost
- **Equipment list / inventory spreadsheet** → parsed into itemized list with values

---

### Section J: The Roster (Personnel)

Every person who tours with the act. Band members and crew.

*Minimum required to add a roster entry: Name + Role + Show Day Pay + Off Day Pay. Everything else is optional and progressive. Fields are organized as collapsible groups in the UI.*

#### J1. Identity & Basics

| Field | Notes |
|---|---|
| Full legal name | For passports, hotel check-ins, manifests, contracts |
| Preferred / stage name | What they go by day-to-day; displayed in Road App |
| Profile photo | Upload or camera capture |
| Role | Singer, guitarist, FOH, monitor eng, TM, BM, merch, roadie, bus driver, etc. |
| Date of birth | Visa applications, insurance, age verification for int'l travel |
| Nationality / citizenship(s) | Multiple allowed — matters for visa routing |
| Primary language(s) | Useful for international tours with local crew |

#### J2. Contact

| Field | Notes |
|---|---|
| Email | Primary contact email |
| Phone (mobile) | Primary phone number |
| Secondary phone | Optional backup number |
| Preferred contact method | Call / Text / WhatsApp / Signal / Email |

#### J3. Emergency Contact

| Field | Notes |
|---|---|
| Emergency contact name | Required for any professional tour |
| Relationship | Spouse, parent, sibling, partner, friend, etc. |
| Emergency contact phone | Primary phone for emergencies |
| Emergency contact email | Secondary emergency reach |
| Blood type | Some int'l venues/countries require this on file |
| Medical conditions / medications | Optional, sensitive — TM eyes only, never in crew view |

#### J4. Travel Documents

| Field | Notes |
|---|---|
| Passport number | Primary passport |
| Passport country of issue | For visa application routing |
| Passport expiration date | Auto-alert when < 6 months out — many countries deny entry |
| Second passport number | Dual citizens or overlapping visa processing |
| Visa notes | Free text: "Needs P-1 for US," "Schengen valid through Oct 2027" |
| Global Entry / TSA PreCheck / NEXUS | Known traveler number |
| Home address | For visa applications, carnet paperwork |
| Preferred home airport | For fly dates and routing calculations in TourRouter |

**📥 Documents that auto-fill these fields:**
- **Passport scan (image or PDF)** → name match → passport number, country, expiration, DOB, nationality
- **Visa approval document** → country, validity dates, visa type, restrictions
- **Global Entry / TSA PreCheck card** → known traveler number

#### J5. Travel Preferences

| Field | Notes |
|---|---|
| Flight seat preference | Aisle / Middle / Window |
| Flight class preference | Coach / Premium Economy / Business / First |
| Frequent flier programs + numbers | Multiple — one entry per airline |
| Bus bunk preference | Top / Bottom / Front / Back / No preference |
| Own room or sharing? | Does this person require their own hotel room? |
| Hotel room type preference | King / Double Queen / Suite / Accessible |
| Hotel smoking preference | Non-smoking / Smoking / No preference |
| Hotel floor preference | High floor / Low floor / No preference |
| Rental car — driver or non-driver | Matters for insurance and van rotation on drive tours |
| Driver's license on file? | Yes/No — required for vehicle rotation on van tours |

#### J6. Dietary & Health

| Field | Notes |
|---|---|
| Food allergies | Free text + common tags: gluten, dairy, nuts, shellfish, soy, eggs |
| Dietary restrictions | Vegetarian, vegan, pescatarian, halal, kosher, etc. |
| Meal preferences / notes | Free text: "No red meat," "Lactose intolerant but can do hard cheese" |
| Non-food allergies | Latex, specific medications, bee stings, etc. |

#### J7. Apparel & Swag Sizes

| Field | Notes |
|---|---|
| T-shirt size | XS through 4XL |
| Sweatshirt / hoodie size | For merch and crew gear |
| Jacket size | For sponsored tours or branded crew jackets |
| Hat size | S/M, L/XL, or fitted size |
| Shoe size | For sponsored tours or production/safety boots |
| Gender fit preference | Men's / Women's / Unisex |

#### J8. Pay & Financial (TM/BM Eyes Only)

*Note: HWY61 does not store bank account numbers, routing numbers, or payment account details. This section tracks pay rates and tax classification only.*

| Field | Notes |
|---|---|
| Show day rate (default) | Overridable at tour level |
| Off day rate (default) | Overridable at tour level |
| Travel day rate | If different from off day rate; some tours pay a third rate |
| Per diem rate (default) | Overridable at tour level |
| Pay type | W-2 / 1099 / Invoice / International Wire |
| Tax withholding status | If W-2 employee |
| Tax ID / SSN on file? | Yes/No flag only — never store the actual number in HWY61 |

**📥 Documents that auto-fill these fields:**
- **W-9 (individual)** → legal name, SSN on file flag, address, tax classification
- **W-4** → tax withholding status

#### J9. Skills & Credentials (Primarily for Crew)

| Field | Notes |
|---|---|
| CDL or professional driver's license | Bus drivers, truck drivers |
| Pyrotechnics license | Required for certain production roles |
| Rigging certification | For riggers and production crew |
| Forklift certification | For load-in/load-out crew |
| First aid / CPR certified | Good to know who on the crew is certified |
| Other certifications | Free text for anything else |
| Years of experience | Useful for crew directory and hiring |
| Resume / bio | Free text or file upload |
| Portfolio / website link | URL |

**📥 Documents that auto-fill these fields:**
- **CDL / driver's license scan** → license type, expiration, state/country of issue
- **Certification documents (pyro, rigging, forklift, CPR)** → cert type, issue date, expiration
- **Resume / CV PDF** → stored as file; years of experience parsed if clearly stated

#### J10. Personal Preferences & Notes

| Field | Notes |
|---|---|
| Birthday (month/day) | So TM can acknowledge it on the road |
| Hobbies / interests | Optional — day-off planning, tour bonding |
| Do Not Disturb preferences | "Don't call before noon on off days" |
| Private notes | TM eyes only — free text for anything else |

---

## 3. Blanket Expenses — Two View Modes with Toggle

Once the Artist Profile roster feeds into a tour, the payroll/expense section should support two views, switchable with a toggle button.

### Summary View (Default)

Shows two rolled-up numbers:

- **"Blanket Show Day Payroll Expenses"** — the sum of all personnel show day pay rates from the roster.
- **"Blanket Off Day Payroll Expenses"** — the sum of all personnel off day pay rates from the roster.

This is what most users will prefer day-to-day. Clean and simple. One line each.

### Detail View (Toggle On)

Expands to show the full individual roster breakdown: every person, their role, their show day rate, off day rate, and per diems as separate line items.

### Implementation Rules

- **The toggle should be available anywhere this data appears:** route table, financials page, exports.
- **Both views read from the same underlying data — the roster.** No separate data entry. The summary view is just the roster math rolled up.
- **All of this feeds into `calcTourFinancials()` as it always has.** The toggle is purely a presentation choice, not a data change.
- **Per diems should also roll up in summary view** and break out per person in detail view.

---

## 4. Drag-and-Drop AI Intake for Artist Profile

This extends the Universal AI Intake system (Docs 12 and 13) to the Artist Profile. Same architecture, same confidence thresholds, same staged-review-before-write pattern — just pointed at the profile instead of a tour.

### How It Works

- **Drop zone wraps the entire Artist Profile page.** Drag a file onto any section, or onto the page itself.
- **Claude identifies the document type AND which section it belongs to.** A COI goes to Insurance. A passport goes to the matched roster member's Travel Documents. A tech rider goes to Technical Production.
- **If person-specific (passport, W-9, driver's license, etc.),** Claude matches to the correct roster member by name.
- **Fields are parsed and staged for review.** Never auto-written without confirmation. Same thresholds as the tour intake system.
- **User confirms → data populates into the correct fields.** Original document is stored in Supabase Storage under the artist's profile.
- **Multi-document batch drops supported.** Drop 6 passports, 3 W-9s, and a tech rider at once. Claude sorts, matches, and stages them all in one batch review screen.

### Complete Document Type Map

| Document Type | Routes To | Key Fields Parsed |
|---|---|---|
| Passport scan | Roster → Travel Docs | Name, number, country, expiration, DOB, nationality |
| Visa approval | Roster → Travel Docs | Country, validity dates, visa type |
| Driver's license scan | Roster → Skills | License type, expiration, state/country |
| W-9 (individual) | Roster → Pay & Financial | Legal name, SSN on file flag, address |
| W-9 (business) | Business Entity | EIN, legal name, entity type, address |
| W-4 | Roster → Pay & Financial | Tax withholding status |
| W-8BEN / W-8BEN-E | Tax & Compliance | Foreign tax status, treaty country, FTIN |
| Management agreement | Key Contacts | Manager, company, commission, term, territory |
| Booking agency agreement | Key Contacts | Agent, agency, commission, term, territory |
| Business management agreement | Key Contacts | BM, firm, fee structure, term |
| Certificate of Insurance (COI) | Insurance | Provider, policy #, limits, expiration |
| Equipment insurance declaration | Insurance | Provider, coverage, deductible, schedule |
| Workers comp certificate | Insurance | Provider, policy #, coverage dates |
| ATA Carnet | Tax & Compliance | Carnet #, expiration, equipment list |
| Tech rider | Technical Production | Backline, monitors, consoles, PA, power |
| Stage plot | Technical Production | Stored as file; dimensions parsed |
| Input list | Technical Production | Channel-by-channel table |
| Hospitality rider | Hospitality & Rider | Dressing room, catering, beverages, buyout |
| EPK / one-sheet | Promo & Marketing | Bio, genre, hometown, socials, label |
| Press photos | Promo & Marketing | Stored; tagged by orientation |
| Logo files | Promo & Marketing | Stored by format |
| Vehicle registration | Vehicles & Equipment | Make, model, year, VIN, plate, owner |
| Lease agreement | Vehicles & Equipment | Vehicle details, term, cost |
| Equipment inventory list | Vehicles & Equipment | Itemized list with values |
| Merch vendor invoice | Merch Defaults | Item names, quantities, wholesale costs |
| Merch catalog | Merch Defaults | Items, prices, images |
| Certification docs (pyro, rigging, etc.) | Roster → Skills | Cert type, issue date, expiration |
| Articles of incorporation | Business Entity | Entity type, state, legal name |
| VAT registration certificate | Tax & Compliance | VAT number, country |

---

## Build Order & Dependencies

| # | Item | Depends On | Parallel? |
|---|---|---|---|
| 1 | Artist Profile — Business Entity sections (A–B) | Nothing — foundation | — |
| 2 | Artist Profile — Roster (Section J) | Item 1 (schema) | Yes |
| 3 | Artist Profile — Tax, Insurance, Production, Hospitality, Promo, Merch, Vehicles (C–I) | Item 1 (schema) | Yes |
| 4 | Blanket Expense Toggle (Item 3) | Roster must exist | No |
| 5 | Drag-and-Drop Intake for Artist Profile (Item 4) | Profile sections must exist | No |
| 6 | Multi-Vehicle System (Item 1) | Nothing | Yes — fully independent |

The Artist Profile schema and UI should be built first — all sections, even if initially just manual entry. The drag-and-drop intake layer is built on top of it once the fields exist to receive parsed data. The multi-vehicle system is fully independent and can be built at any time.

---

## Competitive Note

No competing product has anything close to this. Master Tour has basic crew profiles with manual entry. Gigwell, Artist Growth, Stagent — all manual. Nobody lets you drop a passport and have it auto-fill. Nobody lets you drop a tech rider and have it parsed into structured data. Nobody lets you drop a management agreement and have it extract the commission rate and term dates.

**The combination of a comprehensive master business profile + AI-powered drag-and-drop intake for every document type is the single biggest differentiator HWY61 can ship. Everything we do is drag and drop, AI parsed. That's the tagline and the product reality.**
