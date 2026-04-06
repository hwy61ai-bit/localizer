import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseServer } from "@/lib/supabaseServer";

const client = new Anthropic();

export async function POST(request: Request) {
  try {
    // Auth: require logged-in user with org membership
    const supabase = await supabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const { data: profile } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!profile?.org_id) return NextResponse.json({ error: "no_org" }, { status: 403 });

    const { base64, filename, mimeType } = await request.json();

    if (!base64 || !filename) {
      return NextResponse.json({ error: "Missing file data." }, { status: 400 });
    }

    const ext = filename.split(".").pop()?.toLowerCase();
    let extractedText = "";

    if (ext === "xlsx" || ext === "xls") {
      const XLSX = await import("xlsx");
      const buffer = Buffer.from(base64, "base64");
      const wb = XLSX.read(buffer, { type: "buffer", raw: true, cellDates: true });
      const lines: string[] = [];
      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(ws, { FS: "\t", RS: "\n" });
        lines.push(csv);
      }
      extractedText = lines.join("\n\n");
    } else if (ext === "docx" || ext === "doc") {
      const mammoth = await import("mammoth");
      const buffer = Buffer.from(base64, "base64");
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (ext === "pdf" || ["jpg", "jpeg", "png", "gif", "webp"].includes(ext ?? "")) {
      const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext ?? "");
      const mediaType = isImage ? mimeType : "application/pdf";

      const message = await client.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: isImage
              ? [
                  {
                    type: "image" as const,
                    source: {
                      type: "base64" as const,
                      media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                      data: base64,
                    },
                  },
                  {
                    type: "text" as const,
                    text: "Extract all text from this file exactly as it appears. Return only the raw text, no commentary.",
                  },
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
                  {
                    type: "text" as const,
                    text: "Extract all text from this file exactly as it appears. Return only the raw text, no commentary.",
                  },
                ],
          },
        ],
      });

      extractedText = message.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { type: "text"; text: string }).text)
        .join("");
    } else {
      return NextResponse.json({ error: `Unsupported file type: .${ext}` }, { status: 400 });
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: "Could not extract any text from this file." }, { status: 422 });
    }

    return NextResponse.json({ text: extractedText });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Extraction failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
