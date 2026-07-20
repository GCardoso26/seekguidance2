/**
 * Modelo comum de Persona — exclusivo de testing/.
 * Não é domínio de produto; não altera contratos públicos.
 *
 * Persona = Archetype (comportamento) + GameCatalog (dataset).
 */

import type { ArchetypeId, BehaviorProfile } from "../archetypes/types.ts";

export type PersonaRole = "seller" | "buyer" | "collector" | "admin" | "hybrid";

export type SellerBehavior =
  | "weeklyPublisher"
  | "competitiveSeller"
  | "casualSeller"
  | "collectorOnly"
  | "buyerOnly"
  | "hybrid";

export type GameSlug =
  | "lorcana"
  | "mtg"
  | "pokemon"
  | "onepiece"
  | "digimon"
  | "dragonball"
  | "riftbound"
  | "naruto";

export type InventoryLine = {
  /** Nome canônico da carta (dataset de teste) */
  cardName: string;
  quantity: number;
  condition?: "NM" | "LP" | "MP" | "HP";
  language?: string;
  priceCents?: number;
  tags?: string[]; // staple | enchanted | promo | iconic | commander
};

export type PersonaShop = {
  id: string;
  slug: string;
  name: string;
  plan: "free" | "lojista" | "pro";
  shopEnabled: boolean;
};

export type PersonaOrder = {
  id: string;
  status: "pending" | "paid" | "processing" | "shipped" | "delivered" | "cancelled";
  totalCents: number;
  itemNames: string[];
};

export type Persona = {
  id: string;
  email: string;
  password: string;
  displayName: string;
  game: GameSlug;
  role: PersonaRole;
  behavior: SellerBehavior;
  /** Composição: archetipo reutilizável (seller-large, competitive, …) */
  archetypeId?: ArchetypeId;
  /** Perfil de uso determinístico para cenários / simulation */
  profile?: BehaviorProfile;
  shop: PersonaShop | null;
  inventory: InventoryLine[];
  wishlist: string[];
  favorites: string[];
  orders: PersonaOrder[];
  cart: Array<{ cardName: string; quantity: number }>;
  listings: InventoryLine[];
};

export type GamePersonaPack = {
  game: GameSlug;
  /** Dataset pronto? Naruto = scaffold sem cartas. */
  datasetReady: boolean;
  personas: Persona[];
};
