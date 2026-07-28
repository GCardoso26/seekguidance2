import type { ProductCategoryId } from "@/lib/tcg-product-categories";
import type { MasterCatalogSearchItem } from "@/hooks/useMasterProductCatalog";

/** Maps portal category chips → master catalog category/subcategory. */
export const PORTAL_CATEGORY_MASTER_LOOKUP: Partial<
  Record<ProductCategoryId, { catalogCategory: string; subcategory?: string }>
> = {
  booster_box: { catalogCategory: "SEALED_PRODUCT", subcategory: "BOOSTER_BOX" },
  booster: { catalogCategory: "SEALED_PRODUCT", subcategory: "BOOSTER_PACK" },
  bundle: { catalogCategory: "SEALED_PRODUCT", subcategory: "ILLUMINEERS_TROVE" },
  box_set_display: { catalogCategory: "SEALED_PRODUCT", subcategory: "GIFT_SET" },
  starter_deck: { catalogCategory: "SEALED_PRODUCT", subcategory: "STARTER_DECK" },
  preconstructed_deck: { catalogCategory: "SEALED_PRODUCT", subcategory: "STARTER_DECK" },
  tin: { catalogCategory: "SEALED_PRODUCT", subcategory: "TIN" },
  blisters: { catalogCategory: "SEALED_PRODUCT", subcategory: "BLISTER" },
  prerelease_pack: { catalogCategory: "SEALED_PRODUCT", subcategory: "PRERELEASE" },
  complete_set: { catalogCategory: "SEALED_PRODUCT", subcategory: "COMPLETE_SET" },
  oversized: { catalogCategory: "SEALED_PRODUCT", subcategory: "OVERSIZED" },
  empty_storage: { catalogCategory: "DECK_BOX" },
  sleeve: { catalogCategory: "SLEEVES" },
  album: { catalogCategory: "BINDER" },
  deck_box: { catalogCategory: "DECK_BOX" },
  playmat: { catalogCategory: "PLAYMAT" },
  dice: { catalogCategory: "DICE" },
  accessory: { catalogCategory: "COUNTERS" },
  token: { catalogCategory: "COUNTERS" },
  don_card: { catalogCategory: "COUNTERS" },
  memory_gauge: { catalogCategory: "COUNTERS" },
  art_card_token: { catalogCategory: "COUNTERS" },
  memorabilia: { catalogCategory: "SEALED_PRODUCT" },
};

export function pickMasterCatalogImage(
  items: MasterCatalogSearchItem[],
  categoryId: ProductCategoryId,
): string | null {
  const lookup = PORTAL_CATEGORY_MASTER_LOOKUP[categoryId];
  if (!lookup) return null;

  const withImage = items.filter((i) => i.image_url);
  const exact = withImage.find(
    (i) =>
      i.category === lookup.catalogCategory &&
      (!lookup.subcategory || i.subcategory === lookup.subcategory),
  );
  if (exact?.image_url) return exact.image_url;

  if (!lookup.subcategory) {
    const byCategory = withImage.find((i) => i.category === lookup.catalogCategory);
    return byCategory?.image_url ?? null;
  }

  return null;
}

export function masterCatalogCategoriesToFetch(categoryIds: ProductCategoryId[]): string[] {
  const cats = new Set<string>();
  for (const id of categoryIds) {
    const lookup = PORTAL_CATEGORY_MASTER_LOOKUP[id];
    if (lookup) cats.add(lookup.catalogCategory);
  }
  return [...cats];
}
