import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_PROXY_TARGET?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

export async function POST(req: NextRequest) {
  const userId = req.headers.get("x-judge-user-id");
  if (!userId) {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }
  const body = await req.text();
  const res = await fetch(`${API_BASE}/runtime/judge/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Judge-User-Id": userId,
    },
    body,
    cache: "no-store",
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
}
