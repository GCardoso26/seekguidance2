/**
 * Métricas por jogo (R2) — NÃO substituem LPC / LCS / SD / SRR.
 * Observabilidade de expansão multi-TCG apenas.
 */

export type GameScopedCounters = {
  gameCode: string;
  cards_per_game: number;
  offers_per_game: number;
  active_sellers_per_game: number;
};

const counters = new Map<string, GameScopedCounters>();

function ensure(gameCode: string): GameScopedCounters {
  const key = gameCode.toUpperCase();
  let row = counters.get(key);
  if (!row) {
    row = {
      gameCode: key,
      cards_per_game: 0,
      offers_per_game: 0,
      active_sellers_per_game: 0,
    };
    counters.set(key, row);
  }
  return row;
}

export function recordCardsSynced(gameCode: string, count: number): void {
  ensure(gameCode).cards_per_game += count;
}

export function recordOffers(gameCode: string, count: number): void {
  ensure(gameCode).offers_per_game += count;
}

export function recordActiveSeller(gameCode: string): void {
  ensure(gameCode).active_sellers_per_game += 1;
}

export function snapshotGameMetrics(): GameScopedCounters[] {
  return [...counters.values()];
}

export function resetGameMetricsForTests(): void {
  counters.clear();
}
