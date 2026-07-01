import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseServer } from "@/lib/supabaseServer";
import { checkRateLimit } from "@/lib/rateLimit";

const client = new Anthropic();

const SYSTEM_PROMPT = "You are extracting information from a US IRS Form W-9. Return ONLY a JSON object with these exact keys, no preamble, no markdown fences. Use null for any field you cannot find.";

const USER_PROMPT = `Extract the following from this W-9:
- legalName (line 1, "Name as shown on your income tax return")
- dba (line 2, "Business name/disregarded entity name, if different from above")
- entityType (the federal tax classification checkbox that is checked — use one of: "Individual/Sole Proprietor", "C Corporation", "S Corporation", "Partnership", "Trust/Estate", "LLC", "Other". For LLC, if a tax classification letter is filled in (C/S/P), append it like "LLC (S)")
- address (combine the address line, city, state, and ZIP into a single comma-separated string like "123 Main St, Austin, TX 78701")
- ein (the EIN from Part I — format as XX-XXXXXXX)

Return JSON: { "legalName": ..., "dba": ..., "entityType": ..., "address": ..., "ein": ... }`;

type W9Fields = {
  legalName: string | null;
  dba: string | null;
  entityType: string | null;
  address: string | null;
  ein: string | null;
};

function coerce(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  return s ? s : null;
}

export async function POST(request: Request) {
  try {
    // Auth
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    const { data: profile } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profile?.org_id) return NextResponse.json({ ok: false, error: "no_org" }, { status: 403 });

    const rl = await checkRateLimit(`parse-w9:${profile.org_id}`);
    if (!rl.success) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please wait a moment and try again." },
        {
          status: 429,
          headers: rl.reset
            ? { "Retry-After": String(Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000))) }
            : undefined,
        }
      );
    }

    const { base64, filename, mimeType } = await request.json();
    if (!base64 || !filename) {
      return NextResponse.json({ ok: false, error: "Missing file data." }, { status: 400 });
    }

    const isPdf = mimeType === "application/pdf";
    const isImage = typeof mimeType === "string" && mimeType.startsWith("image/");
    if (!isPdf && !isImage) {
      return NextResponse.json({ ok: false, error: "Unsupported file type — must be PDF or image." }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: isImage
            ? [
                {
                  type: "image" as const,
                  source: {
                    type: "base64" as const,
                    media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                    data: base64,
                  },
                },
                { type: "text" as const, text: USER_PROMPT },
              ]
            : [
                {
                  type: "document" as const,
                  source: {
                    type: "base64" as const,
                    media_type: "application/pdf" as const,
                    data: base64,
                  },
                },
                { type: "text" as const, text: USER_PROMPT },
              ],
        },
      ],
    });

    const rawText = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("")
      .trim();

    // Strip markdown fences if present
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[parse-w9] JSON parse failed. Raw:", rawText);
      return NextResponse.json({ ok: false, error: "Could not parse W-9 response" }, { status: 500 });
    }

    const fields: W9Fields = {
      legalName: coerce(parsed.legalName),
      dba: coerce(parsed.dba),
      entityType: coerce(parsed.entityType),
      address: coerce(parsed.address),
      ein: coerce(parsed.ein),
    };

    return NextResponse.json({ ok: true, fields });
  } catch (err: unknown) {
    console.error("[parse-w9]", err);
    const message = err instanceof Error ? err.message : "W-9 parse failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
