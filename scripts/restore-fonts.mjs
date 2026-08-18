#!/usr/bin/env node
// scripts/restore-fonts.mjs
//
// Local operator tool. Checks every custom_fonts row for a live Cloudinary
// raw/authenticated asset. With --restore, re-uploads the missing ones from
// the Supabase Storage "fonts" bucket.
//
// Usage:
//   node scripts/restore-fonts.mjs             # dry run, report only
//   node scripts/restore-fonts.mjs --restore   # re-upload MISSING fonts
//
// Reads env from .env.local. Never deployed, never imported by app code.
// Scoped to resource_type=raw, type=authenticated only — the custom-font
// assets referenced by video text overlays (l_text). Image renders load
// fonts from Supabase Storage and are unaffected by anything here.
//
// Restores the Cloudinary side only. The custom_fonts row is already correct
// (it stores the shared path used by both backends) and is never written to.
// A font missing from Cloudinary AND Supabase Storage cannot be repaired by
// this script — it is reported as UNRECOVERABLE-FROM-STORAGE and needs a
// re-upload from the original .ttf/.otf through the app.
//
// Exits nonzero if any font is still MISSING when the run finishes.

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
const RESTORE = process.argv.includes("--restore");
const STORAGE_BUCKET = "fonts";

// ── helpers ────────────────────────────────────────────────────────────────

// The Cloudinary SDK reports the HTTP status inconsistently: sometimes on the
// thrown object, sometimes nested under .error. Check both before deciding a
// failure is a genuine 404 rather than an auth or transport problem.
function httpCodeOf(e) {
  return e?.http_code ?? e?.error?.http_code ?? e?.response?.statusCode ?? null;
}

function messageOf(e) {
  return e?.message ?? e?.error?.message ?? String(e);
}

async function checkExists(publicId) {
  try {
    await cloudinary.api.resource(publicId, { resource_type: "raw", type: "authenticated" });
    return { status: "OK" };
  } catch (e) {
    if (httpCodeOf(e) === 404) return { status: "MISSING" };
    return { status: "ERROR", detail: messageOf(e) };
  }
}

async function downloadFromStorage(storagePath) {
  const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(storagePath);
  if (error) return { buffer: null, detail: error.message };
  if (!data) return { buffer: null, detail: "download returned no data" };
  return { buffer: Buffer.from(await data.arrayBuffer()), detail: null };
}

// Mirrors the upload options in app/api/fonts/upload/route.ts exactly. Any
// drift here produces an asset the render path cannot address.
function uploadRaw(publicId, buffer) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "raw",
          public_id: publicId,
          overwrite: true,
          type: "authenticated",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      )
      .end(buffer);
  });
}

function pad(v, width) {
  const s = String(v ?? "");
  return s.length >= width ? s : s + " ".repeat(width - s.length);
}

// ── main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("Querying custom_fonts...");
  const { data: rows, error } = await supabase
    .from("custom_fonts")
    .select("org_id, font_name, cloudinary_public_id, file_extension, storage_url")
    .order("org_id")
    .order("font_name");

  if (error) throw new Error(`custom_fonts query failed: ${error.message}`);

  const all = rows ?? [];
  console.log(`custom_fonts rows: ${all.length}\n`);

  if (all.length === 0) {
    console.log("Nothing to check.");
    return 0;
  }

  // Rows with no public_id can be neither probed nor restored — the column is
  // the Cloudinary id and the Supabase Storage path at once.
  const checkable = [];
  const skipped = [];
  for (const row of all) {
    if (row.cloudinary_public_id) checkable.push(row);
    else skipped.push(row);
  }

  console.log(`Checking ${checkable.length} Cloudinary raw/authenticated asset(s)...\n`);

  const results = [];
  for (const row of checkable) {
    const res = await checkExists(row.cloudinary_public_id);
    results.push({ ...row, ...res });
  }

  // ── report ──────────────────────────────────────────────────────────────
  const nameWidth = Math.max(9, ...all.map((r) => String(r.font_name ?? "").length));
  console.log(`${pad("ORG", 10)} ${pad("FONT", nameWidth)} ${pad("EXT", 4)} STATUS`);
  console.log("-".repeat(10 + 1 + nameWidth + 1 + 4 + 1 + 30));
  for (const r of results) {
    const org = String(r.org_id ?? "").slice(0, 8);
    const line = `${pad(org, 10)} ${pad(r.font_name, nameWidth)} ${pad(r.file_extension, 4)} ${r.status}`;
    console.log(r.status === "ERROR" ? `${line} — ${r.detail}` : line);
  }
  for (const r of skipped) {
    const org = String(r.org_id ?? "").slice(0, 8);
    console.log(
      `${pad(org, 10)} ${pad(r.font_name, nameWidth)} ${pad(r.file_extension, 4)} SKIP (no cloudinary_public_id)`,
    );
  }

  const okCount = results.filter((r) => r.status === "OK").length;
  let missing = results.filter((r) => r.status === "MISSING");
  const errored = results.filter((r) => r.status === "ERROR");

  console.log("");
  console.log(`OK:      ${okCount}`);
  console.log(`MISSING: ${missing.length}`);
  console.log(`ERROR:   ${errored.length}`);
  if (skipped.length) console.log(`SKIP:    ${skipped.length}`);

  if (!RESTORE) {
    console.log("\nDry run — nothing uploaded. Run with --restore to re-upload MISSING fonts.");
    return missing.length > 0 || errored.length > 0 ? 1 : 0;
  }

  // ── RESTORE MODE ────────────────────────────────────────────────────────
  if (missing.length === 0) {
    console.log("\n--- RESTORE MODE --- nothing missing, nothing to do.");
    return errored.length > 0 ? 1 : 0;
  }

  console.log(`\n--- RESTORE MODE --- re-uploading ${missing.length} font(s) from Supabase Storage`);

  const stillMissing = [];
  for (const r of missing) {
    const label = `${String(r.org_id ?? "").slice(0, 8)} ${r.font_name}`;
    const { buffer, detail } = await downloadFromStorage(r.cloudinary_public_id);

    if (!buffer) {
      console.error("");
      console.error("!!! UNRECOVERABLE-FROM-STORAGE ------------------------------------");
      console.error(`!!! org:   ${r.org_id}`);
      console.error(`!!! font:  ${r.font_name}.${r.file_extension}`);
      console.error(`!!! path:  ${STORAGE_BUCKET}/${r.cloudinary_public_id}`);
      console.error(`!!! cause: ${detail}`);
      console.error("!!! Gone from Cloudinary AND Supabase Storage. Needs a re-upload");
      console.error("!!! of the original font file through the app.");
      console.error("!!! -----------------------------------------------------------------");
      console.error("");
      stillMissing.push(r);
      continue;
    }

    try {
      await uploadRaw(r.cloudinary_public_id, buffer);
      console.log(`  RESTORED  ${label} (${buffer.length} bytes)`);
    } catch (e) {
      console.error(`  FAILED    ${label}: ${messageOf(e)}`);
      stillMissing.push(r);
    }
  }

  missing = stillMissing;

  console.log("");
  console.log("Restore pass complete.");
  console.log(`Restored:      ${results.filter((r) => r.status === "MISSING").length - missing.length}`);
  console.log(`Still missing: ${missing.length}`);

  return missing.length > 0 || errored.length > 0 ? 1 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    console.error("FATAL:", e);
    process.exit(1);
  });
