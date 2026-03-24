import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { generatePublicToken } from "@/lib/tokens";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const supabase = await supabaseServer();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { showId, recipientEmail, recipientName, emailType } = await req.json();
  if (!showId || !recipientEmail) {
    return NextResponse.json({ error: "showId and recipientEmail required" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile?.org_id) return NextResponse.json({ error: "No org" }, { status: 403 });

  // Fetch show with tour info
  const { data: show } = await supabase
    .from("tour_shows")
    .select("*, tours_routing(name, artist_id, artists(name))")
    .eq("id", showId)
    .eq("org_id", profile.org_id)
    .single();
  if (!show) return NextResponse.json({ error: "Show not found" }, { status: 404 });

  // Generate or reuse advance_form_token
  let token = show.advance_form_token;
  if (!token) {
    token = generatePublicToken();
    await supabase
      .from("tour_shows")
      .update({ advance_form_token: token })
      .eq("id", showId);
  }

  const tourData = show.tours_routing as Record<string, unknown> | null;
  const artistData = (tourData?.artists as Record<string, unknown>) || null;
  const artistName = (artistData?.name as string) || (tourData?.name as string) || "Artist";
  const venueName = show.venue || "Venue";
  const city = show.city || "";
  const showDate = show.date_iso || "";

  let formattedDate = showDate;
  if (showDate) {
    try {
      const d = new Date(showDate + "T12:00:00");
      formattedDate = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    } catch { /* use raw */ }
  }

  const advanceLink = `${process.env.NEXT_PUBLIC_APP_URL}/advance/${token}`;

  const subjectMap: Record<string, string> = {
    initial: `Advance Information Request — ${artistName} @ ${venueName}`,
    followup: `Follow-up: Advance Info Needed — ${artistName} @ ${venueName}`,
    final: `Final Request: Advance Info — ${artistName} @ ${venueName}`,
  };
  const subject = subjectMap[emailType || "initial"] || subjectMap.initial;

  const greeting = recipientName ? `Hi ${recipientName},` : "Hi,";
  const urgency = emailType === "final"
    ? `<p style="color:#c0392b;font-weight:700;font-size:14px;">This is our final request before the show date. Please submit as soon as possible.</p>`
    : emailType === "followup"
    ? `<p style="color:#b35c00;font-size:14px;">This is a follow-up to our earlier advance request. Please submit at your earliest convenience.</p>`
    : "";

  try {
    await resend.emails.send({
      from: "noreply@hwy61.ai",
      to: recipientEmail.split(",").map((e: string) => e.trim()).filter(Boolean),
      subject,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; padding: 40px 32px; border-radius: 12px;">
          <p style="font-size: 11px; font-weight: 700; color: #555; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 16px 0;">Advance Information Request</p>
          <h1 style="font-family: 'Bebas Neue', Impact, sans-serif; font-size: 48px; font-weight: 400; color: #ffffff; margin: 0 0 8px 0; line-height: 1; letter-spacing: 2px;">${artistName.toUpperCase()}</h1>
          <div style="border-top: 1px solid #222; margin: 20px 0;"></div>
          <p style="color: #888; font-size: 14px; margin: 0 0 4px 0;">${formattedDate}</p>
          <p style="color: #888; font-size: 14px; margin: 0 0 24px 0;">${venueName}${city ? ", " + city : ""}</p>
          <p style="color: #ccc; font-size: 14px; margin: 0 0 8px 0;">${greeting}</p>
          <p style="color: #ccc; font-size: 14px; margin: 0 0 16px 0;">Please fill out the advance information form for the upcoming show. This helps us prepare for a smooth load-in and performance.</p>
          ${urgency}
          <a href="${advanceLink}" style="display: inline-block; padding: 14px 28px; background: #ffffff; color: #000000; text-decoration: none; border-radius: 8px; font-weight: 900; font-size: 14px; letter-spacing: 0.05em; margin-top: 8px;">
            FILL OUT ADVANCE FORM →
          </a>
          <p style="margin-top: 40px; font-size: 11px; color: #444;">
            Powered by TourRouter
          </p>
        </div>
      `,
    });

    // Update show advance status
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = {
      advance_status: emailType === "followup" ? "followup_sent" : emailType === "final" ? "final_sent" : "sent",
      advance_sent_at: now,
      advance_recipient_email: recipientEmail,
      advance_recipient_name: recipientName || null,
    };
    await supabase.from("tour_shows").update(updates).eq("id", showId);

    return NextResponse.json({ ok: true, token, advanceLink });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Email send failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
