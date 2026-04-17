import { cookies, headers } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getCookieDomain } from "./cookieDomain";

export async function supabaseServer() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const cookieDomain = getCookieDomain(headerStore.get("host"));

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const mergedOptions = cookieDomain
                ? { ...options, domain: cookieDomain }
                : options;
              cookieStore.set(name, value, mergedOptions);
            });
          } catch {
            // In Server Components, set can throw during render; that's okay.
          }
        },
      },
    }
  );
}