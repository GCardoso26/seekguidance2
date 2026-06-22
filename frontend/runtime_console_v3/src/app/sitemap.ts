import type { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://judgetcg.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/loja/busca",
    "/decks",
    "/regras",
    "/comunidade/leaderboard",
    "/judge",
    "/pricing",
    "/social/communities",
    "/tournament/create",
    "/onboarding",
  ];

  return staticRoutes.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/judge" ? "daily" : "weekly",
    priority: path === "" ? 1 : path === "/judge" ? 0.9 : 0.7,
  }));
}
