/**
 * Playwright / personas — R2 game parametrization.
 * Use JUDGE_E2E_GAME=mtg|pokemon|lorcana with existing persona aliases.
 * Seeds never run in Beta (ADR-014).
 */
export const R2_E2E_GAMES = ["lorcana", "mtg", "pokemon"] as const;

export type R2E2EGame = (typeof R2_E2E_GAMES)[number];

export function resolveE2EGame(env = process.env.JUDGE_E2E_GAME): R2E2EGame {
  const g = (env ?? "lorcana").toLowerCase();
  if (g === "mtg" || g === "magic") return "mtg";
  if (g === "pokemon" || g === "pokémon") return "pokemon";
  return "lorcana";
}
