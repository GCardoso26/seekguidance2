import type { Metadata } from "next";
import GameHubPage from "@/components/games/GameHubPage";
import { gameIdFromSlug, GAME_TOKENS } from "@/lib/tcg-tokens";
import { getGameTheme } from "@/lib/experience/game-theme";
import { withCanonical } from "@/lib/page-metadata";
import { brand } from "@/lib/brand";
import type { GameId } from "@/types/card";

type Props = { params: Promise<{ gameSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { gameSlug } = await params;
  const gameId = gameIdFromSlug(gameSlug);
  const name = gameId ? GAME_TOKENS[gameId as GameId].name : gameSlug;
  const theme = gameId ? getGameTheme(gameId as GameId) : null;
  const description =
    theme?.hero.description ??
    `Singles, expansões, decks e marketplace de ${name}. Explore o universo no JudgeTCG.`;

  return withCanonical(`/${gameSlug}`, {
    title: `${name} — Portal TCG`,
    description,
    openGraph: {
      title: `${name} | JudgeTCG`,
      description,
      images: theme
        ? [{ url: `${brand.url.replace(/\/$/, "")}${theme.logo}`, alt: name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | JudgeTCG`,
      description,
    },
  });
}

function PortalJsonLd({ gameSlug, name }: { gameSlug: string; name: string }) {
  const url = `${brand.url.replace(/\/$/, "")}/${gameSlug}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${name} — Portal`,
    url,
    isPartOf: { "@type": "WebSite", name: brand.name, url: brand.url },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: brand.url },
        { "@type": "ListItem", position: 2, name, item: url },
      ],
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function GameSlugPage({ params }: Props) {
  const { gameSlug } = await params;
  const gameId = gameIdFromSlug(gameSlug);
  const name = gameId ? GAME_TOKENS[gameId as GameId].name : gameSlug;
  return (
    <>
      <PortalJsonLd gameSlug={gameSlug} name={name} />
      <GameHubPage />
    </>
  );
}
