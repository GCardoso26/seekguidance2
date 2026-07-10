"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, Image as ImageIcon, X, ZoomIn } from "lucide-react";
import { CardValuationPanel } from "@/components/valuation/CardValuationPanel";
import { CardActions } from "@/components/cards/CardActions";
import { AddToCollectionButton } from "@/components/cards/AddToCollectionButton";
import { AnnounceCardCta } from "@/components/cards/AnnounceCardCta";
import { CardBuyPanel } from "@/components/cards/CardBuyPanel";
import { CardIntelligenceSection } from "@/components/cards/CardIntelligenceSection";
import { CardJudgeInsights } from "@/components/cards/CardJudgeInsights";
import { CardVariantSelector } from "@/components/cards/CardVariantSelector";
import { PriceChart } from "@/components/cards/PriceChart";
import { SellerOffersTable } from "@/components/cards/SellerOffersTable";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { CardVersionsTab } from "@/components/cards/CardVersionsTab";
import { CardInfoTab } from "@/components/cards/CardInfoTab";
import { gameCardsPath, gameLandingPath } from "@/lib/game-routes";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useCardDetail } from "@/hooks/useCardDetail";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useAddListingToCart } from "@/hooks/useShopCart";
import type { PriceHistoryRange } from "@/hooks/usePriceHistory";
import { cardImageUrl, formatCurrency, shouldBypassImageOptimizer } from "@/lib/format-currency";
import { isListingPurchasable } from "@/lib/listing-utils";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import type { CardListing, GameId } from "@/types/card";
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
  const { track } = useAnalytics();
  const addToCart = useAddListingToCart();
  const [priceRange, setPriceRange] = useState<PriceHistoryRange>("30d");
  const [selectedCondition, setSelectedCondition] = useState<string | undefined>();
  const [imageError, setImageError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  useEffect(() => {
    if (data?.card) {
      track("card_view", { card_id: data.card.id, card_name: data.card.name, game: data.card.game });
    }
  }, [data?.card, track]);

  useEffect(() => {
    if (!data?.card) return;
    const started = performance.now();
    return () => {
      track("card_dwell_ms", {
        card_id: data.card.id,
        ms: Math.round(performance.now() - started),
      });
    };
  }, [data?.card, track]);

  const handleBuy = (listing: CardListing) => {
    if (!data) return;
    setBuyError(null);
    track("card_buy_click", { card_id: data.card.id, listing_id: listing.id });
    addToCart.mutate(
      { listing, card: data.card },
      {
        onSuccess: () => track("card_add_to_cart", { card_id: data.card.id, listing_id: listing.id }),
        onError: (err) => setBuyError(err instanceof Error ? err.message : "Erro ao adicionar"),
      },
    );
  };

  const cheapestPurchasable = data?.listings.find(isListingPurchasable);

  if (isLoading) return <CardDetailSkeleton />;
  if (error || !data) return <CardDetailError notFound={error?.message === "not_found"} />;

  const { card, listings, relatedCards, marketSummary } = data;
  const gameToken = GAME_TOKENS[card.game as GameId];
  const gameSlug = gameToken?.slug || String(card.game).toLowerCase();
  const imageSrc = cardImageUrl(card);
  const currency = card.latestPrice?.currency || marketSummary?.currency || "USD";
  const typeLine =
    card.typeLine ||
    [
      ...(card.types ?? []),
      ...(card.subtypes?.length ? ["—", ...card.subtypes] : []),
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <MobileLayout>
      <main className="min-h-screen bg-background pb-24 lg:pb-8">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs
            items={[
              { label: "Início", href: "/" },
              { label: "Loja", href: "/loja" },
              { label: gameToken?.name || card.game, href: gameLandingPath(gameSlug) },
              {
                label: card.set?.name ?? "Expansão",
                href: `${gameCardsPath(gameSlug)}?set=${encodeURIComponent(card.set?.code || "")}`,
              },
              { label: card.name },
            ]}
          />
        </div>

        <div className="container mx-auto px-4 py-6 lg:py-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="space-y-5">
              <button
                type="button"
                className="group relative mx-auto block w-full max-w-md cursor-zoom-in"
                onClick={() => setLightboxOpen(true)}
                aria-label={`Ampliar imagem de ${card.name}`}
              >
                <div className="relative aspect-[63/88] overflow-hidden rounded-2xl shadow-2xl ring-1 ring-border/60 transition-transform duration-300 group-hover:scale-[1.01]">
                  {!imageError ? (
                    <Image
                      src={imageSrc}
                      alt={`${card.name} — ${card.set?.name ?? ""}`}
                      fill
                      priority
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      onError={() => setImageError(true)}
                      unoptimized={shouldBypassImageOptimizer(imageSrc)}
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

              <CardVariantSelector
                card={card}
                cardId={cardId}
                selectedCondition={selectedCondition}
                onConditionChange={setSelectedCondition}
              />

              <CardJudgeInsights card={card} cardId={cardId} />
            </div>

            <div className="space-y-5">
              <header>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: `${gameToken?.primary ?? "#666"}20`,
                      color: gameToken?.primary ?? "#666",
                    }}
                  >
                    {gameToken?.name || card.game}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{card.set?.name}</span>
                  {(card.finishes ?? []).slice(0, 3).map((f) => (
                    <span key={f} className="rounded-full border px-2 py-0.5 text-[10px] capitalize">
                      {f.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
                <h1 className="mt-2 text-3xl font-bold tracking-tight lg:text-4xl">{card.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  #{card.number} · {card.rarity} · {(card.language || "?").toUpperCase()}
                  {card.artist ? ` · Arte: ${card.artist}` : ""}
                </p>
                {typeLine && <p className="mt-1 text-sm text-muted-foreground">{typeLine}</p>}
              </header>

              <CardBuyPanel
                card={card}
                listings={listings}
                marketSummary={marketSummary}
                onBuy={handleBuy}
                onAddToCart={handleBuy}
                buying={addToCart.isPending}
              />

              <div className="flex flex-wrap gap-2">
                <AddToCollectionButton cardId={card.id} cardName={card.name} />
                <CardActions card={card} />
                <AnnounceCardCta card={card} />
              </div>

              {(card.oracleText || card.flavorText) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Texto oficial</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {card.oracleText && (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{card.oracleText}</div>
                    )}
                    {card.flavorText && (
                      <p className="text-sm italic text-muted-foreground">&ldquo;{card.flavorText}&rdquo;</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {card.legalities && Object.keys(card.legalities).length > 0 && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Legalidades">
                  {Object.entries(card.legalities).map(([format, status]) => (
                    <div
                      key={format}
                      className={cn(
                        "rounded-md px-3 py-2 text-xs font-medium capitalize",
                        status === "legal" && "bg-green-500/10 text-green-600",
                        status === "banned" && "bg-red-500/10 text-red-600",
                        status !== "legal" && status !== "banned" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {format}: {status === "not_legal" ? "não legal" : status}
                    </div>
                  ))}
                </div>
              )}

              <Tabs defaultValue="marketplace" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
                  <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
                  <TabsTrigger value="versions">Versões</TabsTrigger>
                  <TabsTrigger value="market">Histórico</TabsTrigger>
                  <TabsTrigger value="info">Info</TabsTrigger>
                </TabsList>

                <TabsContent value="marketplace" className="space-y-4" id="offers">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Ofertas ({listings.length})
                        {marketSummary?.storeCount != null && (
                          <span className="ml-2 text-sm font-normal text-muted-foreground">
                            · {marketSummary.storeCount} lojas · {marketSummary.listedQuantity} un.
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SellerOffersTable
                        listings={listings}
                        onBuy={handleBuy}
                        buyingId={addToCart.isPending ? (addToCart.variables?.listing.id ?? null) : null}
                      />
                      {buyError && <p className="mt-3 text-sm text-red-500">{buyError}</p>}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="versions">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Versões e reprints</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardVersionsTab cardId={cardId} card={card} relatedCards={relatedCards} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="market" className="space-y-4">
                  <Card>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <CardTitle className="text-lg">Histórico de mercado</CardTitle>
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
                      {(marketSummary?.minPrice != null || marketSummary?.avgPrice != null) && (
                        <dl className="mb-4 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-3 lg:grid-cols-6">
                          <div className="rounded-lg bg-muted/40 p-2">
                            <dt className="text-muted-foreground">Mín</dt>
                            <dd className="font-semibold">
                              {marketSummary.minPrice != null
                                ? formatCurrency(marketSummary.minPrice, currency)
                                : "—"}
                            </dd>
                          </div>
                          <div className="rounded-lg bg-muted/40 p-2">
                            <dt className="text-muted-foreground">Médio</dt>
                            <dd className="font-semibold">
                              {marketSummary.avgPrice != null
                                ? formatCurrency(marketSummary.avgPrice, currency)
                                : "—"}
                            </dd>
                          </div>
                          <div className="rounded-lg bg-muted/40 p-2">
                            <dt className="text-muted-foreground">Máx</dt>
                            <dd className="font-semibold">
                              {marketSummary.maxPrice != null
                                ? formatCurrency(marketSummary.maxPrice, currency)
                                : "—"}
                            </dd>
                          </div>
                          <div className="rounded-lg bg-muted/40 p-2">
                            <dt className="text-muted-foreground">Sugerido</dt>
                            <dd className="font-semibold">
                              {marketSummary.suggestedPrice != null
                                ? formatCurrency(marketSummary.suggestedPrice, currency)
                                : marketSummary.avgPrice != null
                                  ? formatCurrency(marketSummary.avgPrice, currency)
                                  : "—"}
                            </dd>
                          </div>
                          <div className="rounded-lg bg-muted/40 p-2">
                            <dt className="text-muted-foreground">Anunciadas</dt>
                            <dd className="font-semibold">{marketSummary.listedQuantity ?? "—"}</dd>
                          </div>
                          <div className="rounded-lg bg-muted/40 p-2">
                            <dt className="text-muted-foreground">Trust médio</dt>
                            <dd className="font-semibold">
                              {marketSummary.avgSellerTrust != null
                                ? Math.round(marketSummary.avgSellerTrust)
                                : "—"}
                            </dd>
                          </div>
                        </dl>
                      )}
                      <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                        <p>Volume: {marketSummary?.soldVolume ?? "—"}</p>
                        <p>Velocidade: {marketSummary?.sellVelocity ?? "—"}</p>
                        <p>Popularidade: {marketSummary?.popularity ?? "—"}</p>
                        <p>Competitividade: {marketSummary?.competitiveness ?? "—"}</p>
                      </div>
                      <PriceChart cardId={cardId} range={priceRange} condition={selectedCondition} />
                      <div className="mt-6">
                        <CardValuationPanel
                          cardId={cardId}
                          cardName={card.name}
                          game={gameSlug}
                          condition={selectedCondition ?? "NM"}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="info">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardInfoTab card={card} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="mt-10 border-t pt-8">
            <CardIntelligenceSection
              cardId={cardId}
              card={card}
              fallbackRelated={relatedCards}
            />
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 p-4 backdrop-blur lg:hidden">
          <button
            type="button"
            className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50"
            disabled={!cheapestPurchasable || addToCart.isPending}
            onClick={() => cheapestPurchasable && handleBuy(cheapestPurchasable)}
          >
            Comprar —{" "}
            {cheapestPurchasable
              ? formatCurrency(cheapestPurchasable.price, cheapestPurchasable.currency)
              : card.lowestPrice != null
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
                unoptimized={shouldBypassImageOptimizer(imageSrc)}
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
      <main className="container mx-auto px-4 py-8" aria-busy="true" aria-label="Carregando carta">
        <Skeleton className="mb-6 h-4 w-64" />
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <Skeleton className="mx-auto aspect-[63/88] max-w-md rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
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
          href="/loja/busca"
          className="mt-6 inline-block text-sm text-primary underline-offset-4 hover:underline"
        >
          Voltar à busca
        </Link>
      </main>
    </MobileLayout>
  );
}
