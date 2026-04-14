import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getLocalizerAccessLevel } from "@/lib/localizer/billingGate";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const filename = req.nextUrl.searchParams.get("filename") ?? "asset";
  const token = req.nextUrl.searchParams.get("token");
  const eventId = req.nextUrl.searchParams.get("eventId");

  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  if (!eventId) return NextResponse.json({ error: "Missing eventId" }, { status: 400 });

  const supabase = await supabaseServer();

  // 1. Validate marketing token (tour-scoped)
  const { data: marketingToken } = await supabase
    .from("marketing_tokens")
    .select("tour_id, org_id, expires_at, revoked_at")
    .eq("token", token)
    .maybeSingle();

  if (!marketingToken) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (marketingToken.revoked_at) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (marketingToken.expires_at && new Date(marketingToken.expires_at) <= new Date())
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 2. Load event and verify tour_id match
  const { data: event } = await supabase
    .from("events")
    .select("id, tour_id")
    .eq("id", eventId)
    .single();

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (event.tour_id !== marketingToken.tour_id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 3. Fetch venue_links by event_id for the allow-list
  const { data: link } = await supabase
    .from("venue_links")
    .select("render_square_url, render_story_url, render_landscape_url, render_poster_url, render_tiktok_url, render_yt_shorts_url")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 4. Allow-list check — requested url must match a render_*_url column
  const allowedUrls = new Set(
    [
      link.render_square_url,
      link.render_story_url,
      link.render_landscape_url,
      link.render_poster_url,
      link.render_tiktok_url,
      link.render_yt_shorts_url,
    ].filter((u): u is string => typeof u === "string" && u.length > 0),
  );

  if (!allowedUrls.has(url)) {
    return NextResponse.json({ error: "url_not_allowed" }, { status: 403 });
  }

  // 5. Paid gate by token owner org
  const level = await getLocalizerAccessLevel(marketingToken.org_id);
  if (level !== "paid") {
    return NextResponse.json(
      {
        error: "download_requires_paid",
        message: "Downloading assets requires a paid Localizer subscription.",
      },
      { status: 402 },
    );
  }

  // 6. Update last_used_at on the marketing token
  await supabase
    .from("marketing_tokens")
    .update({ last_used_at: new Date().toISOString() })
    .eq("token", token)
    .select()
    .maybeSingle();

  // 7. Proxy the fetch
  const res = await fetch(url);
  if (!res.ok) return NextResponse.json({ error: "Failed to fetch asset" }, { status: 502 });

  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "application/octet-stream";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
