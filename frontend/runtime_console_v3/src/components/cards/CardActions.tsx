"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Heart, Layers, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format-currency";
import { useCreatePriceAlert } from "@/hooks/usePriceAlerts";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { AddToCollectionModal } from "@/components/collection/AddToCollectionModal";
import { gameCardDetailPath } from "@/lib/game-routes";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { AlertPriceCondition } from "@/types/alert";
import type { GameId, UnifiedCard } from "@/types/card";

interface CardActionsProps {
  card: UnifiedCard;
}

export function CardActions({ card }: CardActionsProps) {
  const router = useRouter();
  const { user } = useJudgeAuth();
  const [alertOpen, setAlertOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  const gameSlug = GAME_TOKENS[card.game as GameId]?.slug || String(card.game).toLowerCase();
  const detailPath = gameCardDetailPath(gameSlug, card.id);

  const openCollection = () => {
    if (!user) {
      router.push(`/entrar?next=${encodeURIComponent(detailPath)}`);
      return;
    }
    setCollectionOpen(true);
  };

  const addToDeck = () => {
    router.push(`/decks?add=${encodeURIComponent(card.id)}&game=${encodeURIComponent(String(card.game))}`);
  };

  const share = async () => {
    const url =
      typeof window !== "undefined" ? `${window.location.origin}${detailPath}` : detailPath;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: card.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareMsg("Link copiado");
      setTimeout(() => setShareMsg(null), 1500);
    } catch {
      setShareMsg(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog.Root open={alertOpen} onOpenChange={setAlertOpen}>
        <Dialog.Trigger asChild>
          <Button variant="outline" size="sm" type="button">
            <Bell className="mr-1 h-4 w-4" />
            Alerta
          </Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(100vw-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold">Criar alerta de preço</Dialog.Title>
              <Dialog.Close asChild>
                <button type="button" className="rounded p-1 hover:bg-muted" aria-label="Fechar">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <PriceAlertForm card={card} detailPath={detailPath} onDone={() => setAlertOpen(false)} />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Button
        variant="outline"
        size="sm"
        type="button"
        aria-label="Adicionar à coleção"
        onClick={openCollection}
      >
        <Heart className="mr-1 h-4 w-4" />
        Coleção
      </Button>

      <Button variant="outline" size="sm" type="button" aria-label="Adicionar ao deck" onClick={addToDeck}>
        <Layers className="mr-1 h-4 w-4" />
        Deck
      </Button>

      <Button variant="outline" size="sm" type="button" aria-label="Compartilhar carta" onClick={() => void share()}>
        <Share2 className="mr-1 h-4 w-4" />
        {shareMsg ?? "Compartilhar"}
      </Button>

      <Button variant="ghost" size="sm" type="button" asChild>
        <Link href="/wishlist">Wishlist</Link>
      </Button>

      <Button variant="ghost" size="sm" type="button" asChild>
        <Link href="/alerts">Meus alertas</Link>
      </Button>

      <AddToCollectionModal
        open={collectionOpen}
        cardId={card.id}
        cardName={card.name}
        onClose={() => setCollectionOpen(false)}
      />
    </div>
  );
}

function PriceAlertForm({
  card,
  detailPath,
  onDone,
}: {
  card: UnifiedCard;
  detailPath: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const createAlert = useCreatePriceAlert();
  const currency = card.latestPrice?.currency || "BRL";
  const [targetPrice, setTargetPrice] = useState(
    card.lowestPrice ? Number((card.lowestPrice * 0.9).toFixed(2)) : 0,
  );
  const [priceCondition, setPriceCondition] = useState<AlertPriceCondition>("below");
  const [targetCondition, setTargetCondition] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [targetPercentage, setTargetPercentage] = useState(10);
  const isChangeAlert = priceCondition === "change_up" || priceCondition === "change_down";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createAlert.mutate(
      {
        card_id: card.id,
        target_price: isChangeAlert ? 0 : targetPrice,
        condition: priceCondition,
        target_condition: targetCondition || undefined,
        target_percentage: isChangeAlert ? targetPercentage : undefined,
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setTimeout(onDone, 1200);
        },
        onError: (err) => {
          if (err instanceof Error && err.message === "login_required") {
            router.push(`/entrar?next=${encodeURIComponent(detailPath)}`);
            return;
          }
          setError(err instanceof Error ? err.message : "Erro ao criar alerta");
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && (
        <p className="rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-600">
          Alerta criado! Você será notificado quando o preço {priceCondition === "below" ? "baixar" : "subir"}.
        </p>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}

      <div>
        <label htmlFor="price-condition" className="text-sm font-medium">
          Tipo de alerta
        </label>
        <select
          id="price-condition"
          value={priceCondition}
          onChange={(e) => setPriceCondition(e.target.value as AlertPriceCondition)}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="below">Preço baixar até</option>
          <option value="above">Preço subir até</option>
          <option value="change_up">Alta de % em 7 dias</option>
          <option value="change_down">Queda de % em 7 dias</option>
        </select>
      </div>

      {isChangeAlert ? (
        <div>
          <label htmlFor="target-percentage" className="text-sm font-medium">
            Variação (% em 7 dias)
          </label>
          <input
            id="target-percentage"
            type="number"
            step="0.5"
            min={1}
            max={500}
            value={targetPercentage}
            onChange={(e) => setTargetPercentage(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          />
        </div>
      ) : (
        <div>
          <label htmlFor="target-price" className="text-sm font-medium">
            Preço-alvo
          </label>
          <input
            id="target-price"
            type="number"
            step="0.01"
            min={0.01}
            value={targetPrice}
            onChange={(e) => setTargetPrice(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Preço atual: {formatCurrency(card.lowestPrice || 0, currency)}
          </p>
        </div>
      )}

      <div>
        <label htmlFor="alert-card-condition" className="text-sm font-medium">
          Condição da carta
        </label>
        <select
          id="alert-card-condition"
          value={targetCondition}
          onChange={(e) => setTargetCondition(e.target.value)}
          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Qualquer</option>
          <option value="NM">Near Mint</option>
          <option value="LP">Lightly Played</option>
          <option value="MP">Moderately Played</option>
        </select>
      </div>

      <Button type="submit" className="w-full" disabled={createAlert.isPending || success}>
        {createAlert.isPending ? "Salvando…" : "Criar alerta"}
      </Button>
    </form>
  );
}
