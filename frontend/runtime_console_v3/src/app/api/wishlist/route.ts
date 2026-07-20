import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";
import { mockWishlistAdd, mockWishlistGet, WISHLIST_MOCK_CATALOG } from "@/lib/wishlist-mock";
import type { ShopProduct } from "@/lib/marketplace-shop";

async function resolveUser(_req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return user;
}

async function proxyWishlist(
  req: NextRequest,
  init?: RequestInit,
): Promise<Response | null> {
  try {
    const res = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/marketplace/wishlist`, {
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
  const user = await resolveUser(req);
  if (!user) {
    return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });
  }

  const proxied = await proxyWishlist(req, { method: "GET" });
  if (proxied) {
    const text = await proxied.text();
    return new NextResponse(text, {
      status: proxied.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Fail-closed in Beta / when explicitly requested — no silent mock success.
  if (
    process.env.JUDGE_BETA === "1" ||
    process.env.NEXT_PUBLIC_WISHLIST_FAIL_CLOSED === "1"
  ) {
    return NextResponse.json(
      { detail: "wishlist_upstream_unavailable", items: [], total: 0 },
      { status: 503 },
    );
  }

  const items = mockWishlistGet(user.id);
  return NextResponse.json({ items, total: items.length });
}

export async function POST(req: NextRequest) {
  const user = await resolveUser(req);
  if (!user) {
    return NextResponse.json({ detail: "Não autenticado" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    product_id?: string;
    product?: ShopProduct;
  };
  const productId = String(body.product_id ?? "").trim();
  if (!productId) {
    return NextResponse.json({ detail: "product_id obrigatório" }, { status: 400 });
  }

  const proxied = await proxyWishlist(req, {
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

  const snapshot = body.product ?? WISHLIST_MOCK_CATALOG[productId];
  const entry = mockWishlistAdd(user.id, productId, snapshot);
  if (!entry) {
    return NextResponse.json({ detail: "Produto não encontrado" }, { status: 404 });
  }

  return NextResponse.json(entry, { status: 201 });
}
