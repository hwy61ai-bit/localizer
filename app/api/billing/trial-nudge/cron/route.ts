import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Service-role client for cron (no user auth)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const SHARED_ORG_ID = "d38702d7-ea6b-49f1-bc8b-4a21b439642b";

type NudgeType = "day5" | "day7";

type OrgRow = {
  id: string;
  owner_email: string | null;
  trial_ends_at: string | null;
  localizer_plan_status: string | null;
};

async function resolveOwnerEmail(
  supabase: SupabaseClient,
  orgId: string,
  ownerEmail: string | null,
): Promise<string | null> {
  if (ownerEmail) return ownerEmail;
  const { data: members } = await supabase
    .from("org_members")
    .select("user_id")
    .eq("org_id", orgId)
    .limit(1);
  if (!members || members.length === 0) return null;
  const { data: userData } = await supabase.auth.admin.getUserById(members[0].user_id);
  return userData?.user?.email || null;
}

function buildNudgeHtml(nudgeType: NudgeType, appUrl: string): string {
  const wordmarkUrl = `${appUrl}/email/hwy61-wordmark.png`;
  const ctaUrl = `${appUrl}/dashboard/account`;

  const day5 = {
    headline: "Two days left.",
    ctaLabel: "Pick a plan &rarr;",
    body: `
      <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #1a1a1a; margin: 0 0 20px 0; text-align: left;">
        Quick heads up &mdash; your Localizer trial wraps soon, two days from now.
      </p>
      <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #1a1a1a; margin: 0 0 20px 0; text-align: left;">
        What you&rsquo;ve built is safe in your account either way. What changes is the venue share links &mdash; those go offline until you pick a plan. Anyone you&rsquo;ve already sent a link to will see an &ldquo;expired&rdquo; screen instead of your tour assets.
      </p>
      <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #1a1a1a; margin: 0 0 16px 0; text-align: left;">
        If you want them to keep working:
      </p>
    `,
    closing: `
      <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #666666; margin: 32px 0 0 0; text-align: left;">
        If Localizer isn&rsquo;t the right fit, no action needed. Trial just ends.
      </p>
    `,
  };

  const day7 = {
    headline: "Links paused.",
    ctaLabel: "Reactivate your links &rarr;",
    body: `
      <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #1a1a1a; margin: 0 0 20px 0; text-align: left;">
        Your Localizer trial wrapped today. Quick rundown on what that means:
      </p>
      <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #1a1a1a; margin: 0 0 20px 0; text-align: left;">
        Your account, your artist, your tours, your renders &mdash; all preserved. None of that&rsquo;s going anywhere.
      </p>
      <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #1a1a1a; margin: 0 0 20px 0; text-align: left;">
        What&rsquo;s paused: the venue share links. Anyone who tries to hit them will see an expired screen. If you&rsquo;ve got promoters or venues waiting on them, that&rsquo;s the part to fix.
      </p>
      <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.7; color: #1a1a1a; margin: 0 0 16px 0; text-align: left;">
        Pick a plan and they&rsquo;re live again within seconds:
      </p>
    `,
    closing: `
      <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #666666; margin: 32px 0 0 0; text-align: left;">
        If you&rsquo;d rather not, totally fine. We&rsquo;ll leave your account where it is. Come back any time.
      </p>
    `,
  };

  const variant = nudgeType === "day5" ? day5 : day7;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>HWY61 Labs</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F5F0E8; font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F5F0E8;">
  <tr>
    <td align="center" style="padding: 56px 16px 40px 16px;">

      <!-- Hero: wordmark + rule + tagline -->
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
          <td style="padding: 56px 44px 48px 44px;">

            <!-- Headline -->
            <h1 style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 48px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; color: #1a1a1a; margin: 0; line-height: 1; text-align: center;">
              ${variant.headline}
            </h1>

            <!-- Crimson accent bar -->
            <div style="width: 48px; height: 4px; background-color: #c5535b; margin: 20px auto 36px auto;"></div>

            <!-- Body copy -->
            ${variant.body}

            <!-- Pricing tiers -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 36px 0;">
              <tr>
                <td style="padding: 6px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #1a1a1a; text-align: left;">
                  &bull; <strong style="font-weight: 900;">Solo</strong> <span style="color: #c5535b; font-weight: 700;">$29/mo</span> <span style="color: #666;">&mdash; 1 artist</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #1a1a1a; text-align: left;">
                  &bull; <strong style="font-weight: 900;">Pro</strong> <span style="color: #c5535b; font-weight: 700;">$59/mo</span> <span style="color: #666;">&mdash; up to 5 artists</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #1a1a1a; text-align: left;">
                  &bull; <strong style="font-weight: 900;">Agency</strong> <span style="color: #c5535b; font-weight: 700;">$129/mo</span> <span style="color: #666;">&mdash; up to 12 artists</span>
                </td>
              </tr>
            </table>

            <!-- CTA button -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
              <tr>
                <td style="background-color: #1a1a1a; border: 3px solid #1a1a1a;">
                  <a href="${ctaUrl}" style="display: inline-block; padding: 16px 40px; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; color: #FFFFFF; text-decoration: none;">
                    ${variant.ctaLabel}
                  </a>
                </td>
              </tr>
            </table>

            <!-- Closing line -->
            ${variant.closing}

            <!-- Sign-off -->
            <p style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 700; color: #1a1a1a; margin: 16px 0 0 0; text-align: left;">
              &mdash; Tim, HWY61 Labs
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
              hwy61labs.com
            </div>
          </td>
        </tr>
      </table>

    </td>
  </tr>
</table>

</body>
</html>`;
}

const SUBJECT: Record<NudgeType, string> = {
  day5: "2 days left on your Localizer trial",
  day7: "Your venue links are paused",
};

export async function GET(req: NextRequest) {
  // Verify cron secret or allow manual trigger in non-prod
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = getServiceClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.hwy61labs.com";

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const day5Start = new Date(now.getTime() + 1 * dayMs).toISOString();
  const day5End = new Date(now.getTime() + 2 * dayMs).toISOString();
  const day7Start = new Date(now.getTime() - 1 * dayMs).toISOString();
  const day7End = now.toISOString();

  // Pre-fetch nudge log for idempotency
  const { data: existingNudges } = await supabase
    .from("trial_nudge_emails")
    .select("org_id, nudge_type");
  const sentSet = new Set(
    (existingNudges || []).map((n) => `${n.org_id}:${n.nudge_type}`),
  );

  // Fetch candidate orgs for each window
  const [day5Res, day7Res] = await Promise.all([
    supabase
      .from("orgs")
      .select("id, owner_email, trial_ends_at, localizer_plan_status")
      .gte("trial_ends_at", day5Start)
      .lte("trial_ends_at", day5End),
    supabase
      .from("orgs")
      .select("id, owner_email, trial_ends_at, localizer_plan_status")
      .gte("trial_ends_at", day7Start)
      .lte("trial_ends_at", day7End),
  ]);

  const filterEligible = (rows: OrgRow[] | null): OrgRow[] =>
    (rows || []).filter((o) => {
      if (o.id === SHARED_ORG_ID) return false;
      if (o.localizer_plan_status === "active" || o.localizer_plan_status === "past_due") return false;
      return true;
    });

  const day5Orgs = filterEligible(day5Res.data as OrgRow[] | null);
  const day7Orgs = filterEligible(day7Res.data as OrgRow[] | null);

  const errors: string[] = [];
  let day5Sent = 0;
  let day7Sent = 0;

  async function sendNudge(org: OrgRow, nudgeType: NudgeType): Promise<boolean> {
    const key = `${org.id}:${nudgeType}`;
    if (sentSet.has(key)) return false;

    const recipient = await resolveOwnerEmail(supabase, org.id, org.owner_email);
    if (!recipient) {
      errors.push(`${org.id}: no owner email resolvable (${nudgeType})`);
      return false;
    }

    try {
      const { data: emailResult } = await resend.emails.send({
        from: "HWY61 Labs <noreply@hwy61labs.com>",
        to: recipient,
        subject: SUBJECT[nudgeType],
        html: buildNudgeHtml(nudgeType, appUrl),
      });

      // Log to trial_nudge_emails; unique(org_id, nudge_type) is the backstop.
      try {
        await supabase.from("trial_nudge_emails").insert({
          org_id: org.id,
          nudge_type: nudgeType,
          resend_id: emailResult?.id || null,
        });
      } catch (logErr) {
        const msg = logErr instanceof Error ? logErr.message : "log insert failed";
        errors.push(`${org.id}: log insert failed (${nudgeType}): ${msg}`);
      }

      sentSet.add(key);
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Send failed";
      errors.push(`${org.id}: ${msg} (${nudgeType})`);
      return false;
    }
  }

  for (const org of day5Orgs) {
    if (await sendNudge(org, "day5")) day5Sent += 1;
  }
  for (const org of day7Orgs) {
    if (await sendNudge(org, "day7")) day7Sent += 1;
  }

  return NextResponse.json({
    message: "Trial nudge cron complete",
    day5_sent: day5Sent,
    day7_sent: day7Sent,
    errors,
  });
}
