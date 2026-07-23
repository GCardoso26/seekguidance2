/**
 * Accessory taxonomy supported by all manufacturer providers.
 * Never auto-associate accessories to a TCG.
 */
export const UNIVERSAL_ACCESSORY_TYPES = [
  "sleeves",
  "perfect_fit",
  "outer_sleeves",
  "deck_box",
  "deck_case",
  "storage_box",
  "binder",
  "portfolio",
  "playmat",
  "playmat_tube",
  "dice",
  "dice_tray",
  "life_counter",
  "counters",
  "tokens",
  "divider",
  "top_loader",
  "magnetic_case",
  "storage",
  "acrylic",
  "accessories",
] as const;

export type UniversalAccessoryType = (typeof UNIVERSAL_ACCESSORY_TYPES)[number];

export const ACCESSORY_TYPE_TO_CATEGORY: Record<
  UniversalAccessoryType,
  "SLEEVES" | "DECK_BOX" | "BINDER" | "BINDER_PAGE" | "DICE" | "COUNTERS" | "PLAYMAT"
> = {
  sleeves: "SLEEVES",
  perfect_fit: "SLEEVES",
  outer_sleeves: "SLEEVES",
  deck_box: "DECK_BOX",
  deck_case: "DECK_BOX",
  storage_box: "DECK_BOX",
  storage: "DECK_BOX",
  acrylic: "DECK_BOX",
  binder: "BINDER",
  portfolio: "BINDER",
  divider: "BINDER_PAGE",
  playmat: "PLAYMAT",
  playmat_tube: "PLAYMAT",
  dice: "DICE",
  dice_tray: "DICE",
  life_counter: "COUNTERS",
  counters: "COUNTERS",
  tokens: "COUNTERS",
  top_loader: "COUNTERS",
  magnetic_case: "COUNTERS",
  accessories: "COUNTERS",
};

export const ACCESSORY_TYPE_TO_SUBCATEGORY: Record<UniversalAccessoryType, string> = {
  sleeves: "STANDARD_MATTE",
  perfect_fit: "PERFECT_FIT",
  outer_sleeves: "OUTER_SLEEVES",
  deck_box: "PLASTIC",
  deck_case: "DECK_CASE",
  storage_box: "STORAGE_BOX",
  storage: "STORAGE_BOX",
  acrylic: "ACRYLIC_BOX",
  binder: "ZIP",
  portfolio: "PORTFOLIO",
  divider: "DIVIDER",
  playmat: "STANDARD",
  playmat_tube: "PLAYMAT_TUBE",
  dice: "D6",
  dice_tray: "DICE_TRAY",
  life_counter: "LIFE_COUNTER",
  counters: "DAMAGE_COUNTER",
  tokens: "TOKEN",
  top_loader: "TOP_LOADER",
  magnetic_case: "MAGNETIC_CASE",
  accessories: "OTHER",
};
