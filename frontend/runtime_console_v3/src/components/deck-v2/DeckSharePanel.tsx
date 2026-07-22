"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Deck } from "@/types/deck";

type Props = {
  deck: Deck;
  open?: boolean;
  onClose?: () => void;
};

export function DeckSharePanel({ deck, open = true, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(typeof window !== "undefined" ? window.location.origin : "");
  }, []);

  const publicUrl = `${origin}/decks/${deck.id}`;
  const privateUrl = `${origin}/decks/${deck.id}/edit`;
  const qrUrl = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(publicUrl)}`,
    [publicUrl],
  );

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  if (!open) return null;

  return (
    <section
      className="rounded-xl border border-border bg-card/50 p-4"
      data-testid="deck-share-panel"
      aria-labelledby="deck-share-title"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="deck-share-title" className="text-h3">
          Compartilhar
        </h2>
        {onClose && (
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        )}
      </div>
      <p className="mt-1 text-small text-muted-foreground">
        {deck.is_public
          ? "Link público disponível."
          : "Deck privado — link de edição só para você; publique para compartilhar."}
      </p>

      <div className="mt-4 flex flex-wrap items-start gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrUrl} alt="QR Code do deck" width={160} height={160} className="rounded-lg border" />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-caption text-muted-foreground">Link público</p>
            <div className="mt-1 flex flex-wrap gap-2">
              <code className="truncate rounded bg-muted px-2 py-1 text-caption">{publicUrl}</code>
              <Button type="button" size="sm" variant="outline" onClick={() => void copy(publicUrl)}>
                <Link2 className="mr-1 h-3.5 w-3.5" />
                {copied ? <Check className="h-3.5 w-3.5" /> : "Copiar"}
              </Button>
            </div>
          </div>
          <div>
            <p className="text-caption text-muted-foreground">Link privado (edição)</p>
            <div className="mt-1 flex flex-wrap gap-2">
              <code className="truncate rounded bg-muted px-2 py-1 text-caption">{privateUrl}</code>
              <Button type="button" size="sm" variant="outline" onClick={() => void copy(privateUrl)}>
                Copiar
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="ghost">
              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent(deck.name)}`}
                target="_blank"
                rel="noreferrer"
              >
                X / Twitter
              </a>
            </Button>
            <Button asChild size="sm" variant="ghost">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${deck.name} ${publicUrl}`)}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
