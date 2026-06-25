import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

async function proxy(path: string, init?: RequestInit) {
  const res = await fetch(`${TOURNAMENT_API_BASE}${path}`, {
    ...init,
    headers: { ...(await tournamentProxyHeaders()), ...(init?.headers as Record<string, string>) },
    cache: "no-store",
  });
  const text = await res.text();
  return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const { storeId } = await params;
    const qs = req.nextUrl.searchParams.toString();
    return await proxy(
      `/runtime/judge/marketplace/shop/stores/${encodeURIComponent(storeId)}/crm/customers${qs ? `?${qs}` : ""}`,
    );
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
