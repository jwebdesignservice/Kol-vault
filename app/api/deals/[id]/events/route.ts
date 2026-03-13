export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { SubmitUrlSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const supabase = createAdminClient();

    const { data: deal } = await supabase.from("deals").select("project_id, accepted_kol_id").eq("id", params.id).single();
    if (!deal) return apiError("Deal not found", 404);

    if (user.role !== "admin") {
      let hasAccess = false;
      if (user.role === "project") {
        const { data: profile } = await supabase.from("project_profiles").select("id").eq("user_id", user.id).single();
        hasAccess = profile?.id === deal.project_id;
      } else if (user.role === "kol") {
        const { data: kolProfile } = await supabase.from("kol_profiles").select("id").eq("user_id", user.id).single();
        hasAccess = kolProfile?.id === deal.accepted_kol_id;
      }
      if (!hasAccess) return apiError("Forbidden", 403);
    }

    const { data, error } = await supabase.from("campaign_events").select("*").eq("deal_id", params.id).order("created_at", { ascending: true });
    if (error) return apiError("Failed to fetch events", 500);
    return apiSuccess({ events: data });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/events GET]", res);
    return apiError("Internal server error", 500);
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(req);
    const supabase = createAdminClient();

    const { data: deal } = await supabase.from("deals").select("project_id, accepted_kol_id, status").eq("id", params.id).single();
    if (!deal) return apiError("Deal not found", 404);
    if (!["in_progress", "pending_review"].includes(deal.status)) return apiError("Events can only be submitted on active deals", 400);

    const body = await req.json();
    let eventType: "url_submission" | "note";
    let kolId: string | null = null;
    let payload: Record<string, unknown>;

    if (user.role === "kol") {
      const { data: kolProfile } = await supabase.from("kol_profiles").select("id").eq("user_id", user.id).single();
      if (!kolProfile || deal.accepted_kol_id !== kolProfile.id) return apiError("Forbidden", 403);
      kolId = kolProfile.id;
      const parsed = SubmitUrlSchema.safeParse(body);
      if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
      eventType = "url_submission";
      payload = { url: parsed.data.url, platform: parsed.data.platform };
    } else if (user.role === "project" || user.role === "admin") {
      if (user.role === "project") {
        const { data: profile } = await supabase.from("project_profiles").select("id").eq("user_id", user.id).single();
        if (!profile || deal.project_id !== profile.id) return apiError("Forbidden", 403);
      }
      eventType = "note";
      payload = { note: body.note ?? "" };
    } else {
      return apiError("Forbidden", 403);
    }

    const { data: event, error: insertError } = await supabase
      .from("campaign_events").insert({ deal_id: params.id, kol_id: kolId ?? deal.accepted_kol_id, event_type: eventType, payload }).select().single();
    if (insertError) return apiError("Failed to record event", 500);
    return apiSuccess({ event }, 201);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id]/events POST]", res);
    return apiError("Internal server error", 500);
  }
}
