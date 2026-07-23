"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, Share2, Star } from "lucide-react";
import type { Deck } from "@/types/deck";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

const likeKey = (id: string) => `judgetcg:deck-like:${id}`;
const favKey = (id: string) => `judgetcg:deck-fav:${id}`;

type Props = { deck: Deck };

/**
 * Social actions on decks — like / favorite / share.
 * Persistência local + counter; API de like nativo pode substituir sem mudar UI.
 */
export function DeckSocialActions({ deck }: Props) {
  const [liked, setLiked] = useState(false);
  const [fav, setFav] = useState(false);
  const [likes, setLikes] = useState(Number((deck as { likes?: number }).likes ?? 0));

  useEffect(() => {
    if (typeof window === "undefined") return;
    setLiked(localStorage.getItem(likeKey(deck.id)) === "1");
    setFav(localStorage.getItem(favKey(deck.id)) === "1");
  }, [deck.id]);

  const toggleLike = useCallback(() => {
    const next = !liked;
    setLiked(next);
    setLikes((n) => Math.max(0, n + (next ? 1 : -1)));
    localStorage.setItem(likeKey(deck.id), next ? "1" : "0");
    showToast(next ? "Deck curtido" : "Curtida removida", "success");
  }, [deck.id, liked]);

  const toggleFav = useCallback(() => {
    const next = !fav;
    setFav(next);
    localStorage.setItem(favKey(deck.id), next ? "1" : "0");
    showToast(next ? "Deck favoritado" : "Removido dos favoritos", "success");
  }, [deck.id, fav]);

  const share = useCallback(async () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/decks/${deck.id}` : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: deck.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        showToast("Link copiado", "success");
      }
    } catch {
      showToast("Não foi possível compartilhar", "error");
    }
  }, [deck.id, deck.name]);

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="deck-social-actions">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={cn(liked && "border-rose-400 text-rose-600")}
        onClick={toggleLike}
      >
        <Heart className={cn("mr-1.5 h-4 w-4", liked && "fill-current")} />
        Curtir · {likes}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className={cn(fav && "border-amber-400 text-amber-600")}
        onClick={toggleFav}
      >
        <Star className={cn("mr-1.5 h-4 w-4", fav && "fill-current")} />
        Favoritar
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={share}>
        <Share2 className="mr-1.5 h-4 w-4" />
        Compartilhar
      </Button>
    </div>
  );
}
