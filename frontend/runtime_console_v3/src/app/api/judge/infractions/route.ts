import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, API_KEY_COOKIE } from "@/lib/auth-cookies";

const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");

async function judgeHeaders(): Promise<Record<string, string>> {
  const jar = await cookies();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const access = jar.get(ACCESS_COOKIE)?.value;
  const apiKey = jar.get(API_KEY_COOKIE)?.value;
  if (access) headers.Authorization = `Bearer ${access}`;
  if (apiKey) headers["X-API-Key"] = apiKey;
  const judgeUser = jar.get("judge_user_id")?.value;
  if (judgeUser) headers["X-Judge-User-Id"] = judgeUser;
  return headers;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const target = `${API_BASE}/runtime/judge/infractions${url.search}`;
  try {
    const res = await fetch(target, { headers: await judgeHeaders(), cache: "no-store" });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  try {
    const res = await fetch(`${API_BASE}/runtime/judge/infractions`, {
      method: "POST",
      headers: await judgeHeaders(),
      body,
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
