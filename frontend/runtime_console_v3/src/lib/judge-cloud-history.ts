import type { JudgeHistoryItem } from "@/types/judge";
import { loadJudgeHistory, saveJudgeHistoryItem } from "@/lib/judge-history";
import { fetchJudgeSession, saveJudgeSession } from "@/services/judgeSessionApi";

/** Carrega histórico: cloud se autenticado, senão localStorage. */
export async function loadJudgeHistoryHybrid(
  userId: string | null | undefined,
  sessionId?: string | null,
): Promise<JudgeHistoryItem[]> {
  if (sessionId) {
    const session = await fetchJudgeSession(sessionId);
    if (session) {
      const { sessionToHistoryItems } = await import("@/services/judgeSessionApi");
      return sessionToHistoryItems(session);
    }
  }
  if (userId) {
    return loadJudgeHistory();
  }
  return loadJudgeHistory();
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSave: { tcg: JudgeHistoryItem["tcg"]; items: JudgeHistoryItem[] } | null = null;

function flushPendingSave() {
  if (!pendingSave) return;
  const { tcg, items } = pendingSave;
  pendingSave = null;
  void saveJudgeSession(tcg, items);
}

export async function persistJudgeHistoryItem(
  item: JudgeHistoryItem,
  userId: string | null | undefined,
): Promise<JudgeHistoryItem[]> {
  const local = saveJudgeHistoryItem(item);
  if (userId) {
    pendingSave = { tcg: item.tcg, items: local };
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = null;
      flushPendingSave();
    }, 2000);
  }
  return local;
}

export function flushJudgeCloudHistory() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  flushPendingSave();
}
