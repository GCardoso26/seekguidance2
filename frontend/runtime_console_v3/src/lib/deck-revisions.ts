import type { DeckRevisionSnapshot } from "@/lib/deck-stats";

export type DeckRevision = {
  id: string;
  version: number;
  createdAt: string;
  author?: string | null;
  description: string;
  changeCount: number;
  snapshot: DeckRevisionSnapshot;
};

const storageKey = (deckId: string) => `judgetcg:deck-revisions:${deckId}`;

/**
 * Histórico append-only no workspace do jogador (local).
 * Persistência server-side fica para evolução da Deck API — sem novo BC.
 */
export function listDeckRevisions(deckId: string): DeckRevision[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(deckId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DeckRevision[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendDeckRevision(
  deckId: string,
  input: {
    snapshot: DeckRevisionSnapshot;
    description: string;
    author?: string | null;
    changeCount?: number;
  },
): DeckRevision {
  const existing = listDeckRevisions(deckId);
  const revision: DeckRevision = {
    id: crypto.randomUUID(),
    version: existing.length + 1,
    createdAt: new Date().toISOString(),
    author: input.author ?? null,
    description: input.description,
    changeCount: input.changeCount ?? 0,
    snapshot: input.snapshot,
  };
  const next = [...existing, revision];
  localStorage.setItem(storageKey(deckId), JSON.stringify(next));
  return revision;
}

export function getDeckRevision(deckId: string, revisionId: string): DeckRevision | null {
  return listDeckRevisions(deckId).find((r) => r.id === revisionId) ?? null;
}

export function clearDeckRevisions(deckId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(deckId));
}
