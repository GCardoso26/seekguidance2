export type SearchResultGroup =
  | "cards"
  | "orders"
  | "products"
  | "customers"
  | "users"
  | "tickets"
  | "system";

export type SearchSurface =
  | "marketplace"
  | "seller"
  | "admin"
  | "judge"
  | "public";

export type SearchContext = {
  surface: SearchSurface;
  pathname: string;
  isAuthenticated: boolean;
  isSeller: boolean;
  isAdmin: boolean;
  isJudge: boolean;
};

export type SearchResult = {
  id: string;
  group: SearchResultGroup;
  title: string;
  subtitle?: string;
  href: string;
  providerId: string;
  keywords?: string[];
  score?: number;
  meta?: Record<string, unknown>;
};

export type SearchAction = {
  id: string;
  label: string;
  href?: string;
};

export const GROUP_LABELS: Record<SearchResultGroup, string> = {
  cards: "Cartas",
  orders: "Pedidos",
  products: "Produtos",
  customers: "Clientes",
  users: "Usuários",
  tickets: "Tickets",
  system: "Sistema",
};

export const GROUP_ORDER: SearchResultGroup[] = [
  "cards",
  "orders",
  "products",
  "customers",
  "users",
  "tickets",
  "system",
];
