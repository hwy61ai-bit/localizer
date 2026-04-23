import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
  const halftoneSvg = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc0JyBoZWlnaHQ9JzQnPjxjaXJjbGUgY3g9JzInIGN5PScyJyByPScxJyBmaWxsPSdyZ2JhKDAsMCwwLDAuMDQpJy8+PC9zdmc+";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Welcome to HWY61 Labs</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F0E8; background-image: url('${halftoneSvg}'); background-repeat: repeat; font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F5F0E8; background-image: url('${halftoneSvg}'); background-repeat: repeat;">
  <tr>
    <td align="center" style="padding: 40px 20px;">

      <!-- Inner card -->
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%; background-color: #FFFFFF; border: 3px solid #1a1a1a; box-shadow: 6px 6px 0 #1a1a1a;">
        <tr>
          <td style="padding: 48px 44px 40px 44px;">

            <!-- Wordmark: HWY black / 61 crimson / LABS black -->
            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 36px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; color: #1a1a1a; line-height: 1; margin-bottom: 40px;">
              HWY<span style="color: #c5535b;">61</span> LABS
            </div>

            <!-- Divider -->
            <div style="border-top: 3px solid #1a1a1a; margin-bottom: 32px; width: 60px;"></div>

            <!-- Headline -->
            <h1 style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 32px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; color: #1a1a1a; margin: 0 0 20px 0; line-height: 1.1;">
              You&rsquo;re in.
            </h1>

            <!-- Body paragraph 1 -->
            <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 20px 0;">
              HWY61 Labs builds tools for people who move music for a living &mdash; routing, marketing, advancing, settling. Everything autosaves. Everything drag &amp; drop.
            </p>

            <!-- Body paragraph 2 -->
            <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333333; margin: 0 0 32px 0;">
              Your dashboard is ready. Jump in and start building &mdash; your data is yours, your workspace is yours.
            </p>

            <!-- CTA button -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 40px;">
              <tr>
                <td style="background-color: #c5535b; border: 3px solid #1a1a1a; box-shadow: 4px 4px 0 #1a1a1a;">
                  <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 32px; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; color: #FFFFFF; text-decoration: none;">
                    Go to Dashboard &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <!-- Divider -->
            <div style="border-top: 1px solid #e0dcd3; margin: 32px 0;"></div>

            <!-- Feedback ask -->
            <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #555555; margin: 0 0 28px 0;">
              Questions, feedback, things that don&rsquo;t work the way you&rsquo;d expect? Just reply to this email. We read every one.
            </p>

            <!-- Sign-off -->
            <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 700; color: #1a1a1a; margin: 0;">
              &mdash; The HWY61 Labs team
            </p>

          </td>
        </tr>
      </table>

      <!-- Footer (outside the card, on the halftone background) -->
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%; margin-top: 24px;">
        <tr>
          <td align="center" style="padding: 16px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #888888;">
            HWY61 Labs &middot; hwy61labs.com
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
