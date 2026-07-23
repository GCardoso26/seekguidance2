export type PdvProductSource = "official" | "local";

export type PdvProduct = {
  id: string;
  name: string;
  price_cents: number;
  /** null = infinite stock (local products only). */
  stock: number | null;
  sku?: string | null;
  barcode?: string | null;
  category?: string | null;
  images?: string[] | null;
  source?: PdvProductSource;
  local_product_id?: string | null;
  cost_cents?: number | null;
};

export type PdvCartItem = {
  product_id: string;
  local_product_id?: string | null;
  source: PdvProductSource;
  name: string;
  price_cents: number;
  quantity: number;
  /** Thumb URL for cart line (from product.images via Asset/legacy CDN). */
  image_url?: string | null;
  category?: string | null;
};

export type PdvPaymentMethod = "cash" | "pix" | "card";

export type PdvSaleRecord = {
  id?: string;
  total_cents?: number;
  payment_method?: string;
  items?: unknown;
  created_at?: string;
};

export type PdvPixIntent = {
  mode: "manual" | "gateway";
  txid: string | null;
  transaction_id?: string | null;
  sale_id?: string | null;
  copy_payload: string;
  qr_code: string | null;
  pix_qr_code?: string | null;
  amount_cents: number;
  pix_key: string;
  store_name: string;
  expires_at: string;
};

export const PDV_LOCAL_CATEGORIES = [
  "Snack",
  "Bebida",
  "Booster",
  "Serviço",
  "Taxa",
  "Acessório",
  "Outros",
] as const;

export type PdvLocalCategory = (typeof PDV_LOCAL_CATEGORIES)[number];

export type PdvLocalProduct = {
  id: string;
  store_id: string;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  category: string;
  price_cents: number;
  cost_cents?: number | null;
  stock: number | null;
  minimum_stock?: number | null;
  active: boolean;
  item_kind?: string;
  created_at?: string;
  updated_at?: string;
  source?: "local";
};

export type PdvLocalReport = {
  revenue_local_cents: number;
  revenue_official_cents: number;
  profit_local_cents: number;
  margin_pct: number;
  top_products: Array<{
    local_product_id?: string | null;
    name: string;
    quantity: number;
    revenue_cents: number;
    profit_cents: number;
  }>;
  low_stock: PdvLocalProduct[];
};

export function pdvStockLabel(stock: number | null | undefined): string {
  if (stock == null) return "∞";
  return String(stock);
}

export function pdvCanAddToCart(stock: number | null | undefined, qtyInCart = 0): boolean {
  if (stock == null) return true;
  return stock > qtyInCart;
}
