import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPrivateBeta = request.cookies.get("private-beta")?.value === "true";

  if (pathname === "/") {
    if (isPrivateBeta) {
      return NextResponse.rewrite(new URL("/home", request.url));
    }
    return NextResponse.next();
  }

  if (pathname !== "/") {
    if (!isPrivateBeta) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - ALLOW API for now (optional, can block if needed)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - icon.tsx/favicon.ico/etc (generated icons)
     * - public files (images, fonts, etc - assuming they don't crash)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|icon).*)",
  ],
};
