import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createNotification } from "@/lib/notifications";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, data } = body;

  if (!type || !data) {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const emailId = data.email_id;

  if (!emailId) return NextResponse.json({ ok: true });

  // Find the advance_email record by resend_id
  const { data: record } = await supabase
    .from("advance_emails")
    .select("id, show_id, org_id, tour_id")
    .eq("resend_id", emailId)
    .maybeSingle();

  if (!record) {
    // Not an advance email, ignore
    return NextResponse.json({ ok: true });
  }

  const now = new Date().toISOString();

  switch (type) {
    case "email.delivered":
      await supabase.from("advance_emails").update({ status: "delivered", delivered_at: now }).eq("id", record.id);
      break;

    case "email.opened":
      await supabase.from("advance_emails").update({ status: "opened", opened_at: now }).eq("id", record.id);
      break;

    case "email.clicked":
      await supabase.from("advance_emails").update({ status: "clicked", clicked_at: now }).eq("id", record.id);
      break;

    case "email.bounced":
      await supabase.from("advance_emails").update({ status: "bounced", bounced_at: now }).eq("id", record.id);
      // Escalate the show
      await supabase.from("tour_shows").update({
        advance_status: "email_bounced",
        advance_escalated: true,
        advance_notes: `Email bounced at ${now}`,
      }).eq("id", record.show_id);
      // Notify org members
      if (record.org_id && record.tour_id) {
        const { data: show } = await supabase
          .from("tour_shows")
          .select("venue, city")
          .eq("id", record.show_id)
          .single();
        const venue = show?.venue || "Unknown venue";
        createNotification({
          supabase,
          orgId: record.org_id,
          type: "advance_bounced",
          title: "Email bounced",
          body: `Advance email bounced for ${venue}${show?.city ? ` (${show.city})` : ""}`,
          link: `/dashboard/routing/${record.tour_id}`,
        });
      }
      break;

    case "email.complained":
      await supabase.from("advance_emails").update({ status: "complained" }).eq("id", record.id);
      // Stop all future emails to this show
      await supabase.from("tour_shows").update({
        advance_auto_stop: true,
        advance_notes: `Recipient marked as spam at ${now}. Auto-stop enabled.`,
      }).eq("id", record.show_id);
      break;
  }

  return NextResponse.json({ ok: true });
}
