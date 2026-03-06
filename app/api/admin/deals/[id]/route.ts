import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, apiError } from "@/lib/api/response";
import { z } from "zod";

type RouteContext = { params: { id: string } };

const AdminUpdateDealSchema = z.object({
  status: z.enum([
    "draft",
    "open",
    "in_progress",
    "pending_review",
    "completed",
    "cancelled",
    "disputed",
  ]),
});

/**
 * PATCH /api/admin/deals/[id]
 * Update any deal's status. Admin only. No transition restrictions.
 * Body: { status: DealStatus }
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    await requireAuth(req, "admin");
    const supabase = createAdminClient();

    const { data: deal } = await supabase
      .from("deals")
      .select("id")
      .eq("id", id)
      .single();

    if (!deal) return apiError("Deal not found", 404);

    const body = await req.json();
    const parsed = AdminUpdateDealSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { data: updated, error } = await supabase
      .from("deals")
      .update({ status: parsed.data.status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[admin/deals/[id] PATCH]", error);
      return apiError("Failed to update deal", 500);
    }

    return apiSuccess({ deal: updated });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[admin/deals/[id] PATCH]", res);
    return apiError("Internal server error", 500);
  }
}
