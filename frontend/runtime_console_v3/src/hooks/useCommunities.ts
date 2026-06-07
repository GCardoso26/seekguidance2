"use client";

import { useQuery } from "@tanstack/react-query";
import type { Community } from "@/types/community";

export function useCommunities() {
  return useQuery({
    queryKey: ["communities"],
    queryFn: async (): Promise<Community[]> => {
      const res = await fetch("/api/social/communities", { cache: "no-store" });
      if (!res.ok) return [];
      const rows = await res.json();
      return (rows as Array<Record<string, unknown>>).map((c) => ({
        id: String(c.id),
        name: String(c.name),
        description: c.description ? String(c.description) : undefined,
        game_code: c.game_code ? String(c.game_code) : undefined,
        member_count: Number(c.member_count ?? 0),
        avatar_url: c.avatar_url ? String(c.avatar_url) : undefined,
      }));
    },
  });
}
