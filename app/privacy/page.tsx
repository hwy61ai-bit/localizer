import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#EEEEEE", padding: "48px 24px", color: "#111" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: "#888", textDecoration: "none" }}>\u2190 Back</Link>
        </div>
        <div className="brand-title" style={{ fontSize: 40, marginBottom: 4 }}>LOCALIZER</div>
        <div style={{ width: 120, height: 2, background: "#111", marginBottom: 24 }} />
        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 32 }}>Effective Date: March 2026</p>
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #ddd", padding: "32px 28px", fontSize: 14, lineHeight: 1.7 }}>

          <p>This Privacy Policy describes how HWY61 AI collects, uses, and protects information when you use Localizer at localizer.hwy61.ai. By using the Service, you agree to the practices described in this policy.</p>

          <h2 style={{ fontSize: 18, fontWeight: 900, marginTop: 32, marginBottom: 12 }}>1. Information We Collect</h2>
          <p><strong>Account Information:</strong> We collect your email address. We use passwordless authentication (magic link) so we do not collect or store passwords.</p>
          <p><strong>Organization Information:</strong> You may provide an organization name and contact details.</p>
          <p><strong>Content You Upload:</strong> Tour schedule data, base poster images, custom fonts, artist photos and logos, and text overlay configurations.</p>
          <p><strong>Generated Content:</strong> Rendered Assets (poster images) hosted on our CDN for delivery via Venue Links.</p>
          <p><strong>Usage Data:</strong> Pages visited, features used, render counts, and timestamps.</p>
          <p><strong>Payment Information:</strong> Handled entirely by Stripe. We do not store your full credit card number.</p>
          <p><strong>AI Processing Data:</strong> Uploaded tour schedules are sent to Anthropic for parsing. We do not use your content to train AI models.</p>

          <h2 style={{ fontSize: 18, fontWeight: 900, marginTop: 32, marginBottom: 12 }}>2. How We Use Your Information</h2>
          <p>We use your information to: provide and improve the Service, generate and deliver Rendered Assets, process payments, send transactional emails, enforce usage limits, respond to support requests, and comply with legal obligations.</p>
          <p>We do not sell your personal information. We do not use your information for advertising. We do not use your Content to train AI models.</p>

          <h2 style={{ fontSize: 18, fontWeight: 900, marginTop: 32, marginBottom: 12 }}>3. How We Share Your Information</h2>
          <p>We share information with service providers who help operate the Service:</p>
          <p><strong>Supabase</strong> \u2014 Database, authentication, file storage. <strong>Cloudinary</strong> \u2014 Image hosting and CDN. <strong>Stripe</strong> \u2014 Payment processing. <strong>Resend</strong> \u2014 Email delivery. <strong>Anthropic</strong> \u2014 AI processing. <strong>Vercel</strong> \u2014 Application hosting.</p>
          <p>Venue Links expose only poster images and event details (date, venue name, city). No personal account information is shared through Venue Links.</p>
          <p>We may disclose information if required by law or to protect the rights, property, or safety of HWY61 AI, our users, or the public.</p>

          <h2 style={{ fontSize: 18, fontWeight: 900, marginTop: 32, marginBottom: 12 }}>4. Data Storage and Security</h2>
          <p>Your data is stored on servers operated by Supabase, Cloudinary, and Vercel. All data is transmitted over HTTPS. We use row-level security policies to ensure users can only access data within their own Organization.</p>

          <h2 style={{ fontSize: 18, fontWeight: 900, marginTop: 32, marginBottom: 12 }}>5. Data Retention</h2>
          <p>We retain your data for as long as your Account is active. Upon deletion request, we will delete your Content within 30 days. Rendered Assets may be cached on our CDN for a period after deletion.</p>

          <h2 style={{ fontSize: 18, fontWeight: 900, marginTop: 32, marginBottom: 12 }}>6. Your Rights</h2>
          <p>Depending on your jurisdiction, you may request: access, correction, deletion, data portability, or objection to processing. Contact privacy@hwy61.ai. We will respond within 30 days.</p>

          <h2 style={{ fontSize: 18, fontWeight: 900, marginTop: 32, marginBottom: 12 }}>7. Cookies and Tracking</h2>
          <p>We use essential cookies for authentication only. We do not use advertising cookies, tracking pixels, or third-party analytics. We do not engage in cross-site tracking.</p>

          <h2 style={{ fontSize: 18, fontWeight: 900, marginTop: 32, marginBottom: 12 }}>8. Children</h2>
          <p>The Service is not directed to individuals under 18. We do not knowingly collect personal information from children.</p>

          <h2 style={{ fontSize: 18, fontWeight: 900, marginTop: 32, marginBottom: 12 }}>9. International Data Transfers</h2>
          <p>Our service providers may process data in the United States and other countries. By using the Service, you consent to the transfer of your information to these jurisdictions.</p>

          <h2 style={{ fontSize: 18, fontWeight: 900, marginTop: 32, marginBottom: 12 }}>10. California Privacy Rights</h2>
          <p>If you are a California resident, the CCPA provides additional rights. We do not sell personal information. Contact privacy@hwy61.ai to exercise your rights.</p>

          <h2 style={{ fontSize: 18, fontWeight: 900, marginTop: 32, marginBottom: 12 }}>11. Changes to This Policy</h2>
          <p>We may update this policy from time to time. Continued use after changes constitutes acceptance.</p>

          <h2 style={{ fontSize: 18, fontWeight: 900, marginTop: 32, marginBottom: 12 }}>12. Contact</h2>
          <p><strong>HWY61 AI</strong><br />Email: privacy@hwy61.ai<br />DMCA: dmca@hwy61.ai</p>
        </div>
      </div>
    </main>
  );
}
