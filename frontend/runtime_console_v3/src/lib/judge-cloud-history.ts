import type { JudgeHistoryItem } from "@/types/judge";
import { loadJudgeHistory, saveJudgeHistoryItem } from "@/lib/judge-history";
import { fetchJudgeSession, saveJudgeSession } from "@/services/judgeSessionApi";

/** Carrega histórico: cloud se autenticado, senão localStorage. */
export async function loadJudgeHistoryHybrid(
  userId: string | null | undefined,
  sessionId?: string | null,
): Promise<JudgeHistoryItem[]> {
  if (sessionId && userId) {
    const session = await fetchJudgeSession(sessionId, userId);
    if (session) {
      const { sessionToHistoryItems } = await import("@/services/judgeSessionApi");
      return sessionToHistoryItems(session);
    }
  }
  if (sessionId) {
    const session = await fetchJudgeSession(sessionId);
    if (session) {
      const { sessionToHistoryItems } = await import("@/services/judgeSessionApi");
      return sessionToHistoryItems(session);
    }
  }
  return loadJudgeHistory();
}

export async function persistJudgeHistoryItem(
  item: JudgeHistoryItem,
  userId: string | null | undefined,
): Promise<JudgeHistoryItem[]> {
  const local = saveJudgeHistoryItem(item);
  if (userId) {
    void saveJudgeSession(item.tcg, local, userId);
  }
  return local;
}
