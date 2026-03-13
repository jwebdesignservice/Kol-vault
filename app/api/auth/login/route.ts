export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from "next/server";
import { createServerClient as createSSRClient, type CookieOptions } from "@supabase/ssr";
import { LoginSchema } from "@/lib/validation/schemas";
import { apiError } from "@/lib/api/response";
import { rateLimit, getClientIp } from "@/lib/security/rate-limit";

/**
 * POST /api/auth/login
 * Signs in with email/password, sets session cookies on the response.
 * Rate limited: 10 attempts per 15 minutes per IP.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(ip, 'login', { limit: 10, windowMs: 15 * 60 * 1000 });
    if (!limit.ok) {
      return apiError(`Too many login attempts. Try again in ${Math.ceil(limit.resetMs / 1000)}s`, 429);
    }

    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { email, password } = parsed.data;

    // Build a response we can attach cookies to
    const response = NextResponse.json({ success: true, data: {} }, { status: 200 });

    const supabase = createSSRClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      const msg = error?.message ?? ""
      const isInfra = msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")
      return apiError(
        isInfra ? "Service temporarily unavailable. Please try again shortly." : "Invalid email or password",
        isInfra ? 503 : 401
      );
    }

    const { data: userRow } = await supabase.from("users").select("*").eq("id", data.user.id).single();

    // Update the response body with actual user data
    const finalBody = JSON.stringify({
      success: true,
      data: { user: userRow, session: { access_token: data.session?.access_token } },
    });

    return new NextResponse(finalBody, {
      status: 200,
      headers: response.headers,
    });
  } catch (err) {
    console.error("[login]", err);
    return apiError("Internal server error", 500);
  }
}
