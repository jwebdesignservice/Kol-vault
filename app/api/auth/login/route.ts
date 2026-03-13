export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { LoginSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";
import { rateLimit, getClientIp } from "@/lib/security/rate-limit";

/**
 * POST /api/auth/login
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
    const supabase = createServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      const msg = error?.message ?? ""
      const isInfraError = msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network") || msg.toLowerCase().includes("enotfound")
      return apiError(
        isInfraError ? "Service temporarily unavailable. Please try again shortly." : "Invalid email or password",
        isInfraError ? 503 : 401
      );
    }

    const { data: userRow } = await supabase.from("users").select("*").eq("id", data.user.id).single();

    return apiSuccess({ user: userRow, session: data.session });
  } catch (err) {
    console.error("[login]", err);
    return apiError("Internal server error", 500);
  }
}
