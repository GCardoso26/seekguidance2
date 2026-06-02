/**
 * Rodadas de partida (MatchLog) — persistência local + deep link ?round=
 */

import type { JudgeHistoryItem, TcgType } from "@/types/judge";
import { gameSlugFromTcg } from "@/lib/judge-game-slug";

const STORAGE_KEY = "judge-match-rounds-v1";
const ACTIVE_ROUND_KEY = "judge-active-round-v1";

export type MatchQuestion = {
  historyId: string;
  question: string;
  createdAt: string;
};

export type MatchRound = {
  id: string;
  tcg: TcgType;
  gameSlug: string;
  startedAt: string;
  questions: MatchQuestion[];
};

function readRounds(): MatchRound[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MatchRound[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRounds(rounds: MatchRound[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rounds.slice(0, 80)));
}

export function createRound(tcg: TcgType): MatchRound {
  return {
    id: crypto.randomUUID(),
    tcg,
    gameSlug: gameSlugFromTcg(tcg),
    startedAt: new Date().toISOString(),
    questions: [],
  };
}

export function getActiveRoundId(tcg: TcgType): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ACTIVE_ROUND_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    return map[tcg] ?? null;
  } catch {
    return null;
  }
}

function setActiveRoundId(tcg: TcgType, roundId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = sessionStorage.getItem(ACTIVE_ROUND_KEY);
    const map = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    map[tcg] = roundId;
    sessionStorage.setItem(ACTIVE_ROUND_KEY, JSON.stringify(map));
  } catch {
    /* ignorar */
  }
}

export function ensureActiveRound(tcg: TcgType): MatchRound {
  const rounds = readRounds();
  const existingId = getActiveRoundId(tcg);
  const found = existingId ? rounds.find((r) => r.id === existingId) : undefined;
  if (found) return found;

  const round = createRound(tcg);
  writeRounds([round, ...rounds]);
  setActiveRoundId(tcg, round.id);
  return round;
}

export function appendQuestionToRound(tcg: TcgType, item: JudgeHistoryItem): MatchRound {
  const rounds = readRounds();
  let round = rounds.find((r) => r.id === getActiveRoundId(tcg));
  if (!round) {
    round = createRound(tcg);
    rounds.unshift(round);
    setActiveRoundId(tcg, round.id);
  }
  if (!round.questions.some((q) => q.historyId === item.id)) {
    round.questions.unshift({
      historyId: item.id,
      question: item.question,
      createdAt: item.createdAt,
    });
  }
  const next = [round, ...rounds.filter((r) => r.id !== round!.id)];
  writeRounds(next);
  return round;
}

export function listRoundsForTcg(tcg: TcgType, limit = 20): MatchRound[] {
  return readRounds().filter((r) => r.tcg === tcg).slice(0, limit);
}

export function getRoundById(roundId: string): MatchRound | undefined {
  return readRounds().find((r) => r.id === roundId);
}

export function formatRoundTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
