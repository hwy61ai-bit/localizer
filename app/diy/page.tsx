"use client";

import Link from "next/link";

export default function DIYPage() {
  return (
    <div className="diy-page">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=Space+Mono:wght@400;700&display=swap');

        .diy-page *, .diy-page *::before, .diy-page *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .diy-page {
          --hw-crimson: #c5535b; --hw-crimson-dark: #a8444b; --hw-crimson-ghost: rgba(197,83,91,0.08);
          --hw-blue: #456ca9; --hw-blue-ghost: rgba(69,108,169,0.08);
          --hw-gray: #c7c1bf; --hw-purple: #966c9a; --hw-purple-ghost: rgba(150,108,154,0.08);
          --hw-rose: #c19795; --hw-green: #5a9e6a; --hw-amber: #c49a3c;
          --hw-bg: #F5F0E8; --hw-bg-warm: #FFFDF8; --hw-bg-surface: #FFFFFF; --hw-bg-invert: #1A1A1A;
          --hw-text: #1A1A1A; --hw-text-secondary: #4A4540; --hw-text-muted: #8A8580; --hw-text-invert: #F5F0E8;
          --hw-border: #E0D8CC; --hw-border-strong: #1A1A1A;
          --hw-font-display: 'Bebas Neue', sans-serif; --hw-font-mono: 'Space Mono', monospace; --hw-font-body: 'DM Sans', sans-serif;
          --hw-shadow-sm: 3px 3px 0 var(--hw-border-strong); --hw-shadow-md: 4px 4px 0 var(--hw-border-strong);
          --hw-shadow-lg: 6px 6px 0 var(--hw-border-strong); --hw-shadow-accent: 6px 6px 0 var(--hw-crimson);

          background: transparent;
          color: var(--hw-text);
          font-family: var(--hw-font-body);
          font-weight: 300;
          -webkit-font-smoothing: antialiased;
          line-height: 1.6;
        }

        /* ── NAV ── */
        .diy-page nav { background: var(--hw-bg-invert); padding: 16px 0; position: sticky; top: 0; z-index: 1000; }
        .diy-page .nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 32px; display: flex; align-items: center; justify-content: space-between; }
        .diy-page .logo { font-family: var(--hw-font-display); font-size: 28px; letter-spacing: 3px; color: var(--hw-text-invert); text-decoration: none; }
        .diy-page .logo span { color: var(--hw-crimson); }
        .diy-page .nav-links { display: flex; gap: 28px; align-items: center; list-style: none; }
        .diy-page .nav-links a { font-family: var(--hw-font-mono); font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--hw-gray); text-decoration: none; transition: color 0.15s ease; }
        .diy-page .nav-links a:hover { color: var(--hw-text-invert); }
        .diy-page .nav-links a.active { color: var(--hw-crimson); }
        .diy-page .nav-cta { font-family: var(--hw-font-display); font-size: 14px; letter-spacing: 3px; text-transform: uppercase; background: var(--hw-crimson); color: white; padding: 10px 24px; border: 3px solid var(--hw-crimson); border-radius: 0; text-decoration: none; transition: all 0.15s ease; }
        .diy-page .nav-cta:hover { background: var(--hw-crimson-dark); transform: translateY(-2px); box-shadow: var(--hw-shadow-md); }

        /* ── LAYOUT ── */
        .diy-page .container { max-width: 1200px; margin: 0 auto; padding: 0 32px; }
        .diy-page section { padding: 80px 0; }
        .diy-page section.alt-bg { background: var(--hw-bg-warm); }
        .diy-page section.dark-bg { background: var(--hw-bg-invert); color: var(--hw-text-invert); }
        .diy-page .section-tag { font-family: var(--hw-font-mono); font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: var(--hw-blue); margin-bottom: 16px; }
        .diy-page .dark-bg .section-tag { color: var(--hw-rose); }
        .diy-page .section-headline { font-family: var(--hw-font-display); font-size: clamp(36px, 4vw, 52px); letter-spacing: 2px; text-transform: uppercase; line-height: 1.1; margin-bottom: 24px; }
        .diy-page .sub-headline { font-size: 18px; line-height: 1.7; color: var(--hw-text-secondary); max-width: 680px; margin-bottom: 32px; }
        .diy-page .dark-bg .sub-headline { color: var(--hw-gray); }
        .diy-page .problem-text { font-size: 17px; line-height: 1.8; color: var(--hw-text-secondary); max-width: 760px; margin-bottom: 20px; }
        .diy-page .problem-text:last-of-type { margin-bottom: 0; }
        .diy-page .dark-bg .problem-text { color: var(--hw-gray); }
        .diy-page .problem-highlight { font-weight: 500; color: var(--hw-text); }
        .diy-page .dark-bg .problem-highlight { color: var(--hw-text-invert); }
        .diy-page .section-divider { border: none; border-top: 3px solid var(--hw-border-strong); margin: 0; }

        /* ── BUTTONS ── */
        .diy-page .btn { display: inline-block; font-family: var(--hw-font-display); font-size: 16px; letter-spacing: 3px; text-transform: uppercase; padding: 16px 40px; border: 3px solid; border-radius: 0; text-decoration: none; transition: all 0.15s ease; cursor: pointer; }
        .diy-page .btn-primary { background: var(--hw-crimson); color: white; border-color: var(--hw-crimson); }
        .diy-page .btn-primary:hover { background: var(--hw-crimson-dark); transform: translateY(-2px); box-shadow: var(--hw-shadow-md); }
        .diy-page .btn-secondary { background: var(--hw-bg-surface); color: var(--hw-text); border-color: var(--hw-border-strong); }
        .diy-page .btn-secondary:hover { background: var(--hw-bg-invert); color: var(--hw-text-invert); transform: translateY(-2px); box-shadow: var(--hw-shadow-md); }
        .diy-page .btn-invert { background: var(--hw-bg-surface); color: var(--hw-bg-invert); border-color: var(--hw-bg-surface); }
        .diy-page .btn-invert:hover { transform: translateY(-2px); box-shadow: 4px 4px 0 var(--hw-crimson); }

        /* ── HERO ── */
        .diy-page .hero { padding: 100px 0 80px; }
        .diy-page .hero-eyebrow { font-family: var(--hw-font-mono); font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: var(--hw-crimson); margin-bottom: 20px; display: inline-block; background: var(--hw-crimson-ghost); padding: 6px 16px; border: 2px solid var(--hw-crimson); }
        .diy-page .hero-headline { font-family: var(--hw-font-display); font-size: clamp(48px, 6vw, 72px); letter-spacing: 3px; text-transform: uppercase; line-height: 1.05; margin-bottom: 24px; }
        .diy-page .hero-headline span { color: var(--hw-crimson); }
        .diy-page .btn-row { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }

        /* ── PRICE CALLOUT ── */
        .diy-page .price-callout {
          display: inline-flex;
          align-items: baseline;
          gap: 8px;
          background: var(--hw-bg-surface);
          border: 3px solid var(--hw-border-strong);
          padding: 12px 24px;
          border-radius: 0;
        }
        .diy-page .price-callout .price-amount {
          font-family: var(--hw-font-display);
          font-size: 36px;
          letter-spacing: 1px;
        }
        .diy-page .price-callout .price-period {
          font-family: var(--hw-font-mono);
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--hw-text-muted);
        }

        /* ── COMPARISON ── */
        .diy-page .comparison-block {
          margin-top: 40px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          max-width: 800px;
        }
        .diy-page .comparison-card {
          padding: 32px;
          border: 3px solid var(--hw-border-strong);
          border-radius: 0;
        }
        .diy-page .comparison-card.included { background: var(--hw-bg-surface); }
        .diy-page .comparison-card.not-included { background: var(--hw-bg); opacity: 0.7; }
        .diy-page .comparison-card h3 {
          font-family: var(--hw-font-display);
          font-size: 18px;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .diy-page .comparison-card .check-list { list-style: none; padding: 0; }
        .diy-page .comparison-card .check-list li {
          font-size: 14px;
          color: var(--hw-text-secondary);
          padding: 6px 0;
          padding-left: 24px;
          position: relative;
        }
        .diy-page .comparison-card.included .check-list li::before {
          content: '\\2713';
          position: absolute;
          left: 0;
          color: var(--hw-green);
          font-weight: 700;
        }
        .diy-page .comparison-card.not-included .check-list li::before {
          content: '\\2014';
          position: absolute;
          left: 0;
          color: var(--hw-text-muted);
        }
        .diy-page .comparison-card.not-included .check-list li { color: var(--hw-text-muted); }

        /* ── FEATURES ── */
        .diy-page .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 24px; margin-top: 40px; }
        .diy-page .feature-card { background: var(--hw-bg-surface); border: 3px solid var(--hw-border-strong); padding: 32px; transition: all 0.15s ease; position: relative; border-radius: 0; }
        .diy-page .feature-card:hover { transform: translateY(-4px); box-shadow: var(--hw-shadow-md); }
        .diy-page .feature-card .feature-accent { position: absolute; top: 0; left: 0; width: 100%; height: 4px; }
        .diy-page .feature-card .feature-number { font-family: var(--hw-font-display); font-size: 48px; color: var(--hw-border); line-height: 1; margin-bottom: 12px; }
        .diy-page .feature-card h3 { font-family: var(--hw-font-display); font-size: 22px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; }
        .diy-page .feature-card p { font-size: 15px; line-height: 1.7; color: var(--hw-text-secondary); }

        /* ── USE CASES ── */
        .diy-page .use-cases-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-top: 40px; }
        .diy-page .use-case-card { padding: 32px; border: 3px solid var(--hw-border-strong); background: var(--hw-bg-surface); position: relative; overflow: hidden; border-radius: 0; }
        .diy-page .use-case-card::before { content: ''; position: absolute; top: 0; left: 0; width: 6px; height: 100%; }
        .diy-page .use-case-card:nth-child(1)::before { background: var(--hw-crimson); }
        .diy-page .use-case-card:nth-child(2)::before { background: var(--hw-blue); }
        .diy-page .use-case-card:nth-child(3)::before { background: var(--hw-purple); }
        .diy-page .use-case-card h3 { font-family: var(--hw-font-display); font-size: 22px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; padding-left: 12px; }
        .diy-page .use-case-card p { font-size: 15px; line-height: 1.7; color: var(--hw-text-secondary); padding-left: 12px; }

        /* ── UPGRADE BANNER ── */
        .diy-page .upgrade-banner {
          margin-top: 40px;
          background: var(--hw-blue-ghost);
          border: 3px solid var(--hw-blue);
          padding: 32px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
          border-radius: 0;
        }
        .diy-page .upgrade-banner h3 {
          font-family: var(--hw-font-display);
          font-size: 22px;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .diy-page .upgrade-banner p { font-size: 14px; color: var(--hw-text-secondary); }

        /* ── FINAL CTA ── */
        .diy-page .final-cta { text-align: center; padding: 100px 0; }
        .diy-page .final-cta .section-headline { margin: 0 auto 16px; }
        .diy-page .final-cta .sub-headline { margin: 0 auto 40px; text-align: center; }

        /* ── FOOTER ── */
        .diy-page footer { background: var(--hw-bg-invert); padding: 40px 0; text-align: center; }
        .diy-page footer p { font-family: var(--hw-font-mono); font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--hw-text-muted); }
        .diy-page footer a { color: var(--hw-crimson); text-decoration: none; }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .diy-page section { padding: 60px 0; }
          .diy-page .container { padding: 0 20px; }
          .diy-page .hero { padding: 60px 0; }
          .diy-page .features-grid, .diy-page .use-cases-grid { grid-template-columns: 1fr; }
          .diy-page .comparison-block { grid-template-columns: 1fr; }
          .diy-page nav .nav-links { display: none; }
          .diy-page .btn-row { flex-direction: column; }
          .diy-page .btn-row .btn { text-align: center; }
          .diy-page .upgrade-banner { flex-direction: column; text-align: center; }
        }
      ` }} />

      {/* NAV */}
      <nav>
        <div className="nav-inner">
          <Link href="/" className="logo">HWY<span>61</span></Link>
          <ul className="nav-links">
            <li><Link href="/tourrouter">TourRouter</Link></li>
            <li><Link href="/localizer">Localizer</Link></li>
            <li><Link href="/diy" className="active">DIY</Link></li>
            <li><Link href="/roadapp">Road App</Link></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><Link href="/#waitlist" className="nav-cta">Join the Beta</Link></li>
          </ul>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-eyebrow">For Self-Managed Acts</div>
          <h1 className="hero-headline">The same routing engine<br />the pros use. <span>$19 a month.</span></h1>
          <p className="sub-headline">HWY61 DIY gives you real drive times, smart budgeting, document intake, and all 14 deal types &mdash; without the overhead of a full touring OS. Route your tour. Know what it costs. Make better decisions.</p>
          <div className="btn-row">
            <Link href="/#waitlist" className="btn btn-primary">Start for $19/mo</Link>
            <div className="price-callout">
              <span className="price-amount">$19</span>
              <span className="price-period">/month</span>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* PROBLEM */}
      <section className="dark-bg">
        <div className="container">
          <div className="section-tag">The Problem</div>
          <h2 className="section-headline">You&rsquo;re routing tours in a spreadsheet<br />and guessing at the budget.</h2>
          <p className="problem-text">You&rsquo;ve got a Google Sheet with dates, cities, and guarantees. Maybe you&rsquo;ve got gas costs estimated &mdash; but you&rsquo;re guessing at the mileage. You don&rsquo;t know which legs are brutal drives until you&rsquo;re behind the wheel. <span className="problem-highlight">The &ldquo;budget&rdquo; is a number in your head that you hope works out.</span></p>
          <p className="problem-text">You don&rsquo;t need a full touring OS with settlement systems and commission waterfalls. You need to know: <span className="problem-highlight">can we afford this tour?</span> Which routing makes sense? What&rsquo;s the actual cost of that drive from Atlanta to Nashville versus skipping straight to Chicago?</p>
        </div>
      </section>

      <hr className="section-divider" />

      {/* SOLUTION */}
      <section>
        <div className="container">
          <div className="section-tag">Built for You</div>
          <h2 className="section-headline">Professional routing and budgeting.<br />No complexity you don&rsquo;t need.</h2>
          <p className="sub-headline" style={{ maxWidth: 760 }}>DIY gives you the same routing engine, the same drive time calculations, and the same budgeting tools that tour managers use on full-production tours. Add your shows, set your vehicle and crew size, and see the real financial picture.</p>
          <p className="problem-text">Drop in a route sheet or deal memo and the system reads it and populates your tour. All 14 deal types supported &mdash; flat guarantee, door deal, versus deal &mdash; the math is always right.</p>

          <div className="comparison-block">
            <div className="comparison-card included">
              <h3>What you get</h3>
              <ul className="check-list">
                <li>Real drive times &amp; distances</li>
                <li>Drive vs. fly toggle</li>
                <li>Live budget / P&amp;L</li>
                <li>Document intake</li>
                <li>All 14 deal types</li>
                <li>Multi-currency</li>
                <li>CSV / Excel / PDF export</li>
              </ul>
            </div>
            <div className="comparison-card not-included">
              <h3>TourRouter only</h3>
              <ul className="check-list">
                <li>Settlement tracking</li>
                <li>Advance automation</li>
                <li>Personnel &amp; pay</li>
                <li>Finance layer</li>
                <li>Guest list</li>
                <li>Commissions</li>
                <li>End-of-tour reports</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* FEATURES */}
      <section className="alt-bg">
        <div className="container">
          <div className="section-tag">What You Get</div>
          <h2 className="section-headline">Everything you need. Nothing you don&rsquo;t.</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-accent" style={{ background: "var(--hw-crimson)" }} />
              <div className="feature-number">01</div>
              <h3>Real Drive Times</h3>
              <p>Actual routing calculations between every city on your tour. See hours, miles, and brutal drives flagged before you commit to the routing. Not estimates &mdash; real numbers.</p>
            </div>
            <div className="feature-card">
              <div className="feature-accent" style={{ background: "var(--hw-blue)" }} />
              <div className="feature-number">02</div>
              <h3>Drive vs. Fly</h3>
              <p>Every leg gets a toggle. See the cost of driving vs. flying. If a drive is over your threshold, it flags automatically. Make the call with real numbers, not gut feelings.</p>
            </div>
            <div className="feature-card">
              <div className="feature-accent" style={{ background: "var(--hw-purple)" }} />
              <div className="feature-number">03</div>
              <h3>Live Budget</h3>
              <p>Guarantees, gas costs, per diems, hotel estimates &mdash; all flowing into a P&amp;L that updates as you build the tour. Know whether the tour makes money before you leave the house.</p>
            </div>
            <div className="feature-card">
              <div className="feature-accent" style={{ background: "var(--hw-rose)" }} />
              <div className="feature-number">04</div>
              <h3>Document Intake</h3>
              <p>Drop a route sheet, deal memo, or offer email and the system reads it. No manual data entry for every single show. Your time is better spent on literally anything else.</p>
            </div>
            <div className="feature-card">
              <div className="feature-accent" style={{ background: "var(--hw-green)" }} />
              <div className="feature-number">05</div>
              <h3>All 14 Deal Types</h3>
              <p>Flat guarantee, versus gross, versus net, door deal, sliding scale &mdash; every deal structure the industry uses. The math is always right. Even the weird ones.</p>
            </div>
            <div className="feature-card">
              <div className="feature-accent" style={{ background: "var(--hw-amber)" }} />
              <div className="feature-number">06</div>
              <h3>Multi-Currency + Export</h3>
              <p>Playing Canada or the UK? Each show in its own currency, everything converts automatically. Export as CSV, Excel, or PDF &mdash; share with your bandmates or your booking agent.</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* USE CASES */}
      <section>
        <div className="container">
          <div className="section-tag">Who It&rsquo;s For</div>
          <h2 className="section-headline">Built for bands who do it themselves.</h2>
          <div className="use-cases-grid">
            <div className="use-case-card">
              <h3>The Band That Books<br />Their Own Shows</h3>
              <p>You don&rsquo;t have a manager or a TM. You&rsquo;re the one emailing promoters, figuring out the routing, and doing the math on whether this tour makes sense. DIY does the math for you.</p>
            </div>
            <div className="use-case-card">
              <h3>The Solo Artist</h3>
              <p>Touring solo or with one other person. You need to know if the guarantee covers gas and the hotel. DIY gives you that answer instantly for every show.</p>
            </div>
            <div className="use-case-card">
              <h3>The Act That&rsquo;s About<br />to Hire a Manager</h3>
              <p>You&rsquo;re growing. The tours are getting longer. The routing is getting more complex. Start with DIY now &mdash; when you&rsquo;re ready for a full team, upgrade to TourRouter and everything carries over.</p>
            </div>
          </div>

          <div className="upgrade-banner">
            <div>
              <h3>Ready for the full toolset?</h3>
              <p>Upgrade to TourRouter anytime. All your data carries over. Settlement, advancing, finance, personnel pay &mdash; everything unlocks.</p>
            </div>
            <Link href="/tourrouter" className="btn btn-secondary" style={{ whiteSpace: "nowrap" }}>See TourRouter</Link>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* PRICING / CTA */}
      <section className="dark-bg final-cta" id="pricing">
        <div className="container">
          <div className="section-tag">Get Started</div>
          <h2 className="section-headline">Route your next tour for $19.</h2>
          <p className="sub-headline" style={{ color: "var(--hw-gray)" }}>Real drive times. Real budgeting. Real deal math. Built for bands who do it themselves.</p>
          <div style={{ marginBottom: 24 }}>
            <Link href="/#waitlist" className="btn btn-invert">Get Early Access</Link>
          </div>
          <p style={{ fontSize: 14, color: "var(--hw-text-muted)" }}>Want Localizer too? Add it for $30/mo more. Annual billing saves 20%.</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="container">
          <p>&copy; 2026 HWY61 LLC &nbsp;&middot;&nbsp; <Link href="/terms">Terms</Link> &nbsp;&middot;&nbsp; <Link href="/privacy">Privacy</Link> &nbsp;&middot;&nbsp; <a href="mailto:hello@hwy61labs.com">Contact</a></p>
        </div>
      </footer>
    </div>
  );
}
