/**
 * Beachhead do Release 1 / MVP 1.0 — Disney Lorcana Brasil.
 * Arquitetura continua multi-TCG; este valor define o mercado validado primeiro.
 *
 * Sync Scryfall/MTG permanece disponível para expansão e testes de foundation.
 * Provider Lorcana (dataset versionado) entra em Catalog Sync sem reabrir domínios.
 *
 * @see docs/architecture/MVP_1_0_RELEASE_PLAN.md
 */
export const BEACHHEAD_GAME_CODE = "LORCANA" as const;
export const BEACHHEAD_GAME_SLUG = "lorcana" as const;

/** Provider id alvo do Release 1 (dataset comunitário / cards.json — sem cron frágil). */
export const BEACHHEAD_PROVIDER_ID = "lorcana-dataset" as const;
