import { NextRequest, NextResponse } from "next/server";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";
import { isAdminEmail } from "@/lib/auth/adminEmails";

const DEAL_MEMO_PROMPT = `You are a music industry deal memo parser. Extract all show information from this deal memo document.

Return ONLY a valid JSON array of show objects. Each object should have these fields (use null if not found):
{
  "date": "YYYY-MM-DD",
  "event": "artist/show name",
  "city": "city name",
  "country": "country",
  "venue": "venue name",
  "offer": "dollar amount as string e.g. $5000",
  "currency": "USD/GBP/EUR/CAD",
  "capacity": number or null,
  "status": "confirmed/pending/offer",
  "doors": "time string",
  "showtime": "time string",
  "promoter": "promoter name",
  "promoterContact": "contact name",
  "productionContact": "production contact",
  "ticketPrice": "ticket price",
  "ageLimit": "age restriction",
  "merch": "merch deal percentage",
  "backend": "backend deal terms",
  "scalingNotes": "ticket scaling info",
  "grossPotential": number or null,
  "specialProvisions": "any special provisions",
  "notes": "other notes"
}

Return ONLY the JSON array, no other text.`;

export async function POST(req: NextRequest) {
  const access = await requireTourRouterAccess();
  if (!access.ok) return tourRouterAccessErrorResponse(access);
  if (!isAdminEmail(access.user.email)) {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Anthropic API key not configured" }, { status: 500 });

  const { pdf_base64 } = await req.json();
  if (!pdf_base64) return NextResponse.json({ error: "pdf_base64 required" }, { status: 400 });

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
        max_tokens: 8000,
        messages: [{
          role: "user",
          content: [
            { type: "document", source: { type: "base64", media_type: "application/pdf", data: pdf_base64 } },
            { type: "text", text: DEAL_MEMO_PROMPT },
          ],
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
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json({ shows: parsed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: "PDF parse failed", details: msg }, { status: 500 });
  }
}
