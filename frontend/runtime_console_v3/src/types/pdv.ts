export type PdvProduct = {
  id: string;
  name: string;
  price_cents: number;
  stock: number;
  sku?: string | null;
  category?: string | null;
  images?: string[] | null;
};

export type PdvCartItem = {
  product_id: string;
  name: string;
  price_cents: number;
  quantity: number;
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
