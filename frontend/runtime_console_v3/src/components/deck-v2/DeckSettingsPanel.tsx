"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Deck } from "@/types/deck";
import { useCreateDeck, usePublishDeck } from "@/hooks/useDeck";
import { Button } from "@/components/ui/button";
import { DeckSharePanel } from "@/components/deck-v2/DeckSharePanel";

type Props = { deck: Deck };

export function DeckSettingsPanel({ deck }: Props) {
  const router = useRouter();
  const publish = usePublishDeck(deck.id);
  const create = useCreateDeck();
  const [msg, setMsg] = useState<string | null>(null);

  const duplicate = () => {
    create.mutate(
      {
        name: `${deck.name} (cópia)`,
        game: deck.game,
        format: deck.format,
        description: deck.description ?? undefined,
        is_public: false,
      },
      {
        onSuccess: (d) => {
          setMsg("Deck duplicado — adicione as cartas no editor.");
          router.push(`/decks/${d.id}/edit`);
        },
        onError: (e) => setMsg(e instanceof Error ? e.message : "Falha ao duplicar"),
      },
    );
  };

  return (
    <section className="space-y-6" data-testid="deck-settings-panel">
      <div>
        <h2 className="text-h3">Configurações</h2>
        <p className="text-small text-muted-foreground">
          {deck.game} · {deck.format} · {deck.is_public ? "Público" : "Privado"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href={`/decks/${deck.id}/edit`}>Abrir editor</Link>
        </Button>
        {!deck.is_public && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={publish.isPending}
            onClick={() => publish.mutate()}
          >
            Publicar
          </Button>
        )}
        <Button type="button" size="sm" variant="outline" onClick={duplicate} disabled={create.isPending}>
          Duplicar deck
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link href="/decks">Meus decks</Link>
        </Button>
      </div>

      {msg && <p className="text-small text-muted-foreground">{msg}</p>}

      <DeckSharePanel deck={deck} />
    </section>
  );
}
