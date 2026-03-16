import "./landing.css";

export default function LandingPage() {
  return (
    <>
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
