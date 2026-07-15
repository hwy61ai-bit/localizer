import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { generatePublicToken } from "@/lib/tokens";
import { destroyRenderAsset } from "@/lib/cloudinary/destroyRenderAsset";

export async function POST(req: NextRequest) {
  const { eventId, orgId, renderUrls } = await req.json();
  if (!eventId || !orgId || !renderUrls) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const supabase = await supabaseServer();

  // Literal list — the guarantee that video URLs can never reach destroyRenderAsset.
  // Never derive from Object.keys(renderUrls).
  const IMAGE_RENDER_COLUMNS = ["render_square_url", "render_story_url", "render_landscape_url"] as const;

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, tour_id")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) {
    return NextResponse.json({ error: "event_not_found" }, { status: 404 });
  }

  const { data: tour } = await supabase
    .from("tours")
    .select("org_id")
    .eq("id", event.tour_id)
    .maybeSingle();

  if (!tour) {
    return NextResponse.json({ error: "event_not_found" }, { status: 404 });
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("org_id", tour.org_id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "not_org_member" }, { status: 403 });
  }

  if (orgId !== tour.org_id) {
    return NextResponse.json({ error: "org_mismatch" }, { status: 403 });
  }

  // Upsert venue_link — same logic as existing generate route
  const { data: existing } = await supabase
    .from("venue_links")
    .select("id, token, render_square_url, render_story_url, render_landscape_url")
    .eq("event_id", eventId)
    .eq("is_active", true)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await supabase
      .from("venue_links")
      .update({ ...renderUrls })
      .eq("id", existing.id)
      .select()
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) {
      console.error("[renders/save-urls] venue_links update returned no row — possible silent RLS rejection", { eventId, orgId, venue_link_id: existing.id });
      return NextResponse.json({ error: "venue_links_update_failed" }, { status: 500 });
    }

    // Old-render cleanup: after a verified successful update, destroy any
    // image render assets we just replaced. Fire-and-forget-with-log —
    // destroy failures must NEVER change the response.
    for (const col of IMAGE_RENDER_COLUMNS) {
      if (!(col in renderUrls)) continue;
      const oldUrl = (existing as Record<string, unknown>)[col];
      const newUrl = (renderUrls as Record<string, unknown>)[col];
      if (typeof oldUrl !== "string" || oldUrl.length === 0) continue;
      if (oldUrl === newUrl) continue;
      try {
        const result = await destroyRenderAsset(oldUrl);
        if (!result.ok) {
          console.error("[save-urls] old render destroy failed", { column: col, eventId, orgId, error: result.error });
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("[save-urls] old render destroy failed", { column: col, eventId, orgId, error: message });
      }
    }
  } else {
    const token = generatePublicToken();
    const { error } = await supabase.from("venue_links").insert({
      org_id: orgId,
      event_id: eventId,
      token,
      is_active: true,
      ...renderUrls,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mark event as ready
  const { data: eventUpdate, error: eventUpdateErr } = await supabase
    .from("events")
    .update({ render_status: "ready", needs_rerender: false })
    .eq("id", eventId)
    .select()
    .maybeSingle();
  if (eventUpdateErr) {
    console.error("[renders/save-urls] events update errored", { eventId, orgId, error: eventUpdateErr.message });
  } else if (!eventUpdate) {
    console.error("[renders/save-urls] events render_status update returned no row — possible silent RLS rejection (non-fatal, venue_links already saved)", { eventId, orgId });
  }

  return NextResponse.json({ ok: true });
}
