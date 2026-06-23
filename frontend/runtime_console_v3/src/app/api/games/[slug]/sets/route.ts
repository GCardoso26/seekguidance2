import { NextResponse } from "next/server";

const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");

type RouteParams = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { slug } = await params;
  try {
    const res = await fetch(`${API_BASE}/runtime/judge/catalog/games/${encodeURIComponent(slug)}/sets`, {
      cache: "no-store",
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ sets: [] }, { status: 503 });
  }
}
