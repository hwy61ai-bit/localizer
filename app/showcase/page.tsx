import "../../app/animations.css";

export default function ShowcasePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap');

        .sc-page { min-height: 100vh; background: #111111; color: #f0ede8; font-family: 'DM Sans', system-ui, sans-serif; }
        .sc-wrap { max-width: 720px; margin: 0 auto; padding: 0 24px; }
        .sc-label { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: #C8A84E; margin-bottom: 24px; }
        .sc-divider { border: none; border-top: 0.5px solid #2a2a2a; margin: 0 16px; }
        .sc-card { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 14px; padding: 20px 24px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
        .sc-pill { display: inline-block; background: rgba(200,168,78,0.15); color: #C8A84E; padding: 3px 10px; border-radius: 14px; font-size: 11px; font-weight: 500; }
        .sc-step-circle { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(200,168,78,0.15); color: #C8A84E; font-family: 'DM Mono', monospace; font-size: 14px; font-weight: 700; flex-shrink: 0; margin: 0 auto 12px; }
        .sc-audience-circle { width: 40px; height: 40px; border-radius: 50%; background: #1a1a1a; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .sc-role-btn { display: inline-block; background: transparent; border: 1px solid #333; color: #f0ede8; border-radius: 14px; padding: 12px 24px; font-size: 14px; font-weight: 500; font-family: 'DM Sans', sans-serif; text-decoration: none; cursor: pointer; transition: background 0.15s, border-color 0.15s; }
        .sc-role-btn:hover { background: #1a1a1a; border-color: #C8A84E; }
        .sc-link { color: rgba(240,237,232,0.5); text-decoration: none; font-size: 13px; white-space: nowrap; margin-left: 16px; transition: color 0.15s; }
        .sc-link:hover { color: #C8A84E; }
        @media (max-width: 600px) {
          .sc-role-row { flex-direction: column !important; align-items: center !important; }
          .sc-steps-row { flex-direction: column !important; gap: 24px !important; }
          .sc-steps-divider { display: none !important; }
          .sc-pricing-tiles { flex-direction: column !important; }
        }
      `}</style>

      <div className="sc-page">
        {/* ══════ HERO ══════ */}
        <section className="fade-in" style={{ padding: "4rem 24px 3rem", textAlign: "center" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            {/* TODO: Replace with <HWY61Wordmark /> once animation is finalized */}
            <div style={{
              fontFamily: "'PragmaticaExtended', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(48px, 10vw, 80px)",
              letterSpacing: "-0.08em",
              textTransform: "uppercase",
              color: "#f0ede8",
              lineHeight: 1,
              marginBottom: 36,
            }}>HWY61.AI</div>

            <h1 style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "clamp(24px, 4vw, 32px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#f0ede8",
              margin: "0 0 16px",
              lineHeight: 1.3,
            }}>The first complete operating system for touring.</h1>

            <p style={{
              fontSize: 16,
              fontWeight: 400,
              color: "rgba(240,237,232,0.5)",
              maxWidth: 460,
              margin: "0 auto 40px",
              lineHeight: 1.7,
            }}>Route the tour. Advance every show. Settle every night. One platform.</p>

            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(240,237,232,0.5)", marginBottom: 14 }}>I am a...</div>
              <div className="sc-role-row" style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <a href="/showcase/band" className="sc-role-btn">Tour manager</a>
                <a href="/showcase/diy" className="sc-role-btn">Self-managed band</a>
                <a href="/showcase/localizer" className="sc-role-btn">Marketing team</a>
              </div>
            </div>
          </div>
        </section>

        <div className="sc-wrap">
          <hr className="sc-divider" style={{ margin: "0 0 3rem" }} />

          {/* ══════ PRODUCTS ══════ */}
          <section className="fade-in" style={{ marginBottom: "3rem" }}>
            <div className="sc-label">Products</div>

            {/* Band */}
            <div className="sc-card">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#f0ede8" }}>Band</span>
                  <span className="sc-pill">from $49/mo</span>
                </div>
                <div style={{ fontSize: 14, color: "rgba(240,237,232,0.5)", lineHeight: 1.5 }}>From blank calendar to settled tour — one platform, no spreadsheets.</div>
              </div>
              <a href="/showcase/band" className="sc-link">Learn more &rarr;</a>
            </div>

            {/* Localizer */}
            <div className="sc-card">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#f0ede8" }}>Localizer</span>
                  <span className="sc-pill">from $39/mo</span>
                </div>
                <div style={{ fontSize: 14, color: "rgba(240,237,232,0.5)", lineHeight: 1.5 }}>Every show asset, every platform, every format — in seconds.</div>
              </div>
              <a href="/showcase/localizer" className="sc-link">Learn more &rarr;</a>
            </div>

            {/* DIY */}
            <div className="sc-card">
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#f0ede8" }}>DIY</span>
                  <span className="sc-pill">$19/mo</span>
                </div>
                <div style={{ fontSize: 14, color: "rgba(240,237,232,0.5)", lineHeight: 1.5 }}>Professional tour routing without the professional price tag.</div>
              </div>
              <a href="/showcase/diy" className="sc-link">Learn more &rarr;</a>
            </div>

            {/* Road App */}
            <div style={{ background: "#161616", borderRadius: 14, padding: "14px 24px", display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#f0ede8" }}>Road App</span>
              <span style={{ fontSize: 13, color: "rgba(240,237,232,0.5)" }}>Free companion app for band &amp; crew</span>
            </div>
          </section>

          <hr className="sc-divider" style={{ margin: "0 0 3rem" }} />

          {/* ══════ HOW IT WORKS ══════ */}
          <section className="fade-in" style={{ marginBottom: "3rem" }}>
            <div className="sc-label">How It Works</div>

            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#f0ede8", letterSpacing: "-0.02em", margin: "0 0 12px" }}>Drop it in. Watch it work.</h2>
            <p style={{ fontSize: 15, color: "rgba(240,237,232,0.5)", lineHeight: 1.7, marginBottom: 40, maxWidth: 560 }}>
              Drag any touring document onto HWY61 — deal memos, settlement sheets, offer sheets, hotel confirmations. AI parses it instantly and flows the data where it needs to go.
            </p>

            <div className="sc-steps-row" style={{ display: "flex", gap: 0, justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div className="sc-step-circle">1</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#f0ede8", marginBottom: 4 }}>Drop</div>
                <div style={{ fontSize: 12, color: "rgba(240,237,232,0.5)" }}>Any document, any format</div>
              </div>

              <div className="sc-steps-divider" style={{ width: 1, height: 60, background: "#2a2a2a", flexShrink: 0, marginTop: 10 }} />

              <div style={{ flex: 1, textAlign: "center" }}>
                <div className="sc-step-circle">2</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#f0ede8", marginBottom: 4 }}>Parse</div>
                <div style={{ fontSize: 12, color: "rgba(240,237,232,0.5)" }}>AI reads and extracts every field</div>
              </div>

              <div className="sc-steps-divider" style={{ width: 1, height: 60, background: "#2a2a2a", flexShrink: 0, marginTop: 10 }} />

              <div style={{ flex: 1, textAlign: "center" }}>
                <div className="sc-step-circle">3</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#f0ede8", marginBottom: 4 }}>Flow</div>
                <div style={{ fontSize: 12, color: "rgba(240,237,232,0.5)" }}>Data routes to the right place automatically</div>
              </div>
            </div>
          </section>

          <hr className="sc-divider" style={{ margin: "0 0 3rem" }} />

          {/* ══════ BUILT FOR ══════ */}
          <section className="fade-in" style={{ marginBottom: "3rem" }}>
            <div className="sc-label">Built For</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="sc-audience-circle">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l2 4.07L14.5 6.3l-3.25 3.17.77 4.47L8 11.8l-4.02 2.14.77-4.47L1.5 6.3l4.5-.73L8 1.5z" fill="#C8A84E"/></svg>
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "#f0ede8" }}>Tour managers &amp; business managers</div>
                <a href="/showcase/band" style={{ fontSize: 13, color: "rgba(240,237,232,0.5)", textDecoration: "none" }}>&rarr; Band</a>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="sc-audience-circle">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5" stroke="#C8A84E" strokeWidth="2" fill="none"/></svg>
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "#f0ede8" }}>Self-managed bands doing it themselves</div>
                <a href="/showcase/diy" style={{ fontSize: 13, color: "rgba(240,237,232,0.5)", textDecoration: "none" }}>&rarr; DIY</a>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="sc-audience-circle">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="3" width="10" height="10" rx="2" stroke="#C8A84E" strokeWidth="2" fill="none"/></svg>
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "#f0ede8" }}>Marketing teams &amp; label marketers</div>
                <a href="/showcase/localizer" style={{ fontSize: 13, color: "rgba(240,237,232,0.5)", textDecoration: "none" }}>&rarr; Localizer</a>
              </div>
            </div>
          </section>

          <hr className="sc-divider" style={{ margin: "0 0 3rem" }} />

          {/* ══════ PRICING ══════ */}
          <section className="fade-in" style={{ marginBottom: "3rem" }}>
            <div className="sc-label">Pricing</div>

            {/* Featured suite card */}
            <div style={{ background: "#1a1a1a", border: "2px solid #C8A84E", borderRadius: 14, padding: "20px 24px", marginBottom: 16, position: "relative" }}>
              <div style={{ position: "absolute", top: -10, left: 24 }}>
                <span className="sc-pill" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>Best value</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#f0ede8", marginBottom: 4 }}>The full HWY61 suite</div>
                  <div style={{ fontSize: 13, color: "rgba(240,237,232,0.5)" }}>Everything. One subscription. One bill.</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: "#f0ede8" }}>$249<span style={{ fontSize: 13, fontWeight: 400, color: "rgba(240,237,232,0.5)" }}>/mo</span></div>
              </div>
            </div>

            {/* Product tiles */}
            <div className="sc-pricing-tiles" style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <div style={{ flex: 1, background: "#1a1a1a", borderRadius: 14, padding: 14, textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#f0ede8", marginBottom: 4 }}>Band</div>
                <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: "rgba(240,237,232,0.5)" }}>from $49/mo</div>
              </div>
              <div style={{ flex: 1, background: "#1a1a1a", borderRadius: 14, padding: 14, textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#f0ede8", marginBottom: 4 }}>Localizer</div>
                <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: "rgba(240,237,232,0.5)" }}>from $39/mo</div>
              </div>
              <div style={{ flex: 1, background: "#1a1a1a", borderRadius: 14, padding: 14, textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#f0ede8", marginBottom: 4 }}>DIY</div>
                <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: "rgba(240,237,232,0.5)" }}>$19/mo</div>
              </div>
            </div>

            <div style={{ fontSize: 13, color: "rgba(240,237,232,0.5)", textAlign: "center", lineHeight: 1.7 }}>
              Combo discounts available &middot; 7-day free trial on everything &middot; <a href="/showcase/pricing" style={{ color: "#C8A84E", fontWeight: 500, textDecoration: "none" }}>See full pricing &rarr;</a>
            </div>
          </section>

          <hr className="sc-divider" style={{ margin: "0 0 2rem" }} />

          {/* ══════ FOOTER ══════ */}
          <footer className="fade-in" style={{ textAlign: "center", padding: "0 0 60px" }}>
            <div style={{
              fontFamily: "'PragmaticaExtended', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: "-0.08em",
              textTransform: "uppercase",
              color: "rgba(240,237,232,0.35)",
              marginBottom: 10,
            }}>HWY61.AI</div>
            <div style={{ fontSize: 12, color: "rgba(240,237,232,0.25)" }}>
              <a href="/terms" style={{ color: "rgba(240,237,232,0.25)", textDecoration: "none" }}>Terms of Service</a>
              {" \u00b7 "}
              <a href="/privacy" style={{ color: "rgba(240,237,232,0.25)", textDecoration: "none" }}>Privacy Policy</a>
              {" \u00b7 "}
              <a href="mailto:support@hwy61.ai" style={{ color: "rgba(240,237,232,0.25)", textDecoration: "none" }}>support@hwy61.ai</a>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
