import "../../app/animations.css";

export default function ShowcasePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap');

        .sc-page { min-height: 100vh; background: #EEEEEE; font-family: 'DM Sans', system-ui, sans-serif; }
        .sc-wrap { max-width: 700px; margin: 0 auto; padding: 0 24px; }
        .sc-section-label { font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #999; margin-bottom: 24px; }
        .sc-divider { border: none; border-top: 0.5px solid #DDDDDD; margin: 48px 0; }
        .sc-card { background: #fff; border: 1px solid #DDDDDD; border-radius: 14px; padding: 20px 24px; margin-bottom: 12px; transition: transform 0.2s ease-out, box-shadow 0.2s ease-out; }
        .sc-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.06); }
        .sc-step-circle { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Space Mono', monospace; font-size: 14px; font-weight: 700; flex-shrink: 0; }
        .sc-audience-circle { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .sc-btn { display: inline-block; background: #fff; border: 1px solid #DDDDDD; border-radius: 14px; padding: 10px 24px; font-size: 14px; font-weight: 500; font-family: 'DM Sans', sans-serif; color: #111; text-decoration: none; cursor: pointer; transition: background 0.15s; }
        .sc-btn:hover { background: #f5f5f5; }
        .sc-pill { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.02em; }
        @media (max-width: 640px) {
          .sc-steps-row { flex-direction: column !important; gap: 20px !important; }
          .sc-steps-divider { display: none !important; }
          .sc-pricing-tiles { flex-direction: column !important; }
          .sc-role-row { flex-direction: column !important; }
        }
      `}</style>

      <div className="sc-page">
        {/* ══════ HERO ══════ */}
        <section className="fade-in" style={{ padding: "80px 24px 0", textAlign: "center" }}>
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            {/* Logo placeholder — swap for HWY61Wordmark later */}
            <div style={{
              fontFamily: "'PragmaticaExtended', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(50px, 10vw, 80px)",
              letterSpacing: "-0.08em",
              textTransform: "uppercase",
              color: "#1a1a1a",
              lineHeight: 1,
              marginBottom: 32,
            }}>HWY61.AI</div>

            <h1 style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "clamp(22px, 4vw, 30px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "#111",
              margin: "0 0 16px",
              lineHeight: 1.3,
            }}>The first complete operating system for touring.</h1>

            <p style={{
              fontSize: 15,
              color: "#888",
              maxWidth: 460,
              margin: "0 auto 36px",
              lineHeight: 1.7,
            }}>Route the tour. Advance every show. Settle every night. One platform.</p>

            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#999", marginBottom: 12 }}>I am a...</div>
              <div className="sc-role-row" style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <a href="/showcase/band" className="sc-btn">Tour manager</a>
                <a href="/showcase/diy" className="sc-btn">Self-managed band</a>
                <a href="/showcase/localizer" className="sc-btn">Marketing team</a>
              </div>
            </div>
          </div>
        </section>

        <div className="sc-wrap">
          <hr className="sc-divider" />

          {/* ══════ PRODUCTS ══════ */}
          <section className="fade-in stagger-item">
            <div className="sc-section-label">Products</div>

            {/* Band */}
            <div className="sc-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>Band</span>
                  <span className="sc-pill" style={{ background: "#E1F5EE", color: "#085041" }}>from $49/mo</span>
                </div>
                <div style={{ fontSize: 14, color: "#666", lineHeight: 1.5 }}>From blank calendar to settled tour — one platform, no spreadsheets.</div>
              </div>
              <a href="/showcase/band" style={{ fontSize: 13, fontWeight: 600, color: "#111", textDecoration: "none", whiteSpace: "nowrap", marginLeft: 16 }}>Learn more &rarr;</a>
            </div>

            {/* Localizer */}
            <div className="sc-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>Localizer</span>
                  <span className="sc-pill" style={{ background: "#EEEDFE", color: "#3C3489" }}>from $39/mo</span>
                </div>
                <div style={{ fontSize: 14, color: "#666", lineHeight: 1.5 }}>Every show asset, every platform, every format — in seconds.</div>
              </div>
              <a href="/showcase/localizer" style={{ fontSize: 13, fontWeight: 600, color: "#111", textDecoration: "none", whiteSpace: "nowrap", marginLeft: 16 }}>Learn more &rarr;</a>
            </div>

            {/* DIY */}
            <div className="sc-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>DIY</span>
                  <span className="sc-pill" style={{ background: "#FAEEDA", color: "#633806" }}>$19/mo</span>
                </div>
                <div style={{ fontSize: 14, color: "#666", lineHeight: 1.5 }}>Professional tour routing without the professional price tag.</div>
              </div>
              <a href="/showcase/diy" style={{ fontSize: 13, fontWeight: 600, color: "#111", textDecoration: "none", whiteSpace: "nowrap", marginLeft: 16 }}>Learn more &rarr;</a>
            </div>

            {/* Road App */}
            <div style={{ background: "#f5f5f2", borderRadius: 14, padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>Road App</span>
                <span style={{ fontSize: 13, color: "#888" }}>Free companion app for band & crew</span>
              </div>
            </div>
          </section>

          <hr className="sc-divider" />

          {/* ══════ HOW IT WORKS ══════ */}
          <section className="fade-in stagger-item">
            <div className="sc-section-label">How It Works</div>

            <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111", letterSpacing: "-0.02em", margin: "0 0 10px" }}>Drop it in. Watch it work.</h2>
            <p style={{ fontSize: 14, color: "#888", lineHeight: 1.7, marginBottom: 36, maxWidth: 540 }}>
              Drag any touring document onto HWY61 — deal memos, settlement sheets, offer sheets, hotel confirmations. AI parses it instantly and flows the data where it needs to go.
            </p>

            <div className="sc-steps-row" style={{ display: "flex", gap: 0, justifyContent: "space-between", alignItems: "flex-start" }}>
              {/* Step 1 */}
              <div style={{ flex: 1, textAlign: "center" }}>
                <div className="sc-step-circle" style={{ background: "#EEEDFE", color: "#534AB7", margin: "0 auto 12px" }}>1</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 4 }}>Drop</div>
                <div style={{ fontSize: 13, color: "#888" }}>Any document, any format</div>
              </div>

              <div className="sc-steps-divider" style={{ width: 1, height: 60, background: "#DDDDDD", flexShrink: 0, marginTop: 8 }} />

              {/* Step 2 */}
              <div style={{ flex: 1, textAlign: "center" }}>
                <div className="sc-step-circle" style={{ background: "#E1F5EE", color: "#0F6E56", margin: "0 auto 12px" }}>2</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 4 }}>Parse</div>
                <div style={{ fontSize: 13, color: "#888" }}>AI reads and extracts every field</div>
              </div>

              <div className="sc-steps-divider" style={{ width: 1, height: 60, background: "#DDDDDD", flexShrink: 0, marginTop: 8 }} />

              {/* Step 3 */}
              <div style={{ flex: 1, textAlign: "center" }}>
                <div className="sc-step-circle" style={{ background: "#FAEEDA", color: "#854F0B", margin: "0 auto 12px" }}>3</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#111", marginBottom: 4 }}>Flow</div>
                <div style={{ fontSize: 13, color: "#888" }}>Data routes to the right place automatically</div>
              </div>
            </div>
          </section>

          <hr className="sc-divider" />

          {/* ══════ WHO IT'S FOR ══════ */}
          <section className="fade-in stagger-item">
            <div className="sc-section-label">Built For</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="sc-audience-circle" style={{ background: "#E1F5EE" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.76 3.57L13 5.31l-3 2.93.71 4.13L7 10.5l-3.71 1.87.71-4.13-3-2.93 4.24-.74L7 1z" fill="#0F6E56"/></svg>
                </div>
                <div style={{ flex: 1, fontSize: 14, color: "#111" }}>Tour managers & business managers</div>
                <a href="/showcase/band" style={{ fontSize: 13, fontWeight: 600, color: "#085041", textDecoration: "none" }}>&rarr; Band</a>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="sc-audience-circle" style={{ background: "#FAEEDA" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="#854F0B" strokeWidth="2" fill="none"/></svg>
                </div>
                <div style={{ flex: 1, fontSize: 14, color: "#111" }}>Self-managed bands doing it themselves</div>
                <a href="/showcase/diy" style={{ fontSize: 13, fontWeight: 600, color: "#633806", textDecoration: "none" }}>&rarr; DIY</a>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="sc-audience-circle" style={{ background: "#EEEDFE" }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="10" height="10" rx="2" stroke="#534AB7" strokeWidth="2" fill="none"/></svg>
                </div>
                <div style={{ flex: 1, fontSize: 14, color: "#111" }}>Marketing teams & label marketers</div>
                <a href="/showcase/localizer" style={{ fontSize: 13, fontWeight: 600, color: "#3C3489", textDecoration: "none" }}>&rarr; Localizer</a>
              </div>
            </div>
          </section>

          <hr className="sc-divider" />

          {/* ══════ PRICING ══════ */}
          <section className="fade-in stagger-item">
            <div className="sc-section-label">Pricing</div>

            {/* Featured suite card */}
            <div style={{ background: "#fff", border: "2px solid #111", borderRadius: 14, padding: "20px 24px", marginBottom: 16, position: "relative" }}>
              <div style={{ position: "absolute", top: -10, left: 24 }}>
                <span style={{ background: "#111", color: "#fff", padding: "3px 12px", borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>Best value</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#111", marginBottom: 4 }}>The full HWY61 suite</div>
                  <div style={{ fontSize: 14, color: "#888" }}>Everything. One subscription. One bill.</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Space Mono', monospace", color: "#111" }}>$249<span style={{ fontSize: 14, fontWeight: 400, color: "#888" }}>/mo</span></div>
              </div>
            </div>

            {/* Product tiles */}
            <div className="sc-pricing-tiles" style={{ display: "flex", gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 4 }}>Band</div>
                <div style={{ fontSize: 13, fontFamily: "'Space Mono', monospace", color: "#085041" }}>from $49/mo</div>
              </div>
              <div style={{ flex: 1, background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 4 }}>Localizer</div>
                <div style={{ fontSize: 13, fontFamily: "'Space Mono', monospace", color: "#3C3489" }}>from $39/mo</div>
              </div>
              <div style={{ flex: 1, background: "#fff", border: "1px solid #DDDDDD", borderRadius: 14, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#111", marginBottom: 4 }}>DIY</div>
                <div style={{ fontSize: 13, fontFamily: "'Space Mono', monospace", color: "#633806" }}>$19/mo</div>
              </div>
            </div>

            <div style={{ fontSize: 13, color: "#888", textAlign: "center", lineHeight: 1.7 }}>
              Combo discounts available &middot; 7-day free trial on everything &middot; <a href="/showcase/pricing" style={{ color: "#111", fontWeight: 600, textDecoration: "none" }}>See full pricing &rarr;</a>
            </div>
          </section>

          <hr className="sc-divider" />

          {/* ══════ FOOTER ══════ */}
          <footer className="fade-in stagger-item" style={{ textAlign: "center", paddingBottom: 60 }}>
            <div style={{
              fontFamily: "'PragmaticaExtended', sans-serif",
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: "-0.08em",
              textTransform: "uppercase",
              color: "#aaa",
              marginBottom: 12,
            }}>HWY61.AI</div>
            <div style={{ fontSize: 12, color: "#aaa" }}>
              <a href="/terms" style={{ color: "#aaa", textDecoration: "none" }}>Terms of Service</a>
              {" \u00b7 "}
              <a href="/privacy" style={{ color: "#aaa", textDecoration: "none" }}>Privacy Policy</a>
              {" \u00b7 "}
              <a href="mailto:support@hwy61.ai" style={{ color: "#aaa", textDecoration: "none" }}>support@hwy61.ai</a>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
