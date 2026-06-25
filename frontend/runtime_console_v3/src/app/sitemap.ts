import type { MetadataRoute } from "next";
import { GAME_TOKENS, ALL_GAME_IDS } from "@/lib/tcg-tokens";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://judgetcg.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/loja",
    "/loja/mtg",
    "/loja/busca",
    "/decks",
    "/entrar",
    "/perfil",
    "/regras",
    "/comunidade",
    "/comunidade/leaderboard",
    "/pricing",
    "/social/communities",
    "/tournament/create",
    "/onboarding",
    "/vendedor/painel",
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/loja" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/loja" ? 0.9 : 0.7,
  }));

  const gameEntries = ALL_GAME_IDS.map((id) => {
    const slug = GAME_TOKENS[id].slug;
    return {
      url: `${baseUrl}/loja/${slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    };
  });

  return [...staticEntries, ...gameEntries];
}
