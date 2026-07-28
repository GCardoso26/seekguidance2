"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MasterCatalogSearchItem } from "@/hooks/useMasterProductCatalog";
import {
  masterCatalogCategoriesToFetch,
  pickMasterCatalogImage,
} from "@/lib/portal-category-images";
import type { ProductCategoryId } from "@/lib/tcg-product-categories";
import type { GameId } from "@/types/card";

async function fetchCatalogCategory(
  gameId: GameId,
  catalogCategory: string,
): Promise<MasterCatalogSearchItem[]> {
  const params = new URLSearchParams({
    category: catalogCategory,
    limit: "80",
  });
  const isAccessory = catalogCategory !== "SEALED_PRODUCT";
  if (!isAccessory) params.set("game", gameId);

  const res = await fetch(`/api/product-catalog/search?${params.toString()}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { items?: MasterCatalogSearchItem[] };
  return data.items ?? [];
}

/** Imagens do catálogo mestre por categoria de produto (selados + acessórios). */
export function usePortalCategoryImages(gameId: GameId, categoryIds: ProductCategoryId[]) {
  const catalogCategories = useMemo(
    () => masterCatalogCategoriesToFetch(categoryIds),
    [categoryIds],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["portal-category-images", gameId, catalogCategories],
    queryFn: async () => {
      const batches = await Promise.all(
        catalogCategories.map((cat) => fetchCatalogCategory(gameId, cat)),
      );
      return batches.flat();
    },
    staleTime: 300_000,
    enabled: categoryIds.length > 0,
  });

  const images = useMemo(() => {
    const items = data ?? [];
    const map: Partial<Record<ProductCategoryId, string>> = {};
    for (const id of categoryIds) {
      const url = pickMasterCatalogImage(items, id);
      if (url) map[id] = url;
    }
    return map;
  }, [categoryIds, data]);

  return { images, isLoading };
}
