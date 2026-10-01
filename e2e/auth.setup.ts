import { execFileSync } from "node:child_process";
import { test as setup, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { REPO_ROOT, STORAGE_STATE, readSeed, requireEnv } from "./env";

// Signs in the E2E user without sending email:
//  1. seed E2E data (idempotent)
//  2. pass the beta gate through the real /login UI (→ /api/beta/validate)
//  3. mint a magic-link token with the Supabase admin API and hand it to the
//     app's real /auth/callback (verifyOtp → ensureOrgExists → /dashboard)
//  4. save the session cookies as storageState for the smoke project
setup("seed data and sign in the E2E user", async ({ page }) => {
  const env = requireEnv(["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "BETA_GATE_PASSWORD"]);

  execFileSync(process.execPath, ["scripts/e2e-seed.mjs"], { cwd: REPO_ROOT, stdio: "inherit" });
  const seed = readSeed();

  await page.goto("/login");
  await page.getByPlaceholder("Enter access password").fill(env.BETA_GATE_PASSWORD);
  await page.getByRole("button", { name: "CONTINUE" }).click();
  await expect(
    page.getByPlaceholder("you@domain.com"),
    "Beta gate did not accept BETA_GATE_PASSWORD from .env.local (/api/beta/validate returned invalid).",
  ).toBeVisible();

  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: seed.email });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) {
    throw new Error(`[e2e] generateLink failed: ${error?.message ?? "no hashed_token returned"}`);
  }

  await page.goto(`/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=magiclink`);
  await page.waitForURL(/\/dashboard(\?|$)/, { timeout: 60_000 });
  await page.context().storageState({ path: STORAGE_STATE });
});
