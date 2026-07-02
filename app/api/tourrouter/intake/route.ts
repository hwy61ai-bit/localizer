import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { buildDocumentTypePrompt } from "@/lib/tourrouter/prompts/documentTypePrompt";
import { PARSE_PROMPTS } from "@/lib/tourrouter/prompts/parsePrompts";
import { createNotification } from "@/lib/notifications";
import { requireTourRouterAccess, tourRouterAccessErrorResponse } from "@/lib/tourrouter/requireAccess";
import { isAdminEmail } from "@/lib/auth/adminEmails";

async function callClaude(model: string, max_tokens: number, messages: unknown[]) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("No API key");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    } as Record<string, string>,
    body: JSON.stringify({ model, max_tokens, messages }),
  });
  if (!res.ok) {
    const errData = await res.text();
    throw new Error(errData);
  }
  const data = await res.json();
  return (data.content || [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("");
}

type IntakeResult = {
  documentType: string;
  documentTypeConfidence: number;
  suggestedTypes: string[];
  matchedShowId: string | null;
  matchedShowConfidence: number;
  fields: Record<string, unknown>;
  confidence: Record<string, number>;
  confirmationRequired: string[];
  autoConfirmed: string[];
  reviewRequired: string[];
  storageUrl: string;
};

// Payment-related field names that always require confirmation
const PAYMENT_FIELDS = [
  "offer_amount", "gross_revenue", "net_revenue", "artist_settlement",
  "artist_guarantee", "amount", "hotel_rate", "hotel_block_rate",
  "merch_gross", "merch_commission", "merch_net", "expenses_total",
  "ticket_price", "deposit_amount",
];

export async function POST(req: NextRequest) {
  const access = await requireTourRouterAccess();
  if (!access.ok) return tourRouterAccessErrorResponse(access);
  if (!isAdminEmail(access.user.email)) {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }
  const supabase = await supabaseServer();

  const body = await req.json();
  const { base64, fileType, fileName, tourId, showId } = body;
  if (!base64 || !tourId) return NextResponse.json({ error: "base64 and tourId required" }, { status: 400 });

  // ── Step 0: Extract text from document ──────────────────────
  let extractedText = "";
  const isImage = fileType?.startsWith("image/");
  const isPdf = fileType === "application/pdf";
  const isExcel = fileType?.includes("spreadsheet") || fileType?.includes("excel") || fileName?.endsWith(".xlsx") || fileName?.endsWith(".xls");

  try {
    let contentBlock;
    if (isImage) {
      contentBlock = [
        { type: "image" as const, source: { type: "base64" as const, media_type: fileType as "image/jpeg", data: base64 } },
        { type: "text" as const, text: "Extract ALL text from this document. Return only the raw text, no commentary." },
      ];
    } else if (isPdf) {
      contentBlock = [
        { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 } },
        { type: "text" as const, text: "Extract ALL text from this document. Return only the raw text, no commentary." },
      ];
    } else if (isExcel) {
      const XLSX = require("xlsx");
      const buffer = Buffer.from(base64, "base64");
      const workbook = XLSX.read(buffer, { type: "buffer", raw: true, cellDates: true });
      let text = "";
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        text += `Sheet: ${sheetName}\n`;
        text += XLSX.utils.sheet_to_csv(sheet) + "\n\n";
      }
      contentBlock = [{ type: "text" as const, text: `File: ${fileName}\nContent:\n${text.slice(0, 8000)}` }];
    } else {
      contentBlock = [{ type: "text" as const, text: `File: ${fileName}\nContent (base64 decoded):\n${Buffer.from(base64, "base64").toString("utf-8").slice(0, 8000)}` }];
    }

    extractedText = await callClaude("claude-sonnet-4-20250514", 4096, [{ role: "user", content: contentBlock }]);
  } catch (e) {
    console.error("[Intake] Text extraction failed:", e instanceof Error ? e.message : e, "fileType:", fileType, "fileName:", fileName, "isExcel:", isExcel);
    return NextResponse.json({ error: "Failed to extract text from document" }, { status: 500 });
  }

  if (!extractedText.trim()) {
    return NextResponse.json({ error: "Could not extract text from document" }, { status: 400 });
  }

  // ── Step 1: Detect document type ────────────────────────────
  let documentType = "unknown";
  let documentTypeConfidence = 0;
  let suggestedTypes: string[] = [];

  try {
    const typePrompt = buildDocumentTypePrompt(fileName || "document", extractedText.slice(0, 300));
    const typeRaw = await callClaude("claude-sonnet-4-20250514", 512, [{ role: "user", content: typePrompt }]);
    const typeResult = JSON.parse(typeRaw);
    documentType = typeResult.type || "unknown";
    documentTypeConfidence = typeResult.confidence || 0;
    suggestedTypes = typeResult.suggestedTypes || [];
  } catch (e) {
    console.error("[Intake] Type detection failed:", e);
  }

  // ── Step 2: Match to show ───────────────────────────────────
  let matchedShowId: string | null = showId || null;
  let matchedShowConfidence = showId ? 1.0 : 0;

  if (!matchedShowId) {
    try {
      const { data: shows } = await supabase
        .from("tour_shows")
        .select("id, date_iso, city, venue, event")
        .eq("tour_id", tourId)
        .eq("is_off", false)
        .order("sort_order");

      if (shows && shows.length > 0) {
        const showList = shows.map((s) => `${s.id}|${s.date_iso}|${s.city}|${s.venue}|${s.event}`).join("\n");
        const matchPrompt = `Match this document to one of these shows. The document text mentions dates, venues, or cities that may correspond to a show.

SHOWS (id|date|city|venue|event):
${showList}

DOCUMENT TEXT (first 500 chars):
${extractedText.slice(0, 500)}

Respond ONLY with JSON: { "showId": "<id or null>", "confidence": <0.0-1.0>, "reason": "<why>" }`;

        const matchRaw = await callClaude("claude-sonnet-4-20250514", 256, [{ role: "user", content: matchPrompt }]);
        const matchResult = JSON.parse(matchRaw);
        if (matchResult.showId && matchResult.confidence > 0.5) {
          matchedShowId = matchResult.showId;
          matchedShowConfidence = matchResult.confidence;
        }
      }
    } catch (e) {
      console.error("[Intake] Show matching failed:", e);
    }
  }

  // ── Step 3: Parse document fields ───────────────────────────
  let fields: Record<string, unknown> = {};
  let confidence: Record<string, number> = {};

  if (documentType !== "unknown" && PARSE_PROMPTS[documentType]) {
    try {
      const parsePrompt = PARSE_PROMPTS[documentType](extractedText);
      const parseRaw = await callClaude("claude-sonnet-4-20250514", 4096, [{ role: "user", content: parsePrompt }]);
      const parseResult = JSON.parse(parseRaw);
      fields = parseResult.fields || (parseResult.contacts ? { contacts: parseResult.contacts } : {});
      confidence = parseResult.confidence || {};
    } catch (e) {
      console.error("[Intake] Field parsing failed:", e);
    }
  }

  // ── Categorize fields by confidence ─────────────────────────
  const autoConfirmed: string[] = [];
  const reviewRequired: string[] = [];
  const confirmationRequired: string[] = [];

  for (const [key, val] of Object.entries(fields)) {
    if (val === null || val === undefined || val === "") continue;
    const conf = confidence[key] ?? 0.5;

    // Payment fields always require confirmation
    if (PAYMENT_FIELDS.includes(key)) {
      confirmationRequired.push(key);
    } else if (conf >= 0.95) {
      autoConfirmed.push(key);
    } else if (conf >= 0.75) {
      reviewRequired.push(key);
    } else {
      confirmationRequired.push(key);
    }
  }

  // ── Step 4: Store original file in Supabase Storage ─────────
  let storageUrl = "";
  try {
    const ext = (fileName || "document").split(".").pop() || "pdf";
    const storagePath = `${access.orgId}/${tourId}/${Date.now()}-${fileName || `document.${ext}`}`;
    const buffer = Buffer.from(base64, "base64");

    const { error: uploadError } = await supabase.storage
      .from("tour-documents")
      .upload(storagePath, buffer, { contentType: fileType || "application/octet-stream", upsert: false });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("tour-documents").getPublicUrl(storagePath);
      storageUrl = urlData?.publicUrl || "";
    } else {
      console.error("[Intake] Storage upload failed:", uploadError.message);
    }
  } catch (e) {
    console.error("[Intake] Storage error:", e);
  }

  // ── Notify org members ──────────────────────────────────────
  let notifyBody = `${documentType} parsed`;
  if (matchedShowId) {
    const { data: show } = await supabase
      .from("tour_shows")
      .select("city, venue")
      .eq("id", matchedShowId)
      .single();
    if (show?.city) notifyBody += ` for ${show.city}${show.venue ? ` (${show.venue})` : ""}`;
  }
  createNotification({
    supabase,
    orgId: access.orgId,
    type: "document_parsed",
    title: "Document processed",
    body: notifyBody,
    link: `/dashboard/routing/${tourId}`,
  });

  // ── Return staged result (NEVER writes to DB) ──────────────
  const result: IntakeResult = {
    documentType,
    documentTypeConfidence,
    suggestedTypes,
    matchedShowId,
    matchedShowConfidence,
    fields,
    confidence,
    confirmationRequired,
    autoConfirmed,
    reviewRequired,
    storageUrl,
  };

  return NextResponse.json(result);
}
