"use client";

import { useState } from "react";
import type { Deck } from "@/types/deck";
import { Button } from "@/components/ui/button";

type Comment = { id: string; author: string; body: string; at: string };

type Props = { deck: Deck };

/**
 * Comentários de deck — thread local + notas pessoais.
 * Pronto para trocar storage por Social posts API sem mudar layout.
 */
export function DeckCommentsScaffold({ deck }: Props) {
  const notesKey = `judgetcg:deck-notes:${deck.id}`;
  const threadKey = `judgetcg:deck-thread:${deck.id}`;
  const [notes, setNotes] = useState(() => {
    if (typeof window === "undefined") return deck.description ?? "";
    return localStorage.getItem(notesKey) ?? deck.description ?? "";
  });
  const [tags, setTags] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(`${notesKey}:tags`) ?? "";
  });
  const [thread, setThread] = useState<Comment[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(threadKey) || "[]") as Comment[];
    } catch {
      return [];
    }
  });
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState(false);

  const saveNotes = () => {
    localStorage.setItem(notesKey, notes);
    localStorage.setItem(`${notesKey}:tags`, tags);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const postComment = () => {
    const body = draft.trim();
    if (!body) return;
    const next: Comment[] = [
      {
        id: `c-${Date.now()}`,
        author: "Você",
        body,
        at: new Date().toISOString(),
      },
      ...thread,
    ];
    setThread(next);
    localStorage.setItem(threadKey, JSON.stringify(next));
    setDraft("");
  };

  return (
    <section className="space-y-4" data-testid="deck-comments-scaffold">
      <div>
        <h2 className="text-h3">Comentários & discussão</h2>
        <p className="text-small text-muted-foreground">
          Discussão do deck + notas pessoais. Histórico de likes no painel social acima.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <label className="block space-y-1">
          <span className="text-caption text-muted-foreground">Novo comentário</span>
          <textarea
            className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Compartilhe uma ideia sobre o deck…"
          />
        </label>
        <Button type="button" size="sm" onClick={postComment}>
          Publicar
        </Button>
        <ul className="space-y-2">
          {thread.map((c) => (
            <li key={c.id} className="rounded-lg bg-muted/30 px-3 py-2 text-sm">
              <p className="font-medium">{c.author}</p>
              <p className="text-muted-foreground">{c.body}</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                {new Date(c.at).toLocaleString("pt-BR")}
              </p>
            </li>
          ))}
          {!thread.length && (
            <li className="text-sm text-muted-foreground">Seja o primeiro a comentar.</li>
          )}
        </ul>
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

      <Button type="button" size="sm" onClick={saveNotes}>
        {saved ? "Salvo" : "Salvar notas"}
      </Button>
    </section>
  );
}
