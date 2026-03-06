import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { LoginSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * POST /api/auth/login
 * Signs in with email/password via Supabase Auth.
 * Body: { email, password }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { email, password } = parsed.data;
    const supabase = createServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return apiError("Invalid email or password", 401);
    }

    // Fetch public user row for role info
    const { data: userRow } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    return apiSuccess({
      user: userRow,
      session: data.session,
    });
  } catch (err) {
    console.error("[login]", err);
    return apiError("Internal server error", 500);
  }
}
