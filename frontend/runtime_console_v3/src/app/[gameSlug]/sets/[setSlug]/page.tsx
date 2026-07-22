import type { Metadata } from "next";
import { ExpansionLandingClient } from "@/components/games/ExpansionLandingClient";
import { GAME_TOKENS, gameIdFromSlug } from "@/lib/tcg-tokens";
import { withCanonical } from "@/lib/page-metadata";
import { gameSetPath } from "@/lib/game-routes";
import { brand } from "@/lib/brand";
import type { GameId } from "@/types/card";

type Props = {
  params: Promise<{ gameSlug: string; setSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { gameSlug, setSlug } = await params;
  const gameId = gameIdFromSlug(gameSlug);
  const gameName = gameId ? GAME_TOKENS[gameId as GameId].name : gameSlug;
  const setTitle = setSlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const path = gameSetPath(gameSlug, setSlug);
  const title = `${setTitle} — ${gameName}`;
  const description = `Expansão ${setTitle} de ${gameName}: cartas, preços, produtos selados, coleção e marketplace no JudgeTCG.`;

  return withCanonical(path, {
    title,
    description,
    openGraph: {
      title: `${title} | JudgeTCG`,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  });
}

function ExpansionJsonLd({
  gameName,
  setTitle,
  path,
}: {
  gameName: string;
  setTitle: string;
  path: string;
}) {
  const url = `${brand.url.replace(/\/$/, "")}${path}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${setTitle} — ${gameName}`,
    url,
    isPartOf: {
      "@type": "WebSite",
      name: brand.name,
      url: brand.url,
    },
    about: {
      "@type": "Thing",
      name: setTitle,
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: brand.url },
        {
          "@type": "ListItem",
          position: 2,
          name: gameName,
          item: `${brand.url.replace(/\/$/, "")}/${path.split("/")[1]}`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Expansões",
          item: `${brand.url.replace(/\/$/, "")}/${path.split("/")[1]}/expansions`,
        },
        { "@type": "ListItem", position: 4, name: setTitle, item: url },
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

export default async function GameSetLandingPage({ params }: Props) {
  const { gameSlug, setSlug } = await params;
  const gameId = gameIdFromSlug(gameSlug);
  const gameName = gameId ? GAME_TOKENS[gameId as GameId].name : gameSlug;
  const setTitle = setSlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const path = gameSetPath(gameSlug, setSlug);

  return (
    <>
      <ExpansionJsonLd gameName={gameName} setTitle={setTitle} path={path} />
      <ExpansionLandingClient setSlug={setSlug} />
    </>
  );
}
