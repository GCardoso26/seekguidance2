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

  const data = await res.json();

  if (!res.ok || !data.authenticated) {

    return NextResponse.json(

      { authenticated: false, error: data.error || "unauthorized" },

      { status: 401 },

    );

  }

  const out = NextResponse.json({

    authenticated: true,

    user: data.user,

    tenant_id: data.user?.tenant_id ?? "default",

  });

  out.cookies.set(ACCESS_COOKIE, data.tokens.access_token, cookieOptions(900));

  out.cookies.set(REFRESH_COOKIE, data.tokens.refresh_token, {

    ...cookieOptions(86_400),

    path: "/api/auth",

  });

  out.cookies.delete(API_KEY_COOKIE);

  return out;

}


