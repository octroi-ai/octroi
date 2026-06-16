import { createBrowserClient } from "@supabase/ssr";
import { AUTH_CONFIGURED, AUTH_URL, AUTH_ANON } from "./auth-config";

// Returns a browser Supabase client, or null in the public demo (no anon key)
// so callers never crash with "URL and API key are required".
export function createClient() {
  if (!AUTH_CONFIGURED) return null;
  return createBrowserClient(AUTH_URL!, AUTH_ANON!);
}
