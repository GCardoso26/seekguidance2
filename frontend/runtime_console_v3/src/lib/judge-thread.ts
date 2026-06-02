import type { TcgType, JudgeResponse } from "@/types/judge";

export type JudgeThreadTurn = {
  id: string;
  question: string;
  response: JudgeResponse | null;
  streamingText?: string;
  streamingPhase?: string | null;
  loading?: boolean;
  error?: string | null;
  createdAt: string;
};

export type JudgeThreads = Partial<Record<TcgType, JudgeThreadTurn[]>>;

const STORAGE_KEY = "judge-threads-v1";
const MAX_TURNS_PER_GAME = 20;

function storage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function loadJudgeThreads(): JudgeThreads {
  const ls = storage();
  if (!ls) return {};
  try {
    const raw = ls.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as JudgeThreads;
  } catch {
    return {};
  }
}

export function saveJudgeThreads(threads: JudgeThreads): void {
  storage()?.setItem(STORAGE_KEY, JSON.stringify(threads));
}

export function getThreadForTcg(threads: JudgeThreads, tcg: TcgType): JudgeThreadTurn[] {
  return threads[tcg] ?? [];
}

export function upsertThreadTurn(threads: JudgeThreads, tcg: TcgType, turn: JudgeThreadTurn): JudgeThreads {
  const prev = getThreadForTcg(threads, tcg);
  const nextTurns = [...prev.filter((t) => t.id !== turn.id), turn]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-MAX_TURNS_PER_GAME);
  const next = { ...threads, [tcg]: nextTurns };
  saveJudgeThreads(next);
  return next;
}

export function updateThreadTurn(
  threads: JudgeThreads,
  tcg: TcgType,
  turnId: string,
  patch: Partial<JudgeThreadTurn>,
): JudgeThreads {
  const prev = getThreadForTcg(threads, tcg);
  const nextTurns = prev.map((t) => (t.id === turnId ? { ...t, ...patch } : t));
  const next = { ...threads, [tcg]: nextTurns };
  saveJudgeThreads(next);
  return next;
}

export function clearThreadForTcg(threads: JudgeThreads, tcg: TcgType): JudgeThreads {
  const next = { ...threads, [tcg]: [] };
  saveJudgeThreads(next);
  return next;
}

export function buildThreadContext(turns: JudgeThreadTurn[], maxTurns = 2): string | undefined {
  const completed = turns.filter((t) => t.response && !t.loading && !t.error).slice(-maxTurns);
  if (completed.length === 0) return undefined;
  return completed
    .map((t) => {
      const answer = t.response?.explanation || t.response?.answer || "";
      return `P: ${t.question}\nR: ${answer.slice(0, 500)}`;
    })
    .join("\n\n");
}
