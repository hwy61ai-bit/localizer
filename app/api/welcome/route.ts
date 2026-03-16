import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

  await resend.emails.send({
    from: "noreply@hwy61.ai",
    to: email,
    subject: "Welcome to Localizer",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; padding: 40px 32px; border-radius: 12px;">
        <p style="font-size: 11px; font-weight: 700; color: #555; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 16px 0;">Welcome</p>
        <h1 style="font-family: 'Bebas Neue', Impact, sans-serif; font-size: 64px; font-weight: 400; color: #ffffff; margin: 0 0 8px 0; line-height: 1; letter-spacing: 2px;">LOCALIZER</h1>
        <div style="border-top: 1px solid #222; margin: 20px 0;"></div>
        <p style="color: #888; font-size: 15px; line-height: 1.7; margin: 0 0 32px 0;">
          You're in. Here's how to get your first Artist/Band assets and graphics out in under 10 minutes:
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
          <tr>
            <td style="padding: 14px 0; border-bottom: 1px solid #1a1a1a; color: #555; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; width: 32px;">01</td>
            <td style="padding: 14px 0; border-bottom: 1px solid #1a1a1a; color: #f0ede8; font-size: 14px;">Upload your artist\'s assets (Photos/Videos/Advance Materials)</td>
          </tr>
          <tr>
            <td style="padding: 14px 0; border-bottom: 1px solid #1a1a1a; color: #555; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">02</td>
            <td style="padding: 14px 0; border-bottom: 1px solid #1a1a1a; color: #f0ede8; font-size: 14px;">Import your routing sheet — paste, upload, or type it in</td>
          </tr>
          <tr>
            <td style="padding: 14px 0; color: #555; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">03</td>
            <td style="padding: 14px 0; color: #f0ede8; font-size: 14px;">Hit Generate All — all assets go out to every venue automatically</td>
          </tr>
        </table>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; padding: 14px 28px; background: #ffffff; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 900; font-size: 14px; letter-spacing: 0.05em;">
          GO TO DASHBOARD →
        </a>
        <p style="margin-top: 40px; font-size: 11px; color: #444;">
          Powered by Localizer — Tour dates in. Show graphics out.
        </p>
      </div>
    `,
  });

  return NextResponse.json({ ok: true });
}
