"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useBuyerDashboard } from "@/hooks/useBuyerExperience";
import { useMyDecks } from "@/hooks/useDeck";
import { useGamificationBadges } from "@/hooks/useGamification";
import { defaultAchievementsProvider } from "@/lib/profile-achievements";
import { defaultBadgesProvider } from "@/lib/profile-badges";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileAchievementsPanel() {
  const buyer = useBuyerDashboard();
  const decks = useMyDecks();
  const gamificationBadges = useGamificationBadges();

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

  const badges = useMemo(
    () =>
      defaultBadgesProvider.resolveForPlayer({
        hasCollection: (buyer.data?.collection.unique_cards ?? 0) > 0,
        hasPublicDecks: (decks.data ?? []).some((d) => d.is_public),
      }),
    [buyer.data, decks.data],
  );

  if (buyer.isLoading || decks.isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  if (!isFeatureEnabled("PLAYER_ACHIEVEMENTS") && !isFeatureEnabled("PLAYER_BADGES")) {
    return (
      <p className="text-small text-muted-foreground">
        Conquistas e badges desativados pelas feature flags.
      </p>
    );
  }

  return (
    <div className="space-y-8" data-testid="profile-achievements-panel">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Conquistas</h1>
        <p className="text-small text-muted-foreground">
          Estrutura de achievements (sem regras complexas). Gamificação existente permanece em{" "}
          <Link href="/profile/gamification" className="text-primary hover:underline">
            /profile/gamification
          </Link>
          .
        </p>
      </header>

      {isFeatureEnabled("PLAYER_ACHIEVEMENTS") ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Conquistas</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {achievements.map((a) => (
              <li
                key={a.id}
                className={cn(
                  "rounded-xl border p-4",
                  a.unlocked
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/70 bg-muted/20 opacity-70",
                )}
              >
                <p className="text-sm font-medium">{a.title}</p>
                <p className="mt-1 text-caption text-muted-foreground">{a.description}</p>
                <p className="mt-2 text-caption">
                  {a.unlocked ? "Desbloqueada" : "Bloqueada"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {isFeatureEnabled("PLAYER_BADGES") ? (
        <section className="space-y-3">
          <h2 className="text-sm font-medium">Badges</h2>
          <ul className="flex flex-wrap gap-2">
            {badges.map((b) => (
              <li
                key={b.id}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-small",
                  b.earned
                    ? "border-teal-600/40 bg-teal-500/10 text-foreground"
                    : "border-border text-muted-foreground",
                )}
                title={b.description}
              >
                {b.title}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {gamificationBadges.data?.badges?.length ? (
        <section className="space-y-2">
          <h2 className="text-sm font-medium">Badges de gamificação</h2>
          <p className="text-caption text-muted-foreground">
            {
              gamificationBadges.data.badges.filter((b) => b.unlocked).length
            }{" "}
            desbloqueados via API pública de gamificação.
          </p>
        </section>
      ) : null}
    </div>
  );
}
