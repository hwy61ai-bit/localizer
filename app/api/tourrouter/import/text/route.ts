import { NextRequest, NextResponse } from "next/server";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";

const ROUTE_SHEET_PROMPT = `You are a music industry route sheet parser. Extract all show information from this document text.

Return ONLY a valid JSON array of show objects. Each object should have these fields (use null if not found):
{
  "date": "YYYY-MM-DD",
  "city": "city name",
  "venue": "venue name",
  "offer": "dollar amount as string e.g. $5000",
  "status": "confirmed/pending/offer",
  "promoter": "promoter name",
  "notes": "other notes"
}

Return ONLY the JSON array, no other text.`;

export async function POST(req: NextRequest) {
  const access = await requireTourRouterAccess();
  if (!access.ok) return tourRouterAccessErrorResponse(access);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  const { text_content } = await req.json();
  if (!text_content) return NextResponse.json({ error: "text_content required" }, { status: 400 });

  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      } as Record<string, string>,
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        messages: [{
          role: "user",
          content: ROUTE_SHEET_PROMPT + "\n\nDOCUMENT:\n" + text_content.slice(0, 8000),
        }],
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      return NextResponse.json({ error: "API error", details: errBody }, { status: 502 });
    }

    const data = await resp.json();
    const text = data.content
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json({ shows: parsed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: "Parse failed", details: msg }, { status: 500 });
  }
}
