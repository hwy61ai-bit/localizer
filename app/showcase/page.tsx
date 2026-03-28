import "../animations.css";
import "./showcase.css";

export default function ShowcasePage() {
  return (
    <div className="sc">
        {/* ══════ HERO ══════ */}
        <section className="fade-in" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "120px 48px 80px", background: "#0a0a0a" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>
            {/* TODO: Replace with <HWY61Wordmark /> once animation is finalized */}
            <div style={{
              fontFamily: "'PragmaticaExtended', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(64px, 11.5vw, 156px)",
              letterSpacing: "-0.05em",
              textTransform: "uppercase",
              color: "#f0ede8",
              lineHeight: 0.88,
              marginBottom: 20,
            }}>HWY61.AI</div>

            <div style={{
              fontFamily: "'PragmaticaExtended', sans-serif",
              fontWeight: 900,
              fontSize: "clamp(28px, 5vw, 60px)",
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
              color: "#f0ede8",
              lineHeight: 0.92,
              opacity: 0.28,
              marginBottom: 56,
            }}>Route the tour.<br />Advance every show.<br />Settle every night.</div>

            <div style={{ maxWidth: 520 }}>
              <p style={{
                fontSize: 18,
                fontWeight: 400,
                color: "rgba(240,237,232,0.6)",
                lineHeight: 1.6,
                marginBottom: 40,
              }}>The first complete operating system for touring. One platform.</p>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "rgba(240,237,232,0.35)", marginBottom: 14, letterSpacing: "0.03em" }}>I am a...</div>
                <div className="sc-role-row" style={{ display: "flex", gap: 10 }}>
                  <a href="/showcase/band" className="sc-role-btn">Tour manager</a>
                  <a href="/showcase/diy" className="sc-role-btn">Self-managed band</a>
                  <a href="/showcase/localizer" className="sc-role-btn">Marketing team</a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="sc-wrap">
          <hr className="sc-divider" style={{ marginBottom: "4rem" }} />

          {/* ══════ PRODUCTS ══════ */}
          <section className="fade-in" style={{ marginBottom: "4rem" }}>
            <div className="sc-label">Products</div>

            <div className="sc-tiles-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
              {/* Band */}
              <a href="/showcase/band" className="sc-tile" style={{ textDecoration: "none", color: "inherit" }}>
                <div>
                  <div style={{ fontFamily: "'PragmaticaExtended', sans-serif", fontWeight: 900, fontSize: 28, letterSpacing: "-0.04em", textTransform: "uppercase", color: "#f0ede8", marginBottom: 12 }}>BAND</div>
                  <div style={{ fontSize: 13, color: "rgba(240,237,232,0.5)", lineHeight: 1.5, marginBottom: 14 }}>From blank calendar to settled tour — one platform, no spreadsheets.</div>
                  <div style={{ fontSize: 13, color: "#C8A84E", marginBottom: 10 }}>from $49/mo</div>
                  <div style={{ fontSize: 12, color: "rgba(240,237,232,0.3)" }}>Learn more &rarr;</div>
                </div>
              </a>

              {/* Localizer */}
              <a href="/showcase/localizer" className="sc-tile" style={{ textDecoration: "none", color: "inherit" }}>
                <div>
                  <div style={{ fontFamily: "'PragmaticaExtended', sans-serif", fontWeight: 900, fontSize: 28, letterSpacing: "-0.04em", textTransform: "uppercase", color: "#f0ede8", marginBottom: 12 }}>LOCALIZER</div>
                  <div style={{ fontSize: 13, color: "rgba(240,237,232,0.5)", lineHeight: 1.5, marginBottom: 14 }}>Every show asset, every platform, every format — in seconds.</div>
                  <div style={{ fontSize: 13, color: "#C8A84E", marginBottom: 10 }}>from $39/mo</div>
                  <div style={{ fontSize: 12, color: "rgba(240,237,232,0.3)" }}>Learn more &rarr;</div>
                </div>
              </a>

              {/* DIY */}
              <a href="/showcase/diy" className="sc-tile" style={{ textDecoration: "none", color: "inherit" }}>
                <div>
                  <div style={{ fontFamily: "'PragmaticaExtended', sans-serif", fontWeight: 900, fontSize: 28, letterSpacing: "-0.04em", textTransform: "uppercase", color: "#f0ede8", marginBottom: 12 }}>DIY</div>
                  <div style={{ fontSize: 13, color: "rgba(240,237,232,0.5)", lineHeight: 1.5, marginBottom: 14 }}>Professional tour routing without the professional price tag.</div>
                  <div style={{ fontSize: 13, color: "#C8A84E", marginBottom: 10 }}>$19/mo</div>
                  <div style={{ fontSize: 12, color: "rgba(240,237,232,0.3)" }}>Learn more &rarr;</div>
                </div>
              </a>
            </div>

            <div style={{ textAlign: "center", fontSize: 14, color: "rgba(240,237,232,0.35)" }}>
              <span style={{ fontWeight: 500, color: "rgba(240,237,232,0.5)" }}>Road App</span> — Free companion app for band &amp; crew
            </div>
          </section>

          <hr className="sc-divider" style={{ marginBottom: "4rem" }} />

          {/* ══════ HOW IT WORKS ══════ */}
          <section className="fade-in" style={{ marginBottom: "4rem" }}>
            <div className="sc-label">How It Works</div>

            <h2 style={{
              fontFamily: "'PragmaticaExtended', sans-serif",
              fontWeight: 900,
              fontSize: 24,
              letterSpacing: "-0.04em",
              textTransform: "uppercase",
              color: "#f0ede8",
              margin: "0 0 14px",
            }}>Drop it in. Watch it work.</h2>
            <p style={{ fontSize: 15, color: "rgba(240,237,232,0.5)", lineHeight: 1.7, marginBottom: 44, maxWidth: 560 }}>
              Drag any touring document onto HWY61 — deal memos, settlement sheets, offer sheets, hotel confirmations. AI parses it instantly and flows the data where it needs to go.
            </p>

            <div className="sc-steps-row" style={{ display: "flex", gap: 0, justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div className="sc-step-circle">1</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#f0ede8", marginBottom: 4 }}>Drop</div>
                <div style={{ fontSize: 12, color: "rgba(240,237,232,0.4)" }}>Any document, any format</div>
              </div>
              <div className="sc-steps-divider" style={{ width: 1, height: 60, background: "#2a2a2a", flexShrink: 0, marginTop: 10 }} />
              <div style={{ flex: 1, textAlign: "center" }}>
                <div className="sc-step-circle">2</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#f0ede8", marginBottom: 4 }}>Parse</div>
                <div style={{ fontSize: 12, color: "rgba(240,237,232,0.4)" }}>AI reads and extracts every field</div>
              </div>
              <div className="sc-steps-divider" style={{ width: 1, height: 60, background: "#2a2a2a", flexShrink: 0, marginTop: 10 }} />
              <div style={{ flex: 1, textAlign: "center" }}>
                <div className="sc-step-circle">3</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#f0ede8", marginBottom: 4 }}>Flow</div>
                <div style={{ fontSize: 12, color: "rgba(240,237,232,0.4)" }}>Data routes to the right place automatically</div>
              </div>
            </div>
          </section>

          <hr className="sc-divider" style={{ marginBottom: "4rem" }} />

          {/* ══════ BUILT FOR ══════ */}
          <section className="fade-in" style={{ marginBottom: "4rem" }}>
            <div className="sc-label">Built For</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="sc-audience-row">
                <div className="sc-audience-circle">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5l2 4.07L14.5 6.3l-3.25 3.17.77 4.47L8 11.8l-4.02 2.14.77-4.47L1.5 6.3l4.5-.73L8 1.5z" fill="#C8A84E"/></svg>
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "#f0ede8" }}>Tour managers &amp; business managers</div>
                <a href="/showcase/band" style={{ fontSize: 13, color: "rgba(240,237,232,0.4)", textDecoration: "none" }}>&rarr; Band</a>
              </div>
              <div className="sc-audience-row">
                <div className="sc-audience-circle">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5" stroke="#C8A84E" strokeWidth="2" fill="none"/></svg>
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "#f0ede8" }}>Self-managed bands doing it themselves</div>
                <a href="/showcase/diy" style={{ fontSize: 13, color: "rgba(240,237,232,0.4)", textDecoration: "none" }}>&rarr; DIY</a>
              </div>
              <div className="sc-audience-row">
                <div className="sc-audience-circle">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="3" y="3" width="10" height="10" rx="2" stroke="#C8A84E" strokeWidth="2" fill="none"/></svg>
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "#f0ede8" }}>Marketing teams &amp; label marketers</div>
                <a href="/showcase/localizer" style={{ fontSize: 13, color: "rgba(240,237,232,0.4)", textDecoration: "none" }}>&rarr; Localizer</a>
              </div>
            </div>
          </section>

          <hr className="sc-divider" style={{ marginBottom: "4rem" }} />

          {/* ══════ PRICING ══════ */}
          <section className="fade-in" style={{ marginBottom: "4rem" }}>
            <div className="sc-label">Pricing</div>

            {/* Featured suite */}
            <div style={{ background: "#1a1a1a", border: "2px solid #C8A84E", borderRadius: 14, padding: "20px 24px", marginBottom: 16, position: "relative" }}>
              <div style={{ position: "absolute", top: -10, left: 24 }}>
                <span className="sc-pill" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>Best value</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#f0ede8", marginBottom: 4 }}>The full HWY61 suite</div>
                  <div style={{ fontSize: 13, color: "rgba(240,237,232,0.5)" }}>Everything. One subscription. One bill.</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: "#f0ede8" }}>$249<span style={{ fontSize: 13, fontWeight: 400, color: "rgba(240,237,232,0.4)" }}>/mo</span></div>
              </div>
            </div>

            {/* Product tiles */}
            <div className="sc-pricing-tiles" style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              {[
                { name: "Band", price: "from $49/mo" },
                { name: "Localizer", price: "from $39/mo" },
                { name: "DIY", price: "$19/mo" },
              ].map((p) => (
                <div key={p.name} style={{ flex: 1, background: "#1a1a1a", borderRadius: 14, padding: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#f0ede8", marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 12, fontFamily: "'DM Mono', monospace", color: "rgba(240,237,232,0.4)" }}>{p.price}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 13, color: "rgba(240,237,232,0.4)", textAlign: "center", lineHeight: 1.7 }}>
              Combo discounts available &middot; 7-day free trial on everything &middot; <a href="/showcase/pricing" style={{ color: "#C8A84E", fontWeight: 500, textDecoration: "none" }}>See full pricing &rarr;</a>
            </div>
          </section>

          <hr className="sc-divider" style={{ marginBottom: "2rem" }} />

          {/* ══════ FOOTER ══════ */}
          <footer className="fade-in" style={{ textAlign: "center", paddingBottom: 60 }}>
            <div style={{
              fontFamily: "'PragmaticaExtended', sans-serif",
              fontWeight: 900,
              fontSize: 14,
              letterSpacing: "-0.05em",
              textTransform: "uppercase",
              color: "rgba(240,237,232,0.35)",
              marginBottom: 10,
            }}>HWY61.AI</div>
            <div style={{ fontSize: 12, color: "rgba(240,237,232,0.2)" }}>
              <a href="/terms" style={{ color: "rgba(240,237,232,0.2)", textDecoration: "none" }}>Terms of Service</a>
              {" \u00b7 "}
              <a href="/privacy" style={{ color: "rgba(240,237,232,0.2)", textDecoration: "none" }}>Privacy Policy</a>
              {" \u00b7 "}
              <a href="mailto:support@hwy61.ai" style={{ color: "rgba(240,237,232,0.2)", textDecoration: "none" }}>support@hwy61.ai</a>
            </div>
          </footer>
        </div>
      </div>
  );
}
