import { NextRequest, NextResponse } from "next/server";
import { listCouponsFromApiRows } from "@/lib/seller-coupons-bff";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { normalizeSellerCoupon } from "@/types/seller-coupon";

export async function GET(req: NextRequest, ctx: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await ctx.params;
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") || "1");
  const limit = Number(url.searchParams.get("limit") || "20");
  const status = url.searchParams.get("status") || undefined;
  const type = url.searchParams.get("type") || undefined;

  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/shop/stores/${encodeURIComponent(storeId)}/coupons`,
      { headers: await tournamentProxyHeaders(req), cache: "no-store" },
    );
    if (res.status === 401 || res.status === 403) {
      return NextResponse.json({ detail: "unauthorized" }, { status: res.status });
    }
    if (!res.ok) {
      return NextResponse.json({ detail: "Falha ao listar cupons" }, { status: res.status });
    }
    const data = (await res.json()) as { coupons?: Record<string, unknown>[] };
    const payload = listCouponsFromApiRows(storeId, data.coupons ?? [], {
      page,
      limit,
      status,
      type,
    });
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await ctx.params;
  try {
    const body = await req.text();
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/shop/stores/${encodeURIComponent(storeId)}/coupons`,
      {
        method: "POST",
        headers: await tournamentProxyHeaders(req),
        body,
        cache: "no-store",
      },
    );
    const data = (await res.json().catch(() => ({}))) as {
      coupon?: Record<string, unknown>;
      detail?: string;
    };
    if (!res.ok) {
      return NextResponse.json(
        { detail: data.detail ?? "Erro ao criar cupom" },
        { status: res.status },
      );
    }
    const coupon = data.coupon ? normalizeSellerCoupon(data.coupon) : null;
    return NextResponse.json({ coupon }, { status: res.status });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
