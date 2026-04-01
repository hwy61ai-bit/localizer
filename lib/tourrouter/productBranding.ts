// ============================================================
// Product Branding — hostname-aware product names
// ============================================================

export type ProductName = "LOCALIZER" | "TOURROUTER." | "DIY";

export function getProductName(overridePath?: string): ProductName {
  if (typeof window === "undefined") return "LOCALIZER";
  const host = window.location.hostname;
  const path = overridePath ?? window.location.pathname;
  if (host === "diy.hwy61labs.com") return "DIY";
  if (host === "tourrouter.hwy61labs.com") return "TOURROUTER.";
  if (path.startsWith("/dashboard/routing")) return "TOURROUTER.";
  return "LOCALIZER";
}

export function getProductContext(overridePath?: string) {
  const name = getProductName(overridePath);
  return {
    name,
    isLocalizer: name === "LOCALIZER",
    isTourRouter: name === "TOURROUTER.",
    isDiy: name === "DIY",
  };
}

/**
 * Standalone hostname check for pages outside the provider (e.g. login).
 */
export function getProductNameFromHostname(hostname: string): ProductName {
  const host = hostname.split(":")[0];
  if (host === "diy.hwy61labs.com") return "DIY";
  if (host === "tourrouter.hwy61labs.com") return "TOURROUTER.";
  return "LOCALIZER";
}
