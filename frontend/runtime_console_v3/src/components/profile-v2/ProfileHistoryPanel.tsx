"use client";

import { useMemo } from "react";
import { ProfileActivityFeed } from "@/components/profile-v2/ProfileActivityFeed";
import { useBuyerDashboard } from "@/hooks/useBuyerExperience";
import { useCollectionInsights } from "@/hooks/useCollectionInsights";
import { useMyDecks } from "@/hooks/useDeck";
import { defaultActivityFeedProvider } from "@/lib/profile-activity";
import { defaultAchievementsProvider } from "@/lib/profile-achievements";
import { isFeatureEnabled } from "@/lib/feature-flags";

export function ProfileHistoryPanel() {
  const buyer = useBuyerDashboard();
  const decks = useMyDecks();
  const collection = useCollectionInsights();

  const achievements = useMemo(
    () =>
      defaultAchievementsProvider.resolveForPlayer({
        collectionUnique: buyer.data?.collection.unique_cards,
        deckCount: decks.data?.length,
        publicDeckCount: decks.data?.filter((d) => d.is_public).length,
        orderCount: buyer.data?.orders.total,
        savingsCents: buyer.data?.savings_cents,
      }),
    [buyer.data, decks.data],
  );

  const items = useMemo(
    () =>
      defaultActivityFeedProvider.buildFromProjections({
        recentOrders: buyer.data?.orders.recent,
        recentDecks: (decks.data ?? []).map((d) => ({
          id: d.id,
          name: d.name,
          updatedAt: d.updated_at ?? undefined,
          isPublic: d.is_public,
        })),
        collectionUpdatedAt: collection.data?.updatedAt ?? null,
        valueChangeHint:
          collection.data?.valueChange7d != null && collection.data.valueChange7d !== 0
            ? collection.data.valueChange7d > 0
              ? "Valor da coleção aumentou"
              : "Valor da coleção caiu"
            : null,
        achievementsUnlocked: achievements
          .filter((a) => a.unlocked)
          .map((a) => ({ id: a.id, title: a.title })),
      }),
    [buyer.data, decks.data, collection.data, achievements],
  );

  return (
    <div className="space-y-6" data-testid="profile-history-panel">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Histórico</h1>
        <p className="text-small text-muted-foreground">
          Activity Feed a partir de projeções públicas (Domain Events via BCs existentes).
        </p>
      </header>
      <ProfileActivityFeed
        items={items}
        loading={buyer.isLoading || decks.isLoading}
        enabled={isFeatureEnabled("PLAYER_ACTIVITY")}
      />
    </div>
  );
}
