"use client";

import { useQuery } from "@tanstack/react-query";
import type { TCGId } from "@/lib/game-log/schema";
import { RulingSearch } from "@/lib/rulings/RulingSearch";
import type { InfractionReport } from "@/lib/infractions/schema";
import type { Ruling } from "@/lib/rulings/schema";

const search = new RulingSearch();

export function useSuggestedRulings(report: InfractionReport | undefined) {
  return useQuery({
    queryKey: ["suggested-rulings", report?.id, report?.type],
    enabled: Boolean(report),
    queryFn: async (): Promise<Ruling[]> => {
      const tcg = (report?.match_tcg ?? "lorcana") as TCGId;
      const local = search.search(report!.description, { tcg, limit: 5 });
      try {
        const params = new URLSearchParams({
          tcg,
          type: report!.type,
        });
        const res = await fetch(`/api/bff/runtime/judge/rulings/suggest?${params}`);
        if (res.ok) {
          const remote = (await res.json()) as Ruling[];
          const merged = new Map<string, Ruling>();
          for (const r of [...local, ...remote]) merged.set(r.id, r);
          return [...merged.values()];
        }
      } catch {
        /* fallback local */
      }
      return local;
    },
  });
}
