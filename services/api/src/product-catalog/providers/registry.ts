import { ScryfallSealedProvider } from "./sealed/ScryfallSealedProvider.js";
import {
  ChessexDiceProvider,
  DragonShieldSleevesProvider,
  GamegenicSleevesProvider,
  LorcanaJsonSealedProvider,
  PokemonTcgSealedProvider,
  UltraProDeckBoxProvider,
  UltraProPlaymatProvider,
  UltraProSleevesProvider,
  UltimateGuardBinderProvider,
  UltimateGuardDeckBoxProvider,
  UltimateGuardSleevesProvider,
  VaultXBinderProvider,
} from "./accessories/BrandStubProviders.js";
import type { ProductCatalogJobKey } from "./ProductCatalogProvider.js";
import { JOB_KEY_TO_CATEGORY } from "./ProductCatalogProvider.js";
import type { ProductCatalogProvider } from "./ProductCatalogProvider.js";
import { ProductCategory } from "../domain/enums.js";
import {
  ProductCatalogProviderRegistry,
  productCatalogProviderRegistry,
} from "./ProductCatalogProviderRegistry.js";

function bootstrapRegistry(reg: ProductCatalogProviderRegistry): void {
  reg.register("catalog.sync.sealed", new ScryfallSealedProvider());
  reg.register("catalog.sync.sealed", new PokemonTcgSealedProvider());
  reg.register("catalog.sync.sealed", new LorcanaJsonSealedProvider());

  for (const p of [
    new DragonShieldSleevesProvider(),
    new GamegenicSleevesProvider(),
    new UltimateGuardSleevesProvider(),
    new UltraProSleevesProvider(),
  ]) {
    reg.register("catalog.sync.sleeves", p);
  }

  reg.register("catalog.sync.deckboxes", new UltimateGuardDeckBoxProvider());
  reg.register("catalog.sync.deckboxes", new UltraProDeckBoxProvider());

  reg.register("catalog.sync.binders", new UltimateGuardBinderProvider());
  reg.register("catalog.sync.binders", new VaultXBinderProvider());

  reg.register("catalog.sync.pages", new UltraProSleevesProvider());
  reg.register("catalog.sync.dice", new ChessexDiceProvider());
  reg.register("catalog.sync.counters", new GamegenicSleevesProvider());
  reg.register("catalog.sync.playmats", new UltraProPlaymatProvider());
}

bootstrapRegistry(productCatalogProviderRegistry);

export function providersForJob(jobKey: ProductCatalogJobKey): ProductCatalogProvider[] {
  return productCatalogProviderRegistry.getProvidersForJob(jobKey);
}

export function categoryForJob(jobKey: ProductCatalogJobKey) {
  return JOB_KEY_TO_CATEGORY[jobKey];
}

export function listProductCatalogJobs(): ProductCatalogJobKey[] {
  return productCatalogProviderRegistry.listJobs();
}

export function providersByCategory(category: ProductCategory): ProductCatalogProvider[] {
  return productCatalogProviderRegistry.getProvidersByCategory(category);
}

export { productCatalogProviderRegistry };
