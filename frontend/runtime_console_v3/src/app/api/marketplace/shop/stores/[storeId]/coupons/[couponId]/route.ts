import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { normalizeSellerCoupon } from "@/types/seller-coupon";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ storeId: string; couponId: string }> }) {
  const { storeId, couponId } = await ctx.params;
  const bodyText = await req.text();

  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/shop/stores/${encodeURIComponent(storeId)}/coupons/${encodeURIComponent(couponId)}`,
      {
        method: "PATCH",
        headers: await tournamentProxyHeaders(req),
        body: bodyText,
        cache: "no-store",
      },
    );
    const data = (await res.json().catch(() => ({}))) as {
      coupon?: Record<string, unknown>;
      detail?: string;
    };
    if (!res.ok) {
      return NextResponse.json(
        { detail: data.detail ?? "Cupom não encontrado ou edição não suportada" },
        { status: res.status },
      );
    }
    return NextResponse.json({
      coupon: data.coupon ? normalizeSellerCoupon(data.coupon) : null,
    });
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ storeId: string; couponId: string }> }) {
  const { storeId, couponId } = await ctx.params;

  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/shop/stores/${encodeURIComponent(storeId)}/coupons/${encodeURIComponent(couponId)}`,
      {
        method: "PATCH",
        headers: await tournamentProxyHeaders(req),
        body: JSON.stringify({ is_active: false }),
        cache: "no-store",
      },
    );
    if (res.ok) {
      return NextResponse.json({ ok: true });
    }
    const data = (await res.json().catch(() => ({}))) as { detail?: string };
    return NextResponse.json(
      { detail: data.detail ?? "Cupom não encontrado" },
      { status: res.status },
    );
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
