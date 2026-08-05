#!/usr/bin/env node
// scripts/cloudinary-sweep.mjs
//
// Local operator tool. Reports Cloudinary orphans (assets not referenced
// from the live Supabase DB). With --destroy, deletes them.
//
// Usage:
//   node scripts/cloudinary-sweep.mjs             # report-only
//   node scripts/cloudinary-sweep.mjs --destroy   # actually delete
//
// Reads env from .env.local. Never deployed, never imported by app code.
// Scoped to resource_type=image and resource_type=video, type=upload only.
// Raw/authenticated (custom fonts) are intentionally untouched — see
// docs/BACKLOG.md "Cloudinary orphan sweep".

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

// ── args ───────────────────────────────────────────────────────────────────
const DESTROY = process.argv.includes("--destroy");
const REPORT_DATE = new Date().toISOString().slice(0, 10);
const REPORT_PATH = path.join(
  REPO_ROOT,
  "localizer-qa-reports",
  `cloudinary-orphans_${REPORT_DATE}.csv`,
);
const LIVE_FOUND_PATH = path.join(
  REPO_ROOT,
  "localizer-qa-reports",
  `cloudinary-live-found_${REPORT_DATE}.csv`,
);
const LIVE_MISSING_PATH = path.join(
  REPO_ROOT,
  "localizer-qa-reports",
  `cloudinary-live-missing_${REPORT_DATE}.csv`,
);

// ── helpers ────────────────────────────────────────────────────────────────

// Extract bare public_id from a Cloudinary secure_url. Handles URLs with
// or without transformation segments and with or without a version prefix.
// Transformation segments = contain ',' OR match {1-3 lowercase letters}_
// (c_, w_, h_, e_, l_, f_, q_, ar_, etc.). Version = v\d+.
function extractPublicIdFromUrl(url) {
  const m = url.match(/\/(image|video)\/upload\/(.+)$/);
  if (!m) return null;
  const segments = m[2].split("/");
  let startIdx = segments.length;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (/^v\d+$/.test(seg)) {
      startIdx = i + 1;
      break;
    }
    if (seg.includes(",") || /^[a-z]{1,3}_/.test(seg)) {
      continue;
    }
    startIdx = i;
    break;
  }
  if (startIdx >= segments.length) return null;
  const withExt = segments.slice(startIdx).join("/");
  return withExt.replace(/\.[a-zA-Z0-9]+$/, "");
}

async function fetchLiveSet() {
  console.log("Querying Supabase for live public_id set...");
  const live = new Set();
  let tourCount = 0;
  let linkCount = 0;
  let parseFailures = 0;

  const { data: tours, error: tourErr } = await supabase
    .from("tours")
    .select(
      "image_square_id, image_story_id, image_landscape_id, image_print_id, video_tiktok_id, video_yt_shorts_id",
    );
  if (tourErr) throw new Error(`tours query failed: ${tourErr.message}`);
  for (const row of tours ?? []) {
    for (const val of Object.values(row)) {
      if (val) {
        live.add(String(val));
        tourCount++;
      }
    }
  }

  const { data: links, error: linkErr } = await supabase
    .from("venue_links")
    .select("render_square_url, render_story_url, render_landscape_url, render_poster_url");
  if (linkErr) throw new Error(`venue_links query failed: ${linkErr.message}`);
  for (const row of links ?? []) {
    for (const val of Object.values(row)) {
      if (!val) continue;
      const pid = extractPublicIdFromUrl(String(val));
      if (pid) {
        live.add(pid);
        linkCount++;
      } else {
        parseFailures++;
      }
    }
  }

  console.log(
    `  tours: ${tourCount} non-null public_ids | venue_links: ${linkCount} parsed URLs (${parseFailures} parse failures)`,
  );
  return live;
}

async function listAll(resource_type) {
  console.log(`Listing all Cloudinary ${resource_type} type=upload assets...`);
  const out = [];
  let cursor;
  let page = 0;
  do {
    const res = await cloudinary.api.resources({
      resource_type,
      type: "upload",
      max_results: 500,
      next_cursor: cursor,
    });
    for (const r of res.resources) out.push(r);
    cursor = res.next_cursor;
    page++;
    console.log(`  page ${page}: +${res.resources.length} (running total ${out.length})`);
  } while (cursor);
  return out;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function csvEscape(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// ── main ───────────────────────────────────────────────────────────────────
async function main() {
  const live = await fetchLiveSet();
  console.log(`Live set: ${live.size} unique public_ids\n`);

  if (DESTROY && live.size === 0) {
    console.error(
      "REFUSING --destroy: live set query returned zero rows. Empty DB read must never mean 'delete everything'.",
    );
    process.exit(1);
  }

  const [images, videos] = await Promise.all([listAll("image"), listAll("video")]);
  const all = [
    ...images.map((r) => ({ ...r, _rtype: "image" })),
    ...videos.map((r) => ({ ...r, _rtype: "video" })),
  ];
  console.log(
    `\nCloudinary listed: ${images.length} image + ${videos.length} video = ${all.length} total`,
  );

  // Live-set coverage check. If the URL extractor is mismatching, live
  // entries won't appear in the listing and their sources would be tagged
  // as false orphans. A small count is expected — DB rows can reference
  // already-deleted assets, and render_poster_url may not be a listable
  // asset. Diagnostic only in report mode; enforced in --destroy below.
  const listedIds = new Set(all.map((r) => r.public_id));
  const liveMissing = [...live].filter((id) => !listedIds.has(id));
  console.log(
    `Live-set coverage: ${live.size - liveMissing.length}/${live.size} found in Cloudinary listing`,
  );
  if (liveMissing.length > 0) {
    console.log(`  live entries NOT found in listing (${liveMissing.length}):`);
    for (const id of liveMissing.slice(0, 20)) console.log(`  - ${id}`);
  }

  const orphans = all.filter((r) => !live.has(r.public_id));
  const keeps = all.length - orphans.length;
  const totalBytes = orphans.reduce((sum, r) => sum + (r.bytes || 0), 0);

  console.log("");
  console.log(`Orphans:     ${orphans.length}`);
  console.log(`Keeps:       ${keeps}`);
  console.log(`Reclaimable: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log("");

  // Write CSV
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  const header = "public_id,resource_type,format,bytes,created_at,secure_url\n";
  const rows = orphans.map((r) =>
    [r.public_id, r._rtype, r.format, r.bytes, r.created_at, r.secure_url]
      .map(csvEscape)
      .join(","),
  );
  fs.writeFileSync(REPORT_PATH, header + rows.join("\n") + (rows.length ? "\n" : ""));
  console.log(`Report written: ${REPORT_PATH}`);

  // Live-set diagnostics: split into "found in listing" and "missing from
  // listing" for operator inspection. One public_id per line, no header.
  const liveFound = [...live].filter((id) => listedIds.has(id));
  fs.writeFileSync(LIVE_FOUND_PATH, liveFound.join("\n") + (liveFound.length ? "\n" : ""));
  fs.writeFileSync(LIVE_MISSING_PATH, liveMissing.join("\n") + (liveMissing.length ? "\n" : ""));
  console.log(`Live-found written: ${LIVE_FOUND_PATH} (${liveFound.length} ids)`);
  console.log(`Live-missing written: ${LIVE_MISSING_PATH} (${liveMissing.length} ids)`);

  if (!DESTROY) {
    console.log("\nReport mode. Nothing destroyed. Run with --destroy to actually delete.");
    return;
  }

  // ── DESTROY MODE ────────────────────────────────────────────────────────
  console.log("\n--- DESTROY MODE ---");
  console.log("Re-querying live set to guard against races since first read...");
  const liveFresh = await fetchLiveSet();
  if (liveFresh.size === 0) {
    console.error("REFUSING --destroy on second read: live set is empty.");
    process.exit(1);
  }

  const orphansFresh = orphans.filter((r) => !liveFresh.has(r.public_id));
  console.log(
    `Fresh orphan count: ${orphansFresh.length} (was ${orphans.length} on first pass)`,
  );

  // Fresh live-set coverage check against the fresh DB read + the same
  // Cloudinary listing from the first pass (re-listing would be expensive
  // and the race we're guarding against is DB-side edits, not Cloudinary
  // additions). Abort if > 10% of live entries are missing from the
  // listing — that pattern means the URL extractor is mismatching and
  // renders would be destroyed as false orphans.
  const listedIdsFresh = new Set(all.map((r) => r.public_id));
  const liveMissingFresh = [...liveFresh].filter((id) => !listedIdsFresh.has(id));
  console.log(
    `Live-set coverage (fresh): ${liveFresh.size - liveMissingFresh.length}/${liveFresh.size} found in Cloudinary listing`,
  );
  if (liveMissingFresh.length > 0) {
    console.log(`  live entries NOT found in listing (${liveMissingFresh.length}):`);
    for (const id of liveMissingFresh.slice(0, 20)) console.log(`  - ${id}`);
  }
  const missingRatio = liveFresh.size > 0 ? liveMissingFresh.length / liveFresh.size : 0;
  if (missingRatio > 0.1) {
    console.error(
      `FATAL: ${liveMissingFresh.length}/${liveFresh.size} live entries (${(missingRatio * 100).toFixed(1)}%) missing from Cloudinary listing — exceeds 10% threshold. Extractor may be mismatching URLs. Aborting without any destroy.`,
    );
    process.exit(1);
  }

  const byType = { image: [], video: [] };
  for (const r of orphansFresh) byType[r._rtype].push(r.public_id);

  for (const [rtype, ids] of Object.entries(byType)) {
    if (ids.length === 0) continue;
    const batches = chunk(ids, 100);
    console.log(`\nDestroying ${ids.length} ${rtype} assets in ${batches.length} batch(es)...`);
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      try {
        const res = await cloudinary.api.delete_resources(batch, {
          resource_type: rtype,
          type: "upload",
        });
        const deleted = Object.values(res.deleted || {}).filter((s) => s === "deleted").length;
        const notFound = Object.values(res.deleted || {}).filter((s) => s === "not_found").length;
        const other = batch.length - deleted - notFound;
        console.log(
          `  batch ${i + 1}/${batches.length}: ${deleted} deleted, ${notFound} not_found, ${other} other`,
        );
      } catch (e) {
        console.error(`  batch ${i + 1}/${batches.length}: ERROR ${e.message}`);
      }
    }
  }
  console.log("\nDestroy pass complete.");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
