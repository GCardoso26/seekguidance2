import type {
  MarketplaceSellerProfile,
  SellerListResponse,
  SellerProduct,
  SellerProductsResponse,
} from "@/lib/seller-profile-query";

const mockSellers: MarketplaceSellerProfile[] = [
  {
    id: 41687,
    username: "cardseekers",
    display_name: "Card Seekers",
    avatar_url: "/logos/mtg.svg",
    country_code: "BR",
    country_name: "Brasil",
    user_type: "professional",
    rating: 4.8,
    total_reviews: 342,
    total_items: 15234,
    unique_items: 8741,
    response_time_hours: 2.5,
    can_sell_via_hub: true,
    on_vacation: false,
    store_description: "Especialistas em Magic: The Gathering desde 2019. Singles NM, envio rápido.",
    policies: {
      shipping: "Envio em 24h úteis via Correios",
      returns: "Troca em até 7 dias",
      grading: "Cartas NM enviadas em toploader",
    },
    joined_at: "2019-03-15T00:00:00Z",
    last_active_at: "2026-06-30T14:22:00Z",
  },
  {
    id: 52001,
    username: "tcgbrasil",
    display_name: "TCG Brasil",
    country_code: "BR",
    country_name: "Brasil",
    user_type: "professional",
    rating: 4.6,
    total_reviews: 128,
    total_items: 4200,
    unique_items: 3100,
    can_sell_via_hub: false,
    on_vacation: false,
    store_description: "Pokémon e Yu-Gi-Oh! com estoque nacional.",
    joined_at: "2021-08-01T00:00:00Z",
  },
  {
    id: 88012,
    username: "lorcanahub",
    display_name: "Lorcana Hub",
    country_code: "BR",
    user_type: "normal",
    rating: 4.9,
    total_reviews: 56,
    total_items: 890,
    unique_items: 650,
    can_sell_via_hub: true,
    on_vacation: false,
    joined_at: "2024-01-10T00:00:00Z",
  },
];

const mockProductsBySeller: Record<string, SellerProduct[]> = {
  cardseekers: [
    {
      id: 101862104,
      blueprint_id: 10050,
      name_en: "Sol Ring",
      name_pt: "Anel Solar",
      quantity: 3,
      price: { cents: 2500, currency: "BRL" },
      condition: "Near Mint",
      language: "pt",
      foil: false,
      signed: false,
      altered: false,
      graded: false,
      expansion: { id: 92, code: "cmd", name_en: "Commander" },
      image_url: "/images/product-types/single.svg",
    },
    {
      id: 101862105,
      blueprint_id: 10051,
      name_en: "Lightning Bolt",
      name_pt: "Raio",
      quantity: 12,
      price: { cents: 1800, currency: "BRL" },
      condition: "Near Mint",
      language: "en",
      foil: true,
      signed: false,
      altered: false,
      graded: false,
      expansion: { id: 10, code: "lea", name_en: "Limited Edition Alpha" },
      image_url: "/images/product-types/single.svg",
    },
    {
      id: 101862106,
      name_en: "Black Lotus",
      name_pt: "Lótus Negro",
      quantity: 1,
      price: { cents: 2500000, currency: "BRL" },
      condition: "Lightly Played",
      language: "en",
      foil: false,
      signed: false,
      altered: false,
      graded: true,
      expansion: { id: 10, code: "lea", name_en: "Limited Edition Alpha" },
      image_url: "/images/product-types/single.svg",
    },
  ],
  tcgbrasil: [
    {
      id: 200001,
      name_en: "Charizard ex",
      quantity: 5,
      price: { cents: 8900, currency: "BRL" },
      condition: "Near Mint",
      language: "pt",
      foil: false,
      signed: false,
      altered: false,
      graded: false,
      expansion: { id: 1, code: "sv3", name_en: "Obsidian Flames" },
    },
  ],
  lorcanahub: [
    {
      id: 300001,
      name_en: "Elsa - Snow Queen",
      quantity: 8,
      price: { cents: 1200, currency: "BRL" },
      condition: "Near Mint",
      language: "en",
      foil: true,
      signed: false,
      altered: false,
      graded: false,
      expansion: { id: 2, code: "tfc", name_en: "The First Chapter" },
    },
  ],
};

function paginate<T>(items: T[], page: number, limit: number) {
  const start = (page - 1) * limit;
  return items.slice(start, start + limit);
}

export const sellerProfileMock = {
  listSellers(params: URLSearchParams): SellerListResponse {
    const search = params.get("search")?.toLowerCase();
    const page = Number(params.get("page") ?? 1);
    const limit = Number(params.get("limit") ?? 20);
    let results = [...mockSellers];
    if (search) {
      results = results.filter(
        (s) =>
          s.username.toLowerCase().includes(search) ||
          s.display_name.toLowerCase().includes(search),
      );
    }
    const sort = params.get("sort");
    if (sort === "rating") results.sort((a, b) => b.rating - a.rating);
    if (sort === "items") results.sort((a, b) => b.total_items - a.total_items);
    const slice = paginate(results, page, limit);
    return { sellers: slice, total: results.length, page, limit };
  },

  getProfile(username: string): MarketplaceSellerProfile {
    const seller = mockSellers.find((s) => s.username === username.toLowerCase());
    if (!seller) throw new Error("Seller not found");
    return seller;
  },

  getProducts(username: string, params: URLSearchParams): SellerProductsResponse {
    const page = Number(params.get("page") ?? 1);
    const limit = Number(params.get("limit") ?? 24);
    let products = [...(mockProductsBySeller[username.toLowerCase()] ?? [])];

    const condition = params.get("condition");
    if (condition) products = products.filter((p) => p.condition === condition);

    const foil = params.get("foil");
    if (foil === "true") products = products.filter((p) => p.foil);
    if (foil === "false") products = products.filter((p) => !p.foil);

    const graded = params.get("graded");
    if (graded === "true") products = products.filter((p) => p.graded);

    const min = params.get("price_min");
    if (min) products = products.filter((p) => p.price.cents >= Number(min));

    const max = params.get("price_max");
    if (max) products = products.filter((p) => p.price.cents <= Number(max));

    const sort = params.get("sort") ?? "price_asc";
    products.sort((a, b) => {
      if (sort === "price_desc") return b.price.cents - a.price.cents;
      if (sort === "newest") return b.id - a.id;
      return a.price.cents - b.price.cents;
    });

    const slice = paginate(products, page, limit);
    return { products: slice, total: products.length, page, limit };
  },
};
