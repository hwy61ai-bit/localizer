import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";
import { isAdminEmail } from "@/lib/auth/adminEmails";

export async function POST(req: NextRequest) {
  const result = await requireTourRouterAccess();
  if (!result.ok) return tourRouterAccessErrorResponse(result);
  if (!isAdminEmail(result.user.email)) {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }
  const supabase = await supabaseServer();

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Anthropic API key not configured" }, { status: 500 });

  const { origin, destination, date, pax } = await req.json();
  if (!origin || !destination) {
    return NextResponse.json({ error: "origin and destination required" }, { status: 400 });
  }

  const passengerCount = pax || 1;
  const cacheKey = `${origin}-${destination}-${date || ""}-${passengerCount}pax`;

  // Check cache first
  const { data: cached } = await supabase
    .from("flight_price_cache")
    .select("price_usd")
    .eq("cache_key", cacheKey)
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .single();

  if (cached) {
    return NextResponse.json({ price_usd: cached.price_usd, pax: passengerCount, cached: true });
  }

  // Cache miss — call Anthropic with web_search
  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{
          role: "user",
          content: `What is the approximate one-way economy airfare for ${passengerCount} passenger${passengerCount > 1 ? "s" : ""} flying ${origin} to ${destination} around ${date || "soon"}? Give me a single total USD dollar amount only, no explanation. Just the number like: 840`,
        }],
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      return NextResponse.json({ error: "Anthropic API error", details: errBody }, { status: 502 });
    }

    const data = await resp.json();
    const text = data.content
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");
    const matches = text.match(/\$?([\d,]+)/g);
    const lastMatch = matches ? matches[matches.length - 1] : null;
    const priceStr = lastMatch ? lastMatch.replace(/[\$,]/g, "") : null;
    const price = priceStr ? parseInt(priceStr) : null;

    if (!price) {
      return NextResponse.json({ error: "Could not estimate price", raw: text }, { status: 422 });
    }

    // Cache the result
    await supabase.from("flight_price_cache").upsert({
      cache_key: cacheKey,
      origin,
      destination,
      date: date || null,
      pax: passengerCount,
      price_usd: price,
      created_at: new Date().toISOString(),
    }, { onConflict: "cache_key" });

    return NextResponse.json({ price_usd: price, pax: passengerCount, cached: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: "Flight price lookup failed", details: msg }, { status: 500 });
  }
}
