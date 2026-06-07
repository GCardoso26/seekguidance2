import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { buildAppRedirectUrl, getRequestOrigin, safeNextPath } from "@/lib/app-url";
import { assertAnonSupabaseKey } from "@/lib/supabase/key-guard";

export async function GET(request: NextRequest) {
  const requestOrigin = getRequestOrigin(request);
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));

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
      setAll(cookiesToSet) {
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
    return NextResponse.redirect(buildAppRedirectUrl("/?auth=error", requestOrigin));
  }

  const redirectResponse = NextResponse.redirect(buildAppRedirectUrl(next, requestOrigin));
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie.name, cookie.value);
  });
  return redirectResponse;
}
