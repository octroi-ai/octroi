import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { AUTH_CONFIGURED } from "./lib/auth-config";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Demo mode, no auth backend configured, or local dev → skip the auth guard
  // (and never construct a Supabase client without a real anon key).
  if (
    !AUTH_CONFIGURED ||
    process.env.NEXT_PUBLIC_DEMO_MODE === "1" ||
    (process.env.NODE_ENV !== "production" &&
      (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").includes("localhost"))
  ) {
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tokenops/:path*",
    "/esg/:path*",
    "/compliance/:path*",
    "/broker/:path*",
    "/settings/:path*",
  ],
};
