export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { RegisterSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";
import { sendWelcomeEmail } from "@/lib/email/service";
import { rateLimit, getClientIp } from "@/lib/security/rate-limit";

/**
 * POST /api/auth/register
 * Rate limited: 5 registrations per hour per IP.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limit = rateLimit(ip, 'register', { limit: 5, windowMs: 60 * 60 * 1000 });
    if (!limit.ok) {
      return apiError(`Too many registration attempts. Try again in ${Math.ceil(limit.resetMs / 1000)}s`, 429);
    }

    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { email, password, role, name } = parsed.data;
    const supabase = createServerClient();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role, name } },
    });
    if (authError || !authData.user) {
      // Sanitize raw Supabase network errors (e.g. "fetch failed" = DB not configured)
      const msg = authError?.message ?? ""
      const isInfraError = msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network") || msg.toLowerCase().includes("enotfound")
      return apiError(
        isInfraError ? "Service temporarily unavailable. Please try again shortly." : (msg || "Registration failed"),
        isInfraError ? 503 : 400
      );
    }

    const userId = authData.user.id;

    const { error: userError } = await supabase.from("users").insert({ id: userId, email, role });
    if (userError) return apiError("Failed to create user record", 500);

    let profile = null;
    if (role === "project") {
      const { data, error } = await supabase.from("project_profiles").insert({ user_id: userId }).select().single();
      if (error) return apiError("Failed to create project profile", 500);
      profile = data;
    } else if (role === "kol") {
      const { data, error } = await supabase.from("kol_profiles").insert({ user_id: userId, display_name: name }).select().single();
      if (error) return apiError("Failed to create KOL profile", 500);
      profile = data;
    }

    sendWelcomeEmail(userId).catch(console.error);

    return apiSuccess({ user: { id: userId, email, role }, profile, session: authData.session }, 201);
  } catch (err) {
    console.error("[register]", err);
    return apiError("Internal server error", 500);
  }
}
