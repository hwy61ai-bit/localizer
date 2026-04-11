import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Hostname routing table
function getRewriteForHost(hostname: string): string | null {
  // Strip port for local dev
  const host = hostname.split(":")[0];

  // Marketing site — serves root landing page (app/page.tsx), no rewrite needed
  if (host === "hwy61labs.com" || host === "www.hwy61labs.com") {
    return null;
  }

  // Localizer dashboard
  if (host === "localizer.hwy61labs.com") {
    return "/dashboard";
  }

  // TourRouter dashboard
  if (host === "tourrouter.hwy61labs.com") {
    return "/dashboard/routing";
  }

  // TourRouter DIY mode
  if (host === "diy.hwy61labs.com") {
    return "/dashboard/routing";
  }

  return null;
}

// Hostnames that serve the public showcase (no auth required)
const PUBLIC_HOSTS = new Set([
  "hwy61labs.com",
  "www.hwy61labs.com",
]);

function isPublicHost(hostname: string): boolean {
  return PUBLIC_HOSTS.has(hostname.split(":")[0]);
}

// DIY feature-flag host
function isDiyHost(hostname: string): boolean {
  return hostname.split(":")[0] === "diy.hwy61labs.com";
}

// Routes that redirect to /coming-soon when COMING_SOON=true
const COMING_SOON_MARKETING_ROUTES = new Set([
  "/",
  "/tourrouter",
  "/localizer",
  "/diy",
  "/roadapp",
]);

// Prefixes that are always allowed through (never redirected to coming-soon)
const COMING_SOON_PASSTHROUGH_PREFIXES = [
  "/coming-soon",
  "/login",
  "/dashboard",
  "/api",
  "/advance",
  "/v/e",
  "/auth",
];

export async function middleware(req: NextRequest) {
  const hostname = req.headers.get("host") || "";
  const url = req.nextUrl.clone();

  // --- Coming Soon gate ---
  if (process.env.COMING_SOON === "true") {
    const { pathname } = url;
    const isPassthrough = COMING_SOON_PASSTHROUGH_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
    );
    const isPreview = req.nextUrl.searchParams.get("preview") === "true";
    if (!isPassthrough && !isPreview && COMING_SOON_MARKETING_ROUTES.has(pathname)) {
      // Check if user has a valid session — authenticated users bypass coming soon
      const comingSoonRes = NextResponse.next();
      const comingSoonSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return req.cookies.getAll(); },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                comingSoonRes.cookies.set(name, value, options);
              });
            },
          },
        }
      );
      const { data: { user: comingSoonUser } } = await comingSoonSupabase.auth.getUser();
      if (!comingSoonUser) {
        return NextResponse.redirect(new URL("/coming-soon", req.url));
      }
    }
  }

  // --- Hostname-based rewriting ---
  const rewriteBase = getRewriteForHost(hostname);

  // Public hosts — serve the root landing page, skip auth
  if (isPublicHost(hostname)) {
    return NextResponse.next();
  }

  if (rewriteBase !== null) {
    // App hosts — rewrite root to the app's base path
    if (url.pathname === "/") {
      url.pathname = rewriteBase;
    }
  }

  // Set DIY feature flag header so downstream pages can detect DIY mode
  const res = NextResponse.next();
  if (isDiyHost(hostname)) {
    res.headers.set("x-hwy61-diy", "1");
  }

  // --- Auth guard (dashboard routes only) ---
  if (!url.pathname.startsWith("/dashboard")) {
    return res;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
