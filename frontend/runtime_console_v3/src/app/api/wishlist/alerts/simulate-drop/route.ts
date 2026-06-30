import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockSimulatePriceDrop } from "@/lib/wishlist-price-alerts-mock";

/** Stub dev/E2E: simula queda de preço e dispara notificação se alerta ativo. */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ detail: "Autenticação indisponível" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    product_id?: string;
    new_price_cents?: number;
  };

  const productId = String(body.product_id ?? "").trim();
  const newPriceCents = Number(body.new_price_cents);
  if (!productId || !Number.isFinite(newPriceCents) || newPriceCents < 0) {
    return NextResponse.json({ detail: "Dados inválidos" }, { status: 400 });
  }

  const notification = mockSimulatePriceDrop(user.id, productId, newPriceCents);
  if (!notification) {
    return NextResponse.json({ triggered: false });
  }

  return NextResponse.json({ triggered: true, notification });
}
