"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ProfileHero } from "@/components/profile-v2/ProfileHero";
import { ProfileActivityFeed } from "@/components/profile-v2/ProfileActivityFeed";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { usePublicDecks } from "@/hooks/useDeck";
import { defaultAchievementsProvider } from "@/lib/profile-achievements";
import { defaultBadgesProvider } from "@/lib/profile-badges";
import { defaultActivityFeedProvider } from "@/lib/profile-activity";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { publicProfilePath, slugifyDeckName } from "@/lib/profile-v2";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  username: string;
  section?: "home" | "collection" | "decks" | "wishlist";
};

export function PublicProfileView({ username, section = "home" }: Props) {
  const enabled = isFeatureEnabled("PLAYER_PUBLIC_PROFILE");
  const profileQ = usePlayerProfile(username);
  const decksQ = usePublicDecks();

  const ownerDecks = useMemo(() => {
    const all = decksQ.data ?? [];
    const handle = profileQ.data?.handle?.toLowerCase();
    const ownerId = profileQ.data?.id;
    return all.filter((d) => {
      const u = d.owner?.username?.toLowerCase();
      if (handle && u === handle) return true;
      if (ownerId && d.owner_id === ownerId) return true;
      return false;
    });
  }, [decksQ.data, profileQ.data]);

  const badges = useMemo(
    () =>
      defaultBadgesProvider.resolveForPlayer({
        hasPublicDecks: ownerDecks.length > 0,
        hasCollection: false,
      }),
    [ownerDecks],
  );

  const achievements = useMemo(
    () =>
      defaultAchievementsProvider.resolveForPlayer({
        deckCount: ownerDecks.length,
        publicDeckCount: ownerDecks.length,
      }),
    [ownerDecks],
  );

  const activity = useMemo(
    () =>
      defaultActivityFeedProvider.buildFromProjections({
        recentDecks: ownerDecks.slice(0, 5).map((d) => ({
          id: d.id,
          name: d.name,
          updatedAt: d.updated_at ?? undefined,
          isPublic: true,
        })),
        achievementsUnlocked: achievements
          .filter((a) => a.unlocked)
          .slice(0, 2)
          .map((a) => ({ id: a.id, title: a.title })),
      }),
    [ownerDecks, achievements],
  );

  if (!enabled) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <p className="text-sm text-muted-foreground">Perfil público desativado.</p>
      </div>
    );
  }

  if (profileQ.isLoading) {
    return <Skeleton className="h-56 w-full rounded-2xl" />;
  }

  if (profileQ.isError || !profileQ.data) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center">
        <p className="text-sm text-muted-foreground">Jogador não encontrado.</p>
        <Link href="/" className="mt-3 inline-block text-primary hover:underline">
          Voltar ao início
        </Link>
      </div>
    );
  }

  const profile = profileQ.data;

  return (
    <div className="space-y-8" data-testid="public-profile">
      <ProfileHero
        profile={profile}
        badges={isFeatureEnabled("PLAYER_BADGES") ? badges : []}
        achievements={isFeatureEnabled("PLAYER_ACHIEVEMENTS") ? achievements : []}
        isOwner={false}
      />

      <nav
        className="flex gap-1 overflow-x-auto border-b border-border pb-px"
        aria-label="Seções do perfil público"
      >
        {[
          { href: publicProfilePath(username), label: "Visão geral", id: "home" },
          { href: publicProfilePath(username, "collection"), label: "Coleção", id: "collection" },
          { href: publicProfilePath(username, "decks"), label: "Decks", id: "decks" },
          { href: publicProfilePath(username, "wishlist"), label: "Wishlist", id: "wishlist" },
        ].map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={
              section === item.id
                ? "shrink-0 border-b-2 border-primary px-3 py-2 text-sm font-medium"
                : "shrink-0 px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {section === "home" || section === "decks" ? (
        <section className="space-y-3">
          <h2 className="text-h3 font-semibold">Decks públicos</h2>
          {decksQ.isLoading ? (
            <Skeleton className="h-24 rounded-xl" />
          ) : ownerDecks.length === 0 ? (
            <p className="text-small text-muted-foreground">Nenhum deck público.</p>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {ownerDecks.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                  <Link
                    href={publicProfilePath(username, `decks/${slugifyDeckName(d.name)}`)}
                    className="font-medium hover:text-primary hover:underline"
                  >
                    {d.name}
                  </Link>
                  <Link href={`/decks/${d.id}`} className="text-small text-muted-foreground hover:underline">
                    Abrir workspace
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {section === "collection" ? (
        <section className="rounded-xl border border-dashed border-border p-8 text-center">
          <h2 className="text-h3 font-semibold">Coleção pública</h2>
          <p className="mt-2 text-small text-muted-foreground">
            Exibida apenas quando o jogador permitir (privacidade). Nesta versão, a coleção
            completa permanece privada em /colecao.
          </p>
        </section>
      ) : null}

      {section === "wishlist" ? (
        <section className="rounded-xl border border-dashed border-border p-8 text-center">
          <h2 className="text-h3 font-semibold">Wishlist pública</h2>
          <p className="mt-2 text-small text-muted-foreground">
            Opcional — aguarda preferência de privacidade do jogador (Social Layer).
          </p>
        </section>
      ) : null}

      {section === "home" ? (
        <div className="grid gap-8 lg:grid-cols-2">
          <section className="space-y-3">
            <h2 className="text-h3 font-semibold">Conquistas</h2>
            <ul className="flex flex-wrap gap-2">
              {achievements
                .filter((a) => a.unlocked)
                .map((a) => (
                  <li
                    key={a.id}
                    className="rounded-md border border-border px-2.5 py-1 text-small"
                    title={a.description}
                  >
                    {a.title}
                  </li>
                ))}
              {achievements.every((a) => !a.unlocked) ? (
                <li className="text-small text-muted-foreground">Sem conquistas públicas ainda.</li>
              ) : null}
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-h3 font-semibold">Atividade</h2>
            <ProfileActivityFeed
              items={activity}
              enabled={isFeatureEnabled("PLAYER_ACTIVITY")}
            />
          </section>
        </div>
      ) : null}
    </div>
  );
}
