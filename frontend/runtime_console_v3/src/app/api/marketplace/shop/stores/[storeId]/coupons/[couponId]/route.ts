import { NextRequest, NextResponse } from "next/server";
import { removeCouponFromOverlay, updateCouponInOverlay } from "@/lib/seller-coupons-bff";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ storeId: string; couponId: string }> }) {
  const { storeId, couponId } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (body.is_active === false) {
    try {
      const res = await fetch(
        `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/shop/stores/${encodeURIComponent(storeId)}/coupons/${encodeURIComponent(couponId)}/deactivate`,
        { method: "POST", headers: await tournamentProxyHeaders(), cache: "no-store" },
      );
      const text = await res.text();
      if (res.ok) {
        return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
      }
    } catch {
      // fallback overlay
    }
  }

  const patch: Record<string, unknown> = {};
  if (body.type !== undefined) patch.type = body.type;
  if (body.value_cents !== undefined) patch.value_cents = body.value_cents;
  if (body.min_order_cents !== undefined) patch.min_order_cents = body.min_order_cents;
  if (body.max_uses !== undefined) patch.max_uses = body.max_uses;
  if (body.expires_at !== undefined) patch.expires_at = body.expires_at;
  if (body.is_active !== undefined) patch.is_active = body.is_active;

  const updated = updateCouponInOverlay(storeId, couponId, patch);
  if (updated) {
    return NextResponse.json({ coupon: updated });
  }

  return NextResponse.json(
    { detail: "Cupom não encontrado ou edição não suportada pelo backend" },
    { status: 404 },
  );
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ storeId: string; couponId: string }> }) {
  const { storeId, couponId } = await ctx.params;

  try {
    const res = await fetch(
      `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/shop/stores/${encodeURIComponent(storeId)}/coupons/${encodeURIComponent(couponId)}/deactivate`,
      { method: "POST", headers: await tournamentProxyHeaders(), cache: "no-store" },
    );
    if (res.ok) {
      return NextResponse.json({ ok: true });
    }
  } catch {
    // overlay fallback
  }

  const removed = removeCouponFromOverlay(storeId, couponId);
  if (removed) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ detail: "Cupom não encontrado" }, { status: 404 });
}
