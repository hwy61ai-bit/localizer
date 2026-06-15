"use client";

import Link from "next/link";

export default function RoadAppPage() {
  return (
    <div className="roadapp-page">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=Space+Mono:wght@400;700&display=swap');

        .roadapp-page *, .roadapp-page *::before, .roadapp-page *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .roadapp-page {
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
        .roadapp-page nav { background: var(--hw-bg-invert); padding: 16px 0; position: sticky; top: 0; z-index: 1000; }
        .roadapp-page .nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 32px; display: flex; align-items: center; justify-content: space-between; }
        .roadapp-page .logo { font-family: var(--hw-font-display); font-size: 28px; letter-spacing: 3px; color: var(--hw-text-invert); text-decoration: none; }
        .roadapp-page .logo span { color: var(--hw-crimson); }
        .roadapp-page .nav-links { display: flex; gap: 28px; align-items: center; list-style: none; }
        .roadapp-page .nav-links a { font-family: var(--hw-font-mono); font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--hw-gray); text-decoration: none; transition: color 0.15s ease; }
        .roadapp-page .nav-links a:hover { color: var(--hw-text-invert); }
        .roadapp-page .nav-links a.active { color: var(--hw-crimson); }
        .roadapp-page .nav-cta { font-family: var(--hw-font-display); font-size: 14px; letter-spacing: 3px; text-transform: uppercase; background: var(--hw-crimson); color: white; padding: 10px 24px; border: 3px solid var(--hw-crimson); border-radius: 0; text-decoration: none; transition: all 0.15s ease; }
        .roadapp-page .nav-cta:hover { background: var(--hw-crimson-dark); transform: translateY(-2px); box-shadow: var(--hw-shadow-md); }

        /* ── LAYOUT ── */
        .roadapp-page .container { max-width: 1200px; margin: 0 auto; padding: 0 32px; }
        .roadapp-page section { padding: 80px 0; }
        .roadapp-page section.alt-bg { background: var(--hw-bg-warm); }
        .roadapp-page section.dark-bg { background: var(--hw-bg-invert); color: var(--hw-text-invert); }
        .roadapp-page .section-tag { font-family: var(--hw-font-mono); font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: var(--hw-blue); margin-bottom: 16px; }
        .roadapp-page .dark-bg .section-tag { color: var(--hw-rose); }
        .roadapp-page .section-headline { font-family: var(--hw-font-display); font-size: clamp(36px, 4vw, 52px); letter-spacing: 2px; text-transform: uppercase; line-height: 1.1; margin-bottom: 24px; }
        .roadapp-page .sub-headline { font-size: 18px; line-height: 1.7; color: var(--hw-text-secondary); max-width: 680px; margin-bottom: 32px; }
        .roadapp-page .dark-bg .sub-headline { color: var(--hw-gray); }
        .roadapp-page .problem-text { font-size: 17px; line-height: 1.8; color: var(--hw-text-secondary); max-width: 760px; margin-bottom: 20px; }
        .roadapp-page .problem-text:last-of-type { margin-bottom: 0; }
        .roadapp-page .dark-bg .problem-text { color: var(--hw-gray); }
        .roadapp-page .problem-highlight { font-weight: 500; color: var(--hw-text); }
        .roadapp-page .dark-bg .problem-highlight { color: var(--hw-text-invert); }
        .roadapp-page .section-divider { border: none; border-top: 3px solid var(--hw-border-strong); margin: 0; }

        /* ── BUTTONS ── */
        .roadapp-page .btn { display: inline-block; font-family: var(--hw-font-display); font-size: 16px; letter-spacing: 3px; text-transform: uppercase; padding: 16px 40px; border: 3px solid; border-radius: 0; text-decoration: none; transition: all 0.15s ease; cursor: pointer; }
        .roadapp-page .btn-primary { background: var(--hw-crimson); color: white; border-color: var(--hw-crimson); }
        .roadapp-page .btn-primary:hover { background: var(--hw-crimson-dark); transform: translateY(-2px); box-shadow: var(--hw-shadow-md); }
        .roadapp-page .btn-secondary { background: var(--hw-bg-surface); color: var(--hw-text); border-color: var(--hw-border-strong); }
        .roadapp-page .btn-secondary:hover { background: var(--hw-bg-invert); color: var(--hw-text-invert); transform: translateY(-2px); box-shadow: var(--hw-shadow-md); }
        .roadapp-page .btn-invert { background: var(--hw-bg-surface); color: var(--hw-bg-invert); border-color: var(--hw-bg-surface); }
        .roadapp-page .btn-invert:hover { transform: translateY(-2px); box-shadow: 4px 4px 0 var(--hw-crimson); }

        /* ── HERO ── */
        .roadapp-page .hero { padding: 100px 0 80px; }
        .roadapp-page .hero-eyebrow { font-family: var(--hw-font-mono); font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: var(--hw-crimson); margin-bottom: 20px; display: inline-block; background: var(--hw-crimson-ghost); padding: 6px 16px; border: 2px solid var(--hw-crimson); }
        .roadapp-page .hero-headline { font-family: var(--hw-font-display); font-size: clamp(48px, 6vw, 72px); letter-spacing: 3px; text-transform: uppercase; line-height: 1.05; margin-bottom: 24px; }
        .roadapp-page .hero-headline span { color: var(--hw-crimson); }
        .roadapp-page .btn-row { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }

        /* ── FREE BADGE ── */
        .roadapp-page .free-badge {
          display: inline-block;
          font-family: var(--hw-font-display);
          font-size: 24px;
          letter-spacing: 3px;
          text-transform: uppercase;
          background: var(--hw-green);
          color: white;
          padding: 8px 24px;
          border: 3px solid var(--hw-border-strong);
          border-radius: 0;
        }

        /* ── STEPS ── */
        .roadapp-page .steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          margin-top: 40px;
          max-width: 900px;
        }
        .roadapp-page .step-card {
          padding: 40px 32px;
          border: 3px solid var(--hw-border-strong);
          background: var(--hw-bg-surface);
          text-align: center;
          position: relative;
          border-radius: 0;
        }
        .roadapp-page .step-card + .step-card { border-left: none; }
        .roadapp-page .step-card .step-number {
          font-family: var(--hw-font-display);
          font-size: 64px;
          color: var(--hw-border);
          line-height: 1;
          margin-bottom: 12px;
        }
        .roadapp-page .step-card h3 {
          font-family: var(--hw-font-display);
          font-size: 20px;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .roadapp-page .step-card p {
          font-size: 14px;
          line-height: 1.6;
          color: var(--hw-text-secondary);
        }

        /* ── FEATURES ── */
        .roadapp-page .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 24px; margin-top: 40px; }
        .roadapp-page .feature-card { background: var(--hw-bg-surface); border: 3px solid var(--hw-border-strong); padding: 32px; transition: all 0.15s ease; position: relative; border-radius: 0; }
        .roadapp-page .feature-card:hover { transform: translateY(-4px); box-shadow: var(--hw-shadow-md); }
        .roadapp-page .feature-card .feature-accent { position: absolute; top: 0; left: 0; width: 100%; height: 4px; }
        .roadapp-page .feature-card .feature-number { font-family: var(--hw-font-display); font-size: 48px; color: var(--hw-border); line-height: 1; margin-bottom: 12px; }
        .roadapp-page .feature-card h3 { font-family: var(--hw-font-display); font-size: 22px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; }
        .roadapp-page .feature-card p { font-size: 15px; line-height: 1.7; color: var(--hw-text-secondary); }

        /* ── NO FINANCIALS CALLOUT ── */
        .roadapp-page .no-financials {
          margin-top: 40px;
          background: var(--hw-bg-invert);
          border: 3px solid var(--hw-border-strong);
          padding: 40px;
          display: flex;
          align-items: center;
          gap: 24px;
          border-radius: 0;
        }
        .roadapp-page .no-financials .nf-icon {
          font-family: var(--hw-font-display);
          font-size: 48px;
          color: var(--hw-crimson);
          flex-shrink: 0;
        }
        .roadapp-page .no-financials h3 {
          font-family: var(--hw-font-display);
          font-size: 22px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--hw-text-invert);
          margin-bottom: 8px;
        }
        .roadapp-page .no-financials p {
          font-size: 15px;
          line-height: 1.7;
          color: var(--hw-gray);
        }

        /* ── USE CASES ── */
        .roadapp-page .use-cases-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; margin-top: 40px; }
        .roadapp-page .use-case-card { padding: 32px; border: 3px solid var(--hw-border-strong); background: var(--hw-bg-surface); position: relative; overflow: hidden; border-radius: 0; }
        .roadapp-page .use-case-card::before { content: ''; position: absolute; top: 0; left: 0; width: 6px; height: 100%; }
        .roadapp-page .use-case-card:nth-child(1)::before { background: var(--hw-crimson); }
        .roadapp-page .use-case-card:nth-child(2)::before { background: var(--hw-blue); }
        .roadapp-page .use-case-card:nth-child(3)::before { background: var(--hw-purple); }
        .roadapp-page .use-case-card:nth-child(4)::before { background: var(--hw-rose); }
        .roadapp-page .use-case-card h3 { font-family: var(--hw-font-display); font-size: 22px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; padding-left: 12px; }
        .roadapp-page .use-case-card p { font-size: 15px; line-height: 1.7; color: var(--hw-text-secondary); padding-left: 12px; }

        /* ── PRICING BANNER ── */
        .roadapp-page .pricing-banner {
          text-align: center;
          padding: 60px 0;
        }
        .roadapp-page .pricing-banner .free-price {
          font-family: var(--hw-font-display);
          font-size: 80px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--hw-green);
          margin-bottom: 8px;
        }
        .roadapp-page .pricing-banner .free-sub {
          font-family: var(--hw-font-mono);
          font-size: 11px;
          letter-spacing: 4px;
          text-transform: uppercase;
          color: var(--hw-text-muted);
          margin-bottom: 20px;
        }
        .roadapp-page .pricing-banner .free-explanation {
          font-size: 17px;
          line-height: 1.7;
          color: var(--hw-text-secondary);
          max-width: 560px;
          margin: 0 auto;
        }

        /* ── FINAL CTA ── */
        .roadapp-page .final-cta { text-align: center; padding: 100px 0; }
        .roadapp-page .final-cta .section-headline { margin: 0 auto 16px; }
        .roadapp-page .final-cta .sub-headline { margin: 0 auto 40px; text-align: center; }

        /* ── FOOTER ── */
        .roadapp-page footer { background: var(--hw-bg-invert); padding: 40px 0; text-align: center; }
        .roadapp-page footer p { font-family: var(--hw-font-mono); font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--hw-text-muted); }
        .roadapp-page footer a { color: var(--hw-crimson); text-decoration: none; }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .roadapp-page section { padding: 60px 0; }
          .roadapp-page .container { padding: 0 20px; }
          .roadapp-page .hero { padding: 60px 0; }
          .roadapp-page .features-grid, .roadapp-page .use-cases-grid { grid-template-columns: 1fr; }
          .roadapp-page .steps-grid { grid-template-columns: 1fr; }
          .roadapp-page .step-card + .step-card { border-left: 3px solid var(--hw-border-strong); border-top: none; }
          .roadapp-page .no-financials { flex-direction: column; text-align: center; }
          .roadapp-page nav .nav-links { display: none; }
          .roadapp-page .btn-row { flex-direction: column; }
          .roadapp-page .btn-row .btn { text-align: center; }
        }
      ` }} />

      {/* NAV */}
      <nav>
        <div className="nav-inner">
          <Link href="/" className="logo">HWY<span>61</span></Link>
          <ul className="nav-links">
            <li><Link href="/tourrouter">TourRouter</Link></li>
            <li><Link href="/localizer">Localizer</Link></li>
            <li><Link href="/diy">DIY</Link></li>
            <li><Link href="/roadapp" className="active">Road App</Link></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><Link href="/#waitlist" className="nav-cta">Join the Beta</Link></li>
          </ul>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-eyebrow">For Band + Crew</div>
          <h1 className="hero-headline">Today&rsquo;s show. In your pocket.<br /><span>Nothing else.</span></h1>
          <p className="sub-headline">The HWY61 Road App gives every person on the tour exactly what they need &mdash; van call, load-in, venue info, hotel, set times, travel details. No login. No cost. No financial data. Just the info that matters when you&rsquo;re on the road.</p>
          <div className="btn-row">
            <Link href="/#waitlist" className="btn btn-primary">Download Free</Link>
            <div className="free-badge">Free. Always.</div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* PROBLEM */}
      <section className="dark-bg">
        <div className="container">
          <div className="section-tag">The Problem</div>
          <h2 className="section-headline">The day sheet is a PDF in a group text<br />that nobody can find.</h2>
          <p className="problem-text">The TM sends a day sheet every morning. It&rsquo;s a PDF attachment in the group thread &mdash; <span className="problem-highlight">buried under 40 messages about where to get breakfast.</span> By soundcheck, half the band is asking &ldquo;what time is doors?&rdquo; and the bus driver is asking &ldquo;where&rsquo;s the hotel?&rdquo; and the merch person is asking &ldquo;what&rsquo;s the venue WiFi?&rdquo;</p>
          <p className="problem-text">The information exists. It&rsquo;s just never where anyone can find it when they need it.</p>
        </div>
      </section>

      <hr className="section-divider" />

      {/* SOLUTION */}
      <section>
        <div className="container">
          <div className="section-tag">One App</div>
          <h2 className="section-headline">Open the app. See today&rsquo;s show. That&rsquo;s it.</h2>
          <p className="sub-headline" style={{ maxWidth: 760 }}>The tour manager builds the tour in TourRouter. Every person on the road opens the Road App and sees exactly what they need for today &mdash; van call time, venue name and address, load-in, soundcheck, doors, showtime, curfew, hotel, drive time to the next city.</p>
          <p className="problem-text">No account required. No cost. Enter a 6-character tour code from your TM and you&rsquo;re connected to the tour. The schedule updates in real time. When the TM changes a van call, everyone sees it immediately.</p>
        </div>
      </section>

      <hr className="section-divider" />

      {/* SETUP STEPS */}
      <section className="alt-bg">
        <div className="container">
          <div className="section-tag">Setup</div>
          <h2 className="section-headline">Three steps. No account.</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <h3>TM Generates Code</h3>
              <p>The tour manager creates a 6-character tour code in TourRouter. Takes 10 seconds.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <h3>Crew Enters Code</h3>
              <p>Band and crew download the Road App and enter the code. No email. No password. No signup.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <h3>See the Tour</h3>
              <p>Everyone sees the schedule, updated in real time. When the tour ends, the code expires.</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* FEATURES */}
      <section>
        <div className="container">
          <div className="section-tag">What You See</div>
          <h2 className="section-headline">The info people on the road actually need.</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-accent" style={{ background: "var(--hw-crimson)" }} />
              <div className="feature-number">01</div>
              <h3>Today&rsquo;s Show</h3>
              <p>The home screen is today. Van call, venue, load-in, soundcheck, doors, showtime, curfew. Everything you need at a glance. Open the app, get the answer.</p>
            </div>
            <div className="feature-card">
              <div className="feature-accent" style={{ background: "var(--hw-blue)" }} />
              <div className="feature-number">02</div>
              <h3>Show Details</h3>
              <p>Tap any show for the full picture &mdash; production contacts, venue WiFi, parking instructions, venue notes, and any info the venue provided in the advance.</p>
            </div>
            <div className="feature-card">
              <div className="feature-accent" style={{ background: "var(--hw-purple)" }} />
              <div className="feature-number">03</div>
              <h3>Tour Calendar</h3>
              <p>Every date on the tour. Shows, off days, travel days. Tap any date to see the details. Always know what&rsquo;s coming.</p>
            </div>
            <div className="feature-card">
              <div className="feature-accent" style={{ background: "var(--hw-rose)" }} />
              <div className="feature-number">04</div>
              <h3>Travel Info</h3>
              <p>Drive time and distance to the next city. Hotel name, address, and confirmation number. Flight info when the leg is a fly date.</p>
            </div>
            <div className="feature-card">
              <div className="feature-accent" style={{ background: "var(--hw-green)" }} />
              <div className="feature-number">05</div>
              <h3>Role-Specific Views</h3>
              <p>FOH sees production notes and the input list link. Bus driver sees the route and parking. Merch manager sees show info plus a sales entry form. Everyone sees what&rsquo;s relevant to their job.</p>
            </div>
          </div>

          <div className="no-financials">
            <div className="nf-icon">$&#x338;</div>
            <div>
              <h3>No Financial Data. Ever.</h3>
              <p>The Road App never shows offers, guarantees, settlements, deal terms, personnel pay, or commission information. That data doesn&rsquo;t exist in the app. It&rsquo;s not hidden behind a permission &mdash; it&rsquo;s excluded at the source.</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* USE CASES */}
      <section className="alt-bg">
        <div className="container">
          <div className="section-tag">Who Uses It</div>
          <h2 className="section-headline">Everyone on the road.</h2>
          <div className="use-cases-grid">
            <div className="use-case-card">
              <h3>Band Members</h3>
              <p>See today&rsquo;s van call, venue, set time, and hotel. That&rsquo;s what you need. You&rsquo;ll never ask &ldquo;what time is load-in?&rdquo; in the group chat again.</p>
            </div>
            <div className="use-case-card">
              <h3>Crew</h3>
              <p>FOH, monitors, guitar tech, merch &mdash; everyone sees the info relevant to their role. Production notes for the engineers, venue logistics for the techs, sales forms for merch.</p>
            </div>
            <div className="use-case-card">
              <h3>Bus Driver</h3>
              <p>Route to the next city, estimated arrival time, venue parking info, hotel address. No show info, no contacts, no noise &mdash; just driving logistics.</p>
            </div>
            <div className="use-case-card">
              <h3>Tour Manager</h3>
              <p>Stop answering the same questions 10 times a day. Put everyone on the Road App and the information distributes itself.</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* PRICING */}
      <section id="pricing">
        <div className="container">
          <div className="pricing-banner">
            <div className="section-tag" style={{ marginBottom: 24 }}>Pricing</div>
            <div className="free-price">FREE</div>
            <div className="free-sub">Always. For everyone. No catch.</div>
            <p className="free-explanation">The Road App is free for every person on every tour. No trial. No upgrade required. No credit card. It&rsquo;s free because the people on the road shouldn&rsquo;t have to pay for the tool that tells them where to be.</p>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* FINAL CTA */}
      <section className="dark-bg final-cta">
        <div className="container">
          <div className="section-tag">Download</div>
          <h2 className="section-headline">Get the app. Enter the code. See the tour.</h2>
          <p className="sub-headline" style={{ color: "var(--hw-gray)" }}>Free for band and crew. No account required.</p>
          <div className="btn-row" style={{ justifyContent: "center" }}>
            <Link href="/#waitlist" className="btn btn-invert">Download for iOS</Link>
            <Link href="/#waitlist" className="btn btn-invert">Download for Android</Link>
          </div>
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
