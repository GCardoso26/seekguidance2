import { NextResponse } from "next/server";
import { ACCESS_COOKIE, API_KEY_COOKIE, REFRESH_COOKIE, cookieOptions } from "@/lib/auth-cookies";

export async function POST(req: Request) {
  const { api_key: apiKey } = await req.json();
  if (!apiKey || typeof apiKey !== "string") {
    return NextResponse.json({ error: "api_key_required" }, { status: 400 });
  }
  const out = NextResponse.json({ authenticated: true });
  out.cookies.set(API_KEY_COOKIE, apiKey.trim(), cookieOptions(86_400 * 30));
  out.cookies.delete(ACCESS_COOKIE);
  out.cookies.delete(REFRESH_COOKIE);
  return out;
}
