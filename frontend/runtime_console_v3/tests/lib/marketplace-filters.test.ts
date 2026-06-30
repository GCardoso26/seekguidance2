import { describe, expect, it } from "vitest";
import {
  buildMarketplaceProductsQuery,
  filtersFromSearchParams,
  searchParamsFromFilters,
  sortToApiParam,
} from "@/lib/marketplace-filters";

describe("marketplace-filters", () => {
  it("parse query string → filtros", () => {
    const params = new URLSearchParams(
      "q=booster&min_price=10&max_price=99&condition=NM,LP&game_id=MTG&store_id=abc&in_stock=true&sort=price_asc&page=2",
    );
    const filters = filtersFromSearchParams(params);
    expect(filters).toEqual({
      q: "booster",
      minPrice: 10,
      maxPrice: 99,
      condition: ["NM", "LP"],
      gameId: "MTG",
      storeId: "abc",
      inStock: true,
      sortBy: "price_asc",
      page: 2,
    });
  });

  it("filtros → query string shareable", () => {
    const params = searchParamsFromFilters({
      q: "playmat",
      minPrice: 25,
      gameId: "POKEMON",
      inStock: true,
      sortBy: "newest",
      page: 3,
    });
    expect(params.get("q")).toBe("playmat");
    expect(params.get("min_price")).toBe("25");
    expect(params.get("game_id")).toBe("POKEMON");
    expect(params.get("in_stock")).toBe("true");
    expect(params.get("sort")).toBe("newest");
    expect(params.get("page")).toBe("3");
  });

  it("mapeia filtros para API BFF", () => {
    const api = buildMarketplaceProductsQuery({
      q: "sleeve",
      gameId: "YGO",
      minPrice: 5,
      condition: ["NM"],
      inStock: true,
      sortBy: "price_desc",
      page: 1,
      limit: 24,
    });
    expect(api.get("search")).toBe("sleeve");
    expect(api.get("tcg_id")).toBe("YGO");
    expect(api.get("min_price")).toBe("5");
    expect(api.get("condition")).toBe("NM");
    expect(api.get("in_stock")).toBe("true");
    expect(api.get("sort")).toBe(sortToApiParam("price_desc"));
    expect(api.get("limit")).toBe("24");
  });
});
