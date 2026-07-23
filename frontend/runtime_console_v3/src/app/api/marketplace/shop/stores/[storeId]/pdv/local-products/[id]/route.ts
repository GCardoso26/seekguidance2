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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string; id: string }> },
) {
  try {
    const { storeId, id } = await params;
    const body = await req.text();
    return await proxy(
      `/runtime/judge/marketplace/shop/stores/${encodeURIComponent(storeId)}/pdv/local-products/${encodeURIComponent(id)}`,
      { method: "PUT", body },
    );
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ storeId: string; id: string }> },
) {
  try {
    const { storeId, id } = await params;
    return await proxy(
      `/runtime/judge/marketplace/shop/stores/${encodeURIComponent(storeId)}/pdv/local-products/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
