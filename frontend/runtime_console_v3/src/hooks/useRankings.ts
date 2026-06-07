"use client";

import { useQuery } from "@tanstack/react-query";

export function useLeaderboard(game: string, format: string, page = 1) {
  return useQuery({
    queryKey: ["leaderboard", game, format, page],
    queryFn: async () => {
      const res = await fetch(
        `/api/leaderboards/${encodeURIComponent(game)}/${encodeURIComponent(format)}?page=${page}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("Leaderboard indisponível");
      return res.json();
    },
    enabled: Boolean(game && format),
  });
}
