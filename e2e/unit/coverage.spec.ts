import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { FORMATS } from "../../lib/localizer/formats";
import { REPO_ROOT } from "../env";

// FORMAT COVERAGE (recon A.4). Static source check: every static image format
// in lib/localizer/formats.ts must be wired into every hard-coded list that
// silently skips unknown keys. Adding a format without updating each list
// fails here. See docs/recon/2026-10-01_formats-dates-recon.md §A.4 and the
// LOCKSTEP rule in CLAUDE.md.

type Def = { key: string; uploadId: string; sourceColumn: string; renderColumn: string; w: number; h: number };

const read = (rel: string) => fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** All bracket-balanced blocks ({…} or […]) that follow each match of `marker`. */
function blocks(src: string, marker: RegExp): string[] {
  const re = new RegExp(marker.source, marker.flags.includes("g") ? marker.flags : marker.flags + "g");
  const out: string[] = [];
  for (const m of src.matchAll(re)) {
    let i = (m.index ?? 0) + m[0].length;
    while (i < src.length && src[i] !== "{" && src[i] !== "[") i++;
    const open = src[i];
    const close = open === "{" ? "}" : "]";
    let depth = 0;
    const start = i;
    for (; i < src.length; i++) {
      if (src[i] === open) depth++;
      else if (src[i] === close && --depth === 0) break;
    }
    out.push(src.slice(start, i + 1));
  }
  return out;
}

/** String literals that list ≥2 columns of a kind (Supabase select strings, sweep live-sets). */
function columnListStrings(src: string, kind: "image" | "render"): string[] {
  const col = kind === "image" ? /image_\w+_id/g : /render_\w+_url/g;
  return [...src.matchAll(/"([^"\n]*)"/g)].map((m) => m[1]).filter((s) => (s.match(col) ?? []).length >= 2);
}

type Check = { name: string; run: (d: Def) => boolean };

function inEveryBlock(file: string, marker: RegExp, needle: (d: Def) => string | RegExp): Check["run"] {
  return (d) => {
    const found = blocks(read(file), marker);
    const n = needle(d);
    return found.length > 0 && found.every((b) => (typeof n === "string" ? b.includes(n) : n.test(b)));
  };
}

function inEveryColumnList(file: string, kind: "image" | "render"): Check["run"] {
  return (d) => {
    const lists = columnListStrings(read(file), kind);
    const col = kind === "image" ? d.sourceColumn : d.renderColumn;
    return lists.length > 0 && lists.every((s) => new RegExp(`\\b${esc(col)}\\b`).test(s));
  };
}

const dims = (d: Def) => new RegExp(`\\b${esc(d.key)}:\\s*\\{\\s*w:\\s*${d.w},\\s*h:\\s*${d.h}\\s*\\}`);
const linkCol = (d: Def) => new RegExp(`link(?: as any\\))?\\.${esc(d.renderColumn)}\\b`);

const ASSETS = "app/dashboard/tours/[tourId]/assets/page.tsx";
const EVENTS_TABLE = "app/dashboard/tours/[tourId]/components/EventsTable.tsx";

const CHECKS: Check[] = [
  { name: "assets page: FORMATS card", run: inEveryBlock(ASSETS, /const FORMATS\s*=\s*/, (d) => `id: "${d.uploadId}"`) },
  { name: "assets page: load existing uploads", run: inEveryBlock(ASSETS, /async function loadExisting\(\)\s*/, (d) => `data.${d.sourceColumn}`) },
  { name: "assets page: FORMAT_DB_COLS", run: inEveryBlock(ASSETS, /const FORMAT_DB_COLS[^=]*=\s*/, (d) => `${d.uploadId}: "${d.sourceColumn}"`) },
  { name: "assets page: FORMAT_CROP_KEY", run: inEveryBlock(ASSETS, /const FORMAT_CROP_KEY[^=]*=\s*/, (d) => `${d.uploadId}: "${d.key}"`) },
  { name: "upload-image: FORMAT_COLUMN", run: inEveryBlock("app/api/tours/[tourId]/upload-image/route.ts", /const FORMAT_COLUMN[^=]*=\s*/, (d) => `${d.uploadId}: "${d.sourceColumn}"`) },
  { name: "clientRender: FORMAT_DIMS", run: inEveryBlock("lib/clientRender.ts", /const FORMAT_DIMS[^=]*=\s*/, dims) },
  { name: "clientRender: SCALE_FACTORS", run: inEveryBlock("lib/clientRender.ts", /const SCALE_FACTORS[^=]*=\s*/, (d) => new RegExp(`\\b${esc(d.key)}:\\s*1(\\.0)?\\b`)) },
  { name: "EventsTable: formats arrays", run: inEveryBlock(EVENTS_TABLE, /const formats\s*=\s*/, (d) => `"${d.key}"`) },
  { name: "EventsTable: imageIds", run: inEveryBlock(EVENTS_TABLE, /const imageIds[^=]*=\s*/, (d) => new RegExp(`\\b${esc(d.key)}:\\s*tour\\.${esc(d.sourceColumn)}\\b`)) },
  { name: "EventsTable: formatDims (pre-check + render)", run: inEveryBlock(EVENTS_TABLE, /const formatDims[^=]*=\s*/, dims) },
  { name: "save-urls: IMAGE_RENDER_COLUMNS", run: inEveryBlock("app/api/renders/save-urls/route.ts", /const IMAGE_RENDER_COLUMNS\s*=\s*/, (d) => `"${d.renderColumn}"`) },
  { name: "save-urls: select", run: inEveryColumnList("app/api/renders/save-urls/route.ts", "render") },
  { name: "download: allowlist", run: inEveryBlock("app/api/download/route.ts", /new Set\(\s*/, linkCol) },
  { name: "download: select", run: inEveryColumnList("app/api/download/route.ts", "render") },
  { name: "download/marketing: allowlist", run: inEveryBlock("app/api/download/marketing/route.ts", /new Set\(\s*/, linkCol) },
  { name: "download/marketing: select", run: inEveryColumnList("app/api/download/marketing/route.ts", "render") },
  { name: "download-format: FORMAT_MAP", run: inEveryBlock("app/api/tours/[tourId]/download-format/route.ts", /const FORMAT_MAP[^=]*=\s*/, (d) => `column: "${d.renderColumn}"`) },
  { name: "download-all: imageAssets", run: inEveryBlock("app/api/download-all/route.ts", /const imageAssets[^=]*=\s*/, linkCol) },
  { name: "download-all: select", run: inEveryColumnList("app/api/download-all/route.ts", "render") },
  { name: "download-all/marketing: imageAssets", run: inEveryBlock("app/api/download-all/marketing/route.ts", /const imageAssets[^=]*=\s*/, linkCol) },
  { name: "download-all/marketing: select", run: inEveryColumnList("app/api/download-all/marketing/route.ts", "render") },
  { name: "/v/e: photoAssets", run: inEveryBlock("app/v/e/[token]/page.tsx", /const photoAssets\s*=\s*/, linkCol) },
  { name: "/v/e: select", run: inEveryColumnList("app/v/e/[token]/page.tsx", "render") },
  { name: "/v/m: photoAssets", run: inEveryBlock("app/v/m/[token]/page.tsx", /const photoAssets\s*=\s*/, linkCol) },
  { name: "/v/m: select", run: inEveryColumnList("app/v/m/[token]/page.tsx", "render") },
  { name: "cloudinary-sweep: tours live-set", run: inEveryColumnList("scripts/cloudinary-sweep.mjs", "image") },
  { name: "cloudinary-sweep: venue_links live-set", run: inEveryColumnList("scripts/cloudinary-sweep.mjs", "render") },
  { name: "deleteOrg: tours select", run: inEveryColumnList("lib/admin/deleteOrg.ts", "image") },
  { name: "deleteOrg: destroy loop", run: inEveryBlock("lib/admin/deleteOrg.ts", /for \(const id of\s*(?=\[t\.image_)/, (d) => `t.${d.sourceColumn}`) },
];

function gapsFor(d: Def): string[] {
  return CHECKS.filter((c) => !c.run(d)).map((c) => `${d.key}: missing from ${c.name}`);
}

const STATIC_IMAGE_FORMATS: Def[] = Object.values(FORMATS).filter((f) => f.mediaType === "image");

test("every static image format is wired into every hard-coded format list (recon A.4)", () => {
  expect(STATIC_IMAGE_FORMATS.length).toBeGreaterThan(0);
  const gaps = STATIC_IMAGE_FORMATS.flatMap(gapsFor);
  expect(gaps, `Format coverage gaps — update these lists:\n${gaps.join("\n")}`).toEqual([]);
});

test("coverage checker is not vacuous: an unwired fake format fails every check", () => {
  const fake: Def = { key: "zz_fake", uploadId: "zz_fake_upload", sourceColumn: "image_zz_fake_id", renderColumn: "render_zz_fake_url", w: 1234, h: 4321 };
  expect(gapsFor(fake)).toHaveLength(CHECKS.length);
});
