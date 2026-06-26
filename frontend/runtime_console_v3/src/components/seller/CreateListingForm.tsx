"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ConditionBadge, type CardCondition } from "@/components/cards/ConditionBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cardImageUrl } from "@/lib/format-currency";
import type { UnifiedCard } from "@/types/card";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useMerchantKycGuard } from "@/hooks/useMerchantKycGuard";

const CONDITIONS: CardCondition[] = ["NM", "LP", "MP", "HP", "DM"];

interface CreateListingFormProps {
  card: UnifiedCard;
}

export function CreateListingForm({ card }: CreateListingFormProps) {
  const router = useRouter();
  const { isLoading: kycLoading, isBlocked } = useMerchantKycGuard();
  const [condition, setCondition] = useState<CardCondition>("NM");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [foil, setFoil] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const imageSrc = cardImageUrl(card);
  const { track } = useAnalytics();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/marketplace/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_id: card.id,
          condition,
          price: Number(price),
          quantity: Number(quantity),
          foil,
          language: card.language || "pt",
        }),
      });

      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/loja/cartas/${card.id}`)}`);
        return;
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(typeof data.detail === "string" ? data.detail : "Falha ao listar carta");
      }

      setSuccess(true);
      track("listing_create", {
        card_id: card.id,
        card_name: card.name,
        price: Number(price),
        condition,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao listar");
    } finally {
      setIsLoading(false);
    }
  };

  if (kycLoading || isBlocked) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {kycLoading ? "Verificando status da loja…" : "Redirecionando…"}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Listar para venda</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded">
              <Image src={imageSrc} alt={card.name} fill className="object-cover" sizes="44px" unoptimized={imageSrc.endsWith(".svg")} />
            </div>
            <div>
              <p className="font-medium">{card.name}</p>
              <p className="text-xs text-muted-foreground">{card.set?.name}</p>
            </div>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium">Condição</p>
            <div className="flex flex-wrap gap-2">
              {CONDITIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCondition(c)}
                  className={`rounded-lg border p-2 transition-colors ${
                    condition === c ? "border-primary bg-primary/10" : "border-transparent hover:border-muted"
                  }`}
                >
                  <ConditionBadge condition={c} size="sm" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="listing-price" className="text-sm font-medium">
                Preço (R$)
              </label>
              <Input
                id="listing-price"
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0,00"
                required
                className="mt-1"
              />
            </div>
            <div className="w-24">
              <label htmlFor="listing-qty" className="text-sm font-medium">
                Qtd
              </label>
              <Input
                id="listing-qty"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                className="mt-1"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={foil} onChange={(e) => setFoil(e.target.checked)} className="rounded" />
            Versão Foil
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">Listagem publicada com sucesso!</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Listando…" : "Listar para venda"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
