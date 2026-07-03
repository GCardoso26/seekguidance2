export function catalogCardsMock(game = "mtg") {
  return {
    cards: [
      {
        id: "card-1",
        name: "Lightning Bolt",
        set_name: "Dominaria United",
        set_code: "DMU",
        game_code: game.toUpperCase(),
        rarity: "common",
        image_url: "https://cards.scryfall.io/normal/front/0/0/000.jpg",
        lowest_price_cents: 4500,
      },
      {
        id: "card-2",
        name: "Sol Ring",
        set_name: "Commander Masters",
        set_code: "CMM",
        game_code: game.toUpperCase(),
        rarity: "uncommon",
        image_url: null,
        lowest_price_cents: 7500,
      },
    ],
    total: 2,
    page: 1,
    limit: 24,
    has_more: false,
  };
}

export function catalogExpansionsMock() {
  return {
    expansions: [
      {
        code: "DMU",
        name: "Dominaria United",
        release_date: "2022-09-09",
        card_count: 281,
        store_listings_count: 45,
        catalog_card_count: 281,
      },
    ],
  };
}

export function catalogGamesMock() {
  return {
    games: [
      {
        slug: "mtg",
        name: "Magic: The Gathering",
        game_code: "MTG",
        logo_url: "/logos/mtg.svg",
        config: {
          conditions: ["NM", "LP", "MP", "HP", "DM"],
          languages: ["pt", "en", "jp"],
          rarities: ["common", "uncommon", "rare", "mythic"],
        },
      },
      {
        slug: "pokemon",
        name: "Pokémon TCG",
        game_code: "POKEMON",
        logo_url: "/logos/pokemon.svg",
        config: { conditions: ["NM", "LP", "MP"], languages: ["pt", "en", "jp"], rarities: ["common", "rare"] },
      },
    ],
  };
}
