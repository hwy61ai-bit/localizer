// Venue-facing, token-gated. W-9 downloads are access-logged (verified insert —
// log failure fails the download). Handles both legacy public URLs (pre-B4) and
// private advance-docs paths.
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getLocalizerAccessLevel } from "@/lib/localizer/billingGate";

export const dynamic = "force-dynamic";

const ADV_FIELD_IDS = [
  "adv_stage_plot_url",
  "adv_hospitality_url",
  "adv_foh_url",
  "adv_w9_url",
] as const;
type AdvFieldId = (typeof ADV_FIELD_IDS)[number];

const BUCKET = "advance-docs";
const SIGNED_URL_TTL_SECONDS = 60;

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    const fieldIdRaw = req.nextUrl.searchParams.get("fieldId");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }
    if (!fieldIdRaw || !ADV_FIELD_IDS.includes(fieldIdRaw as AdvFieldId)) {
      return NextResponse.json({ error: "Invalid fieldId" }, { status: 400 });
    }
    const fieldId = fieldIdRaw as AdvFieldId;

    const supabase = supabaseAdmin();

    // ── Token → venue_link (also checks is_active — download-all omits it,
    // the venue page checks it; we fail closed on revoked links) ──
    const { data: link } = await supabase
      .from("venue_links")
      .select("event_id, org_id, is_active")
      .eq("token", token)
      .maybeSingle();

    if (!link || !link.is_active) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // ── Paid gate — no admin/email bypass on venue-facing routes ──
    const level = await getLocalizerAccessLevel(link.org_id);
    if (level !== "paid") {
      return NextResponse.json(
        {
          error: "download_requires_paid",
          message: "Downloading assets requires a paid Localizer subscription.",
        },
        { status: 402 },
      );
    }

    // ── event → tour → artist chain ──
    const { data: event } = await supabase
      .from("events")
      .select("id, tour_id")
      .eq("id", link.event_id)
      .maybeSingle();
    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: tour } = await supabase
      .from("tours")
      .select("artist_id")
      .eq("id", event.tour_id)
      .maybeSingle();
    if (!tour) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: artistRow } = await supabase
      .from("artists")
      .select(fieldId)
      .eq("id", tour.artist_id)
      .maybeSingle();
    if (!artistRow) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const artist = artistRow as Record<AdvFieldId, string | null>;
    const rawValue = artist[fieldId];

    if (!rawValue || rawValue.trim() === "") {
      return NextResponse.json(
        { error: "Document not uploaded" },
        { status: 404 },
      );
    }

    // ── W-9 access log (verified insert — a log failure FAILS the download) ──
    // Rationale: the log is the compliance artifact for W-9 access. An unlogged
    // W-9 download must not happen. Rule-6 verification (.select().maybeSingle())
    // catches silent RLS rejections — a `{data: null, error: null}` from the
    // insert would otherwise fall through and hand out the file untracked.
    if (fieldId === "adv_w9_url") {
      const xff = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
      const ip = xff || req.headers.get("x-real-ip") || null;
      const userAgent = req.headers.get("user-agent") ?? null;

      const { data: logged, error: logErr } = await supabase
        .from("advance_doc_access_log")
        .insert({
          venue_link_token: token,
          artist_id: tour.artist_id,
          event_id: event.id,
          doc_type: fieldId,
          ip,
          user_agent: userAgent,
        })
        .select("id")
        .maybeSingle();

      if (logErr || !logged) {
        console.error(
          "[advance-doc] W-9 access log write failed — refusing download.",
          {
            token,
            artistId: tour.artist_id,
            eventId: event.id,
            err: logErr?.message,
          },
        );
        return NextResponse.json(
          { error: "Unable to record access" },
          { status: 500 },
        );
      }
    }

    // ── Resolve the file (dual-form: legacy http URL vs private path) ──
    // Post-B2 uploads store bare paths in advance-docs. Pre-B4 legacy rows
    // still hold public localizer-assets URLs; those files remain public
    // until migrated, so a 302 to the stored URL keeps behavior identical
    // for unmigrated rows.
    if (rawValue.startsWith("http")) {
      return NextResponse.redirect(rawValue, 302);
    }

    const { data: signed, error: signErr } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(rawValue, SIGNED_URL_TTL_SECONDS);

    if (signErr || !signed?.signedUrl) {
      console.error(
        "[advance-doc] createSignedUrl failed:",
        signErr?.message,
        { path: rawValue },
      );
      return NextResponse.json(
        { error: "Unable to generate download link" },
        { status: 500 },
      );
    }

    return NextResponse.redirect(signed.signedUrl, 302);
  } catch (err: any) {
    console.error("[advance-doc] Unexpected error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Download failed" },
      { status: 500 },
    );
  }
}
