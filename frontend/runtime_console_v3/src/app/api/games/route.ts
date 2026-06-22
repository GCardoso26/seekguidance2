import { NextResponse } from "next/server";

const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/runtime/judge/games`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch {
    return NextResponse.json({ games: [] }, { status: 503 });
  }
}
