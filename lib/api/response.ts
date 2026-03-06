import { NextResponse } from "next/server";

/**
 * Returns a JSON response with { success: true, data }.
 */
export function apiSuccess(data: unknown, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Returns a JSON error response with { success: false, error, details? }.
 */
export function apiError(
  message: string,
  status: number,
  details?: unknown
): NextResponse {
  return NextResponse.json(
    { success: false, error: message, ...(details !== undefined && { details }) },
    { status }
  );
}
