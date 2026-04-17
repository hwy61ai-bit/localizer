/**
 * Returns the cookie Domain attribute to use when writing Supabase auth
 * cookies, or undefined if no Domain should be set.
 *
 * Setting Domain=.hwy61labs.com (leading dot) scopes auth cookies across
 * all subdomains: www, localizer, tourrouter, diy. Without this, cookies
 * accumulate separately per host (apex, www, each subdomain), and
 * refresh-token rotation can write to one scope while reading from
 * another — producing "refresh_token_already_used" errors and silent
 * session death requiring users to clear their browser cache.
 *
 * Only returns the shared domain when the caller's host actually ends
 * with hwy61labs.com. For localhost and any other hosts (Vercel preview
 * URLs, etc.), returns undefined so browsers use host-only cookies.
 * This is required for localhost since browsers reject Domain=.localhost.
 */
export function getCookieDomain(
  host: string | null | undefined
): string | undefined {
  if (!host) return undefined;
  const hostWithoutPort = host.split(":")[0];
  return hostWithoutPort.endsWith("hwy61labs.com") ? ".hwy61labs.com" : undefined;
}
