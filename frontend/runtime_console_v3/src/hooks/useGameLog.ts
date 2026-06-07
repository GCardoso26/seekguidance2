"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { GameLogParser } from "@/lib/game-log/GameLogParser";
import type { GameLogEntry } from "@/lib/game-log/schema";

export function useGameLog(matchId: string | undefined) {
  const query = useQuery({
    queryKey: ["game-log", matchId],
    enabled: Boolean(matchId),
    queryFn: async () => {
      const res = await fetch(`/api/judge/game-log?match_id=${encodeURIComponent(matchId!)}`);
      if (!res.ok) throw new Error("Falha ao carregar game log");
      const data = (await res.json()) as { entries: GameLogEntry[] };
      return data.entries;
    },
  });

  const parser = useMemo(() => {
    const p = new GameLogParser();
    if (query.data) p.load(query.data);
    return p;
  }, [query.data]);

  return { ...query, parser, entries: query.data ?? [] };
}
