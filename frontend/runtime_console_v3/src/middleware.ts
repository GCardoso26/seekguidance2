import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { OAUTH_RETURN_COOKIE } from "@/lib/auth/oauth-redirect";
import { isSafeInternalPath } from "@/lib/auth/safe-path";
import { isAdminRequest } from "@/lib/middleware-auth";

const ADMIN_PREFIXES = ["/observability", "/admin", "/ingestion"];

function hasSupabaseSession(request: NextRequest): boolean {
  return request.cookies.getAll().some(
    (cookie) =>
      cookie.name.startsWith("sb-") &&
      cookie.name.includes("auth-token") &&
      cookie.value.length > 0,
  );
}

function readOAuthReturnPath(request: NextRequest): string | null {
  const raw = request.cookies.get(OAUTH_RETURN_COOKIE)?.value;
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    if (isSafeInternalPath(decoded)) return decoded;
  } catch {
    return null;
  }
  return null;
}

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

  // Redirect server-side antes do React — cobre bounce /judge → / sem remount do AuthProvider
  if (
    pathname === "/" &&
    !request.nextUrl.searchParams.has("code") &&
    hasSupabaseSession(request)
  ) {
    const oauthReturn = readOAuthReturnPath(request);
    if (oauthReturn) {
      const target = new URL(oauthReturn, request.url);
      const response = NextResponse.redirect(target);
      response.cookies.set(OAUTH_RETURN_COOKIE, "", { maxAge: 0, path: "/" });
      return response;
    }
  }

  if (pathname === "/judge" && request.nextUrl.searchParams.get("from_oauth") === "1") {
    const response = NextResponse.next();
    response.cookies.set(OAUTH_RETURN_COOKIE, "", { maxAge: 0, path: "/" });
    return response;
  }

  const needsAdmin = ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (needsAdmin) {
    if (!isAdminRequest(request)) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
    return NextResponse.next();
  }

  const needsAuth =
    pathname === "/player/me" ||
    pathname.startsWith("/player/me/") ||
    pathname === "/perfil" ||
    pathname.startsWith("/perfil/") ||
    (pathname.startsWith("/social/communities") && pathname.includes("/posts/"));

  if (needsAuth && !hasSupabaseSession(request)) {
    const login = new URL("/judge", request.url);
    login.searchParams.set("redirect", pathname);
    return NextResponse.redirect(login);
  }

  if (pathname === "/onboarding" && !hasSupabaseSession(request)) {
    return NextResponse.redirect(new URL("/judge", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/judge",
    "/onboarding",
    "/player/me",
    "/player/me/:path*",
    "/perfil",
    "/perfil/:path*",
    "/social/communities/:path*/posts/:path*",
    "/observability/:path*",
    "/admin/:path*",
    "/ingestion/:path*",
    "/tournament/create",
    "/team/manage",
  ],
};
