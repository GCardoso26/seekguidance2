import { NextRequest, NextResponse } from "next/server";

const API_BASE = (
  process.env.API_PROXY_TARGET ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://seekguidance.onrender.com"
).replace(/\/$/, "");

export const revalidate = 60;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const qs = params.toString();
  try {
    const res = await fetch(`${API_BASE}/runtime/top-movers${qs ? `?${qs}` : ""}`, {
      next: { revalidate: 60 },
    });
    const data = await res.json().catch(() => ({ source: "data_marts", error: "parse_failed" }));
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ source: "data_marts", error: "upstream_unavailable" }, { status: 200 });
  }
}
