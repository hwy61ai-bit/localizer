import { createBrowserClient } from "@supabase/ssr";

const COOKIE_DOMAIN = ".hwy61labs.com";

function cookieStorage() {
  return {
    getItem(key: string) {
      if (typeof document === "undefined") return null;
      const match = document.cookie.match(new RegExp(`(^| )${key}=([^;]+)`));
      return match ? decodeURIComponent(match[2]) : null;
    },
    setItem(key: string, value: string) {
      if (typeof document === "undefined") return;
      document.cookie = `${key}=${encodeURIComponent(value)};domain=${COOKIE_DOMAIN};path=/;max-age=3600;SameSite=Lax;Secure`;
    },
    removeItem(key: string) {
      if (typeof document === "undefined") return;
      document.cookie = `${key}=;domain=${COOKIE_DOMAIN};path=/;max-age=0`;
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
      secure: true,
    },
    auth: {
      storage: cookieStorage(),
    },
  }
);
