"use client";

export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');

        @font-face {
          font-family: 'PragmaticaExtended';
          src: url('/fonts/Pragmatica_Extended-Extra-Bold.woff2') format('woff2');
          font-weight: 900;
          font-display: swap;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body {
          font-family: -apple-system, 'Helvetica Neue', sans-serif;
          background: #0a0a0a;
          color: #f0ede8;
          -webkit-font-smoothing: antialiased;
        }

        /* ── NAV ── */
        .nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 48px;
          background: rgba(10,10,10,0.85);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(240,237,232,0.06);
        }
        .nav-logo {
          font-family: 'PragmaticaExtended', sans-serif;
          font-weight: 900;
          font-size: 13px;
          letter-spacing: -0.02em;
          color: #f0ede8;
          text-decoration: none;
          text-transform: uppercase;
          opacity: 0.5;
        }
        .nav-links { display: flex; align-items: center; gap: 28px; }
        .nav-link {
          font-size: 12px;
          font-weight: 500;
          color: #f0ede8;
          text-decoration: none;
          opacity: 0.4;
          letter-spacing: 0.03em;
          transition: opacity 0.15s;
        }
        .nav-link:hover { opacity: 1; }
        .nav-signin {
          font-size: 12px;
          font-weight: 700;
          color: #f0ede8;
          text-decoration: none;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          border: 1px solid rgba(240,237,232,0.2);
          padding: 8px 18px;
          border-radius: 5px;
          transition: border-color 0.15s, opacity 0.15s;
          opacity: 0.8;
        }
        .nav-signin:hover { opacity: 1; border-color: rgba(240,237,232,0.6); }

        /* ── HERO ── */
        .hero {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 140px 48px 80px;
          background: #0a0a0a;
        }
        .hero-wordmark {
          font-family: 'PragmaticaExtended', sans-serif;
          font-weight: 900;
          font-size: clamp(64px, 11.5vw, 156px);
          letter-spacing: -0.05em;
          text-transform: uppercase;
          color: #f0ede8;
          line-height: 0.88;
          margin-bottom: 20px;
        }
        .hero-tagline {
          font-family: 'PragmaticaExtended', sans-serif;
          font-weight: 900;
          font-size: clamp(32px, 5.5vw, 72px);
          letter-spacing: -0.04em;
          text-transform: uppercase;
          color: #f0ede8;
          line-height: 0.92;
          opacity: 0.28;
          margin-bottom: 56px;
        }
        .hero-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
          flex-wrap: wrap;
          padding-top: 36px;
          border-top: 1px solid rgba(240,237,232,0.08);
        }
        .hero-sub {
          font-size: 15px;
          color: #f0ede8;
          opacity: 0.45;
          line-height: 1.7;
          max-width: 420px;
        }
        .hero-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-shrink: 0;
        }
        .btn-primary {
          padding: 13px 28px;
          border-radius: 6px;
          border: 1px solid #f0ede8;
          background: #f0ede8;
          color: #0a0a0a;
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          display: inline-block;
          transition: opacity 0.15s;
        }
        .btn-primary:hover { opacity: 0.85; }
        .btn-ghost {
          padding: 13px 28px;
          border-radius: 6px;
          border: 1px solid rgba(240,237,232,0.2);
          background: transparent;
          color: #f0ede8;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          display: inline-block;
          opacity: 0.5;
          transition: opacity 0.15s, border-color 0.15s;
        }
        .btn-ghost:hover { opacity: 1; border-color: rgba(240,237,232,0.5); }

        /* ── LIGHT ── */
        .light { background: #EEEEEE; color: #111; }

        /* ── HOW IT WORKS ── */
        .how {
          padding: 80px 48px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .section-eyebrow {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #aaa;
          margin-bottom: 36px;
        }
        .steps {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: #d4d4d4;
          border: 1px solid #d4d4d4;
          border-radius: 12px;
          overflow: hidden;
        }
        .step {
          background: #EEEEEE;
          padding: 36px 28px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .step-num {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: #ccc;
          text-transform: uppercase;
        }
        .step-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 26px;
          letter-spacing: 0.03em;
          color: #111;
          line-height: 1.05;
        }
        .step-desc {
          font-size: 14px;
          color: #666;
          line-height: 1.75;
        }

        /* ── PREVIEW ── */
        .preview-section {
          padding: 0 48px 80px;
          max-width: 1100px;
          margin: 0 auto;
        }
        .preview-eyebrow {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #aaa;
          margin-bottom: 20px;
        }
        .preview-card {
          background: #0f0f0f;
          border-radius: 12px;
          border: 1px solid #1a1a1a;
          overflow: hidden;
        }
        .preview-header {
          padding: 28px 32px;
          border-bottom: 1px solid #1a1a1a;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
        }
        .preview-band {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(32px, 5vw, 58px);
          letter-spacing: 0.02em;
          color: #f0ede8;
          line-height: 0.95;
        }
        .preview-meta { display: flex; gap: 24px; flex-wrap: wrap; }
        .preview-meta-item { display: flex; flex-direction: column; gap: 4px; }
        .preview-meta-label {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #333;
        }
        .preview-meta-value { font-size: 13px; color: #888; }
        .preview-body { padding: 24px 32px; }
        .preview-assets-label {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #2a2a2a;
          margin-bottom: 14px;
        }
        .preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 8px;
        }
        .preview-tile {
          background: #161616;
          border: 1px solid #1e1e1e;
          border-radius: 7px;
          padding: 12px;
        }
        .preview-tile-thumb {
          width: 100%;
          aspect-ratio: 1;
          background: #111;
          border-radius: 4px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .preview-tile-name { font-size: 10px; font-weight: 600; color: #555; margin-bottom: 2px; }
        .preview-tile-dims { font-size: 9px; color: #2a2a2a; }

        /* ── CTA ── */
        .cta {
          background: #f0ede8;
          padding: 80px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 40px;
          flex-wrap: wrap;
        }
        .cta-headline {
          font-family: 'PragmaticaExtended', sans-serif;
          font-weight: 900;
          font-size: clamp(28px, 4vw, 52px);
          letter-spacing: -0.04em;
          text-transform: uppercase;
          color: #0a0a0a;
          line-height: 0.92;
          margin-bottom: 10px;
        }
        .cta-sub { font-size: 13px; color: #999; }
        .btn-dark {
          padding: 14px 32px;
          border-radius: 6px;
          background: #0a0a0a;
          color: #f0ede8;
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          display: inline-block;
          flex-shrink: 0;
          transition: opacity 0.15s;
        }
        .btn-dark:hover { opacity: 0.8; }

        /* ── FOOTER ── */
        .footer {
          background: #0a0a0a;
          border-top: 1px solid #141414;
          padding: 22px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .footer-logo {
          font-family: 'PragmaticaExtended', sans-serif;
          font-weight: 900;
          font-size: 12px;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          color: #222;
        }
        .footer-note { font-size: 11px; color: #222; }

        @media (max-width: 768px) {
          .hero { padding: 110px 24px 60px; }
          .hero-bottom { flex-direction: column; align-items: flex-start; }
          .steps { grid-template-columns: 1fr; }
          .how, .preview-section { padding-left: 24px; padding-right: 24px; }
          .nav { padding: 20px 24px; }
          .cta { padding: 60px 24px; flex-direction: column; align-items: flex-start; }
          .footer { padding: 20px 24px; }
        }
      `}</style>

      <nav className="nav">
        <a href="/" className="nav-logo">Localizer</a>
        <div className="nav-links">
          <a href="/pricing" className="nav-link">Pricing</a>
          <a href="/login" className="nav-signin">Sign in</a>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-wordmark">Localizer.</div>
        <div className="hero-tagline">Tour dates in.<br />Show graphics out.</div>
        <div className="hero-bottom">
          <p className="hero-sub">
            Import your routing sheet and Localizer generates every show graphic — sized for every platform — then sends download links to venues automatically.
          </p>
          <div className="hero-actions">
            <a href="/login" className="btn-primary">Start free trial</a>
            <a href="/pricing" className="btn-ghost">Pricing</a>
          </div>
        </div>
      </section>

      <div className="light">
        <div className="how">
          <div className="section-eyebrow">How it works</div>
          <div className="steps">
            <div className="step">
              <div className="step-num">Step 01</div>
              <div className="step-title">Import your schedule</div>
              <p className="step-desc">Paste a routing email, upload a PDF, DOCX, spreadsheet, or photo. Our AI extracts every date, venue, city, and promoter email automatically.</p>
            </div>
            <div className="step">
              <div className="step-num">Step 02</div>
              <div className="step-title">Graphics render instantly</div>
              <p className="step-desc">Show graphics in every format — Instagram, Facebook, poster, email header — sized and ready. No designer needed, no back-and-forth.</p>
            </div>
            <div className="step">
              <div className="step-num">Step 03</div>
              <div className="step-title">Venues download their assets</div>
              <p className="step-desc">Each venue gets a private link with all their show assets ready to download. One click. No Dropbox folders. No chasing anybody.</p>
            </div>
          </div>
        </div>

        <div className="preview-section">
          <div className="preview-eyebrow">What venues see</div>
          <div className="preview-card">
            <div className="preview-header">
              <div className="preview-band">Uncle Lucius</div>
              <div className="preview-meta">
                <div className="preview-meta-item">
                  <span className="preview-meta-label">Date</span>
                  <span className="preview-meta-value">Fri, May 1 2026</span>
                </div>
                <div className="preview-meta-item">
                  <span className="preview-meta-label">Venue</span>
                  <span className="preview-meta-value">The Blind Pig</span>
                </div>
                <div className="preview-meta-item">
                  <span className="preview-meta-label">Location</span>
                  <span className="preview-meta-value">Ann Arbor, MI</span>
                </div>
              </div>
            </div>
            <div className="preview-body">
              <div className="preview-assets-label">Assets</div>
              <div className="preview-grid">
                {[
                  { name: "IG Post", dims: "1080×1080" },
                  { name: "IG Stories", dims: "1080×1920" },
                  { name: "FB Cover", dims: "1920×1080" },
                  { name: "Poster", dims: '11"×17"' },
                  { name: "Twitter/X", dims: "1600×900" },
                  { name: "Email Header", dims: "600×200" },
                ].map((a) => (
                  <div className="preview-tile" key={a.name}>
                    <div className="preview-tile-thumb">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2a2a2a" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <div className="preview-tile-name">{a.name}</div>
                    <div className="preview-tile-dims">{a.dims}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="cta">
        <div>
          <div className="cta-headline">Stop sending<br />graphics manually.</div>
          <div className="cta-sub">14-day free trial · No credit card required</div>
        </div>
        <a href="/login" className="btn-dark">Get started free</a>
      </div>

      <footer className="footer">
        <span className="footer-logo">Localizer</span>
        <span className="footer-note">Tour dates in. Show graphics out.</span>
      </footer>
    </>
  );
}
