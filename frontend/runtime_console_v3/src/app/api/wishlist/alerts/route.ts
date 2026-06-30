import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import {
  mockPriceAlertCreate,
  mockPriceAlertsList,
} from "@/lib/wishlist-price-alerts-mock";
import type { ShopProduct } from "@/lib/marketplace-shop";
import { WISHLIST_MOCK_CATALOG } from "@/lib/wishlist-mock";

async function resolveUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

async function proxyAlerts(req: NextRequest, init?: RequestInit): Promise<Response | null> {
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/marketplace/wishlist/alerts`, {
      ...init,
      headers: await tournamentProxyHeaders(req),
      cache: "no-store",
    });
    if (res.status === 404 || res.status === 501) return null;
    return res;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });

  const proxied = await proxyAlerts(req, { method: "GET" });
  if (proxied) {
    const text = await proxied.text();
    return new NextResponse(text, {
      status: proxied.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const alerts = mockPriceAlertsList(user.id);
  return NextResponse.json({ alerts, total: alerts.length });
}

export async function POST(req: NextRequest) {
  const user = await resolveUser();
  if (!user) return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    product_id?: string;
    alert_type?: string;
    target_price?: number | null;
    percentage?: number | null;
    baseline_price_cents?: number;
    product?: ShopProduct;
  };

  const productId = String(body.product_id ?? "").trim();
  if (!productId) {
    return NextResponse.json({ detail: "product_id obrigatório" }, { status: 400 });
  }

  const proxied = await proxyAlerts(req, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (proxied) {
    const text = await proxied.text();
    return new NextResponse(text, {
      status: proxied.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const catalog = body.product ?? WISHLIST_MOCK_CATALOG[productId];
  const baseline =
    body.baseline_price_cents ?? catalog?.price_cents ?? 0;

  const alert = mockPriceAlertCreate(user.id, {
    product_id: productId,
    alert_type: (body.alert_type as "any_drop" | "target_price" | "percentage_drop") ?? "any_drop",
    target_price: body.target_price ?? null,
    percentage: body.percentage ?? null,
    baseline_price_cents: baseline,
    product: catalog,
  });

  if (!alert) {
    return NextResponse.json({ detail: "Produto não encontrado" }, { status: 404 });
  }

  return NextResponse.json(alert, { status: 201 });
}
