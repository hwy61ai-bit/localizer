import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { LOCALIZER_FROM } from "@/lib/email/sender";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  // Internal-only relay — fail closed. Require Bearer ${WELCOME_INTERNAL_SECRET};
  // a missing env var (or empty string) treats as failure to avoid trivial undefined-match.
  const authHeader = req.headers.get("authorization");
  const welcomeSecret = process.env.WELCOME_INTERNAL_SECRET;
  if (!welcomeSecret || authHeader !== `Bearer ${welcomeSecret}`) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://localizer.music";
  const dashboardUrl = `${appUrl}/dashboard`;
  const wordmarkUrl = `${appUrl}/email/hwy61-wordmark.png`;

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
    <td align="center" style="padding: 56px 16px 40px 16px;">

      <!-- Hero section: wordmark + rule + tagline, all centered -->
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%;">
        <tr>
          <td align="center" style="padding: 0 0 48px 0;">
            <img src="${wordmarkUrl}" alt="HWY61 LABS" width="400" style="display: block; margin: 0 auto; width: 400px; max-width: 85%; height: auto;" />
            <div style="width: 80px; height: 2px; background-color: #1a1a1a; margin: 28px auto 14px auto;"></div>
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #c5535b;">
              Tools for Touring
            </div>
          </td>
        </tr>
      </table>

      <!-- Main content card -->
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%; background-color: #FFFFFF; border: 3px solid #1a1a1a;">
        <tr>
          <td align="center" style="padding: 56px 44px 48px 44px;">

            <!-- Headline -->
            <h1 style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 56px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #1a1a1a; margin: 0; line-height: 1; text-align: center;">
              You&rsquo;re in.
            </h1>

            <!-- Crimson accent bar -->
            <div style="width: 48px; height: 4px; background-color: #c5535b; margin: 20px auto 36px auto;"></div>

            <!-- Body paragraph -->
            <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #1a1a1a; margin: 0 0 40px 0; text-align: center; max-width: 420px; margin-left: auto; margin-right: auto;">
              Localizer turns one promo image into a full set of branded marketing assets &mdash; sized for every platform, ready for every show. Upload once, download everything.
            </p>

            <!-- Flyer stack: three display lines, middle one crimson -->
            <div style="margin: 0 0 44px 0;">
              <div style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 32px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; color: #1a1a1a; line-height: 1.15; text-align: center;">
                One image.
              </div>
              <div style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 32px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; color: #1a1a1a; line-height: 1.15; text-align: center;">
                Every asset.
              </div>
              <div style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 32px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; color: #c5535b; line-height: 1.15; text-align: center;">
                Every show.
              </div>
            </div>

            <!-- Dashboard-ready line -->
            <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a; margin: 0 0 28px 0; text-align: center;">
              Your dashboard is ready.
            </p>

            <!-- CTA button -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
              <tr>
                <td style="background-color: #1a1a1a; border: 3px solid #1a1a1a;">
                  <a href="${dashboardUrl}" style="display: inline-block; padding: 16px 40px; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; color: #FFFFFF; text-decoration: none;">
                    Go to Dashboard &rarr;
                  </a>
                </td>
              </tr>
            </table>

            <!-- Reply note -->
            <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #666666; margin: 40px 0 0 0; text-align: center; max-width: 380px; margin-left: auto; margin-right: auto;">
              Questions, feedback, things that don&rsquo;t work the way you&rsquo;d expect? Just reply. We read every one.
            </p>

            <!-- Sign-off -->
            <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 700; color: #1a1a1a; margin: 24px 0 0 0; text-align: center;">
              &mdash; The HWY61 Labs team
            </p>

          </td>
        </tr>
      </table>

      <!-- Footer -->
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; width: 100%; margin-top: 32px;">
        <tr>
          <td align="center">
            <div style="width: 40px; height: 2px; background-color: #c5535b; margin: 0 auto 14px auto;"></div>
            <div style="font-family: 'Courier New', Courier, monospace; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #888888;">
              localizer.music
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
    from: LOCALIZER_FROM,
    to: email,
    subject: "Welcome to Localizer",
    html,
  });

  return NextResponse.json({ ok: true });
}
