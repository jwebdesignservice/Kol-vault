import { NextRequest } from "next/server";
import { getUser, requireAuth } from "@/lib/auth/helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { UpdateDealSchema } from "@/lib/validation/schemas";
import { apiSuccess, apiError } from "@/lib/api/response";

type RouteContext = { params: { id: string } };

// Statuses where a deal cannot be modified
const IMMUTABLE_STATUSES = ["in_progress", "pending_review", "completed", "cancelled", "disputed"];

/**
 * GET /api/deals/[id]
 * Returns a single deal.
 * - Public: open deals only
 * - Project owner: any status
 * - KOL: any deal they have an application for
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const user = await getUser(req);
    const supabase = createAdminClient();

    const { data: deal, error } = await supabase
      .from("deals")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !deal) {
      return apiError("Deal not found", 404);
    }

    // Open deals are public
    if (deal.status === "open") {
      return apiSuccess({ deal });
    }

    if (!user) {
      return apiError("Not found", 404);
    }

    if (user.role === "project") {
      // Check ownership
      const { data: projectProfile } = await supabase
        .from("project_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (projectProfile && deal.project_id === projectProfile.id) {
        return apiSuccess({ deal });
      }
    }

    if (user.role === "kol") {
      const { data: kolProfile } = await supabase
        .from("kol_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (kolProfile) {
        const { data: application } = await supabase
          .from("applications")
          .select("id")
          .eq("deal_id", id)
          .eq("kol_id", kolProfile.id)
          .single();

        if (application) {
          return apiSuccess({ deal });
        }
      }
    }

    if (user.role === "admin") {
      return apiSuccess({ deal });
    }

    return apiError("Not found", 404);
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id] GET]", res);
    return apiError("Internal server error", 500);
  }
}

/**
 * PATCH /api/deals/[id]
 * Update a deal. Project owner only.
 * Allowed status transitions: draft→open, open→cancelled
 * Cannot update if status is in_progress or later.
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const user = await requireAuth(req, "project");
    const supabase = createAdminClient();

    const { data: projectProfile } = await supabase
      .from("project_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!projectProfile) {
      return apiError("Project profile not found", 400);
    }

    const { data: deal } = await supabase
      .from("deals")
      .select("id, status, project_id")
      .eq("id", id)
      .single();

    if (!deal) return apiError("Deal not found", 404);
    if (deal.project_id !== projectProfile.id) return apiError("Forbidden", 403);

    if (IMMUTABLE_STATUSES.includes(deal.status)) {
      return apiError(
        `Cannot modify a deal with status '${deal.status}'`,
        400
      );
    }

    const body = await req.json();
    const parsed = UpdateDealSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.flatten().fieldErrors);
    }

    const { status: newStatus, ...fields } = parsed.data;

    // Validate status transition
    if (newStatus !== undefined) {
      const valid =
        (deal.status === "draft" && newStatus === "open") ||
        (deal.status === "open" && newStatus === "cancelled") ||
        (deal.status === "draft" && newStatus === "cancelled");

      if (!valid) {
        return apiError(
          `Invalid status transition: '${deal.status}' → '${newStatus}'`,
          400
        );
      }
    }

    const updatePayload = {
      ...fields,
      ...(newStatus !== undefined && { status: newStatus }),
    };

    const { data: updated, error } = await supabase
      .from("deals")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[deals/[id] PATCH] error", error);
      return apiError("Failed to update deal", 500);
    }

    return apiSuccess({ deal: updated });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id] PATCH]", res);
    return apiError("Internal server error", 500);
  }
}

/**
 * DELETE /api/deals/[id]
 * Cancel a deal. Project owner only.
 * Only allowed if status is draft or open.
 */
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const user = await requireAuth(req, "project");
    const supabase = createAdminClient();

    const { data: projectProfile } = await supabase
      .from("project_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!projectProfile) {
      return apiError("Project profile not found", 400);
    }

    const { data: deal } = await supabase
      .from("deals")
      .select("id, status, project_id")
      .eq("id", id)
      .single();

    if (!deal) return apiError("Deal not found", 404);
    if (deal.project_id !== projectProfile.id) return apiError("Forbidden", 403);

    if (!["draft", "open"].includes(deal.status)) {
      return apiError(
        `Cannot cancel a deal with status '${deal.status}'`,
        400
      );
    }

    const { error } = await supabase
      .from("deals")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) {
      console.error("[deals/[id] DELETE] error", error);
      return apiError("Failed to cancel deal", 500);
    }

    return apiSuccess({ message: "Deal cancelled" });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error("[deals/[id] DELETE]", res);
    return apiError("Internal server error", 500);
  }
}
