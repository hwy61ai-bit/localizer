/**
 * Admin endpoint for org deletion. Dual-gated:
 *   Layer 1: caller's session belongs to an admin email (isAdminEmail).
 *     Skipped in development (NODE_ENV !== "production") — bearer secret alone
 *     authorizes, mirroring the cron routes' dev pattern. Production behavior
 *     unchanged: both layers required.
 *   Layer 2: bearer secret in Authorization header (ADMIN_DELETE_ORG_SECRET env).
 * Plus belt-and-suspenders body requirement: confirmOwnerEmail must match orgs.owner_email.
 *
 * dryRun defaults to TRUE — a caller that omits the flag gets the manifest back,
 * deletes nothing. To actually destroy: explicit { "dryRun": false }.
 *
 * See lib/admin/deleteOrg.ts for the core routine and docs/TEST_ORG_CLEANUP_PLAN.md
 * for the spec.
 */
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import { isAdminEmail } from "@/lib/auth/adminEmails";
import { deleteOrg } from "@/lib/admin/deleteOrg";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";

  // Layer 1: caller must have an authenticated session AND be on the admin allowlist
  // (production-only; dev bypasses to let the bearer secret alone authorize).
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!isDev) {
    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  }

  // Layer 2: bearer secret must match env var (defends against compromised admin session)
  const authHeader = req.headers.get("authorization");
  const expected = process.env.ADMIN_DELETE_ORG_SECRET;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Parse body
  const body = await req.json().catch(() => ({}));
  const { orgId, confirmOwnerEmail, dryRun, deleteAuthUsers } = body as {
    orgId?: string;
    confirmOwnerEmail?: string;
    dryRun?: boolean;
    deleteAuthUsers?: boolean;
  };

  if (!orgId) {
    return NextResponse.json({ error: "orgId required" }, { status: 400 });
  }
  if (!confirmOwnerEmail) {
    return NextResponse.json(
      { error: "confirmOwnerEmail required (must match orgs.owner_email)" },
      { status: 400 },
    );
  }

  const result = await deleteOrg(orgId, {
    confirmOwnerEmail,
    dryRun: dryRun ?? true,
    deleteAuthUsers: deleteAuthUsers ?? true,
    // In dev with Layer 1 bypassed, the bearer alone authorized this request —
    // record that honestly in the audit row instead of an incidental session email.
    deletedByEmail: isDev ? "dev-bearer" : user?.email ?? undefined,
  });

  // Map refusals to appropriate HTTP statuses so callers can distinguish
  if (!result.ok) {
    if (result.refused === "PROTECTED_ORG") return NextResponse.json(result, { status: 403 });
    if (result.refused === "ORG_NOT_FOUND") return NextResponse.json(result, { status: 404 });
    if (result.refused === "OWNER_EMAIL_MISMATCH") return NextResponse.json(result, { status: 400 });
    if (result.refused === "AUDIT_INSERT_FAILED") return NextResponse.json(result, { status: 500 });
    return NextResponse.json(result, { status: 500 });
  }

  return NextResponse.json(result);
}
