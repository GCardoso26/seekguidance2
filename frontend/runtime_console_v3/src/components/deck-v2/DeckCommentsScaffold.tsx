"use client";

import { useState } from "react";
import type { Deck } from "@/types/deck";
import { Button } from "@/components/ui/button";

type Props = { deck: Deck };

/**
 * Scaffold de comentários / notas — sem Social Layer completo.
 */
export function DeckCommentsScaffold({ deck }: Props) {
  const key = `judgetcg:deck-notes:${deck.id}`;
  const [notes, setNotes] = useState(() => {
    if (typeof window === "undefined") return deck.description ?? "";
    return localStorage.getItem(key) ?? deck.description ?? "";
  });
  const [tags, setTags] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(`${key}:tags`) ?? "";
  });
  const [saved, setSaved] = useState(false);

  const save = () => {
    localStorage.setItem(key, notes);
    localStorage.setItem(`${key}:tags`, tags);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  return (
    <section className="space-y-4" data-testid="deck-comments-scaffold">
      <div>
        <h2 className="text-h3">Comentários & notas</h2>
        <p className="text-small text-muted-foreground">
          Estrutura preparada. Comentários públicos da comunidade virão com a Social Layer —
          notas pessoais ficam no workspace.
        </p>
      </div>

      <label className="block space-y-1">
        <span className="text-caption text-muted-foreground">Descrição / notas pessoais</span>
        <textarea
          className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Estratégia, sideboard guide, lembretes…"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-caption text-muted-foreground">Tags (separadas por vírgula)</span>
        <input
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="aggro, budget, meta"
        />
      </label>

      <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4">
        <p className="text-small font-medium">Thread de comentários</p>
        <p className="mt-1 text-caption text-muted-foreground">Em breve — sem implementar Social Layer.</p>
      </div>

      <Button type="button" size="sm" onClick={save}>
        {saved ? "Salvo" : "Salvar notas"}
      </Button>
    </section>
  );
}
