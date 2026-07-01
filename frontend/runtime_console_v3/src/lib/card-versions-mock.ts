import type { CardVersion, CardVersionsResponse } from "@/lib/card-versions-query";

const mockVersions: Record<string, CardVersion[]> = {
  default: [
    {
      blueprint_id: 10050,
      expansion_id: 92,
      expansion_name: "Commander",
      expansion_code: "cmd",
      expansion_release_date: "2011-06-17",
      collector_number: "255",
      rarity: "Uncommon",
      image_url: "/images/product-types/single.svg",
      available_items: 443,
      lowest_price: { cents: 2500, currency: "BRL" },
      highest_price: { cents: 15000, currency: "BRL" },
      foil_available: true,
      non_foil_available: true,
    },
    {
      blueprint_id: 10051,
      expansion_id: 150,
      expansion_name: "Commander Legends",
      expansion_code: "cmr",
      expansion_release_date: "2020-11-20",
      collector_number: "477",
      rarity: "Uncommon",
      image_url: "/images/product-types/single.svg",
      available_items: 312,
      lowest_price: { cents: 1800, currency: "BRL" },
      highest_price: { cents: 12000, currency: "BRL" },
      foil_available: true,
      non_foil_available: true,
    },
    {
      blueprint_id: 10052,
      expansion_id: 200,
      expansion_name: "The List",
      expansion_code: "plist",
      expansion_release_date: "2020-09-25",
      collector_number: "354",
      rarity: "Uncommon",
      image_url: "/images/product-types/single.svg",
      available_items: 89,
      lowest_price: { cents: 3200, currency: "BRL" },
      highest_price: { cents: 8000, currency: "BRL" },
      foil_available: false,
      non_foil_available: true,
    },
  ],
};

export const cardVersionsMock = {
  getVersions(cardId: string, params: URLSearchParams): CardVersionsResponse {
    let versions = [...(mockVersions[cardId] ?? mockVersions.default)];

    if (params.get("foil_only") === "true") {
      versions = versions.filter((v) => v.foil_available);
    }
    if (params.get("in_stock") === "true") {
      versions = versions.filter((v) => v.available_items > 0);
    }

    const sort = params.get("sort") || "release_date_desc";
    versions.sort((a, b) => {
      switch (sort) {
        case "release_date_asc":
          return (
            new Date(a.expansion_release_date).getTime() -
            new Date(b.expansion_release_date).getTime()
          );
        case "price_asc":
          return (a.lowest_price?.cents ?? Infinity) - (b.lowest_price?.cents ?? Infinity);
        case "price_desc":
          return (b.lowest_price?.cents ?? 0) - (a.lowest_price?.cents ?? 0);
        default:
          return (
            new Date(b.expansion_release_date).getTime() -
            new Date(a.expansion_release_date).getTime()
          );
      }
    });

    return {
      card_id: cardId,
      card_name: "Carta",
      versions,
      total_versions: versions.length,
      total_items: versions.reduce((sum, v) => sum + v.available_items, 0),
    };
  },
};
