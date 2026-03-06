import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { RegisterSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";
import { sendWelcomeEmail } from "@/lib/email/service";

/**
 * POST /api/auth/register
 * Creates a Supabase auth user, inserts into public.users, and creates an empty profile row.
 * Body: { email, password, role, name }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { email, password, role, name } = parsed.data;
    const supabase = createServerClient();

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role, name } },
    });

    if (authError || !authData.user) {
      return apiError(authError?.message ?? "Registration failed", 400);
    }

    const userId = authData.user.id;

    // Insert into public.users
    const { error: userError } = await supabase.from("users").insert({
      id: userId,
      email,
      role,
    });

    if (userError) {
      return apiError("Failed to create user record", 500);
    }

    // Create empty profile based on role
    let profile = null;
    if (role === "project") {
      const { data, error } = await supabase
        .from("project_profiles")
        .insert({ user_id: userId })
        .select()
        .single();
      if (error) return apiError("Failed to create project profile", 500);
      profile = data;
    } else if (role === "kol") {
      const { data, error } = await supabase
        .from("kol_profiles")
        .insert({ user_id: userId, display_name: name })
        .select()
        .single();
      if (error) return apiError("Failed to create KOL profile", 500);
      profile = data;
    }

    // Fire and forget — don't await
    sendWelcomeEmail(userId).catch(console.error)

    return apiSuccess(
      {
        user: { id: userId, email, role },
        profile,
        session: authData.session,
      },
      201
    );
  } catch (err) {
    console.error("[register]", err);
    return apiError("Internal server error", 500);
  }
}
