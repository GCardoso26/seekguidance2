"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, X } from "lucide-react";
import { entrarPath } from "@/lib/auth/entrar-path";
import { CardActions } from "@/components/cards/CardActions";
import { AddToCollectionButton } from "@/components/cards/AddToCollectionButton";
import { AnnounceCardCta } from "@/components/cards/AnnounceCardCta";
import { CardBuyPanel } from "@/components/cards/CardBuyPanel";
import { CardDetailHero } from "@/components/cards/CardDetailHero";
import { CardVariantSelector } from "@/components/cards/CardVariantSelector";
import { SellerOffersTable } from "@/components/cards/SellerOffersTable";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { CardVersionsTab } from "@/components/cards/CardVersionsTab";
import { CardInfoTab } from "@/components/cards/CardInfoTab";

const PriceChart = dynamic(
  () => import("@/components/cards/PriceChart").then((m) => m.PriceChart),
  {
    ssr: false,
    loading: () => <div className="h-48 animate-pulse rounded-lg bg-muted/40" aria-hidden />,
  },
);
const CardValuationPanel = dynamic(
  () => import("@/components/valuation/CardValuationPanel").then((m) => m.CardValuationPanel),
  { ssr: false },
);
const CardIntelligenceSection = dynamic(
  () =>
    import("@/components/cards/CardIntelligenceSection").then((m) => m.CardIntelligenceSection),
  { ssr: false },
);
const CardJudgeInsights = dynamic(
  () => import("@/components/cards/CardJudgeInsights").then((m) => m.CardJudgeInsights),
  { ssr: false },
);
const CardDecksSection = dynamic(
  () => import("@/components/cards/CardDecksSection").then((m) => m.CardDecksSection),
  {
    ssr: false,
    loading: () => <div className="h-28 animate-pulse rounded-xl bg-muted/40" aria-hidden />,
  },
);
import { CardAiAdvisorSlots } from "@/components/cards/CardAiAdvisorSlots";
import { CardRelatedProductsSection } from "@/components/cards/CardRelatedProductsSection";
import { formatRarityDisplay } from "@/lib/game-config/rarity";
import { gameCardsPath, gameLandingPath } from "@/lib/game-routes";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  { value: "all", label: "Tudo" },
];

interface CardDetailPageProps {
  cardId: string;
}

export function CardDetailPage({ cardId }: CardDetailPageProps) {
  const router = useRouter();
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
        onSuccess: () => {
          track("card_add_to_cart", { card_id: data.card.id, listing_id: listing.id });
          router.push("/carrinho");
        },
        onError: (err) => {
          const msg = err instanceof Error ? err.message : "Erro ao adicionar";
          if (msg === "login_required" || /401|não autenticado|login/i.test(msg)) {
            const slug = GAME_TOKENS[data.card.game as GameId]?.slug || String(data.card.game).toLowerCase();
            router.push(entrarPath(`/${slug}/cards/${data.card.id}`));
            return;
          }
          setBuyError(msg);
        },
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
    [...(card.types ?? []), ...(card.subtypes?.length ? ["—", ...card.subtypes] : [])].filter(Boolean).join(" ");

  return (
    <MobileLayout>
      <main className="min-h-screen bg-background pb-28 lg:pb-12">
        <div className="page-container pt-4">
          <Breadcrumbs
            items={[
              { label: "Início", href: "/" },
              { label: gameToken?.name || card.game, href: gameLandingPath(gameSlug) },
              { label: "Cartas", href: gameCardsPath(gameSlug) },
              {
                label: card.set?.name ?? "Expansão",
                href: `${gameCardsPath(gameSlug)}?set=${encodeURIComponent(card.set?.code || "")}`,
              },
              { label: card.name },
            ]}
          />
        </div>

        <div className="page-container py-6 lg:py-8">
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            {/* Coluna hero — imagem sticky */}
            <aside className="space-y-5 lg:col-span-5 lg:sticky lg:top-20 lg:self-start">
              <CardDetailHero
                card={card}
                imageError={imageError}
                onImageError={() => setImageError(true)}
                onZoom={() => setLightboxOpen(true)}
              />
              <CardVariantSelector
                card={card}
                cardId={cardId}
                selectedCondition={selectedCondition}
                onConditionChange={setSelectedCondition}
              />
              <CardJudgeInsights card={card} cardId={cardId} className="hidden lg:block" />
            </aside>

            {/* Coluna compra + conteúdo */}
            <div className="space-y-6 lg:col-span-7">
              {/* Painel de compra sticky (desktop) */}
              <div className="space-y-5 lg:sticky lg:top-20 lg:z-10 lg:rounded-2xl lg:bg-background/90 lg:pb-2 lg:backdrop-blur-sm">
                <header className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      style={{
                        backgroundColor: `${gameToken?.primary ?? "#666"}15`,
                        color: gameToken?.primary ?? undefined,
                      }}
                    >
                      {gameToken?.name || card.game}
                    </Badge>
                    {(card.finishes ?? []).slice(0, 2).map((f) => (
                      <Badge key={f} variant="outline" className="capitalize">
                        {f.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                  <h1 className="text-display text-foreground sm:text-3xl lg:text-4xl">{card.name}</h1>
                  <p className="text-small text-muted-foreground">
                    {card.set?.name}
                    {card.number ? ` · #${card.number}` : ""}
                    {card.rarity ? ` · ${formatRarityDisplay(card.game, card.rarity)}` : ""}
                    {card.language ? ` · ${card.language.toUpperCase()}` : ""}
                    {card.artist ? ` · ${card.artist}` : ""}
                  </p>
                  {typeLine && <p className="text-body text-muted-foreground">{typeLine}</p>}
                </header>

                <CardBuyPanel
                  card={card}
                  listings={listings}
                  marketSummary={marketSummary}
                  onBuy={handleBuy}
                  buying={addToCart.isPending}
                />

                <div className="flex flex-wrap gap-2">
                  <AddToCollectionButton cardId={card.id} cardName={card.name} />
                  <CardActions card={card} />
                  <AnnounceCardCta card={card} />
                </div>
              </div>

              <CardJudgeInsights card={card} cardId={cardId} className="lg:hidden" />

              {(card.oracleText || card.flavorText) && (
                <Card variant="muted" padding="md">
                  <CardHeader className="p-0 pb-3">
                    <CardTitle className="text-h3">Texto oficial</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 p-0">
                    {card.oracleText && (
                      <div className="whitespace-pre-wrap text-body leading-relaxed">{card.oracleText}</div>
                    )}
                    {card.flavorText && (
                      <p className="text-body italic text-muted-foreground">&ldquo;{card.flavorText}&rdquo;</p>
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
                        "rounded-lg px-3 py-2 text-caption font-medium capitalize",
                        status === "legal" && "bg-success/10 text-success",
                        status === "banned" && "bg-danger/10 text-danger",
                        status !== "legal" && status !== "banned" && "bg-muted text-muted-foreground",
                      )}
                    >
                      {format}: {status === "not_legal" ? "não legal" : status}
                    </div>
                  ))}
                </div>
              )}

              <Tabs defaultValue="marketplace" className="space-y-4">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 sm:grid-cols-4">
                  <TabsTrigger value="marketplace" className="text-xs sm:text-sm">
                    Ofertas
                  </TabsTrigger>
                  <TabsTrigger value="versions" className="text-xs sm:text-sm">
                    Versões
                  </TabsTrigger>
                  <TabsTrigger value="market" className="text-xs sm:text-sm">
                    Histórico
                  </TabsTrigger>
                  <TabsTrigger value="info" className="text-xs sm:text-sm">
                    Info
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="marketplace" className="space-y-4" id="offers">
                  <Card padding="md">
                    <CardHeader className="p-0 pb-4">
                      <CardTitle className="text-h3">
                        Ofertas ({listings.length})
                        {marketSummary?.storeCount != null && (
                          <span className="ml-2 text-small font-normal text-muted-foreground">
                            · {marketSummary.storeCount} lojas · {marketSummary.listedQuantity} un.
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <SellerOffersTable
                        listings={listings}
                        onBuy={handleBuy}
                        buyingId={addToCart.isPending ? (addToCart.variables?.listing.id ?? null) : null}
                      />
                      {buyError && <p className="mt-3 text-small text-danger">{buyError}</p>}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="versions">
                  <Card padding="md">
                    <CardHeader className="p-0 pb-4">
                      <CardTitle className="text-h3">Versões e reprints</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <CardVersionsTab cardId={cardId} card={card} relatedCards={relatedCards} />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="market" className="space-y-4">
                  <Card padding="md">
                    <CardHeader className="flex flex-col gap-3 p-0 pb-4 sm:flex-row sm:items-center sm:justify-between">
                      <CardTitle className="text-h3">Histórico de mercado</CardTitle>
                      <div
                        className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1"
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
                              "focus-ring rounded-md px-2.5 py-1 text-caption font-medium transition-colors",
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
                    <CardContent className="space-y-4 p-0">
                      {(marketSummary?.minPrice != null || marketSummary?.avgPrice != null) && (
                        <dl className="grid grid-cols-2 gap-2 text-center sm:grid-cols-3 lg:grid-cols-6">
                          {[
                            { label: "Mín", value: marketSummary.minPrice },
                            { label: "Médio", value: marketSummary.avgPrice },
                            { label: "Máx", value: marketSummary.maxPrice },
                            { label: "Sugerido", value: marketSummary.suggestedPrice ?? marketSummary.avgPrice },
                            { label: "Anunciadas", value: marketSummary.listedQuantity, raw: true },
                            {
                              label: "Trust médio",
                              value: marketSummary.avgSellerTrust,
                              raw: true,
                              format: (v: number) => Math.round(v).toString(),
                            },
                          ].map(({ label, value, raw, format }) => (
                            <div key={label} className="rounded-lg bg-muted/40 p-2.5">
                              <dt className="text-caption text-muted-foreground">{label}</dt>
                              <dd className="text-small font-semibold">
                                {value == null
                                  ? "—"
                                  : raw
                                    ? format
                                      ? format(value as number)
                                      : String(value)
                                    : formatCurrency(value as number, currency)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      <PriceChart cardId={cardId} range={priceRange} condition={selectedCondition} />
                      <CardValuationPanel
                        cardId={cardId}
                        cardName={card.name}
                        game={gameSlug}
                        condition={selectedCondition ?? "NM"}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="info">
                  <Card padding="md">
                    <CardHeader className="p-0 pb-4">
                      <CardTitle className="text-h3">Informações</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <CardInfoTab card={card} />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="mt-12 space-y-12 border-t border-border pt-10">
            <CardDecksSection card={card} />
            <CardIntelligenceSection cardId={cardId} card={card} fallbackRelated={relatedCards} />
            <CardRelatedProductsSection card={card} gameSlug={gameSlug} />
            <CardAiAdvisorSlots cardId={cardId} />
          </div>
        </div>

        {/* CTA mobile fixo */}
        <div className="sticky-mobile-bar fixed left-0 right-0 z-40 border-t border-border bg-card/95 p-3 shadow-card backdrop-blur-md md:bottom-0 lg:hidden">
          <Button
            type="button"
            size="lg"
            className="w-full"
            disabled={!cheapestPurchasable || addToCart.isPending}
            onClick={() => cheapestPurchasable && handleBuy(cheapestPurchasable)}
          >
            Comprar —{" "}
            {cheapestPurchasable
              ? formatCurrency(cheapestPurchasable.price, cheapestPurchasable.currency)
              : card.lowestPrice != null
                ? formatCurrency(card.lowestPrice, currency)
                : "Indisponível"}
          </Button>
        </div>

        <Dialog.Root open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/80 backdrop-blur-sm" />
            <Dialog.Content className="fixed inset-4 z-50 flex items-center justify-center outline-none">
              <Dialog.Title className="sr-only">{card.name}</Dialog.Title>
              <Image
                src={imageSrc}
                alt={card.name}
                width={744}
                height={1040}
                className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
                unoptimized={shouldBypassImageOptimizer(imageSrc)}
              />
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="focus-ring absolute right-4 top-4 rounded-full border border-border bg-card p-2 text-foreground hover:bg-muted"
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
      <main className="page-container py-8" aria-busy="true" aria-label="Carregando carta">
        <Skeleton className="mb-6 h-4 w-64" />
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-5">
            <Skeleton className="mx-auto aspect-[63/88] max-w-md rounded-2xl" />
            <Skeleton className="h-36 rounded-xl" />
          </div>
          <div className="space-y-5 lg:col-span-7">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-56 rounded-2xl" />
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
      <main className="page-container py-16 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-danger" aria-hidden />
        <h1 className="text-h2">{notFound ? "Carta não encontrada" : "Erro ao carregar carta"}</h1>
        <p className="mt-2 text-muted-foreground">
          {notFound ? "Verifique o link ou volte à busca." : "Tente novamente mais tarde."}
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/loja/busca">Voltar à busca</Link>
        </Button>
      </main>
    </MobileLayout>
  );
}
