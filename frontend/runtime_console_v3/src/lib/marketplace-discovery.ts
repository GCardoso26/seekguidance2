/**
 * Curadoria estática da vitrine de descoberta (home).
 * Arte e hrefs reais — sem inventar preço/estoque (Platform Guardian / R4).
 */
import {
  LORCANA_FEATURED_SET_CODES,
  portalHeroBannerPaths,
  setLogoPublicPath,
} from "@/lib/portal-set-logos";
import { PRODUCT_CATEGORY_META } from "@/lib/tcg-product-categories";
import { GAME_TOKENS } from "@/lib/tcg-tokens";
import { gameExpansionsPath, gameLandingPath, gameCardsPath } from "@/lib/game-routes";
import type { GameId } from "@/types/card";

export type DiscoveryRailId = "categories" | "collections" | "launches";

export type DiscoveryTile = {
  id: string;
  rail: DiscoveryRailId;
  title: string;
  subtitle: string;
  imageUrl: string;
  href: string;
  /** Optional taxonomy accent (hex) — local chip only, never full skin. */
  accent?: string;
};

const CATEGORY_TILES: DiscoveryTile[] = [
  {
    id: "cat-singles",
    rail: "categories",
    title: "Singles",
    subtitle: "Cartas avulsas por jogo",
    imageUrl: PRODUCT_CATEGORY_META.single.imageUrl,
    href: "/loja/singles",
  },
  {
    id: "cat-selados",
    rail: "categories",
    title: "Selados",
    subtitle: "Boosters, displays e kits",
    imageUrl: PRODUCT_CATEGORY_META.booster.imageUrl,
    href: "/loja/selados",
  },
  {
    id: "cat-acessorios",
    rail: "categories",
    title: "Acessórios",
    subtitle: "Sleeves, playmats, deck boxes",
    imageUrl: PRODUCT_CATEGORY_META.sleeve.imageUrl,
    href: "/loja/acessorios",
  },
];

type CollectionCurate = {
  id: string;
  gameId: GameId;
  setCode?: string;
  title: string;
  subtitle: string;
  /** Prefer set key art; fall back to hero banner index. */
  bannerIndex?: number;
  hrefKind: "landing" | "expansions" | "cards" | "busca";
};

const COLLECTION_CURATE: CollectionCurate[] = [
  {
    id: "col-lor-win",
    gameId: "LORCANA",
    setCode: "WIN",
    title: "Lorcana · WIN",
    subtitle: "Coleção em destaque",
    hrefKind: "expansions",
  },
  {
    id: "col-lor-wun",
    gameId: "LORCANA",
    setCode: "WUN",
    title: "Lorcana · WUN",
    subtitle: "Coleção em destaque",
    hrefKind: "expansions",
  },
  {
    id: "col-lor-aov",
    gameId: "LORCANA",
    setCode: "AOV",
    title: "Attack of the Vines",
    subtitle: "Disney Lorcana",
    hrefKind: "landing",
  },
  {
    id: "col-pkm",
    gameId: "POKEMON",
    title: "Pokémon TCG",
    subtitle: "Singles e selados",
    bannerIndex: 0,
    hrefKind: "cards",
  },
  {
    id: "col-mtg",
    gameId: "MTG",
    title: "Magic: The Gathering",
    subtitle: "Universo do jogo",
    bannerIndex: 0,
    hrefKind: "landing",
  },
  {
    id: "col-op",
    gameId: "ONEPIECE",
    title: "One Piece Card Game",
    subtitle: "Explorar coleção",
    bannerIndex: 0,
    hrefKind: "busca",
  },
];

const LAUNCH_CURATE: CollectionCurate[] = [
  {
    id: "launch-lor-aov",
    gameId: "LORCANA",
    setCode: "AOV",
    title: "Attack of the Vines",
    subtitle: "Explorar coleção",
    hrefKind: "expansions",
  },
  {
    id: "launch-pkm",
    gameId: "POKEMON",
    title: "Novidades Pokémon",
    subtitle: "Explorar coleção",
    bannerIndex: 1,
    hrefKind: "cards",
  },
  {
    id: "launch-lor-featured",
    gameId: "LORCANA",
    setCode: LORCANA_FEATURED_SET_CODES[0],
    title: `Lorcana · ${LORCANA_FEATURED_SET_CODES[0]}`,
    subtitle: "Explorar coleção",
    hrefKind: "landing",
  },
];

function resolveHref(item: CollectionCurate): string {
  const slug = GAME_TOKENS[item.gameId].slug;
  switch (item.hrefKind) {
    case "expansions":
      return gameExpansionsPath(slug);
    case "cards":
      return gameCardsPath(slug);
    case "busca":
      return `/loja/busca?game=${item.gameId}`;
    case "landing":
    default:
      return gameLandingPath(slug);
  }
}

function resolveImage(item: CollectionCurate): string {
  if (item.setCode) {
    const keyArt = setLogoPublicPath(item.gameId, item.setCode);
    if (keyArt) return keyArt;
  }
  const banners = portalHeroBannerPaths(item.gameId);
  const idx = item.bannerIndex ?? 0;
  if (banners[idx]) return banners[idx];
  if (banners[0]) return banners[0];
  return GAME_TOKENS[item.gameId].logo;
}

function toTile(item: CollectionCurate, rail: DiscoveryRailId): DiscoveryTile {
  const token = GAME_TOKENS[item.gameId];
  return {
    id: item.id,
    rail,
    title: item.title,
    subtitle: item.subtitle,
    imageUrl: resolveImage(item),
    href: resolveHref(item),
    accent: token.primary,
  };
}

export function getDiscoveryCategoryTiles(): DiscoveryTile[] {
  return CATEGORY_TILES;
}

export function getDiscoveryCollectionTiles(): DiscoveryTile[] {
  return COLLECTION_CURATE.map((c) => toTile(c, "collections"));
}

export function getDiscoveryLaunchTiles(): DiscoveryTile[] {
  return LAUNCH_CURATE.map((c) => toTile(c, "launches"));
}

export function getAllDiscoveryTiles(): DiscoveryTile[] {
  return [
    ...getDiscoveryCategoryTiles(),
    ...getDiscoveryCollectionTiles(),
    ...getDiscoveryLaunchTiles(),
  ];
}
