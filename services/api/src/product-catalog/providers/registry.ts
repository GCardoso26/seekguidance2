import { ScryfallSealedProvider } from "./sealed/ScryfallSealedProvider.js";
import { PokemonTcgSealedProvider } from "./sealed/PokemonTcgSealedProvider.js";
import { LorcanaJsonSealedProvider } from "./sealed/LorcanaJsonSealedProvider.js";
import { LigaPublicImageFallbackProvider } from "./sealed/LigaPublicImageFallbackProvider.js";
import {
  CentralBinderProvider,
  CentralCountersProvider,
  CentralDeckBoxProvider,
  CentralDiceProvider,
  CentralPlaymatProvider,
  CentralSleevesProvider,
} from "../manufacturers/central/provider.js";
import {
  GamegenicBinderProvider,
  GamegenicCountersProvider,
  GamegenicDeckBoxProvider,
  GamegenicDiceProvider,
  GamegenicPlaymatProvider,
  GamegenicSleevesProvider,
} from "../manufacturers/gamegenic/provider.js";
import {
  DragonShieldBinderProvider,
  DragonShieldCountersProvider,
  DragonShieldDeckBoxProvider,
  DragonShieldDiceProvider,
  DragonShieldPlaymatProvider,
  DragonShieldSleevesProvider,
} from "../manufacturers/dragon-shield/provider.js";
import {
  UltimateGuardBinderProvider,
  UltimateGuardCountersProvider,
  UltimateGuardDeckBoxProvider,
  UltimateGuardDiceProvider,
  UltimateGuardPlaymatProvider,
  UltimateGuardSleevesProvider,
} from "../manufacturers/ultimate-guard/provider.js";
import {
  UltraProBinderProvider,
  UltraProCountersProvider,
  UltraProDeckBoxProvider,
  UltraProDiceProvider,
  UltraProPlaymatProvider,
  UltraProSleevesProvider,
} from "../manufacturers/ultra-pro/provider.js";
import {
  VaultXBinderProvider,
  VaultXCountersProvider,
  VaultXDeckBoxProvider,
  VaultXDiceProvider,
  VaultXPlaymatProvider,
  VaultXSleevesProvider,
} from "../manufacturers/vault-x/provider.js";
import {
  BcwBinderProvider,
  BcwCountersProvider,
  BcwDeckBoxProvider,
  BcwDiceProvider,
  BcwPlaymatProvider,
  BcwSleevesProvider,
} from "../manufacturers/bcw/provider.js";
import {
  KmcBinderProvider,
  KmcCountersProvider,
  KmcDeckBoxProvider,
  KmcDiceProvider,
  KmcPlaymatProvider,
  KmcSleevesProvider,
} from "../manufacturers/kmc/provider.js";
import {
  ArcaneTinmenBinderProvider,
  ArcaneTinmenCountersProvider,
  ArcaneTinmenDeckBoxProvider,
  ArcaneTinmenDiceProvider,
  ArcaneTinmenPlaymatProvider,
  ArcaneTinmenSleevesProvider,
} from "../manufacturers/arcane-tinmen/provider.js";
import {
  DexProtectionBinderProvider,
  DexProtectionCountersProvider,
  DexProtectionDeckBoxProvider,
  DexProtectionDiceProvider,
  DexProtectionPlaymatProvider,
  DexProtectionSleevesProvider,
} from "../manufacturers/dex-protection/provider.js";
import {
  UltimateSleeveBinderProvider,
  UltimateSleeveCountersProvider,
  UltimateSleeveDeckBoxProvider,
  UltimateSleeveDiceProvider,
  UltimateSleevePlaymatProvider,
  UltimateSleeveSleevesProvider,
} from "../manufacturers/ultimate-sleeve/provider.js";
import {
  BushiroadBinderProvider,
  BushiroadCountersProvider,
  BushiroadDeckBoxProvider,
  BushiroadDiceProvider,
  BushiroadPlaymatProvider,
  BushiroadSleevesProvider,
} from "../manufacturers/bushiroad/provider.js";
import {
  BandaiAccessoriesBinderProvider,
  BandaiAccessoriesCountersProvider,
  BandaiAccessoriesDeckBoxProvider,
  BandaiAccessoriesDiceProvider,
  BandaiAccessoriesPlaymatProvider,
  BandaiAccessoriesSleevesProvider,
} from "../manufacturers/bandai-accessories/provider.js";
import { OnePieceSealedProvider } from "../publishers/one-piece/provider.js";
import { DigimonSealedProvider } from "../publishers/digimon/provider.js";
import { DragonBallSealedProvider } from "../publishers/dragon-ball/provider.js";
import { StarWarsSealedProvider } from "../publishers/star-wars/provider.js";
import { FabSealedProvider } from "../publishers/fab/provider.js";
import { YugiohSealedProvider } from "../publishers/yugioh/provider.js";
import { RiftboundSealedProvider } from "../publishers/riftbound/provider.js";
import type { ProductCatalogJobKey } from "./ProductCatalogProvider.js";
import { JOB_KEY_TO_CATEGORY } from "./ProductCatalogProvider.js";
import type { ProductCatalogProvider } from "./ProductCatalogProvider.js";
import { ProductCategory } from "../domain/enums.js";
import {
  ProductCatalogProviderRegistry,
  productCatalogProviderRegistry,
} from "./ProductCatalogProviderRegistry.js";
import type { ExpansionAssetProvider } from "../publishers/_shared/expansionAssets.js";
import { MagicExpansionAssetsProvider } from "../publishers/magic/provider.js";
import { PokemonExpansionAssetsProvider } from "../publishers/pokemon/provider.js";
import { LorcanaExpansionAssetsProvider } from "../publishers/lorcana/provider.js";
import { OnePieceExpansionAssetsProvider } from "../publishers/one-piece/provider.js";
import { DigimonExpansionAssetsProvider } from "../publishers/digimon/provider.js";
import { DragonBallExpansionAssetsProvider } from "../publishers/dragon-ball/provider.js";
import { StarWarsExpansionAssetsProvider } from "../publishers/star-wars/provider.js";
import { FabExpansionAssetsProvider } from "../publishers/fab/provider.js";
import { YugiohExpansionAssetsProvider } from "../publishers/yugioh/provider.js";
import { RiftboundExpansionAssetsProvider } from "../publishers/riftbound/provider.js";

function bootstrapRegistry(reg: ProductCatalogProviderRegistry): void {
  // Sealed — API priority first, Liga last
  reg.register("catalog.sync.sealed", new ScryfallSealedProvider());
  reg.register("catalog.sync.sealed", new PokemonTcgSealedProvider());
  reg.register("catalog.sync.sealed", new LorcanaJsonSealedProvider());
  reg.register("catalog.sync.sealed", new OnePieceSealedProvider());
  reg.register("catalog.sync.sealed", new DigimonSealedProvider());
  reg.register("catalog.sync.sealed", new DragonBallSealedProvider());
  reg.register("catalog.sync.sealed", new StarWarsSealedProvider());
  reg.register("catalog.sync.sealed", new FabSealedProvider());
  reg.register("catalog.sync.sealed", new YugiohSealedProvider());
  reg.register("catalog.sync.sealed", new RiftboundSealedProvider());
  reg.register("catalog.sync.sealed", new LigaPublicImageFallbackProvider());

  const sleeveProviders = [
    new CentralSleevesProvider(),
    new GamegenicSleevesProvider(),
    new DragonShieldSleevesProvider(),
    new UltimateGuardSleevesProvider(),
    new UltraProSleevesProvider(),
    new VaultXSleevesProvider(),
    new BcwSleevesProvider(),
    new KmcSleevesProvider(),
    new ArcaneTinmenSleevesProvider(),
    new DexProtectionSleevesProvider(),
    new UltimateSleeveSleevesProvider(),
    new BushiroadSleevesProvider(),
    new BandaiAccessoriesSleevesProvider(),
  ];
  for (const p of sleeveProviders) reg.register("catalog.sync.sleeves", p);

  for (const p of [
    new CentralDeckBoxProvider(),
    new GamegenicDeckBoxProvider(),
    new DragonShieldDeckBoxProvider(),
    new UltimateGuardDeckBoxProvider(),
    new UltraProDeckBoxProvider(),
    new VaultXDeckBoxProvider(),
    new BcwDeckBoxProvider(),
    new KmcDeckBoxProvider(),
    new ArcaneTinmenDeckBoxProvider(),
    new DexProtectionDeckBoxProvider(),
    new UltimateSleeveDeckBoxProvider(),
    new BushiroadDeckBoxProvider(),
    new BandaiAccessoriesDeckBoxProvider(),
  ]) {
    reg.register("catalog.sync.deckboxes", p);
  }

  for (const p of [
    new CentralBinderProvider(),
    new GamegenicBinderProvider(),
    new DragonShieldBinderProvider(),
    new UltimateGuardBinderProvider(),
    new UltraProBinderProvider(),
    new VaultXBinderProvider(),
    new BcwBinderProvider(),
    new KmcBinderProvider(),
    new ArcaneTinmenBinderProvider(),
    new DexProtectionBinderProvider(),
    new UltimateSleeveBinderProvider(),
    new BushiroadBinderProvider(),
    new BandaiAccessoriesBinderProvider(),
  ]) {
    reg.register("catalog.sync.binders", p);
  }

  for (const p of [
    new CentralDiceProvider(),
    new GamegenicDiceProvider(),
    new DragonShieldDiceProvider(),
    new UltimateGuardDiceProvider(),
    new UltraProDiceProvider(),
    new VaultXDiceProvider(),
    new BcwDiceProvider(),
    new KmcDiceProvider(),
    new ArcaneTinmenDiceProvider(),
    new DexProtectionDiceProvider(),
    new UltimateSleeveDiceProvider(),
    new BushiroadDiceProvider(),
    new BandaiAccessoriesDiceProvider(),
  ]) {
    reg.register("catalog.sync.dice", p);
  }

  for (const p of [
    new CentralCountersProvider(),
    new GamegenicCountersProvider(),
    new DragonShieldCountersProvider(),
    new UltimateGuardCountersProvider(),
    new UltraProCountersProvider(),
    new VaultXCountersProvider(),
    new BcwCountersProvider(),
    new KmcCountersProvider(),
    new ArcaneTinmenCountersProvider(),
    new DexProtectionCountersProvider(),
    new UltimateSleeveCountersProvider(),
    new BushiroadCountersProvider(),
    new BandaiAccessoriesCountersProvider(),
  ]) {
    reg.register("catalog.sync.counters", p);
  }

  for (const p of [
    new CentralPlaymatProvider(),
    new GamegenicPlaymatProvider(),
    new DragonShieldPlaymatProvider(),
    new UltimateGuardPlaymatProvider(),
    new UltraProPlaymatProvider(),
    new VaultXPlaymatProvider(),
    new BcwPlaymatProvider(),
    new KmcPlaymatProvider(),
    new ArcaneTinmenPlaymatProvider(),
    new DexProtectionPlaymatProvider(),
    new UltimateSleevePlaymatProvider(),
    new BushiroadPlaymatProvider(),
    new BandaiAccessoriesPlaymatProvider(),
  ]) {
    reg.register("catalog.sync.playmats", p);
  }

  // pages job — binder pages from Ultra PRO / Central counters taxonomy
  reg.register("catalog.sync.pages", new UltraProSleevesProvider());
}

bootstrapRegistry(productCatalogProviderRegistry);

export function listExpansionAssetProviders(): ExpansionAssetProvider[] {
  return [
    new MagicExpansionAssetsProvider(),
    new PokemonExpansionAssetsProvider(),
    new LorcanaExpansionAssetsProvider(),
    new OnePieceExpansionAssetsProvider(),
    new DigimonExpansionAssetsProvider(),
    new DragonBallExpansionAssetsProvider(),
    new StarWarsExpansionAssetsProvider(),
    new FabExpansionAssetsProvider(),
    new YugiohExpansionAssetsProvider(),
    new RiftboundExpansionAssetsProvider(),
  ];
}

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
