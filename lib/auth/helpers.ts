import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { User, ProjectProfile, KOLProfile } from "@/lib/types";

/**
 * Returns the authenticated Supabase user from the current session, or null.
 */
export async function getUser(_req: NextRequest): Promise<User | null> {
  const supabase = createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return data ?? null;
}

/**
 * Asserts the request is authenticated and optionally matches a required role.
 * Throws a NextResponse with 401 or 403 if the check fails.
 * Returns the authenticated User on success.
 */
export async function requireAuth(
  req: NextRequest,
  role?: string
): Promise<User> {
  const user = await getUser(req);

  if (!user) {
    throw NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (role && user.role !== role) {
    throw NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 }
    );
  }

  return user;
}

/**
 * Fetches the profile row (project_profile or kol_profile) for a given user id and role.
 * Returns null if no profile exists yet.
 */
export async function getUserProfile(
  userId: string,
  role: string
): Promise<ProjectProfile | KOLProfile | null> {
  const supabase = createServerClient();

  if (role === "project") {
    const { data } = await supabase
      .from("project_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    return data ?? null;
  }

  if (role === "kol") {
    const { data } = await supabase
      .from("kol_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    return data ?? null;
  }

  return null;
}
