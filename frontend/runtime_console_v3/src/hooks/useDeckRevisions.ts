"use client";

import { useCallback, useEffect, useState } from "react";
import {
  appendDeckRevision,
  listDeckRevisions,
  type DeckRevision,
} from "@/lib/deck-revisions";
import { snapshotDeck, type DeckRevisionSnapshot } from "@/lib/deck-stats";
import type { Deck } from "@/types/deck";

export function useDeckRevisions(deckId: string) {
  const [revisions, setRevisions] = useState<DeckRevision[]>([]);

  const refresh = useCallback(() => {
    setRevisions(listDeckRevisions(deckId));
  }, [deckId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const record = useCallback(
    (deck: Deck, description: string, author?: string | null) => {
      const snapshot: DeckRevisionSnapshot = snapshotDeck(deck);
      const prev = listDeckRevisions(deckId);
      const last = prev[prev.length - 1];
      const changeCount = last
        ? Math.abs(snapshot.totalCards - last.snapshot.totalCards) +
          Math.abs(snapshot.main.length - last.snapshot.main.length)
        : snapshot.totalCards;
      appendDeckRevision(deckId, { snapshot, description, author, changeCount });
      refresh();
    },
    [deckId, refresh],
  );

  return { revisions, refresh, record };
}
