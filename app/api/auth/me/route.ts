import { NextRequest } from "next/server";
import { getUser, getUserProfile } from "@/lib/auth/helpers";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/auth/me
 * Returns the authenticated user and their profile.
 * Requires: valid session cookie.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);

    if (!user) {
      return apiError("Unauthorized", 401);
    }

    const profile = await getUserProfile(user.id, user.role);

    return apiSuccess({ user, profile });
  } catch (err) {
    console.error("[me]", err);
    return apiError("Internal server error", 500);
  }
}
