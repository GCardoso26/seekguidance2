export type InventorySource =
  | "my_catalog"
  | "system"
  | "bestsellers_marketplace"
  | "bestsellers_store";

export type InventoryKind = "cards" | "products";

export type StockFilter = "all" | "with_stock" | "without_stock";

export type PublishStatus = "active" | "inactive" | "all";

export type SalesPeriod = "day" | "week" | "month" | "year";

export type InventoryHealth = {
  score: number;
  band: "healthy" | "warn" | "critical" | string;
  flags: string[];
};

export type InventoryItem = {
  id: string;
  kind: InventoryKind;
  title: string;
  image_url?: string | null;
  game?: string | null;
  set_code?: string | null;
  listing_id?: string | null;
  product_id?: string | null;
  card_id?: string | null;
  quantity: number;
  price_cents: number;
  condition?: string;
  language?: string;
  foil?: boolean;
  sold_qty?: number | null;
  category?: string | null;
  sku?: string | null;
  ink?: string | null;
  source?: string | null;
  status?: string | null;
  last_sync?: string | null;
  sync_history?: unknown[];
  health?: InventoryHealth;
  health_score?: number;
};

export const LORCANA_INKS = [
  { id: "amber", label: "Amber" },
  { id: "amethyst", label: "Amethyst" },
  { id: "emerald", label: "Emerald" },
  { id: "ruby", label: "Ruby" },
  { id: "sapphire", label: "Sapphire" },
  { id: "steel", label: "Steel" },
] as const;

export const INVENTORY_LANGUAGES = [
  { id: "pt", label: "PT" },
  { id: "en", label: "EN" },
  { id: "es", label: "ES" },
  { id: "de", label: "DE" },
  { id: "fr", label: "FR" },
  { id: "it", label: "IT" },
  { id: "jp", label: "JP" },
] as const;

export type InventorySearchResponse = {
  items: InventoryItem[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
  source: InventorySource;
  kind: InventoryKind;
  status?: PublishStatus;
};

export type DashboardAction = {
  id: string;
  label: string;
  count: number;
  filter?: Record<string, unknown>;
  note?: string;
};

export const INVENTORY_SOURCES: {
  id: InventorySource;
  label: string;
  help: string;
}[] = [
  {
    id: "my_catalog",
    label: "Meu Cadastro",
    help: "Produtos e listagens que você já cadastrou ou adicionou ao estoque.",
  },
  {
    id: "system",
    label: "Base interna do Sistema",
    help: "Catálogo JudgeTCG. Ao adicionar, o item passa a integrar seu estoque.",
  },
  {
    id: "bestsellers_marketplace",
    label: "Mais Vendidas Marketplace",
    help: "Ranking de vendas do marketplace (pedidos pagos). Atualização em tempo real.",
  },
  {
    id: "bestsellers_store",
    label: "Mais Vendidas Minha Loja",
    help: "Ranking com base nas vendas da sua loja. Sumário incremental.",
  },
];
