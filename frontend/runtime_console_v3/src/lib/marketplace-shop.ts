import { SHOP_CATEGORIES_FLAT } from "@/lib/tcg-product-categories";

export function formatShopPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const SHOP_CATEGORIES = SHOP_CATEGORIES_FLAT;

export type ShopProduct = {
  id: string;
  name: string;
  description?: string | null;
  tcg_id?: string | null;
  category: string;
  price_cents: number;
  store_name?: string;
  store_slug?: string;
  store_logo_url?: string | null;
  images?: string[];
  stock?: number;
  created_at?: string | null;
  condition?: string | null;
};

export type ShopCartItem = {
  product_id: string;
  store_id: string;
  name: string;
  image?: string | null;
  price_cents: number;
  quantity: number;
};

export type ShopCart = {
  id: string;
  items: ShopCartItem[];
  total_cents: number;
};

export async function addProductToCart(
  productId: string,
  quantity = 1,
  cardId?: string | null,
): Promise<{ ok: true } | { ok: false; status: number; message: string; needsLogin?: boolean }> {
  const res = await fetch("/api/marketplace/shop/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product_id: productId,
      quantity,
      ...(cardId ? { card_id: cardId } : {}),
    }),
  });

  if (res.ok) {
    return { ok: true };
  }

  const data = (await res.json().catch(() => ({}))) as { detail?: string | Array<{ msg?: string }> };
  const detail = data.detail;
  const message =
    typeof detail === "string"
      ? detail
      : Array.isArray(detail)
        ? detail.map((d) => d.msg).filter(Boolean).join("; ") || "Não foi possível adicionar ao carrinho"
        : "Não foi possível adicionar ao carrinho";

  return {
    ok: false,
    status: res.status,
    message:
      res.status === 404
        ? message.includes("Produto")
          ? message
          : "Produto indisponível para compra (oferta sem estoque vinculado)."
        : message,
    needsLogin: res.status === 401,
  };
}
