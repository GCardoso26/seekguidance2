import { NextRequest, NextResponse } from "next/server";

const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");

export async function GET(request: NextRequest) {
  const game = request.nextUrl.searchParams.get("game");
  const qs = game ? `?game=${encodeURIComponent(game)}` : "";

  try {
    const res = await fetch(`${API_BASE}/runtime/judge/catalog/sets${qs}`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch {
    return NextResponse.json({ sets: [] }, { status: 503 });
  }
}
