import type { JudgeHistoryItem } from "@/types/judge";

const STORAGE_KEY = "judge-favorites-v1";

export function loadJudgeFavorites(): JudgeHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as JudgeHistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toggleJudgeFavorite(item: JudgeHistoryItem): JudgeHistoryItem[] {
  const prev = loadJudgeFavorites();
  const exists = prev.some((f) => f.id === item.id);
  const next = exists ? prev.filter((f) => f.id !== item.id) : [item, ...prev].slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function isJudgeFavorite(id: string): boolean {
  return loadJudgeFavorites().some((f) => f.id === id);
}
