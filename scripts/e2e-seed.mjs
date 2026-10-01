#!/usr/bin/env node
// scripts/e2e-seed.mjs
//
// Idempotent seed for the Playwright smoke suite. Creates (only if missing):
//   - auth user hwy61ai+e2e@gmail.com
//   - org "E2E Test Org" owned by that user (trial_ends_at far in the future)
//   - artist "E2E Test Artist", tour "E2E Test Tour", 2 events
// Writes the resulting ids to e2e/.auth/seed.json for the tests.
//
// Safety: only ever writes rows whose org is named "E2E …". Aborts if the
// e2e user is a member of any non-E2E org. No Stripe, Resend, or Cloudinary.
//
// Usage: node scripts/e2e-seed.mjs   (reads .env.local; never prints secrets)

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

export const E2E_EMAIL = "hwy61ai+e2e@gmail.com";
const ORG_NAME = "E2E Test Org";
const ARTIST_NAME = "E2E Test Artist";
const TOUR_NAME = "E2E Test Tour";
const EVENTS = [
  { date_iso: "2030-10-02", city: "Austin", state: "TX", venue: "E2E Venue One", event_index: 0 },
  { date_iso: "2030-10-03", city: "Dallas", state: "TX", venue: "E2E Venue Two", event_index: 1 },
];
const FAR_FUTURE = "2099-12-31T00:00:00.000Z";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(REPO_ROOT, "e2e", ".auth", "seed.json");

function loadEnv() {
  const envPath = path.join(REPO_ROOT, ".env.local");
  const env = { ...process.env };
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) env[key] = val;
    }
  }
  return env;
}

function fail(msg) {
  throw new Error(`[e2e-seed] ${msg}`);
}

function must(result, what) {
  if (result.error) fail(`${what} failed: ${result.error.message}`);
  return result.data;
}

async function findUserByEmail(admin, email) {
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) fail(`listUsers failed: ${error.message}`);
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

export async function seed() {
  const env = loadEnv();
  const missing = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter((k) => !env[k]);
  if (missing.length) fail(`missing required env var(s) in .env.local: ${missing.join(", ")}`);

  const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const created = [];

  // 1. User
  let user = await findUserByEmail(db, E2E_EMAIL);
  if (!user) {
    const res = await db.auth.admin.createUser({
      email: E2E_EMAIL,
      email_confirm: true,
      user_metadata: { full_name: "E2E Test User" },
    });
    user = must(res, "createUser").user;
    created.push("user");
  }

  // 2. Org (E2E-named only; abort on any non-E2E membership)
  const memberships = must(
    await db.from("org_members").select("org_id, orgs(name)").eq("user_id", user.id),
    "org_members lookup",
  );
  const nonE2E = memberships.filter((m) => !String(m.orgs?.name ?? "").startsWith("E2E"));
  if (nonE2E.length) fail(`e2e user belongs to non-E2E org(s) ${nonE2E.map((m) => m.org_id).join(", ")} — refusing to continue`);

  let orgId = memberships[0]?.org_id ?? null;
  if (!orgId) {
    const org = must(
      await db.from("orgs").insert({
        name: ORG_NAME,
        owner_email: E2E_EMAIL,
        plan: "pro",
        localizer_plan: null,
        trial_ends_at: FAR_FUTURE,
        localizer_enabled: true,
        localizer_onboarding_completed: true,
      }).select("id").maybeSingle(),
      "org insert",
    );
    if (!org) fail("org insert returned no row");
    orgId = org.id;
    const member = must(
      await db.from("org_members").insert({ org_id: orgId, user_id: user.id, role: "owner" }).select("org_id").maybeSingle(),
      "org_members insert",
    );
    if (!member) fail("org_members insert returned no row");
    created.push("org");
  } else {
    // Keep the E2E org's trial open and onboarding complete (E2E org only).
    const upd = must(
      await db.from("orgs")
        .update({ trial_ends_at: FAR_FUTURE, localizer_onboarding_completed: true })
        .eq("id", orgId).like("name", "E2E%")
        .select("id").maybeSingle(),
      "org refresh",
    );
    if (!upd) fail(`org ${orgId} is not an E2E org — refusing to modify`);
  }

  // 3. Artist
  let artist = must(
    await db.from("artists").select("id").eq("org_id", orgId).eq("name", ARTIST_NAME).limit(1).maybeSingle(),
    "artist lookup",
  );
  if (!artist) {
    artist = must(await db.from("artists").insert({ org_id: orgId, name: ARTIST_NAME }).select("id").maybeSingle(), "artist insert");
    if (!artist) fail("artist insert returned no row");
    created.push("artist");
  }

  // 4. Tour
  let tour = must(
    await db.from("tours").select("id").eq("org_id", orgId).eq("name", TOUR_NAME).limit(1).maybeSingle(),
    "tour lookup",
  );
  if (!tour) {
    tour = must(
      await db.from("tours").insert({ name: TOUR_NAME, artist_id: artist.id, band_name: ARTIST_NAME, org_id: orgId }).select("id").maybeSingle(),
      "tour insert",
    );
    if (!tour) fail("tour insert returned no row");
    created.push("tour");
  }

  // 5. Events (matched by venue name)
  const existing = must(await db.from("events").select("id, venue").eq("tour_id", tour.id), "events lookup");
  for (const ev of EVENTS) {
    if (existing.some((e) => e.venue === ev.venue)) continue;
    const row = must(
      await db.from("events").insert({
        org_id: orgId,
        tour_id: tour.id,
        date_iso: ev.date_iso,
        day: null,
        city: ev.city,
        state: ev.state,
        venue: ev.venue,
        source: "manual",
        status: "ready",
        event_index: ev.event_index,
      }).select("id").maybeSingle(),
      "event insert",
    );
    if (!row) fail("event insert returned no row");
    created.push(`event:${ev.venue}`);
  }

  const out = { email: E2E_EMAIL, userId: user.id, orgId, artistId: artist.id, tourId: tour.id };
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
  return { ...out, created };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  seed()
    .then((r) => console.log(`[e2e-seed] ok — created: ${r.created.length ? r.created.join(", ") : "nothing (already seeded)"}`))
    .catch((e) => { console.error(e.message); process.exit(1); });
}
