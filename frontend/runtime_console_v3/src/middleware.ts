import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/middleware-auth";

const ADMIN_PREFIXES = ["/observability", "/admin", "/ingestion"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Google OAuth às vezes cai na home com ?code= se o redirect URL no Supabase estiver incompleto
  if (pathname === "/" && request.nextUrl.searchParams.has("code")) {
    const callback = request.nextUrl.clone();
    callback.pathname = "/auth/callback";
    if (!callback.searchParams.has("next")) {
      callback.searchParams.set("next", "/judge");
    }
    return NextResponse.redirect(callback);
  }

  const needsAdmin = ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!needsAdmin) return NextResponse.next();

  if (!isAdminRequest(request)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    const hasConsoleCookie = Boolean(request.cookies.get("tcg_access")?.value);
    if (!hasConsoleCookie) {
      return NextResponse.redirect(new URL("/judge", request.url));
    }
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/observability/:path*",
    "/admin/:path*",
    "/ingestion/:path*",
    "/tournament/create",
    "/team/manage",
  ],
};
