import type { GameConfiguration } from "../interfaces/GameConfiguration.js";

/** ADR-016: sealed/packshot allowlist — liquidez R2–R4 continua ADR-013 (unlisted). */
export const gundamGameConfig: GameConfiguration = {
  gameCode: "GUNDAM",
  displayName: "Gundam Card Game",
  market: {
    releaseTier: "unlisted",
    primaryMarket: "BR",
    liquidityHypothesis: "Sealed/packshot ADR-016; liquidez singles ainda sem evidência North Star",
    watchlistTargetSize: 15,
    catalogProviderId: "gundam-apitcg",
  },
  capabilities: {
    foil: true,
    etched: false,
    serialized: false,
    reverseHolo: false,
    collectorNumber: true,
    multiLanguageListings: true,
    competitiveFormats: true,
    commanderStyle: false,
    enchantedStyleRarities: false,
    sealedProduct: true,
  },
  rarities: [
    { value: "C", label: "Common", color: "#9CA3AF" },
    { value: "U", label: "Uncommon", color: "#22C55E" },
    { value: "R", label: "Rare", color: "#3B82F6" },
    { value: "RR", label: "Double Rare", color: "#6366F1" },
    { value: "LR", label: "Legendary Rare", color: "#F59E0B" },
    { value: "P", label: "Promo", color: "#64748B" },
  ],
  languages: [
    { value: "en", label: "English" },
    { value: "jp", label: "日本語" },
  ],
  conditions: [
    { value: "NM", label: "Near Mint" },
    { value: "LP", label: "Lightly Played" },
    { value: "MP", label: "Moderately Played" },
    { value: "HP", label: "Heavily Played" },
    { value: "DM", label: "Damaged" },
  ],
  finishes: [
    { value: "nonfoil", label: "Non-foil" },
    { value: "foil", label: "Foil" },
  ],
  formats: [{ value: "standard", label: "Standard" }],
  watchlistCardNames: ["Gundam", "Char", "Amuro Ray", "Unicorn Gundam"],
  searchSynonyms: {
    rx78: ["gundam"],
    unicorn: ["unicorn gundam"],
    char: ["char", "char aznable"],
    amuro: ["amuro ray"],
    newtype: ["newtype rising"],
    gd01: ["newtype rising"],
  },
  filterFacets: [
    {
      id: "color",
      label: "Cor",
      options: [
        { value: "blue", label: "Blue" },
        { value: "green", label: "Green" },
        { value: "red", label: "Red" },
        { value: "white", label: "White" },
        { value: "purple", label: "Purple" },
      ],
    },
  ],
  sellerWizardCopy: {
    searchPlaceholder: "Buscar carta Gundam (ex.: Unicorn Gundam)",
    conditionHint: "Condição da single Gundam Card Game",
    finishHint: "Non-foil ou Foil",
    emptyInventoryHint: "Publique singles GD01 / starters ST01–ST06",
  },
};
