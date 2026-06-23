import { NextResponse } from "next/server";

import { ACCESS_COOKIE, API_KEY_COOKIE, REFRESH_COOKIE, cookieOptions } from "@/lib/auth-cookies";



const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");



export async function POST(req: Request) {

  const body = await req.json();

  const res = await fetch(`${API_BASE}/auth/login`, {

    method: "POST",

    headers: { "Content-Type": "application/json" },

    body: JSON.stringify(body),

    cache: "no-store",

  });

  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    if (!res.ok) {
      return NextResponse.json(
        { authenticated: false, error: res.status === 503 ? "api_unavailable" : "login_failed" },
        { status: res.status >= 400 ? res.status : 502 },
      );
    }
  }

  if (!res.ok || !data.authenticated) {

    return NextResponse.json(

      { authenticated: false, error: data.error || "unauthorized" },

      { status: 401 },

    );

  }

  const tokens = data.tokens as { access_token?: string; refresh_token?: string } | undefined;
  if (!tokens?.access_token || !tokens?.refresh_token) {
    return NextResponse.json({ authenticated: false, error: "invalid_token_response" }, { status: 502 });
  }

  const user = data.user as { tenant_id?: string } | undefined;
  const out = NextResponse.json({
    authenticated: true,
    user: data.user,
    tenant_id: user?.tenant_id ?? "default",
  });

  out.cookies.set(ACCESS_COOKIE, tokens.access_token, cookieOptions(28_800));
  out.cookies.set(REFRESH_COOKIE, tokens.refresh_token, {

    ...cookieOptions(86_400),

    path: "/api/auth",

  });

  out.cookies.delete(API_KEY_COOKIE);

  return out;

}


