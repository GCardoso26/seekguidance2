import type { SellerProductFilters } from "@/lib/seller-profile-query";

export function searchParamsFromSellerProductFilters(
  filters: SellerProductFilters,
  page = 1,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", "24");
  if (filters.condition) params.set("condition", filters.condition);
  if (filters.foil !== undefined) params.set("foil", String(filters.foil));
  if (filters.graded) params.set("graded", "true");
  if (filters.minPrice !== undefined) params.set("price_min", String(filters.minPrice * 100));
  if (filters.maxPrice !== undefined) params.set("price_max", String(filters.maxPrice * 100));
  if (filters.sortBy) params.set("sort", filters.sortBy);
  return params;
}
