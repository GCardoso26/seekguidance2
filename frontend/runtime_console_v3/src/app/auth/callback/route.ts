import { NextResponse } from "next/server";
import { buildAppRedirectUrl } from "@/lib/app-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/judge";

  if (code) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("OAuth callback exchange failed:", error.message);
        return NextResponse.redirect(buildAppRedirectUrl("/?auth=error", requestUrl.origin));
      }
    }
  }

  return NextResponse.redirect(buildAppRedirectUrl(next, requestUrl.origin));
}
