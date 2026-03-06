export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createServerClient } from "@/lib/supabase/server";
import { ProjectProfileSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/projects/profile
 * Returns the authenticated project user's profile.
 * Requires: auth + role=project
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req, "project");
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("project_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      return apiError("Failed to fetch profile", 500);
    }

    return apiSuccess({ profile: data ?? null });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[projects/profile GET]", res);
    return apiError("Internal server error", 500);
  }
}

/**
 * POST /api/projects/profile
 * Upserts the authenticated project user's profile.
 * Requires: auth + role=project
 * Body: { token_name, token_symbol, contract_address, chain?, logo_url?, website_url?, description? }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req, "project");

    const body = await req.json();
    const parsed = ProjectProfileSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("project_profiles")
      .upsert(
        { user_id: user.id, ...parsed.data },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      return apiError("Failed to save profile", 500);
    }

    return apiSuccess({ profile: data }, 200);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[projects/profile POST]", res);
    return apiError("Internal server error", 500);
  }
}

