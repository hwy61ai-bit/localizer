import { createBrowserClient } from "@supabase/ssr";

function cookieStorage() {
  return {
    getItem(key: string) {
      if (typeof document === "undefined") return null;
      const match = document.cookie.match(new RegExp(`(^| )${key}=([^;]+)`));
      return match ? decodeURIComponent(match[2]) : null;
    },
    setItem(key: string, value: string) {
      if (typeof document === "undefined") return;
      document.cookie = `${key}=${encodeURIComponent(value)};path=/;max-age=3600;SameSite=Lax`;
    },
    removeItem(key: string) {
      if (typeof document === "undefined") return;
      document.cookie = `${key}=;path=/;max-age=0`;
    },
  };
}

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: cookieStorage(),
    },
  }
);
