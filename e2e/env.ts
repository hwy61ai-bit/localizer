import fs from "node:fs";
import path from "node:path";

export const REPO_ROOT = path.resolve(__dirname, "..");
export const AUTH_DIR = path.join(REPO_ROOT, "e2e", ".auth");
export const STORAGE_STATE = path.join(AUTH_DIR, "user.json");
export const SEED_FILE = path.join(AUTH_DIR, "seed.json");

/** Reads .env.local (process.env wins). Never logs values. */
export function loadEnvLocal(): Record<string, string> {
  const env: Record<string, string> = {};
  const envPath = path.join(REPO_ROOT, ".env.local");
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
      env[key] = val;
    }
  }
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined && v !== "") env[k] = v;
  }
  return env;
}

/** Fails with a clear message naming (not printing) any missing variable. */
export function requireEnv<K extends string>(keys: K[]): Record<K, string> {
  const env = loadEnvLocal();
  const missing = keys.filter((k) => !env[k]);
  if (missing.length) {
    throw new Error(
      `[e2e] Missing required env var(s): ${missing.join(", ")}. Set them in .env.local (values are never printed).`,
    );
  }
  return env as Record<K, string>;
}

export type SeedInfo = { email: string; userId: string; orgId: string; artistId: string; tourId: string };

export function readSeed(): SeedInfo {
  if (!fs.existsSync(SEED_FILE)) throw new Error(`[e2e] ${SEED_FILE} missing — the setup project must run first.`);
  return JSON.parse(fs.readFileSync(SEED_FILE, "utf8")) as SeedInfo;
}
