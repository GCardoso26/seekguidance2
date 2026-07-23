"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Heart,
  Layers,
  Package,
  ShoppingBag,
  Store,
  Trophy,
  Wallet,
} from "lucide-react";
import { ProfileHero } from "@/components/profile-v2/ProfileHero";
import { ProfileSummaryCard } from "@/components/profile-v2/ProfileSummaryCard";
import { ProfileActivityFeed } from "@/components/profile-v2/ProfileActivityFeed";
import { ProfileAiSlots } from "@/components/profile-v2/ProfileAiSlots";
import { CreatePlayerProfileForm } from "@/components/player/CreatePlayerProfileForm";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { usePlayerProfile, ProfileNotFoundError } from "@/hooks/usePlayerProfile";
import { useGamificationProfile } from "@/hooks/useGamification";
import { useCollectionInsights } from "@/hooks/useCollectionInsights";
import { useMyDecks } from "@/hooks/useDeck";
import { useBuyerDashboard } from "@/hooks/useBuyerExperience";
import { useWishlist } from "@/hooks/useWishlist";
import { defaultAchievementsProvider } from "@/lib/profile-achievements";
import { defaultActivityFeedProvider } from "@/lib/profile-activity";
import { defaultBadgesProvider } from "@/lib/profile-badges";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { formatCurrency } from "@/lib/format-currency";
import { CollectionValueChart } from "@/components/collection-v2/CollectionValueChart";
import { ProfileRecommendationPanel } from "@/components/recommendations/RecommendationPanels";
import { ContextualAssistantStrip } from "@/components/ai-assistants/ContextualAssistantStrip";
import { stubPlayerValueAssistant } from "@/lib/ai-assistants/interfaces";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileDashboard() {
  const { user } = useJudgeAuth();
  const profileQ = usePlayerProfile("me");
  const gameQ = useGamificationProfile();
  const collectionQ = useCollectionInsights();
  const decksQ = useMyDecks();
  const buyerQ = useBuyerDashboard();
  const wishlistQ = useWishlist();

  const achievements = useMemo(
    () =>
      defaultAchievementsProvider.resolveForPlayer({
        collectionUnique: buyerQ.data?.collection.unique_cards,
        deckCount: decksQ.data?.length,
        publicDeckCount: decksQ.data?.filter((d) => d.is_public).length,
        orderCount: buyerQ.data?.orders.total,
        saleCount: 0,
        listingCount: 0,
        savingsCents: buyerQ.data?.savings_cents,
      }),
    [buyerQ.data, decksQ.data],
  );

  const badges = useMemo(
    () =>
      defaultBadgesProvider.resolveForPlayer({
        hasCollection: (buyerQ.data?.collection.unique_cards ?? 0) > 0,
        hasPublicDecks: (decksQ.data ?? []).some((d) => d.is_public),
        isSeller: false,
        isJudge: false,
      }),
    [buyerQ.data, decksQ.data],
  );

  const activity = useMemo(
    () =>
      defaultActivityFeedProvider.buildFromProjections({
        recentOrders: buyerQ.data?.orders.recent?.slice(0, 5),
        recentDecks: (decksQ.data ?? []).slice(0, 5).map((d) => ({
          id: d.id,
          name: d.name,
          updatedAt: d.updated_at ?? undefined,
          isPublic: Boolean(d.is_public),
        })),
        collectionUpdatedAt: collectionQ.data?.updatedAt ?? null,
        valueChangeHint:
          collectionQ.data?.valueChange7d != null && collectionQ.data.valueChange7d !== 0
            ? collectionQ.data.valueChange7d > 0
              ? "Valor da coleção aumentou"
              : "Valor da coleção caiu"
            : null,
        achievementsUnlocked: achievements.filter((a) => a.unlocked).slice(0, 3).map((a) => ({
          id: a.id,
          title: a.title,
        })),
      }),
    [buyerQ.data, decksQ.data, collectionQ.data, achievements],
  );

  if (!user) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <h1 className="text-xl font-semibold">Meu Perfil</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Entre para ver sua jornada como jogador no JudgeTCG.
        </p>
        <Link href="/entrar?next=/perfil" className="mt-4 inline-block text-primary hover:underline">
          Entrar
        </Link>
      </div>
    );
  }

  if (profileQ.isLoading) {
    return (
      <div className="space-y-6" data-testid="profile-dashboard-skeleton">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (profileQ.isError && profileQ.error instanceof ProfileNotFoundError) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-8">
        <h1 className="text-xl font-semibold">Crie seu perfil de jogador</h1>
        <p className="text-sm text-muted-foreground">
          Seu perfil é a identidade Steam-like no JudgeTCG — não um painel administrativo.
        </p>
        <CreatePlayerProfileForm />
      </div>
    );
  }

  if (profileQ.isError || !profileQ.data) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <p className="text-sm text-muted-foreground">Não foi possível carregar o perfil.</p>
      </div>
    );
  }

  const currency = collectionQ.data?.currency || "BRL";
  const wishlistCount = wishlistQ.data?.items?.length ?? buyerQ.data?.wishlist.total ?? 0;

  return (
    <div className="space-y-10" data-testid="profile-dashboard">
      <ProfileHero
        profile={profileQ.data}
        gamification={gameQ.data}
        badges={isFeatureEnabled("PLAYER_BADGES") ? badges : []}
        achievements={isFeatureEnabled("PLAYER_ACHIEVEMENTS") ? achievements : []}
        collectionValue={collectionQ.data?.totalValue ?? null}
        currency={currency}
        memberSince={null}
        isOwner
      />

      <section className="space-y-3" aria-label="Resumo da jornada">
        <header>
          <h2 className="text-h3 font-semibold">Resumo</h2>
          <p className="text-small text-muted-foreground">
            Conecta Collection, Decks, Wishlist, Checkout e Marketplace via APIs públicas.
          </p>
        </header>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ProfileSummaryCard
            label="Valor da coleção"
            value={
              collectionQ.data?.totalValue != null
                ? formatCurrency(collectionQ.data.totalValue, currency)
                : "—"
            }
            hint={
              collectionQ.data?.updatedAt
                ? `Atualizado ${new Date(collectionQ.data.updatedAt).toLocaleString("pt-BR")}`
                : undefined
            }
            href="/colecao"
            icon={Wallet}
          />
          <ProfileSummaryCard
            label="Cartas"
            value={String(
              collectionQ.data?.uniqueCards ??
                buyerQ.data?.collection.unique_cards ??
                "—",
            )}
            href="/colecao/cartas"
            icon={Layers}
          />
          <ProfileSummaryCard
            label="Decks"
            value={String(decksQ.data?.length ?? "—")}
            href="/perfil/decks"
            icon={Package}
          />
          <ProfileSummaryCard
            label="Wishlist"
            value={String(wishlistCount)}
            href="/perfil/wishlist"
            icon={Heart}
          />
          <ProfileSummaryCard
            label="Pedidos"
            value={String(buyerQ.data?.orders.total ?? "—")}
            href="/perfil/compras"
            icon={ShoppingBag}
          />
          <ProfileSummaryCard
            label="Em andamento"
            value={String(buyerQ.data?.orders.in_progress?.length ?? 0)}
            href="/perfil/compras"
            icon={Package}
          />
          <ProfileSummaryCard
            label="Economia"
            value={
              buyerQ.data
                ? formatCurrency((buyerQ.data.savings_cents ?? 0) / 100, "BRL")
                : "—"
            }
            href="/perfil/compras"
            icon={Store}
          />
          <ProfileSummaryCard
            label="Conquistas"
            value={`${achievements.filter((a) => a.unlocked).length}/${achievements.length}`}
            href="/perfil/conquistas"
            icon={Trophy}
          />
        </div>
      </section>

      {collectionQ.data &&
      (collectionQ.data.series7d.length > 0 ||
        collectionQ.data.series30d.length > 0 ||
        collectionQ.data.insufficientHistory) ? (
        <section className="space-y-3">
          <h2 className="text-h3 font-semibold">Evolução da coleção</h2>
          <CollectionValueChart
            series7d={collectionQ.data.series7d}
            series30d={collectionQ.data.series30d}
            series90d={collectionQ.data.series90d}
            series1y={collectionQ.data.series1y}
            currency={currency}
            insufficientHistory={collectionQ.data.insufficientHistory}
          />
        </section>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-3">
          <header className="flex items-baseline justify-between gap-2">
            <h2 className="text-h3 font-semibold">Histórico da jornada</h2>
            <Link href="/perfil/historico" className="text-small text-primary hover:underline">
              Ver tudo
            </Link>
          </header>
          <ProfileActivityFeed
            items={activity.slice(0, 8)}
            loading={buyerQ.isLoading || decksQ.isLoading}
            enabled={isFeatureEnabled("PLAYER_ACTIVITY")}
          />
        </section>
        <ContextualAssistantStrip
          surface="player"
          load={() => stubPlayerValueAssistant.collectionDelta({})}
        />
        <ProfileRecommendationPanel />
        <ProfileAiSlots />
      </div>
    </div>
  );
}
