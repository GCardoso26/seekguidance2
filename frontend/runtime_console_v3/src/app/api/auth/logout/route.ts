import { NextResponse } from "next/server";

import { cookies } from "next/headers";

import { ACCESS_COOKIE, API_KEY_COOKIE, REFRESH_COOKIE } from "@/lib/auth-cookies";



const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");



export async function POST() {

  const jar = await cookies();

  const access = jar.get(ACCESS_COOKIE)?.value;

  const refresh = jar.get(REFRESH_COOKIE)?.value;

  if (access || refresh) {

    await fetch(`${API_BASE}/auth/logout`, {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({ access_token: access, refresh_token: refresh }),

    }).catch(() => undefined);

  }

  const out = NextResponse.json({ revoked: true });

  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, API_KEY_COOKIE]) {

    out.cookies.set(name, "", { httpOnly: true, path: "/", maxAge: 0 });

  }

  return out;

}


