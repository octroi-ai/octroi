import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { AUTH_CONFIGURED, AUTH_URL, AUTH_ANON } from "./auth-config";

export async function createSupabaseServer() {
  if (!AUTH_CONFIGURED) return null;
  const cookieStore = await cookies();

  return createServerClient(
    AUTH_URL!,
    AUTH_ANON!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  );
}
