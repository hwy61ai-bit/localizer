// TEMPORARY B4 migration route — delete after the migration is verified.
// Runs idempotently; safe to re-run.
//
// Migrates the four fixed advance-doc columns (adv_stage_plot_url,
// adv_hospitality_url, adv_foh_url, adv_w9_url) from public localizer-assets
// URLs to bare paths in the private advance-docs bucket. Custom materials
// (adv_custom_materials) are NOT touched — they stay public per the launch spec.
//
// Gating mirrors app/api/admin/delete-org/route.ts: session admin (production
// only) + bearer secret (both required in prod). dryRun defaults TRUE.
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isAdminEmail } from "@/lib/auth/adminEmails";

export const dynamic = "force-dynamic";

const LEGACY_BUCKET = "localizer-assets";
const PRIVATE_BUCKET = "advance-docs";
const LEGACY_PUBLIC_PREFIX_RE =
  /\/storage\/v1\/object\/public\/localizer-assets\/(.+?)(?:\?|$)/;

const ADV_FIELD_IDS = [
  "adv_stage_plot_url",
  "adv_hospitality_url",
  "adv_foh_url",
  "adv_w9_url",
] as const;
type AdvFieldId = (typeof ADV_FIELD_IDS)[number];

type ArtistRow = {
  id: string;
  name: string | null;
} & Record<AdvFieldId, string | null>;

type PlannedEntry = {
  artistId: string;
  artistName: string | null;
  field: AdvFieldId;
  from: string;
  to: string;
};

type ErrorEntry = {
  artistId: string;
  field: AdvFieldId;
  reason: string;
};

type WarningEntry = {
  artistId: string;
  field: AdvFieldId;
  warning: string;
};

export async function POST(req: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";

  // Layer 1: authenticated admin session (production only; dev bypasses to let
  // the bearer secret alone authorize — matches delete-org's dev pattern).
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!isDev) {
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  // Layer 2: bearer secret. Missing env var → 500 (misconfiguration).
  // Header mismatch → 401 (caller wrong).
  const expected = process.env.ADMIN_MIGRATE_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_MIGRATE_SECRET not configured" },
      { status: 500 },
    );
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Parse body — dryRun defaults TRUE
  const body = await req.json().catch(() => ({}));
  const dryRun = (body as { dryRun?: boolean }).dryRun ?? true;

  const admin = supabaseAdmin();

  // 1. Pull artists with at least one fixed adv field set. Small enough at
  // launch scale (~tens of rows) that fetching all and filtering client-side
  // is simpler than composing a PostgREST .or() filter.
  const { data: artistsData, error: fetchError } = await admin
    .from("artists")
    .select("id, name, adv_stage_plot_url, adv_hospitality_url, adv_foh_url, adv_w9_url");

  if (fetchError) {
    return NextResponse.json(
      { error: `Failed to load artists: ${fetchError.message}` },
      { status: 500 },
    );
  }

  const rawArtists = (artistsData ?? []) as unknown as ArtistRow[];
  const artists = rawArtists.filter((a) =>
    ADV_FIELD_IDS.some((f) => !!a[f]),
  );

  const planned: PlannedEntry[] = [];
  const migrated: PlannedEntry[] = [];
  const errors: ErrorEntry[] = [];
  const warnings: WarningEntry[] = [];
  let skippedAlreadyPrivate = 0;

  for (const artist of artists) {
    for (const field of ADV_FIELD_IDS) {
      const value = artist[field];
      if (!value) continue;

      // Idempotency: already-migrated rows hold bare paths, not http URLs.
      if (!value.startsWith("http")) {
        skippedAlreadyPrivate++;
        continue;
      }

      const match = value.match(LEGACY_PUBLIC_PREFIX_RE);
      if (!match) {
        errors.push({
          artistId: artist.id,
          field,
          reason: `Unparseable legacy URL: ${value}`,
        });
        continue;
      }
      const sourcePath = match[1];
      const ext = sourcePath.split(".").pop() || "pdf";
      const destPath = `${artist.id}/advance/${field}.${ext}`;

      if (dryRun) {
        planned.push({
          artistId: artist.id,
          artistName: artist.name,
          field,
          from: sourcePath,
          to: destPath,
        });
        continue;
      }

      // ── LIVE RUN ──

      // a. Download the legacy file bytes from localizer-assets.
      const { data: legacyBlob, error: dlErr } = await admin.storage
        .from(LEGACY_BUCKET)
        .download(sourcePath);
      if (dlErr || !legacyBlob) {
        errors.push({
          artistId: artist.id,
          field,
          reason: `Download from ${LEGACY_BUCKET} failed: ${dlErr?.message ?? "no data"}`,
        });
        continue;
      }

      // b. Upload to advance-docs at the destination path.
      const contentType = legacyBlob.type || undefined;
      const { error: upErr } = await admin.storage
        .from(PRIVATE_BUCKET)
        .upload(destPath, legacyBlob, {
          upsert: true,
          contentType,
        });
      if (upErr) {
        errors.push({
          artistId: artist.id,
          field,
          reason: `Upload to ${PRIVATE_BUCKET} failed: ${upErr.message}`,
        });
        continue;
      }

      // c. Verify the private copy exists (createSignedUrl is the cheapest
      // positive proof — round-trips the storage server, returns null on miss).
      const { data: signed, error: signErr } = await admin.storage
        .from(PRIVATE_BUCKET)
        .createSignedUrl(destPath, 60);
      if (signErr || !signed?.signedUrl) {
        errors.push({
          artistId: artist.id,
          field,
          reason: `Verify (createSignedUrl) failed: ${signErr?.message ?? "no signed URL"}`,
        });
        continue;
      }

      // d. Update the artist row with rule-6 verification. On failure the
      // public file is intentionally left in place — the private copy without
      // a DB pointer is a recoverable orphan; the reverse is broken production.
      const { data: updated } = await admin
        .from("artists")
        .update({ [field]: destPath })
        .eq("id", artist.id)
        .select("id")
        .maybeSingle();
      if (!updated) {
        errors.push({
          artistId: artist.id,
          field,
          reason:
            "DB update returned no row — possible silent RLS rejection; public file NOT deleted",
        });
        continue;
      }

      // Migration counts as succeeded once the DB points at the private copy.
      migrated.push({
        artistId: artist.id,
        artistName: artist.name,
        field,
        from: sourcePath,
        to: destPath,
      });

      // e. Delete the legacy public copy — best-effort. A failure here is a
      // warning, not an error: the DB already points at the private copy, so
      // the straggler is a manual mop-up, not a broken row.
      const { error: rmErr } = await admin.storage
        .from(LEGACY_BUCKET)
        .remove([sourcePath]);
      if (rmErr) {
        warnings.push({
          artistId: artist.id,
          field,
          warning: `migrated but public copy not deleted: ${rmErr.message}`,
        });
      }
    }
  }

  return NextResponse.json({
    dryRun,
    artistsExamined: artists.length,
    migrated: {
      count: migrated.length,
      files: migrated,
    },
    planned: dryRun ? planned : undefined,
    skipped_already_private: skippedAlreadyPrivate,
    errors,
    warnings,
  });
}
