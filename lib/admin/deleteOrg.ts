/**
 * Admin function for fully deleting an org and its cross-system assets.
 *
 * Phases:
 *   1. Refusal checks: PROTECTED_ORG_IDS, org row exists, confirmOwnerEmail matches.
 *   2. Manifest capture (read-only) — Cloudinary public_ids, Supabase Storage paths
 *      grouped by bucket, and auth.users IDs from org_members.
 *   3. If dryRun: return manifest, do nothing destructive.
 *   4. Audit row insert into deleted_orgs_audit (forensic trail; aborts if it fails).
 *   5. Single-statement DB delete: `DELETE FROM orgs WHERE id = $1`. The June 12
 *      CASCADE migration handles every dependent table; no layered transaction needed.
 *   6. Best-effort external cleanup (Cloudinary, Supabase Storage, auth.users).
 *      External failures do NOT roll back the DB delete; DB is authoritative.
 *
 * Spec source: docs/TEST_ORG_CLEANUP_PLAN.md "deleteOrg(orgId) admin function — design sketch".
 */
import { v2 as cloudinary } from "cloudinary";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type AdminClient = ReturnType<typeof supabaseAdmin>;

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Hardcoded refusal list — orgs deleteOrg will NEVER touch regardless of flags.
 * d38702d7-ea6b-49f1-bc8b-4a21b439642b is the shared/seeded beta org from the
 * May 28 backfill (see LAUNCH_PROGRESS "Trial model" section).
 */
export const PROTECTED_ORG_IDS: ReadonlySet<string> = new Set([
  "d38702d7-ea6b-49f1-bc8b-4a21b439642b",
]);

export type DeleteOrgOpts = {
  /** Required belt: must match orgs.owner_email or the call is refused before manifest. */
  confirmOwnerEmail: string;
  /** Default true. When true, returns the manifest without any destructive action. */
  dryRun?: boolean;
  /** Default true. When false, auth.users rows are left alone (org_members still goes via DB cascade). */
  deleteAuthUsers?: boolean;
  /** Email of the admin running the deletion (audit trail). */
  deletedByEmail?: string;
};

export type AssetManifest = {
  cloudinary: {
    image: string[];                         // public_ids, type=upload
    video: string[];                         // public_ids, type=upload
    rawAuthenticated: string[];              // public_ids, type=authenticated (custom_fonts)
  };
  storage: Array<{ bucket: string; paths: string[] }>;
  authUserIds: string[];
};

export type DeleteOrgResult = {
  ok: boolean;
  orgId: string;
  dryRun: boolean;
  manifest: AssetManifest;
  dbDeletedAt?: string;
  cleanup?: {
    cloudinary: { deleted: number; failed: Array<{ id: string; error: string }> };
    storage: { deleted: number; failed: Array<{ path: string; error: string }> };
    authUsers: { deleted: number; failed: Array<{ userId: string; error: string }> };
  };
  refused?:
    | "PROTECTED_ORG"
    | "ORG_NOT_FOUND"
    | "OWNER_EMAIL_MISMATCH"
    | "AUDIT_INSERT_FAILED"
    | `db_delete_failed: ${string}`;
};

const EMPTY_MANIFEST: AssetManifest = {
  cloudinary: { image: [], video: [], rawAuthenticated: [] },
  storage: [],
  authUserIds: [],
};

/**
 * Extract { bucket, path } from a Supabase Storage public URL.
 * Matches the existing pattern at app/dashboard/artists/[artistId]/profile/page.tsx:700,
 * generalized to any bucket name.
 */
function parseStorageUrl(url: string | null | undefined): { bucket: string; path: string } | null {
  if (!url) return null;
  const m = url.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+?)(\?|$)/);
  return m ? { bucket: m[1], path: m[2] } : null;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function pushStoragePath(
  buckets: Map<string, Set<string>>,
  url: string | null | undefined,
): void {
  const parsed = parseStorageUrl(url);
  if (!parsed) return;
  if (!buckets.has(parsed.bucket)) buckets.set(parsed.bucket, new Set());
  buckets.get(parsed.bucket)!.add(parsed.path);
}

/**
 * Capture every asset reference for the org in one batched read pass.
 * No destructive action; safe to call from dryRun path.
 */
async function captureManifest(sb: AdminClient, orgId: string): Promise<AssetManifest> {
  const cloudinaryImage: string[] = [];
  const cloudinaryVideo: string[] = [];
  const cloudinaryRawAuth: string[] = [];
  const bucketPaths = new Map<string, Set<string>>();

  // tours: Cloudinary public_ids + sponsor-logo storage URLs
  type TourRow = {
    image_square_id: string | null; image_story_id: string | null;
    image_landscape_id: string | null; image_print_id: string | null;
    video_tiktok_id: string | null; video_yt_shorts_id: string | null;
    sponsor_logo_1_url: string | null; sponsor_logo_2_url: string | null;
  };
  const { data: toursData } = await sb
    .from("tours")
    .select(
      "image_square_id, image_story_id, image_landscape_id, image_print_id, " +
        "video_tiktok_id, video_yt_shorts_id, " +
        "sponsor_logo_1_url, sponsor_logo_2_url",
    )
    .eq("org_id", orgId);
  const tours = (toursData ?? []) as unknown as TourRow[];

  for (const t of tours) {
    for (const id of [t.image_square_id, t.image_story_id, t.image_landscape_id, t.image_print_id]) {
      if (id) cloudinaryImage.push(id);
    }
    for (const id of [t.video_tiktok_id, t.video_yt_shorts_id]) {
      if (id) cloudinaryVideo.push(id);
    }
    pushStoragePath(bucketPaths, t.sponsor_logo_1_url);
    pushStoragePath(bucketPaths, t.sponsor_logo_2_url);
  }

  // artists: image/logo + adv_* + adv_custom_materials (JSON Array<{id,label,url}>)
  type ArtistRow = {
    image_url: string | null; logo_url: string | null;
    adv_stage_plot_url: string | null; adv_hospitality_url: string | null;
    adv_foh_url: string | null; adv_w9_url: string | null;
    adv_custom_materials: Array<{ id?: string; label?: string; url?: string }> | null;
  };
  const { data: artistsData } = await sb
    .from("artists")
    .select(
      "image_url, logo_url, adv_stage_plot_url, adv_hospitality_url, adv_foh_url, adv_w9_url, adv_custom_materials",
    )
    .eq("org_id", orgId);
  const artists = (artistsData ?? []) as unknown as ArtistRow[];

  for (const a of artists) {
    pushStoragePath(bucketPaths, a.image_url);
    pushStoragePath(bucketPaths, a.logo_url);
    pushStoragePath(bucketPaths, a.adv_stage_plot_url);
    pushStoragePath(bucketPaths, a.adv_hospitality_url);
    pushStoragePath(bucketPaths, a.adv_foh_url);
    pushStoragePath(bucketPaths, a.adv_w9_url);

    if (Array.isArray(a.adv_custom_materials)) {
      for (const m of a.adv_custom_materials) pushStoragePath(bucketPaths, m?.url);
    }
  }

  // custom_fonts: Cloudinary public_id (raw/authenticated) + Supabase Storage path
  type FontRow = {
    cloudinary_public_id: string | null;
    font_name: string | null;
    file_extension: string | null;
  };
  const { data: fontsData } = await sb
    .from("custom_fonts")
    .select("cloudinary_public_id, font_name, file_extension")
    .eq("org_id", orgId);
  const fonts = (fontsData ?? []) as unknown as FontRow[];

  for (const f of fonts) {
    if (f.cloudinary_public_id) cloudinaryRawAuth.push(f.cloudinary_public_id);
    if (f.font_name && f.file_extension) {
      const path = `${orgId}/${f.font_name}.${f.file_extension}`;
      if (!bucketPaths.has("fonts")) bucketPaths.set("fonts", new Set());
      bucketPaths.get("fonts")!.add(path);
    }
  }

  // intake_documents: storage_url in tour-documents bucket
  type IntakeRow = { storage_url: string | null };
  const { data: intakeData } = await sb
    .from("intake_documents")
    .select("storage_url")
    .eq("org_id", orgId);
  const intakeDocs = (intakeData ?? []) as unknown as IntakeRow[];

  for (const d of intakeDocs) pushStoragePath(bucketPaths, d.storage_url);

  // org_members: auth user IDs for Phase 4 auth.users cleanup
  type MemberRow = { user_id: string | null };
  const { data: membersData } = await sb
    .from("org_members")
    .select("user_id")
    .eq("org_id", orgId);
  const members = (membersData ?? []) as unknown as MemberRow[];

  const authUserIds = members
    .map((m) => m.user_id)
    .filter((u): u is string => !!u);

  const storage = Array.from(bucketPaths.entries()).map(([bucket, paths]) => ({
    bucket,
    paths: Array.from(paths),
  }));

  return {
    cloudinary: {
      image: cloudinaryImage,
      video: cloudinaryVideo,
      rawAuthenticated: cloudinaryRawAuth,
    },
    storage,
    authUserIds,
  };
}

async function deleteCloudinaryBatch(
  m: AssetManifest["cloudinary"],
): Promise<{ deleted: number; failed: Array<{ id: string; error: string }> }> {
  const failed: Array<{ id: string; error: string }> = [];
  let deleted = 0;

  const groups: Array<{
    ids: string[];
    options: { resource_type: "image" | "video" | "raw"; type?: "upload" | "authenticated" };
  }> = [
    { ids: m.image, options: { resource_type: "image", type: "upload" } },
    { ids: m.video, options: { resource_type: "video", type: "upload" } },
    { ids: m.rawAuthenticated, options: { resource_type: "raw", type: "authenticated" } },
  ];

  for (const group of groups) {
    for (const batch of chunk(group.ids, 100)) {
      try {
        const result = (await cloudinary.api.delete_resources(batch, group.options)) as {
          deleted?: Record<string, string>;
        };
        for (const [id, status] of Object.entries(result.deleted ?? {})) {
          if (status === "deleted") deleted++;
          else failed.push({ id, error: status });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown";
        for (const id of batch) failed.push({ id, error: msg });
      }
    }
  }

  return { deleted, failed };
}

async function deleteStorageBatch(
  sb: AdminClient,
  storage: AssetManifest["storage"],
): Promise<{ deleted: number; failed: Array<{ path: string; error: string }> }> {
  const failed: Array<{ path: string; error: string }> = [];
  let deleted = 0;

  for (const { bucket, paths } of storage) {
    for (const batch of chunk(paths, 100)) {
      const { data, error } = await sb.storage.from(bucket).remove(batch);
      if (error) {
        for (const p of batch) failed.push({ path: `${bucket}/${p}`, error: error.message });
      } else {
        deleted += data?.length ?? 0;
      }
    }
  }

  return { deleted, failed };
}

async function deleteAuthUsers(
  sb: AdminClient,
  userIds: string[],
): Promise<{ deleted: number; failed: Array<{ userId: string; error: string }> }> {
  const failed: Array<{ userId: string; error: string }> = [];
  let deleted = 0;

  for (const userId of userIds) {
    const { error } = await sb.auth.admin.deleteUser(userId);
    if (error) failed.push({ userId, error: error.message });
    else deleted++;
  }

  return { deleted, failed };
}

function buildManifestSummary(manifest: AssetManifest): Record<string, unknown> {
  const storageSummary: Record<string, number> = {};
  for (const { bucket, paths } of manifest.storage) storageSummary[bucket] = paths.length;
  return {
    cloudinary: {
      image: manifest.cloudinary.image.length,
      video: manifest.cloudinary.video.length,
      raw_authenticated: manifest.cloudinary.rawAuthenticated.length,
    },
    storage: storageSummary,
    auth_users: manifest.authUserIds.length,
  };
}

export async function deleteOrg(
  orgId: string,
  opts: DeleteOrgOpts,
): Promise<DeleteOrgResult> {
  const dryRun = opts.dryRun ?? true;

  // Belt 0: hardcoded refusal — never touch protected orgs regardless of flags
  if (PROTECTED_ORG_IDS.has(orgId)) {
    return { ok: false, orgId, dryRun, manifest: EMPTY_MANIFEST, refused: "PROTECTED_ORG" };
  }

  const sb = supabaseAdmin();

  // Belt 1: fetch org row, verify it exists
  const { data: org } = await sb
    .from("orgs")
    .select("id, owner_email")
    .eq("id", orgId)
    .maybeSingle();

  if (!org) {
    return { ok: false, orgId, dryRun, manifest: EMPTY_MANIFEST, refused: "ORG_NOT_FOUND" };
  }

  // Belt 2: confirmOwnerEmail must match orgs.owner_email exactly (case-insensitive)
  const orgEmail = (org.owner_email as string | null) ?? "";
  const provided = (opts.confirmOwnerEmail ?? "").trim();
  if (!provided || provided.toLowerCase() !== orgEmail.toLowerCase()) {
    return { ok: false, orgId, dryRun, manifest: EMPTY_MANIFEST, refused: "OWNER_EMAIL_MISMATCH" };
  }

  // Manifest capture — read-only, safe for dryRun
  const manifest = await captureManifest(sb, orgId);

  if (dryRun) {
    return { ok: true, orgId, dryRun: true, manifest };
  }

  // Audit row — insert BEFORE the destructive delete. If it fails, refuse and abort.
  const { error: auditErr } = await sb.from("deleted_orgs_audit").insert({
    org_id: orgId,
    owner_email: orgEmail,
    deleted_by: opts.deletedByEmail ?? null,
    manifest_summary: buildManifestSummary(manifest),
  });
  if (auditErr) {
    return { ok: false, orgId, dryRun, manifest, refused: "AUDIT_INSERT_FAILED" };
  }

  // Single-statement DB delete — Phase 1 migration handles all FK cascades
  const { error: delErr } = await sb.from("orgs").delete().eq("id", orgId);
  if (delErr) {
    return { ok: false, orgId, dryRun, manifest, refused: `db_delete_failed: ${delErr.message}` };
  }
  const dbDeletedAt = new Date().toISOString();

  // Best-effort external cleanup (no rollback on failure)
  const cleanup = {
    cloudinary: await deleteCloudinaryBatch(manifest.cloudinary),
    storage: await deleteStorageBatch(sb, manifest.storage),
    authUsers: (opts.deleteAuthUsers ?? true)
      ? await deleteAuthUsers(sb, manifest.authUserIds)
      : { deleted: 0, failed: [] as Array<{ userId: string; error: string }> },
  };

  return { ok: true, orgId, dryRun: false, manifest, dbDeletedAt, cleanup };
}
