import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import Anthropic from "@anthropic-ai/sdk";
import { buildDocumentTypePrompt } from "@/lib/tourrouter/prompts/documentTypePrompt";
import { PARSE_PROMPTS } from "@/lib/tourrouter/prompts/parsePrompts";
import { createNotification } from "@/lib/notifications";

const client = new Anthropic();

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
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership?.org_id) return NextResponse.json({ error: "No org" }, { status: 403 });

  const body = await req.json();
  const { base64, fileType, fileName, tourId, showId } = body;
  if (!base64 || !tourId) return NextResponse.json({ error: "base64 and tourId required" }, { status: 400 });

  // ── Step 0: Extract text from document ──────────────────────
  let extractedText = "";
  const isImage = fileType?.startsWith("image/");
  const isPdf = fileType === "application/pdf";

  try {
    const contentBlock = isImage
      ? [
          { type: "image" as const, source: { type: "base64" as const, media_type: fileType as "image/jpeg", data: base64 } },
          { type: "text" as const, text: "Extract ALL text from this document. Return only the raw text, no commentary." },
        ]
      : isPdf
        ? [
            { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 } },
            { type: "text" as const, text: "Extract ALL text from this document. Return only the raw text, no commentary." },
          ]
        : [{ type: "text" as const, text: `File: ${fileName}\nContent (base64 decoded):\n${Buffer.from(base64, "base64").toString("utf-8").slice(0, 8000)}` }];

    const extractMsg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: contentBlock }],
    });
    extractedText = extractMsg.content.filter((b) => b.type === "text").map((b) => (b as { type: "text"; text: string }).text).join("");
  } catch (e) {
    console.error("[Intake] Text extraction failed:", e);
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
    const typeMsg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [{ role: "user", content: typePrompt }],
    });
    const typeRaw = typeMsg.content.filter((b) => b.type === "text").map((b) => (b as { type: "text"; text: string }).text).join("");
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

        const matchMsg = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 256,
          messages: [{ role: "user", content: matchPrompt }],
        });
        const matchRaw = matchMsg.content.filter((b) => b.type === "text").map((b) => (b as { type: "text"; text: string }).text).join("");
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
      const parseMsg = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [{ role: "user", content: parsePrompt }],
      });
      const parseRaw = parseMsg.content.filter((b) => b.type === "text").map((b) => (b as { type: "text"; text: string }).text).join("");
      const parseResult = JSON.parse(parseRaw);
      fields = parseResult.fields || parseResult.contacts ? { contacts: parseResult.contacts } : {};
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
    const storagePath = `${membership.org_id}/${tourId}/${Date.now()}-${fileName || `document.${ext}`}`;
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
    orgId: membership.org_id,
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
