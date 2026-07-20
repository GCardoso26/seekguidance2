/**
 * Scenario — orquestra dataset × archetypes × fluxo × assertions.
 * Trocar `game` não reescreve a suíte.
 */

import type { ArchetypeId } from "../personas/archetypes/types.ts";
import type { GameSlug } from "../personas/core/types.ts";

export type ScenarioFlow =
  | "seller-publish"
  | "buyer-checkout"
  | "collector-wishlist"
  | "search-to-cart"
  | "full-lifecycle";

export type TestScenario = {
  id: string;
  label: string;
  game: GameSlug;
  sellerArchetype: ArchetypeId;
  buyerArchetype: ArchetypeId;
  flow: ScenarioFlow;
  /** Assertions esperadas (determinísticas) */
  expect: {
    minListings?: number;
    checkoutSessionCreated?: boolean;
    wishlistHits?: number;
  };
};

/** Catálogo inicial — expandir sem IA. */
export const SCENARIOS: TestScenario[] = [
  {
    id: "lorcana-seller-large-buyer-competitive-checkout",
    label: "Lorcana: Seller Large → Buyer Competitive → Checkout",
    game: "lorcana",
    sellerArchetype: "seller-large",
    buyerArchetype: "competitive",
    flow: "buyer-checkout",
    expect: { minListings: 1, checkoutSessionCreated: true },
  },
  {
    id: "pokemon-seller-large-buyer-competitive-checkout",
    label: "Pokémon: Seller Large → Buyer Competitive → Checkout",
    game: "pokemon",
    sellerArchetype: "seller-large",
    buyerArchetype: "competitive",
    flow: "buyer-checkout",
    expect: { minListings: 1, checkoutSessionCreated: true },
  },
  {
    id: "mtg-seller-large-buyer-competitive-checkout",
    label: "MTG: Seller Large → Buyer Competitive → Checkout",
    game: "mtg",
    sellerArchetype: "seller-large",
    buyerArchetype: "competitive",
    flow: "buyer-checkout",
    expect: { minListings: 1, checkoutSessionCreated: true },
  },
];

export function scenariosForGame(game: GameSlug): TestScenario[] {
  return SCENARIOS.filter((s) => s.game === game);
}

export function swapScenarioGame(scenario: TestScenario, game: GameSlug): TestScenario {
  return {
    ...scenario,
    id: scenario.id.replace(scenario.game, game),
    label: scenario.label.replace(new RegExp(scenario.game, "i"), game),
    game,
  };
}
