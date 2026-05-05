import { createBrowserClient } from "@supabase/ssr";

const COOKIE_DOMAIN =
  typeof window !== "undefined" && window.location.hostname.endsWith("hwy61labs.com")
    ? ".hwy61labs.com"
    : "";

const IS_HTTPS =
  typeof window !== "undefined" && window.location.protocol === "https:";

function cookieStorage() {
  return {
    getItem(key: string) {
      if (typeof document === "undefined") return null;
      const match = document.cookie.match(new RegExp(`(^| )${key}=([^;]+)`));
      return match ? decodeURIComponent(match[2]) : null;
    },
    setItem(key: string, value: string) {
      if (typeof document === "undefined") return;
      const domainAttr = COOKIE_DOMAIN ? `domain=${COOKIE_DOMAIN};` : "";
      const secureAttr = IS_HTTPS ? "Secure" : "";
      document.cookie = `${key}=${encodeURIComponent(value)};${domainAttr}path=/;max-age=2592000;SameSite=Lax;${secureAttr}`;
    },
    removeItem(key: string) {
      if (typeof document === "undefined") return;
      const domainAttr = COOKIE_DOMAIN ? `domain=${COOKIE_DOMAIN};` : "";
      document.cookie = `${key}=;${domainAttr}path=/;max-age=0`;
    },
  };
}

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookieOptions: {
      domain: COOKIE_DOMAIN,
      path: "/",
      sameSite: "lax" as const,
      secure: IS_HTTPS,
    },
    auth: {
      flowType: "implicit",
      storage: cookieStorage(),
    },
  }
);
