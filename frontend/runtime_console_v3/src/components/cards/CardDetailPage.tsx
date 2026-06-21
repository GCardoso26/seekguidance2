"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, Image as ImageIcon, Sparkles, X, ZoomIn } from "lucide-react";
import { CardActions } from "@/components/cards/CardActions";
import { CardCard } from "@/components/cards/CardCard";
import { ConditionBadge, type CardCondition } from "@/components/cards/ConditionBadge";
import { PriceChart } from "@/components/cards/PriceChart";
import { SellerOffersTable } from "@/components/cards/SellerOffersTable";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCardDetail } from "@/hooks/useCardDetail";
import type { PriceHistoryRange } from "@/hooks/usePriceHistory";
import { cardImageUrl, formatCurrency } from "@/lib/format-currency";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { GameId } from "@/types/card";
import { cn } from "@/lib/utils";

const PRICE_RANGES: { value: PriceHistoryRange; label: string }[] = [
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "1y", label: "1A" },
  { value: "all", label: "TUDO" },
];

interface CardDetailPageProps {
  cardId: string;
}

export function CardDetailPage({ cardId }: CardDetailPageProps) {
  const { data, isLoading, error } = useCardDetail(cardId);
  const [priceRange, setPriceRange] = useState<PriceHistoryRange>("30d");
  const [selectedCondition, setSelectedCondition] = useState<string | undefined>();
  const [imageError, setImageError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (isLoading) return <CardDetailSkeleton />;
  if (error || !data) return <CardDetailError notFound={error?.message === "not_found"} />;

  const { card, listings, relatedCards } = data;
  const gameToken = GAME_TOKENS[card.game as GameId];
  const gameSlug = gameToken?.slug || String(card.game).toLowerCase();
  const imageSrc = cardImageUrl(card);
  const currency = card.latestPrice?.currency || "USD";

  return (
    <MobileLayout>
      <main className="min-h-screen bg-background pb-24 lg:pb-8">
        <nav aria-label="Breadcrumb" className="container mx-auto px-4 py-4">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/games/${gameSlug}`} className="hover:text-foreground">
                {gameToken?.name || card.game}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={`/catalog/search?game=${encodeURIComponent(String(card.game))}&set=${encodeURIComponent(card.set?.code || "")}`}
                className="hover:text-foreground"
              >
                {card.set?.name}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="font-medium text-foreground">
              {card.name}
            </li>
          </ol>
        </nav>

        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-6">
              <div className="relative mx-auto max-w-md">
                <button
                  type="button"
                  className="group relative block w-full cursor-zoom-in"
                  onClick={() => setLightboxOpen(true)}
                  aria-label={`Ampliar imagem de ${card.name}`}
                >
                  <div className="relative aspect-[63/88] overflow-hidden rounded-xl shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]">
                    {!imageError ? (
                      <Image
                        src={imageSrc}
                        alt={card.name}
                        fill
                        priority
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        onError={() => setImageError(true)}
                        unoptimized={imageSrc.endsWith(".svg")}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-muted">
                        <ImageIcon className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    <span className="absolute bottom-3 right-3 rounded-full bg-black/50 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <ZoomIn className="h-4 w-4" />
                    </span>
                  </div>
                </button>

                {card.pricesByCondition && card.pricesByCondition.length > 1 && (
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {card.pricesByCondition.map((pc) => (
                      <button
                        key={`${pc.condition}-${pc.foil}`}
                        type="button"
                        onClick={() => setSelectedCondition(pc.condition)}
                        className={cn(
                          "rounded-lg border-2 p-1 transition-colors",
                          selectedCondition === pc.condition
                            ? "border-primary"
                            : "border-transparent hover:border-muted",
                        )}
                      >
                        <ConditionBadge condition={pc.condition as CardCondition} size="sm" />
                        {pc.foil && (
                          <Sparkles className="ml-0.5 inline h-3 w-3 text-yellow-500" aria-hidden />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Texto da Carta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {card.oracleText ? (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{card.oracleText}</div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Texto não disponível para esta carta.</p>
                  )}
                  {card.flavorText && (
                    <p className="text-sm italic text-muted-foreground">&ldquo;{card.flavorText}&rdquo;</p>
                  )}
                  {card.artist && (
                    <p className="text-xs text-muted-foreground">Artista: {card.artist}</p>
                  )}
                </CardContent>
              </Card>

              {card.legalities && Object.keys(card.legalities).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Legalidades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {Object.entries(card.legalities).map(([format, status]) => (
                        <div
                          key={format}
                          className={cn(
                            "rounded-md px-3 py-2 text-xs font-medium capitalize",
                            status === "legal" && "bg-green-500/10 text-green-600",
                            status === "banned" && "bg-red-500/10 text-red-600",
                            status !== "legal" &&
                              status !== "banned" &&
                              "bg-muted text-muted-foreground",
                          )}
                        >
                          {format}: {status === "not_legal" ? "não legal" : status}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: `${gameToken?.primary ?? "#666"}20`,
                      color: gameToken?.primary ?? "#666",
                    }}
                  >
                    {card.set?.name}
                  </span>
                  {card.latestPrice?.condition && (
                    <ConditionBadge condition={card.latestPrice.condition as CardCondition} />
                  )}
                  {card.latestPrice?.foil && (
                    <span className="flex items-center gap-1 text-yellow-500">
                      <Sparkles className="h-4 w-4" aria-hidden />
                      Foil
                    </span>
                  )}
                </div>

                <h1 className="mt-2 text-3xl font-bold">{card.name}</h1>
                <p className="text-sm text-muted-foreground">
                  #{card.number} • {card.rarity} • {card.language?.toUpperCase()}
                </p>
              </div>

              <div className="rounded-xl border bg-card p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Menor preço</p>
                    <p className="text-4xl font-bold">
                      {card.lowestPrice != null
                        ? formatCurrency(card.lowestPrice, currency)
                        : "Indisponível"}
                    </p>
                    {card.priceTrend7d !== undefined && (
                      <p
                        className={cn(
                          "mt-1 text-sm",
                          card.priceTrend7d >= 0 ? "text-green-500" : "text-red-500",
                        )}
                      >
                        {card.priceTrend7d >= 0 ? "▲" : "▼"}{" "}
                        {Math.abs(card.priceTrend7d).toFixed(1)}% (7d)
                      </p>
                    )}
                  </div>
                  <CardActions card={card} />
                </div>
              </div>

              <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-lg">Histórico de Preço</CardTitle>
                  <div
                    className="flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1"
                    role="tablist"
                    aria-label="Período do gráfico"
                  >
                    {PRICE_RANGES.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={priceRange === value}
                        onClick={() => setPriceRange(value)}
                        className={cn(
                          "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                          priceRange === value
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <PriceChart cardId={cardId} range={priceRange} condition={selectedCondition} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ofertas ({listings.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <SellerOffersTable listings={listings} />
                </CardContent>
              </Card>

              {relatedCards.length > 0 && (
                <div>
                  <h2 className="mb-4 text-lg font-semibold">Cartas Relacionadas</h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {relatedCards.slice(0, 4).map((related) => (
                      <Link key={related.id} href={`/cards/${related.id}`} className="block">
                        <CardCard card={related} variant="compact" showPrice />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 p-4 backdrop-blur lg:hidden">
          <button
            type="button"
            className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground"
          >
            Comprar —{" "}
            {card.lowestPrice != null
              ? formatCurrency(card.lowestPrice, currency)
              : "Indisponível"}
          </button>
        </div>

        <Dialog.Root open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/90" />
            <Dialog.Content className="fixed inset-4 z-50 flex items-center justify-center outline-none">
              <Dialog.Title className="sr-only">{card.name}</Dialog.Title>
              <Image
                src={imageSrc}
                alt={card.name}
                width={744}
                height={1040}
                className="max-h-full max-w-full object-contain"
                unoptimized={imageSrc.endsWith(".svg")}
              />
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </main>
    </MobileLayout>
  );
}

function CardDetailSkeleton() {
  return (
    <MobileLayout>
      <main className="container mx-auto px-4 py-8">
        <Skeleton className="mb-6 h-4 w-64" />
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <Skeleton className="mx-auto aspect-[63/88] max-w-md rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
      </main>
    </MobileLayout>
  );
}

function CardDetailError({ notFound }: { notFound?: boolean }) {
  return (
    <MobileLayout>
      <main className="container mx-auto px-4 py-16 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
        <h1 className="mb-2 text-xl font-bold">
          {notFound ? "Carta não encontrada" : "Erro ao carregar carta"}
        </h1>
        <p className="text-muted-foreground">
          {notFound ? "Verifique o link ou volte à busca." : "Tente novamente mais tarde."}
        </p>
        <Link
          href="/catalog/search"
          className="mt-6 inline-block text-sm text-primary underline-offset-4 hover:underline"
        >
          Voltar à busca
        </Link>
      </main>
    </MobileLayout>
  );
}
