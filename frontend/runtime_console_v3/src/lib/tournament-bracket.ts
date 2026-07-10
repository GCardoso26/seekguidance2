import type { BracketFormat, BracketPublicStatus, MatchDisplayStatus } from "@/types/tournament-bracket";

export type SwissPlayer = {
  id: string;
  name: string;
  points: number;
  opponents?: string[];
};

/** PRNG determinístico para testes (mulberry32). */
export function seededRandom(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  const rand = seededRandom(seed);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Round 1 suíço: embaralhamento aleatório (seed opcional para testes). */
export function swissRound1Pairings(playerIds: string[], seed = Date.now()): Array<[string, string | null]> {
  const shuffled = shuffleWithSeed(playerIds, seed);
  const pairings: Array<[string, string | null]> = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 < shuffled.length) pairings.push([shuffled[i], shuffled[i + 1]]);
    else pairings.push([shuffled[i], null]);
  }
  return pairings;
}

/** Round 2+ suíço simplificado: ordena por pontos e pareia vizinhos evitando rematch óbvio. */
export function swissPairingsByPoints(players: SwissPlayer[], round: number): Array<[string, string | null]> {
  if (round <= 1) return swissRound1Pairings(players.map((p) => p.id), round * 1000);

  const sorted = [...players].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  const used = new Set<string>();
  const pairings: Array<[string, string | null]> = [];

  for (const p of sorted) {
    if (used.has(p.id)) continue;
    const opponent = sorted.find(
      (o) =>
        o.id !== p.id &&
        !used.has(o.id) &&
        !(p.opponents ?? []).includes(o.id),
    );
    if (opponent) {
      pairings.push([p.id, opponent.id]);
      used.add(p.id);
      used.add(opponent.id);
    } else {
      const fallback = sorted.find((o) => o.id !== p.id && !used.has(o.id));
      if (fallback) {
        pairings.push([p.id, fallback.id]);
        used.add(p.id);
        used.add(fallback.id);
      } else {
        pairings.push([p.id, null]);
        used.add(p.id);
      }
    }
  }
  return pairings;
}

/** Próxima potência de 2 ≥ n. */
export function nextPowerOfTwo(n: number): number {
  if (n <= 1) return 2;
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/** Gera slots de eliminação simples com byes para seeds altos. */
export function eliminationBracketSlots(playerCount: number): {
  bracketSize: number;
  byeCount: number;
  firstRoundMatches: number;
} {
  const bracketSize = nextPowerOfTwo(Math.max(2, playerCount));
  const byeCount = bracketSize - playerCount;
  return {
    bracketSize,
    byeCount,
    firstRoundMatches: bracketSize / 2,
  };
}

export type DoubleElimSlot = {
  side: "winners" | "losers" | "grand_finals";
  roundNumber: number;
  matchNumber: number;
};

/** Estrutura mínima de double elimination para visualização (sem algoritmo completo). */
export function doubleEliminationStructure(playerCount: number): DoubleElimSlot[] {
  const { bracketSize, firstRoundMatches } = eliminationBracketSlots(playerCount);
  const slots: DoubleElimSlot[] = [];
  const wbRounds = Math.log2(bracketSize);
  for (let r = 1; r <= wbRounds; r += 1) {
    const matches = firstRoundMatches / 2 ** (r - 1);
    for (let m = 1; m <= matches; m += 1) {
      slots.push({ side: "winners", roundNumber: r, matchNumber: m });
    }
  }
  const lbRounds = Math.max(1, wbRounds * 2 - 2);
  for (let r = 1; r <= lbRounds; r += 1) {
    slots.push({ side: "losers", roundNumber: r, matchNumber: 1 });
  }
  slots.push({ side: "grand_finals", roundNumber: 1, matchNumber: 1 });
  return slots;
}

export function inferPairingFormat(tournament: Record<string, unknown> | undefined): BracketFormat {
  const raw = String(
    tournament?.pairing_format ?? tournament?.match_type ?? tournament?.format_code ?? "swiss",
  ).toLowerCase();
  if (raw.includes("double")) return "double_elimination";
  if (raw.includes("single") || raw.includes("elim")) return "single_elimination";
  if (raw.includes("round")) return "round_robin";
  return "swiss";
}

export function mapBracketPublicStatus(
  phase: string,
  bracketStatus?: string | null,
): BracketPublicStatus {
  if (phase === "finalized" || phase === "completed" || bracketStatus === "completed") {
    return "finished";
  }
  if (
    phase === "in_progress" ||
    phase === "swiss_active" ||
    phase === "bracket_active" ||
    bracketStatus === "active"
  ) {
    return "in_progress";
  }
  if (phase === "registration_open" || phase === "check_in" || phase === "published") {
    return "open";
  }
  return "not_started";
}

export function publicStatusLabel(status: BracketPublicStatus): string {
  switch (status) {
    case "not_started":
      return "Não iniciado";
    case "open":
      return "Inscrições abertas";
    case "in_progress":
      return "Em andamento";
    case "finished":
      return "Finalizado";
  }
}

export function resolveMatchDisplayStatus(match: {
  status?: string;
  player1Id?: string | null;
  player2Id?: string | null;
  isBye?: boolean;
}): MatchDisplayStatus {
  if (match.isBye || (!match.player2Id && match.player1Id)) return "bye";
  if (match.status === "completed") return "completed";
  if (match.status === "active" || match.status === "reported") return "active";
  return "pending";
}

export const MATCH_STATUS_STYLES: Record<MatchDisplayStatus, string> = {
  pending: "border-border bg-muted/50",
  active: "border-sky-500/40 bg-sky-500/10",
  completed: "border-border bg-muted/50 opacity-90",
  bye: "border-amber-500/40 bg-amber-500/10",
};

export function eliminationRoundLabel(round: number, maxRound: number): string {
  if (round === maxRound && maxRound >= 2) return "Final";
  if (round === maxRound - 1 && maxRound >= 3) return "Semi";
  if (round === maxRound - 2 && maxRound >= 4) return "Quartas";
  return `Rodada ${round}`;
}

export function standingsToCsv(
  rows: Array<Record<string, string | number>>,
): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: string | number) => {
    const s = String(v);
    return s.includes(",") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h] ?? "")).join(","))].join(
    "\n",
  );
}

export function bracketMatchesToCsv(
  matches: Array<{
    roundNumber: number;
    matchNumber: number;
    player1Name?: string | null;
    player2Name?: string | null;
    winnerName?: string | null;
    status?: string;
  }>,
): string {
  return standingsToCsv(
    matches.map((m) => ({
      rodada: m.roundNumber,
      partida: m.matchNumber,
      jogador1: m.player1Name ?? "TBD",
      jogador2: m.player2Name ?? "BYE",
      vencedor: m.winnerName ?? "",
      status: m.status ?? "pending",
    })),
  );
}
