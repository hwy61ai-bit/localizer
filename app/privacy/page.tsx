import Link from "next/link";
import { CookieSettingsButton } from "../components/CookieSettingsButton";

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "transparent", padding: "48px 24px", color: "var(--hw-text)" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/" style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: 4, textTransform: "uppercase" as const, color: "var(--hw-blue)", textDecoration: "none" }}>{"\u2190"} Back</Link>
        </div>
        <div style={{ fontFamily: "var(--hw-font-display)", fontSize: 40, letterSpacing: 3, textTransform: "uppercase" as const, marginBottom: 4, color: "var(--hw-text)" }}>LOCALIZER</div>
        <div style={{ width: 120, height: 3, background: "var(--hw-crimson)", marginBottom: 24 }} />
        <h1 style={{ fontFamily: "var(--hw-font-display)", fontSize: 28, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase" as const, marginBottom: 8, color: "var(--hw-text)" }}>Privacy Policy</h1>
        <p style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: 4, textTransform: "uppercase" as const, color: "var(--hw-blue)", marginBottom: 4 }}>Effective Date: [SET AT PUBLISH]</p>
        <p style={{ fontFamily: "var(--hw-font-mono)", fontSize: 11, letterSpacing: 4, textTransform: "uppercase" as const, color: "var(--hw-blue)", marginBottom: 32 }}>Last Updated: July 6, 2026</p>
        <div style={{ background: "var(--hw-bg-surface)", borderRadius: 0, border: "3px solid var(--hw-border-strong)", padding: "32px 28px", fontFamily: "var(--hw-font-body)", fontSize: 14, fontWeight: 300, lineHeight: 1.7, color: "var(--hw-text-secondary)" }}>

          <p>This Privacy Policy describes how HWY61 LLC collects, uses, and protects information when you use Localizer at hwy61labs.com. By using the Service, you agree to the practices described in this policy.</p>

          <h2 style={{ fontFamily: "var(--hw-font-display)", fontSize: 18, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase" as const, marginTop: 32, marginBottom: 12, color: "var(--hw-text)" }}>1. Information We Collect</h2>
          <p><strong>Account Information:</strong> We collect your email address. We use passwordless authentication (magic link) so we do not collect or store passwords.</p>
          <p><strong>Organization Information:</strong> You may provide an organization name and contact details.</p>
          <p><strong>Content You Upload:</strong> Tour schedule data, base poster images, custom fonts, artist photos and logos, text overlay configurations, team contact information you enter, and documents you upload for delivery to venues (such as stage plots, hospitality riders, FOH requirements, and W-9 tax forms).</p>
          <p><strong>Generated Content:</strong> Rendered Assets (poster images) hosted on our CDN for delivery via Venue Links.</p>
          <p><strong>Usage Data:</strong> Pages visited, features used, render counts, timestamps, and Venue Link activity, including W-9 download events. We use PostHog for product analytics.</p>
          <p><strong>Payment Information:</strong> Handled entirely by Stripe. We do not store your full credit card number.</p>
          <p><strong>AI Processing Data:</strong> Uploaded tour schedules and documents (deal memos, settlements, advance responses) are sent to Anthropic for parsing and automation. We do not use your content to train AI models.</p>

          <h2 style={{ fontFamily: "var(--hw-font-display)", fontSize: 18, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase" as const, marginTop: 32, marginBottom: 12, color: "var(--hw-text)" }}>2. How We Use Your Information</h2>
          <p>We use your information to: provide and improve the Service, generate and deliver Rendered Assets, process payments, send transactional emails, enforce usage limits, respond to support requests, and comply with legal obligations.</p>
          <p>We do not sell your personal information. We do not use your information for advertising. We do not use your Content to train AI models.</p>

          <h2 style={{ fontFamily: "var(--hw-font-display)", fontSize: 18, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase" as const, marginTop: 32, marginBottom: 12, color: "var(--hw-text)" }}>3. How We Share Your Information</h2>
          <p>We share information with service providers who help operate the Service: <strong>Supabase</strong> — Database, authentication, file storage. <strong>Cloudinary</strong> — Image hosting and CDN. <strong>Stripe</strong> — Payment processing. <strong>Resend</strong> — Email delivery. <strong>Anthropic</strong> — AI processing. <strong>Vercel</strong> — Application hosting. <strong>PostHog</strong> — Product analytics. <strong>Upstash</strong> — Rate limiting.</p>
          <p><strong>Venue Links.</strong> Venue Links are shareable pages you create to deliver show materials to venues and promoters. A Venue Link can be viewed by anyone who has the URL — it is not password-protected — so share each link only with the people who need it. Venue Link pages are marked to discourage search-engine indexing.</p>
          <p>Depending on what you choose to include, a Venue Link can display: promotional assets and event details (posters and other Rendered Assets, show date, venue name, city, artist bio, and external links you add); contact information for members of your team, such as a manager, tour manager, booking agent, or publicist (names, email addresses, and phone numbers); business identifiers you add, such as a Meta Business Manager ID; advance and technical documents you upload (stage plots, hospitality riders, FOH requirements, and custom files); and tax documents — if you upload a W-9, Venue Link recipients can download it after confirming they are authorized to receive it, and we log each download.</p>
          <p>Visibility settings on each Venue Link let you choose whether team contacts, advance documents, and tax documents appear. Information about your team members is published at your direction: by adding it to a Venue Link, you are instructing us to share it with anyone you give the link to, and you confirm you have the authority to do so (see our <Link href="/terms" style={{ color: "var(--hw-crimson)", fontWeight: 700 }}>Terms of Service</Link>).</p>
          <p>We may disclose information if required by law or to protect the rights, property, or safety of HWY61 LLC, our users, or the public.</p>

          <h2 style={{ fontFamily: "var(--hw-font-display)", fontSize: 18, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase" as const, marginTop: 32, marginBottom: 12, color: "var(--hw-text)" }}>4. Data Storage and Security</h2>
          <p>Your data is stored on servers operated by Supabase, Cloudinary, and Vercel. All data is transmitted over HTTPS. We use row-level security policies to ensure users can only access data within their own Organization.</p>

          <h2 style={{ fontFamily: "var(--hw-font-display)", fontSize: 18, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase" as const, marginTop: 32, marginBottom: 12, color: "var(--hw-text)" }}>5. Data Retention</h2>
          <p>We retain your data for as long as your Account is active. Upon deletion request, we will delete your Content within 30 days. Rendered Assets may be cached on our CDN for a period after deletion.</p>

          <h2 style={{ fontFamily: "var(--hw-font-display)", fontSize: 18, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase" as const, marginTop: 32, marginBottom: 12, color: "var(--hw-text)" }}>6. Your Rights</h2>
          <p>Depending on your jurisdiction, you may request: access, correction, deletion, data portability, or objection to processing. Contact privacy@hwy61labs.com. We will respond within 30 days.</p>

          <h2 style={{ fontFamily: "var(--hw-font-display)", fontSize: 18, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase" as const, marginTop: 32, marginBottom: 12, color: "var(--hw-text)" }}>7. Cookies and Tracking</h2>
          <p>We use essential cookies for authentication; these are required for the Service to function. Product analytics (PostHog) runs only if you consent through our cookie banner, and you can change your choice at any time. We do not use advertising cookies, tracking pixels, or cross-site tracking.</p>
          <p>You can reopen the choice here: <CookieSettingsButton />.</p>

          <h2 style={{ fontFamily: "var(--hw-font-display)", fontSize: 18, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase" as const, marginTop: 32, marginBottom: 12, color: "var(--hw-text)" }}>8. Children</h2>
          <p>The Service is not directed to individuals under 18. We do not knowingly collect personal information from children.</p>

          <h2 style={{ fontFamily: "var(--hw-font-display)", fontSize: 18, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase" as const, marginTop: 32, marginBottom: 12, color: "var(--hw-text)" }}>9. International Data Transfers</h2>
          <p>Our service providers may process data in the United States and other countries. By using the Service, you consent to the transfer of your information to these jurisdictions.</p>

          <h2 style={{ fontFamily: "var(--hw-font-display)", fontSize: 18, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase" as const, marginTop: 32, marginBottom: 12, color: "var(--hw-text)" }}>10. California Privacy Rights</h2>
          <p>If you are a California resident, the CCPA provides additional rights. We do not sell personal information. Contact privacy@hwy61labs.com to exercise your rights.</p>

          <h2 style={{ fontFamily: "var(--hw-font-display)", fontSize: 18, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase" as const, marginTop: 32, marginBottom: 12, color: "var(--hw-text)" }}>11. Changes to This Policy</h2>
          <p>We may update this policy from time to time. Continued use after changes constitutes acceptance.</p>

          <h2 style={{ fontFamily: "var(--hw-font-display)", fontSize: 18, fontWeight: 400, letterSpacing: 2, textTransform: "uppercase" as const, marginTop: 32, marginBottom: 12, color: "var(--hw-text)" }}>12. Contact</h2>
          <p><strong>HWY61 LLC</strong><br />Email: privacy@hwy61labs.com<br />DMCA: dmca@hwy61labs.com</p>
        </div>
      </div>
    </main>
  );
}
