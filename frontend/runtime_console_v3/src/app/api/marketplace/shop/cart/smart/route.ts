import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { smartCartMock } from "@/lib/buyer-experience-mock";

export async function GET(req: NextRequest) {
  const goal = req.nextUrl.searchParams.get("goal") ?? "best_value";
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/shop/cart/smart?goal=${encodeURIComponent(goal)}`,
      {
        headers: await tournamentProxyHeaders(req),
        cache: "no-store",
      },
    );
    if (res.status === 404 || res.status === 501 || res.status === 503) {
      return NextResponse.json(smartCartMock(goal));
    }
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json(smartCartMock(goal));
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/marketplace/shop/cart/smart`, {
      method: "POST",
      headers: {
        ...(await tournamentProxyHeaders(req)),
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    });
    if (res.status === 404 || res.status === 501 || res.status === 503) {
      const parsed = JSON.parse(body || "{}") as { goal?: string };
      return NextResponse.json(smartCartMock(parsed.goal ?? "best_value"));
    }
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    const parsed = JSON.parse(body || "{}") as { goal?: string };
    return NextResponse.json(smartCartMock(parsed.goal ?? "best_value"));
  }
}
