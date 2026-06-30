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
        q: "What is Localizer?",
        a: "Localizer turns one promo image into every marketing asset for your whole tour. Upload a single image, and Localizer generates a branded version for every platform \u2014 Instagram, Facebook, X, poster, web \u2014 using your fonts, your colors, your layout. Every show on your tour gets its own set of assets, and every promoter gets one link with everything they need.",
      },
      {
        q: "Who is Localizer for?",
        a: "Artists, managers, and tour marketers who are tired of hand-building the same promo graphic fifteen times for fifteen cities. If you\u2019re running a tour and you need show assets that look consistent and on-brand without spending hours in Photoshop, this is for you.",
      },
      {
        q: "How do I create an account?",
        a: "Enter your email and we\u2019ll send you a magic link \u2014 click it and you\u2019re in. No password to remember. Every time you sign in, you\u2019ll get a fresh link by email.",
      },
      {
        q: "What\u2019s a magic link?",
        a: "Instead of a password, we email you a one-time sign-in link each time you log in. Click it and you\u2019re authenticated. Faster, more secure, and you\u2019ll never reset a password again.",
      },
      {
        q: "How do I get started once I\u2019m in?",
        a: "Add your first artist, add a show (or a whole run of shows), upload your promo image, and Localizer generates the assets. From there you get a link per show to send to promoters. The whole first-asset flow takes a few minutes.",
      },
    ],
  },
  {
    title: "Plans & Billing",
    items: [
      {
        q: "Is there a free trial?",
        a: "Yes \u2014 and you don\u2019t need a credit card. When you sign up you get 14 days of full Localizer access, completely free. Generate as many assets as you want. When the trial ends, you pick a plan to keep going. No card up front, no surprise charge.",
      },
      {
        q: "How much does Localizer cost?",
        a: "Three plans, billed monthly or annually:\n\u2022 Indie \u2014 $19/mo ($190/yr) \u2014 1 artist\n\u2022 Pro \u2014 $39/mo ($390/yr) \u2014 up to 5 artists\n\u2022 Agency \u2014 $199/mo ($1,990/yr) \u2014 up to 15 artists\n\nAnnual billing saves you about 17% versus paying monthly.",
      },
      {
        q: "What\u2019s the difference between the plans?",
        a: "Just the number of artists you can manage. Every plan gets the full Localizer feature set \u2014 all platforms, all asset types, custom branding, promoter links. Indie is one artist, Pro is up to five, Agency is up to fifteen.",
      },
      {
        q: 'What counts as an "artist"?',
        a: "Each distinct act or project you\u2019re generating assets for. If you manage three bands, that\u2019s three artists.",
      },
      {
        q: "Can I switch plans later?",
        a: "Reach out and we\u2019ll switch you over.",
      },
      {
        q: "How do I cancel?",
        a: "Once you\u2019re on a paid plan, you can cancel anytime through the billing portal \u2014 go to your account page and click Manage Billing & Invoices to open it. While you\u2019re on the free trial there\u2019s nothing to cancel; it simply ends after 14 days unless you choose a plan. Either way your data stays put \u2014 your artists, shows, and assets are all still there if you come back, and you can re-subscribe whenever you like.",
      },
      {
        q: "What payment methods do you take?",
        a: "We use Stripe. All major credit and debit cards.",
      },
    ],
  },
  {
    title: "Using Localizer",
    items: [
      {
        q: "What kind of assets does Localizer make?",
        a: "From one uploaded image, Localizer generates platform-ready versions for Instagram (square + story), Facebook, X, a print-ready poster, and a web graphic \u2014 each sized and laid out correctly for where it\u2019s going.",
      },
      {
        q: "Can I use my own fonts, colors, and branding?",
        a: "Yes \u2014 that\u2019s the point. Localizer applies your fonts, your colors, and your layout to every asset so everything comes out consistent and on-brand. You can upload custom fonts too.",
      },
      {
        q: "How do promoters get the assets?",
        a: 'Each show gets its own link. Send that one link to the promoter and they get everything for that date \u2014 no emailing individual files, no zip folders, no "can you resend that in a different size."',
      },
      {
        q: "Can I add things like a W-9 or stage plot for promoters?",
        a: "Yes \u2014 you can drop supporting documents (W-9, stage plot, FOH requirements) into a show so the promoter gets them alongside the assets in the same link.",
      },
    ],
  },
  {
    title: "Troubleshooting",
    items: [
      {
        q: "I didn\u2019t get my magic-link email.",
        a: "Check your spam or junk folder first \u2014 the link comes from an @hwy61labs.com address. If it\u2019s not there, wait a minute and try again; sometimes delivery lags. Still stuck? Reply to your welcome email or contact support and we\u2019ll help.",
      },
      {
        q: "My assets didn\u2019t generate / something looks off.",
        a: "Make sure your uploaded image is high-resolution and your branding (fonts, colors) is set on the artist. If an asset still looks wrong, contact us with the show and we\u2019ll take a look.",
      },
      {
        q: "I need help with something not listed here.",
        a: "Reply to your welcome email or contact support directly. We\u2019re a small team building this with working touring people \u2014 we read and respond to everything.",
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
