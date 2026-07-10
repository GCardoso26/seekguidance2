import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE } from "@/lib/tournament-api";
import { storeReputationMock } from "@/lib/buyer-experience-mock";

type Ctx = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, context: Ctx) {
  const { slug } = await context.params;
  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/shop/stores/slug/${encodeURIComponent(slug)}/reputation`,
      { cache: "no-store" },
    );
    if (res.status === 404 || res.status === 501 || res.status === 503) {
      return NextResponse.json(storeReputationMock(slug));
    }
    const text = await res.text();
    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json(storeReputationMock(slug));
  }
}
