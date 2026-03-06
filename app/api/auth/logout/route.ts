export const dynamic = 'force-dynamic'
import { createServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * POST /api/auth/logout
 * Signs the current user out and clears the session cookie.
 */
export async function POST() {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return apiError("Failed to sign out", 500);
    }

    return apiSuccess({ message: "Logged out successfully" });
  } catch (err) {
    console.error("[logout]", err);
    return apiError("Internal server error", 500);
  }
}

