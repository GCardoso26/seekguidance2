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

function base(storeId: string) {
  return `/runtime/judge/marketplace/shop/stores/${encodeURIComponent(storeId)}/pdv/local-products`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const { storeId } = await params;
    const sp = req.nextUrl.searchParams;
    const qs = new URLSearchParams();
    const category = sp.get("category");
    const active = sp.get("active");
    const lowStock = sp.get("low_stock");
    if (category) qs.set("category", category);
    if (active != null && active !== "") qs.set("active", active);
    if (lowStock) qs.set("low_stock", lowStock);
    const q = qs.toString();
    return await proxy(`${base(storeId)}${q ? `?${q}` : ""}`);
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
    return await proxy(base(storeId), { method: "POST", body });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
