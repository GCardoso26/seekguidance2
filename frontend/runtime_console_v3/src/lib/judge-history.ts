import type { JudgeHistoryItem } from "@/types/judge";

const STORAGE_KEY = "judge-history-v1";
const MAX_ITEMS = 10;

function storage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

export function loadJudgeHistory(): JudgeHistoryItem[] {
  const ls = storage();
  if (!ls) return [];
  try {
    const raw = ls.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as JudgeHistoryItem[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

export function saveJudgeHistoryItem(item: JudgeHistoryItem): JudgeHistoryItem[] {
  const prev = loadJudgeHistory();
  const next = [item, ...prev.filter((h) => h.id !== item.id)].slice(0, MAX_ITEMS);
  storage()?.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearJudgeHistory(): void {
  storage()?.removeItem(STORAGE_KEY);
}
