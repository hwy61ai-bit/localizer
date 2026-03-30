import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { generatePublicToken } from "@/lib/tokens";

const resend = new Resend(process.env.RESEND_API_KEY);

// Service-role client for cron (no user auth)
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

type AdvanceConfig = {
  initialSendDays: number;
  followup1Days: number;
  followup2Days: number;
  finalNudgeDays: number;
  enabled: boolean;
};

const DEFAULT_CONFIG: AdvanceConfig = {
  initialSendDays: 21,
  followup1Days: 5,
  followup2Days: 5,
  finalNudgeDays: 3,
  enabled: true,
};

type ShowRow = Record<string, unknown>;
type EmailLog = {
  org_id: string;
  tour_id: string;
  show_id: string;
  email_type: string;
  recipient_email: string;
  resend_id?: string;
};

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string): string {
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
  } catch { return iso; }
}

function buildEmailHtml(
  artistName: string, venueName: string, city: string, dateStr: string,
  advanceLink: string, emailType: string, daysUntilShow: number,
): string {
  const urgencyMap: Record<string, string> = {
    initial: "",
    followup_1: `<p style="color:#b35c00;font-size:14px;">This is a follow-up to our earlier advance request.</p>`,
    followup_2: `<p style="color:#b35c00;font-size:14px;font-weight:600;">Second follow-up — we still need advance info for this show.</p>`,
    final_nudge: `<p style="color:#c0392b;font-weight:700;font-size:14px;">The show is in ${daysUntilShow} day${daysUntilShow !== 1 ? "s" : ""}. We urgently need your advance information.</p>`,
  };

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; padding: 40px 32px; border-radius: 12px;">
      <p style="font-size: 11px; font-weight: 700; color: #555; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 16px 0;">Advance Information Request</p>
      <h1 style="font-family: 'Bebas Neue', Impact, sans-serif; font-size: 48px; font-weight: 400; color: #ffffff; margin: 0 0 8px 0; line-height: 1; letter-spacing: 2px;">${artistName.toUpperCase()}</h1>
      <div style="border-top: 1px solid #222; margin: 20px 0;"></div>
      <p style="color: #888; font-size: 14px; margin: 0 0 4px 0;">${dateStr}</p>
      <p style="color: #888; font-size: 14px; margin: 0 0 24px 0;">${venueName}${city ? ", " + city : ""}</p>
      <p style="color: #ccc; font-size: 14px; margin: 0 0 16px 0;">Please fill out the advance information form for the upcoming show.</p>
      ${urgencyMap[emailType] || ""}
      <a href="${advanceLink}" style="display: inline-block; padding: 14px 28px; background: #ffffff; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 900; font-size: 14px; letter-spacing: 0.05em; margin-top: 8px;">
        FILL OUT ADVANCE FORM &rarr;
      </a>
      <p style="margin-top: 40px; font-size: 11px; color: #444;">Powered by TourRouter</p>
    </div>
  `;
}

export async function GET(req: NextRequest) {
  // Verify cron secret or allow manual trigger
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Allow without secret in dev
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = getServiceClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all active tours with advance enabled
  const { data: tours } = await supabase
    .from("tours_routing")
    .select("id, org_id, name, advance_config, artists(name)");

  if (!tours || tours.length === 0) {
    return NextResponse.json({ message: "No tours found", sent: 0 });
  }

  const emailsSent: EmailLog[] = [];
  const errors: string[] = [];
  const summaryByOrg: Record<string, { advanced: string[]; escalated: string[]; confirmed: string[]; orgId: string }> = {};

  for (const tour of tours) {
    const config: AdvanceConfig = { ...DEFAULT_CONFIG, ...(tour.advance_config as Partial<AdvanceConfig> || {}) };
    if (!config.enabled) continue;

    const artistData = (tour as Record<string, unknown>).artists as Record<string, unknown> | null;
    const artistName = (artistData?.name as string) || tour.name || "Artist";
    const orgId = tour.org_id as string;

    if (!summaryByOrg[orgId]) {
      summaryByOrg[orgId] = { advanced: [], escalated: [], confirmed: [], orgId };
    }

    // Get shows for this tour
    const { data: shows } = await supabase
      .from("tour_shows")
      .select("*")
      .eq("tour_id", tour.id)
      .eq("is_off", false)
      .eq("advance_auto_stop", false)
      .order("sort_order");

    if (!shows || shows.length === 0) continue;

    // Get existing advance emails for this tour (for idempotency)
    const { data: existingEmails } = await supabase
      .from("advance_emails")
      .select("show_id, email_type")
      .eq("tour_id", tour.id);

    const sentSet = new Set(
      (existingEmails || []).map((e) => `${e.show_id}:${e.email_type}`)
    );

    for (const show of shows as ShowRow[]) {
      const showId = show.id as string;
      const dateIso = show.date_iso as string;
      if (!dateIso) continue;

      const showDate = new Date(dateIso + "T12:00:00");
      const daysUntilShow = daysBetween(today, showDate);
      if (daysUntilShow < 0) continue; // Past shows

      const status = (show.advance_status as string) || "not_started";
      const recipientEmail = show.advance_recipient_email as string || show.promoter_contact as string;
      if (!recipientEmail) continue;

      // Check if all required advance fields are populated → confirmed
      const requiredFields = ["doors", "showtime", "load_in_time"];
      const allFilled = requiredFields.every((f) => show[f]);
      if (allFilled && show.advance_form_submitted_at) {
        if (status !== "confirmed") {
          await supabase.from("tour_shows").update({ advance_status: "confirmed" }).eq("id", showId);
          summaryByOrg[orgId].confirmed.push(`${show.venue} (${dateIso})`);
        }
        continue;
      }

      // Ensure advance_form_token exists
      let token = show.advance_form_token as string;
      if (!token) {
        token = generatePublicToken();
        await supabase.from("tour_shows").update({ advance_form_token: token }).eq("id", showId);
      }

      const advanceLink = `${process.env.NEXT_PUBLIC_APP_URL}/advance/${token}`;
      const venueName = (show.venue as string) || "Venue";
      const city = (show.city as string) || "";
      const formattedDate = formatDate(dateIso);

      // Determine what email to send
      let emailType: string | null = null;
      let newStatus: string | null = null;
      const lastSentAt = show.advance_sent_at as string;
      const daysSinceLastEmail = lastSentAt ? daysBetween(new Date(lastSentAt), today) : 999;

      if (status === "not_started" && daysUntilShow <= config.initialSendDays) {
        emailType = "initial";
        newStatus = "sent";
      } else if (status === "sent" && daysSinceLastEmail >= config.followup1Days) {
        emailType = "followup_1";
        newStatus = "followup_1_sent";
      } else if (status === "followup_1_sent" && daysSinceLastEmail >= config.followup2Days) {
        emailType = "followup_2";
        newStatus = "followup_2_sent";
      } else if (status === "followup_2_sent" && daysUntilShow <= config.finalNudgeDays) {
        emailType = "final_nudge";
        newStatus = "final_nudge_sent";
      }

      if (!emailType || !newStatus) continue;

      // Idempotency check
      if (sentSet.has(`${showId}:${emailType}`)) continue;

      // Send email
      const subjectMap: Record<string, string> = {
        initial: `Advance Information Request — ${artistName} @ ${venueName}`,
        followup_1: `Follow-up: Advance Info Needed — ${artistName} @ ${venueName}`,
        followup_2: `2nd Follow-up: Advance Info — ${artistName} @ ${venueName}`,
        final_nudge: `Urgent: Advance Info Required — ${artistName} @ ${venueName} (${daysUntilShow} days)`,
      };

      try {
        const { data: emailResult } = await resend.emails.send({
          from: "advances@hwy61labs.com",
          to: recipientEmail.split(",").map((e: string) => e.trim()).filter(Boolean),
          subject: subjectMap[emailType] || subjectMap.initial,
          html: buildEmailHtml(artistName, venueName, city, formattedDate, advanceLink, emailType, daysUntilShow),
        });

        // Log to advance_emails
        await supabase.from("advance_emails").insert({
          org_id: orgId,
          tour_id: tour.id,
          show_id: showId,
          email_type: emailType,
          recipient_email: recipientEmail,
          resend_id: emailResult?.id || null,
        });

        // Update show status
        const updates: Record<string, unknown> = {
          advance_status: newStatus,
          advance_sent_at: new Date().toISOString(),
        };
        if (newStatus === "final_nudge_sent") {
          updates.advance_escalated = true;
        }
        await supabase.from("tour_shows").update(updates).eq("id", showId);

        emailsSent.push({
          org_id: orgId,
          tour_id: tour.id as string,
          show_id: showId,
          email_type: emailType,
          recipient_email: recipientEmail,
          resend_id: emailResult?.id,
        });

        summaryByOrg[orgId].advanced.push(`${venueName} (${dateIso}) — ${emailType}`);
        if (newStatus === "final_nudge_sent") {
          summaryByOrg[orgId].escalated.push(`${venueName} (${dateIso})`);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Send failed";
        errors.push(`${showId}: ${msg}`);
      }
    }
  }

  // Send daily digest per org
  for (const [, summary] of Object.entries(summaryByOrg)) {
    if (summary.advanced.length === 0 && summary.escalated.length === 0 && summary.confirmed.length === 0) continue;

    // Get org owner email
    const { data: members } = await supabase
      .from("org_members")
      .select("user_id")
      .eq("org_id", summary.orgId)
      .limit(1);

    if (members && members.length > 0) {
      const { data: userData } = await supabase.auth.admin.getUserById(members[0].user_id);
      const ownerEmail = userData?.user?.email;
      if (ownerEmail) {
        try {
          await resend.emails.send({
            from: "advances@hwy61labs.com",
            to: ownerEmail,
            subject: `TourRouter Advance Digest — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                <h2 style="margin: 0 0 16px 0; font-size: 18px;">TourRouter Advance Digest</h2>
                ${summary.advanced.length > 0 ? `<h3 style="font-size:14px;color:#111;margin:12px 0 6px;">Emails Sent Today</h3><ul style="font-size:13px;color:#444;">${summary.advanced.map((s) => `<li>${s}</li>`).join("")}</ul>` : ""}
                ${summary.escalated.length > 0 ? `<h3 style="font-size:14px;color:#c0392b;margin:12px 0 6px;">Escalated (No Response)</h3><ul style="font-size:13px;color:#c0392b;">${summary.escalated.map((s) => `<li>${s}</li>`).join("")}</ul>` : ""}
                ${summary.confirmed.length > 0 ? `<h3 style="font-size:14px;color:#1a6b3c;margin:12px 0 6px;">Confirmed</h3><ul style="font-size:13px;color:#1a6b3c;">${summary.confirmed.map((s) => `<li>${s}</li>`).join("")}</ul>` : ""}
                <p style="margin-top:24px;font-size:11px;color:#aaa;">TourRouter by HWY61</p>
              </div>
            `,
          });
        } catch { /* digest is best-effort */ }
      }
    }
  }

  return NextResponse.json({
    message: `Advance cron complete`,
    sent: emailsSent.length,
    errors: errors.length,
    details: { emailsSent, errors },
  });
}
