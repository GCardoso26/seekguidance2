import { describe, expect, it } from "vitest";
import {
  canTransitionLifecycle,
  lifecycleFromRollout,
  rolloutModeForLifecycle,
  isMarketplaceVisible,
  isSyncAllowed,
  PROVIDER_LIFECYCLE_ORDER,
} from "../ProviderLifecycle.js";
import { getGameConfig } from "../gameConfigRegistry.js";
import { bootstrapLorcanaRegistry, bootstrapPokemonRegistry, bootstrapScryfallRegistry } from "../../services/CatalogSyncService.js";
import { providerRegistry } from "../../registry/ProviderRegistry.js";

describe("ProviderLifecycle", () => {
  it("ordem canônica Research→…→Beachhead", () => {
    expect(PROVIDER_LIFECYCLE_ORDER).toEqual([
      "research",
      "planned",
      "implemented",
      "shadow",
      "canary",
      "live",
      "beachhead",
    ]);
  });

  it("deriva stages a partir do rollout", () => {
    expect(lifecycleFromRollout("OFF", { codeExists: true })).toBe("implemented");
    expect(lifecycleFromRollout("OFF", { codeExists: false })).toBe("planned");
    expect(lifecycleFromRollout("SHADOW")).toBe("shadow");
    expect(lifecycleFromRollout("CANARY")).toBe("canary");
    expect(lifecycleFromRollout("LIVE")).toBe("live");
    expect(lifecycleFromRollout("LIVE", { beachhead: true })).toBe("beachhead");
  });

  it("bloqueia saltos ilegais", () => {
    expect(canTransitionLifecycle("implemented", "live")).toBe(false);
    expect(canTransitionLifecycle("shadow", "canary")).toBe(true);
    expect(canTransitionLifecycle("live", "beachhead")).toBe(true);
    expect(canTransitionLifecycle("research", "planned")).toBe(true);
    expect(canTransitionLifecycle("research", "implemented")).toBe(false);
  });

  it("research e planned sem sync", () => {
    expect(isSyncAllowed("research")).toBe(false);
    expect(isSyncAllowed("planned")).toBe(false);
  });

  it("rolloutModeForLifecycle", () => {
    expect(rolloutModeForLifecycle("beachhead")).toBe("LIVE");
    expect(rolloutModeForLifecycle("implemented")).toBe("OFF");
  });

  it("marketplace visible em canary/live/beachhead", () => {
    expect(isMarketplaceVisible("shadow")).toBe(false);
    expect(isMarketplaceVisible("canary")).toBe(true);
    expect(isMarketplaceVisible("beachhead")).toBe(true);
  });
});

describe("bootstrap lifecycle wiring", () => {
  it("Lorcana beachhead, Scryfall shadow, Pokémon implemented", () => {
    bootstrapLorcanaRegistry();
    bootstrapScryfallRegistry();
    bootstrapPokemonRegistry();
    expect(providerRegistry.get("lorcana-dataset", "LORCANA")?.lifecycle).toBe("beachhead");
    expect(providerRegistry.get("scryfall", "MTG")?.lifecycle).toBe("shadow");
    expect(providerRegistry.get("pokemon-dataset", "POKEMON")?.lifecycle).toBe("implemented");
  });
});

describe("GameConfiguration market + capabilities", () => {
  it("Lorcana R1 enchanted; MTG commander/etched; Pokémon reverseHolo", () => {
    const lor = getGameConfig("LORCANA")!;
    expect(lor.market.releaseTier).toBe("R1");
    expect(lor.capabilities.enchantedStyleRarities).toBe(true);

    const mtg = getGameConfig("MTG")!;
    expect(mtg.market.releaseTier).toBe("R2");
    expect(mtg.capabilities.commanderStyle).toBe(true);
    expect(mtg.capabilities.etched).toBe(true);

    const pkm = getGameConfig("POKEMON")!;
    expect(pkm.capabilities.reverseHolo).toBe(true);
    expect(pkm.capabilities.serialized).toBe(false);
  });
});
