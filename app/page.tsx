"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// TODO: Drew uploaded the v1 onboarding video. Set LANDING_VIDEO_URL
// when it's hosted (Cloudinary URL or YouTube embed URL).
// Empty string hides the video element gracefully.
const LANDING_VIDEO_URL = "";

export default function LocalizerProductPage() {
  const heroRef = useRef<HTMLElement>(null);
  const wordmarkRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const wordmark = wordmarkRef.current;
    if (!hero || !wordmark) return;

    let frameId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const rect = wordmark.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dx = centerX - e.clientX;
        const dy = centerY - e.clientY;
        const scale = 0.08;
        const maxOff = 18;
        const minOff = -8;
        const shadowX = Math.max(minOff, Math.min(maxOff, dx * scale + 6));
        const shadowY = Math.max(minOff, Math.min(maxOff, dy * scale + 6));
        wordmark.style.setProperty('--shadow-x', `${shadowX}px`);
        wordmark.style.setProperty('--shadow-y', `${shadowY}px`);
      });
    };

    const handleMouseLeave = () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      wordmark.style.setProperty('--shadow-x', '6px');
      wordmark.style.setProperty('--shadow-y', '6px');
    };

    hero.addEventListener('mousemove', handleMouseMove);
    hero.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      hero.removeEventListener('mousemove', handleMouseMove);
      hero.removeEventListener('mouseleave', handleMouseLeave);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, []);

  const [hasSession, setHasSession] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
  }, []);

  return (
    <div className="localizer-page">
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&family=Space+Mono:wght@400;700&display=swap');

        .localizer-page *, .localizer-page *::before, .localizer-page *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html { scroll-behavior: smooth; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

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
        .localizer-page .hero { padding: 100px 0 80px; text-align: center; }
        .localizer-page .hero .sub-headline { margin-left: auto; margin-right: auto; animation: fadeUp .8s ease-out .5s both; }
        .localizer-page .localizer-wordmark {
          --shadow-x: 6px;
          --shadow-y: 6px;
          animation: fadeUp .8s ease-out .1s both;
          font-family: var(--hw-font-display);
          font-size: clamp(80px, 12vw, 160px);
          letter-spacing: 6px;
          text-transform: uppercase;
          line-height: 1;
          margin-bottom: 16px;
          color: var(--hw-text);
          display: inline-block;
          border: 3px solid var(--hw-text);
          padding: 18px 36px;
          background: var(--hw-bg-warm);
          text-shadow: var(--shadow-x) var(--shadow-y) 0 var(--hw-crimson);
          box-shadow: calc(var(--shadow-x) + 2px) calc(var(--shadow-y) + 2px) 0 var(--hw-crimson);
          transition: text-shadow 0.45s cubic-bezier(0.2, 0.65, 0.3, 1), box-shadow 0.45s cubic-bezier(0.2, 0.65, 0.3, 1);
        }
        .localizer-page .hero-headline { font-family: var(--hw-font-display); font-size: clamp(48px, 6vw, 72px); letter-spacing: 3px; text-transform: uppercase; line-height: 1.05; margin-bottom: 24px; animation: fadeUp .8s ease-out .3s both; }
        .localizer-page .hero-headline span { color: var(--hw-crimson); }
        .localizer-page .btn-row { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; animation: fadeUp .8s ease-out .7s both; }

        /* ── MATH EQUATION (billboard) ── */
        .localizer-page .math-equation {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          justify-content: flex-start;
          gap: 22px;
          margin-top: 40px;
          margin-left: 10%;
        }
        .localizer-page .math-term {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .localizer-page .math-num {
          font-family: var(--hw-font-display);
          font-size: 84px;
          line-height: 0.9;
          color: var(--hw-text-invert);
        }
        .localizer-page .math-num--total {
          background: var(--hw-crimson);
          color: var(--hw-bg-invert);
          padding: 6px 20px 2px;
          box-shadow: 6px 6px 0 var(--hw-bg);
        }
        .localizer-page .math-op {
          font-family: var(--hw-font-display);
          font-size: 54px;
          line-height: 0.9;
          color: var(--hw-crimson);
        }
        .localizer-page .math-label {
          font-family: var(--hw-font-mono);
          font-size: 12px;
          letter-spacing: 3px;
          text-transform: uppercase;
          color: var(--hw-gray);
          margin-top: 12px;
        }

        /* ── PRICING ── */
        .localizer-page .pricing-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-top: 40px; }
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
          .localizer-page .localizer-wordmark {
            --shadow-x: 3px;
            --shadow-y: 3px;
            font-size: 48px;
            letter-spacing: 3px;
            padding: 12px 20px;
          }
          .localizer-page .pricing-grid { grid-template-columns: 1fr; }
          .localizer-page nav .nav-links { display: none; }
          .localizer-page .btn-row { flex-direction: column; }
          .localizer-page .btn-row .btn { text-align: center; }
          .localizer-page .math-equation { gap: 16px; }
          .localizer-page .math-equation { margin-left: 0; }
          .localizer-page .math-num { font-size: 48px; }
          .localizer-page .math-num--total { box-shadow: 4px 4px 0 var(--hw-bg); padding: 4px 14px 2px; }
          .localizer-page .math-op { font-size: 32px; }
        }
      ` }} />

      {/* NAV */}
      <nav>
        <div className="nav-inner">
          <Link href="/" className="logo">HWY<span>61</span> Labs</Link>
          <ul className="nav-links">
            <li><a href="#pricing">Pricing</a></li>
            {!hasSession && <li><Link href="/login">Sign in</Link></li>}
            <li>{hasSession ? <Link href="/dashboard" className="nav-cta nav-cta-dashboard">Dashboard</Link> : <Link href="/pricing" className="nav-cta">Start your free trial</Link>}</li>
          </ul>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" ref={heroRef}>
        <div className="container">
          <h2 className="localizer-wordmark" ref={wordmarkRef}>LOCALIZER</h2>
          <h1 className="hero-headline">One image. Every asset.<br />Every platform. <span>Every show.</span></h1>
          <p className="sub-headline">Upload one promo image and generate every show asset for every platform &mdash; Instagram, Facebook, X, poster, web &mdash; branded with your fonts, your colors, your layout. Drop in your W-9, stage plot, and FOH requirements too. Every promoter gets one link with everything they need.</p>
          <div className="btn-row">
            <Link href="/pricing" className="btn btn-primary">Start your free trial</Link>
            <a href="#pricing" className="btn btn-secondary">See Pricing</a>
          </div>
          {LANDING_VIDEO_URL && (
            <div style={{ marginTop: 40 }}>
              <video controls style={{ width: "100%" }} src={LANDING_VIDEO_URL} />
            </div>
          )}
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

          <div className="math-equation">
            <div className="math-term">
              <div className="math-num">20</div>
              <div className="math-label">Shows</div>
            </div>
            <div className="math-op">&times;</div>
            <div className="math-term">
              <div className="math-num">5</div>
              <div className="math-label">Platforms</div>
            </div>
            <div className="math-op">=</div>
            <div className="math-term">
              <div className="math-num math-num--total">100+</div>
              <div className="math-label">Assets by hand</div>
            </div>
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

      {/* PRICING */}
      <section id="pricing">
        <div className="container">
          <div className="section-tag">Pricing</div>
          <h2 className="section-headline">Tour marketing that scales.</h2>
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="plan-name">Free Trial</div>
              <div className="plan-price">$0</div>
              <div className="plan-period">14 days</div>
              <p className="plan-desc">Full access. No card required.</p>
              <Link href="/login" className="btn btn-secondary">Start Free</Link>
            </div>
            <div className="pricing-card">
              <div className="plan-name">Indie</div>
              <div className="plan-price">$19</div>
              <div className="plan-period">Per Month</div>
              <p className="plan-desc">1 artist.</p>
              <Link href="/pricing" className="btn btn-secondary">Start free trial</Link>
            </div>
            <div className="pricing-card featured">
              <div className="plan-name">Pro</div>
              <div className="plan-price">$39</div>
              <div className="plan-period">Per Month</div>
              <p className="plan-desc">Up to 5 artists.</p>
              <Link href="/pricing" className="btn btn-primary">Start free trial</Link>
            </div>
            <div className="pricing-card">
              <div className="plan-name">Agency</div>
              <div className="plan-price">$199</div>
              <div className="plan-period">Per Month</div>
              <p className="plan-desc">Up to 15 artists.</p>
              <Link href="/pricing" className="btn btn-secondary">Start free trial</Link>
            </div>
          </div>
          <p className="pricing-note">Annual billing saves ~17%. Start with a 14-day free trial &mdash; no credit card required.</p>
          <p className="pricing-note">
            Need more? We also offer <span style={{ color: "var(--hw-crimson)", fontWeight: 700 }}>Agency Pro</span> — custom pricing for roster operations beyond Agency. <a href="mailto:support@hwy61labs.com?subject=Agency Pro inquiry" style={{ color: "var(--hw-crimson)", textDecoration: "none", fontWeight: 700 }}>Contact us &rarr;</a>
          </p>
        </div>
      </section>

      <hr className="section-divider" />

      {/* FINAL CTA */}
      <section className="dark-bg final-cta">
        <div className="container">
          <div className="section-tag">Get Started</div>
          <h2 className="section-headline">Stop making show assets by hand.</h2>
          <p className="sub-headline" style={{ color: "var(--hw-gray)" }}>14 days free, no card required. Upload one image, get every asset for every show on every platform.</p>
          <Link href="/pricing" className="btn btn-invert">Start your free trial</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="container">
          <p>&copy; 2026 HWY61 LLC &nbsp;&middot;&nbsp; <Link href="/terms">Terms</Link> &nbsp;&middot;&nbsp; <Link href="/privacy">Privacy</Link> &nbsp;&middot;&nbsp; <a href="mailto:support@hwy61labs.com">support@hwy61labs.com</a></p>
        </div>
      </footer>
    </div>
  );
}
