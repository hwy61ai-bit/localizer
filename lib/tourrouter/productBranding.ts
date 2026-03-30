// ============================================================
// Product Branding — hostname-aware product names
// ============================================================

export type ProductName = "LOCALIZER" | "TOURROUTER." | "DIY";

export function getProductName(): ProductName {
  if (typeof window === "undefined") return "LOCALIZER";
  const host = window.location.hostname;
  if (host === "diy.hwy61labs.com") return "DIY";
  if (host === "tourrouter.hwy61labs.com") return "TOURROUTER.";
  return "LOCALIZER";
}

export function getProductContext() {
  const name = getProductName();
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
