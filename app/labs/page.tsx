'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import '../landing.css';

const DEMO_DOCS = [
  { t: 'Settlement', n: 'settlement_fillmore_sf.jpg', e: 'JPEG · 2.4 MB', r: 'Parsed · Matched to Mar 15 — The Fillmore, SF' },
  { t: 'Deal Memo', n: 'bowery_presents_deal_memo.pdf', e: 'PDF · 340 KB', r: 'Parsed · 12 fields extracted · Matched to Apr 2 — Bowery Ballroom' },
  { t: 'Hotel', n: 'marriott_conf_april.pdf', e: 'PDF · 128 KB', r: 'Parsed · Room block for 6 rooms · Matched to Apr 2–4' },
  { t: 'Receipt', n: 'IMG_4821.jpg', e: 'JPEG · 1.1 MB', r: 'Parsed · $47.82 fuel · Logged to tour expenses' },
  { t: 'Advance', n: 'advance_reply_930club.pdf', e: 'PDF · 210 KB', r: 'Parsed · Load-in, WiFi, contacts · Matched to Apr 8 — 9:30 Club' },
];

const DZ_TABS = [
  { icon: '📄', label: 'Settlement', desc: "Handwritten, printed, or photographed. HWY61 reads the numbers — even crossed-out ones.", format: 'JPG · PDF · PNG' },
  { icon: '📋', label: 'Deal Memo', desc: 'Extracts every field — guarantee, splits, production, merch terms, billing — in seconds.', format: 'PDF · DOCX' },
  { icon: '🏨', label: 'Hotel', desc: 'Confirmation number, rate, check-in/out, room block details — pulled and matched to the show.', format: 'PDF · EMAIL' },
  { icon: '🧾', label: 'Receipt', desc: 'Snap a receipt. Amount, vendor, date, category — auto-logged to the tour expense report.', format: 'JPG · PNG · PDF' },
  { icon: '✉', label: 'Advance', desc: 'Venue responses parsed automatically. Load-in, WiFi, parking, contacts — all captured.', format: 'EMAIL · PDF · FORM' },
];

export default function LabsPage() {
  // Reveal on scroll
  useEffect(() => {
    const els = document.querySelectorAll('.landing-page .rv');
    const observers: IntersectionObserver[] = [];
    els.forEach((el) => {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('vis'); });
      }, { threshold: 0.15 });
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <div className="landing-page">
      <Nav />
      <Hero />
      <hr className="section-divider" />
      <Problem />
      <hr className="section-divider" />
      <DropZone />
      <hr className="section-divider" />
      <Products />
      <hr className="section-divider" />
      <RoadApp />
      <hr className="section-divider" />
      <Audience />
      <hr className="section-divider" />
      <Pricing />
      <hr className="section-divider" />
      <BottomCTA />
      <Footer />
    </div>
  );
}

/* ══════════════════════════════════
   NAV
   ══════════════════════════════════ */
function Nav() {
  return (
    <nav>
      <div className="nav-inner">
        <a href="#" className="logo">HWY<span>61</span></a>
        <ul className="nav-links">
          <li><a href="#products">Products</a></li>
          <li><a href="#who">Who It&rsquo;s For</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#waitlist" className="nav-cta">Join the Beta</a></li>
        </ul>
      </div>
    </nav>
  );
}

/* ══════════════════════════════════
   HERO
   ══════════════════════════════════ */
function Hero() {
  return (
    <section className="hero">
      <div className="hero-accent-line" />
      <div className="hero-wordmark">
        HWY<span className="cr">6</span><span className="cr">1</span> LABS
      </div>
      <div className="hero-eyebrow">Now in Beta</div>
      <h1>The first <em>operating system</em> for touring</h1>
      <p className="hero-sub">One platform for every person on the road. Routing, advancing, settlement, finance — from the first offer to the last check.</p>
      <form className="hero-form" id="waitlist" onSubmit={(e) => { e.preventDefault(); console.log('Hero form submitted'); }}>
        <select defaultValue="">
          <option value="" disabled>I&rsquo;m a...</option>
          <option>Booking Agent</option>
          <option>Manager / TM</option>
          <option>Band (Self-Managed)</option>
          <option>Venue / Promoter</option>
          <option>Other</option>
        </select>
        <input type="email" placeholder="your@email.com" />
        <button type="submit">Get Early Access</button>
      </form>
      <p className="hero-note">Free during beta. No credit card required.</p>
    </section>
  );
}

/* ══════════════════════════════════
   PROBLEM
   ══════════════════════════════════ */
function Problem() {
  return (
    <section className="dark-bg rv">
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div className="section-tag">The Reality</div>
        <p className="problem-text">You&rsquo;re running a touring operation across spreadsheets, email chains, text threads, and math done by hand at 1am in a green room. <strong>Your tools weren&rsquo;t built for this work. We built one that was.</strong></p>
      </div>
    </section>
  );
}

/* ══════════════════════════════════
   DROP ZONE DEMO
   ══════════════════════════════════ */
function DropZone() {
  const [activeTab, setActiveTab] = useState(0);
  const [boxActive, setBoxActive] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [doc, setDoc] = useState(DEMO_DOCS[0]);
  const runningRef = useRef(false);
  const startedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const demoRef = useRef<HTMLDivElement>(null);

  const runDemo = useCallback((i: number) => {
    if (runningRef.current) return;
    runningRef.current = true;
    const d = DEMO_DOCS[i];
    setActiveTab(i);
    setDropping(false);
    setShowResult(false);
    setBoxActive(false);
    setDoc(d);

    setTimeout(() => setBoxActive(true), 200);
    setTimeout(() => setDropping(true), 500);
    setTimeout(() => setShowResult(true), 1400);
    setTimeout(() => {
      runningRef.current = false;
      if (startedRef.current) {
        timerRef.current = setTimeout(() => runDemo((i + 1) % DEMO_DOCS.length), 3000);
      }
    }, 2200);
  }, []);

  useEffect(() => {
    const el = demoRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          setTimeout(() => runDemo(0), 500);
        }
      });
    }, { threshold: 0.2 });
    obs.observe(el);
    return () => { obs.disconnect(); if (timerRef.current) clearTimeout(timerRef.current); };
  }, [runDemo]);

  function handleTabClick(i: number) {
    if (timerRef.current) clearTimeout(timerRef.current);
    runDemo(i);
  }

  return (
    <section className="dropzone-section alt-bg rv" id="intake">
      <div className="container">
        <div className="dropzone-header">
          <div className="section-tag">Universal Document Intake</div>
          <h2 className="section-headline">Drop <em>anything.</em> We&rsquo;ll read it.</h2>
          <p className="sub-headline" style={{ maxWidth: 680, margin: '0 auto' }}>Settlement sheets, deal memos, hotel confirmations, receipts, advance responses — photo, PDF, spreadsheet, scan. Drop it in. HWY61 reads it, matches it to the right show, and puts every number where it belongs.</p>
        </div>

        <div className="dropzone-demo" ref={demoRef}>
          <div className={`dz-box${boxActive ? ' active' : ''}`}>
            <svg className="dz-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 4L24 32M24 4L16 12M24 4L32 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 28V38C8 40.2091 9.79086 42 12 42H36C38.2091 42 40 40.2091 40 38V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="dz-text">Drop any touring document here</div>
            <div className="dz-sub">PDF · Photo · Excel · Scan · Screenshot</div>
            <div className={`dz-doc${dropping ? ' dropping' : ''}`} style={!dropping ? { opacity: 0, transform: 'translateY(-80px) rotate(-2deg)' } : undefined}>
              <div className="dz-doc-type">{doc.t}</div>
              <div className="dz-doc-name">{doc.n}</div>
              <div className="dz-doc-ext">{doc.e}</div>
            </div>
          </div>
          <div className={`dz-result${showResult ? ' show' : ''}`}>
            <div className="dz-result-inner">
              <svg viewBox="0 0 14 14" fill="none"><path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span className="dz-result-text">{doc.r}</span>
            </div>
          </div>
        </div>

        <div className="dz-tabs">
          {DZ_TABS.map((tab, i) => (
            <div key={i} className={`dz-tab${activeTab === i ? ' active' : ''}`} onClick={() => handleTabClick(i)}>
              <div className="dz-tab-icon">{tab.icon}</div>
              <div className="dz-tab-label">{tab.label}</div>
              <div className="dz-tab-desc">{tab.desc}</div>
              <div className="dz-tab-format">{tab.format}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════
   PRODUCTS
   ══════════════════════════════════ */
function Products() {
  return (
    <section className="rv" id="products">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <div className="section-tag">The Platform</div>
          <h2 className="section-headline">Everything lives in one place</h2>
        </div>

        {/* TourRouter */}
        <div className="product-block">
          <div className="product-header">
            <div className="product-header-text">
              <div className="product-name c-crimson">TourRouter</div>
              <div className="product-tagline">The complete OS for touring</div>
            </div>
            <Link href="/tourrouter" className="learn-more-btn c-crimson">Learn More</Link>
          </div>
          <div className="product-desc">
            <p>Drop in an offer sheet and TourRouter builds your routing table. Real drive times between every city. Gas cost estimates based on your vehicle. Long drives flagged automatically. A drive-vs-fly toggle on every leg so you can compare what it costs to put the band on a plane versus grinding a 14-hour overnight.</p>
            <p>The full budget builds itself as you route — projected guarantees, expenses, per diems, hotel costs, personnel pay, commissions — all flowing into a live P&amp;L that updates with every change. When the tour hits the road, drop settlement sheets, receipts, and hotel confirmations into HWY61 and watch projected numbers turn into actuals. Night-of settlement done in minutes, not hours. End-of-tour financials closed with one click.</p>
            <p>Advance every show automatically. Track every guest list. Pay every person on the bus. One platform from the first offer to the last check.</p>
          </div>
          <div className="product-features">
            <div className="product-feat"><span className="product-feat-label">Smart routing</span><span className="product-feat-desc">Real drive times, gas estimates, long-drive flags</span></div>
            <div className="product-feat"><span className="product-feat-label">Drive vs. fly</span><span className="product-feat-desc">Compare ground and air on every leg</span></div>
            <div className="product-feat"><span className="product-feat-label">Live budgeting</span><span className="product-feat-desc">Full P&amp;L that updates as you build the tour</span></div>
            <div className="product-feat"><span className="product-feat-label">Settlement</span><span className="product-feat-desc">Projected vs. actual — drop the sheet, numbers match</span></div>
            <div className="product-feat"><span className="product-feat-label">Advance automation</span><span className="product-feat-desc">Every show advanced on schedule, no manual follow-up</span></div>
            <div className="product-feat"><span className="product-feat-label">Personnel &amp; pay</span><span className="product-feat-desc">Weekly, per-show, percentage — every pay structure handled</span></div>
            <div className="product-feat"><span className="product-feat-label">End-of-tour financials</span><span className="product-feat-desc">One-click close — shareable report for artist and management</span></div>
            <div className="product-feat"><span className="product-feat-label">Guest list</span><span className="product-feat-desc">Allotments, cutoffs, and door list — per show</span></div>
          </div>
          <div className="product-price">Starting at <span>$49/mo</span></div>
        </div>

        {/* Localizer */}
        <div className="product-block">
          <div className="product-header">
            <div className="product-header-text">
              <div className="product-name c-blue">Localizer</div>
              <div className="product-tagline">Tour marketing on autopilot</div>
            </div>
            <Link href="/localizer" className="learn-more-btn c-blue">Learn More</Link>
          </div>
          <div className="product-desc">
            <p>Upload one promo image. Localizer generates every show asset for every platform — Instagram story, Facebook event, X post, poster, web graphic — branded with your fonts, your colors, your layout. Every format. Every size. Done.</p>
            <p>Then send the entire tour&rsquo;s assets to every promoter on your routing in one clean link. Not a Dropbox folder. Not 47 emails with attachments. One link, every asset, every show — promoters grab exactly what they need.</p>
          </div>
          <div className="product-features">
            <div className="product-feat"><span className="product-feat-label">Multi-format generation</span><span className="product-feat-desc">Every platform size from one image</span></div>
            <div className="product-feat"><span className="product-feat-label">Branded templates</span><span className="product-feat-desc">Your fonts, colors, and layout — every time</span></div>
            <div className="product-feat"><span className="product-feat-label">Promoter distribution</span><span className="product-feat-desc">One link per tour — every promoter, every asset</span></div>
            <div className="product-feat"><span className="product-feat-label">Batch export</span><span className="product-feat-desc">Full tour&rsquo;s assets in one download</span></div>
          </div>
          <div className="product-price">Starting at <span>$39/mo</span></div>
        </div>

        {/* DIY */}
        <div className="product-block">
          <div className="product-header">
            <div className="product-header-text">
              <div className="product-name c-purple">DIY</div>
              <div className="product-tagline">Pro tools at an indie price</div>
            </div>
            <Link href="/diy" className="learn-more-btn c-purple">Learn More</Link>
          </div>
          <div className="product-desc">
            <p>No agent. No tour manager. No problem. You&rsquo;re booking your own shows and planning your own routes — HWY61 DIY gives you the same routing engine the pros use. Real drive times, gas estimates for your van, long-drive warnings, and a budget that builds itself as you add dates.</p>
            <p>Drop in offer sheets, deal memos, or anything else — HWY61 reads it and puts every number where it belongs. Smart tools without the price tag.</p>
          </div>
          <div className="product-features">
            <div className="product-feat"><span className="product-feat-label">Real routing</span><span className="product-feat-desc">Actual drive times and distances, not estimates</span></div>
            <div className="product-feat"><span className="product-feat-label">Tour budgeting</span><span className="product-feat-desc">See your numbers before you leave the house</span></div>
            <div className="product-feat"><span className="product-feat-label">Document intake</span><span className="product-feat-desc">Drop anything — HWY61 reads it</span></div>
            <div className="product-feat"><span className="product-feat-label">All 14 deal types</span><span className="product-feat-desc">Flat guarantee to co-headliner splits</span></div>
          </div>
          <div className="product-price"><span>$19/mo</span></div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════
   ROAD APP
   ══════════════════════════════════ */
function RoadApp() {
  return (
    <section className="road-app-section alt-bg rv">
      <div className="container">
        <div className="road-app-grid">
          <div className="road-app-text">
            <div className="section-tag">Included with TourRouter</div>
            <h2>The Road App.<br /><em>Free for everyone.</em></h2>
            <p>Van call, load-in, hotel, set times, travel — everything the band and crew need on the road. Nothing they don&rsquo;t.</p>
            <p>No login required. No cost. Just enter the tour code your TM sends and you&rsquo;re in. Every person on the road stays on the same page.</p>
          </div>
          <div>
            <div className="phone-frame">
              <div className="phone-notch" />
              <div className="phone-content">
                <div className="phone-label">Today&rsquo;s Show</div>
                <div className="phone-venue">The Fillmore — SF</div>
                <div className="phone-row"><span className="phone-row-label">Van Call</span><span className="phone-row-value">10:00 AM</span></div>
                <div className="phone-row"><span className="phone-row-label">Load In</span><span className="phone-row-value">3:00 PM</span></div>
                <div className="phone-row"><span className="phone-row-label">Soundcheck</span><span className="phone-row-value">4:30 PM</span></div>
                <div className="phone-row"><span className="phone-row-label">Doors</span><span className="phone-row-value">7:00 PM</span></div>
                <div className="phone-row"><span className="phone-row-label">Showtime</span><span className="phone-row-value">9:00 PM</span></div>
                <div className="phone-row"><span className="phone-row-label">Hotel</span><span className="phone-row-value">Hotel Nikko</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════
   AUDIENCE
   ══════════════════════════════════ */
function Audience() {
  return (
    <section className="rv" id="who">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <div className="section-tag">Built for the Road</div>
          <h2 className="section-headline">You already know you need this</h2>
        </div>
        <div className="audience-grid">
          <div className="audience-card">
            <h3>Agents</h3>
            <p>Your offers live in email. Your calendar lives in a spreadsheet. Your roster&rsquo;s availability lives in your head. When you confirm a show in HWY61, it lands in your artist&rsquo;s tour automatically. No re-entry. No forwarded PDFs.</p>
          </div>
          <div className="audience-card">
            <h3>Managers &amp; TMs</h3>
            <p>Route the tour, advance every show, settle every night, pay every person, and close the books — in one place. Drop a settlement sheet at 2am and the numbers are already matched by morning.</p>
          </div>
          <div className="audience-card">
            <h3>DIY Artists</h3>
            <p>You don&rsquo;t have an agent or a tour manager. You have a band, a van, and a calendar. HWY61 DIY gives you real drive times, smart budgeting, and the same tools the pros use — for $19 a month.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════
   PRICING
   ══════════════════════════════════ */
function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  function price(m: number, y: number) {
    return <><sup>$</sup>{isYearly ? y : m}</>;
  }
  function annual(text: string) {
    return isYearly ? text : '\u00A0';
  }

  return (
    <section className="alt-bg rv" id="pricing">
      <div className="container">
        <div className="pricing-header">
          <div className="section-tag">Pricing</div>
          <h2 className="section-headline">Simple plans. <em>No surprises.</em></h2>
          <p>Pick the product that fits your operation — or bundle them together and save.</p>
        </div>

        <div className="pricing-toggle">
          <span className={`toggle-label${!isYearly ? ' active' : ''}`} onClick={() => setIsYearly(false)}>Monthly</span>
          <div className={`toggle-switch${isYearly ? ' on' : ''}`} onClick={() => setIsYearly(!isYearly)} />
          <span className={`toggle-label${isYearly ? ' active' : ''}`} onClick={() => setIsYearly(true)}>Yearly <span className="save-badge">Save 20%</span></span>
        </div>

        {/* TourRouter */}
        <div className="pricing-group">
          <div className="pricing-group-name c-crimson">TourRouter</div>
          <div className="pricing-cards">
            <div className="p-card">
              <div className="p-tier">Solo</div>
              <div className="p-price">{price(49, 39)}</div>
              <div className="p-period">per month</div>
              <div className="p-annual">{annual('$468 billed annually')}</div>
              <div className="p-desc">For the manager or TM running one act.</div>
              <ul className="p-feat"><li>1 artist</li><li>1 user</li><li>Smart routing + drive times</li><li>Drive vs. fly comparison</li><li>Live tour budgeting</li><li>Document intake</li><li>All 14 deal types</li><li>CSV + PDF export</li></ul>
              <button className="p-btn">Get Started</button>
            </div>
            <div className="p-card featured">
              <div className="p-badge">Most popular</div>
              <div className="p-tier">Pro</div>
              <div className="p-price">{price(79, 65)}</div>
              <div className="p-period">per month</div>
              <div className="p-annual">{annual('$780 billed annually')}</div>
              <div className="p-desc">Full touring OS for professional operations.</div>
              <ul className="p-feat"><li>3 artists</li><li>5 users</li><li>Everything in Solo, plus:</li><li>Settlement (projected vs. actual)</li><li>Advance automation</li><li>Personnel &amp; pay</li><li>Guest list management</li><li>Finance layer + P&amp;L</li><li>End-of-tour report</li></ul>
              <button className="p-btn">Get Started</button>
            </div>
            <div className="p-card">
              <div className="p-tier">Agency</div>
              <div className="p-price">{price(149, 125)}</div>
              <div className="p-period">per month</div>
              <div className="p-annual">{annual('$1,500 billed annually')}</div>
              <div className="p-desc">For management companies running multiple acts.</div>
              <ul className="p-feat"><li>Unlimited artists</li><li>Unlimited users</li><li>Everything in Pro, plus:</li><li>Multi-tour dashboard</li><li>Commission waterfall</li><li>Shareable finance reports</li><li>Priority support</li></ul>
              <button className="p-btn">Get Started</button>
            </div>
          </div>
        </div>

        {/* Localizer */}
        <div className="pricing-group">
          <div className="pricing-group-name c-blue">Localizer</div>
          <div className="pricing-cards">
            <div className="p-card">
              <div className="p-tier">Basic</div>
              <div className="p-price">{price(39, 29)}</div>
              <div className="p-period">per month</div>
              <div className="p-annual">{annual('$348 billed annually')}</div>
              <div className="p-desc">Tour marketing for one artist.</div>
              <ul className="p-feat"><li>1 artist</li><li>1 user</li><li>Multi-format asset generation</li><li>All platform sizes</li><li>Promoter share links</li><li>Batch export</li></ul>
              <button className="p-btn">Get Started</button>
            </div>
            <div className="p-card featured">
              <div className="p-badge">Most popular</div>
              <div className="p-tier">Pro</div>
              <div className="p-price">{price(69, 55)}</div>
              <div className="p-period">per month</div>
              <div className="p-annual">{annual('$660 billed annually')}</div>
              <div className="p-desc">Custom branding and team access.</div>
              <ul className="p-feat"><li>3 artists</li><li>3 users</li><li>Everything in Basic, plus:</li><li>Custom fonts &amp; brand colors</li><li>Custom layout templates</li><li>Team member access</li></ul>
              <button className="p-btn">Get Started</button>
            </div>
            <div className="p-card">
              <div className="p-tier">Agency</div>
              <div className="p-price">{price(139, 115)}</div>
              <div className="p-period">per month</div>
              <div className="p-annual">{annual('$1,380 billed annually')}</div>
              <div className="p-desc">Full roster marketing at scale.</div>
              <ul className="p-feat"><li>Unlimited artists</li><li>Unlimited users</li><li>Everything in Pro, plus:</li><li>White-label distribution</li><li>Roster-wide templates</li><li>Priority support</li></ul>
              <button className="p-btn">Get Started</button>
            </div>
          </div>
        </div>

        {/* DIY + Road App */}
        <div className="pricing-small">
          <div className="p-small-card">
            <div className="p-tier">DIY</div>
            <div className="p-price">{price(19, 15)}</div>
            <div className="p-period">per month</div>
            <div className="p-annual">{annual('$180 billed annually')}</div>
            <div className="p-desc">Pro routing tools at an indie price. Same engine, no bloat.</div>
            <ul className="p-feat"><li>1 artist, 1 user</li><li>Smart routing + drive times</li><li>Live tour budgeting</li><li>Document intake</li><li>All 14 deal types</li></ul>
            <button className="p-btn">Get Started</button>
          </div>
          <div className="p-small-card">
            <div className="p-tier">Road App</div>
            <div className="p-price"><sup></sup>Free</div>
            <div className="p-period">always</div>
            <div className="p-annual">&nbsp;</div>
            <div className="p-desc">Van call, load-in, hotel, set times — for every person on the road.</div>
            <ul className="p-feat"><li>No account required</li><li>Enter tour code and go</li><li>Today&rsquo;s schedule at a glance</li><li>Hotel &amp; travel info</li><li>Works offline</li></ul>
            <button className="p-btn">Download</button>
          </div>
        </div>

        {/* Bundle */}
        <div className="pricing-bundle">
          <div className="bundle-inner">
            <div className="bundle-left">
              <h3>The Full <em>HWY61 Suite</em></h3>
              <p>Everything in one subscription. TourRouter Agency + Localizer Agency + DIY + Road App. One bill, one login, every feature — for your entire operation.</p>
              <div className="bundle-includes">
                <span>✓ TourRouter Agency</span>
                <span>✓ Localizer Agency</span>
                <span>✓ DIY included</span>
                <span>✓ Road App included</span>
              </div>
            </div>
            <div className="bundle-right">
              <div className="p-price">{price(249, 199)}</div>
              <div className="p-period">per month</div>
              <div className="p-annual">{annual('$2,388 billed annually')}</div>
              <div className="bundle-save">{isYearly ? 'Save $165/mo vs. buying separately' : 'Save $138/mo vs. buying separately'}</div>
              <button className="p-btn">Get the Suite</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════
   BOTTOM CTA
   ══════════════════════════════════ */
function BottomCTA() {
  return (
    <section className="dark-bg bottom-cta rv">
      <div className="container" style={{ textAlign: 'center' }}>
        <div className="section-tag">Early Access</div>
        <h2 className="section-headline">Get on the road <em>with us</em></h2>
        <p className="sub-headline" style={{ color: 'var(--hw-gray)', margin: '0 auto 40px', textAlign: 'center' }}>We&rsquo;re building HWY61 with working touring professionals. Join the beta and shape what this becomes.</p>
        <form className="hero-form" style={{ animation: 'none' }} onSubmit={(e) => { e.preventDefault(); console.log('Bottom CTA form submitted'); }}>
          <select defaultValue="">
            <option value="" disabled>I&rsquo;m a...</option>
            <option>Booking Agent</option>
            <option>Manager / TM</option>
            <option>Band (Self-Managed)</option>
            <option>Venue / Promoter</option>
            <option>Other</option>
          </select>
          <input type="email" placeholder="your@email.com" />
          <button type="submit">Get Early Access</button>
        </form>
      </div>
    </section>
  );
}

/* ══════════════════════════════════
   FOOTER
   ══════════════════════════════════ */
function Footer() {
  return (
    <footer>
      <div className="container">
        <p>HWY61 Labs &copy; 2026 &nbsp;&middot;&nbsp; <Link href="/terms">Terms</Link> &nbsp;&middot;&nbsp; <Link href="/privacy">Privacy</Link></p>
      </div>
    </footer>
  );
}
