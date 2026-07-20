import type { ProductCategory } from "./enums.js";

export type SubcategoryDef = { id: string; labelPt: string };

/** Subcategorias oficiais por categoria (labels PT-BR). */
export const OFFICIAL_SUBCATEGORIES: Record<ProductCategory, SubcategoryDef[]> = {
  SEALED_PRODUCT: [
    { id: "BOOSTER_BOX", labelPt: "Booster Box" },
    { id: "BOOSTER_PACK", labelPt: "Booster Pack" },
    { id: "COLLECTOR_BOOSTER", labelPt: "Collector Booster" },
    { id: "STARTER_DECK", labelPt: "Starter Deck" },
    { id: "COMMANDER_DECK", labelPt: "Commander Deck" },
    { id: "STRUCTURE_DECK", labelPt: "Structure Deck" },
    { id: "PRERELEASE_KIT", labelPt: "Prerelease Kit" },
    { id: "BUNDLE", labelPt: "Bundle" },
    { id: "ELITE_TRAINER_BOX", labelPt: "Elite Trainer Box" },
    { id: "GIFT_BOX", labelPt: "Gift Box" },
    { id: "TROVE", labelPt: "Trove" },
    { id: "COLLECTION_BOX", labelPt: "Collection Box" },
    { id: "DOUBLE_PACK", labelPt: "Double Pack" },
    { id: "TOURNAMENT_KIT", labelPt: "Tournament Kit" },
    { id: "ACCESSORIES_BUNDLE", labelPt: "Accessories Bundle" },
  ],
  SLEEVES: [
    { id: "STANDARD_MATTE", labelPt: "Standard Matte" },
    { id: "DUAL_MATTE", labelPt: "Dual Matte" },
    { id: "ART_SLEEVES", labelPt: "Art Sleeves" },
    { id: "JAPANESE_SIZE", labelPt: "Japanese Size" },
    { id: "PERFECT_FIT", labelPt: "Perfect Fit" },
    { id: "OUTER_SLEEVES", labelPt: "Outer Sleeves" },
  ],
  DECK_BOX: [
    { id: "PLASTIC", labelPt: "Plástico" },
    { id: "PREMIUM", labelPt: "Premium" },
    { id: "MAGNETIC", labelPt: "Magnética" },
    { id: "FLIP", labelPt: "Flip" },
    { id: "TWIN", labelPt: "Twin" },
    { id: "CONVERTIBLE", labelPt: "Convertible" },
  ],
  BINDER: [
    { id: "ZIP", labelPt: "Zip" },
    { id: "RING_BINDER", labelPt: "Ring Binder" },
    { id: "PREMIUM_BINDER", labelPt: "Premium Binder" },
    { id: "PORTFOLIO", labelPt: "Portfolio" },
  ],
  BINDER_PAGE: [
    { id: "POCKET_9", labelPt: "9 Pocket" },
    { id: "POCKET_12", labelPt: "12 Pocket" },
    { id: "POCKET_18", labelPt: "18 Pocket" },
    { id: "SIDE_LOADING", labelPt: "Side Loading" },
  ],
  DICE: [
    { id: "D6", labelPt: "D6" },
    { id: "D20", labelPt: "D20" },
    { id: "RPG_SET", labelPt: "RPG Set" },
    { id: "METAL_DICE", labelPt: "Metal Dice" },
  ],
  COUNTERS: [
    { id: "ACRYLIC", labelPt: "Acrílico" },
    { id: "GLASS", labelPt: "Vidro" },
    { id: "PLASTIC", labelPt: "Plástico" },
    { id: "LORE_COUNTER", labelPt: "Lore Counter" },
    { id: "POISON_MARKER", labelPt: "Marcador de Envenenamento" },
    { id: "SHIELD_MARKER", labelPt: "Marcador de Escudo" },
    { id: "DAMAGE_COUNTER", labelPt: "Contador de dano" },
  ],
  PLAYMAT: [
    { id: "STANDARD", labelPt: "Standard" },
    { id: "STITCHED", labelPt: "Stitched" },
    { id: "PREMIUM_XL", labelPt: "Premium XL" },
  ],
};

export function isValidSubcategory(category: ProductCategory, subcategory: string): boolean {
  return OFFICIAL_SUBCATEGORIES[category].some((s) => s.id === subcategory);
}
