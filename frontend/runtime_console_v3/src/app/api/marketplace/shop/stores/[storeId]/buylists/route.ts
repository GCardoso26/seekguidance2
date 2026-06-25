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
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const { storeId } = await params;
    return await proxy(`/runtime/judge/marketplace/shop/stores/${encodeURIComponent(storeId)}/buylists`);
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const { storeId } = await params;
    const body = await req.text();
    return await proxy(
      `/runtime/judge/marketplace/shop/stores/${encodeURIComponent(storeId)}/buylists`,
      { method: "POST", body },
    );
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
