// Centralized admin email list. Keep hardcoded for now; can move to env var later if needed.
const ADMIN_EMAILS: readonly string[] = [
  "hwy61ai@gmail.com",
  "tentenpm@gmail.com",
  "drew@hwy61labs.com",
  "tim@hwy61labs.com",
] as const;

/**
 * Returns true if the given email belongs to an admin. Case-insensitive.
 * Returns false for null/undefined/empty input.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
