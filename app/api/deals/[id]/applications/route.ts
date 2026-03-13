export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { CreateApplicationSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";
import { sendApplicationReceivedEmail } from "@/lib/email/service";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const supabase = createAdminClient();

    if (user.role === "project") {
      const { data: profile } = await supabase.from("project_profiles").select("id").eq("user_id", user.id).single();
      const { data: deal } = await supabase.from("deals").select("project_id").eq("id", params.id).single();
      if (!deal || !profile || deal.project_id !== profile.id) return apiError("Forbidden", 403);
      const { data, error } = await supabase.from("applications").select("*").eq("deal_id", params.id).order("created_at", { ascending: false });
      if (error) return apiError("Failed to fetch applications", 500);
      return apiSuccess({ applications: data });
    }

    if (user.role === "kol") {
      const { data: kolProfile } = await supabase.from("kol_profiles").select("id").eq("user_id", user.id).single();
      if (!kolProfile) return apiSuccess({ applications: [] });
      const { data, error } = await supabase.from("applications").select("*").eq("deal_id", params.id).eq("kol_id", kolProfile.id);
      if (error) return apiError("Failed to fetch application", 500);
      return apiSuccess({ applications: data });
    }

    if (user.role === "admin") {
      const { data, error } = await supabase.from("applications").select("*").eq("deal_id", params.id).order("created_at", { ascending: false });
      if (error) return apiError("Failed to fetch applications", 500);
      return apiSuccess({ applications: data });
    }

    return apiError("Forbidden", 403);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/applications GET]", res);
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req, "kol");
    const supabase = createAdminClient();

    const { data: deal, error: dealError } = await supabase.from("deals").select("*").eq("id", params.id).single();
    if (dealError || !deal) return apiError("Deal not found", 404);
    if (deal.status !== "open") return apiError("Deal is not accepting applications", 400);

    const { data: kolProfile } = await supabase.from("kol_profiles").select("id").eq("user_id", user.id).single();
    if (!kolProfile) return apiError("KOL profile not found", 404);

    const { data: existing } = await supabase.from("applications").select("id").eq("deal_id", params.id).eq("kol_id", kolProfile.id).single();
    if (existing) return apiError("You have already applied to this deal", 400);

    const { count } = await supabase.from("applications").select("id", { count: "exact" }).eq("deal_id", params.id).neq("status", "withdrawn");
    if ((count ?? 0) >= deal.max_applications) return apiError("This deal has reached the maximum number of applications", 400);

    const body = await req.json();
    const parsed = CreateApplicationSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);

    const { data: application, error: insertError } = await supabase
      .from("applications").insert({ deal_id: params.id, kol_id: kolProfile.id, ...parsed.data, status: "pending" }).select().single();
    if (insertError) return apiError("Failed to submit application", 500);

    sendApplicationReceivedEmail(params.id, application.id).catch(console.error);
    return apiSuccess({ application }, 201);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/applications POST]", res);
    return apiError("Internal server error", 500);
  }
}
