import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Welcome to HWY61 Labs</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F0E8; font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F5F0E8;">
  <tr>
    <td align="center" style="padding: 40px 16px;">

      <!-- Hero: solid crimson block -->
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%; background-color: #c5535b; border: 3px solid #1a1a1a; border-bottom: none;">
        <tr>
          <td align="center" style="padding: 36px 32px;">
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 32px; font-weight: 900; letter-spacing: 6px; text-transform: uppercase; color: #FFFFFF; line-height: 1;">
              HWY61 LABS
            </div>
          </td>
        </tr>
      </table>

      <!-- Inner card -->
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%; background-color: #FFFFFF; border: 3px solid #1a1a1a;">
        <tr>
          <td style="padding: 48px 44px 44px 44px;">

            <!-- Headline -->
            <h1 style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 48px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #1a1a1a; margin: 0 0 8px 0; line-height: 1;">
              You&rsquo;re in.
            </h1>

            <!-- Crimson accent bar under headline -->
            <div style="width: 48px; height: 4px; background-color: #c5535b; margin: 0 0 32px 0;"></div>

            <!-- Body paragraph 1 -->
            <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.65; color: #1a1a1a; margin: 0 0 20px 0;">
              HWY61 Labs builds tools for people who move music for a living &mdash; routing, marketing, advancing, settling. Everything autosaves. Everything drag &amp; drop.
            </p>

            <!-- Body paragraph 2 -->
            <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.65; color: #1a1a1a; margin: 0 0 36px 0;">
              Your dashboard is ready. Jump in and start building &mdash; your data is yours, your workspace is yours.
            </p>

            <!-- CTA button -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 12px 0;">
              <tr>
                <td style="background-color: #1a1a1a; border: 3px solid #1a1a1a;">
                  <a href="${dashboardUrl}" style="display: inline-block; padding: 16px 36px; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; color: #FFFFFF; text-decoration: none;">
                    Go to Dashboard &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <!-- Reply note -->
            <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; line-height: 1.5; color: #666666; margin: 32px 0 0 0;">
              Questions, feedback, things that don&rsquo;t work the way you&rsquo;d expect? Just reply to this email. We read every one.
            </p>

            <!-- Sign-off -->
            <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 700; color: #1a1a1a; margin: 28px 0 0 0;">
              &mdash; The HWY61 Labs team
            </p>

          </td>
        </tr>
      </table>

      <!-- Footer -->
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%; margin-top: 28px;">
        <tr>
          <td align="center">
            <div style="width: 40px; height: 3px; background-color: #c5535b; margin: 0 auto 16px auto;"></div>
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #888888;">
              HWY61 Labs &middot; hwy61labs.com
            </div>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>

</body>
</html>`;

  await resend.emails.send({
    from: "HWY61 Labs <noreply@hwy61labs.com>",
    to: email,
    subject: "Welcome to HWY61 Labs",
    html,
  });

  return NextResponse.json({ ok: true });
}
