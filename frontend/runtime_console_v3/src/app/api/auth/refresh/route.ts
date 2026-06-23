import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE, cookieOptions } from "@/lib/auth-cookies";

const API_BASE = (process.env.API_PROXY_TARGET || "https://seekguidance.onrender.com").replace(/\/$/, "");

export async function POST() {
  const jar = await cookies();
  const refresh = jar.get(REFRESH_COOKIE)?.value;
  if (!refresh) {
    return NextResponse.json({ refreshed: false, error: "no_refresh_token" }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok || !data.tokens?.access_token) {
      return NextResponse.json(
        { refreshed: false, error: data.detail || data.error || "refresh_failed" },
        { status: 401 },
      );
    }

    const out = NextResponse.json({ refreshed: true });
    out.cookies.set(ACCESS_COOKIE, data.tokens.access_token, cookieOptions(28_800));
    if (data.tokens.refresh_token) {
      out.cookies.set(REFRESH_COOKIE, data.tokens.refresh_token, {
        ...cookieOptions(86_400),
        path: "/api/auth",
      });
    }
    return out;
  } catch {
    return NextResponse.json({ refreshed: false, error: "api_unavailable" }, { status: 503 });
  }
}
