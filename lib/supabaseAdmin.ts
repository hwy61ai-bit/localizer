import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for public, token-based access paths.
 *
 * Bypasses RLS entirely — use ONLY in code paths where the access credential
 * is a cryptographically-random token validated in application code (e.g.
 * public share-link viewers, advance form public routes).
 *
 * Never use in authenticated user-facing code paths — use supabaseServer()
 * instead, which respects RLS and reads the caller's session.
 */
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
