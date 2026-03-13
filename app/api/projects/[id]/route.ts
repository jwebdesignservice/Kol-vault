export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("project_profiles")
      .select("id, token_name, token_symbol, contract_address, chain, logo_url, website_url, description, created_at")
      .eq("id", params.id).single();
    if (error || !data) return apiError("Project not found", 404);
    return apiSuccess({ profile: data });
  } catch (err) {
    console.error("[projects/[id] GET]", err);
    return apiError("Internal server error", 500);
  }
}
