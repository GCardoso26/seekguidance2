/**
 * Migração de histórico localStorage → cloud no primeiro login.
 *
 * Lê judge-history-v1 (atual) e judge:history (legado).
 * Em sucesso limpa localStorage; em falha mantém para retry.
 */

import type { JudgeHistoryItem } from "@/types/judge";
import { apiFetch } from "@/services/api/client";

const STORAGE_KEYS = ["judge-history-v1", "judge:history"] as const;

function parseHistory(raw: string): JudgeHistoryItem[] {
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (e): e is JudgeHistoryItem =>
      typeof e === "object" &&
      e !== null &&
      "question" in e &&
      typeof (e as JudgeHistoryItem).question === "string",
  );
}

export async function migrateLocalStorageHistory(userId: string): Promise<void> {
  if (!userId) return;

  const merged: JudgeHistoryItem[] = [];
  const seen = new Set<string>();

  for (const key of STORAGE_KEYS) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      for (const item of parseHistory(raw)) {
        const id = item.id || `${item.tcg}:${item.question}`;
        if (seen.has(id)) continue;
        seen.add(id);
        merged.push(item);
      }
    } catch {
      localStorage.removeItem(key);
    }
  }

  if (merged.length === 0) return;

  try {
    await apiFetch<{ migrated: number }>("/runtime/judge/history/migrate", {
      method: "POST",
      publicRoute: true,
      headers: { "X-Judge-User-Id": userId },
      body: {
        entries: merged.slice(0, 50).map((item) => ({
          tcg: item.tcg,
          question: item.question,
          answer: item.answer,
          success: item.success,
          confidence: item.confidence,
          createdAt: item.createdAt,
          sources: item.sources ?? [],
          verdict: item.verdict,
          rule_applied: item.rule_applied,
        })),
      },
    });
    for (const key of STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
    console.info(`[Auth] ${merged.length} entradas migradas para a nuvem.`);
  } catch (err) {
    console.warn("[Auth] Migração falhou — localStorage preservado para retry.", err);
  }
}
