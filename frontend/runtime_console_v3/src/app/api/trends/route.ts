import { NextRequest, NextResponse } from "next/server";

const API_BASE = (process.env.API_PROXY_TARGET || process.env.NEXT_PUBLIC_API_URL || "https://seekguidance.onrender.com").replace(
  /\/$/,
  "",
);

export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const period = request.nextUrl.searchParams.get("period") || "7d";
  const limit = request.nextUrl.searchParams.get("limit") || "6";
  const game = request.nextUrl.searchParams.get("game");

  const params = new URLSearchParams({ limit, period });
  if (game) params.set("game", game);

  try {
    const res = await fetch(`${API_BASE}/runtime/judge/catalog/trends?${params}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return NextResponse.json({ trends: [], period, error: "upstream_unavailable" }, { status: 200 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ trends: [], period, error: "fetch_failed" }, { status: 200 });
  }
}
