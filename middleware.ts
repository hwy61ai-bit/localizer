import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Hostname routing table
function getRewriteForHost(hostname: string): string | null {
  // Strip port for local dev
  const host = hostname.split(":")[0];

  // Marketing / showcase site
  if (host === "hwy61labs.com" || host === "www.hwy61labs.com") {
    return "/showcase";
  }

  // Localizer dashboard (new domain + legacy domain during transition)
  if (host === "localizer.hwy61labs.com" || host === "localizer.hwy61.ai") {
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

export async function middleware(req: NextRequest) {
  const hostname = req.headers.get("host") || "";
  const url = req.nextUrl.clone();

  // --- Hostname-based rewriting ---
  const rewriteBase = getRewriteForHost(hostname);

  if (rewriteBase !== null) {
    // Public showcase hosts — rewrite and skip auth
    if (isPublicHost(hostname)) {
      // Rewrite root and sub-paths to /showcase/*
      const incoming = url.pathname;
      // Avoid double-prefixing if already under /showcase
      if (!incoming.startsWith("/showcase")) {
        url.pathname = rewriteBase + (incoming === "/" ? "" : incoming);
      }
      return NextResponse.rewrite(url);
    }

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

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
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
