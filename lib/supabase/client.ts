import { createBrowserClient as createSSRBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in Browser/Client Components.
 * Singleton pattern — safe to call multiple times.
 */
export function createBrowserClient() {
  return createSSRBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
