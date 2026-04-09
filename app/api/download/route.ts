import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { getLocalizerAccessLevel } from "@/lib/localizer/billingGate";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const filename = req.nextUrl.searchParams.get("filename") ?? "asset";
  const token = req.nextUrl.searchParams.get("token");

  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  // Resolve the venue_link for this token and load its render_*_url allow-list.
  // The url query param must match one of the render_*_url columns on the row,
  // which scopes this proxy to legitimate per-share assets and closes the
  // pre-existing open-proxy behavior.
  const supabase = await supabaseServer();
  const { data: link } = await supabase
    .from("venue_links")
    .select("org_id, render_square_url, render_story_url, render_landscape_url, render_poster_url, render_tiktok_url, render_yt_shorts_url")
    .eq("token", token)
    .maybeSingle();

  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

  // Paid gate by link owner. Same pattern as /api/download-all — no userEmail
  // passed so admin bypass is deliberately off for the venue-facing flow.
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
