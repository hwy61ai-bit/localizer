"use client";

import Link from "next/link";

export default function LocalizerProductPage() {
  return (
    <div className="localizer-page">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=Space+Mono:wght@400;700&display=swap');

        .localizer-page *, .localizer-page *::before, .localizer-page *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .localizer-page {
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
        .localizer-page nav { background: var(--hw-bg-invert); padding: 16px 0; position: sticky; top: 0; z-index: 1000; }
        .localizer-page .nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 32px; display: flex; align-items: center; justify-content: space-between; }
        .localizer-page .logo { font-family: var(--hw-font-display); font-size: 28px; letter-spacing: 3px; color: var(--hw-text-invert); text-decoration: none; }
        .localizer-page .logo span { color: var(--hw-crimson); }
        .localizer-page .nav-links { display: flex; gap: 28px; align-items: center; list-style: none; }
        .localizer-page .nav-links a { font-family: var(--hw-font-mono); font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--hw-gray); text-decoration: none; transition: color 0.15s ease; }
        .localizer-page .nav-links a:hover { color: var(--hw-text-invert); }
        .localizer-page .nav-links a.active { color: var(--hw-crimson); }
        .localizer-page .nav-cta { font-family: var(--hw-font-display); font-size: 14px; letter-spacing: 3px; text-transform: uppercase; background: var(--hw-crimson); color: white; padding: 10px 24px; border: 3px solid var(--hw-crimson); border-radius: 0; text-decoration: none; transition: all 0.15s ease; }
        .localizer-page .nav-cta:hover { background: var(--hw-crimson-dark); transform: translateY(-2px); box-shadow: var(--hw-shadow-md); }

        /* ── LAYOUT ── */
        .localizer-page .container { max-width: 1200px; margin: 0 auto; padding: 0 32px; }
        .localizer-page section { padding: 80px 0; }
        .localizer-page section.alt-bg { background: var(--hw-bg-warm); }
        .localizer-page section.dark-bg { background: var(--hw-bg-invert); color: var(--hw-text-invert); }
        .localizer-page .section-tag { font-family: var(--hw-font-mono); font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: var(--hw-blue); margin-bottom: 16px; }
        .localizer-page .dark-bg .section-tag { color: var(--hw-rose); }
        .localizer-page .section-headline { font-family: var(--hw-font-display); font-size: clamp(36px, 4vw, 52px); letter-spacing: 2px; text-transform: uppercase; line-height: 1.1; margin-bottom: 24px; }
        .localizer-page .sub-headline { font-size: 18px; line-height: 1.7; color: var(--hw-text-secondary); max-width: 680px; margin-bottom: 32px; }
        .localizer-page .dark-bg .sub-headline { color: var(--hw-gray); }
        .localizer-page .problem-text { font-size: 17px; line-height: 1.8; color: var(--hw-text-secondary); max-width: 760px; margin-bottom: 20px; }
        .localizer-page .problem-text:last-of-type { margin-bottom: 0; }
        .localizer-page .dark-bg .problem-text { color: var(--hw-gray); }
        .localizer-page .problem-highlight { font-weight: 500; color: var(--hw-text); }
        .localizer-page .dark-bg .problem-highlight { color: var(--hw-text-invert); }
        .localizer-page .section-divider { border: none; border-top: 3px solid var(--hw-border-strong); margin: 0; }

        /* ── BUTTONS ── */
        .localizer-page .btn { display: inline-block; font-family: var(--hw-font-display); font-size: 16px; letter-spacing: 3px; text-transform: uppercase; padding: 16px 40px; border: 3px solid; border-radius: 0; text-decoration: none; transition: all 0.15s ease; cursor: pointer; }
        .localizer-page .btn-primary { background: var(--hw-crimson); color: white; border-color: var(--hw-crimson); }
        .localizer-page .btn-primary:hover { background: var(--hw-crimson-dark); transform: translateY(-2px); box-shadow: var(--hw-shadow-md); }
        .localizer-page .btn-secondary { background: var(--hw-bg-surface); color: var(--hw-text); border-color: var(--hw-border-strong); }
        .localizer-page .btn-secondary:hover { background: var(--hw-bg-invert); color: var(--hw-text-invert); transform: translateY(-2px); box-shadow: var(--hw-shadow-md); }
        .localizer-page .btn-invert { background: var(--hw-bg-surface); color: var(--hw-bg-invert); border-color: var(--hw-bg-surface); }
        .localizer-page .btn-invert:hover { transform: translateY(-2px); box-shadow: 4px 4px 0 var(--hw-crimson); }

        /* ── HERO ── */
        .localizer-page .hero { padding: 100px 0 80px; }
        .localizer-page .hero-eyebrow { font-family: var(--hw-font-mono); font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: var(--hw-crimson); margin-bottom: 20px; display: inline-block; background: var(--hw-crimson-ghost); padding: 6px 16px; border: 2px solid var(--hw-crimson); }
        .localizer-page .hero-headline { font-family: var(--hw-font-display); font-size: clamp(48px, 6vw, 72px); letter-spacing: 3px; text-transform: uppercase; line-height: 1.05; margin-bottom: 24px; }
        .localizer-page .hero-headline span { color: var(--hw-crimson); }
        .localizer-page .btn-row { display: flex; gap: 16px; flex-wrap: wrap; }

        /* ── MATH BLOCK ── */
        .localizer-page .math-block {
          background: var(--hw-bg-surface);
          border: 3px solid var(--hw-border-strong);
          padding: 40px;
          margin-top: 40px;
          max-width: 600px;
          border-radius: 0;
        }
        .localizer-page .math-line {
          font-family: var(--hw-font-mono);
          font-size: 14px;
          letter-spacing: 1px;
          color: var(--hw-text-secondary);
          padding: 8px 0;
          border-bottom: 1px solid var(--hw-border);
          display: flex;
          justify-content: space-between;
        }
        .localizer-page .math-line:last-child { border-bottom: none; }
        .localizer-page .math-line .math-label { color: var(--hw-text-muted); }
        .localizer-page .math-line .math-value { color: var(--hw-text); font-weight: 700; }
        .localizer-page .math-line.math-total { border-top: 3px solid var(--hw-border-strong); margin-top: 8px; padding-top: 16px; }
        .localizer-page .math-line.math-total .math-value { color: var(--hw-crimson); font-size: 18px; }

        /* ── FEATURES ── */
        .localizer-page .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 24px; margin-top: 40px; }
        .localizer-page .feature-card { background: var(--hw-bg-surface); border: 3px solid var(--hw-border-strong); padding: 32px; transition: all 0.15s ease; position: relative; border-radius: 0; }
        .localizer-page .feature-card:hover { transform: translateY(-4px); box-shadow: var(--hw-shadow-md); }
        .localizer-page .feature-card .feature-accent { position: absolute; top: 0; left: 0; width: 100%; height: 4px; }
        .localizer-page .feature-card .feature-number { font-family: var(--hw-font-display); font-size: 48px; color: var(--hw-border); line-height: 1; margin-bottom: 12px; }
        .localizer-page .feature-card h3 { font-family: var(--hw-font-display); font-size: 22px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; }
        .localizer-page .feature-card p { font-size: 15px; line-height: 1.7; color: var(--hw-text-secondary); }

        /* ── USE CASES ── */
        .localizer-page .use-cases-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; margin-top: 40px; }
        .localizer-page .use-case-card { padding: 32px; border: 3px solid var(--hw-border-strong); background: var(--hw-bg-surface); position: relative; overflow: hidden; border-radius: 0; }
        .localizer-page .use-case-card::before { content: ''; position: absolute; top: 0; left: 0; width: 6px; height: 100%; }
        .localizer-page .use-case-card:nth-child(1)::before { background: var(--hw-crimson); }
        .localizer-page .use-case-card:nth-child(2)::before { background: var(--hw-blue); }
        .localizer-page .use-case-card:nth-child(3)::before { background: var(--hw-purple); }
        .localizer-page .use-case-card:nth-child(4)::before { background: var(--hw-rose); }
        .localizer-page .use-case-card h3 { font-family: var(--hw-font-display); font-size: 22px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; padding-left: 12px; }
        .localizer-page .use-case-card p { font-size: 15px; line-height: 1.7; color: var(--hw-text-secondary); padding-left: 12px; }

        /* ── TESTIMONIALS ── */
        .localizer-page .testimonial-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; margin-top: 40px; }
        .localizer-page .testimonial-card { background: var(--hw-bg-surface); border: 3px solid var(--hw-border-strong); padding: 32px; border-radius: 0; }
        .localizer-page .testimonial-card .quote-mark { font-family: var(--hw-font-display); font-size: 72px; color: var(--hw-border); line-height: 1; margin-bottom: -12px; }
        .localizer-page .testimonial-card .quote-text { font-size: 16px; line-height: 1.7; font-style: italic; color: var(--hw-text-secondary); margin-bottom: 16px; }
        .localizer-page .testimonial-card .quote-author { font-family: var(--hw-font-mono); font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--hw-text-muted); }

        /* ── PRICING ── */
        .localizer-page .pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-top: 40px; }
        .localizer-page .pricing-card { background: var(--hw-bg-surface); border: 3px solid var(--hw-border-strong); padding: 40px 32px; text-align: center; transition: all 0.15s ease; border-radius: 0; }
        .localizer-page .pricing-card.featured { border-color: var(--hw-crimson); transform: translateY(-8px); box-shadow: var(--hw-shadow-accent); }
        .localizer-page .pricing-card .plan-name { font-family: var(--hw-font-mono); font-size: 11px; letter-spacing: 4px; text-transform: uppercase; color: var(--hw-blue); margin-bottom: 8px; }
        .localizer-page .pricing-card.featured .plan-name { color: var(--hw-crimson); }
        .localizer-page .pricing-card .plan-price { font-family: var(--hw-font-display); font-size: 52px; letter-spacing: 1px; line-height: 1; margin-bottom: 4px; }
        .localizer-page .pricing-card .plan-period { font-family: var(--hw-font-mono); font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--hw-text-muted); margin-bottom: 20px; }
        .localizer-page .pricing-card .plan-desc { font-size: 14px; color: var(--hw-text-secondary); margin-bottom: 24px; line-height: 1.6; }
        .localizer-page .pricing-card .btn { width: 100%; text-align: center; }
        .localizer-page .pricing-note { margin-top: 32px; text-align: center; font-size: 14px; color: var(--hw-text-muted); }

        /* ── FINAL CTA ── */
        .localizer-page .final-cta { text-align: center; padding: 100px 0; }
        .localizer-page .final-cta .section-headline { margin: 0 auto 16px; }
        .localizer-page .final-cta .sub-headline { margin: 0 auto 40px; text-align: center; }

        /* ── FOOTER ── */
        .localizer-page footer { background: var(--hw-bg-invert); padding: 40px 0; text-align: center; }
        .localizer-page footer p { font-family: var(--hw-font-mono); font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--hw-text-muted); }
        .localizer-page footer a { color: var(--hw-crimson); text-decoration: none; }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          .localizer-page section { padding: 60px 0; }
          .localizer-page .container { padding: 0 20px; }
          .localizer-page .hero { padding: 60px 0; }
          .localizer-page .features-grid, .localizer-page .use-cases-grid, .localizer-page .pricing-grid, .localizer-page .testimonial-grid { grid-template-columns: 1fr; }
          .localizer-page nav .nav-links { display: none; }
          .localizer-page .btn-row { flex-direction: column; }
          .localizer-page .btn-row .btn { text-align: center; }
        }
      ` }} />

      {/* NAV */}
      <nav>
        <div className="nav-inner">
          <Link href="/" className="logo">HWY<span>61</span></Link>
          <ul className="nav-links">
            <li><Link href="/tourrouter">TourRouter</Link></li>
            <li><Link href="/localizer" className="active">Localizer</Link></li>
            <li><Link href="/diy">DIY</Link></li>
            <li><Link href="/roadapp">Road App</Link></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><Link href="/#waitlist" className="nav-cta">Join the Beta</Link></li>
          </ul>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="container">
          <div className="hero-eyebrow">Tour Marketing</div>
          <h1 className="hero-headline">One image. Every asset.<br />Every platform. <span>Every show.</span></h1>
          <p className="sub-headline">Localizer is tour marketing automation. Upload one promo image and generate every show asset for every platform &mdash; Instagram, Facebook, X, poster, web &mdash; branded with your fonts, your colors, your layout. Then send the whole tour to every promoter in one link.</p>
          <div className="btn-row">
            <Link href="/#waitlist" className="btn btn-primary">Start Free During Beta</Link>
            <a href="#pricing" className="btn btn-secondary">See Pricing</a>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* PROBLEM */}
      <section className="dark-bg">
        <div className="container">
          <div className="section-tag">The Problem</div>
          <h2 className="section-headline">Tour marketing is a production bottleneck<br />disguised as a creative task.</h2>
          <p className="problem-text">An artist announces a 20-date tour. That means 20 Instagram stories, 20 Facebook event images, 20 X posts, 20 posters for the venues, 20 web graphics. Each platform has different dimensions. Each venue has a different logo to include. Each promoter needs files in a different format.</p>
          <p className="problem-text">So someone on the team opens Photoshop or Canva and starts duplicating files. Changing dates. Changing city names. Changing venue names. Resizing for every platform. Exporting. Uploading. <span className="problem-highlight">Emailing individual files to individual promoters who email back asking for a different size.</span></p>

          <div className="math-block">
            <div className="math-line"><span className="math-label">Shows</span><span className="math-value">20</span></div>
            <div className="math-line"><span className="math-label">&times; Platforms</span><span className="math-value">5</span></div>
            <div className="math-line math-total"><span className="math-label">Assets created by hand</span><span className="math-value">100+</span></div>
          </div>

          <p className="problem-text" style={{ marginTop: 28 }}>And then three more shows get added, and you do it again.</p>
        </div>
      </section>

      <hr className="section-divider" />

      {/* SOLUTION */}
      <section>
        <div className="container">
          <div className="section-tag">One Upload</div>
          <h2 className="section-headline">Upload once.<br />Localizer builds everything.</h2>
          <p className="sub-headline" style={{ maxWidth: 760 }}>Upload your promo image. Set your fonts, colors, and layout. Localizer generates every asset for every show on every platform &mdash; automatically. Change a date? The asset updates. Add a show? New assets appear. Need a new format? Add the platform and every show gets it.</p>
          <p className="problem-text">Send the entire tour&rsquo;s assets to every promoter with one shareable link. They download exactly what they need. No email chains. No file requests. No wrong sizes.</p>
        </div>
      </section>

      <hr className="section-divider" />

      {/* FEATURES */}
      <section className="alt-bg">
        <div className="container">
          <div className="section-tag">What It Does</div>
          <h2 className="section-headline">Upload. Generate. Distribute.</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-accent" style={{ background: "var(--hw-crimson)" }} />
              <div className="feature-number">01</div>
              <h3>Automatic Asset Generation</h3>
              <p>One promo image becomes a complete set of show assets. Instagram Story (1080&times;1920), Facebook Event (1920&times;1005), X/Twitter Post (1200&times;675), Poster (11&times;17), Web Graphic (1200&times;630) &mdash; every format, every show, every time. Add a custom format and it generates retroactively across all shows.</p>
            </div>
            <div className="feature-card">
              <div className="feature-accent" style={{ background: "var(--hw-blue)" }} />
              <div className="feature-number">02</div>
              <h3>Brand Control</h3>
              <p>Upload your fonts. Set your colors. Choose your layout. Every asset is on-brand without manual design work. Consistent across every show, every platform, every market.</p>
            </div>
            <div className="feature-card">
              <div className="feature-accent" style={{ background: "var(--hw-purple)" }} />
              <div className="feature-number">03</div>
              <h3>Promoter Distribution</h3>
              <p>Generate a single shareable link for each tour. Promoters click the link and see every asset for their show, pre-sized for every platform. They download what they need. No back-and-forth. No &ldquo;can you send me the Instagram version?&rdquo;</p>
            </div>
            <div className="feature-card">
              <div className="feature-accent" style={{ background: "var(--hw-rose)" }} />
              <div className="feature-number">04</div>
              <h3>Venue-Branded Assets</h3>
              <p>Promoters and venues can use Localizer from their side too &mdash; pull artist promo images and generate venue-branded versions for their own marketing. Same automation, their branding.</p>
            </div>
            <div className="feature-card">
              <div className="feature-accent" style={{ background: "var(--hw-green)" }} />
              <div className="feature-number">05</div>
              <h3>Real-Time Updates</h3>
              <p>Change a date, add a show, swap the promo image &mdash; every asset across every platform updates automatically. No re-exporting. No re-sending.</p>
            </div>
            <div className="feature-card">
              <div className="feature-accent" style={{ background: "var(--hw-amber)" }} />
              <div className="feature-number">06</div>
              <h3>Multi-Artist Support</h3>
              <p>Agencies and management companies with multiple acts manage all their tour marketing from one dashboard. Each artist has their own brand settings. Assets generate per-artist across all tours.</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* USE CASES */}
      <section>
        <div className="container">
          <div className="section-tag">Who Uses It</div>
          <h2 className="section-headline">Built for every side of the show.</h2>
          <div className="use-cases-grid">
            <div className="use-case-card">
              <h3>Manager / Marketing</h3>
              <p>Stop spending hours in Canva duplicating files for every show. Upload the promo image, set the brand, and let every asset generate itself. Send one link to every promoter. Time saved per tour: dozens of hours.</p>
            </div>
            <div className="use-case-card">
              <h3>Booking Agent</h3>
              <p>When your act confirms a run, send the promoters a Localizer link immediately. Every asset is ready before the announcement. The promoter has everything they need to market the show from day one.</p>
            </div>
            <div className="use-case-card">
              <h3>Promoter / Venue</h3>
              <p>Get the artist&rsquo;s promo image in every format you need &mdash; or generate your own venue-branded versions. No more emailing the management company for the right file size.</p>
            </div>
            <div className="use-case-card">
              <h3>Self-Managed Artist</h3>
              <p>You don&rsquo;t have a marketing team. Localizer is your marketing team. Upload your image and every show asset for every platform is done. Focus on the music.</p>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* TESTIMONIALS */}
      <section className="alt-bg">
        <div className="container">
          <div className="section-tag">From the Road</div>
          <h2 className="section-headline">What they&rsquo;re saying.</h2>
          <div className="testimonial-grid">
            <div className="testimonial-card">
              <div className="quote-mark">&ldquo;</div>
              <p className="quote-text">Beta user quote &mdash; manager or marketing person perspective. How Localizer changed their tour announcement workflow.</p>
              <div className="quote-author">&mdash; Name, Manager</div>
            </div>
            <div className="testimonial-card">
              <div className="quote-mark">&ldquo;</div>
              <p className="quote-text">Beta user quote &mdash; promoter perspective. What it&rsquo;s like receiving assets via Localizer instead of email chains.</p>
              <div className="quote-author">&mdash; Name, Promoter</div>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* PRICING */}
      <section id="pricing">
        <div className="container">
          <div className="section-tag">Pricing</div>
          <h2 className="section-headline">Tour marketing that scales.</h2>
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="plan-name">Basic</div>
              <div className="plan-price">$39</div>
              <div className="plan-period">Per Month</div>
              <p className="plan-desc">1 artist.<br />Core asset generation.</p>
              <Link href="/#waitlist" className="btn btn-secondary">Start Free</Link>
            </div>
            <div className="pricing-card featured">
              <div className="plan-name">Pro</div>
              <div className="plan-price">$69</div>
              <div className="plan-period">Per Month</div>
              <p className="plan-desc">3 artists. Custom formats.<br />Priority rendering.</p>
              <Link href="/#waitlist" className="btn btn-primary">Start Free</Link>
            </div>
            <div className="pricing-card">
              <div className="plan-name">Agency</div>
              <div className="plan-price">$139</div>
              <div className="plan-period">Per Month</div>
              <p className="plan-desc">Unlimited artists.<br />Team members. Full feature set.</p>
              <Link href="/#waitlist" className="btn btn-secondary">Start Free</Link>
            </div>
          </div>
          <p className="pricing-note">Annual billing saves 20%. Free during beta &mdash; no credit card required.</p>
        </div>
      </section>

      <hr className="section-divider" />

      {/* FINAL CTA */}
      <section className="dark-bg final-cta">
        <div className="container">
          <div className="section-tag">Get Started</div>
          <h2 className="section-headline">Stop making show assets by hand.</h2>
          <p className="sub-headline" style={{ color: "var(--hw-gray)" }}>Free during beta. Upload one image. Get every asset for every show on every platform.</p>
          <Link href="/#waitlist" className="btn btn-invert">Get Early Access</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="container">
          <p>&copy; 2026 HWY61 Labs &nbsp;&middot;&nbsp; <Link href="/terms">Terms</Link> &nbsp;&middot;&nbsp; <Link href="/privacy">Privacy</Link> &nbsp;&middot;&nbsp; <a href="mailto:hello@hwy61labs.com">Contact</a></p>
        </div>
      </footer>
    </div>
  );
}
