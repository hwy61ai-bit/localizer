#!/usr/bin/env node
// scripts/invalidate-video-cache.mjs
//
// Local operator tool. Lists the base video assets belonging to a fixed set
// of orgs and, with --invalidate, purges their cached CDN copies.
//
// Usage:
//   node scripts/invalidate-video-cache.mjs              # dry run, report only
//   node scripts/invalidate-video-cache.mjs --invalidate # purge CDN cache
//
// Reads env from .env.local. Never deployed, never imported by app code.
// Reads the DB only — writes nothing to Supabase and deletes nothing from
// Cloudinary. explicit(..., { invalidate: true }) purges cached copies; the
// underlying asset is untouched.
//
// Targets tours.video_tiktok_id / tours.video_yt_shorts_id — the base video
// public_ids (tour_<uuid>_tiktok_<ts>), stored bare, per
// lib/localizer/formats.ts sourceColumn and app/api/renders/generate/route.ts.
// venue_links.render_*_url are derived transformation URLs over these same
// ids, so invalidating the base asset covers them too.
//
// Exits nonzero if any invalidation fails.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@supabase/supabase-js";

// ── env loading ────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(REPO_ROOT, ".env.local");

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) {
    console.error(`FATAL: ${ENV_PATH} not found`);
    process.exit(1);
  }
  const raw = fs.readFileSync(ENV_PATH, "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = loadEnv();

// ── Cloudinary config ──────────────────────────────────────────────────────
const CLOUDINARY_URL = env.CLOUDINARY_URL;
const CLOUD_NAME = env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = env.CLOUDINARY_API_KEY;
const API_SECRET = env.CLOUDINARY_API_SECRET;

if (CLOUDINARY_URL) {
  process.env.CLOUDINARY_URL = CLOUDINARY_URL;
  cloudinary.config(true);
  console.log("Cloudinary configured via CLOUDINARY_URL.");
} else if (CLOUD_NAME && API_KEY && API_SECRET) {
  cloudinary.config({ cloud_name: CLOUD_NAME, api_key: API_KEY, api_secret: API_SECRET });
  console.log(`Cloudinary configured via individual vars (cloud: ${CLOUD_NAME}).`);
} else {
  console.error(
    "FATAL: no Cloudinary credentials in .env.local (need CLOUDINARY_URL, or NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET).",
  );
  process.exit(1);
}

// ── Supabase config ────────────────────────────────────────────────────────
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("FATAL: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── args / scope ───────────────────────────────────────────────────────────
const INVALIDATE = process.argv.includes("--invalidate");

const ORG_IDS = [
  "1c39af62-96ec-4c70-a558-c92e134eece6",
  "57457e7c-85ca-4ffe-a1fd-b48a9c4e36de",
  "5c449025-0074-49a8-8cfb-2987f7c492f9",
  "d38702d7-ea6b-49f1-bc8b-4a21b439642b",
];

// Column → format label. Mirrors lib/localizer/formats.ts sourceColumn.
const VIDEO_COLUMNS = [
  { column: "video_tiktok_id", format: "tiktok" },
  { column: "video_yt_shorts_id", format: "yt_shorts" },
];

// ── helpers ────────────────────────────────────────────────────────────────

function messageOf(e) {
  return e?.message ?? e?.error?.message ?? String(e);
}

// The columns hold bare public_ids — app code concatenates them straight onto
// the /video/upload/ base (assets/page.tsx:72-73). This only fires if a row
// somehow holds a full URL, which would already be broken in the app; the
// caller logs when it rewrites so the row can be looked at.
function normalizePublicId(raw) {
  const value = String(raw).trim();
  const m = value.match(/\/video\/upload\/(?:v\d+\/)?(.+)$/);
  if (!m) return { publicId: value, rewritten: false };
  const stripped = m[1].replace(/\.[a-zA-Z0-9]+$/, "");
  return { publicId: stripped, rewritten: true };
}

// ── main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Querying tours for ${ORG_IDS.length} org(s)...`);
  const { data: tours, error } = await supabase
    .from("tours")
    .select("id, org_id, name, video_tiktok_id, video_yt_shorts_id")
    .in("org_id", ORG_IDS)
    .order("org_id");

  if (error) throw new Error(`tours query failed: ${error.message}`);

  const rows = tours ?? [];
  console.log(`tours matched: ${rows.length}\n`);

  const assets = [];
  for (const tour of rows) {
    for (const { column, format } of VIDEO_COLUMNS) {
      const raw = tour[column];
      if (!raw) continue;
      const { publicId, rewritten } = normalizePublicId(raw);
      if (rewritten) {
        console.log(`  NOTICE: ${column} on tour ${tour.id} held a URL, not a bare id — normalized to ${publicId}`);
      }
      assets.push({
        orgId: tour.org_id,
        tourId: tour.id,
        tourName: tour.name,
        format,
        publicId,
      });
    }
  }

  // ── report ──────────────────────────────────────────────────────────────
  const byOrg = new Map();
  for (const orgId of ORG_IDS) byOrg.set(orgId, []);
  for (const a of assets) {
    if (!byOrg.has(a.orgId)) byOrg.set(a.orgId, []);
    byOrg.get(a.orgId).push(a);
  }

  for (const [orgId, list] of byOrg) {
    console.log(`ORG ${orgId}  (${list.length} video asset${list.length === 1 ? "" : "s"})`);
    if (list.length === 0) {
      console.log("  (none)");
    } else {
      for (const a of list) {
        console.log(`  ${a.format.padEnd(9)} ${a.publicId}`);
        console.log(`            tour: ${a.tourName ?? "(unnamed)"} [${a.tourId}]`);
      }
    }
    console.log("");
  }

  console.log(`Total video assets: ${assets.length}`);

  if (assets.length === 0) {
    console.log("Nothing to invalidate.");
    return 0;
  }

  if (!INVALIDATE) {
    console.log("\nDry run — nothing invalidated. Run with --invalidate to purge CDN cache.");
    return 0;
  }

  // ── INVALIDATE MODE ─────────────────────────────────────────────────────
  console.log(`\n--- INVALIDATE MODE --- purging ${assets.length} asset(s)`);

  let failures = 0;
  for (const a of assets) {
    try {
      await cloudinary.uploader.explicit(a.publicId, {
        type: "upload",
        resource_type: "video",
        invalidate: true,
      });
      console.log(`  INVALIDATED  ${a.publicId}`);
    } catch (e) {
      failures++;
      console.error(`  FAILED       ${a.publicId}: ${messageOf(e)}`);
    }
  }

  console.log("");
  console.log(`Invalidated: ${assets.length - failures}`);
  console.log(`Failed:      ${failures}`);
  console.log("");
  console.log("NOTE: CDN propagation is not instant. Cached copies can persist for");
  console.log("      several minutes (Cloudinary documents up to an hour for a full");
  console.log("      purge). Do not judge the result by an immediate reload.");

  return failures > 0 ? 1 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    console.error("FATAL:", e);
    process.exit(1);
  });
