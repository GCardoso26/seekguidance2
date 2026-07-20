/**
 * Behavior Profile — parâmetros determinísticos de uso real (infra de teste).
 * Não alimenta LPC/LCS; só cenários locais/ci/staging.
 */

export type BehaviorProfile = {
  publishesPerWeek: number;
  averageListings: number;
  averageOrderValueCents: number;
  returnsAfterDays: number;
  favoriteRarity: "common" | "uncommon" | "rare" | "mythic" | "enchanted" | "promo" | "any";
  preferredLanguage: "pt" | "en" | "jp" | "any";
  preferredCondition: "NM" | "LP" | "MP" | "HP" | "any";
  foilPreference: "none" | "nonfoil" | "foil" | "any";
  competitiveFormat: string | null;
  collectionFocus: string[];
};

export type ArchetypeId =
  | "seller-large"
  | "seller-small"
  | "collector"
  | "competitive"
  | "casual"
  | "buyer";

export type PersonaArchetype = {
  id: ArchetypeId;
  label: string;
  role: "seller" | "buyer" | "collector" | "hybrid";
  /** Compat com SellerBehavior legado */
  behavior:
    | "weeklyPublisher"
    | "competitiveSeller"
    | "casualSeller"
    | "collectorOnly"
    | "buyerOnly"
    | "hybrid";
  profile: BehaviorProfile;
  /** Quantidade alvo de linhas de inventário ao compor com um catalog */
  inventoryTarget: number;
  wishlistSize: number;
  favoritesSize: number;
  defaultPlan: "free" | "lojista" | "pro" | null;
};
