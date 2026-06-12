import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { buildAppRedirectUrl, getRequestOrigin, safeNextPath } from "@/lib/app-url";
import { assertAnonSupabaseKey } from "@/lib/supabase/key-guard";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

const AUTH_DEBUG = process.env.AUTH_DEBUG === "1" || process.env.NODE_ENV === "development";

export async function GET(request: NextRequest) {
  const requestOrigin = getRequestOrigin(request);
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));

  if (AUTH_DEBUG) {
    console.log("[Auth Callback] code:", code ? "present" : "missing");
    console.log("[Auth Callback] next:", next);
    console.log("[Auth Callback] origin:", requestOrigin);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.redirect(buildAppRedirectUrl("/?auth=missing_config", requestOrigin));
  }
  assertAnonSupabaseKey(key);

  if (!code) {
    return NextResponse.redirect(buildAppRedirectUrl(next, requestOrigin));
  }

  // PKCE: cookies de sessão devem ir no Response do redirect (padrão @supabase/ssr)
  const supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("OAuth callback exchange failed:", error.message);
    if (AUTH_DEBUG) console.log("[Auth Callback] exchange error:", error.message);
    return NextResponse.redirect(buildAppRedirectUrl("/?auth=error", requestOrigin));
  }

  const successPath = next.includes("?")
    ? `${next}&from_oauth=1`
    : `${next}?from_oauth=1`;
  if (AUTH_DEBUG) console.log("[Auth Callback] redirecting to:", successPath);
  const redirectResponse = NextResponse.redirect(buildAppRedirectUrl(successPath, requestOrigin));
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      domain: cookie.domain,
      maxAge: cookie.maxAge,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite as "lax" | "strict" | "none" | undefined,
    });
  });
  return redirectResponse;
}
