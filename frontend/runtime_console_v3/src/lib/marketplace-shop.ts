export function formatShopPrice(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export const SHOP_CATEGORIES = [
  { id: "booster", label: "Booster" },
  { id: "sleeve", label: "Sleeves" },
  { id: "deck_box", label: "Deck Box" },
  { id: "playmat", label: "Playmat" },
  { id: "accessory", label: "Acessórios" },
] as const;

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
