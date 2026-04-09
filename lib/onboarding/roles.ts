// Shared source of truth for the seven onboarding roles.
// Both the wizard dropdown (client) and the API route validator (server)
// import from here to prevent drift. If this list changes, no migration is
// needed — user_role is stored as unconstrained text per the schema decision.

export const ONBOARDING_ROLES = [
  "Agent",
  "Manager",
  "Tour Manager",
  "Business Manager",
  "Band Leader",
  "Self-managed Artist",
  "Venue / Promoter",
] as const;

export type OnboardingRole = (typeof ONBOARDING_ROLES)[number];

const ROLE_SET = new Set<string>(ONBOARDING_ROLES);

export function isOnboardingRole(value: unknown): value is OnboardingRole {
  return typeof value === "string" && ROLE_SET.has(value);
}
