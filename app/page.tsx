'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import './landing.css';

const D = [
  { t: 'Settlement', n: 'settlement_fillmore_sf.jpg', e: 'JPEG \u00b7 2.4 MB', r: 'Parsed \u00b7 Matched to Mar 15 \u2014 The Fillmore, SF' },
  { t: 'Deal Memo', n: 'bowery_presents_deal_memo.pdf', e: 'PDF \u00b7 340 KB', r: 'Parsed \u00b7 12 fields extracted \u00b7 Matched to Apr 2 \u2014 Bowery Ballroom' },
  { t: 'Hotel', n: 'marriott_conf_april.pdf', e: 'PDF \u00b7 128 KB', r: 'Parsed \u00b7 Room block for 6 rooms \u00b7 Matched to Apr 2\u20134' },
  { t: 'Receipt', n: 'IMG_4821.jpg', e: 'JPEG \u00b7 1.1 MB', r: 'Parsed \u00b7 $47.82 fuel \u00b7 Logged to tour expenses' },
  { t: 'Advance', n: 'advance_reply_930club.pdf', e: 'PDF \u00b7 210 KB', r: 'Parsed \u00b7 Load-in, WiFi, contacts \u00b7 Matched to Apr 8 \u2014 9:30 Club' },
];

const DOC_TYPES = [
  { icon: '\u{1F4C4}', label: 'Settlement', desc: 'Handwritten, printed, or photographed. HWY61 reads the numbers \u2014 even crossed-out ones.', fmt: 'JPG \u00b7 PDF \u00b7 PNG' },
  { icon: '\u{1F4CB}', label: 'Deal Memo', desc: 'Extracts every field \u2014 guarantee, splits, production, merch terms, billing \u2014 in seconds.', fmt: 'PDF \u00b7 DOCX' },
  { icon: '\u{1F3E8}', label: 'Hotel', desc: 'Confirmation number, rate, check-in/out, room block details \u2014 pulled and matched to the show.', fmt: 'PDF \u00b7 EMAIL' },
  { icon: '\u{1F9FE}', label: 'Receipt', desc: 'Snap a receipt. Amount, vendor, date, category \u2014 auto-logged to the tour expense report.', fmt: 'JPG \u00b7 PNG \u00b7 PDF' },
  { icon: '\u2709', label: 'Advance', desc: 'Venue responses parsed automatically. Load-in, WiFi, parking, contacts \u2014 all captured.', fmt: 'EMAIL \u00b7 PDF \u00b7 FORM' },
];

function EarlyAccessForm({ id }: { id?: string }) {
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('Early access form submitted');
  }
  return (
    <form className="hf" id={id} onSubmit={handleSubmit}>
      <select defaultValue="">
        <option value="" disabled>I&apos;m a...</option>
        <option>Booking Agent</option>
        <option>Manager / TM</option>
        <option>Band (Self-Managed)</option>
        <option>Venue / Promoter</option>
        <option>Other</option>
      </select>
      <input type="email" placeholder="your@email.com" />
      <button type="submit">Get Early Access</button>
    </form>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeDoc, setActiveDoc] = useState(0);
  const [dzActive, setDzActive] = useState(false);
  const [ddDropping, setDdDropping] = useState(false);
  const [drShow, setDrShow] = useState(false);
  const [ddData, setDdData] = useState(D[0]);
  const animatingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startedRef = useRef(false);
  const dzRef = useRef<HTMLDivElement>(null);

  // Nav scroll
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Intersection observer for .rv elements
  useEffect(() => {
    const els = document.querySelectorAll('.rv');
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('vis'); }),
      { threshold: 0.15 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Drop zone demo animation
  const runDemo = useCallback((i: number) => {
    if (animatingRef.current) return;
    animatingRef.current = true;
    const d = D[i];
    setActiveDoc(i);
    setDdDropping(false);
    setDrShow(false);
    setDzActive(false);
    setDdData(d);

    setTimeout(() => setDzActive(true), 200);
    setTimeout(() => setDdDropping(true), 500);
    setTimeout(() => setDrShow(true), 1400);
    setTimeout(() => {
      animatingRef.current = false;
      if (startedRef.current) {
        timerRef.current = setTimeout(() => runDemo((i + 1) % D.length), 3000);
      }
    }, 2200);
  }, []);

  // Start demo when drop zone section enters viewport
  useEffect(() => {
    if (!dzRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            setTimeout(() => runDemo(0), 500);
          }
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(dzRef.current);
    return () => { observer.disconnect(); if (timerRef.current) clearTimeout(timerRef.current); };
  }, [runDemo]);

  function handleDocClick(idx: number) {
    if (timerRef.current) clearTimeout(timerRef.current);
    runDemo(idx);
  }

  return (
    <>
      {/* Nav */}
      <nav className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="nw">HWY61 LABS</div>
        <div className="nl">
          <a href="#products">Products</a>
          <a href="#who">Who It&apos;s For</a>
          <a href="#waitlist" className="nc">Join the Beta</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="lp-hero">
        <div className="hero-badge">
          <div className="hero-badge-dot" />
          <div className="hero-badge-text">Now in beta</div>
        </div>
        <h1>Your tour shouldn&apos;t live <em>in a spreadsheet</em></h1>
        <p className="hs">Offers in email. Routing in Excel. Settlement math on a napkin at 1am. HWY61 replaces all of it &mdash; one platform from the first offer to the last check.</p>
        <EarlyAccessForm id="waitlist" />
        <p className="hn">Free during beta. No credit card required.</p>
      </section>

      {/* Problem */}
      <section className="prob rv">
        <div className="prob-in">
          <div className="sec-label">The problem</div>
          <p>Offers tracked in your inbox. Drive times guessed on Google Maps. Advances buried in a text thread. Settlement math done by hand while the promoter waits. Per diems calculated in your head. End-of-tour accounting that takes a week. <strong>Every person on the tour using a different tool &mdash; or no tool at all.</strong></p>
        </div>
      </section>

      {/* Drop Zone Section */}
      <section className="dzs rv" id="intake">
        <div className="dzh">
          <div className="sec-label">How it works</div>
          <h2>Drop <em>anything.</em> HWY61 reads it.</h2>
          <p>Settlement sheets, deal memos, hotel confirmations, receipts, advance responses &mdash; photo, PDF, spreadsheet, scan. Drop it in. Every number gets matched to the right show and put where it belongs. No data entry. No re-typing.</p>
        </div>

        <div className="dzd" ref={dzRef}>
          <div className={`dzb${dzActive ? ' active' : ''}`}>
            <svg className="dzi" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 4L24 32M24 4L16 12M24 4L32 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 28V38C8 40.2091 9.79086 42 12 42H36C38.2091 42 40 40.2091 40 38V28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="dzp">Drop any touring document here</div>
            <div className="dzps">PDF &middot; Photo &middot; Excel &middot; Scan &middot; Screenshot</div>
            <div className={`dd${ddDropping ? ' dropping' : ''}`} style={ddDropping ? undefined : { opacity: 0, transform: 'translateY(-80px) rotate(-2deg)' }}>
              <div className="ddt">{ddData.t}</div>
              <div className="ddn">{ddData.n}</div>
              <div className="dde">{ddData.e}</div>
            </div>
          </div>
          <div className={`dr${drShow ? ' show' : ''}`}>
            <div className="dri">
              <svg className="drc" viewBox="0 0 14 14" fill="none"><path d="M2 7L5.5 10.5L12 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span className="drt">{ddData.r}</span>
            </div>
          </div>
        </div>

        <div className="dts">
          {DOC_TYPES.map((dt, i) => (
            <div key={dt.label} className={`dtc${activeDoc === i ? ' active' : ''}`} onClick={() => handleDocClick(i)}>
              <div className="dtci">{dt.icon}</div>
              <div className="dtcl">{dt.label}</div>
              <div className="dtcd">{dt.desc}</div>
              <div className="dtcf">{dt.fmt}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Products */}
      <section className="prods rv" id="products">
        <div className="prodsh">
          <div className="sec-label">Two products. One platform.</div>
          <h2 className="sec-title">Route it. Market it. Settle it.</h2>
        </div>

        <div className="pe">
          <div className="pn">TourRouter</div>
          <div className="ph">The complete OS for touring</div>
          <div className="ped">
            <p>Drop in an offer sheet and TourRouter builds your routing table. Real drive times between every city. Gas cost estimates based on your vehicle. Long drives flagged automatically. A drive-vs-fly toggle on every leg so you can compare what it costs to put the band on a plane versus grinding a 14-hour overnight.</p>
            <p>The full budget builds itself as you route &mdash; projected guarantees, expenses, per diems, hotel costs, personnel pay, commissions &mdash; all flowing into a live P&amp;L that updates with every change. When the tour hits the road, drop settlement sheets, receipts, and hotel confirmations into HWY61 and watch projected numbers turn into actuals. Night-of settlement done in minutes, not hours. End-of-tour financials closed with one click.</p>
            <p>Advance every show automatically. Track every guest list. Pay every person on the bus. One platform from the first offer to the last check.</p>
          </div>
          <div className="pfs">
            <div className="pf"><span className="fl">Smart routing</span><span className="fd">Real drive times, gas estimates, long-drive flags</span></div>
            <div className="pf"><span className="fl">Drive vs. fly</span><span className="fd">Compare ground and air on every leg</span></div>
            <div className="pf"><span className="fl">Live budgeting</span><span className="fd">Full P&amp;L that updates as you build the tour</span></div>
            <div className="pf"><span className="fl">Settlement</span><span className="fd">Projected vs. actual &mdash; drop the sheet, numbers match</span></div>
            <div className="pf"><span className="fl">Advance automation</span><span className="fd">Every show advanced on schedule, no manual follow-up</span></div>
            <div className="pf"><span className="fl">Personnel &amp; pay</span><span className="fd">Weekly, per-show, percentage &mdash; every pay structure handled</span></div>
            <div className="pf"><span className="fl">End-of-tour financials</span><span className="fd">One-click close &mdash; shareable report for artist and management</span></div>
            <div className="pf"><span className="fl">Guest list</span><span className="fd">Allotments, cutoffs, and door list &mdash; per show</span></div>
          </div>
          <div className="pp">Starting at <span>$49/mo</span></div>
        </div>

        <div className="pe">
          <div className="pn">Localizer</div>
          <div className="ph">Tour marketing on autopilot</div>
          <div className="ped">
            <p>Upload one promo image. Localizer generates every show asset for every platform &mdash; Instagram story, Facebook event, X post, poster, web graphic &mdash; branded with your fonts, your colors, your layout. Every format. Every size. Done.</p>
            <p>Then send the entire tour&apos;s assets to every promoter on your routing in one clean link. Not a Dropbox folder. Not 47 emails with attachments. One link, every asset, every show &mdash; promoters grab exactly what they need. No back-and-forth. No &ldquo;can you send me the landscape version?&rdquo;</p>
          </div>
          <div className="pfs">
            <div className="pf"><span className="fl">Multi-format generation</span><span className="fd">Every platform size from one image</span></div>
            <div className="pf"><span className="fl">Branded templates</span><span className="fd">Your fonts, colors, and layout &mdash; every time</span></div>
            <div className="pf"><span className="fl">Promoter distribution</span><span className="fd">One link per tour &mdash; every promoter, every asset</span></div>
            <div className="pf"><span className="fl">Batch export</span><span className="fd">Full tour&apos;s assets in one download</span></div>
          </div>
          <div className="pp">Starting at <span>$39/mo</span></div>
        </div>
      </section>

      {/* DIY */}
      <section className="prods diy-section rv">
        <div className="pe">
          <div className="pn" style={{ color: 'var(--hw-text)' }}>DIY</div>
          <div className="ph">Pro tools at an indie price</div>
          <div className="ped">
            <p>No agent. No tour manager. No problem. You&apos;re booking your own shows and planning your own routes &mdash; HWY61 DIY gives you the same routing engine the pros use. Real drive times, gas estimates for your van, long-drive warnings, and a budget that builds itself as you add dates.</p>
            <p>Drop in offer sheets, deal memos, or anything else &mdash; HWY61 reads it and puts every number where it belongs. You get smart tools without the price tag that comes with a full touring operation.</p>
          </div>
          <div className="pfs">
            <div className="pf"><span className="fl">Real routing</span><span className="fd">Actual drive times and distances, not estimates</span></div>
            <div className="pf"><span className="fl">Tour budgeting</span><span className="fd">See your numbers before you leave the house</span></div>
            <div className="pf"><span className="fl">Document intake</span><span className="fd">Drop anything &mdash; HWY61 reads it</span></div>
            <div className="pf"><span className="fl">All 14 deal types</span><span className="fd">Flat guarantee to co-headliner splits</span></div>
          </div>
          <div className="pp"><span>$19/mo</span></div>
        </div>
      </section>

      {/* Road App */}
      <section className="ra rv">
        <div className="rai">
          <div className="rat">
            <div className="sec-label">Included with TourRouter</div>
            <h2>The Road App.<br /><em>Free for everyone.</em></h2>
            <p>Van call, load-in, hotel, set times, travel &mdash; everything the band and crew need on the road. Nothing they don&apos;t.</p>
            <p>No login required. No cost. Just enter the tour code your TM sends and you&apos;re in. Every person on the road stays on the same page.</p>
          </div>
          <div className="rav">
            <div className="pfr">
              <div className="pno" />
              <div className="pc">
                <div className="pcl">Today&apos;s Show</div>
                <div className="pct">The Fillmore &mdash; SF</div>
                <div className="pcd"><span className="pcdl">Van Call</span><span className="pcdv">10:00 AM</span></div>
                <div className="pcd"><span className="pcdl">Load In</span><span className="pcdv">3:00 PM</span></div>
                <div className="pcd"><span className="pcdl">Soundcheck</span><span className="pcdv">4:30 PM</span></div>
                <div className="pcd"><span className="pcdl">Doors</span><span className="pcdv">7:00 PM</span></div>
                <div className="pcd"><span className="pcdl">Showtime</span><span className="pcdv">9:00 PM</span></div>
                <div className="pcd" style={{ borderBottom: 'none' }}><span className="pcdl">Hotel</span><span className="pcdv">Hotel Nikko</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className="aud rv" id="who">
        <div className="audh">
          <div className="sec-label">Who it&apos;s for</div>
          <h2 className="sec-title">If you&apos;re on the road, this is yours</h2>
        </div>
        <div className="audc">
          <div className="audi">
            <h3>Agents</h3>
            <p>Your offers live in email. Your calendar lives in a spreadsheet. Your roster&apos;s availability lives in your head. When you confirm a show in HWY61, it lands in your artist&apos;s tour automatically. No re-entry. No forwarded PDFs.</p>
          </div>
          <div className="audi">
            <h3>Managers &amp; TMs</h3>
            <p>Route the tour, advance every show, settle every night, pay every person, and close the books &mdash; in one place. Drop a settlement sheet at 2am and the numbers are already matched by morning.</p>
          </div>
          <div className="audi">
            <h3>DIY Artists</h3>
            <p>You don&apos;t have an agent or a tour manager. You have a band, a van, and a calendar. HWY61 DIY gives you real drive times, smart budgeting, and the same tools the pros use &mdash; for $19 a month.</p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="bcta rv">
        <div className="sec-label">Beta is open</div>
        <h2>Stop duct-taping <em>your tour together</em></h2>
        <p>We&apos;re building HWY61 with working touring professionals. Join the beta and see what one platform can do.</p>
        <EarlyAccessForm />
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="fol">HWY61 LABS &copy; 2026</div>
        <div className="foli">
          <a href="#">Contact</a>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
        </div>
      </footer>
    </>
  );
}
