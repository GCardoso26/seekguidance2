import { describe, expect, it } from "vitest";
import {
  bootstrapLorcanaRegistry,
  bootstrapScryfallRegistry,
} from "../../../services/CatalogSyncService.js";
import { providerRegistry } from "../../../registry/ProviderRegistry.js";

describe("beachhead registry bootstrap", () => {
  it("registra LORCANA:lorcana-dataset sem remover Scryfall", () => {
    bootstrapScryfallRegistry();
    bootstrapLorcanaRegistry();
    expect(providerRegistry.get("scryfall", "MTG")).toBeTruthy();
    expect(providerRegistry.get("lorcana-dataset", "LORCANA")).toBeTruthy();
    expect(providerRegistry.get("lorcana-dataset", "LORCANA")?.mode).toBe("LIVE");
  });
});
