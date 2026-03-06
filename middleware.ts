import { NextRequest, NextResponse } from "next/server";
import { createServerClient as createSSRClient, type CookieOptions } from "@supabase/ssr";

/**
 * Routes that require authentication.
 * Patterns are matched against pathname.
 */
const PROTECTED_PATTERNS = [
  /^\/api\/projects\//,
  /^\/api\/kols\/profile/,
  /^\/api\/subscriptions\//,
];

/**
 * Routes that are always public (skip auth check even if they match a protected prefix).
 */
const PUBLIC_PATTERNS = [
  /^\/api\/auth\//,
  /^\/api\/kols$/,
  /^\/api\/kols\/(?!profile)[^/]+$/,  // /api/kols/[id] but not /api/kols/profile
  /^\/api\/webhooks\//,
  /^\/api\/projects\/[^/]+$/,          // /api/projects/[id] public read
];

function isProtected(pathname: string): boolean {
  if (PUBLIC_PATTERNS.some((p) => p.test(pathname))) return false;
  return PROTECTED_PATTERNS.some((p) => p.test(pathname));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  // Build a response to carry refreshed session cookies
  const response = NextResponse.next({
    request: { headers: new Headers(request.headers) },
  });

  const supabase = createSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Fetch role from public.users
  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  // Inject identity headers for downstream route handlers
  response.headers.set("x-user-id", user.id);
  response.headers.set("x-user-role", userRow?.role ?? "");

  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
