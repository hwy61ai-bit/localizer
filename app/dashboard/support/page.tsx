"use client";

import { useState } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  FAQ DATA – verbatim from docs/HWY61_FAQ_CONTENT_FINAL.md          */
/* ------------------------------------------------------------------ */

type QA = { q: string; a: string };
type Section = { title: string; items: QA[] };

const FAQ_DATA: Section[] = [
  {
    title: "Getting Started",
    items: [
      {
        q: "What is HWY61?",
        a: "HWY61 is the first complete operating system for touring. It handles everything from the first offer to the last check \u2014 routing, budgeting, advancing, settlement, finance, guest lists, personnel pay, and document management. It also includes Localizer, our tour marketing engine \u2014 upload one promo image and generate every show asset for every platform, branded with your fonts and colors, then distribute them to every promoter on your routing in one link. One platform, one database, every person on the road.",
      },
      {
        q: "Who is HWY61 for?",
        a: "Anyone involved in a touring act at the club-to-theater level: booking agents, managers, tour managers, business managers, marketing personnel, band members, and crew. It\u2019s also built for the other side of the show \u2014 promoters and venues use HWY61 to manage their own show P&L, generate branded assets, and advance multiple artists at once. If you\u2019re running any part of a touring operation across spreadsheets, email chains, and napkin math \u2014 this is what replaces all of that.",
      },
      {
        q: "How do I create an account?",
        a: 'Click "Get Early Access" and enter your email. We\u2019ll send you a magic link \u2014 click it and you\u2019re in. No password to remember. Every time you log in, you\u2019ll get a fresh magic link via email.',
      },
      {
        q: "What\u2019s a magic link?",
        a: 'Instead of a password, we email you a one-time login link every time you sign in. Click the link and you\u2019re authenticated. It\u2019s faster, more secure, and you\u2019ll never hit "forgot password" again.',
      },
      {
        q: "How do I set up my first tour?",
        a: "When you first sign in, you\u2019ll see three options: run the guided setup wizard, explore a demo tour, or start from scratch. The wizard walks you through creating an artist, adding your team, naming your tour, and adding your first shows \u2014 takes about 2 minutes.",
      },
      {
        q: "Can I explore the product before entering my own data?",
        a: 'Yes. Click "Explore a Demo Tour" from the welcome screen. We\u2019ve loaded a realistic 18-date tour with shows, settlements, hotels, guest lists, expenses, and advance data so you can click around and see how everything works.',
      },
      {
        q: "How do I invite my team?",
        a: "From your dashboard, go to Settings \u2192 Team Members. Add their email address and assign a role. They\u2019ll get a magic link to join your account. Everyone on the same account sees the same data (with role-based access \u2014 crew doesn\u2019t see financials).",
      },
      {
        q: "How does crew access work?",
        a: "Crew members don\u2019t need an HWY61 account. Your tour manager generates a 6-character tour code from the Road App settings. Crew enters the code on their phone and they can see today\u2019s schedule, hotel info, set times, and travel details \u2014 no login, no cost. They never see financial data.",
      },
    ],
  },
  {
    title: "Billing & Plans",
    items: [
      {
        q: "How much does HWY61 cost?",
        a: "It depends on what you need:\n\u2022 TourRouter (the complete touring OS): $49\u2013$149/mo depending on how many artists and users\n\u2022 Localizer (tour marketing automation): $39\u2013$139/mo\n\u2022 DIY (routing + budget for self-managed acts): $19/mo\n\u2022 Road App (mobile schedule for band + crew): Free, always\n\u2022 The Full HWY61 Suite (everything bundled): $249/mo\n\nAnnual billing saves 20% across all plans.",
      },
      {
        q: "Is there a free trial?",
        a: "During beta, everything is free. No credit card required. When we launch paid plans, we\u2019ll give you plenty of notice and you\u2019ll be able to choose your plan before being charged.",
      },
      {
        q: "Can I change my plan later?",
        a: "Yes. You can upgrade or downgrade anytime from Settings \u2192 Billing. Changes take effect immediately. If you upgrade mid-cycle, we\u2019ll prorate the difference.",
      },
      {
        q: "How do I cancel?",
        a: "Settings \u2192 Billing \u2192 Manage Subscription. You can cancel anytime. Your data stays accessible through the end of your billing period. After that, your account goes read-only \u2014 you can still view and export your data, but you can\u2019t create new tours or shows.",
      },
      {
        q: "Can I export my data if I leave?",
        a: "Yes. Every tour can be exported as CSV, Excel, or PDF at any time. Your data is yours. We\u2019ll never hold it hostage.",
      },
      {
        q: "What payment methods do you accept?",
        a: "We use Stripe for billing. All major credit and debit cards are accepted.",
      },
      {
        q: "Do you offer discounts for multiple acts?",
        a: "The Agency tier on TourRouter ($149/mo) includes unlimited artists and unlimited users. The Full HWY61 Suite ($249/mo) bundles everything together and saves over $130/mo vs. buying separately.",
      },
    ],
  },
  {
    title: "Features",
    items: [
      {
        q: "How does routing work?",
        a: "Create a tour, add your shows (manually or by dropping a route sheet), and TourRouter calculates real drive times and distances between every city. You\u2019ll see gas cost estimates based on your vehicle, long drives flagged automatically, and a drive-vs-fly toggle on every leg so you can compare what it costs to fly vs. drive.",
      },
      {
        q: "What\u2019s the drive-vs-fly toggle?",
        a: "On any leg of the tour, you can click the toggle to switch between driving and flying. TourRouter shows you the estimated cost of each option. If a drive is longer than your flight threshold (default: 6 hours), it\u2019ll flag it automatically.",
      },
      {
        q: "How does the budget work?",
        a: "As you add shows and route your tour, TourRouter builds a live P&L \u2014 projected guarantees, expenses, per diems, hotel costs, personnel pay, and commissions all flow into a budget that updates with every change. You see the financial picture of the tour before anyone gets in the van.",
      },
      {
        q: "What is Universal Document Intake?",
        a: "Drop any touring document into HWY61 \u2014 settlement sheet, deal memo, hotel confirmation, receipt, advance response \u2014 as a PDF, photo, Excel file, or scan. HWY61 reads it, figures out what kind of document it is, matches it to the right show, and puts every number where it belongs. You review and confirm before anything saves.",
      },
      {
        q: "What file types can I drop in?",
        a: "PDF, JPEG, PNG, Excel (.xlsx), CSV, and most image formats. Photos of handwritten documents work too \u2014 we handle blurry photos, crossed-out numbers, and low-light scans.",
      },
      {
        q: "How does settlement work?",
        a: 'After a show, drop the settlement sheet into HWY61 (photo, PDF, or scan). HWY61 reads every number \u2014 ticket gross, expenses, artist payment. It matches the document to the right show and stages the data for your review. You confirm the numbers, and the show moves from "projected" to "actual" in your tour P&L. Night-of settlement in minutes, not hours.',
      },
      {
        q: "What deal types does HWY61 support?",
        a: "All 14 standard deal types used in the touring industry: flat guarantee, versus gross, versus net, versus adjusted gross, versus expense cap, versus promoter profit, overage only, straight percentage, door deal, sliding scale, plus one, guarantee plus merch, co-headliner split, and ticket buyout. The system calculates each one correctly and verifies settlement math automatically.",
      },
      {
        q: "How does advancing work?",
        a: "HWY61 sends advance emails to your venue contacts on a schedule you set. It follows up automatically if there\u2019s no response \u2014 first follow-up, second follow-up, final nudge. If a venue still hasn\u2019t responded close to show day, it escalates to the tour manager. You can also send venues a link to a web form where they fill in load-in times, WiFi, parking, contacts, and production notes directly.",
      },
      {
        q: "Can I turn off automatic advancing?",
        a: "Yes. You can pause the advance engine for any individual show (if you\u2019re handling it manually) or turn it off entirely at the tour level.",
      },
      {
        q: "How does the guest list work?",
        a: "Each show has its own guest list with allotments by pass type (Guest, Industry, Press, Photo, etc.). Anyone on the tour can add names to their allotment. The TM sets cutoff times. On show day, you can generate a door list PDF to hand to the venue.",
      },
      {
        q: "How does personnel pay work?",
        a: "Add each person on the tour to the roster with their role and pay structure \u2014 day rate, off-day rate, weekly rate, per-show rate, or percentage of net. HWY61 calculates what everyone is owed based on the actual tour schedule. Supports band members on percentage splits, crew on day rates, and any combination.",
      },
      {
        q: "What currencies are supported?",
        a: "HWY61 handles USD, CAD, GBP, EUR, and most major currencies. Each show can be in a different currency. The system converts everything to USD (or your base currency) for the tour P&L using daily exchange rates.",
      },
      {
        q: "How do commissions work?",
        a: "Set up commission structures for agents, managers, or anyone else who takes a percentage. Supports percentage of gross, percentage of net, and custom structures. The commission waterfall shows exactly how the money flows from gross income down to net-to-artist. You control who can see commission details by role.",
      },
      {
        q: "What\u2019s the Finance Layer?",
        a: "The Finance Layer is a read-only dashboard that pulls all its numbers from your tour data. It shows income waterfall, per-show P&L, commission breakdown, and net-to-artist \u2014 both projected and actual. When all shows are settled, you can generate an end-of-tour report as a PDF and share it with a link (no login required for the recipient).",
      },
      {
        q: "What is Localizer?",
        a: "Localizer is tour marketing automation. Upload one promo image and Localizer generates every show asset for every platform \u2014 Instagram story, Facebook event, X post, poster, web graphic \u2014 branded with your fonts, your colors, your layout. Then send the entire tour\u2019s assets to every promoter in one link. No more emailing individual files.",
      },
      {
        q: "What is DIY mode?",
        a: "HWY61 DIY is the same routing and budgeting engine the pros use, packaged for self-managed acts at $19/mo. You get real drive times, smart budgeting, document intake, and all 14 deal types \u2014 without the settlement, advancing, finance, and personnel pay features that a full touring operation needs.",
      },
      {
        q: "What is the Road App?",
        a: "A mobile app for band and crew. Enter a tour code from your TM and you can see today\u2019s show details, van call time, load-in, hotel info, set times, and travel details. No account required, no cost. It never shows financial data \u2014 just the info people on the road actually need.",
      },
    ],
  },
  {
    title: "Troubleshooting",
    items: [
      {
        q: "I didn\u2019t get my magic link email.",
        a: "Check your spam/junk folder first. Magic links come from a @hwy61.io address. If it\u2019s not there, try again \u2014 sometimes email delivery takes a minute. If you\u2019re still stuck, contact us and we\u2019ll help.",
      },
      {
        q: "My document didn\u2019t parse correctly.",
        a: "Parsing works best with clear, well-lit documents. If a document parses with errors, you can edit any field manually before confirming. For handwritten settlements, blurry photos, or unusual formats, the system will flag uncertain fields and ask you to review them. Over time, the system learns from corrections.",
      },
      {
        q: "I uploaded a route sheet but the columns didn\u2019t match.",
        a: "HWY61 tries to auto-match column headers to the right fields. If your sheet uses unusual column names (like \u201cguar\u201d for guarantee or \u201ccty\u201d for city), it might not match perfectly. You\u2019ll see a column mapping screen where you can manually assign any unmatched columns. Once you confirm, HWY61 remembers that mapping for next time.",
      },
      {
        q: "My financial numbers look wrong.",
        a: "All financial calculations come from one central function \u2014 there\u2019s no place where numbers are calculated differently. If something looks off, check: (1) are all your show amounts entered in the correct currency? (2) did you set the right deal type for each show? (3) are per diems and personnel rates set correctly at the tour level? If it still looks wrong, contact us with the specific numbers and we\u2019ll investigate.",
      },
      {
        q: "I accidentally deleted a show / tour.",
        a: "Deleted shows and tours are soft-deleted and can be recovered within 30 days. Contact us and we\u2019ll restore it.",
      },
      {
        q: "Can I undo a settlement?",
        a: 'Yes. From the show detail page, you can revert a settled show back to "confirmed" status. This moves the financials back from actual to projected. Use this if you need to correct settlement numbers after the fact.',
      },
      {
        q: "How do I change my vehicle settings mid-tour?",
        a: "Go to the tour settings and update your vehicle type, MPG, fuel price, or passenger count. The budget and drive calculations will update immediately for all shows. You can also override individual legs \u2014 for example, flying one leg while driving the rest.",
      },
      {
        q: "The map isn\u2019t showing / drive times seem wrong.",
        a: "HWY61 uses real mapping data for drive time estimates. If a route seems off, check that the city names are entered correctly (including state/province for US/Canada). International routes between countries that aren\u2019t connected by road will default to showing fly options.",
      },
      {
        q: "I need help with something not listed here.",
        a: "Hit the support button in the bottom-right corner of any page, or email us directly. We\u2019re a small team building this with working touring professionals \u2014 we read and respond to everything.",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                         */
/* ------------------------------------------------------------------ */

export default function SupportPage() {
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({});
  const [openItems, setOpenItems] = useState<Record<string, number | null>>({});

  const toggleSection = (idx: number) => {
    setOpenSections((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleItem = (sectionIdx: number, itemIdx: number) => {
    const key = String(sectionIdx);
    setOpenItems((prev) => ({
      ...prev,
      [key]: prev[key] === itemIdx ? null : itemIdx,
    }));
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500&family=Space+Mono:wght@400;700&display=swap');

        .support-page * { box-sizing: border-box; }

        .support-page {
          max-width: 860px;
          margin: 0 auto;
          padding: 48px 24px 96px;
          font-family: 'DM Sans', sans-serif;
          background: transparent;
        }

        .support-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'Space Mono', monospace;
          font-size: 14px;
          color: #000;
          text-decoration: none;
          margin-bottom: 32px;
          transition: color 0.15s;
        }
        .support-back:hover { color: #c5535b; }

        .support-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 64px;
          line-height: 1;
          margin: 0 0 4px;
          letter-spacing: 2px;
          color: #000;
        }

        .support-subtitle {
          font-family: 'DM Sans', sans-serif;
          font-size: 18px;
          color: #777;
          margin: 0 0 48px;
        }

        .faq-section { margin-bottom: 32px; }

        .faq-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: #fff;
          border: 3px solid #000;
          border-left: 6px solid #c5535b;
          border-radius: 0;
          cursor: pointer;
          user-select: none;
          transition: box-shadow 0.15s;
        }
        .faq-section-header:hover {
          box-shadow: 2px 2px 0 #000;
        }

        .faq-section-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 28px;
          letter-spacing: 1px;
          color: #000;
          margin: 0;
          line-height: 1;
        }

        .faq-section-chevron {
          font-family: 'Space Mono', monospace;
          font-size: 20px;
          color: #c5535b;
          flex-shrink: 0;
          transition: transform 0.2s;
        }

        .faq-items {
          border-left: 3px solid #000;
          border-right: 3px solid #000;
          border-bottom: 3px solid #000;
          border-radius: 0;
        }

        .faq-item {
          border-bottom: 1px solid #e0e0e0;
          background: #fff;
          border-radius: 0;
        }
        .faq-item:last-child { border-bottom: none; }

        .faq-question {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 16px 20px;
          cursor: pointer;
          user-select: none;
          font-family: 'Space Mono', monospace;
          font-size: 14px;
          line-height: 1.5;
          color: #000;
          background: #fff;
          border: none;
          border-radius: 0;
          width: 100%;
          text-align: left;
          transition: box-shadow 0.15s;
        }
        .faq-question:hover {
          box-shadow: 2px 2px 0 #000;
          position: relative;
          z-index: 1;
        }

        .faq-icon {
          font-family: 'Space Mono', monospace;
          font-size: 18px;
          color: #c5535b;
          flex-shrink: 0;
          width: 20px;
          text-align: center;
        }

        .faq-answer {
          padding: 0 20px 20px 20px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          line-height: 1.7;
          color: #333;
          white-space: pre-line;
          background: #fff;
          border-radius: 0;
        }

        @media (max-width: 640px) {
          .support-title { font-size: 48px; }
          .faq-section-title { font-size: 22px; }
          .faq-question { font-size: 13px; padding: 14px 16px; }
          .faq-answer { font-size: 14px; padding: 0 16px 16px; }
          .support-page { padding: 32px 16px 64px; }
        }
      ` }} />

      <div className="support-page">
        <Link href="/dashboard" className="support-back">
          &larr; Back to Dashboard
        </Link>

        <h1 className="support-title">SUPPORT</h1>
        <p className="support-subtitle">Frequently Asked Questions</p>

        {FAQ_DATA.map((section, sIdx) => {
          const isOpen = !!openSections[sIdx];
          const activeItem = openItems[String(sIdx)] ?? null;

          return (
            <div className="faq-section" key={sIdx}>
              <div
                className="faq-section-header"
                onClick={() => toggleSection(sIdx)}
              >
                <h2 className="faq-section-title">{section.title}</h2>
                <span className="faq-section-chevron">
                  {isOpen ? "\u2212" : "+"}
                </span>
              </div>

              {isOpen && (
                <div className="faq-items">
                  {section.items.map((item, iIdx) => (
                    <div className="faq-item" key={iIdx}>
                      <button
                        className="faq-question"
                        onClick={() => toggleItem(sIdx, iIdx)}
                      >
                        <span>{item.q}</span>
                        <span className="faq-icon">
                          {activeItem === iIdx ? "\u2212" : "+"}
                        </span>
                      </button>
                      {activeItem === iIdx && (
                        <div className="faq-answer">{item.a}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
