"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Library, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddToCollectionModal } from "@/components/collection/AddToCollectionModal";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import {
  useRemoveCollectionItem,
  useUpdateCollectionItem,
  useUserCollection,
} from "@/hooks/useDeck";
import { useToggleWishlist, useWishlistProductIds } from "@/hooks/useWishlist";

type Props = {
  cardId: string;
  cardName: string;
  productId?: string | null;
};

export function CardCollectionStatus({ cardId, cardName, productId }: Props) {
  const { user } = useJudgeAuth();
  const { data: items = [] } = useUserCollection();
  const updateItem = useUpdateCollectionItem();
  const removeItem = useRemoveCollectionItem();
  const toggleWish = useToggleWishlist();
  const wishIds = useWishlistProductIds();
  const [modalOpen, setModalOpen] = useState(false);

  const owned = useMemo(() => items.filter((i) => i.card_id === cardId), [items, cardId]);
  const qty = owned.reduce((s, i) => s + i.quantity, 0);
  const duplicates = Math.max(0, qty - 1);
  const primary = owned[0];
  const want =
    Boolean(productId && wishIds.has(productId)) ||
    Boolean(wishIds.has(cardId));

  if (!user) {
    return (
      <section
        className="rounded-xl border border-border/70 bg-card/40 p-4"
        data-testid="card-collection-status"
      >
        <h2 className="text-h3 text-foreground">Coleção</h2>
        <p className="mt-1 text-small text-muted-foreground">
          Entre para ver se você possui esta carta.
        </p>
        <Button asChild size="sm" className="mt-3" variant="outline">
          <Link href={`/entrar?next=${encodeURIComponent(`/cards/${cardId}`)}`}>Entrar</Link>
        </Button>
      </section>
    );
  }

  return (
    <section
      className="rounded-xl border border-border/70 bg-card/40 p-4"
      data-testid="card-collection-status"
      aria-labelledby="card-collection-title"
    >
      <h2 id="card-collection-title" className="text-h3 text-foreground">
        Coleção
      </h2>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-muted/40 p-2">
          <dt className="text-caption text-muted-foreground">Tenho</dt>
          <dd className="text-h3 font-semibold">{qty}</dd>
        </div>
        <div className="rounded-lg bg-muted/40 p-2">
          <dt className="text-caption text-muted-foreground">Quero</dt>
          <dd className="text-h3 font-semibold">{want ? "Sim" : "Não"}</dd>
        </div>
        <div className="rounded-lg bg-muted/40 p-2">
          <dt className="text-caption text-muted-foreground">Duplicatas</dt>
          <dd className="text-h3 font-semibold">{duplicates}</dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => setModalOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Adicionar
        </Button>
        {primary && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={removeItem.isPending || updateItem.isPending}
            onClick={() => {
              if (primary.quantity <= 1) {
                removeItem.mutate(primary.id);
              } else {
                updateItem.mutate({
                  itemId: primary.id,
                  quantity: primary.quantity - 1,
                });
              }
            }}
          >
            <Minus className="mr-1 h-4 w-4" />
            Remover
          </Button>
        )}
        {productId && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={toggleWish.isPending}
            onClick={() => void toggleWish.mutateAsync({ productId, isSaved: want })}
          >
            <Library className="mr-1 h-4 w-4" />
            {want ? "Remover wishlist" : "Quero"}
          </Button>
        )}
        <Button asChild size="sm" variant="ghost">
          <Link href="/colecao">Abrir coleção</Link>
        </Button>
      </div>
      <AddToCollectionModal
        open={modalOpen}
        cardId={cardId}
        cardName={cardName}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}
