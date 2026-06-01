import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_PROXY_TARGET?.replace(/\/$/, "") ?? "http://127.0.0.1:8000";

type Params = { params: Promise<{ uuid: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { uuid } = await params;
  const userId = req.headers.get("x-judge-user-id");
  const headers: Record<string, string> = {};
  if (userId) headers["X-Judge-User-Id"] = userId;

  const res = await fetch(`${API_BASE}/runtime/judge/session/${uuid}`, {
    headers,
    cache: "no-store",
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
}
