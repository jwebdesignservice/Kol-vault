export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { UpdateDealSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req, "admin");
    const supabase = createAdminClient();

    const { data: deal } = await supabase.from("deals").select("id").eq("id", params.id).single();
    if (!deal) return apiError("Deal not found", 404);

    const body = await req.json();
    const parsed = UpdateDealSchema.safeParse(body);
    if (!parsed.success) return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);

    const { data: updated, error } = await supabase
      .from("deals").update({ ...parsed.data, updated_at: new Date().toISOString() }).eq("id", params.id).select().single();
    if (error) return apiError("Failed to update deal", 500);
    return apiSuccess({ deal: updated });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[admin/deals/[id] PATCH]", res);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req, "admin");
    const supabase = createAdminClient();
    const { error } = await supabase.from("deals").delete().eq("id", params.id);
    if (error) return apiError("Failed to delete deal", 500);
    return apiSuccess({ deleted: true });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[admin/deals/[id] DELETE]", res);
    return apiError("Internal server error", 500);
  }
}
