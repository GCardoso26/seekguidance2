/**
 * Persona E2E / QA — Marcelo Henrique Costa (admin@admin.com).
 *
 * Loja Premium especializada em TCGs, com KPIs estáveis para automação.
 */

export const PERSONA_EMAIL = "admin@admin.com";
export const PERSONA_PASSWORD = "Admin@1234";
export const PERSONA_OWNER_ID = "06e79f19-f866-4527-8ba2-979db485d78a";
export const PERSONA_DISPLAY_NAME = "Marcelo Henrique Costa";

export const PERSONA_STORE_ID = "c0a1e8e0-5e11-4c0a-9a11-0000000a0001";
export const PERSONA_STORE_SLUG = "marcelo-tcg";
export const PERSONA_STORE_NAME = "Marcelo TCG";
/** Premium no produto → `pro` no schema */
export const PERSONA_PLAN = "pro";

export const PERSONA_DESCRIPTION =
  "É uma loja especializada em Trading Card Games, atuando tanto no comércio de " +
  "cartas avulsas quanto de produtos selados. Possui forte atuação em Pokémon, " +
  "Magic: The Gathering, Disney Lorcana, One Piece e Star Wars Unlimited, " +
  "realizando envios diários para todo o Brasil.";

/** Estoque-alvo (cartas cadastradas) */
export const PERSONA_INVENTORY_BY_TCG = {
  POKEMON: 3200,
  MTG: 5800,
  LORCANA: 1400,
  ONEPIECE: 900,
  SWU: 750,
  DIGIMON: 300,
} as const;

export const PERSONA_INVENTORY_TOTAL = Object.values(PERSONA_INVENTORY_BY_TCG).reduce(
  (a, b) => a + b,
  0,
);

export const PERSONA_ORDERS = {
  delivered: 2145,
  processing: 48,
  shipped: 17,
  pending: 6,
  cancelled: 4,
} as const;

export const PERSONA_MONTH_REVENUE_CENTS = 8_435_000;
export const PERSONA_AVG_TICKET_CENTS = 12_690;
export const PERSONA_PRODUCTS_SOLD = 2386;
export const PERSONA_UNIQUE_CUSTOMERS = 842;

export const PERSONA_RATING = 4.9;
export const PERSONA_REVIEW_COUNT = 1128;
export const PERSONA_OPEN_COMPLAINTS = 2;
export const PERSONA_AVG_RESPONSE_MINUTES = 18;
