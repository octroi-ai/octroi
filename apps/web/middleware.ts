import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Auth gate: protected routes require a session (the octroi_key cookie set at
// login / register / "view demo"). No Supabase — fully self-contained.
export function middleware(request: NextRequest) {
  const session = request.cookies.get("octroi_key");
  if (!session?.value) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
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
