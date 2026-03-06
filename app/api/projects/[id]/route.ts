import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/projects/[id]
 * Returns a public project profile by its id.
 * Public — no auth required.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("project_profiles")
      .select(
        "id, token_name, token_symbol, contract_address, chain, logo_url, website_url, description, created_at"
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      return apiError("Project not found", 404);
    }

    return apiSuccess({ project: data });
  } catch (err) {
    console.error("[projects/[id]]", err);
    return apiError("Internal server error", 500);
  }
}
