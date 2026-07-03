// New uploads store bare private-bucket paths; legacy rows still hold public
// localizer-assets URLs until the B4 migration. Consumers distinguish by http prefix.
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { checkRateLimit } from "@/lib/rateLimit";

const ADV_FIELD_IDS = [
  "adv_stage_plot_url",
  "adv_hospitality_url",
  "adv_foh_url",
  "adv_w9_url",
] as const;
type AdvFieldId = (typeof ADV_FIELD_IDS)[number];

// Extension → allowed MIME types. Both must match; the extension is what we
// persist in the storage path, the MIME check catches renamed files.
const ALLOWED_EXT: Record<string, string[]> = {
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
  xls: ["application/vnd.ms-excel"],
  xlsx: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
};

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const BUCKET = "advance-docs";
const LEGACY_BUCKET = "localizer-assets";
const LEGACY_PUBLIC_PREFIX_RE =
  /\/storage\/v1\/object\/public\/localizer-assets\/(.+?)(?:\?|$)/;

export async function POST(
  req: NextRequest,
  { params }: { params: { artistId: string } },
) {
  try {
    const { artistId } = params;

    const formData = await req.formData();
    const file = formData.get("file");
    const fieldIdRaw = formData.get("fieldId");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (
      typeof fieldIdRaw !== "string" ||
      !ADV_FIELD_IDS.includes(fieldIdRaw as AdvFieldId)
    ) {
      return NextResponse.json({ error: "Invalid fieldId" }, { status: 400 });
    }
    const fieldId = fieldIdRaw as AdvFieldId;

    // ── Auth: user session ──────────────────────────────────────
    const supabase = await supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Resolve org from artist row + capture the field's current value ──
    // The current value is needed later to clean up a legacy public URL if the
    // upload replaces a pre-migration file.
    const { data: artistRow } = await supabase
      .from("artists")
      .select(`org_id, ${fieldId}`)
      .eq("id", artistId)
      .maybeSingle();

    if (!artistRow) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }

    const artist = artistRow as { org_id: string } & Record<AdvFieldId, string | null>;
    const previousValue = artist[fieldId];

    // ── Membership check ────────────────────────────────────────
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", user.id)
      .eq("org_id", artist.org_id)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this org" },
        { status: 403 },
      );
    }

    // ── Rate limit (after auth — don't burn budget on 401s) ─────
    const rl = await checkRateLimit(`adv-doc-upload:${artist.org_id}`);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again." },
        {
          status: 429,
          headers: rl.reset
            ? {
                "Retry-After": String(
                  Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000)),
                ),
              }
            : undefined,
        },
      );
    }

    // ── File validation ────────────────────────────────────────
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File is too large — maximum size is 10MB." },
        { status: 400 },
      );
    }

    const extRaw = (file.name || "").split(".").pop()?.toLowerCase() ?? "";
    const allowedMimes = ALLOWED_EXT[extRaw];
    if (!allowedMimes) {
      return NextResponse.json(
        {
          error:
            "Unsupported file type — allowed: PDF, DOC/DOCX, JPG/JPEG/PNG, XLS/XLSX.",
        },
        { status: 400 },
      );
    }
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json(
        { error: "File extension does not match its actual type." },
        { status: 400 },
      );
    }

    // ── Storage write (private bucket — service role required) ─
    // Auth + membership were verified above; admin client is used solely
    // for the elevated storage capability, not to bypass access control.
    const admin = supabaseAdmin();
    const storagePath = `${artistId}/advance/${fieldId}.${extRaw}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[adv-doc-upload] Storage upload failed:", uploadError.message);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    // ── Stale-extension cleanup (best-effort) ──────────────────
    // If the previous upload for this field used a different extension
    // (e.g. .pdf replaced by .jpg), the old file would otherwise linger.
    try {
      const { data: siblings } = await admin.storage
        .from(BUCKET)
        .list(`${artistId}/advance`, { limit: 100 });
      if (siblings?.length) {
        const orphans = siblings
          .filter(
            (f) =>
              f.name.startsWith(`${fieldId}.`) &&
              f.name !== `${fieldId}.${extRaw}`,
          )
          .map((f) => `${artistId}/advance/${f.name}`);
        if (orphans.length) {
          await admin.storage.from(BUCKET).remove(orphans);
        }
      }
    } catch (cleanupErr) {
      console.warn(
        "[adv-doc-upload] Stale-extension cleanup failed (non-fatal):",
        cleanupErr,
      );
    }

    // ── DB write with rule-6 verification ──────────────────────
    const { data: updated } = await supabase
      .from("artists")
      .update({ [fieldId]: storagePath })
      .eq("id", artistId)
      .select("id")
      .maybeSingle();

    if (!updated) {
      console.error(
        "[adv-doc-upload] DB update returned no row — possible silent RLS rejection. Cleaning up storage.",
        { artistId, fieldId, orgId: artist.org_id, userId: user.id },
      );
      await admin.storage.from(BUCKET).remove([storagePath]).catch(() => {});
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    // ── Legacy cleanup (best-effort) ───────────────────────────
    // Legacy cleanup: re-uploading over a pre-migration doc deletes the old
    // PUBLIC copy, closing its exposure immediately and preventing an orphan
    // that B4's DB-driven migration would never find.
    if (typeof previousValue === "string" && previousValue.startsWith("http")) {
      try {
        const match = previousValue.match(LEGACY_PUBLIC_PREFIX_RE);
        if (match) {
          await admin.storage.from(LEGACY_BUCKET).remove([match[1]]);
        }
      } catch (legacyErr) {
        console.warn(
          "[adv-doc-upload] Legacy public-bucket cleanup failed (non-fatal):",
          legacyErr,
        );
      }
    }

    return NextResponse.json({ ok: true, path: storagePath });
  } catch (err: any) {
    console.error("[adv-doc-upload] Unexpected error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Upload failed" },
      { status: 500 },
    );
  }
}
