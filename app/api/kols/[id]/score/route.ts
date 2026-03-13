export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const supabase = createAdminClient();

    if (user.role !== "admin") {
      const { data: kolProfile } = await supabase.from("kol_profiles").select("id").eq("user_id", user.id).single();
      if (!kolProfile || kolProfile.id !== params.id) return apiError("Forbidden", 403);
    }

    const { data: history, error } = await supabase.from("kol_score_history").select("*").eq("kol_id", params.id).order("created_at", { ascending: false });
    if (error) return apiError("Failed to fetch score history", 500);

    const { data: profile } = await supabase.from("kol_profiles").select("score, tier").eq("id", params.id).single();
    return apiSuccess({ score: profile?.score ?? 0, tier: profile?.tier ?? "bronze", history });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[kols/[id]/score GET]", res);
    return apiError("Internal server error", 500);
  }
}
